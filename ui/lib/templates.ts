/**
 * **What the owner starts from instead of a blank screen** (flows#1, pm#110 point 6).
 *
 * The research behind the editor was blunt about it: *«business people start from a template, not
 * from an empty canvas»*. So the way into this module is a gallery of automations a shop owner
 * recognises — «write the big visits into the customer's card», «call back whoever did not turn
 * up» — and the editor is what they land in once they have picked one.
 *
 * Three rules decide what may be in here, and each one is a way of not lying to somebody:
 *
 * 1. **Only steps this editor can edit.** All six kinds are editable since flows#3, so this rule no
 *    longer excludes any of them — but it still binds: a template must not carry a step whose form
 *    this editor cannot draw, because that hands the owner an automation they cannot finish.
 * 2. **Only commands and events this hub really has.** Every name here was executed against a real
 *    hub with the 24 modules installed, and every field mapped below came back from
 *    `GET /api/hub/events/shape` — not from a manifest, and not from memory. A command that does
 *    not exist is refused at SAVE (hub#824) and again at grant time, so a wrong name is not a
 *    degraded template: it is a card that cannot be used at all.
 * 3. **Born paused.** Creating a template creates a flow with `enabled: false`. An automation acts
 *    while nobody is watching; one that starts acting because somebody tapped a picture of it is
 *    the thing the grants system exists to prevent.
 *
 * What is deliberately NOT here: «remind the appointment the day before» and «warn me when stock
 * drops below X», the two examples everybody asks for first. Both need something the kernel cannot
 * do yet — a delay relative to a date in the payload (the kernel waits *from now*), and a stock
 * LEVEL (`inventory.stock_changed` carries the amount that moved, `{product_id, qty}`, never the
 * remaining count). They are named in the guide as things that do not work yet, which is the
 * honest place for them.
 */
import type { FlowDoc, Grant, Step } from './flow-doc';
import { canPinPayload, grantPin, requiredGrants, setGrantPin } from './flow-doc';
import type { Translator } from './plain-language';
import type { SchemaFacts } from './ai-draft';
import { schemaFacts } from './ai-draft';

/** The families a gallery groups by. `any` is «any business», and it goes first. */
export const SECTORS = ['any', 'beauty', 'food'] as const;
export type Sector = (typeof SECTORS)[number];

/**
 * One event that proves a module is installed **here**.
 *
 * There is no endpoint that lists a hub's commands (hub#823 for events, and nothing at all for
 * commands), but `GET /api/hub/events/shape?name=…` answers `404` for an event nobody declares and
 * `200` — even with zero samples — for one an installed module does. So one declared event per
 * module is a witness, and it is the only check available that costs nothing and cannot be wrong.
 */
export interface TemplateWitness {
  event: string;
  /** The module id, which is what the owner is told to install. Not derivable from the event name:
   *  `customer.created` comes from `customers` and `sale.completed` from `sales`. */
  module: string;
}

/** A value the template guessed and the owner has to confirm. */
export interface TemplateBlank {
  labelKey: string;
  /** One line saying what to put there — units included, because that is where people slip. */
  hintKey: string;
}

/**
 * A kernel capability a card depends on, answered by what the hub serves at
 * `GET /api/hub/flows/schema` — see {@link SchemaFacts}.
 *
 * Most are named by the STEP KEY that carries them, because the document is where they show up and
 * a hub whose schema does not declare the key refuses that document whole. `queryPin` is the one
 * that is not (flows#111): a limit on a READ is not written in the document at all — it lives in
 * the permission — so the schema's shape cannot answer it and the hub's RELEASE has to.
 */
export type TemplateNeed = 'interactive' | 'output' | 'queryPin';

/** Which fact of the hub's answer settles each need. */
const NEED_FACT: Record<TemplateNeed, keyof SchemaFacts> = {
  interactive: 'interactiveNotify',
  output: 'aiOutput',
  queryPin: 'queryGrantPin',
};

export interface FlowTemplate {
  id: string;
  /**
   * The family this card is grouped under, and only cards WRITTEN here have one (flows#98).
   *
   * A card the hub serves comes from an installed module, so its heading is that module rather
   * than a trade: grouping «WhatsApp → appointment» under beauty on a hub that also books tables
   * would hide it from the restaurant that has the app installed and running.
   */
  sector?: Sector;
  /** `ion-icon` name (registered by the module build, never a loose SVG). */
  icon: string;
  /**
   * Where the card's texts come from, for a card written in this catalogue: an i18n key each.
   *
   * Optional since flows#98 because a card the hub serves carries its title INSIDE the document
   * the module published, already in the owner's language — there is no key of ours to look up.
   * Read them through {@link templateName}/{@link templateSummary}/{@link templatePlain}, never
   * directly, or a served card prints an empty string where its name should be.
   */
  nameKey?: string;
  /** One line for the card. */
  summaryKey?: string;
  /** The whole automation as a sentence, for the panel before it is created. */
  plainKey?: string;
  /** The title a SERVED card carries, written by the module in the owner's language (flows#98). */
  name?: string;
  /**
   * The module and family a SERVED card came from — what lets the gallery say where it is from.
   *
   * Present exactly when the hub served the card (`GET /api/hub/flows/templates`), absent on
   * everything written in this file.
   */
  source?: { readonly module: string; readonly family: string };
  /**
   * The permissions a SERVED card will ask for, as the module declared them in `<family>.grants.json`.
   *
   * A card written here derives them from its own document ({@link templateGrants}); a served one
   * cannot, because the module may declare a narrower list than the document reads as — and the
   * module's list is the one `erplora validate` checked against the recipe it ships.
   */
  grants?: readonly Grant[];
  blanks: readonly TemplateBlank[];
  witnesses: readonly TemplateWitness[];
  /** Why each command is needed, keyed by command name. Shown BEFORE the flow exists. */
  grantReasons: Readonly<Record<string, string>>;
  /**
   * The payload fields a command's permission FIXES, keyed by command name (hub#1623, flows#80).
   *
   * A card's permissions are *derived* from its document, and a limit does not live in the
   * document — it lives in the permission. So without a place to say it here, a recipe written to
   * act only within some boundary would install with the boundary missing: the gallery would
   * promise the contained automation and hand over the wide one.
   *
   * `command` only, and only fields the command's own schema declares. Every key named here has to
   * arrive with exactly this value or the hub refuses the call — **omitting it is refused just the
   * same**, which is what makes a pin hold against a schema that defaults the field to the wide
   * value.
   */
  grantPins?: Readonly<Record<string, Readonly<Record<string, unknown>>>>;
  /**
   * **Step keys this card's document carries that an older core refuses OUTRIGHT** (flows#92).
   *
   * Not a nicety: `parse_step` walks an allowlist per step kind, so an unknown key is not ignored
   * and does not degrade — it answers `flow.invalid_definition` for the WHOLE document and the
   * recipe dies at save. A card that names one here is not offered to a hub that does not declare
   * it, which is a floor **per card**: raising the module's own `min_erplora_version` instead
   * would put this floor on the twenty cards that do not need it and take the gallery away from
   * hubs that use it perfectly well.
   */
  needs?: readonly TemplateNeed[];
  /** Always `false`, and typed as `false` so a template cannot be born running. */
  enabledOnCreate?: false;
  /** The document, in the owner's language. */
  /**
   * The document this card installs.
   *
   * 🔴 Every implementation writes `build: (t): FlowDoc => ({…})` with the return type SPELLED OUT,
   * and that is not decoration (flows#107). Through the nested arrow the contextual type is lost,
   * so TypeScript infers the `triggers` array by unifying its elements instead of checking each one
   * against `Trigger` — and a card woken two ways (words AND a tap, which is every WhatsApp card)
   * gains a normalised `'event.reply_id'?: undefined` that no `Condition` can hold. The four cards
   * that had a trigger pair were the four that did not compile. Drop the annotation and they break
   * again, silently, on the next card that grows a second trigger.
   */
  build(t: Translator): FlowDoc;
}

