/**
 * **What the assistant proposed, and everything that has to be true before a person accepts it.**
 *
 * The rule this file exists to keep is the one from flows#4, and it is a product decision, not an
 * implementation detail: *what the AI produces is born a DRAFT, never a running automation.* Here
 * that rule is structural rather than a policy somebody has to remember — the assistant writes a
 * row in this module's own `flows_flowdraft` table, and a draft **is not a flow**. The kernel has
 * never heard of it, no trigger points at it, and no grant names it. It becomes an automation the
 * moment a human presses a button in the editor, and even then it is created `enabled: false` with
 * no grants, exactly like a template (`templates.ts`, rule 3).
 *
 * That leaves this file with three jobs, in the order the screen needs them:
 *
 * 1. **Read** the row the command stored ({@link readDraft}). The definition travels as TEXT — the
 *    dispatcher binds a JSON object as a string (`crates/db/src/lib.rs`) — so it is parsed here,
 *    and a definition that is not JSON at all is a REFUSAL with something to read, never a blank
 *    screen.
 * 2. **Judge it against the contract** ({@link contractProblems}) — and against the contract THIS
 *    hub serves, not a remembered one. The vocabulary is read off `GET /api/hub/flows/schema`
 *    ({@link schemaFacts}), so a hub that froze a different set of step kinds or operators is
 *    obeyed instead of argued with. A draft that fails is refused whole: nothing half-written
 *    reaches `POST /api/hub/flows`.
 * 3. **Point at the holes** ({@link draftGaps}). This is the part the evidence demanded. Zapier
 *    documents its own Copilot as producing «a basic outline» and leaving instructions for what it
 *    could not do; field tests show the same failure shape — *the model gets the skeleton right and
 *    the parameters wrong*. So the parameters it could not resolve are highlighted, and the owner
 *    fixes them before anything is created.
 *
 * Nothing here is translated: it returns i18n KEYS with parameters, and the component resolves them
 * against the module catalogue (ADR-0055) — same discipline as `plain-language.ts`.
 */
import { OPERATORS, PATH_ROOTS, SCHEMA_VERSION, readDoc } from './flow-doc';
import { coreAtLeast } from './core-version';
import type { FlowDoc, Step, Trigger } from './flow-doc';

/** The name of the module table the assistant writes into. Used by the queries, not by the kernel. */
export const DRAFT_STATUS_PENDING = 'pending';

/**
 * The step kinds the assistant may put in a draft.
 *
 * **What a model may PROPOSE is deliberately narrower than what a person may BUILD.** Since
 * flows#3 this editor can finish an `http`, an `ai` and a `notify` step, so «the owner could not
 * edit it» is no longer the reason — the reason is what those three steps DO:
 *
 * - an `http` step calls a URL, and a URL a model invented is one nobody chose;
 * - a `notify` step costs money per message (Meta charges every WhatsApp) and needs a
 *   `recipient_query` grant naming exactly one field of one query;
 * - an `ai` step is another metered call, proposed by the thing proposing it.
 *
 * All three are the shape of thing ADR-0283 D3 makes manual by default, and a proposal is the
 * weakest kind of evidence there is. The owner adds them by hand, in the same spine, one screen
 * later. The tool's own JSON Schema — `schemas/draft_propose.json`, which is what the model is
 * handed as the function's parameters — declares the same three, so a proposal carrying anything
 * else is refused by the runtime before it is stored.
 */
export const DRAFT_STEP_KINDS = ['command', 'condition', 'delay'] as const;

/** One thing a person has to read. `params` are the i18n placeholders. */
export interface DraftProblem {
  key: string;
  params?: Record<string, unknown>;
}

/** A problem that belongs to a place on the spine: a step id, or `trigger`. */
export interface DraftGap extends DraftProblem {
  stepId: string;
}

/** The row `flows.drafts.list` returns. Everything is optional: it crossed a wire. */
export interface DraftRow {
  id?: unknown;
  name?: unknown;
  definition?: unknown;
  notes?: unknown;
  status?: unknown;
  created_at?: unknown;
  [k: string]: unknown;
}

