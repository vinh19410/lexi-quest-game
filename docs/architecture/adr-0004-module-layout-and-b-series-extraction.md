# ADR-0004: Module Layout and Shared B-Series Extraction Plan

## Status
Accepted

## Date
2026-11-09

## Last Verified
2026-11-09

## Decision Makers
Technical-director role via autonomous run (`project.yaml` `modes.automation: autonomous`); lean review — TD-ADR skipped (review_mode: lean). Requirements sourced from Approved GDDs: real-pvp Core Rule 2 (OQ-RVP1), hero-class Core Rule 1 + HC1/HC2/HC7, question-content Core Rules 1/7 + states, accounts-backend Core Rule 7; architecture.md layer map.

## Summary
real-pvp owes its existence to one implementation property — the server twin must run battle's B1–B12 "from one shared implementation — formula drift between client ghost battles and server duels is a build failure, not a balance question (one formula module, two hosts)" (OQ-RVP1). Decided here: the repo is a **single Vite app at the root** (`src/` = code root), with the **deterministic sim core isolated in `src/game/`** (pure TypeScript — no React, DOM, network, or storage imports, lint-enforced), the **backend in `server/`** importing `src/game/**` verbatim (ADR-0002's host), **class/passive data as JSON data files** (hero-class HC1: no gameplay value in source), **question banks in a `content/` directory** (authoring source only — the client fetches content at runtime, never bundles it), a **shared constants module** for registry-owned values (`fast_answer_threshold` consumed by both its GDD consumers from one constant), the **`resolve_round` substitution point** as battle-system's export contract (ghost at MVP, live-commit stream in PvP), and **`raw-data/` frozen in place** as read-only reference — never imported, excluded from builds.

## Engine Compatibility

| Field | Value |
|-------|-------|
| **Engine** | Web — React ^19.0.0 + TypeScript ^5.7.0 + Vite ^8.0.5 (pinned 2026-11-09 from the prototype) |
| **Domain** | Core |
| **Layer** | Foundation — the physical substrate every system's first story lands in |
| **Knowledge Risk** | LOW for the layout itself (directories + import rules are tool-agnostic); **HIGH flags attach to Vite 8 specifics** (per `docs/engine-reference/web/VERSION.md` knowledge-gap note) — config-file details are verified at `/test-setup` scaffold time, not assumed here |
| **References Consulted** | `docs/engine-reference/web/VERSION.md`; `design/gdd/real-pvp.md` Core Rule 2 + Interactions; `design/gdd/hero-class.md` Core Rule 1, HC1/HC2/HC7; `design/gdd/question-content.md` Core Rules 1/7; `design/gdd/accounts-backend.md` Core Rule 7 |
| **Post-Cutoff APIs Used** | None in this decision; Vite 8 config API verified at scaffold |
| **Verification Required** | (1) boundary lint rules fail on a planted violation (watch them fail once); (2) B-series vectors pass in both CI contexts (client build output + server import); (3) cross-host replay identity (ADR-0003 criterion 5) green; (4) class registry loads from the JSON file with no code change (HC1) |

## ADR Dependencies

