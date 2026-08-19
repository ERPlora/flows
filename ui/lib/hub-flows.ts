/**
 * **The one door this module has into the hub's automation kernel** (hub#714, ADR-0283 §9).
 *
 * The kernel is core REST (`/api/hub/flows*`), not the module dispatcher, so `query`/`command`
 * cannot reach it. The declared way in is `client.forModule('flows').flows`, and three things have
 * to be true for it to answer: the client is scoped to a module, the person at the keyboard holds
 * an owner/admin session, and `flows` has `manage_flows` **declared in its manifest and granted by
 * the owner**. Only the first is this file's business; the other two are the runtime's, and a
 * refusal comes back as `capability_denied` so the editor can ask for the grant instead of
 * showing the word «error».
 *
 * The types are declared HERE rather than imported from `@erplora/module-sdk` on purpose. The
 * client this module actually calls is the SHELL's instance, injected as a property — so what
 * matters is the shape at runtime, and pinning a compile-time version of the SDK would only tie
 * the module's build to whichever hub checkout the toolkit happens to link.
 */
import type { Grant } from './flow-doc';

/** The runtime's refusal when `manage_flows` is not granted. The editor asks for it by name. */
export const CAPABILITY_DENIED = 'capability_denied';

/** Not a code the hub sends: what the editor calls a hub whose core has no flows surface. */
export const UNSUPPORTED_CORE = 'flows.unsupported_core';

export interface Flow {
  id: string;
  name: string;
  enabled: boolean;
  definition: Record<string, unknown>;
  created_at?: string;
  updated_at?: string;
  [k: string]: unknown;
}

export interface FlowInput {
  name: string;
  definition: Record<string, unknown>;
  enabled?: boolean;
}

export interface FlowSchema {
  schema_version: number;
  core_version: string;
  schema: Record<string, unknown>;
}

export interface RunPage<T = unknown> {
  data: T[];
  next_cursor?: string;
}

/** One field of an event payload, as `GET /api/hub/events/shape` answers (hub#715). */
export interface EventFieldShape {
  path: string;
  type: string;
  sample?: unknown;
  redacted: boolean;
  truncated: boolean;
  items?: number;
  seen_in: number;
}

export interface EventShape {
  event_name: string;
  declared_by: string[];
  /** `0` means «no examples yet», **not** «no such event». The picker has to say which. */
  samples: number;
  last_seen_at?: string;
  fields: EventFieldShape[];
}

/**
 * A secret, as `GET /api/hub/flows/secrets` answers: **the name and when it was touched, never
 * the value**. There is no endpoint that returns a value, and that absence is the design
 * (ADR-0283 §4) — so there is no field here to hold one, on purpose.
 */
export interface SecretInfo {
  name: string;
  created_at?: string;
  updated_at?: string;
  updated_by?: string;
}

/**
 * One row of the tray — **one table, two kinds** (hub#950).
 *
 * `command` is a proposal an `ai` step made under `policy: manual`: a WRITE, with its payload
 * stored verbatim, and approving RUNS it. `decision` is the generic `approval` step: a question in
 * words, with no command and no payload, and approving runs **nothing** — it records an answer and
 * lets the run carry on. A row written before the `kind` column existed is a `command`.
 *
 * Without a screen for these, both leave the run parked in `waiting_approval` until the TTL
 * quietly expires it, and what the owner experiences is an automation that did nothing.
 */
export interface Approval {
  id: string;
  run_id?: string;
  flow_id?: string;
  step_id?: string;
  /** `command` | `decision`. Absent = `command` (a row older than hub#950). */
  kind?: string;
  command?: string;
  payload?: Record<string, unknown>;
  reason?: string;
  /** The question, for a `decision`. Already templated: editing the flow does not change it. */
  title?: string;
  summary?: string;
  /** The role that was asked. `''` = whoever administers the hub. */
  assignee_role?: string;
  /** What the person wrote when deciding (`POST …/approve|reject` with `{comment}`). */
  comment?: string;
  status?: string;
  decided_by?: string;
  decided_at?: string;
  expires_at?: string;
  /** What the RUN does when the timer decides (`reject` | `cancel` | `continue`). */
  on_expire?: string;
  /** What the RUN does on a no (`cancel` | `continue`). */
  on_reject?: string;
  error?: string;
  created_at?: string;
}

