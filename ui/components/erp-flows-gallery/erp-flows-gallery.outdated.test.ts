import { describe, it, expect, beforeEach, vi } from 'vitest';
import './erp-flows-gallery';
import { ErpFlowsGallery } from './erp-flows-gallery';
import { QUERY_GRANT_PIN_CORE, schemaFacts } from '../../lib/ai-draft';
import { moduleTemplateId } from '../../lib/module-templates';
import en from '../../../locales/en.json';
import es from '../../../locales/es.json';

/**
 * **A recipe the owner activated, whose module has since shipped a better one** (flows#136).
 *
 * The hub keeps the flow exactly as it was the day it was switched on (hub#1684) and, since
 * hub#2059, says so: `installed.outdated` on `GET /api/hub/flows/templates`, and a
 * `POST …/templates/{module}/{family}/restore` that rebuilds the SAME flow from the module's current
 * recipe. Without this screen the owner never learns there is a newer version, and her only way to
 * get it is deleting the automation — and its history — and activating it again.
 *
 * The recipe belongs to ANOTHER module (`whatsapp_inbox`), so the gallery restores it through its
 * own door (`restoreModuleTemplate(module, family)`), never by acting as that module.
 */
const CURRENT_CORE = schemaFacts(
  {
    $defs: { step: { properties: { interactive: { type: 'object' }, output: { type: 'object' } } } },
  },
  QUERY_GRANT_PIN_CORE,
);

const lookup = (catalog: unknown, key: string): unknown => {
  let cur: unknown = catalog;
  for (const part of key.split('.')) {
    cur = cur && typeof cur === 'object' ? (cur as Record<string, unknown>)[part] : undefined;
  }
  return cur;
};

const t = (key: string, params?: Record<string, unknown>): string => {
  const cur = lookup(en, key);
  const found = typeof cur === 'string' ? cur : key;
  return params
    ? found.replace(/\{(\w+)\}/g, (_, name: string) => String(params[name] ?? ''))
    : found;
};

const MODULE = 'inventory';
const FAMILY = 'restock-when-low';
const EVENT = 'inventory.stock.low';
const COMMAND = 'purchases.orders.draft';
const SERVED_ID = moduleTemplateId(MODULE, FAMILY);

const document_ = () => ({
  schema_version: 1,
  name: 'Order more when stock runs low',
  triggers: [{ kind: 'event', event: EVENT }],
  steps: [{ id: 'draft', kind: 'command', command: COMMAND, params: {} }],
});

const servedRow = (installed: unknown) => ({
  module: MODULE,
  family: FAMILY,
  documents: { en: document_() },
  grants: [{ kind: 'command', value: COMMAND }],
  installed,
});

const ownerFlow = () => ({
  id: 'f-served',
  name: 'Order more when stock runs low',
  enabled: true,
  definition: document_() as unknown as Record<string, unknown>,
});

function hub(installed: unknown, over: Record<string, unknown> = {}) {
  return {
    flows: {
      create: vi.fn(async (flow: unknown) => ({ id: 'created-1', ...(flow as object) })),
      replaceGrants: vi.fn(async () => []),
      list: vi.fn(async () => [ownerFlow()]),
      grants: vi.fn(async (_id: string) => [{ kind: 'command', value: COMMAND }]),
      templates: vi.fn(async () => [servedRow(installed)]),
      restoreModuleTemplate: vi.fn(async () => ({ ...ownerFlow(), name: 'Restored' })),
      ...over,
    },
    events: {
      shape: vi.fn(async (name: string) => ({
        event_name: name,
        declared_by: ['x'],
        samples: 0,
        fields: [],
      })),
    },
  };
}

async function settle(el: ErpFlowsGallery): Promise<void> {
  await el.updateComplete;
  for (let i = 0; i < 12; i += 1) await Promise.resolve();
  await el.updateComplete;
}

