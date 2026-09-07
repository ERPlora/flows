import { describe, it, expect } from 'vitest';
import {
  MODULE_TEMPLATE_PREFIX,
  moduleTemplateId,
  moduleTemplates,
} from './module-templates';
import {
  carriedPins,
  mergeTemplates,
  TEMPLATES,
  templateGrants,
  templateName,
  templateSummary,
} from './templates';
import type { FlowTemplate } from './templates';
import { grantAllowsCall, grantPin } from './flow-doc';
import { schemaFacts } from './ai-draft';
import en from '../../locales/en.json';

const t = (key: string, params?: Record<string, unknown>): string => {
  let cur: unknown = en;
  for (const part of key.split('.')) {
    cur = cur && typeof cur === 'object' ? (cur as Record<string, unknown>)[part] : undefined;
  }
  const found = typeof cur === 'string' ? cur : key;
  return params ? found.replace(/\{(\w+)\}/g, (_, n: string) => String(params[n] ?? '')) : found;
};

/** One row exactly as `GET /api/hub/flows/templates` serves it (hub#1611). */
const row = (over: Record<string, unknown> = {}) => ({
  module: 'whatsapp_inbox',
  family: 'appointment-from-whatsapp',
  documents: {
    en: {
      schema_version: 1,
      name: 'WhatsApp → appointment proposal',
      triggers: [{ kind: 'event', event: 'hub.whatsapp.message_received' }],
      steps: [{ id: 'book', kind: 'command', command: 'appointments.appointments.create', params: {} }],
    },
    es: {
      schema_version: 1,
      name: 'WhatsApp → propuesta de cita',
      triggers: [{ kind: 'event', event: 'hub.whatsapp.message_received' }],
      steps: [{ id: 'book', kind: 'command', command: 'appointments.appointments.create', params: {} }],
    },
  },
  grants: [
    { kind: 'command', value: 'appointments.appointments.create' },
    { kind: 'query', value: 'whatsapp_inbox.conversations.list' },
  ],
  requires: { whatsapp_inbox: '2.1.0' },
  ...over,
});

