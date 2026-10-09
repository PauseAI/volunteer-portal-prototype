// Fictional demo data (Spec 6): local group PauseAI Pausetown, national chapter PauseAI Pauseland.

export type Member = { id: string; name: string }

export const user: Member = { id: 'peter', name: 'Peter Pauser' }

/** The members of PauseAI Pausetown: the owner dropdown. */
export const members: Member[] = [
  user,
  { id: 'hannah', name: 'Hannah Halt' },
  { id: 'stan', name: 'Stan Still' },
  { id: 'wendy', name: 'Wendy Wait' },
  { id: 'bruno', name: 'Bruno Brake' },
  { id: 'rosa', name: 'Rosa Rest' },
]

export const myGroup = 'pausetown'
export const chapter = 'PauseAI Pauseland'

export type LocalGroup = { id: string; name: string; city: string; members: number }

export const localGroups: LocalGroup[] = [
  { id: 'pausetown', name: 'PauseAI Pausetown', city: 'Pausetown', members: members.length },
  { id: 'stillwater', name: 'PauseAI Stillwater', city: 'Stillwater', members: 14 },
  { id: 'brakeford', name: 'PauseAI Brakeford', city: 'Brakeford', members: 9 },
  { id: 'haltham', name: 'PauseAI Haltham', city: 'Haltham', members: 4 },
  { id: 'restmoor', name: 'PauseAI Restmoor', city: 'Restmoor', members: 11 },
  { id: 'calmbury', name: 'PauseAI Calmbury', city: 'Calmbury', members: 7 },
]

export type Team = { id: string; name: string; description: string }

export const nationalTeams: Team[] = [
  { id: 'social-media', name: 'Social media team', description: "Adapts Global's posts for Pauseland and runs the chapter's channels." },
  { id: 'outreach', name: 'Outreach team', description: 'Writes to journalists, influencers and organizations through the outreach pipeline.' },
  { id: 'policy', name: 'Policy team', description: "Adapts Global's policy proposals for Pauseland and briefs politicians." },
  { id: 'events', name: 'Events team', description: 'Plans national protests and helps local groups run theirs.' },
]

export const memberName = (id: string | null) => members.find((m) => m.id === id)?.name ?? null
