import { describe, it, expect, vi } from 'vitest';
import { groupByFamily, loadEventCatalog } from './event-catalog';
import { TRIGGER_CATALOG } from './trigger-catalog';
import es from '../../locales/es.json';

/** The shell's translator over the Spanish catalogue. */
const t = (key: string, params?: Record<string, unknown>): string => {
  let cur: unknown = es;
  for (const part of key.split('.')) {
    cur = cur && typeof cur === 'object' ? (cur as Record<string, unknown>)[part] : undefined;
  }
  const found = typeof cur === 'string' ? cur : key;
  return params
    ? found.replace(/\{(\w+)\}/g, (_, name: string) => String(params[name] ?? ''))
    : found;
};

/** A client whose `events.list` answers whatever the test hands it. */
const clientListing = (rows: unknown) => ({ events: { list: vi.fn(async () => rows) } });

/** A client that refuses, the way the runtime does: an `Error` carrying a stable `code`. */
const clientRefusing = (code: string) => ({
  events: {
    list: vi.fn(async () => {
      throw Object.assign(new Error(code), { code });
    }),
  },
});

describe('the events an owner can start a flow from come from THIS hub', () => {
  it('offers exactly what the hub lists — not the words this module happens to know', async () => {
    // The whole point of flows#8. A hand-written list ages on its own and can never name an event
    // this hub really emits that nobody thought to type in. So the hub decides the SET; this
    // module only decides the WORDS.
    const catalog = await loadEventCatalog(
      clientListing([{ name: 'shop.something_odd', declared_by: ['shop'] }]),
    );

    expect(catalog.status).toBe('ready');
    expect(catalog.status === 'ready' && catalog.options.map((o) => o.event)).toEqual([
      'shop.something_odd',
    ]);
    // Twenty-four hand-written entries sit right there in `TRIGGER_CATALOG` and NONE of them got in.
    expect(TRIGGER_CATALOG.length).toBeGreaterThan(1);
  });

  it('keeps the hub order, and offers an event even when nothing installed declares it', async () => {
    // `declared_by: []` = seen in the outbox, its module since uninstalled. The name is real, so
    // it stays offerable; hiding it would be this file overruling the hub again.
    const catalog = await loadEventCatalog(
      clientListing([
        { name: 'sale.completed', declared_by: ['sales'], last_seen_at: '2026-08-13T10:00:00Z' },
        { name: 'legacy.thing_happened', declared_by: [] },
        { name: 'customer.created', declared_by: ['customers'] },
      ]),
    );

    expect(catalog.status === 'ready' && catalog.options.map((o) => o.event)).toEqual([
      'sale.completed',
      'legacy.thing_happened',
      'customer.created',
    ]);
    expect(catalog.status === 'ready' && catalog.options[0].lastSeenAt).toBe(
      '2026-08-13T10:00:00Z',
    );
    expect(catalog.status === 'ready' && catalog.options[1].declaredBy).toEqual([]);
  });

  it('lends its own words when it has them, and says nothing it cannot back up', async () => {
    const catalog = await loadEventCatalog(
      clientListing([
        { name: 'sale.completed', declared_by: ['sales'] },
        { name: 'shop.refund_issued', declared_by: ['shop'] },
      ]),
    );

    const [known, unknown] = catalog.status === 'ready' ? catalog.options : [];
    expect(known.labelKey).toBe('ui.evSaleCompleted');
    // No invented phrase: the picker shows the raw name rather than a label that is a guess.
    expect(unknown.labelKey).toBeUndefined();
  });

  it('says «this hub cannot list its events» instead of falling back to the old list', async () => {
    // A hub older than the SDK method has no `events.list` at all. Quietly seeding the dropdown
    // from `TRIGGER_CATALOG` here would put flows#8 straight back, in disguise: the owner would
    // again be offered triggers their hub never fires, with nothing on screen saying so.
    const catalog = await loadEventCatalog({ events: { shape: vi.fn() } });

    expect(catalog.status).toBe('unsupported');
    expect(catalog).not.toHaveProperty('options');
  });

  it('says so when there is no client at all', async () => {
    expect((await loadEventCatalog(null)).status).toBe('unsupported');
    expect((await loadEventCatalog({})).status).toBe('unsupported');
  });

  it('reports the hub refusal BY ITS CODE, so the screen can ask for the grant', async () => {
    const catalog = await loadEventCatalog(clientRefusing('capability_denied'));

    expect(catalog).toEqual({ status: 'failed', code: 'capability_denied' });
  });

  it('a hub that answers something that is not a list is a failure, not a crash', async () => {
    expect(await loadEventCatalog(clientListing({ oops: true }))).toEqual({
      status: 'failed',
      code: 'flows.bad_catalog',
    });
  });

  it('an empty catalogue is its own answer — «this hub declares no events»', async () => {
    // Not `ready` with zero options: a dropdown holding only «—» explains nothing, and this is a
    // real state (a hub with no modules installed yet).
    expect(await loadEventCatalog(clientListing([]))).toEqual({ status: 'empty' });
  });

  it('drops a row with no usable name rather than offering a blank option', async () => {
    const catalog = await loadEventCatalog(
      clientListing([{ name: '', declared_by: [] }, { name: 'sale.completed' }]),
    );

    expect(catalog.status === 'ready' && catalog.options.map((o) => o.event)).toEqual([
      'sale.completed',
    ]);
  });
});

describe('the dropdown is grouped by the module the event comes from', () => {
  const option = (name: string) => ({ event: name, declaredBy: [] });

  it('puts each event under its own family, named as the owner knows it', () => {
    const groups = groupByFamily(
      [option('kitchen.order.ready'), option('inventory.product.created')],
      t,
    );

    expect(groups.map((g) => g.family)).toEqual(['Cocina', 'Almacén']);
    expect(groups[0].options.map((o) => o.event)).toEqual(['kitchen.order.ready']);
  });

  it('keeps the hub’s order — both of the groups and inside each one', () => {
    // The hub sorts by name, so «what this business fires» does not move under the owner every
    // time they switch language. Re-sorting by the translated label would do exactly that.
    const groups = groupByFamily(
      [
        option('tables.table.created'),
        option('inventory.product.created'),
        option('tables.zone.created'),
      ],
      t,
    );

    expect(groups.map((g) => g.family)).toEqual(['Mesas', 'Almacén']);
    expect(groups[0].options.map((o) => o.event)).toEqual([
      'tables.table.created',
      'tables.zone.created',
    ]);
  });

  it('groups an event from a module nobody knows under a readable name too', () => {
    const groups = groupByFamily([option('weird_module.odd_thing.went_sideways')], t);

    expect(groups.map((g) => g.family)).toEqual(['Weird module']);
  });

  it('has no groups for no options', () => {
    expect(groupByFamily([], t)).toEqual([]);
  });
});
