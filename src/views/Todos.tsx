import { Root } from './cmp/Root'
import { Input } from './cmp/Input'
import Database from 'bun:sqlite'
import { TodoData } from '../types'

interface Props {
  db: Database
}

export function Todo({ todo }: { todo: TodoData }) {
  const htmlId = `todo-${todo.id}`
  return (
    <div id={htmlId} class="border p-3 flex gap-2 items-center">
      <input
        autocomplete="off"
        type="checkbox"
        checked={!!todo.done}
        hx-post={`/toggle-todo/${todo.id}`}
        hx-target={`#${htmlId}`}
        hx-swap="outerHTML transition:true"
      />
      <span safe class={todo.done ? 'line-through' : ''}>
        {todo.text}
      </span>
    </div>
  )
}

export function Todos({ db }: Props) {
  const todos = db.query<TodoData, []>('select * from todos order by id desc').all()

  return (
    <Root>
      <div class="m-2 max-w-[500px] mx-auto flex flex-col gap-1">
        <h1 class="text-3xl">Todo app</h1>

        <form
          hx-post="/new-todo"
          hx-swap="afterbegin transition:true"
          hx-target="#todo-list"
          hx-on--after-request="event.detail.successful && this.reset()"
        >
          <Input name="text" class="w-full" placeholder="e.g. Wash dishes" />
        </form>
        <div></div>
        <div id="todo-list" class="flex flex-col gap-1">
          {todos.map((todo) => (
            <Todo todo={todo} />
          ))}
        </div>
      </div>
    </Root>
  )
}
