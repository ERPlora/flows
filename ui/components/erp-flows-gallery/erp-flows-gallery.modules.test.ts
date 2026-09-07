import { describe, it, expect, beforeEach, vi } from 'vitest';
import './erp-flows-gallery';
import { ErpFlowsGallery } from './erp-flows-gallery';
import { schemaFacts } from '../../lib/ai-draft';
import { TEMPLATES } from '../../lib/templates';
import { moduleTemplateId } from '../../lib/module-templates';
import { execFileSync } from 'node:child_process';
import { resolve } from 'node:path';
import en from '../../../locales/en.json';

/**
 * **The automations an installed module brings, on the screen** (flows#98, hub#1611).
 *
 * The hub serves them since hub#1645 (`GET /api/hub/flows/templates`). Until then the only WhatsApp
 * recipe an owner could install was the HAND COPY in `ui/lib/templates.ts`, kept in step with the
 * module by a pin test and a human remembering — which is the arrangement this replaces.
 *
 * These tests are about the SCREEN: that the recipe arrives, that it is grouped under the app it
 * came with, that the copy steps aside without breaking the link other modules publish, and that a
 * hub too old to serve any of it still shows the gallery it always showed.
 */
const CURRENT_CORE = schemaFacts({
  $defs: { step: { properties: { interactive: { type: 'object' }, output: { type: 'object' } } } },
});

const t = (key: string, params?: Record<string, unknown>): string => {
  let cur: unknown = en;
  for (const part of key.split('.')) {
    cur = cur && typeof cur === 'object' ? (cur as Record<string, unknown>)[part] : undefined;
  }
  const found = typeof cur === 'string' ? cur : key;
  return params
    ? found.replace(/\{(\w+)\}/g, (_, name: string) => String(params[name] ?? ''))
    : found;
};

/** The card in this catalogue that mirrors a family the module publishes. */
const MIRROR = TEMPLATES.find((tpl) => tpl.mirrors)!;

/** A row exactly as `list_templates` serves it (`crates/server/src/flows_api.rs`). */
const servedRow = (over: Record<string, unknown> = {}) => ({
  module: 'whatsapp_inbox',
  family: 'appointment-from-whatsapp',
  documents: {
    en: {
      schema_version: 1,
      name: 'WhatsApp → appointment',
      triggers: [{ kind: 'event', event: 'whatsapp_inbox.message.received' }],
      steps: [
        { id: 'book', kind: 'command', command: 'appointments.appointments.create', params: {} },
      ],
    },
  },
  grants: [{ kind: 'command', value: 'appointments.appointments.create' }],
  requires: { whatsapp_inbox: '2.1.0' },
  ...over,
});

