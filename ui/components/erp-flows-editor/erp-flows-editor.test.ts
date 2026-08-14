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
      // Write-only by contract: names come back, values never do — there is no `getSecret`, and
      // the tests below assert that absence rather than trusting it.
      secrets: vi.fn(async () => []),
      putSecret: vi.fn(async (name: string) => ({ name })),
      deleteSecret: vi.fn(async () => ({ deleted: true })),
      approvals: vi.fn(async () => []),
      approve: vi.fn(async () => ({})),
      reject: vi.fn(async () => ({})),
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

  it('opens a step from a NEWER editor read-only, instead of dropping it', async () => {
    // A flow written by a newer editor (or a blueprint) can carry a step this one has never heard
    // of. Rendering the document without it and then SAVING would delete a working step in silence.
    const el = await mount(
      flowWith([
        { id: 'h', kind: 'teleport', target: 'mars' },
        { id: 'a', kind: 'command', command: 'one' },
      ]),
    );
    const node = el.renderRoot.querySelector('[data-node="h"]')!;
    expect(node.textContent).toContain('ui.stepUnsupported:teleport');
    expect(node.querySelector('button[data-act="remove"]')).toBeTruthy();
    expect(el.document.steps.map((s) => s.kind)).toEqual(['teleport', 'command']);
  });
});

describe('the http step (flows#3)', () => {
  beforeEach(() => {
    document.body.replaceChildren();
  });

  const openStep = async (el: ErpFlowsEditor, id: string): Promise<Element> => {
    (el.renderRoot.querySelector(`[data-node="${id}"] button.open`) as HTMLButtonElement).click();
    await el.updateComplete;
    return el.renderRoot.querySelector(`[data-node="${id}"] .panel`)!;
  };

  it('opens for EDITING now, not read-only', async () => {
    const el = await mount(flowWith([{ id: 'h', kind: 'http', method: 'GET', url: 'https://a.test/x' }]));
    const panel = await openStep(el, 'h');
    expect(panel.textContent).not.toContain('ui.readOnlyStep');
    expect(panel.querySelector('select[data-field="method"]')).toBeTruthy();
  });

  it('offers only the five methods the kernel accepts', async () => {
    // `CONNECT` and `TRACE` are absent by design: they are how a permitted URL becomes a tunnel.
    const el = await mount(flowWith([{ id: 'h', kind: 'http', url: 'https://a.test/x' }]));
    const panel = await openStep(el, 'h');
    const methods = Array.from(
      panel.querySelectorAll('select[data-field="method"] option'),
    ).map((o) => (o as HTMLOptionElement).value);
    expect(methods).toEqual(['GET', 'POST', 'PUT', 'PATCH', 'DELETE']);
  });

  it('writes the URL as a TEMPLATE, never as a bare path', async () => {
    const el = await mount(flowWith([{ id: 'h', kind: 'http', url: '' }]));
    const panel = await openStep(el, 'h');
    const box = panel.querySelector('erp-flows-value[data-field="url"]')!;
    box.dispatchEvent(
      new CustomEvent('flows-value-change', {
        detail: { parts: [{ kind: 'field', path: 'input.endpoint' }] },
        bubbles: true,
        composed: true,
      }),
    );
    await el.updateComplete;
    expect(el.document.steps[0].url).toBe('{{input.endpoint}}');
  });

  it('refuses a timeout the hub would reject, instead of letting the save fail', async () => {
    const el = await mount(flowWith([{ id: 'h', kind: 'http', url: 'https://a.test/x' }]));
    const panel = await openStep(el, 'h');
    const input = panel.querySelector('input[data-field="timeout"]') as HTMLInputElement;
    input.value = '90';
    input.dispatchEvent(new Event('change'));
    await el.updateComplete;
    expect(el.document.steps[0].timeout).toBe(30);
  });

  it('never writes a key the kernel would refuse at save', async () => {
    // `def.rs` is a STRICT whitelist per kind. One stray key and the whole document is refused.
    const el = await mount(flowWith([{ id: 'h', kind: 'http', url: 'https://a.test/x' }]));
    const panel = await openStep(el, 'h');
    (panel.querySelector('button[data-act="add-header"]') as HTMLButtonElement).click();
    await el.updateComplete;
    const allowed = ['id', 'kind', 'method', 'url', 'headers', 'body', 'timeout'];
    expect(Object.keys(el.document.steps[0]).filter((k) => !allowed.includes(k))).toEqual([]);
  });
});

