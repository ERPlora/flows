import { LitElement, html, css, nothing } from 'lit';
import { property, state } from 'lit/decorators.js';
import { define } from '@erplora/outfitkit/define';
import '@erplora/outfitkit/ok-empty-state';
import '@erplora/outfitkit/ok-inline-feedback';
import '@erplora/outfitkit/ok-status-pill';
import '../erp-flows-editor/erp-flows-editor';
import '../erp-flows-gallery/erp-flows-gallery';
import { namesTemplate, shortcutServed } from '../erp-flows-gallery/erp-flows-gallery';
import '../erp-flows-guide/erp-flows-guide';
import '../erp-flows-approvals/erp-flows-approvals';
import '../erp-flows-dead-letter/erp-flows-dead-letter';
import { readDoc, SCHEMA_VERSION } from '../../lib/flow-doc';
import {
  EMPTY_VIEW,
  applyView,
  copyName,
  duplicateOf,
  isFiltering,
  secretRefs,
} from '../../lib/flow-list';
import type { ListView, SortBy, StateFilter, TriggerFilter } from '../../lib/flow-list';
import { describeTrigger } from '../../lib/plain-language';
import { catalogEntry } from '../../lib/trigger-catalog';
import { CAPABILITY_DENIED, errorCode, resolveClient } from '../../lib/hub-flows';
import type { Flow, ModuleClient } from '../../lib/hub-flows';
import { flowProblems, repairedDefinition, WHATSAPP_MESSAGE_EVENT } from '../../lib/flow-checkup';
import { ambiguousReplyGuards, sendsReplyToFlow } from '../../lib/question-steps';
import type { FlowProblem } from '../../lib/flow-checkup';
import { contractProblems, draftGaps, readDraft, schemaFacts } from '../../lib/ai-draft';
import type { Draft, DraftGap, DraftProblem, DraftRow, SchemaFacts } from '../../lib/ai-draft';
// The module's i18n catalogue (ADR-0055): esbuild inlines these JSONs into the bundle and the
// active language comes from the shell (`erplora.locale`, `erplora:locale-changed`).
import esLocale from '../../../locales/es.json';
import enLocale from '../../../locales/en.json';

const CATALOG: Record<string, unknown> = { es: esLocale, en: enLocale };

/** What the whole screen is showing, and why. */
type Gate = 'loading' | 'ready' | 'unsupported' | 'denied' | 'not_admin' | 'error';

/**
 * One proposal in the tray, already judged (flows#4).
 *
 * `draft` is present only when the row could be read AND meets the contract this hub serves.
 * `problems` is the other half: a proposal that fails is shown WITH its reason and can only be
 * discarded. There is deliberately no third state where it opens «mostly fine» — a document
 * repaired down to the parts we understood is how an automation ends up doing three quarters of
 * what it says on screen.
 */
interface TrayItem {
  id: string;
  name: string;
  draft?: Draft;
  problems: DraftProblem[];
}

/**
 * **The automations screen** — the one component `module.json` mounts.
 *
 * It owns three things and delegates the rest: the door into the kernel, the list, and which of
 * the two the person is looking at.
 *
 * The door is the interesting part. Three things have to line up before this module can touch a
 * flow, and each one fails differently, so each one gets its own sentence:
 *
 * - the hub's core has to HAVE the flows surface (hub#714) — otherwise there is nothing to talk to;
 * - the owner has to have granted this module `manage_flows` — `capability_denied`, and the answer
 *   is «go to Settings → Permissions», not «error»;
 * - the person has to hold an owner/admin session — a cashier gets `403`, and telling them to
 *   check their permissions would send them somewhere they cannot go.
 *
 * And the contract itself is ASKED, never bundled: `GET /api/hub/flows/schema` (hub#716) says
 * which document version this core enforces. A module updates on its own clock, so a bundled copy
 * is a photo of whichever hub it was built against — wrong for somebody by construction.
 */
