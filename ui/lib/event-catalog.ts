/**
 * **What an owner can say «when this happens» about — asked to THEIR hub** (flows#8, hub#823).
 *
 * Until `GET /api/hub/events` existed, this module seeded its trigger dropdown from a list typed
 * into {@link TRIGGER_CATALOG}. That list was honest about itself but wrong in a way editing it
 * could never fix: it ages on its own, and it can never offer an event this hub really emits that
 * nobody thought to add. Now the hub answers with the union of what its installed modules DECLARE
 * and what its outbox has really SEEN, so the set of triggers on offer is this business's own.
 *
 * **The division of labour**: the hub decides WHICH events exist, this module decides what they
 * are CALLED. `TRIGGER_CATALOG` survives only as that dictionary, and since flows#41 it is the top
 * layer of one — `event-phrasing.ts` composes a phrase for the events nobody wrote a sentence for,
 * so an event this module has never heard of is offered as words rather than as
 * `inventory.low_stock_crossed`. Offered either way: a missing phrase is a cosmetic gap and hiding
 * the trigger is a functional one.
 *
 * **And when the hub cannot answer, the screen says so.** There is deliberately no quiet fall back
 * to the hand-written list: that would put flows#8 straight back in disguise — the owner offered
 * triggers their hub never fires, with nothing on screen admitting where the list came from. The
 * free-text box next to the dropdown stays reachable in every one of these states, so a hub that
 * cannot list its events is still a hub whose events can be typed.
 */
import { catalogEntry, type TriggerCatalogEntry } from './trigger-catalog';
import { eventFamily } from './event-phrasing';
import type { Translator } from './plain-language';
import type { EventCatalogEntry, EventFieldShape, EventShape } from './hub-flows';

/** One entry of the «when this happens» dropdown, ready to render. */
export interface TriggerOption {
  /** The event name exactly as the hub emits it — what gets written into the document. */
  event: string;
  /** i18n key of the owner-facing phrase, **when this module has words for it**. */
  labelKey?: string;
  /** The modules that declare it, for «it comes with Appointments». */
  declaredBy: string[];
  lastSeenAt?: string;
}

/**
 * The catalogue, or the reason there is none — every branch is something the screen SAYS.
 *
 * `unsupported` and `failed` are different on purpose: the first is a hub older than the SDK
 * method (nothing the owner did, nothing they can fix from here), the second is this hub refusing
 * or breaking, and `capability_denied` in particular is fixed by granting the permission.
 */
export type EventCatalog =
  | { status: 'loading' }
  | { status: 'ready'; options: TriggerOption[] }
  | { status: 'empty' }
  | { status: 'unsupported' }
  | { status: 'failed'; code: string };

/** Not a code the hub sends: what this module calls a catalogue that did not arrive as a list. */
export const BAD_CATALOG = 'flows.bad_catalog';

/** The narrowest shape this file needs — the real one is `ModuleClient` in `hub-flows.ts`. */
export interface EventCatalogClient {
  events?: {
    list?: () => Promise<unknown>;
    /** Its sibling since hub#715. Named only so a hub WITHOUT `list` still types as one. */
    shape?: unknown;
  };
}

function toOption(row: EventCatalogEntry): TriggerOption | null {
  const event = typeof row?.name === 'string' ? row.name.trim() : '';
  if (!event) return null;
  const entry: TriggerCatalogEntry | undefined = catalogEntry(event);
  return {
    event,
    ...(entry ? { labelKey: entry.labelKey } : {}),
    declaredBy: Array.isArray(row.declared_by) ? row.declared_by : [],
    ...(typeof row.last_seen_at === 'string' ? { lastSeenAt: row.last_seen_at } : {}),
  };
}

/**
 * Ask this hub which events it can produce.
 *
 * Never throws and never invents: every way this can go wrong is one of the {@link EventCatalog}
 * branches, because the caller is a render path and a rejected promise there is a blank panel.
 */
