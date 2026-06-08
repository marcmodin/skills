# Excalidraw Design Reference

You take immense pride in your diagrams. Every element placement, every arrow path, every font choice reflects your obsession with clarity and visual precision. A sloppy diagram is a personal failure.

---

## Design Philosophy

**Diagrams should ARGUE, not DISPLAY.** You don't just arrange boxes -- you build visual arguments that reveal structure, causality, and flow.

**The Isomorphism Test**: If you removed all text, would the structure alone communicate the concept? If not, redesign. You refuse to ship diagrams that fail this test.

**The Education Test**: Could someone learn something concrete from this diagram, or does it just label boxes? Include evidence artifacts -- real code snippets, actual data formats, concrete event names. Generic placeholders are beneath you.

**C4 Model**: Architecture diagrams use the C4 model (Simon Brown). Every shape label shows name + technology: `"API Gateway\n[Kong / HTTPS]"`. Every arrow describes what travels the path: `"REST/JSON"`, `"events [Kafka]"`, `"SQL/TCP"`. This turns generic boxes-and-arrows into concrete, educational system maps.

---

## Visual Patterns

Choose the pattern that mirrors each concept's behavior. Each major concept should use a different pattern.

| If the concept... | Use this pattern |
| --- | --- |
| Spawns multiple outputs | **Fan-out** -- radial arrows from center |
| Combines inputs into one | **Convergence** -- funnel, arrows merging |
| Has hierarchy/nesting | **Tree** -- lines + free-floating text |
| Is a sequence of steps | **Timeline** -- line + dots + labels |
| Loops or improves continuously | **Spiral/Cycle** -- arrow returning to start |
| Transforms input to output | **Assembly line** -- before -> process -> after |
| Compares two things | **Side-by-side** -- parallel with contrast |
| Has ordered interactions between actors | **Sequence** -- vertical lifelines + horizontal arrows. Group messages into phases with background zones |
| Separates into phases | **Gap/Break** -- visual whitespace between sections |
| Has decisions/branches | **Flowchart** -- vertical spine + horizontal branches. Group phases with background zones |

**No uniform card grids.** If every concept is the same-sized rectangle in a row, you're displaying, not arguing.

### Pattern Examples

```
Fan-out:               Convergence:            Cycle:
        o target         o input \                [] -> []
       /                 o input -> <> -> []      ^     |
  [] -> o target         o input /                [] <- []
       \
        o target

Assembly line:                    Sequence:
  [raw] -> [process] -> [result]    A     B     C
                                    |---->|     |
                                    |     |---->|
                                    |     |<----|
                                    |<----|     |

Timeline/Tree (lines + free-floating text, not boxes):
  o--- Label 1         |
  |                    +-- item
  o--- Label 2        |  +-- sub
  |                    |  +-- sub
  o--- Label 3        +-- item
```

---

## Container Discipline

**Default to free-floating text.** Add containers only when needed.

| Use a Container When... | Use Free-Floating Text When... |
| --- | --- |
| Arrows need to connect to it | It's a label or description |
| Shape carries meaning (diamond = decision) | It describes something nearby |
| It represents a distinct system component | It's a title, subtitle, or annotation |

**Target**: <30% of text elements should be inside containers.

---

## Typography System (CRITICAL)

| Level | fontSize | strokeColor | Use for |
| --- | --- | --- | --- |
| Title | 28-32 | `#1e1e1e` | Diagram title, main heading |
| Section heading | 22-24 | `#1e1e1e` | Section labels, group titles |
| Shape label | 18-20 | `#374151` (light fills) / `#ffffff` (dark fills) | Text inside shapes |
| Inline label | 16-18 | `#374151` | Arrow labels, small annotations |
| Detail/annotation | 16-17 | `#757575` | Supporting detail, metadata |

### Text Rules

- **HARD RULE -- Minimum fontSize depends on camera size** (violating makes text unreadable):
  - 800 x 600: min 16px body, 28px title
  - 1200 x 900: min 18px body, 28px title
  - 1600 x 1200: min 21px body, 28px title
  - Choose camera FIRST, then scale ALL fonts to meet the floor. No exceptions.