export class ErpFlowsApp extends LitElement {
  static styles = css`
    :host {
      display: flex;
      flex-direction: column;
      min-height: 0;
      height: 100%;
      font-family: var(--ok-font, var(--ion-font-family, system-ui), sans-serif);
      color: var(--ok-text, var(--ion-text-color, #1c1b18));
    }
    .head {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      padding: 0.75rem;
    }
    .head .grow {
      flex: 1 1 auto;
    }
    .body {
      flex: 1 1 auto;
      min-height: 0;
      overflow-y: auto;
      padding: 0 0.75rem 1rem;
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
    .flow {
      display: flex;
      align-items: center;
      gap: 0.4rem;
      background: var(--ok-surface, var(--ion-card-background, #fff));
      border: 1px solid var(--ok-border, var(--ion-border-color, #d7d5cc));
      border-radius: var(--ok-radius, 14px);
      overflow: hidden;
    }
    .flow > button.open {
      flex: 1 1 auto;
      min-width: 0;
      display: flex;
      flex-direction: column;
      align-items: flex-start;
      gap: 0.15rem;
      text-align: left;
      background: transparent;
      border: 0;
      color: inherit;
      font: inherit;
      cursor: pointer;
      padding: 0.7rem 0.75rem;
      /* A finger on the counter tablet, not a mouse. */
      min-height: 3.25rem;
    }
    .flow .name {
      font-weight: 600;
      overflow-wrap: anywhere;
    }
    .flow .when {
      font-size: 0.85rem;
      color: var(--ok-muted, #6b6a63);
      overflow-wrap: anywhere;
    }
    .flow .side {
      display: flex;
      align-items: center;
      gap: 0.25rem;
      padding-right: 0.5rem;
    }
    .icon-btn {
      border: 0;
      background: transparent;
      color: inherit;
      font: inherit;
      cursor: pointer;
      min-width: 2.75rem;
      min-height: 2.75rem;
      border-radius: var(--ok-radius-sm, 10px);
    }
    .icon-btn:hover {
      background: var(--ok-hover, rgba(0, 0, 0, 0.06));
    }
    /* The console (flows#19). One column that wraps: the search box takes the width it can get and
       the three narrow selects sit under it on a phone rather than being squeezed into a strip
       nobody can read. */
    .toolbar {
      display: flex;
      flex-direction: column;
      gap: 0.4rem;
    }
    .toolbar .search {
      width: 100%;
      box-sizing: border-box;
      font: inherit;
      color: inherit;
      background: var(--ok-surface, var(--ion-card-background, #fff));
      border: 1px solid var(--ok-border, #d7d5cc);
      border-radius: var(--ok-radius-sm, 10px);
      padding: 0 0.7rem;
      /* A finger on the counter tablet, not a mouse. */
      min-height: 2.75rem;
    }
    .toolbar .filters {
      display: flex;
      flex-wrap: wrap;
      align-items: center;
      gap: 0.4rem;
    }
    .toolbar select {
      font: inherit;
      font-size: 0.9rem;
      color: inherit;
      background: var(--ok-surface, var(--ion-card-background, #fff));
      border: 1px solid var(--ok-border, #d7d5cc);
      border-radius: var(--ok-radius-pill, 999px);
      padding: 0 0.6rem;
      min-height: 2.5rem;
    }
    .toolbar .filters .hint {
      margin-left: auto;
    }
    .selection {
      display: flex;
      align-items: center;
      flex-wrap: wrap;
      gap: 0.4rem;
      padding: 0.4rem 0.6rem;
      border: 1px solid var(--ok-border, #d7d5cc);
      border-radius: var(--ok-radius, 14px);
      background: var(--ok-surface-muted, rgba(0, 0, 0, 0.03));
    }
    .selection .grow {
      flex: 1 1 auto;
      font-size: 0.9rem;
      font-weight: 600;
    }
    .flow {
      flex-wrap: wrap;
    }
    .flow > input.pick {
      flex: 0 0 auto;
      margin: 0 0 0 0.6rem;
      width: 1.15rem;
      height: 1.15rem;
    }
    /* Full width so it pushes the row apart instead of squeezing in beside the switch — this is a
       question, and a question that has to be hunted for is one people answer without reading. */
    .flow > .confirm {
      flex: 1 0 100%;
      display: flex;
      align-items: center;
      flex-wrap: wrap;
      gap: 0.4rem;
      padding: 0.5rem 0.75rem;
      border-top: 1px solid var(--ok-border-soft, rgba(0, 0, 0, 0.08));
      background: var(--ok-surface-muted, rgba(0, 0, 0, 0.03));
    }
    /* The question takes its OWN line, at every width. Sharing the line with the two buttons
       pushed «Yes, delete it» off the right edge of the card at 390px — the one control that must
       be read before it is pressed, half off screen. */
    .flow > .confirm .grow {
      flex: 1 1 100%;
      font-size: 0.9rem;
    }
    .flow > .confirm button {
      font: inherit;
      font-size: 0.9rem;
      cursor: pointer;
      border-radius: var(--ok-radius-pill, 999px);
      padding: 0 1rem;
      min-height: 2.5rem;
    }
    .flow > .confirm button.danger {
      border: 1px solid transparent;
      background: var(--ok-danger, var(--ion-color-danger, #c0392b));
      color: var(--ok-danger-contrast, var(--ion-color-danger-contrast, #fff));
      font-weight: 600;
    }
    .flow > .confirm button.quiet {
      border: 1px solid var(--ok-border, #d7d5cc);
      background: transparent;
      color: inherit;
    }
    /* Its own line under the row, like the delete question: what it says has to be READ, and
       sharing the line with the name and the switch is how it gets skipped. */
    .flow > .checkup {
      flex: 1 0 100%;
      display: flex;
      align-items: center;
      flex-wrap: wrap;
      gap: 0.5rem;
      padding: 0.5rem 0.75rem;
      border-top: 1px solid var(--ok-border-soft, rgba(0, 0, 0, 0.08));
      background: var(--ok-warning-soft, rgba(214, 158, 46, 0.12));
    }
    .flow > .checkup .said {
      flex: 1 1 14rem;
      min-width: 0;
      font-size: 0.9rem;
    }
    .flow > .checkup .said strong {
      display: block;
    }
    .flow > .checkup button {
      font: inherit;
      font-size: 0.9rem;
      cursor: pointer;
      border-radius: var(--ok-radius-pill, 999px);
      padding: 0 1rem;
      min-height: 2.5rem;
      border: 1px solid transparent;
      background: var(--ok-primary, var(--ion-color-primary, #3880ff));
      color: var(--ok-primary-contrast, var(--ion-color-primary-contrast, #fff));
      font-weight: 600;
    }
    .flow > .checkup button[disabled] {
      opacity: 0.6;
      cursor: default;
    }
    .empty-filter {
      display: flex;
      align-items: center;
      flex-wrap: wrap;
      gap: 0.5rem;
      padding: 0.75rem 0;
    }
    .gate {
      max-width: 34rem;
      margin: 2rem auto;
    }
    .hint {
      font-size: 0.85rem;
      color: var(--ok-muted, #6b6a63);
    }
    /* A proposal's row is NOT a button: the whole card is not tappable, because the two things it
       can do — review, discard — are decisions, and «I tapped it by accident» must not be one of
       them. Same shape as a flow row, without the affordance. */
    .flow > .draft-main {
      flex: 1 1 auto;
      min-width: 0;
      display: flex;
      flex-direction: column;
      align-items: flex-start;
      gap: 0.15rem;
      padding: 0.7rem 0.75rem;
      min-height: 3.25rem;
      justify-content: center;
    }
  `;

  /**
   * The client the SHELL injects (`ModuleView.vue`: `el.client = client.forModule('flows')`).
   * The id comes from the loader — the only thing that truly knows which module is being mounted.
   */
  @property({ attribute: false }) client: ModuleClient | null = null;

  @state() private gate: Gate = 'loading';

  @state() private flows: Flow[] = [];

  @state() private editing: Flow | null = null;

  @state() private isNew = false;

  /** Which tab the editor opens on. A flow straight out of the gallery opens on Permissions. */
  @state() private editorTab: 'editor' | 'permissions' | 'history' = 'editor';

  @state() private guideOpen = false;

  /** Pending approvals. `0` mounts no tray at all — see {@link countApprovals}. */
  @state() private approvalCount = 0;

  /** How many events of this hub never got delivered (flows#20). `0` = no tray at all. */
  @state() private deadCount = 0;

  /** The queue exists and this module has not been allowed to read it — a fixable refusal. */
  @state() private deadDenied = false;

