import { ChevronDown, ChevronRight, Plus, Trash2 } from 'lucide-react'
import { useLayoutEffect, useRef, useState, type FormEvent } from 'react'
import { GuidanceBlock } from '../components/Guidance'
import { Breadcrumbs, Button, Checkbox, cn } from '../components/ui'
import { infoEvent } from '../content/content'
import { members, user } from '../data/seed'
import { blankItem, findPath, formatDate, progress, removeItem, updateItem, type Item } from '../items'
import { href } from '../router'
import { setState, useStore } from '../store'

const update = (id: string, fn: (item: Item) => Item) =>
  setState((s) => ({ ...s, projects: updateItem(s.projects, id, fn) }))

/** One page for every item, at any depth (Spec 14–19): guidance on top, then the sub-items. */
export function ItemPage({ id }: { id: string }) {
  const { projects, collapsed } = useStore()
  const path = findPath(projects, id)
  if (!path) return <NotFound />
  const item = path[path.length - 1]
  const isProject = path.length === 1

  return (
    <div className="max-w-item">
      <Breadcrumbs
        trail={[
          { label: 'My projects', href: href.projects },
          ...path.slice(0, -1).map((p) => ({ label: p.title, href: href.item(p.id) })),
          { label: item.title },
        ]}
      />
      <TitleField item={item} />

      <div className="mt-4 flex flex-wrap items-center gap-x-8 gap-y-3">
        <label className="flex items-center gap-2.5 font-semibold">
          <Checkbox
            checked={item.done}
            onChange={(done) => update(item.id, (it) => ({ ...it, done }))}
            label="Done"
            testId="done-checkbox"
          />
          Done
        </label>
        <label className="flex items-center gap-2.5">
          <span className="text-muted-foreground">Owner</span>
          <OwnerSelect item={item} />
        </label>
        <label className="flex items-center gap-2.5">
          <span className="text-muted-foreground">Due</span>
          <input
            type="date"
            data-testid="due-input"
            value={item.due ?? ''}
            onChange={(e) => update(item.id, (it) => ({ ...it, due: e.target.value || null }))}
            className="h-10 rounded-control border border-input bg-surface px-3"
          />
        </label>
        {isProject && item.template === infoEvent.id && (
          <a
            href={href.template(infoEvent.id)}
            data-testid="from-template"
            className="text-muted-foreground underline underline-offset-4 hover:text-foreground"
          >
            From template: {infoEvent.title}
          </a>
        )}
      </div>

      {(item.guidance || item.hint) && (
        <div className="mt-8">
          <GuidanceBlock
            guidance={item.guidance}
            hint={item.hint}
            collapsed={!!collapsed[item.id]}
            onToggle={() => setState((s) => ({ ...s, collapsed: { ...s.collapsed, [item.id]: !s.collapsed[item.id] } }))}
          />
        </div>
      )}

      <SubItems item={item} />
    </div>
  )
}

/**
 * The title, editable in place (the page remounts per item, so the draft starts from the stored title).
 * A one-row textarea that grows, so a long title wraps like a heading instead of being cut off.
 */
function TitleField({ item }: { item: Item }) {
  const [draft, setDraft] = useState(item.title)
  const ref = useRef<HTMLTextAreaElement>(null)
  useLayoutEffect(() => {
    const fit = () => {
      const el = ref.current
      if (!el) return
      el.style.height = 'auto'
      el.style.height = `${el.scrollHeight}px`
    }
    fit()
    window.addEventListener('resize', fit)
    return () => window.removeEventListener('resize', fit)
  }, [draft])
  const commit = () => {
    const title = draft.trim()
    if (title && title !== item.title) update(item.id, (it) => ({ ...it, title }))
    else setDraft(item.title)
  }
  return (
    <h1 className="text-h1">
      <textarea
        ref={ref}
        rows={1}
        aria-label="Title"
        data-testid="item-title"
        value={draft}
        onChange={(e) => setDraft(e.target.value.replace(/\s*\n\s*/g, ' '))}
        onBlur={commit}
        onKeyDown={(e) => {
          if (e.key === 'Enter') {
            e.preventDefault()
            e.currentTarget.blur()
          }
        }}
        className={cn(
          '-mx-2 block w-[calc(100%+16px)] resize-none overflow-hidden rounded-control border border-transparent bg-transparent px-2 py-0.5 text-heading transition-colors',
          'hover:border-border focus:border-input focus:bg-surface',
          item.done && 'text-muted-foreground',
        )}
      />
    </h1>
  )
}

/**
 * Owner (Spec 16): a dropdown of the group's mock members — next to the title on the item's own page, and inline in
 * its parent's list (Simon, 2026-10-09), so a whole project can be delegated from one page.
 */
