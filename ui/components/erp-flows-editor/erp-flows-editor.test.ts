import { describe, it, expect, beforeEach, vi } from 'vitest';
import './erp-flows-editor';
import type { ErpFlowsEditor } from './erp-flows-editor';

const SHAPE = {
  event_name: 'sale.completed',
  declared_by: ['sales'],
  samples: 4,
  fields: [{ path: 'total', type: 'string', sample: '42.50', redacted: false, truncated: false, seen_in: 4 }],
};

function fakeClient(overrides: Record<string, unknown> = {}) {
  return {
    flows: {
      list: vi.fn(async () => []),
      create: vi.fn(async (f: unknown) => ({ id: 'new', ...(f as object) })),
      update: vi.fn(async (id: string, f: unknown) => ({ id, ...(f as object) })),
      get: vi.fn(),
      remove: vi.fn(async () => ({})),
      grants: vi.fn(async () => []),
      replaceGrants: vi.fn(async (_id: string, g: unknown) => g),
      run: vi.fn(async () => ({})),
      runs: vi.fn(async () => ({ data: [] })),
      getRun: vi.fn(async () => ({ run: {}, steps: [], events: [] })),
      schema: vi.fn(async () => ({ schema_version: 1, core_version: '1.0.2', schema: {} })),
      ...(overrides.flows as object),
    },
    events: { shape: vi.fn(async () => SHAPE), ...(overrides.events as object) },
  };
}

async function mount(flow: unknown, client = fakeClient()): Promise<ErpFlowsEditor> {
  const el = document.createElement('erp-flows-editor') as ErpFlowsEditor;
  el.client = client as never;
  el.t = ((k: string, p?: Record<string, unknown>) =>
    p ? `${k}:${Object.values(p).join('|')}` : k) as never;
  el.flow = flow as never;
  document.body.appendChild(el);
  await el.updateComplete;
  await Promise.resolve();
  await el.updateComplete;
  return el;
}

const flowWith = (steps: unknown[], triggers: unknown[] = [{ kind: 'manual' }]) => ({
  id: 'f1',
  name: 'Test',
  enabled: true,
  definition: { schema_version: 1, triggers, steps },
});

