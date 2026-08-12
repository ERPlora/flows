import { describe, it, expect, beforeEach, vi } from 'vitest';
import './erp-flows-app';
import type { ErpFlowsApp } from './erp-flows-app';

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

function fakeClient(over: Record<string, unknown> = {}) {
  return {
    flows: {
      list: vi.fn(async () => [FLOW]),
      create: vi.fn(async (f: unknown) => ({ id: 'new', ...(f as object) })),
      update: vi.fn(async (id: string, f: unknown) => ({ id, ...(f as object) })),
      remove: vi.fn(async () => ({})),
      grants: vi.fn(async () => []),
      replaceGrants: vi.fn(async () => []),
      runs: vi.fn(async () => ({ data: [] })),
      getRun: vi.fn(async () => ({ steps: [] })),
      run: vi.fn(async () => ({})),
      get: vi.fn(async () => FLOW),
      schema: vi.fn(async () => ({ schema_version: 1, core_version: '1.0.2', schema: {} })),
      ...(over.flows as object),
    },
    events: { shape: vi.fn(async () => ({ event_name: 'x', declared_by: [], samples: 0, fields: [] })) },
  };
}

async function mount(client: unknown): Promise<ErpFlowsApp> {
  const el = document.createElement('erp-flows-app') as ErpFlowsApp;
  if (client) el.client = client as never;
  document.body.appendChild(el);
  await el.updateComplete;
  await Promise.resolve();
  await Promise.resolve();
  await el.updateComplete;
  return el;
}

// `ok-empty-state` renders its heading inside its own shadow root, so the contract to assert
// is the heading it was HANDED — which is also the thing that would break if the gate picked
// the wrong sentence.
const heading = (el: ErpFlowsApp): string =>
  el.renderRoot.querySelector('ok-empty-state')?.getAttribute('heading') ?? '';

describe('opening the automations screen', () => {
  beforeEach(() => {
    document.body.replaceChildren();
    (globalThis as { erplora?: unknown }).erplora = undefined;
  });

  it('says the hub is too old rather than showing a broken screen', async () => {
    // `erplora dev`'s preview client and any hub older than hub#714 have no flows surface at all.
    const el = await mount(null);
    expect(heading(el)).toContain('unsupportedTitle');
  });

  it('asks for the capability by NAME when the owner has not granted it', async () => {
    // `capability_denied` is a specific refusal precisely so this screen can say what to turn on
    // instead of printing the word «error» at somebody.
    const client = fakeClient({
      flows: {
        list: vi.fn(async () => {
          throw Object.assign(new Error('nope'), { code: 'capability_denied' });
        }),
      },
    });
    const el = await mount(client);
    expect(heading(el)).toContain('noAccessTitle');
  });

  it('says an employee session is the wrong session, not that something is broken', async () => {
    const client = fakeClient({
      flows: {
        list: vi.fn(async () => {
          throw Object.assign(new Error('admin session required'), { code: 'forbidden' });
        }),
      },
    });
    const el = await mount(client);
    expect(heading(el)).toContain('notAdminTitle');
  });

  it('refuses to EDIT against a hub that enforces a document version it does not write', async () => {
    // The schema is asked at open time (hub#716) exactly so this can be noticed here, where it
    // can be explained, instead of as a save that fails for reasons nobody can act on.
    const client = fakeClient({
      flows: { schema: vi.fn(async () => ({ schema_version: 2, core_version: '2.0.0', schema: {} })) },
    });
    const el = await mount(client);
    expect(heading(el)).toContain('unsupportedTitle');
  });

  it('does NOT bundle a copy of the schema: it asks the hub for it', async () => {
    const client = fakeClient();
    await mount(client);
    expect(client.flows.schema).toHaveBeenCalled();
  });
});

