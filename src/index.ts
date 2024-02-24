import { Elysia, t } from 'elysia'
import { html } from '@elysiajs/html'
import { tailwind } from '@gtramontina.com/elysia-tailwind'

import { CSS_PUBLIC_PATH, HTMX_PUBLIC_PATH } from './constants'
import { authRoutes } from './routes/auth'
import { todosPrefix, todosRoutes } from './routes/todos'

const app = new Elysia()
  .use(html())
  .use(
    tailwind({
      path: CSS_PUBLIC_PATH,
      source: './src/styles.css',
      config: './tailwind.config.js',
    }),
  )
  .get(HTMX_PUBLIC_PATH, () => Bun.file('./node_modules/htmx.org/dist/htmx.min.js'))
  .use(authRoutes)
  .use(todosRoutes)
  .get('/', ({ setRedirect }) => setRedirect(todosPrefix))
  .listen(3000)

console.log(`🦊 Elysia is running at ${app.server?.hostname}:${app.server?.port}`)
