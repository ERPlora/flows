import { describe, it, expect, beforeEach, vi } from 'vitest';
import './erp-flows-gallery';
import { ErpFlowsGallery } from './erp-flows-gallery';
import '../erp-flows-app/erp-flows-app';
import type { ErpFlowsApp } from '../erp-flows-app/erp-flows-app';
import { templateById, buildTemplate } from '../../lib/templates';
import en from '../../../locales/en.json';

/** The shell's translator, reduced to the lookup a test needs. */
const t = (key: string, params?: Record<string, unknown>): string => {
  let cur: unknown = en;
  for (const part of key.split('.')) {
    cur = cur && typeof cur === 'object' ? (cur as Record<string, unknown>)[part] : undefined;
  }
  const found = typeof cur === 'string' ? cur : key;
  return params ? found.replace(/\{(\w+)\}/g, (_, name: string) => String(params[name] ?? '')) : found;
};

/** The no-show card, as the hub hands it back once the owner has set it up. */
const installedFlow = (over: Record<string, unknown> = {}) => ({
  id: 'f1',
  name: 'Call back the no-shows',
  enabled: true,
  definition: buildTemplate(templateById('no-show-followup')!, t) as unknown as Record<string, unknown>,
  ...over,
});

/** A hub that knows every event, lists the flows given and answers for their grants. */
function hub(flows: Record<string, unknown>[] = [], over: Record<string, unknown> = {}) {
  return {
    flows: {
      create: vi.fn(async (flow: unknown) => ({ id: 'created-1', ...(flow as object) })),
      list: vi.fn(async () => flows),
      grants: vi.fn(async () => [{ kind: 'command', value: 'tasks.tasks.create' }]),
      ...(over.flows as object),
    },
    events: {
      shape: vi.fn(async (name: string) => ({
        event_name: name,
        declared_by: ['x'],
        samples: 0,
        fields: [],
      })),
      ...(over.events as object),
    },
  };
}

async function mount(client: unknown): Promise<ErpFlowsGallery> {
  const el = document.createElement('erp-flows-gallery') as ErpFlowsGallery;
  el.client = client as never;
  el.t = t;
  document.body.appendChild(el);
  await settle(el);
  return el;
}

async function settle(el: ErpFlowsGallery): Promise<void> {
  await el.updateComplete;
  for (let i = 0; i < 10; i += 1) await Promise.resolve();
  await el.updateComplete;
}

const card = (el: ErpFlowsGallery, id: string): HTMLElement | null =>
  el.renderRoot.querySelector(`[data-template="${id}"]`);
const act = (el: ErpFlowsGallery, name: string): HTMLElement | null =>
  el.renderRoot.querySelector(`[data-act="${name}"]`);

/**
 * **The card of an automation this hub already runs** (flows#60).
 *
 * The gallery offered «Use this one» on every card for ever, so the owner who set the automation
 * up three weeks ago — and does not remember, or arrives from the WhatsApp shortcut — tapped it
 * again and got a SECOND automation listening to exactly the same thing. On the WhatsApp cards
 * that is two answers to the same customer for one message.
 */
