import { ChevronRight } from 'lucide-react'
import { GuidanceBlock } from '../components/Guidance'
import { Breadcrumbs, buttonClass, Inline } from '../components/ui'
import { infoEvent } from '../content/content'
import { href } from '../router'

/**
 * The Info event template as a resource (Spec 21–22): the same object as the projects made from it, rendered
 * read-only — the same guidance block and step list, without owner, due and done. Sub-resources have their own page.
 */
export function TemplatePage({ path }: { path: string[] }) {
  const [rootId, childId] = path
  const node = rootId !== infoEvent.id ? null : childId ? infoEvent.children.find((c) => c.id === childId) : infoEvent
  if (!node) {
    return (
      <div className="max-w-item">
        <h1 className="text-h1">Not found</h1>
        <p className="mt-3 text-lead text-muted-foreground">
          <a href={href.resources} className="text-foreground underline underline-offset-4">
            Back to Resources
          </a>
        </p>
      </div>
    )
  }
  const isRoot = node === infoEvent

  return (
    <div className="max-w-item">
      <Breadcrumbs
        trail={[
          { label: 'Resources', href: href.resources },
          ...(isRoot ? [] : [{ label: infoEvent.title, href: href.template(infoEvent.id) }]),
          { label: node.title },
        ]}
      />
      <div className="flex items-start justify-between gap-6">
        <div>
          <h1 className="text-h1">{node.title}</h1>
          <p className="mt-2 text-small text-muted-foreground">
            {isRoot ? 'Template' : `Part of the ${infoEvent.title} template`} · {node.children.length} steps
          </p>
        </div>
        {isRoot && (
          <a href={href.newProject(infoEvent.id)} data-testid="use-template" className={buttonClass.primary}>
            Use this template
          </a>
        )}
      </div>
      {isRoot && <p className="mt-5 max-w-prose text-lead text-muted-foreground">{infoEvent.card}</p>}

      {node.guidance && (
        <div className="mt-8">
          <GuidanceBlock guidance={node.guidance} />
        </div>
      )}

      <section className="mt-10">
        <h2 className="mb-3 text-h3">Steps</h2>
        <ul className="divide-y divide-border overflow-hidden rounded-card border border-border bg-surface">
          {node.children.map((child) =>
            isRoot ? (
              <li key={child.id}>
                <a
                  href={href.template(infoEvent.id, child.id)}
                  data-testid="resource-step"
                  className="flex min-h-14 items-center gap-4 px-5 py-2 transition-colors hover:bg-hover focus-visible:outline-offset-[-3px]"
                >
                  <span className="flex-1">{child.title}</span>
                  <span className="text-small text-muted-foreground">{child.children.length} steps</span>
                  <ChevronRight aria-hidden className="size-5 text-muted-foreground" strokeWidth={1.5} />
                </a>
              </li>
            ) : (
              <li key={child.id} className="px-5 py-3.5">
                <p className="font-semibold">{child.title}</p>
                {child.hint && (
                  <p className="mt-0.5 text-small text-muted-foreground">
                    <Inline text={child.hint} />
                  </p>
                )}
              </li>
            ),
          )}
        </ul>
      </section>
    </div>
  )
}
