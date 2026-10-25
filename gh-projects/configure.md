# Configure

Change an existing setup: the board, its fields and options, sprints, kinds and their forms, and linked repos. Follow "Confirm every write" in `SKILL.md`.

Before any change, count what it touches: `gh project item-list <n> --owner <owner> --limit 500 --query '<field>:"<option>"'`. Put the count in the confirmation. If items would lose a value, list them and offer to move them to another option first.

Board and field IDs come from Discover. An item's ID is the fifth column of `item-list`. For one field's options with colors and descriptions, or its sprints, query it by ID:

```sh
gh api graphql -f query='{node(id: "<field id>") {
  ... on ProjectV2SingleSelectField {options {id name color description}}
  ... on ProjectV2IterationField {configuration {duration startDay
      iterations {id title startDate duration} completedIterations {id title startDate duration}}}}}'
```

## Board

- Title, description, README, visibility: `gh project edit <n> --owner <owner> --title … --description … --readme … --visibility PRIVATE|PUBLIC`. After a rename, update the "GitHub project" section in each linked repo's `CLAUDE.md` or `AGENTS.md`.
- Another repo: `gh project link <n> --owner <owner> --repo <repo>`. That repo needs its own forms, so offer `init` there.
- Remove a repo: `gh project unlink <n> --owner <owner> --repo <repo>`. Its items stay on the board.

## Fields

- Add: as in `init.md`, step 1 of Write.
- Rename: `gh api graphql -f query='mutation { updateProjectV2Field(input: {fieldId: "<id>", name: "<new name>"}) { clientMutationId } }'`. Values stay. Saved views and filters that use the old name break, so tell the user which to fix.
- Delete: `gh project field-delete --id <id>`. Every item loses its value, and it can't be undone. List the items that have a value.

## Options

Single-select options (Status, Priority, Size) change through one mutation that replaces the whole list, as in `init.md`. Read the options first and pass every one you keep with its `id`, `name`, `color` and `description`.

- Add: insert it where it belongs, without an `id`.
- Rename or recolor: keep the `id`, change the `name` or `color`. Items keep their value.
- Reorder: change the order of the list.
- Remove: leave it out. Items with that option lose their value, so move them first.

## Sprints

The iteration mutation replaces the whole configuration too. Pass `startDate` (the first iteration's start date; the read returns `startDay`, a weekday, instead), `duration`, and every iteration in `iterations` and `completedIterations` with its `id`, then add new ones without an `id`:

```sh
gh api graphql -f query='mutation { updateProjectV2Field(input: {fieldId: "<id>", iterationConfiguration: {
  startDate: "<first start>", duration: 14, iterations: [
    {id: "<id>", title: "Sprint 1", startDate: "<date>", duration: 14},
    ...every existing iteration...,
    {title: "Sprint 4", startDate: "<last start + duration>", duration: 14}]}}) { clientMutationId } }'
```

- Add sprints: continue from the last one, with the same duration.
- Change length: changes future sprints only. Keep the past ones as they are.
- Set an item's sprint: `gh project item-edit --id <item id> --project-id <project id> --field-id <field id> --iteration-id <iteration id>`.

## Kinds and forms

Forms are files in `.github/ISSUE_TEMPLATE/`. Edit them, then commit and push to the default branch, as in `init.md`.

- Add a kind: write a new form with `projects:` and create its label, as in `init.md`. Add it to the kinds in the "GitHub project" section.
- Change sections: edit the form's `body`. A section is a `textarea` element with `id` and `attributes.label`; required means `validations: {required: true}`. Show the YAML diff in the confirmation. Existing issues keep their old body. Offer to reshape them, listing each one.
- Rename a kind: `gh label edit <old> --name <new>` keeps it on every issue. Then update the form's `name` and `labels`, rename the file, and update the kinds in the "GitHub project" section.
- Remove a kind: delete the form. Keep the label, so existing issues keep their kind. Offer to change them to another kind.
