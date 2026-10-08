/**
 * **«Probar» — what this automation would do with the owner's own data, without doing it.**
 *
 * The research this module is built on is blunt about why this matters: Brackenbury et al. (CHI
 * 2019) found that people do **not** predict the behaviour of a trigger-action flow that has a
 * fault — not even reading it. Watching it run against their own data is what fixes that.
 *
 * ## Why the whole thing lives in the module
 *
 * Two of the three pieces flows#2 asked for would have been changes to the kernel, and the kernel
 * is FROZEN (ADR-0283). Checked against the code rather than assumed:
 *
 * - **There is no dry-run.** `POST /api/hub/flows/{id}/run` executes for real, commands included.
 *   Nothing in `crates/runtime` or `crates/server` takes a `dry_run`, `simulate` or `test_mode`.
 *   A «probar» button that charged a test sale would be worse than having no button.
 * - **There is no endpoint that returns a real event payload.** `…/events/shape` answers the FORM
 *   (ADR-0312: handing a marketplace module the last N payloads of any event would be exporting
 *   the customer book with an editor on top). The only payloads the hub returns are dead-letters —
 *   failed events only.
 *
 * So this file executes nothing and asks for nothing new. It builds the input out of the **real
 * per-field samples** `…/events/shape` already returns — one real value each, from real events of
 * THIS hub — and then walks the document, mirroring the kernel's own semantics, to say what would
 * happen. Nothing is sent, nothing is charged, nothing is written.
 *
 * ## The mirror, and its one honest limit
 *
 * `resolvePath`, `renderTemplate` and `conditionResult` below are mirrors of
 * `crates/runtime/src/flows/def.rs` (`resolve`, `render_template`, `Condition::matches`/`eval`/
 * `json_eq`/`compare`). They are mirrored and not imported for the same reason `isPath` already is:
 * this runs while the owner watches, before any round trip.
 *
 * The limit is **redaction**, and it is stated rather than papered over. The hub withholds the
 * sample of anything that could be about a person, so this side genuinely does not know the value.
 * A guard that reads such a field therefore answers **`uncertain`** instead of a verdict: being
 * confidently wrong — telling an owner their condition fails when with the real value it would
 * pass — is the one outcome that would make this feature worse than nothing.
 */
import type { Condition, FlowDoc, Operator, Step, Trigger } from './flow-doc';
import { readTapOptions } from './whatsapp-options';
import type { EventShape } from './hub-flows';

/**
 * The stand-in for a value the hub withheld. It is a value, not an absence — telling the two
 * apart is most of what makes this screen worth looking at.
 *
 * The NUL wrapper is not decoration: these sentinels are compared against values that came out of
 * a customer's own events, and a bare 'redacted' is a string a real payload could plausibly
 * contain. It is written as the ESCAPE and never as a raw byte — a literal NUL in the source makes
 * git treat the whole file as binary, and every future reader loses the diff.
 */
export const REDACTED = '\u0000redacted\u0000';

/** What is shown in place of a withheld value, so a line reads as covered and not as empty. */
const REDACTED_MARK = '••••';

/** The stand-in for the output of a step that has not run. Unknowable here, and not a fault. */
export const UNKNOWN = '\u0000unknown\u0000';

const UNKNOWN_MARK = '…';

export interface BuiltInput {
  input: Record<string, unknown>;
  /** Paths whose example the hub withheld. */
  redactedPaths: string[];
  /** `false` when this hub has no real example to test with — never a reason to invent one. */
  hasRealData: boolean;
}

/**
 * The run input, reassembled from the shape's real samples.
 *
 * `samples: 0` is a real answer (an infrequent event whose last occurrence aged out of the
 * ninety-day window), and it returns an EMPTY input with `hasRealData: false`. Making up a
 * plausible sale would defeat the entire point: the owner is here to see their own data.
 */
