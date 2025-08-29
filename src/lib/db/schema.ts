import { pgTable, text, integer, timestamp } from 'drizzle-orm/pg-core';

// TODO: The following imports are broken because the files do not exist:
// import { users } from './schema/users';
// import { initiatives } from './schema/initiatives';
// Remove or comment out these imports until the files are created.

export const images = pgTable('images', {
  id: text('id').primaryKey(),
  url: text('url').notNull(),
  fileName: text('file_name').notNull(),
  fileType: text('file_type').notNull(),
  fileSize: integer('file_size').notNull(),
  // uploadedBy and initiativeId references commented out until dependencies exist
  // uploadedBy: text('uploaded_by').notNull().references(() => users.id),
  // initiativeId: text('initiative_id').references(() => initiatives.id),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});
// Ensure the `schema/users` and `schema/initiatives` modules exist and are correctly imported.
