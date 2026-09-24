import { LitElement, html, css, nothing } from 'lit';
import { property } from 'lit/decorators.js';
import { define } from '@erplora/outfitkit/define';
import type { ValuePart } from '../../lib/flow-doc';

/**
 * **One value, composed out of text the owner types and fields they pick.**
 *
 * This is where the hardest half of a visual automation editor lives. Saying «the total of the
 * sale goes in the message» is not dragging a box; it is the step where people give up. So:
 *
 * - a picked field is a **pill** with the words it was chosen by («Total de la venta»), and the
 *   path that makes it work (`input.total`, `{{input.total}}`) exists only in the model. Make's
 *   documented failure is *"staring at raw data structures without much context"* — braces on
 *   screen are that;
 * - every text segment is its own box, so a typo in the middle of a sentence can be fixed without
 *   rebuilding the line;
 * - there is **no expression mode**. Not hidden behind a toggle, not reachable by accident. Power
 *   Automate's is the documented trap: you enter it without noticing and there is no way back.
 *
 * The picker itself is not opened here — this element ASKS for it (`flows-pick-field`) and the
 * editor, which is the one thing that talks to the hub, opens the one picker everybody shares.
 */
export class ErpFlowsValue extends LitElement {
  static styles = css`
    :host {
      display: block;
    }
    /* \`display: block\` above beats the \`hidden\` attribute, and the editor keeps one of these
       hidden in every condition row (flows#121). */
    :host([hidden]) {
      display: none;
    }
    .label {
      font-size: 0.78rem;
      color: var(--ok-muted, var(--ion-color-medium, #6b6a63));
      margin-bottom: 0.25rem;
    }
    .box {
      display: flex;
      flex-wrap: wrap;
      align-items: center;
      gap: 0.3rem;
      min-height: 2.4rem;
      padding: 0.3rem 0.45rem;
      border: 1px solid var(--ok-border, var(--ion-border-color, #d7d5cc));
      border-radius: var(--ok-radius-sm, 10px);
      background: var(--ok-surface, var(--ion-card-background, #fff));
    }
    .box:focus-within {
      border-color: var(--ok-primary, var(--ion-color-primary, #3880ff));
    }
    input {
      /* A generous basis so a text segment WRAPS to its own line instead of being squeezed into
         three visible characters between two pills. */
      flex: 1 1 10rem;
      min-width: 6rem;
      border: 0;
      outline: none;
      background: transparent;
      font: inherit;
      color: var(--ok-text, var(--ion-text-color, #1c1b18));
      padding: 0.25rem 0;
    }
    .pill {
      display: inline-flex;
      align-items: center;
      gap: 0.3rem;
      padding: 0.15rem 0.2rem 0.15rem 0.55rem;
      border-radius: var(--ok-radius-pill, 999px);
      background: var(--ok-chip-bg, rgba(56, 128, 255, 0.14));
      color: var(--ok-chip-color, var(--ion-color-primary, #3880ff));
      font-size: 0.85rem;
      font-weight: 600;
      white-space: nowrap;
      max-width: 100%;
    }
    .pill span {
      overflow: hidden;
      text-overflow: ellipsis;
    }
    .pill button {
      border: 0;
      background: transparent;
      color: inherit;
      cursor: pointer;
      font-size: 1rem;
      line-height: 1;
      padding: 0.1rem 0.35rem;
      border-radius: 999px;
      min-width: 1.75rem;
      min-height: 1.75rem;
    }
    .insert {
      border: 1px dashed var(--ok-border, #d7d5cc);
      background: transparent;
      color: var(--ok-muted, #6b6a63);
      border-radius: var(--ok-radius-pill, 999px);
      cursor: pointer;
      font: inherit;
      font-size: 0.8rem;
      /* 44px: this editor is used on a tablet at the counter, with a finger. */
      min-height: 2.1rem;
      padding: 0 0.7rem;
      white-space: nowrap;
    }
  `;

  /** The composition, as {@link ValuePart}s. Set as a property: it is an array. */
  @property({ attribute: false }) parts: ValuePart[] = [];

  @property({ attribute: false }) fieldLabel: (path: string) => string = (p) => p;

  @property({ type: String }) label = '';

  @property({ type: String }) placeholder = '';

  @property({ type: String }) insertLabel = '+';

  @property({ type: String }) removeLabel = 'Remove';

  /** False when this flow has no payload to pick from — a manual trigger, say. */
  @property({ type: Boolean }) canPickFields = true;

  /** What this box belongs to, echoed back so the editor knows which value changed. */
  @property({ type: String }) name = '';

  /** Empty text is dropped and neighbours are joined, so removing a pill does not leave holes. */
  private normalise(parts: ValuePart[]): ValuePart[] {
    const out: ValuePart[] = [];
    for (const part of parts) {
      const last = out[out.length - 1];
      if (part.kind === 'text') {
        if (part.text === '') continue;
        if (last && last.kind === 'text') {
          out[out.length - 1] = { kind: 'text', text: last.text + part.text };
          continue;
        }
      }
      out.push(part);
    }
    return out;
  }

  private emit(parts: ValuePart[]): void {
    const next = this.normalise(parts);
    this.parts = next;
    this.dispatchEvent(
      new CustomEvent('flows-value-change', {
        detail: { parts: next, ...(this.name ? { name: this.name } : {}) },
        bubbles: true,
        composed: true,
      }),
    );
  }

  private onText(index: number, text: string): void {
    const parts = [...this.slots];
    parts[index] = { kind: 'text', text };
    this.emit(parts);
  }

  private removeAt(index: number): void {
    this.emit(this.slots.filter((_, i) => i !== index));
  }

  /**
   * What is actually drawn: the parts, normalised, always ending in a text box so there is
   * somewhere to keep typing. Normalising here and not only on the way out matters — two adjacent
   * text parts arriving from a stored document would otherwise draw as two boxes with an
   * invisible seam between them, and typing in the first would rebuild the value in the wrong
   * order.
   */
  private get slots(): ValuePart[] {
    const parts = this.normalise(this.parts);
    const last = parts[parts.length - 1];
    if (!last || last.kind !== 'text') parts.push({ kind: 'text', text: '' });
    return parts;
  }

  render() {
    return html`
      ${this.label ? html`<div class="label">${this.label}</div>` : nothing}
      <div class="box">
        ${this.slots.map((part, i) =>
          part.kind === 'field'
            ? html`<span class="pill"
                ><span>${this.fieldLabel(part.path)}</span
                ><button
                  type="button"
                  aria-label=${this.removeLabel}
                  @click=${() => this.removeAt(i)}
                >
                  ×
                </button></span
              >`
            : html`<input
                type="text"
                .value=${part.text}
                placeholder=${i === 0 ? this.placeholder : ''}
                @input=${(e: Event) => this.onText(i, (e.target as HTMLInputElement).value)}
              />`,
        )}
        ${this.canPickFields
          ? html`<button
              type="button"
              class="insert"
              @click=${() =>
                this.dispatchEvent(
                  new CustomEvent('flows-pick-field', {
                    detail: { name: this.name },
                    bubbles: true,
                    composed: true,
                  }),
                )}
            >
              ${this.insertLabel}
            </button>`
          : nothing}
      </div>
    `;
  }

  /** Appends a field the editor's picker resolved. Called by the editor, not by a template. */
  appendField(path: string): void {
    this.emit([...this.parts, { kind: 'field', path }]);
  }
}

define('erp-flows-value', ErpFlowsValue);

declare global {
  interface HTMLElementTagNameMap {
    'erp-flows-value': ErpFlowsValue;
  }
}
