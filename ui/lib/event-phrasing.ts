/**
 * **Words for an event this module has never been told about** (flows#41).
 *
 * The hub decides WHICH events exist and this module decides what they are CALLED — the division
 * of labour `event-catalog.ts` describes. The problem that division created is arithmetic: the hub
 * serves 196 events on a shop with everything installed, and {@link TRIGGER_CATALOG}, written by
 * hand, had words for 24. The other 172 reached the owner as `inventory.low_stock_crossed`, the
 * flagship case among them.
 *
 * Writing 224 more sentences by hand would fix today and break again with the next module. So the
 * dictionary is layered, and only the top layer is hand-written:
 *
 *   1. **Curated** — {@link TRIGGER_CATALOG}. The phrase a shop owner actually uses: «se cobra una
 *      venta», not «se completa una venta». Always wins where it exists.
 *   2. **Composed** — `<family>.<subject>.<action>` is the shape 204 of the 228 names already
 *      follow, so the pieces are translated once and assembled per language. `appointment` +
 *      `deleted` reads «se borra una cita» in Spanish and «an appointment is deleted» in English:
 *      one template per language, because the word order is not the same.
 *   3. **Humanised** — a subject or an action nobody has written down yet still comes out as
 *      words. It is not good prose; it is not `weird_module.odd_thing.went_sideways` either.
 *
 * The bar layer 3 exists for is the one flows#8 already settled: an event this file has no words
 * for is still OFFERED. Hiding it would be a functional gap; naming it badly is a cosmetic one.
 *
 * **Grammar, and why the tables look like this.** Spanish is the language the shop reads and it
 * agrees in gender and number, so the article travels WITH the noun (`una cita`, `un producto`) and
 * the impersonal verb carries the number (`se cambia` / `se cambian`). That keeps the two axes
 * independent: 66 subjects × 68 actions from ~140 strings instead of a sentence per pair. An action
 * whose Spanish is adjectival (`ready` → «listo/lista») cannot be gender-free, so it stays curated.
 */
import { catalogEntry } from './trigger-catalog';
import type { Translator } from './plain-language';

/** The thing an event happens to. The article travels with the noun so Spanish agrees. */
export interface EventSubject {
  /** i18n key of the noun WITH its article: «una cita» / "an appointment". */
  key: string;
  /** `true` for a noun that is plural in both languages («los ajustes» / "the settings"). */
  plural?: boolean;
}

/** What happens to it. Spanish is impersonal (`se …`), English is passive (`is …`). */
export interface EventAction {
  /** i18n key of the verb for a singular subject. */
  key: string;
  /** i18n key for a plural subject. Only the actions that meet one need it — see the guard test. */
  pluralKey?: string;
}

/** The pieces of an event name, whatever its arity. */
export interface EventParts {
  family: string;
  subject: string;
  action: string;
}

/**
 * The module an event belongs to → the name the owner knows it by. Includes the four families the
 * hub's own runtime emits under (`flow.*`, `host.*`) and the bare namespaces the first modules
 * shipped before names were prefixed (`sale.*`, `customer.*`, `order.*`, `invoice.*`).
 */
export const EVENT_FAMILIES: Readonly<Record<string, string>> = {
  appointments: 'ui.evfAppointments',
  cart_checkout: 'ui.evfCartCheckout',
  cash_register: 'ui.evfCashRegister',
  combos: 'ui.evfCombos',
  customer: 'ui.evfCustomers',
  customers: 'ui.evfCustomers',
  flow: 'ui.evfFlows',
  flows: 'ui.evfFlows',
  host: 'ui.evfHost',
  inventory: 'ui.evfInventory',
  invoice: 'ui.evfInvoice',
  invoice_series: 'ui.evfInvoiceSeries',
  kitchen: 'ui.evfKitchen',
  modifiers: 'ui.evfModifiers',
  online_booking: 'ui.evfOnlineBooking',
  order: 'ui.evfSales',
  payment_gateways: 'ui.evfPaymentGateways',
  payments: 'ui.evfPayments',
  pricing: 'ui.evfPricing',
  printing: 'ui.evfPrinting',
  reservations: 'ui.evfReservations',
  sale: 'ui.evfSales',
  sales: 'ui.evfSales',
  schedules: 'ui.evfSchedules',
  services: 'ui.evfServices',
  staff: 'ui.evfStaff',
  tables: 'ui.evfTables',
  tasks: 'ui.evfTasks',
  taxes: 'ui.evfTaxes',
  tickets: 'ui.evfTickets',
  verifactu: 'ui.evfVerifactu',
  whatsapp_inbox: 'ui.evfWhatsapp',
};

/**
 * The nouns. A key may be qualified with its family (`cart_checkout.order`) when the same word
 * means different things in two modules — an `order` is a comanda in the kitchen and a pedido in
 * the online cart, and calling both the same is how a dropdown stops being readable.
 */
