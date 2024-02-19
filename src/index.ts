import { Elysia, t } from 'elysia'
import { html } from '@elysiajs/html'
import { tailwind } from '@gtramontina.com/elysia-tailwind'
import { CSS_PUBLIC_PATH, HTMX_PUBLIC_PATH } from './constants'
import { Todo, Todos } from './views/Todos'
import Database from 'bun:sqlite'
import { getMigrations, migrate } from 'bun-sqlite-migrations'
import { TodoData } from './types'

const db = new Database('data.db', { create: true })
migrate(db, getMigrations('./migrations'))

const selectTodo = db.query<TodoData, number>('SELECT * from todos where id = ?1;')
const toggleTodo = db.query<unknown, number>(
  `UPDATE todos SET done = CASE WHEN done = 1 THEN 0 ELSE 1 END WHERE id = ?1;`
)

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
  .get('/', () => Todos({ db, currentFilter: 'All' }))
  .get('/active', () => Todos({ db, currentFilter: 'Active' }))
  .get('/done', () => Todos({ db, currentFilter: 'Done' }))
  .post('/toggle-todo/:id', ({ params }) => {
    const id = Number(params.id)
    toggleTodo.get(id)
    const todo = selectTodo.get(id)
    if (!todo) throw new Error('could not find todo')
    return Todo({ todo })
  })
  .delete('/todo/:id', ({ params }) => {
    db.query<unknown, number>(`DELETE FROM todos WHERE id = ?1`).get(Number(params.id))
    return null
  })
  .put(
    '/todo',
    ({ body }) => {
      // insert todo
      db.query<unknown, string>(`INSERT INTO todos (text, done) VALUES (?1, 0);`).run(body.text)
      // and retrieve it for display
      const todo = db
        .query<TodoData, []>('SELECT * FROM todos where rowid = LAST_INSERT_ROWID();')
        .get()
      if (!todo) throw new Error('failed to retrieve todo')
      return Todo({ todo })
    },
    { body: t.Object({ text: t.String() }) }
  )
  .listen(3000)

console.log(`🦊 Elysia is running at ${app.server?.hostname}:${app.server?.port}`)
