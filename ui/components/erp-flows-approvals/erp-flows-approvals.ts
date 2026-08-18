import { LitElement, html, css, nothing } from 'lit';
import { property, state } from 'lit/decorators.js';
import { define } from '@erplora/outfitkit/define';
import '@erplora/outfitkit/ok-inline-feedback';
import '@erplora/outfitkit/ok-status-pill';
import {
  APPROVAL_ALREADY_DECIDED,
  APPROVAL_EXPIRED,
  APPROVAL_NOT_YOURS,
  EVENT_APPROVAL_CREATED,
  EVENT_APPROVAL_EXPIRED,
  errorCode,
} from '../../lib/hub-flows';
import type { Approval, ModuleClient } from '../../lib/hub-flows';
import type { Translator } from '../../lib/plain-language';

/**
 * **The approval tray** — the screen without which `policy: manual` is a dead end, and since
 * hub#950 the screen where the `approval` step's QUESTION lands too.
 *
 * An `ai` step whose policy is `manual` does not write anything: it turns the model's proposal
 * into a row of `_flow_approvals` and the turn ENDS, with the run parked in `waiting_approval`.
 * That is the safe design, and it is also the one that goes wrong quietly: with nowhere to see
 * those rows, a proposal sits there until its 72-hour TTL expires it, and what the owner
 * experiences is an automation that did nothing and never said why.
 *
 * **One tray, two kinds** (hub#950). A `command` row is what the model proposed — the command and
 * its payload, verbatim, and approving RUNS it. A `decision` row is a question in words from an
 * `approval` step — a title and a summary, no command and no payload, and approving runs
 * NOTHING: it records the answer and the run carries on to the step that does the work.
 *
 * Four things this screen has to get right, all of them about not lying:
 *
 * - **It shows what would RUN, or what is ASKED.** `customers.notes.add` with the note in it, or
 *   «Approve the purchase from Casa Pepe?» with its amount. «A step is waiting» is not something
 *   a person can judge.
 * - **A refusal keeps the row.** `flow.approval_already_decided`, `flow.approval_expired` and
 *   `flow.approval_not_yours` (403: authenticated, but not the role that was asked) are real
 *   answers from the hub. Removing the row on a failed approve would tell somebody they
 *   authorised a write that never happened.
 * - **It says what waiting costs, and what a no costs.** Expiry is a decision made by a timer,
 *   and `on_expire`/`on_reject` say what that decision means for the run.
 * - **It refreshes on its own.** The kernel announces a new and an expired request over the WS;
 *   a tray open all night must stop showing a question that can no longer be answered.
 *
 * Approving re-checks the grant AT THAT MOMENT and runs exactly what was proposed — the model is
 * not consulted again. So this screen is the last gate, and it is a real one.
 */
