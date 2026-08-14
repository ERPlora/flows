import { describe, it, expect, beforeEach, vi } from 'vitest';
import './erp-flows-app';
import type { ErpFlowsApp } from './erp-flows-app';

/**
 * **flows#4 — what the assistant proposes is a DRAFT, and a draft is not an automation.**
 *
 * The hard rule under test is not «it is created paused»: it is that nothing is created at all
 * until a person presses the button. So most of what these tests assert is a NEGATIVE —
 * `flows.create` was not called, no grant was written — because that is the failure that would be
 * invisible on screen and catastrophic in a shop.
 */

const goodDefinition = {
  schema_version: 1,
  triggers: [{ kind: 'event', event: 'appointments.appointment.no_show' }],
  steps: [
    {
      id: 's1',
      kind: 'command',
      command: 'tasks.tasks.create',
      params: { title: 'Call them back', priority: '' },
    },
  ],
};

const DRAFT = {
  id: 'd1',
  name: 'Call back the no-shows',
  definition: JSON.stringify(goodDefinition),
  notes: JSON.stringify(['You said «next day»; the wait is set to 1 day.']),
  status: 'pending',
  created_at: '2026-08-14T09:00:00Z',
};

const SCHEMA = {
  schema_version: 1,
  core_version: '1.0.4',
  schema: {
    properties: { schema_version: { const: 1 } },
    $defs: {
      trigger: { properties: { kind: { enum: ['event', 'cron', 'at', 'manual'] } } },
      step: {
        properties: {
          kind: { enum: ['command', 'condition', 'delay', 'http', 'ai', 'notify'] },
          tools: { type: 'object' },
        },
      },
      condition: { additionalProperties: { properties: { eq: {}, gte: {}, exists: {} } } },
    },
  },
};

function fakeClient(over: Record<string, unknown> = {}) {
  return {
    flows: {
      list: vi.fn(async () => []),
      create: vi.fn(async (f: unknown) => ({ id: 'created', ...(f as object) })),
      update: vi.fn(async (id: string, f: unknown) => ({ id, ...(f as object) })),
      remove: vi.fn(async () => ({})),
      grants: vi.fn(async () => []),
      replaceGrants: vi.fn(async () => []),
      runs: vi.fn(async () => ({ data: [] })),
      getRun: vi.fn(async () => ({ steps: [] })),
      run: vi.fn(async () => ({})),
      get: vi.fn(async () => ({})),
      schema: vi.fn(async () => SCHEMA),
      ...(over.flows as object),
    },
    events: {
      shape: vi.fn(async () => ({
        event_name: 'appointments.appointment.no_show',
        declared_by: ['appointments'],
        samples: 3,
        fields: [],
      })),
      ...(over.events as object),
    },
    query: vi.fn(async () => [DRAFT]),
    command: vi.fn(async () => ({ ok: true })),
    ...over,
  };
}

async function mount(client: unknown): Promise<ErpFlowsApp> {
  const el = document.createElement('erp-flows-app') as ErpFlowsApp;
  el.client = client as never;
  document.body.appendChild(el);
  await el.updateComplete;
  for (let i = 0; i < 6; i += 1) {
    await Promise.resolve();
    await el.updateComplete;
  }
  return el;
}

const draftRow = (el: ErpFlowsApp): Element | null => el.renderRoot.querySelector('[data-draft="d1"]');

describe('the tray of proposals', () => {
  beforeEach(() => {
    document.body.replaceChildren();
    (globalThis as { erplora?: unknown }).erplora = undefined;
  });

  it('asks the module for what the assistant left, and shows it above the list', async () => {
    const client = fakeClient();
    const el = await mount(client);
    expect(client.query).toHaveBeenCalledWith('flows.drafts.list');
    expect(draftRow(el)?.textContent).toContain('Call back the no-shows');
  });

  it('creates NOTHING while a proposal is only sitting there', async () => {
    const client = fakeClient();
    await mount(client);
    expect(client.flows.create).not.toHaveBeenCalled();
    expect(client.flows.update).not.toHaveBeenCalled();
    expect(client.flows.replaceGrants).not.toHaveBeenCalled();
  });

  it('keeps working on a hub whose installed flows module has no drafts surface yet', async () => {
    // An older published version of this very module has no `flows.drafts.list`. The screen has to
    // survive its own past: the tray is simply not there.
    const client = fakeClient({
      query: vi.fn(async () => {
        throw Object.assign(new Error('unknown query'), { code: 'query_not_found' });
      }),
    });
    const el = await mount(client);
    expect(draftRow(el)).toBeNull();
    expect(el.renderRoot.querySelector('erp-flows-gallery')).toBeTruthy();
  });

  it('discards one without ever having made it into a flow', async () => {
    const client = fakeClient();
    const el = await mount(client);
    (draftRow(el)!.querySelector('[data-act="dismiss"]') as HTMLButtonElement).click();
    await el.updateComplete;
    await Promise.resolve();
    await el.updateComplete;
    expect(client.command).toHaveBeenCalledWith('flows.drafts.resolve', {
      id: 'd1',
      outcome: 'dismissed',
      flow_id: '',
    });
    expect(client.flows.create).not.toHaveBeenCalled();
    expect(draftRow(el)).toBeNull();
  });
});

