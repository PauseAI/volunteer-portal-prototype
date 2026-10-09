import type { Guidance, TemplateNode } from './content/content'

/** One kind of item, nested freely (Spec 15–16): a project, a sub-project and a task are all Items. */
export type Item = {
  id: string
  title: string
  owner: string | null
  due: string | null // yyyy-mm-dd
  done: boolean
  guidance?: Guidance
  summary?: string
  hint?: string
  template?: string // the template a project was created from (Spec 19)
  children: Item[]
}

export const newId = () => Math.random().toString(36).slice(2, 10)

export const blankItem = (title: string): Item => ({ id: newId(), title, owner: null, due: null, done: false, children: [] })

/** A template becomes a project: deep copy with fresh ids; owner and due empty, done false. */
export function instantiate(node: TemplateNode): Item {
  return {
    ...blankItem(node.title),
    ...(node.guidance ? { guidance: structuredClone(node.guidance) } : {}),
    ...(node.summary ? { summary: node.summary } : {}),
    ...(node.hint ? { hint: node.hint } : {}),
    children: node.children.map(instantiate),
  }
}

/** The chain from a project down to the item with this id, or null. */
export function findPath(items: Item[], id: string): Item[] | null {
  for (const item of items) {
    if (item.id === id) return [item]
    const below = findPath(item.children, id)
    if (below) return [item, ...below]
  }
  return null
}

export function updateItem(items: Item[], id: string, fn: (item: Item) => Item): Item[] {
  return items.map((item) =>
    item.id === id ? fn(item) : { ...item, children: updateItem(item.children, id, fn) },
  )
}

export function removeItem(items: Item[], id: string): Item[] {
  return items.filter((item) => item.id !== id).map((item) => ({ ...item, children: removeItem(item.children, id) }))
}

/** Done and total over all items below this one. */
export function progress(item: Item): { done: number; total: number } {
  return item.children.reduce(
    (acc, child) => {
      const below = progress(child)
      return { done: acc.done + below.done + (child.done ? 1 : 0), total: acc.total + below.total + 1 }
    },
    { done: 0, total: 0 },
  )
}

export function formatDate(date: string): string {
  return new Date(`${date}T00:00:00`).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })
}
