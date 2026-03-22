import {
  pgTable,
  uuid,
  text,
  integer,
  timestamp,
  pgEnum,
  index,
} from 'drizzle-orm/pg-core';
import { users } from './users';

export const listingCategoryEnum = pgEnum('listing_category', [
  'physical_music',
  'used_gear',
  'services',
  'merch',
]);

export const listings = pgTable(
  'listings',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    sellerId: uuid('seller_id')
      .references(() => users.id, { onDelete: 'cascade' })
      .notNull(),
    title: text('title').notNull(),
    description: text('description'),
    category: listingCategoryEnum('category').notNull(),
    price: integer('price').notNull(), // INTEGER CENTS
    currency: text('currency').default('USD'),
    imageUrls: text('image_urls').array(),
    stock: integer('stock').default(1),
    isTradeable: text('is_tradeable').default('false'),
    shippingDomestic: integer('shipping_domestic'), // cents
    shippingInternational: integer('shipping_international'), // cents
    status: text('status').default('active').notNull(), // active | sold | delisted
    createdAt: timestamp('created_at', { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (t) => [
    index('listings_seller_idx').on(t.sellerId),
    index('listings_category_idx').on(t.category),
    index('listings_status_idx').on(t.status),
  ]
);

export const orders = pgTable(
  'orders',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    buyerId: uuid('buyer_id')
      .references(() => users.id)
      .notNull(),
    sellerId: uuid('seller_id')
      .references(() => users.id)
      .notNull(),
    totalAmount: integer('total_amount').notNull(), // INTEGER CENTS
    commission: integer('commission').notNull(), // INTEGER CENTS
    paymentMethod: text('payment_method').notNull(), // helio | samiteon
    paymentId: text('payment_id'),
    trackingNumber: text('tracking_number'),
    status: text('status').default('pending').notNull(), // pending | paid | shipped | delivered | disputed | refunded
    createdAt: timestamp('created_at', { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (t) => [
    index('orders_buyer_idx').on(t.buyerId),
    index('orders_seller_idx').on(t.sellerId),
  ]
);

export const orderItems = pgTable('order_items', {
  id: uuid('id').defaultRandom().primaryKey(),
  orderId: uuid('order_id')
    .references(() => orders.id, { onDelete: 'cascade' })
    .notNull(),
  listingId: uuid('listing_id')
    .references(() => listings.id)
    .notNull(),
  quantity: integer('quantity').default(1).notNull(),
  unitPrice: integer('unit_price').notNull(), // INTEGER CENTS
});
