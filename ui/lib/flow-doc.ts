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

/** The six step kinds the kernel executes. The editor draws three of them (see {@link isSpineKind}). */
export type StepKind = 'command' | 'condition' | 'delay' | 'http' | 'ai' | 'notify';

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
  [k: string]: unknown;
}

/**
 * **The keys the kernel allows, per kind** — mirror of `def.rs:1018-1025`, which is a STRICT
 * whitelist: an unknown key is refused at SAVE, not ignored. Mirrored rather than discovered,
 * because the editor has to build a step before it has anywhere to ask.
 */
export const STEP_KEYS: Readonly<Record<StepKind, readonly string[]>> = {
  command: ['id', 'kind', 'command', 'params'],
  condition: ['id', 'kind', 'when'],
  delay: ['id', 'kind', 'seconds', 'until'],
  http: ['id', 'kind', 'method', 'url', 'headers', 'body', 'timeout'],
  ai: ['id', 'kind', 'prompt', 'tools', 'policy', 'max_iters'],
  notify: ['id', 'kind', 'channel', 'to', 'template', 'vars'],
};

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

const key = (g: Grant): string => `${g.kind} ${g.value}`;

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
    out.push({ kind: g.kind, value: g.value });
  }
  return out;
}
