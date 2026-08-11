import { describe, it, expect } from 'vitest';
import { TRIGGER_CATALOG, catalogEntry } from './trigger-catalog';
import en from '../../locales/en.json';
import es from '../../locales/es.json';

const dig = (catalog: Record<string, unknown>, key: string): unknown =>
  key.split('.').reduce<unknown>((acc, part) => (acc as Record<string, unknown>)?.[part], catalog);

describe('the events an owner can start a flow from', () => {
  it('offers each event once', () => {
    const names = TRIGGER_CATALOG.map((e) => e.event);
    expect(new Set(names).size).toBe(names.length);
  });

  it('has real words for every one of them, in BOTH languages', () => {
    // English is the source and Spanish is what the shop actually reads (ADR-0055/0199). A key
    // that exists in one and not the other is a screen that falls back to a raw event name in
    // front of a customer.
    for (const entry of TRIGGER_CATALOG) {
      expect(dig(en as Record<string, unknown>, entry.labelKey), `${entry.event} in en`).toBeTypeOf('string');
      expect(dig(es as Record<string, unknown>, entry.labelKey), `${entry.event} in es`).toBeTypeOf('string');
    }
  });

  it('names the module each event comes from, so the picker can say why one is missing', () => {
    // «Este hub no tiene ese evento» is only useful next to «lo trae el módulo Citas».
    for (const entry of TRIGGER_CATALOG) {
      expect(entry.module).toMatch(/^[a-z][a-z0-9_]*$/);
    }
  });

  it('looks one up, and does not invent one it does not have', () => {
    expect(catalogEntry('sale.completed')?.module).toBe('sales');
    expect(catalogEntry('nothing.at.all')).toBeUndefined();
  });
});
