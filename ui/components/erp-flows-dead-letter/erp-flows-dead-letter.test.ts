import { describe, it, expect, beforeEach, vi } from 'vitest';
import './erp-flows-dead-letter';
import type { ErpFlowsDeadLetter } from './erp-flows-dead-letter';

/**
 * **«Necesita atención»: the work that did NOT happen** (flows#20, on hub#953's surface).
 *
 * A dead event is not a log line. It is the reminder that never went out, the invoice that was
 * never registered, the note nobody wrote — business the owner believes happened. Until hub#953 the
 * only way to see one was `curl`, so this tray is the whole distance between «the engine is built»
 * and «somebody can use it».
 *
 * **Nothing here calls a method or assigns a property on the component**, beyond mounting it with
 * its client and translator. Every gesture is a real `click` dispatched on a real control found in
 * the shadow root, and every assertion is on what the owner would then SEE or on what the hub was
 * then ASKED. A suite that reaches for `el.retry(id)` stays green while the screen is a photograph
 * — which is exactly the failure flows#17 was opened for.
 */

const t = ((k: string, p?: Record<string, unknown>) =>
  p ? `${k}:${Object.values(p).join('|')}` : k) as never;

/** A dead-letter as the hub really answers it (`crates/runtime/src/outbox.rs::DeadEvent`). */
const dead = (over: Record<string, unknown> = {}) => ({
  id: 'e1a2b3c4',
  event_name: 'sale.completed',
  module_id: 'sales',
  user_id: 'cashier-1',
  payload: { invoice_id: 'F2-1', total: '12.10' },
  last_error: 'verifactu.records.ingest_invoice: permission_denied',
  attempts: 8,
  depth: 1,
  created_at: '2026-08-14T10:00:00Z',
  failure_kind: '',
  retryable: true,
  ...over,
});

/** The row a retry can never fix: the owner withdrew the flow's authorisation (hub#827). */
const revoked = (over: Record<string, unknown> = {}) =>
  dead({
    id: 'e9f8d7c6',
    event_name: 'appointments.reminder.due',
    module_id: 'appointments',
    last_error: 'flow.release_revoked',
    failure_kind: 'flow.release_revoked',
    retryable: false,
    ...over,
  });

function fakeClient(overrides: { events?: Record<string, unknown> } = {}) {
  return {
    flows: {},
    events: {
      dead: vi.fn(async () => [dead()]),
      deadCount: vi.fn(async () => ({ count: 1 })),
      retry: vi.fn(async () => ({ id: 'e1a2b3c4', status: 'pending' })),
      discard: vi.fn(async () => ({ id: 'e1a2b3c4', status: 'discarded' })),
      retryAll: vi.fn(async () => ({ retried: 2 })),
      trace: vi.fn(async () => ({ event: {}, runs: [], caused: [] })),
      ...overrides.events,
    },
  };
}

async function settle(el: ErpFlowsDeadLetter): Promise<void> {
  await el.updateComplete;
  for (let i = 0; i < 4; i += 1) await Promise.resolve();
  await el.updateComplete;
}

async function mount(client: unknown = fakeClient()): Promise<ErpFlowsDeadLetter> {
  const el = document.createElement('erp-flows-dead-letter') as ErpFlowsDeadLetter;
  el.client = client as never;
  el.t = t;
  document.body.appendChild(el);
  await settle(el);
  return el;
}

/** A click as the browser delivers one: bubbling, and crossing the shadow boundary. */
async function click(el: ErpFlowsDeadLetter, target: Element | null | undefined): Promise<void> {
  expect(target, 'the control is not on the screen at all').toBeTruthy();
  target!.dispatchEvent(
    new MouseEvent('click', { bubbles: true, composed: true, cancelable: true }),
  );
  await settle(el);
}

const q = (el: ErpFlowsDeadLetter, sel: string) => el.shadowRoot!.querySelector(sel);
const all = (el: ErpFlowsDeadLetter, sel: string) => [...el.shadowRoot!.querySelectorAll(sel)];
const text = (el: ErpFlowsDeadLetter) => el.shadowRoot!.textContent ?? '';

