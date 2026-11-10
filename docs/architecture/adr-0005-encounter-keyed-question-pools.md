# ADR-0005: Encounter-Keyed Question Pools

## Status

Accepted

## Date

2026-11-10

## Last Verified

2026-11-10

## Decision Makers

Technical-director role via autonomous run (`project.yaml` `modes.automation: autonomous`); lean review — TD-ADR skipped (`review_mode: lean`). The decision direction was pinned by the user-approved gate path: the question-draw ADR must follow the **tower-verified resolution** of cross-review blocker C-B1, not battle-system's pre-fix Rule 22 wording (gate report `production/gate-checks/gate-check-technical-setup-2026-11-10.md`; review report `design/gdd/gdd-cross-review-2026-11-10.md`).

## Summary

Pins how question pools are keyed, gated and drawn from: **two pool shapes selected by `encounter_type`** — battle-mode encounters draw from *module × round-type* pools, tower-mode encounters draw from *module × stage* mixed pools (separate boss pool) — both build-gated from one shared data file, drawn k = 1 per round by battle-system's seeded question stream. Tower never picks questions. The split is server-verifiable at battle-start registration because `encounter`, `module` and `content_version` already ride `/api/battles/start`.

## Engine Compatibility

| Field | Value |
|-------|-------|
| **Engine** | Web — React ^19.0.0 + TypeScript ^5.7.0 client; Node LTS + Fastify + PostgreSQL backend (ADR-0002) |
| **Domain** | Core / Content (data architecture; no rendering, input or engine API surface) |
| **Layer** | Foundation — every question-consuming system (battle, tower, forge, real-pvp) builds on this keying |
| **Knowledge Risk** | LOW — this ADR claims no post-cutoff engine API behavior. It is pure TypeScript modules, a data file, and an HTTP contract already pinned by ADR-0002. VERSION.md's `NOT SOURCEABLE` discipline applies only where Vite/Tailwind/React behavior would be asserted; none is here |

## ADR Dependencies

| ADR | Relationship |
|-----|--------------|
| ADR-0001 (seeded PRNG and stream derivation) | **Depends on** — question draws come from battle's seeded `question` stream; draw sequence is a pure function of `(seed, pools)`; no stream sharing, no re-draw of a resolved round |
| ADR-0002 (persistence boundary and backend stack) | **Depends on** — question banks are server-owned (`question_content_banks`), delivered via the versioned `content_delivery` API; pool minimums ship inside the versioned content payload, so a content edit re-runs the build gate without redeploy |
| ADR-0003 (commit protocol and trust model) | **Depends on** — `/api/battles/start {seed, encounter, module, opponent_config_ref, content_version, loadout_digest}` is the registration point where pool validity is checked server-side, consistent with Stage-1 replay-verify |
| ADR-0004 (module layout and B-series extraction) | **Depends on** — the encounter-type config contract (`TR-battle-system-021`) is the mechanism that carries `encounter_type` to battle; this ADR pins which pools each value selects |

## Context

Cross-review blocker **C-B1** (2026-11-09) found the two Approved GDDs describing incompatible draw architectures over the same content system: battle-system's pre-fix Rule 22 drew every round from a *module × round-type* pool (build-gated ≥ 8), while tower's Core Rule 4 required draws from the *module × stage* mixed pool (minimums ≥ 6 / ≥ 4, boss ≥ 4) — the stage-pool → round-type mapping existed in neither document, and the pool-size gates contradicted each other (a shipped stage pool of 6 fails the ≥ 8 guard; boss pools fail it by design).

The contradiction was resolved **in content** on 2026-11-09 (battle-system Rule 22 re-keyed by encounter type; tower TW19 tests exactly that contract) and verified as a coordinated set by the 2026-11-10 cross-GDD re-run. What remained unpinned was the architecture decision itself: without an ADR, the resolution lives only in GDD prose and a story or refactor could re-litigate it. This ADR records that resolution as the binding decision, per the gate's requirement that the ADR follow the tower-verified resolution.

Registry stances honored (checked 2026-11-10, no conflicts): `question_content_banks` owned by accounts-backend via the versioned content API; `content_delivery` consumed by battle/tower/forge/ui-shell; `battle_telemetry` start registration already carries `encounter` + `module` + `content_version`; forbidden patterns respected — no hardcoded pool sizes in logic (constants live in a data file), no build-time content bundling, no unseeded draws.

## Decision

1. **Pools are keyed by `encounter_type`** — exactly two shapes:
   - **Battle-mode** (`friend`, `ranked`): one pool per *module × round-type* (`vocab_strike`, `grammar_shield`, `listening_pierce`, `ultimate_burst`).
   - **Tower-mode** (`tower_stage`, `tower_boss`): one mixed pool per *module × stage* (stages 1–3) and one per *module × boss*; the round type selects the slice at draw time; a composition gate guarantees ≥ 1 question per round-type in every shipped pool.
