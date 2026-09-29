import { LitElement, html, css, nothing } from 'lit';
import { property, state } from 'lit/decorators.js';
import { define } from '@erplora/outfitkit/define';
import '@erplora/outfitkit/ok-inline-feedback';
import '@erplora/outfitkit/ok-status-pill';
import '@erplora/outfitkit/ok-empty-state';
import '../erp-flows-value/erp-flows-value';
import '../erp-flows-field-picker/erp-flows-field-picker';
import type { ErpFlowsValue } from '../erp-flows-value/erp-flows-value';
import {
  MAX_BUTTONS,
  MAX_LIST_ROWS,
  TAP_KINDS,
  readTapOptions,
  setTapMode,
  setTapOptions,
  tapOptionProblems,
} from '../../lib/whatsapp-options';
import {
  TITLE_KEY,
  linkKey,
  loadWhatsappTemplates,
  withTemplateHeader,
  withTemplateSlots,
  withoutTemplateSlots,
} from '../../lib/whatsapp-templates';
import type { WhatsappTemplateChoice, WhatsappTemplatesState } from '../../lib/whatsapp-templates';
import type { TapKind, TapOptions } from '../../lib/whatsapp-options';
import {
  DEFAULT_APPROVAL_TTL_SECONDS,
  EXPIRY_POLICIES,
  HTTP_METHODS,
  MAX_APPROVAL_TTL_SECONDS,
  MAX_ITERS_CAP,
  MAX_QUERY_ROWS,
  MAX_TIMEOUT_SECONDS,
  NOTIFY_CHANNELS,
  OPERATORS,
  QUERY_RESULTS,
  REJECT_POLICIES,
  approvalOutputs,
  queryOutputs,
  addStep,
  emptyDoc,
  missingGrants,
  mergeGrants,
  canPinPayload,
  pinRows,
  readPinRows,
  pinProblems,
  setGrantPin,
  moveStep,
  partsToTemplate,
  partsToValue,
  patchStep,
  patchTrigger,
  removeStepKeys,
  readDoc,
  removeStep,
  httpPatternFor,
  grantsForStep,
  valueToParts,
  isSpineKind,
} from '../../lib/flow-doc';
import type {
  Condition,
  FlowDoc,
  Grant,
  ExpiryPolicy,
  Operator,
  QueryResult,
  Recipient,
  RejectPolicy,
  Step,
  StepKind,
  Trigger,
  ValuePart,
} from '../../lib/flow-doc';
import {
  describeDelay,
  describeStep,
  describeRunStep,
  describeTrigger,
  fieldPhrase,
  readCronTime,
  readSchedule,
  runOutcome,
  scheduleCron,
} from '../../lib/plain-language';
import type { RunRow, RunStepRow, Schedule, Translator } from '../../lib/plain-language';
import { catalogEntry } from '../../lib/trigger-catalog';
import { groupByFamily, loadEventCatalog, mergeContractFields } from '../../lib/event-catalog';
import type { EventCatalog } from '../../lib/event-catalog';
import { eventPhrase } from '../../lib/event-phrasing';
import { inputFromShape, simulate } from '../../lib/simulate';
import type { ConditionResult } from '../../lib/simulate';
import { classify, needsAttention } from '../../lib/run-trouble';
import { CAPABILITY_DENIED, errorCode } from '../../lib/hub-flows';
import type { EventShape, Flow, ModuleClient, SecretInfo } from '../../lib/hub-flows';
import type { DraftGap } from '../../lib/ai-draft';
import { ambiguousReplyGuards, questionSteps, sendsReplyToFlow } from '../../lib/question-steps';

/**
 * The editor's four panels, in the order they are drawn — and the order the arrow keys walk.
 *
 * One list rather than two (one for the strip, one for the `tab` union) so a fifth panel cannot
 * arrive with no key to reach it.
 */
const TABS = ['editor', 'test', 'permissions', 'history'] as const;

type Tab = (typeof TABS)[number];

/**
 * How long a step took, in whole seconds — or `undefined` when the kernel did not stamp both ends.
 *
 * A step still running, or one from a run that died mid-flight, has no finish. Showing «0s» there
 * would say it was instant, which is the one reading that is definitely wrong.
 */
function stepSeconds(step: RunStepRow): number | undefined {
  const from = Date.parse(String(step.started_at ?? ''));
  const to = Date.parse(String(step.finished_at ?? ''));
  if (!Number.isFinite(from) || !Number.isFinite(to) || to < from) return undefined;
  return Math.round((to - from) / 1000);
}

/** How a `when`/`filter` object is edited: a flat list of rows, rebuilt into the nested object. */
interface GuardRow {
  path: string;
  op: Operator;
  value: string;
}

function guardRows(when: Condition | undefined): GuardRow[] {
  const rows: GuardRow[] = [];
  for (const [path, ops] of Object.entries(when ?? {})) {
    for (const [op, value] of Object.entries(ops ?? {})) {
      rows.push({
        path,
        op: op as Operator,
        value: Array.isArray(value) ? value.join(', ') : String(value ?? ''),
      });
    }
  }
  return rows;
}

/**
 * A number the hub will accept, or the default when the box holds nothing usable.
 *
 * Clamping in the form rather than letting the save fail is deliberate: the kernel REFUSES a
 * `max_iters` of 50 and a `timeout` of 90 instead of trimming them, so without this the owner
 * meets an error code on a field whose real limit nothing on screen ever mentioned.
 */
/**
 * The roles every hub has (`crates/runtime/src/hub_users.rs::BASE_ROLES`), offered — not imposed —
 * for `approval.assignee`. Mirrored because the module SDK has no door to `GET /api/hub/roles`,
 * and a module may not fetch the hub's REST on its own; a role a module declares is still typed.
 */
const BASE_ROLES = ['admin', 'manager', 'employee'] as const;

/**
 * A grant as ONE string, for the DOM and for the maps that remember which limits are open.
 *
 * The same `"<kind> <value>"` shape {@link grantsForStep} speaks, and the same identity the hub
 * uses (`ux_flow_grant_live` is `(hub, flow, kind, value)`): the pin is NOT part of it, so a
 * command has at most one live grant and one sentence to read on this screen.
 */
const grantKey = (g: Grant): string => `${g.kind} ${g.value}`;

function clamp(value: number, min: number, max: number, fallback: number): number {
  if (!Number.isFinite(value)) return fallback;
  return Math.min(max, Math.max(min, Math.round(value)));
}

/**
 * **The media in a WhatsApp template's header** (hub#2101): the kinds the hub sends, each written as
 * ONE `vars` key the kernel turns into Meta's `header` parameter. A template has one header, so a
 * step carries at most one of these keys — the kernel refuses two at save time.
 */
const HEADER_KINDS = ['image', 'video', 'document'] as const;
type HeaderKind = (typeof HEADER_KINDS)[number];
const headerKey = (kind: HeaderKind): string => `header_${kind}`;

/** The header a step's `vars` carry today, or `null` when it has none. */
function readHeader(vars: Record<string, unknown>): { kind: HeaderKind; link: unknown } | null {
  const kind = HEADER_KINDS.find((k) => headerKey(k) in vars);
  return kind ? { kind, link: vars[headerKey(kind)] } : null;
}

/** `vars` without any media header key — what a step that cannot carry one must be saved with. */
function withoutHeader(vars: Record<string, unknown>): Record<string, unknown> {
  const next = { ...vars };
  for (const kind of HEADER_KINDS) delete next[headerKey(kind)];
  return next;
}

/**
 * Drops everything that only travels with a template — the header and the link-button ends
 * (hub#2110) — from a step whose vars carry any; any other step is returned untouched.
 */
function dropHeaderOf(doc: FlowDoc, index: number): FlowDoc {
  const vars = doc.steps[index]?.vars as Record<string, unknown> | undefined;
  if (!vars) return doc;
  const bare = withoutTemplateSlots(withoutHeader(vars));
  if (Object.keys(bare).length === Object.keys(vars).length) return doc;
  return patchStep(doc, index, { vars: bare });
}

/**
 * One `<option>`, carrying its own selected state.
 *
 * **Not cosmetic.** Lit applies `.value` to a `<select>` BEFORE the template's `<option>` children
 * exist, so the property is discarded and the control falls back to the first option. Found in a
 * real browser: a `POST` step opened showing `GET`, and a `whatsapp` step opened showing `email` —
 * and because the change handler writes what the box says, the next edit saved the wrong verb and
 * the wrong billed channel back into a working automation.
 *
 * `?selected` puts the truth on the child, where it survives the first paint. The `.value` binding
 * stays on the select as well: it is what keeps the control right on RE-render, once the children
 * do exist.
 */
function option(value: string, label: string, current: string) {
  return html`<option value=${value} ?selected=${value === current}>${label}</option>`;
}

/** What a brand-new `cron` trigger is, so the panel never shows a schedule the document lacks. */
const DEFAULT_SCHEDULE: Schedule = { every: 'day', time: '09:00' };

/**
 * Monday first, Sunday last — the week of a shop. The VALUES stay crontab's own numbering (Sunday
 * is 0), because that is what the kernel reads; only the order on screen is the human one.
 */
const WEEKDAY_ORDER = [1, 2, 3, 4, 5, 6, 0];

const MONTH_DAYS = Array.from({ length: 31 }, (_, i) => i + 1);

/**
 * The same schedule said a different way, keeping everything the new shape still has room for.
 *
 * Switching «every week» to «every day» drops the day and nothing else; switching back offers
 * Monday rather than an empty control — a dropdown whose value is «nothing» is a schedule that
 * cannot be saved, and the hour the owner already chose is never the part that gets lost.
 */
function retime(schedule: Schedule, every: Schedule['every']): Schedule {
  if (every === schedule.every) return schedule;
  if (every === 'day') return { every: 'day', time: schedule.time };
  if (every === 'week')
    return { every: 'week', time: schedule.time, weekday: schedule.every === 'week' ? schedule.weekday : 1 };
  return {
    every: 'month',
    time: schedule.time,
    monthday: schedule.every === 'month' ? schedule.monthday : 1,
  };
}

/**
 * An option of the trigger dropdown: the phrase the owner reads, the technical name on hover.
 *
 * The identifier is what travels in the document, in the run history and in any issue about it, so
 * it stays reachable — as `title` here, and in the «another event» box below the select, which
 * always shows the chosen one (flows#41).
 */
function eventOption(value: string, label: string, current: string) {
  // On one line on purpose: a line break inside `<option>` lands in its `textContent`.
  // prettier-ignore
  return html`<option value=${value} title=${value} ?selected=${value === current}>${label}</option>`;
}

/** The field the hub fills with the id of the WhatsApp step a reply answers (hub#1951). */
const REPLY_STEP_PATH = 'input.reply_to_step';
/** …and the one it fills with the id of the automation that step belongs to (hub#1962). */
const REPLY_FLOW_PATH = 'input.reply_to_flow';

/**
 * A question is a (automation, step) PAIR, so that is what an option's value carries (flows#124):
 * the same template installed twice gives both copies the same step id.
 */
function questionKey(flowId: string, stepId: string): string {
  return stepId === '' ? '' : JSON.stringify([flowId, stepId]);
}

function parseQuestionKey(key: string): { flowId: string; stepId: string } {
  if (key === '') return { flowId: '', stepId: '' };
  const [flowId, stepId] = JSON.parse(key) as [string, string];
  return { flowId, stepId };
}

function rowsToWhen(rows: GuardRow[]): Condition {
  const out: Condition = {};
  for (const row of rows) {
    if (!row.path) continue;
    const value =
      row.op === 'in'
        ? row.value.split(',').map((v) => v.trim()).filter(Boolean)
        : row.op === 'exists'
          ? row.value !== 'false'
          : partsToValue([{ kind: 'text', text: row.value }]);
    out[row.path] = { ...(out[row.path] ?? {}), [row.op]: value };
  }
  return out;
}

/**
 * **The editor: a vertical spine, not a node canvas.**
 *
 * `Cuando pase … → Paso → Paso`, one column, full-width cards. That is a decision with reasons,
 * and they are worth keeping next to the code that implements it:
 *
 * - **The engine is LINEAR.** A `condition` that does not pass ends the run as `done`; it does not
 *   take a second branch, because v1 has no second branch (`flows.md` §1). A diamond with two
 *   outgoing edges would let an owner draw semantics the kernel cannot execute — the editor would
 *   be lying, and the lie would only surface at 3 AM.
 * - **A canvas is broken on touch by construction.** Node-RED's issue #1, open since 2013, is
 *   «Mobile/Tablet support». ERPlora is a POS: the tablet is the first-class device. Reordering
 *   here is `ion-reorder-group` — Ionic's own gesture, built for a finger — and explicitly NOT the
 *   HTML5 drag API that `ok-kanban` uses and that does not fire on touch at all
 *   (ERPlora/outfitkit#55).
 * - **One column survives the reflow.** The assistant panel takes `33vw` at ≥768px. A column
 *   reflows; nodes at absolute (x, y) do not.
 *
 * All SIX kernel step kinds are editable here since flows#3 — `http`, `ai` and `notify` used to
 * open read-only, which meant the owner could see the step and not fix it. A kind from an editor
 * NEWER than this one still opens read-only and is saved back untouched: rendering a document
 * without a step and then writing it back is how a working automation gets silently deleted.
 */
