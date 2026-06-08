---
name: excalidraw
description: Create or update Excalidraw diagrams from natural language. Triggers on draw, diagram, visualize, sketch, illustrate, flowchart, architecture diagram, or requests to modify/check an existing diagram.
agent: general-purpose
model: sonnet
allowed-tools: Read, Bash(node ${CLAUDE_SKILL_DIR}/scripts/out/index.js:*), Bash(cat:*)

---

# Excalidraw Diagram Skill

Create an Excalidraw diagram for: $ARGUMENTS

---

## Step 1: Read design reference

MUST read the design reference before constructing any elements. It contains the rules you live by.

```
${CLAUDE_SKILL_DIR}/reference.md
```

## Step 2: Read element format

MUST read the element format. It contains the exact JSON structures you need.

```
${CLAUDE_SKILL_DIR}/elements.md
```

## Step 3: Check current state

MUST check state before creating or updating anything:

```bash
node ${CLAUDE_SKILL_DIR}/scripts/out/index.js status
```

**Decision tree (follow strictly):**

- **Checkpoint exists** -- this is the default path. MUST inspect and build on the existing diagram unless the user explicitly says otherwise:

```bash
node ${CLAUDE_SKILL_DIR}/scripts/out/index.js inspect
```

Output: structured JSON with `shapes`, `arrows`, `texts` arrays including computed bounds, binding targets, and elbow status. Use this to plan updates. Pass a specific checkpoint ID with `inspect <checkpointId>` if needed.

- **No checkpoint** -- fresh start, continue to Step 4.
- **Reset** -- ONLY when the user explicitly says "new diagram", "start fresh", "start over", or "from scratch". Never assume a reset. If in doubt, update the existing diagram. See Step 7.

## Step 4: Construct elements JSON

### Assess abstraction level (C4 model)

Before layout or sizing, decide WHAT LEVEL OF DETAIL you are showing. This uses the **C4 model** (Simon Brown) -- the most important decision, it determines everything downstream.

| C4 Level | What it shows | Density | When to use |
| --- | --- | --- | --- |
| **Context (L1)** | Your system as one box + external actors/systems | Low (3-8) | "How does X fit into the bigger picture?" |
| **Container (L2)** | Deployable units inside the system boundary (services, apps, DBs) | Medium (8-20) | "What are the major pieces and how do they talk?" |
| **Component (L3)** | Internal modules/classes within a single container | High (15-30+) | "How does this service work internally?" |
| **Mixed** | Multiple C4 levels in one diagram -- overview + detail sections | High (20-40+) | Infographics, comparisons, tutorials |

**For non-architecture diagrams** (flowcharts, sequences, infographics): still think in levels. A flowchart has context (the overall process) and detail (individual steps). The level decision drives how much you show and where you draw boundaries.

### Assess complexity

| Complexity | Elements | Camera (4:3) | Approach |
| --- | --- | --- | --- |
| Simple | 3-10 | `800 x 600` | Single layout pattern |
| Medium | 10-30 | `1200 x 900` | 2-3 patterns with dividers |
| Complex | 30+ | `1600 x 1200` | Full Layout & Composition system from reference |

### Build the array

**CRITICAL**: First element MUST be `cameraUpdate`:

```json
{"type":"cameraUpdate","width":800,"height":600,"x":-30,"y":-30}
```

Follow all rules from reference.md -- alignment, spacing, arrow bindings, typography, C4 visual conventions, quality checklist.

**Progressive camera reveal**: For diagrams with 8+ shapes, use 3+ camera positions to reveal sections progressively. Don't just zoom in for the title then zoom out to the full diagram.

**No duplicate elements**: Elements persist across camera changes. NEVER redraw elements when moving the camera -- they already exist on the canvas.

### For updates: delete then replace

Use `delete` pseudo-elements to remove old elements, then add replacements. Never reuse deleted IDs.

```json
[
  {"type":"delete","ids":"id1,id2"},
  ...new elements...
]
```

## Step 5: Upload and open

**CRITICAL**: Pipe JSON via heredoc. MUST NOT use `echo` -- it breaks on quotes and special characters.

```bash
cat <<'EXCALIDRAW_JSON' | node ${CLAUDE_SKILL_DIR}/scripts/out/index.js create -
<elements_json>
EXCALIDRAW_JSON
```

### JSON safety rules

- MUST use **ASCII only** in all string values -- no em dashes, curly quotes, arrows, or other unicode
- Use plain alternatives: `--` not em dash, `->` not arrow, straight quotes only, `...` not ellipsis
- MUST NOT write JSON to a temp file -- always pipe via heredoc

The CLI validates before upload. Errors (missing fields, duplicate IDs) block. Warnings (contrast, small font) print but don't block.

Output: `{ "url": "...", "checkpointId": "..." }` -- auto-opens in browser.

## Step 6: Rollback

Restore a previous version:

```json
[{"type":"restoreCheckpoint","id":"<checkpointId>"}]
```

Check available versions with `status`.

## Step 7: Reset (new diagram only)

Only when user explicitly asks for a new diagram AND a checkpoint exists:

```bash
node ${CLAUDE_SKILL_DIR}/scripts/out/index.js reset
```

Clears all checkpoint history. After reset, continue from Step 4.