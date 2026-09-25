/**
 * **The flow document, as the editor holds it in its hands.**
 *
 * Everything here is pure: no DOM, no network. The authority over what a valid document is stays
 * where it belongs — `GET /api/hub/flows/schema` (hub#716), which the editor asks at open time and
 * which the runtime enforces on save. What lives here is the *editing* model: how a step is added,
 * reordered and removed, and how a value the owner composed on screen becomes a value the kernel's
 * mapping language understands.
 *
 * The mapping rules mirrored below (`isPath`, the `{{…}}` templates) come from
 * `crates/runtime/src/flows/def.rs`. They are mirrored and not imported because they are the one
 * part of the contract the editor has to apply *while the owner types*, before any round-trip.
 * They are also the part where being subtly wrong is silent: a literal that happens to look like a
 * path is READ as a path by the kernel, and the step runs with a `null`.
 */

/** The document version this editor writes. A hub that enforces another one refuses the save. */
export const SCHEMA_VERSION = 1;

/** Roots of the mapping language (`def.rs`). `secret.` is legal only inside an `http` step. */
export const PATH_ROOTS = ['input', 'steps', 'event', 'secret'] as const;

/**
 * The step kinds the kernel executes — all of them drawn by this editor (see {@link isSpineKind}).
 * `query` is the deterministic read (hub#954, flows#30): a flow reads without a model in between.
 * `approval` is the pause (hub#950, flows#31): a flow asks a person without a model in between.
 */
export type StepKind =
  | 'command'
  | 'condition'
  | 'delay'
  | 'http'
  | 'ai'
  | 'notify'
  | 'query'
  | 'approval';

/** The four ways a flow starts. */
export type TriggerKind = 'event' | 'cron' | 'at' | 'manual';

/** One comparison of a guard: `{eq|neq|in|exists|contains|gt|gte|lt|lte}`. The set is CLOSED. */
export const OPERATORS = [
  'eq',
  'neq',
  'in',
  'exists',
  'contains',
  'gt',
  'gte',
  'lt',
  'lte',
] as const;
export type Operator = (typeof OPERATORS)[number];

/** A declarative filter: `{path: {op: value}}`, evaluated in AND. */
export type Condition = Record<string, Partial<Record<Operator, unknown>>>;

/** `notify.to` — a query and one of its columns. There is deliberately no literal form. */
export interface Recipient {
  query: string;
  params?: Record<string, unknown>;
  field: string;
}

/** `ai.tools` — what the model may be OFFERED here. Offering is not authorising: each needs a grant. */
export interface AiTools {
  queries?: string[];
  commands?: string[];
}

export interface Step {
  id: string;
  kind: StepKind;
  /** Any kind (hub#2066): the step runs only when this holds; otherwise it is skipped and the run carries on. */
  run_if?: Condition;
  /** `command` */
  command?: string;
  params?: Record<string, unknown>;
  /** `condition` */
  when?: Condition;
  /** `delay` */
  seconds?: number;
  until?: string;
  /** `http` */
  method?: string;
  url?: string;
  headers?: Record<string, unknown>;
  body?: unknown;
  timeout?: number;
  /** `ai` */
  prompt?: string;
  tools?: AiTools;
  policy?: 'auto' | 'manual';
  max_iters?: number;
  /** `notify` */
  channel?: 'email' | 'whatsapp';
  to?: Recipient;
  template?: string;
  vars?: Record<string, unknown>;
  /** `notify`, whatsapp only — Meta's own object, forwarded untranslated (see `whatsapp-options`). */
  interactive?: Record<string, unknown>;
  /** `query` — `params` is shared with `command`. */
  query?: string;
  result?: QueryResult;
  limit?: number;
  /** `approval` */
  title?: string;
  summary?: string;
  assignee?: Assignee;
  expires_in?: number;
  on_expire?: ExpiryPolicy;
  on_reject?: RejectPolicy;
  [k: string]: unknown;
}

/**
 * **The keys the kernel allows, per kind** — mirror of `def.rs::allowed_keys`, which is a STRICT
 * whitelist: an unknown key is refused at SAVE, not ignored. Mirrored rather than discovered,
 * because the editor has to build a step before it has anywhere to ask.
 */