export class ErpFlowsEditor extends LitElement {
  static styles = css`
    :host {
      display: flex;
      flex-direction: column;
      min-height: 0;
      height: 100%;
      color: var(--ok-text, var(--ion-text-color, #1c1b18));
      font-family: var(--ok-font, var(--ion-font-family, system-ui), sans-serif);
    }
    .head {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      flex-wrap: wrap;
      /* Both bars refuse to shrink. They are flex children of a full-height column whose body
         takes the rest, so without this the tab strip gets squeezed to 18px of its 44 the moment
         the header wraps to two lines — which is what a 390px screen does, and what adding the
         «Probar» button made happen sooner. */
      flex: 0 0 auto;
      padding: 0.6rem 0.75rem;
      border-bottom: 1px solid var(--ok-border-soft, rgba(0, 0, 0, 0.08));
    }
    .head .name {
      flex: 1 1 12rem;
      min-width: 8rem;
      font: inherit;
      font-size: 1.05rem;
      font-weight: 600;
      border: 0;
      border-bottom: 1px dashed transparent;
      background: transparent;
      color: inherit;
      padding: 0.35rem 0;
      /* A long name used to stop mid-letter on a phone, as if that were all of it (flows#142). */
      text-overflow: ellipsis;
    }
    .head .name:hover,
    .head .name:focus {
      border-bottom-color: var(--ok-border, #d7d5cc);
      outline: none;
    }
    .body {
      flex: 1 1 auto;
      min-height: 0;
      overflow-y: auto;
      padding: 0.75rem;
    }
    /* ── The spine ───────────────────────────────────────────────────────────────────────────
       One column. The max-width keeps a card readable on a 1440px screen; the column itself is
       fluid, which is what survives the assistant taking a third of the width. */
    .spine {
      max-width: 44rem;
      margin: 0 auto;
      display: flex;
      flex-direction: column;
    }
    .node {
      position: relative;
      padding-left: 1.6rem;
    }
    /* The connector, drawn as ok-timeline draws it: an absolute rule behind every node but the
       last, punched through by the dot. */
    .node::before {
      content: '';
      position: absolute;
      left: 0.42rem;
      top: 0;
      bottom: -0.1rem;
      width: 2px;
      background: var(--ok-border-soft, rgba(0, 0, 0, 0.12));
    }
    .node:last-child::before {
      bottom: auto;
      height: 1.1rem;
    }
    .node::after {
      content: '';
      position: absolute;
      left: 0;
      top: 0.85rem;
      width: 0.9rem;
      height: 0.9rem;
      border-radius: 50%;
      background: var(--ok-border, #d7d5cc);
      box-shadow: 0 0 0 3px var(--ok-bg, var(--ion-background-color, #fff));
    }
    .node.trigger::after {
      background: var(--ok-primary, var(--ion-color-primary, #3880ff));
    }
    .card {
      background: var(--ok-surface, var(--ion-card-background, #fff));
      border: 1px solid var(--ok-border, #d7d5cc);
      border-radius: var(--ok-radius, 14px);
      margin: 0.35rem 0;
      overflow: hidden;
    }
    .card > .row {
      display: flex;
      align-items: center;
      gap: 0.4rem;
      padding: 0.6rem 0.7rem;
      width: 100%;
      box-sizing: border-box;
    }
    .row .grow {
      flex: 1 1 auto;
      min-width: 0;
      text-align: left;
    }
    .eyebrow {
      display: block;
      font-size: 0.72rem;
      letter-spacing: 0.04em;
      text-transform: uppercase;
      color: var(--ok-muted, #6b6a63);
    }
    .title {
      display: block;
      font-weight: 600;
      overflow-wrap: anywhere;
    }
    .open,
    .icon-btn {
      border: 0;
      background: transparent;
      color: inherit;
      font: inherit;
      cursor: pointer;
      min-width: 2.6rem;
      min-height: 2.6rem;
      border-radius: var(--ok-radius-sm, 10px);
    }
    .icon-btn:hover {
      background: var(--ok-hover, rgba(0, 0, 0, 0.06));
    }
    .open {
      display: flex;
      align-items: center;
      gap: 0.4rem;
      flex: 1 1 auto;
      min-width: 0;
      text-align: left;
      padding: 0.6rem 0.7rem;
    }
    .panel {
      border-top: 1px solid var(--ok-border-soft, rgba(0, 0, 0, 0.08));
      padding: 0.7rem;
      display: flex;
      flex-direction: column;
      gap: 0.65rem;
      background: var(--ok-surface-muted, rgba(0, 0, 0, 0.02));
    }
    /* ── A guard is a chip that NARROWS the spine, not a card and never a diamond ─────────── */
    .guard {
      margin: 0.15rem 0;
    }
    .guard .chip {
      display: flex;
      align-items: center;
      gap: 0.4rem;
      width: calc(100% - 1.5rem);
      margin-left: 0.75rem;
      box-sizing: border-box;
      background: var(--ok-surface-2, rgba(0, 0, 0, 0.04));
      border: 1px dashed var(--ok-border, #d7d5cc);
      border-radius: var(--ok-radius-pill, 999px);
      padding: 0.35rem 0.5rem;
    }
    .guard .panel {
      border-radius: var(--ok-radius-sm, 10px);
      border: 1px solid var(--ok-border, #d7d5cc);
      margin-top: 0.35rem;
    }
    /* ── A wait is a label ON the line ────────────────────────────────────────────────────── */
    .segment .chip {
      display: flex;
      align-items: center;
      gap: 0.4rem;
      padding: 0.1rem 0;
      color: var(--ok-muted, #6b6a63);
      font-size: 0.85rem;
      font-style: italic;
    }
    .segment .panel {
      border-radius: var(--ok-radius-sm, 10px);
      border: 1px solid var(--ok-border, #d7d5cc);
      margin: 0.3rem 0;
    }
    .field {
      display: flex;
      flex-direction: column;
      gap: 0.2rem;
    }
    .field > label {
      font-size: 0.78rem;
      color: var(--ok-muted, #6b6a63);
    }
    .field input,
    .field select {
      font: inherit;
      padding: 0.55rem 0.6rem;
      border: 1px solid var(--ok-border, #d7d5cc);
      border-radius: var(--ok-radius-sm, 10px);
      background: var(--ok-surface, #fff);
      color: inherit;
      min-height: 2.6rem;
      box-sizing: border-box;
      width: 100%;
    }
    .hint {
      font-size: 0.78rem;
      color: var(--ok-muted, #6b6a63);
    }
    /* By the TOP (flows#121): a note under Value — the «one of» hint, a failed list with its
       «Try again» — grows that cell only; aligned by the end it dragged Field and Is down with it. */
    .guard-row {
      display: grid;
      grid-template-columns: 1fr;
      gap: 0.4rem;
      align-items: start;
      padding-bottom: 0.5rem;
      border-bottom: 1px solid var(--ok-border-soft, rgba(0, 0, 0, 0.06));
    }
    /* Stands in for a label above the remove button, so the × is level with the controls. */
    .label-spacer {
      display: none;
      font-size: 0.78rem;
    }
    @media (min-width: 560px) {
      .guard-row {
        grid-template-columns: 1.2fr 0.9fr 1.2fr auto;
      }
      .guard-row .label-spacer {
        display: block;
      }
    }
    .param-row {
      display: grid;
      grid-template-columns: 1fr;
      gap: 0.4rem;
      align-items: end;
    }
    @media (min-width: 560px) {
      .param-row {
        grid-template-columns: 0.7fr 1.6fr auto;
      }
    }
    /* One option the customer can tap: a card of its own, because it holds three composed
       boxes and a bin. It does NOT borrow .param-row — that grid is name, value, bin, and above
       560px it is three columns, so a two child row left the identifier in the narrow 0.7fr and
       gave the bin the wide one. Fluid on purpose: nothing here caps a width. */
    .tap-option {
      display: grid;
      gap: 0.4rem;
      padding: 0.6rem;
      border: 1px solid var(--ok-border, #d7d5cc);
      border-radius: var(--ok-radius-sm, 10px);
    }
    /* The identifier and the button that removes the option, on one line at every width:
       1fr auto needs no media query to be right on a phone, a tablet and a desktop. */
    .tap-head {
      display: grid;
      grid-template-columns: 1fr auto;
      gap: 0.4rem;
      align-items: end;
    }
    /* A composed value and, inside an http step, the secret picker beside it. The select is a
       sibling and not a child of erp-flows-value on purpose: a control inside another element's
       shadow root cannot be reached from here, and this one has to drive the box next to it. */
    .value-row {
      display: flex;
      align-items: flex-end;
      /* Wraps on a phone: without it the secret picker and the box's own «insert a field» button
         end up on the same line and overlap, which is what a 390px screen showed. */
      flex-wrap: wrap;
      gap: 0.4rem;
      min-width: 0;
    }
    .value-row erp-flows-value {
      /* A 12rem basis, not auto: with auto the box shrinks to its longest unbreakable word while
         the select keeps its own width, and the address ends up three characters wide next to a
         full-size dropdown. */
      flex: 1 1 12rem;
      min-width: 0;
    }
    .value-row select {
      font: inherit;
      font-size: 0.8rem;
      padding: 0 0.5rem;
      min-height: 2.4rem;
      max-width: 100%;
      border: 1px dashed var(--ok-border, #d7d5cc);
      border-radius: var(--ok-radius-pill, 999px);
      background: transparent;
      color: var(--ok-muted, #6b6a63);
    }
    /* The method sits BESIDE the address only when there is room for both. Below that it stacks —
       and it has to be a class, because an inline grid-template-columns would win over the media
       query at every width and crush the address on a phone. */
    .method-row {
      display: grid;
      grid-template-columns: 1fr;
      gap: 0.4rem;
      align-items: end;
    }
    @media (min-width: 560px) {
      .method-row {
        grid-template-columns: auto 1fr;
      }
    }
    /* ── The preview ──────────────────────────────────────────────────────────────────────── */
    .preview {
      max-width: 44rem;
      margin: 0 auto;
      display: flex;
      flex-direction: column;
      gap: 0.5rem;
    }
    .pstep {
      display: flex;
      flex-direction: column;
      gap: 0.25rem;
      border: 1px solid var(--ok-border, #d7d5cc);
      border-left: 3px solid var(--ok-border, #d7d5cc);
      border-radius: var(--ok-radius-sm, 10px);
      background: var(--ok-surface, #fff);
      padding: 0.6rem 0.7rem;
    }
    .pstep[data-outcome='would-run'] {
      border-left-color: var(--ok-success, #2dd36f);
    }
    /* A guard that stops the run is the flow WORKING, so it is not painted as an error. */
    .pstep[data-outcome='stops-here'],
    .pstep[data-outcome='trigger-blocked'] {
      border-left-color: var(--ok-warning, #ffc409);
    }
    .pstep[data-outcome='not-reached'],
    .pstep[data-outcome='skipped'] {
      opacity: 0.6;
    }
    .pvalue {
      display: flex;
      flex-wrap: wrap;
      gap: 0.4rem;
      font-size: 0.88rem;
      padding: 0.15rem 0;
    }
    .pkey {
      color: var(--ok-muted, #6b6a63);
      min-width: 6rem;
    }
    .pval {
      overflow-wrap: anywhere;
    }
    .pvalue[data-blank='true'] {
      background: var(--ok-danger-soft, rgba(235, 68, 90, 0.08));
      border-radius: var(--ok-radius-sm, 10px);
      padding: 0.15rem 0.35rem;
    }
    .bad {
      color: var(--ok-danger, var(--ion-color-danger, #eb445a));
      font-size: 0.85rem;
    }
    .verdict {
      font-size: 0.85rem;
    }
    .clauses {
      margin: 0.1rem 0 0;
      padding-left: 1rem;
      font-size: 0.85rem;
      color: var(--ok-muted, #6b6a63);
    }
    .secrets {
      display: flex;
      flex-direction: column;
      gap: 0.4rem;
      padding-top: 0.6rem;
      margin-top: 0.3rem;
      border-top: 1px solid var(--ok-border-soft, rgba(0, 0, 0, 0.08));
    }
    .adders {
      display: flex;
      flex-wrap: wrap;
      gap: 0.4rem;
      margin: 0.6rem 0 0 1.6rem;
    }
    .adders button {
      font: inherit;
      font-size: 0.85rem;
      cursor: pointer;
      background: var(--ok-surface, #fff);
      border: 1px solid var(--ok-border, #d7d5cc);
      border-radius: var(--ok-radius-pill, 999px);
      padding: 0 0.9rem;
      min-height: 2.5rem;
      color: inherit;
    }
    .tabs {
      display: flex;
      gap: 0.25rem;
      flex: 0 0 auto;
      padding: 0 0.75rem;
      border-bottom: 1px solid var(--ok-border-soft, rgba(0, 0, 0, 0.08));
      overflow-x: auto;
      /* When the strip does not fit, a shadow at the edge says it goes on — a tab cut by the
         border read as another word, «Historia» (flows#142). Scrolling shadows: the two covers
         ride with the content and the two shadows stay with the box, so a strip that fits, or
         one scrolled to an end, covers its own shadow with no script to fall out of step. The
         strip wears the card's colour itself, so the covers always match what is under them; the
         shadows are the text colour, so they read on a dark card too. */
      background-color: var(--ok-surface, var(--ion-card-background, #fff));
      background-image:
        linear-gradient(to right, var(--ok-surface, var(--ion-card-background, #fff)) 30%, transparent),
        linear-gradient(to left, var(--ok-surface, var(--ion-card-background, #fff)) 30%, transparent),
        radial-gradient(
          farthest-side at 0 50%,
          color-mix(in srgb, currentColor 22%, transparent),
          transparent
        ),
        radial-gradient(
          farthest-side at 100% 50%,
          color-mix(in srgb, currentColor 22%, transparent),
          transparent
        );
      background-position:
        0 0,
        100% 0,
        0 0,
        100% 0;
      background-repeat: no-repeat;
      background-size:
        2.5rem 100%,
        2.5rem 100%,
        0.9rem 100%,
        0.9rem 100%;
      background-attachment: local, local, scroll, scroll;
    }
    .tabs button {
      font: inherit;
      background: transparent;
      border: 0;
      border-bottom: 2px solid transparent;
      color: var(--ok-muted, #6b6a63);
      cursor: pointer;
      padding: 0.6rem 0.7rem;
      min-height: 2.75rem;
      white-space: nowrap;
    }
    .tabs button[aria-selected='true'] {
      color: var(--ok-text, inherit);
      border-bottom-color: var(--ok-primary, #3880ff);
      font-weight: 600;
    }
    /* The four tabs were 347px in a 328px strip at 360: this gives back the 25px «Historial» was
       missing, in both languages (flows#142). */
    @media (max-width: 559.98px) {
      .tabs button {
        padding: 0.6rem 0.5rem;
      }
    }
    .list {
      max-width: 44rem;
      margin: 0 auto;
      display: flex;
      flex-direction: column;
      gap: 0.5rem;
    }
    .grant {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      padding: 0.6rem 0.7rem;
      border: 1px solid var(--ok-border, #d7d5cc);
      border-radius: var(--ok-radius-sm, 10px);
      background: var(--ok-surface, #fff);
      flex-wrap: wrap;
    }
    .grant .grow {
      flex: 1 1 10rem;
      min-width: 0;
      overflow-wrap: anywhere;
    }
    /* «Limits» and «Remove» never shrink: when the row runs out of room they drop under the
       permission, to the right. As two loose items they shrank to their 2.6rem floor and the
       shell's inherited overflow-wrap split them into «Lím / ites» (flows#142). */
    .grant-actions {
      display: flex;
      gap: 0.25rem;
      flex: 0 0 auto;
      margin-left: auto;
    }
    .grant-actions button {
      white-space: nowrap;
    }
    /* One permission and its limits, as a single block: the fold has to read as belonging to the
       row above it and not as another permission of its own. */
    .grant-block {
      display: flex;
      flex-direction: column;
      gap: 0.4rem;
    }
    .grant .pinned {
      font-style: normal;
      color: var(--ok-text-muted, #6b675c);
      overflow-wrap: anywhere;
    }
    .limits {
      display: flex;
      flex-direction: column;
      gap: 0.5rem;
      /* Indented under its own permission on a desktop; flush on a phone, where 1.25rem of the
         390px it has left is a column of text that wraps every other word. */
      padding: 0 0 0.2rem 0;
      border-left: 2px solid var(--ok-border, #d7d5cc);
      margin-left: 0.4rem;
      padding-left: 0.6rem;
    }
    @media (min-width: 560px) {
      .limits {
        margin-left: 1.25rem;
      }
    }
    .run {
      border: 1px solid var(--ok-border, #d7d5cc);
      border-radius: var(--ok-radius-sm, 10px);
      background: var(--ok-surface, #fff);
      padding: 0.6rem 0.7rem;
    }
    /* What went wrong, and what to do — the two lines that matter, at full size. The kernel's own
       wording is folded away underneath: it is for support, not for the person reading this. */
    .trouble {
      margin-top: 0.4rem;
      display: flex;
      flex-direction: column;
      gap: 0.2rem;
      font-size: 0.9rem;
    }
    .trouble .why {
      font-weight: 600;
    }
    .trouble .do {
      color: var(--ok-muted, #6b6a63);
    }
    .trouble details {
      margin-top: 0.2rem;
    }
    .trouble summary {
      cursor: pointer;
      font-size: 0.82rem;
      color: var(--ok-muted, #6b6a63);
      min-height: 1.75rem;
    }
    .trouble code {
      display: block;
      margin-top: 0.25rem;
      font-size: 0.8rem;
      overflow-wrap: anywhere;
      color: var(--ok-muted, #6b6a63);
    }
    h4.section {
      margin: 0 0 0.15rem;
      font-size: 0.78rem;
      letter-spacing: 0.05em;
      text-transform: uppercase;
      font-weight: 600;
    }
    [data-attention] {
      display: flex;
      flex-direction: column;
      gap: 0.4rem;
      padding: 0.6rem;
      border: 1px solid var(--ok-danger, var(--ion-color-danger, #c0392b));
      border-radius: var(--ok-radius, 14px);
      margin-bottom: 0.5rem;
    }
    .run ul {
      margin: 0.5rem 0 0;
      padding-left: 1rem;
      font-size: 0.88rem;
      color: var(--ok-muted, #6b6a63);
    }
    .muted {
      color: var(--ok-muted, #6b6a63);
    }
    /* ── A proposal nobody has accepted yet (flows#4) ──────────────────────────────────────────
       The marker is on the NODE, so the sentence in the banner and the card it is about are the
       same thing on screen. A list of complaints with nothing to point at is how «check the
       parameters» becomes «which parameters». */
    [data-gap] > .card,
    [data-gap] > .chip {
      border-color: var(--ok-warning, var(--ion-color-warning, #c98a00));
      border-style: dashed;
    }
    .draft-notes {
      margin: 0.4rem 0 0;
      padding-left: 1.1rem;
    }
    .draft-notes li {
      margin: 0.15rem 0;
    }
  `;

  @property({ attribute: false }) client: ModuleClient | null = null;

  /** `null` means «a flow that does not exist yet»: saving CREATES instead of updating. */
  @property({ attribute: false }) flow: Flow | null = null;

  @property({ attribute: false }) t: Translator = (k) => k;

  /**
   * Set when this document came from the assistant and **nobody has accepted it yet** (flows#4).
   *
   * It changes nothing about how the editor works — the spine is the same spine, and that is the
   * point: a proposal is reviewed where automations are read, not in a special screen with its own
   * rules. What it adds is what the evidence says is missing without it. The AI gets the skeleton
   * right and the parameters wrong (Zapier documents its own Copilot as producing «a basic
   * outline»), so the parameters it could not resolve are named, next to the steps they belong to,
   * before anything is created.
   */
  @property({ attribute: false }) draft: { notes: string[]; gaps: DraftGap[] } | null = null;

  @state() document: FlowDoc = emptyDoc();

  @state() name = '';

  /**
   * The switch, and the one decision on this screen that acts on the business the moment it is
   * taken. A flow that does not exist yet starts **off** — the same promise the gallery makes two
   * taps earlier («pasa a ser tuya, apagada»), and the order this module is built around: look at
   * it, try it, grant it, and only then turn it on (flows#39).
   */
  @state() enabled = false;

  /** The owner has looked at what this flow would do (the «Probar» tab) during this visit. */
  @state() private tested = false;

  /** What the owner should know about the LAST time the switch was flipped on. Empty = nothing. */
  @state() private enableWarning = '';

  /**
   * Which tab is showing. A **property**, not internal state: a flow created from a template opens
   * on `permissions`, because until it holds a grant it does nothing at all and says nothing.
   */
  @property({ attribute: false }) tab: Tab = 'editor';

  /**
   * **Whether THIS hub can take options the customer taps** (flows#75), read off the schema the
   * hub served (`schemaFacts().interactiveNotify`) rather than assumed.
   *
   * Default `false`, and that is the whole guard. A step carrying `interactive` on a core older
   * than hub#1633 is not ignored and does not degrade: the unknown key is refused and takes the
   * WHOLE definition down with it, so the flow stops running. Hiding the control is therefore the
   * only honest thing to do where it is not supported — a disabled one would still let a template
   * or the assistant put the key there and leave the owner reading `flow.invalid_definition`.
   */
  @property({ attribute: false }) interactiveNotify = false;

  /**
   * **Whether THIS hub sends a template's media header** (hub#2101), read off the schema the hub
   * served (`schemaFacts().headerMedia`). Default `false` for the same reason as
   * {@link interactiveNotify}: on an older core the key would travel as a body variable and Meta
   * would refuse the send, so the control is not offered at all.
   */
  @property({ attribute: false }) headerMedia = false;

  /**
   * **Whether THIS hub sends the value of a template's text title** (hub#2111) and **the end of its
   * link buttons** (hub#2110), read off the schema the hub served. Default `false` for the same
   * reason as {@link headerMedia}.
   */
  @property({ attribute: false }) headerText = false;
  @property({ attribute: false }) buttonUrl = false;

  @state() private openStep: string | null = null;

  @state() private grants: Grant[] = [];
  /**
   * hub#1623 — which granted actions have their «limits» open, and what the owner has typed there
   * but not saved yet, keyed by `"<kind> <value>"`.
   *
   * The draft is separate from {@link grants} on purpose: changing a limit is, in the hub, a
   * revocation and a fresh grant, so what is on screen before the save is a PROPOSAL. Painting it
   * as if it were live would show a containment that is not containing anything yet.
   */
  @state() private limitsOpen: string[] = [];
  @state() private pinDrafts: Record<string, [string, string][]> = {};
  @state() private savingLimits = '';

  @state() private runs: RunRow[] = [];

  @state() private runSteps: Record<string, RunStepRow[]> = {};

  @state() private shape: EventShape | null = null;

  /**
   * Which events THIS hub can fire (flows#8). Asked once, the first time the trigger panel opens.
   *
   * Every non-`ready` branch is drawn on screen instead of being papered over with the module's own
   * hand-written list: see `event-catalog.ts` for why that fall back would be the bug again.
   */
  @state() private eventCatalog: EventCatalog = { status: 'loading' };

  /** One round trip per editor, not one per re-render of a panel that toggles open and shut. */
  private catalogAsked = false;

  /**
   * The hub's automations, read only to offer «the step that asked the question» by what it says
   * (flows#118). Asked once, the first time a check on that field is open: most flows have none.
   */
  @state() private hubFlows: { status: 'idle' | 'loading' | 'ready' | 'error'; flows: Flow[] } = {
    status: 'idle',
    flows: [],
  };

  /** The secret NAMES this hub holds. Never a value: no endpoint returns one (ADR-0283 §4). */
  /**
   * The WhatsApp templates the business keeps in `whatsapp_inbox` (flows#132), asked the first time
   * a WhatsApp step is opened — a property of the HUB, like the event catalogue, not of the step.
   */
  @state() private waTemplates: WhatsappTemplatesState = { status: 'idle', templates: [] };

  @state() private secrets: SecretInfo[] = [];

  @state() private secretName = '';

  /**
   * The value being typed for a NEW secret, and the only place one ever lives in this component.
   * It is wiped the instant the hub has it — a credential still sitting in a box on a counter
   * tablet is the same leak as one printed on the wall.
   */
  @state() private secretValue = '';

  @state() private error = '';

  @state() private notice = '';

  @state() saving = false;

  @state() private pickerOpen = false;

  private pickerFor: ErpFlowsValue | null = null;

