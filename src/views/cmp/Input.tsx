interface Props extends JSX.HtmlInputTag {}

export function Input(props: Props) {
  return (
    <input
      type="text"
      autocomplete="off"
      {...props}
      class={`
        border border-slate-400 rounded
        dark:bg-black dark:text-white
        px-2 py-1
        hover:bg-slate-50 dark:hover:bg-slate-900
        focus:ring active:ring
        ${props.class ?? ''}
      `}
    />
  )
}
