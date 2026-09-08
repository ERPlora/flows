import { LitElement, html, css, nothing } from 'lit';
import { property, state } from 'lit/decorators.js';
import { define } from '@erplora/outfitkit/define';
import '@erplora/outfitkit/ok-inline-feedback';
import '@erplora/outfitkit/ok-status-pill';
import {
  SECTORS,
  TEMPLATES,
  availableTemplates,
  flowsOnSameTrigger,
  flowsWorthAsking,
  buildTemplate,
  mergeTemplates,
  moduleName,
  runnableHere,
  templateById,
  templateGrants,
  templateInstallation,
  templateName,
  templatePlain,
  templateSummary,
  templatesOf,
  unavailableModules,
} from '../../lib/templates';
import type { FlowTemplate, InstalledState, MergedCatalogue, Sector } from '../../lib/templates';
import { moduleTemplates } from '../../lib/module-templates';
import { describeStep } from '../../lib/plain-language';
import { schemaFacts } from '../../lib/ai-draft';
import type { SchemaFacts } from '../../lib/ai-draft';
import { errorCode } from '../../lib/hub-flows';
import { grantPin } from '../../lib/flow-doc';
import type { Grant } from '../../lib/flow-doc';
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
 *
 * 🔴 **«This catalogue» is the one ON SCREEN, half of which may have come from the hub**
 * (flows#101). Checked against the written cards alone, a link naming a card an app SERVES —
 * `module:whatsapp_inbox/appointment-from-whatsapp` — matches nothing and opens the whole gallery,
 * and so does the id of a hand copy the served twin has retired once that copy is gone
 * (flows#101). Both are addresses another repository publishes, so both have to keep landing on
 * the card. A retired id is accepted and handed back UNCHANGED: forwarding it is
 * `ErpFlowsGallery.landsOn`'s job, and doing it in two places is how the two come to disagree.
 */
export function templateFromSearch(
  search: string,
  catalogue: {
    cards: readonly FlowTemplate[];
    aliases: Readonly<Record<string, string>>;
  } = { cards: TEMPLATES, aliases: {} },
): string {
  const id = new URLSearchParams(search).get('template') ?? '';
  if (!id) return '';
  return catalogue.aliases[id] || templateById(id, catalogue.cards) ? id : '';
}

/**
 * Whether a navigation names a card at all — including one this catalogue does not have.
 *
 * Deliberately a different question from the one above, and the difference is the whole of
 * flows#58. WHICH card is this gallery's business, and its answer to an id that matches nothing is
 * «the whole gallery». WHETHER the owner asked for the gallery is the business of the screen
 * around it (`erp-flows-app`), which has to get an editor out of the way to answer — and there an
 * id that matches nothing is still somebody tapping «Set it up»: they land on the gallery, never
 * on whatever that screen happened to be showing.
 */
export function namesTemplate(search: string): boolean {
  return (new URLSearchParams(search).get('template') ?? '') !== '';
}

/**
 * Whether `el` sits on a page the shell is keeping alive OFF screen.
 *
 * The shell does not throw a module's page away when the owner leaves it (`ModuleView.vue`,
 * hub#1099): Ionic hides it with `.ion-page-hidden`, which is `display: none !important`. This
 * element stays mounted inside it and keeps hearing `popstate`, so a shortcut can perfectly well
 * arrive while there is no screen to scroll — and `scrollIntoView` on a box that does not exist
 * does nothing, silently, which is exactly how a card ended up «revealed» and never seen.
 *
 * It has to WALK, and cross every shadow root on the way: an element under a hidden ancestor keeps
 * its own computed `display`, and the card is inside this element's shadow root while the hidden
 * page is several roots above it. Stopping at the first boundary would answer «on screen» for
 * every card there is.
 */
export function offScreen(el: Element): boolean {
  let node: Node | null = el;
  while (node) {
    if (node instanceof Element && getComputedStyle(node).display === 'none') return true;
    const parent: Node | null = node.parentNode;
    node = parent instanceof ShadowRoot ? parent.host : parent;
  }
  return false;
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

/**
 * **One row of the hub's grants answer that is a command this flow may run** (flows#60).
 *
 * Checked instead of assumed, because this is the hub's answer and not ours, and because the two
 * ways of getting it wrong both end in a wrong badge. Reading `.kind` off a `null` THROWS, and the
 * catch around the call would swallow the whole flow's grants for one bad row — silently unbadging
 * a card the owner really has. And a row that is not a command is not what identifies the
 * automation: a hub holding only the card's READ permission never built it, so letting a `query`
 * through would badge a card whose automation does not exist.
 *
 * A row that is not an object with `kind: 'command'` and a string `value` costs that row, and only
 * that row.
 */
const isCommandGrant = (row: unknown): row is { kind: 'command'; value: string } =>
  typeof row === 'object' &&
  row !== null &&
  (row as { kind?: unknown }).kind === 'command' &&
  typeof (row as { value?: unknown }).value === 'string';

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

  /**
   * **What this hub's kernel can parse**, as the schema it serves declares it (flows#92).
   *
   * A card whose document carries a step key an older core does not know is not offered here: the
   * core answers `flow.invalid_definition` for the WHOLE document, so installing it from the
   * gallery would hand the owner an automation that refuses to save. `schemaFacts(undefined)`
   * answers `false` to everything, which makes the default **fail-closed** — «not asked yet» is
   * not offered. That is the opposite of the module probe on purpose: see `coreTakes`.
   */
  @property({ attribute: false }) facts: SchemaFacts = schemaFacts(undefined);

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

  /**
   * The recipes the installed modules bring, as this hub serves them (flows#98, hub#1611).
   *
   * Empty until the answer arrives, and empty for ever on a hub that has no such door — which is
   * the whole fleet until the image carrying hub#1645 reaches it. Either way the gallery is the
   * gallery it always was; these are added to it, they never replace it.
   */
  @state() private served: FlowTemplate[] = [];

  /**
   * Whether the hub could be asked at all, and what to say when it could not.
   *
   * `old-core` is not an error and must not read as one: the owner's hub simply predates the door,
   * their next update brings it, and nothing on the screen is missing meanwhile. `unavailable` IS
   * an error — the hub has the door and refused — and it is said out loud rather than swallowed,
   * because a recipe the owner installed an app for would otherwise be missing with no explanation.
   */
  @state() private modules: 'ok' | 'old-core' | 'unavailable' = 'ok';

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

  /**
   * Set while the linked card is waiting for its page to come back on screen (flows#58).
   *
   * One at a time, and never left behind: a second observer per render would pile up for as long
   * as the page stays hidden, and each of them would scroll.
   */
  private waiting: ResizeObserver | null = null;

  /**
   * The client this screen has already asked, so it is not asked the same thing twice (flows#69).
   *
   * Opening Automations used to cost two of everything — the flow list, the shape of every witness
   * event, and one grants call per candidate — because the load runs on connect AND on the first
   * render, where `client` going from nothing to the shell's client counts as a change. Both are
   * needed: the shell may hand the client over before this element is on screen or after, and
   * dropping either half leaves one of those two orders never loading at all.
   *
   * So the guard is «have I already asked THIS client», not «did the property change». It also
   * covers the other way a parent re-render reaches here: lit calls `updated` for a property set
   * to the very same object again.
   */
  private asked: ModuleClient | null = null;

  private readonly onPopState = (): void => this.followShortcut();

  connectedCallback(): void {
    super.connectedCallback();
    // Same module, same tab: the shell's router watches `moduleId`/`navId` only, so a navigation
    // that changes nothing but the query string does NOT re-create this element and
    // `connectedCallback` never fires again. Without this, only the first shortcut of a session
    // would work.
    window.addEventListener('popstate', this.onPopState);
    this.followShortcut();
    this.load();
  }

  /**
   * Everything this screen asks the hub when it opens, asked once per client.
   *
   * The three go out together; only the last question waits, and on purpose (flows#101). «Which
   * flows are worth asking about» is answered by the catalogue, and half the catalogue arrives in
   * {@link loadModuleTemplates} — so asking before it lands is asking about the written cards
   * alone, and every flow built from a recipe an app served comes back unasked, its card reading
   * «absent» over an automation that is already running. Waiting costs nothing this screen was not
   * already waiting for: the cards themselves cannot be painted until that same answer arrives.
   */
  private load(): void {
    const client = this.client;
    if (!client || client === this.asked) return;
    this.asked = client;
    void this.probe();
    void this.loadExisting(this.loadModuleTemplates());
  }

  /**
   * Asks the hub what its installed modules bring (`GET /api/hub/flows/templates`, hub#1645).
   *
   * The hub has already applied each family's module floor, so everything it answers is something
   * this business can run — the gallery does not judge that again. What it DOES keep judging is its
   * own kernel floor, in {@link runnableHere}: a document naming a step key this core cannot parse
   * is refused whole at save, so offering it would hand the owner an automation that dies on the
   * button.
   */
  private async loadModuleTemplates(): Promise<void> {
    const client = this.client;
    const ask = client?.flows?.templates;
    if (typeof ask !== 'function') {
      // Not a failure: a hub older than the door. The written catalogue is the whole gallery there.
      this.served = [];
      this.modules = 'old-core';
      return;
    }
    try {
      const rows = await ask.call(client!.flows);
      this.served = moduleTemplates(rows, client!.locale);
      this.modules = 'ok';
      // The catalogue just grew, and the shortcut was read against the written half alone
      // (flows#101): a link naming a card only the hub knows about was dropped as «no such card».
      // Re-read only while nothing is open — an owner who has since opened a card is not moved.
      if (!this.picked) this.followShortcut();
    } catch {
      // A hub that HAS the door and refused. Said on screen, never swallowed: the owner installed
      // an app for this, and a recipe missing without a word reads as an app that does nothing.
      this.served = [];
      this.modules = 'unavailable';
    }
  }

  /**
   * The catalogue actually on screen: what is written here, plus what the hub brought.
   *
   * Merged rather than concatenated because four cards in this catalogue are hand copies of
   * WhatsApp recipes made before any hub could serve them — see {@link mergeTemplates}. Only the
   * served cards this hub can RUN take part: retiring a copy in favour of something that is not
   * going to be painted would leave the owner with neither.
   */
  private get catalogue(): MergedCatalogue {
    return mergeTemplates(
      TEMPLATES,
      this.served.filter((tpl) => runnableHere(tpl, this.known, this.facts)),
    );
  }

  /**
   * The card an id ends up at, after a retired copy's shortcut has been forwarded.
   *
   * `?template=whatsapp-appointment` is published by `whatsapp_inbox`, not by us, so it goes on
   * arriving long after the card it names has stepped aside for the module's own recipe.
   */
  private landsOn(id: string | null): string | null {
    if (!id) return id;
    return this.catalogue.aliases[id] ?? id;
  }

  disconnectedCallback(): void {
    window.removeEventListener('popstate', this.onPopState);
    this.stopWaiting();
    super.disconnectedCallback();
  }

  updated(changed: Map<string, unknown>): void {
    if (changed.has('client')) this.load();
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
      id = templateFromSearch(window.location.search, this.catalogue);
    } catch {
      return; // No address bar, no shortcut. Still a gallery.
    }
    if (!id) return;
    // Whatever the previous shortcut was still waiting to show is not what the owner asked for now.
    this.stopWaiting();
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
    const card = this.renderRoot.querySelector(`[data-template="${this.landsOn(this.linked)}"]`);
    if (!card) return;
    if (offScreen(card) && this.waitForTheScreen(card)) return;
    this.stopWaiting();
    this.revealed = this.linked;
    (card as HTMLElement).scrollIntoView?.({ block: 'nearest', inline: 'nearest' });
  }

  /**
   * Holds the reveal until the card has a box again, and says whether it could.
   *
   * The card getting a size IS the page coming back — there is no event for it that reaches in
   * here: the shell's `ionViewDidEnter` fires on the Ionic page and does not cross into this
   * element. Where there is no `ResizeObserver` to hold it with, the answer is `false` and the
   * caller scrolls anyway: an attempt that may land on nothing costs nothing, and «never» is the
   * complaint this whole thing is about.
   */
  private waitForTheScreen(card: Element): boolean {
    const Observer = (globalThis as { ResizeObserver?: typeof ResizeObserver }).ResizeObserver;
    if (typeof Observer !== 'function') return false;
    if (!this.waiting) {
      this.waiting = new Observer(() => this.reveal());
      this.waiting.observe(card);
    }
    return true;
  }

  private stopWaiting(): void {
    this.waiting?.disconnect();
    this.waiting = null;
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
  private async loadExisting(served: Promise<void>): Promise<void> {
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
    // Never rejects — {@link loadModuleTemplates} answers «none» for a hub that has not got the
    // door and for one that refused, so this cannot leave the badge unasked.
    await served;
    await this.loadGrants(flows);
  }

  /**
   * What each candidate flow is ALLOWED to do — the other half of «is this card already installed»
   * (flows#60).
   *
   * Asked only about the flows that could be one of these cards — waiting on a catalogue event,
   * or coming round on a catalogue cadence (flows#68) — so a hub with
   * nothing automated pays nothing and a busy one pays for a handful, instead of a question per
   * card on every visit. Swallowed on failure, one flow at a time: an unanswered flow stays
   * `undefined` — «not asked» — and its card keeps the invitation it had before this existed,
   * which is the behaviour to fall back to and never an error on the catalogue.
   *
   * 🔴 **Asked of the catalogue ON SCREEN, not of the written one** (flows#101). A flow built from
   * a card an app serves matches nothing in `TEMPLATES`, so it was never asked about, came back
   * with no commands, and its card read «absent» — the gallery inviting the owner to build a
   * SECOND copy of the automation it is looking at. It goes unnoticed today only because every
   * served recipe the fleet has happens to have a hand copy here waiting on the same event; the
   * day those copies go (flows#101) it is every WhatsApp card, and it is already true for any app
   * that serves a recipe this file never copied.
   *
   * Asked ONCE per candidate, which is why {@link load} makes this wait for the served recipes
   * instead of asking twice — before and after they land. The saving this whole function exists
   * for is measured in round trips; paying for every answer twice on every visit would undo it,
   * and the screen would look exactly the same either way.
   */
  private async loadGrants(flows: readonly Flow[]): Promise<void> {
    const read = this.client?.flows?.grants;
    if (typeof read !== 'function') return; // A core whose flows surface predates grants.
    const candidates = flowsWorthAsking(flows, this.t, this.catalogue.cards);
    if (!candidates.length) return;
    const held = await Promise.all(
      candidates.map(async (flow) => {
        try {
          const grants: unknown = await read.call(this.client?.flows, flow.id);
          // Not a list at all is «not asked», not «holds nothing»: an unreadable answer must never
          // become the claim that the owner authorised this automation for nothing.
          if (!Array.isArray(grants)) return null;
          return [flow.id, grants.filter(isCommandGrant).map((g) => g.value)] as const;
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

  /**
   * Expands one template's panel. Public so the shell (and the tests) can drive it.
   *
   * 🔴 **The comparison goes through {@link landsOn}, both sides** (flows#101). What a shortcut
   * leaves in `picked` is the id the OWNER's link named, which since the WhatsApp copies were
   * retired is routinely a retired id — while the card on screen, and the id its own button hands
   * back, is the served one it forwards to. Compared raw, those two never match: the salon arrives
   * from Settings → WhatsApp with the card open, taps its heading to shut it, and the first tap
   * does nothing at all, because it re-picks the same card under its other name.
   */
  open(id: string): void {
    this.picked = this.landsOn(this.picked) === this.landsOn(id) ? null : id;
    this.error = '';
  }

  /**
   * Grants the permissions this card LIMITS, as limited as it declared them (flows#80).
   *
   * Only the limited ones. A card's other permissions stay a decision the owner makes on the
   * Permissions screen — installing a recipe is not a reason to hand it the rest unasked. But a
   * LIMIT cannot wait for that screen: the screen derives what it grants from the DOCUMENT, and
   * the limit does not live in the document. Left for later it is simply lost, and the salon ends
   * up holding the wide permission it was shown the narrow version of.
   *
   * Writing it here survives that screen: `missingGrants` matches on kind and value, so the row
   * is already held and never re-offered, and `mergeGrants` carries its pin through untouched.
   *
   * 🔴 **Written and then read back**, because a hub older than hub#1623 has no `payload` on a
   * grant and `serde` drops the unknown key without a word. Unchecked, this method would be the
   * bug it exists to fix, one step worse: the salon would HOLD «may cancel appointments», wide,
   * granted by a screen it never pressed a button on — and the Permissions screen would not even
   * list it as missing. So when the limit did not survive, the grant goes back out and the flow is
   * left exactly as it was before: nothing granted, and the owner told why.
   */
  private async applyDeclaredLimits(flow: Flow, template: FlowTemplate): Promise<boolean> {
    const limited = templateGrants(template, this.t).filter(
      (g) => Object.keys(grantPin(g)).length > 0,
    );
    if (!limited.length) return true;

    const write = this.client?.flows?.replaceGrants;
    if (typeof write !== 'function') {
      // A core whose flows surface predates grants cannot be told about the limit at all.
      this.error = this.t('ui.errLimitNotApplied');
      return false;
    }
    const pinOf = (g: Grant): string => JSON.stringify(Object.entries(grantPin(g)).sort());
    try {
      const stored = await write.call(this.client!.flows, flow.id, limited);
      const kept = Array.isArray(stored) ? (stored as Grant[]) : [];
      const survived = limited.every((want) =>
        kept.some((g) => g.kind === want.kind && g.value === want.value && pinOf(g) === pinOf(want)),
      );
      if (survived) return true;
      // The flow was created moments ago holding nothing, so an empty replace is exactly its
      // previous state — not an approximation of it.
      await write.call(this.client!.flows, flow.id, []);
    } catch {
      // Whatever the hub did with the write, what must not remain is a wide grant nobody asked
      // for. This second attempt is allowed to fail too; the message below is sent either way.
      await write.call(this.client!.flows, flow.id, []).catch(() => undefined);
    }
    this.error = this.t('ui.errLimitNotApplied');
    return false;
  }

  /**
   * Creates the picked template as a **paused** flow and hands it over.
   *
   * `needsGrants` travels with it because a flow with no grants does nothing at all, and does it
   * silently: the screen to land on is Permissions, not the step list.
   */
  async use(): Promise<void> {
    const picked = this.landsOn(this.picked);
    const template = picked ? templateById(picked, this.catalogue.cards) : undefined;
    if (!template || !this.client || this.busy) return;
    this.busy = true;
    this.error = '';
    try {
      const flow = await this.client.flows.create({
        name: templateName(template, this.t),
        enabled: false,
        definition: buildTemplate(template, this.t) as unknown as Record<string, unknown>,
      });
      // An install that could not put the limit on is NOT the install this card promised, so it
      // does not get to move the owner along as though it were: the panel stays where it is, with
      // the sentence that says what to do. The flow itself is kept — it exists, paused, in the
      // list — because throwing away what the hub already accepted would lose work as well.
      if (!(await this.applyDeclaredLimits(flow, template))) return;
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
      <p class="plain">${templatePlain(template, this.t)}</p>
      ${template.source ? this.renderSteps(template) : nothing}

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
        ${grants.map((grant) => {
          // flows#80 — a permission this card LIMITS says so here, before it is installed. The
          // limit is read off the grant itself rather than written a second time in prose: a
          // sentence and a pin that could disagree is how a screen ends up promising containment
          // the hub is not applying, which is the whole complaint this came from.
          const pin = Object.entries(grantPin(grant));
          return html`<div class="item" data-grant=${grant.value}>
            <span class="grow">
              <span class="label">${this.t(template.grantReasons[grant.value] ?? grant.value)}</span>
              ${pin.length
                ? html`<span class="hint" data-limit=${grant.value}
                    >${this.t('ui.tplGrantLimited', {
                      fields: pin.map(([field, value]) => `${field} = ${String(value)}`).join(', '),
                    })}</span
                  >`
                : nothing}
              <span class="hint">${grant.value}</span>
            </span>
          </div>`;
        })}
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
  /**
   * What a SERVED recipe does, read out of the document the module published (flows#98).
   *
   * A card written here has a sentence in the catalogue describing it; one that arrived from a
   * module has no sentence of ours and must not get an invented one. `describeStep` is the same
   * reading the editor gives any other flow, so what the owner is shown before creating it is what
   * they will be shown afterwards — the alternative was a card that says only where it came from.
   */
  private renderSteps(template: FlowTemplate) {
    const steps = buildTemplate(template, this.t).steps;
    if (!steps.length) return nothing;
    return html`<div class="block" data-steps>
      <span class="head">${this.t('ui.tplStepsTitle')}</span>
      ${steps.map(
        (step) => html`<div class="item"><span class="grow">${describeStep(step, this.t)}</span></div>`,
      )}
    </div>`;
  }

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
    const open = this.landsOn(this.picked) === template.id;
    // A card with nothing to say under its title leaves the line out rather than printing an empty
    // one: an empty node still takes its margin and opens a gap the owner reads as a missing word.
    const summary = templateSummary(template, this.t);
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
          <span class="name">${templateName(template, this.t)}</span>
          ${summary ? html`<span class="summary">${summary}</span>` : nothing}
        </span>
        ${this.renderInstalledPill(state)}
      </button>
      ${open ? this.renderPanel(template) : nothing}
    </div>`;
  }

  private renderSector(sector: Sector, catalogue: readonly FlowTemplate[]) {
    const templates = availableTemplates(sector, this.known, this.facts, catalogue);
    if (!templates.length) return nothing;
    return html`<section data-sector=${sector}>
      <h3>${this.t(`ui.sector_${sector}`)}</h3>
      <div class="cards">${templates.map((template) => this.renderCard(template))}</div>
    </section>`;
  }

  /**
   * One heading per app that brought recipes, under the trades and above the shopping list.
   *
   * Grouped by APP and not folded into a sector on purpose: the owner installed WhatsApp, and what
   * they are looking for is «what came with WhatsApp». A restaurant and a salon both install it,
   * so filing its recipes under one trade would hide them from the other.
   */
  private renderModuleSections(catalogue: readonly FlowTemplate[]) {
    const served = catalogue.filter((tpl) => tpl.source);
    const modules = [...new Set(served.map((tpl) => tpl.source!.module))];
    return modules.map((id) => {
      const cards = served.filter((tpl) => tpl.source!.module === id);
      return html`<section data-module=${id}>
        <h3>${this.t('ui.tplFromAppSection', { app: moduleName(id, this.t) })}</h3>
        <div class="cards">${cards.map((template) => this.renderCard(template))}</div>
      </section>`;
    });
  }

  /**
   * Why the apps' own recipes are not on this screen, when they are not.
   *
   * Two different sentences because they are two different situations for the owner: an older core
   * is «not yet, and nothing to do», a refusal is «something went wrong, try again». One sentence
   * covering both would be wrong for whoever is reading it.
   */
  private renderModulesState() {
    if (this.modules === 'ok') return nothing;
    return html`<p class="missing" data-modules-state=${this.modules}>${this.t(
      this.modules === 'old-core' ? 'ui.tplModulesOldCore' : 'ui.tplModulesUnavailable',
    )}</p>`;
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
    const { cards } = this.catalogue;
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
      ${SECTORS.map((sector) => this.renderSector(sector, cards))}
      ${this.renderModuleSections(cards)} ${this.renderMissing()} ${this.renderModulesState()}
    </div>`;
  }
}

define('erp-flows-gallery', ErpFlowsGallery);

declare global {
  interface HTMLElementTagNameMap {
    'erp-flows-gallery': ErpFlowsGallery;
  }
}
