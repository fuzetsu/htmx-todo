import { Root } from './cmp/Root'
import { Input } from './cmp/Input'
import Database from 'bun:sqlite'
import { TodoData } from '../types'

interface Props {
  db: Database
  currentFilter: 'All' | 'Active' | 'Done'
}

export function Todo({ todo }: { todo: TodoData }) {
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
          checked={!!todo.done}
          hx-post={`/toggle-todo/${todo.id}`}
          hx-target={idSel}
          hx-swap="outerHTML transition:true"
        />
        <span safe class={todo.done ? 'line-through' : ''}>
          {todo.text}
        </span>
      </div>
      <button
        class="hover:text-red-700"
        hx-delete={`/todo/${todo.id}`}
        hx-swap="outerHTML transition:true"
        hx-target={idSel}
      >
        x
      </button>
    </div>
  )
}

export function Todos({ db, currentFilter }: Props) {
  const todos = db.query<TodoData, []>('SELECT * from TODOS ORDER BY id DESC').all()

  const filters = [
    { href: '/', label: 'All' },
    { href: '/active', label: 'Active' },
    { href: '/done', label: 'Done' },
  ]

  const filteredTodos =
    currentFilter === 'All'
      ? todos
      : todos.filter((todo) => (currentFilter === 'Active' ? !todo.done : todo.done))

  return (
    <Root>
      <div class="m-2 max-w-[500px] mx-auto flex flex-col gap-1">
        <h1 class="text-3xl">Todo app</h1>

        <form
          hx-put="/todo"
          hx-swap="afterbegin transition:true"
          hx-target="#todo-list"
          hx-on--after-request="event.detail.successful && this.reset()"
        >
          <Input name="text" class="w-full" placeholder="e.g. Wash dishes" />
        </form>
        <div class="flex flex-row gap-2 justify-center" hx-boost="true">
          {filters.map((filter) =>
            filter.label === currentFilter ? (
              filter.label
            ) : (
              <a href={filter.href} hx-swap="innerHTML transition:true" class={'text-blue-800'}>
                {filter.label}
              </a>
            )
          )}
        </div>
        <div id="todo-list" class="flex flex-col gap-1">
          {filteredTodos.map((todo) => (
            <Todo todo={todo} />
          ))}
        </div>
        {/* @TODO dynamically update when todo added/removed */}
        <p class="text-center text-slate-600">{filteredTodos.length} todos</p>
      </div>
    </Root>
  )
}
