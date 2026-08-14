/**
 * **The words for an event — nothing more** (flows#8).
 *
 * This file used to be the SOURCE of the «when this happens» dropdown, because the hub had no
 * endpoint that LISTED its events: `…/events/shape?name=…` (hub#715) tells you what one event
 * carries, but you must already know its name to ask. Since hub#823 the hub answers
 * `GET /api/hub/events`, so the dropdown is filled from the hub — see `event-catalog.ts` — and what
 * is left here is exactly what that endpoint deliberately does not carry: **a phrase a shop owner
 * recognises**, in place of `appointments.appointment.no_show`.
 *
 * The last paragraph of the old docstring predicted this and it turned out to be right: «when the
 * hub grows a real catalogue endpoint, this list becomes a set of labels and the picker stops
 * seeding from it — the shape of the code does not have to change».
 *
 * **This file can no longer make an event appear or disappear.** An event it has never heard of is
 * still offered, under its raw name; an event it lists that this hub does not emit is simply never
 * asked about. Adding an entry here is a translation, not a feature — which is why it is safe for
 * it to age.
 *
 * The names are copied from the `emit` declarations of the published modules, not invented.
 */

export interface TriggerCatalogEntry {
  /** The event name exactly as a module emits it. */
  event: string;
  /** i18n key of the phrase that completes «Cuando…» / «When…». */
  labelKey: string;
  /** The module that emits it — the reason a missing event can be explained instead of hidden. */
  module: string;
}

export const TRIGGER_CATALOG: readonly TriggerCatalogEntry[] = [
  { event: 'sale.completed', labelKey: 'ui.evSaleCompleted', module: 'sales' },
  { event: 'sale.voided', labelKey: 'ui.evSaleVoided', module: 'sales' },
  { event: 'order.completed', labelKey: 'ui.evOrderCompleted', module: 'sales' },
  { event: 'invoice.created', labelKey: 'ui.evInvoiceCreated', module: 'invoice' },
  { event: 'payments.payment.completed', labelKey: 'ui.evPaymentCompleted', module: 'payments' },
  { event: 'customer.created', labelKey: 'ui.evCustomerCreated', module: 'customers' },
  {
    event: 'appointments.appointment.created',
    labelKey: 'ui.evAppointmentCreated',
    module: 'appointments',
  },
  {
    event: 'appointments.appointment.cancelled',
    labelKey: 'ui.evAppointmentCancelled',
    module: 'appointments',
  },
  {
    event: 'appointments.appointment.rescheduled',
    labelKey: 'ui.evAppointmentRescheduled',
    module: 'appointments',
  },
  {
    event: 'appointments.appointment.completed',
    labelKey: 'ui.evAppointmentCompleted',
    module: 'appointments',
  },
  {
    event: 'appointments.appointment.no_show',
    labelKey: 'ui.evAppointmentNoShow',
    module: 'appointments',
  },
  {
    event: 'online_booking.booking.created',
    labelKey: 'ui.evBookingCreated',
    module: 'online_booking',
  },
  {
    event: 'online_booking.booking.cancelled',
    labelKey: 'ui.evBookingCancelled',
    module: 'online_booking',
  },
  {
    event: 'reservations.reservation.created',
    labelKey: 'ui.evReservationCreated',
    module: 'reservations',
  },
  { event: 'tables.session.opened', labelKey: 'ui.evTableOpened', module: 'tables' },
  { event: 'tables.session.closed', labelKey: 'ui.evTableClosed', module: 'tables' },
  { event: 'kitchen.order.ready', labelKey: 'ui.evKitchenOrderReady', module: 'kitchen' },
  { event: 'inventory.stock_changed', labelKey: 'ui.evStockChanged', module: 'inventory' },
  { event: 'cash_register.session_closed', labelKey: 'ui.evCashClosed', module: 'cash_register' },
  { event: 'cash_register.session_opened', labelKey: 'ui.evCashOpened', module: 'cash_register' },
  {
    event: 'whatsapp_inbox.message.received',
    labelKey: 'ui.evWhatsappReceived',
    module: 'whatsapp_inbox',
  },
  { event: 'tickets.ticket.created', labelKey: 'ui.evTicketCreated', module: 'tickets' },
  { event: 'tasks.task.completed', labelKey: 'ui.evTaskCompleted', module: 'tasks' },
  { event: 'staff.time_off.created', labelKey: 'ui.evStaffTimeOff', module: 'staff' },
];

/** The catalogue entry for an event name, or `undefined` for one this file has never heard of. */
export function catalogEntry(event: string): TriggerCatalogEntry | undefined {
  return TRIGGER_CATALOG.find((e) => e.event === event);
}