export const STEP_KEYS: Readonly<Record<StepKind, readonly string[]>> = {
  command: ['id', 'kind', 'command', 'params'],
  condition: ['id', 'kind', 'when'],
  delay: ['id', 'kind', 'seconds', 'until'],
  http: ['id', 'kind', 'method', 'url', 'headers', 'body', 'timeout'],
  ai: ['id', 'kind', 'prompt', 'tools', 'policy', 'max_iters'],
  notify: ['id', 'kind', 'channel', 'to', 'template', 'vars', 'interactive'],
  query: ['id', 'kind', 'query', 'params', 'result', 'limit'],
  approval: ['id', 'kind', 'title', 'summary', 'assignee', 'expires_in', 'on_expire', 'on_reject'],
};

/**
 * `approval.assignee` — **a role, and there is deliberately no shape in which a person can be
 * named** (hub#950). Same refusal as a `notify` recipient, for the same reason: a document that
 * could say «Marta» stops working the day Marta leaves, and the marketplace template that shipped
 * with it would name somebody else's employee. Absent = whoever administers the hub.
 */
export interface Assignee {
  role: string;
}

/**
 * What happens to the RUN when nobody answers in time (`on_expire`), and when somebody says no
 * (`on_reject`). v1 is LINEAR, and these two are what replaces branching: `continue` plus a
 * `condition` on `steps.<id>.decision` composes the three outcomes without a fork.
 */
export const EXPIRY_POLICIES = ['reject', 'cancel', 'continue'] as const;
export type ExpiryPolicy = (typeof EXPIRY_POLICIES)[number];
export const REJECT_POLICIES = ['cancel', 'continue'] as const;
export type RejectPolicy = (typeof REJECT_POLICIES)[number];

/** How long an `approval` waits when the document does not say: **72 hours**, the tray's TTL. */
export const DEFAULT_APPROVAL_TTL_SECONDS = 259200;

/**
 * The most an `approval` may wait: **30 days**. Refused above it, not clamped (`limit`'s and
 * `max_iters`' precedent): a run parked for longer is a standing authorisation nobody remembers
 * giving — Power Automate kills the run at ~30 days and leaves the approval orphaned, which is
 * the #1 complaint of its forums.
 */
export const MAX_APPROVAL_TTL_SECONDS = 2592000;

/**
 * What a `query` step leaves in `steps.<id>` (hub#954). `first` (the kernel's default): the
 * fields of the first row at the root, plus `found` and `count`. `count`: only those two.
 * **There is no `rows`** — the mapping language cannot index an array, and the kernel refuses
 * `result: "rows"` at save rather than accept a step whose output nobody could read.
 */
export const QUERY_RESULTS = ['first', 'count'] as const;
export type QueryResult = (typeof QUERY_RESULTS)[number];

/**
 * The most rows one `query` step may bring into a run. **Refused above it, not trimmed**
 * (`flow.limit_out_of_range`, `max_iters`' precedent): a document that says more than it reads is
 * how a report comes out wrong with nobody noticing.
 */
export const MAX_QUERY_ROWS = 200;

/** The methods `def.rs` accepts. `CONNECT`/`TRACE` are absent on purpose: they are tunnels. */
export const HTTP_METHODS = ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'] as const;

/**
 * The channels that have a transport. `sms` is in ADR-0012's vocabulary and is refused BY NAME at
 * save and at grant time — offering it here would be a step the hub cannot ever deliver.
 */
export const NOTIFY_CHANNELS = ['email', 'whatsapp'] as const;

/** `max_iters` is refused above the cap rather than clamped: a document that says 50 and runs 10 lies. */
export const MAX_ITERS_CAP = 10;

/** `timeout` seconds — the run holds its lease the whole time, so this is also what an error costs. */
export const MAX_TIMEOUT_SECONDS = 30;

export interface Trigger {
  kind: TriggerKind;
  event?: string;
  filter?: Condition;
  input?: Record<string, unknown>;
  cron?: string;
  at?: string;
}

export interface FlowDoc {
  schema_version: number;
  name?: string;
  triggers: Trigger[];
  steps: Step[];
}

/** A permission a flow holds, as `PUT …/grants` writes it. `id` only comes back from the hub. */
export interface Grant {
  id?: string;
  kind: string;
  value: string;
  /**
   * hub#1623 — the payload fields this grant FIXES; absent or `{}` fixes none.
   *
   * It is part of what the grant SAYS, not decoration: «may cancel appointments» and «may cancel
   * appointments as the customer» are different permissions, and only the second one is safe to
   * hand an automation whose payload a model writes from a stranger's message. Every key named
   * here is pinned — the call brings that field with that exact value or the hub refuses it with
   * `flow.grant_payload_denied`, and **omitting it is refused just the same** as contradicting it.
   */
  payload?: Record<string, unknown>;
}

