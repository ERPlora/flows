import { describe, it, expect, beforeEach, vi } from 'vitest';
import './erp-flows-gallery';
import { ErpFlowsGallery, templateFromSearch } from './erp-flows-gallery';
import { QUERY_GRANT_PIN_CORE, schemaFacts } from '../../lib/ai-draft';
import { buildTemplate, flowsWorthAsking, templateById } from '../../lib/templates';
import { moduleTemplateId } from '../../lib/module-templates';
import en from '../../../locales/en.json';

/**
 * **A recipe an app serves that this catalogue has NO hand copy of** (flows#101).
 *
 * Every served recipe the fleet has today happens to have a twin written in `ui/lib/templates.ts`,
 * and that coincidence is holding up two things that look wired and are not:
 *
 * 1. The gallery asks the hub what a flow is ALLOWED to do only for the flows that could be one of
 *    these cards, and it asks that question of the WRITTEN catalogue — never of the served one. A
 *    flow created from a served card is therefore never asked about, comes back with no commands,
 *    and its card says «absent»: the gallery invites the owner to build a SECOND copy of the
 *    automation they are already running, which is the exact duplicate the badge exists to stop.
 * 2. A link naming a served card by the id the app itself serves resolves against the written
 *    catalogue, finds nothing, and lands on the whole gallery instead of on the card.
 *
 * Both wake up the day the four WhatsApp hand copies are dropped (flows#101), and both are already
 * true today for any app that serves a recipe this file never copied. The card here is deliberately
 * one of those: nothing in `TEMPLATES` listens to its event, and the first test proves it.
 */
const CURRENT_CORE = schemaFacts(
  {
    $defs: { step: { properties: { interactive: { type: 'object' }, output: { type: 'object' } } } },
  },
  QUERY_GRANT_PIN_CORE,
);

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

const MODULE = 'inventory';
const FAMILY = 'restock-when-low';
/** Deliberately an event NO written card waits on — see the control test below. */
const EVENT = 'inventory.stock.low';
const COMMAND = 'purchases.orders.draft';
const SERVED_ID = moduleTemplateId(MODULE, FAMILY);

const document_ = () => ({
  schema_version: 1,
  name: 'Order more when stock runs low',
  triggers: [{ kind: 'event', event: EVENT }],
  steps: [{ id: 'draft', kind: 'command', command: COMMAND, params: {} }],
});

/** One row of `GET /api/hub/flows/templates`, for a family nothing here copies. */
const servedRow = () => ({
  module: MODULE,
  family: FAMILY,
  documents: { en: document_() },
  grants: [{ kind: 'command', value: COMMAND }],
});

/** The automation the owner built from that card three weeks ago. */
const installedFlow = () => ({
  id: 'f-served',
  name: 'Order more when stock runs low',
  enabled: true,
  definition: document_() as unknown as Record<string, unknown>,
});

