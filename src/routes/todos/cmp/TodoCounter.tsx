interface Props {
  count: number
  oob?: boolean
}

export function TodoCounter({ count, oob = false }: Props) {
  return (
    <span id="todo-counter" hx-swap-oob={oob ? 'true' : undefined}>
      {count}
    </span>
  )
}
