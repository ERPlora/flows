import { describe, it, expect, beforeEach, vi } from 'vitest';
import './erp-flows-approvals';
import type { ErpFlowsApprovals } from './erp-flows-approvals';

const t = ((k: string, p?: Record<string, unknown>) =>
  p ? `${k}:${Object.values(p).join('|')}` : k) as never;

function fakeClient(overrides: Record<string, unknown> = {}) {
  return {
    flows: {
      approvals: vi.fn(async () => []),
      approve: vi.fn(async () => ({ status: 'approved' })),
      reject: vi.fn(async () => ({ status: 'rejected' })),
      ...(overrides.flows as object),
    },
    events: { shape: vi.fn() },
  };
}

async function mount(client = fakeClient()): Promise<ErpFlowsApprovals> {
  const el = document.createElement('erp-flows-approvals') as ErpFlowsApprovals;
  el.client = client as never;
  el.t = t;
  document.body.appendChild(el);
  await el.updateComplete;
  await Promise.resolve();
  await el.updateComplete;
  return el;
}

const pending = (over: Record<string, unknown> = {}) => ({
  id: 'ap1',
  run_id: 'r1',
  flow_id: 'f1',
  step_id: 's2',
  command: 'customers.notes.add',
  payload: { customer_id: 'c1', content: 'Called about the appointment' },
  reason: 'The customer asked to move it',
  status: 'pending',
  expires_at: '2026-08-17T09:00:00Z',
  created_at: '2026-08-14T09:00:00Z',
  ...over,
});

describe('the approval tray: what a manual ai step is waiting on', () => {
  beforeEach(() => {
    document.body.replaceChildren();
  });

  it('asks the hub only for what is PENDING, which is the only thing to act on', async () => {
    const client = fakeClient();
    await mount(client);
    expect(client.flows.approvals).toHaveBeenCalledWith('pending');
  });

  it('says what would be RUN and why, not that «a step is waiting»', async () => {
    // The whole point of `policy: manual` is that a person judges the write before it happens.
    // A row that does not name the command and its payload gives them nothing to judge.
    const client = fakeClient({ flows: { approvals: vi.fn(async () => [pending()]) } });
    const el = await mount(client);
    const text = el.renderRoot.textContent ?? '';
    expect(text).toContain('customers.notes.add');
    expect(text).toContain('Called about the appointment');
    expect(text).toContain('The customer asked to move it');
  });

  it('approves the one that was pressed, and takes it off the list', async () => {
    const approve = vi.fn(async () => ({ status: 'approved' }));
    const approvals = vi.fn(async () => [pending(), pending({ id: 'ap2', command: 'tasks.tasks.create' })]);
    const client = fakeClient({ flows: { approvals, approve } });
    const el = await mount(client);
    (el.renderRoot.querySelector('[data-approval="ap1"] [data-act="approve"]') as HTMLElement).click();
    await el.updateComplete;
    await Promise.resolve();
    await el.updateComplete;
    expect(approve).toHaveBeenCalledWith('ap1');
    expect(el.renderRoot.querySelector('[data-approval="ap1"]')).toBeNull();
    expect(el.renderRoot.querySelector('[data-approval="ap2"]')).toBeTruthy();
  });

  it('rejects without asking twice, because rejecting is the SAFE answer', async () => {
    const reject = vi.fn(async () => ({ status: 'rejected' }));
    const client = fakeClient({ flows: { approvals: vi.fn(async () => [pending()]), reject } });
    const el = await mount(client);
    (el.renderRoot.querySelector('[data-approval="ap1"] [data-act="reject"]') as HTMLElement).click();
    await el.updateComplete;
    await Promise.resolve();
    await el.updateComplete;
    expect(reject).toHaveBeenCalledWith('ap1');
    expect(el.renderRoot.querySelector('[data-approval="ap1"]')).toBeNull();
  });

  it('says WHEN the proposal dies, because it dies on its own after 72 hours', async () => {
    // An approval that simply expires is a decision made by a timer. The row has to say so, or
    // «nothing happened and nobody said why» is what the owner gets three days later.
    const client = fakeClient({ flows: { approvals: vi.fn(async () => [pending()]) } });
    const el = await mount(client);
    expect(el.renderRoot.textContent).toContain('ui.approvalExpires');
  });

  it('keeps the row when the hub refuses, instead of pretending it was decided', async () => {
    // `flow.approval_already_decided` and `flow.approval_expired` are real answers. Removing the
    // row anyway would tell the owner they approved something that never ran.
    const approve = vi.fn(async () => {
      throw Object.assign(new Error('already decided'), { code: 'flow.approval_already_decided' });
    });
    const client = fakeClient({ flows: { approvals: vi.fn(async () => [pending()]), approve } });
    const el = await mount(client);
    (el.renderRoot.querySelector('[data-approval="ap1"] [data-act="approve"]') as HTMLElement).click();
    await el.updateComplete;
    await Promise.resolve();
    await el.updateComplete;
    expect(el.renderRoot.querySelector('[data-approval="ap1"]')).toBeTruthy();
    // Since flows#31 the code is said in the owner's words, not echoed as the hub's message.
    expect(el.renderRoot.textContent).toContain('ui.approvalErrAlreadyDecided');
  });

  it('says the tray is empty rather than showing an empty box', async () => {
    const el = await mount();
    expect(el.renderRoot.textContent).toContain('ui.approvalsEmpty');
  });

  it('reports how many are waiting, so the shell can badge it', async () => {
    const client = fakeClient({ flows: { approvals: vi.fn(async () => [pending(), pending({ id: 'ap2' })]) } });
    const counted: number[] = [];
    const el = document.createElement('erp-flows-approvals') as ErpFlowsApprovals;
    el.client = client as never;
    el.t = t;
    el.addEventListener('flows-approvals-count', (e) =>
      counted.push((e as CustomEvent<{ count: number }>).detail.count),
    );
    document.body.appendChild(el);
    await el.updateComplete;
    await Promise.resolve();
    await el.updateComplete;
    expect(counted).toContain(2);
  });

  it('stays quiet on a hub whose core has no approvals surface', async () => {
    // An older hub simply has no such method. Throwing here would blank the automations screen.
    const el = await mount({ flows: {}, events: { shape: vi.fn() } } as never);
    expect(el.renderRoot.textContent).toContain('ui.approvalsEmpty');
  });
});

