import { describe, it, expect, beforeEach, vi } from 'vitest';
import './erp-flows-editor';
import type { ErpFlowsEditor } from './erp-flows-editor';

/**
 * **Every control on the editor, driven the way a person drives it** (flows#17).
 *
 * The QA pass that opened flows#17 reported the tabs, the top «Try it» button and the step cards
 * as visible but dead. Nothing in this repository could confirm or deny that, and it is worth
 * being precise about WHY: every test that touched those controls reached for the component —
 * `el.open(id)`, `el.tab = 'history'`, `el.use()` — so the whole of the wiring between a click and
 * that state change was, by construction, untested. A suite like that stays green while the
 * screen is a photograph.
 *
 * So the rule here, and the reason this file is separate: **nothing calls a method or assigns a
 * property on the component.** A control is found in the shadow root, a real `click` or `keydown`
 * is dispatched on it, and the assertion is on what the owner would then SEE. If the wiring ever
 * goes, this file is what turns red.
 *
 * The pointer/cross-browser half of the matrix (Chromium and WebKit, three viewports, a real mouse
 * at real coordinates) does not belong here — the module gate has no browser and no hub. It lives
 * with the hub's own e2e suite, where a real shell exists to mount this module into.
 */

const SHAPE = {
  event_name: 'sale.completed',
  declared_by: ['sales'],
  samples: 4,
  fields: [
    { path: 'total', type: 'string', sample: '42.50', redacted: false, truncated: false, seen_in: 4 },
  ],
};

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
      shape: vi.fn(async () => SHAPE),
      list: vi.fn(async () => [{ name: 'sale.completed', declared_by: ['sales'] }]),
    },
  };
}

async function mount(steps: unknown[]): Promise<ErpFlowsEditor> {
  const el = document.createElement('erp-flows-editor') as ErpFlowsEditor;
  el.client = fakeClient() as never;
  el.t = ((k: string) => k) as never;
  el.flow = {
    id: 'f1',
    name: 'Test',
    enabled: false,
    definition: { schema_version: 1, triggers: [{ kind: 'event', event: 'sale.completed' }], steps },
  } as never;
  document.body.appendChild(el);
  await el.updateComplete;
  for (let i = 0; i < 4; i += 1) await Promise.resolve();
  await el.updateComplete;
  return el;
}

/** A click as the browser delivers one: bubbling, and crossing the shadow boundary. */
async function click(el: ErpFlowsEditor, target: Element | null | undefined): Promise<void> {
  expect(target, 'the control is not on the screen at all').toBeTruthy();
  target!.dispatchEvent(new MouseEvent('click', { bubbles: true, composed: true, cancelable: true }));
  await el.updateComplete;
  for (let i = 0; i < 4; i += 1) await Promise.resolve();
  await el.updateComplete;
}

async function press(el: ErpFlowsEditor, target: Element | null | undefined, key: string): Promise<void> {
  expect(target, 'the control is not on the screen at all').toBeTruthy();
  target!.dispatchEvent(new KeyboardEvent('keydown', { key, bubbles: true, composed: true, cancelable: true }));
  await el.updateComplete;
  for (let i = 0; i < 4; i += 1) await Promise.resolve();
  await el.updateComplete;
}

const tabs = (el: ErpFlowsEditor): HTMLElement[] =>
  [...el.renderRoot.querySelectorAll('[role="tab"]')] as HTMLElement[];
const selected = (el: ErpFlowsEditor): string =>
  tabs(el).find((t) => t.getAttribute('aria-selected') === 'true')?.textContent?.trim() ?? '';

const STEPS = [
  { id: 'guard', kind: 'condition', when: [{ path: 'input.total', op: 'gt', value: 100 }] },
  { id: 'wait', kind: 'delay', seconds: 3600 },
  { id: 'note', kind: 'command', command: 'customers.notes.add', params: { text: 'hi' } },
];