function OwnerSelect({ item, inline = false }: { item: Item; inline?: boolean }) {
  return (
    <span className={cn('relative', inline && 'z-10 shrink-0')}>
      <select
        data-testid={inline ? 'step-owner' : 'owner-select'}
        aria-label={inline ? `Owner of ${item.title}` : undefined}
        value={item.owner ?? ''}
        onChange={(e) => update(item.id, (it) => ({ ...it, owner: e.target.value || null }))}
        className={cn(
          'appearance-none rounded-control border pl-3',
          inline
            ? 'h-9 w-40 border-border bg-transparent pr-8 text-small hover:border-input sm:w-44'
            : 'h-10 border-input bg-surface pr-9',
          item.owner ? 'text-foreground' : 'text-muted-foreground',
        )}
      >
        <option value="" className="text-foreground">
          No owner
        </option>
        {members.map((m) => (
          <option key={m.id} value={m.id} className="text-foreground">
            {m.id === user.id ? `${m.name} (you)` : m.name}
          </option>
        ))}
      </select>
      <ChevronDown
        aria-hidden
        strokeWidth={1.5}
        className="pointer-events-none absolute top-1/2 right-3 size-4 -translate-y-1/2 text-muted-foreground"
      />
    </span>
  )
}

function SubItems({ item }: { item: Item }) {
  const done = item.children.filter((c) => c.done).length
  return (
    <section className="mt-10">
      <div className="mb-3 flex items-baseline justify-between gap-4">
        <h2 className="text-h3">Steps</h2>
        {item.children.length > 0 && (
          <p className="text-small text-muted-foreground">
            {done} of {item.children.length} done
          </p>
        )}
      </div>
      <ul data-testid="steps" className="divide-y divide-border overflow-hidden rounded-card border border-border bg-surface">
        {item.children.map((child) => (
          <SubItemRow key={child.id} item={child} />
        ))}
        <li>
          <AddItem parentId={item.id} />
        </li>
      </ul>
    </section>
  )
}

/** A sub-item in its parent's list; on narrow screens its count, due date, remove button and owner take a second line. */
function SubItemRow({ item }: { item: Item }) {
  const { done, total } = progress(item)
  return (
    <li
      data-testid="step"
      className="group relative flex min-h-14 flex-wrap items-center gap-x-4 gap-y-1 px-5 py-2 transition-colors hover:bg-hover"
    >
      <Checkbox
        checked={item.done}
        onChange={(d) => update(item.id, (it) => ({ ...it, done: d }))}
        label={`Done: ${item.title}`}
        testId="step-done"
        className="relative z-10"
      />
      <a
        href={href.item(item.id)}
        data-testid="step-link"
        className={cn(
          'min-w-0 flex-1 after:absolute after:inset-0 focus-visible:outline-none',
          'focus-visible:after:outline-2 focus-visible:after:outline-offset-[-3px] focus-visible:after:outline-brand-accent',
          item.done && 'text-muted-foreground line-through',
        )}
      >
        {item.title}
      </a>
      <ChevronRight aria-hidden className="size-5 shrink-0 text-muted-foreground sm:order-last" strokeWidth={1.5} />
      <span className="flex w-full items-center gap-4 pl-[38px] text-small text-muted-foreground sm:w-auto sm:pl-0">
        {total > 0 && (
          <span title={`${done} of ${total} done`}>
            {done}/{total}
          </span>
        )}
        {item.due && <span>{formatDate(item.due)}</span>}
        <button
          type="button"
          data-testid="remove-item"
          aria-label={`Remove ${item.title}`}
          title="Remove"
          onClick={() => setState((s) => ({ ...s, projects: removeItem(s.projects, item.id) }))}
          className="relative z-10 -mx-2 grid size-9 shrink-0 place-items-center rounded-control opacity-0 transition-opacity group-hover:opacity-100 hover:bg-hover hover:text-foreground focus-visible:opacity-100 pointer-coarse:opacity-100"
        >
          <Trash2 aria-hidden className="size-[18px]" strokeWidth={1.5} />
        </button>
        <OwnerSelect item={item} inline />
      </span>
    </li>
  )
}

/** Add a sub-item: a visible field and an Add button that always responds — with an empty field it focuses the field. */
function AddItem({ parentId }: { parentId: string }) {
  const [title, setTitle] = useState('')
  const input = useRef<HTMLInputElement>(null)
  function add(event: FormEvent) {
    event.preventDefault()
    const name = title.trim()
    if (name) {
      update(parentId, (it) => ({ ...it, children: [...it.children, blankItem(name)] }))
      setTitle('')
    }
    input.current?.focus()
  }
  return (
    <form onSubmit={add} className="flex min-h-14 items-center gap-4 px-5 py-2">
      <Plus aria-hidden className="size-[22px] shrink-0 text-muted-foreground" strokeWidth={1.5} />
      <input
        ref={input}
        data-testid="add-item-input"
        aria-label="New step"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        placeholder="Add a step"
        className="h-10 min-w-0 flex-1 rounded-control border border-input bg-surface px-3"
      />
      <Button type="submit" variant="secondary" data-testid="add-item" className="h-10 px-4">
        Add
      </Button>
    </form>
  )
}

function NotFound() {
  return (
    <div className="max-w-item">
      <h1 className="text-h1">Not found</h1>
      <p className="mt-3 text-lead text-muted-foreground">
        This item doesn't exist in this browser (anymore).{' '}
        <a href={href.projects} className="text-foreground underline underline-offset-4">
          Back to My projects
        </a>
      </p>
    </div>
  )
}