describe('the tray with a QUESTION in it — the generic approval step (hub#950, flows#31)', () => {
  beforeEach(() => {
    document.body.replaceChildren();
  });

  const decision = (over: Record<string, unknown> = {}) => ({
    id: 'dq1',
    run_id: 'r2',
    flow_id: 'f2',
    step_id: 'ok',
    kind: 'decision',
    command: '',
    payload: {},
    title: 'Approve the purchase from Casa Pepe?',
    summary: 'Amount 1.240 €',
    assignee_role: 'manager',
    status: 'pending',
    expires_at: '2026-08-21T09:00:00Z',
    on_expire: 'reject',
    on_reject: 'cancel',
    created_at: '2026-08-18T09:00:00Z',
    ...over,
  });

  it('shows the QUESTION and its summary, and NO command or payload — there is none', async () => {
    const client = fakeClient({ flows: { approvals: vi.fn(async () => [decision()]) } });
    const el = await mount(client);
    const card = el.renderRoot.querySelector('[data-approval="dq1"]')!;
    expect(card.getAttribute('data-kind')).toBe('decision');
    expect(card.textContent).toContain('Approve the purchase from Casa Pepe?');
    expect(card.textContent).toContain('Amount 1.240 €');
    expect(card.textContent).not.toContain('ui.approvalWould');
    expect(card.querySelector('pre')).toBeNull();
  });

  it('still draws a model\'s proposal the old way — the two kinds share one tray', async () => {
    const client = fakeClient({ flows: { approvals: vi.fn(async () => [pending(), decision()]) } });
    const el = await mount(client);
    const proposal = el.renderRoot.querySelector('[data-approval="ap1"]')!;
    expect(proposal.getAttribute('data-kind')).toBe('command');
    expect(proposal.textContent).toContain('ui.approvalWould');
    expect(proposal.querySelector('pre')).toBeTruthy();
  });

  it('says WHO was asked, and that whoever administers the hub can answer anyway', async () => {
    const client = fakeClient({ flows: { approvals: vi.fn(async () => [decision()]) } });
    const el = await mount(client);
    const card = el.renderRoot.querySelector('[data-approval="dq1"]')!;
    expect(card.textContent).toContain('ui.approvalAskedRole:manager');
  });

  it('says what waiting costs and what a no costs, in the words of the policies', async () => {
    // Expiry is a decision made by a timer, and `on_expire` says what that decision means for the
    // run. Rejecting has a meaning too now (`on_reject`); the button has to say it before it is pressed.
    const client = fakeClient({
      flows: { approvals: vi.fn(async () => [decision({ on_expire: 'continue', on_reject: 'continue' })]) },
    });
    const el = await mount(client);
    const card = el.renderRoot.querySelector('[data-approval="dq1"]')!;
    expect(card.textContent).toContain('ui.approvalExpires_continue');
    expect(card.textContent).toContain('ui.approvalOnReject_continue');
  });

  it('sends the comment WITH the decision, and no body at all when there is none', async () => {
    const approve = vi.fn(async () => ({ status: 'approved' }));
    const reject = vi.fn(async () => ({ status: 'rejected' }));
    const client = fakeClient({
      flows: { approvals: vi.fn(async () => [decision(), decision({ id: 'dq2' })]), approve, reject },
    });
    const el = await mount(client);
    const box = el.renderRoot.querySelector('[data-approval="dq1"] [data-field="comment"]') as HTMLTextAreaElement;
    box.value = 'Only if it ships this week';
    box.dispatchEvent(new Event('input'));
    await el.updateComplete;
    (el.renderRoot.querySelector('[data-approval="dq1"] [data-act="approve"]') as HTMLElement).click();
    await el.updateComplete;
    await Promise.resolve();
    await el.updateComplete;
    expect(approve).toHaveBeenCalledWith('dq1', { comment: 'Only if it ships this week' });
    (el.renderRoot.querySelector('[data-approval="dq2"] [data-act="reject"]') as HTMLElement).click();
    await el.updateComplete;
    await Promise.resolve();
    // No comment typed → the call is exactly what it was before this feature.
    expect(reject).toHaveBeenCalledWith('dq2');
  });

  it('says in words why the hub refused: expired, already decided, or NOT YOURS to answer', async () => {
    // `flow.approval_not_yours` is a 403 and it is new: authenticated, but not the role that was
    // asked. The row stays, and the sentence says which of the three it was.
    for (const [code, key] of [
      ['flow.approval_expired', 'ui.approvalErrExpired'],
      ['flow.approval_already_decided', 'ui.approvalErrAlreadyDecided'],
      ['flow.approval_not_yours', 'ui.approvalErrNotYours'],
    ]) {
      document.body.replaceChildren();
      const approve = vi.fn(async () => {
        throw Object.assign(new Error('raw'), { code });
      });
      const client = fakeClient({ flows: { approvals: vi.fn(async () => [decision()]), approve } });
      const el = await mount(client);
      (el.renderRoot.querySelector('[data-approval="dq1"] [data-act="approve"]') as HTMLElement).click();
      await el.updateComplete;
      await Promise.resolve();
      await el.updateComplete;
      expect(el.renderRoot.querySelector('[data-approval="dq1"]'), code).toBeTruthy();
      expect(el.renderRoot.textContent, code).toContain(key);
    }
  });

  it('refreshes when the hub announces a new or an expired request over the WS', async () => {
    // Without this a tray that was open all night keeps showing a question that can no longer be
    // answered, and misses one asked at 8:00 until somebody reloads.
    const approvals = vi.fn(async () => []);
    const listeners: Record<string, (p: unknown) => void> = {};
    const unsubscribe = vi.fn();
    const subscribe = vi.fn((event: string, cb: (p: unknown) => void) => {
      listeners[event] = cb;
      return unsubscribe;
    });
    const el = await mount({ ...fakeClient({ flows: { approvals } }), subscribe } as never);
    expect(Object.keys(listeners).sort()).toEqual(['flow.approval.created', 'flow.approval.expired']);
    const before = approvals.mock.calls.length;
    listeners['flow.approval.created']({ approval_id: 'x', kind: 'decision' });
    await el.updateComplete;
    await Promise.resolve();
    expect(approvals.mock.calls.length).toBe(before + 1);
    el.remove();
    expect(unsubscribe).toHaveBeenCalledTimes(2);
  });

  it('works exactly as before on a hub whose client has no subscribe', async () => {
    const el = await mount();
    expect(el.renderRoot.textContent).toContain('ui.approvalsEmpty');
  });
});