describe('a card whose automation this hub already has', () => {
  beforeEach(() => document.body.replaceChildren());

  it('says so on the card itself, before it is opened', async () => {
    const el = await mount(hub([installedFlow()]));
    const badge = card(el, 'no-show-followup')?.querySelector('ok-status-pill');
    expect(badge, 'the card of an installed automation looks like every other one').toBeTruthy();
    expect(badge?.getAttribute('label')).toBe(t('ui.active'));
    expect(card(el, 'no-show-followup')?.getAttribute('data-installed')).toBe('active');
  });

  it('says «Paused» when the owner has switched it off', async () => {
    const el = await mount(hub([installedFlow({ enabled: false })]));
    const badge = card(el, 'no-show-followup')?.querySelector('ok-status-pill');
    expect(badge?.getAttribute('label')).toBe(t('ui.paused'));
    expect(card(el, 'no-show-followup')?.getAttribute('data-installed')).toBe('paused');
  });

  it('says «Unfinished» about the one that was created and never granted anything', async () => {
    const client = hub([installedFlow({ enabled: false })], {
      flows: { list: vi.fn(async () => [installedFlow({ enabled: false })]), grants: vi.fn(async () => []) },
    });
    const el = await mount(client);
    const badge = card(el, 'no-show-followup')?.querySelector('ok-status-pill');
    expect(badge?.getAttribute('label')).toBe(t('ui.tplUnfinished'));
    expect(card(el, 'no-show-followup')?.getAttribute('data-installed')).toBe('unfinished');
  });

  it('leaves the card the hub does NOT have exactly as it was', async () => {
    // The control. With the badge wired to «are there any flows» this whole file passes green
    // while badging the entire catalogue, so the hub HAS the no-show automation and the card being
    // checked is a different one.
    const el = await mount(hub([installedFlow()]));
    const other = card(el, 'welcome-new-customer');
    expect(other?.querySelector('ok-status-pill')).toBeNull();
    expect(other?.getAttribute('data-installed')).toBeNull();
  });

  it('offers «View it» instead of creating a second one', async () => {
    const client = hub([installedFlow()]);
    const el = await mount(client);
    el.open('no-show-followup');
    await settle(el);

    const opened: unknown[] = [];
    el.addEventListener('flows-open-flow', (e) => opened.push((e as CustomEvent).detail));

    const view = act(el, 'view');
    expect(view, 'an installed card still leads with «Use this one»').toBeTruthy();
    expect(view?.textContent?.trim()).toBe(t('ui.tplView'));
    (view as HTMLElement).click();
    await settle(el);

    expect(client.flows.create, 'viewing it created another automation').not.toHaveBeenCalled();
    expect(opened).toHaveLength(1);
    expect((opened[0] as { flow: { id: string } }).flow.id).toBe('f1');
    expect((opened[0] as { needsGrants: boolean }).needsGrants).toBe(false);
  });

  it('sends the half-built one straight to Permissions, which is what it is missing', async () => {
    const client = hub([installedFlow({ enabled: false })], {
      flows: { list: vi.fn(async () => [installedFlow({ enabled: false })]), grants: vi.fn(async () => []) },
    });
    const el = await mount(client);
    el.open('no-show-followup');
    await settle(el);

    const opened: { needsGrants: boolean }[] = [];
    el.addEventListener('flows-open-flow', (e) => opened.push((e as CustomEvent).detail));
    (act(el, 'view') as HTMLElement).click();
    await settle(el);

    expect(opened[0]?.needsGrants).toBe(true);
  });

  it('still lets them build a second one on purpose — it is their hub', async () => {
    // Warn, do not refuse: the same stance this gallery already takes on two flows sharing a
    // trigger (whatsapp_inbox#58), and the one the switch-over needs — «pause the attended twin,
    // install the unattended one» goes through a card that is badged.
    const client = hub([installedFlow()]);
    const el = await mount(client);
    el.open('no-show-followup');
    await settle(el);

    const use = act(el, 'use');
    expect(use, 'an installed card cannot be used again at all').toBeTruthy();
    (use as HTMLElement).click();
    await settle(el);
    expect(client.flows.create).toHaveBeenCalledTimes(1);
  });

  it('leads with «Use this one» on a card the hub does not have', async () => {
    const el = await mount(hub([]));
    el.open('no-show-followup');
    await settle(el);
    expect(act(el, 'view')).toBeNull();
    expect(act(el, 'use')?.textContent?.trim()).toBe(t('ui.tplUse'));
  });
});

/**
 * The badge is a courtesy; the catalogue is the screen. Everything that can go wrong reading it
 * ends in «no badge», never in an error and never in a card that cannot be used.
 */