const SCHEMA_VERSION = 1;

/** `command` step. Kept tiny so the documents below read like the automations they describe. */
function run(id: string, command: string, params: Record<string, unknown>): Step {
  return { id, kind: 'command', command, params };
}

export const TEMPLATES: readonly FlowTemplate[] = [
  // ── Any business ────────────────────────────────────────────────────────────────────────────
  {
    id: 'welcome-new-customer',
    sector: 'any',
    icon: 'happy-outline',
    nameKey: 'tpl.welcome.name',
    summaryKey: 'tpl.welcome.summary',
    plainKey: 'tpl.welcome.plain',
    blanks: [{ labelKey: 'tpl.welcome.blankWait', hintKey: 'tpl.welcome.blankWaitHint' }],
    witnesses: [
      { event: 'customer.created', module: 'customers' },
      { event: 'tasks.task.created', module: 'tasks' },
    ],
    grantReasons: { 'tasks.tasks.create': 'tpl.grant.tasksCreate' },
    build: (t): FlowDoc => ({
      schema_version: SCHEMA_VERSION,
      triggers: [{ kind: 'event', event: 'customer.created' }],
      steps: [
        // A day, not a minute: the welcome call that lands while the customer is still walking out
        // of the door is the one nobody makes. The owner can change it — that is the blank.
        { id: 's1', kind: 'delay', seconds: 86400 },
        run('s2', 'tasks.tasks.create', {
          // `input.name` is the customer's name: `customer.created` carries the whole card at the
          // root (verified against a hub — there is no `customer.` prefix in this payload).
          title: t('tpl.welcome.taskTitle'),
          priority: 'medium',
        }),
      ],
    }),
  },
  {
    id: 'note-big-sale',
    sector: 'any',
    icon: 'create-outline',
    nameKey: 'tpl.bigSale.name',
    summaryKey: 'tpl.bigSale.summary',
    plainKey: 'tpl.bigSale.plain',
    blanks: [{ labelKey: 'tpl.bigSale.blankAmount', hintKey: 'tpl.bigSale.blankAmountHint' }],
    witnesses: [
      { event: 'sale.completed', module: 'sales' },
      { event: 'customer.created', module: 'customers' },
    ],
    grantReasons: { 'customers.notes.add': 'tpl.grant.customersNote' },
    build: (t): FlowDoc => ({
      schema_version: SCHEMA_VERSION,
      triggers: [{ kind: 'event', event: 'sale.completed' }],
      steps: [
        {
          id: 's1',
          kind: 'condition',
          when: {
            // Both halves matter. Without a customer there is no card to write on, and the command
            // would fail on every anonymous ticket — which in a bar is most of them.
            'input.customer_id': { exists: true },
            // CENTS. `sale.completed.total` is an integer in cents (ADR-0123): 10000 = 100,00 €.
            // This is the single most likely thing for an owner to get wrong, so the blank says so.
            'input.total': { gte: 10000 },
          },
        },
        run('s2', 'customers.notes.add', {
          customer_id: 'input.customer_id',
          content: t('tpl.bigSale.noteContent'),
          author_name: t('tpl.author'),
        }),
      ],
    }),
  },

  /**
   * **R0 #7 — somebody joins the team → the checklist gets written** (flows#18).
   *
   * No field mapping, on purpose. `staff.member.created` is emitted by a declarative command and
   * this catalogue has not seen its payload against a real hub, so the task says what to do rather
   * than promising a name it might print as a row of hex. Same rule as `no-show-followup`.
   */
  {
    id: 'new-staff-checklist',
    sector: 'any',
    icon: 'person-add-outline',
    nameKey: 'tpl.newStaff.name',
    summaryKey: 'tpl.newStaff.summary',
    plainKey: 'tpl.newStaff.plain',
    blanks: [{ labelKey: 'tpl.newStaff.blankList', hintKey: 'tpl.newStaff.blankListHint' }],
    witnesses: [
      { event: 'staff.member.created', module: 'staff' },
      { event: 'tasks.task.created', module: 'tasks' },
    ],
    grantReasons: { 'tasks.tasks.create': 'tpl.grant.tasksCreate' },
    build: (t): FlowDoc => ({
      schema_version: SCHEMA_VERSION,
      triggers: [{ kind: 'event', event: 'staff.member.created' }],
      steps: [
        run('s1', 'tasks.tasks.create', {
          title: t('tpl.newStaff.taskTitle'),
          description: t('tpl.newStaff.taskDescription'),
          priority: 'high',
        }),
      ],
    }),
  },
  /**
   * **R0 #8 — somebody writes on WhatsApp → it does not sit there unanswered.**
   *
   * What this deliberately does NOT do is reply on its own. A reply costs money every time it is
   * sent, it goes to a person who did not agree to be written to by a machine, and getting it
   * wrong is the one mistake on this whole screen the owner cannot take back. So the automation
   * puts it in front of a human, fast, and the `notify` step is theirs to add if they want one —
   * which is the same line the guide draws about what the assistant will and will not propose.
   */
  {
    id: 'whatsapp-answer',
    sector: 'any',
    icon: 'chatbubble-ellipses-outline',
    nameKey: 'tpl.whatsapp.name',
    summaryKey: 'tpl.whatsapp.summary',
    plainKey: 'tpl.whatsapp.plain',
    blanks: [{ labelKey: 'tpl.whatsapp.blankWho', hintKey: 'tpl.whatsapp.blankWhoHint' }],
    witnesses: [
      { event: 'whatsapp_inbox.message.received', module: 'whatsapp_inbox' },
      { event: 'tasks.task.created', module: 'tasks' },
    ],
    grantReasons: { 'tasks.tasks.create': 'tpl.grant.tasksCreate' },
    build: (t): FlowDoc => ({
      schema_version: SCHEMA_VERSION,
      triggers: [
        {
          kind: 'event',
          // The MODULE's event, not the core's — and it inherits the same two problems one hop
          // later (flows#67). `whatsapp_inbox._ingest_inbound_message` is a manifest listener on
          // `hub.whatsapp.message_received`, and a manifest listener has no mapping layer: the
          // relay hands the core payload straight to the command and the command's `emit` writes
          // that same bound payload to the outbox. So from hub#1621 this event carries the OWNER's
          // own replies, echoed back from the WhatsApp Business app on her phone, and the 180 days
          // of backlog Meta delivers the moment the number is connected. Unguarded that is a task
          // per message she types herself and a task per conversation anybody had in March — the
          // list this card exists to keep short, buried on the day the fleet updates.
          //
          // 🔴 `neq` and never `eq`, the SAME reason as the appointment pair below: those two
          // fields reach the event only from hub#1621, which no published tag carries (`v1.1.15`
          // is the newest). In the kernel an absent path is `Null` and `json_eq(Null, x)` is false
          // (`crates/runtime/src/flows/def.rs`), so an affirmative clause matches NOTHING on the
          // fleet as it stands — no run, no error, no log. We EXCLUDE what is bad; we never
          // REQUIRE what is good.
          //
          // No `event.text` clause on purpose. Its neighbour filters an empty body because every
          // reply IT sends is billed by Meta; this card only writes a task, and a customer who
          // sends a photo, a voice note or a location has written to the shop just as much as one
          // who types.
          event: 'whatsapp_inbox.message.received',
          filter: {
            'event.direction': { neq: 'outbound' },
            'event.source': { neq: 'history' },
          },
        },
      ],
      steps: [
        run('s1', 'tasks.tasks.create', {
          title: t('tpl.whatsapp.taskTitle'),
          description: t('tpl.whatsapp.taskDescription'),
          priority: 'urgent',
        }),
      ],
    }),
  },
  /**
   * **R0 #12 — the till closes → somebody looks at the day before going home.**
   *
   * The version flows#18 asked for waits for the fiscal documents of that session to finish and
   * then sends a summary. The kernel cannot do the waiting: a flow is a straight line with no step
   * that parks until a correlated second event arrives, and `delay` counts from now rather than
   * until something happens. What is left, and what this is, is the part that works: the moment the
   * till closes, the check lands on somebody's list while the shop is still standing there.
   */
  {
    id: 'cash-close-review',
    sector: 'any',
    icon: 'file-tray-full-outline',
    nameKey: 'tpl.cashClose.name',
    summaryKey: 'tpl.cashClose.summary',
    plainKey: 'tpl.cashClose.plain',
    blanks: [{ labelKey: 'tpl.cashClose.blankWho', hintKey: 'tpl.cashClose.blankWhoHint' }],
    witnesses: [
      { event: 'cash_register.session_closed', module: 'cash_register' },
      { event: 'tasks.task.created', module: 'tasks' },
    ],
    grantReasons: { 'tasks.tasks.create': 'tpl.grant.tasksCreate' },
    build: (t): FlowDoc => ({
      schema_version: SCHEMA_VERSION,
      triggers: [{ kind: 'event', event: 'cash_register.session_closed' }],
      steps: [
        run('s1', 'tasks.tasks.create', {
          title: t('tpl.cashClose.taskTitle'),
          description: t('tpl.cashClose.taskDescription'),
          priority: 'high',
        }),
      ],
    }),
  },
  /**
   * **R0 #6 — the AEAT said no → somebody finds out without opening a screen** (flows#18).
   *
   * This is the one place in the product where NOT finding out has consequences before the tax
   * agency. Until verifactu#42 the module wrote its refusals into its own audit table and nothing
   * left: a row on a screen somebody has to open, and the bar that closes at two in the morning
   * does not open it. `verifactu.record.rejected` is that outcome leaving the module.
   *
   * **One name, four failures.** The event fires whether the AEAT refused the record, the wire
   * never carried it, the record could not say which tax agency owns it, or the XML failed the
   * schema — `reason` tells them apart. That is deliberate on the emitting side (a trigger picks
   * ONE event, and an owner who only gets the AEAT half has built the silent version of the alarm
   * they asked for), and it is exactly why this card **maps no field and names no cause**: a task
   * that says «la AEAT ha rechazado» would be wrong the day the failure was the connection. The
   * sentence says what is true of all four — an invoice is not registered — and where to look.
   *
   * A task and not a message, like every other card here: `notify` needs a channel grant, a
   * recipient grant and a configured transport, and a recipe that half-works on most hubs is worse
   * than one that works on all of them. It is also the right shape — a rejection needs somebody to
   * DO something, and a task is the thing that survives being read at a bad moment.
   */
  {
    id: 'fiscal-rejection-alert',
    sector: 'any',
    icon: 'alert-circle-outline',
    nameKey: 'tpl.fiscalRejected.name',
    summaryKey: 'tpl.fiscalRejected.summary',
    plainKey: 'tpl.fiscalRejected.plain',
    blanks: [
      { labelKey: 'tpl.fiscalRejected.blankWho', hintKey: 'tpl.fiscalRejected.blankWhoHint' },
    ],
    witnesses: [
      { event: 'verifactu.record.rejected', module: 'verifactu' },
      { event: 'tasks.task.created', module: 'tasks' },
    ],
    grantReasons: { 'tasks.tasks.create': 'tpl.grant.tasksCreate' },
    build: (t): FlowDoc => ({
      schema_version: SCHEMA_VERSION,
      triggers: [{ kind: 'event', event: 'verifactu.record.rejected' }],
      steps: [
        run('s1', 'tasks.tasks.create', {
          title: t('tpl.fiscalRejected.taskTitle'),
          description: t('tpl.fiscalRejected.taskDescription'),
          // The one card in this gallery that is `urgent` rather than `high`: everything else here
          // is business that can wait a day, and this is a document the tax agency does not have.
          priority: 'urgent',
        }),
      ],
    }),
  },

  /**
   * **R0 #5 — Friday evening → the week gets looked at.**
   *
   * flows#18 asked for the week's takings IN the message. The engine has no read step: v1 runs
   * commands, guards and waits, and there is no `query` step and no `query` grant, so nothing in a
   * flow can fetch a number to put in a sentence. Sending «here are your sales:» followed by
   * nothing would be worse than not sending it. So this books the review instead, on the evening
   * of the day the owner picks, and the figures are one tap away where they already live.
   */
  {
    id: 'friday-week-review',
    sector: 'any',
    icon: 'stats-chart-outline',
    nameKey: 'tpl.weekReview.name',
    summaryKey: 'tpl.weekReview.summary',
    plainKey: 'tpl.weekReview.plain',
    blanks: [{ labelKey: 'tpl.weekReview.blankWhen', hintKey: 'tpl.weekReview.blankWhenHint' }],
    witnesses: [{ event: 'tasks.task.created', module: 'tasks' }],
    grantReasons: { 'tasks.tasks.create': 'tpl.grant.tasksCreate' },
    build: (t): FlowDoc => ({
      schema_version: SCHEMA_VERSION,
      // 18:00 on day 5 — Friday. Five-field cron, drawn as a clock by the editor: nobody types it.
      triggers: [{ kind: 'cron', cron: '0 18 * * 5' }],
      steps: [
        run('s1', 'tasks.tasks.create', {
          title: t('tpl.weekReview.taskTitle'),
          description: t('tpl.weekReview.taskDescription'),
          priority: 'medium',
        }),
      ],
    }),
  },

  // ── Hair and beauty ─────────────────────────────────────────────────────────────────────────
  {
    id: 'morning-agenda-check',
    sector: 'beauty',
    icon: 'sunny-outline',
    nameKey: 'tpl.morning.name',
    summaryKey: 'tpl.morning.summary',
    plainKey: 'tpl.morning.plain',
    blanks: [{ labelKey: 'tpl.morning.blankTime', hintKey: 'tpl.morning.blankTimeHint' }],
    witnesses: [{ event: 'tasks.task.created', module: 'tasks' }],
    grantReasons: { 'tasks.tasks.create': 'tpl.grant.tasksCreate' },
    build: (t): FlowDoc => ({
      schema_version: SCHEMA_VERSION,
      // 09:00 every day. The kernel reads five-field cron; the editor shows it as a clock.
      triggers: [{ kind: 'cron', cron: '0 9 * * *' }],
      steps: [run('s1', 'tasks.tasks.create', { title: t('tpl.morning.taskTitle'), priority: 'high' })],
    }),
  },
  {
    id: 'no-show-followup',
    sector: 'beauty',
    icon: 'call-outline',
    nameKey: 'tpl.noShow.name',
    summaryKey: 'tpl.noShow.summary',
    plainKey: 'tpl.noShow.plain',
    blanks: [],
    witnesses: [
      { event: 'appointments.appointment.no_show', module: 'appointments' },
      { event: 'tasks.task.created', module: 'tasks' },
    ],
    grantReasons: { 'tasks.tasks.create': 'tpl.grant.tasksCreate' },
    build: (t): FlowDoc => ({
      schema_version: SCHEMA_VERSION,
      triggers: [{ kind: 'event', event: 'appointments.appointment.no_show' }],
      steps: [
        // No name in the title on purpose: this event carries `{appointment_id}` and nothing else
        // (verified against a hub). Promising «call Marta» and printing a row of hex would be worse
        // than a task that sends somebody to the diary.
        run('s1', 'tasks.tasks.create', { title: t('tpl.noShow.taskTitle'), priority: 'urgent' }),
      ],
    }),
  },

  {
    id: 'big-party-reservation',
    sector: 'food',
    icon: 'people-outline',
    nameKey: 'tpl.bigParty.name',
    summaryKey: 'tpl.bigParty.summary',
    plainKey: 'tpl.bigParty.plain',
    blanks: [{ labelKey: 'tpl.bigParty.blankSize', hintKey: 'tpl.bigParty.blankSizeHint' }],
    witnesses: [
      { event: 'reservations.reservation.created', module: 'reservations' },
      { event: 'tasks.task.created', module: 'tasks' },
    ],
    grantReasons: { 'tasks.tasks.create': 'tpl.grant.tasksCreate' },
    build: (t): FlowDoc => ({
      schema_version: SCHEMA_VERSION,
      triggers: [{ kind: 'event', event: 'reservations.reservation.created' }],
      steps: [
        { id: 's1', kind: 'condition', when: { 'input.party_size': { gte: 6 } } },
        // `guest_name`, `party_size`, `date` and `time` all travel in this event — checked against
        // a real payload, not guessed from the create schema.
        run('s2', 'tasks.tasks.create', {
          title: t('tpl.bigParty.taskTitle'),
          description: t('tpl.bigParty.taskDescription'),
          priority: 'high',
        }),
      ],
    }),
  },
];

