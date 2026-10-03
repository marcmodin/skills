---
name: load-handoff
description: 'Bootstrap a sibling session by invoking handoff-loader and relaying its briefing verbatim.'
disable-model-invocation: true
allowed-tools: Agent(handoff-loader)
arguments: parent dir focus task
argument-hint: '<parent_session_id> <project_dir> <focus> <task>'
metadata:
  internal: true
---

## Purpose

Launch the `handoff-loader` subagent with the parent's coordinates and relay its briefing verbatim. Deterministic shim — no analysis, formatting, or paraphrasing. Subagent handles transcript I/O directly via read-only Bash.

## Procedure

### Step 1 — Validate args

`$parent` (UUID), `$dir` (absolute path), `$focus` (thread), `$task` (action). Any empty → stop and report: `/load-handoff <parent_session_id> <project_dir> <focus> <task>`.

### Step 2 — Invoke subagent

```
Agent({
  description: "Load operational handoff briefing",
  subagent_type: "handoff-loader",
  prompt: "parent_session_id: $parent\nproject_dir: $dir\nfocus: $focus\ntask: $task\n\nScan the parent transcript end-to-end, verify current state of touched files, and return an operational briefing that lets me start work on `task` without re-asking."
})
```

### Step 3 — Relay verbatim

Print the subagent's response exactly as returned. No paraphrasing, reformatting, or commentary. `INSUFFICIENT:` prefix → print as-is and stop.

## Pitfalls

- **Don't author the briefing here.** The subagent owns scan and synthesis.
- **Don't try to resume the parent session.** Sibling, not continuation.