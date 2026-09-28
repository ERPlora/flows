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

/** One rule block of the component's static stylesheet, by its exact selector, outside any @media. */
const rule = (selector: string): string => {
  const css = CSS();
  const at = css.indexOf(`\n    ${selector} {`);
  expect(at, `${selector} is not in the stylesheet at all`).toBeGreaterThanOrEqual(0);
  return css.slice(at, css.indexOf('}', at));
};

/** The body of the phone-width media block (the one that only applies under 560 px). */
const phone = (): string => {
  const css = CSS();
  const at = css.indexOf('@media (max-width: 559.98px) {');
  expect(at, 'there is no phone-width block in the stylesheet').toBeGreaterThanOrEqual(0);
  return css.slice(at, css.indexOf('\n    }\n', at));
};

const rect = (left: number, right: number): DOMRect =>
  ({ left, right, top: 0, bottom: 44, width: right - left, height: 44, x: left, y: 0 }) as DOMRect;

describe('the tab strip fits a phone and keeps the chosen tab on screen (flows#142)', () => {
  beforeEach(() => document.body.replaceChildren());

  it('tightens the tabs on a phone so the four fit a 360 px screen', () => {
    // 0.7rem a side is 89.6 px of padding across four tabs; 0.5rem gives back the 25 px that
    // «Historial» was missing at 360.
    const body = phone();
    expect(body).toMatch(/\.tabs button \{\s*padding: 0\.6rem 0\.5rem;/);
    // and on a desktop they keep their room.
    expect(rule('.tabs button')).toContain('padding: 0.6rem 0.7rem');
  });

  it('shows that the strip goes on when it does not fit, and nothing when it does', () => {
    // Scrolling shadows (the covers ride with the content, the shadows stay with the box): at
    // rest at the start the left cover hides the left shadow, and a strip that fits has both
    // shadows covered — no JavaScript to fall out of step with the layout.
    const tabs = rule('.tabs');
    expect(tabs).toContain('overflow-x: auto');
    expect(tabs).toMatch(/background-attachment:\s*local,\s*local,\s*scroll,\s*scroll/);
  });

  it('paints the covers in the very colour of the strip, so a strip that fits shows no band', () => {
    // Measured on the bench: covers in --ok-bg (unset in the shell, so Ionic's #f6f7f9 page grey)
    // over the #fff card left a grey band at each end of a strip that FITS. The strip carries the
    // card's colour itself and the covers repeat it, whatever card it sits on.
    const tabs = rule('.tabs');
    const surface = 'var(--ok-surface, var(--ion-card-background, #fff))';
    expect(tabs).toContain(`background-color: ${surface}`);
    const covers = tabs.match(/linear-gradient\([^;]*?\)\s*30%/g) ?? [];
    expect(covers.length, 'the two covers are not linear gradients any more').toBe(2);
    for (const cover of covers) expect(cover).toContain(surface);
    expect(tabs).not.toContain('--ok-bg');
    // The shadows are drawn in the text colour, so they read on a dark card as on a light one.
    expect(tabs.match(/radial-gradient\([^;]*?currentColor/g)?.length).toBe(2);
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
    expect(rule('.grant')).toContain('flex-wrap: wrap');
    const actions = rule('.grant-actions');
    expect(actions).toContain('flex: 0 0 auto');
    expect(actions).toContain('margin-left: auto');
    expect(rule('.grant-actions button')).toContain('white-space: nowrap');
    // The permission's name keeps a basis, or it collapses to nothing before the buttons wrap.
    expect(rule('.grant .grow')).toMatch(/flex: 1 1 \d+(\.\d+)?rem/);
  });
});

describe('the name in the header says when it goes on (flows#142)', () => {
  beforeEach(() => document.body.replaceChildren());

  it('ends a name that does not fit with an ellipsis', () => {
    // An <input> already clips and never wraps, so the ellipsis is the one declaration it needs.
    expect(rule('.head .name')).toContain('text-overflow: ellipsis');
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
