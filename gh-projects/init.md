# Init

Onboard a repo to a board: learn the conventions of a board that's in use, copy them from a repo already on the board, or set up an empty or new board. Every path ends with the record in the repo. Follow "Confirm every write" in `SKILL.md`.

## Check

1. `gh auth status` must show the `project` scope. If not, ask the user to run `gh auth refresh -s project`.
2. Visibility: `gh repo view --json visibility`. If the repo is public, warn that every issue and the board's contents can be public too.
3. User or org: `gh api users/<owner> --jq .type`. In an org, list its issue types: `gh api graphql -f query='{organization(login:"<owner>"){issueTypes(first:25){nodes{name}}}}'`.
4. If the repo already has a record, ask whether to learn it again or keep it.

## Choose a board

1. List the owner's open boards, with `organization` in place of `user` for an org:
   `gh api graphql -f query='{user(login: "<owner>") {projectsV2(first: 50) {nodes {id number title closed items {totalCount} repositories(first: 20) {nodes {nameWithOwner}}}}}}' --jq '[.data.user.projectsV2.nodes[] | select(.closed | not) | {id, number, title, items: .items.totalCount, repos: [.repositories.nodes[].nameWithOwner]}]'`
2. Present them with the AskUserQuestion tool, plus a new board, labeled like "Roadmap (40 items, api, web)". With more than three, list them in text and ask for a number.
   - Many boards in use cover no repos, so go by item count. Join applies only if a listed repo has a record.
   - Another repo on the board has a record: offer Join, or Learn to read the board afresh.
   - A board with items: Learn. An empty board: Set up.
   - New board: propose a title such as `<repo> planning`. The web UI is the only way to start from GitHub's templates, which bring views and workflows, so give the steps: open `https://github.com/users/<owner>/projects` (`/orgs/<owner>/projects` for an org) → **New project** → pick a template (Team planning or Iterative development for sprints, Kanban for flow, Roadmap for dates) → name it exactly → **Create project**. When they're done, find it: `gh project list --owner <owner> --limit 500 --format json --jq '.projects[] | select(.title == "<title>") | {number, id}'`, taking the highest number if there are several. Then Set up.

## Learn

Learn reads only. Nothing changes until the record is written.

1. Fields: the board query from Discover in `SKILL.md`.
2. README, views and a sample of items with their values:

   ```sh
   gh api graphql -f query='{node(id: "<project id>") {... on ProjectV2 {readme shortDescription views(first: 20) {nodes {name layout filter}}
     items(last: 50) {nodes {fieldValues(first: 20) {nodes {
       ... on ProjectV2ItemFieldSingleSelectValue {value: name field {... on ProjectV2FieldCommon {name}}}
       ... on ProjectV2ItemFieldDateValue {value: date field {... on ProjectV2FieldCommon {name}}}
       ... on ProjectV2ItemFieldNumberValue {value: number field {... on ProjectV2FieldCommon {name}}}
       ... on ProjectV2ItemFieldIterationValue {value: title field {... on ProjectV2FieldCommon {name}}}}}
       content {... on Issue {number title stateReason repository {nameWithOwner} labels(first: 10) {nodes {name}} issueType {name} parent {number}}}}}}}}' \
     --jq '.data.node | {readme, shortDescription, views: .views.nodes, items: [.items.nodes[] | .content + {fields: ([.fieldValues.nodes[] | select(.field) | {(.field.name): .value}] | add), labels: [.content.labels.nodes[]?.name]}]}'
   ```

3. Forms in `.github/ISSUE_TEMPLATE/*.yml` and labels (`gh label list -R <repo>`), of this repo and of each repo the items come from.
4. Bodies: for each kind, the two or three newest issues with `gh issue view <n> --json title,body`.

Infer each line of the record from what the board and its issues show, not from what the skill would prefer:

- **Kinds**: whatever splits items into kinds: a select field such as Level with options like Epic and Story, labels such as `epic`, org issue types, or forms. Two markers used together are joined with `+`. A form counts as a kind even with no items. If no item carries a kind's marker yet, such as a Level option nobody has set, say it's a guess when you ask.
- **Body**: `form <file>` if the kind has a form. Otherwise `like #<n>`, the newest open issue with the shape most of the kind share: the same header line, headings and checklist. For an issue in another repo, write `like <owner>/<repo>#<n>`.
- **Parent**: `under a <Kind>` if most issues of the kind have a parent of that kind.
- **Titles**: a pattern if most titles of a kind share one, such as `CWN-NN <title>`. Otherwise `none`.
- **Status**: map each option by name and description to not started, in progress, in review, blocked or done. Leave out meanings the board has no option for.
- **Priority, Dates, Size, Sprint**: the field holding each, by meaning: P0–P2 or MoSCoW is priority, Size or Estimate is size, an iteration field is sprint. Between two candidates, prefer the one items fill, then a select over a number.
- **Closing**: the reasons closed items use, else `done = completed; dropped = not planned`.
- **Notes**: rules from the README or description that change how items are created or updated. One line each.

