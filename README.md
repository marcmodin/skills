# skills

Personal [Claude Code](https://claude.com/claude-code) skills and mods.

Skills sit at the top level, one folder each with a `SKILL.md` and a `README.md`. Mods (Claude Code plugins built on function hooks) live under [`mods/`](./mods). See each README for requirements and usage.

## Installation

### Skills with the Skills CLI

Install with the [Skills CLI](https://www.skills.sh/docs/cli). To add every skill in this repo:

```sh
bunx skills add marcmodin/skills
```

Prefer npm? Swap `bunx` for `npx`:

```sh
npx skills add marcmodin/skills
```

To add a single skill, append its directory name (e.g. `marcmodin/skills/no-ai-slop`). The Skills CLI doesn't install mods.

> [!NOTE]
> Prefix either command with `DISABLE_TELEMETRY=1` to opt out of the CLI's anonymous usage reporting. Drop it if you don't mind the reporting.

### Everything as a Claude Code marketplace

The repo is also a Claude Code plugin marketplace named `marcmodin`. Add it once, then install the skills bundle, any mod, or both:

```sh
claude plugin marketplace add marcmodin/skills
claude plugin install skills@marcmodin    # every skill below
claude plugin install handoff@marcmodin   # one mod
```

## Skills

| Skill | Description |
| ----- | ----------- |
| [excalidraw](./excalidraw) | Create or update hand-drawn Excalidraw diagrams from natural language. Runs as a forked subagent that builds, uploads, and opens the diagram in the browser. |
| [no-ai-slop](./no-ai-slop) | Enforce a plain house style and strip AI tells (puffery, em-dash overuse, the rule of three, AI vocabulary, title-case headings, curly quotes) from any prose. Triggers when writing or editing docs, or on a request to de-slop or humanize text. |

## Mods

| Mod | Description |
| --- | ----------- |
| [handoff](./mods/handoff) | `/handoff` hands a task to a new Claude Code session in a herdr pane, tab or background session, and tracks it in a band above the prompt. |

Retired skills are kept in [`archive/`](./archive) and aren't installed by either method.

## License

[MIT](./LICENSE)