/** The template with this id, or `undefined` — an unknown id is a stale link, not a crash. */
/**
 * The event a card's trigger waits on, or `null` for a card that does not start on an event.
 *
 * Read from the built document rather than declared on the card: the document is what the hub
 * stores and what actually fires, so a card whose `build()` changed its trigger cannot go on
 * claiming the old one.
 */
export function templateTriggerEvent(template: FlowTemplate, t: Translator): string | null {
  const trigger = template.build(t).triggers[0];
  return trigger?.kind === 'event' && typeof trigger.event === 'string' ? trigger.event : null;
}

/** The events a stored flow waits on — whatever the hub happens to have in `definition`. */
function triggerEventsOf(definition: Record<string, unknown>): string[] {
  const triggers = definition?.triggers;
  if (!Array.isArray(triggers)) return [];
  return triggers
    .map((trigger) => (trigger as { event?: unknown } | null)?.event)
    .filter((event): event is string => typeof event === 'string');
}

/**
 * Is this a five-field cron line we actually run?
 *
 * Anything else — `@weekly`, a seconds field, a field with letters in it — is a schedule this
 * gallery cannot read, and one it cannot read must never be guessed into a match.
 */
function readsAsCron(cron: unknown): boolean {
  if (typeof cron !== 'string') return false;
  const fields = cron.trim().split(/\s+/).filter(Boolean);
  return fields.length === 5 && fields.every((field) => CRON_FIELD.test(field));
}