  /**
   * **What each step's message looked like before it was switched to plain text** (flows#95).
   *
   * Not state that paints anything, and not part of the document either: the hub refuses a step
   * carrying the copy AND the options, and its parser refuses a step key it does not know, so
   * there is nowhere in the flow to park it. It lives here for as long as the owner has this
   * editor open — which is exactly as long as «me lo pienso y lo devuelvo» lasts. Cleared with the
   * flow, because `n` is the id every one-step automation gets and a memory that outlived the flow
   * would hand one automation's message to the next.
   */
  private tapMemory = new Map<string, Record<string, unknown>>();

  /** Keeps this step's message before an edit that has to take it off the document. */
  private rememberTaps(step: Step): void {
    const had = step.interactive;
    if (had && typeof had === 'object' && !Array.isArray(had)) {
      this.tapMemory.set(step.id, had as Record<string, unknown>);
    }
  }

  /** `event` inside the trigger's own filter, `input` everywhere downstream. */
  @state() private pickerRoot: 'input' | 'event' = 'input';

  willUpdate(changed: Map<string, unknown>): void {
    if (changed.has('flow')) {
      this.document = this.flow ? readDoc(this.flow.definition) : emptyDoc();
      this.tapMemory.clear();
      this.name = this.flow?.name ?? '';
      // `?? false` is the whole of flows#39: a flow that does not exist yet is born OFF, and the
      // switch is the owner's explicit yes rather than a state the new automation inherited.
      this.enabled = this.flow?.enabled ?? false;
      this.error = '';
      this.notice = '';
      this.enableWarning = '';
      this.tested = false;
      this.runs = [];
      this.grants = [];
      void this.loadGrants();
      void this.loadShape();
    }
  }

  /**
   * The arrow keys along the tab strip (WAI-ARIA's tabs pattern).
   *
   * The strip is ONE stop for the tab key — the selected tab holds `tabindex="0"` and the rest
   * `-1` — so without this the other three panels are simply unreachable from a keyboard. Which is
   * the same defect as a dead button, arriving through a different door: the history is five key
   * presses away, or none at all.
   *
   * It wraps, because the pattern's own answer to «what is to the left of the first one» is «the
   * last one», and a strip that stops dead at both ends teaches people to reach for the mouse.
   */
  private onTabKey(e: KeyboardEvent): void {
    const step: Record<string, number> = { ArrowRight: 1, ArrowLeft: -1 };
    let next: Tab | undefined;
    if (e.key in step) {
      const at = TABS.indexOf(this.tab);
      next = TABS[(at + step[e.key] + TABS.length) % TABS.length];
    } else if (e.key === 'Home') next = TABS[0];
    else if (e.key === 'End') next = TABS[TABS.length - 1];
    if (!next) return;
    e.preventDefault();
    this.tab = next;
    // Selection follows focus, so focus has to follow selection back — otherwise the next arrow
    // press is delivered to a tab that is no longer the one on screen.
    void this.updateComplete.then(() => {
      (this.renderRoot.querySelector(`#tab-${this.tab}`) as HTMLElement | null)?.focus();
    });
  }

  updated(changed: Map<string, unknown>): void {
    if (changed.has('tab') && this.tab === 'history') void this.loadRuns();
    // Opening «Probar» is the closest thing to a test this module can offer (it simulates; the
    // kernel has no dry run), so it is what clears the «you have not looked at it yet» half of
    // the switch's warning.
    if (changed.has('tab') && this.tab === 'test') this.tested = true;
    if (changed.has('tab')) this.revealActiveTab();
    if (this.openStep === 'trigger') void this.ensureEventCatalog();
    if (this.openGuardComparesReplyStep()) void this.ensureHubFlows();
    if (this.openStepSendsWhatsapp()) void this.ensureWaTemplates();
    this.pinEventSelect();
  }

  /**
   * Bring the chosen tab whole into the strip (flows#142). Where the strip scrolls sideways — a
   * narrow phone, a larger font — a tab chosen half under the edge reads as another word.
   * Horizontal only, by hand: `scrollIntoView` would also scroll the page around the editor.
   */
  private revealActiveTab(): void {
    const strip = this.renderRoot.querySelector('.tabs') as HTMLElement | null;
    const active = strip?.querySelector('[aria-selected="true"]') as HTMLElement | null;
    if (!strip || !active) return;
    const box = strip.getBoundingClientRect();
    const tab = active.getBoundingClientRect();
    if (tab.left < box.left) strip.scrollLeft -= box.left - tab.left;
    else if (tab.right > box.right) strip.scrollLeft += tab.right - box.right;
  }

  /**
   * Put the saved event back into the trigger `<select>` once its `<option>` children exist.
   *
   * The `?selected` attribute of `option()` fixes the FIRST paint, and it is not enough here: this
   * dropdown's options arrive from the network a round trip later, and Lit **dirty-checks `.value`**
   * — the binding was already committed with this same string while the list was empty, so on the
   * re-render that finally adds the options Lit skips it, the browser keeps the selectedness it
   * computed from an empty list, and the control sits on the first option. Then the change handler
   * writes back what the box says.
   *
   * That is the v0.1.6 bug with a wider window, and it is why this is done in `updated()` — after
   * the children are in the DOM — instead of trusting the binding. Only when they actually differ,
   * so it can never fight a person mid-choice.
   */
  private pinEventSelect(): void {
    const select = this.renderRoot.querySelector(
      'select[data-field="trigger-event"]',
    ) as HTMLSelectElement | null;
    if (!select) return;
    const chosen = this.trigger.kind === 'event' ? (this.trigger.event ?? '') : '';
    if (select.value !== chosen) select.value = chosen;
  }

  // ── Loading ─────────────────────────────────────────────────────────────────────────────────

  private get trigger(): Trigger {
    return this.document.triggers[0] ?? { kind: 'manual' };
  }

  private async loadGrants(): Promise<void> {
    if (!this.flow?.id || !this.client) return;
    try {
      const grants = await this.client.flows.grants(this.flow.id);
      this.grants = Array.isArray(grants) ? grants : [];
    } catch {
      // A flow whose grants cannot be read is still editable; the permissions tab says so on its
      // own by showing everything as «waiting for your permission».
      this.grants = [];
    }
  }

  /**
   * The events this hub can fire, asked when the trigger panel first opens and not on mount.
   *
   * Not on mount because most of this screen is steps, and this is a third admin-only round trip
   * on the first paint. Not per open because the answer is a property of the HUB, not of the panel.
   */
  private async ensureEventCatalog(): Promise<void> {
    if (this.catalogAsked) return;
    this.catalogAsked = true;
    this.eventCatalog = await loadEventCatalog(this.client);
  }

  private openGuardComparesReplyStep(): boolean {
    const step = this.document.steps.find((s) => s.id === this.openStep);
    return step?.kind === 'condition' && REPLY_STEP_PATH in (step.when ?? {});
  }

  private openStepSendsWhatsapp(): boolean {
    const step = this.document.steps.find((s) => s.id === this.openStep);
    return step?.kind === 'notify' && step.channel === 'whatsapp';
  }

  private async ensureWaTemplates(): Promise<void> {
    if (this.waTemplates.status !== 'idle' || !this.client) return;
    this.waTemplates = { status: 'loading', templates: [] };
    this.waTemplates = await loadWhatsappTemplates(this.client);
  }

  /** The template a WhatsApp step names, when the list the hub served has it. */
  private knownTemplate(step: Step): WhatsappTemplateChoice | undefined {
    if (this.waTemplates.status !== 'ready') return undefined;
    const name = String(step.template ?? '').trim();
    return this.waTemplates.templates.find((t) => t.name === name);
  }

  private async ensureHubFlows(): Promise<void> {
    if (this.hubFlows.status !== 'idle' || !this.client) return;
    this.hubFlows = { status: 'loading', flows: [] };
    try {
      const flows = await this.client.flows.list();
      this.hubFlows = { status: 'ready', flows: Array.isArray(flows) ? flows : [] };
    } catch {
      this.hubFlows = { status: 'error', flows: [] };
    }
  }

  private async loadShape(): Promise<void> {
    const event = this.trigger.kind === 'event' ? this.trigger.event : '';
    if (!event || !this.client) {
      this.shape = null;
      return;
    }
    try {
      // The contract's own fields go in beside the observed ones (flows#75): the shape endpoint
      // answers with traffic this hub has SEEN, and `reply_id` is not in any sample until somebody
      // taps — which is the automation being built right now.
      this.shape = mergeContractFields(await this.client.events.shape(event), this.interactiveNotify);
    } catch {
      // `not_found` means this hub has never heard of the event. The picker then says «nothing to
      // pick from», which is true, instead of the editor refusing to open.
      this.shape = null;
    }
  }

  /**
   * The secret names, asked for when an `http` panel opens and not before.
   *
   * Not on mount: most flows have no `http` step at all, and this is one more admin-only round
   * trip on the first paint of a screen that already makes two.
   */
  private async loadSecrets(): Promise<void> {
    if (!this.client?.flows.secrets) return;
    try {
      const list = await this.client.flows.secrets();
      this.secrets = Array.isArray(list) ? list : [];
    } catch {
      // A hub that will not list them is not a reason to refuse to edit the step: the owner can
      // still write the header, and the name they type is checked where it is used.
      this.secrets = [];
    }
  }

  private async saveSecret(): Promise<void> {
    const name = this.secretName.trim();
    const value = this.secretValue;
    if (!name || !value || !this.client?.flows.putSecret) return;
    this.error = '';
    try {
      await this.client.flows.putSecret(name, value);
      // Wiped BEFORE the reload, so no re-render can put it back on screen.
      this.secretValue = '';
      this.secretName = '';
      await this.loadSecrets();
      this.notice = this.t('ui.secretSaved', { name });
    } catch (e) {
      this.secretValue = '';
      this.error = (e as Error)?.message || this.t('ui.errGeneric');
    }
  }

  private async deleteSecret(name: string): Promise<void> {
    if (!this.client?.flows.deleteSecret) return;
    try {
      await this.client.flows.deleteSecret(name);
      await this.loadSecrets();
    } catch (e) {
      this.error = (e as Error)?.message || this.t('ui.errGeneric');
    }
  }

  private async loadRuns(): Promise<void> {
    if (!this.flow?.id || !this.client) return;
    try {
      // Both shapes, and that is not defensiveness for its own sake: the runtime answers the
      // envelope `{ok, data, next_cursor}` and the SDK's transport ends in `unwrap(env)`, so what
      // arrives here TODAY is the bare array — even though the method is typed `RunPage`. Reading
      // only `page.data` made every history on every hub say «todavía no se ha ejecutado», which
      // reads exactly like a flow that never fired (found on a real hub, 2026-08-14). Accepting
      // both means the day the SDK stops unwrapping, the history does not empty itself again.
      const page = (await this.client.flows.runs(this.flow.id, { limit: 20 })) as
        | RunRow[]
        | { data?: RunRow[] }
        | null;
      this.runs = Array.isArray(page) ? page : ((page?.data ?? []) as RunRow[]);
    } catch (e) {
      this.error = (e as Error)?.message ?? this.t('ui.errGeneric');
    }
  }

  // ── Saving ──────────────────────────────────────────────────────────────────────────────────

  /** Public so the app shell (and the tests) can drive it without reaching into the template. */
  async save(): Promise<void> {
    if (!this.client) return;
    this.saving = true;
    this.error = '';
    this.notice = '';
    const body = {
      name: this.name.trim() || this.t('ui.unnamed'),
      enabled: this.enabled,
      definition: this.document as unknown as Record<string, unknown>,
    };
    try {
      const saved = this.flow?.id
        ? await this.client.flows.update(this.flow.id, body)
        : await this.client.flows.create(body);
      this.flow = saved;
      this.notice = this.t('ui.grantsSaved');
      this.dispatchEvent(
        new CustomEvent('flows-saved', { detail: { flow: saved }, bubbles: true, composed: true }),
      );
    } catch (e) {
      // The hub's refusals are specific on purpose (`flow.invalid_cron` says WHICH field is out of
      // range). Replacing that with «error» would throw away the only actionable thing on screen.
      this.error = (e as Error)?.message || this.t('ui.errGeneric');
    } finally {
      this.saving = false;
    }
  }

  /** Grants everything the document needs, keeping every grant this editor did not put there. */
  async grantAll(): Promise<void> {
    if (!this.client || !this.flow?.id) return;
    const missing = missingGrants(this.document, this.grants);
    if (!missing.length) return;
    this.error = '';
    try {
      const next = await this.client.flows.replaceGrants(
        this.flow.id,
        mergeGrants(this.grants, missing, []),
      );
      this.grants = Array.isArray(next) ? next : [];
      this.notice = this.t('ui.grantsSaved');
    } catch (e) {
      this.error = errorCode(e).includes('not_found')
        ? this.t('ui.grantCommandNotFound', { command: missing.map((g) => g.value).join(', ') })
        : (e as Error)?.message || this.t('ui.errGeneric');
    }
  }

  private async revoke(grant: Grant): Promise<void> {
    if (!this.client || !this.flow?.id) return;
    try {
      const next = await this.client.flows.replaceGrants(
        this.flow.id,
        mergeGrants(this.grants, [], [grant]),
      );
      this.grants = Array.isArray(next) ? next : [];
    } catch (e) {
      this.error = (e as Error)?.message || this.t('ui.errGeneric');
    }
  }

  /**
   * **Writes the limits of ONE granted action** (hub#1623, flows#66).
   *
   * `PUT …/grants` is a complete replace, so this sends every grant this flow holds and not just
   * the one that changed — {@link setGrantPin} is what keeps the other pins on their way through.
   * What comes back is what the hub really stored, and that is what the screen shows from then on:
   * changing a limit is a revocation plus a fresh grant on the other side, so the row the owner
   * was looking at does not survive it and nothing here may pretend it did.
   */
  private async saveLimits(grant: Grant): Promise<void> {
    if (!this.client || !this.flow?.id) return;
    const k = grantKey(grant);
    this.error = '';
    this.notice = '';
    const pin = readPinRows(this.limitRows(grant));
    // What `check_pin_value` refuses, this screen refuses BEFORE sending (flows#108, hub#1662).
    // `PUT …/grants` is all-or-nothing, so one bad box does not fail its own row: it bounces the
    // whole list with a kernel sentence written for a log. Caught here it names the row instead,
    // in the owner's language, and the draft stays put so they can correct that box.
    const [bad] = pinProblems(pin);
    if (bad) {
      const [field, problem] = bad;
      this.error = this.t(
        problem === 'pin_template' ? 'ui.grantLimitBadTemplate' : 'ui.grantLimitBadRoot',
        { field },
      );
      return;
    }
    this.savingLimits = k;
    try {
      const next = await this.client.flows.replaceGrants(
        this.flow.id,
        setGrantPin(this.grants, grant, pin),
      );
      this.grants = Array.isArray(next) ? next : [];
      // The draft goes. Keeping it would leave the boxes showing what was TYPED over a list that
      // now says what was STORED, and a refusal further down would be invisible between the two.
      const rest = { ...this.pinDrafts };
      delete rest[k];
      this.pinDrafts = rest;
      this.notice = this.t('ui.grantsSaved');
    } catch (e) {
      // The hub's refusals name the field (`flow.invalid_grant_payload`). Replacing that with
      // «error» would leave a screen that looks saved and a permission that is still wide open.
      this.error = (e as Error)?.message || this.t('ui.errGeneric');
    } finally {
      this.savingLimits = '';
    }
  }

  /** The rows the owner is editing, or the stored limit, or one empty pair to start from. */
  private limitRows(grant: Grant): [string, string][] {
    const draft = this.pinDrafts[grantKey(grant)];
    if (draft) return draft;
    const stored = pinRows(grant);
    return stored.length ? stored : [['', '']];
  }

  private setLimitRows(grant: Grant, rows: [string, string][]): void {
    this.pinDrafts = { ...this.pinDrafts, [grantKey(grant)]: rows };
  }

  private toggleLimits(grant: Grant): void {
    const k = grantKey(grant);
    this.limitsOpen = this.limitsOpen.includes(k)
      ? this.limitsOpen.filter((x) => x !== k)
      : [...this.limitsOpen, k];
  }

  // ── Editing ─────────────────────────────────────────────────────────────────────────────────

  private setDoc(doc: FlowDoc): void {
    this.document = doc;
  }

  private onReorder(e: CustomEvent<{ from: number; to: number; complete: (d?: unknown) => void }>): void {
    const { from, to, complete } = e.detail;
    this.setDoc(moveStep(this.document, from, to));
    // Not optional: without `complete()` Ionic keeps the list in its dragged DOM state and fights
    // the next render.
    complete();
  }

  private add(kind: StepKind): void {
    const next = addStep(this.document, kind);
    this.setDoc(next);
    this.openStep = next.steps[next.steps.length - 1].id;
  }

  private setTrigger(patch: Partial<Trigger>): void {
    const next = { ...this.trigger, ...patch } as Trigger;
    // Picking «on a schedule» has to LEAVE a schedule. Without this the panel showed 09:00 while
    // the document held no `cron` at all, and saving got `flow.invalid_cron` back from a screen
    // that looked filled in (flows#77).
    if (next.kind === 'cron' && !(next.cron ?? '').trim()) next.cron = scheduleCron(DEFAULT_SCHEDULE);
    this.setDoc(patchTrigger(this.document, next));
    void this.loadShape();
  }

  /**
   * The switch is an explicit yes, and it deserves to be an INFORMED one (flows#39).
   *
   * Nothing is blocked: the owner can flip a flow on with holes in it if that is what they want.
   * What the switch does is say, in the same breath, the two things that make «on» not mean
   * «working»: permissions it asks for and does not hold, and the fact that nobody has looked at
   * what it would do yet. A flow with no grants does nothing at all — silently — which is the one
   * outcome this screen must not let read as success.
   */
  private onEnable(on: boolean): void {
    this.enabled = on;
    if (!on) {
      this.enableWarning = '';
      return;
    }
    const missing = missingGrants(this.document, this.grants);
    const warnings: string[] = [];
    if (missing.length)
      warnings.push(
        this.t('ui.enableNoGrants', { commands: missing.map((g) => g.value).join(', ') }),
      );
    if (!this.tested) warnings.push(this.t('ui.enableUntested'));
    this.enableWarning = warnings.join(' ');
  }

  private openPicker(target: ErpFlowsValue, root: 'input' | 'event'): void {
    this.pickerFor = target;
    this.pickerRoot = root;
    this.pickerOpen = true;
  }

  private onFieldPicked(e: CustomEvent<{ path: string }>): void {
    this.pickerFor?.appendField(e.detail.path);
    this.pickerOpen = false;
    this.pickerFor = null;
  }

  /** The words a pill shows: `input.customer.name` → «Customer › Name». */
  private readonly fieldLabel = (path: string): string =>
    fieldPhrase(path.replace(/^(input|event|steps)\./, ''), this.t);

  /** What the owner reads for an event: the hand-written phrase, or the composed one (flows#41). */
  private eventLabel(event: string | undefined): string {
    return event ? eventPhrase(event, this.t) : '';
  }

  // ── Rendering ───────────────────────────────────────────────────────────────────────────────

