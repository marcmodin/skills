# CLAUDE.md

This repo is a collection of personal Claude Code skills. Each top-level subdirectory is one self-contained skill.

## Installing skills

Skills install with the [Skills CLI](https://www.skills.sh/docs/cli), which copies the skill into the local skills directory and registers it. Add every skill in this repo:

```sh
bunx skills add marcmodin/skills
```

Use `npx` instead of `bunx` if you prefer npm. Append a directory name to install one skill (e.g. `marcmodin/skills/handoff`). See the top-level `README.md` for details.

## Adding a new skill

When you add a skill, do all of these before considering the work done:

1. Create the skill directory with a `SKILL.md` (the dispatcher, with `name` and `description` frontmatter). Add any bundled resources the skill needs (scripts, reference docs).
2. Add a `README.md` to the skill directory. Match the structure of the existing ones (`handoff/README.md` is a good template): a one-line summary, requirements, usage with examples, how it works, and bundled resources.
3. Add a row to the Skills table in the top-level `README.md`, in the same order the directory appears.
4. Keep both READMEs consistent with the skill's actual `SKILL.md` description — don't let them drift.

## House style

Prose in this repo (READMEs, SKILL.md bodies, docs) follows the `no-ai-slop` skill's rules: sentence-case headings, straight quotes, no puffery, no AI tells. Read `no-ai-slop/WRITING.md` before writing prose here.
