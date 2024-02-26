import { and, count, desc, eq } from 'drizzle-orm'
import { AnySQLiteSelect } from 'drizzle-orm/sqlite-core'
import { Elysia, t } from 'elysia'

import { db } from '../../db'
import { todos } from '../../db/schema'
import { isAuthenticated, loginPath } from '../auth'

import { Todos } from './cmp/Todos'
import { TodoItem } from './cmp/TodoItem'
import { Filter, filters } from './types'
import { TodoCounter } from './cmp/TodoCounter'

const filterTodos = <T extends AnySQLiteSelect>(userId: number, filter: Filter, query: T) => {
  return query.where(
    and(
      eq(todos.userId, userId),
      filter === 'all' ? undefined : eq(todos.done, filter !== 'active'),
    ),
  )
}
const getTodos = (userId: number, filter: Filter) =>
  filterTodos(userId, filter, db.select().from(todos)).orderBy(desc(todos.id))

const getTodoCount = async (userId: number, filter: Filter) => {
  const [{ todoCount }] = await filterTodos(
    userId,
    filter,
    db.select({ todoCount: count(todos.id) }).from(todos),
  )
  return todoCount
}

const getTodo = async (userId: number, todoId: number) => {
  const [todo] = await db
    .select()
    .from(todos)
    .where(and(eq(todos.id, todoId), eq(todos.userId, userId)))
  return todo
}

const parseId = (id: string) => {
  const numId = Number(id)
  if (isNaN(numId)) throw new Error('passed non numeric ID: ' + id)
  return numId
}

export const todosPrefix = '/todos'

const tIdParams = { params: t.Object({ id: t.String() }) }

export const todosRoutes = new Elysia({ name: 'todos', prefix: todosPrefix })
  .use(isAuthenticated({ redirect: loginPath }))
  .get('/', async ({ user }) => {
    if (!user) return
    return <Todos todos={await getTodos(user.id, 'all')} currentFilter="all" />
  })
  .get(
    '/:filter',
    async ({ user, params: { filter = 'all' } }) => {
      if (!user) return
      return <Todos todos={await getTodos(user.id, filter)} currentFilter={filter} />
    },
    { params: t.Object({ filter: t.Optional(t.Union(filters.map((x) => t.Literal(x)))) }) },
  )
  .get(
    '/edit/:id',
    async ({ user, params }) => {
      if (!user) return
      const id = parseId(params.id)
      return <TodoItem todo={await getTodo(user.id, id)} editable />
    },
    tIdParams,
  )
  .derive(({ headers }) => {
    const maybeFilter = headers['referer']?.split('/').pop()
    const activeFilter: Filter =
      maybeFilter && filters.includes(maybeFilter as Filter) ? (maybeFilter as Filter) : 'all'
    return { activeFilter }
  })
  .post(
    '/',
    async ({ body, user, activeFilter }) => {
      if (!user) return

      const [todo] = await db
        .insert(todos)
        .values({ text: body.text, done: false, userId: user.id })
        .returning()
      if (!todo) throw new Error('failed to retrieve todo')

      return (
        <>
          <TodoItem todo={todo} />
          <TodoCounter oob count={await getTodoCount(user.id, activeFilter)} />
        </>
      )
    },
    { body: t.Object({ text: t.String({ minLength: 1 }) }) },
  )
  .put(
    '/:id',
    async ({ params, body, user, activeFilter }) => {
      if (!user) return
      const id = parseId(params.id)

      const extra = body.text ? { text: body.text } : null
      const [todo] = await db
        .update(todos)
        .set({ ...extra, done: body.done === 'on' })
        .where(and(eq(todos.userId, user.id), eq(todos.id, id)))
        .returning()
      if (!todo) throw new Error('unable to update todo ' + id)

      return (
        <>
          <TodoItem todo={todo} />
          {activeFilter !== 'all' && (
            <TodoCounter oob count={await getTodoCount(user.id, activeFilter)} />
          )}
        </>
      )
    },
    {
      ...tIdParams,
      body: t.Object({
        done: t.Optional(t.Literal('on')),
        text: t.Optional(t.String({ minLength: 1 })),
      }),
    },
  )
  .delete('/:id', async ({ params, user, activeFilter }) => {
    if (!user) return

    const id = parseId(params.id)
    await db.delete(todos).where(and(eq(todos.id, id), eq(todos.userId, user.id)))

    return <TodoCounter oob count={await getTodoCount(user.id, activeFilter)} />
  })
