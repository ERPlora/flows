import { describe, it, expect, beforeEach, vi } from 'vitest';
import './erp-flows-editor';
import type { ErpFlowsEditor } from './erp-flows-editor';

/**
 * **The history tab was empty on every hub, always.**
 *
 * Found on a real hub (2026-08-14): a flow with a `done` run and a `sleeping` one showed
 * «todavía no se ha ejecutado», while `GET /api/hub/flows/{id}/runs` answered two rows to the
 * same session a second later.
 *
 * The cause is a seam between two layers that each look right on their own. The runtime answers an
 * envelope, `{ok, data, next_cursor}`; the SDK's transport ends in `unwrap(env)`, which returns
 * `env.data` — so `flows.runs()` resolves to **the array**, even though it is TYPED `RunPage` and
 * the editor read `page.data` off it. `undefined ?? []` is an empty history, and an empty history
 * is indistinguishable on screen from a flow that never fired.
 *
 * It survived because the existing test's fake answered `{data: []}` — the shape the CODE wanted,
 * not the shape the HUB sends. A fake written from the implementation cannot fail the way
 * production does, which is why this file's fakes are copied from a real response instead.
 *
 * The fix accepts both shapes, because this module updates on its own clock: a hub whose SDK one
 * day stops unwrapping must not empty the history again on the way past.
 */

const RUNS = [
  {
    id: 'r1',
    status: 'done',
    trigger_kind: 'event',
    started_at: '2026-08-14T02:30:00Z',
    finished_at: '2026-08-14T02:31:05Z',
    created_at: '2026-08-14T02:30:00Z',
  },
  {
    id: 'r2',
    status: 'sleeping',
    trigger_kind: 'event',
    started_at: '2026-08-14T02:29:00Z',
    created_at: '2026-08-14T02:29:00Z',
  },
];

const FLOW = {
  id: 'f1',
  name: 'Llamar al cliente nuevo',
  enabled: true,
  definition: {
    schema_version: 1,
    triggers: [{ kind: 'event', event: 'customer.created' }],
    steps: [{ id: 'tarea', kind: 'command', command: 'tasks.tasks.create', params: {} }],
  },
};

function client(runs: unknown) {
  return {
    flows: {
      list: vi.fn(async () => []),
      create: vi.fn(),
      update: vi.fn(),
      get: vi.fn(),
      remove: vi.fn(),
      grants: vi.fn(async () => []),
      replaceGrants: vi.fn(),
      run: vi.fn(),
      runs: vi.fn(async () => runs),
      getRun: vi.fn(async () => ({ steps: [] })),
      schema: vi.fn(async () => ({ schema_version: 1, core_version: '1.0.4', schema: {} })),
      secrets: vi.fn(async () => []),
      approvals: vi.fn(async () => []),
    },
    events: { shape: vi.fn(async () => ({ event_name: 'customer.created', declared_by: [], samples: 1, fields: [] })) },
  };
}

async function openHistory(runs: unknown): Promise<ErpFlowsEditor> {
  const el = document.createElement('erp-flows-editor') as ErpFlowsEditor;
  el.client = client(runs) as never;
  el.t = ((k: string) => k) as never;
  el.flow = FLOW as never;
  document.body.appendChild(el);
  await el.updateComplete;
  el.tab = 'history';
  for (let i = 0; i < 6; i += 1) {
    await Promise.resolve();
    await el.updateComplete;
  }
  return el;
}

const text = (el: ErpFlowsEditor): string => el.renderRoot.textContent ?? '';

describe('the history of a flow that HAS run', () => {
  beforeEach(() => {
    document.body.replaceChildren();
  });

  it('shows the runs when the hub answers the way it really does — a bare array', async () => {
    const el = await openHistory(RUNS);
    expect(el.renderRoot.querySelectorAll('.run')).toHaveLength(2);
    expect(text(el)).not.toContain('historyEmpty');
  });

  it('still shows them if a future SDK stops unwrapping and hands back the page', async () => {
    const el = await openHistory({ data: RUNS, next_cursor: undefined });
    expect(el.renderRoot.querySelectorAll('.run')).toHaveLength(2);
  });

  it('says «not run yet» only when there is genuinely nothing', async () => {
    const el = await openHistory([]);
    expect(el.renderRoot.querySelectorAll('.run')).toHaveLength(0);
    expect(text(el)).toContain('historyEmpty');
  });

  it('does not mistake a refusal for an empty history', async () => {
    const el = document.createElement('erp-flows-editor') as ErpFlowsEditor;
    const c = client([]);
    c.flows.runs = vi.fn(async () => {
      throw Object.assign(new Error('nope'), { code: 'forbidden' });
    });
    el.client = c as never;
    el.t = ((k: string) => k) as never;
    el.flow = FLOW as never;
    document.body.appendChild(el);
    await el.updateComplete;
    el.tab = 'history';
    for (let i = 0; i < 6; i += 1) {
      await Promise.resolve();
      await el.updateComplete;
    }
    // The screen has to say something went wrong, not «this never ran».
    expect(text(el)).toContain('nope');
  });
});

/**
 * **«The condition was not met» on every guard, whichever one it was** (flows#163).
 *
 * The WhatsApp «Confirmed!» recipe stops at one of three guards — no phone, a phone that is not
 * international, no conversation on that number — and the history read the same sentence for all
 * three. The kernel stores only `{matched: false}`, so the words come from the step in the
 * document, and that only happens if the screen hands the step to the sentence.
 */
describe('a run that stopped at a guard', () => {
  beforeEach(() => {
    document.body.replaceChildren();
  });

  it('says which guard it was, in the words of its field', async () => {
    const el = document.createElement('erp-flows-editor') as ErpFlowsEditor;
    const c = client([{ id: 'r9', status: 'done', trigger_kind: 'event', created_at: '2026-10-07T09:00:00Z' }]);
    c.flows.getRun = vi.fn(async () => ({
      steps: [
        { step_index: 0, step_id: 'has_a_phone', kind: 'condition', status: 'done', output: { matched: true } },
        { step_index: 1, step_id: 'phone_is_international', kind: 'condition', status: 'stopped', output: { matched: false } },
      ],
    }));
    el.client = c as never;
    el.t = ((k: string, p?: Record<string, unknown>) => (p ? `${k}${JSON.stringify(p)}` : k)) as never;
    el.flow = {
      ...FLOW,
      definition: {
        schema_version: 1,
        triggers: [{ kind: 'event', event: 'appointments.appointment.confirmed' }],
        steps: [
          { id: 'has_a_phone', kind: 'condition', when: { 'steps.read_appointment.customer_phone': { neq: '' } } },
          {
            id: 'phone_is_international',
            kind: 'condition',
            when: { 'steps.reachable_on_whatsapp.phone_is_international': { eq: true } },
          },
        ],
      },
    } as never;
    document.body.appendChild(el);
    await el.updateComplete;
    el.tab = 'history';
    for (let i = 0; i < 6; i += 1) {
      await Promise.resolve();
      await el.updateComplete;
    }
    (el.renderRoot.querySelector('[data-act="open-run"]') as HTMLButtonElement).click();
    for (let i = 0; i < 6; i += 1) {
      await Promise.resolve();
      await el.updateComplete;
    }
    const lines = [...el.renderRoot.querySelectorAll('.run li')].map((li) => li.textContent ?? '');
    expect(lines).toHaveLength(2);
    expect(lines[0]).toContain('ui.ranGuardPassed');
    expect(lines[1]).toContain('ui.ranGuardStoppedOn');
    expect(lines[1]).toContain('Reachable on whatsapp › Phone is international');
  });
});