describe('the automations a module brings, as the hub serves them (flows#98)', () => {
  it('turns one served row into a card the gallery can paint', () => {
    const [card] = moduleTemplates([row()], 'es');
    expect(card.id).toBe(moduleTemplateId('whatsapp_inbox', 'appointment-from-whatsapp'));
    expect(card.id.startsWith(MODULE_TEMPLATE_PREFIX)).toBe(true);
    expect(card.source).toEqual({ module: 'whatsapp_inbox', family: 'appointment-from-whatsapp' });
    // The name is the document's, already written in the owner's language by the module.
    expect(templateName(card, t)).toBe('WhatsApp → propuesta de cita');
    // Where it came from is `source`, read by the gallery to file it under its app's heading —
    // NOT a sentence repeated on the card itself (see the test below).
    expect(templateSummary(card, t)).toBe('');
  });

  /**
   * 🔴 **The card does NOT repeat where it came from** (measured on the real bundle, flows#98).
   *
   * A served card is only ever painted under the heading of the app that brought it, and that
   * heading already reads «Comes with WhatsApp Inbox». Printing the same sentence again under
   * every card's title showed the owner the same six words five times down one column and said
   * nothing new — the provenance is read once, above, and in full in the panel
   * ({@link templatePlain}). The line under the title is for what a recipe IS, and a module that
   * ships no description of its own has nothing to put there.
   */
  it('leaves the one-line summary empty: the app’s heading already says where it came from', () => {
    const [card] = moduleTemplates([row()], 'en');
    expect(templateSummary(card, t)).toBe('');
  });

  /**
   * English is the source language (ADR-0055/0199) and the hub always serves it, so it is the
   * fallback — never a card with an empty title, and never the key printed on screen.
   */
  it('falls back to English for a language the module does not translate to', () => {
    const [card] = moduleTemplates([row()], 'de');
    expect(templateName(card, t)).toBe('WhatsApp → appointment proposal');
    expect(card.build(t).name).toBe('WhatsApp → appointment proposal');
    // `es-ES` is Spanish: a region a module does not ship is not a language it does not ship.
    expect(templateName(moduleTemplates([row()], 'es-ES')[0], t)).toBe('WhatsApp → propuesta de cita');
  });

  it('hands over the document the module published, ready to save', () => {
    const [card] = moduleTemplates([row()], 'en');
    const doc = card.build(t);
    expect(doc.schema_version).toBe(1);
    expect(doc.triggers[0]?.event).toBe('hub.whatsapp.message_received');
    expect(doc.steps[0]?.command).toBe('appointments.appointments.create');
  });

  /**
   * The editor edits what it is handed. A document shared with the row it came from would be
   * rewritten under the gallery by whoever opens it, and the second install would carry the edits.
   */
  it('hands over a copy, never the row it was served in', () => {
    const served = row();
    const [card] = moduleTemplates([served], 'en');
    const doc = card.build(t);
    doc.steps[0].command = 'something.else';
    expect(card.build(t).steps[0]?.command).toBe('appointments.appointments.create');
    expect(
      ((served.documents as Record<string, { steps: { command: string }[] }>).en.steps[0]).command,
    ).toBe('appointments.appointments.create');
  });

  /**
   * 🔴 The grants are **what the recipe will ASK for**, never what it holds: they are shown to the
   * owner so they can allow them. A template is born paused and with nothing granted.
   */
  it('carries the permissions the module declared it will ask for', () => {
    const [card] = moduleTemplates([row()], 'en');
    expect(templateGrants(card, t)).toEqual([
      { kind: 'command', value: 'appointments.appointments.create' },
      { kind: 'query', value: 'whatsapp_inbox.conversations.list' },
    ]);
  });

  it('drops a grant row it cannot read, and only that row', () => {
    const [card] = moduleTemplates(
      [row({ grants: [null, { kind: 'command' }, { kind: 'command', value: 'sales.sales.create' }] })],
      'en',
    );
    expect(templateGrants(card, t)).toEqual([{ kind: 'command', value: 'sales.sales.create' }]);
  });

  /**
   * The hub filters by the module floors of `<family>.requires.json`, so the gallery does not do
   * that again. What it DOES check is its own kernel floor: a document carrying a step key this
   * core's parser does not know is refused whole (`flow.invalid_definition`), so offering it would
   * hand the owner an automation that cannot be saved.
   */
  it('declares the kernel keys its document carries, so an older core is not offered it', () => {
    const withInteractive = row({
      documents: {
        en: {
          schema_version: 1,
          name: 'x',
          triggers: [{ kind: 'event', event: 'e' }],
          steps: [{ id: 's', kind: 'notify', channel: 'whatsapp', interactive: { rows: [] } }],
        },
      },
    });
    const withOutput = row({
      documents: {
        en: {
          schema_version: 1,
          name: 'x',
          triggers: [{ kind: 'event', event: 'e' }],
          steps: [{ id: 's', kind: 'ai', output: { slots: 'x' } }],
        },
      },
    });
    expect(moduleTemplates([withInteractive], 'en')[0].needs).toEqual(['interactive']);
    expect(moduleTemplates([withOutput], 'en')[0].needs).toEqual(['output']);
    expect(moduleTemplates([row()], 'en')[0].needs ?? []).toEqual([]);
  });

  it('leaves out a row it cannot make a card of, and keeps the rest', () => {
    const cards = moduleTemplates(
      [
        null,
        'nonsense',
        row({ module: '' }),
        row({ family: '' }),
        row({ documents: {} }),
        row({ documents: { en: { schema_version: 1, name: 'no steps', triggers: [], steps: [] } } }),
        row({ family: 'reservation-from-whatsapp' }),
      ],
      'en',
    );
    expect(cards.map((c) => c.source?.family)).toEqual(['reservation-from-whatsapp']);
  });

  it('answers nothing at all when the hub answers something that is not a list', () => {
    expect(moduleTemplates(undefined, 'en')).toEqual([]);
    expect(moduleTemplates({ data: [] }, 'en')).toEqual([]);
  });

  it('never repeats an id, so two cards cannot key to the same box', () => {
    const cards = moduleTemplates([row(), row(), row({ family: 'reservation-from-whatsapp' })], 'en');
    expect(cards).toHaveLength(2);
  });
});