/** Does this flow come round on a schedule at all? */
function hasSchedule(definition: Record<string, unknown>): boolean {
  const triggers = definition?.triggers;
  if (!Array.isArray(triggers)) return false;
  return triggers.some((raw) => {
    const trigger = raw as { kind?: unknown; cron?: unknown } | null;
    return trigger?.kind === 'cron' && readsAsCron(trigger.cron);
  });
}

/** Does this card come round on a schedule instead of waiting on an event? */
function templateIsScheduled(template: FlowTemplate, t: Translator): boolean {
  const trigger = template.build(t).triggers[0];
  return trigger?.kind === 'cron' && readsAsCron(trigger.cron);
}

/** Equal as data — what a step carries is what the hub stored, not one of our objects. */
function sameValue(a: unknown, b: unknown): boolean {
  if (a === b) return true;
  if (a === null || b === null || typeof a !== 'object' || typeof b !== 'object') return false;
  if (Array.isArray(a) !== Array.isArray(b)) return false;
  const keys = Object.keys(a as object);
  if (keys.length !== Object.keys(b as object).length) return false;
  return keys.every(
    (key) =>
      Object.prototype.hasOwnProperty.call(b, key) &&
      sameValue((a as Record<string, unknown>)[key], (b as Record<string, unknown>)[key]),
  );
}