/** The refusals a decision can meet — the row STAYS on all three. `not_yours` is a 403 (hub#950). */
export const APPROVAL_EXPIRED = 'flow.approval_expired';
export const APPROVAL_ALREADY_DECIDED = 'flow.approval_already_decided';
export const APPROVAL_NOT_YOURS = 'flow.approval_not_yours';

/** The ephemeral WS facts the kernel emits so a tray lights up without polling. */
export const EVENT_APPROVAL_CREATED = 'flow.approval.created';
export const EVENT_APPROVAL_EXPIRED = 'flow.approval.expired';

/** The frozen §9 method list, as this module uses it. */
export interface FlowsApi {
  list(): Promise<Flow[]>;
  create(flow: FlowInput): Promise<Flow>;
  get(id: string): Promise<Flow>;
  update(id: string, flow: FlowInput): Promise<Flow>;
  remove(id: string): Promise<unknown>;
  grants(id: string): Promise<Grant[]>;
  replaceGrants(id: string, grants: Grant[]): Promise<Grant[]>;
  run(id: string, input?: Record<string, unknown>): Promise<unknown>;
  runs(id: string, page?: { limit?: number; before?: string }): Promise<RunPage>;
  getRun(runId: string): Promise<unknown>;
  schema(): Promise<FlowSchema>;
  /** Names only. **There is deliberately no `getSecret`** — see {@link SecretInfo}. */
  secrets?(): Promise<SecretInfo[]>;
  putSecret?(name: string, value: string): Promise<unknown>;
  deleteSecret?(name: string): Promise<unknown>;
  approvals?(status?: string): Promise<Approval[]>;
  approve?(id: string, body?: Record<string, unknown>): Promise<unknown>;
  reject?(id: string, body?: Record<string, unknown>): Promise<unknown>;
}

/**
 * One line of `GET /api/hub/events` (hub#823): an event this hub can produce, **name only** —
 * what it carries stays behind `shape()` with the redaction of ADR-0312.
 */
export interface EventCatalogEntry {
  name: string;
  /** Installed modules declaring they emit it. Empty = only the outbox remembers it. */
  declared_by?: string[];
  /** When this hub last emitted it. Absent = never, inside the ninety-day retention window. */
  last_seen_at?: string;
}

/**
 * One event that never got delivered (`GET /api/hub/events/dead`, hub#660 → hub#953).
 *
 * The whole payload travels: an operator deciding between «replay this» and «close it for good» is
 * deciding ABOUT the payload — it is what tells a lost invoice from noise.
 */
export interface DeadEvent {
  id: string;
  event_name: string;
  /** The **emitting** module: who produced the event, not who refused it. */
  module_id: string;
  user_id?: string;
  payload?: unknown;
  last_error?: string;
  attempts?: number;
  depth?: number;
  created_at?: string;
  /**
   * Why the row is terminal, when the answer is not «it burnt its eight attempts» (hub#827).
   * `''`/absent for an ordinary one; `flow.release_revoked` when the owner withdrew the flow's
   * authorisation with the message still queued.
   */
  failure_kind?: string;
  /**
   * Whether a retry can do anything with this row — **decided by the runtime, never guessed here**.
   * `false` means the screen must not draw the button: retrying a revoked release answered `200`,
   * reset the attempts and died again for the same reason.
   */
  retryable?: boolean;
}

/**
 * The stamp `POST /api/hub/events/{id}/discard` writes back (hub#955).
 *
 * `discard_reason` is the reason **as stored** — trimmed and capped at 500 characters by the
 * runtime, `''` when none was given. A hub older than hub#955 leaves the field out altogether, so
 * a screen that renders it has to tell «kept, and empty» from «this hub does not keep it»: showing
 * the typed sentence in the second case would display a record that was never written.
 */
export interface DiscardResult {
  id: string;
  status?: string;
  /** `hub_user:<id>` — the resolved session, never anything the caller sent. */
  discarded_by?: string;
  discard_reason?: string;
}