/** One piece of a composed value: typed text, or a field the owner picked. */
export type ValuePart = { kind: 'text'; text: string } | { kind: 'field'; path: string };

/**
 * A brand new flow. It starts `manual` on purpose: a document with no trigger at all is one that
 * can only be run by hand *without saying so*, and «why does my automation never fire» is the
 * first thing that goes wrong with every tool of this kind.
 */
export function emptyDoc(): FlowDoc {
  return { schema_version: SCHEMA_VERSION, triggers: [{ kind: 'manual' }], steps: [] };
}

/**
 * Reads whatever the hub stored. Deliberately forgiving: a document written by a newer editor, by
 * a blueprint or by hand must still OPEN — refusing to render it would leave the owner with an
 * automation they can neither read nor turn off.
 */
export function readDoc(raw: unknown): FlowDoc {
  const src = (raw ?? {}) as Partial<FlowDoc>;
  const triggers = Array.isArray(src.triggers) ? (src.triggers as Trigger[]) : [];
  const steps = Array.isArray(src.steps) ? (src.steps as Step[]) : [];
  return {
    schema_version: typeof src.schema_version === 'number' ? src.schema_version : SCHEMA_VERSION,
    ...(typeof src.name === 'string' ? { name: src.name } : {}),
    triggers,
    steps,
  };
}

/**
 * The kinds this editor knows how to draw AND edit — **all six of them since flows#3**.
 *
 * It stays a function, and the fallback stays read-only, for the same reason it existed: a
 * document written by a newer editor must still OPEN and be saved back untouched. Rendering a
 * document without a step and then writing it back is how a working automation gets deleted.
 */
export function isSpineKind(kind: string): boolean {
  return Object.prototype.hasOwnProperty.call(STEP_KEYS, kind);
}

/**
 * A step id that is not in this document and was not in it a minute ago.
 *
 * It is random rather than sequential because ids are how one step reads another
 * (`steps.<id>.field`). Counting would hand a fresh step the id of a deleted one, and any mapping
 * still pointing at the old step would silently start reading the new one.
 */
export function newStepId(doc: FlowDoc): string {
  const taken = new Set(doc.steps.map((s) => s.id));
  for (let i = 0; i < 50; i += 1) {
    const id = `s${Math.random().toString(36).slice(2, 8)}`;
    if (!taken.has(id)) return id;
  }
  /* c8 ignore next */
  return `s${Date.now().toString(36)}`;
}

/**
 * What a step of each kind looks like the moment it is dropped on the spine.
 *
 * Every blank here carries ONLY keys from {@link STEP_KEYS}: a stray field would make the very
 * first save fail on a document the owner has not typed a character into yet.
 */
function blankStep(id: string, kind: StepKind): Step {
  if (kind === 'condition') return { id, kind, when: {} };
  // An hour: long enough to read as «later», short enough that a first test does not need patience.
  if (kind === 'delay') return { id, kind, seconds: 3600 };
  // GET, and no URL. The harmless verb is the one to default to — a `POST` sitting in an unfilled
  // step is a write waiting for somebody to paste an address next to it.
  if (kind === 'http') return { id, kind, method: 'GET', url: '', headers: {} };
  // `manual` mirrors the kernel's own default, and it is written out loud rather than left
  // implicit: the permissive option is the one nobody types and everybody assumes.
  if (kind === 'ai') {
    return { id, kind, prompt: '', tools: { queries: [], commands: [] }, policy: 'manual', max_iters: 6 };
  }
  // Email, because it is the channel that costs nothing — and NO recipient, because there is no
  // default person to write to and a guessed one is the mistake this whole grant exists to stop.
  if (kind === 'notify') {
    return { id, kind, channel: 'email', to: { query: '', params: {}, field: '' }, vars: {} };
  }
  // The kernel's own defaults, written out loud: `first` because «read one thing and use its
  // fields» is what a shop owner means by «look it up», and the ceiling as the limit because the
  // number is what the hub would apply anyway — showing it is what lets the owner lower it.
  if (kind === 'query') {
    return { id, kind, query: '', params: {}, result: 'first', limit: MAX_QUERY_ROWS };
  }
  // The kernel's own defaults, written out loud: 72 h, and the RESTRICTIVE answers — a no ends
  // the run, silence counts as a no. NO `assignee`: absent means whoever administers the hub,
  // the one role that always has somebody, and no `command`/`payload`, which the kernel refuses
  // by name because this step executes nothing.
  if (kind === 'approval') {
    return {
      id,
      kind,
      title: '',
      summary: '',
      expires_in: DEFAULT_APPROVAL_TTL_SECONDS,
      on_expire: 'reject',
      on_reject: 'cancel',
    };
  }
  return { id, kind, command: '', params: {} };
}

