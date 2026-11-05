---
name: drawio
description: Use when specifically creating or updating a draw.io diagram or a .drawio file, or when asked to draw, diagram or visualize an architecture, flow, sequence, hierarchy, timeline or comparison for a repo's docs.
disable-model-invocation: true
argument-hint: "[what the diagram shows] [where it goes, optional]"
---

# draw.io diagram

Draw a diagram in the house style, render it with the draw.io app, look at the render and fix it until it's clean. It can be any kind of diagram: an architecture view, a process, a sequence of calls, a hierarchy, a timeline, a comparison. Every diagram uses the same fonts, colours, shapes and lines, so they read as one set.

## Files

| File | Where |
| --- | --- |
| Source | Where the repo keeps its diagrams (`git ls-files '*.drawio'`), else `docs/diagrams/{name}.drawio`, unless the user names another place |
| Image | Next to the repo's other diagram images, else `docs/assets/{name}.png` |
| Style | `references/style.md`: palette, text, shapes, lines, layout. Read it every time |
| Patterns | `references/patterns.md`: how to lay out each kind of diagram. Read the one you need |
| AWS | `references/aws.md`: account and Region containers, service icons. Read it for AWS diagrams |
| Starter | `templates/starter.drawio`: copy it for a new diagram |
| Export | `scripts/export.sh` |

Paths under `references/`, `templates/` and `scripts/` are in this skill's directory. `{name}` is kebab-case and starts with the area when there is one (`network-egress`, `billing-retry-flow`).

## Steps

1. **Work out what the diagram must show.** One diagram makes one point. Write that point as one sentence; it becomes the subtitle. If the request leaves the point, the scope or the audience unclear, ask before drawing.
2. **Gather the facts.** Every name, number and setting on a diagram is real. Take them from the docs, the code or the user. Use a sketch the user gives for layout ideas, not for facts. If a fact is missing, ask; don't put placeholders on the diagram.
3. **Read `references/style.md`, then pick the pattern** in `references/patterns.md` that matches the idea. A diagram can combine two (an architecture with a flow through it).
4. **Plan the layout before writing XML.** Decide the reading direction, the containers, the shapes in each, and where every arrow leaves and enters. Line shapes up so arrows run straight. Write down x, y, width and height for every shape on the 10 px grid.
5. **Write the `.drawio` file.** Copy `templates/starter.drawio` and replace its sample cells. Group the cells with XML comments (`<!-- Core network -->`) and give every cell a readable `id`, so the file can be edited by hand.
6. **Export** from the repo root:

   ```sh
   <skill dir>/scripts/export.sh <source>.drawio <image>.png
   ```

   It checks the XML, then writes the PNG at 2x scale with a 10 px border. Without a second argument, the PNG goes next to the source.
7. **Look at the render.** Open the PNG with the Read tool and go through the checklist below. Fix the XML and export again until every item passes. Never hand over or link a diagram you haven't looked at.
8. **Place it.** If the diagram belongs to a page, put it where the user asked, or in the section it illustrates, with a path relative to the page:

   ```markdown
   ![{what the diagram shows, as a sentence}](../assets/{name}.png)
   ```

   Alt text says what the diagram shows, not "diagram of X". If the user only wanted the diagram, don't touch any page.
9. **Report** the source and image paths, what you couldn't make clean (an unavoidable crossing), any fact you weren't sure of, and that nothing is committed unless the user asked.

## Checklist for the render

- The diagram makes the one point in its subtitle, and nothing on it is unrelated to that point.
- No label overlaps a line, another label or a shape edge.
- Every arrow starts and ends on the shape it belongs to, with no kinks. An arrow between two aligned shapes is one straight line.
- No arrow crosses a shape. At most one crossing between arrows, drawn with a jump.
- Text fits inside its shape, on two lines at most.
- Every name and value matches the source it came from.
- Colours mean what the palette says, and the legend explains every line and border style used.
- Nothing runs off the page or sits outside its container.

## Updating a diagram

Edit the `.drawio` file, then export, look and fix as in steps 6 and 7. Keep the ids and positions of cells that don't change, so the diff stays small. The `.drawio` file is the source; never edit the PNG. If a diagram exists only as an image, redraw it in draw.io in the house style rather than editing the image.
