/**
 * Concessions: venue-side F&B / merch sales during a booked event. Tied to
 * a booking_contract so settlement reads the concession_split_bp from the
 * agreement and credits the creator their share of total revenue.
 *
 * v1 is TRUST-BASED + record-only — the venue's POS records what was sold
 * and the platform shows what the venue owes the creator. No on-platform
 * payment processing. Move to escrow/on-chain in a later phase.
 */
import {
  pgTable,
  uuid,
  text,
  integer,
  timestamp,
  pgEnum,
  boolean,
  index,
} from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';
import { users } from './users';
import { venues } from './events';
import { bookingContracts } from './bookings';

export const concessionOrderStatusEnum = pgEnum('concession_order_status', [
  'completed', // sale rung up at the POS — counts toward settlement
  'voided',    // refunded / cancelled by the seller — excluded from settlement
]);

/**
 * Per-venue menu catalog. Items are independent of any specific contract;
 * they belong to the venue and are referenced by orders. Soft-delete via
 * `active` so historical order rows keep their menu-item link.
 */
export const menuItems = pgTable(
  'menu_items',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    venueId: uuid('venue_id')
      .references(() => venues.id, { onDelete: 'cascade' })
      .notNull(),
    name: text('name').notNull(),
    description: text('description'),
    category: text('category'), // free text: 'drinks' | 'food' | 'merch' | etc.
    priceCents: integer('price_cents').notNull(),
    active: boolean('active').default(true).notNull(),
    sortOrder: integer('sort_order').default(0).notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => [
    index('menu_items_venue_idx').on(t.venueId, t.active),
  ]
);

/**
 * Concession order — one customer transaction at the POS. Each order is
 * tied to a booking_contract so settlement knows which creator's split
 * applies. Order_items snapshot menu_item name + price at sale time.
 */
export const concessionOrders = pgTable(
  'concession_orders',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    contractId: uuid('contract_id')
      .references(() => bookingContracts.id, { onDelete: 'cascade' })
      .notNull(),
    venueId: uuid('venue_id')
      .references(() => venues.id, { onDelete: 'cascade' })
      .notNull(),
    soldByUserId: uuid('sold_by_user_id').references(() => users.id, { onDelete: 'set null' }),
    buyerName: text('buyer_name'), // optional tab name / receipt label
    totalCents: integer('total_cents').notNull(),
    paymentMethod: text('payment_method'), // free text: 'cash' | 'card' | 'usdc' | 'tab'
    status: concessionOrderStatusEnum('status').default('completed').notNull(),
    notes: text('notes'),
    voidedAt: timestamp('voided_at', { withTimezone: true }),
    voidedBy: uuid('voided_by').references(() => users.id, { onDelete: 'set null' }),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => [
    index('concession_orders_contract_idx').on(t.contractId, t.status),
    index('concession_orders_venue_idx').on(t.venueId, t.createdAt),
  ]
);

export const concessionOrderItems = pgTable(
  'concession_order_items',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    orderId: uuid('order_id')
      .references(() => concessionOrders.id, { onDelete: 'cascade' })
      .notNull(),
    menuItemId: uuid('menu_item_id').references(() => menuItems.id, { onDelete: 'set null' }),
    // Snapshotted at sale time so the order line stays valid even if the
    // menu item is later renamed/edited/deleted.
    itemNameSnapshot: text('item_name_snapshot').notNull(),
    unitPriceCents: integer('unit_price_cents').notNull(),
    quantity: integer('quantity').notNull(),
    lineTotalCents: integer('line_total_cents').notNull(),
  },
  (t) => [
    index('concession_order_items_order_idx').on(t.orderId),
  ]
);

export const menuItemsRelations = relations(menuItems, ({ one }) => ({
  venue: one(venues, {
    fields: [menuItems.venueId],
    references: [venues.id],
  }),
}));

export const concessionOrdersRelations = relations(concessionOrders, ({ one, many }) => ({
  contract: one(bookingContracts, {
    fields: [concessionOrders.contractId],
    references: [bookingContracts.id],
  }),
  venue: one(venues, {
    fields: [concessionOrders.venueId],
    references: [venues.id],
  }),
  items: many(concessionOrderItems),
}));

export const concessionOrderItemsRelations = relations(concessionOrderItems, ({ one }) => ({
  order: one(concessionOrders, {
    fields: [concessionOrderItems.orderId],
    references: [concessionOrders.id],
  }),
  menuItem: one(menuItems, {
    fields: [concessionOrderItems.menuItemId],
    references: [menuItems.id],
  }),
}));