export function addStep(doc: FlowDoc, kind: StepKind, at?: number): FlowDoc {
  const step = blankStep(newStepId(doc), kind);
  const steps = [...doc.steps];
  steps.splice(at ?? steps.length, 0, step);
  return { ...doc, steps };
}

export function removeStep(doc: FlowDoc, index: number): FlowDoc {
  return { ...doc, steps: doc.steps.filter((_, i) => i !== index) };
}

export function moveStep(doc: FlowDoc, from: number, to: number): FlowDoc {
  const steps = [...doc.steps];
  const [moved] = steps.splice(from, 1);
  if (!moved) return doc;
  steps.splice(to, 0, moved);
  return { ...doc, steps };
}

export function patchStep(doc: FlowDoc, index: number, patch: Partial<Step>): FlowDoc {
  return {
    ...doc,
    steps: doc.steps.map((s, i) => (i === index ? { ...s, ...patch } : s)),
  };
}

/**
 * The other half of {@link patchStep}: a key that has to **go**, gone.
 *
 * Patching with `{vars: undefined}` would leave the key in place holding `undefined`, and whether
 * it ever reaches the hub would come down to `JSON.stringify` dropping it on the way out. That is
 * a save that works by accident — and this is the edit where being wrong is loud: the kernel
 * refuses a `notify` carrying both the copy and the options (`conflicting_message_type`).
 */
export function removeStepKeys(doc: FlowDoc, index: number, keys: readonly string[]): FlowDoc {
  return {
    ...doc,
    steps: doc.steps.map((s, i) => {
      if (i !== index) return s;
      const next = { ...s };
      for (const key of keys) delete next[key];
      return next;
    }),
  };
}

export function patchTrigger(doc: FlowDoc, trigger: Trigger): FlowDoc {
  return { ...doc, triggers: [trigger] };
}

// ── The mapping language ──────────────────────────────────────────────────────────────────────

/**
 * Mirror of `def.rs::is_path`: the first dot-segment is one of the four roots and something
 * follows it. Anything else is a literal.
 */
export function isPath(s: string): boolean {
  const root = s.split('.')[0];
  return (
    (PATH_ROOTS as readonly string[]).includes(root) && s.length > root.length + 1 && s[root.length] === '.'
  );
}

/** `"007"` must stay a string; `"7"` must become the number a command's schema asks for. */
function scalar(text: string): string | number | boolean {
  if (text === 'true') return true;
  if (text === 'false') return false;
  // Round-tripping through Number is the whole test: a leading zero, a leading `+`, a trailing
  // unit or a trailing `0` after the decimal point all fail it, and all of them are strings a
  // person meant literally (a postcode, a phone, «2 units», a money amount — ADR-0123).
  if (text !== '' && String(Number(text)) === text) return Number(text);
  return text;
}

/**
 * The value the kernel stores for what the owner composed.
 *
 * One field alone becomes a **bare path**, which is the only form that keeps the type: `42.50`
 * stays a number instead of arriving at the command as the string `"42.5"`. Anything mixed
 * becomes a template, which is always a string — and that is the language's rule, not a choice
 * this editor makes.
 */
export function partsToValue(parts: ValuePart[]): unknown {
  if (parts.length === 0) return '';
  // A secret is ALWAYS written `{{secret.X}}`, even alone. That is the one form flows.md §4
  // documents and the one every example in the kernel uses. A bare `secret.API_KEY` may well
  // resolve too — but «may well» is how a header ends up carrying the eighteen literal characters
  // of a path instead of a credential, and nothing on any screen would say so.
  if (parts.length === 1 && !parts.some(isSecretPart)) {
    const only = parts[0];
    if (only.kind === 'field') return only.path;
    return scalar(only.text);
  }
  return partsToTemplate(parts);
}

