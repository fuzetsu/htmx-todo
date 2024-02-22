import { Elysia, t } from 'elysia'
import { jwt } from '@elysiajs/jwt'
import cookie from '@elysiajs/cookie'
import { eq, and } from 'drizzle-orm'

import { Login } from '../views/Login'
import { db } from '../db'
import { User, users } from '../db/schema'

const tAuth = t.Object({
  username: t.String({ minLength: 4, maxLength: 50 }),
  password: t.String({ minLength: 8, maxLength: 200 }),
  confirmPassword: t.Optional(t.String({ minLength: 8, maxLength: 200 })),
})

const tIdObject = t.Object({ id: t.Number() })

const expirySeconds = 5 * 60

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
  new Elysia()
    .use(cookie())
    .use(jwtPlugin)
    .derive(async ({ set, cookie, jwt }) => {
      console.log('checking!', cookie.access_token)
      const accessToken = await jwt.verify(cookie.access_token)
      const end = (user: User | null) => {
        if (user == null && redirect) {
          set.redirect = redirect
          set.headers['HX-Redirect'] = redirect
        }
        return { user }
      }
      if (!accessToken) return end(null)
      const [user] = await db.select().from(users).where(eq(users.id, accessToken.id))
      return end(user)
    })

export const authRoutes = new Elysia({ prefix: authPrefix })
  .use(isAuthenticated())
  .get('/register', async ({ user, set }) => {
    if (user) {
      set.redirect = rootPath
      return
    }

    return Login({ register: true })
  })
  .post(
    '/register',
    async ({ body, set, jwt, setCookie }) => {
      console.log('register', body)

      const [existingUser] = await db.select().from(users).where(eq(users.username, body.username))

      if (existingUser) {
        // replace with html
        return 'username already in use'
      }

      if (body.password !== body.confirmPassword) return "passwords don't match"

      const hashedPassword = await Bun.password.hash(body.password)
      const [user] = await db
        .insert(users)
        .values({ username: body.username, password: hashedPassword })
        .returning()

      const accessToken = await jwt.sign({ id: user.id })
      setCookie('access_token', accessToken, {
        httpOnly: true,
        maxAge: expirySeconds,
      })
      set.headers['HX-Redirect'] = rootPath
    },
    { body: tAuth }
  )
  .get('/login', async ({ user, set }) => {
    if (user) {
      set.redirect = rootPath
      return
    }

    return Login({})
  })
  .post(
    '/login',
    async ({ body, set, setCookie, jwt }) => {
      console.log(body)

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
      set.headers['HX-Redirect'] = rootPath
    },
    { body: tAuth }
  )
  .get('/logoff', ({ set, setCookie }) => {
    setCookie('access_token', '', { maxAge: 0, httpOnly: true })
    set.redirect = `${authPrefix}/login`
  })