describe('what the badge costs, and what happens when the hub will not answer', () => {
  beforeEach(() => document.body.replaceChildren());

  it('asks for no grants at all on a hub with nothing automated yet', async () => {
    const client = hub([]);
    await mount(client);
    expect(client.flows.grants, 'a fresh hub paid a round trip per card').not.toHaveBeenCalled();
  });

  it('asks only about the flows that listen on a card’s event', async () => {
    const cron = {
      id: 'f9',
      name: 'Friday review',
      enabled: true,
      definition: { schema_version: 1, triggers: [{ kind: 'cron', cron: '0 18 * * 5' }], steps: [] },
    };
    const client = hub([cron, installedFlow()]);
    await mount(client);
    // The ids asked about, not how many times: the element loads once on connect and again when
    // the shell hands it a client, which is how `list` and `probe` have always behaved (flows#68).
    // What this pins is that the question is asked about the candidate and about nothing else.
    const asked = new Set(client.flows.grants.mock.calls.map((call) => call[0]));
    expect([...asked]).toEqual(['f1']);
  });

  it('shows the gallery unbadged when the hub refuses to hand over grants', async () => {
    const client = hub([installedFlow()], {
      flows: {
        list: vi.fn(async () => [installedFlow()]),
        grants: vi.fn(async () => {
          throw new Error('nope');
        }),
      },
    });
    const el = await mount(client);
    el.open('no-show-followup');
    await settle(el);

    expect(card(el, 'no-show-followup')).toBeTruthy();
    expect(card(el, 'no-show-followup')?.getAttribute('data-installed')).toBeNull();
    expect(act(el, 'use')).toBeTruthy();
    expect(
      el.renderRoot.querySelector('ok-inline-feedback[tone="danger"]'),
      'a refusal to read grants became an error on the catalogue',
    ).toBeNull();
  });

  it('works on a core whose flows surface has no grants method', async () => {
    const client = hub([installedFlow()], {
      flows: { list: vi.fn(async () => [installedFlow()]), grants: undefined },
    });
    const el = await mount(client);
    expect(card(el, 'no-show-followup')?.getAttribute('data-installed')).toBeNull();
    expect(card(el, 'no-show-followup')).toBeTruthy();
  });
});

/** The other half: the screen that owns the editor has to answer the gallery's request. */
describe('the screen opens the automation the gallery points at', () => {
  beforeEach(() => document.body.replaceChildren());

  it('opens the existing flow instead of the gallery', async () => {
    const flow = installedFlow();
    const app = document.createElement('erp-flows-app') as ErpFlowsApp;
    app.client = {
      t: (_c: unknown, key: string) => key,
      flows: {
        list: vi.fn(async () => [flow]),
        schema: vi.fn(async () => ({ schema_version: 1, core_version: '1.0.2', schema: {} })),
        grants: vi.fn(async () => [{ kind: 'command', value: 'tasks.tasks.create' }]),
        replaceGrants: vi.fn(async () => []),
        approvals: vi.fn(async () => []),
        runs: vi.fn(async () => []),
      },
      events: { shape: vi.fn(async () => ({ event_name: 'x', declared_by: [], samples: 0, fields: [] })) },
    } as never;
    document.body.appendChild(app);
    for (let round = 0; round < 3; round += 1) {
      await app.updateComplete;
      for (let i = 0; i < 12; i += 1) await Promise.resolve();
      await app.updateComplete;
    }

    // Dispatched where the gallery really dispatches it — on itself, from inside the app's shadow
    // root. An event fired on the app would never reach a listener bound to its child.
    const gallery = app.renderRoot.querySelector('erp-flows-gallery');
    expect(gallery, 'the gallery is not on the screen at all').toBeTruthy();
    gallery!.dispatchEvent(
      new CustomEvent('flows-open-flow', {
        detail: { flow, needsGrants: true },
        bubbles: true,
        composed: true,
      }),
    );
    await app.updateComplete;
    for (let i = 0; i < 12; i += 1) await Promise.resolve();
    await app.updateComplete;

    const editor = app.renderRoot.querySelector('erp-flows-editor');
    expect(editor, 'the gallery asked for a flow and the screen stayed on the gallery').toBeTruthy();
    expect((editor as unknown as { flow: { id: string } }).flow.id).toBe('f1');
    expect((editor as unknown as { tab: string }).tab).toBe('permissions');
  });
});