export function inputFromShape(shape: EventShape | null | undefined): BuiltInput {
  const input: Record<string, unknown> = {};
  const redactedPaths: string[] = [];
  if (!shape || !shape.samples || !Array.isArray(shape.fields)) {
    return { input, redactedPaths, hasRealData: false };
  }
  for (const field of shape.fields) {
    if (!field?.path) continue;
    if (field.redacted) {
      redactedPaths.push(field.path);
      place(input, field.path, REDACTED);
      continue;
    }
    // An array is placed as an array of the right LENGTH and nothing else: the mapping language
    // has no indexing, so there is nothing inside one an automation could ever reach.
    if (field.type === 'array') {
      place(input, field.path, new Array(field.items ?? 0).fill(null));
      continue;
    }
    // `object` is not placed: the shape DESCENDS into one, so its leaves arrive on their own.
    if (field.type === 'object') continue;
    place(input, field.path, field.sample === undefined ? null : field.sample);
  }
  return { input, redactedPaths, hasRealData: true };
}

/** Writes `a.b.c` into a nested object, without trampling a branch already placed there. */
function place(root: Record<string, unknown>, path: string, value: unknown): void {
  const parts = path.split('.');
  let cursor = root;
  for (let i = 0; i < parts.length - 1; i += 1) {
    const key = parts[i];
    if (typeof cursor[key] !== 'object' || cursor[key] === null || Array.isArray(cursor[key])) {
      cursor[key] = {};
    }
    cursor = cursor[key] as Record<string, unknown>;
  }
  cursor[parts[parts.length - 1]] = value;
}

// ── The mapping language, mirrored from def.rs ────────────────────────────────────────────────

/** `def.rs::resolve_path` — walks `a.b.c`, and there is no indexing. `undefined` = not there. */
export function resolvePath(path: string, scope: unknown): unknown {
  let cursor: unknown = scope;
  for (const segment of path.split('.')) {
    if (typeof cursor !== 'object' || cursor === null) return undefined;
    cursor = (cursor as Record<string, unknown>)[segment];
    if (cursor === undefined) return undefined;
  }
  return cursor;
}

const PATH_ROOTS = ['input', 'steps', 'event', 'secret', 'run'];

function isPath(s: string): boolean {
  const root = s.split('.')[0];
  return PATH_ROOTS.includes(root) && s.length > root.length + 1 && s[root.length] === '.';
}

/** `def.rs::stringify` — a string is itself, null is empty, anything else is its JSON. */
function stringify(value: unknown): string {
  if (value === null || value === undefined) return '';
  if (value === REDACTED) return REDACTED_MARK;
  if (value === UNKNOWN) return UNKNOWN_MARK;
  if (typeof value === 'string') return value;
  try {
    return JSON.stringify(value) ?? '';
  } catch {
    return String(value);
  }
}

/**
 * `def.rs::render_template`. An unclosed `{{` is left VERBATIM, exactly as the kernel leaves it:
 * it is text the author wrote, and inventing a value for it would be worse than showing braces.
 */
export function renderTemplate(text: string, scope: unknown): string {
  let out = '';
  let rest = text;
  for (;;) {
    const start = rest.indexOf('{{');
    if (start < 0) break;
    out += rest.slice(0, start);
    const after = rest.slice(start + 2);
    const end = after.indexOf('}}');
    if (end < 0) return out + rest.slice(start);
    out += stringify(lookup(after.slice(0, end).trim(), scope));
    rest = after.slice(end + 2);
  }
  return out + rest;
}

/**
 * One path, with the two things this side cannot know made explicit rather than guessed:
 *
 * - a **secret** is never resolvable here at all — there is no endpoint that returns one, and a
 *   preview that printed a credential would be the one place in the product where a write-only
 *   value became readable;
 * - `steps.<id>.…` is the output of a step that HAS NOT RUN. It is unknown, not empty;
 * - `run.idempotency_key` is made by the hub when the call runs (one per run and step, hub#2675).
 *   There is no run here, so it is unknown too — never empty.
 */
