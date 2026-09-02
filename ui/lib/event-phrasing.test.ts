import { describe, it, expect } from 'vitest';
import {
  EVENT_ACTIONS,
  EVENT_FAMILIES,
  EVENT_SUBJECTS,
  eventFamily,
  eventPhrase,
  splitEventName,
} from './event-phrasing';
import { TRIGGER_CATALOG } from './trigger-catalog';
import { EVENT_NAMES } from '../test/event-names';
import en from '../../locales/en.json';
import es from '../../locales/es.json';

/** The shell's translator over one catalogue, `{param}` included. */
const translator =
  (catalogue: unknown) =>
  (key: string, params?: Record<string, unknown>): string => {
    let cur: unknown = catalogue;
    for (const part of key.split('.')) {
      cur = cur && typeof cur === 'object' ? (cur as Record<string, unknown>)[part] : undefined;
    }
    const found = typeof cur === 'string' ? cur : key;
    return params
      ? found.replace(/\{(\w+)\}/g, (_, name: string) => String(params[name] ?? ''))
      : found;
  };

const tEn = translator(en);
const tEs = translator(es);

/** A technical name is what the owner must never read: `a.b.c`, or a `snake_case` token. */
const READS_TECHNICAL = /(?:^|\s)[a-z][a-z0-9]*(?:[._][a-z0-9]+)+(?:\s|$)/;

describe('every event this fleet can fire reads as words, in both languages', () => {
  it.each(['en', 'es'])('has a phrase for all %s of them — none falls back to the raw name', (lang) => {
    const t = lang === 'en' ? tEn : tEs;
    const raw = EVENT_NAMES.filter((event) => {
      const phrase = eventPhrase(event, t);
      return !phrase || phrase === event || READS_TECHNICAL.test(phrase);
    });

    // The bar of flows#41: 196 events on offer, 24 with words. Anything short of ALL of them is a
    // dropdown that still shows `inventory.low_stock_crossed` to somebody.
    expect(raw).toEqual([]);
  });

  /**
   * 🔴 The check above is NOT enough on its own, and it was written that way first: layer 3 turns
   * `kitchen.station.created` into «station created», which has no dot, no underscore and is not
   * the raw name — so dropping `station` from the dictionary left the suite GREEN with English
   * printed in a Spanish dropdown. Layer 3 answers the same string in both languages, by
   * construction. So the guard that actually holds is this one: a phrase that went through i18n
   * cannot read identically in English and in Spanish.
   */
  it('every phrase is really TRANSLATED — the fallback would read the same in both languages', () => {
    const untranslated = EVENT_NAMES.filter((event) => eventPhrase(event, tEs) === eventPhrase(event, tEn));

    expect(untranslated).toEqual([]);
  });

  it('knows the family of every event by name, so no group is labelled in English either', () => {
    // Families cannot use the test above — «VeriFactu» and «WhatsApp» are the same word in both —
    // so the guard is the dictionary itself: an unknown family is what `humanizeToken` would print.
    const unknown = EVENT_NAMES.filter((event) => {
      const family = event.split('.')[0];
      return !EVENT_FAMILIES[family];
    });

    expect(unknown).toEqual([]);
  });

  it.each(['en', 'es'])('names the family of every event in %s, so the picker can group by it', (lang) => {
    const t = lang === 'en' ? tEn : tEs;
    const raw = EVENT_NAMES.filter((event) => {
      const family = eventFamily(event, t);
      return !family || READS_TECHNICAL.test(family);
    });

    expect(raw).toEqual([]);
  });

  it('never leaves an i18n key on screen: every key it can reach exists in en AND es', () => {
    // `t()` renders the KEY when the entry is missing, so a phrase that came out as
    // `ui.evsAppointment` looks like a phrase to the test above and like a bug to the owner.
    const keys = [
      ...Object.values(EVENT_SUBJECTS).map((s) => s.key),
      ...Object.values(EVENT_ACTIONS).flatMap((a) => [a.key, a.pluralKey]),
    ].filter((k): k is string => typeof k === 'string');

    for (const key of keys) {
      expect(tEn(key), `${key} in en`).not.toBe(key);
      expect(tEs(key), `${key} in es`).not.toBe(key);
    }
  });
});

describe('the words are chosen, not just assembled', () => {
  it('prefers the hand-written phrase over the composed one', () => {
    // `sale.completed` composes to «a sale is completed»; the catalogue says «a sale is charged»,
    // which is what a shop owner calls it. Curation wins wherever it exists.
    expect(TRIGGER_CATALOG.some((e) => e.event === 'sale.completed')).toBe(true);
    expect(eventPhrase('sale.completed', tEn)).toBe(tEn('ui.evSaleCompleted'));
    expect(eventPhrase('sale.completed', tEs)).toBe(tEs('ui.evSaleCompleted'));
  });

  it('composes in each language’s own word order', () => {
    // English puts the subject first («an appointment is deleted»); Spanish puts the impersonal
    // verb first («se borra una cita»). One template per language, not one template translated.
    expect(eventPhrase('appointments.appointment.deleted', tEn)).toBe('an appointment is deleted');
    expect(eventPhrase('appointments.appointment.deleted', tEs)).toBe('se borra una cita');
  });

  it('agrees in number: a plural subject takes the plural verb', () => {
    expect(eventPhrase('kitchen.settings.updated', tEn)).toBe('the settings are updated');
    expect(eventPhrase('kitchen.settings.updated', tEs)).toBe('se cambian los ajustes');
  });

  it('reads a legacy two-part name as subject + action, like the three-part ones', () => {
    expect(eventPhrase('customer.updated', tEn)).toBe('a customer is updated');
    expect(eventPhrase('customer.updated', tEs)).toBe('se actualiza un cliente');
  });
});

describe('an event nobody has words for is still not a technical name', () => {
  it('humanises what it cannot translate instead of printing the identifier', () => {
    // A module published after this dictionary was written. The owner reads something; what they
    // must never read is `weird_module.odd_thing.went_sideways`.
    const phrase = eventPhrase('weird_module.odd_thing.went_sideways', tEs);

    expect(phrase).not.toContain('weird_module');
    expect(phrase).not.toContain('_');
    expect(phrase.toLowerCase()).toContain('odd thing');
  });

  it('names an unknown family readably too', () => {
    expect(eventFamily('weird_module.odd_thing.went_sideways', tEs)).toBe('Weird module');
  });

  it('has nothing to say about an empty name, and says nothing', () => {
    expect(eventPhrase('', tEs)).toBe('');
    expect(eventFamily('', tEs)).toBe('');
  });
});

describe('splitEventName', () => {
  it('reads `<family>.<subject>.<action>`', () => {
    expect(splitEventName('kitchen.order.ready')).toEqual({
      family: 'kitchen',
      subject: 'order',
      action: 'ready',
    });
  });

  it('reads a two-part name as `<subject>.<action>`, with the family taken from the subject', () => {
    expect(splitEventName('sale.voided')).toEqual({
      family: 'sale',
      subject: 'sale',
      action: 'voided',
    });
  });

  it('keeps the whole tail of a longer name, so nothing is silently dropped', () => {
    expect(splitEventName('taxes.rules.bulk_create.report')).toEqual({
      family: 'taxes',
      subject: 'rules',
      action: 'bulk_create.report',
    });
  });
});