- Free-floating text on white canvas: dark strokeColor (`#1e1e1e`, `#374151`, or `#757575`)
- **Never use blue or saturated colors for standalone text** -- use `#1e1e1e` for headings, `#757575` for annotations
- **Labels inside light-colored shapes: MUST use `#374151`** (not `#1e1e1e`) / dark shapes: `#ffffff`
- **Never use opacity < 100 on text elements**
- **ASCII only** -- no em dashes, curly quotes, arrows, or unicode. Use `--` not `---`, `->` not arrows, `"` not curly quotes, `...` not ellipsis
- The CLI auto-computes `width` and `height` for standalone text elements

---

## Color Palette

See elements.md for the full palette. Key semantic mappings:

| Hex | Semantic use |
| --- | --- |
| `#a5d8ff` | Primary, input, **people (C4)** |
| `#b2f2bb` | Success, start |
| `#ffd8a8` | Warning, pending |
| `#d0bfff` | Processing |
| `#ffc9c9` | Error, end |
| `#fff3bf` | Decisions |
| `#c3fae8` | Storage, data |
| `#e9ecef` | **External actor/system (C4)** -- gray = outside your system |
| `#1e293b` | Evidence artifact backgrounds (dark) |
| `#334155` | Evidence artifact stroke |
| `#22c55e` | Code/data text on dark backgrounds |

Background zones: `"opacity": 20` (subtle) to `35` (visible). **Never opacity < 100 on text.** Zone colors MUST come from the palette -- no custom hex codes.

---

## Layout & Composition

Mix section types for visual interest. Each section is a "module" stacked vertically with dashed dividers.

### Section Layout Patterns

**Hero banner** -- full-width horizontal pipeline at the top. Use `ellipse` for start/end terminals.

**Numbered assembly line** -- horizontal boxes with step numbers (fontSize 28) above, 3-line descriptions below.

**Text-left / diagram-right** -- text column ~350px, diagram column ~310px with background zone.

**Side-by-side cards** -- columns with heading + content in background zones. 60px+ gap between columns.

**Fan-out from router** -- central element branching to multiple targets. Direction (right, down, radial) depends on context, but **no arrow may cross through intermediate shapes**. If targets are in a grid, place the router at the edge so all arrows have a clear path. Restructure layout rather than routing arrows through boxes.

**Convergence with diamond** -- multiple inputs merging through a decision/merge diamond.

### Hierarchy Through Scale

| Level | Size | Use for |
| --- | --- | --- |
| Hero | 300x150 | Visual anchor, most important element |
| Primary | 180-200x70 | Main process steps |
| Secondary | 120-150x60 | Supporting elements |
| Small | 80-110x60 | Minor details, terminal nodes |

**HARD RULE: Minimum shape height is 60px** for any labeled shape. No exceptions -- 35px or 45px boxes render as unreadable slivers.

Most important element gets 200px+ whitespace around it.

### Shape Meaning

| Concept | Shape |
| --- | --- |
| Process, action, step | `rectangle` (roundness 3) |
| Decision, merge, condition | `diamond` |
| Start, trigger, terminal | `ellipse` |
| Background zone / phase grouping | `rectangle` (opacity 20-35) |
| System boundary (C4) | `rectangle` (opacity 25, strokeStyle `"dashed"`) -- wraps internal components, label at top-left identifies the system |
| External system (C4) | `rectangle` (roundness 3, backgroundColor `#e9ecef`, fill solid) -- gray = outside your boundary |
| Person / human actor (C4) | `ellipse` (backgroundColor `#a5d8ff`, fill solid) -- label: `"Admin\n[Person]"` |
| Container / component (C4) | `rectangle` (roundness 3, colored fill) -- label: `"Service Name\n[Technology]"` |

### Section Dividers

```json
{"type":"arrow","id":"div1","x":40,"y":460,"width":1060,"height":0,
 "points":[[0,0],[1060,0]],"strokeColor":"#d0d0d0","strokeWidth":1,
 "endArrowhead":null,"strokeStyle":"dashed"}
```

### Default Structure (ALL diagrams)

Every diagram starts with this regardless of type or complexity:

1. **Title** (28-32px, `#1e1e1e`) -- centered over the content area
2. **Subtitle** (17-22px, `#757575`) -- one line describing what the diagram shows

### Spacing System

Consistent breathing room is non-negotiable. Cramped diagrams look amateur.

| Space | Size | Use |
| --- | --- | --- |
| Canvas margin | 40px | Padding from camera edges to outermost content |
| Section gap | 80-100px | Vertical space between major sections (includes divider) |
| Column gap | 60-80px | Horizontal space between columns |
| Row gap | 60-80px | Vertical space between grid/bento rows |
| Zone padding | 20-30px | Inside background zones to their content |
| Element gap | 50px min | Between shapes in a flow (see Alignment section) |

