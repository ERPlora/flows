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
import { requiredGrants } from './flow-doc';
import type { Translator } from './plain-language';

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

export interface FlowTemplate {
  id: string;
  sector: Sector;
  /** `ion-icon` name (registered by the module build, never a loose SVG). */
  icon: string;
  nameKey: string;
  /** One line for the card. */
  summaryKey: string;
  /** The whole automation as a sentence, for the panel before it is created. */
  plainKey: string;
  blanks: readonly TemplateBlank[];
  witnesses: readonly TemplateWitness[];
  /** Why each command is needed, keyed by command name. Shown BEFORE the flow exists. */
  grantReasons: Readonly<Record<string, string>>;
  /** Always `false`, and typed as `false` so a template cannot be born running. */
  enabledOnCreate?: false;
  /** The document, in the owner's language. */
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
    build: (t) => ({
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
    build: (t) => ({
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
    build: (t) => ({
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
    build: (t) => ({
      schema_version: SCHEMA_VERSION,
      triggers: [{ kind: 'event', event: 'whatsapp_inbox.message.received' }],
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
    build: (t) => ({
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
    build: (t) => ({
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
    build: (t) => ({
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
    build: (t) => ({
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
    build: (t) => ({
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

  /**
   * **flows#52 — the message becomes a booking, which is the case the product is sold on.**
   *
   * This is the automation `whatsapp_inbox` has shipped since it learned to book
   * (`flows/appointment-from-whatsapp.{es,en}.flow.json`), brought into the gallery so that
   * somebody can actually pick it. Until now nothing installed it: the hub reads no `*.flow.json`
   * anywhere, so the only thing that ever created it was the module's own end-to-end test, and a
   * salon that connected its number and opened Automations found «make a task» and nothing else.
   *
   * ⚠️ **It is a MIRROR, and mirrors go stale.** The document below is
   * `whatsapp_inbox@89f8d02` (PR #69, the first half of whatsapp_inbox#58, on top of PR #63's
   * one-turn rewrite of #55), copied because
   * the two repositories cannot read each other and the hub has no route that serves a module's
   * own templates (the manifest has no `flows` key and `erplora pack` does not put the folder in
   * the zip — hub#1611 and module-toolkit#209). Retiring this copy — the runtime serving each
   * installed module's templates, and this gallery merging them — is the real fix. Until then the
   * copy is pinned in `templates.test.ts` by COMMIT (the module's version does not move on a
   * template change: v2.1.31 named both the old and the new document) and by a hash of the whole
   * document in both languages, so it cannot word a prompt differently, ask for a different
   * permission, or drift one iteration without going red. The commit is the thing to move when
   * whatsapp_inbox#58's second half and #61 rewrite it again — and they will: the template moves
   * every time the flow does. It went stale TWICE on the day it was written.
   *
   * **Why it needs five modules.** It reads the catalogue (`services`), the diary
   * (`appointments`), who works when (`staff`), the customer's card (`customers`), and it answers
   * through the conversation (`whatsapp_inbox`). A hub short of any of them cannot run it, which
   * is why the gallery hides it rather than offering it greyed out: a salon with no Reservations
   * has no use for whatsapp_inbox#60's table-booking twin either.
   */
  {
    id: 'whatsapp-appointment',
    sector: 'beauty',
    icon: 'calendar-number-outline',
    nameKey: 'tpl.waAppointment.name',
    summaryKey: 'tpl.waAppointment.summary',
    plainKey: 'tpl.waAppointment.plain',
    blanks: [
      { labelKey: 'tpl.waAppointment.blankReply', hintKey: 'tpl.waAppointment.blankReplyHint' },
    ],
    witnesses: [
      { event: 'whatsapp_inbox.message.received', module: 'whatsapp_inbox' },
      { event: 'appointments.appointment.created', module: 'appointments' },
      { event: 'customer.created', module: 'customers' },
      { event: 'services.service.created', module: 'services' },
      { event: 'staff.member.created', module: 'staff' },
    ],
    grantReasons: {
      whatsapp: 'tpl.grant.notifyWhatsapp',
      'whatsapp_inbox.conversations.list#contact_phone': 'tpl.grant.recipientWhatsapp',
      'customers.list': 'tpl.grant.customersList',
      'customers.create': 'tpl.grant.customersCreate',
      'services.services.list': 'tpl.grant.servicesList',
      'staff.members.list': 'tpl.grant.staffList',
      'staff.schedules.list_for_member': 'tpl.grant.staffSchedules',
      'appointments.availability.day_opening': 'tpl.grant.dayOpening',
      'appointments.availability.slots': 'tpl.grant.availabilitySlots',
      'appointments.availability.check': 'tpl.grant.availabilityCheck',
      'appointments.appointments.create': 'tpl.grant.appointmentsCreate',
      'appointments.appointments.list_for_customer': 'tpl.grant.appointmentsListForCustomer',
      'appointments.appointments.cancel': 'tpl.grant.appointmentsCancel',
      'appointments.appointments.reschedule': 'tpl.grant.appointmentsReschedule',
    },
    build: (t) => ({
      schema_version: SCHEMA_VERSION,
      triggers: [
        {
          kind: 'event',
          // The CORE's own event (`crates/server/src/inbound_poll.rs`), not the module's: it is
          // what the published document waits for, and it carries the message itself. An empty
          // body is a sticker or a photo — there is nothing for a model to read, and every reply
          // this automation sends is billed by Meta.
          //
          // The other two clauses are what stop the automation answering things no customer ever
          // wrote (whatsapp_inbox#90). The poller asks the core for `?direction=all&source=all`, so
          // the event carries the owner's OWN replies echoed back from her phone — answered, the
          // salon is confirmed an appointment on its own number — and the 180 days of backlog Meta
          // hands over the moment the number is connected: everybody who wrote in March is
          // confirmed today.
          //
          // `neq` and not `eq`/`in` on purpose, and it is the SAME reason on both sides of this
          // mirror: `direction`, `source` and `contact` reach the event only from hub#1621, which
          // no published hub tag carries — `v1.1.15` is the newest, and it is the floor
          // whatsapp_inbox declares. In the kernel an absent path resolves to `Null` and
          // `json_eq(Null, x)` is false, so a filter written affirmatively matches NOTHING on a hub
          // at that floor: no run, no error, no log. Written as `neq`, `Null` passes — which is
          // exactly what such a core can serve (inbound only, live only). The affirmative form is
          // whatsapp_inbox#95, for when the floor rises.
          event: 'hub.whatsapp.message_received',
          filter: {
            'event.text': { neq: '' },
            'event.direction': { neq: 'outbound' },
            'event.source': { neq: 'history' },
          },
          input: {
            from: 'event.from',
            text: 'event.text',
            wa_message_id: 'event.wa_message_id',
            received_at: 'event.received_at',
          },
        },
      ],
      steps: [
        // Answered in seconds, before anybody has read anything: the wait is what makes a customer
        // write to the salon next door. The recipient is resolved through the conversation, never
        // written into the document — a template that carried a phone number would text the wrong
        // person on every hub that installed it.
        {
          id: 'acknowledge',
          kind: 'notify',
          channel: 'whatsapp',
          to: {
            query: 'whatsapp_inbox.conversations.list',
            params: { f_wa_contact_id: 'input.from' },
            field: 'contact_phone',
          },
          template: '',
          vars: { text: t('tpl.waAppointment.ackText') },
        },
        // `manual`: creating a customer card is a write, and it waits for a person.
        {
          id: 'know_the_customer',
          kind: 'ai',
          prompt: t('tpl.waAppointment.knowPrompt'),
          tools: { queries: ['customers.list'], commands: ['customers.create'] },
          policy: 'manual',
          max_iters: 4,
        },
        // `manual` again, and this is the one that matters: what it proposes waits in the tray
        // until somebody at the salon says yes. ONE turn asks the diary and proposes — the
        // availability operations only answer, and a `manual` step may read since hub#1595
        // (whatsapp_inbox#55 collapsed the former «gather, then propose» pair).
        //
        // It also CANCELS and MOVES (whatsapp_inbox#61, #74): the prompt decides first what the
        // message is asking for, and books, cancels or moves. Two steps would have cost either an
        // extra billed model turn or a second flow routed by keyword — and `Op::Contains` is
        // case-sensitive, ANDed and unnegatable, so «Cancela mi cita» would miss while the booking
        // flow fired anyway. The branches EXCLUDE each other, so the budget below is untouched:
        // booking chains up to nine calls, moving six and cancelling three.
        //
        // Moving is ONE call — `appointments.appointments.reschedule` — and never cancel-then-book:
        // that spends the cancellation the salon allows the customer, drops the appointment the
        // salon had in front of it, and leaves whoever wrote in order to KEEP their hour with
        // nothing when the second half fails. The id always comes out of
        // `appointments.appointments.list_for_customer`, because unlike cancelling this command
        // carries no `channel` and no `customer_id` (appointments 1.1.72), so nothing below it can
        // tell whose appointment it was handed.
        //
        // `max_iters` sits at the kernel's cap on purpose: the hub refuses a document above it, so
        // there is no margin — whoever lengthens the BOOKING chain adds a step instead.
        {
          id: 'propose_appointment',
          kind: 'ai',
          prompt: t('tpl.waAppointment.proposePrompt'),
          tools: {
            queries: [
              'customers.list',
              'services.services.list',
              'staff.members.list',
              'staff.schedules.list_for_member',
              'appointments.appointments.list_for_customer',
            ],
            commands: [
              'appointments.availability.day_opening',
              'appointments.availability.slots',
              'appointments.availability.check',
              'appointments.appointments.create',
              'appointments.appointments.cancel',
              'appointments.appointments.reschedule',
            ],
          },
          policy: 'manual',
          max_iters: 10,
          // whatsapp_inbox#67. Without this the kernel CANCELS the run at the rejection, and the
          // notify below — the only thing that ever speaks to the customer — is dead code: she was
          // told «we will confirm as soon as the salon opens» and then nothing came, forever.
          // `continue` hands the refusal to the step after it instead of ending the run.
          //
          // 🔴 Needs hub#1622 DEPLOYED. An `ai` step carrying `on_reject` on an older hub is not
          // degraded, it is refused whole (`flow.invalid_definition`), so this card would fail to
          // install rather than install without the reply.
          on_reject: 'continue',
        },
        // whatsapp_inbox#67: the one step that knows how it ENDED, and the only author of what she
        // reads. It carries no tools on purpose — it cannot book, cancel or look anything up, so
        // there is nothing here for the salon to approve and nothing a customer's message could
        // talk it into doing. `approved` or nothing refused, it forwards the proposing step's
        // words untouched (the day, the hour and the professional live only there); `rejected`, it
        // writes a new message that says the time cannot be AND what she does next — answer here
        // with another day. A «no» with nothing after it is where she stops writing.
        {
          id: 'reply_to_customer',
          kind: 'ai',
          prompt: t('tpl.waAppointment.replyPrompt'),
          policy: 'manual',
          max_iters: 1,
        },
        // whatsapp_inbox#58, first half: once the salon has decided, the customer hears about it —
        // on WhatsApp, in the words the step above wrote FOR them. Same recipient resolution as the
        // acknowledgement, so the two notifies cost one channel grant and one recipient grant, not
        // two of each. Not a text of ours to translate: it is the model's reply.
        {
          id: 'confirm_to_customer',
          kind: 'notify',
          channel: 'whatsapp',
          to: {
            query: 'whatsapp_inbox.conversations.list',
            params: { f_wa_contact_id: 'input.from' },
            field: 'contact_phone',
          },
          template: '',
          vars: { text: '{{steps.reply_to_customer.text}}' },
        },
      ],
    }),
  },

  /**
   * **The same automation, with nobody watching** (whatsapp_inbox#58).
   *
   * The twin above proposes and waits: both model steps are `manual`, so every appointment sits in
   * the approval tray until somebody at the salon says yes. That is right for a shop with a person
   * at the counter and wrong for the one this card is for — a single hairdresser with both hands
   * busy, whose WhatsApp nobody reads until closing. For them the tray is not a safety net, it is
   * where appointments go to expire.
   *
   * So the two model steps are `auto`: the hub runs the write inside the turn
   * (`agent_runner.rs`), the appointment is in the diary before anyone reads the message, and the
   * customer is told so in the same breath. `approval_mode` in the module's own settings does NOT
   * do this — a request born `confirmed` can never be approved and nothing books it — which is why
   * the unattended mode is a second FAMILY and not a switch.
   *
   * **What does not change, and is the whole reason this is safe enough to ship:** the model never
   * chooses the hour. It may only book a start the customer asked for; if the message does not pin
   * down both a day and an hour it books nothing and answers with the slots that are really free.
   * With no person to catch it, a bot that picks the hour books people into times they cannot make.
   * That rule lives in the prompt — the kernel cannot tell «the hour they asked for» from «the hour
   * I chose» — and `whatsapp_inbox/tests/flow_templates.test.py::hour_choice_problems` is what
   * keeps it there, in both languages.
   *
   * **Install ONE of the two, never both.** They wait on the same event with the same filter, so a
   * hub with both books every incoming message twice. Neither the name nor the summary leaves that
   * to a README: the gallery says it on the card, and warns before it creates the second one.
   */
  {
    id: 'whatsapp-appointment-unattended',
    sector: 'beauty',
    // A calendar with a tick, against the twin's numbered calendar: this one is already booked.
    icon: 'calendar-clear-outline',
    nameKey: 'tpl.waAppointmentUnattended.name',
    summaryKey: 'tpl.waAppointmentUnattended.summary',
    plainKey: 'tpl.waAppointmentUnattended.plain',
    blanks: [
      {
        labelKey: 'tpl.waAppointmentUnattended.blankReply',
        hintKey: 'tpl.waAppointmentUnattended.blankReplyHint',
      },
    ],
    // The same five modules as the twin: it reads the catalogue, the diary, who works when and the
    // customer's card, and answers through the conversation.
    witnesses: [
      { event: 'whatsapp_inbox.message.received', module: 'whatsapp_inbox' },
      { event: 'appointments.appointment.created', module: 'appointments' },
      { event: 'customer.created', module: 'customers' },
      { event: 'services.service.created', module: 'services' },
      { event: 'staff.member.created', module: 'staff' },
    ],
    // The same thirteen, and deliberately not one more: running unattended is a reason to skip the
    // tray, never a reason to ask for a permission the attended twin does without.
    grantReasons: {
      whatsapp: 'tpl.grant.notifyWhatsapp',
      'whatsapp_inbox.conversations.list#contact_phone': 'tpl.grant.recipientWhatsapp',
      'customers.list': 'tpl.grant.customersList',
      'customers.create': 'tpl.grant.customersCreate',
      'services.services.list': 'tpl.grant.servicesList',
      'staff.members.list': 'tpl.grant.staffList',
      'staff.schedules.list_for_member': 'tpl.grant.staffSchedules',
      'appointments.availability.day_opening': 'tpl.grant.dayOpening',
      'appointments.availability.slots': 'tpl.grant.availabilitySlots',
      'appointments.availability.check': 'tpl.grant.availabilityCheck',
      'appointments.appointments.create': 'tpl.grant.appointmentsCreate',
      'appointments.appointments.list_for_customer': 'tpl.grant.appointmentsListForCustomer',
      'appointments.appointments.cancel': 'tpl.grant.appointmentsCancel',
      'appointments.appointments.reschedule': 'tpl.grant.appointmentsReschedule',
    },
    build: (t) => ({
      schema_version: SCHEMA_VERSION,
      triggers: [
        {
          kind: 'event',
          // Same event and same filter as the twin — which is exactly why a hub must not run both,
          // the echo and the backlog included (whatsapp_inbox#90; the twin above carries the why).
          // This family matters most for it: it books without asking anybody, so an echo answered
          // here is an appointment in the diary, not just a message.
          event: 'hub.whatsapp.message_received',
          filter: {
            'event.text': { neq: '' },
            'event.direction': { neq: 'outbound' },
            'event.source': { neq: 'history' },
          },
          input: {
            from: 'event.from',
            text: 'event.text',
            wa_message_id: 'event.wa_message_id',
            received_at: 'event.received_at',
          },
        },
      ],
      steps: [
        // Answered in seconds, and here it is the only thing that happens before the diary is
        // touched. Its wording promises no person: with this family there is not one.
        {
          id: 'acknowledge',
          kind: 'notify',
          channel: 'whatsapp',
          to: {
            query: 'whatsapp_inbox.conversations.list',
            params: { f_wa_contact_id: 'input.from' },
            field: 'contact_phone',
          },
          template: '',
          vars: { text: t('tpl.waAppointmentUnattended.ackText') },
        },
        // `auto`: the customer card is created inside the turn, on the salon's real customer list.
        // The prompt says so in as many words — nobody checks this afterwards.
        {
          id: 'know_the_customer',
          kind: 'ai',
          prompt: t('tpl.waAppointmentUnattended.knowPrompt'),
          tools: { queries: ['customers.list'], commands: ['customers.create'] },
          policy: 'auto',
          max_iters: 4,
        },
        // `auto`, and this is the step the whole family exists for: it books. Named
        // `book_appointment` and not `propose_appointment` because that is what it does — there is
        // no proposal and no tray. Same tools and same budget as the twin (the cap: booking chains
        // up to nine calls, moving six), same «decide first what they are asking for» branch that
        // cancels or moves instead of booking when that is what the message says. With nobody
        // watching, moving as ONE call matters more here: a cancel-then-book that fails halfway
        // leaves the customer with no appointment and no salon reading the tray (whatsapp_inbox#74).
        {
          id: 'book_appointment',
          kind: 'ai',
          prompt: t('tpl.waAppointmentUnattended.bookPrompt'),
          tools: {
            queries: [
              'customers.list',
              'services.services.list',
              'staff.members.list',
              'staff.schedules.list_for_member',
              'appointments.appointments.list_for_customer',
            ],
            commands: [
              'appointments.availability.day_opening',
              'appointments.availability.slots',
              'appointments.availability.check',
              'appointments.appointments.create',
              'appointments.appointments.cancel',
              'appointments.appointments.reschedule',
            ],
          },
          policy: 'auto',
          max_iters: 10,
        },
        // What the booking step wrote, sent as it is. With no approval in the middle this is the
        // customer's ONLY notice that the appointment exists, which is why the prompt ends by
        // demanding the words come in the same reply as the booking.
        {
          id: 'confirm_to_customer',
          kind: 'notify',
          channel: 'whatsapp',
          to: {
            query: 'whatsapp_inbox.conversations.list',
            params: { f_wa_contact_id: 'input.from' },
            field: 'contact_phone',
          },
          template: '',
          vars: { text: '{{steps.book_appointment.text}}' },
        },
      ],
    }),
  },

  // ── Bars and restaurants ────────────────────────────────────────────────────────────────────
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
    build: (t) => ({
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
 * A card that does not start on an event answers `absent` and gets no badge: two flows on «every
 * Friday at 18:00» are not the same automation, and a wrong badge is worse than none (flows#68).
 */
export function templateInstallation<T extends InstalledFlowFacts>(
  template: FlowTemplate,
  t: Translator,
  flows: readonly T[],
): { state: InstalledState; flow?: T } {
  const event = templateTriggerEvent(template, t);
  if (!event) return { state: 'absent' };

  const listening = flows.filter((flow) => triggerEventsOf(flow.definition ?? {}).includes(event));
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
 * The flows worth asking the hub anything else about: the ones already waiting on a card's event.
 *
 * Recognising a card costs one question per candidate, so this is what keeps the badge from being
 * a round trip per card on every visit: a hub with nothing automated yet — the one that opens this
 * gallery most — asks nothing at all, and a busy one asks only about the handful of flows that
 * could possibly be one of these.
 */
export function flowsOnTemplateEvents<T extends { definition: Record<string, unknown> }>(
  flows: readonly T[],
  t: Translator,
): T[] {
  const events = new Set(
    TEMPLATES.map((template) => templateTriggerEvent(template, t)).filter(
      (event): event is string => event !== null,
    ),
  );
  return flows.filter((flow) => triggerEventsOf(flow.definition ?? {}).some((e) => events.has(e)));
}

export function templateById(id: string): FlowTemplate | undefined {
  return TEMPLATES.find((tpl) => tpl.id === id);
}

/** The templates of one sector, in catalogue order. */
export function templatesOf(sector: Sector): FlowTemplate[] {
  return TEMPLATES.filter((tpl) => tpl.sector === sector);
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
export function templateGrants(template: FlowTemplate, t: Translator): Grant[] {
  return requiredGrants(buildTemplate(template, t));
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
): FlowTemplate[] {
  return templatesOf(sector).filter((tpl) => missingModules(tpl, known).length === 0);
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
