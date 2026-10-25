# Init

Set up a repo for gh-projects: join a board that's already set up, or set up a board. Run once per repo. Follow "Confirm every write" in `SKILL.md`.

## Check

1. `gh auth status` must show the `project` scope. If not, ask the user to run `gh auth refresh -s project`.
2. Visibility: `gh repo view --json visibility`. If the repo is public, warn that every issue and the board's contents can be public too.
3. User or org: `gh api users/<owner> --jq .type`. In an org, list its issue types: `gh api graphql -f query='{organization(login:"<owner>"){issueTypes(first:25){nodes{name}}}}'`.

## Choose a board

1. List the owner's open boards and the repos each covers, with `organization` in place of `user` for an org:
   `gh api graphql -f query='{user(login: "<owner>") {projectsV2(first: 50) {nodes {number title closed repositories(first: 20) {nodes {nameWithOwner}}}}}}' --jq '[.data.user.projectsV2.nodes[] | select(.closed | not) | {number, title, repos: [.repositories.nodes[].nameWithOwner]}]'`
2. Present the choices with the AskUserQuestion tool, one option per board plus a new board. Label each board with its title and the repos it covers, such as "Sandbox roadmap (gh-projects-sandbox)" or "Sandbox roadmap (no repos)". With more than three boards, list them in text and ask for a number.
   - A board that already covers repos: go to Join.
   - A board with no repos: read its fields (step 4 below), then continue with Ask.
   - New board: steps 3 and 4, then Ask.
3. New board: propose a title, such as `<repo> planning`, and let the user change it. The web UI is the only way to start from GitHub's templates, which bring views and workflows. Give them the steps: open `https://github.com/users/<owner>/projects` (`/orgs/<owner>/projects` for an org) → **New project** → pick a template → name it `<title>` exactly → **Create project**. Suggest a template: Team planning or Iterative development for sprints, Kanban for continuous flow, Roadmap for date-driven work. Anything works, since init adds what's missing. Wait for them to say it's done, then find it: `gh project list --owner <owner> --limit 500 --format json --jq '.projects[] | select(.title == "<title>") | .number'`. If there's more than one, use the highest number, the newest. If there's none, check the title with the user.
4. Read its fields with their types. The board isn't linked yet, so Discover can't see it. Query it by owner:
   `gh api graphql -f query='{user(login: "<owner>") {projectV2(number: <n>) {fields(first: 50) {nodes {... on ProjectV2FieldCommon {name dataType} ... on ProjectV2SingleSelectField {options {name}}}}}}}'`
   Every later step builds on these fields. Items, fields and views already on the board stay as they are. Init only adds what's missing.

## Join

The board is already set up, so this repo takes its setup from a repo the board covers. Ask which one if there are several.

