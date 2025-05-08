import { pgTable, text, integer, timestamp } from 'drizzle-orm/pg-core';
import { users } from './schema/users';
import { initiatives } from './schema/initiatives';

export const images = pgTable('images', {
  id: text('id').primaryKey().defaultRandom(),
  url: text('url').notNull(),
  fileName: text('file_name').notNull(),
  fileType: text('file_type').notNull(),
  fileSize: integer('file_size').notNull(),
  uploadedBy: text('uploaded_by').notNull().references(() => users.id),
  initiativeId: text('initiative_id').references(() => initiatives.id),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
}); 