Show the record and the gaps in one message. Use AskUserQuestion only where the data is split, such as two possible priority fields. Gaps are where the board breaks its own conventions or lacks something common: items missing their marker or parent, dates in bodies while the date fields are empty, a view filtering on a field items don't fill, no priority or date field. Report them and don't fix them: `configure.md` can align any of them later, if the user wants. Then go to Record.

## Join

Read the other repo's record from its default branch, in `CLAUDE.md` or `AGENTS.md`: `gh api repos/<source>/contents/<file> -H 'Accept: application/vnd.github.raw'`.

- `form <file>` kinds: copy each form from `.github/ISSUE_TEMPLATE/<file>` the same way, skipping any this repo has, and create the labels they use that this repo lacks, with the same color and description (`gh label list -R <source> --json name,color,description`).
- `like #<n>` kinds: rewrite as `like <source>#<n>`.

Then go to Record.

## Set up

For an empty or new board. Text that describes the work goes in an issue form. Anything to filter or sort by goes on the board as a field.

1. Kinds. Existing forms are the kinds, so ask only whether to add or change any. Otherwise show each default with its sections (* = required) to accept or change: Epic (Goal*, Scope, Success measures*, Dependencies and risks), Story (User story*, Acceptance criteria*, Notes and links), Task (What*, Done when), and, off by default, Bug (Steps to reproduce*, Expected*, Actual*, Environment) and Spike (Question*, Timebox*, Outcome). The user can rename, add or remove sections and kinds, and change what's required.
2. Fields. Compare the board with the defaults: Status (Todo, In Progress, In Review, Done), Priority (High, Medium, Low), Start and Target dates, and, off by default, Estimate (number) and Sprint (two-week iterations). Match by meaning: "Start date" is Start, Backlog covers Todo, P0–P2 is a priority. Propose only what's missing, including missing Status options such as In Review. Never rename or remove a field or option.
3. Summarize the forms, labels, fields and the record in one confirmation, then:
   - Fields: as in Fields, Options and Sprints in `configure.md`.
   - Forms: start from `templates/<kind>.yml` in this skill with the user's changes. A new kind gets one `textarea` per section. Add `projects: ["<owner>/<n>"]` after `labels:` so issues opened in the web UI land on the board. Save to `.github/ISSUE_TEMPLATE/<kind>.yml`, never overwriting a file.
   - Markers: if the org has an issue type matching the kind, use `type: <Type>` in place of `labels:`. Otherwise `gh label create <kind>`. "Already exists" is fine. Forms silently drop labels that don't exist.
   - Link the board, so it shows in the repo's Projects tab: `gh project link <n> --owner <owner> --repo <repo>`.

## Record

Use `CLAUDE.md` if it exists, else `AGENTS.md`. Otherwise ask: `CLAUDE.md`, shared with the team, or `CLAUDE.local.md`, only on this machine. Add or replace this section and nothing else. Name fields and options, but don't list a field's options, since Discover reads them:

```markdown
## GitHub project

Planning uses the gh-projects skill. Board: "<title>" (<owner>/<n>, ID <project id>). Follow these conventions, and change the board only when asked.

- Kinds: Epic (Level: Epic, like #4), Story (Level: Story, under an Epic, like #5), Bug (label bug, form bug.yml)
- Titles: Epic "Epic NN <name>", Story "CWN-NN <title>"
- Status: not started = Backlog, Ready; in progress = In progress; in review = In review; done = Done
- Priority: Priority
- Dates: start = Start date, target = Target date
- Size: Estimate
- Sprint: none
- Closing: done = completed; dropped = not planned
- Notes: none
```

Ask the open choices together with the write summary in one AskUserQuestion call, so the answers are the yes: the file, if it isn't settled; how to save (push to the default branch, open a pull request, or leave it uncommitted, which isn't offered with forms, since forms work only on the default branch); and, after Learn or Join, whether to link the board so it shows in the repo's Projects tab (`gh project link`), off by default. After Learn, also offer issue forms for the `like #<n>` kinds, built from their examples as in Align in `configure.md`, off by default. Say how forms differ from the examples. The kinds then use `form <file>` in the record.

Use the message "Record the GitHub project in <file>". Finish by telling the user what was written, what wasn't and why (such as forms the user declined, which `configure.md` can add later), and which gaps are open. If a view doesn't use a new field, such as a roadmap on Start and Target, say which view to adjust in the web UI.