export class ErpFlowsApprovals extends LitElement {
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
    h3.section {
      margin: 0;
      font-size: 0.78rem;
      letter-spacing: 0.05em;
      text-transform: uppercase;
      color: var(--ok-muted, #6b6a63);
      font-weight: 600;
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
    /* The payload is the thing being judged, so it is readable and it is COMPLETE — but it is a
       machine's words, so it is set apart and it scrolls inside its own box instead of pushing the
       two buttons off the bottom of a phone. */
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
    .meta {
      font-size: 0.8rem;
      color: var(--ok-muted, #6b6a63);
    }
    .actions {
      display: flex;
      flex-wrap: wrap;
      gap: 0.4rem;
    }
    .actions button {
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
    .actions button[data-act='approve'] {
      border-color: var(--ok-primary, #3880ff);
      color: var(--ok-primary, #3880ff);
      font-weight: 600;
    }
    .muted {
      color: var(--ok-muted, #6b6a63);
    }
    .question {
      font-weight: 600;
      font-size: 1rem;
      overflow-wrap: anywhere;
    }
    textarea {
      font: inherit;
      width: 100%;
      box-sizing: border-box;
      min-height: 2.75rem;
      padding: 0.45rem 0.6rem;
      border: 1px solid var(--ok-border, #d7d5cc);
      border-radius: var(--ok-radius-sm, 10px);
      background: var(--ok-surface, #fff);
      color: inherit;
      resize: vertical;
    }
  `;

  @property({ attribute: false }) client: ModuleClient | null = null;

  @property({ attribute: false }) t: Translator = (k) => k;

  @state() private rows: Approval[] = [];

  @state() private error = '';

  /** Ids being decided right now, so a double tap cannot send the decision twice. */
  @state() private busy: string[] = [];

  /** What is typed under each row before it is decided. Sent WITH the decision, never alone. */
  @state() private comments: Record<string, string> = {};

  private unsubscribes: (() => void)[] = [];

  connectedCallback(): void {
    super.connectedCallback();
    void this.load();
    // The kernel emits both facts as ephemeral WS events (hub#950/hub#972). Without them a tray
    // open all night keeps showing a question that can no longer be answered, and misses one asked
    // at 8:00 until somebody reloads. A client with no bus (the dev preview) simply polls on open.
    const subscribe = this.client?.subscribe;
    if (typeof subscribe === 'function') {
      for (const event of [EVENT_APPROVAL_CREATED, EVENT_APPROVAL_EXPIRED]) {
        this.unsubscribes.push(subscribe.call(this.client, event, () => void this.load()));
      }
    }
  }

  disconnectedCallback(): void {
    for (const off of this.unsubscribes) off();
    this.unsubscribes = [];
    super.disconnectedCallback();
  }

  /** Public so the shell can refresh the tray after a run without remounting it. */
  async load(): Promise<void> {
    // A hub older than hub#665 simply has no such method. Throwing here would blank the whole
    // automations screen over a tray that is empty on almost every hub.
    if (!this.client?.flows.approvals) {
      this.rows = [];
      this.announce();
      return;
    }
    try {
      // `pending` only: an approved row is history, and history belongs in the run it produced.
      const rows = await this.client.flows.approvals('pending');
      this.rows = Array.isArray(rows) ? rows : [];
      this.error = '';
    } catch (e) {
      this.rows = [];
      this.error = (e as Error)?.message || this.t('ui.errGeneric');
    }
    this.announce();
  }

  private announce(): void {
    this.dispatchEvent(
      new CustomEvent('flows-approvals-count', {
        detail: { count: this.rows.length },
        bubbles: true,
        composed: true,
      }),
    );
  }

  private async decide(row: Approval, verdict: 'approve' | 'reject'): Promise<void> {
    const call = verdict === 'approve' ? this.client?.flows.approve : this.client?.flows.reject;
    if (!call || this.busy.includes(row.id)) return;
    this.busy = [...this.busy, row.id];
    this.error = '';
    try {
      // The body is OPTIONAL and only travels when there is something in it: without a comment
      // the call is exactly what it was before hub#950, so an older hub answers as it always did.
      const comment = (this.comments[row.id] ?? '').trim();
      if (comment) await call.call(this.client?.flows, row.id, { comment });
      else await call.call(this.client?.flows, row.id);
      this.rows = this.rows.filter((r) => r.id !== row.id);
      const { [row.id]: _sent, ...rest } = this.comments;
      this.comments = rest;
      this.announce();
    } catch (e) {
      // The row STAYS. All three codes mean the write did not happen — dropping the row would say
      // the opposite on the only screen that reports it. And each is said in words: `not_yours` is
      // a 403 the person can act on (find who was asked), which an opaque code is not.
      this.error = this.refusal(e);
    } finally {
      this.busy = this.busy.filter((id) => id !== row.id);
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

  /** The hub's refusal, in words the person can act on; its raw message when it is none of ours. */
  private refusal(e: unknown): string {
    switch (errorCode(e)) {
      case APPROVAL_EXPIRED:
        return this.t('ui.approvalErrExpired');
      case APPROVAL_ALREADY_DECIDED:
        return this.t('ui.approvalErrAlreadyDecided');
      case APPROVAL_NOT_YOURS:
        return this.t('ui.approvalErrNotYours');
      default:
        return (e as Error)?.message || this.t('ui.errGeneric');
    }
  }

  /** `command` unless the row says `decision`: a row older than hub#950 is a model's proposal. */
  private kindOf(row: Approval): 'command' | 'decision' {
    return row.kind === 'decision' ? 'decision' : 'command';
  }

  /** The payload, as the thing that is about to be written — never trimmed to fit. */
  private payload(row: Approval): string {
    try {
      return JSON.stringify(row.payload ?? {}, null, 2);
    } catch {
      return String(row.payload ?? '');
    }
  }

  render() {
    return html`<div class="list">
      <h3 class="section">${this.t('ui.approvalsTitle')}</h3>
      ${this.error
        ? html`<ok-inline-feedback tone="danger" icon="alert-circle-outline"
            >${this.error}</ok-inline-feedback
          >`
        : nothing}
      ${!this.rows.length
        ? html`<span class="muted">${this.t('ui.approvalsEmpty')}</span>`
        : html`<span class="muted">${this.t('ui.approvalsIntro')}</span>`}
      ${this.rows.map((row) => {
        const kind = this.kindOf(row);
        const when = this.when(row.expires_at);
        return html`<div class="card" data-approval=${row.id} data-kind=${kind}>
          ${kind === 'decision'
            ? html`<span class="question">${row.title ?? ''}</span>
                ${row.summary ? html`<span class="why">${row.summary}</span>` : nothing}
                <span class="meta"
                  >${row.assignee_role
                    ? this.t('ui.approvalAskedRole', { role: row.assignee_role })
                    : this.t('ui.approvalAskedAdmins')}</span
                >`
            : html`<span class="what">${this.t('ui.approvalWould', { command: row.command ?? '' })}</span>
                ${row.reason ? html`<span class="why">${row.reason}</span>` : nothing}
                <pre>${this.payload(row)}</pre>`}
          <!-- What waiting costs, and what a no costs — in the words of the policies the flow
               chose. A model's proposal has neither: expiring it simply never runs it. -->
          ${kind === 'decision'
            ? html`<span class="meta"
                  >${this.t(`ui.approvalExpires_${policy(row.on_expire, 'reject')}`, { when })}</span
                >
                <span class="meta"
                  >${this.t(`ui.approvalOnReject_${policy(row.on_reject, 'cancel')}`)}</span
                >`
            : html`<span class="meta">${this.t('ui.approvalExpires', { when })}</span>`}
          <textarea
            data-field="comment"
            rows="1"
            aria-label=${this.t('ui.approvalComment')}
            placeholder=${this.t('ui.approvalComment')}
            .value=${this.comments[row.id] ?? ''}
            @input=${(e: Event) => {
              this.comments = { ...this.comments, [row.id]: (e.target as HTMLTextAreaElement).value };
            }}
          ></textarea>
          <div class="actions">
            <button
              type="button"
              data-act="approve"
              ?disabled=${this.busy.includes(row.id)}
              @click=${() => void this.decide(row, 'approve')}
            >
              ${this.t('ui.approvalApprove')}
            </button>
            <!-- Rejecting asks nothing back: it is the answer that leaves the business exactly as
                 it was, and a confirmation dialog on the safe choice only trains people to tap
                 through the one on the other button. -->
            <button
              type="button"
              data-act="reject"
              ?disabled=${this.busy.includes(row.id)}
              @click=${() => void this.decide(row, 'reject')}
            >
              ${this.t('ui.approvalReject')}
            </button>
          </div>
        </div>`;
      })}
    </div>`;
  }
}

/** A policy the row carries, or the kernel's default when the row predates the column. */
function policy(value: string | undefined, fallback: string): string {
  return value && /^[a-z_]+$/.test(value) ? value : fallback;
}

define('erp-flows-approvals', ErpFlowsApprovals);

declare global {
  interface HTMLElementTagNameMap {
    'erp-flows-approvals': ErpFlowsApprovals;
  }
}
