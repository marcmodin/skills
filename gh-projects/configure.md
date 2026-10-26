# Configure

Change an existing setup: the board, its fields and options, sprints, kinds and their forms, and the record. Or align a board with common practice, when the user asks. Follow "Confirm every write" in `SKILL.md`.

Before any change, count what it touches: `gh project item-list <n> --owner <owner> --limit 500 --query '<field>:"<option>"'`. Put the count in the confirmation. If items would lose a value, list them and offer to move them to another option first.

Every change that renames or removes something the record names, or adds something it should name, updates the record in the same confirmation. Commit the record the way it was saved at init.

Board and field IDs come from Discover. An item's ID is the fifth column of `item-list`. For one field's options with colors and descriptions, or its sprints, query it by ID:

```sh
gh api graphql -f query='{node(id: "<field id>") {
  ... on ProjectV2SingleSelectField {options {id name color description}}
  ... on ProjectV2IterationField {configuration {duration startDay
      iterations {id title startDate duration} completedIterations {id title startDate duration}}}}}'
```

## Board

- Title, description, README, visibility: `gh project edit <n> --owner <owner> --title … --description … --readme … --visibility PRIVATE|PUBLIC`. After a rename, update the record in each repo that has one.
- Show the board in a repo's Projects tab: `gh project link <n> --owner <owner> --repo <repo>`. Another repo still needs its own record, so offer `init` there.
- Remove a repo: `gh project unlink <n> --owner <owner> --repo <repo>`. Its items stay on the board.

## Fields

- Add: `gh project field-create <n> --owner <owner> --name <name> --data-type SINGLE_SELECT|DATE|NUMBER|TEXT`, with `--single-select-options "A,B,C"` for a select. For an iteration field, see Sprints.
- Rename: `gh api graphql -f query='mutation { updateProjectV2Field(input: {fieldId: "<id>", name: "<new name>"}) { clientMutationId } }'`. Values stay. Saved views and filters that use the old name break, so tell the user which to fix.
- Delete: `gh project field-delete --id <id>`. Every item loses its value, and it can't be undone. List the items that have a value.

## Options

Single-select options (Status, Priority, Size) change through one mutation that replaces the whole list. Read the options first, then pass back every one you keep with its `id`, `name`, `color` and `description`, in order. An option left out is removed, and items with it lose their value.

```sh
gh api graphql -f query='mutation { updateProjectV2Field(input: {fieldId: "<field id>", singleSelectOptions: [
  {id: "<id>", name: "<name>", color: <COLOR>, description: "<description>"},
  ...every option you keep, in order...,
  {name: "In Review", color: PURPLE, description: "This item is in review"}]}) { clientMutationId } }'
```

- Add: insert it where it belongs, without an `id`.
- Rename or recolor: keep the `id`, change the `name` or `color`. Items keep their value.
- Reorder: change the order of the list.
- Remove: leave it out. Move its items first.

## Sprints

Create an iteration field with GraphQL, starting next Monday:

```sh
gh api graphql -f query='mutation { createProjectV2Field(input: {projectId: "<project id>", dataType: ITERATION, name: "Sprint",
  iterationConfiguration: {startDate: "<YYYY-MM-DD>", duration: 14, iterations: [
    {title: "Sprint 1", startDate: "<YYYY-MM-DD>", duration: 14},
    {title: "Sprint 2", startDate: "<+14 days>", duration: 14},
    {title: "Sprint 3", startDate: "<+28 days>", duration: 14}]}}) { projectV2Field { ... on ProjectV2IterationField { id } } } }'
```

Changing one replaces the whole configuration. Pass `startDate` (the first iteration's start date; the read returns `startDay`, a weekday, instead), `duration`, and every iteration in `iterations` and `completedIterations` with its `id`, then add new ones without an `id`, the same way as `updateProjectV2Field` with `iterationConfiguration`.

- Add sprints: continue from the last one, with the same duration.
- Change length: changes future sprints only. Keep the past ones as they are.
- Set an item's sprint: `gh project item-edit --id <item id> --project-id <project id> --field-id <field id> --iteration-id <iteration id>`.

## Kinds and forms

Forms are files in `.github/ISSUE_TEMPLATE/`. Edit them, then commit and push to the default branch.

- Add a kind: pick its marker and body with the user. For a form, write it as in Set up in `init.md`, with `projects:`, and create its label. Add the kind to the record.
- Change sections: edit the form's `body`. A section is a `textarea` element with `id` and `attributes.label`; required means `validations: {required: true}`. Show the YAML diff in the confirmation. Existing issues keep their old body. Offer to reshape them, listing each one.
- Rename a kind: `gh label edit <old> --name <new>` keeps it on every issue, or rename the field option. Update the form and the record.
- Remove a kind: delete the form and the kind's line in the record. Keep the label or option, so existing issues keep their kind. Offer to change them to another kind.

## Align

Only when the user asks, such as after init reported gaps. Offer one change at a time, say what it does to the team's way of working, and default to leaving the board as it is.

- Missing markers or parents: list the items and the value to set, then set each with `item-edit` or `gh issue edit --parent`. `--parent` works on closed issues too. A parent named in a body header is a good proposal, listed per issue.
- Dates written in bodies: copy them to the date fields, listing each item and date. Leave the bodies as they are.
- A form for a `like #<n>` kind, so issues opened in the web UI get the same shape: build its sections from the example's headings and header-line keys, show it, then write it and change the kind's body in the record to `form <file>`. Forms always render `### <label>` headings, so say how that differs from the example. A form can't set a board field, so for a kind marked by one, say that issues opened in the web UI arrive without it.
- A missing field the user wants, such as priority or dates: add it as in Fields and add it to the record.