export interface Draft {
  id: string;
  name: string;
  doc: FlowDoc;
  /** The assistant's own words about what it could not work out. Model output, not UI copy. */
  notes: string[];
  createdAt: string;
}

export type DraftRead = { ok: true; draft: Draft } | { ok: false; problem: DraftProblem };

/** `["a","b"]` however it survived the trip: a JSON array, a JSON string, or nothing usable. */
function readNotes(raw: unknown): string[] {
  const value = typeof raw === 'string' ? safeParse(raw) : raw;
  if (!Array.isArray(value)) return [];
  return value.filter((n): n is string => typeof n === 'string' && n.trim() !== '');
}

function safeParse(text: string): unknown {
  try {
    return JSON.parse(text);
  } catch {
    return undefined;
  }
}

/**
 * The stored row as the screen holds it, or the sentence that says why it cannot be shown.
 *
 * A model that answered in prose instead of calling the tool properly is a real outcome, and the
 * one thing that must not happen is an automations screen that renders nothing and explains
 * nothing — so an unparseable definition comes back as a refusal the owner can act on (dismiss it
 * and ask again), not as a thrown error inside a render.
 */
export function readDraft(row: DraftRow): DraftRead {
  const id = String(row?.id ?? '');
  const name = typeof row?.name === 'string' ? row.name : '';
  const raw = typeof row?.definition === 'string' ? safeParse(row.definition) : row?.definition;
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) {
    return { ok: false, problem: { key: 'draft.errUnreadable', params: { name } } };
  }
  return {
    ok: true,
    draft: {
      id,
      name,
      doc: readDoc(raw),
      notes: readNotes(row?.notes),
      createdAt: typeof row?.created_at === 'string' ? row.created_at : '',
    },
  };
}

// ── The contract, as THIS hub serves it ───────────────────────────────────────────────────────

/** The parts of `GET /api/hub/flows/schema` a draft is judged against. */
export interface SchemaFacts {
  schemaVersion: number;
  stepKinds: string[];
  triggerKinds: string[];
  operators: string[];
  toolsIsObject: boolean;
  /**
   * Whether this hub's `notify` can carry options the customer TAPS (hub#1633).
   *
   * One of the two facts in here with a **fail-closed** floor — see {@link schemaFacts}.
   */
  interactiveNotify: boolean;
  /**
   * Whether an `ai` step of this hub can DECLARE what it hands on besides its words (hub#1639).
   *
   * The other fail-closed fact, and it travels with the one above: both landed in `v1.1.16` and a
   * document that carries `output` on `v1.1.15` dies exactly the same way. Probed on its own all
   * the same — a card that needs both asks for both rather than trusting that a hub with one has
   * the other.
   */
  aiOutput: boolean;
  /**
   * Whether this hub turns `vars.header_<kind>` into the media header of a WhatsApp template
   * (hub#2101), read off the keys the served schema names under `vars.properties`.
   *
   * Fail-closed like {@link SchemaFacts.interactiveNotify}, for a softer but still real reason: on
   * an older core the key does not kill the document, it travels as a BODY variable — and Meta
   * refuses the send of a template whose header went missing, eight retries later.
   */
  headerMedia: boolean;
  /**
   * Whether this hub sends `vars.header_document_filename` as the name the customer sees on the
   * header PDF (hub#2405). Fail-closed like {@link SchemaFacts.headerMedia}, for the same reason.
   */
  documentName: boolean;
  /**
   * Whether this hub turns `vars.header_text` into the value of a template's text title (hub#2111).
   * Fail-closed like {@link SchemaFacts.headerMedia}, for the same reason.
   */
  headerText: boolean;
  /**
   * Whether this hub turns `vars.button_url_<n>` into the end of a template's link button
   * (hub#2110), read off the `patternProperties` the served schema names under `vars`.
   */
  buttonUrl: boolean;
  /**
   * Whether this hub can store a `query` grant that FIXES its parameters (hub#1662).
   *
   * The third fail-closed fact, and the only one in here that is **not** read off the schema —
   * because no schema can answer it. A pin lives in `_flow_grants`, never in the document, so
   * `GET /api/hub/flows/schema` carries no `grant`, no `pin` and no `payload` anywhere in it, and
   * its `schema_version` is `const 1` on `v1.1.15`, `v1.1.16` and `develop` alike. What is left is
   * the `core_version` the SAME response carries, against {@link QUERY_GRANT_PIN_CORE}.
   *
   * Being wrong about it costs more than the other two. Below the floor `check_grants` refuses the
   * pin and `PUT …/grants` is all-or-nothing, so the recipe does not install with the wide
   * permission — it installs with NONE and stops at its first step.
   */
  queryGrantPin: boolean;
}

