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
}

export function Todos({ username, todos, currentFilter }: Props) {
  return (
    <Root>
      <div class="m-2 max-w-[500px] mx-auto flex flex-col gap-2">
        <div class="flex items-baseline justify-between">
          <h1 class="text-3xl">Todo app</h1>
          <span class="flex items-center gap-1">
            {username}
            <span class="inline-block w-3 h-3 bg-black dark:bg-white rounded-full"></span>
          </span>
        </div>
        <form
          hx-post="/todos"
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

        <ul id="todo-list" class="flex flex-col gap-2">
          {todos.map((todo) => (
            <TodoItem todo={todo} />
          ))}
        </ul>

        <p class="text-center text-slate-600 dark:text-slate-300">
          <TodoCounter count={todos.length} /> {currentFilter !== 'all' && currentFilter} todos
        </p>
      </div>
    </Root>
  )
}
