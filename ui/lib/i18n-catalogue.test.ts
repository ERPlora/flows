import { describe, it, expect } from 'vitest';
import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import en from '../../locales/en.json';
import es from '../../locales/es.json';

/**
 * **Every string on screen goes through i18n, with its Spanish** — the project rule (ADR-0055,
 * ADR-0199): English is the SOURCE, Spanish is the translation, and the owner reads Spanish.
 *
 * This is a guard and not a unit test: it reads the components' own source and checks the keys
 * they ask for against both catalogues. The failure it exists for is silent — `t('ui.whatever')`
 * with no entry renders the KEY, so a missing translation ships as `ui.httpTimeoutHint` printed
 * on a form, and nothing turns red anywhere.
 */

const UI = join(__dirname, '..');

function sources(dir: string, out: string[] = []): string[] {
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const path = join(dir, entry.name);
    if (entry.isDirectory()) sources(path, out);
    else if (entry.name.endsWith('.ts') && !entry.name.endsWith('.test.ts')) out.push(path);
  }
  return out;
}

/**
 * Every catalogue key the sources name **literally**.
 *
 * Deliberately broader than `t('…')`: keys reach `t()` through a ternary (`policy === 'auto' ?
 * 'ui.stepAiAuto' : 'ui.stepAiManual'`) and through `…Key:` fields on the template catalogue, and
 * matching only the call site would leave exactly those unchecked — the ones a reader is least
 * likely to notice are missing.
 */
function keysUsed(): Set<string> {
  const found = new Set<string>();
  for (const path of sources(UI)) {
    const src = readFileSync(path, 'utf8');
    for (const m of src.matchAll(/'((?:ui|tpl|guide)\.[A-Za-z0-9_.]+)'/g)) found.add(m[1]);
  }
  return found;
}

/**
 * The key families that are **assembled at runtime** and so cannot be read out of the source:
 * `` t(`ui.op${op}`) ``, the plural's `${base}One`, the channel suffix. A mechanical guard cannot
 * see these, so they are written down — which is also the only place that records they exist.
 */
const COMPOSED_KEYS = [
  // `ui.tab${Editor|Permissions|History}`
  'ui.tabEditor',
  'ui.tabPermissions',
  'ui.tabHistory',
  // `ui.op${Eq|Neq|…}` — one per frozen operator
  'ui.opEq',
  'ui.opNeq',
  'ui.opIn',
  'ui.opExists',
  'ui.opContains',
  'ui.opGt',
  'ui.opGte',
  'ui.opLt',
  'ui.opLte',
  // `ui.notifyChannel_${email|whatsapp}` — and NOT sms, which has no transport
  'ui.notifyChannel_email',
  'ui.notifyChannel_whatsapp',
  // the plural helper's `${base}One`
  'ui.delayDaysOne',
  'ui.delayHoursOne',
  'ui.delayMinutesOne',
  'ui.delaySecondsOne',
  'ui.stepGuardOne',
];

function has(catalogue: Record<string, unknown>, key: string): boolean {
  let node: unknown = catalogue;
  for (const part of key.split('.')) {
    if (typeof node !== 'object' || node === null) return false;
    node = (node as Record<string, unknown>)[part];
  }
  return typeof node === 'string';
}

const allKeys = (): string[] => [...new Set([...keysUsed(), ...COMPOSED_KEYS])];

describe('the module catalogue covers every string the screens ask for', () => {
  it('finds the keys at all — the control that stops this guard passing on an empty set', () => {
    const used = keysUsed();
    expect(used.size).toBeGreaterThan(80);
    // Spot checks from opposite ends of the module, INCLUDING a key that only ever reaches `t()`
    // through a ternary: a regex that quietly stopped matching those would otherwise leave this
    // suite green while checking nothing about them.
    expect(used.has('ui.save')).toBe(true);
    expect(used.has('ui.stepGuardEmpty')).toBe(true);
    expect(used.has('ui.stepAiAuto')).toBe(true);
    expect(used.has('ui.stepNotifyWhatsapp')).toBe(true);
  });

  it('has an ENGLISH entry for every key (English is the source)', () => {
    const missing = allKeys().filter((k) => !has(en as Record<string, unknown>, k)).sort();
    expect(missing, 'keys with no English string').toEqual([]);
  });

  it('has a SPANISH entry for every key — the owner reads Spanish', () => {
    const missing = allKeys().filter((k) => !has(es as Record<string, unknown>, k)).sort();
    expect(missing, 'keys with no Spanish translation').toEqual([]);
  });

  it('keeps the two catalogues the same shape, so neither drifts ahead of the other', () => {
    const flat = (o: Record<string, unknown>, prefix = ''): string[] =>
      Object.entries(o).flatMap(([k, v]) =>
        typeof v === 'object' && v !== null
          ? flat(v as Record<string, unknown>, `${prefix}${k}.`)
          : [`${prefix}${k}`],
      );
    const inEn = new Set(flat(en as Record<string, unknown>));
    const inEs = new Set(flat(es as Record<string, unknown>));
    expect([...inEn].filter((k) => !inEs.has(k)).sort(), 'in English, missing in Spanish').toEqual([]);
    expect([...inEs].filter((k) => !inEn.has(k)).sort(), 'in Spanish, missing in English').toEqual([]);
  });
});