describe('the spine: one column, top to bottom', () => {
  beforeEach(() => {
    document.body.replaceChildren();
  });

  it('puts the trigger first and the steps under it, in the order they run', async () => {
    const el = await mount(
      flowWith([
        { id: 'a', kind: 'command', command: 'one' },
        { id: 'b', kind: 'command', command: 'two' },
      ]),
    );
    const spine = el.renderRoot.querySelector('.spine')!;
    const order = Array.from(spine.querySelectorAll('[data-node]')).map((n) =>
      n.getAttribute('data-node'),
    );
    expect(order).toEqual(['trigger', 'a', 'b']);
  });

  it('reorders with ion-reorder-group and NOT with HTML5 drag', async () => {
    // `ok-kanban` uses the HTML5 drag API, which does not fire on touch at all
    // (ERPlora/outfitkit#55). This editor is used on the counter tablet with a finger, so the
    // gesture has to be the native Ionic one.
    const el = await mount(flowWith([{ id: 'a', kind: 'command' }]));
    const group = el.renderRoot.querySelector('ion-reorder-group')!;
    expect(group).toBeTruthy();
    expect((group as unknown as { disabled: boolean }).disabled).toBe(false);
    expect(el.renderRoot.querySelector('[draggable="true"]')).toBeNull();
  });

  it('moves the step the gesture moved, and tells Ionic it is done', async () => {
    const el = await mount(
      flowWith([
        { id: 'a', kind: 'command', command: 'one' },
        { id: 'b', kind: 'command', command: 'two' },
        { id: 'c', kind: 'delay', seconds: 60 },
      ]),
    );
    const complete = vi.fn();
    el.renderRoot
      .querySelector('ion-reorder-group')!
      .dispatchEvent(
        new CustomEvent('ionItemReorder', { detail: { from: 2, to: 0, complete } }),
      );
    await el.updateComplete;
    // `complete()` is not optional: without it Ionic leaves the list in its dragged DOM state and
    // the next render fights it.
    expect(complete).toHaveBeenCalled();
    expect(el.document.steps.map((s) => s.id)).toEqual(['c', 'a', 'b']);
  });

  it('draws a guard as a guard — never as a diamond with two ways out', async () => {
    // The kernel is LINEAR: a `condition` that does not pass ends the run as `done`. Two outgoing
    // edges would be the editor promising a branch the engine cannot execute.
    const el = await mount(flowWith([{ id: 'g', kind: 'condition', when: {} }]));
    const node = el.renderRoot.querySelector('[data-node="g"]')!;
    expect(node.classList.contains('guard')).toBe(true);
    expect(node.classList.contains('card')).toBe(false);
    expect(node.textContent).toContain('ui.guardTitle');
  });

  it('draws a wait as a label ON the line, not as a card of its own', async () => {
    const el = await mount(flowWith([{ id: 'w', kind: 'delay', seconds: 259200 }]));
    const node = el.renderRoot.querySelector('[data-node="w"]')!;
    expect(node.classList.contains('segment')).toBe(true);
    expect(node.classList.contains('card')).toBe(false);
    expect(node.textContent).toContain('ui.delayDays:3');
  });

  it('opens a step it cannot edit, read-only, instead of dropping it', async () => {
    // A flow written by a newer editor (or a blueprint) can carry `http`/`ai`/`notify`. Rendering
    // the document without them and then SAVING would delete a working step in silence.
    const el = await mount(
      flowWith([
        { id: 'h', kind: 'http', url: 'https://api.example.com/x' },
        { id: 'a', kind: 'command', command: 'one' },
      ]),
    );
    const node = el.renderRoot.querySelector('[data-node="h"]')!;
    expect(node.textContent).toContain('ui.stepUnsupported:http');
    expect(node.querySelector('button[data-act="remove"]')).toBeTruthy();
    expect(el.document.steps.map((s) => s.kind)).toEqual(['http', 'command']);
  });
});

describe('saving', () => {
  beforeEach(() => {
    document.body.replaceChildren();
  });

  it('sends the whole document, unsupported steps included', async () => {
    const client = fakeClient();
    const el = await mount(
      flowWith([{ id: 'h', kind: 'http', url: 'https://x/y' }, { id: 'a', kind: 'command', command: 'one' }]),
      client,
    );
    await el.save();
    expect(client.flows.update).toHaveBeenCalledTimes(1);
    const [id, body] = client.flows.update.mock.calls[0] as [string, { definition: { steps: unknown[] } }];
    expect(id).toBe('f1');
    expect(body.definition.steps).toHaveLength(2);
  });

  it('creates a flow that does not exist yet, instead of updating nothing', async () => {
    const client = fakeClient();
    const el = await mount(null, client);
    el.name = 'Remind the appointment';
    await el.save();
    expect(client.flows.create).toHaveBeenCalledTimes(1);
    expect(client.flows.update).not.toHaveBeenCalled();
  });

  it('does not lose the screen when the hub refuses the document', async () => {
    // `flow.invalid_cron` and friends are refusals with a message that says what is wrong. The
    // editor has to show it and keep everything the owner typed.
    const client = fakeClient({
      flows: {
        update: vi.fn(async () => {
          throw Object.assign(new Error('minute `70`: out of range'), { code: 'flow.invalid_cron' });
        }),
      },
    });
    const el = await mount(flowWith([{ id: 'a', kind: 'command', command: 'one' }]), client);
    await el.save();
    await el.updateComplete;
    expect(el.renderRoot.textContent).toContain('out of range');
    expect(el.document.steps).toHaveLength(1);
  });
});

