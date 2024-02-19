interface Props extends JSX.HtmlInputTag {}

export function Input(props: Props) {
  return (
    <input
      type="text"
      autocomplete="off"
      {...props}
      class={`
        border border-slate-400 rounded
        px-2 py-1
        hover:bg-slate-50
        focus:ring active:ring
        ${props.class ?? ''}
      `}
    />
  )
}