/**
 * The release that first stores the limit a `query` grant carries — `GrantKind::can_pin(Query)`.
 *
 * Measured, not assumed: `crates/runtime/src/flows/grants.rs` has no `can_pin` at all in `v1.1.15`
 * or `v1.1.16`, and has it in `develop` — so the first release that can hold this pin is the next
 * one. `whatsapp_inbox` declares the same number as its own `compatibility.min_erplora_version`
 * for the same recipe (whatsapp_inbox#119), and the two must not drift.
 */
export const QUERY_GRANT_PIN_CORE = '1.1.17';

function at(root: unknown, path: string[]): unknown {
  let cur = root;
  for (const key of path) {
    if (!cur || typeof cur !== 'object') return undefined;
    cur = (cur as Record<string, unknown>)[key];
  }
  return cur;
}

function enumAt(root: unknown, path: string[]): string[] | undefined {
  const value = at(root, path);
  if (!Array.isArray(value)) return undefined;
  const names = value.filter((v): v is string => typeof v === 'string');
  return names.length ? names : undefined;
}

/**
 * What the hub said its contract is, with the mirrored constants as the floor.
 *
 * Reading the enums out of the served schema rather than hard-coding them is the whole point: the
 * kernel is frozen, but «frozen» is a promise about the hub the owner is standing in, and this
 * module updates on its own clock. A vendored copy of the vocabulary is a photo of whichever hub
 * the module was built against — wrong for somebody by construction (the same argument
 * `erp-flows-app` already makes when it ASKS for the schema instead of bundling it).
 *
 * The fallback is not a guess: it is `flow-doc.ts`, which mirrors `def.rs` and is what the rest of
 * the editor already applies while the owner types.
 *
 * `coreVersion` is the `core_version` of that same response, and it answers the one fact no schema
 * can ({@link SchemaFacts.queryGrantPin}). It is optional so that every existing
 * `schemaFacts(undefined)` stays what it was — a hub that has told us nothing — rather than
 * becoming a hub that is assumed to be current.
 */
