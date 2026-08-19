import { LitElement, html, css, nothing } from 'lit';
import { property, state } from 'lit/decorators.js';
import { define } from '@erplora/outfitkit/define';
import '@erplora/outfitkit/ok-inline-feedback';
import {
  errorCode,
  type DeadEvent,
  type DiscardResult,
  type ModuleClient,
} from '../../lib/hub-flows';
import { classify } from '../../lib/run-trouble';
import type { Translator } from '../../lib/plain-language';

/**
 * How much of a reason the hub keeps (`outbox::MAX_DISCARD_REASON`). Written into the field so the
 * cut happens under the finger that types it, instead of silently in the row afterwards.
 */
const MAX_REASON = 500;

/**
 * The three answers that cover almost every closure, as one tap each.
 *
 * The market's own shape: a POS void, a refund, a cancelled order everywhere (Square, Toast,
 * Lightspeed, Odoo) is closed with a **reason code from a short list, plus optional free text** —
 * never with free text alone, because free text alone on a counter tablet means the field is left
 * empty. The list is short on purpose: a dropdown of fifteen is slower than typing.
 */
const REASON_PRESETS = ['ui.deadReasonDuplicate', 'ui.deadReasonHandled', 'ui.deadReasonObsolete'];

/**
 * **«Necesita atención» — the work that did NOT happen** (flows#20, on hub#953's surface).
 *
 * The hub's outbox delivers at-least-once and gives up after eight attempts. What is left is a
 * `dead` row: a reminder that never went out, an invoice that was never registered, a note nobody
 * wrote. **The business believes those happened.** The engine to see and rescue them has existed
 * since hub#660, and until hub#953 put the six gestures on `client.events` there was nothing a
 * module could call — so the only person who could find a lost invoice was one who knew `curl`.
 *
 * Four things this screen has to get right, and all four are about not lying:
 *
 * - **It never draws a button that cannot work.** The runtime decides `retryable` (hub#827). A row
 *   whose flow authorisation was withdrawn answers `409` and dies again for the same reason; the
 *   remedy for it is granting the permission and running the flow, so that is what it says instead.
 * - **A refusal keeps the row.** Removing it on a failed retry would tell the owner their invoice
 *   was re-sent when nothing moved — the one outcome a recovery tray must never produce.
 * - **Discarding is confirmed, and honest about what it records.** It is irreversible: the row
 *   stops counting, the relay never picks it up again. The hub takes WHO from the session and WHEN
 *   from the clock, and since hub#955 it also keeps **WHY** — the one part of the stamp nobody but
 *   the person closing the row can supply. So this screen asks for it (optional, one tap for the
 *   three answers people actually write) and then shows it back **as stored**, never as typed.
 * - **The technical text is not the headline.** The kernel's own codes get a sentence and a next
 *   step (`run-trouble.ts`); a refusal from the module that ran — «no hay stock suficiente» — is
 *   left exactly as it is, because that sentence is the actionable one. Either way the raw string
 *   survives under a fold, which is where support needs it.
 *
 * Mounted only when there is something in it (`erp-flows-app` asks first): a permanent empty box
 * headed «needs your attention» is furniture, and furniture is what people stop seeing.
 */
