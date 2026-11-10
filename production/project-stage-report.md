# Project Stage Analysis

**Date**: 2026-11-10 (fourth pass — first since the Technical Setup wave landed; supersedes the 2026-11-09 third pass)
**Stage**: Systems Design (configured) — **observed: Technical Setup, ~75% complete**
**Stage Confidence**: CONCERNS — configured and observed stages now disagree (configured value is one phase behind the artifacts)
**Workflow tier**: `rigor: standard` / `automation: autonomous` — only required docs flagged as gaps
**Deterministic check**: `artifact-check.sh` — 49 steps catalogued, 25 NO_CHECK (the honest bound on existence checks)

## Stage Detection

**Configured stage: Systems Design** (`project.yaml: project.stage` + `production/stage.txt` both read Systems Design; advanced by `/gate-check systems-design` on 2026-11-09, CONCERNS accepted).

**Observed artifacts indicate: Technical Setup, late phase.** Since the third-pass report was written (still on 2026-11-09), the entire Technical Setup wave ran in autonomous sessions:

| artifact-check step (technical-setup) | Status |
|---|---|
| create-architecture (`architecture.md`) | PRESENT — 242 lines, System Layer Map + Required ADRs + QQ ×10 |
| architecture-decision (ADRs, min 3) | PRESENT ×4 — Foundation quartet ①PRNG ②persistence/backend ③commit/trust ④module-layout, all **Proposed** |
| architecture-review | PRESENT — verdict **CONCERNS** (2026-11-09); 418 TRs registered, 54 covered 🟡, 2 named ❌ gaps, 4 GDD revision flags |
| control-manifest | **ABSENT** — blocked by design until ADRs ①–④ are **Accepted** |
| accessibility-doc | PRESENT — `design/accessibility-requirements.md` (285 lines, 12/12 sections, tier Standard) |
| interaction-patterns | PRESENT — `design/ux/interaction-patterns.md` (556 lines, 19 patterns + 5 gaps) |
| test-setup | PRESENT — `tests/` scaffolding (README, unit/integration dirs, smoke seed) + `.github/workflows/tests.yml` (job self-skips until `package.json` lands) |

Pre-Production has also been touched in parallel: ux-design shows **SHORT (1/3 docs)** — the 8-screen spec ladder (Auth → Home hub → Battle HUD → Battle interactions → Forge/Tower/Inventory/League) is queued but unauthored.

The one artifact the catalog cannot see: all four ADRs are **Proposed, not Accepted** — `/architecture-review`'s top recommendation is to accept them, which is a user decision.

## Completeness Overview

| Area | Completeness | Detail |
|------|-------------|--------|
| Design | ~100% at this tier | 15/15 GDDs Approved (all re-reviews passed 2026-11-09); architecture-review flags 4 GDDs for small revisions (battle-system, opponent-ai, ranked-league, equipment — `resolve_round` input_source, grace-window wording, EQ25 stream-ownership cross-ref) |
| Architecture | ~80% | `architecture.md` v1 + ADR quartet (Proposed) + architecture-review + 573-line requirements-traceability over 418 TRs. Missing: ADR acceptance, control-manifest, later-tier ADRs #6–#8 (analytics sink OQ-AN1, transport/hosting OQ-RVP4/5, speech scoring OQ-RVP3) |
| Code | NOT ASSESSED formally (code root newly resolved by ADR-0004 `src/`, itself Proposed) — practically 0% | `src/` holds only `CLAUDE.md`; prototype lives in gitignored `raw-data/lexi-quest-design/` (~15 files, React 19 + Vite + Tailwind v4); scaffold story (Vite 8 + vitest install + example test) is queued |
| Production | Matches stage + parallel start | No epics/stories/sprints (expected — not flagged at `standard`); ux screen specs 1/3; working tree **not clean** (see gap 5) |
| Tests | 0% coverage, scaffolding present | `tests/` + CI workflow exist but self-skip until the app scaffold lands; example test = ADR-0004 scaffold story |

## Gaps Identified (per `standard` tier)

