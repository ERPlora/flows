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
  OPERATORS,
  addStep,
  emptyDoc,
  missingGrants,
  mergeGrants,
  moveStep,
  partsToValue,
  patchStep,
  patchTrigger,
  readDoc,
  removeStep,
  valueToParts,
  isSpineKind,
} from '../../lib/flow-doc';
import type { Condition, FlowDoc, Grant, Operator, Step, StepKind, Trigger } from '../../lib/flow-doc';
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
import { errorCode } from '../../lib/hub-flows';
import type { EventShape, Flow, ModuleClient } from '../../lib/hub-flows';

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
 * A step this editor cannot edit yet (`http`, `ai`, `notify`) still OPENS, read-only, and is saved
 * back untouched. Rendering a document without a step and then writing it back is how a working
 * automation gets silently deleted.
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
  `;

  @property({ attribute: false }) client: ModuleClient | null = null;

  /** `null` means «a flow that does not exist yet»: saving CREATES instead of updating. */
  @property({ attribute: false }) flow: Flow | null = null;

  @property({ attribute: false }) t: Translator = (k) => k;

  @state() document: FlowDoc = emptyDoc();

  @state() name = '';

  @state() enabled = true;

  @state() tab: 'editor' | 'permissions' | 'history' = 'editor';

  @state() private openStep: string | null = null;

  @state() private grants: Grant[] = [];

  @state() private runs: RunRow[] = [];

  @state() private runSteps: Record<string, RunStepRow[]> = {};

  @state() private shape: EventShape | null = null;

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

  private async loadRuns(): Promise<void> {
    if (!this.flow?.id || !this.client) return;
    try {
      const page = await this.client.flows.runs(this.flow.id, { limit: 20 });
      this.runs = (page?.data ?? []) as RunRow[];
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

  private renderTriggerNode() {
    const trigger = this.trigger;
    const open = this.openStep === 'trigger';
    return html`<div class="node trigger" data-node="trigger">
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
          .value=${trigger.kind}
          @change=${(e: Event) =>
            this.setTrigger({ kind: (e.target as HTMLSelectElement).value as Trigger['kind'] })}
        >
          <option value="event">${this.t('ui.triggerKindEvent')}</option>
          <option value="cron">${this.t('ui.triggerKindCron')}</option>
          <option value="at">${this.t('ui.triggerKindAt')}</option>
          <option value="manual">${this.t('ui.triggerKindManual')}</option>
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
          ${TRIGGER_CATALOG.map(
            (entry) => html`<option value=${entry.event}>${this.t(entry.labelKey)}</option>`,
          )}
          ${chosen && !catalogEntry(chosen)
            ? html`<option value=${chosen}>${chosen}</option>`
            : nothing}
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
      return html`<div class="node segment" data-node=${step.id}>
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
      return html`<div class="node guard" data-node=${step.id}>
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

    const editable = isSpineKind(step.kind);
    return html`<div class="node" data-node=${step.id}>
      <div class="card">
        <div class="row" style="padding:0">
          ${handle}
          <button
            type="button"
            class="open"
            aria-expanded=${open ? 'true' : 'false'}
            @click=${() => {
              this.openStep = open ? null : step.id;
            }}
          >
            <span class="grow">
              <span class="eyebrow">${this.t('ui.thenDo')}</span>
              <span class="title">${describeStep(step, this.t)}</span>
            </span>
          </button>
          ${removeBtn}
        </div>
        ${open
          ? html`<div class="panel">
              ${editable
                ? this.renderCommandPanel(step, index)
                : html`<span class="hint">${this.t('ui.readOnlyStep')}</span>`}
            </div>`
          : nothing}
      </div>
    </div>`;
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
          <option value="60">${this.t('ui.unitMinutes')}</option>
          <option value="3600">${this.t('ui.unitHours')}</option>
          <option value="86400">${this.t('ui.unitDays')}</option>
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
              .value=${row.op}
              @change=${(e: Event) =>
                update(
                  rows.map((r, j) =>
                    j === i ? { ...r, op: (e.target as HTMLSelectElement).value as Operator } : r,
                  ),
                )}
            >
              ${OPERATORS.map(
                (op) =>
                  html`<option value=${op}>
                    ${this.t(`ui.op${op.charAt(0).toUpperCase()}${op.slice(1)}`)}
                  </option>`,
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
      </div>
      <div class="adders">
        <button type="button" @click=${() => this.add('command')}>${this.t('ui.addCommand')}</button>
        <button type="button" @click=${() => this.add('condition')}>${this.t('ui.addGuard')}</button>
        <button type="button" @click=${() => this.add('delay')}>${this.t('ui.addDelay')}</button>
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
        <ion-button size="small" ?disabled=${this.saving} @click=${() => void this.save()}>
          ${this.saving ? this.t('ui.saving') : this.t('ui.save')}
        </ion-button>
      </div>

      <div class="tabs" role="tablist">
        ${(['editor', 'permissions', 'history'] as const).map(
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
        ${this.tab === 'editor'
          ? this.renderSpine()
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
