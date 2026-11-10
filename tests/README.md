# Tests

Automated test suites for LexiQuest — web stack (TypeScript, run by vitest).

**Test framework: vitest** (decided by `/test-setup`, 2026-11-09). The exact
version is pinned when the app scaffold lands (the ADR-0004 scaffold story)
and must pair with Vite ^8.0.5 — NOT SOURCEABLE: vitest's Vite-8 peer range is
not covered by `docs/engine-reference/web/VERSION.md`; resolve it against the
pnpm registry at pin time. Until that story runs, the directories below exist
but no runner is installed.

## Directory structure

```text
tests/
├── unit/                    # Pure-logic tests — one folder per system
│   └── [system]/            # e.g. unit/battle/, unit/prng/
├── integration/             # Multi-system + API tests — one folder per system
│   └── [system]/
└── smoke/
    └── critical-paths.md    # /smoke-check reads this file
```

The deterministic sim core (`src/game/`, ADR-0004) imports no React, DOM,
network, or storage — its unit tests run in vitest's plain `node` environment
with no browser. Component tests (jsdom) and E2E are out of scope for this
scaffold; decide them with the scaffold story.

## Naming conventions

Per `.claude/rules/test-standards.md` (web row):

- File: `[system]_[feature]_test.ts` — same pattern as the other engines
  (e.g. `battle_damage_test.ts`)
- Structure: `describe('[system].[feature]')` blocks; each test title states
  the `scenario → expected result` (the web analogue of
  `test_[scenario]_[expected]`)
- The scaffold story must set vitest `include: ['tests/**/*_test.ts']` —
  vitest's default `*.test.ts` glob will NOT pick these up

## Running

```bash
pnpm install
pnpm exec vitest run              # whole suite
pnpm exec vitest run tests/unit   # one root
```

These commands work only after the scaffold story installs vitest and writes
the runner config (include pattern, node/jsdom environments).

## CI

`.github/workflows/tests.yml` runs the suite on every push to `main` and every
PR (root `CLAUDE.md` → CI/CD Rules). The job self-skips while the repo has no
root `package.json` and activates automatically when the scaffold story lands.

## Test evidence

Screenshots and QA evidence live in `production/qa/evidence/` — **never**
`tests/evidence/`. UI and Visual/Feel stories must retain their screenshots
there before closing (root `CLAUDE.md` → Testing Standards).