### Layout Primitives

Use these to structure any diagram. Pick the primitive that fits the content, then fill each region with section patterns.

**Single column** -- full content width, sections stacked vertically. Default for simple flows and pipelines.

```
|<-- margin -->|<-------- content -------->|<-- margin -->|
               |  [ section 1, full width ]|
               |  --- divider ---          |
               |  [ section 2, full width ]|
```

`contentWidth = cameraWidth - 2 * margin`

**Two column (50/50)** -- equal split. Good for comparisons, before/after.

```
|<- m ->|<-- col1 -->|<- gap ->|<-- col2 -->|<- m ->|
```

`colWidth = (contentWidth - gap) / 2`

**Two column (30/70)** -- sidebar + main. Good for text-left/diagram-right or legend + content.

```
|<- m ->|<- 30% ->|<- gap ->|<---- 70% ---->|<- m ->|
```

`col1 = contentWidth * 0.3 - gap/2`, `col2 = contentWidth * 0.7 - gap/2`

**Three column** -- equal thirds. Good for tier comparisons, feature breakdowns.

```
|<- m ->|<- col1 ->|<- g ->|<- col2 ->|<- g ->|<- col3 ->|<- m ->|
```

`colWidth = (contentWidth - 2 * gap) / 3`

**Grid (NxM)** -- uniform cells in rows and columns. Good for categories, icon grids.

```
|<- m ->|[ cell ][ cell ][ cell ]|<- m ->|
        |[ cell ][ cell ][ cell ]|
```

`cellWidth = (contentWidth - (cols-1) * gap) / cols`
`cellHeight` = consistent per row. Wrap to next row after N columns.

**Bento** -- mixed-size cells on a grid. Some cells span 2 columns or 2 rows. Good for dashboards, infographics with varied content density.

```
|<- m ->|[-- wide cell (2x1) --][ cell ]|<- m ->|
        |[ cell ][ cell ][- tall (1x2) -]|
        |[ cell ][ cell ]|               |
```

Define a base `unit = (contentWidth - (maxCols-1) * gap) / maxCols`. Cells are 1x1, 2x1, 1x2, or 2x2 units. Always align to the grid.

### Composing Layouts

Combine a layout primitive with section patterns to build the full diagram.

Example -- **Infographic** (single column with mixed sections):

1. Title + subtitle
2. --- divider ---
3. Hero banner (assembly line)
4. --- divider ---
5. Two-column section (fan-out left, cards right)
6. --- divider ---
7. Numbered assembly line

Example -- **System design** (single column, background zones per row):

1. Title + subtitle
2. --- divider ---
3. Zone 1: input pipeline (horizontal flow)
4. Zone 2: processing pipeline (horizontal flow, elbow from above)
5. Zone 3: output pipeline (horizontal flow, elbow from above)

Example -- **Bento overview** (mixed grid):

1. Title + subtitle
2. --- divider ---
3. Wide hero cell (2x1) + summary cell (1x1)
4. Three equal cells (1x1 each) for details
5. Tall cell (1x2) for vertical flow + two stacked cells (1x1)

---

## Multi-Zoom Architecture

- **Level 1 -- Summary flow**: High-level pipeline at top (hero banner)
- **Level 2 -- Section boundaries**: Background zones (opacity 20-35) grouping related components
- **Level 3 -- Detail**: Evidence artifacts, annotations, concrete examples inside each section

Use `cameraUpdate` pseudo-elements to guide the viewer through zoom levels.

---

## Design Process

1. **Assess depth** -- Simple overview or comprehensive technical diagram?
2. **Research** -- Look up actual specs, data formats, event names. Use real terminology.
3. **Map concepts to patterns** -- Each concept gets a different visual pattern.
4. **Plan composition** -- Which section layouts? Sketch the vertical flow.
5. **Generate JSON**

---

## Alignment and Spacing (CRITICAL)

Misaligned boxes and inconsistent spacing betray amateur work. You notice these things instantly and they bother you.

### Consistent Box Sizes

- All boxes in a horizontal flow: same `width`, `height`, and `y` value
- Pick one standard size per flow -- never mix unless semantically different. Size to the widest label, not each label individually.
- Same-role elements should have matching dimensions throughout the diagram

### Sequential Flow Direction