  /**
   * Once the tray has earned its place it KEEPS it for this visit.
   *
   * Otherwise clearing the last row would make the tray vanish under the owner's finger, taking
   * the confirmation of what they just did with it — «did that work?» with nothing left on screen
   * to answer. What replaces the rows is «nothing is stuck», which is the reassuring version of
   * empty, and it is gone again next time the screen is opened.
   */
  @state() private deadShown = false;

  @state() private error = '';

  @state() private coreVersion = '';

  /** What the assistant proposed and nobody has answered yet (flows#4). */
  @state() private tray: TrayItem[] = [];

  /** How the list is narrowed and ordered right now (flows#19). */
  @state() private view: ListView = EMPTY_VIEW;

  /** The rows chosen for a bulk action. Ids, not flows: the list underneath keeps reloading. */
  @state() private chosen: string[] = [];

  /** The row whose × was pressed once. Deleting is the only thing here that cannot be undone. */
  @state() private confirmDelete = '';

  /** What just happened, in the owner's words — a copy made, and what it did NOT bring with it. */
  @state() private notice = '';

  /** The proposal currently open in the editor, so saving it can be recorded against it. */
  @state() private reviewing: TrayItem | null = null;

  /** What the editor is told to shout about: the assistant's notes and the holes it left. */
  @state() private draftReview: { notes: string[]; gaps: DraftGap[] } | null = null;

  /** The automation whose repair is in flight, so its button cannot be pressed twice. */
  @state() private repairing = '';

  /** Whether this hub was SEEN saying which automation asked a question (hub#1962, flows#125). */
  @state() private replyToFlowSeen = false;

  /** The contract THIS hub serves, read from `GET /api/hub/flows/schema` — never bundled. */
  private facts: SchemaFacts = schemaFacts(undefined);

  private readonly onLocaleChange = (): void => this.requestUpdate();

  /**
   * **A shortcut that names a card gets this screen out of its way** (flows#58).
   *
   * A shortcut pushes `/m/flows/automations?template=<id>` and fires `popstate` — the shape
   * Settings → WhatsApp published before whatsapp_inbox#123 (today it links with the bare address,
   * flows#119). The gallery already answers that on its
   * own (flows#56/#57) — but only while it is on screen, and it is not: with the editor or the
   * guide up, `render()` never puts it in the document, so the one element that listens is not
   * there to listen. Nothing else saves it either, because the shell keeps this page alive when
   * the owner leaves the module and re-creates the element only when `route.fullPath` changes
   * (`ModuleView.vue`, hub#1099) — and the same shortcut, tapped again, is the same address.
   *
   * So the second tap on «Configurar» lands the owner in the editor of whatever they made the
   * first time. Stepping aside is this screen's job, and it does it for an unknown id too: the
   * gallery decides WHICH card, and its answer to an id it does not have is still the gallery.
   *
   * A navigation that names NO card is left alone on purpose — the Back button, a jump to another
   * module, the shell tidying the address. Closing the editor on any of those would throw away
   * what the owner was writing, which is a worse bug than the one this fixes.
   *
   * And so is one whose card was already served from this same history entry (flows#141): the
   * address still names it, but nobody tapped it again — a real tap pushes a fresh entry. Stepping
   * aside there is how an open draft kept being swapped for the gallery while the owner worked.
   */
  private readonly onShortcut = (): void => {
    let named = false;
    try {
      named = namesTemplate(window.location.search) && !shortcutServed(window.location.search);
    } catch {
      return; // No address bar, no shortcut. Nothing to step aside from.
    }
    if (!named || (!this.editing && !this.isNew && !this.guideOpen)) return;
    this.editing = null;
    this.isNew = false;
    this.editorTab = 'editor';
    this.reviewing = null;
    this.draftReview = null;
    this.guideOpen = false;
    // Same reason «Back» reloads: the owner has been in the editor, so the list under the gallery
    // is one save behind.
    void this.reload();
  };

  /** The module catalogue, resolved against the shell's active language (ADR-0055). */
  private readonly t = (key: string, params?: Record<string, unknown>): string => {
    const client = this.client as (ModuleClient & { t?: unknown }) | null;
    if (typeof client?.t === 'function') return client.t(CATALOG, key, params);
    const global = (globalThis as { erplora?: { t?: unknown } }).erplora;
    if (typeof global?.t === 'function') {
      return (global.t as (c: unknown, k: string, p?: unknown) => string)(CATALOG, key, params);
    }
    return key;
  };

  async connectedCallback(): Promise<void> {
    super.connectedCallback();
    window.addEventListener('erplora:locale-changed', this.onLocaleChange);
    window.addEventListener('popstate', this.onShortcut);
    await this.open();
  }

  disconnectedCallback(): void {
    super.disconnectedCallback();
    window.removeEventListener('erplora:locale-changed', this.onLocaleChange);
    window.removeEventListener('popstate', this.onShortcut);
  }

  /** Resolves the door, checks the contract, loads the list. Every failure has its own screen. */
  private async open(): Promise<void> {
    const client = resolveClient(this, (globalThis as { erplora?: never }).erplora);
    if (!client) {
      this.gate = 'unsupported';
      return;
    }
    this.client = client;
    try {
      const schema = await client.flows.schema();
      this.coreVersion = schema?.core_version ?? '';
      // The version goes in TOO (flows#111): one capability a card can need — «this hub stores the
      // limit a read carries», hub#1662 — is nowhere in the schema's shape, and this response is
      // the only place the editor is ever told which release it is talking to.
      this.facts = schemaFacts(schema?.schema, schema?.core_version);
      if (schema && schema.schema_version !== SCHEMA_VERSION) {
        // Ahead of its hub, this editor would offer a step the hub refuses to save; behind it, it
        // would hide one that works. Saying which of the two is happening beats a save error.
        this.gate = 'unsupported';
        return;
      }
    } catch (e) {
      if (this.setGateFromError(e)) return;
    }
    await this.reload();
  }

  /** Turns a refusal into the screen that names it. Returns `true` when it handled the error. */
  private setGateFromError(e: unknown): boolean {
    const code = errorCode(e);
    if (code === CAPABILITY_DENIED) {
      this.gate = 'denied';
      return true;
    }
    if (code === 'forbidden' || code === 'unauthorized') {
      this.gate = 'not_admin';
      return true;
    }
    this.error = (e as Error)?.message || this.t('ui.errGeneric');
    this.gate = 'error';
    return true;
  }

