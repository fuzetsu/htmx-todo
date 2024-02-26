type Props = JSX.HtmlButtonTag & { href?: string }

const style = `
  bg-white dark:bg-black border-slate-400
  border text-center
  py-1 px-3 rounded hover:bg-slate-100 dark:hover:bg-slate-900
`

export function Button({ children, href, ...props }: Props) {
  const Tag = href ? 'a' : 'button'

  return (
    <Tag {...props} href={href} class={style + (props.class ?? '')}>
      {children}
    </Tag>
  )
}
