import { InferInsertModel, InferSelectModel } from 'drizzle-orm'
import { integer, sqliteTable, text } from 'drizzle-orm/sqlite-core'

export const todos = sqliteTable('todos', {
  id: integer('id').primaryKey(),
  userId: integer('user_id')
    .references(() => users.id)
    .notNull(),
  text: text('text').notNull(),
  done: integer('done', { mode: 'boolean' }).notNull().default(false),
})

export type Todo = InferSelectModel<typeof todos>
export type TodoInput = Omit<InferInsertModel<typeof todos>, 'id'>

export const users = sqliteTable('user', {
  id: integer('id').primaryKey(),
  username: text('username').notNull(),
  password: text('password').notNull(),
})

export type User = InferSelectModel<typeof users>
export type UserInput = InferInsertModel<typeof users>