/** The command steps a card seeds, with the values it fills them in with. */
function seededSteps(
  template: FlowTemplate,
  t: Translator,
): { command: string; params: Record<string, unknown> }[] {
  return template
    .build(t)
    .steps.filter((step) => step.kind === 'command' && typeof step.command === 'string')
    .map((step) => ({
      command: step.command as string,
      params: (step.params ?? {}) as Record<string, unknown>,
    }));
}

/**
 * **Does this stored document still carry what the card seeded into it?**
 *
 * Every command step the card creates has to be there, running the same command with the same
 * values in the params the card filled in. Extra params, extra steps and a different order are all
 * fine: they are the owner's, and none of them stop this being the automation the card makes.
 */
function carriesSeededSteps(
  definition: Record<string, unknown>,
  seeded: readonly { command: string; params: Record<string, unknown> }[],
): boolean {
  if (!seeded.length) return false;
  const steps = definition?.steps;
  if (!Array.isArray(steps)) return false;
  return seeded.every((want) =>
    steps.some((raw) => {
      const step = raw as { kind?: unknown; command?: unknown; params?: unknown } | null;
      if (step?.kind !== 'command' || step.command !== want.command) return false;
      const params = (step.params ?? {}) as Record<string, unknown>;
      return Object.entries(want.params).every(([key, value]) => sameValue(params[key], value));
    }),
  );
}

/**
 * **Could this flow be the automation this card creates?**
 *
 * A card that starts on an EVENT is matched on the event: a fact the kernel maintains, that nothing
 * in the editor can quietly rewrite.
 *
 * A card that comes round on a SCHEDULE cannot be matched that way, and — this is the part that bit
 * — it cannot be matched on the schedule either. The schedule is the one thing the card openly
 * invites her to change: its own blank reads «The day and the time», so an owner who moves the
 * weekly review to Thursday at 17:00 is using the card as intended, not editing around it.
 * Identifying by the schedule therefore lost the badge for exactly that owner AND gave her flow to
 * the morning card, which is daily and also creates a task. Until flows#77 the editor made it
 * worse — one touch of the time box rewrote «every Friday at 18:00» as a daily line — and that is
 * fixed (the box keeps the day now), but the hubs that already ran the old editor still hold the
 * flattened flows it wrote.
 *
 * So the schedule is only the coarse filter — «does it come round on a clock we can read» — and what
 * tells the two calendar cards apart is what the card SEEDED into them: the task each one writes and
 * how urgent it is. Both differ between the two cards, neither is reachable from the blanks, and both
 * survive the change of day and hour the cards ask for.
 *
 * The cost runs the other way and it is the cheaper one: an owner who rewrites the seeded task
 * herself loses the badge and is offered the card again. That is the failure this feature already
 * accepts everywhere — silence, and the invitation she had before — never a badge pointing at
 * somebody else's automation.
 */
function isCandidateFor<T extends { definition: Record<string, unknown> }>(
  template: FlowTemplate,
  t: Translator,
  flow: T,
): boolean {
  const definition = flow.definition ?? {};
  const event = templateTriggerEvent(template, t);
  if (event) return triggerEventsOf(definition).includes(event);
  if (!templateIsScheduled(template, t)) return false;
  return hasSchedule(definition) && carriesSeededSteps(definition, seededSteps(template, t));
}

/**
 * **The flows this hub already runs on the same event as `template`, by name** (whatsapp_inbox#58).
 *
 * Two automations on one event both fire. For most pairs that is fine and wanted — log every
 * message AND act on it. For the two WhatsApp appointment families it is not: they wait on the same
 * event with the same filter, so a hub running both books every incoming message TWICE, sends two
 * confirmations, and leaves a customer to cancel one of them.
 *
 * The gallery uses this to ASK before it creates the second one, naming the flow already there. It
 * does not refuse — it is the owner's hub, and «two flows on one event» is a legitimate thing to
 * build. Warn-and-name is what Zapier does for a duplicate Zap and Power Automate for a duplicate
 * flow; a hard block would be us deciding for them.
 *
 * Matched on the EVENT and not on the document: an owner who renamed the flow and reworded its
 * prompts still has an automation firing on every message, and that is the one most likely to have
 * been running longest.
 *
 * A flow that is PAUSED is not named: it does not fire, so there is nothing to double up on — and
 * the switch-over this warning exists for is precisely «turn the attended one off, install the
 * unattended one». A flow handed back without `enabled` still counts: not knowing is not knowing
 * it is off.
 */
