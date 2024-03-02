import { Elysia, t } from 'elysia'
import { jwt } from '@elysiajs/jwt'
import { eq, and, count } from 'drizzle-orm'

import { Login } from './cmp/Login'
import { db } from '../../db'
import { User, users } from '../../db/schema'
import { htmxRedirect } from '../../plugins/htmx-redirect'

const tAuth = t.Object({
  username: t.String({ minLength: 4, maxLength: 50 }),
  password: t.String({ minLength: 8, maxLength: 200 }),
  confirmPassword: t.Optional(t.String({ minLength: 8, maxLength: 200 })),
})

const tIdObject = t.Object({ id: t.Number() })

const expirySeconds = 60 * 60
const cookieSettings = {
  httpOnly: true,
  path: '/',
  maxAge: expirySeconds,
}

const jwtPlugin = jwt({
  name: 'jwt',
  schema: tIdObject,
  secret: 'my secret secret :)',
  exp: expirySeconds + 's',
})

const rootPath = '/'

export const authPrefix = '/auth'
export const loginPath = '/auth/login'

export const isAuthenticated = ({ redirect }: { redirect?: string } = {}) =>
  new Elysia({ name: 'auth-checker', seed: redirect })
    .use(jwtPlugin)
    .use(htmxRedirect)
    .guard({ cookie: t.Cookie({ webToken: t.Optional(t.String()) }) })
    .derive(async ({ cookie: { webToken }, jwt, setRedirect }) => {
      const accessToken = await jwt.verify(webToken.value)
      const end = (user: User | null) => {
        if (user == null && redirect) {
          setRedirect(redirect)
        }
        return { user }
      }
      if (!accessToken) return end(null)
      const [user] = await db.select().from(users).where(eq(users.id, accessToken.id))
      return end(user)
    })

export const authRoutes = new Elysia({ name: 'auth', prefix: authPrefix })
  .use(isAuthenticated())
  .get('/register', async ({ user, setRedirect }) => {
    if (user) {
      setRedirect(rootPath)
      return
    }

    return Login({ register: true })
  })
  .post(
    '/register',
    async ({ cookie: { webToken }, body, jwt, setRedirect }) => {
      const [{ userCount }] = await db
        .select({ userCount: count(users.id) })
        .from(users)
        .where(eq(users.username, body.username))
      if (userCount > 0) {
        return 'Sorry, that username is already taken. Try another one.'
      }

      if (body.password !== body.confirmPassword) return "The passwords don't match."

      const hashedPassword = await Bun.password.hash(body.password)
      const [user] = await db
        .insert(users)
        .values({ username: body.username, password: hashedPassword })
        .returning({ id: users.id })

      const accessToken = await jwt.sign({ id: user.id })
      webToken.set({
        ...cookieSettings,
        value: accessToken,
      })
      setRedirect(rootPath)
    },
    { body: tAuth },
  )
  .get('/login', async ({ user, setRedirect }) => {
    if (user) {
      setRedirect(rootPath)
      return
    }

    return Login({})
  })
  .post(
    '/login',
    async ({ cookie: { webToken }, body, jwt, setRedirect }) => {
      const [user] = await db
        .select()
        .from(users)
        .where(and(eq(users.username, body.username)))

      const isVerified = await Bun.password.verify(body.password, user?.password ?? '')
      if (!isVerified) return "Sorry. That username/password combination didn't work."

      const accessToken = await jwt.sign({ id: user.id })
      webToken.set({
        ...cookieSettings,
        value: accessToken,
      })
      setRedirect(rootPath)
    },
    { body: tAuth },
  )
  .get('/logoff', ({ cookie, setRedirect }) => {
    cookie.access_token.remove({ path: '/' })
    setRedirect(loginPath)
  })
