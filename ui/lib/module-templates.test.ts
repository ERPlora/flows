import { describe, it, expect } from 'vitest';
import {
  MODULE_TEMPLATE_PREFIX,
  moduleTemplateId,
  moduleTemplates,
} from './module-templates';
import { mergeTemplates, TEMPLATES, templateGrants, templateName, templateSummary } from './templates';
import type { FlowTemplate } from './templates';
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
    // …and the card says which app it came from, which is the whole point of naming the source.
    expect(templateSummary(card, t)).toContain(t('ui.mod_whatsapp_inbox'));
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
