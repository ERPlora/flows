import { describe, it, expect, beforeEach, vi } from 'vitest';
import './erp-flows-app';
import type { ErpFlowsApp } from './erp-flows-app';

/**
 * **Where the «needs your attention» tray appears, and when it does not** (flows#20).
 *
 * The tray itself is tested next door. What this file pins is the decision around it: a box headed
 * «needs your attention» that is empty on every screen, every day, is furniture — and furniture is
 * what people stop seeing, which is exactly how a lost invoice stays lost. So the screen ASKS the
 * cheap count first (`GET …/dead/count`, no payloads) and only mounts the tray when there is
 * something in it.
 *
 * The one exception is a refusal the owner can act on: `capability_denied` means the tray exists
 * and this module has not been allowed to read it, and that is worth a line on screen — silence
 * there would be the module quietly hiding its own missing permission.
 */

const FLOW = {
  id: 'f1',
  name: 'Remind the appointment',
  enabled: true,
  definition: {
    schema_version: 1,
    triggers: [{ kind: 'event', event: 'appointments.appointment.created' }],
    steps: [{ id: 'a', kind: 'command', command: 'tasks.task.create' }],
  },
};

function fakeClient(over: { events?: Record<string, unknown> } = {}) {
  return {
    flows: {
      list: vi.fn(async () => [FLOW]),
      schema: vi.fn(async () => ({ schema_version: 1, core_version: '1.0.2', schema: {} })),
      grants: vi.fn(async () => []),
      runs: vi.fn(async () => ({ data: [] })),
    },
    events: {
      shape: vi.fn(async () => ({ event_name: 'x', declared_by: [], samples: 0, fields: [] })),
      deadCount: vi.fn(async () => ({ count: 0 })),
      dead: vi.fn(async () => []),
      retry: vi.fn(async () => ({})),
      discard: vi.fn(async () => ({})),
      retryAll: vi.fn(async () => ({ retried: 0 })),
      ...over.events,
    },
  };
}

async function mount(client: unknown): Promise<ErpFlowsApp> {
  const el = document.createElement('erp-flows-app') as ErpFlowsApp;
  el.client = client as never;
  document.body.appendChild(el);
  await el.updateComplete;
  for (let i = 0; i < 6; i += 1) await Promise.resolve();
  await el.updateComplete;
  return el;
}

const tray = (el: ErpFlowsApp) => el.renderRoot.querySelector('erp-flows-dead-letter');

describe('the automations screen and the dead-letter tray', () => {
  beforeEach(() => {
    document.body.replaceChildren();
    (globalThis as { erplora?: unknown }).erplora = undefined;
  });

  it('asks the CHEAP count, not the queue with its payloads', async () => {
    const client = fakeClient();
    await mount(client);

    expect(client.events.deadCount).toHaveBeenCalled();
    expect(
      client.events.dead,
      'the screen must not drag every dead payload down just to decide whether to show a heading',
    ).not.toHaveBeenCalled();
  });

  it('shows no tray when nothing is stuck — an empty box is furniture', async () => {
    const el = await mount(fakeClient());
    expect(tray(el)).toBeNull();
  });

  it('mounts the tray as soon as something is stuck', async () => {
    const el = await mount(
      fakeClient({
        events: {
          deadCount: vi.fn(async () => ({ count: 1 })),
          dead: vi.fn(async () => [
            { id: 'e1', event_name: 'sale.completed', module_id: 'sales', retryable: true },
          ]),
        },
      }),
    );
    expect(tray(el)).toBeTruthy();
  });

  it('keeps the tray once it has been shown, so clearing the last row still confirms itself', async () => {
    // The tray announces its own count as it loads. If that number could unmount it, clearing the
    // last row would make the panel vanish under the owner's finger and take the «closed» line
    // with it — «did that work?» with nothing left on screen to answer.
    const el = await mount(
      fakeClient({
        events: { deadCount: vi.fn(async () => ({ count: 1 })), dead: vi.fn(async () => []) },
      }),
    );
    expect(tray(el)).toBeTruthy();
  });

  it('mounts it when the count is REFUSED for a permission, because that is fixable', async () => {
    const denied = Object.assign(new Error('nope'), { code: 'capability_denied' });
    const el = await mount(
      fakeClient({
        events: {
          deadCount: vi.fn(async () => {
            throw denied;
          }),
        },
      }),
    );
    expect(tray(el), 'a missing permission the owner can grant must not be hidden').toBeTruthy();
  });

  it('stays quiet on a hub that has no such surface at all', async () => {
    // Nothing the owner can do, and the module is not published to hubs that old anyway. A
    // permanent «this hub is too old» banner over the automations list would be pure noise.
    const client = fakeClient();
    delete (client.events as Record<string, unknown>).deadCount;
    delete (client.events as Record<string, unknown>).dead;
    const el = await mount(client);

    expect(tray(el)).toBeNull();
  });

  it('never lets the tray take the screen down with it', async () => {
    // The count is a side dish. A hub that answers it with a 500 still has automations to list.
    const el = await mount(
      fakeClient({
        events: {
          deadCount: vi.fn(async () => {
            throw new Error('boom');
          }),
        },
      }),
    );
    expect(el.renderRoot.textContent).toContain(FLOW.name);
  });
});