export class ErpFlowsDeadLetter extends LitElement {
  static styles = css`
    :host {
      display: block;
      font-family: var(--ok-font, var(--ion-font-family, system-ui), sans-serif);
      color: var(--ok-text, var(--ion-text-color, #1c1b18));
    }
    .list {
      max-width: 44rem;
      margin: 0 auto 1.25rem;
      display: flex;
      flex-direction: column;
      gap: 0.5rem;
    }
    .head {
      display: flex;
      align-items: baseline;
      flex-wrap: wrap;
      gap: 0.5rem;
    }
    h3.section {
      margin: 0;
      font-size: 0.78rem;
      letter-spacing: 0.05em;
      text-transform: uppercase;
      color: var(--ok-muted, #6b6a63);
      font-weight: 600;
    }
    .grow {
      flex: 1;
    }
    .card {
      background: var(--ok-surface, var(--ion-card-background, #fff));
      border: 1px solid var(--ok-border, var(--ion-border-color, #d7d5cc));
      border-radius: var(--ok-radius, 14px);
      padding: 0.7rem 0.75rem;
      display: flex;
      flex-direction: column;
      gap: 0.4rem;
    }
    .what {
      font-weight: 600;
      overflow-wrap: anywhere;
    }
    .why {
      font-size: 0.9rem;
      overflow-wrap: anywhere;
    }
    .meta {
      font-size: 0.8rem;
      color: var(--ok-muted, #6b6a63);
      display: flex;
      flex-wrap: wrap;
      gap: 0.4rem;
      align-items: center;
    }
    code {
      font-size: 0.8rem;
      overflow-wrap: anywhere;
    }
    /* The payload is the evidence, so it is complete — but it is a machine's words, so it is set
       apart and scrolls inside its own box instead of pushing the buttons off a phone. */
    pre {
      margin: 0;
      padding: 0.5rem 0.6rem;
      background: var(--ok-surface-muted, rgba(0, 0, 0, 0.04));
      border-radius: var(--ok-radius-sm, 10px);
      font-size: 0.82rem;
      max-height: 12rem;
      overflow: auto;
      white-space: pre-wrap;
      word-break: break-word;
    }
    details summary {
      cursor: pointer;
      font-size: 0.8rem;
      color: var(--ok-muted, #6b6a63);
    }
    .actions {
      display: flex;
      flex-wrap: wrap;
      gap: 0.4rem;
      align-items: center;
    }
    button {
      font: inherit;
      cursor: pointer;
      border-radius: var(--ok-radius-pill, 999px);
      /* A finger on the counter tablet, not a mouse. */
      min-height: 2.75rem;
      padding: 0 1rem;
      border: 1px solid var(--ok-border, #d7d5cc);
      background: var(--ok-surface, #fff);
      color: inherit;
    }
    button[data-act='retry'],
    button[data-act='retry-all'] {
      border-color: var(--ok-primary, #3880ff);
      color: var(--ok-primary, #3880ff);
      font-weight: 600;
    }
    button[data-act='discard-confirm'] {
      border-color: var(--ok-danger, #eb445a);
      color: var(--ok-danger, #eb445a);
      font-weight: 600;
    }
    button[data-act='copy'] {
      min-height: 2rem;
      padding: 0 0.6rem;
      font-size: 0.8rem;
    }
    .muted {
      color: var(--ok-muted, #6b6a63);
    }
    /* The confirmation grows a field, so it stops being a row of buttons and becomes a block. */
    .confirm {
      display: flex;
      flex-direction: column;
      gap: 0.4rem;
    }
    .presets {
      display: flex;
      flex-wrap: wrap;
      gap: 0.35rem;
    }
    /* One tap, and still a finger-sized target: these are the reason, not decoration. */
    button[data-act='reason-preset'] {
      font-size: 0.85rem;
      padding: 0 0.75rem;
    }
    input[data-field='discard-reason'] {
      font: inherit;
      min-height: 2.75rem;
      padding: 0 0.75rem;
      border: 1px solid var(--ok-border, #d7d5cc);
      border-radius: var(--ok-radius-sm, 10px);
      background: var(--ok-surface, #fff);
      color: inherit;
      width: 100%;
      box-sizing: border-box;
    }
    .closed {
      display: flex;
      flex-direction: column;
      gap: 0.3rem;
      margin-top: 0.75rem;
    }
  `;

  @property({ attribute: false }) client: ModuleClient | null = null;

  @property({ attribute: false }) t: Translator = (k) => k;

  @state() private rows: DeadEvent[] = [];

  /** What the screen can say about itself. `ready` is the only one that lists rows. */
  @state() private status: 'ready' | 'unsupported' | 'denied' | 'failed' = 'ready';

  @state() private error = '';

  /** The row whose discard has been asked for and not yet confirmed. */
  @state() private confirming = '';

  /** What is written in the «why» box of the row being confirmed. Cleared with the confirmation. */
  @state() private reason = '';

  /**
   * What was closed here, and with which reason **the hub actually stored** — the row leaves the
   * tray the moment it is discarded, and a closure that vanishes without a trace is one nobody can
   * check five minutes later. The hub keeps the full record (`discarded_at`, `discarded_by`,
   * `discard_reason`, ninety days); this is the near end of it, on the screen where the decision
   * was taken.
   */
  @state() private closed: { id: string; event: string; reason: string; kept: boolean }[] = [];

