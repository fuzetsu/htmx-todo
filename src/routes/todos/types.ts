export const filters = ['all', 'active', 'done'] as const
export type Filter = (typeof filters)[number]