export function schemaFacts(schema: unknown, coreVersion?: unknown): SchemaFacts {
  const operators =
    Object.keys(
      (at(schema, ['$defs', 'condition', 'additionalProperties', 'properties']) as
        | Record<string, unknown>
        | undefined) ?? {},
    );
  const version = at(schema, ['properties', 'schema_version', 'const']);
  return {
    schemaVersion: typeof version === 'number' ? version : SCHEMA_VERSION,
    stepKinds: enumAt(schema, ['$defs', 'step', 'properties', 'kind', 'enum']) ?? [
      'command',
      'condition',
      'delay',
      'http',
      'ai',
      'notify',
      'query',
      'approval',
    ],
    triggerKinds: enumAt(schema, ['$defs', 'trigger', 'properties', 'kind', 'enum']) ?? [
      'event',
      'cron',
      'at',
      'manual',
    ],
    operators: operators.length ? operators : [...OPERATORS],
    // `false` only when the hub explicitly says something else. A schema this module could not
    // read must not turn the hub#786 check off: absence of proof is not proof of an array.
    toolsIsObject: at(schema, ['$defs', 'step', 'properties', 'tools', 'type']) !== 'array',
    // The exception to this function's own rule, and it has to be: every other fact FALLS BACK to
    // the mirror because being wrong about it costs the owner a warning that does not apply. Being
    // wrong about this one costs them the flow. A step carrying `interactive` on a hub older than
    // hub#1633 is not ignored and does not degrade — the unknown key takes the WHOLE definition
    // down with it (`flow.invalid_definition`), and today's fleet has not shipped that core yet.
    // A schema this module could not read is therefore a hub that does not have it.
    interactiveNotify: !!at(schema, ['$defs', 'step', 'properties', 'interactive']),
    // Same rule, same reason, other key (hub#1639): `output` on an older core takes the whole
    // definition down with it too. Measured on the published schemas: `v1.1.15` declares neither
    // of the two and `v1.1.16` declares both.
    aiOutput: !!at(schema, ['$defs', 'step', 'properties', 'output']),
    // Same rule again (hub#2101). The three keys landed together; asking for the first one is
    // asking for the release that sends them.
    headerMedia: !!at(schema, ['$defs', 'step', 'properties', 'vars', 'properties', 'header_image']),
    // Same rule, one key per release: hub#2405 (the name of the header PDF)…
    documentName: !!at(schema, ['$defs', 'step', 'properties', 'vars', 'properties', 'header_document_filename']),
    // …hub#2111 (the title) and hub#2110 (the link button).
    headerText: !!at(schema, ['$defs', 'step', 'properties', 'vars', 'properties', 'header_text']),
    buttonUrl: !!at(schema, ['$defs', 'step', 'properties', 'vars', 'patternProperties', '^button_url_[0-9]$']),
    // Not `at(schema, …)` like every line above it, because there is nothing in the schema to
    // read: this one is answered by the version the same response carries, and by nothing else.
    // A caller that does not hand it over gets `false`, which is the same fail-closed default the
    // two facts above take when the schema could not be read.
    queryGrantPin: coreAtLeast(coreVersion, QUERY_GRANT_PIN_CORE),
  };
}

/** The field a trigger of each kind cannot be without. */
const TRIGGER_FIELD: Record<string, keyof Trigger> = {
  event: 'event',
  cron: 'cron',
  at: 'at',
};

/**
 * Everything that stops this proposal from being a document the hub would accept.
 *
 * An empty list is the only thing that lets the draft open in the editor. It is a whole refusal on
 * purpose: a document that is repaired down to «the parts we understood» is how an automation ends
 * up doing three quarters of what it says on screen.
 */
export function contractProblems(doc: FlowDoc, facts: SchemaFacts): DraftProblem[] {
  const out: DraftProblem[] = [];

  if (doc.schema_version !== facts.schemaVersion) {
    out.push({
      key: 'draft.errVersion',
      params: { got: doc.schema_version, want: facts.schemaVersion },
    });
  }

  for (const trigger of doc.triggers ?? []) {
    const kind = String(trigger?.kind ?? '');
    if (!facts.triggerKinds.includes(kind)) {
      out.push({ key: 'draft.errTriggerKind', params: { kind } });
      continue;
    }
    const field = TRIGGER_FIELD[kind];
    if (field && !String(trigger[field] ?? '').trim()) {
      out.push({ key: 'draft.errTriggerField', params: { kind, field } });
    }
  }

  const steps = Array.isArray(doc.steps) ? doc.steps : [];
  if (!steps.length) {
    out.push({ key: 'draft.errNoSteps' });
  }

  const seen = new Set<string>();
  for (const step of steps) {
    const id = String(step?.id ?? '').trim();
    if (!id) {
      out.push({ key: 'draft.errStepId' });
    } else if (seen.has(id)) {
      out.push({ key: 'draft.errDuplicateId', params: { id } });
    } else {
      seen.add(id);
    }

    const kind = String(step?.kind ?? '');
    if (!facts.stepKinds.includes(kind)) {
      out.push({ key: 'draft.errStepKind', params: { id, kind } });
      continue;
    }

    if (kind === 'condition') out.push(...operatorProblems(step, facts));
    // The trap of hub#786: an early copy of the contract described `tools` as an ARRAY, a shape
    // the kernel refuses (`flow.invalid_definition`) — and a model trained on documents written
    // that way keeps producing it. Caught here it is a sentence; missed, it is a save that fails
    // with the owner staring at their own automation.
    if (kind === 'ai' && facts.toolsIsObject && step.tools !== undefined && step.tools !== null) {
      if (Array.isArray(step.tools) || typeof step.tools !== 'object') {
        out.push({ key: 'draft.errToolsShape', params: { id } });
      }
    }
  }

  return out;
}

