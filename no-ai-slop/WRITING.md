## Writing rules

Read this before writing any prose.

**Applies to:** any written content meant for a reader — docs, articles, reports, READMEs, design docs, decision records, release notes.

**Does not apply to:** navigation and index files, machine-generated artefacts, or direct quotes from source material (preserve verbatim, even if a quote contains banned words).

## House voice

- Plain, specific, conversational. No marketing register.
- Get to the point in the first sentence. Don't preamble.
- Less is more. Say a thing once.
- Vary sentence length. Short sentences are good. Long ones are fine when they earn it.
- Use specific names, numbers, examples. Generic statements are a flag.
- Cite. Every factual claim traces to a source. See § Source discipline.
- Match the register: informal when the audience is informal, technical when they're technical.

## Source discipline

Before drafting, read your sources closely enough that you could point to the passage behind any claim you're about to write. While drafting, if you find yourself reaching for a claim the sources don't back, stop and choose: drop it, or find source material that backs it before continuing.

"Backed by the source" means a specific passage says the same thing, or the sentence is a faithful paraphrase of one. Not "the source is generally about this topic."

Connective framing counts. "X works this way rather than the older approach" makes two claims; if only one traces, drop the comparison.

Definitions are paraphrase, not invention. If the source never defines the term, neither do you — quote the closest thing it says and stop.

## Hard bans

Each of these is an AI tell strong enough to read as artificial on its own.

- **Knowledge-cutoff disclaimers.** No "As of my last training update," "based on available information," or variants. If something isn't known, say so and stop.
- **Speculation about missing sources.** No "the subject likely maintains a low profile," "details are not widely documented." Find a source, mark the claim as speculative, or leave it out.
- **Fabricated attributions.** No "Industry reports," "Observers have cited," "Experts say" without naming the expert and citing the source.
- **Faux-collaborative chat tells in written content.** No "I hope this helps!", "Certainly!", "Would you like me to..." inside articles or reports. Chat replies can be conversational; written outputs cannot.
- **Unfilled placeholders.** No `[Describe the section]`, `[link to article]` left in live prose. Real TODOs go in a tracker or as `<!-- TODO: ... -->` comments.
- **Puffery.** No "breathtaking," "groundbreaking," "renowned," "vibrant tapestry," "stands as a testament," "rich cultural heritage," "nestled." Facts don't need cheerleading.
- **Curly quotes** (`"`, `"`, `'`, `'`). Use straight `"` and `'`. Markdown tools prefer ASCII.

## AI tells to avoid

Each item below has a legitimate use occasionally, but LLM output overuses them. Default to alternatives.

### Em dashes

Prefer commas and parentheses. Reserve `—` for a genuine break in thought, not for emphasis. If you find one in a draft, check whether a comma or parens would do the job.

### The rule of three

LLMs default to triads: "adjective, adjective, and adjective." Vary list lengths. Two examples are often enough. Four is sometimes right. Let the content choose.

### Negative parallelisms

Kill on sight: "It's not X, it's Y." "Not just X, but Y." State the thing positively. Exception: when something genuinely needs contrast with a named, cited counter-claim.

### Connective overuse

Lean on transition words only when the relationship warrants it. Watch: "Additionally," "Moreover," "Furthermore," "However," "In contrast." Most of the time the next sentence follows without a flag.

### Superficial `-ing` endings

Sentence tails like `... enhancing convenience`, `... highlighting its role`, `... ensuring efficiency` are LLM signature commentary. If the `-ing` clause is doing real analytical work, keep it. Otherwise cut it.

### AI vocabulary words

The following words are overused enough to read as artificial when several appear together. One or two in a long piece is fine; a sentence with three should be rewritten:

`align with`, `boasts`, `bolstered`, `crucial`, `delve`, `emphasizing`, `enduring`, `enhance`, `fostering`, `garner`, `highlight` (verb), `interplay`, `intricate`, `landscape` (abstract noun), `meticulous`, `pivotal`, `robust`, `showcase`, `tapestry` (abstract noun), `testament`, `underscore` (verb), `valuable`, `vibrant`.

### Puffed-up importance statements

Watch for: `stands as a testament`, `plays a vital role`, `underscores its importance`, `reflects broader trends`, `setting the stage for`, `key turning point`, `evolving landscape`. If the importance is real, the facts carry it.

### Editorialising

No "It's important to note," "It is worth remembering," "No discussion would be complete without." Just state the thing.

### Inline-header bullet lists

Avoid:
> - **Scalability:** The system scales easily.

If the bold header restates the sentence, drop the bold and write prose or use a plain bullet. Use inline-bold headers only when the header carries real navigational value (e.g., a glossary).

### Overuse of bold

Bold should be intentional. If half your nouns are bold, none of them are. Reserve it for genuinely load-bearing phrases — once or twice per article body, not once per paragraph.

### Title case headings

Use sentence case: `## Folder layout`, not `## Folder Layout`. Title case in body headings is an LLM tell.

## Format

- Straight quotes `"` and `'`. Straight apostrophes in contractions (`don't`, not `don't`).
- Sentence case for headings.
- Don't skip heading levels (`##` then `###`, not `##` then `####`).
- No thematic breaks (`---`) before every heading.
- Numbered lists when sequence matters; bullets when it doesn't; prose when neither does.
- Em dash glyph is `—` (not `--`); en dash is `–`; hyphen is `-`. Use the right one.

## When unsure

If a sentence reads like a tourism brochure, a press release, or a Wikipedia article an over-confident chatbot drafted, rewrite it. The reliable test: would the author write this sentence? If the answer is no, it doesn't go in.

For ambiguous cases — a word that could be right or could be puffery — leave it out. Less is more.