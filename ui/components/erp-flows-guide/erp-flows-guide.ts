import { LitElement, html, css } from 'lit';
import { property } from 'lit/decorators.js';
import { define } from '@erplora/outfitkit/define';
import '@erplora/outfitkit/ok-status-pill';
import type { Translator } from '../../lib/plain-language';

/**
 * **The guide for the person who owns the shop** (pm#134).
 *
 * What existed before this was `docs/overview.md` and `docs/limits.md` — notes for whoever touches
 * the code. Somebody who installs this module opens a screen and does not know what a trigger is,
 * nor why their automation does nothing until they grant it something.
 *
 * # Why it lives HERE and not in `docs/`
 *
 * `docs/` **does not travel**: `erplora pack` ships a closed list (`module.json`, `README.md`,
 * `CHANGELOG.md`, `dist`, `migrations`, `queries`, `commands`, `schemas`, `locales`). Writing the
 * guide into `docs/` would leave it in the repository, which is not where the owner is. Widening
 * that list is a change to all 25 modules and belongs to whoever owns the toolkit, not to a side
 * effect of this one.
 *
 * Of the two homes that DO reach a person, this is the one that reaches them at the right moment:
 *
 * - the **README** is extracted on every sync into `Module.readme` and rendered as the marketplace
 *   card — read once, BEFORE installing, while deciding. It keeps the short version;
 * - **this screen** is one tap from the gallery, in the hub, next to the editor, in the language
 *   the shell is running in — which is where somebody stuck on permissions actually is. It ships
 *   inside `dist`, so it travels with no change to anything else.
 *
 * # Why the pictures are drawn and not photographed
 *
 * pm#134 asked for screenshots. A PNG would have to be base64'd into the bundle to travel at all,
 * and it would be a photograph of one language, one theme and one week of this UI — going stale in
 * silence is exactly what module documentation does. So the illustrations below are built from the
 * editor's own strings (`ui.whenThisHappens`, `ui.guardTitle`, `ui.grantsMissing`) and the editor's
 * own components: they are the screen, at full fidelity, in the reader's language and theme, and a
 * rename of any of those words moves the picture with it.
 */
export const GUIDE_SECTIONS = ['what', 'first', 'permissions', 'history', 'limits'] as const;

export class ErpFlowsGuide extends LitElement {
  static styles = css`
    :host {
      display: block;
      color: var(--ok-text, var(--ion-text-color, #1c1b18));
      font-family: var(--ok-font, var(--ion-font-family, system-ui), sans-serif);
    }
    .wrap {
      max-width: 44rem;
      margin: 0 auto;
      display: flex;
      flex-direction: column;
      gap: 1.1rem;
    }
    .head {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      flex-wrap: wrap;
    }
    h2 {
      margin: 0;
      flex: 1 1 12rem;
      font-size: 1.15rem;
    }
    .back {
      font: inherit;
      font-size: 0.9rem;
      background: transparent;
      border: 1px solid var(--ok-border, #d7d5cc);
      border-radius: var(--ok-radius-pill, 999px);
      color: inherit;
      cursor: pointer;
      padding: 0 0.9rem;
      min-height: 2.5rem;
    }
    h3 {
      margin: 0 0 0.35rem;
      font-size: 1rem;
    }
    p {
      margin: 0 0 0.5rem;
      line-height: 1.55;
      font-size: 0.95rem;
    }
    ol {
      margin: 0.2rem 0 0.6rem;
      padding-left: 1.2rem;
    }
    li {
      line-height: 1.55;
      font-size: 0.95rem;
      margin-bottom: 0.35rem;
    }
    .muted {
      color: var(--ok-muted, #6b6a63);
    }
    /* ── The drawings ────────────────────────────────────────────────────────────────────────
       The editor's own shapes: one column, a card for the trigger, a dashed chip for the guard,
       a card for the action. Same vocabulary, same geometry, no image bytes. */
    .shot {
      border: 1px solid var(--ok-border, #d7d5cc);
      border-radius: var(--ok-radius, 14px);
      background: var(--ok-surface-muted, rgba(0, 0, 0, 0.02));
      padding: 0.7rem;
      margin: 0.4rem 0 0.8rem;
      overflow-x: auto;
    }
    .node {
      position: relative;
      padding-left: 1.4rem;
    }
    .node::before {
      content: '';
      position: absolute;
      left: 0.36rem;
      top: 0;
      bottom: -0.1rem;
      width: 2px;
      background: var(--ok-border-soft, rgba(0, 0, 0, 0.12));
    }
    .node:last-child::before {
      bottom: auto;
      height: 1rem;
    }
    .node::after {
      content: '';
      position: absolute;
      left: 0;
      top: 0.75rem;
      width: 0.8rem;
      height: 0.8rem;
      border-radius: 50%;
      background: var(--ok-border, #d7d5cc);
      box-shadow: 0 0 0 3px var(--ok-bg, var(--ion-background-color, #fff));
    }
    .node.trigger::after {
      background: var(--ok-primary, var(--ion-color-primary, #3880ff));
    }
    .mini-card {
      background: var(--ok-surface, #fff);
      border: 1px solid var(--ok-border, #d7d5cc);
      border-radius: var(--ok-radius, 14px);
      padding: 0.5rem 0.6rem;
      margin: 0.3rem 0;
    }
    .eyebrow {
      display: block;
      font-size: 0.7rem;
      letter-spacing: 0.04em;
      text-transform: uppercase;
      color: var(--ok-muted, #6b6a63);
    }
    .title {
      display: block;
      font-weight: 600;
      font-size: 0.92rem;
    }
    .chip {
      display: inline-flex;
      align-items: center;
      gap: 0.35rem;
      margin: 0.3rem 0 0.3rem 0.6rem;
      background: var(--ok-surface-2, rgba(0, 0, 0, 0.04));
      border: 1px dashed var(--ok-border, #d7d5cc);
      border-radius: var(--ok-radius-pill, 999px);
      padding: 0.3rem 0.6rem;
      font-size: 0.88rem;
    }
    .row {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      padding: 0.45rem 0.6rem;
      border: 1px solid var(--ok-border, #d7d5cc);
      border-radius: var(--ok-radius-sm, 10px);
      background: var(--ok-surface, #fff);
      margin-bottom: 0.35rem;
      font-size: 0.9rem;
    }
    .row .grow {
      flex: 1 1 auto;
      min-width: 0;
      overflow-wrap: anywhere;
    }
  `;