  /** `true` when the assistant left something unresolved on this node (`trigger`, or a step id). */
  private hasGap(id: string): boolean {
    return !!this.draft?.gaps.some((g) => g.stepId === id);
  }

  /**
   * The banner over a proposal: what it IS, what the assistant could not decide, and what to check.
   *
   * The first sentence is the load-bearing one — «it is off, it has no permissions, nothing happens
   * until you turn it on». An owner reading a screen full of their own business's words needs to
   * know, before anything else, whether it is already doing something.
   */
  private renderDraftBanner() {
    const draft = this.draft;
    if (!draft) return nothing;
    return html`<div class="list" style="margin-bottom:.75rem">
      <ok-inline-feedback
        tone="warning"
        icon="sparkles-outline"
        data-draft-banner
        data-testid="flows-editor-draft-unconfirmed"
      >
        ${this.t('draft.unconfirmed')}
      </ok-inline-feedback>
      ${draft.gaps.length
        ? html`<div>
            <span class="eyebrow">${this.t('draft.gapsTitle')}</span>
            <ul class="draft-notes">
              ${draft.gaps.map((g) => html`<li>${this.t(g.key, g.params)}</li>`)}
            </ul>
          </div>`
        : nothing}
      ${draft.notes.length
        ? html`<div>
            <span class="eyebrow">${this.t('draft.notesTitle')}</span>
            <ul class="draft-notes">
              ${draft.notes.map((n) => html`<li>${n}</li>`)}
            </ul>
          </div>`
        : nothing}
    </div>`;
  }

  private renderTriggerNode() {
    const trigger = this.trigger;
    const open = this.openStep === 'trigger';
    return html`<div class="node trigger" data-node="trigger" ?data-gap=${this.hasGap('trigger')}>
      <div class="card">
        <div class="row" style="padding:0">
          <button
            type="button"
            class="open"
            aria-expanded=${open ? 'true' : 'false'}
            data-testid="flows-editor-trigger-open"
            @click=${() => {
              this.openStep = open ? null : 'trigger';
            }}
          >
            <span class="grow">
              <span class="eyebrow">${this.t('ui.whenThisHappens')}</span>
              <!-- One sentence, one author: describeTrigger is what the card in the list and
                   the gallery already read, so «every Friday at 18:00» cannot say one thing here
                   and another there (flows#77). -->
              <span class="title"
                >${describeTrigger(trigger, this.t, this.eventLabel(trigger.event))}</span
              >
            </span>
          </button>
        </div>
        ${open ? html`<div class="panel">${this.renderTriggerPanel(trigger)}</div>` : nothing}
      </div>
    </div>`;
  }

  private renderTriggerPanel(trigger: Trigger) {
    return html`
      <div class="field">
        <label for="trigger-kind">${this.t('ui.whenThisHappens')}</label>
        <select
          id="trigger-kind"
          data-field="trigger-kind"
          data-testid="flows-editor-trigger-kind"
          .value=${trigger.kind}
          @change=${(e: Event) =>
            this.setTrigger({ kind: (e.target as HTMLSelectElement).value as Trigger['kind'] })}
        >
          ${option('event', this.t('ui.triggerKindEvent'), trigger.kind)}
          ${option('cron', this.t('ui.triggerKindCron'), trigger.kind)}
          ${option('at', this.t('ui.triggerKindAt'), trigger.kind)}
          ${option('manual', this.t('ui.triggerKindManual'), trigger.kind)}
        </select>
      </div>
      ${trigger.kind === 'event' ? this.renderEventChoice(trigger) : nothing}
      ${trigger.kind === 'cron' ? this.renderCronPanel(trigger) : nothing}
      ${trigger.kind === 'at'
        ? html`<div class="field">
            <label for="trigger-at">${this.t('ui.atLabel')}</label>
            <input
              id="trigger-at"
              type="datetime-local"
              data-testid="flows-editor-trigger-at"
              @change=${(e: Event) => {
                const raw = (e.target as HTMLInputElement).value;
                // The kernel wants RFC-3339 WITH an offset; `datetime-local` has none, so the
                // browser's own offset is attached here rather than guessed server-side.
                this.setTrigger({ at: raw ? new Date(raw).toISOString() : '' });
              }}
            />
          </div>`
        : nothing}
    `;
  }

  /**
   * **The schedule of a `cron` trigger** (flows#77).
   *
   * There used to be one control here for every schedule there is — a time box — and it did two
   * wrong things to «every Friday at 18:00»: it drew itself EMPTY, because it could only read
   * `M H * * *`, and on the first keystroke it wrote `M H * * *` back. The owner meant to move
   * the hour and silently moved how often the automation runs, with nothing to undo it.
   *
   * So the panel now says the whole schedule — how often, which day, what time — which is the
   * shape every scheduler an owner has already used offers (Zapier, Make, Power Automate, Odoo's
   * scheduled actions). Three shapes, and no more: daily, weekly, monthly.
   *
   * 🔴 And the important half is what it does with the FOURTH shape. `0 9 * * MON-FRI` and a step
   * expression are schedules the kernel runs perfectly well and these controls cannot say. Those
   * get **no editing control at all** — the expression is shown as it is and kept as it is. There
   * is nothing on screen to touch that could flatten it, which is the actual fix: refusing to
   * READ one (which the old code already did) is worthless while the WRITE side still overwrites
   * it. Replacing one is a button that says it replaces it.
   */
  private renderCronPanel(trigger: Trigger) {
    const raw = (trigger.cron ?? '').trim();
    // A trigger just switched to `cron` has no expression yet, and an empty box is not a schedule:
    // `setTrigger` seeds it, so what the controls show is what the document holds.
    const schedule = raw ? readSchedule(raw) : DEFAULT_SCHEDULE;
    if (!schedule) return this.renderKeptCron(raw);
    const write = (next: Schedule): void => this.setTrigger({ cron: scheduleCron(next) });
    return html`
      <div class="field">
        <label for="trigger-every">${this.t('ui.cronEvery')}</label>
        <select
          id="trigger-every"
          data-field="cron-every"
          data-testid="flows-editor-cron-every"
          .value=${schedule.every}
          @change=${(e: Event) =>
            write(retime(schedule, (e.target as HTMLSelectElement).value as Schedule['every']))}
        >
          ${option('day', this.t('ui.cronEveryDay'), schedule.every)}
          ${option('week', this.t('ui.cronEveryWeek'), schedule.every)}
          ${option('month', this.t('ui.cronEveryMonth'), schedule.every)}
        </select>
      </div>
      ${schedule.every === 'week'
        ? html`<div class="field">
            <label for="trigger-weekday">${this.t('ui.cronWeekday')}</label>
            <select
              id="trigger-weekday"
              data-field="cron-weekday"
              data-testid="flows-editor-cron-weekday"
              .value=${String(schedule.weekday)}
              @change=${(e: Event) =>
                write({ ...schedule, weekday: Number((e.target as HTMLSelectElement).value) })}
            >
              <!-- Monday first: the week of a shop starts on Monday in every locale this ships
                   in, even though crontab numbers Sunday 0. The VALUE stays crontab's. -->
              ${WEEKDAY_ORDER.map((d) =>
                option(String(d), this.t(`ui.weekday${d}`), String(schedule.weekday)),
              )}
            </select>
          </div>`
        : nothing}
      ${schedule.every === 'month'
        ? html`<div class="field">
            <label for="trigger-monthday">${this.t('ui.cronMonthday')}</label>
            <select
              id="trigger-monthday"
              data-field="cron-monthday"
              data-testid="flows-editor-cron-monthday"
              .value=${String(schedule.monthday)}
              @change=${(e: Event) =>
                write({ ...schedule, monthday: Number((e.target as HTMLSelectElement).value) })}
            >
              ${MONTH_DAYS.map((d) =>
                option(String(d), String(d), String(schedule.monthday)),
              )}
            </select>
            <span class="hint">${this.t('ui.cronMonthdayHint')}</span>
          </div>`
        : nothing}
      <div class="field">
        <label for="trigger-time">${this.t('ui.timeLabel')}</label>
        <input
          id="trigger-time"
          data-field="trigger-time"
          data-testid="flows-editor-cron-time"
          type="time"
          .value=${schedule.time}
          @change=${(e: Event) =>
            write({ ...schedule, time: (e.target as HTMLInputElement).value || schedule.time })}
        />
        <span class="hint">${this.t('ui.cronLabel')}: ${scheduleCron(schedule)}</span>
      </div>
    `;
  }

  /** A schedule this screen cannot draw: shown, kept, and replaced only on purpose (flows#77). */
  private renderKeptCron(cron: string) {
    return html`
      <div class="field">
        <label>${this.t('ui.cronLabel')}</label>
        <code class="kept-cron" data-field="cron-raw">${cron}</code>
        <ok-inline-feedback
          tone="warning"
          icon="information-circle-outline"
          data-testid="flows-editor-cron-kept"
          >${this.t('ui.cronKept')}</ok-inline-feedback
        >
        <div class="adders" style="margin-left:0">
          <button
            type="button"
            data-act="cron-simplify"
            data-testid="flows-editor-cron-simplify"
            @click=${() =>
              this.setTrigger({
                cron: scheduleCron({ every: 'day', time: readCronTime(cron) ?? '09:00' }),
              })}
          >
            ${this.t('ui.cronSimplify')}
          </button>
        </div>
      </div>
    `;
  }

  /**
   * Why the dropdown is not the dropdown — said on screen, never papered over.
   *
   * Each of these is a different thing for the owner to do: wait, update the hub, grant a
   * permission, install a module, or type the name in the box below. Rendering the module's own
   * hand-written list here instead would be flows#8 again in disguise.
   */
  private renderCatalogState() {
    const catalog = this.eventCatalog;
    if (catalog.status === 'ready') return nothing;
    if (catalog.status === 'loading') {
      return html`<span class="hint" data-catalog="loading">${this.t('ui.eventCatalogLoading')}</span>`;
    }
    const message =
      catalog.status === 'unsupported'
        ? this.t('ui.eventCatalogUnsupported')
        : catalog.status === 'empty'
          ? this.t('ui.eventCatalogEmpty')
          : catalog.code === CAPABILITY_DENIED
            ? this.t('ui.eventCatalogDenied')
            : this.t('ui.eventCatalogFailed', { code: catalog.code });
    return html`<ok-inline-feedback
      tone="warning"
      icon="alert-circle-outline"
      data-catalog=${catalog.status}
      data-testid="flows-editor-event-catalog-issue"
      >${message}</ok-inline-feedback
    >`;
  }

  private renderEventChoice(trigger: Trigger) {
    const chosen = trigger.event ?? '';
    const catalog = this.eventCatalog;
    const options = catalog.status === 'ready' ? catalog.options : [];
    const listed = options.some((o) => o.event === chosen);
    return html`
      <div class="field">
        <label for="trigger-event">${this.t('ui.eventPick')}</label>
        <select
          id="trigger-event"
          data-field="trigger-event"
          data-testid="flows-editor-trigger-event"
          .value=${chosen}
          @change=${(e: Event) => this.setTrigger({ event: (e.target as HTMLSelectElement).value })}
        >
          <option value="">—</option>
          <!--
            Grouped by the module the event comes from (flows#41): a hub with everything installed
            offers 196 of these, and «Cocina → llega un pedido a cocina» is how Zapier, Power
            Automate and Odoo all let somebody find one. The order inside each group is still the
            hub's.
          -->
          ${groupByFamily(options, this.t).map(
            (group) => html`<optgroup label=${group.family}>
              ${group.options.map((entry) =>
                eventOption(entry.event, this.eventLabel(entry.event), chosen),
              )}
            </optgroup>`,
          )}
          <!--
            The saved event, kept on offer even when the catalogue has not arrived, or arrived
            without it (the module that emitted it was uninstalled). Dropping it would leave the
            control on «—» and the next change handler would save that emptiness over a working
            trigger — the exact shape of the bug fixed in v0.1.6, only now with a network round trip
            widening the window.
          -->
          ${chosen && !listed ? eventOption(chosen, this.eventLabel(chosen), chosen) : nothing}
        </select>
        ${this.renderCatalogState()}
        <span class="hint">
          ${!chosen
            ? this.t('ui.eventOtherHint')
            : this.shape
              ? this.shape.samples === 0
                ? this.t('ui.eventNoSamples')
                : this.t('ui.eventSamples', { count: this.shape.samples })
              : this.t('ui.eventNotInHub', {
                  module: catalogEntry(chosen)?.module ?? '—',
                })}
        </span>
      </div>
      <div class="field">
        <label for="trigger-event-other">${this.t('ui.eventOther')}</label>
        <input
          id="trigger-event-other"
          type="text"
          data-testid="flows-editor-trigger-event-other"
          .value=${chosen}
          @change=${(e: Event) => this.setTrigger({ event: (e.target as HTMLInputElement).value.trim() })}
        />
      </div>
    `;
  }

  private renderStepNode(step: Step, index: number) {
    const open = this.openStep === step.id;
    const removeBtn = html`<button
      type="button"
      class="icon-btn"
      data-act="remove"
      data-testid=${`flows-editor-step-remove-${step.id}`}
      aria-label=${this.t('ui.removeStep')}
      @click=${() => this.setDoc(removeStep(this.document, index))}
    >
      ×
    </button>`;
    const handle = html`<ion-reorder aria-label=${this.t('ui.reorderHint')}>⠿</ion-reorder>`;

    if (step.kind === 'delay') {
      return html`<div class="node segment" data-node=${step.id} ?data-gap=${this.hasGap(step.id)}>
        <div class="chip">
          ${handle}
          <button
            type="button"
            class="open"
            style="padding:.2rem .3rem"
            aria-expanded=${open ? 'true' : 'false'}
            data-testid=${`flows-editor-step-open-${step.id}`}
            @click=${() => {
              this.openStep = open ? null : step.id;
            }}
          >
            <span class="grow">${describeDelay(Number(step.seconds ?? 0), this.t)}</span>
          </button>
          ${removeBtn}
        </div>
        ${open ? html`<div class="panel">${this.renderDelayPanel(step, index)}</div>` : nothing}
      </div>`;
    }

    if (step.kind === 'condition') {
      return html`<div class="node guard" data-node=${step.id} ?data-gap=${this.hasGap(step.id)}>
        <div class="chip">
          ${handle}
          <button
            type="button"
            class="open"
            style="padding:.2rem .3rem"
            aria-expanded=${open ? 'true' : 'false'}
            data-testid=${`flows-editor-step-open-${step.id}`}
            @click=${() => {
              this.openStep = open ? null : step.id;
            }}
          >
            <span class="grow"
              ><strong>${this.t('ui.guardTitle')}</strong>
              ${describeStep(step, this.t)}</span
            >
          </button>
          ${removeBtn}
        </div>
        ${open ? html`<div class="panel">${this.renderGuardPanel(step, index)}</div>` : nothing}
      </div>`;
    }

    return html`<div class="node" data-node=${step.id} ?data-gap=${this.hasGap(step.id)}>
      <div class="card">
        <div class="row" style="padding:0">
          ${handle}
          <button
            type="button"
            class="open"
            aria-expanded=${open ? 'true' : 'false'}
            data-testid=${`flows-editor-step-open-${step.id}`}
            @click=${() => {
              this.openStep = open ? null : step.id;
              // The secret list is only ever needed here, and only once a panel is actually open.
              if (this.openStep === step.id && step.kind === 'http') void this.loadSecrets();
            }}
          >
            <!-- No eyebrow here on purpose: «…haz esto» is what the SPINE says once, and repeating
                 it above every card turns the one line that carries meaning into wallpaper. -->
            <span class="grow">
              <span class="title">${describeStep(step, this.t)}</span>
            </span>
          </button>
          ${removeBtn}
        </div>
        ${open ? html`<div class="panel">${this.renderStepPanel(step, index)}</div>` : nothing}
      </div>
    </div>`;
  }

  /** The right form for this kind — or the honest sentence for a kind from a newer editor. */
  private renderStepPanel(step: Step, index: number) {
    if (!isSpineKind(step.kind)) return html`<span class="hint">${this.t('ui.readOnlyStep')}</span>`;
    if (step.kind === 'http') return this.renderHttpPanel(step, index);
    if (step.kind === 'ai') return this.renderAiPanel(step, index);
    if (step.kind === 'notify') return this.renderNotifyPanel(step, index);
    if (step.kind === 'query') return this.renderQueryPanel(step, index);
    if (step.kind === 'approval') return this.renderApprovalPanel(step, index);
    return this.renderCommandPanel(step, index);
  }

  /**
   * One composed value, wired to the shared field picker — and, inside an `http` step, to the
   * secrets this hub holds.
   *
   * `template` forces `{{…}}` even for a lone field: `url` is a string in the schema, so the
   * type-preserving rule that is right everywhere else is wrong there.
   */
  private renderValue(
    opts:
      | {
          field: string;
          label: string;
          value: unknown;
          // `template: true` is what makes the written value a STRING, so the callback is handed
          // one — the schema field behind these boxes (`url`, `prompt`) is `string`, and typing
          // the callback `unknown` was how `{ url }` stopped fitting `Partial<Step>` (flows#107).
          template: true;
          secrets?: boolean;
          onChange: (value: string) => void;
        }
      | {
          field: string;
          label: string;
          value: unknown;
          // Without it the value keeps its own type — a number stays a number — so the callback
          // gets `unknown` and the caller has to say what it accepts.
          template?: false;
          secrets?: boolean;
          onChange: (value: unknown) => void;
        },
  ) {
    const write = (parts: ValuePart[]): void => {
      if (opts.template) opts.onChange(partsToTemplate(parts));
      else opts.onChange(partsToValue(parts));
    };
    return html`<div class="value-row">
      <erp-flows-value
        data-field=${opts.field}
        data-testid=${`flows-editor-value-${opts.field}`}
        .label=${opts.label}
        .parts=${valueToParts(opts.value)}
        .fieldLabel=${this.fieldLabel}
        .insertLabel=${this.t('ui.insertField')}
        .removeLabel=${this.t('ui.removePart')}
        .canPickFields=${!!this.shape}
        @flows-value-change=${(e: CustomEvent<{ parts: ValuePart[] }>) => write(e.detail.parts)}
        @flows-pick-field=${(e: Event) => this.openPicker(e.target as ErpFlowsValue, 'input')}
      ></erp-flows-value>
      <!-- The secret picker lives in THIS shadow root, next to the box, and only inside an http
           step: a secret path anywhere else is refused at save, so offering it elsewhere would
           teach a syntax that makes the document unsavable. -->
      ${opts.secrets && this.secrets.length
        ? html`<select
            data-act="insert-secret"
            data-testid=${`flows-editor-insert-secret-${opts.field}`}
            aria-label=${this.t('ui.insertSecret')}
            .value=${''}
            @change=${(e: Event) => {
              const select = e.target as HTMLSelectElement;
              const name = select.value;
              select.value = '';
              if (!name) return;
              const box = (e.currentTarget as HTMLElement)
                .closest('.value-row')
                ?.querySelector('erp-flows-value') as ErpFlowsValue | null;
              box?.appendField(`secret.${name}`);
            }}
          >
            <option value="">${this.t('ui.insertSecret')}</option>
            ${this.secrets.map((s) => html`<option value=${s.name}>${s.name}</option>`)}
          </select>`
        : nothing}
    </div>`;
  }

