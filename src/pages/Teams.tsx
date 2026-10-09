import { Check, Search } from 'lucide-react'
import { useState } from 'react'
import { Button, Card } from '../components/ui'
import { chapter, localGroups, members, myGroup, nationalTeams, user } from '../data/seed'
import { setState, useStore } from '../store'

const mine = localGroups.find((g) => g.id === myGroup)!

/** Teams (Spec 24): a static page — your teams, then what exists in your chapter; people join by applying. */
export function Teams() {
  const [query, setQuery] = useState('')
  const groups = localGroups.filter((g) => g.city.toLowerCase().includes(query.trim().toLowerCase()))

  return (
    <>
      <h1 className="text-h1">Teams</h1>
      <p className="mt-2 text-lead text-muted-foreground">The groups you work with, and the ones you can apply to.</p>

      <section className="mt-10">
        <h2 className="text-h2">Your teams</h2>
        <Card data-testid="my-team" className="mt-4 p-6">
          <h3 className="text-h3">{mine.name}</h3>
          <p className="mt-1 text-small text-muted-foreground">
            Local group in {mine.city} · {members.length} members · you organize it
          </p>
          <ul className="mt-4 flex flex-wrap gap-2">
            {members.map((m) => (
              <li key={m.id} className="flex h-9 items-center rounded-control border border-border px-3 text-small">
                {m.id === user.id ? `${m.name} (you)` : m.name}
              </li>
            ))}
          </ul>
        </Card>
      </section>

      <section className="mt-12">
        <h2 className="text-h2">In your chapter, {chapter}</h2>
        <div className="mt-6 grid items-start gap-8 md:grid-cols-2">
          <div>
            <h3 className="text-h3">Local groups</h3>
            <p className="mt-1 text-small text-muted-foreground">
              Volunteers in one town who meet in person, run events and grow the movement where they live.
            </p>
            <label className="relative mt-4 block">
              <span className="sr-only">Search local groups by city</span>
              <Search aria-hidden strokeWidth={1.5} className="pointer-events-none absolute top-1/2 left-3.5 size-5 -translate-y-1/2 text-muted-foreground" />
              <input
                type="search"
                data-testid="city-search"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search by city"
                className="h-11 w-full rounded-control border border-input bg-surface pr-4 pl-11"
              />
            </label>
            <ul className="mt-3 divide-y divide-border rounded-card border border-border bg-surface">
              {groups.map((g) => (
                <li key={g.id} data-testid="local-group" className="flex min-h-16 items-center gap-4 px-5 py-3">
                  <div className="flex-1">
                    <p className="font-semibold">{g.name}</p>
                    <p className="text-small text-muted-foreground">
                      {g.city} · {g.members} members
                    </p>
                  </div>
                  {g.id === myGroup ? <span className="text-small text-muted-foreground">Your group</span> : <ApplyButton id={g.id} />}
                </li>
              ))}
              {groups.length === 0 && (
                <li className="px-5 py-4 text-small text-muted-foreground">No local group in that city yet.</li>
              )}
            </ul>
          </div>

          <div>
            <h3 className="text-h3">National teams</h3>
            <p className="mt-1 text-small text-muted-foreground">
              Volunteers from all over {chapter.replace('PauseAI ', '')} who run one job for the whole chapter, mostly online.
            </p>
            <ul className="mt-4 divide-y divide-border rounded-card border border-border bg-surface">
              {nationalTeams.map((t) => (
                <li key={t.id} data-testid="national-team" className="flex items-center gap-4 px-5 py-3.5">
                  <div className="flex-1">
                    <p className="font-semibold">{t.name}</p>
                    <p className="text-small text-muted-foreground">{t.description}</p>
                  </div>
                  <ApplyButton id={t.id} />
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>
    </>
  )
}

function ApplyButton({ id }: { id: string }) {
  const { applied } = useStore()
  const done = applied.includes(id)
  return (
    <Button
      variant="secondary"
      data-testid={`apply-${id}`}
      disabled={done}
      onClick={() => setState((s) => ({ ...s, applied: [...s.applied, id] }))}
      className="h-9 px-4 disabled:cursor-default disabled:opacity-100"
    >
      {done ? (
        <>
          <Check aria-hidden className="size-4" strokeWidth={2} />
          Applied
        </>
      ) : (
        'Apply'
      )}
    </Button>
  )
}
