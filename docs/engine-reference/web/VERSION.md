# Web Stack — Version Reference

| Field | Value |
|-------|-------|
| **Stack** | Web (browser SPA, Vietnamese UI) |
| **UI** | React ^19.0.0 (react + react-dom) |
| **Language** | TypeScript ^5.7.0 |
| **Build** | Vite ^8.0.5 + @vitejs/plugin-react ^6.0.0 |
| **Styling** | Tailwind CSS ^4.0.0 (via @tailwindcss/vite) |
| **Icons** | lucide-react ^1.63.0 |
| **Package manager** | pnpm |
| **Formatter** | oxfmt ^0.2.0 |
| **Project pinned** | 2026-11-09 |
| **Pinned from** | `raw-data/lexi-quest-design/package.json` (+ pnpm-lock.yaml) — the prototype is the version source of truth until the production app is scaffolded |

## Knowledge Gap Warning

The LLM's training data ends ~May 2025 and covers Vite only through the
6.x/7.0 era; **Vite 8, Tailwind 4.x minors, and lucide-react 1.x postdate or
edge the cutoff**. The caret ranges above are reliable as *pins* (sourced
from package.json), but any API-behavior claim about those versions is
**UNVERIFIED** until checked against `node_modules/` types or official docs.
Do not fill the gap from training data — write
`NOT SOURCEABLE — <what> is not covered by <path>` instead
(`.claude/rules/skill-authoring.md` obligation 4).

## Open Decisions (owned by Technical Setup)

- **Code root — DECIDED**: ADR-0004 **Accepted** 2026-11-10
  (`docs/architecture/adr-0004-module-layout-and-b-series-extraction.md`):
  `src/` (Vite app at the repo root).
- **Test framework — DECIDED (`/test-setup`, 2026-11-09): vitest.** Exact
  version pinned at app-scaffold time and must pair with Vite ^8.0.5 —
  NOT SOURCEABLE: vitest's Vite-8 peer range is not covered by any path in
  this repo; resolve against the pnpm registry when the scaffold story runs.
  Naming contract: `tests/**/*_test.ts`, which needs an explicit vitest
  `include` (the default `*.test.ts` glob misses it).
- **Backend / persistence — DECIDED**: ADR-0002 **Accepted** 2026-11-10
  (`docs/architecture/adr-0002-persistence-boundary-and-backend-stack.md`):
  Node LTS + Fastify + PostgreSQL.

## History

Godot 4.7 was evaluated and rejected for this project during Concept
(`design/gdd/game-concept.md` § Technical Considerations — load time, wasm
size, UI-centric game). The `docs/engine-reference/godot/` pin is kept as
that evaluation's record and is no longer imported by CLAUDE.md.
