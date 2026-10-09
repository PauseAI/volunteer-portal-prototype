import { ArrowRight, Plus } from 'lucide-react'
import { useState } from 'react'
import { accentLink, buttonClass, Card, cn, Disclosure, ProgressBar } from '../components/ui'
import { infoEvent } from '../content/content'
import { memberName, user } from '../data/seed'
import { formatDate, progress, type Item } from '../items'
import { href } from '../router'
import { useStore } from '../store'

/**
 * My Projects (Spec 9–11): the projects you work on; empty for a new organizer except the curated start.
 * Done projects move to "Past projects", hidden until opened (Simon, 2026-10-09).
 */
export function MyProjects() {
  const { projects } = useStore()
  const [showPast, setShowPast] = useState(false)
  const open = projects.filter((p) => !p.done)
  const past = projects.filter((p) => p.done)
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
      ) : open.length > 0 ? (
        <ProjectGrid projects={open} className="mt-10" />
      ) : (
        <p className="mt-10 text-lead text-muted-foreground">No open projects.</p>
      )}
      {past.length > 0 && (
        <section className="mt-12">
          <Disclosure open={showPast} onToggle={() => setShowPast(!showPast)} testId="past-projects-toggle">
            Past projects ({past.length})
          </Disclosure>
          {showPast && <ProjectGrid projects={past} className="mt-4" />}
        </section>
      )}
    </>
  )
}

function ProjectGrid({ projects, className }: { projects: Item[]; className?: string }) {
  return (
    <ul className={cn('grid gap-4 md:grid-cols-2', className)}>
      {projects.map((project) => (
        <li key={project.id}>
          <ProjectCard project={project} />
        </li>
      ))}
    </ul>
  )
}

/**
 * The curated start (Spec 11): one line and the link, nothing else (Simon, 2026-10-09). Below it, for whoever opens
 * the link cold, one muted line with the demo video (public/demo.mp4, recorded by video/record.py).
 */
function StartCard() {
  return (
    <>
      <Card data-testid="start-card" className="mt-10 p-8">
        <h2 className="text-h2">New local group? Run your first info event</h2>
        <a
          href={href.newProject(infoEvent.id)}
          data-testid="start-info-event"
          className={cn(accentLink, 'mt-4 inline-flex items-center gap-1.5 font-semibold')}
        >
          Start from the Info event template
          <ArrowRight aria-hidden className="size-4" strokeWidth={2} />
        </a>
      </Card>
      <p className="mt-4 text-small text-muted-foreground">
        Prototype with fictional data: click around, or{' '}
        <a href="demo.mp4" data-testid="demo-video" className="underline underline-offset-4 hover:text-foreground">
          watch the 2-minute demo
        </a>
        .
      </p>
    </>
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
