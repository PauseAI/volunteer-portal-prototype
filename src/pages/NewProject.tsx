import { Check, ChevronDown } from 'lucide-react'
import { useState, type FormEvent, type ReactNode } from 'react'
import { Breadcrumbs, Button, cn, Tag } from '../components/ui'
import { comingSoon, infoEvent } from '../content/content'
import { blankItem, instantiate } from '../items'
import { href, navigate } from '../router'
import { setState } from '../store'

const EMPTY = 'empty'
const [protest] = comingSoon

/** The creation flow (Spec 12): title → template ("Empty" preselected, two suggestions, browse the rest) → create. */
export function NewProject({ template }: { template: string | null }) {
  const [title, setTitle] = useState('')
  const [selected, setSelected] = useState(template === infoEvent.id ? infoEvent.id : EMPTY)
  const [browsing, setBrowsing] = useState(false)

  function create(event: FormEvent) {
    event.preventDefault()
    const name = title.trim()
    const project =
      selected === infoEvent.id
        ? { ...instantiate(infoEvent), title: name || infoEvent.title, template: infoEvent.id }
        : blankItem(name || 'Untitled project')
    setState((s) => ({ ...s, projects: [...s.projects, project] }))
    navigate(href.item(project.id))
  }

  return (
    <div className="max-w-item">
      <Breadcrumbs trail={[{ label: 'My projects', href: href.projects }, { label: 'New project' }]} />
      <h1 className="text-h1">New project</h1>
      <form onSubmit={create} className="mt-8">
        <label htmlFor="project-title" className="mb-2 block font-semibold">
          Title
        </label>
        <input
          id="project-title"
          data-testid="project-title"
          autoFocus
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="For example: Info evening at the Pausetown library"
          className="h-12 w-full max-w-[560px] rounded-control border border-input bg-surface px-4 text-lead"
        />

        <fieldset className="mt-10">
          <legend className="mb-1 font-semibold">Start from a template</legend>
          <p className="mb-4 text-small text-muted-foreground">
            A template fills in the steps, with guidance on how to do each one well.
          </p>
          <div role="radiogroup" aria-label="Template" className="grid gap-4 md:grid-cols-3">
            <TemplateCard id={EMPTY} title="Empty" selected={selected} onSelect={setSelected}>
              A blank project. Add your own steps.
            </TemplateCard>
            <TemplateCard id={infoEvent.id} title={infoEvent.title} selected={selected} onSelect={setSelected}>
              {infoEvent.card}
              <span className="mt-3 block text-muted-foreground">{infoEvent.children.length} steps with guidance</span>
            </TemplateCard>
            <TemplateCard id={protest.id} title={protest.title} selected={selected} disabled>
              {protest.description}
            </TemplateCard>
          </div>

          <button
            type="button"
            data-testid="browse-templates"
            aria-expanded={browsing}
            onClick={() => setBrowsing(!browsing)}
            className="mt-5 inline-flex items-center gap-1.5 rounded-control font-semibold hover:text-muted-foreground"
          >
            Browse templates
            <ChevronDown aria-hidden strokeWidth={1.5} className={cn('size-5 transition-transform', browsing && 'rotate-180')} />
          </button>
          {browsing && (
            <ul
              data-testid="template-library"
              className="mt-3 divide-y divide-border overflow-hidden rounded-card border border-border bg-surface"
            >
              <LibraryRow
                id={infoEvent.id}
                title={infoEvent.title}
                description={infoEvent.card ?? ''}
                selected={selected === infoEvent.id}
                onSelect={() => setSelected(infoEvent.id)}
              />
              {comingSoon.map((t) => (
                <LibraryRow key={t.id} id={t.id} title={t.title} description={t.description} />
              ))}
            </ul>
          )}
        </fieldset>

        <div className="mt-10 flex items-center gap-6">
          <Button type="submit" data-testid="create-project">
            Create project
          </Button>
          <a href={href.projects} className="font-semibold text-muted-foreground hover:text-foreground">
            Cancel
          </a>
        </div>
      </form>
    </div>
  )
}

type TemplateCardProps = {
  id: string
  title: string
  selected: string
  onSelect?: (id: string) => void
  disabled?: boolean
  children: ReactNode
}

function TemplateCard({ id, title, selected, onSelect, disabled, children }: TemplateCardProps) {
  const isSelected = selected === id
  return (
    <button
      type="button"
      role="radio"
      aria-checked={isSelected}
      aria-disabled={disabled}
      data-testid={`template-${id}`}
      onClick={() => !disabled && onSelect?.(id)}
      className={cn(
        'relative flex h-full flex-col rounded-card border-[1.5px] bg-surface p-5 text-left transition-colors',
        isSelected ? 'border-foreground' : 'border-border',
        disabled ? 'cursor-not-allowed' : 'hover:border-input',
      )}
    >
      <span className="flex w-full items-start justify-between gap-3">
        <span className={cn('font-display text-h3 font-bold text-heading', disabled && 'opacity-55')}>{title}</span>
        {isSelected && (
          <span className="grid size-6 shrink-0 place-items-center rounded-full bg-foreground text-background">
            <Check aria-hidden className="size-4" strokeWidth={2.5} />
          </span>
        )}
        {disabled && <Tag>Coming soon</Tag>}
      </span>
      <span className={cn('mt-2 block text-small text-muted-foreground', disabled && 'opacity-55')}>{children}</span>
    </button>
  )
}

type LibraryRowProps = { id: string; title: string; description: string; selected?: boolean; onSelect?: () => void }

function LibraryRow({ id, title, description, selected, onSelect }: LibraryRowProps) {
  const disabled = !onSelect
  return (
    <li>
      <button
        type="button"
        data-testid={`library-${id}`}
        aria-disabled={disabled}
        aria-pressed={selected}
        onClick={onSelect}
        className={cn(
          'flex w-full items-start gap-4 px-5 py-4 text-left focus-visible:outline-offset-[-3px]',
          disabled ? 'cursor-not-allowed' : 'hover:bg-hover',
        )}
      >
        <span className={cn('flex-1', disabled && 'opacity-55')}>
          <span className="block font-semibold">{title}</span>
          <span className="block text-small text-muted-foreground">{description}</span>
        </span>
        {disabled ? <Tag>Coming soon</Tag> : selected ? <Tag className="border-foreground text-foreground">Selected</Tag> : <Tag>Select</Tag>}
      </button>
    </li>
  )
}
