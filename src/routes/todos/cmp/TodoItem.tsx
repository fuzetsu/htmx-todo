import { Button } from '../../../base/Button'
import { Input } from '../../../base/Input'
import type { Todo } from '../../../db/schema'

interface Props {
  todo: Todo
  editable?: boolean
}

export function TodoItem({ todo, editable = false }: Props) {
  const htmlId = `todo-${todo.id}`
  const idSel = `#${htmlId}`

  const hxSwap = { 'hx-target': idSel, 'hx-swap': 'outerHTML transition:true' }

  const textMarkup = editable ? (
    <Input autofocus="true" required minlength={1} name="text" class="w-full" value={todo.text} />
  ) : (
    <span safe class={todo.done ? 'line-through' : ''}>
      {todo.text}
    </span>
  )

  const editAction = editable ? (
    <Button type="submit">Save</Button>
  ) : (
    <Button {...hxSwap} type="button" hx-get={`/todos/edit/${todo.id}`}>
      Edit
    </Button>
  )

  return (
    <li id={htmlId} class="border border-slate-400 p-2 rounded">
      <form
        {...hxSwap}
        hx-put={`/todos/${todo.id}`}
        hx-trigger="submit, change from:find input[type=checkbox]"
        class="flex justify-between gap-2 items-center"
      >
        <div class="flex gap-2 items-center w-full">
          <input name="done" autocomplete="off" type="checkbox" checked={todo.done} />
          {textMarkup}
        </div>
        <div class="flex gap-2 items-center">
          {editAction}
          <Button
            {...hxSwap}
            hx-delete={`/todos/${todo.id}`}
            class="hover:text-red-700 dark:hover:text-red-400"
          >
            x
          </Button>
        </div>
      </form>
    </li>
  )
}
