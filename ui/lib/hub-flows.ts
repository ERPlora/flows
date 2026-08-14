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
 * One proposal an `ai` step made under `policy: manual`, waiting for a person.
 *
 * Without a screen for these, a `policy: manual` step leaves proposals hanging where nobody sees
 * them — the run sits in `waiting_approval` until its 72-hour TTL quietly expires it.
 */
export interface Approval {
  id: string;
  run_id?: string;
  flow_id?: string;
  step_id?: string;
  command?: string;
  payload?: Record<string, unknown>;
  reason?: string;
  status?: string;
  decided_by?: string;
  decided_at?: string;
  expires_at?: string;
  error?: string;
  created_at?: string;
}

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

export interface EventsApi {
  shape(name: string, opts?: { limit?: number }): Promise<EventShape>;
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