  /**
   * **The `http` step**: where an automation leaves the building.
   *
   * Everything on this panel is a thing the hub checks and refuses: the method set is closed, the
   * timeout is capped, the URL is matched against a grant PATTERN after templating, and a secret is
   * only legal here. Clamping in the form rather than letting the save fail is the difference
   * between «30 is the most it will wait» and a red box with an error code in it.
   */
  private renderHttpPanel(step: Step, index: number) {
    const headers = Object.entries((step.headers ?? {}) as Record<string, unknown>);
    const setHeaders = (entries: [string, unknown][]): void =>
      this.setDoc(patchStep(this.document, index, { headers: Object.fromEntries(entries) }));
    const pattern = httpPatternFor(String(step.url ?? ''));
    return html`
      <div class="method-row">
        <div class="field">
          <label for="m-${step.id}">${this.t('ui.httpMethod')}</label>
          <select
            id="m-${step.id}"
            data-field="method"
            data-testid="flows-editor-http-method"
            .value=${String(step.method ?? 'GET')}
            @change=${(e: Event) =>
              this.setDoc(
                patchStep(this.document, index, { method: (e.target as HTMLSelectElement).value }),
              )}
          >
            ${HTTP_METHODS.map((m) => option(m, m, String(step.method ?? 'GET')))}
          </select>
        </div>
        ${this.renderValue({
          field: 'url',
          label: this.t('ui.httpUrl'),
          value: step.url ?? '',
          template: true,
          secrets: true,
          onChange: (url) => this.setDoc(patchStep(this.document, index, { url })),
        })}
      </div>
      <!-- The grant this step will need, spelled the way the hub compares it. Showing it HERE and
           not only on the Permissions tab is what connects «I typed an address» to «and this is
           what I am about to allow». -->
      <span class="hint"
        >${pattern
          ? this.t('ui.httpGrantHint', { pattern })
          : this.t('ui.httpGrantUnknown')}</span
      >

      <span class="eyebrow">${this.t('ui.httpHeaders')}</span>
      <span class="hint">${this.t('ui.httpHeadersHint')}</span>
      ${headers.map(
        ([key, value], i) => html`<div class="param-row">
          <div class="field">
            <label>${this.t('ui.paramName')}</label>
            <input
              type="text"
              data-testid="flows-editor-header-name"
              .value=${key}
              @change=${(e: Event) =>
                setHeaders(
                  headers.map((h, j) =>
                    j === i ? [(e.target as HTMLInputElement).value.trim(), h[1]] : h,
                  ),
                )}
            />
          </div>
          ${this.renderValue({
            field: `header-${i}`,
            label: this.t('ui.paramValue'),
            value,
            secrets: true,
            onChange: (v) => setHeaders(headers.map((h, j) => (j === i ? [h[0], v] : h))),
          })}
          <button
            type="button"
            class="icon-btn"
            data-testid="flows-editor-header-remove"
            aria-label=${this.t('ui.removePart', { label: key })}
            @click=${() => setHeaders(headers.filter((_, j) => j !== i))}
          >
            ×
          </button>
        </div>`,
      )}
      <div class="adders" style="margin-left:0">
        <button
          type="button"
          data-act="add-header"
          data-testid="flows-editor-http-add-header"
          @click=${() => setHeaders([...headers, ['', '']])}
        >
          ${this.t('ui.httpAddHeader')}
        </button>
      </div>

      ${this.renderValue({
        field: 'body',
        label: this.t('ui.httpBody'),
        value: step.body ?? '',
        secrets: true,
        onChange: (body) => this.setDoc(patchStep(this.document, index, { body })),
      })}

      <div class="field">
        <label for="t-${step.id}">${this.t('ui.httpTimeout')}</label>
        <input
          id="t-${step.id}"
          data-field="timeout"
          data-testid="flows-editor-http-timeout"
          type="number"
          min="1"
          max=${MAX_TIMEOUT_SECONDS}
          .value=${String(step.timeout ?? 10)}
          @change=${(e: Event) =>
            this.setDoc(
              patchStep(this.document, index, {
                // Clamped here rather than refused at save: the hub caps this at 30 and the run
                // holds its lease the whole time, so this number is also what an error costs.
                timeout: clamp(Number((e.target as HTMLInputElement).value), 1, MAX_TIMEOUT_SECONDS, 10),
              }),
            )}
        />
        <span class="hint">${this.t('ui.httpTimeoutHint', { max: MAX_TIMEOUT_SECONDS })}</span>
      </div>

      ${this.renderSecrets()}
    `;
  }

  /**
   * **The secrets this hub holds** — names in, names out, and no way back.
   *
   * There is no endpoint that returns a value and there is no «reveal» button here, because there
   * would be nothing behind it. The screen says so rather than leaving the owner wondering where
   * the key they typed went.
   */
  private renderSecrets() {
    if (!this.client?.flows.secrets) return nothing;
    return html`<div class="secrets">
      <span class="eyebrow">${this.t('ui.secretsTitle')}</span>
      <span class="hint">${this.t('ui.secretsIntro')}</span>
      ${this.secrets.map(
        (s) => html`<div class="grant">
          <span class="grow">${s.name}</span>
          <button
            type="button"
            class="icon-btn"
            data-act="delete-secret"
            data-testid=${`flows-editor-secret-remove-${s.name}`}
            aria-label=${this.t('ui.secretDelete', { name: s.name })}
            @click=${() => void this.deleteSecret(s.name)}
          >
            ×
          </button>
        </div>`,
      )}
      <div class="param-row">
        <div class="field">
          <label for="sn-${this.flow?.id ?? 'new'}">${this.t('ui.secretName')}</label>
          <input
            id="sn-${this.flow?.id ?? 'new'}"
            data-field="secret-name"
            data-testid="flows-editor-secret-name"
            type="text"
            .value=${this.secretName}
            placeholder="STRIPE_KEY"
            @input=${(e: Event) => {
              this.secretName = (e.target as HTMLInputElement).value;
            }}
          />
        </div>
        <div class="field">
          <label for="sv-${this.flow?.id ?? 'new'}">${this.t('ui.secretValue')}</label>
          <input
            id="sv-${this.flow?.id ?? 'new'}"
            data-field="secret-value"
            data-testid="flows-editor-secret-value"
            type="password"
            autocomplete="off"
            .value=${this.secretValue}
            @input=${(e: Event) => {
              this.secretValue = (e.target as HTMLInputElement).value;
            }}
          />
        </div>
        <button
          type="button"
          class="icon-btn"
          data-act="save-secret"
          data-testid="flows-editor-secret-save"
          @click=${() => void this.saveSecret()}
        >
          ${this.t('ui.save')}
        </button>
      </div>
    </div>`;
  }

  /**
   * **The `ai` step.** One question decides everything on this panel: does a person see the write
   * before it happens? `manual` is the kernel's default and it is written out loud here, because
   * the permissive option is the one nobody types and everybody assumes.
   */
  private renderAiPanel(step: Step, index: number) {
    const tools = step.tools ?? {};
    const queries = tools.queries ?? [];
    const commands = tools.commands ?? [];
    const setTools = (next: { queries?: string[]; commands?: string[] }): void =>
      this.setDoc(
        patchStep(this.document, index, {
          tools: { queries: next.queries ?? queries, commands: next.commands ?? commands },
        }),
      );
    const auto = step.policy === 'auto';
    return html`
      ${this.renderValue({
        field: 'prompt',
        label: this.t('ui.aiPrompt'),
        value: step.prompt ?? '',
        template: true,
        onChange: (prompt) => this.setDoc(patchStep(this.document, index, { prompt })),
      })}
      <!-- No secret picker on a prompt, and that is not an omission: a secret path here is
           refused at save, because the prompt is sent to the model. -->
      <span class="hint">${this.t('ui.aiPromptHint')}</span>

      <span class="eyebrow">${this.t('ui.aiToolsTitle')}</span>
      <span class="hint">${this.t('ui.aiToolsHint')}</span>
      ${this.renderToolList(this.t('ui.aiToolsQueries'), queries, 'query', (next) =>
        setTools({ queries: next }),
      )}
      ${this.renderToolList(this.t('ui.aiToolsCommands'), commands, 'command', (next) =>
        setTools({ commands: next }),
      )}

      <div class="field">
        <label for="p-${step.id}">${this.t('ui.aiPolicy')}</label>
        <select
          id="p-${step.id}"
          data-field="policy"
          data-testid="flows-editor-ai-policy"
          .value=${String(step.policy ?? 'manual')}
          @change=${(e: Event) =>
            this.setDoc(
              patchStep(this.document, index, {
                policy: (e.target as HTMLSelectElement).value as 'auto' | 'manual',
              }),
            )}
        >
          ${option('manual', this.t('ui.aiPolicyManual'), String(step.policy ?? 'manual'))}
          ${option('auto', this.t('ui.aiPolicyAuto'), String(step.policy ?? 'manual'))}
        </select>
      </div>
      ${auto
        ? html`<ok-inline-feedback
            tone="warning"
            icon="alert-circle-outline"
            data-testid="flows-editor-ai-policy-auto-warning"
            >${this.t('ui.aiPolicyAutoWarning')}</ok-inline-feedback
          >`
        : html`<span class="hint">${this.t('ui.aiPolicyManualHint')}</span>`}

      <div class="field">
        <label for="i-${step.id}">${this.t('ui.aiMaxIters')}</label>
        <input
          id="i-${step.id}"
          data-field="max-iters"
          data-testid="flows-editor-ai-max-iters"
          type="number"
          min="1"
          max=${MAX_ITERS_CAP}
          .value=${String(step.max_iters ?? 6)}
          @change=${(e: Event) =>
            this.setDoc(
              patchStep(this.document, index, {
                // The kernel REFUSES above the cap rather than trimming, so a document saying 50
                // would simply not save. Clamping here keeps the refusal off the owner's screen.
                max_iters: clamp(Number((e.target as HTMLInputElement).value), 1, MAX_ITERS_CAP, 6),
              }),
            )}
        />
        <span class="hint">${this.t('ui.aiMaxItersHint', { max: MAX_ITERS_CAP })}</span>
      </div>
    `;
  }

  private renderToolList(
    label: string,
    names: string[],
    what: 'query' | 'command',
    update: (next: string[]) => void,
  ) {
    return html`
      <span class="hint">${label}</span>
      ${names.map(
        (name, i) => html`<div class="param-row" style="grid-template-columns:1fr auto">
          <div class="field">
            <input
              type="text"
              data-testid=${`flows-editor-ai-tool-${what}`}
              .value=${name}
              @change=${(e: Event) =>
                update(
                  names.map((n, j) => (j === i ? (e.target as HTMLInputElement).value.trim() : n)),
                )}
            />
          </div>
          <button
            type="button"
            class="icon-btn"
            data-testid=${`flows-editor-ai-tool-remove-${what}`}
            aria-label=${this.t('ui.removePart', { label: name })}
            @click=${() => update(names.filter((_, j) => j !== i))}
          >
            ×
          </button>
        </div>`,
      )}
      <div class="adders" style="margin-left:0">
        <button
          type="button"
          data-act="add-${what}"
          data-testid=${`flows-editor-ai-tool-add-${what}`}
          @click=${() => update([...names, ''])}
        >
          ${this.t(what === 'query' ? 'ui.aiAddQuery' : 'ui.aiAddCommand')}
        </button>
      </div>
    `;
  }

  /**
   * **The `notify` step.** The recipient is a query and a column, and there is **no box to type an
   * address into** — that absence is the whole guarantee. Without it, an author (or a marketplace
   * template) writes `to: "{{input.email}}"` and the message goes wherever the event payload said.
   */
  private renderNotifyPanel(step: Step, index: number) {
    const to: Recipient = step.to ?? { query: '', params: {}, field: '' };
    const vars = (step.vars ?? {}) as Record<string, unknown>;
    const setTo = (patch: Partial<Recipient>): void =>
      this.setDoc(
        patchStep(this.document, index, { to: { params: {}, ...to, ...patch } as Recipient }),
      );
    const setVar = (key: string, value: unknown): void =>
      this.setDoc(patchStep(this.document, index, { vars: { ...vars, [key]: value } }));
    const taps = readTapOptions(step);
    // Only where the hub declared the key AND the channel has something to tap. Both halves
    // matter: the kernel refuses the pair email+interactive by name, and an older core refuses
    // the whole document. See the docblock on interactiveNotify.
    const canTap = this.interactiveNotify && step.channel === 'whatsapp';
    return html`
      <div class="field">
        <label for="ch-${step.id}">${this.t('ui.notifyChannel')}</label>
        <select
          id="ch-${step.id}"
          data-field="channel"
          data-testid="flows-editor-notify-channel"
          .value=${String(step.channel ?? 'email')}
          @change=${(e: Event) => {
            const channel = (e.target as HTMLSelectElement).value as 'email' | 'whatsapp';
            const next = patchStep(this.document, index, { channel });
            // An email has nothing to tap, and the options left behind would be invisible on the
            // email panel — right up to the save that refuses the whole document. Through
            // setTapMode, so the message she wrote lands in the copy box instead of vanishing
            // into a panel that shows an empty one (flows#90) — and remembering it first, because
            // this door loses the options exactly like the mode one does (flows#95).
            if (channel !== 'whatsapp') this.rememberTaps(step);
            // …and an email has no header either: the kernel refuses `vars.header_*` off WhatsApp
            // at save time, so it goes with the channel instead of waiting there (hub#2101).
            this.setDoc(
              channel === 'whatsapp'
                ? next
                : setTapMode(dropHeaderOf(next, index), index, false),
            );
          }}
        >
          <!-- Two options, and sms is not one of them: it has no transport anywhere and is
               refused by name at save AND at grant time. A third option here would be a step that
               can never be delivered, picked from a list that looked complete. -->
          ${NOTIFY_CHANNELS.map((c) =>
            option(c, this.t(`ui.notifyChannel_${c}`), String(step.channel ?? 'email')),
          )}
        </select>
      </div>
      ${step.channel === 'whatsapp'
        ? html`<ok-inline-feedback
            tone="warning"
            icon="cash-outline"
            data-testid="flows-editor-notify-whatsapp-cost"
            >${this.t('ui.notifyWhatsappCost')}</ok-inline-feedback
          >`
        : nothing}

      <span class="eyebrow">${this.t('ui.notifyTo')}</span>
      <span class="hint">${this.t('ui.notifyToHint')}</span>
      <div class="param-row">
        <div class="field">
          <label for="tq-${step.id}">${this.t('ui.notifyToQuery')}</label>
          <input
            id="tq-${step.id}"
            data-field="to-query"
            data-testid="flows-editor-notify-to-query"
            type="text"
            .value=${to.query ?? ''}
            @change=${(e: Event) => setTo({ query: (e.target as HTMLInputElement).value.trim() })}
          />
        </div>
        <div class="field">
          <label for="tf-${step.id}">${this.t('ui.notifyToField')}</label>
          <input
            id="tf-${step.id}"
            data-field="to-field"
            data-testid="flows-editor-notify-to-field"
            type="text"
            .value=${to.field ?? ''}
            @change=${(e: Event) => setTo({ field: (e.target as HTMLInputElement).value.trim() })}
          />
        </div>
      </div>

      ${canTap
        ? html`<div class="field">
            <label for="nm-${step.id}">${this.t('ui.notifyMode')}</label>
            <select
              id="nm-${step.id}"
              data-field="notify-mode"
              data-testid="flows-editor-notify-mode"
              .value=${taps ? 'options' : 'text'}
              @change=${(e: Event) => {
                const wants = (e.target as HTMLSelectElement).value === 'options';
                // ALWAYS through setTapMode, never a loose patch: copy and options are two
                // messages and one send, and the hub answers conflicting_message_type for a step
                // that carries both. The swap has to be one edit — and it carries the sentence
                // across, because there is no undo on this screen (flows#90).
                if (!wants) this.rememberTaps(step);
                this.setDoc(setTapMode(this.document, index, wants, this.tapMemory.get(step.id)));
              }}
            >
              ${option('text', this.t('ui.notifyModeText'), taps ? 'options' : 'text')}
              ${option('options', this.t('ui.notifyModeOptions'), taps ? 'options' : 'text')}
            </select>
            <span class="hint">${this.t('ui.notifyModeHint')}</span>
          </div>`
        : nothing}

      ${taps && canTap
        ? this.renderTapOptions(step, index, taps)
        : html`
            ${this.renderTemplateField(step, index, vars)}

            ${this.renderTemplateHeader(step, index, vars)}

            ${this.renderTemplateSlots(step, index, vars)}

            ${this.renderValue({
              field: 'var-text',
              label: this.t('ui.notifyText'),
              value: vars.text ?? '',
              onChange: (text) => setVar('text', text),
            })}
          `}
    `;
  }

