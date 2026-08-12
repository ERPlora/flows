import { describe, it, expect, beforeEach } from 'vitest';
import './erp-flows-guide';
import { GUIDE_SECTIONS, type ErpFlowsGuide } from './erp-flows-guide';
import en from '../../../locales/en.json';
import es from '../../../locales/es.json';

const lookup = (catalogue: unknown, key: string): string | undefined => {
  let cur: unknown = catalogue;
  for (const part of key.split('.')) {
    cur = cur && typeof cur === 'object' ? (cur as Record<string, unknown>)[part] : undefined;
  }
  return typeof cur === 'string' ? cur : undefined;
};
const t = (key: string): string => lookup(en, key) ?? key;

async function mount(): Promise<ErpFlowsGuide> {
  const el = document.createElement('erp-flows-guide') as ErpFlowsGuide;
  el.t = t;
  document.body.appendChild(el);
  await el.updateComplete;
  return el;
}

const text = (el: ErpFlowsGuide): string => el.renderRoot.textContent ?? '';

describe('the guide answers the five questions pm#134 asked for', () => {
  beforeEach(() => document.body.replaceChildren());

  it('covers them in the order somebody meets them', async () => {
    const el = await mount();
    expect(GUIDE_SECTIONS).toEqual([
      'what',
      'first',
      'permissions',
      'history',
      'limits',
    ]);
    const headings = [...el.renderRoot.querySelectorAll('section[data-section] h3')].map(
      (h) => h.getAttribute('data-key') ?? '',
    );
    expect(headings).toEqual(GUIDE_SECTIONS.map((s) => `guide.${s}Title`));
  });

  it('opens with what an automation IS, and an example from a real trade', async () => {
    const el = await mount();
    expect(text(el)).toContain(t('guide.whatBody'));
    expect(text(el)).toContain(t('guide.whatExample'));
  });

  it('walks the first automation as numbered steps, not prose', async () => {
    const el = await mount();
    const steps = el.renderRoot.querySelectorAll('[data-section="first"] li');
    expect(steps.length).toBeGreaterThanOrEqual(4);
  });

  // The place people get stuck, and the reason this section is not last: an automation with no
  // grants does nothing at all, and does it silently.
  it('says where the permissions live and what happens without them', async () => {
    const el = await mount();
    const section = el.renderRoot.querySelector('[data-section="permissions"]');
    expect(section?.textContent).toContain(t('guide.permissionsWhere'));
    expect(section?.textContent).toContain(t('guide.permissionsNothing'));
  });

  it('explains how to tell it worked, including the run that stopped on purpose', async () => {
    const el = await mount();
    const section = el.renderRoot.querySelector('[data-section="history"]');
    expect(section?.textContent).toContain(t('guide.historyGuard'));
  });

  // Honesty is the whole point of section five: the engine is linear ON PURPOSE, and the network,
  // AI and message steps are not editable yet (flows#3). A guide that implies otherwise sends
  // somebody hunting for a screen that does not exist.
  it('says out loud what it cannot do yet', async () => {
    const el = await mount();
    const section = el.renderRoot.querySelector('[data-section="limits"]');
    expect(section?.textContent).toContain(t('guide.limitsBranches'));
    expect(section?.textContent).toContain(t('guide.limitsChannels'));
    expect(section?.textContent).toContain(t('guide.limitsInside'));
  });
});

describe('the pictures are the real screens, not photographs of them', () => {
  beforeEach(() => document.body.replaceChildren());

  // Drawn with the editor's own words and CSS instead of a PNG: a screenshot goes stale silently,
  // shows one language and one theme, and would have to be base64'd into the bundle to travel at
  // all (`pack` ships `dist`, not `docs`).
  it('draws a spine that uses the same words as the editor', async () => {
    const el = await mount();
    const shot = el.renderRoot.querySelector('[data-shot="spine"]');
    expect(shot?.textContent).toContain(t('ui.whenThisHappens'));
    expect(shot?.textContent).toContain(t('ui.guardTitle'));
  });

  it('draws the permissions row with the same pill the editor shows', async () => {
    const el = await mount();
    const shot = el.renderRoot.querySelector('[data-shot="permissions"]');
    expect(shot?.querySelector('ok-status-pill')?.getAttribute('label')).toBe(
      t('ui.grantsMissing'),
    );
  });

  it('draws the history row with an outcome the owner can read', async () => {
    const el = await mount();
    expect(el.renderRoot.querySelector('[data-shot="history"]')).toBeTruthy();
  });
});

describe('the guide talks like a shop owner', () => {
  beforeEach(() => document.body.replaceChildren());

  // The exact complaint in pm#134: what exists today is «notas para quien toca el código». If any
  // of these words reach the screen, the guide has drifted back into a README.
  it('keeps developer vocabulary off the screen', async () => {
    const el = await mount();
    const shown = text(el).toLowerCase();
    for (const word of ['json', 'cron', 'webhook', 'endpoint', 'payload', 'schema', 'api']) {
      expect(shown, word).not.toContain(word);
    }
    expect(shown).not.toContain('{{');
  });

  it('is written in English and translated whole into Spanish', async () => {
    const keys = Object.keys((en as { guide: Record<string, string> }).guide);
    expect(keys.length).toBeGreaterThan(10);
    for (const key of keys) {
      expect(lookup(es, `guide.${key}`), key).toBeTruthy();
    }
  });
});

describe('the way back', () => {
  beforeEach(() => document.body.replaceChildren());

  it('is a button, because a guide you cannot leave is a trap', async () => {
    const el = await mount();
    const seen: Event[] = [];
    el.addEventListener('flows-guide-close', (e) => seen.push(e));
    (el.renderRoot.querySelector('[data-act="back"]') as HTMLElement)?.click();
    expect(seen).toHaveLength(1);
  });
});
