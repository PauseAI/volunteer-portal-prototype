import { ArrowRight, ArrowUpRight } from 'lucide-react'
import { capitalize, cn, Tag } from '../components/ui'
import { comingSoon, infoEvent, resourceGroups, type ResourceEntry } from '../content/content'
import { href } from '../router'

const soon = new Set(comingSoon.map((t) => t.id))

function source(url: string): string {
  const host = new URL(url).hostname
  if (host.endsWith('notion.com') || host.endsWith('notion.so')) return 'Notion'
  if (host === 'drive.google.com') return 'Google Drive'
  return host.replace(/^www\./, '')
}

/** Resources (Spec 20–21): few, curated, in four groups; the Info event template is the only one with a page here. */
export function Resources() {
  return (
    <>
      <h1 className="text-h1">Resources</h1>
      <p className="mt-2 text-lead text-muted-foreground">Templates, guides and tools for running your group.</p>
      {resourceGroups.map((group) => (
        <section key={group.title} className="mt-12">
          <h2 className="text-h2">{group.title}</h2>
          <ul className="mt-4 grid gap-4 md:grid-cols-3">
            {group.entries.map((entry) => (
              <li key={entry.id}>
                <ResourceCard entry={entry} />
              </li>
            ))}
          </ul>
        </section>
      ))}
    </>
  )
}

function ResourceCard({ entry }: { entry: ResourceEntry }) {
  const isBuilt = entry.id === infoEvent.id
  const isSoon = soon.has(entry.id)
  const link = isBuilt ? href.template(infoEvent.id) : entry.url
  const body = (
    <>
      <span className="flex items-start justify-between gap-3">
        <span className={cn('font-display text-h3 font-bold text-heading', isSoon && !link && 'opacity-55')}>{entry.title}</span>
        {isSoon && <Tag>Coming soon</Tag>}
      </span>
      <span className={cn('mt-2 block flex-1 text-small text-muted-foreground', isSoon && !link && 'opacity-55')}>
        {capitalize(entry.description)}
      </span>
      {link && (
        <span className="mt-4 flex items-center gap-1.5 text-small font-semibold">
          {isBuilt ? (
            <>
              Template · {infoEvent.children.length} steps
              <ArrowRight aria-hidden className="ml-auto size-5" strokeWidth={1.5} />
            </>
          ) : (
            <>
              {source(entry.url!)}
              {entry.members && <span className="font-normal text-muted-foreground">· members</span>}
              <ArrowUpRight aria-hidden className="ml-auto size-5" strokeWidth={1.5} />
            </>
          )}
        </span>
      )}
    </>
  )
  const card = 'flex h-full flex-col rounded-card border border-border bg-surface p-5'
  if (!link) return <div className={card}>{body}</div>
  return (
    <a
      href={link}
      data-testid={`resource-${entry.id}`}
      {...(isBuilt ? {} : { target: '_blank', rel: 'noreferrer' })}
      className={cn(card, 'transition-colors hover:border-input')}
    >
      {body}
    </a>
  )
}