describe('the «needs your attention» tray: events that never happened', () => {
  beforeEach(() => {
    document.body.replaceChildren();
  });

  it('asks the hub what died, and names the work rather than the row', async () => {
    const client = fakeClient();
    const el = await mount(client);

    expect(client.events.dead).toHaveBeenCalled();
    // The event and the module that produced it: «this came from Sales» is what tells the owner
    // WHICH part of their business is missing something.
    expect(text(el)).toContain('sale.completed');
    expect(text(el)).toContain('sales');
  });

  it('offers «Retry» for a row the hub says is retryable, and asks the hub for exactly that id', async () => {
    const client = fakeClient();
    const el = await mount(client);

    await click(el, q(el, '[data-act="retry"]'));

    expect(client.events.retry).toHaveBeenCalledWith('e1a2b3c4');
    // The row leaves: it is back in front of the relay, so it is no longer something to decide.
    expect(all(el, '[data-dead]')).toHaveLength(0);
  });

  it('NEVER offers «Retry» when the precondition is still unmet — it says what WOULD help', async () => {
    // The engine already refuses this retry
    // (`a_revoked_dead_letter_refuses_the_retry_instead_of_promising_one`). A button that calls it
    // anyway is a loop with no exit, drawn as the remedy: 200, attempts reset, dead again.
    const client = fakeClient({ events: { dead: vi.fn(async () => [revoked()]) } });
    const el = await mount(client);

    expect(all(el, '[data-dead]')).toHaveLength(1);
    expect(q(el, '[data-act="retry"]'), 'a button that cannot work must not be drawn').toBeNull();
    expect(text(el)).toContain('ui.deadRevoked');
    // Closing it is still available: an event that can never be delivered has to be closable.
    expect(q(el, '[data-act="discard"]')).toBeTruthy();
  });

  it('does not discard on one tap: closing a record for good is confirmed first', async () => {
    const client = fakeClient();
    const el = await mount(client);

    await click(el, q(el, '[data-act="discard"]'));

    expect(client.events.discard, 'the first tap only ASKS').not.toHaveBeenCalled();
    expect(text(el)).toContain('ui.deadDiscardConfirm');

    await click(el, q(el, '[data-act="discard-confirm"]'));

    expect(client.events.discard).toHaveBeenCalledWith('e1a2b3c4');
    expect(all(el, '[data-dead]')).toHaveLength(0);
  });

  it('says what discarding records — and what it does NOT record', async () => {
    // hub#955: the hub stores who and when, and no reason. Asking the owner «why?» and dropping
    // the answer would be worse than not asking — it manufactures a paper trail that is not there.
    const el = await mount();

    await click(el, q(el, '[data-act="discard"]'));

    expect(text(el)).toContain('ui.deadDiscardNoReason');
  });

  it('keeps the row when the hub REFUSES the retry, and shows why', async () => {
    // Dropping the row on a failed retry would tell the owner their invoice was re-sent when
    // nothing moved — the one outcome a recovery tray must never produce.
    const refusal = Object.assign(new Error('withdrawn'), { code: 'flow.release_revoked' });
    const client = fakeClient({
      events: {
        retry: vi.fn(async () => {
          throw refusal;
        }),
      },
    });
    const el = await mount(client);

    await click(el, q(el, '[data-act="retry"]'));

    expect(all(el, '[data-dead]'), 'the row stays: nothing moved').toHaveLength(1);
    expect(text(el)).toContain('ui.deadRevoked');
  });

  it('offers «Retry all» only when more than one row can actually be retried', async () => {
    const onlyOne = await mount();
    expect(q(onlyOne, '[data-act="retry-all"]'), 'one row needs no bulk gesture').toBeNull();

    // Two rows, but one of them can never be replayed: the sweep would still move only one, and
    // the endpoint skips it — offering «retry all» here would promise more than it does.
    const mixed = await mount(
      fakeClient({ events: { dead: vi.fn(async () => [dead(), revoked()]) } }),
    );
    expect(q(mixed, '[data-act="retry-all"]')).toBeNull();

    const client = fakeClient({
      events: { dead: vi.fn(async () => [dead(), dead({ id: 'e2' })]) },
    });
    const many = await mount(client);
    await click(many, q(many, '[data-act="retry-all"]'));
    expect(client.events.retryAll).toHaveBeenCalled();
  });

  it('folds the technical text instead of leading with it', async () => {
    const el = await mount();

    const fold = q(el, 'details');
    expect(fold, 'the raw error belongs under a fold, where support finds it').toBeTruthy();
    expect(fold!.textContent).toContain('verifactu.records.ingest_invoice: permission_denied');
  });

  it('puts the event reference where it can be copied — support asks for it by name', async () => {
    const el = await mount();
    expect(text(el)).toContain('e1a2b3c4');
    expect(q(el, '[data-act="copy"]')).toBeTruthy();
  });

  it('on a hub older than the surface, SAYS so instead of drawing an empty tray', async () => {
    // The SDK travels with the hub, so «older hub» reads as «the method is not there» (hub#953).
    // Pretending the queue is empty would be the worst answer: it says «nothing is wrong» about a
    // hub that cannot tell you whether anything is wrong.
    const el = await mount({ flows: {}, events: { shape: vi.fn() } });

    expect(text(el)).toContain('ui.deadUnsupported');
    expect(all(el, '[data-dead]')).toHaveLength(0);
  });

  it('names a missing permission as a permission, not as «error»', async () => {
    const denied = Object.assign(new Error('nope'), { code: 'capability_denied' });
    const el = await mount(
      fakeClient({
        events: {
          dead: vi.fn(async () => {
            throw denied;
          }),
        },
      }),
    );

    expect(text(el)).toContain('ui.deadDenied');
  });

  it('tells the screen around it how many need attention, so no empty box is ever mounted', async () => {
    const el = document.createElement('erp-flows-dead-letter') as ErpFlowsDeadLetter;
    el.client = fakeClient({ events: { dead: vi.fn(async () => [dead(), revoked()]) } }) as never;
    el.t = t;
    const counts: number[] = [];
    el.addEventListener('flows-dead-count', (e) => {
      counts.push((e as CustomEvent<{ count: number }>).detail.count);
    });
    document.body.appendChild(el);
    await settle(el);

    expect(counts.at(-1)).toBe(2);
  });
});