describe('secrets: the credential the owner has to put somewhere (flows#3)', () => {
  beforeEach(() => {
    document.body.replaceChildren();
  });

  const httpFlow = () => flowWith([{ id: 'h', kind: 'http', url: 'https://a.test/x', headers: {} }]);

  const openHttp = async (el: ErpFlowsEditor): Promise<Element> => {
    (el.renderRoot.querySelector('[data-node="h"] button.open') as HTMLButtonElement).click();
    await el.updateComplete;
    await Promise.resolve();
    await el.updateComplete;
    return el.renderRoot.querySelector('[data-node="h"] .panel')!;
  };

  it('lists the NAMES the hub holds, because there is no endpoint that returns a value', async () => {
    const client = fakeClient({
      flows: { secrets: vi.fn(async () => [{ name: 'STRIPE_KEY' }, { name: 'CRM_TOKEN' }]) },
    });
    const el = await mount(httpFlow(), client);
    const panel = await openHttp(el);
    expect(panel.textContent).toContain('STRIPE_KEY');
    expect(panel.textContent).toContain('CRM_TOKEN');
  });

  it('never shows a secret VALUE, and never asks the hub for one', async () => {
    // The absence of a read endpoint IS the design (ADR-0283 §4). The editor must not grow a
    // «reveal» affordance that then has nothing to reveal.
    const client = fakeClient({
      flows: { secrets: vi.fn(async () => [{ name: 'STRIPE_KEY' }]) },
    });
    const el = await mount(httpFlow(), client);
    const panel = await openHttp(el);
    // The positive control FIRST: without it, «there is no reveal button» would also be true of a
    // panel that failed to render at all, and the test would pass by describing nothing.
    expect(panel.textContent).toContain('STRIPE_KEY');
    expect(panel.querySelector('[data-act="delete-secret"]')).toBeTruthy();
    expect(panel.querySelector('[data-act="reveal-secret"]')).toBeNull();
    expect(Object.keys(client.flows)).not.toContain('getSecret');
  });

  it('stores a new secret write-only and forgets the value it just typed', async () => {
    const putSecret = vi.fn(async () => ({ name: 'STRIPE_KEY' }));
    const client = fakeClient({ flows: { secrets: vi.fn(async () => []), putSecret } });
    const el = await mount(httpFlow(), client);
    const panel = await openHttp(el);
    (panel.querySelector('input[data-field="secret-name"]') as HTMLInputElement).value = 'STRIPE_KEY';
    (panel.querySelector('input[data-field="secret-name"]') as HTMLInputElement).dispatchEvent(
      new Event('input'),
    );
    (panel.querySelector('input[data-field="secret-value"]') as HTMLInputElement).value = 'sk_live_x';
    (panel.querySelector('input[data-field="secret-value"]') as HTMLInputElement).dispatchEvent(
      new Event('input'),
    );
    await el.updateComplete;
    (panel.querySelector('button[data-act="save-secret"]') as HTMLButtonElement).click();
    await el.updateComplete;
    await Promise.resolve();
    await el.updateComplete;
    expect(putSecret).toHaveBeenCalledWith('STRIPE_KEY', 'sk_live_x');
    // The value must not survive in the component after the round trip: a re-render that put it
    // back in a box is a credential sitting on a shop counter's screen.
    expect(el.renderRoot.textContent).not.toContain('sk_live_x');
    const value = el.renderRoot.querySelector('input[data-field="secret-value"]') as HTMLInputElement;
    expect(value?.value ?? '').toBe('');
  });

  it('offers a secret ONLY inside an http step, which is the only place it is legal', async () => {
    // `secret.X` in any other step is refused at SAVE. Offering it there would be the editor
    // teaching a syntax that makes the document unsavable.
    const client = fakeClient({ flows: { secrets: vi.fn(async () => [{ name: 'K' }]) } });
    const el = await mount(
      flowWith([
        { id: 'h', kind: 'http', url: 'https://a.test/x' },
        { id: 'c', kind: 'command', command: 'tasks.tasks.create', params: { a: 'b' } },
      ]),
      client,
    );
    await openHttp(el);
    expect(el.renderRoot.querySelector('[data-node="h"] [data-act="insert-secret"]')).toBeTruthy();
    (el.renderRoot.querySelector('[data-node="c"] button.open') as HTMLButtonElement).click();
    await el.updateComplete;
    expect(el.renderRoot.querySelector('[data-node="c"] [data-act="insert-secret"]')).toBeNull();
  });
});

