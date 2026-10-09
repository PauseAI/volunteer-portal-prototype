import { useEffect } from 'react'
import logo from './assets/pauseai-logo.svg'
import { cn } from './components/ui'
import { user } from './data/seed'
import { ItemPage } from './pages/ItemPage'
import { MyProjects } from './pages/MyProjects'
import { NewProject } from './pages/NewProject'
import { Resources } from './pages/Resources'
import { Teams } from './pages/Teams'
import { TemplatePage } from './pages/TemplatePage'
import { href, parseRoute, useHash, type Route } from './router'
import { resetDemo } from './store'

type Tab = 'projects' | 'resources' | 'teams'

// Spec 8: three tabs, in this order.
const tabs: { id: Tab; label: string; href: string }[] = [
  { id: 'projects', label: 'My projects', href: href.projects },
  { id: 'resources', label: 'Resources', href: href.resources },
  { id: 'teams', label: 'Teams', href: href.teams },
]

const tabOf = (route: Route): Tab =>
  route.name === 'resources' || route.name === 'template' ? 'resources' : route.name === 'teams' ? 'teams' : 'projects'

export default function App() {
  const hash = useHash()
  const route = parseRoute(hash)
  const tab = tabOf(route)

  useEffect(() => {
    window.scrollTo(0, 0)
    document.title = `${tabs.find((t) => t.id === tab)!.label} · PauseAI volunteer portal (prototype)`
  }, [hash, tab])

  return (
    <div className="min-h-screen">
      <TopBar tab={tab} />
      <main className="mx-auto max-w-page px-5 pt-8 pb-28 md:px-10">
        {route.name === 'projects' && <MyProjects />}
        {route.name === 'new' && <NewProject key={hash} template={route.template} />}
        {route.name === 'item' && <ItemPage key={route.id} id={route.id} />}
        {route.name === 'resources' && <Resources />}
        {route.name === 'template' && <TemplatePage path={route.path} />}
        {route.name === 'teams' && <Teams />}
      </main>
      <button
        type="button"
        data-testid="reset-demo"
        onClick={resetDemo}
        className="fixed right-3 bottom-3 rounded-control px-3 py-1.5 text-caption text-muted-foreground opacity-0 transition-opacity hover:opacity-100 focus-visible:opacity-100"
      >
        Reset demo
      </button>
    </div>
  )
}

function TopBar({ tab }: { tab: Tab }) {
  return (
    <header className="border-b border-border">
      <div className="mx-auto flex h-18 max-w-page items-center gap-4 px-5 md:gap-14 md:px-10">
        <a href={href.projects} className="shrink-0 rounded-control">
          <img src={logo} alt="PauseAI" className="h-6 w-auto md:h-8" />
        </a>
        <nav aria-label="Main" className="flex h-full items-stretch gap-4 text-small whitespace-nowrap md:gap-9 md:text-body">
          {tabs.map((t) => (
            <a
              key={t.id}
              href={t.href}
              data-testid={`tab-${t.id}`}
              aria-current={t.id === tab ? 'page' : undefined}
              className={cn(
                'relative flex items-center font-semibold transition-colors',
                t.id === tab
                  ? 'text-foreground after:absolute after:inset-x-0 after:-bottom-px after:h-0.5 after:bg-brand-accent'
                  : 'text-muted-foreground hover:text-foreground',
              )}
            >
              {t.label}
            </a>
          ))}
        </nav>
        <p className="ml-auto hidden text-small text-muted-foreground lg:block">
          {user.name} · PauseAI Pausetown
        </p>
      </div>
    </header>
  )
}
