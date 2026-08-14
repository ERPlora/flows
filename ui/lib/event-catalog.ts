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
 * are CALLED. `TRIGGER_CATALOG` survives only as that dictionary — an event it has no words for is
 * still offered, under its raw name, because a missing phrase is a cosmetic gap and hiding the
 * trigger is a functional one.
 *
 * **And when the hub cannot answer, the screen says so.** There is deliberately no quiet fall back
 * to the hand-written list: that would put flows#8 straight back in disguise — the owner offered
 * triggers their hub never fires, with nothing on screen admitting where the list came from. The
 * free-text box next to the dropdown stays reachable in every one of these states, so a hub that
 * cannot list its events is still a hub whose events can be typed.
 */
import { catalogEntry, type TriggerCatalogEntry } from './trigger-catalog';
import type { EventCatalogEntry } from './hub-flows';

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
