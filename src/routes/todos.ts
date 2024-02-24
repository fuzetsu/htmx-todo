import { Elysia, t } from 'elysia'
import { and, count, desc, eq, sql } from 'drizzle-orm'
import { AnySQLiteSelect } from 'drizzle-orm/sqlite-core'

import { db } from '../db'
import { todos } from '../db/schema'
import { Filter, filters } from '../types'
import { Todo, Todos } from '../views/Todos'
import { isAuthenticated, loginPath } from './auth'

const filterTodos = <T extends AnySQLiteSelect>(userId: number, filter: Filter, query: T) => {
  return query.where(
    and(
      eq(todos.userId, userId),
      filter === 'all' ? undefined : eq(todos.done, filter !== 'active')
    )
  )
}
const getTodos = (userId: number, filter: Filter) =>
  filterTodos(userId, filter, db.select().from(todos)).orderBy(desc(todos.id))

const tFilter = t.Union(filters.map((x) => t.Literal(x)))
const tFilterParams = t.Object({ filter: tFilter })
const tPutTodo = t.Object({ text: t.String({ minLength: 1 }) })

export const todosPrefix = '/todos'

export const todosRoutes = new Elysia({ name: 'todos', prefix: todosPrefix })
  .use(isAuthenticated({ redirect: loginPath }))
  .get('/', async ({ user }) => {
    if (!user) return
    return Todos({ todos: await getTodos(user.id, 'all'), currentFilter: 'all' })
  })
  .get(
    '/:filter',
    async ({ user, params: { filter = 'all' } }) => {
      if (!user) return
      return Todos({ todos: await getTodos(user.id, filter), currentFilter: filter })
    },
    { params: t.Object({ filter: t.Optional(tFilter) }) }
  )
  .get(
    '/:filter/count',
    async ({ user, params }) => {
      if (!user) return
      const [{ todoCount }] = await filterTodos(
        user.id,
        params.filter,
        db.select({ todoCount: count(todos.id) }).from(todos)
      )
      return todoCount
    },
    { params: tFilterParams }
  )
  .put(
    '/',
    async ({ body, user }) => {
      if (!user) return
      const [todo] = await db
        .insert(todos)
        .values({ text: body.text, done: false, userId: user!.id })
        .returning()
      if (!todo) throw new Error('failed to retrieve todo')
      return Todo({ todo })
    },
    { body: tPutTodo }
  )
  .post('/:id/toggle', async ({ params, user }) => {
    if (!user) return
    const id = Number(params.id)
    if (isNaN(id)) throw new Error('invalid id: ' + params.id)
    const [todo] = await db
      .select()
      .from(todos)
      .where(and(eq(todos.id, id), eq(todos.userId, user.id)))
    if (!todo) throw new Error('could not find todo ' + params.id)
    todo.done = !todo.done
    await db.update(todos).set({ done: todo.done }).where(eq(todos.id, id))
    return Todo({ todo })
  })
  .delete('/:id', async ({ params, user }) => {
    if (!user) return
    const numId = Number(params.id)
    if (isNaN(numId)) throw new Error('invalid id: ' + params.id)
    await db.delete(todos).where(and(eq(todos.id, numId), eq(todos.userId, user.id)))
    return null
  })
