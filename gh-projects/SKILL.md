---
name: gh-projects
description: Plan work in GitHub Projects with the gh CLI. Onboard a repo to an existing board by learning its conventions, or set up a new one, then create epics, stories and tasks as issues, find them by status, priority or date, update them, and change the board's fields, options, sprints and issue forms as the process evolves. Use when the user asks to create, list, search, move or update epics, stories, tasks or project items, to set up or onboard a project board, or to change a board's fields, statuses, sprints or issue templates.
---

# GitHub Projects

Epics, stories and tasks are issues on a project board. Every board works its own way, so the skill assumes nothing: init learns the board's conventions and records them in the repo, and every action follows that record.

## Discover

Run this from inside the repo's clone. If the current directory isn't a GitHub repo, ask the user which repo and where its clone is.

1. Read the "GitHub project" section in `CLAUDE.md`, `AGENTS.md` or `CLAUDE.local.md`. This is the record. With no record, offer `init` and stop.
2. Read the board only when the request needs more than the record holds: options it doesn't list (such as Priority's), a field's type, sprint IDs, or IDs for `configure.md`. Also read it when a command fails, and before reporting that a query found nothing. Otherwise act straight from the record. To read it:

```sh
gh api graphql -f query='{node(id: "<project id>") {... on ProjectV2 {title number closed fields(first: 50) {nodes {
  ... on ProjectV2FieldCommon {id name dataType}
  ... on ProjectV2SingleSelectField {options {name}}
  ... on ProjectV2IterationField {configuration {iterations {id title startDate}}}}}}}}' \
  --jq '.data.node | {title, number, closed, fields: [.fields.nodes[] | select(.dataType | IN("SINGLE_SELECT","DATE","NUMBER","TEXT","ITERATION"))
    | {id, name, type: .dataType, options: [.options[]?.name], iterations: [.configuration.iterations[]?]}]}'
```

3. Whenever you read the board, check the record against it. If a field or option it names is gone or renamed, or the board is closed, say which line is stale and offer to fix the record. Don't guess around it.

The record says what each field means. The board says which options exist. Use only names from these two. When the user asks for something the record doesn't cover, such as a priority on a board with no priority field, say so and ask. Never fall back to defaults or add a field.

## Record

The record (format in `init.md`) has one line each for kinds, titles, Status, priority, dates, size, sprint, closing and notes. Each kind lists:

- **Marker**: `label <name>`, `type <Type>` (org issue type) or `<Field>: <option>` (a board field).
- **Body**: `form <file>` (an issue form in `.github/ISSUE_TEMPLATE/`) or `like #<n>` (an example issue).
- **Parent**: `under a <Kind>` means it's a sub-issue of one.

A line naming `none` means the board doesn't track it.

## Confirm every write

Before anything that changes GitHub (an issue, label, field value, board, or repo file), show a short summary of every change and wait for a yes. Reads never need a confirmation. One exception: a request that names one field value on one item, such as "set #4's size to S", is its own yes. Creates, body edits, closes and bulk changes always wait.

## Init and Configure

- No record yet: read `init.md` in this skill's directory and follow it.
- Changing the setup (the board, fields, options, sprints, kinds, forms, the record) or aligning the board with common practice: read `configure.md` and follow it.

## Create

1. Body, by the kind's record:
   - `form <file>`: fill the form's sections from what the user said, and ask only for required ones that are missing. Write each as `### <label>`, a blank line, the text, in order, the way the web form renders it. Use `_No response_` for an empty optional section.
   - `like #<n>`: read it with `gh issue view <n> --json body`, adding `-R <owner>/<repo>` for `like <owner>/<repo>#<n>`. Use the same header line keys, headings, heading levels and checklist style, with new content. Never copy its text. Draft every section from what the user said, then list your assumptions and the open questions under the draft. Ask for header values the user didn't give, or leave them blank. A value the record maps to a field, such as a target date, also goes in that field.