export interface EventsApi {
  shape(name: string, opts?: { limit?: number }): Promise<EventShape>;
  /**
   * The events this hub can fire (hub#823). **Optional on purpose**: a hub older than that method
   * hands out a client without it, and the trigger picker has to SAY so rather than pretend —
   * see `event-catalog.ts`.
   */
  list?(): Promise<EventCatalogEntry[]>;
  /**
   * **The dead-letter queue** (hub#953). Optional for the same reason `list` is, and it matters
   * more here: a tray that silently shows nothing on an older hub is saying «nothing is wrong»
   * about a hub that cannot tell you whether anything is wrong. See `erp-flows-dead-letter`.
   */
  dead?(): Promise<DeadEvent[]>;
  deadCount?(): Promise<{ count: number }>;
  /** Rejects with `flow.release_revoked` when the retry can never work — never a quiet success. */
  retry?(id: string): Promise<unknown>;
  /**
   * Closes the row for good. The hub takes WHO from the session and WHEN from the clock; the
   * **reason** is the one part of the stamp only the person closing the row knows, so it is the
   * only thing the body carries (hub#955). Optional on purpose: a queue that demands a written
   * justification to close a row is a queue nobody drains.
   */
  discard?(id: string, reason?: string): Promise<DiscardResult>;
  retryAll?(): Promise<{ retried: number }>;
  trace?(id: string): Promise<unknown>;
}

export interface ModuleClient {
  flows: FlowsApi;
  events: EventsApi;
  /**
   * The ordinary dispatcher, which this module now also uses — for its OWN surface, not the
   * kernel's (flows#4). The assistant cannot reach `/api/hub/flows`: those routes demand an
   * owner/admin session at a keyboard and refuse a machine token, which is exactly what an
   * assistant turn holds. So what the assistant writes is a row in this module's
   * `flows_flowdraft` table, through `flows.drafts.propose`, and this screen reads it back the
   * same way any module reads its own data.
   *
   * That indirection is the FEATURE, not a workaround: a draft is not a flow, so there is no
   * shape of bug — here, in a later editor, in a blueprint — that turns what a model wrote into
   * something that runs. Optional because `erplora dev`'s preview client is not a full one.
   */
  query?<T = unknown>(name: string, params?: Record<string, unknown>): Promise<T>;
  command?<T = unknown>(name: string, payload?: Record<string, unknown>): Promise<T>;
  locale?: string;
  t?(catalog: Record<string, unknown>, key: string, params?: Record<string, unknown>): string;
  formatMoney?(amount: unknown): string;
  /**
   * The live event bus of the shell's client, inherited by the scoped one. Optional because the
   * preview client of `erplora dev` has none — and a tray that cannot subscribe still works, it
   * just refreshes when it is opened.
   */
  subscribe?(event: string, cb: (payload: unknown) => void): () => void;
}

/** What the shell sets on the element (`ModuleView.vue`). */
export interface ClientHost {
  client?: unknown;
}

interface GlobalClient {
  forModule?(id: string): unknown;
}

function hasFlows(candidate: unknown): candidate is ModuleClient {
  const c = candidate as Partial<ModuleClient> | null | undefined;
  return !!c && typeof c === 'object' && !!c.flows && !!c.events;
}

/**
 * The scoped client, or `null` when this hub cannot offer one.
 *
 * `null` is a first-class answer and not a failure to handle later: `erplora dev`'s preview client
 * has no `forModule` at all, and a hub older than hub#714 hands out a scoped client with no
 * `flows` on it. Both are things the editor has to SAY on screen — throwing inside
 * `connectedCallback` renders a blank page, which is the one outcome that tells nobody anything.
 */
export function resolveClient(host: ClientHost, global: GlobalClient | undefined): ModuleClient | null {
  if (hasFlows(host?.client)) return host.client;
  const scoped = typeof global?.forModule === 'function' ? global.forModule('flows') : undefined;
  return hasFlows(scoped) ? scoped : null;
}

/** The runtime's error code, however the SDK wrapped it. `''` when there is none to read. */
export function errorCode(e: unknown): string {
  const code = (e as { code?: unknown } | null | undefined)?.code;
  return typeof code === 'string' ? code : '';
}
