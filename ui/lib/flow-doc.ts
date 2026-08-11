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
  [k: string]: unknown;
}

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

/** The kinds this editor knows how to draw AND edit. The rest open read-only. */
export function isSpineKind(kind: string): boolean {
  return kind === 'command' || kind === 'condition' || kind === 'delay';
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

/** What a step of each kind looks like the moment it is dropped on the spine. */
function blankStep(id: string, kind: StepKind): Step {
  if (kind === 'condition') return { id, kind, when: {} };
  // An hour: long enough to read as «later», short enough that a first test does not need patience.
  if (kind === 'delay') return { id, kind, seconds: 3600 };
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
  if (parts.length === 1) {
    const only = parts[0];
    if (only.kind === 'field') return only.path;
    return scalar(only.text);
  }
  return parts
    .map((p) => (p.kind === 'field' ? `{{${p.path}}}` : p.text))
    .join('');
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
  for (const step of doc.steps) {
    if (step.kind !== 'command') continue;
    const value = typeof step.command === 'string' ? step.command.trim() : '';
    if (!value || seen.has(value)) continue;
    seen.add(value);
    out.push({ kind: 'command', value });
  }
  return out;
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
