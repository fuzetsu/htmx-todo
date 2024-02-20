import { Elysia, t } from 'elysia'
import { html } from '@elysiajs/html'
import { tailwind } from '@gtramontina.com/elysia-tailwind'
import { drizzle } from 'drizzle-orm/bun-sqlite'
import { migrate } from 'drizzle-orm/bun-sqlite/migrator'
import { desc, eq, sql } from 'drizzle-orm'
import Database from 'bun:sqlite'

import { CSS_PUBLIC_PATH, HTMX_PUBLIC_PATH } from './constants'
import { Todo, Todos } from './views/Todos'
import { todos } from './db/schema'
import { Filter, filters } from './types'
import { AnySQLiteSelect } from 'drizzle-orm/sqlite-core'

const sqlite = new Database('data.db', { create: true })
sqlite.exec('PRAGMA journal_mode = WAL;')
const db = drizzle(sqlite, { logger: true })
migrate(db, { migrationsFolder: './migrations' })

const filterTodos = <T extends AnySQLiteSelect>(filter: Filter, query: T) => {
  if (filter !== 'all') query.where(eq(todos.done, filter !== 'active'))
  return query
}
const getTodos = (filter: Filter) =>
  filterTodos(filter, db.select().from(todos)).orderBy(desc(todos.id))

const app = new Elysia()
  .use(html())
  .use(
    tailwind({
      path: CSS_PUBLIC_PATH,
      source: './src/styles.css',
      config: './tailwind.config.js',
    })
  )
  .get(HTMX_PUBLIC_PATH, () => Bun.file('./node_modules/htmx.org/dist/htmx.min.js'))
  .get('/', async () => Todos({ todos: await getTodos('all'), currentFilter: 'all' }))
  .get('/active', async () => Todos({ todos: await getTodos('active'), currentFilter: 'active' }))
  .get('/done', async () => Todos({ todos: await getTodos('done'), currentFilter: 'done' }))
  .get(
    '/todo-count/:filter',
    async ({ params }) => {
      const [{ count }] = await filterTodos(
        params.filter,
        db.select({ count: sql<number>`count(*)` }).from(todos)
      )
      console.log('todo-count', params.filter, count)
      return count
    },
    { params: t.Object({ filter: t.Union(filters.map((x) => t.Literal(x))) }) }
  )
  .post('/todo/:id/toggle', async ({ params }) => {
    const id = Number(params.id)
    if (isNaN(id)) throw new Error('invalid id: ' + params.id)
    const [todo] = await db.select().from(todos).where(eq(todos.id, id)).limit(1)
    console.log('toggle todo', { id, todo })
    if (!todo) throw new Error('could not find todo ' + params.id)
    todo.done = !todo.done
    await db.update(todos).set({ done: todo.done }).where(eq(todos.id, id))
    return Todo({ todo })
  })
  .delete('/todo/:id', async ({ params }) => {
    const numId = Number(params.id)
    if (isNaN(numId)) throw new Error('invalid id: ' + params.id)
    await db.delete(todos).where(eq(todos.id, numId))
    return null
  })
  .put(
    '/todo',
    async ({ body }) => {
      const [todo] = await db.insert(todos).values({ text: body.text, done: false }).returning()
      console.log('put todo', { todo })
      if (!todo) throw new Error('failed to retrieve todo')
      return Todo({ todo })
    },
    { body: t.Object({ text: t.String({ minLength: 1 }) }) }
  )
  .listen(3000)

console.log(`🦊 Elysia is running at ${app.server?.hostname}:${app.server?.port}`)