export const EVENT_SUBJECTS: Readonly<Record<string, EventSubject>> = {
  aeat: { key: 'ui.evsAeat' },
  alias: { key: 'ui.evsTaxAlias' },
  appointment: { key: 'ui.evsAppointment' },
  blocked_date: { key: 'ui.evsBlockedDate' },
  blocked_time: { key: 'ui.evsBlockedTime' },
  booking: { key: 'ui.evsBooking' },
  booking_request: { key: 'ui.evsBookingRequest' },
  business_hours: { key: 'ui.evsBusinessHours', plural: true },
  cart: { key: 'ui.evsCart' },
  carts: { key: 'ui.evsCarts', plural: true },
  chain: { key: 'ui.evsChain' },
  checkout: { key: 'ui.evsCheckout' },
  choice_group: { key: 'ui.evsChoiceGroup' },
  choice_option: { key: 'ui.evsChoiceOption' },
  combo: { key: 'ui.evsCombo' },
  comment: { key: 'ui.evsComment' },
  config: { key: 'ui.evsConfig' },
  contingency: { key: 'ui.evsContingency' },
  conversation: { key: 'ui.evsConversation' },
  customer: { key: 'ui.evsCustomer' },
  diagnostic: { key: 'ui.evsDiagnostic' },
  draft: { key: 'ui.evsDraft' },
  gateway: { key: 'ui.evsGateway' },
  group: { key: 'ui.evsModifierGroup' },
  invoice: { key: 'ui.evsInvoice' },
  item: { key: 'ui.evsLine' },
  member: { key: 'ui.evsStaffMember' },
  message: { key: 'ui.evsMessage' },
  number: { key: 'ui.evsInvoiceNumber' },
  option: { key: 'ui.evsModifier' },
  order: { key: 'ui.evsOrder' },
  override: { key: 'ui.evsScheduleOverride' },
  package: { key: 'ui.evsPackage' },
  payment: { key: 'ui.evsPayment' },
  price_item: { key: 'ui.evsPrice' },
  price_list: { key: 'ui.evsPriceList' },
  product: { key: 'ui.evsProduct' },
  project: { key: 'ui.evsProject' },
  record: { key: 'ui.evsRecord' },
  recurring: { key: 'ui.evsRecurring' },
  reminder: { key: 'ui.evsReminder' },
  request: { key: 'ui.evsRequest' },
  reservation: { key: 'ui.evsReservation' },
  role: { key: 'ui.evsRole' },
  routing: { key: 'ui.evsRouting' },
  rule: { key: 'ui.evsRule' },
  sale: { key: 'ui.evsSale' },
  schedule: { key: 'ui.evsSchedule' },
  series: { key: 'ui.evsSeries' },
  service: { key: 'ui.evsService' },
  session: { key: 'ui.evsOpenTable' },
  settings: { key: 'ui.evsSettings', plural: true },
  sla: { key: 'ui.evsSla' },
  slot: { key: 'ui.evsSlot' },
  special_day: { key: 'ui.evsSpecialDay' },
  station: { key: 'ui.evsStation' },
  table: { key: 'ui.evsTable' },
  task: { key: 'ui.evsTask' },
  template: { key: 'ui.evsTemplate' },
  ticket: { key: 'ui.evsTicket' },
  time_off: { key: 'ui.evsTimeOff' },
  timeslot: { key: 'ui.evsTimeslot' },
  transaction: { key: 'ui.evsTransaction' },
  waitlist: { key: 'ui.evsWaitlist' },
  zone: { key: 'ui.evsZone' },
  // Same word, different business object.
  'cart_checkout.item': { key: 'ui.evsCartLine' },
  'cart_checkout.order': { key: 'ui.evsOnlineOrder' },
  'taxes.category': { key: 'ui.evsTaxCategory' },
};

