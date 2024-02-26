import { Button } from '../../../base/Button'
import { Input } from '../../../base/Input'
import { Root } from '../../../base/Root'

interface Props {
  register?: boolean
}

const formFlex = 'flex flex-col gap-2'
const fieldFlex = 'flex flex-col gap-1'

export function Login({ register }: Props) {
  return (
    <Root>
      <div class="flex justify-center items-center min-h-screen">
        <div class={`${formFlex} bg-slate-100 dark:bg-slate-900 rounded-lg p-5`}>
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
            class={formFlex}
          >
            <div class="empty:hidden text-red-900 dark:text-red-300"></div>
            <label class="flex flex-col gap-1">
              Username
              <Input required placeholder="username" name="username" minlength={4} />
            </label>
            <label class={fieldFlex}>
              Password
              <Input
                required
                placeholder="password"
                name="password"
                type="password"
                minlength={8}
              />
            </label>
            {register && (
              <label class={fieldFlex}>
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
          </form>
          <Button hx-boost="true" role="button" href={`/auth/${register ? 'login' : 'register'}`}>
            {register ? 'Login' : 'Register'} instead
          </Button>
        </div>
      </div>
    </Root>
  )
}
