export const redirect =
  (path: string) =>
  ({ set }: { set: { redirect?: string } }) => {
    set.redirect = path
  }