export function flowsOnSameTrigger(
  template: FlowTemplate,
  t: Translator,
  flows: readonly { name: string; enabled?: boolean; definition: Record<string, unknown> }[],
): string[] {
  const event = templateTriggerEvent(template, t);
  if (!event) return [];
  return flows
    .filter((flow) => flow.enabled !== false && triggerEventsOf(flow.definition ?? {}).includes(event))
    .map((flow) => flow.name);
}

/** The commands a template's document will ask to run — what identifies it, with its event. */
export function templateCommands(template: FlowTemplate, t: Translator): string[] {
  return templateGrants(template, t)
    .filter((grant) => grant.kind === 'command')
    .map((grant) => grant.value);
}

/** How far this hub has got with one card. Same four words the WhatsApp settings card uses. */
export type InstalledState = 'absent' | 'unfinished' | 'paused' | 'active';

/** What a five-field cron may contain. Anything else is a line we do not run and must not read. */
const CRON_FIELD = /^[*\d,\-/]+$/;

/**
 * One of this hub's flows, as much of it as recognising a template needs.
 *
 * `commands` is the command grants the flow HOLDS, and `undefined` means **not asked yet** — a
 * distinct thing from `[]`, which is a flow the owner authorised for nothing.
 */
export interface InstalledFlowFacts {
  enabled?: boolean;
  definition: Record<string, unknown>;
  commands?: readonly string[];
}

/**
 * **«Does this hub already run this card, and which flow is it?»** (flows#60).
 *
 * The gallery offered «Use this one» on every card for ever, so an owner who set the automation up
 * three weeks ago tapped it again and got a SECOND flow listening to exactly the same thing — on
 * the WhatsApp cards, two answers to one customer for one message.
 *
 * **What identifies «this automation».** Not the template it came from: a created flow keeps no
 * record of one and the document cannot carry it either, because the root of
 * `hub/schemas/flow.schema.json` is `additionalProperties: false`. What it does keep is what it
 * LISTENS to and what it is allowed to DO, and between them they say it precisely. Both are facts
 * the kernel maintains, so neither can go stale behind our back — and an owner who renamed the
 * flow and reworded its steps still has the automation this card would create again.
 *
 * This is the same predicate `queries/automations_status.sql` answers for whatsapp_inbox, and
 * deliberately the same four words, so the card the owner arrives from and the card they land on
 * cannot disagree. It is computed here instead of asked, for two reasons: that query returns three
 * counters and no id, and half of this issue is sending the owner to the flow they already have;
 * and it exists so a module WITHOUT `manage_flows` can ask — this gallery holds it and already has
 * the list in hand, so asking would buy nothing and cost a round trip per card.
 *
 * `unfinished` is its own state because it is a third state: the gallery creates every template
 * paused and with NO grants (rule 3 above) and hands the owner to Permissions, so somebody who
 * stops halfway has a flow that listens and can do nothing. Counting it as absent would put the
 * invitation back on the card and buy the duplicate; counting it as present would say something is
 * running when nothing is. And it is «holds no command grant at all», not «does not hold ours»: a
 * flow on this event with a command of its own is a different automation the business finished.
 *
 * **A card that comes round on a schedule is recognised too** (flows#68), but NOT by its schedule:
 * the day and the hour are precisely what the card asks the owner to set. It is recognised by what
 * the card seeded into it — see {@link isCandidateFor}. A trigger
 * that is neither an event nor a schedule we can read still answers `absent`: a wrong badge is worse
 * than none.
 */
export function templateInstallation<T extends InstalledFlowFacts>(
  template: FlowTemplate,
  t: Translator,
  flows: readonly T[],
): { state: InstalledState; flow?: T } {
  const listening = flows.filter((flow) => isCandidateFor(template, t, flow));
  const commands = templateCommands(template, t);
  const mine = listening.filter((flow) => flow.commands?.some((held) => commands.includes(held)));
  if (mine.length) {
    // The one that answers is the one that is on: handing over the paused copy of a hub that acts
    // on every no-show reads as «it is off» about an automation that is running.
    const running = mine.find((flow) => flow.enabled !== false);
    return running ? { state: 'active', flow: running } : { state: 'paused', flow: mine[0] };
  }

  // `undefined` is «not asked yet», and treating it as «holds nothing» would badge every card of a
  // hub whose grants are still in flight and then unbadge them a round trip later.
  const halfBuilt = listening.find((flow) => flow.commands?.length === 0);
  return halfBuilt ? { state: 'unfinished', flow: halfBuilt } : { state: 'absent' };
}

/**
 * The flows worth asking the hub anything else about: the ones that could be one of these cards.
 *
 * Recognising a card costs one question per candidate, so this is what keeps the badge from being a
 * round trip per card on every visit: a hub with nothing automated yet — the one that opens this
 * gallery most — asks nothing at all, and a busy one asks only about the handful of flows that could
 * possibly be one of these.
 *
 * Deliberately the SAME predicate the badge itself uses ({@link isCandidateFor}), so the two cannot
 * drift into a screen that pays for answers it will not read, or one that badges nothing because it
 * never asked.
 */
export function flowsWorthAsking<T extends { definition: Record<string, unknown> }>(
  flows: readonly T[],
  t: Translator,
  catalogue: readonly FlowTemplate[] = TEMPLATES,
): T[] {
  return flows.filter((flow) => catalogue.some((template) => isCandidateFor(template, t, flow)));
}

/**
 * The card an id names, out of the catalogue that is actually on screen (flows#98).
 *
 * The catalogue is a parameter and not this file's constant because half of it may have come from
 * the hub: a deep link naming a served card — or the retired mirror it replaced — has to resolve,
 * and against the written catalogue alone it resolves to nothing and the gallery opens empty.
 */
export function templateById(
  id: string,
  catalogue: readonly FlowTemplate[] = TEMPLATES,
): FlowTemplate | undefined {
  return catalogue.find((tpl) => tpl.id === id);
}

/** The templates of one sector, in catalogue order. A served card has no sector and is not here. */
export function templatesOf(
  sector: Sector,
  catalogue: readonly FlowTemplate[] = TEMPLATES,
): FlowTemplate[] {
  return catalogue.filter((tpl) => tpl.sector === sector);
}

