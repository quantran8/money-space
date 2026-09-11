# Working rules — frontend

Covers the whole pnpm workspace: `packages/core`, `web/` and `mobile/`.
Stack-specific guidance lives in [web/CLAUDE.md](../web/CLAUDE.md) and
[mobile/CLAUDE.md](../mobile/CLAUDE.md). These two rules outrank anything there
that disagrees.

## Code comments: short

A line or two, saying _what_ the line does, or a one-line caveat when something
is genuinely surprising.

Anything longer about business logic (nghiệp vụ) — why a rule exists,
trade-offs weighed, alternatives rejected, what was tried and discarded — goes
in `memory/`, never inline. Leave a pointer from the code:

```ts
// Only counted at the ceiling, never from 1/5. See memory/billing.md.
```

When a change needs a paragraph of justification, that paragraph is a `memory/`
edit. Doc comments on components, hooks and types are held to the same length —
a ten-line essay is the same problem wearing `/** */`.

Per-task change logs are a different thing and keep their own home in
`session/<date>/<task>/README.md`.

## Commit messages: 1–2 lines

Say what changed. No body paragraphs, no bullet lists, no rationale — the
reasoning belongs in `memory/`.

**No `Co-Authored-By` trailer**, and no "Generated with Claude Code".

```
Mark what-if re-runs so exploring an answer costs no quota
```
