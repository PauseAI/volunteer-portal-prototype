import { useSyncExternalStore } from 'react'
import type { Item } from './items'

// The demo state lives in localStorage (Spec 30). It starts as the seeded new-organizer view: no projects yet.
// Reset: the query parameter ?reset=1, or the hidden "Reset demo" button (bottom right), both clear it.

export type State = {
  projects: Item[]
  applied: string[] // teams and local groups applied to
  collapsed: Record<string, boolean> // guidance blocks collapsed, per item
  bannerDismissed: boolean
}

export const STORAGE_KEY = 'pauseai-volunteer-portal-prototype:v1'

const seed = (): State => ({ projects: [], applied: [], collapsed: {}, bannerDismissed: false })

function handleResetParam() {
  const params = new URLSearchParams(location.search)
  if (params.get('reset') !== '1') return
  localStorage.removeItem(STORAGE_KEY)
  params.delete('reset')
  const query = params.toString()
  history.replaceState(null, '', `${location.pathname}${query ? `?${query}` : ''}${location.hash}`)
}

function load(): State {
  handleResetParam()
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) return { ...seed(), ...JSON.parse(raw) }
  } catch {
    // unreadable state: start over
  }
  const state = seed()
  save(state)
  return state
}

function save(state: State) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
  } catch {
    // storage full or blocked: the demo still works for this visit
  }
}

let state = load()
const listeners = new Set<() => void>()

function subscribe(listener: () => void) {
  listeners.add(listener)
  return () => listeners.delete(listener)
}

export function useStore(): State {
  return useSyncExternalStore(subscribe, () => state)
}

export function setState(fn: (state: State) => State) {
  state = fn(state)
  save(state)
  listeners.forEach((listener) => listener())
}

export function resetDemo() {
  localStorage.removeItem(STORAGE_KEY)
  location.href = `${location.pathname}#/projects`
  location.reload()
}