  @property({ attribute: false }) t: Translator = (k) => k;

  private heading(section: string) {
    return html`<h3 data-key=${`guide.${section}Title`}>${this.t(`guide.${section}Title`)}</h3>`;
  }

  /** The spine as the editor draws it: «When this happens…» → «Only continue if» → the action. */
  private spineShot() {
    return html`<div class="shot" data-shot="spine">
      <div class="node trigger">
        <div class="mini-card">
          <span class="eyebrow">${this.t('ui.whenThisHappens')}</span>
          <span class="title">${this.t('ui.triggerEvent', { event: this.t('ui.evSaleCompleted') })}</span>
        </div>
      </div>
      <div class="node">
        <span class="chip"
          ><strong>${this.t('ui.guardTitle')}</strong> ${this.t('guide.shotGuard')}</span
        >
      </div>
      <div class="node">
        <div class="mini-card">
          <span class="title">${this.t('guide.shotAction')}</span>
        </div>
      </div>
    </div>`;
  }

  private permissionsShot() {
    return html`<div class="shot" data-shot="permissions">
      <div class="row">
        <ok-status-pill tone="warning" label=${this.t('ui.grantsMissing')}></ok-status-pill>
        <span class="grow">${this.t('guide.shotGrant')}</span>
      </div>
      <div class="row">
        <ok-status-pill tone="success" label=${this.t('ui.grantsGranted')}></ok-status-pill>
        <span class="grow">${this.t('guide.shotGrantDone')}</span>
      </div>
    </div>`;
  }

  private historyShot() {
    return html`<div class="shot" data-shot="history">
      <div class="row">
        <ok-status-pill tone="success" label=${this.t('ui.runDone')}></ok-status-pill>
        <span class="grow muted">${this.t('guide.shotWhen')}</span>
      </div>
      <div class="row">
        <ok-status-pill tone="neutral" label=${this.t('ui.runDone')}></ok-status-pill>
        <span class="grow muted">${this.t('ui.ranGuardStopped')}</span>
      </div>
    </div>`;
  }

  render() {
    return html`<div class="wrap">
      <div class="head">
        <h2>${this.t('guide.title')}</h2>
        <button
          type="button"
          class="back"
          data-act="back"
          @click=${() =>
            this.dispatchEvent(
              new CustomEvent('flows-guide-close', { bubbles: true, composed: true }),
            )}
        >
          ${this.t('ui.guideBack')}
        </button>
      </div>

      <section data-section="what">
        ${this.heading('what')}
        <p>${this.t('guide.whatBody')}</p>
        <p class="muted">${this.t('guide.whatExample')}</p>
        ${this.spineShot()}
      </section>

      <section data-section="first">
        ${this.heading('first')}
        <p>${this.t('guide.firstBody')}</p>
        <ol>
          ${[1, 2, 3, 4, 5].map((n) => html`<li>${this.t(`guide.first${n}`)}</li>`)}
        </ol>
      </section>

      <section data-section="permissions">
        ${this.heading('permissions')}
        <p>${this.t('guide.permissionsBody')}</p>
        <p>${this.t('guide.permissionsWhere')}</p>
        ${this.permissionsShot()}
        <p>${this.t('guide.permissionsNothing')}</p>
      </section>

      <section data-section="history">
        ${this.heading('history')}
        <p>${this.t('guide.historyBody')}</p>
        ${this.historyShot()}
        <p>${this.t('guide.historyGuard')}</p>
      </section>

      <section data-section="limits">
        ${this.heading('limits')}
        <p>${this.t('guide.limitsBranches')}</p>
        <p>${this.t('guide.limitsChannels')}</p>
        <p>${this.t('guide.limitsDates')}</p>
        <p class="muted">${this.t('guide.limitsInside')}</p>
      </section>
    </div>`;
  }
}

define('erp-flows-guide', ErpFlowsGuide);

declare global {
  interface HTMLElementTagNameMap {
    'erp-flows-guide': ErpFlowsGuide;
  }
}
