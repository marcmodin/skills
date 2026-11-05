# Patterns

Pick the pattern that matches the idea the diagram has to carry. All of them use the style in `style.md`.

| The idea is | Pattern |
| --- | --- |
| What exists and how it connects | Architecture |
| Steps that happen in order, with branches | Flow |
| Who calls whom, in what order | Sequence |
| Things nested in things (org units, accounts, address pools) | Hierarchy |
| What happens when, over weeks or phases | Timeline |
| Two or more options or states side by side | Comparison |

## Architecture

- Containers for the boundaries that matter to the point: an account, a network, a cluster, outside systems. For AWS, see `aws.md`. Don't draw a boundary the point doesn't need.
- Inside a container, one shape per component, labelled `<b>name</b><br>[what it is or holds]`.
- Outside systems in grey, above or left of the platform.
- Lines show what travels at runtime. Use a dashed line for a relationship where nothing travels.
- A note in grey for a rule the shapes can't show ("no route between test and prod").

## Flow

For a process, a pipeline or a decision path (onboarding, an incident runbook, a change path).

- Start with a grey ellipse, end with one. Steps are rounded rectangles, decisions are yellow rhombuses with the question as the label.
- One spine in the reading direction. Branches leave a decision to the side, labelled `yes` / `no` or the condition, and rejoin the spine or end.
- Colour steps by who does them, and say so in the legend, or keep them all neutral. Red only for a failure or stop path.
- Six steps or more: break the spine into rows that run the same direction, with a turn arrow, or group the steps into phase zones with a label each.
- Long flows across teams: one horizontal swimlane per actor (`swimlane;horizontal=0;html=1;startSize=30;fillColor=none;`), steps placed in the lane of the actor who does them.

## Sequence

For calls between systems in order (SAML sign-in, SCIM provisioning, a BGP session coming up).

- Actors across the top, in call order, same size, coloured by role.
- Under each, a dashed vertical lifeline: `endArrow=none;dashed=1;strokeColor=#666666;html=1;` with `sourcePoint` / `targetPoint` geometry.
- Messages are horizontal lines between lifelines, top to bottom in time order, 40 px apart, labelled with the call. Replies dashed with an open arrow.
- Number the messages (`1. AuthnRequest`) when the reader will refer to them.
- A grey note to the side for what isn't obvious ("token valid 1 h").

## Hierarchy

For org trees, account structures, IP address pools, permission inheritance.

- Root at the top, children below, one row per level, siblings the same size.
- Connect parent to children with a bus: one vertical line from the parent's bottom to a horizontal line, and one short drop to each child. Use `edgeStyle=orthogonalEdgeStyle` with the same waypoint y for every child edge, and `endArrow=none`.
- Put what applies at a level (a policy, a CIDR) in the detail line of that node, not as a separate shape.
- Too wide for one row: stack children of a node vertically under it, with a vertical bus on the left.

## Timeline

For phases, milestones and migrations (release gates, a cut-over plan).

- One horizontal line across the page, `endArrow=classic`.
- Milestones as small ellipses on the line (20x20, filled with the role colour), the date above and the label below.
- Phases as zones above or below the line spanning their dates, labelled top left.
- Equal spacing per unit of time, or say in a note that spacing isn't to scale.

## Comparison

For options considered, before and after, built and future.

- One column per option or state, same width, same shapes in the same rows, so the eye compares across.
- A neutral zone around each column with its name as the label.
- Colour only what differs between the columns. Show the future or rejected option with the dashed grey "not built" style.
- A one-line note under each column with the outcome or the trade-off.
