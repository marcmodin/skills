---
name: handoff
description: 'Spawn a sibling Claude Code session in a new cmux pane to pursue a tangential task in parallel.'
disable-model-invocation: true
allowed-tools: AskUserQuestion, Bash(${CLAUDE_SKILL_DIR}/scripts/launch-sibling.sh:*)
argument-hint: '[topic and/or what the child should do, or empty to infer]'
metadata:
  internal: true
---

## Purpose

Spawn a sibling Claude Code session in a new cmux pane so the user can pursue a tangential task in parallel. The child receives `focus` (the thread it's picking up) and `task` (what to do) as slash-command args, then runs the `handoff-loader` subagent over the full parent transcript to assemble an operational briefing. Heavy lifting happens in the child — this skill is dispatch only.

Session id available as `${CLAUDE_SESSION_ID}`. cmux orchestration lives in `${CLAUDE_SKILL_DIR}/scripts/launch-sibling.sh`.

## Procedure

### Step 0 — Infer `focus` and `task`

Produce two one-line strings (no newlines — they pass through the shell):

- **`focus`** — grep-friendly thread locator. Concrete identifiers (file paths, function names, URLs). Not a topic label.
- **`task`** — verb-led action the child should take. Concrete instruction, not a topic.

Derivation:

1. Parse `$ARGUMENTS`. It may carry both, one, or neither.
2. Cross-reference recent conversation. Match `$ARGUMENTS` to a candidate workflow.
3. Rewrite into the two fields. Examples:
   - `migration stuff` + recent migration 0008 work → `focus: Drizzle migration 0008 — packages/core/src/db/schema.ts`; `task: write a down-migration and verify reversibility`
   - `tests for that` + recent native check sec08-bp01 → `focus: SEC08-BP01 at sources/native/checks/sec08-bp01.ts`; `task: write integration tests for empty-list FAIL and region-unavailable branches`
4. Empty `$ARGUMENTS` → pick the most recent coherent workflow and intuit the smallest plausible next step (test, document, explore alternative, refactor).
5. `AskUserQuestion` only on genuine ambiguity (≥2 equally-weighted workflows, or no recent workflow). Offer 2–3 concrete `focus + task` pairs — never free text.

### Step 1 — Ask pane placement

```
AskUserQuestion({
  questions: [{
    question: "Where should the sibling session open?",
    header: "Pane placement",
    multiSelect: false,
    options: [
      { label: "Split right", description: "cmux new-split right" },
      { label: "Split down",  description: "cmux new-split down" },
      { label: "New tab",     description: "cmux new-workspace" },
      { label: "Cancel",      description: "Abort." }
    ]
  }]
})
```

Cancel → stop. Map answer to placement key: Split right → `right`, Split down → `down`, New tab → `tab`.

### Step 2 — Confirm launch

```
AskUserQuestion({
  questions: [{
    question: "Launch sibling session now (<placement>)?\n\nFocus: <focus>\nTask: <task>",
    header: "Launch?",
    multiSelect: false,
    options: [
      { label: "Launch", description: "Run Launch New Session now." },
      { label: "Print only", description: "Print commands for me to copy." },
      { label: "Cancel", description: "Abort." }
    ]
  }]
})
```

Cancel → stop. Print only → Step 3b.

### Step 3a — Launch via script

`Bash(${CLAUDE_SKILL_DIR}/scripts/launch-sibling.sh <placement-key> ${CLAUDE_SESSION_ID} "<focus>" "<task>")`

Non-zero exit → surface the script's stderr and render Step 3b. Exit codes: `2` cmux identify failed, `3` split/new-workspace failed, `4` cmux send failed, `64` bad args.

### Step 3b — Print-and-copy fallback

Map placement → command (replace `<CURRENT_SURFACE>` with the value from `cmux identify` if known, otherwise leave the placeholder):

- `right` → `cmux new-split right --surface <CURRENT_SURFACE>`
- `down`  → `cmux new-split down --surface <CURRENT_SURFACE>`
- `tab`   → `cmux new-workspace`

Render:

````
## Sibling session ready to launch

**Focus:** <focus>
**Task:** <task>

```sh
<placement command>
cmux send --surface <NEW_SURFACE> "claude '/load-handoff <CLAUDE_SESSION_ID> <project_dir> \"<focus>\" \"<task>\"'\n"
```

Replace `<NEW_SURFACE>` with the id printed by `new-split` / `new-workspace`. The trailing `\n` is required.
````

Stop.

## Pitfalls

- **No load-time shell injection** (bang-backtick pattern). The detector matches inside code spans and aborts skill load. Use Bash tool calls during the procedure.
- **One confirmation gate.** Step 2 is the only gate. Don't loop confirmations after Launch.
- **Always fall back to Step 3b on non-zero exit.** Don't retry the script blindly — surface stderr first.
- **Quote `focus` and `task`.** Both contain spaces; unquoted, the shell splits them across positional args.
- **Don't conflate `focus` and `task`.** `focus` locates the thread; `task` is the new verb-led action.
- **Don't ask when inference is plausible.** Step 0 escalates only on real ambiguity.

## Bundled resources

- `scripts/launch-sibling.sh` — orchestrates `cmux identify` → `cmux new-split`/`new-workspace` → `cmux send`. Captures `pwd` as `project_dir`. Single Bash entrypoint for Step 3a.