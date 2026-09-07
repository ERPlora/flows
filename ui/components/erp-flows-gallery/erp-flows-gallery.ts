import { LitElement, html, css, nothing } from 'lit';
import { property, state } from 'lit/decorators.js';
import { define } from '@erplora/outfitkit/define';
import '@erplora/outfitkit/ok-inline-feedback';
import '@erplora/outfitkit/ok-status-pill';
import {
  SECTORS,
  availableTemplates,
  flowsOnSameTrigger,
  flowsOnTemplateEvents,
  buildTemplate,
  moduleName,
  templateById,
  templateGrants,
  templateInstallation,
  templatesOf,
  unavailableModules,
} from '../../lib/templates';
import type { FlowTemplate, InstalledState, Sector } from '../../lib/templates';
import { errorCode } from '../../lib/hub-flows';
import type { Flow, ModuleClient } from '../../lib/hub-flows';
import type { Translator } from '../../lib/plain-language';

/**
 * `?template=<id>` → the card the shortcut asked for, or `''` for «the whole gallery» (flows#56).
 *
 * The other end of this contract lives in another repository:
 * `whatsapp_inbox/ui/lib/whatsapp-uses.ts::galleryPath()` pushes `/m/flows/automations?template=<id>`
 * when the owner taps «Configurar» on one of the things their WhatsApp can be put to. The id is a
 * **gallery** id (`whatsapp-appointment`), never the file name of the document the module mirrors.
 *
 * An id this catalogue does not have answers `''`, which is the same answer as no parameter at all
 * — the same rule `inventory`'s `statusFilterFromSearch` applies to `?status=`. A link kept in a
 * bookmark, a template retired two releases ago or a typo has to land on the gallery the owner
 * would have seen anyway; the one thing it can never do is leave the screen empty with nothing on
 * it to explain why.
 */
