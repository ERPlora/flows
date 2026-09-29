import { describe, it, expect, beforeEach, vi } from 'vitest';
import './erp-flows-editor';
import { ErpFlowsEditor } from './erp-flows-editor';

/**
 * **On a phone, the automation's detail cuts none of its words** (flows#142).
 *
 * Three cuts, seen in a real browser at 360 and 390 px with the Spanish catalogue:
 *
 * 1. The tab strip was 347 px wide in a 328 px box: «Historial» sat 9 % under the edge with
 *    nothing saying the strip went on, so it read as another word.
 * 2. On a granted permission, «Límites» and «Retirar» broke into «Lím / ites» and «Reti / rar»:
 *    the two buttons shrank to their 2.6rem floor and the shell's inherited `overflow-wrap`
 *    split them.
 * 3. The name in the header was cut mid-letter — «Apuntar las visitas grande» — with no ellipsis
 *    and no way to read it whole short of editing it.
 *
 * happy-dom does no layout (same caveat as `erp-flows-editor.guard-row.test.ts`), so this file
 * fixes the CONTRACT that makes the real-browser geometry true, and the one behaviour that is
 * code: the strip brings the chosen tab into view. The geometry itself is measured in the PR at
 * 320, 360, 390, 834 and 1440, `ios` and `md`.
 */

const CMD = 'appointments.appointments.cancel';
const LONG = 'Apuntar las visitas grandes en la libreta de clientes habituales';

function fakeClient() {
  return {
    flows: {
      list: vi.fn(async () => []),
      create: vi.fn(async (f: unknown) => ({ id: 'new', ...(f as object) })),
      update: vi.fn(async (id: string, f: unknown) => ({ id, ...(f as object) })),
      remove: vi.fn(async () => ({})),
      grants: vi.fn(async () => [{ id: 'g1', kind: 'command', value: CMD }]),
      replaceGrants: vi.fn(async (_id: string, g: unknown) => g),
      run: vi.fn(async () => ({})),
      runs: vi.fn(async () => []),
      getRun: vi.fn(async () => ({ run: {}, steps: [], events: [] })),
      schema: vi.fn(async () => ({ schema_version: 1, core_version: '1.0.2', schema: {} })),
      secrets: vi.fn(async () => []),
      approvals: vi.fn(async () => []),
    },
    events: {
      shape: vi.fn(async () => ({ event_name: 'x', declared_by: ['x'], samples: 0, fields: [] })),
      list: vi.fn(async () => []),
    },
  };
}

async function settle(el: ErpFlowsEditor): Promise<void> {
  await el.updateComplete;
  for (let i = 0; i < 4; i += 1) await Promise.resolve();
  await el.updateComplete;
}

async function mount(): Promise<ErpFlowsEditor> {
  const el = document.createElement('erp-flows-editor') as ErpFlowsEditor;
  el.client = fakeClient() as never;
  el.t = ((k: string) => k) as never;
  el.flow = {
    id: 'f1',
    name: LONG,
    enabled: false,
    definition: { schema_version: 1, triggers: [{ kind: 'manual' }], steps: [{ id: 'a', kind: 'command', command: CMD }] },
  } as never;
  document.body.appendChild(el);
  await settle(el);
  return el;
}

const CSS = (): string => (ErpFlowsEditor.styles as { cssText: string }).cssText;

type Rule = { media: string | null; selectors: string[]; decls: [string, string][] };

/**
 * Every rule of the static stylesheet, in source order, with the @media it sits in. Reading only
 * the first block of a selector let a later rule — or the phone block moved above the base one —
 * undo the fix with this file still green (the rv-kitchen-132 lesson).
 */
