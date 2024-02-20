import { Root } from './cmp/Root'
import { Input } from './cmp/Input'
import { Todo } from '../db/schema'
import { Filter, filters } from '../types'

interface Props {
  todos: Todo[]
  currentFilter: Filter
}

export function Todo({ todo }: { todo: Todo }) {
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
          hx-post={`/todo/${todo.id}/toggle`}
          hx-target={idSel}
          hx-swap="outerHTML transition:true"
        />
        <span safe class={todo.done ? 'line-through' : ''}>
          {todo.text}
        </span>
      </div>
      <button
        class="hover:text-red-700 dark:hover:text-red-400"
        hx-delete={`/todo/${todo.id}`}
        hx-swap="outerHTML transition:true"
        hx-target={idSel}
      >
        x
      </button>
    </div>
  )
}

export function Todos({ todos, currentFilter }: Props) {
  return (
    <Root>
      <div class="m-2 max-w-[500px] mx-auto flex flex-col gap-2">
        <h1 class="text-3xl">Todo app</h1>

        <form
          hx-put="/todo"
          hx-swap="afterbegin transition:true"
          hx-target="#todo-list"
          hx-on--after-request="event.detail.successful && this.reset()"
        >
          <Input id="newTodo" name="text" class="w-full" placeholder="e.g. Wash dishes" />
        </form>

        <div class="flex flex-row gap-2 justify-center" hx-boost="true">
          {filters.map((filter) =>
            filter === currentFilter ? (
              filter
            ) : (
              <a
                href={filter === 'all' ? '/' : `/${filter}`}
                hx-swap="innerHTML transition:true"
                class={'text-blue-800 dark:text-blue-500 hover:underline'}
              >
                {filter}
              </a>
            )
          )}
        </div>

        <div id="todo-list" class="flex flex-col gap-2">
          {todos.map((todo) => (
            <Todo todo={todo} />
          ))}
        </div>

        <p class="text-center text-slate-600 dark:text-slate-300">
          <span
            hx-trigger="htmx:beforeSwap from:#todo-list delay:20ms"
            hx-get={`/todo-count/${currentFilter}`}
            hx-swap="innerHTML transition:true"
          >
            {todos.length}
          </span>{' '}
          {currentFilter !== 'all' && currentFilter} todos
        </p>
      </div>
    </Root>
  )
}
