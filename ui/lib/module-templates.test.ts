import { describe, it, expect } from 'vitest';
import {
  MODULE_TEMPLATE_PREFIX,
  moduleTemplateId,
  moduleTemplates,
} from './module-templates';
import {
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

  /**
   * 🔴 **The floor the retired copies used to carry, on the card that replaced them** (flows#101).
   *
   * `whatsapp-appointment` and its unattended twin declared `needs: ['interactive','output',
   * 'queryPin']` by hand, and the third one is not about parsing the document: a core below
   * `v1.1.17` has no `GrantKind::can_pin(Query)`, so `check_grants` refuses the read's pin — and
   * `PUT …/grants` is all-or-nothing, so the owner ends up with NO permissions and an automation
   * that stops at its first step while the card says it installed. Deleting the copies without
   * deriving the same floor here would hand that back, on the served card, with every other test
   * in this file green.
   */
  it('declares the floor a pinned READ needs, which no document can be read off', () => {
    const pinnedRead = row({
      grants: [
        {
          kind: 'query',
          value: 'appointments.appointments.list_for_customer',
          payload: { customer_id: 'steps.resolve_customer.id' },
        },
      ],
    });
    expect(moduleTemplates([pinnedRead], 'en')[0].needs).toEqual(['queryPin']);
    // Only a pin the hub actually holds values for: a `notify` payload fixes nothing
    // ({@link canPinPayload}) and is dropped, so it must not raise the floor either.
    const pinnedNotify = row({
      grants: [{ kind: 'notify', value: 'whatsapp', payload: { to: '+34600' } }],
    });
    expect(moduleTemplates([pinnedNotify], 'en')[0].needs ?? []).toEqual([]);
    // And the control: the same row with the permission WIDE asks for nothing.
    const wideRead = row({
      grants: [{ kind: 'query', value: 'appointments.appointments.list_for_customer' }],
    });
    expect(moduleTemplates([wideRead], 'en')[0].needs ?? []).toEqual([]);
  });

  /**
   * The other side of that floor: a pinned COMMAND is not a pinned read (flows#101).
   *
   * `can_pin(Command)` has been there since hub#1623 (`v1.1.16`) and `can_pin(Query)` only since
   * hub#1662 (`v1.1.17`), so the two floors are NOT the same floor. `whatsapp_inbox` fixes
   * `channel: "customer"` on `appointments.appointments.cancel` — a limit the whole recipe rests
   * on — and a family that fixes only that runs perfectly on a `v1.1.16` hub. Deriving `queryPin`
   * from «carries some pin» instead of «pins a READ» would hide it there, and hiding a card the
   * hub can run reads to the salon exactly like the app not being installed.
   */
  it('does not ask for the read floor because of a pinned COMMAND, which an older hub does hold', () => {
    const pinnedCommand = row({
      grants: [
        {
          kind: 'command',
          value: 'appointments.appointments.cancel',
          payload: { channel: 'customer' },
        },
      ],
    });
    expect(moduleTemplates([pinnedCommand], 'en')[0].needs ?? []).toEqual([]);
    // The pin is still READ as a limit — it is only the FLOOR that a command does not raise.
    expect(moduleTemplates([pinnedCommand], 'en')[0].grants).toEqual([
      {
        kind: 'command',
        value: 'appointments.appointments.cancel',
        payload: { channel: 'customer' },
      },
    ]);
    // And the two together ask for the read floor once, on account of the READ.
    const both = row({
      grants: [
        {
          kind: 'command',
          value: 'appointments.appointments.cancel',
          payload: { channel: 'customer' },
        },
        {
          kind: 'query',
          value: 'appointments.appointments.list_for_customer',
          payload: { customer_id: 'steps.resolve_customer.id' },
        },
      ],
    });
    expect(moduleTemplates([both], 'en')[0].needs).toEqual(['queryPin']);
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
/**
 * **The ids this gallery used to answer on, and the family that took each one over** (flows#101).
 *
 * Written out rather than read from the table production reads: this is the contract with the
 * outside — `whatsapp_inbox` builds `?template=whatsapp-appointment` in its own settings screen and
 * the other three were live addresses of this gallery for weeks — and a test that derived the list
 * from `RETIRED_IDS` would go green on an address quietly dropped from both.
 */
const RETIRED: Record<string, string> = {
  'whatsapp-appointment': 'appointment-from-whatsapp',
  // flows#115: one recipe per use since whatsapp_inbox#129; the survivor has the short name.
  'whatsapp-appointment-unattended': 'appointment-from-whatsapp',
  'whatsapp-reservation': 'reservation-from-whatsapp',
  'whatsapp-reservation-unattended': 'reservation-from-whatsapp',
};

describe('the gallery catalogue, once the hub brings the modules’ own recipes', () => {
  it('has no hand copy left of a family an app serves itself', () => {
    for (const id of Object.keys(RETIRED)) {
      expect(
        TEMPLATES.find((tpl) => tpl.id === id),
        `${id} is written in this catalogue again, beside the recipe it copies`,
      ).toBeUndefined();
    }
  });

  it('adds the served recipes without losing a card of the house catalogue', () => {
    const served = moduleTemplates([row()], 'en');
    const merged = mergeTemplates(TEMPLATES, served);
    expect(merged.cards.find((c) => c.id === served[0].id)).toBeTruthy();
    for (const tpl of TEMPLATES) {
      expect(merged.cards.find((c) => c.id === tpl.id), tpl.id).toBeTruthy();
    }
  });

  it('keeps every written card on a hub that serves nothing — the fleet before hub#1645', () => {
    const merged = mergeTemplates(TEMPLATES, []);
    expect(merged.cards).toHaveLength(TEMPLATES.length);
    expect(merged.aliases).toEqual({});
  });

  /**
   * **The addresses this screen used to answer on keep answering** (flows#101).
   *
   * `whatsapp-appointment` is not an id of ours to retire quietly: `whatsapp_inbox` builds
   * `?template=whatsapp-appointment` in its own settings screen (`ui/lib/whatsapp-uses.ts`) and
   * ships it in a release of its own, so the two repositories cannot change it on the same day.
   * The other three were live ids of this gallery for weeks and can be sitting in a bookmark.
   *
   * Until this issue the forwarding fell out of the hand copy: {@link mergeTemplates} matched the
   * copy's `mirrors` against the served card's `source` and wrote the alias from it. With the copy
   * deleted there is no such row to read, so the four addresses have to be named here — which is
   * also the only place left that still says these ids ever existed.
   */
  it('forwards a retired id to the recipe that replaced it with no copy left to read it from', () => {
    const served = moduleTemplates([row()], 'en');
    const merged = mergeTemplates([], served);
    expect(merged.aliases['whatsapp-appointment']).toBe(served[0].id);
  });

  it('forwards every id it retired, not only the one another repository publishes', () => {
    for (const [id, family] of Object.entries(RETIRED)) {
      const served = moduleTemplates([row({ family })], 'en');
      expect(mergeTemplates([], served).aliases[id], id).toBe(served[0].id);
    }
  });

  /**
   * The other half of the match, and the half nothing was anchoring (flows#101).
   *
   * Every id in `RETIRED_IDS` names a module AND a family, and the test above only ever varies the
   * family: every card it serves comes from `whatsapp_inbox`, which is also the module all four
   * entries name. So the module half never decides anything, and dropping it left the whole suite
   * green — a guard tested in one direction only.
   *
   * It decides in production. The family names are generic English — `reservation-from-whatsapp`,
   * `appointment-from-whatsapp` — and nothing reserves them for `whatsapp_inbox`: any module may
   * publish a family under that name. Matched on the family alone, that module's card would inherit
   * the retired address, and the salon arriving from Settings → WhatsApp on a link built by
   * `whatsapp_inbox` would land on a STRANGER's recipe and install it.
   */
  it('never forwards a retired id to another module that happens to reuse the family name', () => {
    for (const [id, family] of Object.entries(RETIRED)) {
      const served = moduleTemplates([row({ module: 'bookings', family })], 'en');
      // The card is served and usable — it is only the retired address that is not its to take.
      expect(served[0].source, id).toEqual({ module: 'bookings', family });
      expect(mergeTemplates([], served).aliases[id], id).toBeUndefined();
    }
  });

  /**
   * **The direction the tests above leave open** (flows#101, review of flows#113). Every entry the
   * table in THIS file names is checked to be forwarded — but an entry the production table names
   * and this file does not is never looked at. Measured: aliasing `whatsapp-answer`, a card still on
   * screen, to the served appointment recipe left the whole suite green. In production that entry
   * hijacks the live card: `landsOn` forwards its id, so tapping «Answer» opens the appointment
   * recipe and «Use» installs it.
   *
   * An address is forwarded only once the card behind it is GONE. With every family the app
   * publishes served at once, the aliases the merge writes are exactly the retired ids, and not one
   * of them is a card this catalogue still paints.
   */
  it('never forwards the id of a card that is still on screen', () => {
    const served = moduleTemplates(
      Object.values(RETIRED).map((family) => row({ family })),
      'en',
    );
    const merged = mergeTemplates(TEMPLATES, served);
    for (const id of Object.keys(merged.aliases)) {
      expect(
        merged.cards.find((c) => c.id === id),
        `${id} is forwarded away while its own card is still in the catalogue`,
      ).toBeUndefined();
    }
    expect(Object.keys(merged.aliases).sort()).toEqual(Object.keys(RETIRED).sort());
  });

  it('forwards nothing while the hub serves nothing: there is no card to land on', () => {
    expect(mergeTemplates(TEMPLATES, []).aliases).toEqual({});
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

  // hub#1662 — a READ carries a limit too, and it is the one whatsapp_inbox needs: «the diary of
  // the customer this conversation resolved», never everybody's. Dropping it here would publish a
  // recipe that asks for the wide read while its own card promises the narrow one.
  it('keeps the pin the hub serves on a query grant (hub#1662)', () => {
    const [card] = moduleTemplates(
      [
        row({
          grants: [
            {
              kind: 'query',
              value: 'appointments.appointments.list_for_customer',
              payload: { customer_id: 'steps.resolve_customer.id' },
            },
          ],
        }),
      ],
      'en',
    );
    expect(templateGrants(card, t)).toEqual([
      {
        kind: 'query',
        value: 'appointments.appointments.list_for_customer',
        payload: { customer_id: 'steps.resolve_customer.id' },
      },
    ]);
  });

  it('drops a pin offered on a kind the hub never hands any values to', () => {
    const [card] = moduleTemplates(
      [row({ grants: [{ kind: 'notify', value: 'whatsapp', payload: { to: '+34600' } }] })],
      'en',
    );
    expect(templateGrants(card, t)).toEqual([{ kind: 'notify', value: 'whatsapp' }]);
  });

  it('leaves a served card with no copy behind it exactly as the hub served it', () => {
    const served = moduleTemplates([row({ grants: [{ kind: 'command', value: 'customers.create' }] })], 'en');
    const card = mergeTemplates(TEMPLATES, served).cards.find((c) => c.id === served[0].id)!;
    expect(templateGrants(card, t)).toEqual([{ kind: 'command', value: 'customers.create' }]);
  });
});

/**
 * **What a served recipe's limits actually STOP** (flows#101, from flows#103 and flows#111).
 *
 * The pins used to live on a hand copy in `templates.ts` and were carried onto the served card at
 * merge time, because `FlowTemplateGrant` could not hold a payload. hub#1654 shipped in `v1.1.17`
 * and hub#1662 added the same for a read, so the limits now arrive from
 * `whatsapp_inbox/flows/<family>.grants.json` over the wire and the copies are gone.
 *
 * The assertions did not go with them. A pin is a containment or it is decoration, and the half
 * that tells them apart is the call it REFUSES: `channel` defaults to `staff` in the command's
 * schema, and a model that resolved nobody sends the read with no `customer_id` — so «omitted» is
 * exactly the shape that would otherwise move a stranger's hour or read the whole salon's diary.
 * The permissions below are the ones the module publishes today for
 * `appointment-from-whatsapp-unattended`.
 */
describe('the limits a served WhatsApp recipe arrives with are containments, not decoration', () => {
  const RESCHEDULE = 'appointments.appointments.reschedule';
  const CANCEL = 'appointments.appointments.cancel';
  const READ = 'appointments.appointments.list_for_customer';
  const CUSTOMER = { customer_id: 'steps.resolve_customer.id' };

  /** The family as the hub serves it: the three limited operations, plus one that is not. */
  const servedGrants = () => {
    const [card] = moduleTemplates(
      [
        row({
          family: 'appointment-from-whatsapp-unattended',
          grants: [
            { kind: 'command', value: CANCEL, payload: { channel: 'customer' } },
            { kind: 'command', value: RESCHEDULE, payload: { channel: 'customer' } },
            { kind: 'query', value: READ, payload: CUSTOMER },
            { kind: 'command', value: 'appointments.appointments.create' },
          ],
        }),
      ],
      'en',
    );
    return templateGrants(card, t);
  };

  it('refuses a cancellation asked for on the salon’s behalf', () => {
    const grant = servedGrants().find((g) => g.value === CANCEL);
    expect(grant, 'the served card asks to cancel appointments').toBeTruthy();
    expect(grantAllowsCall(grant!, { appointment_id: 'a1', channel: 'customer' })).toBe(true);
    expect(grantAllowsCall(grant!, { appointment_id: 'a1', channel: 'staff' })).toBe(false);
    // The same refusal by omission — `channel` defaults to `staff` in the command's schema.
    expect(grantAllowsCall(grant!, { appointment_id: 'a1' })).toBe(false);
  });

  it('refuses a move asked for on the salon’s behalf', () => {
    const grant = servedGrants().find((g) => g.value === RESCHEDULE);
    expect(grant, 'the served card asks to move appointments').toBeTruthy();
    const move = { appointment_id: 'a1', start_datetime: '2026-09-10T10:00:00Z' };
    expect(grantAllowsCall(grant!, { ...move, channel: 'customer', customer_id: 'c1' })).toBe(true);
    expect(grantAllowsCall(grant!, { ...move, channel: 'staff' })).toBe(false);
    expect(grantAllowsCall(grant!, move)).toBe(false);
  });

  it('refuses a read that names anybody else, or nobody', () => {
    const grant = servedGrants().find((g) => g.value === READ);
    expect(grant, 'the served card asks to read the diary').toBeTruthy();
    expect(grantAllowsCall(grant!, { ...CUSTOMER })).toBe(true);
    expect(grantAllowsCall(grant!, { customer_id: 'another-customer' })).toBe(false);
    expect(grantAllowsCall(grant!, {})).toBe(false);
  });

  // And nothing ELSE narrowed on the way in: a reader that sprayed the pin over the list would
  // pass every assertion above and quietly contain a permission the module left wide.
  it('leaves every other permission the hub served exactly as wide as it was', () => {
    const pinned = servedGrants()
      .filter((g) => Object.keys(grantPin(g)).length > 0)
      .map((g) => `${g.kind} ${g.value}`)
      .sort();
    expect(pinned).toEqual([`command ${CANCEL}`, `command ${RESCHEDULE}`, `query ${READ}`].sort());
  });
});

/**
 * **Each permission a served recipe asks for, in a sentence the owner reads** (flows#114).
 *
 * A module explains every grant in its own `<family>.grants.json` as `reason: { en, es }`, and the
 * hub serves it beside the grant. Until then the card's «what it will ask you to allow» block
 * showed fourteen internal names (`staff.schedules.list_for_member`) and each of them twice.
 */
describe('the sentence a served recipe gives each permission (flows#114)', () => {
  const reasoned = (reason: unknown) =>
    row({
      grants: [
        {
          kind: 'command',
          value: 'appointments.appointments.create',
          reason,
        },
        { kind: 'query', value: 'whatsapp_inbox.conversations.list' },
      ],
    });
  const BOTH = { en: 'Book the appointment', es: 'Reservar la cita' };

  it('uses the sentence in the owner’s language', () => {
    const [card] = moduleTemplates([reasoned(BOTH)], 'es');
    expect(card.grantPhrases).toEqual({ 'appointments.appointments.create': 'Reservar la cita' });
  });

  it('reads a region as its language, and falls back to English for one it does not ship', () => {
    expect(moduleTemplates([reasoned(BOTH)], 'es-ES')[0].grantPhrases).toEqual({
      'appointments.appointments.create': 'Reservar la cita',
    });
    expect(moduleTemplates([reasoned(BOTH)], 'fr')[0].grantPhrases).toEqual({
      'appointments.appointments.create': 'Book the appointment',
    });
  });

  it('gives no sentence for a reason it cannot read, and keeps the grant', () => {
    for (const bad of [null, 'Book it', 42, [], {}, { en: '' }, { en: 7 }, { es: 'Solo en español' }]) {
      const [card] = moduleTemplates([reasoned(bad)], 'fr');
      expect(card.grantPhrases, JSON.stringify(bad)).toEqual({});
      expect(card.grants?.map((g) => g.value)).toEqual([
        'appointments.appointments.create',
        'whatsapp_inbox.conversations.list',
      ]);
    }
  });

  it('never lets the sentence travel with the grant the hub is asked to hold', () => {
    const [card] = moduleTemplates([reasoned(BOTH)], 'es');
    for (const grant of card.grants ?? []) expect(Object.keys(grant)).not.toContain('reason');
  });

  it('keeps the sentence of a grant dropped as unreadable out of the card too', () => {
    const [card] = moduleTemplates(
      [row({ grants: [{ kind: 'command', value: '', reason: BOTH }, { kind: 'query', value: 'q.x' }] })],
      'es',
    );
    expect(card.grantPhrases).toEqual({});
  });
});

/**
 * **Whether the owner's copy of a recipe is behind what its module ships** (flows#136, hub#2059).
 *
 * The hub answers `installed: { flow_id, enabled, outdated }` per family it already built a flow
 * from. `outdated` has THREE honest answers and a fourth shape: `true`, `false`, `null` («this hub
 * cannot tell» — a flow built before it remembered the recipe) and absent (a hub older than
 * hub#2059). The last two must read the same, and neither may read as «up to date».
 */
describe('the recipe the owner already activated, and whether its module improved it (flows#136)', () => {
  const installed = (value: unknown) => moduleTemplates([row({ installed: value })], 'en')[0];

  it('carries which flow the hub built from it and that it is behind', () => {
    expect(installed({ flow_id: 'f1', enabled: true, outdated: true }).factory).toEqual({
      flowId: 'f1',
      outdated: true,
    });
  });

  it('says it is up to date only when the hub says so', () => {
    expect(installed({ flow_id: 'f1', enabled: false, outdated: false }).factory).toEqual({
      flowId: 'f1',
      outdated: false,
    });
  });

  it('reads «cannot tell» and a hub that never computed it as the same unknown', () => {
    expect(installed({ flow_id: 'f1', enabled: true, outdated: null }).factory).toEqual({
      flowId: 'f1',
      outdated: null,
    });
    expect(installed({ flow_id: 'f1', enabled: true }).factory).toEqual({
      flowId: 'f1',
      outdated: null,
    });
    expect(installed({ flow_id: 'f1', enabled: true, outdated: 'yes' }).factory).toEqual({
      flowId: 'f1',
      outdated: null,
    });
  });

  it('has no factory copy when the hub built none, or answers something it cannot read', () => {
    expect(installed(null).factory).toBeUndefined();
    expect(moduleTemplates([row()], 'en')[0].factory).toBeUndefined();
    expect(installed({ enabled: true, outdated: true }).factory).toBeUndefined();
    expect(installed({ flow_id: '  ', outdated: true }).factory).toBeUndefined();
    expect(installed('f1').factory).toBeUndefined();
  });
});