describe('the tabs answer a click, and say which one is showing', () => {
  beforeEach(() => document.body.replaceChildren());

  it('shows every tab the editor has, with one selected', async () => {
    const el = await mount(STEPS);
    // The control that stops the rest of this file passing on an empty set: four tabs, or the
    // queries below are asserting about nothing.
    expect(tabs(el).map((t) => t.textContent?.trim())).toEqual([
      'ui.tabEditor',
      'ui.tabTest',
      'ui.tabPermissions',
      'ui.tabHistory',
    ]);
    expect(selected(el)).toBe('ui.tabEditor');
  });

  it('changes the panel when each one is CLICKED, not when the property is set', async () => {
    const el = await mount(STEPS);
    for (const [index, name] of ['ui.tabTest', 'ui.tabPermissions', 'ui.tabHistory'].entries()) {
      await click(el, tabs(el)[index + 1]);
      expect(selected(el), name).toBe(name);
    }
    // …and back, because a tab bar you can only go forwards through is not a tab bar.
    await click(el, tabs(el)[0]);
    expect(selected(el)).toBe('ui.tabEditor');
  });

  /**
   * The panel is what the tab is ABOUT, and a tab that does not say so leaves somebody on a
   * screen reader listening to a tab strip with no idea what changed underneath it. WAI-ARIA's
   * tabs pattern: `aria-controls` on the tab, `role="tabpanel"` + `aria-labelledby` on the panel.
   */
  it('points at the panel it controls, and the panel points back', async () => {
    const el = await mount(STEPS);
    for (const tab of tabs(el)) {
      expect(tab.id, 'a tab with no id cannot be pointed at').toBeTruthy();
      expect(tab.getAttribute('aria-controls')).toBeTruthy();
    }
    const panel = el.renderRoot.querySelector('[role="tabpanel"]');
    expect(panel).toBeTruthy();
    const current = tabs(el).find((t) => t.getAttribute('aria-selected') === 'true')!;
    expect(panel!.getAttribute('aria-labelledby')).toBe(current.id);
    expect(current.getAttribute('aria-controls')).toBe(panel!.id);
  });

  /**
   * A tab strip is ONE stop on the tab key, and the arrows move between the tabs. Four separate
   * tab stops is the thing the pattern exists to prevent, and it is the difference between
   * reaching the history in one key press and in five.
   */
  it('is one stop for the tab key, and the arrows move along it', async () => {
    const el = await mount(STEPS);
    expect(tabs(el).map((t) => t.getAttribute('tabindex'))).toEqual(['0', '-1', '-1', '-1']);

    await press(el, tabs(el)[0], 'ArrowRight');
    expect(selected(el)).toBe('ui.tabTest');
    expect(tabs(el).map((t) => t.getAttribute('tabindex'))).toEqual(['-1', '0', '-1', '-1']);

    await press(el, tabs(el)[1], 'ArrowLeft');
    expect(selected(el)).toBe('ui.tabEditor');

    // Wrapping round is the pattern's own answer to «what is left of the first one».
    await press(el, tabs(el)[0], 'ArrowLeft');
    expect(selected(el)).toBe('ui.tabHistory');

    await press(el, tabs(el)[3], 'Home');
    expect(selected(el)).toBe('ui.tabEditor');
    await press(el, tabs(el)[0], 'End');
    expect(selected(el)).toBe('ui.tabHistory');
  });
});

describe('the top «Try it» button', () => {
  beforeEach(() => document.body.replaceChildren());

  // It sits next to the switch on purpose: it is the thing to press BEFORE turning an automation
  // on. If the click does not reach the tab, the button is decoration next to the one control that
  // does something irreversible.
  it('takes a click and lands on the test panel', async () => {
    const el = await mount(STEPS);
    expect(selected(el)).toBe('ui.tabEditor');
    await click(el, el.renderRoot.querySelector('[data-act="test"]'));
    expect(selected(el)).toBe('ui.tabTest');
  });
});

describe('every step opens its own configuration when it is clicked', () => {
  beforeEach(() => document.body.replaceChildren());

  // One case per SHAPE the spine draws, because they are three different templates: the plain
  // card, the guard chip and the delay chip. The chips were the two with no accessible open state.
  it.each([
    ['a command card', 'note'],
    ['a guard chip', 'guard'],
    ['a delay chip', 'wait'],
  ])('%s', async (_what, id) => {
    const el = await mount(STEPS);
    const node = el.renderRoot.querySelector(`[data-node="${id}"]`)!;
    expect(node.querySelector('.panel'), 'it starts shut').toBeNull();

    const opener = node.querySelector('button.open');
    expect(opener?.getAttribute('aria-expanded'), 'shut, and it says so').toBe('false');

    await click(el, opener);
    expect(node.querySelector('.panel'), 'a click opens the configuration').toBeTruthy();
    expect(
      el.renderRoot.querySelector(`[data-node="${id}"] button.open`)?.getAttribute('aria-expanded'),
    ).toBe('true');

    await click(el, el.renderRoot.querySelector(`[data-node="${id}"] button.open`));
    expect(el.renderRoot.querySelector(`[data-node="${id}"] .panel`), 'and shuts it again').toBeNull();
  });

  it('opens the trigger the same way', async () => {
    const el = await mount(STEPS);
    const node = el.renderRoot.querySelector('[data-node="trigger"]')!;
    await click(el, node.querySelector('button.open'));
    expect(el.renderRoot.querySelector('[data-node="trigger"] .panel')).toBeTruthy();
  });
});

