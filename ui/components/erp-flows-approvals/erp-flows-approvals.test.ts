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
    expect(el.renderRoot.textContent).toContain('already decided');
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
