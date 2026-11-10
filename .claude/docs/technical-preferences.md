# Technical Preferences

<!-- project.yaml at the repo root is the machine-readable source of truth for
     engine, specialists, naming, performance, platform, and testing.framework.
     This file is the human-readable LEGACY FALLBACK: agents and skills resolve
     each key from project.yaml first and fall back here only when the
     project.yaml key is absent. /setup-engine dual-writes both.
     Forbidden patterns and allowed libraries are NOT migrated — they live only
     in this file. Populated by /setup-engine; updated as decisions are made. -->

## Engine & Language

<!-- Registered by hand 2026-11-09 (commit 692771c) when the stack was outside
     /setup-engine's catalog; configured via /setup-engine web 2026-11-10,
     which now supports Web natively. project.yaml is authoritative;
     the **Engine**: line below is also what workflow-catalog's engine-setup
     step matches (its any_of branch). -->

- **Engine**: Web (browser SPA) — React 19 + Vite 8 (out-of-catalog; project.yaml `engine:` block is authoritative)
- **Language**: TypeScript ^5.7.0
- **Rendering**: React DOM 19; Tailwind CSS 4 for styling
- **Physics**: None (DOM/CSS transitions; no physics engine)

## Input & Platform

<!-- Written by /setup-engine. Read by /ux-design, /ux-review, /test-setup, /team-ui, and /dev-story -->
<!-- to scope interaction specs, test helpers, and implementation to the correct input methods. -->

- **Target Platforms**: Web (browser SPA; phone-first + laptop) — confirmed game-concept 2026-11-08
- **Input Methods**: Touch (mobile browser), Keyboard/Mouse (desktop browser)
- **Primary Input**: Touch (phone-first per Target Player Profile)
- **Gamepad Support**: None
- **Touch Support**: Full
- **Platform Notes**: web-only stack (see `docs/engine-reference/web/VERSION.md`); 44 px minimum hit areas; pinch-zoom never blocked; Vietnamese UI with `lang="en"` spans for English study content; filled by hand 2026-11-09 during `/ux-design` (out-of-catalog engine registered by hand — commit 692771c precedent)

## Naming Conventions

<!-- Web/TypeScript defaults from /setup-engine (references/web.md W3), 2026-11-10 -->

- **Classes** (and types/interfaces): PascalCase (e.g., `GameHook`)
- **Variables** (and functions): camelCase (e.g., `newState()`)
- **Signals/Events**: event handlers `on<Event>` (e.g., `onSubmit`)
- **Files**: kebab-case (e.g., `rules.ts`)
- **Scenes/Prefabs**: n/a — React SPA; components live in kebab-case files
- **Constants**: SCREAMING_SNAKE module-level constants (e.g., `STEP`)

## Performance Budgets

- **Target Framerate**: [TO BE CONFIGURED]
- **Frame Budget**: [TO BE CONFIGURED]
- **Draw Calls**: [TO BE CONFIGURED]
- **Memory Ceiling**: [TO BE CONFIGURED]

## Testing

- **Framework**: Vitest (unit) + Playwright (integration/e2e on the single-file build) — decided by /test-setup 2026-11-09; naming contract `tests/**/*_test.ts` (needs an explicit vitest `include`)
- **Minimum Coverage**: [TO BE CONFIGURED]
- **Required Tests**: Balance formulas, gameplay systems, networking (if applicable)

## Forbidden Patterns

<!-- Add patterns that should never appear in this project's codebase -->
- [None configured yet — add as architectural decisions are made]

## Allowed Libraries / Addons

<!-- Add approved third-party dependencies here -->
- [None configured yet — add as dependencies are approved]

## Architecture Decisions Log

<!-- Quick reference linking to full ADRs in docs/architecture/ -->
- ADR-0001 — Seeded PRNG and stream derivation (`docs/architecture/adr-0001-seeded-prng-and-stream-derivation.md`)
- ADR-0002 — Persistence boundary and backend stack: Node LTS + Fastify + PostgreSQL (`docs/architecture/adr-0002-persistence-boundary-and-backend-stack.md`)
- ADR-0003 — Commit protocol and trust model (`docs/architecture/adr-0003-commit-protocol-and-trust-model.md`)
- ADR-0004 — Module layout (code root `src/`) and B-series extraction (`docs/architecture/adr-0004-module-layout-and-b-series-extraction.md`)
- All four Accepted 2026-11-10 (commit e341a5c); full set in `docs/architecture/`

## Engine Specialists

<!-- Written by /setup-engine when engine is configured. -->
<!-- Read by /code-review, /architecture-decision, /architecture-review, and team skills -->
<!-- to know which specialist to spawn for engine-specific validation. -->

<!-- Web has no engine specialist agent (references/web.md W7, 2026-11-10):
     engine work and API checks route to lead-programmer against
     docs/engine-reference/web/. -->

- **Primary**: lead-programmer
- **Language/Code Specialist**: lead-programmer (TypeScript)
- **Shader Specialist**: lead-programmer (no dedicated Web shader agent)
- **UI Specialist**: lead-programmer
- **Additional Specialists**: none
- **Routing Notes**: Invoke lead-programmer for all engine work and code review. Verify uncertain APIs of the pinned versions (Vite 8, Tailwind 4, lucide-react 1.x postdate the model cutoff) against docs/engine-reference/web/ and node_modules types — never fill gaps from training data (`NOT SOURCEABLE` per .claude/rules/skill-authoring.md).

### File Extension Routing

<!-- Skills use this table to select the right specialist per file type. -->
<!-- Web routes everything to lead-programmer (no specialist agents). -->

| File Extension / Type | Specialist to Spawn |
|-----------------------|---------------------|
| Game code (.ts, .tsx) | lead-programmer |
| Shader / material files (.glsl, .wgsl) | lead-programmer |
| UI / screen files (.tsx, .css) | lead-programmer |
| Scene / prefab / level files | n/a — React SPA |
| Native extension / plugin files | n/a — web stack |
| General architecture review | Primary |
