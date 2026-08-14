import { describe, it, expect, beforeEach, vi } from 'vitest';
import './erp-flows-app';
import type { ErpFlowsApp } from './erp-flows-app';

/**
 * **The list as an operating console** (flows#19).
 *
 * Twenty automations was already enough to need reading row by row; the hub this was measured on
 * had exactly twenty. Everything below is driven the way flows#17 established: a control is found
 * in the shadow root and a real event is dispatched on it — no method is called, no property is
 * assigned.
 */

const doc = (trigger: unknown, steps: unknown[] = []) => ({
  schema_version: 1,
  triggers: [trigger],
  steps,
});

const FLOWS = [
  {
    id: 'f1',
    name: 'Aviso de stock bajo',
    enabled: true,
    updated_at: '2026-08-14T10:00:00Z',
    definition: doc({ kind: 'event', event: 'inventory.stock_changed' }, [
      { id: 'a', kind: 'command', command: 'tasks.tasks.create' },
    ]),
  },
  {
    id: 'f2',
    name: 'Resumen del viernes',
    enabled: true,
    updated_at: '2026-08-10T10:00:00Z',
    definition: doc({ kind: 'cron', cron: '0 18 * * 5' }),
  },
  {
    id: 'f3',
    name: 'Nota en ventas grandes',
    enabled: false,
    updated_at: '2026-08-12T10:00:00Z',
    definition: doc({ kind: 'event', event: 'sales.sale.completed' }, [
      { id: 'n', kind: 'command', command: 'customers.notes.add' },
    ]),
  },
];

/**
 * The shell's translator, doing what the shell's really does: look the key up in the module's own
 * catalogue and put the parameters in. A fake that returned the bare key would leave every
 * assertion about «3 of 20» or «Copy of X» passing on the word `ui.listCount` — the same class of
 * blind spot as a fake `runs()` answering the shape the code wished for.
 */
function translate(catalog: Record<string, unknown>, key: string, params?: Record<string, unknown>): string {
  let node: unknown = (catalog as { en?: unknown }).en ?? catalog;
  for (const part of key.split('.')) {
    node = node && typeof node === 'object' ? (node as Record<string, unknown>)[part] : undefined;
  }
  const text = typeof node === 'string' ? node : key;
  return params
    ? text.replace(/\{(\w+)\}/g, (whole, name) => (name in params ? String(params[name]) : whole))
    : text;
}

function fakeClient(over: Record<string, unknown> = {}) {
  const rows = [...FLOWS];
  return {
    t: translate,
    flows: {
      list: vi.fn(async () => rows),
      create: vi.fn(async (f: unknown) => ({ id: `new-${rows.length}`, ...(f as object) })),
      update: vi.fn(async (id: string, f: unknown) => ({ id, ...(f as object) })),
      remove: vi.fn(async () => ({})),
      grants: vi.fn(async () => []),
      replaceGrants: vi.fn(async () => []),
      runs: vi.fn(async () => []),
      getRun: vi.fn(async () => ({ steps: [] })),
      run: vi.fn(async () => ({})),
      get: vi.fn(async (id: string) => rows.find((r) => r.id === id)),
      schema: vi.fn(async () => ({ schema_version: 1, core_version: '1.0.2', schema: {} })),
      approvals: vi.fn(async () => []),
      ...(over.flows as object),
    },
    events: {
      shape: vi.fn(async () => ({ event_name: 'x', declared_by: [], samples: 0, fields: [] })),
    },
  };
}

async function settle(el: ErpFlowsApp): Promise<void> {
  await el.updateComplete;
  for (let i = 0; i < 8; i += 1) await Promise.resolve();
  await el.updateComplete;
}

async function mount(client: unknown = fakeClient()): Promise<ErpFlowsApp> {
  const el = document.createElement('erp-flows-app') as ErpFlowsApp;
  el.client = client as never;
  document.body.appendChild(el);
  await settle(el);
  await settle(el);
  return el;
}

async function click(el: ErpFlowsApp, target: Element | null | undefined): Promise<void> {
  expect(target, 'the control is not on the screen at all').toBeTruthy();
  target!.dispatchEvent(new MouseEvent('click', { bubbles: true, composed: true, cancelable: true }));
  await settle(el);
}

