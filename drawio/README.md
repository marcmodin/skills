# drawio

Claude Code skill that draws diagrams as draw.io files in one house style, exports them to PNG with the draw.io desktop app, looks at the render and fixes it until it's clean. It covers architecture, flow, sequence, hierarchy, timeline and comparison diagrams.

It's user-invoked only: Claude never loads it on its own, so it runs only when you type `/drawio`.

## Requirements

- The [draw.io desktop app](https://www.drawio.com), for the export. The script finds it in `/Applications` on macOS or as `drawio` on the `PATH`. Set `DRAWIO` to its binary otherwise. On a Linux machine with no display, run the export under `xvfb-run`.
- `xmllint` (optional), to catch broken XML before the export.

## Usage

```sh
/drawio <what the diagram shows> [where it goes]
```

Examples:

| Invocation | Result |
| ---------- | ------ |
| `/drawio how a request reaches the API through the load balancer` | Architecture diagram in `docs/diagrams/`, PNG in `docs/assets/` |
| `/drawio the release process, with the approval step` | Flow diagram with a decision for the approval |
| `/drawio add the cache to network-egress.drawio` | Edits the source, keeps unchanged cells as they are, exports again |

## How it works

1. Claude works out the one point the diagram makes and gathers every name and value from the docs, the code or you. It asks rather than drawing placeholders.
2. It picks a pattern (architecture, flow, sequence, hierarchy, timeline or comparison), plans the layout on a 10 px grid, and writes the `.drawio` XML from the starter in the house style.
3. `scripts/export.sh` checks the XML and exports a PNG at 2x scale.
4. Claude opens the PNG, goes through a checklist (no overlaps, straight arrows, text that fits, a legend for every line style) and fixes the XML until every item passes.
5. It places the image in the page it belongs to, if any, and reports what it couldn't make clean. It commits nothing unless you ask.

Diagrams go where the repo already keeps them, else `docs/diagrams/` for the source and `docs/assets/` for the PNG.

## Bundled resources

- `references/style.md`: fonts, the colour palette and what each colour means, shape, container and line styles, and layout rules.
- `references/patterns.md`: how to lay out each kind of diagram.
- `references/aws.md`: AWS account and Region containers and service icons.
- `templates/starter.drawio`: the file every new diagram starts from.
- `scripts/export.sh`: exports a `.drawio` file to PNG with the draw.io app.
