# handoff

Claude Code mod that hands a task to a new Claude Code session, so you can split work without filling your current session's context.

The new session (the child) starts in a herdr pane, a herdr tab or as a background session. It gets either a brief written from your conversation or a full fork of it.

## Requirements

- Claude Code with mods (built and tested on 2.1.288)
- [herdr](https://github.com/herdrdev/herdr) for the pane and tab options. The mod offers them only when Claude Code runs inside a herdr pane (`HERDR_PANE_ID` is set). Anywhere else you get background sessions only.

## Install

From the marketplace in this repo:

```sh
claude plugin marketplace add marcmodin/skills
claude plugin install handoff@marcmodin
```

To run it from a checkout instead, start Claude Code with `claude --plugin-dir mods/handoff` and run `/reload-plugins` after each edit.

## Usage

```sh
/handoff <task>
```

Starts the child at once with the defaults: a brief, in a new herdr pane (or a background session outside herdr).

```sh
/handoff
```

Opens the picker:

| Control | What it does |
| ------- | ------------ |
| Task | What the child should do. Leave it blank and the brief infers it from the conversation. |
| Brief | The child gets a handoff brief written from this conversation. Default. |
| Full fork | The child gets a copy of the whole conversation. |
| New pane / New tab | Starts the child in herdr, in its own worktree |
| Background | Starts a `claude --bg` session |
| Copy brief | Writes the brief and copies it to the clipboard, starts nothing |

Children are named `ho-<task>-<4 chars>`. Your session gets one hidden line saying the child exists, so it won't work on the same task.

## The band

While a child is starting or running, a box above the prompt shows one row per child:

```
handoff  ho-try-redis-a1b2  idle  4m · w5:p6  [ jump ]  [ compare ]
```

- The state comes from herdr for pane and tab children and from `claude agents` for background ones. It refreshes every 15 seconds.
- `jump` focuses the child's pane. For a background child it opens `claude attach` in a new herdr pane, or copies the command outside herdr.
- `compare` shows once the child is idle or done. It asks this session to message the child for its result and compare it with the work here.

A row goes away when its child exits, or 30 seconds after a failed launch. With no rows the box is gone. To hide it while children run, use the `[-]` in its corner or ctrl+x ctrl+a.

You get a toast when a child finishes, waits on you (a permission prompt, say) or exits.

## Files

- `hooks/register.tsx`: the mod
- `types/index.d.ts`: the state it keeps
- `tests/register.test.tsx`: run with `claude plugin test mods/handoff`