1. Forms (from the source's default branch): list them with `gh api repos/<source>/contents/.github/ISSUE_TEMPLATE --jq '.[].name'`, read each with `gh api repos/<source>/contents/.github/ISSUE_TEMPLATE/<file> -H 'Accept: application/vnd.github.raw'`. Skip any file this repo already has.
2. Kind labels: the labels the forms use (none for forms that use `type:`). Read them with `gh label list -R <source> --json name,color,description`, and create each one this repo lacks with the same color and description.
3. Summarize the forms, labels, link and the Record section in one confirmation, then: link the board (`gh project link <n> --owner <owner> --repo <repo>`), create the labels, write the forms and the Record section, and commit and push them as in step 5 of Write.
4. Tell the user the repo is on the board, and that fields, options and sprints come from the board, so there's nothing else to set up.

## Ask

Text that describes the work goes in an issue form. Anything to filter or sort by goes on the board as a field.

First check what this repo already has: its forms in `.github/ISSUE_TEMPLATE/*.yml` (`name`, `labels` or `type`, `projects`) and its labels (`gh label list`). Existing forms are the kinds. Don't offer defaults for them. Labels that look like kinds but have no form (such as `chore`) are listed too: ask whether each should become a kind.

1. Kinds. If the repo has forms, list them as the kinds and ask only whether to add or change any. Otherwise show each default with its sections (* = required) and ask the user to accept or change it:
   - Epic: Goal*, Scope, Success measures*, Dependencies and risks
   - Story: User story*, Acceptance criteria*, Notes and links
   - Task: What*, Done when
   - Offer, off by default: Bug (Steps to reproduce*, Expected*, Actual*, Environment) and Spike (Question*, Timebox*, Outcome)

   The user can rename, add or remove sections, change what's required, drop kinds, or add their own.
2. Board fields. Compare the board with the defaults: Status (Todo, In Progress, In Review, Done), Priority (High, Medium, Low), Start and Target dates. Offer, off by default: Estimate (number, story points) and Sprint (two-week iterations). Match by meaning, not exact name, and never add a duplicate:
   - Names and options match case-insensitively: "In review" is In Review, "Start date" is Start.
   - Status: any not-started options (Todo, Backlog, Ready) cover Todo. Keep them all.
   - Priority: any existing scale (P0, P1, P2) is Priority. Keep its options.
   - Estimate: a number field or a Size select both count. Sprint: any iteration field.

   Show the user how each default maps to the board's fields, and propose only what's missing.

## Write

Do only what's missing. When the forms, labels and fields all exist, Write is just the link and the Record section. Summarize everything below and the Record section in one confirmation: each form with its sections, the labels, and the fields and options to add.

1. Missing fields only. The project ID is `gh project view <n> --owner <owner> --format json --jq .id`.
   - Status: add only missing options, such as In Review before Done. Never rename or remove an option. The mutation replaces the whole list, so read the current options with their colors and descriptions (`field-list` omits those), then pass every one back unchanged, in order, with the new option inserted:

     ```sh
     gh api graphql -f query='{node(id: "<status id>") {... on ProjectV2SingleSelectField {options {id name color description}}}}'
     gh api graphql -f query='mutation { updateProjectV2Field(input: {fieldId: "<status id>", singleSelectOptions: [
       {id: "<id>", name: "<name>", color: <COLOR>, description: "<description>"},
       ...every existing option, in order...,
       {name: "In Review", color: PURPLE, description: "This item is in review"},
       {id: "<done id>", name: "Done", color: <COLOR>, description: "<description>"}]}) { clientMutationId } }'
     ```

   - Priority: `gh project field-create <n> --owner <owner> --name Priority --data-type SINGLE_SELECT --single-select-options "High,Medium,Low"`
   - Start, Target: `gh project field-create <n> --owner <owner> --name <Start|Target> --data-type DATE`, once each
   - Estimate: `--data-type NUMBER`
   - Sprint: `gh project field-create` can't make iterations. Use GraphQL, starting next Monday:

     ```sh
     gh api graphql -f query='mutation { createProjectV2Field(input: {projectId: "<project id>", dataType: ITERATION, name: "Sprint",
       iterationConfiguration: {startDate: "<YYYY-MM-DD>", duration: 14, iterations: [
         {title: "Sprint 1", startDate: "<YYYY-MM-DD>", duration: 14},
         {title: "Sprint 2", startDate: "<+14 days>", duration: 14},
         {title: "Sprint 3", startDate: "<+28 days>", duration: 14}]}}) { projectV2Field { ... on ProjectV2IterationField { id } } } }'
     ```

2. Link the board to the repo, so Discover finds it: `gh project link <n> --owner <owner> --repo <repo>`.
3. Forms. Start from `templates/<kind>.yml` in this skill and apply the user's changes. A new kind follows the same shape: one `textarea` per section, `required: true` where asked. Add `projects: ["<owner>/<n>"]` on the line after `labels:`, so issues opened in the web UI land on the board too. Save to `.github/ISSUE_TEMPLATE/<kind>.yml`. Never overwrite an existing file.
4. Kind marker. If the org has an issue type matching the kind, replace `labels: [<kind>]` with `type: <Type>`. Otherwise create the label: `gh label create <kind>`. An "already exists" error means it's there, so carry on. Forms silently drop labels that don't exist.
5. Write the Record section below, then commit it with the forms. GitHub only offers forms that are on the default branch, so in the confirmation ask whether to push to it or open a pull request. With a pull request, tell the user the forms take effect once it's merged.

## Record

Write the board into the repo's agent instructions, so every session knows it without looking it up. Use `CLAUDE.md` if it exists, else `AGENTS.md` if it exists, else create `CLAUDE.md`. Add or replace this section, and nothing else in the file:

```markdown
## GitHub project

Planning uses the gh-projects skill. Board: "<title>" (<owner>/<n>, ID <project id>). Kinds are <labels|issue types>: <every kind, comma-separated>.
```

Commit it with the forms, in step 5 of Write or step 3 of Join. With no forms to commit, use the message "Record the GitHub project in <file>".

## Finish

Tell the user what was added. If the board's views don't use a new field yet, such as a roadmap on Start and Target, say which view to adjust in the web UI.
