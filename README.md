# PauseAI volunteer portal — prototype

A clickable prototype of the PauseAI volunteer portal, built for a funding application: a new local organizer creates
an info event from a template, works through it with the template's guidance, and finds the same template under
Resources and their groups under Teams. Front end only; all names and data are fictional.

Live: https://pauseai.github.io/volunteer-portal-prototype/

## Demo state and reset

State lives in the browser's `localStorage` (key `pauseai-volunteer-portal-prototype:v1`); a first visit starts as a
new organizer with no projects. Two ways to reset it:

1. Open the site with `?reset=1`, e.g. https://pauseai.github.io/volunteer-portal-prototype/?reset=1 — the parameter
   clears the state and removes itself from the address bar.
2. The hidden "Reset demo" button in the bottom-right corner (invisible until hovered or focused; `data-testid="reset-demo"`).

## Test ids

For scripted walkthroughs and recordings (`page.get_by_test_id(...)` in Playwright):

| Where | `data-testid` |
|---|---|
| Top bar tabs | `tab-projects`, `tab-resources`, `tab-teams` |
| Banner, its close button | `banner`, `banner-dismiss` |
| My projects: new-project button, curated start card and its link, project cards | `new-project`, `start-card`, `start-info-event`, `project-card` |
| New project: title, template cards, browse toggle, library rows, create | `project-title`, `template-empty`, `template-info-event`, `template-protest`, `browse-templates`, `library-<id>`, `create-project` |
| Item page: title, done, owner, due, from-template link | `item-title`, `done-checkbox`, `owner-select`, `due-input`, `from-template` |
| Guidance block, its toggle | `guidance`, `guidance-toggle` |
| Sub-item rows: row, done box, link, remove | `step`, `step-done`, `step-link`, `remove-item` |
| Add a sub-item: input, button | `add-item-input`, `add-item` |
| Resources: cards, use-template button, template steps | `resource-<id>`, `use-template`, `resource-step` |
| Teams: city search, rows, apply buttons | `city-search`, `local-group`, `national-team`, `apply-<id>` |
| Reset | `reset-demo` |

`scripts/walkthrough.py [url] [out_dir]` drives the whole new-organizer flow at 1440×900 and screenshots every screen.

## Content

The Info event template, the two coming-soon descriptions and the resource list are transcribed word for word from the
vault note "Info event template and resources for {create volunteer portal prototype prototype for Matilda funding
pitch}". After editing the note, regenerate the data file:

```sh
python3 scripts/import_content.py "<path to the note>.md"   # writes src/content/content.json
```

## Develop and deploy

```sh
source ~/.nvm/nvm.sh && nvm use 24   # Vite and Tailwind v4 need a current Node
npm ci
npm run dev        # http://localhost:5173/volunteer-portal-prototype/
npm run build && npm run preview     # the production build on http://localhost:4173/volunteer-portal-prototype/
```

Vite + React + Tailwind v4, hash routing (GitHub Pages has no SPA fallback). Design tokens in `src/index.css`: the
PauseAI website's, inverted to a light theme. Every push to `main` deploys to GitHub Pages
(`.github/workflows/deploy.yml`).
