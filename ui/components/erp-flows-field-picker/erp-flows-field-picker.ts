import { LitElement, html, css, nothing } from 'lit';
import { property } from 'lit/decorators.js';
import { define } from '@erplora/outfitkit/define';
import type { EventFieldShape, EventShape } from '../../lib/hub-flows';
import { describeSample, fieldPhrase } from '../../lib/plain-language';
import type { Translator } from '../../lib/plain-language';

/**
 * **The data picker, built from what really happened in THIS hub** (hub#715).
 *
 * The owner does not choose `sale.total`; they choose «Total de la venta — 42,50 €», with the
 * number from their own last sale beside it. That example is the project's no-mocks rule applied
 * to a dropdown, and it is what removes most of the doubt about which field is the right one.
 *
 * Three rules that are not cosmetic:
 *
 * - **A withheld example never hides its field.** The hub redacts values that could be about a
 *   person; the field stays offered, because mapping `customer.email` into a message must not
 *   require showing a customer's address to draw the row.
 * - **What cannot be mapped is greyed out WITH the reason**, never silently dropped. The mapping
 *   language has no array indexing, so `lines` is visible, explained and not selectable — an
 *   owner who can see it in their own data would otherwise go looking for it forever.
 * - **Search matches the words and the VALUE**, not just the key: somebody looking at their own
 *   ticket types «42», not «total».
 *
 * The panel is its own scrim rather than an `ion-modal` because an `ion-modal` reparents to
 * `<body>` and leaves its shadow styles behind — a documented trap in this codebase.
 */
export class ErpFlowsFieldPicker extends LitElement {
  static styles = css`
    :host {
      display: contents;
    }
    .scrim {
      position: fixed;
      inset: 0;
      z-index: 40;
      background: var(--ok-scrim, rgba(0, 0, 0, 0.35));
      display: flex;
      align-items: flex-end;
      justify-content: center;
    }
    @media (min-width: 768px) {
      .scrim {
        align-items: center;
      }
    }
    .panel {
      display: flex;
      flex-direction: column;
      width: min(30rem, 100%);
      max-height: min(80vh, 34rem);
      background: var(--ok-surface, var(--ion-card-background, #fff));
      color: var(--ok-text, var(--ion-text-color, #1c1b18));
      border-radius: var(--ok-radius, 14px) var(--ok-radius, 14px) 0 0;
      box-shadow: var(--ok-shadow-md, 0 12px 40px rgba(0, 0, 0, 0.25));
      overflow: hidden;
    }
    @media (min-width: 768px) {
      .panel {
        border-radius: var(--ok-radius, 14px);
      }
    }
    header {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      padding: 0.9rem 1rem 0.5rem;
    }
    header h2 {
      margin: 0;
      font-size: 1rem;
      flex: 1 1 auto;
    }
    header button {
      border: 0;
      background: transparent;
      font-size: 1.3rem;
      cursor: pointer;
      color: var(--ok-muted, #6b6a63);
      min-width: 2.5rem;
      min-height: 2.5rem;
      border-radius: 999px;
    }
    .from,
    .notice {
      padding: 0 1rem 0.5rem;
      font-size: 0.8rem;
      color: var(--ok-muted, #6b6a63);
    }
    .search {
      padding: 0 1rem 0.6rem;
    }
    .search input {
      width: 100%;
      box-sizing: border-box;
      font: inherit;
      padding: 0.6rem 0.7rem;
      border: 1px solid var(--ok-border, #d7d5cc);
      border-radius: var(--ok-radius-sm, 10px);
      background: var(--ok-bg, transparent);
      color: inherit;
    }
    ul {
      list-style: none;
      margin: 0;
      padding: 0 0 0.5rem;
      overflow-y: auto;
      flex: 1 1 auto;
    }
    .field {
      display: flex;
      flex-direction: column;
      gap: 0.1rem;
      width: 100%;
      text-align: left;
      background: transparent;
      border: 0;
      border-top: 1px solid var(--ok-border-soft, rgba(0, 0, 0, 0.08));
      /* A finger, not a mouse: this editor is used on the counter tablet. */
      padding: 0.7rem 1rem;
      min-height: 3rem;
      cursor: pointer;
      font: inherit;
      color: inherit;
    }
    .field:hover {
      background: var(--ok-hover, rgba(0, 0, 0, 0.04));
    }
    .field[aria-disabled='true'] {
      cursor: not-allowed;
      opacity: 0.55;
    }
    .field[aria-disabled='true']:hover {
      background: transparent;
    }
    .name {
      font-weight: 600;
    }
    .meta {
      font-size: 0.8rem;
      color: var(--ok-muted, #6b6a63);
    }
    .empty {
      padding: 1.5rem 1rem;
      text-align: center;
      color: var(--ok-muted, #6b6a63);
    }
  `;

  @property({ attribute: false }) shape: EventShape | null = null;

  @property({ type: Boolean, reflect: true }) open = false;

  @property({ type: Boolean }) loading = false;

