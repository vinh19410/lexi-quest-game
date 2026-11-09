# Project Stage Analysis

**Date**: 2026-11-09 (second pass today — supersedes the morning report written before the Core quartet closed)
**Stage**: Systems Design → Technical Setup (observed: boundary reached)
**Stage Confidence**: CONCERNS — configured stage and observed artifacts disagree; signals straddle the Systems Design / Technical Setup boundary
**Workflow tier**: `rigor: standard` / `automation: autonomous` — only required docs flagged as gaps
**Deterministic check**: `artifact-check.sh` — 49 steps catalogued, 25 NO_CHECK (the honest bound on existence checks)

## Stage Detection

**Configured stage: Concept** (`project.yaml: project.stage: Concept`; `production/stage.txt` agrees).

**Observed artifacts indicate: late Systems Design, at the Technical Setup boundary.**

Since the morning report (which observed 4/10 MVP GDDs approved), the design side essentially completed:

- **All 10 MVP GDDs authored** — `systems-index.md` Progress Tracker: "MVP systems designed 10/10", with 9 of 10 marked Approved in the tracker's own per-system list (accounts-backend, question-content, hero-class, opponent-ai, battle-system, forge-srs, tower, speech-io, equipment); ui-shell is "Designed pending review" in the tracker but per session state its lean review is DONE with both findings repaired in-session — a **fresh-session re-review is the remaining step**, not authoring.
- Review logs exist for all 13 design docs (`design/gdd/reviews/`).
- Both post-MVP starts done: meta-progression (vertical slice) and ranked-league (Alpha) designed pending review.
- The Systems Design catalog steps that remain absent — `review-all-gdds` (no cross-review run) — are the signature of a phase finishing, not a phase starting.

**Technical Setup partially applies**: the systems index exists and `engine-setup` is ABSENT (no engine/stack entry in `project.yaml` — the web-native TS/React decision of 2026-11-08 lives only in session state and the prior report). Foundation ADRs (persistence boundary, PRNG algorithm) are named in approved GDDs but not written. These are Technical Setup's opening moves, queued but unstarted.

The configured `Concept` stage is stale: no `/gate-check` has advanced it while the design phase ran. This is expected lag, not lost work — but it must be reconciled before the technical-setup gate is meaningful.

## Completeness Overview

| Area | Completeness | Detail |
|------|-------------|--------|
| Design (MVP) | ~95% authored+approved | 10/10 MVP GDDs authored; 9 approved in tracker + ui-shell repaired pending re-review = 10 pending that one step; 1 required catalog step (`review-all-gdds`) not yet run |
| Design (post-MVP) | 2/6 started | meta-progression (vertical slice) and ranked-league (Alpha) designed pending review; localization + 3 others untouched (by design at this stage) |
| Code | 0% authored | Code root `src/` holds only `CLAUDE.md` — 0 source files. Not greenfield: the working prototype lives in `raw-data/lexi-quest-design/` (React 19 + Vite + Tailwind v4, 15 source files, ~3,800 LOC, nested git repo, untracked in this repo) |
| Architecture | 0% | `docs/architecture/` holds only `tr-registry.yaml` — 0 ADRs, no `architecture.md`; two ADRs (persistence boundary, PRNG/OA-OQ1) are explicitly queued |
| Production | Matches stage | No epics/sprints expected before Pre-Production — not flagged at `standard`; session logs + `active.md` current |
| Tests | 0% | No test files, no CI workflow (appropriate — no production code exists) |
| Registry | 27 entries | `design/registry/entities.yaml` validated; file carries uncommitted modifications per git status |

## Gaps Identified (per `standard` tier)

1. **ui-shell fresh-session re-review pending** — review verdict NEEDS REVISION was reached and both findings (BLOCKING screenshot-AC count 7→8; RECOMMENDED commit nav-block cite E4→E2) were repaired in-session; the review protocol requires the re-review in a fresh session. This is the last blocker to a fully-approved MVP set.
2. **`/review-all-gdds` not run** — a complete related set (all 10 MVP GDDs) now exists; the required cross-review is now appropriate and was premature this morning.
3. **Foundation ADRs not written** — persistence boundary (accounts-backend companion ADR) and PRNG algorithm (OA-OQ1, owner technical-director); opponent-ai OA12/OA18/OA20 and the F2 stream contract registration block on these.
4. **Engine/stack entry absent from `project.yaml`** — `engine-setup` reads ABSENT; the Concept → gate progression and the code-root resolution both need the web-native TS/React decision recorded in config, not just in session state.
5. **`/consistency-check` queued but unrun** — with 13 GDDs now in flight, the cross-doc numeric consistency pass (per session state's plan) is due before the stage gate.
6. *(Minor doc drift)* systems-index Progress Tracker is behind in two places: "Design docs reviewed: 4 / approved: 5" undercounts (review logs exist for 13 docs; 10 approvals on the tracker's own per-system lines), and ui-shell's status line predates its in-session repair. `design/registry/entities.yaml` and `project.yaml` carry uncommitted modifications.

**Not flagged at this tier**: art bible (no visual-asset stories), UX specs, epics/sprint plans, non-MVP GDDs, unit tests (no production code yet).

## Recommended Next Steps (priority order)

1. **Fresh-session `/design-review ui-shell`** — closes the last open MVP approval (session state's declared next step).
2. **`/consistency-check`** — cross-doc numeric pass over the now-complete MVP set.
3. **`/architecture-decision` × 2** (technical-director) — persistence boundary ADR + PRNG algorithm ADR; unblocks opponent-ai OA12/OA18/OA20 and registers the F2 stream contract.
4. **Write the web-native stack entry to `project.yaml`** — closes gap 4, resolves the code root formally, unblocks the technical-setup gate.
5. **`/review-all-gdds`** — the complete MVP set now justifies the required cross-review.
6. **`/gate-check technical-setup`** — reconciles the stale `Concept` stage once 1–5 land; expect the observed stage to then formally advance.
7. **Housekeeping**: bring the systems-index Progress Tracker counts up to date; commit the tracked-but-uncommitted design work (`design/gdd/`, `design/registry/entities.yaml`, `project.yaml`); decide `raw-data/`'s fate (track, or migrate into `src/` at Production start).