describe('opening a proposal', () => {
  beforeEach(() => {
    document.body.replaceChildren();
  });

  it('lands it in the same vertical spine, unconfirmed and PAUSED, without saving it', async () => {
    const client = fakeClient();
    const el = await mount(client);
    (draftRow(el)!.querySelector('[data-act="review"]') as HTMLButtonElement).click();
    await el.updateComplete;

    const editor = el.renderRoot.querySelector('erp-flows-editor') as {
      flow?: { id: string; enabled: boolean; definition: { steps: unknown[] } };
      draft?: { notes: string[]; gaps: { stepId: string }[] } | null;
    };
    // `id: ''` is «not a flow yet»: the editor's save CREATES instead of updating.
    expect(editor.flow?.id).toBe('');
    expect(editor.flow?.enabled).toBe(false);
    expect(editor.flow?.definition.steps).toHaveLength(1);
    expect(editor.draft?.notes[0]).toContain('next day');
    expect(client.flows.create).not.toHaveBeenCalled();
  });

  it('highlights the hole the assistant left in a parameter', async () => {
    const el = await mount(fakeClient());
    (draftRow(el)!.querySelector('[data-act="review"]') as HTMLButtonElement).click();
    await el.updateComplete;
    const editor = el.renderRoot.querySelector('erp-flows-editor') as {
      draft?: { gaps: { stepId: string; params?: Record<string, unknown> }[] };
    };
    expect(editor.draft?.gaps.some((g) => g.params?.name === 'priority')).toBe(true);
  });

  it('checks the trigger against THIS hub before calling it good', async () => {
    const client = fakeClient({
      events: {
        shape: vi.fn(async () => {
          throw Object.assign(new Error('no such event'), { code: 'not_found' });
        }),
      },
    });
    const el = await mount(client);
    (draftRow(el)!.querySelector('[data-act="review"]') as HTMLButtonElement).click();
    await el.updateComplete;
    await Promise.resolve();
    await el.updateComplete;
    const editor = el.renderRoot.querySelector('erp-flows-editor') as {
      draft?: { gaps: { stepId: string }[] };
    };
    expect(editor.draft?.gaps.map((g) => g.stepId)).toContain('trigger');
  });

  it('records that the proposal became a flow, once the person saved it', async () => {
    const client = fakeClient();
    const el = await mount(client);
    (draftRow(el)!.querySelector('[data-act="review"]') as HTMLButtonElement).click();
    await el.updateComplete;
    el.renderRoot.querySelector('erp-flows-editor')!.dispatchEvent(
      new CustomEvent('flows-saved', {
        detail: { flow: { id: 'f-new', name: 'x', enabled: false, definition: {} } },
        bubbles: true,
        composed: true,
      }),
    );
    await el.updateComplete;
    await Promise.resolve();
    expect(client.command).toHaveBeenCalledWith('flows.drafts.resolve', {
      id: 'd1',
      outcome: 'used',
      flow_id: 'f-new',
    });
  });
});

describe('a proposal that does not meet the contract', () => {
  beforeEach(() => {
    document.body.replaceChildren();
  });

  it('is refused with a sentence, and cannot be opened', async () => {
    const broken = {
      ...DRAFT,
      definition: JSON.stringify({
        schema_version: 1,
        triggers: [{ kind: 'event', event: 'x.y' }],
        // `tools` as an ARRAY — the shape hub#786 lost a day to, and one a model keeps writing.
        steps: [{ id: 's1', kind: 'ai', prompt: 'hi', tools: ['sales.list'] }],
      }),
    };
    const client = fakeClient({ query: vi.fn(async () => [broken]) });
    const el = await mount(client);
    const row = draftRow(el)!;
    expect(row.querySelector('[data-act="review"]')).toBeNull();
    expect(row.querySelector('[data-act="dismiss"]')).toBeTruthy();
    expect(row.textContent).not.toBe('');
  });

  it('is refused when it is not even JSON, instead of blanking the screen', async () => {
    const client = fakeClient({
      query: vi.fn(async () => [{ ...DRAFT, definition: 'Sure! Here is your automation:' }]),
    });
    const el = await mount(client);
    expect(draftRow(el)).toBeTruthy();
    expect(draftRow(el)!.querySelector('[data-act="review"]')).toBeNull();
  });
});