function operatorProblems(step: Step, facts: SchemaFacts): DraftProblem[] {
  const out: DraftProblem[] = [];
  for (const ops of Object.values(step.when ?? {})) {
    for (const op of Object.keys(ops ?? {})) {
      if (!facts.operators.includes(op)) {
        out.push({ key: 'draft.errOperator', params: { id: step.id, operator: op } });
      }
    }
  }
  return out;
}

// ── The holes ─────────────────────────────────────────────────────────────────────────────────

/** A value the owner still has to supply: nothing typed, or only whitespace. */
function isBlank(value: unknown): boolean {
  if (value === null || value === undefined) return true;
  if (typeof value === 'string') return value.trim() === '';
  if (Array.isArray(value)) return value.length === 0;
  return false;
}

/** A value that reads as a path but points nowhere the run can reach. */
function danglingRoot(value: unknown): boolean {
  if (typeof value !== 'string') return false;
  const root = value.split('.')[0];
  return (PATH_ROOTS as readonly string[]).includes(root) && value.length <= root.length + 1;
}

/**
 * What the owner has to resolve before this automation means anything.
 *
 * `known` is what `GET /api/hub/events/shape` answered per event name: `false` is the hub saying
 * «I have never heard of it», and anything else — `true`, or nothing yet — is NOT a refusal.
 * Treating «not asked yet» as «not there» would grey out the trigger for the first second of every
 * visit, which is the mistake `templates.missingModules` was written to avoid.
 */
export function draftGaps(doc: FlowDoc, known: Readonly<Record<string, boolean>>): DraftGap[] {
  const out: DraftGap[] = [];

  for (const trigger of doc.triggers ?? []) {
    if (trigger?.kind !== 'event') continue;
    const event = String(trigger.event ?? '').trim();
    if (!event) {
      out.push({ stepId: 'trigger', key: 'draft.gapEventMissing' });
    } else if (known[event] === false) {
      out.push({ stepId: 'trigger', key: 'draft.gapEventUnknown', params: { event } });
    }
  }

  for (const step of Array.isArray(doc.steps) ? doc.steps : []) {
    const stepId = String(step?.id ?? '');
    const kind = String(step?.kind ?? '');

    if (!(DRAFT_STEP_KINDS as readonly string[]).includes(kind)) {
      // Not a contract error — the kernel runs all six and the editor now edits all six. It is a
      // step the assistant was not supposed to propose, so it is flagged for a second look rather
      // than stripped: a document quietly missing a step is how a working automation gets deleted.
      out.push({ stepId, key: 'draft.gapNotEditable', params: { kind } });
      continue;
    }

    if (kind === 'command') {
      if (isBlank(step.command)) {
        out.push({ stepId, key: 'draft.gapCommandMissing' });
      }
      for (const [name, value] of Object.entries(step.params ?? {})) {
        if (isBlank(value) || danglingRoot(value)) {
          out.push({ stepId, key: 'draft.gapParamEmpty', params: { name } });
        }
      }
    }

    if (kind === 'condition') {
      const entries = Object.entries(step.when ?? {});
      if (!entries.length) out.push({ stepId, key: 'draft.gapGuardEmpty' });
      for (const [path, ops] of entries) {
        if (!path.trim()) {
          out.push({ stepId, key: 'draft.gapGuardField' });
          continue;
        }
        for (const [op, value] of Object.entries(ops ?? {})) {
          // `exists` compares against a boolean, so an empty string is not a hole there.
          if (op !== 'exists' && isBlank(value)) {
            out.push({ stepId, key: 'draft.gapGuardValue', params: { field: path } });
          }
        }
      }
    }
  }

  return out;
}
