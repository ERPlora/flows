/**
 * **The list as a console, not a shelf** (flows#19).
 *
 * A hub with twenty automations already needs reading row by row to find one; the QA hub had
 * exactly twenty. Shopify Flow, Make and Zapier all answer the same three questions on their list
 * screen — *which one is it, give me another like it, and which ones are off* — and none of them
 * answers them with a dashboard. So this is search, filter, order and duplicate, and nothing else.
 *
 * # Everything here is pure, and everything here is CLIENT-SIDE
 *
 * The issue asks for filtering and paging **on the server**. That is not available and cannot be
 * made available from this module: `GET /api/hub/flows` takes no parameters (`FlowsApi.list()`),
 * and the kernel is FROZEN by ADR-0283 — adding a query string to it is a hub change, not a
 * module one. What that costs is bounded and worth naming: one hub's automations arrive in one
 * response, which is what already happened before this file existed, and the filtering then
 * happens over an array of tens. If a hub ever holds enough automations for that to hurt, the fix
 * is a kernel issue, not a cleverer loop here.
 *
 * # What is deliberately NOT here
 *
 * - **Tags.** There is nowhere to put one. `FlowInput` is `{name, definition, enabled}`, and the
 *   document's own key list is a STRICT whitelist (`STEP_KEYS`, mirror of `def.rs`) — an unknown
 *   key is refused at save, not ignored. A tag would have to be smuggled into the name.
 * - **«Last result» and «needs attention».** Those are per-flow run history (`runs(id)`), one
 *   request each: on a list of a hundred it is a hundred round trips to draw a column. That
 *   belongs to the tray flows#20 is about, which asks the question once.
 * - **Owner/creator.** The kernel does not record one on a flow.
 */
import { readDoc } from './flow-doc';
import type { FlowDoc, TriggerKind } from './flow-doc';
import type { Flow, FlowInput } from './hub-flows';
import type { Translator } from './plain-language';

export type StateFilter = 'all' | 'active' | 'paused';
export type TriggerFilter = 'all' | TriggerKind;
export type SortBy = 'updated' | 'name';

/** Everything the list screen is narrowed and ordered by, in one object the URL could hold. */
export interface ListView {
  q: string;
  state: StateFilter;
  trigger: TriggerFilter;
  sort: SortBy;
}

/** Nothing hidden, most recently touched first — what somebody opening the screen wants. */
export const EMPTY_VIEW: ListView = { q: '', state: 'all', trigger: 'all', sort: 'updated' };

/** How a flow starts. A document with no trigger runs manually, which is what the kernel does. */
export function triggerKindOf(flow: Flow): TriggerKind {
  return readDoc(flow.definition).triggers[0]?.kind ?? 'manual';
}

/**
 * The words a row can be found by: its name, the event it waits for, and the actions it runs.
 *
 * Deliberately not the whole document. Somebody searching «total» would otherwise match every
 * automation with `{{input.total}}` in a message template, for a reason invisible on screen, and
 * a search whose results cannot be explained is one people stop trusting after the first surprise.
 */
export function searchIndex(flow: Flow): string {
  const doc = readDoc(flow.definition);
  const words = [flow.name ?? ''];
  for (const trigger of doc.triggers) if (trigger.event) words.push(trigger.event);
  for (const step of doc.steps) if (step.command) words.push(String(step.command));
  return words.join(' ').toLowerCase();
}

/** Every `{{secret.NAME}}` the document points at. Names only — no endpoint returns a value. */
export function secretRefs(doc: FlowDoc): string[] {
  const found = new Set<string>();
  const scan = (node: unknown): void => {
    if (typeof node === 'string') {
      for (const m of node.matchAll(/\{\{\s*secret\.([A-Za-z0-9_-]+)\s*\}\}/g)) found.add(m[1]);
      return;
    }
    if (Array.isArray(node)) return void node.forEach(scan);
    if (node && typeof node === 'object') return void Object.values(node).forEach(scan);
  };
  scan(doc.steps);
  return [...found];
}

/** `localeCompare` and not `<`: byte order puts «Zulu» before «alfa» and looks shuffled. */
const byName = (a: Flow, b: Flow): number => (a.name ?? '').localeCompare(b.name ?? '');

/**
 * Most recently touched first — and a flow the hub never stamped goes LAST rather than first.
 * Treating a missing date as the epoch is what would otherwise happen, and it would bury exactly
 * the rows whose date nobody can see.
 */
const byUpdated = (a: Flow, b: Flow): number => {
  const at = a.updated_at ?? '';
  const bt = b.updated_at ?? '';
  if (!at && !bt) return byName(a, b);
  if (!at) return 1;
  if (!bt) return -1;
  return bt.localeCompare(at);
};

/** The rows to draw, narrowed and ordered. Never mutates what it was handed. */
export function applyView(flows: Flow[], view: ListView): Flow[] {
  const q = view.q.trim().toLowerCase();
  const rows = flows.filter((flow) => {
    if (view.state === 'active' && !flow.enabled) return false;
    if (view.state === 'paused' && flow.enabled) return false;
    if (view.trigger !== 'all' && triggerKindOf(flow) !== view.trigger) return false;
    return !q || searchIndex(flow).includes(q);
  });
  return rows.sort(view.sort === 'name' ? byName : byUpdated);
}

/**
 * Is anything HIDING rows right now?
 *
 * The order is not, on purpose: «clear the filters» must bring the hidden rows back without also
 * reshuffling the list under the hand of whoever pressed it.
 */
export function isFiltering(view: ListView): boolean {
  return !!view.q.trim() || view.state !== 'all' || view.trigger !== 'all';
}

/**
 * A copy of an automation: **the document and a name, and nothing else**.
 *
 * No id (so the editor's save CREATES rather than overwrites), no grants, no runs, no approvals,
 * no idempotency keys. A copy that arrived holding the original's permissions would be a way to
 * get an automation authorised without anybody authorising it, which is the whole of what the
 * grants system is for. And it is born `enabled: false` whatever the original was: a duplicate
 * that arrives running is an automation acting on the business because somebody wanted to READ it.
 *
 * The document is deep-copied. A shared sub-object would mean editing the copy edits the original
 * in the list on screen — and then saving the copy writes both.
 */
export function duplicateOf(flow: Flow, name: string): FlowInput {
  return {
    name,
    enabled: false,
    definition: structuredClone(flow.definition ?? {}) as Record<string, unknown>,
  };
}

/** «Copia de X», then «Copia de X (2)» — a name already on the list is confusing, not an error. */
export function copyName(name: string, taken: string[], t: Translator): string {
  const base = t('ui.copyOf', { name });
  if (!taken.includes(base)) return base;
  for (let n = 2; n < 100; n += 1) {
    const candidate = `${base} (${n})`;
    if (!taken.includes(candidate)) return candidate;
  }
  /* c8 ignore next */
  return base;
}