2. **Pool minimums are build gates over one shared data file** — all five constants live in `content/config/pool-minimums.ts`, consumed by question-content's Core Rule 6 build gate; battle-system, tower and forge-srs read the same constants and never hardcode them (registry forbidden pattern `hardcoded_gameplay_constants`): `min_battle_pool_size` default **8** (safe band 8–16), `min_tower_stage_pool_size` default **6** (band 6–12), tower boss ≥ **4**, composition gate ≥ 1 per round-type, glossary ≥ 24 (32 = authoring target, not gate).
3. **The draw contract is battle-owned**: each round draws exactly **k = 1** from the encounter's pool via battle's seeded question stream; no question repeats within a battle; the draw sequence is a pure function of `(seed, pools)`; battle-system draws — **tower never picks questions** (tower's config contract selects only the encounter).
4. **Pool validity is server-verifiable at registration**: `/api/battles/start` already receives `encounter`, `module` and `content_version`; the server validates the referenced payload's pools against the gates and rejects registration fail-closed when a pool is undersized — a client cannot start a battle on content the build gate would have failed.
5. **Explicitly not decided here**: question-content F5's session-variety retuning (`battles_per_typical_session` re-estimation stays with F5's signal); real-pvp's draw transport and server-callable draw (Required ADR #7, pre-PvP-epic); forge `forge_recall`/`forge_filler` draws (runtime-built from the rune queue / global glossary, no battle pools involved).

## Alternatives Considered

- **Battle's pre-fix wording (module × round-type everywhere)** — rejected: starves tower stage pools (they are never consumed), contradicts tower's Approved Core Rule 4, and the ≥ 8 guard fails boss pools (≥ 4) by design. This is the exact wording the gate required the ADR to avoid.
- **Tower-side drawing** — rejected: breaks the ownership split both GDDs state (tower selects the encounter; battle owns the draw and the stream), forks stream accounting (ADR-0001 forbids shared or interleaved streams), and duplicates repeat-avoidance logic in two systems.
- **One unified pool shape with tags (every pool carries all four round-types; mode filters)** — rejected as over-abstraction at MVP: both shapes already exist as build-gated data with distinct minimums, the composition gate covers the mixed case, and a unified shape would force battle-mode pools to carry tower-only structure. Revisit only if a third encounter family lands.

## Consequences

**Positive** — a single source of truth for draw keying across battle/tower/forge/real-pvp; pool edits iterate through the versioned content payload with no redeploy (build gate re-runs server-side on publish); registration-time validation makes undersized pools unstartable rather than mid-battle failures; BS31's burnout guard stays satisfiable per shape (8 ≥ 2 × 4 battle-mode; F2/F3 + composition gate tower-mode).

**Costs** — two pool shapes mean two build-gate code paths and two minimums to keep in sync with content authoring; the composition gate is an additional validation that a naive pool editor can fail; the mixed pool's round-type slices must be re-derived whenever content changes a question's round-type tag.

## Risks

- **Authoring burden**: tower-mode needs ≥ 6 questions × (3 stages + boss) per module before a floor ships. Mitigated by MVP scope (one floor, 32-word glossary, per-module ≥ 8 distinct words) and the build gate failing loudly rather than shipping a thin pool.
- **Slice starvation inside a mixed pool**: the composition gate guarantees ≥ 1 per round-type, but a 6-question pool has thin slices (e.g. 1 ult question); in-battle no-repeat plus k = 1 makes this safe at MVP, and `min_tower_stage_pool_size`'s 6–12 band is the retuning lever if playtests show repetition.

## GDD Requirements Addressed

| Requirement | GDD source |
|-------------|-----------|
| TR-battle-system-019 — k = 1 seeded draw, no in-battle repeats, sequence pure in `(seed, pools)` | battle-system Rule 18/22 (this ADR pins which pools) |
| TR-battle-system-021 — encounter-type config selects pools; battle consumes, never chooses content | battle-system Rule 22 + ADR-0004 mechanism |
| TR-tower-018 / TR-tower-019 — encounter config shape; unchanged 4-round battle drawing k = 1 from the module × stage pool under Rule 22 | tower Core Rules 3–4, TW19 |
| TR-question-content-020 / 026 / 027 / 028 / 029 / 030 / 032 — pool keying, k = 1, one shared constants file, the three build gates, `battles_before_repeat` | question-content F1–F5, `content/config/pool-minimums.ts` |

## Performance Implications

Negligible. Pool sizes are bounded by the gates (8–16 battle-mode; 6–12 stage); a draw is one stream draw plus a slice filter over an in-memory payload. The content payload grows linearly with pool minimums and is fetched once per content version (ADR-0002 caching).

## Migration Plan

None — no code exists yet (`src/` unscaffolded). The data file, build gate and draw implementation land with their content/battle stories; the registry gains an architecture-registry entry for the pool-keying stance when this ADR is accepted.

## Validation Criteria

- Build gate fails any payload with a pool below its minimum or missing a round-type slice (question-content Core Rule 6).
- Battle-start registration rejects an undersized pool for the referenced `content_version` (fail-closed).
- TW19 passes: a tower stage battle draws k = 1 per round from the module × stage pool under Rule 22, no tower-side draw.
- BS36 replay determinism unaffected: same seed + pools reproduce the draw log bit-exactly.

## Related

- Cross-review blocker C-B1: `design/gdd/gdd-cross-review-2026-11-09.md` (finding), `design/gdd/gdd-cross-review-2026-11-10.md` (verified resolution)
- Gate report: `production/gate-checks/gate-check-technical-setup-2026-11-10.md` (recommendation that this ADR follow the tower-verified resolution)
- Battle-system Rule 22 (`design/gdd/battle-system.md`), tower Core Rule 4 + TW19 (`design/gdd/tower.md`), question-content F1–F5 + Core Rule 6 (`design/gdd/question-content.md`)
