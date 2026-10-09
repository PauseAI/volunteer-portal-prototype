import { ChevronDown } from 'lucide-react'
import type { ReactNode } from 'react'
import type { Guidance } from '../content/content'
import { cn, ExternalLink, Inline } from './ui'

type Props = {
  guidance?: Guidance
  hint?: string
  /** On project pages the block collapses (Spec 14); on Resources it is always open. */
  collapsed?: boolean
  onToggle?: () => void
}

/** "How to do this well": the template's guidance for one item — Goal, How, Take care of, Resources; for a task its hint line. */
export function GuidanceBlock({ guidance, hint, collapsed = false, onToggle }: Props) {
  const open = !onToggle || !collapsed
  return (
    <section data-testid="guidance" className="rounded-card border border-border bg-surface">
      <h2 className="text-h3">
        {onToggle ? (
          <button
            type="button"
            data-testid="guidance-toggle"
            aria-expanded={open}
            onClick={onToggle}
            className="flex w-full items-center justify-between gap-4 rounded-card px-6 py-4 text-left"
          >
            How to do this well
            <span className="flex items-center gap-2 font-sans text-small font-normal text-muted-foreground">
              {open ? 'Hide' : 'Show'}
              <ChevronDown aria-hidden strokeWidth={1.5} className={cn('size-5 transition-transform', open && 'rotate-180')} />
            </span>
          </button>
        ) : (
          <span className="block px-6 pt-5 pb-1">How to do this well</span>
        )}
      </h2>
      {open && (
        <div className="px-6 pb-6">
          {guidance ? <GuidanceFields guidance={guidance} /> : hint ? <p className="max-w-prose text-lead"><Inline text={hint} /></p> : null}
        </div>
      )}
    </section>
  )
}

function Label({ children }: { children: ReactNode }) {
  return <p className="mb-2 font-semibold text-foreground">{children}</p>
}

function GuidanceFields({ guidance }: { guidance: Guidance }) {
  return (
    <div className="grid gap-x-10 gap-y-6 md:grid-cols-[3fr_2fr]">
      <div className="md:col-span-2">
        <Label>Goal</Label>
        <p className="max-w-prose text-lead">
          <Inline text={guidance.goal} />
        </p>
      </div>
      <div>
        <Label>How</Label>
        <ol className="space-y-2.5">
          {guidance.how.map((step, i) => (
            <li key={i} className="flex gap-3">
              <span className="w-4 shrink-0 font-semibold text-muted-foreground">{i + 1}</span>
              <span>
                <Inline text={step} />
              </span>
            </li>
          ))}
        </ol>
      </div>
      <div className="space-y-6">
        <div>
          <Label>Take care of</Label>
          <ul className="space-y-2.5">
            {guidance.takeCareOf.map((point, i) => (
              <li key={i} className="flex gap-3">
                <span aria-hidden className="mt-[0.6em] size-1.5 shrink-0 rounded-full bg-foreground" />
                <span>
                  <Inline text={point} />
                </span>
              </li>
            ))}
          </ul>
        </div>
        {guidance.resources.length > 0 && (
          <div>
            <Label>Resources</Label>
            <ul className="space-y-1.5">
              {guidance.resources.map((link) => (
                <li key={link.title}>
                  <ExternalLink href={link.url}>{link.title}</ExternalLink>
                  {link.members && <span className="text-muted-foreground"> (members)</span>}
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  )
}