  /** Ids in flight, so a double tap cannot send the same gesture twice. */
  @state() private busy: string[] = [];

  @state() private notice = '';

  connectedCallback(): void {
    super.connectedCallback();
    void this.load();
  }

  /** Public so the screen around it can refresh the tray after a run without remounting it. */
  async load(): Promise<void> {
    const events = this.client?.events;
    // A hub older than hub#953 hands out a client with no such method. Saying so is the point:
    // an empty tray here would read as «nothing is wrong», which is a claim this hub cannot make.
    if (typeof events?.dead !== 'function') {
      this.rows = [];
      this.status = 'unsupported';
      this.announce();
      return;
    }
    try {
      const rows = await events.dead();
      this.rows = Array.isArray(rows) ? rows : [];
      this.status = 'ready';
      this.error = '';
    } catch (e) {
      this.rows = [];
      // `capability_denied` is fixed by granting the permission, and a screen that flattens it to
      // «error» sends the owner looking for a fault instead of a checkbox (ADR-0338).
      this.status = errorCode(e) === 'capability_denied' ? 'denied' : 'failed';
      this.error = (e as Error)?.message || this.t('ui.errGeneric');
    }
    this.announce();
  }

  private announce(): void {
    this.dispatchEvent(
      new CustomEvent('flows-dead-count', {
        detail: { count: this.rows.length },
        bubbles: true,
        composed: true,
      }),
    );
  }

  /** The rows a retry can actually move — the runtime's verdict, never this screen's guess. */
  private get retryable(): DeadEvent[] {
    return this.rows.filter((row) => row.retryable !== false);
  }

  private async retry(row: DeadEvent): Promise<void> {
    const call = this.client?.events?.retry;
    if (typeof call !== 'function' || this.busy.includes(row.id)) return;
    this.busy = [...this.busy, row.id];
    this.error = '';
    try {
      await call.call(this.client?.events, row.id);
      this.rows = this.rows.filter((r) => r.id !== row.id);
      this.announce();
    } catch (e) {
      // The row STAYS. The hub refusing means the message did not move, and a tray that removed it
      // would be reporting a delivery that never happened.
      this.error = this.refusal(e);
    } finally {
      this.busy = this.busy.filter((id) => id !== row.id);
    }
  }

  /**
   * Closes the row for good, with the reason if one was written.
   *
   * The empty box sends **no reason argument at all**, so an unexplained discard is the same single
   * call it always was: demanding an essay to close a row is how a recovery queue stops being
   * drained, and a queue nobody drains hides the next real failure.
   */
  private async discard(row: DeadEvent): Promise<void> {
    const call = this.client?.events?.discard;
    if (typeof call !== 'function' || this.busy.includes(row.id)) return;
    const written = this.reason.trim();
    this.busy = [...this.busy, row.id];
    this.error = '';
    try {
      const stamp: DiscardResult | undefined = written
        ? await call.call(this.client?.events, row.id, written)
        : await call.call(this.client?.events, row.id);
      // What goes on screen is what the ROW holds, never what was typed: the runtime trims and caps
      // it, and a hub older than hub#955 keeps nothing at all and says so by omitting the field.
      const kept = typeof stamp?.discard_reason === 'string' || !written;
      this.closed = [
        {
          id: row.id,
          event: row.event_name,
          reason: kept ? (stamp?.discard_reason ?? '') : '',
          kept,
        },
        ...this.closed,
      ];
      this.rows = this.rows.filter((r) => r.id !== row.id);
      this.confirming = '';
      this.reason = '';
      this.announce();
    } catch (e) {
      this.error = this.refusal(e);
    } finally {
      this.busy = this.busy.filter((id) => id !== row.id);
    }
  }

