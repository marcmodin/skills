# House style

Taken from `docs/assets/network-inspection-egress.png`,
`ep-cwan-network.jpg`, `governance.png` and `identity-access.png`. Every
diagram uses the draw.io default font (Helvetica) and the draw.io standard
palette below.

## Text

| Element | How |
| --- | --- |
| Title | Top left, bold 16 px, black. Says what the diagram shows |
| Subtitle | Under the title, 12 px, black. One sentence with the diagram's point |
| Shape label | `<b>Name</b><br>[detail]`, 12 px. The name as in the code or the product; the detail says what it is, holds or runs on |
| Edge label | 11 px, `labelBackgroundColor=#ffffff`, 1 to 3 words: what travels, or the action |
| Container label | 12 px, top left, plain |
| Note | Free text, 11 px, `fontColor=#666666`, next to or inside what it describes |
| Legend | Bottom left, below everything, 11 px, one row per line or border style used |

Labels are HTML (`html=1`), so escape them in XML:
`&lt;b&gt;Name&lt;/b&gt;&lt;br&gt;[detail]`. Sentence case, ASCII only, and the
house writing style (no puffery, no em dashes).

## Palette

Colours carry meaning, the same on every diagram. Pick by the role the thing
plays in this diagram.

| Fill | Stroke | Role | Examples |
| --- | --- | --- | --- |
| `#dae8fc` | `#6c8ebf` | Inputs, people, sources, workloads | Spoke VPCs, staff, a request, detective controls |
| `#d5e8d4` | `#82b366` | Production, applied or done | prod, a baseline, a finished step |
| `#ffe6cc` | `#d79b00` | Non-production, outbound, events, warnings | test, egress, an EventBridge event, preventive controls |
| `#e1d5e7` | `#9673a6` | Management and control plane | hybrid, Organizations, Control Tower |
| `#f8cecc` | `#b85450` | Security enforcement, stops, failures | inspection, the firewall, a deny, an error path |
| `#fff2cc` | `#d6b656` | Decisions, assignments, configuration | a decision step, a permission set assignment |
| `#f5f5f5` | `#666666` | Outside the platform | Prisma Access, on-prem, the Internet, a vendor |
| `#ffffff` | role stroke, dashed | Logical, with no resources of its own | a network function group, a policy |
| `#ffffff` | `#000000` | Neutral, when colour would mean nothing | accounts in a list, a generic step |

Not built yet or future: no fill, dashed `#666666` stroke, `fontColor=#666666`,
and a note saying so.

Use at most four fill colours on one diagram besides grey and white. If two
things look the same colour, they must play the same role.

## Shapes

Style strings to copy. Swap the colours from the palette.

```text
Component            rounded=0;whiteSpace=wrap;html=1;fillColor=#d5e8d4;strokeColor=#82b366;
Service or step      rounded=1;whiteSpace=wrap;html=1;fillColor=#dae8fc;strokeColor=#6c8ebf;
Outside system       rounded=1;whiteSpace=wrap;html=1;fillColor=#f5f5f5;strokeColor=#666666;fontColor=#333333;
Logical construct    rounded=1;whiteSpace=wrap;html=1;dashed=1;fillColor=#ffffff;strokeColor=#b85450;
Person               ellipse;whiteSpace=wrap;html=1;fillColor=#dae8fc;strokeColor=#6c8ebf;
Start or end         ellipse;whiteSpace=wrap;html=1;fillColor=#f5f5f5;strokeColor=#666666;
Decision             rhombus;whiteSpace=wrap;html=1;fillColor=#fff2cc;strokeColor=#d6b656;
Data store           shape=cylinder3;whiteSpace=wrap;html=1;boundedLbl=1;backgroundOutline=1;size=10;fillColor=#dae8fc;strokeColor=#6c8ebf;
Wide bar             rounded=0;whiteSpace=wrap;html=1;fillColor=#d5e8d4;strokeColor=#82b366;   (a segment or layer spanning the width)
Note                 text;html=1;align=left;verticalAlign=top;whiteSpace=wrap;fontColor=#666666;fontSize=11;
```

Containers:

