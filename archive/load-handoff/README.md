# load-handoff

Claude Code skill that **bootstraps a sibling session** by invoking the `handoff-loader` subagent and relaying its briefing verbatim.

It's a deterministic shim — no analysis, formatting, or paraphrasing. The subagent scans the parent transcript end-to-end (via read-only Bash), verifies the current state of touched files, and returns an operational briefing that lets the new session start work without re-asking.

> [!Note]
> You normally never type this yourself. The [`handoff`](../handoff) skill launches the sibling pane and runs this command automatically with the right arguments.

## Requirements

- Read access to the parent session's transcript

The `handoff-loader` subagent is **bundled with this skill** (see [Bundled resources](#bundled-resources)) — it's auto-discovered when the skill is installed, so nothing extra is required.

## Usage

```
/load-handoff <parent_session_id> <project_dir> <focus> <task>
```

| Argument | Meaning |
| -------- | ------- |
| `parent_session_id` | UUID of the originating session |
| `project_dir` | Absolute path to the project the parent was working in |
| `focus` | Thread locator the child is picking up (file paths, function names, URLs) |
| `task` | Verb-led action the child should take |

Any empty argument → the skill stops and prints the usage line above.

## How it works

1. **Validate** the four arguments.
2. **Invoke** the `handoff-loader` subagent with the parent coordinates.
3. **Relay** the subagent's response exactly as returned — including an `INSUFFICIENT:` prefix if the transcript didn't yield enough to proceed.

## Bundled resources

- `agents/handoff-loader.md` — the read-only handoff analyst subagent. Scans the parent transcript with read-only shell tools (sidestepping the Read tool's file-size cap) and produces the operational briefing. Bundled here so installing the skill brings the agent with it.