  /**
   * **Which template**: a list on WhatsApp (flows#132), a box on email — where the name is the
   * subject — and a box too wherever the list cannot be read, so a hub without it keeps a step.
   *
   * A name that is not in the list is kept as an option of its own and said out loud, never
   * dropped: the step was saved with it, and rewriting it behind her back would change what the
   * flow sends without anyone choosing to.
   */
  private renderTemplateField(step: Step, index: number, vars: Record<string, unknown>) {
    const current = String(step.template ?? '').trim();
    const list = this.waTemplates;
    const setTemplate = (template: string, picked?: WhatsappTemplateChoice): void => {
      const next = patchStep(this.document, index, { template });
      if (!template.trim()) {
        // A free text has no header: the kernel refuses one without its template (hub#2101).
        this.setDoc(dropHeaderOf(next, index));
      } else if (picked) {
        // The header comes WITH the template: the key its kind needs, or none. Not on a hub that
        // cannot send one — there the key would travel as a body variable and Meta refuse it.
        // A row that does not say (no `header_format`) leaves the media header as she set it.
        const header = this.headerMedia ? picked.header : null;
        const media = picked.header === 'unknown' ? vars : withTemplateHeader(vars, header === 'unknown' ? null : header);
        // …and so do its gaps: the title value and the link-button ends it has, and no others.
        const slots = withTemplateSlots(media, picked, { title: this.headerText, links: this.buttonUrl });
        this.setDoc(patchStep(next, index, { vars: slots }));
      } else {
        this.setDoc(next);
      }
    };
    if (step.channel !== 'whatsapp' || (list.status !== 'ready' && list.status !== 'loading')) {
      return html`
        ${step.channel === 'whatsapp' && list.status === 'error'
          ? html`<ok-inline-feedback
              tone="warning"
              data-field="templates-error"
              data-testid="flows-editor-notify-templates-error"
              >${this.t('ui.notifyTemplatesError')}</ok-inline-feedback
            >`
          : nothing}
        <div class="field">
          <label for="tp-${step.id}">${this.t('ui.notifyTemplate')}</label>
          <input
            id="tp-${step.id}"
            data-field="template"
            data-testid="flows-editor-notify-template"
            type="text"
            .value=${String(step.template ?? '')}
            @change=${(e: Event) => setTemplate((e.target as HTMLInputElement).value)}
          />
          <span class="hint">${this.t('ui.notifyTemplateHint')}</span>
        </div>
      `;
    }
    const unknown = !!current && list.status === 'ready' && !list.templates.some((t) => t.name === current);
    return html`
      <div class="field">
        <label for="tp-${step.id}">${this.t('ui.notifyTemplatePick')}</label>
        <select
          id="tp-${step.id}"
          data-field="template-pick"
          data-testid="flows-editor-notify-template-pick"
          ?disabled=${list.status === 'loading'}
          .value=${current}
          @change=${(e: Event) => {
            const name = (e.target as HTMLSelectElement).value;
            setTemplate(name, list.templates.find((t) => t.name === name));
          }}
        >
          ${option('', this.t('ui.notifyTemplateNone'), current)}
          ${list.templates.map((t) => option(t.name, t.name, current))}
          ${unknown
            ? option(current, this.t('ui.notifyTemplateUnknownOption', { name: current }), current)
            : nothing}
        </select>
        <span class="hint"
          >${list.status === 'loading'
            ? this.t('ui.notifyTemplatesLoading')
            : this.t('ui.notifyTemplatePickHint')}</span
        >
      </div>
      ${list.status === 'ready' && list.templates.length === 0
        ? html`<ok-inline-feedback
            tone="info"
            data-field="templates-empty"
            data-testid="flows-editor-notify-templates-empty"
            >${this.t('ui.notifyTemplatesEmpty')}</ok-inline-feedback
          >`
        : nothing}
      ${unknown
        ? html`<ok-inline-feedback
            tone="warning"
            data-field="template-unknown"
            data-testid="flows-editor-notify-template-unknown"
            >${this.t('ui.notifyTemplateUnknown', { name: current })}</ok-inline-feedback
          >`
        : nothing}
    `;
  }

  /**
   * The header of a template the list knows: nothing to choose, only the file to attach (flows#132).
   * On a hub that cannot send a header, a warning instead of a field the kernel would refuse.
   */
  private renderDeducedHeader(index: number, vars: Record<string, unknown>, known: WhatsappTemplateChoice) {
    const kind = known.header;
    if (!kind || kind === 'unknown') return nothing;
    const kindLabel = this.t(`ui.notifyHeader_${kind}`);
    if (!this.headerMedia) {
      return html`<ok-inline-feedback
        tone="warning"
        data-field="header-unsupported"
        data-testid="flows-editor-notify-header-unsupported"
        >${this.t('ui.notifyHeaderUnsupported', { kind: kindLabel })}</ok-inline-feedback
      >`;
    }
    return html`
      <span class="hint" data-field="header-deduced"
        >${this.t('ui.notifyHeaderDeduced', { kind: kindLabel })}</span
      >
      ${this.renderValue({
        field: 'header-link',
        label: this.t('ui.notifyHeaderLink'),
        value: readHeader(vars)?.link ?? '',
        template: true,
        onChange: (link) =>
          this.setDoc(
            patchStep(this.document, index, {
              vars: { ...withoutHeader(vars), [headerKey(kind)]: link },
            }),
          ),
      })}
    `;
  }

  /**
   * **The media in the template's header** (hub#2101): a kind and a link, and nothing else.
   *
   * Only on a WhatsApp step that names a template, on a hub that declared the keys. The link is
   * composed in the same picker as the copy — a customer's photo or a product picture is usually a
   * field of the run — and written as a string, because Meta's `link` is one.
   */
  private renderTemplateHeader(step: Step, index: number, vars: Record<string, unknown>) {
    if (step.channel !== 'whatsapp' || !String(step.template ?? '').trim()) return nothing;
    const known = this.knownTemplate(step);
    if (known && known.header !== 'unknown') return this.renderDeducedHeader(index, vars, known);
    // A title with a gap IS the header: there is no room for a picture next to it (hub#2111).
    if (known?.titleVariable || !this.headerMedia) return nothing;
    const header = readHeader(vars);
    const write = (kind: HeaderKind | 'none', link: unknown): void => {
      const rest = withoutHeader(vars);
      this.setDoc(
        patchStep(this.document, index, {
          vars: kind === 'none' ? rest : { ...rest, [headerKey(kind)]: link ?? '' },
        }),
      );
    };
    return html`
      <div class="field">
        <label for="hk-${step.id}">${this.t('ui.notifyHeader')}</label>
        <select
          id="hk-${step.id}"
          data-field="header-kind"
          data-testid="flows-editor-notify-header-kind"
          .value=${header?.kind ?? 'none'}
          @change=${(e: Event) =>
            write((e.target as HTMLSelectElement).value as HeaderKind | 'none', header?.link)}
        >
          ${(['none', ...HEADER_KINDS] as const).map((k) =>
            option(k, this.t(`ui.notifyHeader_${k}`), header?.kind ?? 'none'),
          )}
        </select>
        <span class="hint">${this.t('ui.notifyHeaderHint')}</span>
      </div>
      ${header
        ? this.renderValue({
            field: 'header-link',
            label: this.t('ui.notifyHeaderLink'),
            value: header.link ?? '',
            template: true,
            onChange: (link) => write(header.kind, link),
          })
        : nothing}
    `;
  }

  /**
   * **The gaps of a template the list knows** (hub#2110/#2111): the value of a title with a `{{1}}`
   * and the end of each link button whose URL has one — composed in the same picker as the copy,
   * because the appointment's date or the order's code is a field of the run. On a hub that cannot
   * send them, a warning instead: the send would be refused by Meta, and she should know now.
   */
  private renderTemplateSlots(step: Step, index: number, vars: Record<string, unknown>) {
    if (step.channel !== 'whatsapp') return nothing;
    const known = this.knownTemplate(step);
    if (!known) return nothing;
    const set = (key: string, value: string): void =>
      this.setDoc(patchStep(this.document, index, { vars: { ...vars, [key]: value } }));
    const links = known.linkButtons ?? [];
    return html`
      ${known.titleVariable
        ? this.headerText
          ? this.renderValue({
              field: 'header-text',
              label: this.t('ui.notifyTitleValue'),
              value: vars[TITLE_KEY] ?? '',
              template: true,
              onChange: (v) => set(TITLE_KEY, v),
            })
          : html`<ok-inline-feedback
              tone="warning"
              data-field="header-text-unsupported"
              data-testid="flows-editor-notify-header-text-unsupported"
              >${this.t('ui.notifyTitleUnsupported')}</ok-inline-feedback
            >`
        : nothing}
      ${links.length && !this.buttonUrl
        ? html`<ok-inline-feedback
            tone="warning"
            data-field="button-url-unsupported"
            data-testid="flows-editor-notify-button-url-unsupported"
            >${this.t('ui.notifyLinkUnsupported')}</ok-inline-feedback
          >`
        : nothing}
      ${this.buttonUrl
        ? links.map(({ index: n, text }) =>
            this.renderValue({
              field: `button-url-${n}`,
              label: this.t('ui.notifyLinkValue', { button: text || String(n + 1) }),
              value: vars[linkKey(n)] ?? '',
              template: true,
              onChange: (v) => set(linkKey(n), v),
            }),
          )
        : nothing}
    `;
  }

  /**
   * **The options the customer taps**, edited as three flat things: the message, the kind, and the
   * rows — with every piece of copy composed in the SAME picker the message body uses, because an
   * option's label is a value like any other (`{{steps.slots.0.label}}` is the whole point).
   *
   * What is deliberately NOT here is a block. The SaaS checks Meta's limits before it pays for the
   * send and answers with a code; re-implementing them would be a second table ageing on its own,
   * and it would strand an owner whose hub is newer than this module. What the screen owes them is
   * finding out while they type, which is what the warnings do.
   */
  private renderTapOptions(step: Step, index: number, taps: TapOptions) {
    const write = (next: TapOptions): void => this.setDoc(setTapOptions(this.document, index, next));
    const patchOption = (at: number, patch: Record<string, unknown>): void =>
      write({
        ...taps,
        options: taps.options.map((o, i) => (i === at ? { ...o, ...patch } : o)),
      });
    const max = taps.kind === 'button' ? MAX_BUTTONS : MAX_LIST_ROWS;
    const problems = tapOptionProblems(taps);
    return html`
      <div class="field">
        <label for="tk-${step.id}">${this.t('ui.tapKind')}</label>
        <select
          id="tk-${step.id}"
          data-field="tap-kind"
          data-testid="flows-editor-tap-kind"
          .value=${taps.kind}
          @change=${(e: Event) =>
            write({ ...taps, kind: (e.target as HTMLSelectElement).value as TapKind })}
        >
          ${TAP_KINDS.map((k) => option(k, this.t(`ui.tapKind_${k}`), taps.kind))}
        </select>
        <span class="hint">${this.t(`ui.tapKindHint_${taps.kind}`, { max })}</span>
      </div>

      ${this.renderValue({
        field: 'tap-body',
        label: this.t('ui.tapBody'),
        value: taps.body,
        // Meta's body.text is a string on the wire, so a lone field still travels as {{...}} —
        // the same rule the http step applies to its url.
        template: true,
        onChange: (body) => write({ ...taps, body }),
      })}

      ${taps.kind === 'list'
        ? this.renderValue({
            field: 'tap-open-label',
            label: this.t('ui.tapOpenLabel'),
            value: taps.openLabel,
            template: true,
            onChange: (openLabel) => write({ ...taps, openLabel }),
          })
        : nothing}

      <span class="eyebrow">${this.t('ui.tapOptions')}</span>
      <span class="hint">${this.t('ui.tapOptionsHint')}</span>

      ${taps.options.map(
        (opt, i) => html`
          <div class="tap-option" data-tap-option=${i}>
            <div class="tap-head">
              <div class="field">
                <label for="ti-${step.id}-${i}">${this.t('ui.tapId')}</label>
                <input
                  id="ti-${step.id}-${i}"
                  data-field="tap-id-${i}"
                  data-testid="flows-editor-tap-id"
                  type="text"
                  .value=${opt.id}
                  @change=${(e: Event) =>
                    patchOption(i, { id: (e.target as HTMLInputElement).value.trim() })}
                />
              </div>
              <ion-button
                size="small"
                fill="clear"
                data-act="remove-tap-option-${i}"
                data-testid="flows-editor-tap-option-remove"
                aria-label=${this.t('ui.tapRemoveOption')}
                @click=${() =>
                  write({ ...taps, options: taps.options.filter((_, at) => at !== i) })}
              >
                <ion-icon name="trash-outline" slot="icon-only"></ion-icon>
              </ion-button>
            </div>
            <!-- The identifier above is a plain box on purpose: it is what comes home as
                 event.reply_id and what a later guard compares against, so it has to be a
                 literal. The label below is copy, and copy is composed. -->
            ${this.renderValue({
              field: `tap-title-${i}`,
              label: this.t('ui.tapTitle'),
              value: opt.title,
              template: true,
              onChange: (title) => patchOption(i, { title }),
            })}
            ${taps.kind === 'list'
              ? this.renderValue({
                  field: `tap-desc-${i}`,
                  label: this.t('ui.tapDescription'),
                  value: opt.description ?? '',
                  template: true,
                  onChange: (description) => patchOption(i, { description }),
                })
              : nothing}
          </div>
        `,
      )}

      <ion-button
        size="small"
        fill="clear"
        data-act="add-tap-option"
        data-testid="flows-editor-tap-option-add"
        @click=${() => write({ ...taps, options: [...taps.options, { id: '', title: '' }] })}
      >
        <ion-icon name="add-outline" slot="start"></ion-icon>
        ${this.t('ui.tapAddOption')}
      </ion-button>

      ${problems.map(
        (p) =>
          html`<ok-inline-feedback
            tone="warning"
            icon="alert-circle-outline"
            data-testid="flows-editor-tap-option-warning"
            >${this.t(p.key, p.params)}</ok-inline-feedback
          >`,
      )}
    `;
  }

  private renderDelayPanel(step: Step, index: number) {
    const seconds = Number(step.seconds ?? 0);
    const unit = seconds % 86400 === 0 && seconds !== 0 ? 86400 : seconds % 3600 === 0 && seconds !== 0 ? 3600 : 60;
    return html`<div class="param-row">
      <div class="field">
        <label for="d-${step.id}">${this.t('ui.delayAmount')}</label>
        <input
          id="d-${step.id}"
          type="number"
          data-testid="flows-editor-delay-amount"
          min="0"
          .value=${String(Math.round(seconds / unit))}
          @change=${(e: Event) =>
            this.setDoc(
              patchStep(this.document, index, {
                seconds: Math.max(0, Number((e.target as HTMLInputElement).value) || 0) * unit,
              }),
            )}
        />
      </div>
      <div class="field">
        <label for="du-${step.id}">${this.t('ui.value')}</label>
        <select
          id="du-${step.id}"
          data-testid="flows-editor-delay-unit"
          .value=${String(unit)}
          @change=${(e: Event) =>
            this.setDoc(
              patchStep(this.document, index, {
                seconds: Math.round(seconds / unit) * Number((e.target as HTMLSelectElement).value),
              }),
            )}
        >
          ${option('60', this.t('ui.unitMinutes'), String(unit))}
          ${option('3600', this.t('ui.unitHours'), String(unit))}
          ${option('86400', this.t('ui.unitDays'), String(unit))}
        </select>
      </div>
    </div>`;
  }

  /**
   * Whether this hub puts `reply_to_flow` in its WhatsApp event (hub#1962) — known only because it
   * was SEEN there. An older core leaves the field out, a missing field equals nothing, and a check
   * on it would stop matching every answer; so without that evidence only the step is compared.
   */
  private get hubSendsReplyToFlow(): boolean {
    return sendsReplyToFlow(this.shape);
  }

  private renderGuardPanel(step: Step, index: number) {
    const rows = guardRows(step.when);
    const update = (next: GuardRow[]): void =>
      this.setDoc(patchStep(this.document, index, { when: rowsToWhen(next) }));
    // «The question it answers» is ONE choice written as two comparisons (flows#124): the
    // automation half rides inside the step's dropdown and goes wherever that row goes.
    const pairsFlow = rows.some((r) => r.path === REPLY_STEP_PATH && r.op === 'eq');
    const isFlowHalf = (r: GuardRow): boolean => pairsFlow && r.path === REPLY_FLOW_PATH && r.op === 'eq';
    const flowHalf = rows.find(isFlowHalf)?.value ?? '';
    // A check saved before flows#124 names the step only; when two saved automations ask with it,
    // the owner is told to pick again (flows#125) — only where picking again writes the automation.
    const ambiguous =
      this.hubSendsReplyToFlow &&
      this.hubFlows.status === 'ready' &&
      ambiguousReplyGuards({ steps: [step] }, this.hubFlows.flows).length > 0;
    const pickQuestion = (i: number, key: string): void => {
      const { flowId, stepId } = parseQuestionKey(key);
      const op = rows[i].op;
      const next = rows
        .map((r, j) => (j === i ? { ...r, value: stepId } : r))
        .filter((r) => !(r.path === REPLY_FLOW_PATH && r.op === 'eq'));
      if (op === 'eq' && flowId && this.hubSendsReplyToFlow) {
        next.push({ path: REPLY_FLOW_PATH, op: 'eq', value: flowId });
      }
      update(next);
    };
    const remove = (i: number): void => {
      const row = rows[i];
      update(rows.filter((r, j) => j !== i && !(row.path === REPLY_STEP_PATH && row.op === 'eq' && isFlowHalf(r))));
    };
    return html`
      <span class="hint">${this.t('ui.guardExplain')}</span>
      ${rows.map(
        (row, i) => isFlowHalf(row) ? nothing : html`<div class="guard-row">
          <div class="field">
            <label>${this.t('ui.field')}</label>
            <input
              type="text"
              data-testid="flows-editor-guard-field"
              .value=${this.fieldLabel(row.path) || ''}
              readonly
              @click=${(e: Event) => {
                const host = (e.target as HTMLElement).closest('.guard-row');
                const box = host?.querySelector('erp-flows-value') as ErpFlowsValue | null;
                if (box) this.openPicker(box, 'input');
              }}
            />
            <erp-flows-value
              hidden
              .parts=${row.path ? [{ kind: 'field' as const, path: row.path }] : []}
              @flows-value-change=${(e: CustomEvent<{ parts: { path?: string }[] }>) => {
                const picked = e.detail.parts.find((p) => p.path)?.path ?? '';
                update(rows.map((r, j) => (j === i ? { ...r, path: picked } : r)));
              }}
            ></erp-flows-value>
          </div>
          <div class="field">
            <label>${this.t('ui.operator')}</label>
            <select
              data-field="operator"
              data-testid="flows-editor-guard-operator"
              .value=${row.op}
              @change=${(e: Event) =>
                update(
                  rows.map((r, j) =>
                    j === i ? { ...r, op: (e.target as HTMLSelectElement).value as Operator } : r,
                  ),
                )}
            >
              ${OPERATORS.map((op) =>
                option(op, this.t(`ui.op${op.charAt(0).toUpperCase()}${op.slice(1)}`), row.op),
              )}
            </select>
          </div>
          <div class="field">
            <label>${this.t('ui.value')}</label>
            ${row.path === REPLY_STEP_PATH && (row.op === 'eq' || row.op === 'neq')
              ? html`${this.renderReplyStepSelect(row.value, row.op === 'eq' ? flowHalf : '', (key) =>
                    pickQuestion(i, key),
                  )}${ambiguous && row.op === 'eq'
                    ? html`<ok-inline-feedback
                        tone="warning"
                        icon="alert-circle-outline"
                        data-field="reply-step-ambiguous"
                        data-testid="flows-editor-reply-step-ambiguous"
                        >${this.t('ui.replyStepAmbiguous')}</ok-inline-feedback
                      >`
                    : nothing}`
              : html`<input
                  type="text"
                  data-field="guard-value"
                  data-testid="flows-editor-guard-value"
                  .value=${row.value}
                  @change=${(e: Event) =>
                    update(
                      rows.map((r, j) =>
                        j === i ? { ...r, value: (e.target as HTMLInputElement).value } : r,
                      ),
                    )}
                />`}
            ${row.op === 'in' ? html`<span class="hint">${this.t('ui.opInHint')}</span>` : nothing}
          </div>
          <div class="field">
            <span class="label-spacer" aria-hidden="true">&nbsp;</span>
            <button
              type="button"
              class="icon-btn"
              data-testid="flows-editor-guard-remove"
              aria-label=${this.t('ui.removeCondition')}
              @click=${() => remove(i)}
            >
              ×
            </button>
          </div>
        </div>`,
      )}
      <div class="adders" style="margin-left:0">
        <button
          type="button"
          data-testid="flows-editor-guard-add"
          @click=${() => update([...rows, { path: '', op: 'eq' as Operator, value: '' }])}
        >
          ${this.t('ui.addCondition')}
        </button>
      </div>
    `;
  }