**Never use a 2x2 grid for sequential processes.** A sequence has one reading direction -- left-to-right, top-to-bottom, or serpentine. A 2x2 grid makes flow ambiguous (Z-pattern? clockwise? column-first?).

- **Short sequence (3-5 steps)**: single horizontal or vertical line
- **Long sequence (6+ steps)**: serpentine -- left-to-right on row 1, right-to-left on row 2, with a clear turn arrow connecting the rows
- **Parallel processes**: side-by-side columns or rows, not grids

### Spacing

- Minimum 50px gap between shapes
- Formula: `nextBox.x = prevBox.x + prevBox.width + gap`
- Example (200px wide, 50px gaps): x=60, x=310, x=560, x=810

### Preventing Text Overlap

- Description text below boxes must fit within the box's column width
- Max 3 short lines (~20-25 chars each)
- Estimate: `chars x fontSize x 0.6` -- must not exceed box width
- **Text inside a background zone MUST fit within zone boundaries.** Text that bleeds into adjacent zones creates visual confusion. If content is wide, shorten the text, use 2-line wrapping, or widen the zone.
- Side-by-side sections: 60px+ horizontal gap
- Evidence artifact labels must fit inside container

---

## Arrows (CRITICAL)

Arrows are the soul of a diagram. A bad arrow -- one that crosses unrelated content, spans the full width, or connects things without a runtime relationship -- ruins everything.

### Bindings (MANDATORY)

MUST use `startBinding` and `endBinding` on every arrow. Unbound arrows are structurally broken -- they don't track when elements move. The ONLY exception is section dividers (decorative dashed lines).

Before emitting ANY arrow, verify:

1. `startBinding.elementId` matches an actual shape ID in your diagram
2. `endBinding.elementId` matches an actual shape ID in your diagram
3. If you renamed a shape, update ALL arrows referencing the old ID

Arrow `points` = `[[0,0],[dx,dy]]` relative to the arrow's `x,y` origin.

### Arrow Types by Meaning

| Relationship | Style |
| --- | --- |
| Data flow (runtime) | Solid, `strokeWidth: 2` |
| Management/control | Dashed, `strokeWidth: 1` |
| Reference/binding | No arrow -- use text annotation |

**Arrow test**: Does data or a signal actually travel this path at runtime? If no, use proximity or annotation.

**C4 relationship labels**: On architecture diagrams, arrow labels describe what travels the path and the protocol: `"REST/JSON"`, `"events [Kafka]"`, `"SQL/TCP"`. Use short labels (2-4 words max). Don't just show top-down tree structures -- real systems have lateral/inter-service communication.

### Choosing Arrow Routing

| Scenario | Type | How |
| --- | --- | --- |
| Same row or column | **Straight** | 2 points: `[[0,0],[dx,0]]` or `[[0,0],[0,dy]]` |
| Adjacent, one turn, no obstacles | **Elbow** | `elbowed: true` with 2 points |
| Dense diagram, must avoid crossings | **Manual multi-point** | 3-4 explicit points |
| 3+ arrows to same distant target | **Hub** | Route through intermediary node |

**Prefer straight arrows** -- align elements to make this possible.

### Horizontal Flow Example

```json
// 3 boxes: 200x80, y=150, gap=100
{"type":"rectangle","id":"b1","x":100,"y":150,"width":200,"height":80, ...},
{"type":"rectangle","id":"b2","x":400,"y":150,"width":200,"height":80, ...},
{"type":"arrow","id":"a1","x":300,"y":190,"width":100,"height":0,
 "points":[[0,0],[100,0]],
 "startBinding":{"elementId":"b1","focus":0,"gap":1},
 "endBinding":{"elementId":"b2","focus":0,"gap":1}}
```

### Vertical Flow Example

```json
// 3 boxes stacked: 140x55, x=440, gap=25
{"type":"rectangle","id":"v1","x":440,"y":100,"width":140,"height":55, ...},
{"type":"rectangle","id":"v2","x":440,"y":180,"width":140,"height":55, ...},
{"type":"arrow","id":"va1","x":510,"y":155,"width":0,"height":25,
 "points":[[0,0],[0,25]],
 "startBinding":{"elementId":"v1","focus":0,"gap":1},
 "endBinding":{"elementId":"v2","focus":0,"gap":1}}
```

### Elbow Arrows

