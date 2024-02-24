import { Elysia, t } from 'elysia'
import { jwt } from '@elysiajs/jwt'
import cookie from '@elysiajs/cookie'
import { eq, and, count } from 'drizzle-orm'

import { Login } from '../views/Login'
import { db } from '../db'
import { User, users } from '../db/schema'

const tAuth = t.Object({
  username: t.String({ minLength: 4, maxLength: 50 }),
  password: t.String({ minLength: 8, maxLength: 200 }),
  confirmPassword: t.Optional(t.String({ minLength: 8, maxLength: 200 })),
})

const tIdObject = t.Object({ id: t.Number() })

const expirySeconds = 60 * 60

const jwtPlugin = jwt({
  name: 'jwt',
  schema: tIdObject,
  secret: 'my secret secret :)',
  exp: expirySeconds + 's',
})

const rootPath = '/'

export const authPrefix = '/auth'
export const loginPath = '/auth/login'

export const htmxRedirect = new Elysia({ name: 'htmx-redirect' }).derive(({ set, headers }) => {
  const setRedirect = (path: string) => {
    // use htmx redirect method if request came from htmx
    if (headers['HX-Request'] === 'true') set.headers['HX-Redirect'] = path
    // otherwise use standard HTTP redirect
    else set.redirect = path
  }
  return { setRedirect }
})

export const isAuthenticated = ({ redirect }: { redirect?: string } = {}) =>
  new Elysia({ name: 'auth-checker', seed: redirect })
    .use(cookie())
    .use(jwtPlugin)
    .use(htmxRedirect)
    .derive(async ({ cookie, jwt, setRedirect }) => {
      const accessToken = await jwt.verify(cookie.access_token)
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
    async ({ body, jwt, setCookie, setRedirect }) => {
      const [{ userCount }] = await db
        .select({ userCount: count(users.id) })
        .from(users)
        .where(eq(users.username, body.username))
      if (userCount > 0) {
        // replace with html
        return 'username already in use'
      }

      if (body.password !== body.confirmPassword) return "passwords don't match"

      const hashedPassword = await Bun.password.hash(body.password)
      const [user] = await db
        .insert(users)
        .values({ username: body.username, password: hashedPassword })
        .returning({ id: users.id })

      const accessToken = await jwt.sign({ id: user.id })
      setCookie('access_token', accessToken, {
        httpOnly: true,
        maxAge: expirySeconds,
      })
      setRedirect(rootPath)
    },
    { body: tAuth }
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
    async ({ body, setCookie, jwt, setRedirect }) => {
      const [user] = await db
        .select()
        .from(users)
        .where(and(eq(users.username, body.username)))

      const isVerified = await Bun.password.verify(body.password, user?.password ?? '')
      if (!isVerified) {
        // replace with html
        return 'wrong username and/or password'
      }

      const accessToken = await jwt.sign({ id: user.id })
      setCookie('access_token', accessToken, {
        httpOnly: true,
        maxAge: expirySeconds,
      })
      setRedirect(rootPath)
    },
    { body: tAuth }
  )
  .get('/logoff', ({ setCookie, setRedirect }) => {
    setCookie('access_token', '', { maxAge: 0, httpOnly: true })
    setRedirect(loginPath)
  })