1. **ADRs ①–④ all Proposed — acceptance is the critical-path user decision.** Also reconcile a documented discrepancy: session state records the acceptance order as 0001→0002→0003→0004, while the architecture review recommends **0001→0002→0004→0003** (0002 has first-resolve items: seed_hi/seed_lo INT overflow, `(type,seed)` unique constraint, state_digest home, SameSite co-location; ADR-0003 depends on 0001+0002). The review's order supersedes the earlier note — confirm before accepting.
2. **`/create-control-manifest` blocked** until ADRs are Accepted — the only ABSENT required Technical Setup artifact.
3. **UX screen-spec ladder incomplete** (artifact-check `SHORT`, 1/3 docs) — 8 specs queued in ui-shell's UI Requirements ladder, then `/ux-review` all, before the pre-production gate.
4. **`/consistency-check` still unrun** — carried over from the third pass; the numeric cross-pass over all 15 approved GDDs is due before the technical-setup gate. Note the old `design/registry/entities.yaml` now coexists with the new `docs/registry/architecture.yaml` (TR registry) — the consistency pass should state which registry is authoritative for GDD values.
5. **Entire Technical Setup wave is uncommitted** — `architecture.md`, all 4 ADRs, the architecture review + traceability matrix, `tests/`, `.github/workflows/`, `design/accessibility-requirements.md`, `design/ux/`, plus edits to `tr-registry.yaml`, `architecture.yaml`, `VERSION.md`, `test-standards.md`, `technical-preferences.md`. Per the collaboration protocol no commit happens without user instruction — this needs an explicit go-ahead.
6. **Systems-index tracker drift persists** — summary rows (~:206–209) still list battle-system / hero-class / question-content "Needs Revision" and real-pvp "Designed pending review" although the per-system rows read Approved.
7. **Registry duplicate `revised:` keys ×2** — `design/registry/entities.yaml` lines ~500 and ~1058 (parser-confirmed; the line numbers shifted from the third pass's 1072-1073, and a second instance exists).
8. **Architecture-review follow-ups**: 2 named ❌ TRs (TR-analytics-043 → ADR #6, TR-real-pvp-039 → ADR #8), 4 GDD revision flags, 2 doc bugs in `architecture.md` ("14 system GDDs"→15; stale "ADRs Referenced: none yet").
9. **`raw-data/` fate decision rides ADR-0004 acceptance** — ADR-0004 freezes it in place as a read-only pin source; the product-level track-vs-migrate call stays deferred to a Production review.

**Not flagged at this tier**: art bible (no visual-asset stories), epics/sprint plans, non-required architecture docs, unit tests.

## Recommended Next Steps (priority order)

1. **Accept the Foundation ADR quartet** (user decision; confirm the review's 0001→0002→0004→0003 order vs the session state's 0001→0002→0003→0004) — unblocks the control manifest and the scaffold story.
2. **Commit the Technical Setup wave** (needs explicit user instruction; natural splits: architecture docs / ADRs + review / test scaffolding + CI / UX + accessibility docs).
3. **`/create-control-manifest`** once ADRs are Accepted.
4. **Finish the ux-design screen specs ①–⑧** → `/ux-review` all.
5. **`/consistency-check`** over the 15-GDD set (declare registry authority first).
6. **Housekeeping** — fix tracker drift + the 2 duplicate `revised:` keys + `architecture.md`'s 2 doc bugs; fold the 4 review-flag GDD edits into their next edits.
7. **`/gate-check technical-setup`** — the gate unlocks when ADR acceptance, control manifest, ux specs, and the consistency pass are in.

---

## Addendum — 2026-11-10, later this session

**Gap 1 closed: the Foundation quartet is Accepted.** All four ADRs (0001 PRNG, 0002 persistence/backend, 0003 commit/trust, 0004 module layout) moved Proposed → Accepted via `/architecture-decision accept`, in the confirmed order 0001→0002→0004→0003 (ADR-0003's dependency gate verified live: 0001+0002 Accepted first). No stories were waiting (no epics exist). Follow-on state refresh: `architecture.md`'s two review-flagged doc bugs fixed ("14"→15 GDDs, stale "ADRs Referenced: none yet"), its layer-map box + TR-baseline note updated; `VERSION.md` code root + backend now read DECIDED. `requirements-traceability.md`'s 🟡-Proposed coverage column is left for the next `/architecture-review` run (fresh session). Acceptance edits are uncommitted.

**Remaining to the technical-setup gate:** `/create-control-manifest` (now unblocked) → ux screen specs ①–⑧ → `/ux-review` → `/consistency-check` → housekeeping (gaps 6–7) → gate.