function lookup(path: string, scope: unknown): unknown {
  if (path.startsWith('secret.')) return REDACTED;
  if (path.startsWith('run.')) return UNKNOWN;
  if (path.startsWith('steps.')) {
    const found = resolvePath(path, scope);
    return found === undefined ? UNKNOWN : found;
  }
  const found = resolvePath(path, scope);
  return found === undefined ? null : found;
}

/** `def.rs::resolve` — a bare path keeps its type, a template is always a string. */
export function resolveExpr(expr: unknown, scope: unknown): unknown {
  if (typeof expr === 'string') {
    if (isPath(expr)) return lookup(expr, scope);
    if (expr.includes('{{')) return renderTemplate(expr, scope);
    return expr;
  }
  if (Array.isArray(expr)) return expr.map((v) => resolveExpr(v, scope));
  if (typeof expr === 'object' && expr !== null) {
    return Object.fromEntries(
      Object.entries(expr as Record<string, unknown>).map(([k, v]) => [k, resolveExpr(v, scope)]),
    );
  }
  return expr;
}

// ── Conditions, mirrored from def.rs ──────────────────────────────────────────────────────────

/** `def.rs::as_number` — a numeric STRING counts, because money is a string (ADR-0123). */
function asNumber(v: unknown): number | null {
  if (typeof v === 'number') return Number.isFinite(v) ? v : null;
  if (typeof v === 'string') {
    const text = v.trim();
    if (text === '') return null;
    const n = Number(text);
    return Number.isFinite(n) ? n : null;
  }
  return null;
}

/** `def.rs::as_text`. */
function asText(v: unknown): string | null {
  if (typeof v === 'string') return v;
  if (typeof v === 'number' || typeof v === 'boolean') return String(v);
  return null;
}

/** Structural equality over decoded JSON — `serde_json::Value`'s own `PartialEq`. */
function sameJson(a: unknown, b: unknown): boolean {
  if (a === b) return true;
  if (Array.isArray(a) || Array.isArray(b)) {
    if (!Array.isArray(a) || !Array.isArray(b) || a.length !== b.length) return false;
    return a.every((item, i) => sameJson(item, b[i]));
  }
  if (typeof a === 'object' && typeof b === 'object' && a !== null && b !== null) {
    const [x, y] = [a as Record<string, unknown>, b as Record<string, unknown>];
    const keys = Object.keys(x);
    if (keys.length !== Object.keys(y).length) return false;
    return keys.every((key) => key in y && sameJson(x[key], y[key]));
  }
  return false;
}

/**
 * `def.rs::json_eq` — strict first, then numeric, then text.
 *
 * 🔴 «Strict» is `a == b` on a `serde_json::Value`, and that is STRUCTURAL: in the hub two empty
 * lists are equal. `===` here is referential, so they were not (flows#100) — and neither `as_number`
 * nor `as_text` answers for a list, so the comparison fell all the way through to `false` and
 * `neq: []` matched a list that WAS empty. The preview then promised a step the hub would skip, on
 * exactly the guard that stops «WhatsApp → appointment» paying Meta for an interactive list with no
 * rows. Compared as JSON, and by key-independent value for an object, because a `serde_json::Map`
 * compares as a map and a scope decoded from a body has no order to rely on.
 */
function jsonEq(a: unknown, b: unknown): boolean {
  if (a === b) return true;
  if (a === null || b === null || a === undefined || b === undefined) return false;
  if (typeof a === 'object' || typeof b === 'object') return sameJson(a, b);
  const [x, y] = [asNumber(a), asNumber(b)];
  if (x !== null && y !== null) return x === y;
  const [s, t] = [asText(a), asText(b)];
  return s !== null && t !== null && s === t;
}

/** `def.rs::compare` — numeric when both sides are, otherwise lexicographic (RFC-3339 sorts). */
function compare(a: unknown, b: unknown): number | null {
  if (a === null || b === null || a === undefined || b === undefined) return null;
  const [x, y] = [asNumber(a), asNumber(b)];
  if (x !== null && y !== null) return x === y ? 0 : x < y ? -1 : 1;
  const [s, t] = [asText(a), asText(b)];
  if (s === null || t === null) return null;
  return s === t ? 0 : s < t ? -1 : 1;
}