| Field | Value |
|-------|-------|
| **Depends On** | None at decision level — layout is independent of ADR-0001–0003's behaviors; it is where their artifacts physically live (prng.ts, commits verification import) |
| **Enables** | ADR-0003 Stage 1's physical import (server replays via `src/game/**`); real-pvp's not-preclude set (this ADR *is* OQ-RVP1's resolution) |
| **Blocks** | Every first implementation story in every system (nothing exists to import into until the skeleton lands). No stories exist yet (no epics) |
| **Ordering Note** | `/test-setup` (scaffold) implements this layout's skeleton and its CI rules; the ADR is the scaffold's spec. resolve_code_root stays "unset" for this project by design — engine.name Web is out-of-catalog, callers announce that honestly; this ADR is the hand-pinned equivalent |

## Context

### Problem Statement
Four GDDs converge here. real-pvp Core Rule 2 makes shared-implementation a *build property*, not a convention — its entire server twin (and therefore the game's deferred Full Vision) depends on importing battle's round engine verbatim. hero-class Core Rule 1 requires class values in a data file ("nothing is hardcoded… editing the data file changes what the registry serves, with no code change" — HC1). question-content owns the bank *schema* but lives downstream of a delivery contract (accounts-backend Core Rule 7) that needs an authoring home and a publish path. And accounts-backend Core Rule 7/AC-D1 forbids the naive mistake — content must be *fetched*, never bundled. No code root exists yet; this ADR is the layout every scaffold and story builds into.

### Constraints
- Drift between the two hosts is a **build failure** (real-pvp CR2) — the layout must make the shared import physical and CI-checkable, not aspirational.
- `src/game/` must stay importable by the server (ADR-0003 Stage-1 replay) — it can never import React, DOM APIs, browser storage, or the network layer, and cannot depend on module side effects that assume a browser.
- Class data: HC1/HC2 require a data file load (no source-code values); HC7 requires `fast_answer_threshold` read by *both* consumers from the *same* constant.
- Content: one global content version (question-content Core Rule 7); authoring source needs a directory contract with a validate→publish path; hard deletion of published questions is forbidden (soft-delete only).
- `raw-data/` is the version-pin source of truth until the production app is scaffolded (VERSION.md) — it cannot simply vanish, and deleting project files is a user-decision category this run must not touch.
- The repo already pins pnpm; the layout must not fight the pinned toolchain.

### Requirements
- Module boundaries mirror the layer map (architecture.md): Foundation/Core/Feature logic in the sim core; Presentation isolated in the React app; the backend a sibling host.
- Every registry-owned constant (pool minimums ≥ 8 build gates, passive constants, `fast_answer_threshold`, ghost HP/delays, battle constants) has exactly one home in code and a traceable GDD source.
- The `resolve_round(profile, mode, seed, round_index)` substitution point survives as a battle-system export — the input source is a parameter, never a branch buried in battle code.
- `/test-setup` and every future story can resolve "where does this file go" from the layout alone.

## Decision

### 1. Repo topology

```
/ (repo root — the Vite app; pnpm)
├── index.html  vite.config.ts  package.json  tsconfig.json
├── src/                      # CLIENT — the code root
│   ├── main.tsx  App.tsx
│   ├── ui/                   # Presentation layer: ui-shell screens, routing, components (React only)
│   ├── net/                  # client commit layer: commit envelope, F3 ladder, Unsaved-state machine (ADR-0003 §5)
│   └── game/                 # DETERMINISTIC SIM CORE — pure TS, no React/DOM/network/storage imports
│       ├── prng.ts           # ADR-0001 — the project's only seeded RNG
│       ├── formulas/         # battle B1–B12, hero F1, ranked RL1–RL5, meta/equipment formulas — one implementation
│       ├── constants/        # shared constants module (registry-owned values; one module per owning GDD)
│       ├── data/             # JSON data files — classes.json (hero-class), passive definitions
│       └── systems/          # battle, opponent-ai, forge-srs, equipment, tower, meta-progression, ranked-league, speech-io (scorer contract) — pure functions, DI over singletons
├── server/                   # BACKEND — Node LTS + Fastify (ADR-0002); may import src/game/** ONLY
│   └── src/  (routes/  db/  verify/  mail/)
├── content/                  # question banks — authoring source (question-content schema)
│   ├── version.json          # current global content version
│   └── banks/<module>/<round-type>.json
├── tests/unit/<system>/      tests/integration/<system>/
├── assets/  design/  docs/  tools/  production/  raw-data/   # raw-data = FROZEN (see §5)
└── docs/architecture/  docs/registry/
```

**Import rules (lint-enforced, watched failing once in CI):**
- `src/game/**` imports nothing from `src/ui`, `src/net`, `react`, `react-dom`, DOM/browser globals, or `fetch`/storage — it is host-agnostic pure TS.
- `server/**` imports `src/game/**` freely; never `src/ui/**`, never `src/net/**`.
- `src/net/**` may import `src/game/**` *types*; never runs game math.
- `src/ui/**` may import `src/game/**` and `src/net/**`; nothing imports `src/ui` except `src/ui` and the entry.
- `content/**` is imported by **no** bundle — the client fetches content at runtime (AC-D1); `server/**` reads it only in the publish path.

### 2. Shared formula + constants module (resolves OQ-RVP1)

B1–B12 live once, in `src/game/formulas/`, as pure functions with explicit inputs (elapsed, loadout stats, constants — no ambient state, no clocks read inside formulas; time enters as a parameter, so the server host needs no clock shim). Every other system's F-series math follows the same rule. `src/game/constants/` exposes frozen typed records, one module per owning GDD (`battle.ts`, `opponent-ai.ts`, `question-content.ts`, …), every value commented with its GDD row; `fast_answer_threshold` exists exactly once and is imported by both consumers (hero Wordsmith passive + battle guaranteed crit — HC7's "both consumers read the same constant"). hero-class's registry module loads `src/game/data/classes.json` at runtime (HC1: edit the JSON, no code change; HC2's exact values are assertions in the data-file test).

