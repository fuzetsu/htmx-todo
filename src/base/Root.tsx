import { CSS_PUBLIC_PATH, HTMX_PUBLIC_PATH } from '../constants'

export function Root({ children }: { children: JSX.Element }) {
  return (
    <html lang="en">
      <head>
        <meta charset="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <title>Todo list</title>
        <link rel="stylesheet" href={CSS_PUBLIC_PATH} />
        <script src={HTMX_PUBLIC_PATH} />
      </head>
      <body>{children}</body>
    </html>
  )
}