/**
 * **The hand copy steps aside for the recipe it copies** (flows#52 → flows#98).
 *
 * `ui/lib/templates.ts` carries a verbatim mirror of the WhatsApp recipe, because until hub#1645
 * there was no way for a module's own recipe to reach any hub. On a hub that serves them there
 * would now be TWO cards for one automation — so the mirror gives way to the original, and the
 * shortcut that named it (`?template=whatsapp-appointment`, pushed by `whatsapp_inbox`) has to
 * keep working: it is an address published by another module, not an internal id.
 */
describe('the gallery catalogue, once the hub brings the modules’ own recipes', () => {
  const mirrored = TEMPLATES.filter((tpl) => tpl.mirrors);

  it('has a mirror to retire in the first place', () => {
    expect(mirrored.length).toBeGreaterThan(0);
    for (const tpl of mirrored) {
      expect(tpl.mirrors?.module).toBeTruthy();
      expect(tpl.mirrors?.family).toBeTruthy();
    }
  });

  it('drops the hand copy when the module itself serves that family', () => {
    const mirror = mirrored[0]!;
    const served = moduleTemplates([row({ ...mirror.mirrors })], 'en');
    const merged = mergeTemplates(TEMPLATES, served);
    expect(merged.cards.find((c) => c.id === mirror.id)).toBeUndefined();
    expect(merged.cards.find((c) => c.id === served[0].id)).toBeTruthy();
    // Every other card of the house catalogue is still on the screen.
    for (const tpl of TEMPLATES) {
      if (tpl.id === mirror.id) continue;
      expect(merged.cards.find((c) => c.id === tpl.id), tpl.id).toBeTruthy();
    }
  });

  it('sends the retired card’s shortcut to the recipe that replaced it', () => {
    const mirror = mirrored[0]!;
    const served = moduleTemplates([row({ ...mirror.mirrors })], 'en');
    expect(mergeTemplates(TEMPLATES, served).aliases[mirror.id]).toBe(served[0].id);
  });

  it('keeps the hand copy on a hub that serves nothing — the fleet before hub#1645', () => {
    const merged = mergeTemplates(TEMPLATES, []);
    expect(merged.cards).toHaveLength(TEMPLATES.length);
    expect(merged.aliases).toEqual({});
  });

  it('never lets a served card and a house card share an id', () => {
    const served = moduleTemplates([row()], 'en');
    const ids = mergeTemplates(TEMPLATES, served).cards.map((c: FlowTemplate) => c.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  /** The kernel floor is the gallery's, not the hub's: `schemaFacts(undefined)` says «no». */
  it('leaves a served card out of a core that cannot parse what it carries', () => {
    const served = moduleTemplates(
      [
        row({
          documents: {
            en: {
              schema_version: 1,
              name: 'x',
              triggers: [{ kind: 'event', event: 'e' }],
              steps: [{ id: 's', kind: 'notify', channel: 'whatsapp', interactive: { rows: [] } }],
            },
          },
        }),
      ],
      'en',
    );
    const facts = schemaFacts(undefined);
    expect(served[0].needs).toEqual(['interactive']);
    expect(facts.interactiveNotify).toBe(false);
  });
});

/**
 * **The limit a recipe carries has to survive the trip through the hub** (flows#98, hub#1654).
 *
 * A `<family>.grants.json` may fix payload fields on a `command` grant — `whatsapp_inbox` fixes
 * `channel: "customer"` on `appointments.appointments.cancel` so an automation that books without
 * anybody looking cannot cancel a stranger's hour *on the salon's behalf*. Today that limit does
 * NOT come out of the door: `FlowTemplateGrant` is `{kind, value}` and serde drops the rest, so a
 * served card asks for the WIDE permission while the hand copy it replaces asked for the narrow
 * one. Retiring the copy without carrying its pin would hand the owner a permission nobody
 * widened on purpose, with every test in this file green.
 */
describe('the payload limits a served recipe asks with', () => {
  it('keeps the pin the hub serves on a command grant — the day hub#1654 lands', () => {
    const [card] = moduleTemplates(
      [
        row({
          grants: [
            { kind: 'command', value: 'appointments.appointments.cancel', payload: { channel: 'customer' } },
          ],
        }),
      ],
      'en',
    );
    expect(templateGrants(card, t)).toEqual([
      { kind: 'command', value: 'appointments.appointments.cancel', payload: { channel: 'customer' } },
    ]);
  });

  it('drops a pin offered on a kind the hub never hands a payload to', () => {
    const [card] = moduleTemplates(
      [row({ grants: [{ kind: 'query', value: 'customers.list', payload: { channel: 'customer' } }] })],
      'en',
    );
    expect(templateGrants(card, t)).toEqual([{ kind: 'query', value: 'customers.list' }]);
  });

  /**
   * Every copy that carries a limit, not just today's one: the next pinned mirror is covered too.
   *
   * `carriedPins` and not `grantPins`, so a limit STAGED for the twin (flows#103) is watched by
   * this test from the day it is written rather than from the day the recipe grows the operation.
   */
  const pinnedMirrors = TEMPLATES.filter((tpl) => tpl.mirrors && Object.keys(carriedPins(tpl)).length);

  it('has a copy carrying a limit in the first place — otherwise the test below proves nothing', () => {
    expect(pinnedMirrors.length).toBeGreaterThan(0);
  });

  it('asks with the retired copy’s limit while the door cannot carry it', () => {
    for (const mirror of pinnedMirrors) {
      const pins = Object.entries(carriedPins(mirror));
      const served = moduleTemplates(
        [
          row({
            ...mirror.mirrors,
            // Exactly what the hub serves TODAY from that sidecar: the pin already stripped, plus
            // one command the copy does NOT pin, so a pin sprayed over the list would show here.
            grants: [
              ...pins.map(([command]) => ({ kind: 'command', value: command })),
              { kind: 'command', value: 'customers.create' },
            ],
          }),
        ],
        'en',
      );
      const merged = mergeTemplates(TEMPLATES, served);
      const card = merged.cards.find((c) => c.id === served[0].id)!;
      const asked = templateGrants(card, t);
      for (const [command, pin] of pins) {
        expect(asked.find((g) => g.value === command)?.payload, `${mirror.id} → ${command}`).toEqual(pin);
      }
      expect(asked.find((g) => g.value === 'customers.create')?.payload).toBeUndefined();
    }
  });

  it('lets the module’s own pin win over the copy’s', () => {
    const mirror = TEMPLATES.find(
      (tpl) => tpl.grantPins?.['appointments.appointments.cancel'] && tpl.mirrors,
    )!;
    const served = moduleTemplates(
      [
        row({
          ...mirror.mirrors,
          grants: [
            { kind: 'command', value: 'appointments.appointments.cancel', payload: { channel: 'staff' } },
          ],
        }),
      ],
      'en',
    );
    const merged = mergeTemplates(TEMPLATES, served);
    const card = merged.cards.find((c) => c.id === served[0].id)!;
    expect(templateGrants(card, t)[0]?.payload).toEqual({ channel: 'staff' });
  });

  it('leaves a served card with no copy behind it exactly as the hub served it', () => {
    const served = moduleTemplates([row({ grants: [{ kind: 'command', value: 'customers.create' }] })], 'en');
    const card = mergeTemplates(TEMPLATES, served).cards.find((c) => c.id === served[0].id)!;
    expect(templateGrants(card, t)).toEqual([{ kind: 'command', value: 'customers.create' }]);
  });
});

/**
 * **The unattended card may only MOVE an appointment as the customer** (flows#103).
 *
 * The twin above pins *cancelling*. Moving is the operation the recipe is about to grow
 * (whatsapp_inbox#118, on top of appointments#142's `channel` + `customer_id`), and it needs the
 * very same containment for the very same reason: `book_appointment` runs `policy: "auto"`, so
 * there is no tray and nobody reads the model's work before the diary is written. Left wide, a
 * well-written WhatsApp message moves somebody else's hour on the salon's behalf — the staff
 * channel does not check whose appointment it is.
 *
 * It is pinned HERE, from this repo, and deliberately BEFORE the recipe grows the operation: while
 * hub#1654 is open the module's own `payload` never reaches the gallery, so the hand copy is the
 * only carrier of the limit. Landing the recipe first would put the wide permission on the fleet.
 */
describe('the unattended WhatsApp card moves an appointment only as the customer (flows#103)', () => {
  const RESCHEDULE = 'appointments.appointments.reschedule';
  const CANCEL = 'appointments.appointments.cancel';
  const unattended = TEMPLATES.find((tpl) => tpl.id === 'whatsapp-appointment-unattended')!;

  /**
   * The unattended family as the hub serves it once whatsapp_inbox#118 lands: the two operations
   * it contains, plus one it does not, and every one of them WIDE — which is all `FlowTemplateGrant`
   * can carry while hub#1654 is open.
   */
  const servedGrants = () => {
    const served = moduleTemplates(
      [
        row({
          ...unattended.mirrors,
          grants: [
            { kind: 'command', value: CANCEL },
            { kind: 'command', value: RESCHEDULE },
            { kind: 'command', value: 'appointments.appointments.create' },
          ],
        }),
      ],
      'en',
    );
    const card = mergeTemplates(TEMPLATES, served).cards.find((c) => c.id === served[0].id)!;
    return templateGrants(card, t);
  };

  // The control that proves the harness above sees the positive: cancelling is pinned TODAY, by
  // the same path, so a red on the move below is about the move and not about the plumbing.
  it('still carries the limit onto the cancellation', () => {
    expect(servedGrants().find((g) => g.value === CANCEL)?.payload).toEqual({ channel: 'customer' });
  });

  it('carries the limit onto the move as well', () => {
    const grant = servedGrants().find((g) => g.value === RESCHEDULE);
    expect(grant, 'the served card asks to move appointments').toBeTruthy();
    expect(grant!.payload).toEqual({ channel: 'customer' });
  });

  // 🔴 THE assertion this issue exists for, and it is about the call the recipe must NOT be able to
  // make. Asserting only that its own move gets through would pass just as well with no limit at all.
  it('refuses a move asked for on the salon’s behalf', () => {
    const grant = servedGrants().find((g) => g.value === RESCHEDULE)!;
    const move = { appointment_id: 'a1', start_datetime: '2026-09-10T10:00:00Z' };
    // What the recipe is for: the customer who wrote in, moving her own hour.
    expect(grantAllowsCall(grant, { ...move, channel: 'customer', customer_id: 'c1' })).toBe(true);
    // What a stranger's message must never talk the model into.
    expect(grantAllowsCall(grant, { ...move, channel: 'staff' })).toBe(false);
    // And the same refusal by omission — `channel` defaults to `staff` in the command's schema.
    expect(grantAllowsCall(grant, move)).toBe(false);
  });

  it('leaves every other permission the hub served exactly as wide as it was', () => {
    const pinned = servedGrants()
      .filter((g) => Object.keys(grantPin(g)).length > 0)
      .map((g) => `${g.kind} ${g.value}`);
    expect(pinned).toEqual([`command ${CANCEL}`, `command ${RESCHEDULE}`]);
  });

  it('does not touch the hand copy, which cannot move an appointment at all', () => {
    // The copy mirrors the family as PUBLISHED today (13 grants, no move — whatsapp_inbox#74's
    // scope cut). A pin staged for the served twin must not read as a permission this document
    // asks for: on a hub that serves nothing, the card is still exactly what it was.
    const asked = templateGrants(unattended, t).map((g) => g.value);
    expect(asked).toContain(CANCEL);
    expect(asked).not.toContain(RESCHEDULE);
  });
});
