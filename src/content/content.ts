// The prototype's content, transcribed word for word from the vault note "Info event template and resources for
// {create volunteer portal prototype prototype for Matilda funding pitch}" by scripts/import_content.py.
import data from './content.json'

/** "How to do this well": plain paragraphs, top to bottom ("Goal: …" first; markdown links inline). A task's guidance is its hint line instead. */
export type Guidance = string[]

/** One kind of item, nested freely: the template is a tree of these. */
export type TemplateNode = {
  id: string
  title: string
  card?: string | null
  guidance?: Guidance
  summary?: string // a sub-project's one line, shown under its title in its parent's list of steps
  hint?: string
  children: TemplateNode[]
}

export type ComingSoon = { id: string; title: string; description: string }

export type ResourceEntry = {
  id: string
  title: string
  url: string | null
  status: string | null
  description: string
  members: boolean
}

export type ResourceGroup = { title: string; entries: ResourceEntry[] }

export const infoEvent = data.template as TemplateNode
export const comingSoon = data.comingSoon as ComingSoon[]
export const resourceGroups = data.resourceGroups as ResourceGroup[]
