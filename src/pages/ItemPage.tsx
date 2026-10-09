import { ChevronDown, ChevronRight, Plus, Trash2 } from 'lucide-react'
import { useEffect, useState, type FormEvent } from 'react'
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
          <span className="relative">
            <select
              data-testid="owner-select"
              value={item.owner ?? ''}
              onChange={(e) => update(item.id, (it) => ({ ...it, owner: e.target.value || null }))}
              className="h-10 appearance-none rounded-control border border-input bg-surface pr-10 pl-3"
            >
              <option value="">No owner</option>
              {members.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.id === user.id ? `${m.name} (you)` : m.name}
                </option>
              ))}
            </select>
            <ChevronDown aria-hidden strokeWidth={1.5} className="pointer-events-none absolute top-1/2 right-3 size-4 -translate-y-1/2" />
          </span>
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

/** The title, editable in place. */
function TitleField({ item }: { item: Item }) {
  const [draft, setDraft] = useState(item.title)
  useEffect(() => setDraft(item.title), [item.title])
  const commit = () => {
    const title = draft.trim()
    if (title && title !== item.title) update(item.id, (it) => ({ ...it, title }))
    else setDraft(item.title)
  }
  return (
    <h1 className="text-h1">
      <input
        aria-label="Title"
        data-testid="item-title"
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        onBlur={commit}
        onKeyDown={(e) => e.key === 'Enter' && e.currentTarget.blur()}
        className={cn(
          '-mx-2 w-[calc(100%+16px)] rounded-control border border-transparent bg-transparent px-2 py-0.5 text-heading transition-colors',
          'hover:border-border focus:border-input focus:bg-surface',
          item.done && 'text-muted-foreground',
        )}
      />
    </h1>
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

function SubItemRow({ item }: { item: Item }) {
  const { done, total } = progress(item)
  const owner = members.find((m) => m.id === item.owner)
  return (
    <li data-testid="step" className="group relative flex min-h-14 items-center gap-4 px-5 py-2 transition-colors hover:bg-hover">
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
          'flex-1 after:absolute after:inset-0 focus-visible:outline-none',
          'focus-visible:after:outline-2 focus-visible:after:outline-offset-[-3px] focus-visible:after:outline-brand-accent',
          item.done && 'text-muted-foreground line-through',
        )}
      >
        {item.title}
      </a>
      <span className="flex items-center gap-4 text-small text-muted-foreground">
        {total > 0 && (
          <span title={`${done} of ${total} done`}>
            {done}/{total}
          </span>
        )}
        {owner && <span>{owner.id === user.id ? 'You' : owner.name.split(' ')[0]}</span>}
        {item.due && <span>{formatDate(item.due)}</span>}
      </span>
      <button
        type="button"
        data-testid="remove-item"
        aria-label={`Remove ${item.title}`}
        title="Remove"
        onClick={() => setState((s) => ({ ...s, projects: removeItem(s.projects, item.id) }))}
        className="relative z-10 grid size-9 place-items-center rounded-control text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100 hover:bg-hover hover:text-foreground focus-visible:opacity-100"
      >
        <Trash2 aria-hidden className="size-[18px]" strokeWidth={1.5} />
      </button>
      <ChevronRight aria-hidden className="size-5 text-muted-foreground" strokeWidth={1.5} />
    </li>
  )
}

function AddItem({ parentId }: { parentId: string }) {
  const [title, setTitle] = useState('')
  function add(event: FormEvent) {
    event.preventDefault()
    const name = title.trim()
    if (!name) return
    update(parentId, (it) => ({ ...it, children: [...it.children, blankItem(name)] }))
    setTitle('')
  }
  return (
    <form onSubmit={add} className="flex min-h-14 items-center gap-4 px-5 py-2">
      <Plus aria-hidden className="size-[22px] shrink-0 text-muted-foreground" strokeWidth={1.5} />
      <input
        data-testid="add-item-input"
        aria-label="New step"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        placeholder="Add a step"
        className="h-10 flex-1 rounded-control bg-transparent px-2 -mx-2"
      />
      <Button type="submit" variant="secondary" data-testid="add-item" disabled={!title.trim()} className="h-9 px-4">
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