/**
 * **The card's title, whoever wrote it** (flows#98).
 *
 * A card written here keeps its texts in the catalogue and resolves them through `t`; a card the
 * hub served carries them inside the document its module published, already translated. Reading
 * `nameKey` straight would print an empty string on every served card.
 */
export function templateName(template: FlowTemplate, t: Translator): string {
  return template.name ?? (template.nameKey ? t(template.nameKey) : template.id);
}

/**
 * The one line under the card's title, or `''` when there is none to write.
 *
 * A SERVED card has none, and that is deliberate (flows#98): it is only ever painted under the
 * heading of the app that brought it, which already reads «Comes with WhatsApp Inbox». Repeating
 * that under each title put the same sentence on every card of the column and told the owner
 * nothing they had not just read. Where it came from is said once in the heading and in full in
 * the panel ({@link templatePlain}); this line is for what the recipe IS, and a module that ships
 * no description of its own has nothing to put here.
 */
export function templateSummary(template: FlowTemplate, t: Translator): string {
  if (template.source) return '';
  return template.summaryKey ? t(template.summaryKey) : '';
}

/**
 * The whole automation as a sentence, for the panel before it is created.
 *
 * A served card has no sentence of ours to show — the module wrote the document, not a description
 * of it — so what the panel says is where it came from, and the STEPS are read out of the document
 * itself by `describeStep`, which is the same reading the editor gives any other flow.
 */
export function templatePlain(template: FlowTemplate, t: Translator): string {
  if (template.source) return t('ui.tplFromAppPlain', { app: moduleName(template.source.module, t) });
  return template.plainKey ? t(template.plainKey) : '';
}

/** The document, ready to save. */
export function buildTemplate(template: FlowTemplate, t: Translator): FlowDoc {
  return template.build(t);
}

/**
 * What this template will ask permission for, **read out of its own document**.
 *
 * The same function the editor's Permissions tab uses, on purpose: a second hand-written list is
 * where the typo lives, and a grant naming a command that does not exist reads as authorisation on
 * screen right up until the automation silently does nothing.
 */
/**
 * The permission a declared limit lands on, found by the operation it names (flows#111).
 *
 * The kind is READ OUT of the permissions the card derived instead of assumed, because a limit is
 * not only a command's any more: `channel: "customer"` lands on a `command` and
 * `customer_id: "steps.…"` on a `query`, and both are values the hub is handed to judge
 * ({@link canPinPayload}). Assuming `command` does not fail loudly — {@link setGrantPin} matches on
 * `kind` AND `value`, so the pin lands on nothing at all and the read installs WIDE while the
 * source above still reads like a containment.
 *
 * The fallback keeps that old behaviour for an operation the card does not use — it lands on
 * nothing — because the catalogue guard already refuses that case at build time, and inventing a
 * row here would ask the hub for a permission the document never justified.
 */
function pinTarget(grants: readonly Grant[], operation: string): Pick<Grant, 'kind' | 'value'> {
  const found = grants.find((grant) => grant.value === operation && canPinPayload(grant.kind));
  return found ? { kind: found.kind, value: found.value } : { kind: 'command', value: operation };
}

export function templateGrants(template: FlowTemplate, t: Translator): Grant[] {
  // flows#98 — a served card asks for what its module DECLARED in `<family>.grants.json`, which is
  // the list `erplora validate` checked against the recipe. Deriving them again here would be a
  // second opinion about somebody else's automation, and a narrower declared list — a module that
  // deliberately does not ask for something its document could reach — would be widened by us.
  if (template.grants) return template.grants.map((grant) => ({ ...grant }));
  const derived = requiredGrants(buildTemplate(template, t));
  // flows#80 — the limits the card declares, laid onto the permissions it derived. `setGrantPin`
  // and not a hand-rolled merge on purpose: it is the same function the Permissions screen writes
  // pins with, so a limit shown here and a limit typed there cannot drift into different shapes.
  // A pin naming an operation this card does not use lands on nothing; the catalogue test above
  // refuses that at build time rather than letting it read as a containment that fixes nothing.
  return Object.entries(template.grantPins ?? {}).reduce(
    (grants, [operation, pin]) => setGrantPin(grants, pinTarget(grants, operation), pin),
    derived,
  );
}

/**
 * The modules this hub does not have, given what the probes answered.
 *
 * `known[event] === false` is the hub saying `404`. Anything else — `true`, or nothing yet — is
 * not a refusal: treating «not asked yet» as «not installed» would grey out the whole gallery for
 * as long as the probes take, which is the first second of every visit.
 */
export function missingModules(
  template: FlowTemplate,
  known: Readonly<Record<string, boolean>>,
): string[] {
  const out: string[] = [];
  for (const witness of template.witnesses) {
    if (known[witness.event] === false && !out.includes(witness.module)) out.push(witness.module);
  }
  return out;
}

/**
 * **The templates of one sector this hub can actually run** (flows#52).
 *
 * A card whose module the hub has refused is not offered at all. It used to be shown greyed out
 * with the module named on it (flows#38), and that was the right answer while every card in the
 * catalogue was something any shop might install. It stopped being the right answer when the
 * catalogue grew cards for modules a business will never own: the WhatsApp card needs a diary, a
 * service catalogue and a staff list, and whatsapp_inbox#60 adds a table-booking twin that needs
 * Reservations — so a hair salon was being shown a restaurant's automation with a badge on it.
 *
 * What flows#38 was protecting is kept, and it is {@link unavailableModules}: the owner still
 * learns which app to install, by name — once, under the cards, instead of on each grey one.
 *
 * `known[event] === false` is the only refusal. «Not asked yet» leaves the card in place, for the
 * same reason it never greyed one out: hiding on an unanswered probe empties the gallery for the
 * first second of every visit and then fills it back in, which reads as a broken screen.
 */
export function availableTemplates(
  sector: Sector,
  known: Readonly<Record<string, boolean>>,
  facts: SchemaFacts = schemaFacts(undefined),
  catalogue: readonly FlowTemplate[] = TEMPLATES,
): FlowTemplate[] {
  return templatesOf(sector, catalogue).filter((tpl) => runnableHere(tpl, known, facts));
}