/** `def.rs::eval`, one operator against one pair. */
function evalOp(op: Operator, actual: unknown, expected: unknown): boolean {
  switch (op) {
    case 'eq':
      return jsonEq(actual, expected);
    case 'neq':
      return !jsonEq(actual, expected);
    case 'exists': {
      const present = actual !== null && actual !== undefined;
      return (typeof expected === 'boolean' ? expected : true) === present;
    }
    case 'in':
      return Array.isArray(expected) && expected.some((item) => jsonEq(actual, item));
    case 'contains':
      if (Array.isArray(actual)) return actual.some((item) => jsonEq(item, expected));
      if (typeof actual === 'string') {
        const needle = asText(expected);
        return needle !== null && actual.includes(needle);
      }
      return false;
    default: {
      const ordering = compare(actual, expected);
      if (ordering === null) return false;
      if (op === 'gt') return ordering > 0;
      if (op === 'gte') return ordering >= 0;
      if (op === 'lt') return ordering < 0;
      return ordering <= 0;
    }
  }
}

export interface FailedClause {
  path: string;
  op: Operator;
  expected: unknown;
}

export interface ConditionResult {
  matched: boolean;
  failed: FailedClause[];
  /**
   * A clause read a field whose example the hub withheld, so the verdict cannot be trusted. The
   * screen says «I cannot tell» rather than a confident answer that may be the wrong one.
   */
  uncertain: boolean;
}

/**
 * `Condition::matches` — every clause, in AND. A missing path is null and null fails every
 * comparison except `exists: false`: a filter must not match by accident on a field the event
 * does not carry.
 */
export function conditionResult(when: Condition | undefined, scope: unknown): ConditionResult {
  const failed: FailedClause[] = [];
  let uncertain = false;
  for (const [path, ops] of Object.entries(when ?? {})) {
    const actual = lookup(path, scope);
    for (const [op, expected] of Object.entries(ops ?? {})) {
      const operator = op as Operator;
      // `exists` is still answerable about a withheld value: whether it is THERE is not what was
      // withheld. Everything else is a comparison against a placeholder, which proves nothing.
      if (actual === REDACTED && operator !== 'exists') {
        uncertain = true;
        continue;
      }
      // The output of a step that has not run is unknown for EVERY operator, `exists` included:
      // whether `steps.week.found` is there depends on the read that did not happen. This is the
      // `query → condition` pattern of hub#954, and «stops here» about it would be a lie.
      if (actual === UNKNOWN) {
        uncertain = true;
        continue;
      }
      if (!evalOp(operator, actual, expected)) failed.push({ path, op: operator, expected });
    }
  }
  return { matched: failed.length === 0 && !uncertain, failed, uncertain };
}

// ── The walk ──────────────────────────────────────────────────────────────────────────────────

/** One resolved value on a previewed step, and what is wrong with it (or is not). */
export interface SimulatedValue {
  label: string;
  text: string;
  /** It would arrive EMPTY. This is the fault the whole feature exists to surface. */
  blank: boolean;
  /** Withheld by the hub, or a secret. Covered, not empty — and never printed. */
  redacted?: boolean;
  /** The output of a step that has not run. Unknowable here, and not a fault. */
  unknown?: boolean;
}

