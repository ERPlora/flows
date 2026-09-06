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
   * ⚠️ **It is a MIRROR, and mirrors go stale.** The document below is `whatsapp_inbox` v2.1.31,
   * copied because the two repositories cannot read each other and the hub has no route that
   * serves a module's own templates (the manifest has no `flows` key and `erplora pack` does not
   * put the folder in the zip). Retiring this copy — the runtime serving each installed module's
   * templates, and this gallery merging them — is the real fix, and it is issued. Until then, the
   * grants are pinned against the module's own `.grants.json` in `templates.test.ts`: the two may
   * word a prompt differently, but they cannot ask for different permissions.
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
      'appointments.appointments.conflicting': 'tpl.grant.appointmentsConflicting',
      'appointments.appointments.create': 'tpl.grant.appointmentsCreate',
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
          event: 'hub.whatsapp.message_received',
          filter: { 'event.text': { neq: '' } },
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
        // `auto`: every operation here only ANSWERS. Sending «may I check the diary?» to the
        // approval tray is how the proposal never arrives.
        {
          id: 'gather_availability',
          kind: 'ai',
          prompt: t('tpl.waAppointment.availabilityPrompt'),
          tools: {
            queries: [
              'services.services.list',
              'staff.members.list',
              'staff.schedules.list_for_member',
            ],
            commands: [
              'appointments.availability.day_opening',
              'appointments.availability.slots',
              'appointments.availability.check',
            ],
          },
          policy: 'auto',
          max_iters: 8,
        },
        // `manual` again, and this is the one that matters: the booking itself waits in the tray
        // until somebody at the salon says yes.
        {
          id: 'propose_appointment',
          kind: 'ai',
          prompt: t('tpl.waAppointment.proposePrompt'),
          tools: {
            queries: [
              'customers.list',
              'services.services.list',
              'appointments.appointments.conflicting',
            ],
            commands: ['appointments.appointments.create'],
          },
          policy: 'manual',
          max_iters: 8,
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
