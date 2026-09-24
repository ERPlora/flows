import { describe, it, expect, beforeEach, vi } from 'vitest';
import './erp-flows-editor';
import { ErpFlowsEditor } from './erp-flows-editor';
import { ErpFlowsValue } from '../erp-flows-value/erp-flows-value';

/**
 * **A note under «Value» does not push «Field» and «Is» down the row** (flows#121).
 *
 * The complaint: in a «Only continue if» condition, the moment the Value column carries a line
 * under its control — the «one of» hint, «the list could not be read» with its «Try again», «no
 * automation sends a WhatsApp yet» — the other two cells sank to the bottom of the row, so the
 * «Field» label sat lower than the «Value» label and the row read as broken. The row aligned its
 * cells by the END; a cell that grows then drags every other cell with it.
 *
 * happy-dom does no layout (same caveat as the width contract in `erp-flows-gallery.test.ts`), so
 * what this file fixes is the CONTRACT that makes the real-browser geometry true — measured at
 * 390, 834 and 1280 in the PR: the cells hang from the top, and the remove button sits under a
 * label-high spacer so it still lines up with the controls, not with the labels.
 */

function fakeClient() {
  return {
    flows: {
      list: vi.fn(async () => []),
      create: vi.fn(async (f: unknown) => ({ id: 'new', ...(f as object) })),
      update: vi.fn(async (id: string, f: unknown) => ({ id, ...(f as object) })),
      remove: vi.fn(async () => ({})),
      grants: vi.fn(async () => []),
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

/** The editor with its one condition step open — the row this file is about is on screen. */
async function mountGuard(when: Record<string, unknown>): Promise<ErpFlowsEditor> {
  const el = document.createElement('erp-flows-editor') as ErpFlowsEditor;
  el.client = fakeClient() as never;
  el.t = ((k: string) => k) as never;
  el.flow = {
    id: 'f-guard',
    name: 'Guard',
    enabled: false,
    definition: {
      schema_version: 1,
      triggers: [{ kind: 'event', event: 'sale.completed' }],
      steps: [{ id: 'g', kind: 'condition', when }],
    },
  } as never;
  document.body.appendChild(el);
  await settle(el);
  (el.renderRoot.querySelector('[data-node="g"] button.open') as HTMLButtonElement).click();
  await settle(el);
  return el;
}

/** One rule block of the component's static stylesheet, by its exact selector. */
const rule = (selector: string): string => {
  const css = (ErpFlowsEditor.styles as { cssText: string }).cssText;
  const at = css.indexOf(`\n    ${selector} {`);
  expect(at, `${selector} is not in the stylesheet at all`).toBeGreaterThanOrEqual(0);
  return css.slice(at, css.indexOf('}', at));
};

describe('the cells of a condition row hang from the top (flows#121)', () => {
  beforeEach(() => document.body.replaceChildren());

  it('aligns the row by the top, so a note under one control drags no other cell', () => {
    const row = rule('.guard-row');
    expect(row).toContain('align-items: start');
    expect(row).not.toContain('align-items: end');
  });

  it('puts the remove button under a label-high spacer, level with the controls', async () => {
    const el = await mountGuard({ 'trigger.total': { in: ['a', 'b'] } });
    const row = el.renderRoot.querySelector('.guard-row')!;
    expect(row, 'no condition row on screen — this test is looking at the wrong thing').toBeTruthy();
    // The case the complaint is about: Value carries its note.
    expect(row.querySelector('.hint'), 'the «one of» hint is not under Value').toBeTruthy();
    const remove = row.querySelector('button.icon-btn')!;
    const cell = remove.parentElement!;
    expect(cell.parentElement, 'the remove button is a bare grid item, not a cell of the row').toBe(row);
    const spacer = cell.firstElementChild as HTMLElement;
    expect(spacer.classList.contains('label-spacer')).toBe(true);
    // It stands in for a label; it is not one — a screen reader hears nothing there.
    expect(spacer.getAttribute('aria-hidden')).toBe('true');
    expect(spacer.nextElementSibling).toBe(remove);
  });

  it('gives the spacer the label’s own height, and none on a phone where the row is one column', () => {
    const label = rule('.field > label');
    const spacer = rule('.label-spacer');
    expect(spacer).toContain('font-size: 0.78rem');
    expect(label).toContain('font-size: 0.78rem');
    expect(spacer).toContain('display: none');
    const css = (ErpFlowsEditor.styles as { cssText: string }).cssText;
    const wide = css.slice(css.indexOf('@media (min-width: 560px) {\n      .guard-row'));
    expect(wide.slice(0, wide.indexOf('\n    }\n'))).toMatch(/\.guard-row \.label-spacer \{\s*display: block;/);
  });

  /**
   * The Field cell keeps an `erp-flows-value` with `hidden` — it only exists to open the shared
   * picker. `:host { display: block }` beats the `hidden` attribute (an author rule over the UA
   * one, and the shell's global `[hidden]` does not cross this shadow root), so the box painted
   * its chips and its «+» under Field anyway: a second, taller copy of the field that made that
   * cell the tallest in the row. Seen in a real browser while measuring flows#121.
   */
  it('keeps the helper box under Field hidden when it says so', async () => {
    const css = (ErpFlowsValue.styles as { cssText: string }).cssText;
    expect(css).toMatch(/:host\(\[hidden\]\)\s*\{\s*display: none;/);
    const el = await mountGuard({ 'trigger.total': { eq: '1' } });
    const helper = el.renderRoot.querySelector('.guard-row erp-flows-value');
    expect(helper, 'no helper box in the row — this test is looking at the wrong thing').toBeTruthy();
    expect(helper!.hasAttribute('hidden')).toBe(true);
  });
});