  /**
   * «The step that asked the question», chosen by what it says (flows#118).
   *
   * The value is the step's internal id — what the hub writes in `reply_to_step` — and that id is
   * shown nowhere else, so typing it was not a way to build the check at all. A saved id that no
   * automation carries any more stays selected under its own «no longer exists» label: silently
   * swapping it for the first option would rewrite a working guard on the next save.
   *
   * Each option is an (automation, step) pair (flows#124), and `currentFlow` is the automation half
   * already saved beside the step — `''` for a guard written before it existed, which then shows
   * the first automation carrying that step, exactly what it matched and still matches.
   */
  private renderReplyStepSelect(current: string, currentFlow: string, onChange: (key: string) => void) {
    const { status } = this.hubFlows;
    if (status === 'idle' || status === 'loading') {
      return html`<select data-field="reply-step" data-testid="flows-editor-reply-step" disabled>
        <option value="">${this.t('ui.replyStepLoading')}</option>
      </select>`;
    }
    const steps =
      status === 'ready'
        ? questionSteps(this.hubFlows.flows, { id: this.flow?.id, name: this.name, doc: this.document })
        : [];
    const chosen = steps.find((q) => q.stepId === current && (currentFlow === '' || q.flowId === currentFlow));
    const selected = chosen ? questionKey(chosen.flowId, chosen.stepId) : questionKey(currentFlow, current);
    return html`<select
        data-field="reply-step"
        data-testid="flows-editor-reply-step"
        .value=${selected}
        @change=${(e: Event) => onChange((e.target as HTMLSelectElement).value)}
      >
        ${option('', this.t('ui.replyStepChoose'), selected)}
        ${current !== '' && !chosen ? option(selected, this.t('ui.replyStepMissing'), selected) : nothing}
        ${steps.map((q) =>
          option(questionKey(q.flowId, q.stepId), this.t('ui.replyStepOption', {
              flow: q.flowName || this.t('ui.unnamed'),
              text: q.text || this.t('ui.replyStepNoText'),
            }), selected),
        )}
      </select>
      ${status === 'error'
        ? html`<ok-inline-feedback
              tone="warning"
              icon="alert-circle-outline"
              data-field="reply-step-error"
              data-testid="flows-editor-reply-step-error"
              >${this.t('ui.replyStepLoadFailed')}</ok-inline-feedback
            >
            <ion-button
              size="small"
              fill="clear"
              data-act="reply-step-retry"
              data-testid="flows-editor-reply-step-retry"
              @click=${() => {
                this.hubFlows = { status: 'idle', flows: [] };
                void this.ensureHubFlows();
              }}
            >
              <ion-icon name="refresh-outline" slot="start"></ion-icon>
              ${this.t('ui.replyStepRetry')}
            </ion-button>`
        : steps.length === 0
          ? html`<span class="hint" data-field="reply-step-empty">${this.t('ui.replyStepNone')}</span>`
          : nothing}`;
  }

  private renderCommandPanel(step: Step, index: number) {
    return html`
      <div class="field">
        <label for="c-${step.id}">${this.t('ui.commandLabel')}</label>
        <input
          id="c-${step.id}"
          type="text"
          data-testid="flows-editor-command"
          .value=${String(step.command ?? '')}
          @change=${(e: Event) =>
            this.setDoc(
              patchStep(this.document, index, { command: (e.target as HTMLInputElement).value.trim() }),
            )}
        />
        <span class="hint">${this.t('ui.commandHint')}</span>
      </div>
      ${this.renderParams(step, index)}
    `;
  }

  /**
   * **The `query` step** — the deterministic read (hub#954, flows#30). Until it existed a flow
   * could only read by putting an `ai` step in the way: a metered, non-deterministic call to a
   * model to answer «is there any stock left». Now it reads without one.
   *
   * Three things the hub checks and refuses are drawn here so the refusal never reaches the
   * owner as an error code: the read must EXIST (404 at save — typed here, because there is no
   * door in the module SDK that lists a hub's queries, exactly as `command` is typed), `result`
   * is `first`/`count` and never `rows`, and `limit` is 1..200 — clamped in the box, since the
   * kernel refuses above the ceiling rather than trimming.
   */
  private renderQueryPanel(step: Step, index: number) {
    const result = String(step.result ?? 'first');
    return html`
      <div class="field">
        <label for="q-${step.id}">${this.t('ui.queryLabel')}</label>
        <input
          id="q-${step.id}"
          data-field="query"
          data-testid="flows-editor-query"
          type="text"
          .value=${String(step.query ?? '')}
          @change=${(e: Event) =>
            this.setDoc(
              patchStep(this.document, index, { query: (e.target as HTMLInputElement).value.trim() }),
            )}
        />
        <span class="hint">${this.t('ui.queryHint')}</span>
      </div>
      ${this.renderParams(step, index)}

      <div class="param-row">
        <div class="field">
          <label for="qr-${step.id}">${this.t('ui.queryResult')}</label>
          <select
            id="qr-${step.id}"
            data-field="result"
            data-testid="flows-editor-query-result"
            .value=${result}
            @change=${(e: Event) =>
              this.setDoc(
                patchStep(this.document, index, {
                  result: (e.target as HTMLSelectElement).value as QueryResult,
                }),
              )}
          >
            <!-- Two options and no "rows": the mapping language cannot index an array, so a
                 step that kept a list would leave behind something no later step could read. -->
            ${QUERY_RESULTS.map((r) => option(r, this.t(`ui.queryResult_${r}`), result))}
          </select>
        </div>
        <div class="field">
          <label for="ql-${step.id}">${this.t('ui.queryLimit')}</label>
          <input
            id="ql-${step.id}"
            data-field="limit"
            data-testid="flows-editor-query-limit"
            type="number"
            min="1"
            max=${MAX_QUERY_ROWS}
            .value=${String(step.limit ?? MAX_QUERY_ROWS)}
            @change=${(e: Event) =>
              this.setDoc(
                patchStep(this.document, index, {
                  // The kernel REFUSES above the ceiling rather than trimming
                  // (flow.limit_out_of_range). Clamping here keeps that refusal off the owner's screen.
                  limit: clamp(Number((e.target as HTMLInputElement).value), 1, MAX_QUERY_ROWS, MAX_QUERY_ROWS),
                }),
              )}
          />
          <span class="hint">${this.t('ui.queryLimitHint', { max: MAX_QUERY_ROWS })}</span>
        </div>
      </div>
      <!-- What the NEXT step can read. Zero rows is not a failure: the run carries on with
           found = false, and a guard on it is how «warn me IF there is low stock» is written. -->
      <span class="hint" data-field="query-outputs"
        >${this.t('ui.queryOutputsHint', { paths: queryOutputs(step).join(', ') })}</span
      >
    `;
  }

  /**
   * **The `approval` step** — the pause (hub#950, flows#31). Until it existed a flow could only
   * stop and wait for a person by putting an `ai` step in the way: a metered, non-deterministic
   * call to a model to resolve a yes/no. Now it asks without one.
   *
   * What this panel has to get right is what the market got wrong. Power Automate's *Start and
   * wait for an approval* kills the run at ~30 days and leaves the approval orphaned in the
   * Action Center — the #1 complaint of its forums — so the wait here is EXPLICIT and capped, and
   * what happens when it runs out is a choice the owner makes on this screen. And v1 is linear:
   * the two policies are what replaces branching, so they are explained where they are set.
   */
  private renderApprovalPanel(step: Step, index: number) {
    const role = step.assignee?.role ?? '';
    const expiresIn = Number(step.expires_in ?? DEFAULT_APPROVAL_TTL_SECONDS);
    // Drawn as «3 days / 1 week», never as a number of seconds. A wait the presets do not have
    // (a hand-written document) is kept and offered as itself: reopening must not rewrite it.
    const presets = [3600, 14400, 86400, 259200, 604800, 1209600, MAX_APPROVAL_TTL_SECONDS];
    const waits = presets.includes(expiresIn) ? presets : [...presets, expiresIn].sort((a, b) => a - b);
    const onReject = String(step.on_reject ?? 'cancel');
    const onExpire = String(step.on_expire ?? 'reject');
    const continues = onReject === 'continue' || onExpire === 'continue';
    return html`
      ${this.renderValue({
        field: 'title',
        label: this.t('ui.approvalTitle'),
        value: step.title ?? '',
        template: true,
        onChange: (title) => this.setDoc(patchStep(this.document, index, { title: String(title) })),
      })}
      <!-- Templated when the request is CREATED, not when the tray is read: editing the flow
           later does not change a question already asked. Said here, where the text is typed. -->
      <span class="hint">${this.t('ui.approvalTitleHint')}</span>
      ${this.renderValue({
        field: 'summary',
        label: this.t('ui.approvalSummary'),
        value: step.summary ?? '',
        template: true,
        onChange: (summary) =>
          this.setDoc(patchStep(this.document, index, { summary: String(summary) })),
      })}

      <div class="field">
        <label for="ar-${step.id}">${this.t('ui.approvalAssignee')}</label>
        <!-- A ROLE, and there is no box in which a person can be named — that absence is the
             guarantee (hub#950): a document that could say «Marta» stops working the day Marta
             leaves. The base roles are offered; a role a module declares can still be typed. -->
        <input
          id="ar-${step.id}"
          data-field="assignee-role"
          data-testid="flows-editor-approval-role"
          type="text"
          list="roles-${step.id}"
          placeholder=${this.t('ui.approvalAssigneeAdmins')}
          .value=${role}
          @change=${(e: Event) => {
            const next = (e.target as HTMLInputElement).value.trim();
            // Absent, never `{role: ''}`: the kernel refuses an empty role and reads absence as
            // «whoever administers the hub» — the one role that always has somebody.
            const { assignee: _dropped, ...rest } = this.document.steps[index];
            const patched = next ? { ...rest, assignee: { role: next } } : rest;
            this.setDoc({
              ...this.document,
              steps: this.document.steps.map((s, i) => (i === index ? (patched as Step) : s)),
            });
          }}
        />
        <datalist id="roles-${step.id}" data-field="roles">
          ${BASE_ROLES.map((r) => html`<option value=${r}></option>`)}
        </datalist>
        <span class="hint">${this.t('ui.approvalAssigneeHint')}</span>
      </div>

      <div class="field">
        <label for="ae-${step.id}">${this.t('ui.approvalExpiresIn')}</label>
        <select
          id="ae-${step.id}"
          data-field="expires-in"
          data-testid="flows-editor-approval-expires-in"
          .value=${String(expiresIn)}
          @change=${(e: Event) =>
            this.setDoc(
              patchStep(this.document, index, {
                expires_in: clamp(
                  Number((e.target as HTMLSelectElement).value),
                  1,
                  MAX_APPROVAL_TTL_SECONDS,
                  DEFAULT_APPROVAL_TTL_SECONDS,
                ),
              }),
            )}
        >
          ${waits.map((w) => option(String(w), describeDelay(w, this.t), String(expiresIn)))}
        </select>
        <span class="hint">${this.t('ui.approvalExpiresInHint')}</span>
      </div>

      <div class="param-row">
        <div class="field">
          <label for="aj-${step.id}">${this.t('ui.approvalOnReject')}</label>
          <select
            id="aj-${step.id}"
            data-field="on-reject"
            data-testid="flows-editor-approval-on-reject"
            .value=${onReject}
            @change=${(e: Event) =>
              this.setDoc(
                patchStep(this.document, index, {
                  on_reject: (e.target as HTMLSelectElement).value as RejectPolicy,
                }),
              )}
          >
            ${REJECT_POLICIES.map((p) => option(p, this.t(`ui.approvalOnReject_${p}`), onReject))}
          </select>
        </div>
        <div class="field">
          <label for="ax-${step.id}">${this.t('ui.approvalOnExpire')}</label>
          <select
            id="ax-${step.id}"
            data-field="on-expire"
            data-testid="flows-editor-approval-on-expire"
            .value=${onExpire}
            @change=${(e: Event) =>
              this.setDoc(
                patchStep(this.document, index, {
                  on_expire: (e.target as HTMLSelectElement).value as ExpiryPolicy,
                }),
              )}
          >
            ${EXPIRY_POLICIES.map((p) => option(p, this.t(`ui.approvalOnExpire_${p}`), onExpire))}
          </select>
        </div>
      </div>
      <!-- v1 is LINEAR and this pair is what replaces branching: continue + a guard on the
           decision composes approved / rejected / expired without a fork. It is said the moment
           «continue» is picked, which is when it becomes true. -->
      ${continues
        ? html`<ok-inline-feedback
            tone="info"
            icon="git-branch-outline"
            data-testid="flows-editor-approval-continue-hint"
            >${this.t('ui.approvalContinueHint', { path: `steps.${step.id}.decision` })}</ok-inline-feedback
          >`
        : nothing}
      <span class="hint" data-field="approval-outputs"
        >${this.t('ui.approvalOutputsHint', { paths: approvalOutputs(step).join(', ') })}</span
      >
    `;
  }

  /** The `params` of a `command` or a `query` step: a name and a composed value per row. */
  private renderParams(step: Step, index: number) {
    const params = Object.entries(step.params ?? {});
    const setParams = (entries: [string, unknown][]): void =>
      this.setDoc(patchStep(this.document, index, { params: Object.fromEntries(entries) }));
    return html`
      <span class="eyebrow">${this.t('ui.paramsTitle')}</span>
      ${params.map(
        ([key, value], i) => html`<div class="param-row">
          <div class="field">
            <label>${this.t('ui.paramName')}</label>
            <input
              type="text"
              data-testid="flows-editor-param-name"
              .value=${key}
              @change=${(e: Event) =>
                setParams(
                  params.map((p, j) =>
                    j === i ? [(e.target as HTMLInputElement).value.trim(), p[1]] : p,
                  ),
                )}
            />
          </div>
          <erp-flows-value
            .label=${this.t('ui.paramValue')}
            .parts=${valueToParts(value)}
            .fieldLabel=${this.fieldLabel}
            .insertLabel=${this.t('ui.insertField')}
            .removeLabel=${this.t('ui.removePart')}
            .canPickFields=${!!this.shape}
            @flows-value-change=${(e: CustomEvent<{ parts: never }>) =>
              setParams(params.map((p, j) => (j === i ? [p[0], partsToValue(e.detail.parts)] : p)))}
            @flows-pick-field=${(e: Event) => this.openPicker(e.target as ErpFlowsValue, 'input')}
          ></erp-flows-value>
          <button
            type="button"
            class="icon-btn"
            data-testid="flows-editor-param-remove"
            aria-label=${this.t('ui.removePart', { label: key })}
            @click=${() => setParams(params.filter((_, j) => j !== i))}
          >
            ×
          </button>
        </div>`,
      )}
      <div class="adders" style="margin-left:0">
        <button
          type="button"
          data-act="add-param"
          data-testid="flows-editor-param-add"
          @click=${() => setParams([...params, ['', '']])}
        >
          ${this.t('ui.addParam')}
        </button>
      </div>
    `;
  }

  private renderSpine() {
    // The adders live INSIDE the column. Outside it they drift to the far left of a 1440px screen,
    // a hand's width away from the spine they add to.
    return html`<div class="spine">
        ${this.renderTriggerNode()}
        <ion-reorder-group
          .disabled=${false}
          @ionItemReorder=${(e: Event) =>
            this.onReorder(e as CustomEvent<{ from: number; to: number; complete: () => void }>)}
        >
          ${this.document.steps.map((step, i) => this.renderStepNode(step, i))}
        </ion-reorder-group>
        ${this.document.steps.length === 0
          ? html`<div class="node"><span class="hint">${this.t('ui.noSteps')}</span></div>`
          : nothing}
        <!-- Order is by how often a shop owner reaches for one, not by the kernel's enum. The read
             sits right before the guard because that is the pair it is used in (query → condition
             on found); the ai one is last because it is the one that costs money and the one that
             needs the most reading. -->
        <div class="adders">
          ${(
            [
              ['command', 'ui.addCommand'],
              ['query', 'ui.addQuery'],
              ['condition', 'ui.addGuard'],
              ['approval', 'ui.addApproval'],
              ['delay', 'ui.addDelay'],
              ['notify', 'ui.addNotify'],
              ['http', 'ui.addHttp'],
              ['ai', 'ui.addAi'],
            ] as const
          ).map(
            ([kind, label]) => html`<button
              type="button"
              data-add=${kind}
              data-testid=${`flows-editor-add-${kind}`}
              @click=${() => this.add(kind)}
            >
              ${this.t(label)}
            </button>`,
          )}
        </div>
      </div>`;
  }

  private renderPermissions() {
    const missing = missingGrants(this.document, this.grants);
    return html`<div class="list">
      <span class="hint">${this.t('ui.grantsIntro')}</span>
      ${missing.map(
        (g) => html`<div class="grant">
          <ok-status-pill tone="warning" label=${this.t('ui.grantsMissing')}></ok-status-pill>
          <span class="grow">${g.value}</span>
        </div>`,
      )}
      ${this.grants.map((g) => this.renderGrant(g))}
      ${!missing.length && !this.grants.length
        ? html`<span class="muted">${this.t('ui.grantsNone')}</span>`
        : nothing}
      ${missing.length
        ? html`<div class="adders" style="margin-left:0">
            <button
              type="button"
              data-testid="flows-editor-grant-all"
              @click=${() => void this.grantAll()}
            >
              ${this.t('ui.grantAll')}
            </button>
          </div>`
        : nothing}
    </div>`;
  }

  /**
   * One permission this flow HOLDS, and what it is limited to.
   *
   * The limit reads on the row itself, not only inside the fold: an owner who granted «may cancel
   * appointments AS THE CUSTOMER» has to be able to read that back without opening anything, or
   * the screen describes a wider permission than the one that was given (hub#1623, flows#66).
   */
  private renderGrant(g: Grant) {
    const k = grantKey(g);
    const limits = pinRows(g)
      .map(([field, value]) => `${field} = ${value}`)
      .join(', ');
    const open = this.limitsOpen.includes(k);
    return html`<div class="grant-block" data-grant=${k}>
      <div class="grant">
        <ok-status-pill tone="success" label=${this.t('ui.grantsGranted')}></ok-status-pill>
        <span class="grow"
          >${g.kind === 'command' ? g.value : this.t('ui.grantOther', { kind: g.kind, value: g.value })}${limits
            ? html` <em class="pinned">${this.t('ui.grantPinned', { limits })}</em>`
            : nothing}</span
        >
        <span class="grant-actions">
          <!-- A command's payload and a query's parameters, and nothing else (hub#1623, hub#1662).
               Offered on any other kind the hub answers flow.invalid_grant_payload — and this
               endpoint replaces the WHOLE list, so it would not lose that row, it would lose every
               permission on the screen. -->
          ${canPinPayload(g.kind)
            ? html`<button
                type="button"
                class="icon-btn"
                data-act="limits"
                data-testid=${`flows-editor-grant-limits-${k}`}
                aria-expanded=${open ? 'true' : 'false'}
                @click=${() => this.toggleLimits(g)}
              >
                ${this.t('ui.grantLimits')}
              </button>`
            : nothing}
          <button
            type="button"
            class="icon-btn"
            data-act="revoke"
            data-testid=${`flows-editor-grant-revoke-${k}`}
            @click=${() => void this.revoke(g)}
          >
            ${this.t('ui.revoke')}
          </button>
        </span>
      </div>
      ${open ? this.renderLimits(g) : nothing}
    </div>`;
  }

