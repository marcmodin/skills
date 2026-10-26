# gh-projects

Claude Code skill for planning work in GitHub Projects with the `gh` CLI: onboard a repo to a board you already use by learning its conventions, or set up a new one, then create epics, stories and tasks as issues, find them by status, priority or date, update them, and change the board's fields, options, sprints and issue forms as your process evolves.

It's model-triggered. The skill fires when you ask to create, list, search, move or update epics, stories, tasks or project items, to set up or onboard a project board, or to change a board's fields, statuses, sprints or issue templates.

## Requirements

- [`gh`](https://cli.github.com) 2.102 or later, logged in with the `project` scope (`gh auth refresh -s project`).
- A repo the skill runs in. Its boards can belong to a user account or an org.

## Usage

```sh
/gh-projects
```

Examples:

| Invocation | Result |
| ---------- | ------ |
| "Set up this repo for planning" | Runs init: offers the owner's boards (with item counts and repos) or a new one. On a board in use, it learns the conventions from the board and its issues and records them, changing nothing on the board. On an empty or new board, it adds the fields it's missing and writes issue forms |
| "Create a story under epic #4 for password reset" | Writes the story the way the board's stories look: marker, title pattern, body shape and parent, then adds it to the board |
| "Which high priority stories are due this week?" | Translates priority, story and due through the record, queries the board and shows a table |
| "Move #12 to In Progress" | Sets Status on the board item |
| "Add a Blocked status" / "Add two more sprints" | Adds the option or iterations, keeping every existing value, and updates the record |

Every change to GitHub is summarized first and waits for a yes, except a request naming one field value on one item ("set #4's size to S"), which is its own yes. Reads never ask.

## How it works

1. Init writes a record of the board's conventions into the repo's `CLAUDE.md`, `AGENTS.md` or `CLAUDE.local.md`: the board, how each kind is marked (a label, an issue type or a board field such as Level), what its body looks like (an issue form or an example issue), its parent kind, title patterns, what each Status option means, which fields hold priority, dates, size and sprint, and close reasons. The record names fields and options but doesn't copy them.
2. On a board in use, init learns the record from the board's fields, views and README and a sample of its issues, and asks only where the data is split. It reports gaps, such as stories missing their marker or dates written only in bodies, and leaves them for you to align later or not at all. It writes only the record, plus issue forms built from the example issues and a board link if you opt in.
3. On an empty or new board, init offers default kinds (Epic, Story, Task, with Bug and Spike optional) as issue forms, adds the default fields the board lacks (Status with In Review, Priority, Start and Target, with Estimate and Sprint offered), and records them. Each form gets `projects:`, so issues opened in the web UI land on the board too.
4. Before each request the skill reads the record and the board's live fields and options. If something the record names is gone, it says which line is stale. It never falls back to defaults: what the record doesn't cover, it asks about.
5. Epics, stories and tasks link through sub-issues. Queries use `gh project item-list --query`, which takes the board's own filter syntax.

## Bundled resources

- `init.md`: the onboarding steps: Learn, Join, Set up and the record format. The skill reads it only when you onboard a repo.
- `configure.md`: steps for changing the setup later (the board, fields, options, sprints, kinds and forms) and for aligning a board with common practice. Each change counts the items it touches before asking, and keeps the record in step.
- `templates/`: the default issue forms for a new board: `epic.yml`, `story.yml`, `task.yml`, `bug.yml` and `spike.yml`. A repo's own forms always win.