function hub(over: Record<string, unknown> = {}) {
  return {
    flows: {
      create: vi.fn(async (flow: unknown) => ({ id: 'created-1', ...(flow as object) })),
      replaceGrants: vi.fn(async () => []),
      list: vi.fn(async () => [installedFlow()]),
      grants: vi.fn(async (_id: string) => [{ kind: 'command', value: COMMAND }]),
      templates: vi.fn(async () => [servedRow()]),
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

describe('a recipe served by an app that this catalogue never copied (flows#101)', () => {
  beforeEach(() => {
    document.body.replaceChildren();
    window.history.replaceState({}, '', '/');
  });

  it('is the control: no written card would ever ask about this flow', () => {
    expect(
      flowsWorthAsking([installedFlow()], t),
      'a written card listens to this event too — every test below would pass without the fix',
    ).toEqual([]);
  });

  it('asks what the flow may do, and badges the card as already running', async () => {
    const client = hub();
    const el = await mount(client);
    expect(card(el, SERVED_ID), 'the served card is not on the screen at all').toBeTruthy();
    expect(
      client.flows.grants,
      'the gallery never asked what the flow is allowed to do',
    ).toHaveBeenCalledWith('f-served');
    expect(
      card(el, SERVED_ID)?.getAttribute('data-installed'),
      'the card invites a SECOND copy of an automation that is already running',
    ).toBe('active');
  });

  it('asks again when the served recipes land after the flow list', async () => {
    let release!: () => void;
    const gate = new Promise<void>((resolve) => {
      release = resolve;
    });
    const client = hub({
      templates: vi.fn(async () => {
        await gate;
        return [servedRow()];
      }),
    });
    const el = await mount(client);
    expect(
      client.flows.grants,
      'asked before the served catalogue existed — this test proves nothing',
    ).not.toHaveBeenCalled();

    release();
    await settle(el);

    expect(client.flows.grants, 'never asked again once the recipes landed').toHaveBeenCalledWith(
      'f-served',
    );
    expect(card(el, SERVED_ID)?.getAttribute('data-installed')).toBe('active');
  });

  it('opens the card a link names by the id the app itself serves', async () => {
    window.history.replaceState({}, '', `/?template=${encodeURIComponent(SERVED_ID)}`);
    const el = await mount(hub());
    expect(
      el.renderRoot.querySelector(`[data-template="${SERVED_ID}"] .panel`),
      'the shortcut landed on the whole gallery instead of on the card it named',
    ).toBeTruthy();
  });

  /**
   * The re-ask is not a second bill. Both round trips run — the flow list and the served recipes —
   * and a flow already answered is not asked about again, so a busy hub pays once per candidate
   * whichever of the two lands first. Without this the gallery pays for every answer twice on
   * every visit, and the screen looks identical, which is how it would stay.
   */
  it('does not pay twice for a flow it has already asked about', async () => {
    const written = {
      id: 'f-written',
      name: 'Call back the no-shows',
      enabled: true,
      definition: buildTemplate(templateById('no-show-followup')!, t) as unknown as Record<
        string,
        unknown
      >,
    };
    const client = hub({
      list: vi.fn(async () => [written]),
      grants: vi.fn(async (_id: string) => [{ kind: 'command', value: 'tasks.tasks.create' }]),
    });
    const el = await mount(client);
    expect(
      card(el, 'no-show-followup')?.getAttribute('data-installed'),
      'the written card was never recognised — this test would prove nothing',
    ).toBe('active');
    expect(client.flows.grants, 'asked the hub the same question twice').toHaveBeenCalledTimes(1);
  });
  /**
   * The forwarding address of a copy that is no longer in the catalogue at all (flows#101).
   *
   * `?template=whatsapp-appointment` is published by `whatsapp_inbox`, and the card it names is a
   * hand copy this file is about to stop shipping. Once it is gone the id matches no card, and
   * looking it up among the cards alone answers «no such thing» — the link lands on the whole
   * gallery. It is answered out of the aliases the merge leaves behind, and handed back UNCHANGED:
   * forwarding it is `landsOn`'s job, and doing it twice is how the two come to disagree.
   */
  it('still recognises the id of a copy the served recipe has retired', () => {
    const retired = 'whatsapp-appointment';
    const catalogue = { cards: [], aliases: { [retired]: SERVED_ID } };
    expect(
      templateFromSearch(`?template=${retired}`, catalogue),
      'the link another app publishes stopped naming a card the day its copy went',
    ).toBe(retired);
    expect(
      templateFromSearch('?template=never-existed', catalogue),
      'an id nobody ever served is not a card either',
    ).toBe('');
  });

  /**
   * Re-reading the link is for the owner who has not gone anywhere yet. Somebody who arrived on a
   * link the gallery could not place, gave up on it and opened a different recipe must not be
   * dragged back to the first one the moment the hub finishes answering.
   */
  it('does not drag the owner back to the link once they have opened another card', async () => {
    window.history.replaceState({}, '', `/?template=${encodeURIComponent(SERVED_ID)}`);
    let release!: () => void;
    const gate = new Promise<void>((resolve) => {
      release = resolve;
    });
    const el = await mount(
      hub({
        templates: vi.fn(async () => {
          await gate;
          return [servedRow()];
        }),
      }),
    );
    el.open('no-show-followup');
    await settle(el);
    expect(
      el.renderRoot.querySelector('[data-template="no-show-followup"] .panel'),
      'the card the owner opened is not open — this test would prove nothing',
    ).toBeTruthy();

    release();
    await settle(el);

    expect(
      el.renderRoot.querySelector('[data-template="no-show-followup"] .panel'),
      'the gallery shut the card the owner had opened and jumped to the link',
    ).toBeTruthy();
    expect(el.renderRoot.querySelector(`[data-template="${SERVED_ID}"] .panel`)).toBeNull();
  });
});
