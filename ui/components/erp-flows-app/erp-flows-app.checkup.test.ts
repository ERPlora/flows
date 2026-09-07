import { describe, it, expect, beforeEach, vi } from 'vitest';
import './erp-flows-app';
import type { ErpFlowsApp } from './erp-flows-app';
import { WHATSAPP_MESSAGE_EVENT } from '../../lib/flow-checkup';

/**
 * **The automation that was already mounted when we fixed the card** (flows#63).
 *
 * A salon that tapped «Usar esta» before flows v0.1.33 is running a copy of the document of that
 * day: it answers the owner's own replies echoed back from her phone and the 180 days of backlog
 * Meta hands over on connection. Nothing reaches that copy — the gallery hands out copies and
 * keeps no link — so the only place the owner can be told is the automation itself.
 *
 * Driven the way flows#17 established: find the control in the shadow root and dispatch a real
 * event on it. No method is called and no property is assigned.
 */

/** What the gallery wrote before `3eceac0`: one clause, and the two guards missing. */
const beforeTheFix = () => ({
  schema_version: 1,
  triggers: [
    {
      kind: 'event',
      event: WHATSAPP_MESSAGE_EVENT,
      filter: { 'event.text': { neq: '' } },
      input: { from: 'event.from', text: 'event.text' },
    },
  ],
  steps: [{ id: 'tell_her', kind: 'notify', channel: 'whatsapp' }],
});

/** The same automation as the gallery writes it today. */
const afterTheFix = () => {
  const doc = beforeTheFix();
  doc.triggers[0].filter = {
    'event.text': { neq: '' },
    'event.direction': { neq: 'outbound' },
    'event.source': { neq: 'history' },
  } as never;
  return doc;
};

const ROWS = [
  {
    id: 'old',
    name: 'WhatsApp → cita',
    enabled: true,
    updated_at: '2026-09-05T10:00:00Z',
    definition: beforeTheFix(),
  },
  {
    id: 'new',
    name: 'WhatsApp → cita (nueva)',
    enabled: true,
    updated_at: '2026-09-04T10:00:00Z',
    definition: afterTheFix(),
  },
];

function translate(catalog: Record<string, unknown>, key: string, params?: Record<string, unknown>): string {
  let node: unknown = (catalog as { en?: unknown }).en ?? catalog;
  for (const part of key.split('.')) {
    node = node && typeof node === 'object' ? (node as Record<string, unknown>)[part] : undefined;
  }
  const text = typeof node === 'string' ? node : key;
  return params
    ? text.replace(/\{(\w+)\}/g, (whole, name) => (name in params ? String(params[name]) : whole))
    : text;
}

function fakeClient(rows = ROWS.map((r) => ({ ...r, definition: structuredClone(r.definition) }))) {
  const update = vi.fn(async (id: string, f: Record<string, unknown>) => ({ id, ...f }));
  return {
    t: translate,
    flows: {
      list: vi.fn(async () => rows),
      create: vi.fn(async () => ({ id: 'x' })),
      update,
      remove: vi.fn(async () => ({})),
      grants: vi.fn(async () => []),
      replaceGrants: vi.fn(async () => []),
      runs: vi.fn(async () => []),
      getRun: vi.fn(async () => ({ steps: [] })),
      run: vi.fn(async () => ({})),
      get: vi.fn(async (id: string) => rows.find((r) => r.id === id)),
      schema: vi.fn(async () => ({ schema_version: 1, core_version: '1.0.2', schema: {} })),
      approvals: vi.fn(async () => []),
    },
    events: {
      shape: vi.fn(async () => ({ event_name: 'x', declared_by: [], samples: 0, fields: [] })),
    },
  };
}

async function settle(el: ErpFlowsApp): Promise<void> {
  await el.updateComplete;
  for (let i = 0; i < 8; i += 1) await Promise.resolve();
  await el.updateComplete;
}

async function mount(client: unknown): Promise<ErpFlowsApp> {
  const el = document.createElement('erp-flows-app') as ErpFlowsApp;
  el.client = client as never;
  document.body.appendChild(el);
  await settle(el);
  await settle(el);
  return el;
}

const rowOf = (el: ErpFlowsApp, id: string): Element | null =>
  el.renderRoot.querySelector(`[data-flow="${id}"]`);

const warningOn = (el: ErpFlowsApp, id: string): Element | null =>
  rowOf(el, id)?.querySelector('[data-checkup]') ?? null;

async function click(el: ErpFlowsApp, target: Element | null | undefined): Promise<void> {
  expect(target, 'the control is not on the screen at all').toBeTruthy();
  target!.dispatchEvent(new MouseEvent('click', { bubbles: true, composed: true, cancelable: true }));
  await settle(el);
}