describe('the list of automations', () => {
  beforeEach(() => {
    document.body.replaceChildren();
  });

  it('shows each one with what starts it, in words', async () => {
    const el = await mount(fakeClient());
    const row = el.renderRoot.querySelector('[data-flow="f1"]')!;
    expect(row.textContent).toContain('Remind the appointment');
    // «Cuando se reserva una cita», not `appointments.appointment.created`.
    expect(row.textContent).not.toContain('appointments.appointment.created');
  });

  // flows#1: what used to be here was an empty list with a «New automation» button — a blank
  // canvas with an extra step. A hub with nothing automated yet opens on the gallery.
  it('opens on the gallery of ready-made ones, never on an empty page', async () => {
    const client = fakeClient({ flows: { list: vi.fn(async () => []) } });
    const el = await mount(client);
    expect(el.renderRoot.querySelector('erp-flows-gallery')).toBeTruthy();
    expect(el.renderRoot.querySelector('ok-empty-state')).toBeNull();
  });

  it('pauses one WITHOUT touching what it does', async () => {
    // `PUT /flows/{id}` revalidates the document and re-seeds the triggers. Sending anything less
    // than the whole flow to flip a switch would rewrite the automation.
    const client = fakeClient();
    const el = await mount(client);
    await el.setEnabled(FLOW as never, false);
    const [id, body] = client.flows.update.mock.calls[0] as [
      string,
      { enabled: boolean; definition: { steps: unknown[] } },
    ];
    expect(id).toBe('f1');
    expect(body.enabled).toBe(false);
    expect(body.definition.steps).toHaveLength(1);
  });

  it('opens the editor on the automation that was tapped', async () => {
    const el = await mount(fakeClient());
    (el.renderRoot.querySelector('[data-flow="f1"] button') as HTMLButtonElement).click();
    await el.updateComplete;
    const editor = el.renderRoot.querySelector('erp-flows-editor') as { flow?: { id: string } };
    expect(editor?.flow?.id).toBe('f1');
  });

  it('opens an empty editor for a new one', async () => {
    const el = await mount(fakeClient());
    (el.renderRoot.querySelector('[data-act="new"]') as HTMLButtonElement).click();
    await el.updateComplete;
    const editor = el.renderRoot.querySelector('erp-flows-editor') as { flow?: unknown };
    expect(editor).toBeTruthy();
    expect(editor.flow).toBeNull();
  });
});

describe('the gallery is the way in (flows#1)', () => {
  beforeEach(() => {
    document.body.replaceChildren();
  });

  it('still shows the automations that already exist, above the gallery', async () => {
    const el = await mount(fakeClient());
    expect(el.renderRoot.querySelector('[data-flow="f1"]')).toBeTruthy();
    expect(el.renderRoot.querySelector('erp-flows-gallery')).toBeTruthy();
  });

  // A flow with no grants does nothing at all, and does it in silence. Landing on the step list
  // would leave the owner one hidden tab away from the only screen that makes it work — which is
  // exactly the place pm#134 says people get stuck.
  it('opens a brand new template on its PERMISSIONS, not on its steps', async () => {
    const el = await mount(fakeClient());
    const created = { id: 'from-template', name: 'x', enabled: false, definition: { steps: [] } };
    el.renderRoot
      .querySelector('erp-flows-gallery')!
      .dispatchEvent(
        new CustomEvent('flows-template-used', {
          detail: { flow: created, needsGrants: true },
          bubbles: true,
          composed: true,
        }),
      );
    await el.updateComplete;

    const editor = el.renderRoot.querySelector('erp-flows-editor') as {
      flow?: { id: string };
      tab?: string;
    };
    expect(editor?.flow?.id).toBe('from-template');
    expect(editor?.tab).toBe('permissions');
  });

  it('opens a template that asks for nothing on its steps', async () => {
    const el = await mount(fakeClient());
    el.renderRoot.querySelector('erp-flows-gallery')!.dispatchEvent(
      new CustomEvent('flows-template-used', {
        detail: { flow: { id: 'f9', name: 'x', enabled: false, definition: {} }, needsGrants: false },
        bubbles: true,
        composed: true,
      }),
    );
    await el.updateComplete;
    expect((el.renderRoot.querySelector('erp-flows-editor') as { tab?: string })?.tab).toBe('editor');
  });
});

describe('the guide (pm#134)', () => {
  beforeEach(() => {
    document.body.replaceChildren();
  });

  it('opens from the gallery and comes back to it', async () => {
    const el = await mount(fakeClient());
    el.renderRoot
      .querySelector('erp-flows-gallery')!
      .dispatchEvent(new CustomEvent('flows-open-guide', { bubbles: true, composed: true }));
    await el.updateComplete;
    const guide = el.renderRoot.querySelector('erp-flows-guide');
    expect(guide).toBeTruthy();

    guide!.dispatchEvent(new CustomEvent('flows-guide-close', { bubbles: true, composed: true }));
    await el.updateComplete;
    expect(el.renderRoot.querySelector('erp-flows-guide')).toBeNull();
    expect(el.renderRoot.querySelector('erp-flows-gallery')).toBeTruthy();
  });
});