```json
{"type":"arrow","id":"a_elbow","x":300,"y":200,"width":200,"height":150,
 "points":[[0,0],[200,150]],
 "elbowed":true,
 "endArrowhead":"arrow",
 "startBinding":{"elementId":"src","fixedPoint":[1,0.5]},
 "endBinding":{"elementId":"tgt","fixedPoint":[0.5,0]}}
```

**WARNING**: Elbow auto-routing is **blind to other elements** -- it will route straight through your carefully placed zones and shapes. Do NOT use for:

- Connections where the elbow path would cross through other elements
- Crowded areas with tight spaces between elements

**Before using an elbow arrow**, mentally trace the L-shaped path. If ANY other shape sits in that L-path, use a manual multi-point arrow or restructure the layout.

**Prefer elbow** for connections with a clear path, even if long-distance. A 900px elbow through empty space is clean; a 200px elbow through a cluster is a mess.

**Fan-out from gateway/router**: When fanning out to 4+ targets below, use consistent fixedPoint exit strategy -- all from the bottom edge `[0.x, 1]` with evenly spaced x values, NOT mixed left/right/bottom exits. This prevents crossing paths.

### Arrow Labels -- CRITICAL

Labels via `label` property land at the **midpoint** of the arrow path.

- **2-point straight arrows**: `label` on the arrow is fine
- **Multi-segment arrows (3+ points)**: MUST NOT use `label`. Use standalone text at explicit coordinates
- **Decision branch labels** ("Yes"/"No"): always standalone text near arrow start

```json
// Decision diamond with standalone label
{"type":"arrow","id":"a_yes","x":950,"y":168,"width":80,"height":0,
 "points":[[0,0],[80,0]],
 "startBinding":{"elementId":"diamond1","focus":-0.4,"gap":1},
 "endBinding":{"elementId":"target1","focus":0,"gap":1}},
{"type":"text","id":"lbl_yes","x":965,"y":145,"text":"Yes","fontSize":16,"strokeColor":"#374151"}
```

```json
// U-shaped loop-back with standalone label
{"type":"arrow","id":"a_retry","x":1085,"y":296,
 "points":[[0,0],[0,-80],[-580,-80]],
 "startBinding":{"elementId":"retry_diamond","focus":0,"gap":1},
 "endBinding":{"elementId":"target_box","focus":0,"gap":1}},
{"type":"text","id":"lbl_retry","x":780,"y":195,"text":"Retry","fontSize":16,"strokeColor":"#374151"}
```

### The Crossing Rule

**An arrow MUST NOT cross more than one unrelated group/zone.** When you hit this limit:

1. **Hub pattern** -- intermediary node turns N crossing arrows into short spokes + fan-out
2. **Annotation** -- replace arrow with text label (e.g., `"-> RDS"`)
3. **Proximity** -- restructure layout so connected things are adjacent (always best)

### Arrow Length Budget

| Camera size | Max arrow length |
| --- | --- |
| 800 x 600 | ~400px |
| 1200 x 900 | ~500px |
| 1600 x 1200 | ~600px |
| 2400 x 1800 | ~800px |

Measure as sum of all segment lengths. If exceeded, restructure layout or use hub/annotation. **Always verify** arrow lengths after placement.

### Fan-Out / Convergence Hubs

When 3+ sources connect to the same distant target, use a hub:

```
BAD (spaghetti):                GOOD (hub):
  [A] --------\                  [A] --\
  [B] ----------------> [X]     [B] --> [Hub] --> [X]
  [C] ------------------/       [C] --/
```

### Bidirectional Flows

Use two separate arrows offset 15-20px vertically, not one arrow with two arrowheads:

```json
{"type":"arrow","id":"req","x":300,"y":148,...,"endArrowhead":"arrow"},
{"type":"arrow","id":"resp","x":500,"y":162,...,"endArrowhead":"arrow","strokeStyle":"dashed"}
```

### Sequence Diagrams

Message arrows bind to the ACTOR SHAPES (not lifelines). Use `fixedPoint` to control which side: left=[0,0.5], right=[1,0.5], bottom=[0.5,1]. Group related messages into visual phases with background zones or dashed dividers between phases.

### Common Mistakes

- Arrow paths spanning full diagram width
- Arrows directly crossing elements
- Using `focus` on `startBinding` to exit diamond sides -- set arrow `x,y` near desired exit point instead
- Labels on multi-segment arrows
- Less than 100px vertical gap between parallel flows