async function mount(client: unknown): Promise<ErpFlowsGallery> {
  const el = document.createElement('erp-flows-gallery') as ErpFlowsGallery;
  el.facts = CURRENT_CORE;
  el.client = client as never;
  el.t = t;
  document.body.appendChild(el);
  await settle(el);
  return el;
}

const card = (el: ErpFlowsGallery, id: string): HTMLElement | null =>
  el.renderRoot.querySelector(`[data-template="${id}"]`);
const inCard = (el: ErpFlowsGallery, selector: string): HTMLElement | null =>
  card(el, SERVED_ID)?.querySelector(selector) ?? null;

async function openCard(el: ErpFlowsGallery): Promise<void> {
  (card(el, SERVED_ID)?.querySelector('button.pick') as HTMLElement).click();
  await settle(el);
}

async function press(el: ErpFlowsGallery, act: string): Promise<void> {
  const button = inCard(el, `[data-act="${act}"]`);
  expect(button, `no «${act}» button on the card`).toBeTruthy();
  button!.click();
  await settle(el);
}

const OUTDATED = { flow_id: 'f-served', enabled: true, outdated: true };

describe('an activated recipe whose module ships a newer version (flows#136)', () => {
  beforeEach(() => {
    document.body.replaceChildren();
    window.history.replaceState({}, '', '/');
  });

  it('says there is a new version on the card itself, before it is opened', async () => {
    const el = await mount(hub(OUTDATED));
    const pill = inCard(el, '[data-outdated]');
    expect(pill, 'the card of an outdated recipe looks like every other one').toBeTruthy();
    expect(pill?.getAttribute('label')).toBe(t('ui.tplOutdated'));
  });

  it('explains it and offers to restore it once the card is opened', async () => {
    const el = await mount(hub(OUTDATED));
    await openCard(el);
    expect(inCard(el, '[data-outdated-notice]')?.textContent).toContain(t('ui.tplOutdatedNotice'));
    expect(inCard(el, '[data-act="restore"]')?.textContent).toContain(t('ui.tplRestore'));
  });

  it('asks before restoring, and cancelling touches nothing', async () => {
    const client = hub(OUTDATED);
    const el = await mount(client);
    await openCard(el);
    await press(el, 'restore');
    expect(inCard(el, '[data-restore-confirm]')?.textContent).toContain(t('ui.tplRestoreConfirm'));
    expect(client.flows.restoreModuleTemplate, 'restored without asking').not.toHaveBeenCalled();

    await press(el, 'restore-no');
    expect(inCard(el, '[data-restore-confirm]')).toBeNull();
    expect(client.flows.restoreModuleTemplate).not.toHaveBeenCalled();
  });

  it('restores the recipe of the module it came from, through the gallery’s own door', async () => {
    const client = hub(OUTDATED);
    const el = await mount(client);
    await openCard(el);
    await press(el, 'restore');
    await press(el, 'restore-yes');

    expect(client.flows.restoreModuleTemplate).toHaveBeenCalledTimes(1);
    expect(client.flows.restoreModuleTemplate).toHaveBeenCalledWith(MODULE, FAMILY);
    expect(inCard(el, '[data-restored]')?.textContent).toContain(t('ui.tplRestored'));
    expect(inCard(el, '[data-outdated]'), 'still says there is a new version after restoring it').toBeNull();
    expect(inCard(el, '[data-outdated-notice]')).toBeNull();
    expect(inCard(el, '[data-restore-confirm]')).toBeNull();
  });

  it('says the automation is gone when the hub has nothing left to restore', async () => {
    const client = hub(OUTDATED, {
      restoreModuleTemplate: vi.fn(async () => {
        throw Object.assign(new Error('not found'), { code: 'flow.not_found' });
      }),
    });
    const el = await mount(client);
    await openCard(el);
    await press(el, 'restore');
    await press(el, 'restore-yes');
    expect(inCard(el, 'ok-inline-feedback[tone="danger"]')?.textContent).toContain(
      t('ui.errRestoreGone'),
    );
    expect(inCard(el, '[data-restored]')).toBeNull();
    expect(inCard(el, '[data-outdated]'), 'a failed restore must not clear the notice').toBeTruthy();
  });

  it('says it could not restore on any other refusal, and keeps the notice', async () => {
    const client = hub(OUTDATED, {
      restoreModuleTemplate: vi.fn(async () => {
        throw Object.assign(new Error('boom'), { code: 'flow.template_not_yours' });
      }),
    });
    const el = await mount(client);
    await openCard(el);
    await press(el, 'restore');
    await press(el, 'restore-yes');
    expect(inCard(el, 'ok-inline-feedback[tone="danger"]')?.textContent).toContain(
      t('ui.errRestoreFailed'),
    );
    expect(inCard(el, '[data-outdated]')).toBeTruthy();
  });

  it('does not tap twice while the restore is on its way', async () => {
    let release!: () => void;
    const gate = new Promise<void>((resolve) => {
      release = resolve;
    });
    const client = hub(OUTDATED, {
      restoreModuleTemplate: vi.fn(async () => {
        await gate;
        return ownerFlow();
      }),
    });
    const el = await mount(client);
    await openCard(el);
    await press(el, 'restore');
    const yes = inCard(el, '[data-act="restore-yes"]') as HTMLButtonElement;
    yes.click();
    await settle(el);
    expect(yes.disabled || inCard(el, '[data-act="restore-yes"]') === null).toBe(true);
    yes.click();
    release();
    await settle(el);
    expect(client.flows.restoreModuleTemplate).toHaveBeenCalledTimes(1);
  });
});