  private async reload(): Promise<void> {
    if (!this.client) return;
    try {
      const flows = await this.client.flows.list();
      this.flows = Array.isArray(flows) ? flows : [];
      this.gate = 'ready';
    } catch (e) {
      this.setGateFromError(e);
      return;
    }
    await this.askReplyToFlow();
    await this.countApprovals();
    await this.countDead();
    await this.loadTray();
  }

  /**
   * **Is anything stuck?** — asked with the CHEAP count (`GET …/dead/count`), never by pulling the
   * queue down with its payloads just to decide whether a heading appears.
   *
   * The tray is mounted only when the answer is not zero, for the same reason the approvals one is:
   * a box headed «needs your attention» that is empty every day is furniture, and furniture is what
   * people stop seeing — which is precisely how a lost invoice stays lost.
   *
   * Two exceptions to «zero means silence», and both are about not hiding something the owner can
   * fix or is owed:
   *
   * - `capability_denied` — the queue exists and THIS module has not been allowed to read it. That
   *   is a checkbox in Settings → Permissions, so it gets a line on screen; swallowing it would be
   *   the module quietly concealing its own missing permission.
   * - a hub with no such surface at all (older than hub#953) — deliberately silent. There is
   *   nothing the owner can do, and this module is not published to hubs that old anyway.
   */
  private async countDead(): Promise<void> {
    const count = this.client?.events?.deadCount;
    if (typeof count !== 'function') {
      this.deadCount = 0;
      this.deadDenied = false;
      return;
    }
    try {
      const answer = await count.call(this.client?.events);
      this.deadCount = Number(answer?.count) || 0;
      this.deadDenied = false;
      if (this.deadCount) this.deadShown = true;
    } catch (e) {
      this.deadCount = 0;
      this.deadDenied = errorCode(e) === CAPABILITY_DENIED;
      if (this.deadDenied) this.deadShown = true;
      // Any other refusal costs the tray and never the screen: the automations are still listable,
      // and replacing them with an error over a side dish would be the worse trade.
    }
  }

  /**
   * How many proposals are waiting on a person.
   *
   * Asked here, and not left to the tray, because the tray is only MOUNTED when the answer is not
   * zero: an empty box headed «waiting for you» is a permanent fixture on a screen whose job is to
   * show automations, and a tray behind a tab nobody opens is the same as no tray at all — which
   * is exactly how a `policy: manual` proposal reaches its 72-hour expiry unseen.
   */
  private async countApprovals(): Promise<void> {
    if (!this.client?.flows.approvals) {
      this.approvalCount = 0;
      return;
    }
    try {
      const rows = await this.client.flows.approvals('pending');
      this.approvalCount = Array.isArray(rows) ? rows.length : 0;
    } catch {
      // An older core, or a refusal: it costs the tray, never the screen.
      this.approvalCount = 0;
    }
  }

  // ── What the assistant proposed (flows#4) ───────────────────────────────────────────────────

  /**
   * The proposals waiting for a person, each already judged against this hub's contract.
   *
   * Every failure here is SWALLOWED on purpose, and it is worth saying why: this query is the
   * module's own, and an older published version of this very module does not declare it. A hub
   * that installed the module last month would answer `query_not_found`, and letting that reach
   * the gate would replace a working automations screen with an error page over a feature that
   * simply is not there yet. No tray is a correct screen; a broken one is not.
   */
  private async loadTray(): Promise<void> {
    const query = this.client?.query;
    if (typeof query !== 'function') return;
    let rows: DraftRow[] = [];
    try {
      rows = ((await query.call(this.client, 'flows.drafts.list')) as DraftRow[]) ?? [];
    } catch {
      this.tray = [];
      return;
    }
    this.tray = (Array.isArray(rows) ? rows : []).map((row) => this.judge(row));
  }

  /** A stored row becomes something the tray can render: either openable, or refused with reasons. */
  private judge(row: DraftRow): TrayItem {
    const read = readDraft(row);
    const id = String(row?.id ?? '');
    const name = typeof row?.name === 'string' ? row.name : '';
    if (!read.ok) return { id, name, problems: [read.problem] };
    const problems = contractProblems(read.draft.doc, this.facts);
    return problems.length
      ? { id, name: read.draft.name, problems }
      : { id, name: read.draft.name, draft: read.draft, problems: [] };
  }

  /**
   * Opens a proposal in the SAME vertical spine everything else opens in — as an automation that
   * **does not exist yet**.
   *
   * `id: ''` is what carries that: the editor's save creates instead of updating, so up to the
   * moment the owner presses it there is no flow, no trigger and no grant. `enabled: false` is
   * the belt to that braces — if a later change ever made an unsaved draft savable by accident,
   * it would still be born paused.
   */
  private async openDraft(item: TrayItem): Promise<void> {
    const draft = item.draft;
    if (!draft) return;
    this.reviewing = item;
    this.editing = {
      id: '',
      name: draft.name,
      enabled: false,
      definition: draft.doc as unknown as Record<string, unknown>,
    };
    this.isNew = false;
    this.editorTab = 'editor';
    this.draftReview = { notes: draft.notes, gaps: draftGaps(draft.doc, {}) };
    // Then ASK the hub about the trigger, and re-judge with the answer. The order matters: the
    // spine opens now, and «this hub never sends that» appears a moment later — the alternative is
    // a blank screen for as long as a round-trip, over a check that only ever adds a warning.
    const event = draft.doc.triggers.find((t) => t.kind === 'event')?.event ?? '';
    if (!event || !this.client) return;
    let known = true;
    try {
      await this.client.events.shape(event);
    } catch {
      known = false;
    }
    if (this.reviewing?.id !== item.id) return;
    this.draftReview = { notes: draft.notes, gaps: draftGaps(draft.doc, { [event]: known }) };
  }

