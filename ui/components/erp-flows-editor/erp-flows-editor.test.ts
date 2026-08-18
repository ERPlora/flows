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
      // A BARE ARRAY, which is what the SDK really resolves to (its transport ends in
      // `unwrap(env)`). The old fake answered `{data: []}` — the shape the code wanted — and
      // that is why an always-empty history tab survived until a real hub showed it.
      runs: vi.fn(async () => []),
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
    events: {
      shape: vi.fn(async () => SHAPE),
      // What a hub running hub#823 answers. Three events, deliberately NOT in the order the
      // module's own label dictionary lists them.
      list: vi.fn(async () => [
        { name: 'customer.created', declared_by: ['customers'] },
        { name: 'sale.completed', declared_by: ['sales'], last_seen_at: '2026-08-13T10:00:00Z' },
        { name: 'shop.refund_issued', declared_by: ['shop'] },
      ]),
      ...(overrides.events as object),
    },
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

describe('the query step — the deterministic read (hub#954, flows#30)', () => {
  beforeEach(() => {
    document.body.replaceChildren();
  });

  const open = async (el: ErpFlowsEditor): Promise<Element> => {
    (el.renderRoot.querySelector('[data-node="w"] button.open') as HTMLButtonElement).click();
    await el.updateComplete;
    return el.renderRoot.querySelector('[data-node="w"] .panel')!;
  };

  const queryFlow = (over: Record<string, unknown> = {}) =>
    flowWith([
      { id: 'w', kind: 'query', query: 'sales.summary', params: { day: 'input.day' }, result: 'first', limit: 200, ...over },
    ]);

  it('is on the palette, next to the guard it is meant to be followed by', async () => {
    // Until flows#30 the seventh kind opened READ-ONLY: the owner could see it and not fix it.
    const el = await mount(flowWith([]));
    const adders = Array.from(el.renderRoot.querySelectorAll('.adders button[data-add]')).map((b) =>
      b.getAttribute('data-add'),
    );
    expect(adders).toContain('query');
    expect(adders.indexOf('query')).toBeLessThan(adders.indexOf('condition'));
    (el.renderRoot.querySelector('.adders button[data-add="query"]') as HTMLButtonElement).click();
    await el.updateComplete;
    expect(el.document.steps[0]).toMatchObject({ kind: 'query', query: '', result: 'first', limit: 200 });
  });

  it('draws the read, its params, what to keep and how many rows', async () => {
    const el = await mount(queryFlow());
    const panel = await open(el);
    expect(panel.querySelector('input[data-field="query"]')).toBeTruthy();
    expect(panel.querySelector('select[data-field="result"]')).toBeTruthy();
    expect(panel.querySelector('input[data-field="limit"]')).toBeTruthy();
    // The one existing param is drawn as a name + a composed value, like a command's.
    expect(panel.querySelector('erp-flows-value')).toBeTruthy();
    expect(panel.textContent).toContain('ui.queryHint');
  });

  it('offers `first` and `count`, and NEVER `rows`', async () => {
    // The mapping language cannot index an array: `steps.w.rows.0.total` would resolve to nothing
    // in silence, and the kernel refuses `result: "rows"` at save for that reason.
    const el = await mount(queryFlow());
    const panel = await open(el);
    const options = Array.from(panel.querySelectorAll('select[data-field="result"] option')).map(
      (o) => (o as HTMLOptionElement).value,
    );
    expect(options).toEqual(['first', 'count']);
  });

  it('keeps the limit inside 1..200, which the hub refuses above rather than trims', async () => {
    const el = await mount(queryFlow());
    const panel = await open(el);
    const input = panel.querySelector('input[data-field="limit"]') as HTMLInputElement;
    input.value = '5000';
    input.dispatchEvent(new Event('change'));
    await el.updateComplete;
    expect(el.document.steps[0].limit).toBe(200);
    input.value = '0';
    input.dispatchEvent(new Event('change'));
    await el.updateComplete;
    expect(el.document.steps[0].limit).toBe(1);
  });

  it('tells the owner what the next step can read out of it — found and count, no rows', async () => {
    const el = await mount(queryFlow());
    const panel = await open(el);
    const text = panel.textContent ?? '';
    expect(text).toContain('steps.w.found');
    expect(text).toContain('steps.w.count');
    expect(text).not.toContain('rows');
  });

  it('writes the read name and asks for its grant on the permissions tab', async () => {
    const el = await mount(queryFlow({ query: '' }));
    const panel = await open(el);
    const input = panel.querySelector('input[data-field="query"]') as HTMLInputElement;
    input.value = ' inventory.stock.low ';
    input.dispatchEvent(new Event('change'));
    await el.updateComplete;
    expect(el.document.steps[0].query).toBe('inventory.stock.low');
    el.tab = 'permissions';
    await el.updateComplete;
    expect(el.renderRoot.textContent).toContain('inventory.stock.low');
  });

  it('adds a param without inventing a key the kernel refuses', async () => {
    const el = await mount(queryFlow());
    const panel = await open(el);
    (panel.querySelector('button[data-act="add-param"]') as HTMLButtonElement).click();
    await el.updateComplete;
    const allowed = ['id', 'kind', 'query', 'params', 'result', 'limit'];
    expect(Object.keys(el.document.steps[0]).filter((k) => !allowed.includes(k))).toEqual([]);
  });
});

