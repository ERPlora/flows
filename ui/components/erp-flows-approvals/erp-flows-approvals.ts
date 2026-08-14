import { LitElement, html, css, nothing } from 'lit';
import { property, state } from 'lit/decorators.js';
import { define } from '@erplora/outfitkit/define';
import '@erplora/outfitkit/ok-inline-feedback';
import '@erplora/outfitkit/ok-status-pill';
import type { Approval, ModuleClient } from '../../lib/hub-flows';
import type { Translator } from '../../lib/plain-language';

/**
 * **The approval tray** — the screen without which `policy: manual` is a dead end.
 *
 * An `ai` step whose policy is `manual` does not write anything: it turns the model's proposal
 * into a row of `_flow_approvals` and the turn ENDS, with the run parked in `waiting_approval`.
 * That is the safe design, and it is also the one that goes wrong quietly: with nowhere to see
 * those rows, a proposal sits there until its 72-hour TTL expires it, and what the owner
 * experiences is an automation that did nothing and never said why.
 *
 * Three things this screen has to get right, all of them about not lying:
 *
 * - **It shows what would RUN.** The command and its payload, verbatim. «A step is waiting for
 *   approval» is not something a person can judge; `customers.notes.add` with the note in it is.
 * - **A refusal keeps the row.** `flow.approval_already_decided` and `flow.approval_expired` are
 *   real answers from the hub. Removing the row on a failed approve would tell somebody they
 *   authorised a write that never happened.
 * - **It says when the proposal dies.** Expiry is a decision made by a timer; a tray that does not
 *   mention it lets that decision arrive as a surprise.
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
  `;

  @property({ attribute: false }) client: ModuleClient | null = null;

  @property({ attribute: false }) t: Translator = (k) => k;

  @state() private rows: Approval[] = [];

  @state() private error = '';

  /** Ids being decided right now, so a double tap cannot send the decision twice. */
  @state() private busy: string[] = [];

  connectedCallback(): void {
    super.connectedCallback();
    void this.load();
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
      await call.call(this.client?.flows, row.id);
      this.rows = this.rows.filter((r) => r.id !== row.id);
      this.announce();
    } catch (e) {
      // The row STAYS. `flow.approval_already_decided` and `flow.approval_expired` both mean the
      // write did not happen — dropping the row would say the opposite on the only screen that
      // reports it.
      this.error = (e as Error)?.message || this.t('ui.errGeneric');
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
      ${this.rows.map(
        (row) => html`<div class="card" data-approval=${row.id}>
          <span class="what">${this.t('ui.approvalWould', { command: row.command ?? '' })}</span>
          ${row.reason ? html`<span class="why">${row.reason}</span>` : nothing}
          <pre>${this.payload(row)}</pre>
          <span class="meta"
            >${this.t('ui.approvalExpires', { when: this.when(row.expires_at) })}</span
          >
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
        </div>`,
      )}
    </div>`;
  }
}

define('erp-flows-approvals', ErpFlowsApprovals);

declare global {
  interface HTMLElementTagNameMap {
    'erp-flows-approvals': ErpFlowsApprovals;
  }
}
