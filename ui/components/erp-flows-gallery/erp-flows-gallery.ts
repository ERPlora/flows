import { LitElement, html, css, nothing } from 'lit';
import { property, state } from 'lit/decorators.js';
import { define } from '@erplora/outfitkit/define';
import '@erplora/outfitkit/ok-inline-feedback';
import '@erplora/outfitkit/ok-status-pill';
import {
  SECTORS,
  buildTemplate,
  missingModules,
  templateById,
  templateGrants,
  templatesOf,
} from '../../lib/templates';
import type { FlowTemplate, Sector } from '../../lib/templates';
import { errorCode } from '../../lib/hub-flows';
import type { Flow, ModuleClient } from '../../lib/hub-flows';
import type { Translator } from '../../lib/plain-language';

/**
 * **The gallery: what the owner sees first** (flows#1).
 *
 * The screen this replaces was a list with nothing in it and a button saying «New automation».
 * That is a blank canvas with extra steps, and the research behind pm#110 was unambiguous: people
 * who run a shop start from a template. So the way in is a set of automations they recognise, and
 * the editor is where picking one lands them.
 *
 * Three things this screen refuses to do:
 *
 * - **Offer what this hub cannot run.** It asks the hub about one declared event per module a
 *   template needs (`GET /api/hub/events/shape`, which answers `404` for an event nobody declares)
 *   and marks the card with the module that is missing. The alternative is a card that fails at
 *   grant time with «command no encontrado», three screens later, in words nobody outside this
 *   repository can read.
 * - **Create anything running.** A template becomes a flow with `enabled: false`. An automation
 *   acts while nobody is watching; one that starts because somebody tapped a picture of it is
 *   precisely what the grants system exists to prevent.
 * - **Hide the permissions until afterwards.** What it will ask for, and why, is on the panel
 *   BEFORE the flow exists (pm#134 point 3: this is where people get stuck).
 *
 * Layout is one fluid column of full-width cards, same as the editor's spine and for the same
 * reason: the assistant takes a third of the width at ≥768px, and a grid of fixed cards does not
 * survive that. Nothing here is narrower than a fingertip.
 */
