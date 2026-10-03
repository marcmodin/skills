# handoff

Claude Code skill that spawns a **sibling Claude Code session** in a new [cmux](https://github.com/) pane so you can pursue a tangential task in parallel without losing your current thread.

It's dispatch-only: the skill infers what the child should work on, asks where to open it, then launches the pane. The child runs `/load-handoff`, which does the heavy lifting of reading the parent transcript and assembling a briefing.

> [!Note]
> Requires [cmux](https://github.com/) for pane orchestration. Pairs with the [`load-handoff`](../load-handoff) skill, which the spawned child invokes automatically.

## Requirements

- `cmux` CLI available on `PATH` (provides `identify`, `new-split`, `new-workspace`, `send`)
- The [`load-handoff`](../load-handoff) skill installed (the child session calls it; the `handoff-loader` subagent it depends on is bundled inside that skill)

## Usage

Invoke explicitly — this skill is not model-triggered (`disable-model-invocation: true`):

```sh
/handoff [topic and/or what the child should do]
```

Examples:

| Invocation | Result |
| ---------- | ------ |
| `/handoff` | Infers the most recent coherent workflow and the smallest plausible next step |
| `/handoff write tests for that` | Locates the relevant thread, derives a concrete test task for the child |
| `/handoff migration stuff` | Cross-references recent migration work, hands the child a focused task |

## How it works

1. **Infer** — derive a `focus` (grep-friendly thread locator) and `task` (verb-led action) from your arguments and recent conversation. Asks only on genuine ambiguity.
2. **Place** — ask where the sibling opens: split right, split down, or new tab.
3. **Confirm** — single confirmation gate showing the `focus`/`task` before launch.
4. **Launch** — `scripts/launch-sibling.sh` runs `cmux identify` → `new-split`/`new-workspace` → `send`, starting the child with `/load-handoff <parent_session_id> <project_dir> "<focus>" "<task>"`.

If the launch script fails (non-zero exit), the skill surfaces stderr and prints the commands for you to copy and run manually.

## Bundled resources

- `scripts/launch-sibling.sh` — cmux orchestration; single Bash entrypoint for the launch step. Exit codes: `2` identify failed, `3` split/new-workspace failed, `4` send failed, `64` bad args.