  /** Records the decision on the proposal. The row survives as the record that it was made. */
  private async resolveDraft(item: TrayItem, outcome: 'used' | 'dismissed', flowId = ''): Promise<void> {
    this.tray = this.tray.filter((t) => t.id !== item.id);
    const command = this.client?.command;
    if (typeof command !== 'function') return;
    try {
      await command.call(this.client, 'flows.drafts.resolve', {
        id: item.id,
        outcome,
        flow_id: flowId,
      });
    } catch (e) {
      this.error = (e as Error)?.message || this.t('ui.errGeneric');
    }
  }

  /**
   * The proposals, above the automations that already exist.
   *
   * The badge says «Draft» and the sentence under the heading says what that means, because the
   * one thing an owner must not have to guess is whether the thing on their screen is already
   * doing something to their business.
   */
  private renderTray() {
    if (!this.tray.length) return nothing;
    return html`<div class="list">
      <h3 class="section">${this.t('draft.section')}</h3>
      <span class="hint">${this.t('draft.sectionHint')}</span>
      ${this.tray.map(
        (item) => html`<div class="flow" data-draft=${item.id}>
          <div class="draft-main">
            <span class="name">${item.name || this.t('ui.unnamed')}</span>
            ${item.problems.map(
              (p) => html`<span class="when">${this.t(p.key, p.params)}</span>`,
            )}
          </div>
          <span class="side">
            <ok-status-pill tone="warning" label=${this.t('draft.badge')}></ok-status-pill>
            ${item.draft
              ? html`<ion-button
                  size="small"
                  fill="outline"
                  data-act="review"
                  data-testid=${`flows-app-draft-review-${item.id}`}
                  @click=${() => void this.openDraft(item)}
                >
                  ${this.t('draft.review')}
                </ion-button>`
              : nothing}
            <button
              type="button"
              class="icon-btn"
              data-act="dismiss"
              data-testid=${`flows-app-draft-dismiss-${item.id}`}
              aria-label=${this.t('draft.dismiss')}
              @click=${() => void this.resolveDraft(item, 'dismissed')}
            >
              ×
            </button>
          </span>
        </div>`,
      )}
    </div>`;  }

  /**
   * Flips the switch, sending the WHOLE flow.
   *
   * `PUT /flows/{id}` revalidates the document and re-seeds the triggers, so a partial body would
   * not be «just the switch» — it would be a rewrite of the automation.
   */
  async setEnabled(flow: Flow, enabled: boolean): Promise<void> {
    if (!this.client) return;
    try {
      const saved = await this.client.flows.update(flow.id, {
        name: flow.name,
        enabled,
        definition: flow.definition,
      });
      this.flows = this.flows.map((f) => (f.id === flow.id ? { ...f, ...saved, enabled } : f));
    } catch (e) {
      this.error = (e as Error)?.message || this.t('ui.errGeneric');
    }
  }

  /**
   * **Put the missing guards on an automation that is already running** (flows#63).
   *
   * A SURGICAL patch and not today's card in place of hers: the owner may have renamed this
   * automation and reworded every prompt in it, and replacing the document would throw that away
   * to fix two lines. Only the trigger's filter grows, so no permission has to be granted again
   * and the switch stays where she left it — an automation that came back PAUSED from a repair
   * would be a WhatsApp that goes quiet without anybody deciding it should.
   *
   * The state is written from what the hub echoed back, not from what we sent: the warning may
   * only leave the row because the save landed.
   */
  private async repair(flow: Flow, problem: FlowProblem): Promise<void> {
    if (!this.client || this.repairing) return;
    const definition = repairedDefinition(flow.definition, problem.id);
    if (!definition) return;
    this.repairing = flow.id;
    this.error = '';
    this.notice = '';
    try {
      const saved = await this.client.flows.update(flow.id, {
        name: flow.name,
        enabled: flow.enabled,
        definition,
      });
      // What the hub ECHOED, never what we sent. `PUT /flows/{id}` revalidates the document and
      // re-seeds the triggers, so a core that dropped the clauses leaves the business exactly as
      // exposed as before — and a row that took the warning off on our own copy would be telling
      // her it is fixed while her WhatsApp keeps answering itself.
      const stored =
        saved && typeof saved.definition === 'object' && saved.definition ? saved.definition : definition;
      this.flows = this.flows.map((f) => (f.id === flow.id ? { ...f, ...saved, definition: stored } : f));
      const left = flowProblems(stored).some((p) => p.id === problem.id);
      if (left) this.error = this.t('ui.checkupNotFixed');
      else this.notice = this.t('ui.checkupFixed', { name: flow.name || this.t('ui.unnamed') });
    } catch (e) {
      this.error = (e as Error)?.message || this.t('ui.errGeneric');
    } finally {
      this.repairing = '';
    }
  }

  /**
   * **Can picking the question again fix an old check?** (flows#125) — asked only when some
   * automation carries a check that cannot tell two automations apart, so a hub with none pays no
   * round trip. Without evidence the hub sends `reply_to_flow`, picking again saves the step only
   * and the warning could never leave the row: it is not shown.
   */
  private async askReplyToFlow(): Promise<void> {
    if (this.replyToFlowSeen || !this.client) return;
    if (!this.flows.some((f) => ambiguousReplyGuards(f.definition, this.flows).length > 0)) return;
    try {
      this.replyToFlowSeen = sendsReplyToFlow(await this.client.events.shape(WHATSAPP_MESSAGE_EVENT));
    } catch {
      // A hub that cannot describe the event cannot be shown to send the field: stay quiet.
      this.replyToFlowSeen = false;
    }
  }

  /**
   * Deletes ONE automation. Named `removeFlow` and not `remove` on purpose: `remove` is
   * `ChildNode.remove()`, which the DOM calls to detach this element — taking that name made
   * every ordinary detach run the deletion with no flow (flows#107).
   */
  private async removeFlow(flow: Flow): Promise<void> {
    if (!this.client) return;
    this.confirmDelete = '';
    try {
      await this.client.flows.remove(flow.id);
      this.flows = this.flows.filter((f) => f.id !== flow.id);
      this.chosen = this.chosen.filter((id) => id !== flow.id);
    } catch (e) {
      this.error = (e as Error)?.message || this.t('ui.errGeneric');
    }
  }

  // ── The list as a console (flows#19) ────────────────────────────────────────────────────────

  /** The rows on screen right now. Everything else on this screen is derived from this. */
  private get shown(): Flow[] {
    return applyView(this.flows, this.view);
  }