describe('the ai step (flows#3)', () => {
  beforeEach(() => {
    document.body.replaceChildren();
  });

  const open = async (el: ErpFlowsEditor): Promise<Element> => {
    (el.renderRoot.querySelector('[data-node="a"] button.open') as HTMLButtonElement).click();
    await el.updateComplete;
    return el.renderRoot.querySelector('[data-node="a"] .panel')!;
  };

  it('defaults a new ai step to asking first', async () => {
    const el = await mount(flowWith([]));
    (el.renderRoot.querySelector('.adders button[data-add="ai"]') as HTMLButtonElement).click();
    await el.updateComplete;
    const step = el.document.steps.find((s) => s.kind === 'ai');
    expect(step?.policy).toBe('manual');
  });

  it('SAYS what turning approval off means, where the switch is', async () => {
    // `auto` means a model writing to the business at 3 AM with nobody watching. A select with two
    // words and no sentence is how that gets picked by accident.
    const el = await mount(flowWith([{ id: 'a', kind: 'ai', prompt: 'x', policy: 'auto' }]));
    const panel = await open(el);
    expect(panel.textContent).toContain('ui.aiPolicyAutoWarning');
  });

  it('keeps max_iters inside the cap the kernel refuses above', async () => {
    const el = await mount(flowWith([{ id: 'a', kind: 'ai', prompt: 'x', max_iters: 6 }]));
    const panel = await open(el);
    const input = panel.querySelector('input[data-field="max-iters"]') as HTMLInputElement;
    input.value = '50';
    input.dispatchEvent(new Event('change'));
    await el.updateComplete;
    expect(el.document.steps[0].max_iters).toBe(10);
  });

  it('says a tool is offered, NOT allowed — the grant is a separate decision', async () => {
    const el = await mount(
      flowWith([
        { id: 'a', kind: 'ai', prompt: 'x', tools: { queries: ['sales.sale.list'], commands: [] } },
      ]),
    );
    const panel = await open(el);
    expect(panel.textContent).toContain('ui.aiToolsHint');
  });

  it('adds a tool without inventing a key the kernel refuses', async () => {
    const el = await mount(flowWith([{ id: 'a', kind: 'ai', prompt: 'x' }]));
    const panel = await open(el);
    (panel.querySelector('button[data-act="add-query"]') as HTMLButtonElement).click();
    await el.updateComplete;
    const allowed = ['id', 'kind', 'prompt', 'tools', 'policy', 'max_iters'];
    expect(Object.keys(el.document.steps[0]).filter((k) => !allowed.includes(k))).toEqual([]);
    expect(Object.keys(el.document.steps[0].tools ?? {}).sort()).toEqual(['commands', 'queries']);
  });
});

