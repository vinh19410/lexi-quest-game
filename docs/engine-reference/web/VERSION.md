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

- **Code root** — the app is not scaffolded yet. A Vite app at the repo root
  gives `src/`, which `resolve_code_root` auto-detects; a nested app
  directory would leave the code root unresolved (its callers announce that
  honestly) until the architecture ADR picks one.
- **Test framework** — the prototype has none. `/test-setup` decides; vitest
  is the Vite-native candidate.
- **Backend / persistence** — the persistence-boundary and PRNG ADRs are
  queued (see `design/gdd/systems-index.md` high-risk table).

## History

Godot 4.7 was evaluated and rejected for this project during Concept
(`design/gdd/game-concept.md` § Technical Considerations — load time, wasm
size, UI-centric game). The `docs/engine-reference/godot/` pin is kept as
that evaluation's record and is no longer imported by CLAUDE.md.
