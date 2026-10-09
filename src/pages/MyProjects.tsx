import { ArrowRight, Plus } from 'lucide-react'
import { accentLink, buttonClass, Card, cn, ProgressBar } from '../components/ui'
import { infoEvent } from '../content/content'
import { memberName, user } from '../data/seed'
import { formatDate, progress, type Item } from '../items'
import { href } from '../router'
import { useStore } from '../store'

/** My Projects (Spec 9–11): the projects you work on; empty for a new organizer except the curated start. */
export function MyProjects() {
  const { projects } = useStore()
  return (
    <>
      <div className="flex flex-wrap items-end justify-between gap-6">
        <div>
          <h1 className="text-h1">My projects</h1>
          <p className="mt-2 text-lead text-muted-foreground">What you and your group are working on.</p>
        </div>
        <a href={href.newProject()} data-testid="new-project" className={buttonClass.primary}>
          <Plus aria-hidden className="size-5" strokeWidth={2} />
          New project
        </a>
      </div>
      {projects.length === 0 ? (
        <StartCard />
      ) : (
        <ul className="mt-10 grid gap-4 md:grid-cols-2">
          {projects.map((project) => (
            <li key={project.id}>
              <ProjectCard project={project} />
            </li>
          ))}
        </ul>
      )}
    </>
  )
}

/** The curated start (Spec 11): one card instead of a menu. */
function StartCard() {
  return (
    <Card data-testid="start-card" className="mt-10 p-8">
      <h2 className="text-h2">New local group? Run your first info event</h2>
      <p className="mt-3 max-w-prose text-lead text-muted-foreground">{infoEvent.card}</p>
      <ol className="mt-6 flex flex-wrap gap-2">
        {infoEvent.children.map((child, i) => (
          <li key={child.id} className="flex h-9 items-center gap-2 rounded-control border border-border px-3 text-small">
            <span className="font-semibold text-muted-foreground">{i + 1}</span>
            {child.title}
          </li>
        ))}
      </ol>
      <a
        href={href.newProject(infoEvent.id)}
        data-testid="start-info-event"
        className={cn(accentLink, 'mt-7 inline-flex items-center gap-1.5 font-semibold')}
      >
        Start from the Info event template
        <ArrowRight aria-hidden className="size-4" strokeWidth={2} />
      </a>
    </Card>
  )
}

function ProjectCard({ project }: { project: Item }) {
  const { done, total } = progress(project)
  const owner = memberName(project.owner)
  return (
    <a
      href={href.item(project.id)}
      data-testid="project-card"
      className="flex h-full flex-col gap-4 rounded-card border border-border bg-surface p-6 transition-colors hover:border-input"
    >
      <div>
        <h2 className="text-h3">{project.title}</h2>
        <p className="mt-1 text-small text-muted-foreground">
          {project.template ? `From template: ${infoEvent.title}` : 'Blank project'}
          {project.children.length > 0 && ` · ${project.children.length} steps`}
        </p>
      </div>
      {total > 0 && <ProgressBar done={done} total={total} />}
      {(owner || project.due) && (
        <p className="text-small text-muted-foreground">
          {owner && `Owner: ${project.owner === user.id ? 'you' : owner}`}
          {owner && project.due && ' · '}
          {project.due && `Due ${formatDate(project.due)}`}
        </p>
      )}
    </a>
  )
}
