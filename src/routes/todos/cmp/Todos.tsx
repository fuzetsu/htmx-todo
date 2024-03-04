import { Todo } from '../../../db/schema'
import { Input } from '../../../base/Input'
import { Root } from '../../../base/Root'
import { Filter, filters } from '../types'
import { TodoItem } from './TodoItem'
import { TodoCounter } from './TodoCounter'

interface Props {
  username: string
  todos: Todo[]
  currentFilter: Filter
  editing?: string
}

export function Todos({ username, todos, currentFilter, editing }: Props) {
  const editId = Number(editing)
  return (
    <Root>
      <div class="m-4 max-w-[500px] mx-auto flex flex-col gap-2">
        <div class="flex items-baseline justify-between">
          <h1 class="text-3xl">Todos</h1>
          <div class="flex flex-row gap-2 justify-center" hx-boost="true">
            {filters.map((filter) =>
              filter === currentFilter ? (
                filter
              ) : (
                <a
                  href={`/todos/${filter}`}
                  hx-swap="innerHTML"
                  class="text-blue-800 dark:text-blue-500 hover:underline"
                >
                  {filter}
                </a>
              ),
            )}
          </div>

          <a hx-boost="true" href="/auth/logoff" title="Logoff" class="flex items-center gap-1">
            {username}
            <span class="inline-block w-3 h-3 bg-black dark:bg-white rounded-full"></span>
          </a>
        </div>

        <div class="p-3 pb-0 rounded flex flex-col bg-secondary border border-slate-400">
          <form
            hx-post="/todos"
            hx-swap="afterbegin"
            hx-target="#todo-list"
            hx-on--after-request="event.detail.successful && this.reset()"
          >
            <Input id="newTodo" name="text" class="w-full" placeholder="e.g. Wash dishes" />
          </form>

          <ul id="todo-list" class="flex flex-col divide-y divide-slate-400">
            {todos.map((todo) => (
              <TodoItem todo={todo} editable={editId === todo.id} />
            ))}
          </ul>
        </div>

        <p class="text-center text-slate-600 dark:text-slate-300">
          <TodoCounter count={todos.length} /> {currentFilter !== 'all' && currentFilter} todos
        </p>
      </div>
    </Root>
  )
}