describe('telling the owner her automation is the one that answers itself', () => {
  beforeEach(() => document.body.replaceChildren());

  it('warns on the automation that was created before the fix', async () => {
    const el = await mount(fakeClient());
    const warning = warningOn(el, 'old');
    expect(warning).toBeTruthy();
    // In her words, not ours: the key must have resolved to real text out of the catalogue.
    expect(warning!.textContent).not.toContain('ui.checkup');
    expect(warning!.textContent?.trim().length).toBeGreaterThan(20);
  });

  // The other half of the control: without this, a warning drawn on every row would still pass.
  it('says nothing about the automation that already has the guards', async () => {
    const el = await mount(fakeClient());
    expect(rowOf(el, 'new')).toBeTruthy();
    expect(warningOn(el, 'new')).toBeNull();
  });

  it('repairs it in one tap, keeping its name and leaving it running', async () => {
    const client = fakeClient();
    const el = await mount(client);
    await click(el, warningOn(el, 'old')!.querySelector('[data-act="checkup-fix"]'));

    expect(client.flows.update).toHaveBeenCalledTimes(1);
    const [id, body] = client.flows.update.mock.calls[0] as [string, Record<string, unknown>];
    expect(id).toBe('old');
    expect(body.name).toBe('WhatsApp → cita');
    expect(body.enabled).toBe(true);
    const filter = (body.definition as never as { triggers: { filter: unknown }[] }).triggers[0].filter;
    expect(filter).toEqual({
      'event.text': { neq: '' },
      'event.direction': { neq: 'outbound' },
      'event.source': { neq: 'history' },
    });
  });

  it('takes the warning off the row once it is repaired, without a reload', async () => {
    const el = await mount(fakeClient());
    await click(el, warningOn(el, 'old')!.querySelector('[data-act="checkup-fix"]'));
    expect(warningOn(el, 'old')).toBeNull();
  });

  /**
   * **The warning may only leave the row because the HUB kept the fix.**
   *
   * `PUT /flows/{id}` revalidates the document and re-seeds the triggers, and what comes back is
   * what is stored — a core that dropped the two clauses would leave the salon exactly as exposed
   * as before. Believing our own copy here is how the screen tells her it is fixed while her
   * WhatsApp keeps answering itself, which is worse than never having offered the button.
   */
  it('keeps the warning when the hub stores a document that still has the flaw', async () => {
    const client = fakeClient();
    client.flows.update = vi.fn(async (id: string, f: Record<string, unknown>) => ({
      id,
      ...f,
      definition: beforeTheFix(),
    })) as never;
    const el = await mount(client);
    await click(el, warningOn(el, 'old')!.querySelector('[data-act="checkup-fix"]'));
    expect(warningOn(el, 'old')).toBeTruthy();
    // And it must not read as one that did: no «all fixed» banner on a repair that did not take.
    expect(el.renderRoot.querySelector('[data-notice]')).toBeNull();
  });

  /**
   * A repair that fails must not look like one that worked. The row keeps its warning and the
   * screen says so — the alternative is an owner who believes her WhatsApp is fixed and finds out
   * from a customer that it is not.
   */
  it('keeps the warning and shows the failure when the hub refuses the save', async () => {
    const client = fakeClient();
    client.flows.update = vi.fn(async () => {
      throw new Error('boom');
    }) as never;
    const el = await mount(client);
    await click(el, warningOn(el, 'old')!.querySelector('[data-act="checkup-fix"]'));
    expect(warningOn(el, 'old')).toBeTruthy();
    expect(el.renderRoot.textContent).toContain('boom');
  });
  /**
   * **Two old automations, and the second button answers nothing** (review of flows#71).
   *
   * A salon that mounted the card twice — one for the salon, one for the second chair — has the
   * flaw twice. `repair()` refuses to start a second save while one is running, which is right:
   * two `PUT`s racing on the same list would write the row twice. What was wrong is that only the
   * button being saved went disabled, so the OTHER one still looked pressable, and pressing it did
   * nothing at all: no save, no warning, no error. A control that looks alive and answers nothing
   * is the mute failure this repo does not ship — she presses it twice, decides the screen is
   * broken, and the automation she came to fix stays broken.
   *
   * So while a repair is in flight EVERY repair button is disabled, and the one she pressed says
   * so.
   */
  it('disables the other old automation’s button while a repair is in flight', async () => {
    let landTheSave!: () => void;
    const inFlight = new Promise<void>((resolve) => {
      landTheSave = resolve;
    });
    const twoOld = [
      { id: 'old-a', name: 'WhatsApp → cita (salón)', enabled: true, updated_at: '2026-09-05T10:00:00Z', definition: beforeTheFix() },
      { id: 'old-b', name: 'WhatsApp → cita (segunda silla)', enabled: true, updated_at: '2026-09-04T10:00:00Z', definition: beforeTheFix() },
    ];
    const client = fakeClient(twoOld as never);
    client.flows.update = vi.fn(async (id: string, f: Record<string, unknown>) => {
      await inFlight;
      return { id, ...f };
    }) as never;
    const el = await mount(client);

    const fixButton = (id: string): HTMLButtonElement | null =>
      (warningOn(el, id)?.querySelector('[data-act="checkup-fix"]') as HTMLButtonElement) ?? null;

    expect(fixButton('old-a'), 'the first automation is not even warned about').toBeTruthy();
    expect(fixButton('old-b'), 'the second automation is not even warned about').toBeTruthy();
    expect(fixButton('old-b')!.hasAttribute('disabled'), 'nothing is saving yet').toBe(false);

    // Press the first one and DO NOT let the save land: this is the window she can press in.
    await click(el, fixButton('old-a'));

    expect(
      fixButton('old-b')!.hasAttribute('disabled'),
      'the other old automation still offers a button that would do nothing at all',
    ).toBe(true);
    expect(fixButton('old-a')!.hasAttribute('disabled'), 'the one being saved is disabled too').toBe(true);
    expect(fixButton('old-a')!.textContent?.trim(), 'the button she pressed does not say it is busy').not.toBe(
      fixButton('old-b')!.textContent?.trim(),
    );

    // And once it lands, the other one is pressable again — a screen that stays locked after a
    // save is the same mute failure with better manners.
    landTheSave();
    await settle(el);
    await settle(el);
    expect(warningOn(el, 'old-a'), 'the repaired automation keeps its warning').toBeNull();
    expect(fixButton('old-b')!.hasAttribute('disabled'), 'the second button never came back').toBe(false);
  });
});