  private narrow(patch: Partial<ListView>): void {
    this.view = { ...this.view, ...patch };
    // A selection whose rows have just been hidden is an action nobody can check before taking
    // it: «pause the 2 chosen» with neither of them on screen. So narrowing lets them go.
    const visible = new Set(this.shown.map((f) => f.id));
    this.chosen = this.chosen.filter((id) => visible.has(id));
    this.confirmDelete = '';
  }

  /**
   * A copy of one automation: **paused, and holding nothing the original earned**.
   *
   * The permissions are the point. A copy that arrived with the original's grants would be a way
   * to get an automation authorised without anybody authorising it — so it comes with none, and
   * the screen SAYS so rather than leaving the owner to notice. If the document reaches outside
   * using a secret, that is named too: a credential the copy points at is a decision, and the
   * value itself is not readable by anyone, this screen included.
   */
  private async duplicate(flow: Flow): Promise<void> {
    if (!this.client) return;
    this.notice = '';
    this.confirmDelete = '';
    try {
      const name = copyName(flow.name ?? '', this.flows.map((f) => f.name ?? ''), this.t);
      await this.client.flows.create(duplicateOf(flow, name));
      const secrets = secretRefs(readDoc(flow.definition));
      this.notice = secrets.length
        ? `${this.t('ui.copyMade')} ${this.t('ui.copySecrets', { names: secrets.join(', ') })}`
        : this.t('ui.copyMade');
      await this.reload();
    } catch (e) {
      this.error = (e as Error)?.message || this.t('ui.errGeneric');
    }
  }

  /**
   * Turn several on, or pause several. **Never delete, and never run.**
   *
   * Those two are the reason this is a whitelist of exactly two verbs and not a generic «apply to
   * selection»: deleting is unrecoverable and running has effects on the business, and both are
   * decisions taken a row at a time, looking at the row.
   */
  private async bulk(enabled: boolean): Promise<void> {
    const targets = this.flows.filter((f) => this.chosen.includes(f.id));
    // Let go FIRST: a second press on a bar that is still there would repeat the whole thing.
    this.chosen = [];
    for (const flow of targets) await this.setEnabled(flow, enabled);
  }

  private renderToolbar() {
    const total = this.flows.length;
    const shown = this.shown.length;
    return html`<div class="toolbar">
      <input
        class="search"
        type="search"
        data-act="search"
        data-testid="flows-app-search"
        .value=${this.view.q}
        placeholder=${this.t('ui.listSearch')}
        aria-label=${this.t('ui.listSearch')}
        @input=${(e: Event) => this.narrow({ q: (e.target as HTMLInputElement).value })}
      />
      <div class="filters">
        <select
          data-act="filter-state"
          data-testid="flows-app-filter-state"
          aria-label=${this.t('ui.filterState')}
          .value=${this.view.state}
          @change=${(e: Event) =>
            this.narrow({ state: (e.target as HTMLSelectElement).value as StateFilter })}
        >
          <option value="all">${this.t('ui.stateAll')}</option>
          <option value="active">${this.t('ui.stateActive')}</option>
          <option value="paused">${this.t('ui.statePaused')}</option>
        </select>
        <select
          data-act="filter-trigger"
          data-testid="flows-app-filter-trigger"
          aria-label=${this.t('ui.filterTrigger')}
          .value=${this.view.trigger}
          @change=${(e: Event) =>
            this.narrow({ trigger: (e.target as HTMLSelectElement).value as TriggerFilter })}
        >
          <option value="all">${this.t('ui.triggerAny')}</option>
          <option value="event">${this.t('ui.filterEvent')}</option>
          <option value="cron">${this.t('ui.filterCron')}</option>
          <option value="at">${this.t('ui.filterAt')}</option>
          <option value="manual">${this.t('ui.filterManual')}</option>
        </select>
        <select
          data-act="sort"
          data-testid="flows-app-sort"
          aria-label=${this.t('ui.sortBy')}
          .value=${this.view.sort}
          @change=${(e: Event) =>
            this.narrow({ sort: (e.target as HTMLSelectElement).value as SortBy })}
        >
          <option value="updated">${this.t('ui.sortUpdated')}</option>
          <option value="name">${this.t('ui.sortName')}</option>
        </select>
        <!-- «3 of 20» rather than «3»: a short list with a filter on it looks exactly like a hub
             with three automations, and that is how somebody concludes theirs have gone. -->
        <span class="hint" data-count>${this.t('ui.listCount', { shown, total })}</span>
      </div>
    </div>`;
  }

  private renderSelection() {
    if (!this.chosen.length) return nothing;
    return html`<div class="selection" data-selection>
      <span class="grow">${this.t('ui.selectedCount', { count: this.chosen.length })}</span>
      <ion-button
        size="small"
        fill="outline"
        data-act="bulk-enable"
        data-testid="flows-app-bulk-enable"
        @click=${() => void this.bulk(true)}
      >
        ${this.t('ui.bulkEnable')}
      </ion-button>
      <ion-button
        size="small"
        fill="outline"
        data-act="bulk-pause"
        data-testid="flows-app-bulk-pause"
        @click=${() => void this.bulk(false)}
      >
        ${this.t('ui.bulkPause')}
      </ion-button>
      <button
        type="button"
        class="icon-btn"
        data-act="selection-clear"
        data-testid="flows-app-selection-clear"
        aria-label=${this.t('ui.selectionClear')}
        @click=${() => {
          this.chosen = [];
        }}
      >
        ×
      </button>
    </div>`;
  }

