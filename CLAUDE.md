# CLAUDE.md

This repo is a collection of personal Claude Code skills and mods.

- Skills: each top-level folder with a `SKILL.md` is one self-contained skill.
- Mods: each folder under `mods/` is one Claude Code plugin built on function hooks. See `mods/README.md`.
- `archive/` holds retired skills. Nothing there is installed.
- `.claude-plugin/marketplace.json` makes the repo a Claude Code marketplace named `marcmodin`: a `skills` plugin bundling the top-level skills, plus one entry per mod.

## Installing

Skills install with the [Skills CLI](https://www.skills.sh/docs/cli), which copies the skill into the local skills directory and registers it. Add every skill in this repo:

```sh
bunx skills add marcmodin/skills
```

Use `npx` instead of `bunx` if you prefer npm. Append a directory name to install one skill (e.g. `marcmodin/skills/no-ai-slop`). The Skills CLI only finds `SKILL.md` folders, so it skips mods.

Skills and mods both install from the marketplace:

```sh
claude plugin marketplace add marcmodin/skills
claude plugin install skills@marcmodin
claude plugin install handoff@marcmodin
```

See the top-level `README.md` for details.

## Adding a new skill

When you add a skill, do all of these before considering the work done:

1. Create the skill directory with a `SKILL.md` (the dispatcher, with `name` and `description` frontmatter). Add any bundled resources the skill needs (scripts, reference docs).
2. Add a `README.md` to the skill directory. Match the structure of the existing ones: a one-line summary, requirements, usage with examples, how it works, and bundled resources.
3. Add a row to the Skills table in the top-level `README.md`, in the same order the directory appears.
4. Add the directory to the `skills` list of the `skills` plugin in `.claude-plugin/marketplace.json`.
5. Keep both READMEs consistent with the skill's actual `SKILL.md` description — don't let them drift.

## Adding a new mod

Follow the layout in `mods/README.md`, then:

1. Run `claude plugin validate mods/<mod>`, `claude plugin test mods/<mod>` and `tsc -p mods/tsconfig.json`.
2. Add a `README.md` to the mod directory (`mods/handoff/README.md` is the template).
3. Add a row to the Mods table in both `mods/README.md` and the top-level `README.md`.
4. Add an entry to `.claude-plugin/marketplace.json` with `"source": "./mods/<mod>"`.

## House style

Prose in this repo (READMEs, SKILL.md bodies, docs) follows the `no-ai-slop` skill's rules: sentence-case headings, straight quotes, no puffery, no AI tells. Read `no-ai-slop/WRITING.md` before writing prose here.