2. Title: follow the kind's pattern. For a number, find the highest in use with `gh issue list --state all --search "<prefix> in:title" --json title --limit 200` and add one.
3. Parent: if the kind is `under a <Kind>` or the user named one, check it exists with `gh issue view <n> --json number,title`. For a parent in another repo, add `-R <owner>/<repo>` and pass its full URL to `--parent`. Never guess a number.
4. Steps 4–6 can run as one shell block. Create the issue, with `--label <name>` or `--type <Type>` when that's the marker: `gh issue create --title "<title>" --body-file <file> --parent <n>`. If the command errors, it may still have created the issue. Check with `gh issue list --search "<title>"` before retrying.
5. Add it to the board, which prints its item ID: `gh project item-add <n> --owner <owner> --url <issue url> --format json --jq .id`. "Content already exists" means a board workflow added it already, which is fine.
6. Set the marker field if the kind uses one, then the fields the user gave, one call each:
   `gh project item-edit <n> --owner <owner> --url <issue url> --field "<field>" --value "<option>"`
   `--value` for SINGLE_SELECT and TEXT, `--date YYYY-MM-DD` for DATE, `--number` for NUMBER. For ITERATION, see Sprints in `configure.md`.

## Find

Use the board's filter syntax, the same as the board's search box. Translate the user's words through the record: "high priority" is the record's priority field, "not started" is its not-started options, "this week" is its target field, "what are we working on" is its in-progress options. If that field is empty on most items, say so instead of reporting no results.

```sh
gh project item-list <n> --owner <owner> --limit 500 \
  --query 'level:Story -status:Done priority:High target-date:<=@today+7d' \
  --field Level --field Status --field Priority --field "Target date"
```

Output is tab-separated with no header: type, title, number, repo, item ID, then one column per `--field`. `--format json` can't be combined with `--field`, so don't add it. Add the kind's marker as a `--field` (Labels for label kinds, Type for issue types) to show the kind. Where it's empty, take the kind from the title pattern and mark it as a gap. The parent column is `--field "Parent issue"`.

- Qualifiers: `label:`, `type:`, `status:`, `parent-issue:<repo>#<n>`, `assignee:@me`, `is:open`, `no:<field>` for an empty field, `-` to negate, and any board field: its name in lowercase with spaces as hyphens ("Target date" → `target-date:`). Option names match case-insensitively.
- Quote values with spaces (`status:"In progress"`), and field names with spaces in `--field "Target date"`.
- Dates: `target-date:<@today`, `updated:>@today-7d`. For a range, give the field twice. "Due" or "overdue" means not done, so negate every done option.
- `parent-issue:` returns direct children only. For everything under an epic, also query each child's children.
- A board can cover several repos. Search the whole board by default, and narrow with `repo:<owner>/<repo>` when the user means this repo.
- Show results as a table: number, kind, title, then the fields asked for. On a board covering several repos, write issues as `<owner>/<repo>#<n>`. Give the issue URL when there's one result. Flag rows whose Status disagrees with the issue: open at a done option, or closed at any other.
- To search issue text, use `gh issue list --search "<words>"`.

## Update

- Board fields: `gh project item-edit` by name, as in Create. One field per call. Read the current value first, and drop changes that are already true.
- Title, body or parent: `gh issue edit <n> --title … --body-file … --parent <n>`. `--parent` replaces any existing parent. To edit one section, fetch the body, replace only that section, and write it back.
- Changing kind: swap the marker, then offer to reshape the body to the new kind's, keeping the existing text.
- Close: `gh issue close <n> --reason <reason>`, with the reason the record gives for why it's closing. If Status isn't a done option afterwards, set it to one, dropped work too. Moving an open issue to a done option closes it too. Say so in the confirmation. Reopen: `gh issue reopen <n>`, then ask which Status to set. Reopening leaves it at a done option.
- Bulk changes: list every affected issue in the confirmation.

## Gotchas

- `item-list` returns 30 items by default. Pass `--limit`.
- `type:` works only in orgs. In a user repo, kinds are labels or fields.
- `gh project item-edit` and `gh label create` print nothing on success.
- `item-edit --url --field --value` needs gh 2.102 or later. On older gh, use `--id <item id> --project-id <id> --field-id <id>` with `--single-select-option-id`; get option IDs with the field query in `configure.md`.
- Right after an edit, `item-list --query` can miss the change for a few seconds. To verify a write, wait about 3 seconds, then query.