**Drift = build failure, mechanically:** CI runs the shared-math vector suites twice per push — (a) imported through the client build (Vite bundle context), (b) imported through the server context (tsx) — plus the cross-host replay identity test from ADR-0003. A file that drifts between contexts, or an accidental fork, fails CI before review. This is the enforcement real-pvp CR2 demands; the rule lives in `/test-setup`'s CI scaffold, the principle lives here.

### 3. The `resolve_round` substitution point

battle-system exports `resolve_round(profile, mode, seed, round_index, input_source)` where `input_source` is either the ghost profile (opponent-ai, MVP — draws from `(seed, "ghost")` per ADR-0001) or a live-commit stream (PvP, Full Vision). The substitution is a parameter at the engine boundary — real-pvp CR1's "opponent's live commits replacing `resolve_round(...)`" — never a conditional scattered through round logic. The server twin (Stage 2, deferred) imports the engine and supplies the other kind of stream; nothing in `src/game/systems/battle/` may branch on "am I PvP".

### 4. Content directory contract

`content/` is the **authoring source**, not a runtime dependency: question banks as JSON modules under `content/banks/<module>/<round-type>.json` following question-content's schema; `content/version.json` holds the current global version (one version — Core Rule 7). Publish flow: edit → validation pass (question-content Core Rule 6) → publish tool inserts a new content-version row (ADR-0002's content API serves it; clients invalidate on version compare). Published questions are **soft-deleted only** (superseded content stays queryable across versions — question-content EC). The client never imports `content/` at build time; the server reads it only inside the publish tool.

### 5. `raw-data/` fate: frozen in place

`raw-data/` (the LexiQuest prototype) stays in the repo as **read-only reference**: never imported by `src/` or `server/`, excluded from builds and lint scope, retained as (a) the version-pin source of truth per `docs/engine-reference/web/VERSION.md` until the production `package.json` exists, and (b) the design archaeology the GDDs cite (prototype-validated values). It is not a workspace package, not built, not deployed. Whether to eventually archive it out of the repo is an explicit user decision deferred to a Production-phase review — **this ADR neither deletes nor relocates it.**

### Architecture Diagram

```
            ┌────────────────────────── one shared implementation ──────────────────────────┐
            │  src/game/  prng.ts (ADR-0001) · formulas/ (B1–B12, F-series) · constants/     │
            │             data/ (classes.json) · systems/ (resolve_round substitution here)  │
            └───────────────┬───────────────────────────────────────────────┬───────────────┘
                 imports    │                                               │   imports (Stage-1
                            ▼                                               ▼   verify, Stage-2 host)
              ┌──────────────────────┐                        ┌──────────────────────────┐
              │ src/ client SPA      │  commits/content/auth  │ server/ Node + Fastify   │
              │  ui/ (React only)    │ ◄────────────────────► │  routes/ db/ verify/     │
              │  net/ (commit layer) │   (ADR-0002/0003 wire) │  (ADR-0002; ADR-0003 §3) │
              └──────────────────────┘                        └──────────────────────────┘
              content/ (authoring) ── publish tool ──► content-version rows (served by API,
              never bundled; AC-D1: the client fetches)
              raw-data/ (frozen reference — imported by nothing, built by nothing)
```

### Key Interfaces

```ts
// src/game/systems/battle/round-engine.ts — the substitution point (OQ-RVP1)
export type RoundInputSource =
  | { kind: 'ghost'; profile: GhostProfile }            // MVP: opponent-ai, draws from (seed, "ghost")
  | { kind: 'live'; commits: LiveCommitStream };        // Full Vision: real-pvp server twin

export function resolve_round(
  profile: LoadoutSnapshot, mode: EncounterMode, seed: U64,
  round_index: 0 | 1 | 2 | 3, input: RoundInputSource
): RoundOutcome;   // pure: clocks enter as parameters (elapsed_ms), never read inside

// src/game/constants/ — one frozen record per owning GDD, e.g.
export const BATTLE_CONSTANTS = { fast_answer_threshold_ms: 3000, /* …GDD-traced */ } as const;
export const OPPONENT_AI_CONSTANTS = { hp: [500, 500, 420, 600], reveal_delays_ms: [1000, 800, 1200, 1500] } as const;

// hero-class registry — loads the data file, no code change on value edits (HC1)
export function loadClassRegistry(): Readonly<Record<ClassId, ClassRecord>>;  // reads src/game/data/classes.json
```