/**
 * Whether this hub can run this card at all — its modules are here and its core parses it.
 *
 * Exported because the served cards do not live in a sector (they are grouped by the app they came
 * with), so {@link availableTemplates} never sees them and the same two checks have to be reachable
 * on their own. Same function, so a card cannot be judged by one rule in the sector list and
 * another under its app's heading.
 */
export function runnableHere(
  template: FlowTemplate,
  known: Readonly<Record<string, boolean>>,
  facts: SchemaFacts = schemaFacts(undefined),
): boolean {
  return missingModules(template, known).length === 0 && coreTakes(template, facts);
}

/**
 * Whether this hub can PARSE what the card writes — {@link FlowTemplate.needs}.
 *
 * **Fail-closed, unlike the module probe**, and the asymmetry is the point: a module probe that has
 * not answered yet costs a card that appears a second late, and hiding on it would empty the
 * gallery and fill it back in. An unanswered KERNEL probe costs an automation that installs and
 * then refuses to parse, so «not asked yet» has to mean «not offered». `schemaFacts(undefined)`
 * answers `false` to every need, which is exactly that.
 */
function coreTakes(template: FlowTemplate, facts: SchemaFacts): boolean {
  return (template.needs ?? []).every((need) => facts[NEED_FACT[need]] === true);
}

/**
 * The modules the hidden cards needed, deduped, in catalogue order.
 *
 * Only the modules of a card that is actually hidden: a hub without `sales` hides «write the big
 * visits into the card», and naming its OTHER module would send the owner to install Customers,
 * which they already have.
 */
export function unavailableModules(known: Readonly<Record<string, boolean>>): string[] {
  const out: string[] = [];
  for (const template of TEMPLATES) {
    for (const id of missingModules(template, known)) {
      if (!out.includes(id)) out.push(id);
    }
  }
  return out;
}

/**
 * The name the owner knows a module by, in place of the id the witnesses carry (flows#38).
 *
 * A grey card saying «Falta un módulo» is true and useless: the owner's next step is the
 * marketplace, and there the thing is called by its name, never by `tasks`. The names are copied
 * from each module's own catalogue (its localized `name`), not invented — the label has to match
 * the marketplace card or it points at nothing.
 *
 * An id this dictionary has never heard of (a template from a newer module) falls back to the id
 * itself: worse than a translation, better than a blank.
 */
const MODULE_LABELS: Readonly<Record<string, string>> = {
  appointments: 'ui.mod_appointments',
  cash_register: 'ui.mod_cash_register',
  customers: 'ui.mod_customers',
  reservations: 'ui.mod_reservations',
  sales: 'ui.mod_sales',
  services: 'ui.mod_services',
  staff: 'ui.mod_staff',
  tasks: 'ui.mod_tasks',
  verifactu: 'ui.mod_verifactu',
  whatsapp_inbox: 'ui.mod_whatsapp_inbox',
};

export function moduleName(id: string, t: Translator): string {
  const key = MODULE_LABELS[id];
  return key ? t(key) : id;
}

/**
 * **The catalogue on screen once the hub has said what its modules bring** (flows#98, hub#1611).
 *
 * A module ships its automations in its own `flows/` folder and the hub serves them since
 * hub#1645. Four cards in this file are hand copies of WhatsApp recipes made back when that door
 * did not exist, so on a hub that serves them the owner would be shown the same automation twice —
 * two cards, one of them a snapshot of whatever the module looked like the day it was copied.
 *
 * The copy gives way to the original, never the other way round: the module's version is the one
 * that ships with the module the hub actually has installed.
 *
 * 🔴 **The retired card's id keeps working**, and that is not a nicety. `?template=…` is an address
 * other modules publish — `whatsapp_inbox` pushes `whatsapp-appointment` from its own settings
 * screen — so dropping the card without leaving a forwarding address turns a link inside the
 * product into a gallery that opens on nothing.
 */
export interface MergedCatalogue {
  /** What to paint: the cards written here, then the ones the hub served. */
  cards: FlowTemplate[];
  /** `<id of the retired copy>` → `<id of the card that replaced it>`, for deep links already out there. */
  aliases: Record<string, string>;
}

/**
 * **The ids this catalogue used to answer on, and the family that took each one over** (flows#101).
 *
 * These four cards were hand copies of recipes `whatsapp_inbox` publishes itself, kept here for as
 * long as no hub could serve a module's own `flows/` folder. `v1.1.17` serves them
 * (`GET /api/hub/flows/templates`, hub#1611) and carries the payload limits with them (hub#1654),
 * so the copies went — they were four documents that had to be re-synced by hand and had already
 * drifted from the published source twice (flows#100 and again on 2026-09-08).
 *
 * The ids are the part that cannot go with them. `whatsapp_inbox` builds
 * `?template=whatsapp-appointment` in its own settings screen (`ui/lib/whatsapp-uses.ts`) and
 * ships it in a release of its own, so it is an address between two repositories, not a private
 * name; the other three were live ids of this gallery for weeks and can be sitting in a bookmark.
 * Named here they keep landing on the recipe that replaced them instead of on the whole gallery.
 *
 * 🔴 **An entry is only ever REMOVED when the family itself stops being served.** Deleting one
 * because «nothing links to it any more» is unverifiable from this repository: the links are in
 * other people's browsers.
 */
const RETIRED_IDS: Readonly<Record<string, { readonly module: string; readonly family: string }>> = {
  'whatsapp-appointment': { module: 'whatsapp_inbox', family: 'appointment-from-whatsapp' },
  'whatsapp-appointment-unattended': {
    module: 'whatsapp_inbox',
    family: 'appointment-from-whatsapp-unattended',
  },
  'whatsapp-reservation': { module: 'whatsapp_inbox', family: 'reservation-from-whatsapp' },
  'whatsapp-reservation-unattended': {
    module: 'whatsapp_inbox',
    family: 'reservation-from-whatsapp-unattended',
  },
};

export function mergeTemplates(
  local: readonly FlowTemplate[],
  fromModules: readonly FlowTemplate[],
): MergedCatalogue {
  const aliases: Record<string, string> = {};
  for (const served of fromModules) {
    if (!served.source) continue;
    for (const [id, was] of Object.entries(RETIRED_IDS)) {
      if (was.module !== served.source.module) continue;
      if (was.family !== served.source.family) continue;
      aliases[id] = served.id;
    }
  }
  return { cards: [...local, ...fromModules], aliases };
}