/** A pill that names a secret rather than a field of the run. */
function isSecretPart(part: ValuePart): boolean {
  return part.kind === 'field' && part.path.startsWith('secret.');
}

/**
 * The same composition, **always as a template string**.
 *
 * `url` is `type: string` in the schema, so the type-preserving rule of {@link partsToValue} is
 * the wrong rule there: a lone field would be stored as the bare path `input.endpoint`, which the
 * kernel reads as a literal URL and refuses.
 */
export function partsToTemplate(parts: ValuePart[]): string {
  return parts.map((p) => (p.kind === 'field' ? `{{${p.path}}}` : p.text)).join('');
}

/** The pills that produced a stored value, so reopening a flow shows what was written, not `{{}}`. */
export function valueToParts(value: unknown): ValuePart[] {
  if (typeof value !== 'string') {
    return value === undefined || value === null ? [] : [{ kind: 'text', text: String(value) }];
  }
  if (isPath(value)) return [{ kind: 'field', path: value }];
  const parts: ValuePart[] = [];
  let rest = value;
  for (;;) {
    const start = rest.indexOf('{{');
    if (start < 0) break;
    const end = rest.indexOf('}}', start + 2);
    if (end < 0) break;
    if (start > 0) parts.push({ kind: 'text', text: rest.slice(0, start) });
    parts.push({ kind: 'field', path: rest.slice(start + 2, end).trim() });
    rest = rest.slice(end + 2);
  }
  if (rest !== '') parts.push({ kind: 'text', text: rest });
  return parts;
}

// ── Grants ────────────────────────────────────────────────────────────────────────────────────

/**
 * What this document needs permission to do, read out of the document itself.
 *
 * The owner should never have to type a command name twice — once in the step and once in a
 * permissions screen — because the second copy is where the typo lives, and a grant naming a
 * command that does not exist reads as authorisation on screen.
 */
export function requiredGrants(doc: FlowDoc): Grant[] {
  const out: Grant[] = [];
  const seen = new Set<string>();
  const need = (kind: string, value: unknown): void => {
    const text = typeof value === 'string' ? value.trim() : '';
    // A half-typed step asks for NOTHING. Deriving `{kind:'command', value:''}` from an empty box
    // would put a nameless row on the permissions screen that can never be granted.
    if (!text) return;
    const k = `${kind} ${text}`;
    if (seen.has(k)) return;
    seen.add(k);
    out.push({ kind, value: text });
  };

  for (const step of doc.steps) {
    switch (step.kind) {
      case 'command':
        need('command', step.command);
        break;
      // The URL is authorised as a PATTERN, not as itself: the grant is compared against the
      // TEMPLATED url at run time, so what has to be allowed is everything the template can become.
      case 'http':
        need('http', httpPatternFor(typeof step.url === 'string' ? step.url : ''));
        break;
      // Offering a tool is not authorising it (`assemble_tools` ∩ step ∩ live grants). Each side of
      // `tools` is a different grant kind because a read and a write are different decisions.
      case 'ai':
        for (const query of step.tools?.queries ?? []) need('query', query);
        for (const command of step.tools?.commands ?? []) need('command', command);
        break;
      // The SAME grant kind an ai tool asks for (hub#954 added no permission surface): what
      // changed is that reading no longer needs a model in between, not who may read.
      case 'query':
        need('query', step.query);
        break;
      // TWO grants, never one. The channel is what it costs (Meta bills every WhatsApp, an email is
      // free); the recipient is who gets written to. Allowing one says nothing about the other.
      case 'notify': {
        need('notify', step.channel);
        const to = step.to;
        if (to?.query?.trim() && to?.field?.trim()) {
          need('recipient_query', `${to.query.trim()}#${to.field.trim()}`);
        }
        break;
      }
      default:
        break;
    }
  }
  return out;
}

/**
 * The grants ONE step needs, as `"<kind> <value>"` keys.
 *
 * Same derivation as {@link requiredGrants}, per step, so the preview can point at the step that
 * would be refused rather than at a list somewhere else on another tab.
 */
export function grantsForStep(step: Step): string[] {
  return requiredGrants({ schema_version: SCHEMA_VERSION, triggers: [], steps: [step] }).map(
    (g) => `${g.kind} ${g.value}`,
  );
}