  /**
   * Every dead-letter of this hub, back in front of the relay at once — the gesture for the case
   * that produced a queue in the first place: something transient broke (the database blinked, a
   * module was deactivated mid-flight) and killed several at the same time.
   *
   * Offered only when more than one row can actually move, because the endpoint SKIPS the ones that
   * cannot (hub#827) — a sweep advertised over a queue of one retryable row would promise a
   * clean-up it does not perform.
   */
  private async retryAll(): Promise<void> {
    const call = this.client?.events?.retryAll;
    if (typeof call !== 'function' || this.busy.includes('*')) return;
    this.busy = [...this.busy, '*'];
    this.error = '';
    try {
      const moved = await call.call(this.client?.events);
      this.notice = this.t('ui.deadRetriedAll', { count: moved?.retried ?? 0 });
      await this.load();
    } catch (e) {
      this.error = this.refusal(e);
    } finally {
      this.busy = this.busy.filter((id) => id !== '*');
    }
  }

  /** A refusal in words. The revoked release has its own, because its remedy is a different one. */
  private refusal(e: unknown): string {
    if (errorCode(e) === 'flow.release_revoked') return this.t('ui.deadRevoked');
    if (errorCode(e) === 'capability_denied') return this.t('ui.deadDenied');
    return (e as Error)?.message || this.t('ui.errGeneric');
  }

  private async copy(id: string): Promise<void> {
    if (!id) return;
    try {
      await navigator.clipboard?.writeText(id);
      this.notice = this.t('ui.runCopied');
    } catch {
      // No clipboard (an old webview, a denied permission): the id is on screen to read anyway.
    }
  }

