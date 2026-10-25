# gh-projects

Claude Code skill for planning work in GitHub Projects with the `gh` CLI: set up a repo and board, create epics, stories and tasks as issues, find them by status, priority or date, update them, and change the board's fields, options, sprints and issue forms as your process evolves.

It's model-triggered. The skill fires when you ask to create, list, search, move or update epics, stories, tasks or project items, to set up a project board, or to change a board's fields, statuses, sprints or issue templates.

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
| "Set up this repo for planning" | Runs init: offers the owner's boards (with the repos each covers) or a new one. Joining a board that's set up copies its forms and labels and links this repo. Otherwise it guides you to create a board in the web UI, then adds the fields it's missing, writes the issue forms, creates the labels and links the board to the repo |
| "Create a story under epic #4 for password reset" | Fills the story form's sections, creates the issue under #4 and adds it to the board |
| "Which high priority tasks are due this week?" | Queries the board with `label:task priority:High target:<=@today+7d` and shows a table |
| "Move #12 to In Progress" | Sets Status on the board item |
| "Add a Blocked status" / "Add two more sprints" | Adds the option or iterations, keeping every existing value |

Every change to GitHub is summarized first and waits for a yes. Reads never ask.

## How it works

1. Before each request the skill reads the repo's setup: the kinds from the issue forms in `.github/ISSUE_TEMPLATE/*.yml`, and, with one GraphQL query, the boards linked to the repo with their fields, types and options. Nothing about kinds or fields is hardcoded, so editing a form or adding a field changes what the skill does.
2. A form marks its kind with `labels: [epic]` in a user repo, or `type: Epic` in an org that has that issue type. Its `body` fields are the issue's sections, and required fields are the ones the skill asks for. The CLI ignores forms, so the skill passes the marker itself and writes the body as `### <label>` sections, the same way the web form renders it.
3. Epics, stories and tasks link through sub-issues. The hierarchy is loose: a parent is set when you name one, and nothing is refused for lacking one.
4. Queries use `gh project item-list --query`, which takes the board's own filter syntax.
5. Init onboards a board you already have, or has you create one in the web UI, where you can start from one of GitHub's templates and get its views and workflows. It then reads the board's fields, adds only the defaults it's missing (Status with In Review, Priority, Start and Target, with Estimate and Sprint offered), and asks which kinds you want: Epic, Story and Task, with Bug and Spike offered. It writes the issue forms from your answers and links the board to the repo. Each form gets `projects:`, so issues opened in the web UI land on the board too.
6. Init records the board in the repo's `CLAUDE.md` or `AGENTS.md`: its title, owner, number and ID, and how kinds are marked. Every session then knows the board. Discover still reads the board live and wins if the two disagree. The skill keeps no other state: GitHub's link between repo and board is the rest.

## Bundled resources

- `init.md`: the one-time setup steps. The skill reads it only when you set up a repo.
- `configure.md`: steps for changing the setup later: the board, fields, options, sprints, kinds and forms, and linked repos. Each change counts the items it touches before asking.
- `templates/`: the default issue forms init starts from: `epic.yml`, `story.yml`, `task.yml`, `bug.yml` and `spike.yml`. A repo's own forms always win.
