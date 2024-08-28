export const classes = (...things: (string | false | undefined | null)[]): string => {
  return things.flat().filter(Boolean).join(' ')
}