export interface SimulatedStep {
  id: string;
  kind: string;
  outcome: 'would-run' | 'stops-here' | 'not-reached' | 'skipped';
  values: SimulatedValue[];
  /** For a guard: the clauses that did not hold, and whether the verdict is trustworthy. */
  condition?: ConditionResult;
  /**
   * An `approval` step (hub#950): the run PARKS here until a person answers. The preview decides
   * nothing on their behalf — every step after it is shown as it would be, and a guard on the
   * decision is uncertain, because all three outcomes are still possible.
   */
  pauses?: boolean;
  /**
   * The verdict on the step's own `run_if` (hub#2066), present whenever the step carries one and
   * the walk reached it — whether that verdict left the step `skipped`, or let it fall through to
   * its normal outcome.
   */
  runIf?: ConditionResult;
  /**
   * `true` only when `run_if` is UNCERTAIN: the step is shown with its normal outcome (it is not
   * skipped here), but the kernel could still skip it once it knows what this side cannot.
   */
  maySkip?: boolean;
}

export interface Simulation {
  triggerMatched: boolean;
  triggerCondition?: ConditionResult;
  steps: SimulatedStep[];
  /** The id of the guard that ended the walk, if one did. */
  stoppedAt?: string;
  /** How many mappings would arrive empty. */
  blanks: number;
  /**
   * Always `false`. A simulation cannot fail — and a guard that does not pass is the flow WORKING
   * (the kernel ends such a run as `done`). Calling that a failure would send the owner hunting a
   * bug that is not there, which is the mistake this whole module is written to avoid.
   */
  failed: boolean;
}

/** Every path an expression reads: a bare path, or each `{{…}}` inside a string. */
function pathsIn(expr: unknown, out: string[] = []): string[] {
  if (typeof expr === 'string') {
    if (isPath(expr)) {
      out.push(expr);
      return out;
    }
    let rest = expr;
    for (;;) {
      const start = rest.indexOf('{{');
      if (start < 0) break;
      const after = rest.slice(start + 2);
      const end = after.indexOf('}}');
      if (end < 0) break;
      out.push(after.slice(0, end).trim());
      rest = after.slice(end + 2);
    }
    return out;
  }
  if (Array.isArray(expr)) {
    for (const item of expr) pathsIn(item, out);
  } else if (typeof expr === 'object' && expr !== null) {
    for (const value of Object.values(expr as Record<string, unknown>)) pathsIn(value, out);
  }
  return out;
}

/** Every mapping a step carries, in the order the owner would read them. */
function stepValues(step: Step, scope: unknown): SimulatedValue[] {
  const out: SimulatedValue[] = [];
  const add = (label: string, expr: unknown): void => {
    const text = stringify(resolveExpr(expr, scope));
    // The verdict is per PATH, not on the finished string. `«Call {{input.customer_name}}»` renders
    // as «Call » — not empty, and yet the one mapping in it resolved to nothing. Judging the whole
    // string would miss exactly the fault this feature exists to surface, because a person writes
    // a sentence around the field far more often than they write the field alone.
    let blank = false;
    let redacted = false;
    let unknown = false;
    for (const path of pathsIn(expr)) {
      const value = lookup(path, scope);
      if (value === REDACTED) redacted = true;
      else if (value === UNKNOWN) unknown = true;
      else if (value === null || value === undefined) blank = true;
    }
    out.push({ label, text, blank, redacted, ...(unknown ? { unknown } : {}) });
  };

  // A `query` step (hub#954) is shown by what it would READ WITH; what comes back is only known
  // once it has run, and a later step reading `steps.<id>.found` says so (see `lookup`).
  if (step.kind === 'command' || step.kind === 'query') {
    for (const [key, value] of Object.entries(step.params ?? {})) add(key, value);
  } else if (step.kind === 'http') {
    add('url', step.url ?? '');
    for (const [key, value] of Object.entries(step.headers ?? {})) add(key, value);
    if (step.body !== undefined && step.body !== '') add('body', step.body);
  } else if (step.kind === 'ai') {
    add('prompt', step.prompt ?? '');
  } else if (step.kind === 'notify') {
    for (const [key, value] of Object.entries(step.vars ?? {})) add(key, value);
    // A step with options carries no `vars` at all — the copy lives in `interactive.body.text`
    // and the rest of what would be sent is in the options. Reading only `vars` showed that step
    // as a BLANK card, which is the one answer this tab must never give about a message that has
    // just been written.
    const taps = readTapOptions(step);
    if (taps) {
      add('text', taps.body);
      if (taps.kind === 'list') add('button', taps.openLabel);
      taps.options.forEach((opt, i) => {
        add(`${i + 1}`, opt.title);
        if (opt.description !== undefined && opt.description !== '') {
          add(`${i + 1}.`, opt.description);
        }
      });
    }
  } else if (step.kind === 'approval') {
    // The question as it would be ASKED: the kernel templates title and summary when it creates
    // the request, so this is exactly what the tray would show.
    add('title', step.title ?? '');
    if (typeof step.summary === 'string' && step.summary !== '') add('summary', step.summary);
  }
  return out;
}

