# skills

A collection of personal [Claude Code](https://claude.com/claude-code) skills.

Each subdirectory is a self-contained skill with its own `SKILL.md` and `README.md`. See each skill's README for requirements and usage.

## Installation

Install with the [Skills CLI](https://www.skills.sh/docs/cli). To add every skill in this repo:

```sh
bunx skills add marcmodin/skills
```

Prefer npm? Swap `bunx` for `npx`:

```sh
npx skills add marcmodin/skills
```

To add a single skill, append its directory name (e.g. `marcmodin/skills/handoff`).

> [!NOTE]
> Prefix either command with `DISABLE_TELEMETRY=1` to opt out of the CLI's anonymous usage reporting. Drop it if you don't mind the reporting.

## Skills

| Skill | Description |
| ----- | ----------- |
| [excalidraw](./excalidraw) | Create or update hand-drawn Excalidraw diagrams from natural language. Runs as a forked subagent that builds, uploads, and opens the diagram in the browser. |
| [handoff](./handoff) | Spawn a sibling Claude Code session in a new cmux pane to pursue a tangential task in parallel. Dispatch-only — infers the task, asks for pane placement, then launches. |
| [load-handoff](./load-handoff) | Bootstrap a sibling session by invoking the `handoff-loader` subagent and relaying its briefing verbatim. Invoked automatically by `handoff`. |
| [no-ai-slop](./no-ai-slop) | Enforce a plain house style and strip AI tells (puffery, em-dash overuse, the rule of three, AI vocabulary, title-case headings, curly quotes) from any prose. Triggers when writing or editing docs, or on a request to de-slop or humanize text. |

## License

[MIT](./LICENSE)