/**
 * The `http` grant pattern that covers a URL, **written the way the hub will compare it**.
 *
 * `check_http_pattern` refuses a pattern with no concrete host, with no path, or written in any
 * form other than its canonical one. A suggestion that gets refused at grant time is worse than no
 * suggestion at all: the owner reads it on screen as a permission they already gave.
 *
 * `''` is a first-class answer — for a URL that is not one yet, and for a templated HOST, where
 * any pattern would authorise every host the payload can name.
 */
export function httpPatternFor(url: string): string {
  const raw = (url ?? '').trim();
  if (!raw) return '';
  // Everything from the first template onwards is whatever the event brought, so the pattern can
  // only ever cover the static prefix. Cutting at the last `/` before it keeps the pattern on a
  // path boundary instead of authorising a sibling that merely shares a few characters.
  const templated = raw.indexOf('{{');
  const stable = templated < 0 ? raw : raw.slice(0, templated);
  let parsed: URL;
  try {
    parsed = new URL(stable);
  } catch {
    return '';
  }
  if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') return '';
  // A templated host is not a host. `https://{{input.host}}/x` parses with a literal `{{` hostname
  // only in some engines, so the check is on the text, which cannot be fooled either way.
  if (/[{}]/.test(parsed.host) || !parsed.host) return '';
  let path = parsed.pathname || '/';
  // The query string never takes part: the grant is compared against the RESOLVED path.
  if (templated >= 0 && !path.endsWith('/')) path = path.slice(0, path.lastIndexOf('/') + 1);
  return `${parsed.origin}${path}*`;
}

/** A grant, as one comparable string. A NUL joins the two halves so that a `kind` and a `value`
 *  cannot run together into the same key by accident — written as the ESCAPE, because a raw NUL
 *  byte in the source makes git call this whole file binary and every diff of it unreadable. */
const key = (g: Grant): string => `${g.kind}\u0000${g.value}`;

/** The required grants this flow does not hold yet. */
export function missingGrants(doc: FlowDoc, live: Grant[]): Grant[] {
  const held = new Set(live.map(key));
  return requiredGrants(doc).filter((g) => !held.has(key(g)));
}

/**
 * The complete list to send to `PUT …/grants`, which is a **replace and not a patch**.
 *
 * Everything live survives unless it was explicitly revoked. An editor that sent only what it
 * derived from the document would quietly revoke the `http`, `query` and `notify` grants of a flow
 * written by a newer editor: the owner would read «granted» on one screen and the flow would stop
 * working, with nothing on screen connecting the two.
 */
export function mergeGrants(live: Grant[], add: Grant[], revoke: Grant[]): Grant[] {
  const revoked = new Set(revoke.map(key));
  const out: Grant[] = [];
  const seen = new Set<string>();
  for (const g of [...live, ...add]) {
    const k = key(g);
    if (revoked.has(k) || seen.has(k)) continue;
    seen.add(k);
    out.push(withPin(g, grantPin(g)));
  }
  return out;
}

// ── The values a grant FIXES (hub#1623 for a write, hub#1662 for a read) ──────────────────────

/**
 * Can a grant of this kind fix values?
 *
 * Mirror of `GrantKind::can_pin()`: a `command`'s payload (`check_command_grant`, hub#1623) and a
 * `query`'s parameters (`check_query_grant`, hub#1662). Those are the two gates the hub is ever
 * handed values to judge; a pin anywhere else is refused with `flow.invalid_grant_payload` — and
 * `PUT …/grants` is all-or-nothing, so one offered on the wrong row would not fail that row: it
 * would lose the whole screen's worth of permissions.
 *
 * A read is on this list because a read is not harmless: `list_for_customer` without its
 * `customer_id` fixed answers about EVERY customer, and the recipe's whole promise is that the
 * automation only ever sees the one who is writing.
 */
export function canPinPayload(kind: string): boolean {
  return kind === 'command' || kind === 'query';
}

/**
 * The roots a pin may REFERENCE — mirror of `grants.rs::PIN_ROOTS`.
 *
 * A permission is stored once and the customer changes with every conversation, so «only this
 * customer» can only be said by naming what the run resolved. The scope the executor builds is
 * `{ input, steps }`, and those two are all of it.
 */
export const PIN_ROOTS = ['input', 'steps'] as const;

