# Mods

A mod is a Claude Code plugin whose behaviour lives in a hooks module: one `register(on, options)` entry that hooks the engine's events as functions `($, e, next)`. Each folder here is a complete plugin, listed in this repo's marketplace.

| Mod | What it does |
| --- | --- |
| [handoff](handoff) | `/handoff` hands a task to a new Claude Code session in a herdr pane, tab or background session, and tracks it in a band above the prompt. |

## Install

```sh
claude plugin marketplace add marcmodin/skills
claude plugin install <mod>@marcmodin
```

## Layout

Each mod has:

- `.claude-plugin/plugin.json`: name, version, description
- `hooks/hooks.json`: a `description` and the `modules` list naming the hooks module
- `hooks/register.tsx` (or `.ts`): the module
- `tests/`: one test file per file under `hooks/`, named after it (`register.test.tsx` beside `hooks/register.tsx`)
- `types/index.d.ts`: the mod's contract, when it keeps values in `$.state`
- `README.md`

`types/claude-code.d.ts` is the mod API for the Claude Code version the mods are built against (2.1.288). To refresh it after a Claude Code update, load the `plugin-authoring` skill, which writes that build's `claude-code.d.ts` to a temp folder and names the path, and copy the file here.

## Working on a mod

```sh
claude --plugin-dir mods/handoff     # run it from source; /reload-plugins after edits
claude plugin validate mods/handoff  # check the manifest and module
claude plugin test mods/handoff      # run its tests
tsc -p mods/tsconfig.json            # typecheck every mod against types/
```

Mods load only where function hooks are enabled, and the API may change between Claude Code releases.
