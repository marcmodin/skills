# no-ai-slop

Claude Code skill that enforces a plain, specific house style for written content and strips the tells that make prose read as AI-generated: puffery, em-dash overuse, the rule of three, AI vocabulary, title-case headings, curly quotes, and the rest.

It's model-triggered. The skill fires when you write or edit prose (docs, articles, reports, READMEs, design docs) or when you ask to de-slop, humanize, or clean up AI-sounding text.

## Requirements

None. The skill is two markdown files with no scripts or external dependencies.

## Usage

The skill triggers automatically when a task involves writing or editing prose. You can also invoke it explicitly:

```sh
/no-ai-slop
```

Examples:

| Invocation | Result |
| ---------- | ------ |
| "Write a README for this module" | Drafts the README with the house rules applied while writing |
| "De-slop this blog post" | Passes the text against WRITING.md and rewrites anything that violates a rule |
| "Make this sound less like a chatbot" | Same edit pass, focused on AI tells |

## How it works

1. `SKILL.md` is the dispatcher. It points the agent at `WRITING.md` and tells it to read the rules in full before writing.
2. `WRITING.md` is the single source of truth: house voice, source discipline, hard bans, and the catalog of AI tells to avoid.
3. Rules are applied while drafting, not as a post-hoc audit.
4. The closing test for any sentence: would the author write this? If not, it doesn't go in.

## Bundled resources

- `WRITING.md` — the full ruleset. The skill is useless without it; read it rather than working from memory.
