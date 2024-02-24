import type { Todo } from '../../../db/schema'

export function TodoItem({ todo }: { todo: Todo }) {
  const htmlId = `todo-${todo.id}`
  const idSel = `#${htmlId}`
  return (
    <div
      id={htmlId}
      class="border border-slate-400 p-3 flex justify-between gap-2 items-center rounded"
    >
      <div class="flex gap-2 items-center">
        <input
          autocomplete="off"
          type="checkbox"
          checked={todo.done}
          hx-post={`/todos/${todo.id}/toggle`}
          hx-target={idSel}
          hx-swap="outerHTML transition:true"
        />
        <span safe class={todo.done ? 'line-through' : ''}>
          {todo.text}
        </span>
      </div>
      <button
        class="hover:text-red-700 dark:hover:text-red-400"
        hx-delete={`/todos/${todo.id}`}
        hx-swap="outerHTML transition:true"
        hx-target={idSel}
      >
        x
      </button>
    </div>
  )
}