/** Type into a box the way a person does: set the value, then let the control announce it. */
async function type(el: ErpFlowsApp, selector: string, value: string): Promise<void> {
  const box = el.renderRoot.querySelector(selector) as HTMLInputElement | null;
  expect(box, selector).toBeTruthy();
  box!.value = value;
  box!.dispatchEvent(new Event('input', { bubbles: true, composed: true }));
  await settle(el);
}

async function choose(el: ErpFlowsApp, selector: string, value: string): Promise<void> {
  const select = el.renderRoot.querySelector(selector) as HTMLSelectElement | null;
  expect(select, selector).toBeTruthy();
  select!.value = value;
  select!.dispatchEvent(new Event('change', { bubbles: true, composed: true }));
  await settle(el);
}

const names = (el: ErpFlowsApp): string[] =>
  [...el.renderRoot.querySelectorAll('[data-flow] .name')].map((n) => n.textContent?.trim() ?? '');

describe('finding one automation among the others', () => {
  beforeEach(() => document.body.replaceChildren());

  // The control that stops everything below passing on an empty list.
  it('draws every automation, newest touched first', async () => {
    const el = await mount();
    expect(names(el)).toEqual([
      'Aviso de stock bajo',
      'Nota en ventas grandes',
      'Resumen del viernes',
    ]);
  });

  it('narrows to what was typed — by name, by event and by action', async () => {
    const el = await mount();
    await type(el, '[data-act="search"]', 'stock');
    expect(names(el)).toEqual(['Aviso de stock bajo']);

    await type(el, '[data-act="search"]', 'customers.notes');
    expect(names(el)).toEqual(['Nota en ventas grandes']);
  });

  it('says how many of how many are showing, so a short list is never mistaken for the whole list', async () => {
    const el = await mount();
    await type(el, '[data-act="search"]', 'stock');
    expect(el.renderRoot.querySelector('[data-count]')?.textContent).toContain('1');
    expect(el.renderRoot.querySelector('[data-count]')?.textContent).toContain('3');
  });

  it('offers a way back when the search matches nothing', async () => {
    const el = await mount();
    await type(el, '[data-act="search"]', 'zzzz');
    expect(names(el)).toEqual([]);
    await click(el, el.renderRoot.querySelector('[data-act="clear-filters"]'));
    expect(names(el)).toHaveLength(3);
  });

  it('filters by whether it is running, and by how it starts', async () => {
    const el = await mount();
    await choose(el, '[data-act="filter-state"]', 'paused');
    expect(names(el)).toEqual(['Nota en ventas grandes']);

    await choose(el, '[data-act="filter-state"]', 'all');
    await choose(el, '[data-act="filter-trigger"]', 'cron');
    expect(names(el)).toEqual(['Resumen del viernes']);
  });

  it('reorders by name without bringing back what a filter is hiding', async () => {
    const el = await mount();
    await choose(el, '[data-act="filter-state"]', 'active');
    await choose(el, '[data-act="sort"]', 'name');
    expect(names(el)).toEqual(['Aviso de stock bajo', 'Resumen del viernes']);
  });
});

describe('deleting one', () => {
  beforeEach(() => document.body.replaceChildren());

  /**
   * The row's × used to delete on the first press, with nothing in between. An automation is the
   * only thing on this screen whose loss is not recoverable — there is no history to read it back
   * out of — and it sits a fingertip from the switch on a counter tablet.
   */
  it('asks first, and the first press deletes NOTHING', async () => {
    const client = fakeClient();
    const el = await mount(client);
    await click(el, el.renderRoot.querySelector('[data-flow="f1"] [data-act="delete"]'));
    expect(client.flows.remove).not.toHaveBeenCalled();
    expect(el.renderRoot.querySelector('[data-flow="f1"] [data-act="delete-yes"]')).toBeTruthy();
  });

  it('does it when it is confirmed', async () => {
    const client = fakeClient();
    const el = await mount(client);
    await click(el, el.renderRoot.querySelector('[data-flow="f1"] [data-act="delete"]'));
    await click(el, el.renderRoot.querySelector('[data-flow="f1"] [data-act="delete-yes"]'));
    expect(client.flows.remove).toHaveBeenCalledWith('f1');
    expect(names(el)).not.toContain('Aviso de stock bajo');
  });

  it('lets go of it when it is not', async () => {
    const client = fakeClient();
    const el = await mount(client);
    await click(el, el.renderRoot.querySelector('[data-flow="f1"] [data-act="delete"]'));
    await click(el, el.renderRoot.querySelector('[data-flow="f1"] [data-act="delete-no"]'));
    expect(client.flows.remove).not.toHaveBeenCalled();
    expect(names(el)).toContain('Aviso de stock bajo');
  });
});