```text
Plain boundary       rounded=0;whiteSpace=wrap;html=1;fillColor=none;strokeColor=#6600CC;verticalAlign=top;align=left;spacingLeft=10;spacingTop=4;
Grouping zone        rounded=1;whiteSpace=wrap;html=1;dashed=1;fillColor=#f8cecc;opacity=40;strokeColor=#b85450;verticalAlign=top;align=left;spacingLeft=10;
Neutral zone         rounded=1;whiteSpace=wrap;html=1;dashed=1;fillColor=#f5f5f5;strokeColor=#666666;verticalAlign=top;align=left;spacingLeft=10;
AWS account          points=[[0,0],[0.25,0],[0.5,0],[0.75,0],[1,0],[1,0.25],[1,0.5],[1,0.75],[1,1],[0.75,1],[0.5,1],[0.25,1],[0,1],[0,0.75],[0,0.5],[0,0.25]];outlineConnect=0;gradientColor=none;html=1;whiteSpace=wrap;fontSize=12;fontStyle=0;container=0;pointerEvents=0;collapsible=0;recursiveResize=0;shape=mxgraph.aws4.group;grIcon=mxgraph.aws4.group_account;strokeColor=#CD2264;fillColor=none;verticalAlign=top;align=left;spacingLeft=30;fontColor=#CD2264;dashed=0;
AWS Region           points=[[0,0],[0.25,0],[0.5,0],[0.75,0],[1,0],[1,0.25],[1,0.5],[1,0.75],[1,1],[0.75,1],[0.5,1],[0.25,1],[0,1],[0,0.75],[0,0.5],[0,0.25]];outlineConnect=0;gradientColor=none;html=1;whiteSpace=wrap;fontSize=12;fontStyle=0;container=0;pointerEvents=0;collapsible=0;recursiveResize=0;shape=mxgraph.aws4.group;grIcon=mxgraph.aws4.group_region;strokeColor=#00A4A6;fillColor=none;verticalAlign=top;align=left;spacingLeft=30;fontColor=#147EBA;dashed=1;
```

Put a container's label where arrows don't cross it: top left by default,
bottom right (`verticalAlign=bottom;align=right;spacingRight=10;spacingBottom=6;`)
when arrows enter from above, as on the Cloud WAN core network.

AWS service icons: use only when the reader must recognise the service at a
glance, as for IAM Identity Center in `identity-access.png`. 60x60, beside or
inside the shape it belongs to. Set `fillColor` to the AWS category colour
(security `#DD344C`, networking `#8C4FFF`, management `#E7157B`, storage
`#7AA116`, compute `#ED7100`) and `resIcon` to the service, for example
`mxgraph.aws4.single_sign_on`, `mxgraph.aws4.network_firewall`,
`mxgraph.aws4.organizations`. Export and look: a wrong `resIcon` name renders
an empty square.

```text
AWS service icon     sketch=0;outlineConnect=0;fontColor=#232F3E;fillColor=#DD344C;strokeColor=#ffffff;dashed=0;verticalLabelPosition=bottom;verticalAlign=top;align=center;html=1;fontSize=11;aspect=fixed;shape=mxgraph.aws4.resourceIcon;resIcon=mxgraph.aws4.single_sign_on;
```

## Lines

All lines are black, `edgeStyle=orthogonalEdgeStyle;rounded=0;html=1;`.

| Meaning | Style |
| --- | --- |
| Something travels, one way (traffic, a call, a step to the next) | `endArrow=classic;endFill=1;` |
| Travels both ways | add `startArrow=classic;startFill=1;` |
| Reply or async message (sequence diagrams) | `dashed=1;endArrow=open;endFill=0;` |
| Association, placement or control, nothing travels (an endpoint in a VPC, a policy on an OU) | `dashed=1;endArrow=none;` |
| Unavoidable crossing | add `jumpStyle=arc;jumpSize=8;` to both lines, no label on either |

Set `exitX/exitY` and `entryX/entryY` on every edge so draw.io doesn't choose
the side. For a straight vertical line the two ends must share an x:
`entryX = (sourceCenterX - targetX) / targetWidth`. Add `<Array as="points">`
waypoints only when the automatic route crosses a shape. When three or more
lines leave one shape for the same side, spread their exit points (0.25, 0.5,
0.75) or join them with a shared waypoint so they read as a bus.

## Layout

- 10 px grid: every x, y, width and height is a multiple of 10.
- Shapes are at least 60 px high and 120 px wide. Shapes in one row share
  their height and y; shapes in one column share their width and x.
- Size a row of shapes to its longest label, not each label separately.
- At least 50 px between shapes, 40 px between a shape and its container's
  edge, 60 px between containers.
- One reading direction per diagram: left to right or top to bottom. Sources,
  people and on-prem at the top or left; outcomes and the Internet at the
  bottom or right.
- The most important shape is the largest or the most central.
- Page size fits the content plus 20 px on each side.
