# AWS

For diagrams of AWS accounts, Regions and services. Everything else follows `style.md`.

## Containers

```text
AWS account          points=[[0,0],[0.25,0],[0.5,0],[0.75,0],[1,0],[1,0.25],[1,0.5],[1,0.75],[1,1],[0.75,1],[0.5,1],[0.25,1],[0,1],[0,0.75],[0,0.5],[0,0.25]];outlineConnect=0;gradientColor=none;html=1;whiteSpace=wrap;fontSize=12;fontStyle=0;container=0;pointerEvents=0;collapsible=0;recursiveResize=0;shape=mxgraph.aws4.group;grIcon=mxgraph.aws4.group_account;strokeColor=#CD2264;fillColor=none;verticalAlign=top;align=left;spacingLeft=30;fontColor=#CD2264;dashed=0;
AWS Region           points=[[0,0],[0.25,0],[0.5,0],[0.75,0],[1,0],[1,0.25],[1,0.5],[1,0.75],[1,1],[0.75,1],[0.5,1],[0.25,1],[0,1],[0,0.75],[0,0.5],[0,0.25]];outlineConnect=0;gradientColor=none;html=1;whiteSpace=wrap;fontSize=12;fontStyle=0;container=0;pointerEvents=0;collapsible=0;recursiveResize=0;shape=mxgraph.aws4.group;grIcon=mxgraph.aws4.group_region;strokeColor=#00A4A6;fillColor=none;verticalAlign=top;align=left;spacingLeft=30;fontColor=#147EBA;dashed=1;
```

## Service icons

Use an icon only when the reader must recognise the service at a glance, such as IAM Identity Center on a sign-in diagram. 60x60, beside or inside the shape it belongs to. Set `fillColor` to the AWS category colour (security `#DD344C`, networking `#8C4FFF`, management `#E7157B`, storage `#7AA116`, compute `#ED7100`) and `resIcon` to the service, for example `mxgraph.aws4.single_sign_on`, `mxgraph.aws4.network_firewall`, `mxgraph.aws4.organizations`. Export and look: a wrong `resIcon` name renders an empty square.

```text
AWS service icon     sketch=0;outlineConnect=0;fontColor=#232F3E;fillColor=#DD344C;strokeColor=#ffffff;dashed=0;verticalLabelPosition=bottom;verticalAlign=top;align=center;html=1;fontSize=11;aspect=fixed;shape=mxgraph.aws4.resourceIcon;resIcon=mxgraph.aws4.single_sign_on;
```