function hub(over: { templates?: unknown; rows?: unknown[] } = {}) {
  const flows: Record<string, unknown> = {
    create: vi.fn(async (flow: unknown) => ({ id: 'created-1', ...(flow as object) })),
    replaceGrants: vi.fn(async () => []),
  };
  if ('templates' in over) {
    if (typeof over.templates === 'function') flows.templates = over.templates;
  } else {
    flows.templates = vi.fn(async () => over.rows ?? [servedRow()]);
  }
  return {
    flows,
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

async function mount(client: unknown): Promise<ErpFlowsGallery> {
  const el = document.createElement('erp-flows-gallery') as ErpFlowsGallery;
  el.facts = CURRENT_CORE;
  el.client = client as never;
  el.t = t;
  document.body.appendChild(el);
  await el.updateComplete;
  for (let i = 0; i < 8; i += 1) await Promise.resolve();
  await el.updateComplete;
  return el;
}

const text = (el: ErpFlowsGallery): string => el.renderRoot.textContent ?? '';
const card = (el: ErpFlowsGallery, id: string): HTMLElement | null =>
  el.renderRoot.querySelector(`[data-template="${id}"]`);

const SERVED_ID = moduleTemplateId('whatsapp_inbox', 'appointment-from-whatsapp');

describe('the gallery offers what the installed apps bring (flows#98)', () => {
  beforeEach(() => {
    document.body.replaceChildren();
    window.history.replaceState({}, '', '/');
  });

  it('asks the hub for them, once per client', async () => {
    const client = hub();
    const el = await mount(client);
    el.requestUpdate();
    await el.updateComplete;
    expect(client.flows.templates).toHaveBeenCalledTimes(1);
  });

  it('paints the served recipe under the app it came with', async () => {
    const el = await mount(hub());
    const served = card(el, SERVED_ID);
    expect(served, 'the module’s own recipe is not on the screen').toBeTruthy();
    const section = el.renderRoot.querySelector('[data-module="whatsapp_inbox"]');
    expect(section, 'no heading for the app the recipe came with').toBeTruthy();
    expect(section?.textContent).toContain(t('ui.mod_whatsapp_inbox'));
    // The title is the module's, in the owner's language — not an i18n key of ours.
    expect(text(el)).toContain('WhatsApp → appointment');
  });

  /**
   * 🔴 **No card repeats the heading it is standing under** (flows#98, measured on the real bundle).
   *
   * The four recipes WhatsApp brings are painted in one section titled «Comes with WhatsApp Inbox».
   * With the app's name also printed under every card's title, the screen said the same six words
   * five times down one column — the visual bench showed it at 1440, 834 and 390. Provenance is
   * read once, in the heading, and in full inside the panel; the line under a title is for what
   * the recipe IS.
   */
  it('does not repeat the app’s name under every card of the app’s own section', async () => {
    const el = await mount(
      hub({ rows: [servedRow(), servedRow({ family: 'reservation-from-whatsapp' })] }),
    );
    const section = el.renderRoot.querySelector('section[data-module="whatsapp_inbox"]')!;
    const heading = (section.querySelector('h3')?.textContent ?? '').trim();
    expect(heading, 'the section has no heading — this test would prove nothing').toBeTruthy();
    const cards = [...section.querySelectorAll('[data-template]')];
    expect(cards.length).toBe(2);
    for (const c of cards) {
      expect(
        c.textContent ?? '',
        `${c.getAttribute('data-template')} repeats the heading it is already under`,
      ).not.toContain(heading);
    }
  });

  it('drops the hand copy of the family the module now serves', async () => {
    const el = await mount(hub({ rows: [servedRow({ ...MIRROR.mirrors })] }));
    expect(card(el, MIRROR.id), 'two cards for one automation').toBeFalsy();
    expect(card(el, moduleTemplateId(MIRROR.mirrors!.module, MIRROR.mirrors!.family))).toBeTruthy();
  });

  /**
   * `?template=whatsapp-appointment` is an address `whatsapp_inbox` publishes from its own settings
   * screen. Retiring the card it names without forwarding turns that link into an empty gallery.
   */
  it('sends the retired card’s shortcut to the recipe that replaced it', async () => {
    window.history.replaceState({}, '', `/?template=${MIRROR.id}`);
    const el = await mount(hub({ rows: [servedRow({ ...MIRROR.mirrors })] }));
    const replacement = moduleTemplateId(MIRROR.mirrors!.module, MIRROR.mirrors!.family);
    expect(el.renderRoot.querySelector(`[data-template="${replacement}"] .panel`)).toBeTruthy();
  });

  it('creates the flow with the document the module published', async () => {
    const client = hub();
    const el = await mount(client);
    const used = vi.fn();
    el.addEventListener('flows-template-used', used as EventListener);
    el.open(SERVED_ID);
    await el.updateComplete;
    await el.use();
    const created = (client.flows.create as ReturnType<typeof vi.fn>).mock.calls[0][0] as {
      name: string;
      enabled: boolean;
      definition: { steps: { command?: string }[] };
    };
    expect(created.name).toBe('WhatsApp → appointment');
    expect(created.enabled, 'an automation nobody has read yet must not act').toBe(false);
    expect(created.definition.steps[0].command).toBe('appointments.appointments.create');
    expect(used).toHaveBeenCalledOnce();
    // It asks for what the module declared, so the owner lands on Permissions.
    expect((used.mock.calls[0][0] as CustomEvent).detail.needsGrants).toBe(true);
  });

  it('reads the served recipe out step by step, instead of a sentence it does not have', async () => {
    const el = await mount(hub());
    el.open(SERVED_ID);
    await el.updateComplete;
    const panel = card(el, SERVED_ID)?.textContent ?? '';
    expect(panel).toContain(t('ui.tplStepsTitle'));
    expect(panel).toContain(t('ui.stepCommand', { command: 'appointments.appointments.create' }));
  });

  it('leaves out a served recipe this core cannot parse', async () => {
    const el = document.createElement('erp-flows-gallery') as ErpFlowsGallery;
    el.facts = schemaFacts(undefined); // a hub that declares nothing: fail-closed
    el.t = t;
    el.client = hub({
      rows: [
        servedRow({
          documents: {
            en: {
              schema_version: 1,
              name: 'needs interactive',
              triggers: [{ kind: 'event', event: 'e' }],
              steps: [
                { id: 's', kind: 'notify', channel: 'whatsapp', interactive: { rows: [] } },
              ],
            },
          },
        }),
      ],
    }) as never;
    document.body.appendChild(el);
    await el.updateComplete;
    for (let i = 0; i < 8; i += 1) await Promise.resolve();
    await el.updateComplete;
    expect(card(el, SERVED_ID)).toBeFalsy();
  });
});

describe('a hub that cannot serve them still has a gallery (flows#98)', () => {
  beforeEach(() => {
    document.body.replaceChildren();
    window.history.replaceState({}, '', '/');
  });

  /** The whole fleet, until the image carrying hub#1645 reaches it. */
  it('says so plainly when the core is older than the door, and keeps every written card', async () => {
    const el = await mount(hub({ templates: undefined }));
    expect(text(el)).toContain(t('ui.tplModulesOldCore'));
    for (const tpl of TEMPLATES) expect(card(el, tpl.id), tpl.id).toBeTruthy();
  });

  it('says so when the hub refused, and does not lose the written cards', async () => {
    const el = await mount(
      hub({
        templates: vi.fn(async () => {
          throw new Error('boom');
        }),
      }),
    );
    expect(text(el)).toContain(t('ui.tplModulesUnavailable'));
    expect(card(el, MIRROR.id), 'the hand copy is the only way in on this hub').toBeTruthy();
  });

  it('says nothing at all when the hub simply brings no recipes', async () => {
    const el = await mount(hub({ rows: [] }));
    expect(text(el)).not.toContain(t('ui.tplModulesOldCore'));
    expect(text(el)).not.toContain(t('ui.tplModulesUnavailable'));
    expect(el.renderRoot.querySelector('[data-module]')).toBeFalsy();
  });
});

/**
 * **The real recipe `whatsapp_inbox` publishes, all the way to the screen** (flows#98).
 *
 * Everything above builds its own rows, so all it proves is that the gallery reads the SHAPE this
 * module expects. This reads the four families the neighbouring module actually publishes on its
 * `origin/main`, assembles them exactly as `list_templates` serves them
 * (`crates/server/src/flows_api.rs`: `module`, `family`, `documents`, `grants`, `requires`) and
 * puts them through the real component — which is the only way to find out that a document written
 * by somebody else survives `readDoc`, has a name in both languages and paints a card.
 *
 * **Reads a REF, never a working tree**: the fleet keeps a dozen `whatsapp_inbox-*` worktrees
 * beside this module and any of them may be mid-edit. Where there is no canonical checkout at all
 * — CI, until module-toolkit#211 brings the source repo to the runner — this skips, and says so.
 */
const SOURCE_MODULE = 'whatsapp_inbox';

function publishedRows(): Record<string, unknown>[] | null {
  const canonical = resolve(__dirname, '../../../..', SOURCE_MODULE);
  const run = (...args: string[]): string | null => {
    try {
      return execFileSync('git', ['-C', canonical, ...args], {
        encoding: 'utf8',
        stdio: ['ignore', 'pipe', 'ignore'],
      });
    } catch {
      return null;
    }
  };
  const listing = run('ls-tree', '--name-only', 'refs/remotes/origin/main', 'flows/');
  if (!listing) return null;
  const families = listing
    .split('\n')
    .filter((f) => f.endsWith('.en.flow.json'))
    .map((f) => f.replace('flows/', '').replace('.en.flow.json', ''));
  if (!families.length) return null;
  const read = (path: string): unknown => {
    const raw = run('show', `refs/remotes/origin/main:${path}`);
    return raw ? JSON.parse(raw) : undefined;
  };
  return families.map((family) => {
    const documents: Record<string, unknown> = {};
    for (const lang of ['en', 'es']) {
      const doc = read(`flows/${family}.${lang}.flow.json`);
      if (doc) documents[lang] = doc;
    }
    const grants = read(`flows/${family}.grants.json`) as { grants?: unknown } | undefined;
    return {
      module: SOURCE_MODULE,
      family,
      documents,
      grants: grants?.grants ?? [],
      requires: (read(`flows/${family}.requires.json`) as { modules?: unknown })?.modules ?? {},
    };
  });
}

const PUBLISHED = publishedRows();

describe('the recipes whatsapp_inbox really publishes reach the gallery (flows#98)', () => {
  beforeEach(() => {
    document.body.replaceChildren();
    window.history.replaceState({}, '', '/');
  });

  it.skipIf(!PUBLISHED)(
    'paints every family the module publishes, with its own name and its own steps',
    async () => {
      const rows = PUBLISHED!;
      const el = await mount(hub({ rows }));
      expect(rows.length, 'the neighbour publishes nothing — this test proved nothing').toBeGreaterThan(0);
      for (const r of rows) {
        const id = moduleTemplateId(SOURCE_MODULE, r.family as string);
        const painted = card(el, id);
        expect(painted, `${r.family} is published by the module and is not on the screen`).toBeTruthy();
        // Its own title, written by the module — never an i18n key of ours, never blank.
        const name = (r.documents as Record<string, { name?: string }>).en?.name ?? '';
        expect(name, `${r.family} has no name in English`).toBeTruthy();
        expect(painted?.textContent).toContain(name);
      }
      // All of them under the app they came with, in one section.
      const section = el.renderRoot.querySelector('[data-module="whatsapp_inbox"]');
      expect(section?.querySelectorAll('.card').length).toBe(rows.length);
    },
  );

  it.skipIf(!PUBLISHED)('retires every hand copy the module now serves itself', async () => {
    const el = await mount(hub({ rows: PUBLISHED! }));
    const copies = TEMPLATES.filter((tpl) => tpl.mirrors);
    expect(copies.length, 'no hand copies to retire — the premise of flows#98 is gone').toBeGreaterThan(0);
    for (const copy of copies) {
      expect(card(el, copy.id), `${copy.id} is still on screen beside the recipe it copies`).toBeFalsy();
    }
  });

  it.skipIf(!PUBLISHED)('installs the module’s real document, in Spanish for a Spanish hub', async () => {
    const family = 'appointment-from-whatsapp';
    const row = PUBLISHED!.find((r) => r.family === family);
    expect(row, `${family} is not published any more`).toBeTruthy();
    const client = hub({ rows: [row!] });
    (client as { locale?: string }).locale = 'es';
    const el = await mount(client);
    const id = moduleTemplateId(SOURCE_MODULE, family);
    el.open(id);
    await el.updateComplete;
    await el.use();
    const created = (client.flows.create as ReturnType<typeof vi.fn>).mock.calls[0][0] as {
      name: string;
      enabled: boolean;
      definition: Record<string, unknown>;
    };
    const published = (row!.documents as Record<string, { name: string }>).es;
    expect(created.name).toBe(published.name);
    expect(created.enabled).toBe(false);
    expect(created.definition).toEqual(published);
  });
});