/** The verbs. Spanish carries the number, English carries `is`/`are`. */
export const EVENT_ACTIONS: Readonly<Record<string, EventAction>> = {
  abandoned: { key: 'ui.evaAbandoned' },
  added: { key: 'ui.evaAdded' },
  allocated: { key: 'ui.evaAllocated' },
  anonymized: { key: 'ui.evaAnonymized' },
  approved: { key: 'ui.evaApproved' },
  assigned: { key: 'ui.evaAssigned' },
  breached: { key: 'ui.evaBreached' },
  bumped: { key: 'ui.evaBumped' },
  cancelled: { key: 'ui.evaCancelled' },
  categorized: { key: 'ui.evaCategorized' },
  changed: { key: 'ui.evaChanged' },
  cleared: { key: 'ui.evaCleared' },
  closed: { key: 'ui.evaClosed' },
  completed: { key: 'ui.evaCompleted' },
  confirmed: { key: 'ui.evaConfirmed' },
  created: { key: 'ui.evaCreated' },
  deactivated: { key: 'ui.evaDeactivated' },
  deleted: { key: 'ui.evaDeleted' },
  due: { key: 'ui.evaDue' },
  expired: { key: 'ui.evaExpired', pluralKey: 'ui.evaExpiredPl' },
  failed: { key: 'ui.evaFailed' },
  fired: { key: 'ui.evaFired' },
  fulfilled: { key: 'ui.evaFulfilled' },
  granted: { key: 'ui.evaGranted' },
  held: { key: 'ui.evaHeld' },
  hold_released: { key: 'ui.evaHoldReleased' },
  initiated: { key: 'ui.evaInitiated' },
  opened: { key: 'ui.evaOpened' },
  paid: { key: 'ui.evaPaid' },
  parked: { key: 'ui.evaParked' },
  processed: { key: 'ui.evaProcessed' },
  proposed: { key: 'ui.evaProposed' },
  queried: { key: 'ui.evaQueried' },
  received: { key: 'ui.evaReceived' },
  rectified: { key: 'ui.evaRectified' },
  recovered: { key: 'ui.evaRecovered' },
  redeemed: { key: 'ui.evaRedeemed' },
  refunded: { key: 'ui.evaRefunded' },
  rejected: { key: 'ui.evaRejected' },
  removed: { key: 'ui.evaRemoved' },
  reopened: { key: 'ui.evaReopened' },
  rescheduled: { key: 'ui.evaRescheduled' },
  resolved: { key: 'ui.evaResolved' },
  restored: { key: 'ui.evaRestored' },
  retried: { key: 'ui.evaRetried' },
  run: { key: 'ui.evaRun' },
  saved: { key: 'ui.evaSaved', pluralKey: 'ui.evaSavedPl' },
  sent: { key: 'ui.evaSent' },
  served: { key: 'ui.evaServed' },
  settled: { key: 'ui.evaSettled' },
  started: { key: 'ui.evaStarted' },
  status_changed: { key: 'ui.evaStatusChanged' },
  succeeded: { key: 'ui.evaSucceeded' },
  terminated: { key: 'ui.evaTerminated' },
  transferred: { key: 'ui.evaTransferred' },
  uncategorized: { key: 'ui.evaUncategorized' },
  updated: { key: 'ui.evaUpdated', pluralKey: 'ui.evaUpdatedPl' },
  validated: { key: 'ui.evaValidated' },
};

/** i18n key of the sentence template — English puts the subject first, Spanish the verb. */
const PHRASE_TEMPLATE = 'ui.evtPhrase';

/**
 * `snake_case.tokens` → «Snake case tokens». The last resort, and the reason no owner ever reads
 * an identifier: it is applied to whatever is left over, never skipped.
 */
export function humanizeToken(token: string): string {
  const words = token.replace(/[._]+/g, ' ').trim();
  return words ? words[0].toUpperCase() + words.slice(1) : '';
}

/**
 * The pieces of an event name.
 *
 * Three parts is the convention (`kitchen.order.ready`). Two is the shape the first modules
 * shipped, and there the family and the subject are the same word (`sale.voided`). More than
 * three keeps the whole tail as the action, so nothing is silently dropped.
 */
export function splitEventName(event: string): EventParts | null {
  const parts = event.split('.').filter(Boolean);
  if (parts.length < 2) return null;
  if (parts.length === 2) return { family: parts[0], subject: parts[0], action: parts[1] };
  return { family: parts[0], subject: parts[1], action: parts.slice(2).join('.') };
}

/** The subject entry for `<family>.<subject>`, falling back to the unqualified noun. */
function subjectOf(parts: EventParts): EventSubject | undefined {
  return EVENT_SUBJECTS[`${parts.family}.${parts.subject}`] ?? EVENT_SUBJECTS[parts.subject];
}

/**
 * The module an event belongs to, as the owner knows it — «Cocina», not `kitchen`. Used to group
 * the dropdown, which is what makes a list of 196 navigable at all.
 */
export function eventFamily(event: string, t: Translator): string {
  const parts = splitEventName(event);
  if (!parts) return '';
  const key = EVENT_FAMILIES[parts.family];
  return key ? t(key) : humanizeToken(parts.family);
}

/**
 * What completes «Cuando…» for this event: «se cobra una venta», «se borra una cita».
 *
 * Never returns the raw name and never returns empty for a real event — the three layers are
 * described at the top of the file. An empty or one-word name has nothing to say and says nothing.
 */
export function eventPhrase(event: string, t: Translator): string {
  const curated = catalogEntry(event);
  if (curated) return t(curated.labelKey);

  const parts = splitEventName(event);
  if (!parts) return event ? humanizeToken(event) : '';

  const subject = subjectOf(parts);
  const action = EVENT_ACTIONS[parts.action];
  if (subject && action) {
    const verbKey = subject.plural ? (action.pluralKey ?? action.key) : action.key;
    return t(PHRASE_TEMPLATE, { subject: t(subject.key), action: t(verbKey) });
  }

  // Layer 3: whatever is left, as words. Lower case, because it completes a sentence.
  const tail = `${parts.subject} ${parts.action}`;
  return humanizeToken(tail).toLowerCase();
}