  /** The `field = value` pairs a granted action is pinned to — folded away until it is asked for. */
  private renderLimits(g: Grant) {
    const k = grantKey(g);
    const id = k.replace(/[^A-Za-z0-9]+/g, '-');
    const rows = this.limitRows(g);
    const saving = this.savingLimits === k;
    return html`<div class="limits">
      <span class="hint">${this.t('ui.grantLimitsIntro')}</span>
      <!-- «Only this customer» cannot be a fixed value: the permission is stored once and the
           customer changes with every conversation, so the limit has to name what the automation
           itself resolved (flows#108). Without this line that is unsayable from the screen. -->
      <span class="hint">${this.t('ui.grantLimitsRef')}</span>
      ${rows.length
        ? nothing
        : html`<span class="muted">${this.t('ui.grantLimitsNone')}</span>`}
      ${rows.map(
        ([field, value], i) => html`<div class="param-row">
          <div class="field">
            <label for="pf-${id}-${i}">${this.t('ui.grantLimitField')}</label>
            <input
              id="pf-${id}-${i}"
              data-field="pin-name"
              data-testid=${`flows-editor-limit-name-${k}`}
              type="text"
              .value=${field}
              @change=${(e: Event) =>
                this.setLimitRows(
                  g,
                  rows.map((r, j) =>
                    j === i ? [(e.target as HTMLInputElement).value.trim(), r[1]] : r,
                  ),
                )}
            />
          </div>
          <div class="field">
            <label for="pv-${id}-${i}">${this.t('ui.grantLimitValue')}</label>
            <input
              id="pv-${id}-${i}"
              data-field="pin-value"
              data-testid=${`flows-editor-limit-value-${k}`}
              type="text"
              .value=${value}
              @change=${(e: Event) =>
                this.setLimitRows(
                  g,
                  rows.map((r, j) => (j === i ? [r[0], (e.target as HTMLInputElement).value] : r)),
                )}
            />
          </div>
          <button
            type="button"
            class="icon-btn"
            data-act="remove-limit"
            data-testid=${`flows-editor-limit-remove-${k}`}
            aria-label=${this.t('ui.grantLimitRemove', { field: field || this.t('ui.grantLimitField') })}
            @click=${() => this.setLimitRows(g, rows.filter((_, j) => j !== i))}
          >
            ×
          </button>
        </div>`,
      )}
      <div class="adders" style="margin-left:0">
        <button
          type="button"
          data-act="add-limit"
          data-testid=${`flows-editor-limit-add-${k}`}
          @click=${() => this.setLimitRows(g, [...rows, ['', '']])}
        >
          ${this.t('ui.grantLimitAdd')}
        </button>
        <button
          type="button"
          data-act="save-limits"
          data-testid=${`flows-editor-limit-save-${k}`}
          ?disabled=${saving}
          @click=${() => void this.saveLimits(g)}
        >
          ${saving ? this.t('ui.saving') : this.t('ui.grantLimitsSave')}
        </button>
      </div>
    </div>`;
  }

  /**
   * **«Probar»: what this flow would do with the owner's own data — and it does none of it.**
   *
   * The two things flows#2 originally asked for were changes to the KERNEL, and the kernel is
   * frozen (ADR-0283). Checked against the code, not assumed: `POST …/flows/{id}/run` executes for
   * real (a «probar» that charged a test sale is worse than no button at all) and there is no
   * dry-run parameter anywhere in the runtime or the server. Nor is there any endpoint that
   * returns a real event payload — ADR-0312 refuses that on purpose, because handing a marketplace
   * module the last N payloads of any event is exporting the customer book with an editor on top.
   *
   * So this screen asks the hub for NOTHING beyond the event shape the picker already loads, and
   * runs the walk in {@link simulate}. Every sentence on it is about what WOULD happen.
   */
  private renderPreview() {
    const built = inputFromShape(this.shape);
    const run = simulate(this.document, built.input);
    const missing = missingGrants(this.document, this.grants);
    const byId = new Map(this.document.steps.map((s) => [s.id, s]));

    return html`<div class="preview">
      <!-- First thing on the screen, and it stays there while it is read. Every other automation
           tool's «test» button runs the automation; an owner has every reason to assume this one
           does too, and the assumption is only expensive in one direction. -->
      <ok-inline-feedback
        tone="info"
        icon="eye-outline"
        data-testid="flows-editor-preview-info"
        >${this.t('ui.testNothingHappened')}</ok-inline-feedback
      >
      ${!built.hasRealData
        ? html`<ok-inline-feedback
            tone="warning"
            icon="help-circle-outline"
            data-testid="flows-editor-preview-no-real-data"
            >${this.t('ui.testNoRealData')}</ok-inline-feedback
          >`
        : html`<span class="hint"
            >${this.t('ui.testUsingReal', {
              event: this.eventLabel(this.trigger.event),
              count: this.shape?.samples ?? 0,
            })}</span
          >`}
      ${run.blanks
        ? html`<ok-inline-feedback
            tone="warning"
            icon="alert-circle-outline"
            data-testid="flows-editor-preview-blanks"
            >${this.t(
              run.blanks === 1 ? 'ui.testBlanksFoundOne' : 'ui.testBlanksFound',
              { count: run.blanks },
            )}</ok-inline-feedback
          >`
        : nothing}
      ${!run.triggerMatched
        ? html`<div class="pstep" data-outcome="trigger-blocked">
            <span class="title">${this.t('ui.testTriggerBlocked')}</span>
            ${this.renderFailedClauses(run.triggerCondition)}
          </div>`
        : nothing}
      ${run.steps.map((step) => {
        const spec = byId.get(step.id);
        // The permission this step needs and does not hold. It is the likeliest real failure and
        // the cheapest one to catch here: without it the flow dies at `flow.grant_denied` and
        // nothing on any screen connects that to the step that caused it.
        const refused =
          step.outcome === 'would-run' && spec
            ? missing.filter((g) => grantsForStep(spec).some((need) => need === `${g.kind} ${g.value}`))
            : [];
        return html`<div
          class="pstep"
          data-node-outcome=${step.id}
          data-outcome=${step.outcome}
        >
          <span class="title">${spec ? describeStep(spec, this.t) : step.kind}</span>
          ${step.outcome === 'stops-here'
            ? html`<span class="verdict">${this.t('ui.testStoppedIsWorking')}</span>`
            : nothing}
          ${step.outcome === 'not-reached'
            ? html`<span class="muted">${this.t('ui.testNotReached')}</span>`
            : nothing}
          ${step.outcome === 'skipped'
            ? html`<span class="muted">${this.t('ui.testSkipped')}</span>`
            : nothing}
          ${step.pauses ? html`<span class="verdict">${this.t('ui.testPausesHere')}</span>` : nothing}
          ${step.maySkip ? html`<span class="verdict">${this.t('ui.testMaySkip')}</span>` : nothing}
          ${step.condition?.uncertain
            ? html`<span class="verdict">${this.t('ui.testUncertain')}</span>`
            : nothing}
          ${step.outcome === 'stops-here' ? this.renderFailedClauses(step.condition) : nothing}
          ${step.outcome === 'skipped' ? this.renderFailedClauses(step.runIf) : nothing}
          ${step.values.map(
            (value) => html`<div class="pvalue" data-blank=${value.blank ? 'true' : 'false'}>
              <span class="pkey">${value.label}</span>
              <!-- The rendered line comes FIRST, even with a hole in it. «Gracias, Marta Ruiz. Te
                   esperamos en ␣» is what makes the fault obvious at a glance; replacing the whole
                   value with the words «would arrive empty» hides WHICH half went missing, which
                   is the only part the owner can act on. -->
              ${value.text ? html`<span class="pval">${value.text}</span>` : nothing}
              ${value.blank
                ? html`<span class="bad">${this.t('ui.testBlank')}</span>`
                : value.redacted
                  ? html`<span class="muted">${this.t('ui.testHidden')}</span>`
                  : value.unknown
                    ? html`<span class="muted">${this.t('ui.testUnknown')}</span>`
                    : nothing}
            </div>`,
          )}
          ${refused.length
            ? html`<span class="bad"
                >${this.t('ui.testWouldBeRefused', {
                  what: refused.map((g) => g.value).join(', '),
                })}</span
              >`
            : nothing}
        </div>`;
      })}
    </div>`;
  }

  private renderFailedClauses(condition: ConditionResult | undefined) {
    if (!condition?.failed.length) return nothing;
    return html`<ul class="clauses">
      ${condition.failed.map(
        (clause) => html`<li>
          ${this.t('ui.testClauseFailed', {
            field: this.fieldLabel(clause.path),
            op: this.t(`ui.op${clause.op.charAt(0).toUpperCase()}${clause.op.slice(1)}`),
            expected: String(clause.expected),
          })}
        </li>`,
      )}
    </ul>`;
  }

  private async toggleRun(runId: string): Promise<void> {
    if (this.runSteps[runId] || !this.client) return;
    try {
      const detail = (await this.client.flows.getRun(runId)) as { steps?: RunStepRow[] };
      this.runSteps = { ...this.runSteps, [runId]: detail?.steps ?? [] };
    } catch {
      this.runSteps = { ...this.runSteps, [runId]: [] };
    }
  }

  private when(iso: string | undefined | null): string {
    if (!iso) return '';
    const date = new Date(iso);
    if (Number.isNaN(date.getTime())) return String(iso);
    return date.toLocaleString(this.client?.locale || 'es', {
      day: 'numeric',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit',
    });
  }

  /**
   * What went wrong, said in the owner's words, with the next thing to do — and the kernel's own
   * sentence folded away underneath.
   *
   * The order is the whole point of flows#20: `step s2 failed: flow.grant_denied` is accurate and
   * useless to the person reading it hours later. A code as the headline is what makes somebody
   * phone support about a problem they could have fixed in two taps.
   */
  private renderTrouble(run: RunRow) {
    const trouble = classify(run.last_error);
    if (trouble.kind === 'none') return nothing;
    return html`<div class="trouble" data-trouble=${trouble.kind}>
      <!-- An unclassified error is a refusal from the module whose command ran («no hay stock
           suficiente»). That sentence is the actionable one, so it stays as the headline rather
           than being replaced by a generic story about a problem we do not understand. -->
      <span class="why"
        >${trouble.messageKey
          ? this.t(trouble.messageKey)
          : this.t('ui.ranFailed', { reason: trouble.technical })}</span
      >
      ${trouble.actionKey
        ? html`<span class="do">${this.t(trouble.actionKey)}</span>`
        : nothing}
      ${trouble.messageKey
        ? html`<details>
            <summary data-testid=${`flows-editor-run-trouble-${String(run.id ?? '')}`}>
              ${this.t('ui.troubleTechnical')}
            </summary>
            <code>${trouble.technical}</code>
          </details>`
        : nothing}
    </div>`;
  }

  private renderRun(run: RunRow) {
    const outcome = runOutcome(run, this.t);
    const steps = this.runSteps[String(run.id)];
    const byId = new Map(this.document.steps.map((s) => [s.id, s]));
    return html`<div class="run" data-run=${String(run.id ?? '')}>
      <div class="row" style="padding:0;gap:.5rem">
        <ok-status-pill tone=${outcome.tone} label=${outcome.label}></ok-status-pill>
        <span class="grow muted">${this.when(run.started_at ?? run.created_at)}</span>
        <!-- The reference, one tap away. It is the only thread that ties what the owner saw to
             what a log holds, and reading a uuid down a telephone is not a support channel. -->
        <button
          type="button"
          class="icon-btn"
          data-act="copy-run"
          data-testid=${`flows-editor-run-copy-${String(run.id ?? '')}`}
          aria-label=${this.t('ui.runCopyId')}
          title=${this.t('ui.runCopyId')}
          @click=${() => void this.copyRunId(String(run.id ?? ''))}
        >
          ⧉
        </button>
        <button
          type="button"
          class="icon-btn"
          data-act="open-run"
          data-testid=${`flows-editor-run-open-${String(run.id ?? '')}`}
          aria-expanded=${steps ? 'true' : 'false'}
          @click=${() => void this.toggleRun(String(run.id))}
        >
          ▾
        </button>
      </div>
      ${this.renderTrouble(run)}
      ${steps
        ? html`<ul>
            ${steps.map(
              (s) => html`<li>
                ${describeRunStep(s, this.t, byId.get(String(s.step_id)))}
                ${stepSeconds(s) !== undefined
                  ? html`<span class="muted"> · ${this.t('ui.runTook', { seconds: stepSeconds(s) })}</span>`
                  : nothing}
              </li>`,
            )}
          </ul>`
        : nothing}
    </div>`;
  }

  /**
   * The history, with **what is asking for somebody at the top**.
   *
   * A failure four rows down a list ordered by time is a failure nobody sees: the runs that worked
   * are the majority and they push it off the screen. Splitting the list is the cheapest version of
   * the tray flows#20 asks for that this module can actually build — the kernel's dead-letter has
   * no method on the flows surface at all (no retry, no discard, nothing to call), so a tray with
   * buttons would be a drawing of one.
   */
  private renderHistory() {
    if (!this.runs.length) {
      return html`<div class="list"><span class="muted">${this.t('ui.historyEmpty')}</span></div>`;
    }
    const broken = this.runs.filter(needsAttention);
    const rest = this.runs.filter((run) => !needsAttention(run));
    return html`<div class="list">
      ${broken.length
        ? html`<div data-attention>
            <h4 class="section">${this.t('ui.attentionTitle')}</h4>
            <span class="muted">${this.t('ui.attentionCount', { count: broken.length })}</span>
            ${broken.map((run) => this.renderRun(run))}
          </div>`
        : nothing}
      ${rest.map((run) => this.renderRun(run))}
    </div>`;
  }

  /** Puts the run's reference on the clipboard. A refusal costs the copy, never the screen. */
  private async copyRunId(id: string): Promise<void> {
    if (!id) return;
    try {
      await navigator.clipboard?.writeText(id);
      this.notice = this.t('ui.runCopied');
    } catch {
      // No clipboard (an old webview, a denied permission): the id is still on screen to read.
    }
  }

  render() {
    return html`
      <div class="head">
        <button
          type="button"
          class="icon-btn"
          aria-label=${this.t('ui.back')}
          data-testid="flows-editor-back"
          @click=${() =>
            this.dispatchEvent(new CustomEvent('flows-back', { bubbles: true, composed: true }))}
        >
          ←
        </button>
        <input
          class="name"
          type="text"
          data-testid="flows-editor-name"
          .value=${this.name}
          title=${this.name || nothing}
          placeholder=${this.t('ui.unnamed')}
          @input=${(e: Event) => {
            this.name = (e.target as HTMLInputElement).value;
          }}
        />
        <ok-status-pill
          tone=${this.enabled ? 'success' : 'neutral'}
          label=${this.enabled ? this.t('ui.active') : this.t('ui.paused')}
        ></ok-status-pill>
        <!-- The pill beside it is not tied to it: the switch carries its own name (flows#140). -->
        <ion-toggle
          data-testid="flows-editor-enabled"
          aria-label=${this.t('ui.enableAutomation')}
          .checked=${this.enabled}
          @ionChange=${(e: Event) => this.onEnable(!!(e.target as HTMLInputElement).checked)}
        ></ion-toggle>
        <!-- «Probar» sits with the switch on purpose: it is the thing to press BEFORE turning an
             automation on, and a button on another tab is one nobody presses first. -->
        <ion-button
          size="small"
          fill="outline"
          data-act="test"
          data-testid="flows-editor-test"
          @click=${() => {
            this.tab = 'test';
          }}
        >
          ${this.t('ui.testRun')}
        </ion-button>
        <ion-button
          size="small"
          data-testid="flows-editor-save"
          ?disabled=${this.saving}
          @click=${() => void this.save()}
        >
          ${this.saving ? this.t('ui.saving') : this.t('ui.save')}
        </ion-button>
      </div>

      <div class="tabs" role="tablist" @keydown=${(e: KeyboardEvent) => this.onTabKey(e)}>
        ${TABS.map(
          (tab) => html`<button
            type="button"
            role="tab"
            id=${`tab-${tab}`}
            aria-controls="tabpanel"
            aria-selected=${this.tab === tab ? 'true' : 'false'}
            tabindex=${this.tab === tab ? '0' : '-1'}
            data-testid=${`flows-editor-tab-${tab}`}
            @click=${() => {
              this.tab = tab;
            }}
          >
            ${this.t(`ui.tab${tab.charAt(0).toUpperCase()}${tab.slice(1)}`)}
          </button>`,
        )}
      </div>

      <div class="body" role="tabpanel" id="tabpanel" aria-labelledby=${`tab-${this.tab}`}>
        ${this.error
          ? html`<ok-inline-feedback
              tone="danger"
              icon="alert-circle-outline"
              data-testid="flows-editor-form-error"
              >${this.error}</ok-inline-feedback
            >`
          : nothing}
        ${this.notice
          ? html`<ok-inline-feedback
              tone="success"
              icon="checkmark-circle-outline"
              data-testid="flows-editor-notice"
              >${this.notice}</ok-inline-feedback
            >`
          : nothing}
        ${this.enableWarning
          ? html`<ok-inline-feedback
              tone="warning"
              icon="alert-circle-outline"
              data-enable-warning
              data-testid="flows-editor-enable-warning"
              >${this.enableWarning}</ok-inline-feedback
            >`
          : nothing}
        ${this.renderDraftBanner()}
        ${this.tab === 'editor'
          ? this.renderSpine()
          : this.tab === 'test'
            ? this.renderPreview()
            : this.tab === 'permissions'
              ? this.renderPermissions()
              : this.renderHistory()}
      </div>

      <erp-flows-field-picker
        data-testid="flows-editor-field-picker"
        .open=${this.pickerOpen}
        .shape=${this.shape}
        .root=${this.pickerRoot}
        .eventLabel=${this.eventLabel(this.trigger.event)}
        .t=${this.t}
        @flows-field-picked=${(e: Event) => this.onFieldPicked(e as CustomEvent<{ path: string }>)}
        @flows-picker-close=${() => {
          this.pickerOpen = false;
        }}
      ></erp-flows-field-picker>
    `;
  }
}

define('erp-flows-editor', ErpFlowsEditor);

declare global {
  interface HTMLElementTagNameMap {
    'erp-flows-editor': ErpFlowsEditor;
  }
}