export class ErpFlowsGallery extends LitElement {
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
      gap: 0.75rem;
    }
    .lede {
      display: flex;
      align-items: flex-start;
      gap: 0.5rem;
      flex-wrap: wrap;
    }
    .lede p {
      flex: 1 1 16rem;
      margin: 0;
      color: var(--ok-muted, #6b6a63);
      font-size: 0.92rem;
      line-height: 1.5;
    }
    .link {
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
      margin: 0.5rem 0 0;
      font-size: 0.78rem;
      letter-spacing: 0.05em;
      text-transform: uppercase;
      color: var(--ok-muted, #6b6a63);
      font-weight: 600;
    }
    .cards {
      display: flex;
      flex-direction: column;
      gap: 0.5rem;
    }
    .card {
      background: var(--ok-surface, var(--ion-card-background, #fff));
      border: 1px solid var(--ok-border, #d7d5cc);
      border-radius: var(--ok-radius, 14px);
      overflow: hidden;
    }
    .card[data-missing] {
      background: var(--ok-surface-muted, rgba(0, 0, 0, 0.02));
    }
    .card > button.pick {
      display: flex;
      align-items: flex-start;
      gap: 0.7rem;
      width: 100%;
      box-sizing: border-box;
      text-align: left;
      background: transparent;
      border: 0;
      color: inherit;
      font: inherit;
      cursor: pointer;
      /* A finger on the counter tablet, not a mouse. */
      padding: 0.8rem 0.75rem;
      min-height: 3.5rem;
    }
    .card ion-icon {
      font-size: 1.4rem;
      flex: 0 0 auto;
      margin-top: 0.1rem;
      color: var(--ok-primary, var(--ion-color-primary, #3880ff));
    }
    .grow {
      flex: 1 1 auto;
      min-width: 0;
    }
    .name {
      display: block;
      font-weight: 600;
      overflow-wrap: anywhere;
    }
    .summary {
      display: block;
      margin-top: 0.15rem;
      font-size: 0.88rem;
      line-height: 1.45;
      color: var(--ok-muted, #6b6a63);
      overflow-wrap: anywhere;
    }
    .panel {
      border-top: 1px solid var(--ok-border-soft, rgba(0, 0, 0, 0.08));
      padding: 0.75rem;
      display: flex;
      flex-direction: column;
      gap: 0.7rem;
      background: var(--ok-surface-muted, rgba(0, 0, 0, 0.02));
    }
    .panel .plain {
      margin: 0;
      font-size: 0.95rem;
      line-height: 1.5;
    }
    .block > .head {
      display: block;
      font-size: 0.72rem;
      letter-spacing: 0.04em;
      text-transform: uppercase;
      color: var(--ok-muted, #6b6a63);
      margin-bottom: 0.3rem;
    }
    .item {
      display: flex;
      gap: 0.5rem;
      padding: 0.45rem 0;
      border-top: 1px solid var(--ok-border-soft, rgba(0, 0, 0, 0.06));
    }
    .item:first-of-type {
      border-top: 0;
    }
    .item .label {
      display: block;
      font-weight: 600;
      font-size: 0.9rem;
      overflow-wrap: anywhere;
    }
    .item .hint {
      display: block;
      font-size: 0.85rem;
      line-height: 1.45;
      color: var(--ok-muted, #6b6a63);
      overflow-wrap: anywhere;
    }
    .actions {
      display: flex;
      flex-wrap: wrap;
      gap: 0.4rem;
      align-items: center;
    }
    .muted {
      color: var(--ok-muted, #6b6a63);
      font-size: 0.88rem;
      line-height: 1.45;
    }
  `;

  @property({ attribute: false }) client: ModuleClient | null = null;

  @property({ attribute: false }) t: Translator = (k) => k;

  /** Which card is expanded. One at a time: this is a decision, not a comparison table. */
  @state() private picked: string | null = null;

  /**
   * What the hub answered about each witness event. `true` = it declares it, `false` = `404`,
   * **absent = not asked yet**, which is not the same thing and must not grey anything out.
   */
  @state() private known: Record<string, boolean> = {};

  @state() private busy = false;

  @state() private error = '';

  connectedCallback(): void {
    super.connectedCallback();
    void this.probe();
  }

  updated(changed: Map<string, unknown>): void {
    if (changed.has('client')) void this.probe();
  }

  /**
   * Asks the hub, once per distinct event, whether it has ever heard of it.
   *
   * A `not_found` is the only answer that means «this module is not installed». Anything else —
   * a network blip, a hub that refused for another reason — leaves the event unknown, because
   * greying a card out on a transient error tells the owner their hub is missing something it has.
   */
  private async probe(): Promise<void> {
    const client = this.client;
    if (!client?.events) return;
    const events = [...new Set(SECTORS.flatMap((s) => templatesOf(s)).flatMap((tpl) => tpl.witnesses.map((w) => w.event)))];
    await Promise.all(
      events
        .filter((event) => this.known[event] === undefined)
        .map(async (event) => {
          try {
            await client.events.shape(event);
            this.known = { ...this.known, [event]: true };
          } catch (e) {
            if (errorCode(e) === 'not_found') this.known = { ...this.known, [event]: false };
          }
        }),
    );
  }

  /** Expands one template's panel. Public so the shell (and the tests) can drive it. */
  open(id: string): void {
    this.picked = this.picked === id ? null : id;
    this.error = '';
  }

  /**
   * Creates the picked template as a **paused** flow and hands it over.
   *
   * `needsGrants` travels with it because a flow with no grants does nothing at all, and does it
   * silently: the screen to land on is Permissions, not the step list.
   */
  async use(): Promise<void> {
    const template = this.picked ? templateById(this.picked) : undefined;
    if (!template || !this.client || this.busy) return;
    this.busy = true;
    this.error = '';
    try {
      const flow = await this.client.flows.create({
        name: this.t(template.nameKey),
        enabled: false,
        definition: buildTemplate(template, this.t) as unknown as Record<string, unknown>,
      });
      this.dispatchEvent(
        new CustomEvent<{ flow: Flow; needsGrants: boolean }>('flows-template-used', {
          detail: { flow, needsGrants: templateGrants(template, this.t).length > 0 },
          bubbles: true,
          composed: true,
        }),
      );
      this.picked = null;
    } catch (e) {
      // The hub's refusals name the thing that is wrong (`command no encontrado: …`). Replacing
      // that with «error» throws away the only actionable sentence on the screen.
      this.error = (e as Error)?.message || this.t('ui.errGeneric');
    } finally {
      this.busy = false;
    }
  }

  private renderPanel(template: FlowTemplate) {
    const missing = missingModules(template, this.known);
    const grants = templateGrants(template, this.t);
    return html`<div class="panel" id=${`panel-${template.id}`}>
      <p class="plain">${this.t(template.plainKey)}</p>

      <div class="block">
        <span class="head">${this.t('ui.tplBlanksTitle')}</span>
        ${template.blanks.length
          ? template.blanks.map(
              (blank) => html`<div class="item" data-blank>
                <span class="grow">
                  <span class="label">${this.t(blank.labelKey)}</span>
                  <span class="hint">${this.t(blank.hintKey)}</span>
                </span>
              </div>`,
            )
          : html`<span class="muted">${this.t('ui.tplNoBlanks')}</span>`}
      </div>

      <div class="block">
        <span class="head">${this.t('ui.tplGrantsTitle')}</span>
        <span class="muted">${this.t('ui.tplGrantsIntro')}</span>
        ${grants.map(
          (grant) => html`<div class="item" data-grant=${grant.value}>
            <span class="grow">
              <span class="label">${this.t(template.grantReasons[grant.value] ?? grant.value)}</span>
              <span class="hint">${grant.value}</span>
            </span>
          </div>`,
        )}
      </div>

      ${missing.length
        ? html`<ok-inline-feedback tone="warning" icon="download-outline">
            ${this.t('ui.tplNeedsModule', { modules: missing.join(', ') })}
          </ok-inline-feedback>`
        : nothing}
      ${this.error
        ? html`<ok-inline-feedback tone="danger" icon="alert-circle-outline"
            >${this.error}</ok-inline-feedback
          >`
        : nothing}

      <div class="actions">
        <ion-button
          size="small"
          data-act="use"
          ?disabled=${this.busy || missing.length > 0}
          @click=${() => void this.use()}
        >
          ${this.busy ? this.t('ui.saving') : this.t('ui.tplUse')}
        </ion-button>
        <span class="muted">${this.t('ui.tplCreatedPaused')}</span>
      </div>
    </div>`;
  }

  private renderCard(template: FlowTemplate) {
    const missing = missingModules(template, this.known);
    const open = this.picked === template.id;
    return html`<div
      class="card"
      data-template=${template.id}
      data-missing=${missing.length ? missing.join(',') : nothing}
    >
      <button
        type="button"
        class="pick"
        aria-expanded=${open ? 'true' : 'false'}
        aria-controls=${`panel-${template.id}`}
        @click=${() => this.open(template.id)}
      >
        <ion-icon name=${template.icon} aria-hidden="true"></ion-icon>
        <span class="grow">
          <span class="name">${this.t(template.nameKey)}</span>
          <span class="summary">${this.t(template.summaryKey)}</span>
        </span>
        ${missing.length
          ? html`<ok-status-pill tone="neutral" label=${this.t('ui.tplUnavailable')}></ok-status-pill>`
          : nothing}
      </button>
      ${open ? this.renderPanel(template) : nothing}
    </div>`;
  }

  private renderSector(sector: Sector) {
    const templates = templatesOf(sector);
    if (!templates.length) return nothing;
    return html`<section data-sector=${sector}>
      <h3>${this.t(`ui.sector_${sector}`)}</h3>
      <div class="cards">${templates.map((template) => this.renderCard(template))}</div>
    </section>`;
  }

  render() {
    return html`<div class="wrap">
      <div class="lede">
        <p>${this.t('ui.tplLede')}</p>
        <button
          type="button"
          class="link"
          data-act="guide"
          @click=${() =>
            this.dispatchEvent(
              new CustomEvent('flows-open-guide', { bubbles: true, composed: true }),
            )}
        >
          ${this.t('ui.guideOpen')}
        </button>
      </div>
      ${SECTORS.map((sector) => this.renderSector(sector))}
    </div>`;
  }
}

define('erp-flows-gallery', ErpFlowsGallery);

declare global {
  interface HTMLElementTagNameMap {
    'erp-flows-gallery': ErpFlowsGallery;
  }
}
