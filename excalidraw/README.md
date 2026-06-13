# excalidraw

Claude Code skill that creates hand-drawn Excalidraw diagrams from natural language. Runs as a forked subagent via `context: fork` — the skill receives the user's description and autonomously builds, uploads, and opens the diagram (saving tokens in the main context window).

> [!Note]
> For Claude Desktop, use the [Official Excalidraw MCP App](https://github.com/excalidraw/excalidraw-mcp) instead. This skill is for Claude Code CLI.

## Requirements

- Node.js, to run the CLI scripts
- Access to `mcp.excalidraw.com` for retrieving the element format reference

## Actions

| Command | Description |
| ------- | ----------- |
| `node scripts/out/index.js reference` | Fetch element format cheat sheet from MCP server |
| `node scripts/out/index.js create -` | Create or update a diagram (reads elements JSON from stdin) |
| `node scripts/out/index.js status` | Show current checkpoint and version history |
| `node scripts/out/index.js reset` | Clear all checkpoints and start fresh |

## How it works

1. Claude builds an Excalidraw elements JSON array
2. The CLI converts `label` properties into bound text elements (matching the Excalidraw format)
3. Elements are encrypted (AES-GCM) and uploaded to `excalidraw.com`
4. The diagram opens in the browser
5. Checkpoints track versions locally for incremental updates

See `scripts/README.md` for development setup.
