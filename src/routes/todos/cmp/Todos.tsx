import { Todo } from '../../../db/schema'
import { Input } from '../../../base/Input'
import { Root } from '../../../base/Root'
import { Filter, filters } from '../types'
import { TodoItem } from './TodoItem'

interface Props {
  todos: Todo[]
  currentFilter: Filter
}

export function Todos({ todos, currentFilter }: Props) {
  return (
    <Root>
      <div class="m-2 max-w-[500px] mx-auto flex flex-col gap-2">
        <h1 class="text-3xl">Todo app</h1>

        <form
          hx-put="/todos"
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
                href={`/todos/${filter}`}
                hx-swap="innerHTML transition:true"
                class="text-blue-800 dark:text-blue-500 hover:underline"
              >
                {filter}
              </a>
            ),
          )}
        </div>

        <div id="todo-list" class="flex flex-col gap-2">
          {todos.map((todo) => (
            <TodoItem todo={todo} />
          ))}
        </div>

        <p class="text-center text-slate-600 dark:text-slate-300">
          <span
            hx-trigger="htmx:beforeSwap from:#todo-list delay:20ms"
            hx-get={`/todos/${currentFilter}/count`}
            hx-swap="innerHTML"
          >
            {todos.length}
          </span>{' '}
          {currentFilter !== 'all' && currentFilter} todos
        </p>
      </div>
    </Root>
  )
}