export function templateFromSearch(search: string): string {
  const id = new URLSearchParams(search).get('template') ?? '';
  return templateById(id) ? id : '';
}

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
    /* «Active» / «Paused» / «Unfinished» on a card this hub already runs (flows#60): beside the
       name, never squeezing it — the summary is what the owner reads to recognise the card. */
    .card ok-status-pill {
      flex: 0 0 auto;
      margin-top: 0.1rem;
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

  /**
   * The flows this hub already has, for the «you already have one on this event» warning
   * (whatsapp_inbox#58) and for the badge that says a card is already installed (flows#60). Empty
   * until the hub answers, and empty FOREVER if it refuses: a gallery that cannot list flows still
   * has to show its catalogue.
   *
   * `commands` is filled a round trip later, only for the flows that could be one of these cards.
   * Until then it is `undefined`, which is «not asked yet» and badges nothing — never `[]`, which
   * would mean the owner authorised the flow for nothing.
   */
  @state() private existing: (Flow & { commands?: string[] })[] = [];

  @state() private busy = false;

  @state() private error = '';

  /**
   * The card the last shortcut named, so {@link reveal} knows what to bring on screen once it
   * exists.
   *
   * A shortcut is served on every NAVIGATION that names it — mount and `popstate` — and never on a
   * render: the URL says where the owner was sent, not what the screen must keep showing, and
   * re-reading it on every render is how a card becomes impossible to close. It is served again on
   * the same address on purpose: the shell keeps this element alive when the owner leaves the
   * module (`ModuleView.vue`, hub#1099) and only re-creates it when `route.fullPath` changes, so
   * the second tap on the same «Set it up» reaches this same instance through `popstate`, with
   * the same URL. Ignoring it would be the original complaint again.
   */
  private linked = '';

  /** The linked card, once it has been brought on screen. Reset each time a shortcut is served. */
  private revealed = '';

  private readonly onPopState = (): void => this.followShortcut();

  connectedCallback(): void {
    super.connectedCallback();
    // Same module, same tab: the shell's router watches `moduleId`/`navId` only, so a navigation
    // that changes nothing but the query string does NOT re-create this element and
    // `connectedCallback` never fires again. Without this, only the first shortcut of a session
    // would work.
    window.addEventListener('popstate', this.onPopState);
    this.followShortcut();
    void this.probe();
    void this.loadExisting();
  }

  disconnectedCallback(): void {
    window.removeEventListener('popstate', this.onPopState);
    super.disconnectedCallback();
  }

  updated(changed: Map<string, unknown>): void {
    if (changed.has('client')) {
      void this.probe();
      void this.loadExisting();
    }
    this.reveal();
  }

  /**
   * Opens the card a shortcut named (flows#56).
   *
   * Everything that is not a card of this catalogue — no parameter, an id that was retired, a hub
   * whose shell hands out no URL at all — leaves the gallery exactly as it was. That is the whole
   * error handling this deserves, and it is deliberate: the fallback IS the screen the owner
   * expected before shortcuts existed.
   */
  private followShortcut(): void {
    let id = '';
    try {
      id = templateFromSearch(window.location.search);
    } catch {
      return; // No address bar, no shortcut. Still a gallery.
    }
    if (!id) return;
    this.linked = id;
    this.revealed = '';
    this.picked = id;
    this.error = '';
    // `picked` may already be this card (opened on the first visit, never shut): still a cycle, so
    // `reveal()` runs now and marks it, instead of scrolling to it on some unrelated later render.
    this.requestUpdate();
  }

  /**
   * Scrolls the linked card into view once it is actually rendered.
   *
   * It is not on screen at mount time: the gallery hides every card whose modules this hub cannot
   * prove it has, and that answer arrives one round trip later (`probe`). And «opened» is not
   * «found» — the gallery sits under however many automations the business already has, so a card
   * opened below the fold looks like a screen that ignored the tap, which is the complaint this
   * whole change answers. If the probe ends up hiding the card, there is nothing to scroll to and
   * the plain gallery is the answer.
   */
  private reveal(): void {
    if (!this.linked || this.revealed === this.linked) return;
    const card = this.renderRoot.querySelector(`[data-template="${this.linked}"]`);
    if (!card) return;
    this.revealed = this.linked;
    (card as HTMLElement).scrollIntoView?.({ block: 'nearest', inline: 'nearest' });
  }

  /**
   * The hub's own flows, read once, only to warn about a trigger that is already taken.
   *
   * Swallowed on failure ON PURPOSE, and this is the whole of the error handling: the warning is a
   * courtesy, the catalogue is the screen. A hub that cannot answer `flows.list()` — offline, a
   * blip, an older core — must still show every card. What it must never do is turn a missing
   * warning into an error message, because that reads as «the gallery is broken» for a feature the
   * owner did not ask for.
   */
  private async loadExisting(): Promise<void> {
    const client = this.client;
    if (!client?.flows?.list) return;
    let flows: Flow[];
    try {
      flows = await client.flows.list();
    } catch {
      return; // No answer, no warning. Never an error on the catalogue.
    }
    // Published before the grants are in: the collision warning is useful straight away, and a
    // catalogue that waits for a second round trip to draw itself is a screen that flickers.
    this.existing = flows.map((flow) => ({
      ...flow,
      // Carried through on purpose: a paused flow does not fire, so it is not a collision.
      definition: (flow.definition ?? {}) as Record<string, unknown>,
    }));
    await this.loadGrants(flows);
  }

  /**
   * What each candidate flow is ALLOWED to do — the other half of «is this card already installed»
   * (flows#60).
   *
   * Asked only about the flows already waiting on one of the catalogue's events, so a hub with
   * nothing automated pays nothing and a busy one pays for a handful, instead of a question per
   * card on every visit. Swallowed on failure, one flow at a time: an unanswered flow stays
   * `undefined` — «not asked» — and its card keeps the invitation it had before this existed,
   * which is the behaviour to fall back to and never an error on the catalogue.
   */
  private async loadGrants(flows: readonly Flow[]): Promise<void> {
    const read = this.client?.flows?.grants;
    if (typeof read !== 'function') return; // A core whose flows surface predates grants.
    const candidates = flowsOnTemplateEvents(flows, this.t);
    if (!candidates.length) return;
    const held = await Promise.all(
      candidates.map(async (flow) => {
        try {
          const grants = await read.call(this.client?.flows, flow.id);
          return [flow.id, grants.filter((g) => g.kind === 'command').map((g) => g.value)] as const;
        } catch {
          return null;
        }
      }),
    );
    const byId = new Map(held.filter((row): row is readonly [string, string[]] => row !== null));
    if (!byId.size) return;
    this.existing = this.existing.map((flow) =>
      byId.has(flow.id) ? { ...flow, commands: byId.get(flow.id) } : flow,
    );
  }

  /** How far this hub has got with one card, and the flow to hand over when it has one. */
  private installationOf(template: FlowTemplate): {
    state: InstalledState;
    flow?: Flow & { commands?: string[] };
  } {
    return templateInstallation(template, this.t, this.existing);
  }

  /**
   * Hands the owner the automation they already have, instead of making them a second one.
   *
   * The screen that owns the editor does the opening: this element is the catalogue, and the flow
   * it points at is a flow like any other — the one difference is where it lands, and a half-built
   * one lands on Permissions, which is the only thing it is missing.
   */
  private view(template: FlowTemplate): void {
    const installed = this.installationOf(template);
    if (!installed.flow) return;
    this.dispatchEvent(
      new CustomEvent<{ flow: Flow; needsGrants: boolean }>('flows-open-flow', {
        detail: { flow: installed.flow, needsGrants: installed.state === 'unfinished' },
        bubbles: true,
        composed: true,
      }),
    );
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

      ${this.renderSameTrigger(template)}
      ${this.error
        ? html`<ok-inline-feedback tone="danger" icon="alert-circle-outline"
            >${this.error}</ok-inline-feedback
          >`
        : nothing}

      ${this.renderActions(template)}
    </div>`;
  }

  /**
   * **What the button offers, once the hub already runs this card** (flows#60).
   *
   * On a card this hub does not have, the offer is the one it always was. On one it does, the lead
   * action becomes «View it» — because tapping «Use this one» is exactly how the owner ended up
   * with two automations answering the same message.
   *
   * «Use this one» stays, second and quieter, and that is deliberate. Two flows on one event is a
   * legitimate thing to build, it is the owner's hub, and the switch-over the WhatsApp twins need
   * — pause the attended one, install the unattended one — goes through a card that is badged.
   * Warn and step aside, the same stance this panel already takes on a shared trigger
   * (whatsapp_inbox#58); refusing would be us deciding for them.
   */
  private renderActions(template: FlowTemplate) {
    const installed = this.installationOf(template);
    const use = html`<ion-button
      size="small"
      fill=${installed.state === 'absent' ? nothing : 'outline'}
      data-act="use"
      ?disabled=${this.busy}
      @click=${() => void this.use()}
    >
      ${this.busy ? this.t('ui.saving') : this.t('ui.tplUse')}
    </ion-button>`;
    if (installed.state === 'absent') {
      return html`<div class="actions">
        ${use}<span class="muted">${this.t('ui.tplCreatedPaused')}</span>
      </div>`;
    }
    return html`<div class="actions">
      <ion-button size="small" data-act="view" @click=${() => this.view(template)}>
        ${this.t('ui.tplView')}
      </ion-button>
      ${use}
      <span class="muted"
        >${this.t(
          installed.state === 'unfinished' ? 'ui.tplUnfinishedHint' : 'ui.tplHaveItAlready',
        )}</span
      >
    </div>`;
  }

  /** The four words of {@link InstalledState}, in the vocabulary the WhatsApp card already uses. */
  private renderInstalledPill(state: InstalledState) {
    if (state === 'absent') return nothing;
    const tone = state === 'active' ? 'success' : state === 'unfinished' ? 'warning' : 'neutral';
    const label =
      state === 'active'
        ? 'ui.active'
        : state === 'paused'
          ? 'ui.paused'
          : 'ui.tplUnfinished';
    return html`<ok-status-pill tone=${tone} label=${this.t(label)}></ok-status-pill>`;
  }

  /**
   * **«You already have one of these»** (whatsapp_inbox#58).
   *
   * Two flows on one event both fire. For most pairs that is wanted; for the two WhatsApp
   * appointment families it books every message twice and sends the customer two confirmations.
   * The owner is the one who can tell those apart, so this NAMES the flow already waiting on that
   * event and leaves the button alone — warn, do not refuse, which is what Zapier does with a
   * duplicate Zap. It sits immediately above the button, because a warning further up the panel is
   * a warning nobody reads.
   */
  private renderSameTrigger(template: FlowTemplate) {
    const clashing = flowsOnSameTrigger(template, this.t, this.existing);
    if (!clashing.length) return nothing;
    return html`<ok-inline-feedback
      tone="warning"
      icon="alert-circle-outline"
      data-same-trigger
      >${this.t(clashing.length === 1 ? 'ui.tplSameTrigger' : 'ui.tplSameTriggerMany', {
        flows: clashing.join(', '),
      })}</ok-inline-feedback
    >`;
  }

  private renderCard(template: FlowTemplate) {
    const open = this.picked === template.id;
    const { state } = this.installationOf(template);
    return html`<div
      class="card"
      data-template=${template.id}
      data-installed=${state === 'absent' ? nothing : state}
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
        ${this.renderInstalledPill(state)}
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