describe('the approval step — the pause (hub#950, flows#31)', () => {
  beforeEach(() => {
    document.body.replaceChildren();
  });

  const open = async (el: ErpFlowsEditor): Promise<Element> => {
    (el.renderRoot.querySelector('[data-node="ok"] button.open') as HTMLButtonElement).click();
    await el.updateComplete;
    return el.renderRoot.querySelector('[data-node="ok"] .panel')!;
  };

  const approvalFlow = (over: Record<string, unknown> = {}) =>
    flowWith([
      {
        id: 'ok',
        kind: 'approval',
        title: 'Approve the purchase?',
        summary: '',
        assignee: { role: 'manager' },
        expires_in: 259200,
        on_expire: 'reject',
        on_reject: 'cancel',
        ...over,
      },
    ]);

  it('is on the palette and is born with the kernel defaults and NO assignee', async () => {
    const el = await mount(flowWith([]));
    (el.renderRoot.querySelector('.adders button[data-add="approval"]') as HTMLButtonElement).click();
    await el.updateComplete;
    expect(el.document.steps[0]).toMatchObject({
      kind: 'approval',
      title: '',
      expires_in: 259200,
      on_expire: 'reject',
      on_reject: 'cancel',
    });
    expect(el.document.steps[0].assignee).toBeUndefined();
  });

  it('draws the question, who is asked, how long it waits and the two policies', async () => {
    const el = await mount(approvalFlow());
    const panel = await open(el);
    expect(panel.querySelector('erp-flows-value[data-field="title"]')).toBeTruthy();
    expect(panel.querySelector('erp-flows-value[data-field="summary"]')).toBeTruthy();
    expect(panel.querySelector('[data-field="assignee-role"]')).toBeTruthy();
    expect(panel.querySelector('select[data-field="expires-in"]')).toBeTruthy();
    expect(panel.querySelector('select[data-field="on-reject"]')).toBeTruthy();
    expect(panel.querySelector('select[data-field="on-expire"]')).toBeTruthy();
    // No command, no payload: this step executes nothing, and the kernel refuses both by name.
    expect(panel.querySelector('[data-field="command"]')).toBeNull();
    expect(panel.querySelector('[data-field="payload"]')).toBeNull();
  });

  it('asks for a ROLE, never a person, and says the admins can always answer', async () => {
    // hub#950: `assignee` is `{role}` and nothing else. A role that runs out of people would leave
    // the question undecidable — which is why whoever administers the hub can always answer, and
    // the panel says so next to the box.
    const el = await mount(approvalFlow());
    const panel = await open(el);
    const roles = Array.from(panel.querySelectorAll('datalist[data-field="roles"] option')).map(
      (o) => (o as HTMLOptionElement).value,
    );
    expect(roles).toEqual(expect.arrayContaining(['admin', 'manager', 'employee']));
    expect(panel.querySelector('[data-field="assignee-user"]')).toBeNull();
    expect(panel.textContent).toContain('ui.approvalAssigneeHint');
  });

  it('writes the role as {role}, and DROPS assignee when the box is cleared', async () => {
    const el = await mount(approvalFlow({ assignee: undefined }));
    const panel = await open(el);
    const input = panel.querySelector('[data-field="assignee-role"]') as HTMLInputElement;
    input.value = ' employee ';
    input.dispatchEvent(new Event('change'));
    await el.updateComplete;
    expect(el.document.steps[0].assignee).toEqual({ role: 'employee' });
    input.value = '';
    input.dispatchEvent(new Event('change'));
    await el.updateComplete;
    // Absent, not `{role: ''}`: the kernel refuses an empty role and reads absence as «the admins».
    expect('assignee' in el.document.steps[0]).toBe(false);
  });

  it('offers the wait as days and weeks, never as a number of seconds, capped at 30 days', async () => {
    const el = await mount(approvalFlow());
    const panel = await open(el);
    const select = panel.querySelector('select[data-field="expires-in"]') as HTMLSelectElement;
    const values = Array.from(select.querySelectorAll('option')).map((o) => Number(o.value));
    expect(values).toContain(259200);
    expect(values).toContain(604800);
    expect(Math.max(...values)).toBe(2592000);
    select.value = '604800';
    select.dispatchEvent(new Event('change'));
    await el.updateComplete;
    expect(el.document.steps[0].expires_in).toBe(604800);
  });

  it('keeps a wait the presets do not have, so a hand-written document reopens as written', async () => {
    const el = await mount(approvalFlow({ expires_in: 5400 }));
    const panel = await open(el);
    const select = panel.querySelector('select[data-field="expires-in"]') as HTMLSelectElement;
    expect(Array.from(select.querySelectorAll('option')).some((o) => o.value === '5400')).toBe(true);
    expect(el.document.steps[0].expires_in).toBe(5400);
  });

  it('offers exactly the policies the kernel knows, with the restrictive ones selected', async () => {
    const el = await mount(approvalFlow());
    const panel = await open(el);
    const values = (sel: string) =>
      Array.from(panel.querySelectorAll(`select[data-field="${sel}"] option`)).map((o) => (o as HTMLOptionElement).value);
    expect(values('on-reject')).toEqual(['cancel', 'continue']);
    expect(values('on-expire')).toEqual(['reject', 'cancel', 'continue']);
    const onReject = panel.querySelector('select[data-field="on-reject"]') as HTMLSelectElement;
    onReject.value = 'continue';
    onReject.dispatchEvent(new Event('change'));
    await el.updateComplete;
    expect(el.document.steps[0].on_reject).toBe('continue');
    // The pattern the policies exist for: continue + a guard on the decision = the three branches.
    expect(panel.textContent).toContain('ui.approvalContinueHint');
  });

  it('SAYS the question is fixed the moment it is asked — editing later changes nothing live', async () => {
    const el = await mount(approvalFlow());
    const panel = await open(el);
    expect(panel.textContent).toContain('ui.approvalTitleHint');
    expect(panel.textContent).toContain('steps.ok.decision');
  });

  it('asks for NO permission on the permissions tab', async () => {
    const el = await mount(approvalFlow());
    el.tab = 'permissions';
    await el.updateComplete;
    expect(el.renderRoot.textContent).toContain('ui.grantsNone');
  });

  it('«Probar» says the run WAITS here and decides nothing on anybody\'s behalf', async () => {
    const el = await mount(
      flowWith([
        { id: 'ok', kind: 'approval', title: 'Go?', on_reject: 'continue' },
        { id: 'g', kind: 'condition', when: { 'steps.ok.decision': { eq: 'approved' } } },
      ]),
    );
    el.tab = 'test';
    await el.updateComplete;
    const step = el.renderRoot.querySelector('[data-node-outcome="ok"]')!;
    expect(step.textContent).toContain('ui.testPausesHere');
    const guard = el.renderRoot.querySelector('[data-node-outcome="g"]')!;
    expect(guard.getAttribute('data-outcome')).toBe('would-run');
    expect(guard.textContent).toContain('ui.testUncertain');
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

describe('«Probar» before activating (flows#2)', () => {
  beforeEach(() => {
    document.body.replaceChildren();
  });

  const SALE_SHAPE = {
    event_name: 'sale.completed',
    declared_by: ['sales'],
    samples: 4,
    fields: [
      { path: 'total', type: 'number', sample: 4250, redacted: false, truncated: false, seen_in: 4 },
      { path: 'customer.name', type: 'string', sample: 'Marta', redacted: false, truncated: false, seen_in: 4 },
      { path: 'customer.email', type: 'string', redacted: true, truncated: false, seen_in: 4 },
    ],
  };

  const withShape = (shape: unknown = SALE_SHAPE) =>
    fakeClient({ events: { shape: vi.fn(async () => shape) } });

  const saleFlow = (steps: unknown[]) =>
    flowWith(steps, [{ kind: 'event', event: 'sale.completed' }]);

  const test = async (el: ErpFlowsEditor): Promise<Element> => {
    el.tab = 'test';
    await el.updateComplete;
    await Promise.resolve();
    await el.updateComplete;
    return el.renderRoot.querySelector('.preview')!;
  };

  it('EXECUTES NOTHING — no run, no command, no message', async () => {
    // `POST …/flows/{id}/run` executes for real, commands included. A «probar» that charged a
    // test sale would be worse than not having the button at all, and the kernel is frozen
    // (ADR-0283): there is no dry-run to ask for. So this screen calls nothing.
    const client = withShape();
    const el = await mount(saleFlow([{ id: 's1', kind: 'command', command: 'x', params: {} }]), client);
    await test(el);
    expect(client.flows.run).not.toHaveBeenCalled();
    expect(client.flows.update).not.toHaveBeenCalled();
    expect(client.flows.create).not.toHaveBeenCalled();
  });

  it('SAYS that nothing happened, where the owner is looking', async () => {
    const el = await mount(saleFlow([{ id: 's1', kind: 'command', command: 'x', params: {} }]), withShape());
    const panel = await test(el);
    expect(panel.textContent).toContain('ui.testNothingHappened');
  });

  it('uses the REAL last sale of this hub, and says which one', async () => {
    const el = await mount(
      saleFlow([
        { id: 's1', kind: 'command', command: 'tasks.tasks.create', params: { title: 'Gracias {{input.customer.name}}' } },
      ]),
      withShape(),
    );
    const panel = await test(el);
    // The owner's own customer, from their own event — not a mock, and not a made-up name.
    expect(panel.textContent).toContain('Gracias Marta');
  });

  it('points at the mapping that would arrive EMPTY', async () => {
    const el = await mount(
      saleFlow([
        { id: 's1', kind: 'command', command: 'tasks.tasks.create', params: { title: 'Llama a {{input.phone}}' } },
      ]),
      withShape(),
    );
    const panel = await test(el);
    expect(panel.querySelector('[data-blank="true"]')).toBeTruthy();
    expect(panel.textContent).toContain('ui.testBlank');
  });

  it('does NOT flag a value the hub is merely hiding as a mistake', async () => {
    const el = await mount(
      saleFlow([
        { id: 's1', kind: 'command', command: 'x', params: { to: '{{input.customer.email}}' } },
      ]),
      withShape(),
    );
    const panel = await test(el);
    expect(panel.querySelector('[data-blank="true"]')).toBeNull();
    expect(panel.textContent).toContain('ui.testHidden');
  });

  it('shows where the flow STOPS, and that stopping there is it working', async () => {
    const el = await mount(
      saleFlow([
        { id: 'g', kind: 'condition', when: { 'input.total': { gte: 100000 } } },
        { id: 's2', kind: 'command', command: 'x', params: {} },
      ]),
      withShape(),
    );
    const panel = await test(el);
    expect(panel.querySelector('[data-outcome="stops-here"]')).toBeTruthy();
    expect(panel.querySelector('[data-node-outcome="s2"]')?.getAttribute('data-outcome')).toBe(
      'not-reached',
    );
    expect(panel.textContent).toContain('ui.testStoppedIsWorking');
  });

  it('warns that a step would be REFUSED for a permission that is not granted', async () => {
    // The likeliest real failure, and one a preview can catch for free: a flow whose grants are
    // missing dies at the first step with `flow.grant_denied` and nothing else on any screen
    // connects the two.
    const el = await mount(
      saleFlow([{ id: 's1', kind: 'command', command: 'tasks.tasks.create', params: {} }]),
      withShape(),
    );
    const panel = await test(el);
    expect(panel.textContent).toContain('ui.testWouldBeRefused');
  });

  it('says it cannot tell when a guard reads a field the hub withholds', async () => {
    // Being confidently wrong is the one outcome that would make this feature worse than nothing.
    const el = await mount(
      saleFlow([{ id: 'g', kind: 'condition', when: { 'input.customer.email': { eq: 'x@y.z' } } }]),
      withShape(),
    );
    const panel = await test(el);
    expect(panel.textContent).toContain('ui.testUncertain');
  });

  it('admits there is no real data instead of inventing a sale', async () => {
    const el = await mount(
      saleFlow([{ id: 's1', kind: 'command', command: 'x', params: {} }]),
      withShape({ ...SALE_SHAPE, samples: 0 }),
    );
    const panel = await test(el);
    expect(panel.textContent).toContain('ui.testNoRealData');
  });

  it('is reachable from the header, next to the switch it is meant to be pressed before', async () => {
    const el = await mount(saleFlow([{ id: 's1', kind: 'command', command: 'x', params: {} }]), withShape());
    const button = el.renderRoot.querySelector('.head [data-act="test"]') as HTMLElement;
    expect(button).toBeTruthy();
    button.click();
    await el.updateComplete;
    expect(el.tab).toBe('test');
  });
});

describe('every dropdown shows what the document ACTUALLY says', () => {
  beforeEach(() => {
    document.body.replaceChildren();
  });

  /**
   * Found in a real browser, not by happy-dom: Lit applies `.value` to a `<select>` BEFORE its
   * `<option>` children exist, so the property is discarded and the control falls back to the
   * first option. A `POST` step opened as `GET`, and a `whatsapp` step opened as `email` — and
   * then saving wrote back what the box said, silently downgrading the request and switching the
   * channel the owner is billed for.
   *
   * The check is on the `selected` ATTRIBUTE rather than on `.value`, because that is the half
   * that is wrong on first paint and the half a DOM implementation cannot paper over.
   *
   * `policy` is in this table on purpose even though it was never broken: its value happens to be
   * the first option, so it passed by luck. A control that is right by coincidence is not a check.
   */
  const selected = (el: ErpFlowsEditor, node: string, field: string): string | null => {
    const select = el.renderRoot.querySelector(`[data-node="${node}"] select[data-field="${field}"]`);
    const option = select?.querySelector('option[selected]') as HTMLOptionElement | null;
    return option ? option.value : null;
  };

  const openNode = async (el: ErpFlowsEditor, id: string): Promise<void> => {
    (el.renderRoot.querySelector(`[data-node="${id}"] button.open`) as HTMLButtonElement).click();
    await el.updateComplete;
    await Promise.resolve();
    await el.updateComplete;
  };

  it('opens an http step on the method it really has, not on the first one', async () => {
    const el = await mount(flowWith([{ id: 'h', kind: 'http', method: 'POST', url: 'https://a.test/x' }]));
    await openNode(el, 'h');
    expect(selected(el, 'h', 'method')).toBe('POST');
  });

  it('opens a notify step on the channel it really has — the one that costs money', async () => {
    const el = await mount(
      flowWith([
        { id: 'n', kind: 'notify', channel: 'whatsapp', to: { query: 'q', params: {}, field: 'phone' } },
      ]),
    );
    await openNode(el, 'n');
    expect(selected(el, 'n', 'channel')).toBe('whatsapp');
  });

  it('opens an ai step on the policy it really has', async () => {
    const el = await mount(flowWith([{ id: 'a', kind: 'ai', prompt: 'x', policy: 'auto' }]));
    await openNode(el, 'a');
    expect(selected(el, 'a', 'policy')).toBe('auto');
  });

  it('opens the TRIGGER on the kind it really has (this was broken before flows#3 too)', async () => {
    const el = await mount(flowWith([], [{ kind: 'cron', cron: '0 9 * * *' }]));
    (el.renderRoot.querySelector('[data-node="trigger"] button.open') as HTMLButtonElement).click();
    await el.updateComplete;
    const option = el.renderRoot.querySelector(
      '[data-node="trigger"] select[data-field="trigger-kind"] option[selected]',
    ) as HTMLOptionElement | null;
    expect(option?.value).toBe('cron');
  });

  it('opens a guard on the operator it really has', async () => {
    const el = await mount(
      flowWith([{ id: 'g', kind: 'condition', when: { 'input.total': { gte: 100 } } }]),
    );
    await openNode(el, 'g');
    const option = el.renderRoot.querySelector(
      '[data-node="g"] select[data-field="operator"] option[selected]',
    ) as HTMLOptionElement | null;
    expect(option?.value).toBe('gte');
  });
});

describe('the triggers on offer are the ones THIS hub fires (flows#8)', () => {
  beforeEach(() => {
    document.body.replaceChildren();
  });

  const openTrigger = async (el: ErpFlowsEditor): Promise<void> => {
    (el.renderRoot.querySelector('[data-node="trigger"] button.open') as HTMLButtonElement).click();
    await el.updateComplete;
    await Promise.resolve();
    await Promise.resolve();
    await el.updateComplete;
  };

  const eventSelect = (el: ErpFlowsEditor): HTMLSelectElement =>
    el.renderRoot.querySelector('select[data-field="trigger-event"]') as HTMLSelectElement;

  const offered = (el: ErpFlowsEditor): string[] =>
    Array.from(eventSelect(el).querySelectorAll('option'))
      .map((o) => o.value)
      .filter(Boolean);

  it('fills the dropdown from the hub, not from the list typed into this module', async () => {
    const client = fakeClient();
    const el = await mount(flowWith([], [{ kind: 'event', event: 'sale.completed' }]), client);
    await openTrigger(el);

    expect(client.events.list).toHaveBeenCalled();
    expect(offered(el)).toEqual([
      'customer.created',
      'sale.completed',
      // A name this module has never heard of, offered anyway: the hub is the authority on which
      // events exist. Under the old hand-written catalogue it could not be picked at all.
      'shop.refund_issued',
    ]);
  });

  it('lends its own words where it has them and shows the raw name where it does not', async () => {
    const el = await mount(flowWith([], [{ kind: 'event', event: 'sale.completed' }]));
    await openTrigger(el);
    const labels = Array.from(eventSelect(el).querySelectorAll('option')).map((o) => o.textContent);

    expect(labels).toContain('ui.evSaleCompleted');
    expect(labels).toContain('shop.refund_issued');
  });

  /**
   * The trap this screen is known for. Lit applies `.value` to a `<select>` BEFORE its `<option>`
   * children exist, so the control falls back to the first option — and the change handler then
   * writes back what the box says. Filling this dropdown from the network makes that window WIDER,
   * not narrower: the options do not exist for a whole round trip.
   *
   * Checked with several saved values on purpose. `customer.created` happens to be the first thing
   * the hub lists, so a run against it alone would pass by coincidence and prove nothing.
   */
  for (const saved of ['sale.completed', 'shop.refund_issued', 'customer.created']) {
    it(`reopens a saved flow on «${saved}», even though the options arrive later`, async () => {
      let release!: (rows: unknown) => void;
      const client = fakeClient({
        events: {
          shape: vi.fn(async () => SHAPE),
          list: vi.fn(() => new Promise((resolve) => (release = resolve))),
        },
      });
      const el = await mount(flowWith([], [{ kind: 'event', event: saved }]), client);
      await openTrigger(el);

      // Mid-flight: the dropdown has no catalogue yet, and it still must not lose the saved value.
      expect(eventSelect(el).querySelector('option[selected]')?.getAttribute('value')).toBe(saved);

      release([
        { name: 'customer.created', declared_by: ['customers'] },
        { name: 'sale.completed', declared_by: ['sales'] },
        { name: 'shop.refund_issued', declared_by: ['shop'] },
      ]);
      await Promise.resolve();
      await Promise.resolve();
      await el.updateComplete;

      expect(eventSelect(el).querySelector('option[selected]')?.getAttribute('value')).toBe(saved);
      expect(eventSelect(el).value).toBe(saved);
      // And nothing was written back to the document while the options were missing.
      expect(el.document.triggers[0]).toMatchObject({ kind: 'event', event: saved });
    });
  }

  it('keeps a saved event the hub no longer lists, instead of silently swapping it', async () => {
    const el = await mount(flowWith([], [{ kind: 'event', event: 'gone.for.good' }]));
    await openTrigger(el);

    expect(eventSelect(el).querySelector('option[selected]')?.getAttribute('value')).toBe(
      'gone.for.good',
    );
    expect(offered(el)).toContain('gone.for.good');
  });

  it('SAYS the hub cannot list its events — it does not quietly show the old list', async () => {
    // A hub older than the SDK method (`events.list` simply is not there). Falling back to
    // `TRIGGER_CATALOG` would be flows#8 all over again, wearing a disguise.
    const client = fakeClient({ events: { shape: vi.fn(async () => SHAPE) } });
    delete (client.events as Record<string, unknown>).list;
    const el = await mount(flowWith([], [{ kind: 'event', event: '' }]), client);
    await openTrigger(el);

    expect(el.renderRoot.querySelector('[data-catalog="unsupported"]')).toBeTruthy();
    expect(offered(el)).toEqual([]);
    // The way out is still on screen: the free-text box takes any name.
    expect(el.renderRoot.querySelector('#trigger-event-other')).toBeTruthy();
  });

  it('names the missing grant when the hub refuses, so the owner can go and give it', async () => {
    const client = fakeClient({
      events: {
        shape: vi.fn(async () => SHAPE),
        list: vi.fn(async () => {
          throw Object.assign(new Error('nope'), { code: 'capability_denied' });
        }),
      },
    });
    const el = await mount(flowWith([], [{ kind: 'event', event: '' }]), client);
    await openTrigger(el);

    const banner = el.renderRoot.querySelector('[data-catalog="failed"]');
    expect(banner).toBeTruthy();
    expect(banner!.textContent).toContain('ui.eventCatalogDenied');
    expect(offered(el)).toEqual([]);
  });

  it('says «this hub declares no events yet» rather than showing an empty dropdown', async () => {
    const client = fakeClient({
      events: { shape: vi.fn(async () => SHAPE), list: vi.fn(async () => []) },
    });
    const el = await mount(flowWith([], [{ kind: 'event', event: '' }]), client);
    await openTrigger(el);

    expect(el.renderRoot.querySelector('[data-catalog="empty"]')).toBeTruthy();
  });

  it('asks the hub once, not once per keystroke on the panel', async () => {
    const client = fakeClient();
    const el = await mount(flowWith([], [{ kind: 'event', event: 'sale.completed' }]), client);
    await openTrigger(el);
    await openTrigger(el);
    await openTrigger(el);

    expect(client.events.list).toHaveBeenCalledTimes(1);
  });
});

describe('«Probar»: the two things a browser caught that happy-dom could not', () => {
  beforeEach(() => {
    document.body.replaceChildren();
  });

  const SHAPE = {
    event_name: 'sale.completed',
    declared_by: ['sales'],
    samples: 5,
    fields: [
      { path: 'total', type: 'number', sample: 4250, redacted: false, truncated: false, seen_in: 5 },
      { path: 'customer.name', type: 'string', sample: 'Marta Ruiz', redacted: false, truncated: false, seen_in: 5 },
    ],
  };

  const preview = async (steps: unknown[]): Promise<Element> => {
    const el = await mount(
      flowWith(steps, [{ kind: 'event', event: 'sale.completed' }]),
      fakeClient({ events: { shape: vi.fn(async () => SHAPE) } }),
    );
    el.tab = 'test';
    await el.updateComplete;
    await Promise.resolve();
    await el.updateComplete;
    return el.renderRoot.querySelector('.preview')!;
  };

  it('says «1 cosa», never «1 cosas»', async () => {
    // The lazy plural sits on the headline of the screen that is supposed to look finished. The
    // module already has the two-key helper for exactly this; this one line was not using it.
    const panel = await preview([
      { id: 's1', kind: 'command', command: 'x', params: { a: '{{input.nope}}' } },
    ]);
    expect(panel.textContent).toContain('ui.testBlanksFoundOne');
    expect(panel.textContent).not.toContain('ui.testBlanksFound:');
  });

  it('still SHOWS the line that would go out, so the hole in it is visible', async () => {
    // Replacing the whole value with «would arrive empty» hides which half is missing. «Gracias,
    // Marta Ruiz. Te esperamos en ␣» is the thing that makes the fault obvious at a glance.
    const panel = await preview([
      {
        id: 's1',
        kind: 'notify',
        channel: 'whatsapp',
        to: { query: 'q', params: {}, field: 'phone' },
        vars: { text: 'Gracias, {{input.customer.name}}. Te esperamos en {{input.shop_name}}' },
      },
    ]);
    expect(panel.textContent).toContain('Gracias, Marta Ruiz. Te esperamos en');
    expect(panel.textContent).toContain('ui.testBlank');
    expect(panel.querySelector('[data-blank="true"]')).toBeTruthy();
  });
});
