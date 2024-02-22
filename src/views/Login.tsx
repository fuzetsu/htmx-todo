import { Button } from './cmp/Button'
import { Input } from './cmp/Input'
import { Root } from './cmp/Root'

interface Props {
  register?: boolean
}

export function Login({ register }: Props) {
  return (
    <Root>
      <div class="flex justify-center items-center min-h-screen">
        <form
          hx-post={`/auth/${register ? 'register' : 'login'}`}
          hx-target="find div"
          hx-swap="innerHTML"
          onsubmit="
            if(!this.reportValidity()) {
                event.preventDefault()
                return false
            }
          "
          class="flex flex-col gap-2 bg-slate-100 dark:bg-slate-900 rounded-lg p-5"
        >
          <div class="empty:hidden text-red-900 dark:text-red-300"></div>
          <label class="flex flex-col gap-1">
            Username
            <Input required placeholder="username" name="username" minlength={4} />
          </label>
          <label class="flex flex-col gap-1">
            Password
            <Input required placeholder="password" name="password" type="password" minlength={8} />
          </label>
          {register && (
            <label class="flex flex-col gap-1">
              Confirm password
              <Input
                required
                placeholder="confirm password"
                name="confirmPassword"
                type="password"
                minlength={8}
              />
            </label>
          )}
          <Button type="submit">{register ? 'Register' : 'Login'}</Button>
          <Button type="button" href={`/auth/${register ? 'login' : 'register'}`}>
            {register ? 'Login' : 'Register'} instead
          </Button>
        </form>
      </div>
    </Root>
  )
}