const rules = (): Rule[] => {
  const css = CSS().replace(/\/\*[\s\S]*?\*\//g, '');
  const out: Rule[] = [];
  const read = (body: string, media: string | null): void => {
    let i = 0;
    while (i < body.length) {
      const open = body.indexOf('{', i);
      if (open < 0) return;
      const head = body.slice(i, open).trim();
      if (head.startsWith('@')) {
        let depth = 1;
        let j = open + 1;
        for (; j < body.length && depth > 0; j += 1) {
          if (body[j] === '{') depth += 1;
          else if (body[j] === '}') depth -= 1;
        }
        read(body.slice(open + 1, j - 1), head);
        i = j;
        continue;
      }
      const close = body.indexOf('}', open);
      const decls = body
        .slice(open + 1, close)
        .split(';')
        .map((d) => d.trim())
        .filter(Boolean)
        .map((d) => {
          const at = d.indexOf(':');
          return [d.slice(0, at).trim(), d.slice(at + 1).trim().replace(/\s+/g, ' ')] as [string, string];
        });
      out.push({ media, selectors: head.split(',').map((s) => s.trim().replace(/\s+/g, ' ')), decls });
      i = close + 1;
    }
  };
  read(css, null);
  return out;
};

/** Does this @media apply at a viewport this wide? Anything other than min/max-width counts as yes. */
const applies = (media: string | null, width: number): boolean => {
  if (!media) return true;
  const min = media.match(/min-width:\s*([\d.]+)px/);
  const max = media.match(/max-width:\s*([\d.]+)px/);
  return (!min || width >= Number(min[1])) && (!max || width <= Number(max[1]));
};

/** Shorthands and longhands that would silently override the property under test. */
const RIVALS: Record<string, string[]> = {
  padding: ['padding-left', 'padding-right', 'padding-inline', 'padding-inline-start', 'padding-inline-end'],
  'background-color': ['background'],
  'background-image': ['background'],
  'background-attachment': ['background'],
  'flex-wrap': ['flex-flow'],
  flex: ['flex-grow', 'flex-shrink', 'flex-basis'],
  'margin-left': ['margin', 'margin-inline', 'margin-inline-start'],
};

/**
 * The value that WINS for `prop` on exactly `selector` at a viewport `width` px wide: the last
 * declaration across the whole sheet (an `!important` one beats any later plain one). A rival
 * shorthand/longhand declared later is returned as `<rival: value>` so that no assertion passes.
 */
const effective = (selector: string, prop: string, width: number): string | undefined => {
  let plain: string | undefined;
  let important: string | undefined;
  for (const r of rules()) {
    if (!r.selectors.includes(selector) || !applies(r.media, width)) continue;
    for (const [name, raw] of r.decls) {
      if (name !== prop && !(RIVALS[prop] ?? []).includes(name)) continue;
      const imp = /!important$/.test(raw);
      const v = raw.replace(/\s*!important$/, '');
      const shown = name === prop ? v : `<${name}: ${v}>`;
      if (imp) important = shown;
      else plain = shown;
    }
  }
  return important ?? plain;
};

/** The rule must hold on a phone and on a desktop alike. */
const everywhere = (selector: string, prop: string): string[] =>
  [320, 360, 390, 834, 1440].map((w) => effective(selector, prop, w) ?? `<unset at ${w}>`);

const rect = (left: number, right: number): DOMRect =>
  ({ left, right, top: 0, bottom: 44, width: right - left, height: 44, x: left, y: 0 }) as DOMRect;

describe('the tab strip fits a phone and keeps the chosen tab on screen (flows#142)', () => {
  beforeEach(() => document.body.replaceChildren());

  it('tightens the tabs on a phone so the four fit a 360 px screen', () => {
    // 0.7rem a side is 89.6 px of padding across four tabs; 0.5rem gives back the 25 px that
    // «Historial» was missing at 360.
    for (const w of [320, 360, 390]) expect(effective('.tabs button', 'padding', w)).toBe('0.6rem 0.5rem');
    // and on a desktop they keep their room.
    for (const w of [560, 834, 1440]) expect(effective('.tabs button', 'padding', w)).toBe('0.6rem 0.7rem');
  });

  it('shows that the strip goes on when it does not fit, and nothing when it does', () => {
    // Scrolling shadows (the covers ride with the content, the shadows stay with the box): at
    // rest at the start the left cover hides the left shadow, and a strip that fits has both
    // shadows covered — no JavaScript to fall out of step with the layout.
    expect(everywhere('.tabs', 'overflow-x')).toEqual(Array(5).fill('auto'));
    expect(everywhere('.tabs', 'background-attachment')).toEqual(Array(5).fill('local, local, scroll, scroll'));
  });

  it('paints the covers in the very colour of the strip, so a strip that fits shows no band', () => {
    // Measured on the bench: covers in --ok-bg (unset in the shell, so Ionic's #f6f7f9 page grey)
    // over the #fff card left a grey band at each end of a strip that FITS. The strip carries the
    // card's colour itself and the covers repeat it, whatever card it sits on.
    const surface = 'var(--ok-surface, var(--ion-card-background, #fff))';
    expect(everywhere('.tabs', 'background-color')).toEqual(Array(5).fill(surface));
    for (const image of everywhere('.tabs', 'background-image')) {
      const covers = image.match(/linear-gradient\(.*?\)\s*30%/g) ?? [];
      expect(covers.length, 'the two covers are not linear gradients any more').toBe(2);
      for (const cover of covers) expect(cover).toContain(surface);
      expect(image).not.toContain('--ok-bg');
      // The shadows are drawn in the text colour, so they read on a dark card as on a light one.
      expect(image.match(/radial-gradient\([^)]*?currentColor/g)?.length).toBe(2);
    }
  });

  it('scrolls the strip so a tab chosen past the right edge is whole', async () => {
    const el = await mount();
    const strip = el.renderRoot.querySelector('.tabs') as HTMLElement;
    const history = el.renderRoot.querySelector('#tab-history') as HTMLElement;
    strip.getBoundingClientRect = () => rect(0, 328);
    history.getBoundingClientRect = () => rect(300, 380);
    strip.scrollLeft = 0;
    history.click();
    await settle(el);
    expect(history.getAttribute('aria-selected')).toBe('true');
    expect(strip.scrollLeft).toBe(52);
  });

  it('scrolls back when the chosen tab is past the left edge', async () => {
    const el = await mount();
    el.tab = 'history' as never;
    await settle(el);
    const strip = el.renderRoot.querySelector('.tabs') as HTMLElement;
    const steps = el.renderRoot.querySelector('#tab-editor') as HTMLElement;
    strip.getBoundingClientRect = () => rect(0, 328);
    steps.getBoundingClientRect = () => rect(-30, 40);
    strip.scrollLeft = 60;
    steps.click();
    await settle(el);
    expect(strip.scrollLeft).toBe(30);
  });

  it('leaves the strip alone when the chosen tab is already whole', async () => {
    const el = await mount();
    const strip = el.renderRoot.querySelector('.tabs') as HTMLElement;
    const test = el.renderRoot.querySelector('#tab-test') as HTMLElement;
    strip.getBoundingClientRect = () => rect(0, 328);
    test.getBoundingClientRect = () => rect(80, 160);
    strip.scrollLeft = 7;
    test.click();
    await settle(el);
    expect(strip.scrollLeft).toBe(7);
  });
});

describe('a granted permission keeps its buttons in whole words (flows#142)', () => {
  beforeEach(() => document.body.replaceChildren());

  it('holds «Limits» and «Remove» together in one block beside the permission', async () => {
    const el = await mount();
    el.tab = 'permissions' as never;
    await settle(el);
    const row = el.renderRoot.querySelector(`[data-grant="command ${CMD}"] .grant`) as HTMLElement;
    expect(row, 'no granted row on screen — this test is looking at the wrong thing').toBeTruthy();
    const actions = row.querySelector(':scope > .grant-actions') as HTMLElement;
    expect(actions, 'the two buttons are loose flex items that shrink on their own').toBeTruthy();
    const acts = [...actions.querySelectorAll('button')].map((b) => b.getAttribute('data-act'));
    expect(acts).toEqual(['limits', 'revoke']);
    // Their text, not only their testids: an empty button would pass the rest of this file.
    expect(actions.textContent).toContain('ui.grantLimits');
    expect(actions.textContent).toContain('ui.revoke');
  });

  it('never shrinks or breaks the buttons: the row wraps them under the permission instead', () => {
    expect(everywhere('.grant', 'flex-wrap')).toEqual(Array(5).fill('wrap'));
    expect(everywhere('.grant-actions', 'flex')).toEqual(Array(5).fill('0 0 auto'));
    expect(everywhere('.grant-actions', 'margin-left')).toEqual(Array(5).fill('auto'));
    expect(everywhere('.grant-actions button', 'white-space')).toEqual(Array(5).fill('nowrap'));
    // The permission's name keeps a basis, or it collapses to nothing before the buttons wrap.
    for (const flex of everywhere('.grant .grow', 'flex')) expect(flex).toMatch(/^1 1 \d+(\.\d+)?rem$/);
  });
});

describe('the name in the header says when it goes on (flows#142)', () => {
  beforeEach(() => document.body.replaceChildren());

  it('ends a name that does not fit with an ellipsis', () => {
    // An <input> already clips and never wraps, so the ellipsis is the one declaration it needs.
    expect(everywhere('.head .name', 'text-overflow')).toEqual(Array(5).fill('ellipsis'));
  });

  it('carries the whole name for whoever cannot see the end of it, and follows the edits', async () => {
    const el = await mount();
    const input = el.renderRoot.querySelector('[data-testid="flows-editor-name"]') as HTMLInputElement;
    expect(input.getAttribute('title')).toBe(LONG);
    input.value = 'Otra cosa';
    input.dispatchEvent(new Event('input', { bubbles: true }));
    await settle(el);
    expect(input.getAttribute('title')).toBe('Otra cosa');
  });

  it('puts no empty tooltip on a flow without a name yet', async () => {
    const el = await mount();
    const input = el.renderRoot.querySelector('[data-testid="flows-editor-name"]') as HTMLInputElement;
    input.value = '';
    input.dispatchEvent(new Event('input', { bubbles: true }));
    await settle(el);
    expect(input.hasAttribute('title')).toBe(false);
  });
});