/** Why the hub would refuse a pin value — `''` when it would take it. Codes, never prose. */
export type PinProblem = '' | 'pin_template' | 'pin_root';

/**
 * Would `check_pin_value` take this? Mirror of `grants.rs`, so the screen can say WHICH row is
 * wrong instead of letting the hub bounce the whole list with a message written for a kernel log.
 *
 * - A non-string is a literal, compared as it stands: a number, a bool, an object, an array.
 * - `{{…}}` is refused because a pin is a VALUE, not a sentence: rendering it flattens a number to
 *   a string and, worse, an unresolved template renders EMPTY — the limit would quietly stop
 *   matching anything while still reading on screen as containment.
 * - A path rooted anywhere but {@link PIN_ROOTS} is refused: `secret.…` would make the gate an
 *   ORACLE (granted exactly when a value equals the secret, and a caller that can retry reads it
 *   one guess at a time), and `event.…` names something the run scope does not carry, so it could
 *   only ever deny — a permission that authorises nothing.
 *
 * Anything that is not a PATH is a literal, dots included: `customer.name@example.com` is an
 * address, and every pin written before references existed keeps comparing byte for byte.
 */
export function pinValueProblem(value: unknown): PinProblem {
  if (typeof value !== 'string') return '';
  if (value.includes('{{')) return 'pin_template';
  if (isPath(value) && !(PIN_ROOTS as readonly string[]).includes(value.split('.')[0])) {
    return 'pin_root';
  }
  return '';
}

/** Every field of a pin the hub would refuse, in the order they were written. */
export function pinProblems(pin: Record<string, unknown>): [string, PinProblem][] {
  const out: [string, PinProblem][] = [];
  for (const [field, value] of Object.entries(pin)) {
    const problem = pinValueProblem(value);
    if (problem) out.push([field, problem]);
  }
  return out;
}

/** The fields this grant fixes, as one shape for every reader: `{}` when it fixes none. */
export function grantPin(grant: Grant): Record<string, unknown> {
  const raw = grant.payload;
  if (!canPinPayload(grant.kind) || !raw || typeof raw !== 'object' || Array.isArray(raw)) return {};
  return { ...raw };
}

/**
 * Would this grant let THIS call through? The UI's mirror of `check_payload_pin`
 * (`crates/runtime/src/flows/grants.rs`, hub#1623).
 *
 * It answers about the CALL and never about the caller: a pin is not «who may run this», it is
 * «with what». That distinction is the whole point of a recipe that cancels appointments — the
 * automation is allowed to cancel, and what it may not do is cancel *on the salon's behalf*.
 *
 * Two rules, both the kernel's:
 *
 * - **Omitting a fixed field is refused exactly like contradicting it.** Not a detail: a command's
 *   schema is free to give the field a default — `appointments.appointments.cancel` defaults
 *   `channel` to `"staff"` — so «leave it out» is precisely how a payload written by a model would
 *   land back on the wide behaviour. A pin that only checked the values it was SENT would read as
 *   containment on screen and hold nothing.
 * - **Only a `command` and a `query` are ever handed values** (hub#1662), so a `payload` on any
 *   other kind fixes nothing in the hub ({@link canPinPayload}) and must not be read as a limit
 *   here either.
 */
export function grantAllowsCall(grant: Grant, payload: Record<string, unknown>): boolean {
  return Object.entries(grantPin(grant)).every(
    ([field, fixed]) =>
      Object.prototype.hasOwnProperty.call(payload, field) && sameJson(payload[field], fixed),
  );
}

/**
 * Two JSON values compared BY VALUE, the way `serde_json::Value`'s `PartialEq` compares them.
 *
 * Key order is not part of a JSON object's identity, so a pin written `{a,b}` has to match a
 * payload that arrives `{b,a}` — a containment that depended on the order a model happened to
 * serialise its answer in would fail open on a Tuesday and nobody would know why.
 */
function sameJson(a: unknown, b: unknown): boolean {
  if (a === b) return true;
  if (typeof a !== typeof b || a === null || b === null) return false;
  if (Array.isArray(a) || Array.isArray(b)) {
    return (
      Array.isArray(a) &&
      Array.isArray(b) &&
      a.length === b.length &&
      a.every((v, i) => sameJson(v, b[i]))
    );
  }
  if (typeof a !== 'object') return false;
  const x = a as Record<string, unknown>;
  const y = b as Record<string, unknown>;
  const keys = Object.keys(x);
  return keys.length === Object.keys(y).length && keys.every((k) => k in y && sameJson(x[k], y[k]));
}

