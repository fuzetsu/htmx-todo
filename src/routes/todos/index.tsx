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

export const todosPrefix = '/todos'

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
  .derive(({ headers }) => {
    const maybeFilter = headers['referer']?.split('/').pop()
    const activeFilter: Filter =
      maybeFilter && filters.includes(maybeFilter as Filter) ? (maybeFilter as Filter) : 'all'
    return { activeFilter }
  })
  .put(
    '/',
    async ({ body, user, activeFilter }) => {
      if (!user) return

      const [todo] = await db
        .insert(todos)
        .values({ text: body.text, done: false, userId: user!.id })
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
  .post('/:id/toggle', async ({ params, user, activeFilter }) => {
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

    return (
      <>
        <TodoItem todo={todo} />
        {activeFilter !== 'all' && (
          <TodoCounter oob count={await getTodoCount(user.id, activeFilter)} />
        )}
      </>
    )
  })
  .delete('/:id', async ({ params, user, activeFilter }) => {
    if (!user) return

    const numId = Number(params.id)
    if (isNaN(numId)) throw new Error('invalid todo id: ' + params.id)

    await db.delete(todos).where(and(eq(todos.id, numId), eq(todos.userId, user.id)))

    return <TodoCounter oob count={await getTodoCount(user.id, activeFilter)} />
  })
