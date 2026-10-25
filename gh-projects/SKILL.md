---
name: gh-projects
description: Plan work in GitHub Projects with the gh CLI. Set up a repo and board, create epics, stories and tasks as issues, find them by status, priority or date, update them, and change the board's fields, options, sprints and issue forms as the process evolves. Use when the user asks to create, list, search, move or update epics, stories, tasks or project items, to set up a project board, or to change a board's fields, statuses, sprints or issue templates.
---

# GitHub Projects

Epics, stories and tasks are issues. Sub-issues link them, and a project board linked to the repo holds Status, Priority and dates. The skill hardcodes no schema. Read it from the repo every time.

## Discover

Run this from inside the repo's clone, before any other step. If the current directory isn't a GitHub repo, ask the user which repo and where its clone is. It returns the repo, its owner, and each linked board with its fields, types and options:

```sh
gh api graphql -F owner='{owner}' -F name='{repo}' -f query='
query($owner: String!, $name: String!) { repository(owner: $owner, name: $name) {
  nameWithOwner owner { login }
  projectsV2(first: 10) { nodes { id number title closed fields(first: 50) { nodes {
    ... on ProjectV2FieldCommon { id name dataType }
    ... on ProjectV2SingleSelectField { options { name } }
    ... on ProjectV2IterationField { configuration { iterations { id title startDate } } } } } } } } }' \
  --jq '.data.repository | {repo: .nameWithOwner, owner: .owner.login, boards: [.projectsV2.nodes[] | select(.closed | not)
    | {id, number, title, fields: [.fields.nodes[] | select(.dataType | IN("SINGLE_SELECT","DATE","NUMBER","TEXT","ITERATION"))
    | {id, name, type: .dataType, options: [.options[]?.name], iterations: [.configuration.iterations[]?]}]}]}'
```

- **Kinds** come from the issue forms in `.github/ISSUE_TEMPLATE/*.yml`. A form's `name` is the kind, and `labels:` or `type:` marks it. Each `body` element except `type: markdown` is a section: its `attributes.label` is the heading, and `validations.required` says whether it must be filled.
- **Board**: the "GitHub project" section in `CLAUDE.md` or `AGENTS.md` names this repo's board. Use it to pick the board when several are linked. If Discover disagrees (renamed, unlinked, or missing), trust Discover and offer to update the section.
- **Fields** are whatever Discover returns. Use only those names, types and options.
- No issue forms, or no linked board: offer `init`, which can add this repo to a board the owner already has. If several boards are linked, ask which one.

## Confirm every write

Before anything that changes GitHub (an issue, label, field value, board, or repo file), show a short summary of every change and wait for a yes. Reads never need a confirmation.

## Init and Configure

- Setting up a repo, or Discover found no issue forms or no linked board: read `init.md` in this skill's directory and follow it.
- Changing the setup (the board, fields, options, sprints, kinds, forms or linked repos): read `configure.md` and follow it.

## Create

1. Read the kind's form. Fill its sections from what the user said. Ask only for required sections that are missing.
2. Write the body the way the web form renders it, so CLI and web issues look the same: `### <label>`, a blank line, the text, for each section in order. Use `_No response_` for an empty optional section.
3. If a parent was named, check it exists first: `gh issue view <n> --json number,title`. For a parent in another repo, add `-R <owner>/<repo>`, and pass its full issue URL to `--parent`. When creating a parent and child together, use the number the parent's create command printed. Never guess it.
4. Create the issue with the form's marker, on the board, under the parent:
   `gh issue create --title "<title>" --body-file <file> --label <kind> --project "<board title>" --parent <n>`
   Use `--type <Type>` instead of `--label` when the form says `type:`. The CLI ignores the form, so always pass the marker yourself. If the command errors, it may still have created the issue. Check with `gh issue list --search "<title>"` before retrying.
5. Set board fields one at a time, by the exact names and options from Discover:
   `gh project item-edit <n> --owner <owner> --url <issue url> --field "<field>" --value "<option>"`
   The flag follows the field's type: `--value` for SINGLE_SELECT and TEXT, `--date YYYY-MM-DD` for DATE, `--number` for NUMBER. For ITERATION, see Sprints in `configure.md`.

The hierarchy is loose. Link a parent when the user names one. Don't refuse a task without a story, or a task directly under an epic.

## Find

Use the board's filter syntax, the same as the board's search box:

```sh
gh project item-list <n> --owner <owner> --limit 500 \
  --query 'label:story -status:Done priority:High target:>=@today target:<=@today+14d' \
  --field Labels --field Status --field Priority --field Target
```

Output is tab-separated with no header: type, title, number, repo, item ID, then one column per `--field`. `--format json` can't be combined with `--field`, so don't add it. The kind comes from the Labels column.

- Qualifiers: `label:`, `type:`, `status:`, `parent-issue:<repo>#<n>`, `assignee:@me`, `is:open`, `no:<field>` for an empty field, `-` to negate, and any board field: its name in lowercase with spaces as hyphens ("Target date" → `target-date:`). Option names match case-insensitively.
- Quote values with spaces (`status:"In progress"`), and field names with spaces in `--field "Target date"`.
- Dates: `target:<@today`, `start:>=2026-11-01`, `updated:>@today-7d`. For a range, give the field twice. "Due" or "overdue" means not done, so add `-status:Done`.
- The example uses the default field names. Use the board's own names from Discover.
- `parent-issue:` returns direct children only. For everything under an epic, also query each child's children.
- A board can cover several repos. Search the whole board by default, and narrow with `repo:<owner>/<repo>` when the user means this repo.
- Show results as a table: number, kind, title, then the fields asked for. When the board covers more than one repo, add the repo column and write issues as `<owner>/<repo>#<n>`. Give the issue URL when there's one result.
- To search issue text, use `gh issue list --search "<words>" --label <kind>`.

## Update

- Board fields: `gh project item-edit` by name, as in Create. One field per call.
- Title, body, kind or parent: `gh issue edit <n> --title … --body-file … --add-label … --remove-label … --parent <n>`. `--parent` replaces any existing parent, and takes a full issue URL for a parent in another repo.
- One section: fetch the body, replace only that `### <label>` section, and write it back.
- Changing kind: swap the label, then offer to reshape the body into the new kind's sections, keeping the existing text.
- Close or reopen: `gh issue close <n> --reason completed` / `gh issue reopen <n>`. New boards move closed items to Done by themselves. Reopening leaves Status at Done, so ask which Status to set and set it.
- Bulk changes: list every affected issue in the confirmation.

## Gotchas

- `item-list` returns 30 items by default. Pass `--limit`.
- `type:` works only in orgs. In a user repo, kinds are labels.
- `gh project link`, `gh label create` and `gh project item-edit` print nothing on success.
- `item-edit --url --field --value` needs gh 2.102 or later. On older gh, use `--id <item id> --project-id <id> --field-id <id>` with `--single-select-option-id`; get option IDs with the field query in `configure.md`.
- Discover returns no boards outside a clone, or in a repo that isn't set up. If `CLAUDE.md` names a board, check you're in the right clone before offering `init`.
- Right after an edit, `item-list --query` can miss the change for a few seconds. Re-run before reporting something missing.
