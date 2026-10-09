import { ChevronDown } from 'lucide-react'
import type { Guidance } from '../content/content'
import { cn, Inline } from './ui'

type Props = {
  guidance?: Guidance
  hint?: string
  /** On project pages the block collapses (Spec 14); on Resources it is always open. */
  collapsed?: boolean
  onToggle?: () => void
}

/**
 * "How to do this well": the template's guidance for one item as plain text, top to bottom — the goal, what matters,
 * resources; for a task its hint line. No step list of its own: the list of steps below it is the step list.
 */
export function GuidanceBlock({ guidance, hint, collapsed = false, onToggle }: Props) {
  const open = !onToggle || !collapsed
  const paragraphs = guidance ?? (hint ? [hint] : [])
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
          <span className="block px-6 py-4">How to do this well</span>
        )}
      </h2>
      {open && (
        <div className="max-w-prose space-y-3 px-6 pb-6">
          {paragraphs.map((text, i) => (
            <Paragraph key={i} text={text} />
          ))}
        </div>
      )}
    </section>
  )
}

/** One paragraph of the note; a leading "Goal:" or "Resources:" in semibold. */
function Paragraph({ text }: { text: string }) {
  const label = /^(Goal|Resources):\s*/.exec(text)
  return (
    <p>
      {label && <span className="font-semibold">{label[1]}: </span>}
      <Inline text={label ? text.slice(label[0].length) : text} />
    </p>
  )
}