/** A grant carrying `pin`, with the key OMITTED when it fixes nothing — the pre-hub#1623 shape. */
function withPin(grant: Grant, pin: Record<string, unknown>): Grant {
  const kept = canPinPayload(grant.kind) ? pin : {};
  return Object.keys(kept).length
    ? { kind: grant.kind, value: grant.value, payload: kept }
    : { kind: grant.kind, value: grant.value };
}

/**
 * The complete list for `PUT …/grants` with ONE grant's pin set to `pin` — every other grant, and
 * every other pin, exactly as it was.
 *
 * `setGrantPin(live, g, {})` removes the limit. Changing a pin is, in the hub, a revocation and a
 * fresh grant (`replace` does not consider a grant whose pin changed «still wanted»), so the `id`
 * of the row does not survive this and nothing here may promise that it does.
 */
export function setGrantPin(
  live: Grant[],
  target: Pick<Grant, 'kind' | 'value'>,
  pin: Record<string, unknown>,
): Grant[] {
  const wanted = key(target as Grant);
  return live.map((g) => withPin(g, key(g) === wanted ? pin : grantPin(g)));
}

/**
 * The typed rows of the screen as the object the hub stores.
 *
 * A row with no field name asks for NOTHING — the same rule {@link requiredGrants} applies to a
 * half-typed step, and for the same reason: a nameless entry would pin nothing at all while
 * reading on screen as a limit that was given.
 */
export function readPinRows(rows: readonly (readonly [string, string])[]): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  for (const [rawField, rawValue] of rows) {
    const field = rawField.trim();
    if (!field) continue;
    out[field] = pinValue(rawValue);
  }
  return out;
}

/** The pin as the rows that produced it, so reopening the screen shows what was written. */
export function pinRows(grant: Grant): [string, string][] {
  return Object.entries(grantPin(grant)).map(([field, value]) => [field, pinText(value)]);
}

/**
 * One typed value, read with **the same literal rule as a step parameter** ({@link partsToValue}):
 * `007` is a postcode, `7` is the number a command's schema asks for. Same rule on purpose — the
 * box looks the same to the owner, so it had better behave the same.
 *
 * The one addition is JSON, and only for a value that opens as an object or an array. A pin set
 * through the API can hold either, and reading it back as the STRING `[object Object]` would not
 * merely lose it: the grant would go on saying it fixes that field, matching nothing, so an owner
 * who edited an unrelated row would silently break their own containment.
 */
function pinValue(text: string): unknown {
  const trimmed = text.trim();
  if (trimmed.startsWith('{') || trimmed.startsWith('[')) {
    try {
      const parsed: unknown = JSON.parse(trimmed);
      if (parsed && typeof parsed === 'object') return parsed;
    } catch {
      // Not JSON after all — a literal that happens to start with a brace. Falls through to the
      // same rule every other value gets rather than refusing what the owner typed.
    }
  }
  return scalar(text);
}

/** The inverse of {@link pinValue}: what to put in the box for a stored value. */
function pinText(value: unknown): string {
  if (typeof value === 'string') return value;
  if (value && typeof value === 'object') return JSON.stringify(value);
  return String(value);
}

/**
 * The paths a later step can read out of a `query` step, for the panel to SAY so.
 *
 * `<field>` stands for whatever columns the read returns — the editor cannot know them without a
 * round trip, and inventing names would teach paths that resolve to nothing. `rows` is never on
 * this list, on purpose (see {@link QUERY_RESULTS}).
 */
export function queryOutputs(step: Step): string[] {
  const base = [`steps.${step.id}.found`, `steps.${step.id}.count`];
  return step.result === 'count' ? base : [...base, `steps.${step.id}.<field>`];
}

/**
 * The paths a later step can read out of an `approval` step (hub#950): the decision
 * (`approved|rejected|expired`), who made it, when, and the comment they left. Only reachable
 * when the run CONTINUES past the step — which is what `on_reject`/`on_expire: continue` are for.
 */
export function approvalOutputs(step: Step): string[] {
  return ['decision', 'decided_by', 'decided_at', 'comment'].map((f) => `steps.${step.id}.${f}`);
}
