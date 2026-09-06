import { LitElement, html, css, nothing } from 'lit';
import { property, state } from 'lit/decorators.js';
import { define } from '@erplora/outfitkit/define';
import '@erplora/outfitkit/ok-inline-feedback';
import {
  SECTORS,
  availableTemplates,
  buildTemplate,
  moduleName,
  templateById,
  templateGrants,
  templatesOf,
  unavailableModules,
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
 *   and leaves those cards out (flows#52). The alternative is a card that fails at grant time with
 *   «command no encontrado», three screens later, in words nobody outside this repository can
 *   read. The cards used to be shown greyed out with the missing module named on them (flows#38);
 *   what that was protecting — the owner learning WHICH app to install, by name — is now one line
 *   under the cards, said once instead of on every grey card.
 * - **Create anything running.** A template becomes a flow with `enabled: false`. An automation
 *   acts while nobody is watching; one that starts because somebody tapped a picture of it is
 *   precisely what the grants system exists to prevent.
 * - **Hide the permissions until afterwards.** What it will ask for, and why, is on the panel
 *   BEFORE the flow exists (pm#134 point 3: this is where people get stuck).
 *
 * Layout is a fluid grid of cards (flows#40): `auto-fill` with a 20rem card minimum, the recipe
 * the hub's other card screens use, so the gallery takes the width the screen gives it — the same
 * box the «Nueva automatización» bar above sits in — instead of a 44rem column that left 220px
 * dead on each side at 1440 with the CTA orphaned in the corner. Below 480px it collapses to the
 * one column a phone already had. Nothing here is narrower than a fingertip.
 */
export class ErpFlowsGallery extends LitElement {
  static styles = css`
    :host {
      display: block;
      color: var(--ok-text, var(--ion-text-color, #1c1b18));
      font-family: var(--ok-font, var(--ion-font-family, system-ui), sans-serif);
    }
    /* Fluid, not capped: the gallery fills the box the screen hands it — the same box the
       «Nueva automatización» bar sits in — so the cards and the CTA read as one screen. The old
       44rem cap spent 704px of a 1144px host, 220px dead on each side (flows#40). */
    .wrap {
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
      /* The wrap is fluid now; a sentence still reads best under ~70 characters, so the lede
         keeps a reading measure even on a 1440px screen. */
      max-width: 46rem;
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
    /* The workspace's own card recipe (kitchen's tickets, customers' cards): auto-fill with a
       card minimum. 3 columns at 1440, 2 at 834, 1 at 390 — the cards get wider, never a wider
       margin. */
    .cards {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(20rem, 1fr));
      gap: 0.75rem;
    }
    /* Below 480px the 20rem minimum no longer fits the container (a 320px screen leaves ~290px),
       and an auto-fill that cannot fit pushes its track off the edge instead of wrapping. One
       column is what a phone showed before this grid existed — the 390px design stays put. */
    @media (max-width: 480px) {
      .cards {
        grid-template-columns: 1fr;
      }
    }
    .card {
      background: var(--ok-surface, var(--ion-card-background, #fff));
      border: 1px solid var(--ok-border, #d7d5cc);
      border-radius: var(--ok-radius, 14px);
      overflow: hidden;
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
    /* The one line that replaced the grey cards (flows#52): under everything, because it is about
       what is NOT on the screen. */
    .missing {
      margin: 0;
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

      ${this.error
        ? html`<ok-inline-feedback tone="danger" icon="alert-circle-outline"
            >${this.error}</ok-inline-feedback
          >`
        : nothing}

      <div class="actions">
        <ion-button
          size="small"
          data-act="use"
          ?disabled=${this.busy}
          @click=${() => void this.use()}
        >
          ${this.busy ? this.t('ui.saving') : this.t('ui.tplUse')}
        </ion-button>
        <span class="muted">${this.t('ui.tplCreatedPaused')}</span>
      </div>
    </div>`;
  }

  private renderCard(template: FlowTemplate) {
    const open = this.picked === template.id;
    return html`<div class="card" data-template=${template.id}>
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
      </button>
      ${open ? this.renderPanel(template) : nothing}
    </div>`;
  }

  private renderSector(sector: Sector) {
    const templates = availableTemplates(sector, this.known);
    if (!templates.length) return nothing;
    return html`<section data-sector=${sector}>
      <h3>${this.t(`ui.sector_${sector}`)}</h3>
      <div class="cards">${templates.map((template) => this.renderCard(template))}</div>
    </section>`;
  }

  /**
   * The one line that replaced the grey cards (flows#52, keeping what flows#38 protected).
   *
   * Sorted by the name the owner reads, not by the order the catalogue happens to have: this is a
   * shopping list, and «Tasks, Appointments» sends somebody looking for a list that is not sorted.
   */
  private renderMissing() {
    const ids = unavailableModules(this.known);
    if (!ids.length) return nothing;
    const names = ids
      .map((id) => moduleName(id, this.t))
      .sort((a, b) => a.localeCompare(b))
      .join(', ');
    return html`<p class="missing" data-missing-modules>${this.t(
      ids.length === 1 ? 'ui.tplHiddenModule' : 'ui.tplHiddenModules',
      { modules: names },
    )}</p>`;
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
      ${SECTORS.map((sector) => this.renderSector(sector))} ${this.renderMissing()}
    </div>`;
  }
}

define('erp-flows-gallery', ErpFlowsGallery);

declare global {
  interface HTMLElementTagNameMap {
    'erp-flows-gallery': ErpFlowsGallery;
  }
}