export async function loadEventCatalog(
  client: EventCatalogClient | null | undefined,
): Promise<EventCatalog> {
  const list = client?.events?.list;
  if (typeof list !== 'function') return { status: 'unsupported' };

  let rows: unknown;
  try {
    rows = await list.call(client!.events);
  } catch (e) {
    const code = (e as { code?: unknown } | null)?.code;
    return { status: 'failed', code: typeof code === 'string' && code ? code : BAD_CATALOG };
  }

  if (!Array.isArray(rows)) return { status: 'failed', code: BAD_CATALOG };

  const options = rows
    .map((row) => toOption(row as EventCatalogEntry))
    .filter((o): o is TriggerOption => o !== null);

  // The hub's own order is kept: it sorts by name, which groups a business's events by the module
  // that owns them. Re-sorting by translated label would shuffle the list on every language change.
  return options.length ? { status: 'ready', options } : { status: 'empty' };
}

/** The options of one module, under the name the owner knows that module by. */
export interface TriggerGroup {
  family: string;
  options: TriggerOption[];
}

/**
 * The dropdown, cut into the modules its events come from (flows#41).
 *
 * A shop with everything installed is offered 196 triggers. Flat, that is a scroll; grouped by
 * «Cocina», «Almacén», «Caja» it is the shape Zapier, Power Automate and Odoo all settled on —
 * pick the part of the business first, the moment second.
 *
 * The grouping is derived from the event NAME, not from `declaredBy`, so it is the same in every
 * language and for an event whose module was uninstalled. Order — of the groups and inside each
 * one — is the hub's, for the reason `loadEventCatalog` gives.
 */
export function groupByFamily(options: readonly TriggerOption[], t: Translator): TriggerGroup[] {
  const groups: TriggerGroup[] = [];
  const byFamily = new Map<string, TriggerGroup>();
  for (const option of options) {
    const family = eventFamily(option.event, t);
    let group = byFamily.get(family);
    if (!group) {
      group = { family, options: [] };
      byFamily.set(family, group);
      groups.push(group);
    }
    group.options.push(option);
  }
  return groups;
}

// ── The fields a tap comes home in ────────────────────────────────────────────────────────────

/** The core event a WhatsApp message arrives as (`inbound_poll.rs::EVENT_NAME`). */
export const WHATSAPP_MESSAGE_EVENT = 'hub.whatsapp.message_received';

/**
 * What the payload carries when the customer tapped one of the options a `notify` offered
 * (hub#1633): the id that was set on screen, and the words that were on it.
 */
export const TAP_REPLY_FIELDS = ['reply_id', 'reply_title'] as const;

/**
 * **The fields the CONTRACT guarantees, added to the ones this hub has actually seen.**
 *
 * `GET /api/hub/events/shape` answers with observed traffic, which is the right answer to «what
 * does this event really look like» and the wrong one here: until somebody taps an option for the
 * first time, `reply_id` is not in any sample, so the picker cannot offer it — and the automation
 * that would PRODUCE the first tap is exactly the one being built. The chicken cannot be picked
 * until the egg has been laid.
 *
 * Two limits keep this from becoming the hand-written catalogue this module deleted in flows#8:
 *
 * - only where the hub said it can send options at all (`supported`), so it never names a field
 *   an older core would not put in the payload, and
 * - only where the hub has not spoken. A field the shape reports wins, with its real sample and
 *   its real count — this fills a silence, it does not correct the hub.
 */
export function mergeContractFields(
  shape: EventShape | null | undefined,
  supported: boolean,
): EventShape | null {
  if (!shape) return null;
  if (!supported || shape.event_name !== WHATSAPP_MESSAGE_EVENT) return shape;
  const known = new Set(shape.fields.map((f) => f.path));
  const missing: EventFieldShape[] = TAP_REPLY_FIELDS.filter((path) => !known.has(path)).map(
    (path) => ({
      path,
      type: 'string',
      redacted: false,
      truncated: false,
      // Nothing has been seen, and saying so is the honest half: the picker reads it as «not
      // always there», which is what a message nobody tapped really brings.
      seen_in: 0,
    }),
  );
  return missing.length ? { ...shape, fields: [...shape.fields, ...missing] } : shape;
}