describe('the notify step (flows#3)', () => {
  beforeEach(() => {
    document.body.replaceChildren();
  });

  const open = async (el: ErpFlowsEditor): Promise<Element> => {
    (el.renderRoot.querySelector('[data-node="n"] button.open') as HTMLButtonElement).click();
    await el.updateComplete;
    return el.renderRoot.querySelector('[data-node="n"] .panel')!;
  };

  const notifyFlow = () =>
    flowWith([
      {
        id: 'n',
        kind: 'notify',
        channel: 'email',
        to: { query: 'customers.customer.get', params: {}, field: 'email' },
        vars: {},
      },
    ]);

  it('offers the two channels that have a transport, and NOT sms', async () => {
    // `sms` is in ADR-0012's vocabulary and is refused by name at save and at grant time. Offering
    // it would be a step that can never be delivered, chosen from a list that looked complete.
    const el = await mount(notifyFlow());
    const panel = await open(el);
    const channels = Array.from(
      panel.querySelectorAll('select[data-field="channel"] option'),
    ).map((o) => (o as HTMLOptionElement).value);
    expect(channels).toEqual(['email', 'whatsapp']);
  });

  it('has NO way to type an address by hand, and that absence is the point', async () => {
    // Without it, an author (or a marketplace template) would write `to: "{{input.email}}"` and
    // send the message to whatever the event payload carried.
    const el = await mount(notifyFlow());
    const panel = await open(el);
    expect(panel.querySelector('input[type="email"]')).toBeNull();
    expect(panel.querySelector('[data-field="to-literal"]')).toBeNull();
    expect(panel.querySelector('[data-field="to-query"]')).toBeTruthy();
    expect(panel.querySelector('[data-field="to-field"]')).toBeTruthy();
  });

  it('keeps `to` an object, because the document does not save otherwise', async () => {
    const el = await mount(notifyFlow());
    const panel = await open(el);
    const field = panel.querySelector('input[data-field="to-field"]') as HTMLInputElement;
    field.value = 'phone';
    field.dispatchEvent(new Event('change'));
    await el.updateComplete;
    expect(el.document.steps[0].to).toEqual({
      query: 'customers.customer.get',
      params: {},
      field: 'phone',
    });
  });

  it('warns that WhatsApp is the one that costs money every time', async () => {
    const el = await mount(
      flowWith([
        { id: 'n', kind: 'notify', channel: 'whatsapp', to: { query: 'q', params: {}, field: 'phone' } },
      ]),
    );
    const panel = await open(el);
    expect(panel.textContent).toContain('ui.notifyWhatsappCost');
  });

  it('composes the message with pills, which is what this box was built for', async () => {
    const el = await mount(notifyFlow());
    const panel = await open(el);
    const box = panel.querySelector('erp-flows-value[data-field="var-text"]')!;
    box.dispatchEvent(
      new CustomEvent('flows-value-change', {
        detail: {
          parts: [
            { kind: 'text', text: 'Hola ' },
            { kind: 'field', path: 'input.name' },
          ],
        },
        bubbles: true,
        composed: true,
      }),
    );
    await el.updateComplete;
    expect((el.document.steps[0].vars as Record<string, unknown>).text).toBe('Hola {{input.name}}');
  });
});

describe('the permissions tab, for the three steps it used to ignore (flows#3)', () => {
  beforeEach(() => {
    document.body.replaceChildren();
  });

  it('asks for every grant the new steps need, instead of «nothing yet»', async () => {
    // This is the failure that mattered: a flow with an http step read «this automation asks for
    // nothing» on the one screen whose job is to say what it needs to run at all.
    const el = await mount(
      flowWith([
        { id: 'h', kind: 'http', url: 'https://api.example.com/v1/orders' },
        {
          id: 'n',
          kind: 'notify',
          channel: 'whatsapp',
          to: { query: 'customers.customer.get', field: 'phone' },
        },
      ]),
    );
    el.tab = 'permissions';
    await el.updateComplete;
    const text = el.renderRoot.textContent ?? '';
    expect(text).toContain('https://api.example.com/v1/orders*');
    expect(text).toContain('whatsapp');
    expect(text).toContain('customers.customer.get#phone');
    expect(text).not.toContain('ui.grantsNone');
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

  it('puts the REASON a run failed on the row, not two clicks away', async () => {
    // «Se paró por un error» with the error hidden behind a chevron is the shape of a screen
    // that makes somebody phone support. The reason is the only actionable thing on it.
    const client = fakeClient({
      flows: {
        runs: vi.fn(async () => ({
          data: [
            {
              id: 'r9',
              status: 'failed',
              last_error: 'flow.grant_denied: no live grant for command `tasks.task.create`',
              created_at: '2026-08-11T19:04:00Z',
            },
          ],
        })),
      },
    });
    const el = await mount(flowWith([{ id: 'a', kind: 'command', command: 'one' }]), client);
    el.tab = 'history';
    await el.updateComplete;
    await Promise.resolve();
    await el.updateComplete;
    expect(el.renderRoot.textContent).toContain('no live grant');
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