  private when(iso: string | undefined): string {
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

  /** The payload as evidence — never trimmed to fit. It is what tells an invoice from noise. */
  private payload(row: DeadEvent): string {
    try {
      return JSON.stringify(row.payload ?? {}, null, 2);
    } catch {
      return String(row.payload ?? '');
    }
  }

  private renderRow(row: DeadEvent) {
    const trouble = classify(row.last_error);
    const canRetry = row.retryable !== false;
    const busy = this.busy.includes(row.id);
    return html`<div class="card" data-dead=${row.id}>
      <span class="what">${this.t('ui.deadWhat', { event: row.event_name })}</span>
      <span class="why">
        ${canRetry
          ? trouble.messageKey
            ? this.t(trouble.messageKey)
            : this.t('ui.deadUnexplained')
          : this.t('ui.deadRevoked')}
      </span>
      <!-- What to do next, and for the revoked row that is deliberately NOT «press retry». -->
      <span class="why muted">
        ${canRetry
          ? trouble.actionKey
            ? this.t(trouble.actionKey)
            : this.t('ui.deadDoRetry')
          : this.t('ui.deadDoRevoked')}
      </span>
      <pre>${this.payload(row)}</pre>
      <span class="meta">
        ${this.t('ui.deadFrom', { module: row.module_id || '—' })} ·
        ${this.t(row.attempts === 1 ? 'ui.deadAttemptsOne' : 'ui.deadAttempts', {
          count: row.attempts ?? 0,
        })}
        · ${this.when(row.created_at)} ·
        <code>${row.id}</code>
        <button type="button" data-act="copy" @click=${() => void this.copy(row.id)}>
          ${this.t('ui.runCopyId')}
        </button>
      </span>
      ${trouble.technical
        ? html`<details>
            <summary>${this.t('ui.troubleTechnical')}</summary>
            <pre>${trouble.technical}</pre>
          </details>`
        : nothing}
      ${this.confirming === row.id
        ? html`<div class="confirm" data-confirm=${row.id}>
            <span class="why">${this.t('ui.deadDiscardConfirm')}</span>
            <!-- Said out loud, because it is what the hub really keeps (hub#955): who and when come
                 from inside, the reason is the only half a person has to supply — and it is
                 optional, because a queue that demands an essay to close a row is not drained. -->
            <span class="why muted">${this.t('ui.deadDiscardReasonHint')}</span>
            <div class="presets">
              ${REASON_PRESETS.map(
                (key) => html`<button
                  type="button"
                  data-act="reason-preset"
                  @click=${() => {
                    this.reason = this.t(key);
                  }}
                >
                  ${this.t(key)}
                </button>`,
              )}
            </div>
            <input
              type="text"
              data-field="discard-reason"
              maxlength=${MAX_REASON}
              .value=${this.reason}
              aria-label=${this.t('ui.deadDiscardReasonLabel')}
              placeholder=${this.t('ui.deadDiscardReasonPlaceholder')}
              @input=${(e: Event) => {
                this.reason = (e.target as HTMLInputElement).value;
              }}
            />
            <div class="actions">
              <button
                type="button"
                data-act="discard-confirm"
                ?disabled=${busy}
                @click=${() => void this.discard(row)}
              >
                ${this.t('ui.deadDiscardDo')}
              </button>
              <button
                type="button"
                data-act="discard-cancel"
                @click=${() => {
                  this.confirming = '';
                  this.reason = '';
                }}
              >
                ${this.t('ui.cancel')}
              </button>
            </div>
          </div>`
        : html`<div class="actions">
            ${canRetry
              ? html`<button
                  type="button"
                  data-act="retry"
                  ?disabled=${busy}
                  @click=${() => void this.retry(row)}
                >
                  ${this.t('ui.deadRetry')}
                </button>`
              : nothing}
            <button
              type="button"
              data-act="discard"
              @click=${() => {
                this.confirming = row.id;
              }}
            >
              ${this.t('ui.deadDiscard')}
            </button>
          </div>`}
    </div>`;
  }

  /**
   * **What was closed here, and why the row now says so** — the record that used to disappear.
   *
   * A discarded event leaves the tray at once (it is no longer something to decide), and until this
   * the only trace left on screen was the row's absence. The hub keeps the whole stamp for ninety
   * days and there is no read that lists discarded rows, so this is the one place the decision is
   * visible right after it is taken — with the reason **as the hub stored it**, and with a plain
   * sentence when the hub is too old to have stored anything.
   */
  private renderClosed() {
    if (!this.closed.length) return nothing;
    return html`<div class="closed">
      <h3 class="section">${this.t('ui.deadClosedTitle')}</h3>
      <span class="muted">${this.t('ui.deadClosedIntro')}</span>
      ${this.closed.map(
        (row) => html`<span class="why muted" data-discarded=${row.id}>
          ${!row.kept
            ? this.t('ui.deadDiscardReasonNotKept', { event: row.event })
            : row.reason
              ? this.t('ui.deadClosedWith', { event: row.event, reason: row.reason })
              : this.t('ui.deadClosedNoReason', { event: row.event })}
        </span>`,
      )}
    </div>`;
  }

  render() {
    if (this.status === 'unsupported') {
      return html`<div class="list">
        <h3 class="section">${this.t('ui.deadTitle')}</h3>
        <span class="muted">${this.t('ui.deadUnsupported')}</span>
      </div>`;
    }
    if (this.status === 'denied') {
      return html`<div class="list">
        <h3 class="section">${this.t('ui.deadTitle')}</h3>
        <ok-inline-feedback tone="warning" icon="lock-closed-outline"
          >${this.t('ui.deadDenied')}</ok-inline-feedback
        >
      </div>`;
    }
    return html`<div class="list">
      <div class="head">
        <h3 class="section">${this.t('ui.deadTitle')}</h3>
        <span class="grow"></span>
        ${this.retryable.length > 1
          ? html`<button
              type="button"
              data-act="retry-all"
              ?disabled=${this.busy.includes('*')}
              @click=${() => void this.retryAll()}
            >
              ${this.t('ui.deadRetryAll', { count: this.retryable.length })}
            </button>`
          : nothing}
      </div>
      ${this.error
        ? html`<ok-inline-feedback tone="danger" icon="alert-circle-outline"
            >${this.error}</ok-inline-feedback
          >`
        : nothing}
      ${this.notice ? html`<span class="muted">${this.notice}</span>` : nothing}
      ${this.rows.length
        ? html`<span class="muted">${this.t('ui.deadIntro')}</span>`
        : html`<span class="muted">${this.t('ui.deadEmpty')}</span>`}
      ${this.rows.map((row) => this.renderRow(row))} ${this.renderClosed()}
    </div>`;
  }
}

define('erp-flows-dead-letter', ErpFlowsDeadLetter);

declare global {
  interface HTMLElementTagNameMap {
    'erp-flows-dead-letter': ErpFlowsDeadLetter;
  }
}