  /** The root the picked path is prefixed with: `input` inside a step, `event` inside a trigger. */
  @property({ type: String }) root: 'input' | 'event' = 'input';

  /** The words the owner picked the event by, for the «From …» line. */
  @property({ type: String }) eventLabel = '';

  @property({ type: String }) query = '';

  @property({ attribute: false }) t: Translator = (k) => k;

  /**
   * Why a field cannot be dropped into a value, or `''` when it can.
   *
   * The only real constraint in v1 is the mapping language itself: `resolve_path` walks `a.b.c`
   * and has no array indexing, so an array is a dead end, and a whole object would render as raw
   * JSON in a message. Both stay VISIBLE with this reason attached.
   */
  private skipReason(field: EventFieldShape): string {
    // Two shapes, two different sentences — and the difference is actionable. The hub's shape
    // DESCENDS into an object, so `customer` has `customer.phone` right below it to pick instead.
    // It does not descend into an array, because `resolve_path` has no indexing: there is nothing
    // inside `lines` an automation could ever reach, and saying «pick one of the fields inside»
    // would send the owner looking for something that is not there.
    if (field.type === 'array') return this.t('ui.pickFieldSkipArray');
    if (field.type === 'object') return this.t('ui.pickFieldSkipObject');
    return '';
  }

  /**
   * The fields the search box currently keeps. Named `matchingFields` and not `matches`: the DOM's
   * `Element.matches(selectors)` answers a BOOLEAN and callers branch on it, so a getter returning
   * an array under that name made every delegated `matches()` test true (flows#107).
   */
  private get matchingFields(): EventFieldShape[] {
    const fields = this.shape?.fields ?? [];
    const q = this.query.trim().toLowerCase();
    if (!q) return fields;
    return fields.filter((f) => {
      // Searched by the words on screen, not by the mechanical ones: somebody typing «opción»
      // is looking for the row that SAYS «La opción que tocó», and matching only `Reply id`
      // would hide the one field they came here for.
      const label = fieldPhrase(f.path, this.t).toLowerCase();
      const sample = describeSample(f, this.t).toLowerCase();
      return label.includes(q) || f.path.toLowerCase().includes(q) || sample.includes(q);
    });
  }

  private pick(field: EventFieldShape): void {
    if (this.skipReason(field)) return;
    this.dispatchEvent(
      new CustomEvent('flows-field-picked', {
        detail: { path: `${this.root}.${field.path}` },
        bubbles: true,
        composed: true,
      }),
    );
  }

  private close(): void {
    this.dispatchEvent(new CustomEvent('flows-picker-close', { bubbles: true, composed: true }));
  }

  private renderField(field: EventFieldShape) {
    const skipped = this.skipReason(field);
    const sample = describeSample(field, this.t);
    const optional =
      this.shape && field.seen_in < this.shape.samples ? this.t('ui.pickFieldOptional') : '';
    const meta = [skipped || sample, optional].filter(Boolean).join(' · ');
    return html`<li>
      <button
        type="button"
        class="field"
        aria-disabled=${skipped ? 'true' : 'false'}
        @click=${() => this.pick(field)}
      >
        <span class="name">${fieldPhrase(field.path, this.t)}</span>
        ${meta ? html`<span class="meta">${meta}</span>` : nothing}
      </button>
    </li>`;
  }

  render() {
    if (!this.open) return nothing;
    const fields = this.matchingFields;
    return html`<div
      class="scrim"
      @click=${(e: Event) => {
        if (e.target === e.currentTarget) this.close();
      }}
    >
      <div class="panel" role="dialog" aria-label=${this.t('ui.pickFieldTitle')}>
        <header>
          <h2>${this.t('ui.pickFieldTitle')}</h2>
          <button type="button" aria-label=${this.t('ui.close')} @click=${() => this.close()}>×</button>
        </header>
        ${this.eventLabel
          ? html`<div class="from">${this.t('ui.pickFieldFrom', { event: this.eventLabel })}</div>`
          : nothing}
        ${this.shape && this.shape.samples === 0
          ? html`<div class="notice">${this.t('ui.pickFieldNoSamples')}</div>`
          : nothing}
        ${this.shape && (this.shape.fields?.length ?? 0) > 0
          ? html`<div class="search">
                <input
                  type="search"
                  .value=${this.query}
                  placeholder=${this.t('ui.pickFieldSearch')}
                  @input=${(e: Event) => {
                    this.query = (e.target as HTMLInputElement).value;
                  }}
                />
              </div>
              <ul>
                ${fields.map((f) => this.renderField(f))}
              </ul>`
          : html`<div class="empty">
              ${this.loading ? this.t('ui.loading') : this.t('ui.pickFieldEmpty')}
            </div>`}
      </div>
    </div>`;
  }
}

define('erp-flows-field-picker', ErpFlowsFieldPicker);

declare global {
  interface HTMLElementTagNameMap {
    'erp-flows-field-picker': ErpFlowsFieldPicker;
  }
}