**When updating an existing diagram:** read the checkpoint, match `y`, `width`, `height` of existing boxes exactly.

---

## Text on Shapes

Use `label` property on shapes -- the CLI converts labels into bound text elements.

```json
{
  "type": "rectangle", "id": "r1", "x": 100, "y": 100,
  "width": 200, "height": 80,
  "backgroundColor": "#a5d8ff", "fillStyle": "solid",
  "roundness": { "type": 3 },
  "label": { "text": "My Label", "fontSize": 20 }
}
```

Works on `rectangle`, `ellipse`, and `diamond`. Multi-line: use `\n`. **Label strokeColor on light fills MUST be `#374151`** (not the default `#1e1e1e`). For dark backgrounds:

```json
{
  "type": "rectangle", "id": "code1", "x": 100, "y": 100,
  "width": 300, "height": 60,
  "backgroundColor": "#1e293b", "strokeColor": "#334155", "fillStyle": "solid",
  "label": { "text": "const x = await fetch(url)", "fontSize": 16, "strokeColor": "#22c55e" }
}
```

**WARNING:** `label` on arrows -- only for simple 2-point straight arrows. Multi-segment or decision branch arrows: use standalone text.

---

## Standalone Text

```json
// Title (28-32px)
{"type":"text","id":"title","x":100,"y":30,"text":"System Architecture","fontSize":28,"strokeColor":"#1e1e1e"}

// Section heading (22-24px) -- dark black, NOT blue
{"type":"text","id":"sec1","x":100,"y":100,"text":"Data Pipeline","fontSize":24,"strokeColor":"#1e1e1e"}

// Description (16-17px)
{"type":"text","id":"desc1","x":100,"y":132,"text":"Processes incoming events in real time","fontSize":17,"strokeColor":"#757575"}

// Annotation (16px)
{"type":"text","id":"note1","x":100,"y":500,"text":"Runs every 5 minutes via cron","fontSize":16,"strokeColor":"#757575"}
```

The CLI auto-computes `width` and `height` for standalone text.

---

## Quality Checklist

Review every item before uploading. You don't ship work you're not proud of.

### Design

- [ ] **Isomorphism**: Structure alone communicates the concept?
- [ ] **Variety**: Each concept uses a different visual pattern?
- [ ] **Layout variety**: Different section patterns (hero, assembly line, text-left/diagram-right, side-by-side)?
- [ ] **Scale hierarchy**: Important elements larger (Hero > Primary > Secondary > Small)?
- [ ] **Shape meaning**: Diamonds=decisions, ellipses=terminals, rectangles=processes?
- [ ] **Container discipline**: <30% text in containers?
- [ ] **Typography hierarchy**: Multiple font sizes creating depth?
- [ ] **Section dividers**: Dashed lines between major sections?

### C4 Model (architecture diagrams)

- [ ] System boundary (dashed rect, opacity 25) wraps internal components?
- [ ] External systems use gray fill (`#e9ecef`) and sit outside the boundary?
- [ ] People use `ellipse` with blue fill (`#a5d8ff`)?
- [ ] Technology annotations on all containers/components (`"Name\n[Technology]"`)?
- [ ] Relationship labels on arrows (`"REST/JSON"`, `"events [Kafka]"`)?

### Text

- [ ] All `fontSize` >= 16
- [ ] **ASCII only** -- no unicode
- [ ] Dark text on light backgrounds, light text on dark backgrounds
- [ ] Free-floating text has explicit dark `strokeColor`

### Arrows

- [ ] Every arrow = runtime data flow or signal (not just "related")
- [ ] `startBinding`/`endBinding` on every arrow
- [ ] No arrow crosses more than one unrelated zone
- [ ] Arrow length within budget for camera size
- [ ] 3+ arrows to same target? Use hub
- [ ] Solid=data flow, dashed=control, text=reference
- [ ] Elbow only when path is clear of obstacles
- [ ] Manual routing in dense/cross-zone areas
- [ ] No labels on multi-segment arrows

### Structure

- [ ] Consistent box sizes within each flow
- [ ] No duplicate element IDs
- [ ] Minimum 50px gaps between shapes
- [ ] No text overlap (max 3 lines, ~20-25 chars each)
- [ ] Side-by-side sections: 60px+ gap
- [ ] Evidence artifacts (real code/data, not placeholders)
- [ ] Multi-zoom levels (summary + sections + detail)
- [ ] Diagram teaches, not just labels