describe('an activated recipe the hub says nothing new about (flows#136)', () => {
  beforeEach(() => {
    document.body.replaceChildren();
    window.history.replaceState({}, '', '/');
  });

  it('shows no notice when it is up to date, and still lets the owner restore the factory one', async () => {
    const el = await mount(hub({ flow_id: 'f-served', enabled: true, outdated: false }));
    expect(inCard(el, '[data-outdated]')).toBeNull();
    await openCard(el);
    expect(inCard(el, '[data-outdated-notice]')).toBeNull();
    expect(inCard(el, '[data-act="restore"]')).toBeTruthy();
  });

  it('shows no notice when the hub cannot tell, and still lets the owner restore', async () => {
    const el = await mount(hub({ flow_id: 'f-served', enabled: true, outdated: null }));
    expect(inCard(el, '[data-outdated]')).toBeNull();
    await openCard(el);
    expect(inCard(el, '[data-outdated-notice]')).toBeNull();
    expect(inCard(el, '[data-act="restore"]')).toBeTruthy();
  });

  it('offers nothing to restore for a recipe the hub never built a flow from', async () => {
    const el = await mount(hub(null));
    await openCard(el);
    expect(inCard(el, '[data-act="restore"]')).toBeNull();
    expect(inCard(el, '[data-outdated]')).toBeNull();
  });

  it('offers neither the notice nor the button on a hub without the restore door', async () => {
    const client = hub(OUTDATED);
    delete (client.flows as Record<string, unknown>).restoreModuleTemplate;
    const el = await mount(client);
    expect(inCard(el, '[data-outdated]'), 'a notice nobody can act on').toBeNull();
    await openCard(el);
    expect(inCard(el, '[data-act="restore"]')).toBeNull();
  });
});

describe('the words of the restore (flows#136)', () => {
  it('exist in English and Spanish', () => {
    for (const key of [
      'ui.tplOutdated',
      'ui.tplOutdatedNotice',
      'ui.tplRestore',
      'ui.tplRestoreConfirm',
      'ui.tplRestoreYes',
      'ui.tplRestoreNo',
      'ui.tplRestored',
      'ui.errRestoreGone',
      'ui.errRestoreFailed',
    ]) {
      expect(typeof lookup(en, key), `${key} missing in en`).toBe('string');
      expect(typeof lookup(es, key), `${key} missing in es`).toBe('string');
    }
  });
});