describe('what it may do', () => {
  beforeEach(() => {
    document.body.replaceChildren();
  });

  it('asks for exactly the permissions the steps need, without anybody typing them twice', async () => {
    const client = fakeClient();
    const el = await mount(
      flowWith([
        { id: 'a', kind: 'command', command: 'tasks.task.create' },
        { id: 'b', kind: 'command', command: 'customers.customer.update' },
      ]),
      client,
    );
    el.tab = 'permissions';
    await el.updateComplete;
    expect(el.renderRoot.textContent).toContain('tasks.task.create');
    expect(el.renderRoot.textContent).toContain('customers.customer.update');
  });

  it('grants what is missing WITHOUT revoking a grant it did not put there', async () => {
    const client = fakeClient({
      flows: {
        grants: vi.fn(async () => [{ id: 'g1', kind: 'http', value: 'https://api.example.com/*' }]),
        replaceGrants: vi.fn(async (_id: string, g: unknown) => g),
      },
    });
    const el = await mount(flowWith([{ id: 'a', kind: 'command', command: 'tasks.task.create' }]), client);
    el.tab = 'permissions';
    await el.updateComplete;
    await el.grantAll();
    const [, sent] = client.flows.replaceGrants.mock.calls[0] as [string, { kind: string }[]];
    expect(sent).toEqual([
      { kind: 'http', value: 'https://api.example.com/*' },
      { kind: 'command', value: 'tasks.task.create' },
    ]);
  });

  it('says which command name the hub does not know, instead of «error»', async () => {
    const client = fakeClient({
      flows: {
        replaceGrants: vi.fn(async () => {
          throw Object.assign(new Error('command not found: tasks.taks.create'), {
            code: 'command_not_found',
          });
        }),
      },
    });
    const el = await mount(flowWith([{ id: 'a', kind: 'command', command: 'tasks.taks.create' }]), client);
    el.tab = 'permissions';
    await el.updateComplete;
    await el.grantAll();
    await el.updateComplete;
    expect(el.renderRoot.textContent).toContain('tasks.taks.create');
  });
});

describe('what it has done', () => {
  beforeEach(() => {
    document.body.replaceChildren();
  });

  it('reads the history in words, and calls a guard that stopped the flow a SUCCESS', async () => {
    const client = fakeClient({
      flows: {
        runs: vi.fn(async () => ({
          data: [{ id: 'r1', status: 'done', trigger_kind: 'event', created_at: '2026-08-11T19:04:00Z' }],
        })),
      },
    });
    const el = await mount(flowWith([{ id: 'a', kind: 'command', command: 'one' }]), client);
    el.tab = 'history';
    await el.updateComplete;
    await Promise.resolve();
    await el.updateComplete;
    // The outcome rides on `ok-status-pill`, whose text lives in its own shadow root — so the
    // contract to assert is the label it was given, not the string this root happens to contain.
    const pill = el.renderRoot.querySelector('.run ok-status-pill');
    expect(pill?.getAttribute('label')).toBe('ui.runDone');
    expect(pill?.getAttribute('tone')).toBe('success');
    // The run id is a UUID. It is how the editor asks for the detail, never something a person reads.
    expect(el.renderRoot.textContent).not.toContain('r1');
  });

  it('says it has never run rather than showing an empty box', async () => {
    const el = await mount(flowWith([]));
    el.tab = 'history';
    await el.updateComplete;
    await Promise.resolve();
    await el.updateComplete;
    expect(el.renderRoot.textContent).toContain('ui.historyEmpty');
  });
});

describe('the data picker, wired to the real event of THIS flow', () => {
  beforeEach(() => {
    document.body.replaceChildren();
  });

  it('asks the hub what the trigger event carries, once the trigger names one', async () => {
    const client = fakeClient();
    await mount(
      flowWith([{ id: 'a', kind: 'command', command: 'one' }], [
        { kind: 'event', event: 'sale.completed' },
      ]),
      client,
    );
    expect(client.events.shape).toHaveBeenCalledWith('sale.completed');
  });

  it('does not ask when the flow has no event to ask about', async () => {
    const client = fakeClient();
    await mount(flowWith([{ id: 'a', kind: 'command', command: 'one' }]), client);
    expect(client.events.shape).not.toHaveBeenCalled();
  });
});
