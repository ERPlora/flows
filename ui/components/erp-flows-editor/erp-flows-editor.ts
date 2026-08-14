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
  HTTP_METHODS,
  MAX_ITERS_CAP,
  MAX_TIMEOUT_SECONDS,
  NOTIFY_CHANNELS,
  OPERATORS,
  addStep,
  emptyDoc,
  missingGrants,
  mergeGrants,
  moveStep,
  partsToTemplate,
  partsToValue,
  patchStep,
  patchTrigger,
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
  Operator,
  Recipient,
  Step,
  StepKind,
  Trigger,
  ValuePart,
} from '../../lib/flow-doc';
import {
  dailyCron,
  describeDelay,
  describeStep,
  describeRunStep,
  humaniseField,
  readDailyCron,
  runOutcome,
} from '../../lib/plain-language';
import type { RunRow, RunStepRow, Translator } from '../../lib/plain-language';
import { TRIGGER_CATALOG, catalogEntry } from '../../lib/trigger-catalog';
import { inputFromShape, simulate } from '../../lib/simulate';
import type { ConditionResult } from '../../lib/simulate';
import { errorCode } from '../../lib/hub-flows';
import type { EventShape, Flow, ModuleClient, SecretInfo } from '../../lib/hub-flows';
import type { DraftGap } from '../../lib/ai-draft';

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
function clamp(value: number, min: number, max: number, fallback: number): number {
  if (!Number.isFinite(value)) return fallback;
  return Math.min(max, Math.max(min, Math.round(value)));
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
    .guard-row {
      display: grid;
      grid-template-columns: 1fr;
      gap: 0.4rem;
      align-items: end;
      padding-bottom: 0.5rem;
      border-bottom: 1px solid var(--ok-border-soft, rgba(0, 0, 0, 0.06));
    }
    @media (min-width: 560px) {
      .guard-row {
        grid-template-columns: 1.2fr 0.9fr 1.2fr auto;
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
    .pstep[data-outcome='not-reached'] {
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
    }
    .grant .grow {
      flex: 1 1 auto;
      min-width: 0;
      overflow-wrap: anywhere;
    }
    .run {
      border: 1px solid var(--ok-border, #d7d5cc);
      border-radius: var(--ok-radius-sm, 10px);
      background: var(--ok-surface, #fff);
      padding: 0.6rem 0.7rem;
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

  @state() enabled = true;

  /**
   * Which tab is showing. A **property**, not internal state: a flow created from a template opens
   * on `permissions`, because until it holds a grant it does nothing at all and says nothing.
   */
  @property({ attribute: false }) tab: 'editor' | 'test' | 'permissions' | 'history' = 'editor';

  @state() private openStep: string | null = null;

  @state() private grants: Grant[] = [];

  @state() private runs: RunRow[] = [];

  @state() private runSteps: Record<string, RunStepRow[]> = {};

  @state() private shape: EventShape | null = null;

  /** The secret NAMES this hub holds. Never a value: no endpoint returns one (ADR-0283 §4). */
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

  /** `event` inside the trigger's own filter, `input` everywhere downstream. */
  @state() private pickerRoot: 'input' | 'event' = 'input';

  willUpdate(changed: Map<string, unknown>): void {
    if (changed.has('flow')) {
      this.document = this.flow ? readDoc(this.flow.definition) : emptyDoc();
      this.name = this.flow?.name ?? '';
      this.enabled = this.flow?.enabled ?? true;
      this.error = '';
      this.notice = '';
      this.runs = [];
      this.grants = [];
      void this.loadGrants();
      void this.loadShape();
    }
  }

  updated(changed: Map<string, unknown>): void {
    if (changed.has('tab') && this.tab === 'history') void this.loadRuns();
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

  private async loadShape(): Promise<void> {
    const event = this.trigger.kind === 'event' ? this.trigger.event : '';
    if (!event || !this.client) {
      this.shape = null;
      return;
    }
    try {
      this.shape = await this.client.events.shape(event);
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
    this.setDoc(patchTrigger(this.document, { ...this.trigger, ...patch } as Trigger));
    void this.loadShape();
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
    humaniseField(path.replace(/^(input|event|steps)\./, ''));

  private eventLabel(event: string | undefined): string {
    const entry = event ? catalogEntry(event) : undefined;
    return entry ? this.t(entry.labelKey) : (event ?? '');
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
      <ok-inline-feedback tone="warning" icon="sparkles-outline" data-draft-banner>
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
            @click=${() => {
              this.openStep = open ? null : 'trigger';
            }}
          >
            <span class="grow">
              <span class="eyebrow">${this.t('ui.whenThisHappens')}</span>
              <span class="title"
                >${trigger.kind === 'event'
                  ? this.t('ui.triggerEvent', { event: this.eventLabel(trigger.event) })
                  : trigger.kind === 'cron'
                    ? readDailyCron(trigger.cron ?? '')
                      ? this.t('ui.triggerDaily', { time: readDailyCron(trigger.cron ?? '') })
                      : this.t('ui.triggerCron', { cron: trigger.cron ?? '' })
                    : trigger.kind === 'at'
                      ? this.t('ui.triggerAt', { when: trigger.at ?? '' })
                      : this.t('ui.triggerManual')}</span
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
      ${trigger.kind === 'cron'
        ? html`<div class="field">
            <label for="trigger-time">${this.t('ui.timeLabel')}</label>
            <input
              id="trigger-time"
              type="time"
              .value=${readDailyCron(trigger.cron ?? '') ?? ''}
              @change=${(e: Event) =>
                this.setTrigger({ cron: dailyCron((e.target as HTMLInputElement).value || '09:00') })}
            />
            <span class="hint">${this.t('ui.cronLabel')}: ${trigger.cron ?? ''}</span>
          </div>`
        : nothing}
      ${trigger.kind === 'at'
        ? html`<div class="field">
            <label for="trigger-at">${this.t('ui.atLabel')}</label>
            <input
              id="trigger-at"
              type="datetime-local"
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

  private renderEventChoice(trigger: Trigger) {
    const chosen = trigger.event ?? '';
    return html`
      <div class="field">
        <label for="trigger-event">${this.t('ui.eventPick')}</label>
        <select
          id="trigger-event"
          .value=${chosen}
          @change=${(e: Event) => this.setTrigger({ event: (e.target as HTMLSelectElement).value })}
        >
          <option value="">—</option>
          ${TRIGGER_CATALOG.map((entry) => option(entry.event, this.t(entry.labelKey), chosen))}
          ${chosen && !catalogEntry(chosen) ? option(chosen, chosen, chosen) : nothing}
        </select>
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
    return this.renderCommandPanel(step, index);
  }

  /**
   * One composed value, wired to the shared field picker — and, inside an `http` step, to the
   * secrets this hub holds.
   *
   * `template` forces `{{…}}` even for a lone field: `url` is a string in the schema, so the
   * type-preserving rule that is right everywhere else is wrong there.
   */
  private renderValue(opts: {
    field: string;
    label: string;
    value: unknown;
    template?: boolean;
    secrets?: boolean;
    onChange: (value: unknown) => void;
  }) {
    const write = (parts: ValuePart[]): void =>
      opts.onChange(opts.template ? partsToTemplate(parts) : partsToValue(parts));
    return html`<div class="value-row">
      <erp-flows-value
        data-field=${opts.field}
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
            aria-label=${this.t('ui.removePart', { label: key })}
            @click=${() => setHeaders(headers.filter((_, j) => j !== i))}
          >
            ×
          </button>
        </div>`,
      )}
      <div class="adders" style="margin-left:0">
        <button type="button" data-act="add-header" @click=${() => setHeaders([...headers, ['', '']])}>
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
        ? html`<ok-inline-feedback tone="warning" icon="alert-circle-outline"
            >${this.t('ui.aiPolicyAutoWarning')}</ok-inline-feedback
          >`
        : html`<span class="hint">${this.t('ui.aiPolicyManualHint')}</span>`}

      <div class="field">
        <label for="i-${step.id}">${this.t('ui.aiMaxIters')}</label>
        <input
          id="i-${step.id}"
          data-field="max-iters"
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
            aria-label=${this.t('ui.removePart', { label: name })}
            @click=${() => update(names.filter((_, j) => j !== i))}
          >
            ×
          </button>
        </div>`,
      )}
      <div class="adders" style="margin-left:0">
        <button type="button" data-act="add-${what}" @click=${() => update([...names, ''])}>
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
    return html`
      <div class="field">
        <label for="ch-${step.id}">${this.t('ui.notifyChannel')}</label>
        <select
          id="ch-${step.id}"
          data-field="channel"
          .value=${String(step.channel ?? 'email')}
          @change=${(e: Event) =>
            this.setDoc(
              patchStep(this.document, index, {
                channel: (e.target as HTMLSelectElement).value as 'email' | 'whatsapp',
              }),
            )}
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
        ? html`<ok-inline-feedback tone="warning" icon="cash-outline"
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
            type="text"
            .value=${to.field ?? ''}
            @change=${(e: Event) => setTo({ field: (e.target as HTMLInputElement).value.trim() })}
          />
        </div>
      </div>

      <div class="field">
        <label for="tp-${step.id}">${this.t('ui.notifyTemplate')}</label>
        <input
          id="tp-${step.id}"
          data-field="template"
          type="text"
          .value=${String(step.template ?? '')}
          @change=${(e: Event) =>
            this.setDoc(
              patchStep(this.document, index, { template: (e.target as HTMLInputElement).value }),
            )}
        />
        <span class="hint">${this.t('ui.notifyTemplateHint')}</span>
      </div>

      ${this.renderValue({
        field: 'var-text',
        label: this.t('ui.notifyText'),
        value: vars.text ?? '',
        onChange: (text) => setVar('text', text),
      })}
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

  private renderGuardPanel(step: Step, index: number) {
    const rows = guardRows(step.when);
    const update = (next: GuardRow[]): void =>
      this.setDoc(patchStep(this.document, index, { when: rowsToWhen(next) }));
    return html`
      <span class="hint">${this.t('ui.guardExplain')}</span>
      ${rows.map(
        (row, i) => html`<div class="guard-row">
          <div class="field">
            <label>${this.t('ui.field')}</label>
            <input
              type="text"
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
            <input
              type="text"
              .value=${row.value}
              @change=${(e: Event) =>
                update(
                  rows.map((r, j) =>
                    j === i ? { ...r, value: (e.target as HTMLInputElement).value } : r,
                  ),
                )}
            />
            ${row.op === 'in' ? html`<span class="hint">${this.t('ui.opInHint')}</span>` : nothing}
          </div>
          <button
            type="button"
            class="icon-btn"
            aria-label=${this.t('ui.removeCondition')}
            @click=${() => update(rows.filter((_, j) => j !== i))}
          >
            ×
          </button>
        </div>`,
      )}
      <div class="adders" style="margin-left:0">
        <button
          type="button"
          @click=${() => update([...rows, { path: '', op: 'eq' as Operator, value: '' }])}
        >
          ${this.t('ui.addCondition')}
        </button>
      </div>
    `;
  }

  private renderCommandPanel(step: Step, index: number) {
    const params = Object.entries(step.params ?? {});
    const setParams = (entries: [string, unknown][]): void =>
      this.setDoc(patchStep(this.document, index, { params: Object.fromEntries(entries) }));
    return html`
      <div class="field">
        <label for="c-${step.id}">${this.t('ui.commandLabel')}</label>
        <input
          id="c-${step.id}"
          type="text"
          .value=${String(step.command ?? '')}
          @change=${(e: Event) =>
            this.setDoc(
              patchStep(this.document, index, { command: (e.target as HTMLInputElement).value.trim() }),
            )}
        />
        <span class="hint">${this.t('ui.commandHint')}</span>
      </div>
      <span class="eyebrow">${this.t('ui.paramsTitle')}</span>
      ${params.map(
        ([key, value], i) => html`<div class="param-row">
          <div class="field">
            <label>${this.t('ui.paramName')}</label>
            <input
              type="text"
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
            aria-label=${this.t('ui.removePart', { label: key })}
            @click=${() => setParams(params.filter((_, j) => j !== i))}
          >
            ×
          </button>
        </div>`,
      )}
      <div class="adders" style="margin-left:0">
        <button type="button" @click=${() => setParams([...params, ['', '']])}>
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
        <!-- Order is by how often a shop owner reaches for one, not by the kernel's enum. The ai one is
             last because it is the one that costs money and the one that needs the most reading. -->
        <div class="adders">
          ${(
            [
              ['command', 'ui.addCommand'],
              ['condition', 'ui.addGuard'],
              ['delay', 'ui.addDelay'],
              ['notify', 'ui.addNotify'],
              ['http', 'ui.addHttp'],
              ['ai', 'ui.addAi'],
            ] as const
          ).map(
            ([kind, label]) => html`<button
              type="button"
              data-add=${kind}
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
      ${this.grants.map(
        (g) => html`<div class="grant">
          <ok-status-pill tone="success" label=${this.t('ui.grantsGranted')}></ok-status-pill>
          <span class="grow">${g.kind === 'command' ? g.value : this.t('ui.grantOther', g)}</span>
          <button type="button" class="icon-btn" @click=${() => void this.revoke(g)}>
            ${this.t('ui.revoke')}
          </button>
        </div>`,
      )}
      ${!missing.length && !this.grants.length
        ? html`<span class="muted">${this.t('ui.grantsNone')}</span>`
        : nothing}
      ${missing.length
        ? html`<div class="adders" style="margin-left:0">
            <button type="button" @click=${() => void this.grantAll()}>${this.t('ui.grantAll')}</button>
          </div>`
        : nothing}
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
      <ok-inline-feedback tone="info" icon="eye-outline"
        >${this.t('ui.testNothingHappened')}</ok-inline-feedback
      >
      ${!built.hasRealData
        ? html`<ok-inline-feedback tone="warning" icon="help-circle-outline"
            >${this.t('ui.testNoRealData')}</ok-inline-feedback
          >`
        : html`<span class="hint"
            >${this.t('ui.testUsingReal', {
              event: this.eventLabel(this.trigger.event),
              count: this.shape?.samples ?? 0,
            })}</span
          >`}
      ${run.blanks
        ? html`<ok-inline-feedback tone="warning" icon="alert-circle-outline"
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
          ${step.condition?.uncertain
            ? html`<span class="verdict">${this.t('ui.testUncertain')}</span>`
            : nothing}
          ${step.outcome === 'stops-here' ? this.renderFailedClauses(step.condition) : nothing}
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

  private renderHistory() {
    if (!this.runs.length) {
      return html`<div class="list"><span class="muted">${this.t('ui.historyEmpty')}</span></div>`;
    }
    const byId = new Map(this.document.steps.map((s) => [s.id, s]));
    return html`<div class="list">
      ${this.runs.map((run) => {
        const outcome = runOutcome(run, this.t);
        const steps = this.runSteps[String(run.id)];
        return html`<div class="run">
          <div class="row" style="padding:0;gap:.5rem">
            <ok-status-pill tone=${outcome.tone} label=${outcome.label}></ok-status-pill>
            <span class="grow muted">${this.when(run.started_at ?? run.created_at)}</span>
            <button type="button" class="icon-btn" @click=${() => void this.toggleRun(String(run.id))}>
              ▾
            </button>
          </div>
          <!-- The reason goes on the ROW, not behind the chevron. «Se paró por un error» with the
               error one click away is the shape of a screen that makes somebody phone support. -->
          ${run.status === 'failed' && run.last_error
            ? html`<div class="muted" style="font-size:.85rem">
                ${this.t('ui.ranFailed', { reason: run.last_error })}
              </div>`
            : nothing}
          ${steps
            ? html`<ul>
                ${steps.map(
                  (s) => html`<li>${describeRunStep(s, this.t, byId.get(String(s.step_id)))}</li>`,
                )}
              </ul>`
            : nothing}
        </div>`;
      })}
    </div>`;
  }

  render() {
    return html`
      <div class="head">
        <button
          type="button"
          class="icon-btn"
          aria-label=${this.t('ui.back')}
          @click=${() =>
            this.dispatchEvent(new CustomEvent('flows-back', { bubbles: true, composed: true }))}
        >
          ←
        </button>
        <input
          class="name"
          type="text"
          .value=${this.name}
          placeholder=${this.t('ui.unnamed')}
          @input=${(e: Event) => {
            this.name = (e.target as HTMLInputElement).value;
          }}
        />
        <ok-status-pill
          tone=${this.enabled ? 'success' : 'neutral'}
          label=${this.enabled ? this.t('ui.active') : this.t('ui.paused')}
        ></ok-status-pill>
        <ion-toggle
          .checked=${this.enabled}
          @ionChange=${(e: Event) => {
            this.enabled = !!(e.target as HTMLInputElement).checked;
          }}
        ></ion-toggle>
        <!-- «Probar» sits with the switch on purpose: it is the thing to press BEFORE turning an
             automation on, and a button on another tab is one nobody presses first. -->
        <ion-button
          size="small"
          fill="outline"
          data-act="test"
          @click=${() => {
            this.tab = 'test';
          }}
        >
          ${this.t('ui.testRun')}
        </ion-button>
        <ion-button size="small" ?disabled=${this.saving} @click=${() => void this.save()}>
          ${this.saving ? this.t('ui.saving') : this.t('ui.save')}
        </ion-button>
      </div>

      <div class="tabs" role="tablist">
        ${(['editor', 'test', 'permissions', 'history'] as const).map(
          (tab) => html`<button
            type="button"
            role="tab"
            aria-selected=${this.tab === tab ? 'true' : 'false'}
            @click=${() => {
              this.tab = tab;
            }}
          >
            ${this.t(`ui.tab${tab.charAt(0).toUpperCase()}${tab.slice(1)}`)}
          </button>`,
        )}
      </div>

      <div class="body">
        ${this.error
          ? html`<ok-inline-feedback tone="danger" icon="alert-circle-outline"
              >${this.error}</ok-inline-feedback
            >`
          : nothing}
        ${this.notice
          ? html`<ok-inline-feedback tone="success" icon="checkmark-circle-outline"
              >${this.notice}</ok-inline-feedback
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
