import { describe, it, expect, beforeEach, vi } from 'vitest';
import './erp-flows-editor';
import type { ErpFlowsEditor } from './erp-flows-editor';

/**
 * **«Puede anular citas COMO CLIENTE» has to be sayable from the screen** (flows#66, hub#1623).
 *
 * The kernel has known how to contain this since hub#1623: a `command` grant can FIX part of the
 * payload, so a WhatsApp message cannot get an appointment cancelled «on behalf of the salon» and
 * skip the business's own cancellation rules. What was missing is the only place an owner ever
 * grants anything — this panel. Until it is here, the only way to set the limit is to call the API
 * by hand, which is not an interface anybody can be offered.
 */

const CANCEL = 'appointments.appointments.cancel';

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
      runs: vi.fn(async () => []),
      getRun: vi.fn(async () => ({ run: {}, steps: [], events: [] })),
      schema: vi.fn(async () => ({ schema_version: 1, core_version: '1.0.2', schema: {} })),
      secrets: vi.fn(async () => []),
      approvals: vi.fn(async () => []),
      ...(overrides.flows as object),
    },
    events: {
      shape: vi.fn(async () => ({ event_name: 'x', declared_by: [], samples: 0, fields: [] })),
      list: vi.fn(async () => []),
    },
  };
}

async function permissionsTab(client = fakeClient()): Promise<ErpFlowsEditor> {
  const el = document.createElement('erp-flows-editor') as ErpFlowsEditor;
  el.client = client as never;
  el.t = ((k: string, p?: Record<string, unknown>) =>
    p ? `${k}:${Object.values(p).join('|')}` : k) as never;
  el.flow = {
    id: 'f1',
    name: 'Test',
    enabled: true,
    definition: {
      schema_version: 1,
      triggers: [{ kind: 'manual' }],
      steps: [{ id: 'a', kind: 'command', command: CANCEL }],
    },
  } as never;
  document.body.appendChild(el);
  await el.updateComplete;
  await Promise.resolve();
  await el.updateComplete;
  el.tab = 'permissions' as never;
  await el.updateComplete;
  return el;
}

const q = <T extends Element>(el: ErpFlowsEditor, sel: string): T =>
  el.renderRoot.querySelector(sel) as T;

const rowOf = (el: ErpFlowsEditor, key: string): HTMLElement =>
  q<HTMLElement>(el, `[data-grant="${key}"]`);

async function click(el: ErpFlowsEditor, sel: string): Promise<void> {
  (q<HTMLElement>(el, sel) as HTMLElement).click();
  await el.updateComplete;
}

async function type(el: ErpFlowsEditor, sel: string, value: string): Promise<void> {
  const input = q<HTMLInputElement>(el, sel);
  input.value = value;
  input.dispatchEvent(new Event('change', { bubbles: true }));
  await el.updateComplete;
}