/**
 * The walk: trigger filter, then the steps in order, stopping where the kernel would stop.
 *
 * Nothing here calls the hub. `input` is the payload {@link inputFromShape} reassembled; the scope
 * is `{input}` plus a `steps` that starts empty and gains only what a SKIPPED step writes
 * (`{skipped: true}`, mirroring the kernel) — no other step has run, so its output stays unknowable.
 */
export function simulate(doc: FlowDoc, input: Record<string, unknown>): Simulation {
  const stepsOut: Record<string, unknown> = {};
  const scope = { input, event: input, steps: stepsOut };
  const trigger: Trigger | undefined = doc.triggers?.[0];
  // No filter is not a failed filter: an absent one matches always (flow.schema.json §trigger).
  const triggerCondition =
    trigger?.kind === 'event' && trigger.filter ? conditionResult(trigger.filter, scope) : undefined;
  const triggerMatched = triggerCondition ? triggerCondition.matched : true;

  const steps: SimulatedStep[] = [];
  let stopped = !triggerMatched;
  let stoppedAt: string | undefined;

  for (const step of doc.steps ?? []) {
    if (stopped) {
      steps.push({ id: step.id, kind: step.kind, outcome: 'not-reached', values: [] });
      continue;
    }

    // `run_if` (hub#2066) is checked BEFORE the step runs, on every kind — a `condition` included.
    // One clause that surely fails skips the step outright — the guard is an AND, so an uncertain
    // clause beside it cannot rescue it. Nothing runs, the walk continues, and later steps can read
    // `steps.<id>.skipped`. Only a guard with no sure failure and some doubt is «may be skipped».
    let runIf: ConditionResult | undefined;
    if (step.run_if) {
      runIf = conditionResult(step.run_if, scope);
      if (runIf.failed.length > 0) {
        steps.push({ id: step.id, kind: step.kind, outcome: 'skipped', values: [], runIf });
        stepsOut[step.id] = { skipped: true };
        continue;
      }
    }

    if (step.kind === 'condition') {
      const condition = conditionResult(step.when, scope);
      // An UNCERTAIN guard does not stop the walk: the rest of the flow is still worth showing,
      // and the guard says on its own row that its answer could go either way.
      const passes = condition.matched || condition.uncertain;
      steps.push({
        id: step.id,
        kind: step.kind,
        outcome: passes ? 'would-run' : 'stops-here',
        values: [],
        condition,
        ...(runIf ? { runIf } : {}),
        ...(runIf?.uncertain ? { maySkip: true } : {}),
      });
      if (!passes) {
        stopped = true;
        stoppedAt = step.id;
      }
      continue;
    }
    steps.push({
      id: step.id,
      kind: step.kind,
      outcome: 'would-run',
      values: stepValues(step, scope),
      ...(step.kind === 'approval' ? { pauses: true } : {}),
      ...(runIf ? { runIf } : {}),
      ...(runIf?.uncertain ? { maySkip: true } : {}),
    });
  }

  return {
    triggerMatched,
    ...(triggerCondition ? { triggerCondition } : {}),
    steps,
    ...(stoppedAt ? { stoppedAt } : {}),
    blanks: steps.reduce((n, s) => n + s.values.filter((v) => v.blank).length, 0),
    failed: false,
  };
}