describe('the way back', () => {
  beforeEach(() => document.body.replaceChildren());

  it('is a click on the arrow, and it tells the screen that owns the list', async () => {
    const el = await mount(STEPS);
    const seen: Event[] = [];
    el.addEventListener('flows-back', (e) => seen.push(e));
    await click(el, el.renderRoot.querySelector('.head button.icon-btn'));
    expect(seen).toHaveLength(1);
  });
});

/**
 * **The history, read by somebody who was not there when it happened** (flows#20).
 *
 * Driven the same way as everything else in this file: the tab is CLICKED, never assigned.
 */
describe('a run that stopped on a problem', () => {
  beforeEach(() => document.body.replaceChildren());

  const failing = (lastError: string) => {
    const client = fakeClient();
    client.flows.runs = vi.fn(async () => [
      { id: 'r1', status: 'failed', started_at: '2026-08-14T10:00:00Z', last_error: lastError },
      { id: 'r2', status: 'done', started_at: '2026-08-14T11:00:00Z' },
    ]) as never;
    return client;
  };

  async function openHistory(client: ReturnType<typeof fakeClient>): Promise<ErpFlowsEditor> {
    const el = document.createElement('erp-flows-editor') as ErpFlowsEditor;
    el.client = client as never;
    el.t = ((k: string) => k) as never;
    el.flow = {
      id: 'f1',
      name: 'Test',
      enabled: false,
      definition: { schema_version: 1, triggers: [{ kind: 'manual' }], steps: STEPS },
    } as never;
    document.body.appendChild(el);
    await el.updateComplete;
    for (let i = 0; i < 6; i += 1) await Promise.resolve();
    await el.updateComplete;
    await click(el, tabs(el)[3]);
    for (let i = 0; i < 6; i += 1) await Promise.resolve();
    await el.updateComplete;
    return el;
  }

  // A failure four rows down a list ordered by time is a failure nobody sees: the runs that worked
  // are the majority and they push it off the screen.
  it('is lifted out of the list, above the ones that worked', async () => {
    const el = await openHistory(failing('step s2 failed: flow.grant_denied'));
    const attention = el.renderRoot.querySelector('[data-attention]');
    expect(attention, 'nothing was lifted out').toBeTruthy();
    expect(attention!.querySelectorAll('[data-run]')).toHaveLength(1);
    expect(attention!.querySelector('[data-run]')?.getAttribute('data-run')).toBe('r1');
    // And the healthy one is NOT in there, or the heading is a lie.
    expect(el.renderRoot.querySelectorAll('[data-run]')).toHaveLength(2);
  });

  it('says what to do about it, and keeps the code out of the headline', async () => {
    const el = await openHistory(failing('step s2 failed: flow.grant_denied'));
    const trouble = el.renderRoot.querySelector('[data-trouble]')!;
    expect(trouble.getAttribute('data-trouble')).toBe('permission');
    expect(trouble.querySelector('.why')?.textContent?.trim()).toBe('ui.troublePermission');
    expect(trouble.querySelector('.do')?.textContent?.trim()).toBe('ui.troubleDoPermission');
    // The kernel's own words survive — behind a fold, because support asks for them and the owner
    // does not.
    expect(trouble.querySelector('details code')?.textContent).toContain('flow.grant_denied');
  });

  it('leaves a module’s own refusal as the headline, because that one IS the answer', async () => {
    const el = await openHistory(failing('customers.notes.add: customer 8f2 does not exist'));
    const trouble = el.renderRoot.querySelector('[data-trouble]')!;
    expect(trouble.getAttribute('data-trouble')).toBe('unknown');
    expect(trouble.querySelector('.why')?.textContent).toContain('ui.ranFailed');
    expect(trouble.querySelector('details')).toBeNull();
  });

  it('offers the reference, because reading a uuid down a telephone is not a support channel', async () => {
    const el = await openHistory(failing('flow.grant_denied'));
    expect(el.renderRoot.querySelector('[data-run="r1"] [data-act="copy-run"]')).toBeTruthy();
  });

  it('shows nothing lifted out when every run worked', async () => {
    const client = fakeClient();
    client.flows.runs = vi.fn(async () => [{ id: 'r2', status: 'done' }]) as never;
    const el = await openHistory(client);
    expect(el.renderRoot.querySelector('[data-attention]')).toBeNull();
    expect(el.renderRoot.querySelectorAll('[data-run]')).toHaveLength(1);
  });
});
