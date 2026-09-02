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

  // Everything below is here because the phrase a composition would assemble is not the phrase a
  // shop owner says (`event-phrasing.ts`, layer 1). «se completa una venta» is grammatical and
  // nobody talks like that; «se cobra una venta» is what happens. The flagship of flows#41 —
  // `inventory.low_stock_crossed` — is the first of them.
  { event: 'inventory.low_stock_crossed', labelKey: 'ui.evLowStockCrossed', module: 'inventory' },
  {
    event: 'inventory.product.uncategorized',
    labelKey: 'ui.evProductUncategorized',
    module: 'inventory',
  },
  { event: 'cash_register.movement_added', labelKey: 'ui.evCashMovement', module: 'cash_register' },
  {
    event: 'cash_register.settings_updated',
    labelKey: 'ui.evCashSettings',
    module: 'cash_register',
  },
  { event: 'kitchen.order.created', labelKey: 'ui.evKitchenOrderCreated', module: 'kitchen' },
  { event: 'kitchen.order.fired', labelKey: 'ui.evOrderFired', module: 'kitchen' },
  { event: 'order.fired', labelKey: 'ui.evOrderFired', module: 'sales' },
  { event: 'staff.member.deactivated', labelKey: 'ui.evStaffDeactivated', module: 'staff' },
  { event: 'kitchen.order.recalled', labelKey: 'ui.evKitchenOrderRecalled', module: 'kitchen' },
  { event: 'kitchen.item.recalled', labelKey: 'ui.evKitchenItemRecalled', module: 'kitchen' },
  { event: 'printing.print.due', labelKey: 'ui.evPrintDue', module: 'printing' },
  // The two the hub's own runtime puts through the outbox: no module brings them, so `module` is
  // the namespace they travel under. The «it comes with the X module» hint they would feed is only
  // ever rendered for an event this hub does NOT have, which cannot happen for a core one.
  { event: 'flow.reminder.due', labelKey: 'ui.evReminderDue', module: 'flow' },
  { event: 'flow.release_revoked', labelKey: 'ui.evFlowReleaseRevoked', module: 'flow' },
  { event: 'host.notify', labelKey: 'ui.evHostNotify', module: 'host' },
  { event: 'host.print', labelKey: 'ui.evHostPrint', module: 'host' },
  {
    event: 'reservations.reservations.unconfirmed_released',
    labelKey: 'ui.evUnconfirmedReleased',
    module: 'reservations',
  },
  { event: 'taxes.rules.bulk_create.report', labelKey: 'ui.evTaxRulesBulk', module: 'taxes' },
  {
    event: 'sales.sale.created_from_appointment',
    labelKey: 'ui.evSaleFromAppointment',
    module: 'sales',
  },
  { event: 'staff.member.created', labelKey: 'ui.evStaffMemberCreated', module: 'staff' },
  {
    event: 'verifactu.record.transmitted',
    labelKey: 'ui.evRecordTransmitted',
    module: 'verifactu',
  },
  { event: 'verifactu.record.rejected', labelKey: 'ui.evRecordRejected', module: 'verifactu' },
  {
    event: 'verifactu.record.accepted_with_errors',
    labelKey: 'ui.evRecordAcceptedWithErrors',
    module: 'verifactu',
  },
  {
    event: 'invoice_series.series.default_changed',
    labelKey: 'ui.evSeriesDefaultChanged',
    module: 'invoice_series',
  },
  { event: 'modifiers.link.attached', labelKey: 'ui.evModifierAttached', module: 'modifiers' },
  { event: 'modifiers.link.detached', labelKey: 'ui.evModifierDetached', module: 'modifiers' },
  { event: 'tables.session.merged', labelKey: 'ui.evTablesMerged', module: 'tables' },
  { event: 'tables.session.split', labelKey: 'ui.evTablesSplit', module: 'tables' },
  { event: 'tables.session.transferred', labelKey: 'ui.evTableTransferred', module: 'tables' },
  {
    event: 'online_booking.booking.no_show',
    labelKey: 'ui.evOnlineNoShow',
    module: 'online_booking',
  },
  { event: 'customer.consent_granted', labelKey: 'ui.evConsentGranted', module: 'customers' },
  { event: 'customer.consent_withdrawn', labelKey: 'ui.evConsentWithdrawn', module: 'customers' },
];

/** The catalogue entry for an event name, or `undefined` for one this file has never heard of. */
export function catalogEntry(event: string): TriggerCatalogEntry | undefined {
  return TRIGGER_CATALOG.find((e) => e.event === event);
}