### Implementation Guidelines
- **Must** put every gameplay constant in `src/game/constants/` or a JSON data file; **must never** hardcode a gameplay value in source (coding standard; HC1).
- **Must** keep `src/game/**` free of React/DOM/network/storage imports and side effects; **must never** read a clock inside a formula — time is a parameter.
- **Must** consume `fast_answer_threshold` (and every shared constant) from the constants module in every consumer; **must never** restate a constant locally.
- **Must** route the round-engine opponent through the `RoundInputSource` parameter; **must never** branch on encounter kind inside battle logic.
- **Must** treat `content/` as authoring-only; **must never** import it from client code or bundle it.
- **Must** soft-delete published questions; **must never** hard-delete across versions.
- **Must** leave `raw-data/` untouched by builds, lint, and imports; **must never** delete or relocate it without an explicit user decision.
- The scaffold (`/test-setup`) **must** plant the boundary lint rules and the dual-context vector CI job in the same change as the skeleton, and the rules must be watched failing once (planted violation → red → remove).

## Alternatives Considered

### Alternative 1: pnpm workspace monorepo (apps/web, apps/server, packages/game-core)
- **Description**: Three workspace packages with explicit dependency edges; game-core published internally.
- **Pros**: Hardest boundary (package graph enforces imports); versioned internal package.
- **Cons**: A workspace scaffold fights "the Vite app at the repo root gives `src/`" (the layout the repo's own tooling and VERSION.md expect); three package.jsons to keep pinned against a stack already flagged HIGH-knowledge-gap; for a two-host project the same guarantee costs one lint config here.
- **Rejection Reason**: Same enforcement, more moving parts, against the pinned tooling's grain. Revisit only if a third host appears (then the package split is mechanical).

### Alternative 2: Server-side formula fork ("port" the B-series to the server codebase)
- **Description**: Copy the formulas into `server/` at PvP time, "keep them in sync".
- **Pros**: Zero import plumbing.
- **Cons**: Exactly the drift real-pvp CR2 names a build failure — two truths for the game's core math, discovered by balance anomaly instead of CI.
- **Rejection Reason**: Forbidden by the GDD in so many words. The layout exists to make the forbidden thing impossible.

### Alternative 3: Bundle content into the client (build-time import of `content/`)
- **Description**: Import question banks at build; skip the content API round-trip.
- **Pros**: Faster first load; no cache invalidation.
- **Cons**: Violates accounts-backend AC-D1 (content arrives via an observable network request) and Core Rule 7's no-redeploy iteration; breaks the versioned-cache contract ADR-0002 implements.
- **Rejection Reason**: GDD-locked behavior. The content directory is for authors; the API is for clients.

## Consequences

### Positive
- OQ-RVP1 resolves into a physical guarantee: one formula implementation, two importing hosts, CI-enforced drift detection — real-pvp's hardest prerequisite is a lint config and a CI job.
- "Where does this file go" is decidable from the layer map alone; every future story lands without layout debate.
- HC1/HC7's data-file contracts have concrete homes (`src/game/data/`, one shared threshold constant).
- The content pipeline has both ends defined (authoring directory → publish tool → versioned API → client cache) with no build-time coupling.
- The sim core's purity constraint is exactly what ADR-0003's replay-verify and Stage-2 hosting need — the layout and the trust model agree by construction.

### Negative
- Single-app layout means the boundary is lint-enforced, not package-enforced — a disabled lint rule silently weakens it; mitigated by the rules living in the scaffold commit and the watched-failing-once check.
- `src/game/` sits inside the client bundle path — discipline is needed so server-only helpers don't bloat the client bundle; Vite tree-shakes pure modules, and the boundary rules keep UI code out of the core.
- Two CI contexts (client + server import) double the shared-math test runtime — trivial at this suite's size.

## Risks
- **Lint rules disabled "temporarily"** → the scaffold plants them with the skeleton; the planted-violation check makes silent weakening visible in review.
- **Vite 8 config drift from training data** → flagged HIGH by VERSION.md; config specifics land at `/test-setup` against the pinned toolchain, and this ADR deliberately specifies none of them.
- **Content publish tool drift from schema** → the validation pass (question-content Core Rule 6) is the gate; the tool reads the same schema module the client validates with.
- **raw-data/ confusion** (a future story importing a prototype helper) → excluded from tsconfig paths and lint scope; the import would fail to resolve rather than silently link.

## GDD Requirements Addressed

| GDD System | Requirement | How This ADR Addresses It |
|------------|-------------|--------------------------|
| real-pvp.md | Core Rule 2 / OQ-RVP1: same B-series from one shared implementation; drift = build failure, not a balance question | §2: single implementation in `src/game/formulas/`, dual-context CI vectors, server imports verbatim; Core Rule 1's substitution point as a first-class export (§3) |
| real-pvp.md | CR1 server-authoritative duels need the server to own question draw, clocks, RNG streams | `src/game` purity + time-as-parameter make the engine host-agnostic; server imports prng.ts + battle systems unchanged |
| hero-class.md | Core Rule 1 + HC1/HC2: class records in a data file, nothing hardcoded, registry serves from the file | §2: `src/game/data/classes.json` + `loadClassRegistry()`; HC2 values asserted against the file, not source |
| hero-class.md | HC7: `fast_answer_threshold` read by both consumers from the same constant | §2: exactly one constant in `src/game/constants/battle.ts`, imported by hero passive + battle crit |
| question-content.md | Core Rule 1: bank definitions live as data in a content directory; Core Rule 7: one global version; states Draft→Validated→Published→Superseded | §4: `content/banks/**` + `content/version.json`; publish flow = validate → new version row; superseded content retained |
| question-content.md | EC: hard deletion of published questions forbidden | §4: soft-delete only; publish tool retains superseded rows |
| accounts-backend.md | Core Rule 7 / AC-D1: content fetched from the backend, never bundled | §1 import rule: `content/**` imported by no bundle; §4 contract |
| architecture.md | Layer map → physical modules; TR-question-content-012/battle-021/ui-shell-001 boundary TRs | §1 layout mirrors Foundation/Core/Feature/Presentation/Polish with named import rules |

## Performance Implications
- **CPU**: none (a directory layout); dual-context CI adds one test pass.
- **Memory**: none.
- **Load Time**: content unbundled means first load fetches banks (one request at version mismatch — ADR-0002's cache makes warm loads free).
- **Network**: unchanged from ADR-0002's content contract.

## Migration Plan
Greenfield: `/test-setup` implements this layout as the scaffold (skeleton directories, tsconfig paths, boundary lint rules, dual-context CI job, classes.json + registry module, content/ skeleton with version.json). No code exists to migrate; `raw-data/` is frozen where it stands. The scaffold story is the first Core-layer story after this ADR and the quartet are Accepted.

## Validation Criteria
1. Planted-violation check: a `react` import inside `src/game/`, a `src/ui` import inside `server/`, and a `content/` import inside client code each turn CI red — watched failing once, then removed.
2. B-series vector suite passes in both contexts (client build import + server import) in one CI run.
3. Cross-host replay identity (ADR-0003 criterion 5) green on the scaffold.
4. HC1 test: editing `classes.json` changes the registry output with zero source edits; HC2 values assert from the file.
5. HC7 test: both `fast_answer_threshold` consumers import the same exported constant (static import-graph check).
6. AC-D1 observable: a built client makes a network request for content; no `content/` bytes appear in the bundle.
7. resolve_round signature accepts both input-source kinds with the ghost path passing the opponent-ai fixtures.

## Related
- Resolves OQ-RVP1 (real-pvp); the extraction plan real-pvp Dependencies names as a build prerequisite.
- The physical home of ADR-0001 (`src/game/prng.ts`), ADR-0002 (`server/`), ADR-0003 Stage-1 verify import; ADR-⑦ inherits a two-host layout for the PvP transport.
- Implemented by `/test-setup` (scaffold) — this ADR is that scaffold's spec; `/create-control-manifest` extracts the must/never rules per system once the quartet is Accepted.
- Design records: `design/gdd/real-pvp.md` Core Rules 1–2, `design/gdd/hero-class.md` HC1/HC2/HC7, `design/gdd/question-content.md` Core Rules 1/7, `design/gdd/accounts-backend.md` Core Rule 7.
