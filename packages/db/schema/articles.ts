import {
  pgTable,
  uuid,
  text,
  timestamp,
  pgEnum,
  index,
} from 'drizzle-orm/pg-core';
import { users } from './users';

export const articleStatusEnum = pgEnum('article_status', [
  'draft',
  'private',
  'listed',
  'public',
]);

export const articles = pgTable(
  'articles',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    authorId: uuid('author_id')
      .references(() => users.id, { onDelete: 'cascade' })
      .notNull(),
    title: text('title').notNull(),
    slug: text('slug').notNull().unique(),
    // Sanitized HTML from the rich text editor (matches the editor's output
    // and the same model used for podcasts + event descriptions). Was jsonb
    // (Tiptap JSON); text is simpler.
    body: text('body'),
    excerpt: text('excerpt'),
    coverUrl: text('cover_url'),
    status: articleStatusEnum('status').default('draft').notNull(),
    contentLocale: text('content_locale').default('en'),
    metaTitle: text('meta_title'),
    metaDescription: text('meta_description'),
    ogImage: text('og_image'),
    publishedAt: timestamp('published_at', { withTimezone: true }),
    createdAt: timestamp('created_at', { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (t) => [
    index('articles_author_idx').on(t.authorId),
    index('articles_slug_idx').on(t.slug),
    index('articles_status_idx').on(t.status),
    index('articles_published_idx').on(t.publishedAt),
  ]
);

export const categories = pgTable('categories', {
  id: uuid('id').defaultRandom().primaryKey(),
  name: text('name').notNull(),
  slug: text('slug').notNull().unique(),
  parentId: uuid('parent_id'), // Hierarchical
  createdAt: timestamp('created_at', { withTimezone: true })
    .defaultNow()
    .notNull(),
});

export const articleCategories = pgTable('article_categories', {
  id: uuid('id').defaultRandom().primaryKey(),
  articleId: uuid('article_id')
    .references(() => articles.id, { onDelete: 'cascade' })
    .notNull(),
  categoryId: uuid('category_id')
    .references(() => categories.id, { onDelete: 'cascade' })
    .notNull(),
});
