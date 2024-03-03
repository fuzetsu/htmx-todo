import { Elysia } from 'elysia'

export const htmxRedirect = new Elysia({ name: 'htmx-redirect' }).derive(({ set, headers }) => {
  const setRedirect = (path: string) => {
    // use htmx redirect method if request came from htmx
    if (headers['hx-request'] === 'true') set.headers['HX-Redirect'] = path
    // otherwise use standard HTTP redirect
    else set.redirect = path
  }

  const pushUrl = (url: string) => {
    set.headers['HX-Push-Url'] = url
  }
  return { setRedirect, pushUrl }
})