  private renderRow(flow: Flow) {
    const confirming = this.confirmDelete === flow.id;
    return html`<div class="flow" data-flow=${flow.id}>
      <input
        type="checkbox"
        class="pick"
        data-act="select"
        data-testid=${`flows-app-row-select-${flow.id}`}
        aria-label=${this.t('ui.selectOne', { name: flow.name || this.t('ui.unnamed') })}
        .checked=${this.chosen.includes(flow.id)}
        @change=${(e: Event) => {
          const on = (e.target as HTMLInputElement).checked;
          this.chosen = on
            ? [...this.chosen, flow.id]
            : this.chosen.filter((id) => id !== flow.id);
        }}
      />
      <button
        type="button"
        class="open"
        data-testid=${`flows-app-row-${flow.id}`}
        @click=${() => {
          this.editing = flow;
          this.isNew = false;
        }}
      >
        <span class="name">${flow.name || this.t('ui.unnamed')}</span>
        <span class="when">${this.startsWhen(flow)}</span>
      </button>
      <span class="side">
        <ok-status-pill
          tone=${flow.enabled ? 'success' : 'neutral'}
          label=${flow.enabled ? this.t('ui.active') : this.t('ui.paused')}
        ></ok-status-pill>
        <ion-toggle
          data-testid=${`flows-app-row-toggle-${flow.id}`}
          aria-label=${this.t('ui.enableNamed', { name: flow.name || this.t('ui.unnamed') })}
          .checked=${flow.enabled}
          @ionChange=${(e: Event) =>
            void this.setEnabled(flow, !!(e.target as HTMLInputElement).checked)}
        ></ion-toggle>
        <button
          type="button"
          class="icon-btn"
          data-act="duplicate"
          data-testid=${`flows-app-row-duplicate-${flow.id}`}
          aria-label=${this.t('ui.duplicate')}
          title=${this.t('ui.duplicate')}
          @click=${() => void this.duplicate(flow)}
        >
          ⧉
        </button>
        <button
          type="button"
          class="icon-btn"
          data-act="delete"
          data-testid=${`flows-app-row-delete-${flow.id}`}
          aria-label=${this.t('ui.delete')}
          @click=${() => {
            this.confirmDelete = confirming ? '' : flow.id;
          }}
        >
          ×
        </button>
      </span>
      <!-- Asking is the whole point: an automation is the only thing on this screen whose loss
           cannot be undone, and its × sits a fingertip from the switch on a counter tablet. -->
      ${confirming
        ? html`<div class="confirm">
            <span class="grow"
              >${this.t('ui.deleteConfirm', { name: flow.name || this.t('ui.unnamed') })}</span
            >
            <!-- Plain buttons and not ion-buttons, for one reason that is worth writing down:
                 Ionic honours the fill only in md mode, so in ios the same markup renders the
                 destructive action as pale text next to an outlined «leave it» — the button you
                 must read before pressing, looking like the disabled one. These carry their own
                 colour out of the OutfitKit tokens and look the same in both modes. -->
            <button
              type="button"
              class="danger"
              data-act="delete-yes"
              data-testid=${`flows-app-row-delete-yes-${flow.id}`}
              @click=${() => void this.removeFlow(flow)}
            >
              ${this.t('ui.deleteYes')}
            </button>
            <button
              type="button"
              class="quiet"
              data-act="delete-no"
              data-testid=${`flows-app-row-delete-no-${flow.id}`}
              @click=${() => {
                this.confirmDelete = '';
              }}
            >
              ${this.t('ui.deleteNo')}
            </button>
          </div>`
        : nothing}
      <!-- The gallery hands out a COPY and keeps no link back to the card, so a card we fix
           reaches everybody who taps it from now on and nobody who already did. This row is the
           only place that owner can be told. It warns and offers; it never rewrites her
           automation on its own — which is what Zapier, Shopify Flow, Power Automate and n8n all
           do with a workflow somebody has already built. -->
      ${flowProblems(flow.definition).map(
        (problem) => html`<div class="checkup" data-checkup=${problem.id}>
          <span class="said">
            <strong>${this.t(problem.titleKey)}</strong>
            ${this.t(problem.bodyKey)}
          </span>
          <!-- Disabled while ANY repair is in flight, not just this row's: the handler
               refuses to start a second save while one is running, so a button left
               pressable on another old automation answers nothing at all — no save, no
               warning, no error. The row being saved says so in its label. -->
          <button
            type="button"
            data-act="checkup-fix"
            data-testid=${`flows-app-row-checkup-fix-${flow.id}-${problem.id}`}
            ?disabled=${!!this.repairing}
            @click=${() => void this.repair(flow, problem)}
          >
            ${this.repairing === flow.id ? this.t('ui.saving') : this.t(problem.fixKey)}
          </button>
        </div>`,
      )}
      <!-- flows#125: a check saved before flows#124 names the step, not the automation, and two
           automations ask with that step. Only the owner knows which one she meant, so the button
           opens the automation to pick it again instead of saving anything. -->
      ${this.replyToFlowSeen && ambiguousReplyGuards(flow.definition, this.flows).length > 0
        ? html`<div class="checkup" data-checkup="reply_step_ambiguous">
            <span class="said">
              <strong>${this.t('ui.checkupReplyTitle')}</strong>
              ${this.t('ui.checkupReplyBody')}
            </span>
            <button
              type="button"
              data-act="checkup-fix"
              data-testid=${`flows-app-row-reply-fix-${flow.id}`}
              @click=${() => {
                this.editing = flow;
                this.isNew = false;
                this.editorTab = 'editor';
              }}
            >
              ${this.t('ui.checkupReplyFix')}
            </button>
          </div>`
        : nothing}
    </div>`;
  }

  /** «Cuando se reserva una cita» — never the raw event name. */
  private startsWhen(flow: Flow): string {
    const doc = readDoc(flow.definition);
    const trigger = doc.triggers[0] ?? { kind: 'manual' as const };
    const entry = trigger.event ? catalogEntry(trigger.event) : undefined;
    return describeTrigger(trigger, this.t, entry ? this.t(entry.labelKey) : undefined);
  }

  private renderGate() {
    const map: Record<string, { icon: string; title: string; message: string }> = {
      unsupported: {
        icon: 'construct-outline',
        title: 'ui.unsupportedTitle',
        message: 'ui.unsupportedMessage',
      },
      denied: { icon: 'lock-closed-outline', title: 'ui.noAccessTitle', message: 'ui.noAccessMessage' },
      not_admin: {
        icon: 'person-outline',
        title: 'ui.notAdminTitle',
        message: 'ui.notAdminMessage',
      },
    };
    const gate = map[this.gate];
    if (!gate) {
      return html`<div class="gate">
        <ok-inline-feedback
          tone="danger"
          icon="alert-circle-outline"
          data-testid="flows-app-gate-error"
          >${this.error || this.t('ui.errGeneric')}</ok-inline-feedback
        >
      </div>`;
    }
    return html`<div class="gate">
      <ok-empty-state
        icon=${gate.icon}
        heading=${this.t(gate.title)}
        message=${this.t(gate.message)}
        data-testid="flows-app-gate-empty"
      ></ok-empty-state>
    </div>`;
  }

