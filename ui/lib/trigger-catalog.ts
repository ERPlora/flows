/**
 * **What an owner can say «when this happens» about.**
 *
 * The hub has no endpoint that LISTS its events — `GET /api/hub/events/shape?name=…` (hub#715)
 * answers what one event carries, but you have to know its name to ask. So the picker needs
 * candidates from somewhere, and this is that somewhere: a short, hand-written list of the events
 * that matter to the businesses ERPlora sells to (a restaurant and a hair salon), each with words
 * a shop owner recognises.
 *
 * **The hub, not this file, is the authority.** Every entry is checked against the hub before it
 * is offered: the picker asks for its shape and greys out — *with the reason* — anything this hub
 * does not emit, because the module that owns it is not installed. Nothing here can make an event
 * appear that does not exist, and the free-text box next to the list reaches the ones this file
 * has never heard of.
 *
 * The names are copied from the `emit` declarations of the 24 published modules, not invented.
 * When the hub grows a real catalogue endpoint, this list becomes a set of labels and the picker
 * stops seeding from it — the shape of the code does not have to change.
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
