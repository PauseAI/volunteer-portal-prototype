import { useSyncExternalStore } from 'react'

// Hash routing: GitHub Pages has no SPA fallback, so every page lives behind index.html#/…

export type Route =
  | { name: 'projects' }
  | { name: 'new'; template: string | null }
  | { name: 'item'; id: string }
  | { name: 'resources' }
  | { name: 'template'; path: string[] }
  | { name: 'teams' }

export function parseRoute(hash: string): Route {
  const [path, query = ''] = hash.replace(/^#\/?/, '').split('?')
  const parts = path.split('/').filter(Boolean)
  if (parts[0] === 'projects' && parts[1] === 'new') return { name: 'new', template: new URLSearchParams(query).get('template') }
  if (parts[0] === 'projects' && parts[1]) return { name: 'item', id: parts[1] }
  if (parts[0] === 'resources' && parts[1]) return { name: 'template', path: parts.slice(1) }
  if (parts[0] === 'resources') return { name: 'resources' }
  if (parts[0] === 'teams') return { name: 'teams' }
  return { name: 'projects' }
}

export const href = {
  projects: '#/projects',
  newProject: (template?: string) => (template ? `#/projects/new?template=${template}` : '#/projects/new'),
  item: (id: string) => `#/projects/${id}`,
  resources: '#/resources',
  template: (...path: string[]) => `#/resources/${path.join('/')}`,
  teams: '#/teams',
}

export function navigate(to: string) {
  location.hash = to
}

function subscribe(listener: () => void) {
  window.addEventListener('hashchange', listener)
  return () => window.removeEventListener('hashchange', listener)
}

export function useHash(): string {
  return useSyncExternalStore(subscribe, () => location.hash)
}