  /**
   * The automations that already exist, above the gallery. Empty is not an error state any more
   * (flows#1): a hub with nothing automated yet simply has nothing to show HERE, and the gallery
   * underneath is the answer to «and now what».
   */
  private renderList() {
    if (!this.flows.length) return nothing;
    const rows = this.shown;
    return html`<div class="list">
      <h3 class="section">${this.t('ui.tplYours')}</h3>
      ${this.renderToolbar()} ${this.renderSelection()}
      ${this.notice
        ? html`<ok-inline-feedback tone="success" icon="copy-outline" data-notice data-testid="flows-app-notice"
            >${this.notice}</ok-inline-feedback
          >`
        : nothing}
      ${rows.length
        ? rows.map((flow) => this.renderRow(flow))
        : html`<div class="empty-filter">
            <span class="hint">${this.t('ui.listNoMatch')}</span>
            <ion-button
              size="small"
              fill="outline"
              data-act="clear-filters"
              data-testid="flows-app-clear-filters"
              @click=${() => this.narrow({ q: '', state: 'all', trigger: 'all' })}
            >
              ${this.t('ui.listClear')}
            </ion-button>
          </div>`}
    </div>`;
  }

  private startNew(): void {
    this.editing = null;
    this.isNew = true;
    this.editorTab = 'editor';
  }

  /**
   * A template just became a flow: open it, **on the screen that makes it work**.
   *
   * A flow with no grants does nothing at all and says nothing about it. Landing the owner on the
   * step list would leave the one action they must take behind a tab they have no reason to open —
   * which is the exact place pm#134 reports people getting stuck.
   */
  private onTemplateUsed(e: CustomEvent<{ flow: Flow; needsGrants: boolean }>): void {
    this.editing = e.detail.flow;
    this.isNew = false;
    this.editorTab = e.detail.needsGrants ? 'permissions' : 'editor';
    void this.reload();
  }

  /**
   * The gallery says the owner already has this card: open THAT flow (flows#60).
   *
   * Nothing is created, so nothing needs reloading — the flow being opened came out of the list
   * this screen loaded. A half-built one lands on Permissions for the same reason a brand new one
   * does: it is the only thing standing between it and working.
   */
  private onOpenExisting(e: CustomEvent<{ flow: Flow; needsGrants: boolean }>): void {
    this.editing = e.detail.flow;
    this.isNew = false;
    this.editorTab = e.detail.needsGrants ? 'permissions' : 'editor';
  }

  render() {
    if (this.gate === 'loading') {
      return html`<div class="body"><span>${this.t('ui.loading')}</span></div>`;
    }
    if (this.gate !== 'ready') return this.renderGate();

    if (this.editing || this.isNew) {
      return html`<erp-flows-editor
        .client=${this.client}
        .flow=${this.editing}
        .t=${this.t}
        .tab=${this.editorTab}
        .draft=${this.draftReview}
        .interactiveNotify=${this.facts.interactiveNotify}
        .headerMedia=${this.facts.headerMedia}
        .documentName=${this.facts.documentName}
        .headerText=${this.facts.headerText}
        .buttonUrl=${this.facts.buttonUrl}
        .runKey=${this.facts.runKey}
        @flows-back=${() => {
          this.editing = null;
          this.isNew = false;
          this.editorTab = 'editor';
          this.reviewing = null;
          this.draftReview = null;
          void this.reload();
        }}
        @flows-saved=${(e: CustomEvent<{ flow: Flow }>) => {
          this.editing = e.detail.flow;
          this.isNew = false;
          // The proposal did its job: it became this flow. Recording it is what takes it out of
          // the tray — and the flow it points at is paused and ungranted, like any other new one.
          const reviewed = this.reviewing;
          this.reviewing = null;
          this.draftReview = null;
          if (reviewed) void this.resolveDraft(reviewed, 'used', e.detail.flow.id);
        }}
      ></erp-flows-editor>`;
    }

    if (this.guideOpen) {
      return html`<div class="body">
        <erp-flows-guide
          .t=${this.t}
          @flows-guide-close=${() => {
            this.guideOpen = false;
          }}
        ></erp-flows-guide>
      </div>`;
    }

    return html`
      <div class="head">
        <span class="grow"></span>
        <ion-button
          size="small"
          fill="outline"
          data-act="new"
          data-testid="flows-app-new"
          @click=${() => this.startNew()}
        >
          ${this.t('ui.newAutomation')}
        </ion-button>
      </div>
      <div class="body">
        ${this.error
          ? html`<ok-inline-feedback tone="danger" icon="alert-circle-outline" data-testid="flows-app-error"
              >${this.error}</ok-inline-feedback
            >`
          : nothing}
        ${this.approvalCount
          ? html`<erp-flows-approvals
              .client=${this.client}
              .t=${this.t}
              @flows-approvals-count=${(e: CustomEvent<{ count: number }>) => {
                this.approvalCount = e.detail.count;
              }}
            ></erp-flows-approvals>`
          : nothing}
        ${this.deadShown
          ? html`<erp-flows-dead-letter
              .client=${this.client}
              .t=${this.t}
              @flows-dead-count=${(e: CustomEvent<{ count: number }>) => {
                this.deadCount = e.detail.count;
              }}
            ></erp-flows-dead-letter>`
          : nothing}
        ${this.renderTray()} ${this.renderList()}
        <erp-flows-gallery
          .client=${this.client}
          .t=${this.t}
          .facts=${this.facts}
          @flows-template-used=${(e: Event) =>
            this.onTemplateUsed(e as CustomEvent<{ flow: Flow; needsGrants: boolean }>)}
          @flows-open-flow=${(e: Event) =>
            this.onOpenExisting(e as CustomEvent<{ flow: Flow; needsGrants: boolean }>)}
          @flows-open-guide=${() => {
            this.guideOpen = true;
          }}
        ></erp-flows-gallery>
      </div>
    `;
  }
}

define('erp-flows-app', ErpFlowsApp);

declare global {
  interface HTMLElementTagNameMap {
    'erp-flows-app': ErpFlowsApp;
  }
}