describe('the limits an owner can put on a permission (flows#66)', () => {
  beforeEach(() => {
    document.body.replaceChildren();
  });

  const granted = (payload?: Record<string, unknown>) =>
    fakeClient({
      flows: {
        grants: vi.fn(async () => [
          { id: 'g1', kind: 'command', value: CANCEL, ...(payload ? { payload } : {}) },
        ]),
        replaceGrants: vi.fn(async (_id: string, g: unknown) => g),
      },
    });

  it('offers a limit on a granted ACTION, and never on a kind the hub would refuse it on', async () => {
    // A pin on anything but a `command` is `flow.invalid_grant_payload`, and `PUT …/grants` is
    // all-or-nothing: offered on the wrong row it would not fail that row, it would lose the lot.
    const client = fakeClient({
      flows: {
        grants: vi.fn(async () => [
          { id: 'g1', kind: 'command', value: CANCEL },
          { id: 'g2', kind: 'http', value: 'https://api.example.com/*' },
          { id: 'g3', kind: 'notify', value: 'whatsapp' },
        ]),
      },
    });
    const el = await permissionsTab(client);
    expect(rowOf(el, `command ${CANCEL}`).querySelector('[data-act="limits"]')).not.toBeNull();
    expect(
      rowOf(el, 'http https://api.example.com/*').querySelector('[data-act="limits"]'),
    ).toBeNull();
    expect(rowOf(el, 'notify whatsapp').querySelector('[data-act="limits"]')).toBeNull();
  });

  it('offers nothing on a permission that has not been given yet', async () => {
    // A limit is a narrowing of a grant that EXISTS. Offering one next to «waiting for your
    // permission» would ask the owner to restrict something they have not allowed.
    const el = await permissionsTab(fakeClient());
    expect(el.renderRoot.querySelector('[data-act="limits"]')).toBeNull();
  });

  it('is folded away until the owner asks for it', async () => {
    const el = await permissionsTab(granted());
    expect(el.renderRoot.querySelector('[data-field="pin-name"]')).toBeNull();
    await click(el, '[data-act="limits"]');
    expect(el.renderRoot.querySelector('[data-field="pin-name"]')).not.toBeNull();
  });

  it('sends the limit the owner typed, and nothing else changes hands', async () => {
    const client = granted();
    const el = await permissionsTab(client);
    await click(el, '[data-act="limits"]');
    await type(el, '[data-field="pin-name"]', 'channel');
    await type(el, '[data-field="pin-value"]', 'customer');
    await click(el, '[data-act="save-limits"]');
    const [id, sent] = client.flows.replaceGrants.mock.calls[0] as [string, unknown];
    expect(id).toBe('f1');
    expect(sent).toEqual([{ kind: 'command', value: CANCEL, payload: { channel: 'customer' } }]);
  });

  it('says what was authorised, so the owner reads the limit without opening anything', async () => {
    const el = await permissionsTab(granted({ channel: 'customer' }));
    expect(rowOf(el, `command ${CANCEL}`).textContent).toContain('channel = customer');
  });

  it('reopens on the limit that is stored, not on an empty box', async () => {
    const el = await permissionsTab(granted({ channel: 'customer' }));
    await click(el, '[data-act="limits"]');
    expect(q<HTMLInputElement>(el, '[data-field="pin-name"]').value).toBe('channel');
    expect(q<HTMLInputElement>(el, '[data-field="pin-value"]').value).toBe('customer');
  });

  it('removes the limit and sends the grant WITHOUT a payload, not with an empty one', async () => {
    const client = granted({ channel: 'customer' });
    const el = await permissionsTab(client);
    await click(el, '[data-act="limits"]');
    await click(el, '[data-act="remove-limit"]');
    await click(el, '[data-act="save-limits"]');
    const [, sent] = client.flows.replaceGrants.mock.calls[0] as [string, unknown];
    expect(sent).toEqual([{ kind: 'command', value: CANCEL }]);
  });

  it('keeps every OTHER permission when the limits of one are saved', async () => {
    // Saving a limit re-sends the whole list, exactly as revoking does — `PUT …/grants` replaces.
    // A save that sent only the row being edited would not narrow that permission: it would
    // silently REVOKE every other one the flow holds, and the screen would come back saying so
    // only after the fact. The pins of those others have to survive the trip too.
    const client = fakeClient({
      flows: {
        grants: vi.fn(async () => [
          { id: 'g1', kind: 'command', value: CANCEL },
          { id: 'g2', kind: 'command', value: 'tasks.task.create', payload: { source: 'flow' } },
          { id: 'g3', kind: 'http', value: 'https://api.example.com/*' },
          { id: 'g4', kind: 'notify', value: 'whatsapp' },
        ]),
        replaceGrants: vi.fn(async (_id: string, g: unknown) => g),
      },
    });
    const el = await permissionsTab(client);
    await click(el, `[data-grant="command ${CANCEL}"] [data-act="limits"]`);
    await type(el, `[data-grant="command ${CANCEL}"] [data-field="pin-name"]`, 'channel');
    await type(el, `[data-grant="command ${CANCEL}"] [data-field="pin-value"]`, 'customer');
    await click(el, `[data-grant="command ${CANCEL}"] [data-act="save-limits"]`);
    const [, sent] = client.flows.replaceGrants.mock.calls[0] as [string, unknown];
    expect(sent).toEqual([
      { kind: 'command', value: CANCEL, payload: { channel: 'customer' } },
      { kind: 'command', value: 'tasks.task.create', payload: { source: 'flow' } },
      { kind: 'http', value: 'https://api.example.com/*' },
      { kind: 'notify', value: 'whatsapp' },
    ]);
  });

  it('keeps a limit when an unrelated permission is withdrawn', async () => {
    // The regression this whole panel can cause: `PUT …/grants` is a complete REPLACE, so every
    // action here re-sends every grant. Losing the pin on the way would turn «may cancel as the
    // customer» back into «may cancel», with nothing on screen saying so.
    const client = fakeClient({
      flows: {
        grants: vi.fn(async () => [
          { id: 'g1', kind: 'command', value: CANCEL, payload: { channel: 'customer' } },
          { id: 'g2', kind: 'http', value: 'https://api.example.com/*' },
        ]),
        replaceGrants: vi.fn(async (_id: string, g: unknown) => g),
      },
    });
    const el = await permissionsTab(client);
    await click(el, '[data-grant="http https://api.example.com/*"] [data-act="revoke"]');
    const [, sent] = client.flows.replaceGrants.mock.calls[0] as [string, unknown];
    expect(sent).toEqual([{ kind: 'command', value: CANCEL, payload: { channel: 'customer' } }]);
  });

  it('keeps a limit when another permission is granted', async () => {
    const client = fakeClient({
      flows: {
        grants: vi.fn(async () => [
          { id: 'g1', kind: 'command', value: CANCEL, payload: { channel: 'customer' } },
        ]),
        replaceGrants: vi.fn(async (_id: string, g: unknown) => g),
      },
    });
    const el = document.createElement('erp-flows-editor') as ErpFlowsEditor;
    el.client = client as never;
    el.t = ((k: string) => k) as never;
    el.flow = {
      id: 'f1',
      name: 'Test',
      enabled: true,
      definition: {
        schema_version: 1,
        triggers: [{ kind: 'manual' }],
        steps: [
          { id: 'a', kind: 'command', command: CANCEL },
          { id: 'b', kind: 'command', command: 'tasks.task.create' },
        ],
      },
    } as never;
    document.body.appendChild(el);
    await el.updateComplete;
    await Promise.resolve();
    await el.updateComplete;
    await el.grantAll();
    const [, sent] = client.flows.replaceGrants.mock.calls[0] as [string, unknown];
    expect(sent).toEqual([
      { kind: 'command', value: CANCEL, payload: { channel: 'customer' } },
      { kind: 'command', value: 'tasks.task.create' },
    ]);
  });

  it('shows what the hub refused instead of leaving the screen looking saved', async () => {
    const client = fakeClient({
      flows: {
        grants: vi.fn(async () => [{ id: 'g1', kind: 'command', value: CANCEL }]),
        replaceGrants: vi.fn(async () => {
          throw Object.assign(new Error('flow.invalid_grant_payload'), {
            code: 'flow.invalid_grant_payload',
          });
        }),
      },
    });
    const el = await permissionsTab(client);
    await click(el, '[data-act="limits"]');
    await type(el, '[data-field="pin-name"]', 'channel');
    await type(el, '[data-field="pin-value"]', 'customer');
    await click(el, '[data-act="save-limits"]');
    await el.updateComplete;
    expect(el.renderRoot.textContent).toContain('flow.invalid_grant_payload');
    // And what it holds is still what the HUB holds, not what the screen tried to write.
    expect(rowOf(el, `command ${CANCEL}`).textContent).not.toContain('channel = customer');
  });

  it('takes a second limit on the same permission', async () => {
    const client = granted({ channel: 'customer' });
    const el = await permissionsTab(client);
    await click(el, '[data-act="limits"]');
    await click(el, '[data-act="add-limit"]');
    const names = el.renderRoot.querySelectorAll<HTMLInputElement>('[data-field="pin-name"]');
    expect(names.length).toBe(2);
    names[1].value = 'source';
    names[1].dispatchEvent(new Event('change', { bubbles: true }));
    await el.updateComplete;
    const v = el.renderRoot.querySelectorAll<HTMLInputElement>('[data-field="pin-value"]')[1];
    v.value = 'whatsapp';
    v.dispatchEvent(new Event('change', { bubbles: true }));
    await el.updateComplete;
    await click(el, '[data-act="save-limits"]');
    const [, sent] = client.flows.replaceGrants.mock.calls[0] as [string, unknown];
    expect(sent).toEqual([
      { kind: 'command', value: CANCEL, payload: { channel: 'customer', source: 'whatsapp' } },
    ]);
  });

  it('every string on it is a catalogue key, never prose in the source', async () => {
    const el = await permissionsTab(granted({ channel: 'customer' }));
    await click(el, '[data-act="limits"]');
    const row = rowOf(el, `command ${CANCEL}`);
    for (const key of ['ui.grantLimits', 'ui.grantLimitField', 'ui.grantLimitValue']) {
      expect(row.textContent! + row.innerHTML).toContain(key);
    }
  });
});