describe('duplicating one', () => {
  beforeEach(() => document.body.replaceChildren());

  it('creates a PAUSED copy of the document, named after the original', async () => {
    const client = fakeClient();
    const el = await mount(client);
    await click(el, el.renderRoot.querySelector('[data-flow="f1"] [data-act="duplicate"]'));

    expect(client.flows.create).toHaveBeenCalledTimes(1);
    const body = client.flows.create.mock.calls[0][0] as {
      name: string;
      enabled: boolean;
      definition: unknown;
    };
    expect(body.enabled).toBe(false);
    expect(body.name).toContain('Aviso de stock bajo');
    expect(body.definition).toEqual(FLOWS[0].definition);
    // No id: the copy is a NEW flow, not an overwrite of the one it came from.
    expect(Object.keys(body).sort()).toEqual(['definition', 'enabled', 'name']);
  });

  // A copy with the original's permissions would be a way to get an automation authorised
  // without anybody authorising it.
  it('never carries the original’s permissions, and SAYS it did not', async () => {
    const client = fakeClient();
    const el = await mount(client);
    await click(el, el.renderRoot.querySelector('[data-flow="f1"] [data-act="duplicate"]'));
    expect(client.flows.replaceGrants).not.toHaveBeenCalled();
    expect(el.renderRoot.querySelector('[data-notice]')?.textContent?.trim()).toBeTruthy();
  });
});

describe('acting on several at once', () => {
  beforeEach(() => document.body.replaceChildren());

  it('shows nothing to act with until something is chosen', async () => {
    const el = await mount();
    expect(el.renderRoot.querySelector('[data-selection]')).toBeNull();
  });

  it('pauses the chosen ones in one go', async () => {
    const client = fakeClient();
    const el = await mount(client);
    await click(el, el.renderRoot.querySelector('[data-flow="f1"] [data-act="select"]'));
    await click(el, el.renderRoot.querySelector('[data-flow="f2"] [data-act="select"]'));
    expect(el.renderRoot.querySelector('[data-selection]')?.textContent).toContain('2');

    await click(el, el.renderRoot.querySelector('[data-act="bulk-pause"]'));
    expect(client.flows.update).toHaveBeenCalledTimes(2);
    for (const call of client.flows.update.mock.calls) {
      expect((call[1] as { enabled: boolean }).enabled).toBe(false);
    }
  });

  /**
   * The line flows#19 draws and this test holds: a bulk action can change whether automations are
   * WATCHING. It can never delete one, and it can never make one RUN. Both of those are decisions
   * taken a row at a time, looking at the row.
   */
  it('offers no way to delete or to run a selection', async () => {
    const el = await mount();
    await click(el, el.renderRoot.querySelector('[data-flow="f1"] [data-act="select"]'));
    const bar = el.renderRoot.querySelector('[data-selection]')!;
    expect(bar.querySelector('[data-act="bulk-delete"]')).toBeNull();
    expect(bar.querySelector('[data-act="bulk-run"]')).toBeNull();
    expect(bar.querySelector('[data-act="bulk-pause"]')).toBeTruthy();
    expect(bar.querySelector('[data-act="bulk-enable"]')).toBeTruthy();
  });

  it('forgets the selection once it has acted, so the next press cannot repeat it by accident', async () => {
    const client = fakeClient();
    const el = await mount(client);
    await click(el, el.renderRoot.querySelector('[data-flow="f1"] [data-act="select"]'));
    await click(el, el.renderRoot.querySelector('[data-act="bulk-pause"]'));
    expect(el.renderRoot.querySelector('[data-selection]')).toBeNull();
  });

  it('drops a row from the selection when a filter hides it', async () => {
    const client = fakeClient();
    const el = await mount(client);
    await click(el, el.renderRoot.querySelector('[data-flow="f1"] [data-act="select"]'));
    await choose(el, '[data-act="filter-state"]', 'paused');
    // «Pause the 1 selected» while that one is off screen is an action nobody can check.
    expect(el.renderRoot.querySelector('[data-selection]')).toBeNull();
  });
});
