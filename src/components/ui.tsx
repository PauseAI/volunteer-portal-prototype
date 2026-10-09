import { Check, ChevronDown, ChevronRight } from 'lucide-react'
import { Fragment, type ComponentProps, type ReactNode } from 'react'

export const cn = (...classes: (string | false | null | undefined)[]) => classes.filter(Boolean).join(' ')

// Buttons (Spec 32): radius 8, 1px border, no shadow; primary = ink fill with cream text, secondary = outlined.
const buttonBase =
  'inline-flex h-11 shrink-0 items-center justify-center gap-2 rounded-control px-5 text-body font-semibold whitespace-nowrap transition-colors disabled:cursor-not-allowed disabled:opacity-50'

export const buttonClass = {
  primary: cn(buttonBase, 'bg-foreground text-background hover:bg-muted-foreground'),
  secondary: cn(buttonBase, 'border border-input text-foreground hover:bg-hover'),
}

type ButtonProps = ComponentProps<'button'> & { variant?: keyof typeof buttonClass }

export function Button({ variant = 'primary', className, type = 'button', ...props }: ButtonProps) {
  return <button type={type} className={cn(buttonClass[variant], className)} {...props} />
}

/** Links: ink text with the 1.5px orange underline, 3px on hover (the website's card link, inverted). */
export const accentLink =
  'underline decoration-brand-accent decoration-[1.5px] underline-offset-4 transition-[text-decoration-thickness] hover:decoration-[3px]'

export function ExternalLink({ href, children, className }: { href: string; children: ReactNode; className?: string }) {
  return (
    <a href={href} target="_blank" rel="noreferrer" className={cn(accentLink, className)}>
      {children}
    </a>
  )
}

const MARKDOWN_LINK = /\[([^\]]+)\]\((https?:\/\/[^)\s]+)\)/g

/** Text with markdown links, as the content note writes them ([title](url)); everything else verbatim. */
export function Inline({ text }: { text: string }) {
  const out: ReactNode[] = []
  let last = 0
  for (const match of text.matchAll(MARKDOWN_LINK)) {
    out.push(text.slice(last, match.index))
    out.push(
      <ExternalLink key={match.index} href={match[2]}>
        {match[1]}
      </ExternalLink>,
    )
    last = match.index + match[0].length
  }
  out.push(text.slice(last))
  return <>{out}</>
}

/** Sentence case for descriptions that the content note starts in lower case. */
export const capitalize = (text: string) => text.charAt(0).toUpperCase() + text.slice(1)

export function Card({ className, ...props }: ComponentProps<'div'>) {
  return <div className={cn('rounded-card border border-border bg-surface', className)} {...props} />
}

type CheckboxProps = {
  checked: boolean
  onChange: (checked: boolean) => void
  label: string
  testId?: string
  className?: string
}

export function Checkbox({ checked, onChange, label, testId, className }: CheckboxProps) {
  return (
    <button
      type="button"
      role="checkbox"
      aria-checked={checked}
      aria-label={label}
      data-testid={testId}
      onClick={() => onChange(!checked)}
      className={cn(
        'grid size-[22px] shrink-0 place-items-center rounded-control border transition-colors',
        checked ? 'border-foreground bg-foreground text-background' : 'border-input bg-surface hover:border-foreground',
        className,
      )}
    >
      {checked && <Check aria-hidden className="size-4" strokeWidth={2.5} />}
    </button>
  )
}

export type Crumb = { label: string; href?: string }

export function Breadcrumbs({ trail }: { trail: Crumb[] }) {
  return (
    <nav aria-label="Breadcrumb" className="mb-5 flex flex-wrap items-center gap-1 text-small text-muted-foreground">
      {trail.map((crumb, i) => (
        <Fragment key={i}>
          {i > 0 && <ChevronRight aria-hidden className="size-4 shrink-0" strokeWidth={1.5} />}
          {crumb.href ? (
            <a href={crumb.href} className="underline-offset-4 hover:text-foreground hover:underline">
              {crumb.label}
            </a>
          ) : (
            <span aria-current="page">{crumb.label}</span>
          )}
        </Fragment>
      ))}
    </nav>
  )
}

/** A small outlined label, e.g. "Coming soon". */
export function Tag({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <span
      className={cn(
        'inline-flex h-7 shrink-0 items-center rounded-control border border-border px-2.5 text-caption whitespace-nowrap text-muted-foreground',
        className,
      )}
    >
      {children}
    </span>
  )
}

export function ProgressBar({ done, total }: { done: number; total: number }) {
  const share = total ? done / total : 0
  return (
    <div className="flex items-center gap-3">
      <div
        className="h-1.5 flex-1 overflow-hidden rounded-full bg-border"
        role="progressbar"
        aria-valuenow={done}
        aria-valuemin={0}
        aria-valuemax={total}
      >
        <div className="h-full rounded-full bg-foreground transition-[width]" style={{ width: `${share * 100}%` }} />
      </div>
      <span className="text-small whitespace-nowrap text-muted-foreground">
        {done} of {total} done
      </span>
    </div>
  )
}

/** A show/hide toggle for a hidden-by-default group, e.g. past projects or done steps. */
export function Disclosure({ open, onToggle, testId, children }: { open: boolean; onToggle: () => void; testId: string; children: ReactNode }) {
  return (
    <button
      type="button"
      data-testid={testId}
      aria-expanded={open}
      onClick={onToggle}
      className="inline-flex items-center gap-1.5 rounded-control font-semibold hover:text-muted-foreground"
    >
      {children}
      <ChevronDown aria-hidden strokeWidth={1.5} className={cn('size-5 transition-transform', open && 'rotate-180')} />
    </button>
  )
}
