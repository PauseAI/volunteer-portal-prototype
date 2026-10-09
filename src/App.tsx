import { X } from 'lucide-react'
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
import { resetDemo, setState, useStore } from './store'

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
  const { bannerDismissed } = useStore()

  useEffect(() => {
    window.scrollTo(0, 0)
    document.title = `${tabs.find((t) => t.id === tab)!.label} · PauseAI volunteer portal (prototype)`
  }, [hash, tab])

  return (
    <div className="min-h-screen">
      <TopBar tab={tab} />
      <main className="mx-auto max-w-page px-10 pt-8 pb-28">
        {!bannerDismissed && <Banner />}
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
      <div className="mx-auto flex h-18 max-w-page items-center gap-14 px-10">
        <a href={href.projects} className="shrink-0 rounded-control">
          <img src={logo} alt="PauseAI" className="h-8 w-auto" />
        </a>
        <nav aria-label="Main" className="flex h-full items-stretch gap-9">
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
        <p className="ml-auto text-small text-muted-foreground">
          {user.name} · PauseAI Pausetown
        </p>
      </div>
    </header>
  )
}

/** For someone who opens the link cold (Spec 4): three lines, dismissible. */
function Banner() {
  return (
    <div data-testid="banner" className="mb-10 flex items-start gap-4 rounded-card border border-border bg-surface py-4 pr-4 pl-6">
      <div className="flex-1 text-small">
        <p className="font-semibold">This is a prototype of the PauseAI volunteer portal, the place where local groups plan and run their work.</p>
        <p className="text-muted-foreground">
          You are {user.name}, who just started the local group PauseAI Pausetown. Names are made up; what you change stays in this browser.
        </p>
        <p className="text-muted-foreground">
          Click <span className="font-semibold text-foreground">New project</span> to see the flow.
        </p>
      </div>
      <button
        type="button"
        data-testid="banner-dismiss"
        aria-label="Dismiss"
        onClick={() => setState((s) => ({ ...s, bannerDismissed: true }))}
        className="grid size-9 shrink-0 place-items-center rounded-control text-muted-foreground hover:bg-hover hover:text-foreground"
      >
        <X aria-hidden className="size-5" strokeWidth={1.5} />
      </button>
    </div>
  )
}
