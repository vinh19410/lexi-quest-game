# Gate Check: Concept → Systems Design

**Date**: 2026-11-09
**Checked by**: gate-check skill
**Resolved config**: workflow: standard (rigor:standard) · qa.level: standard · review_mode: lean · team.size: individual · performance.enforce: warn

## Required Artifacts: 1/1 required present

- [x] `design/gdd/game-concept.md` — exists, 463 lines, real content (Elevator Pitch, Core Identity, Core Loop at 4 cadences, 4 Pillars + Anti-Pillars, MDA analysis, Target Player Profile, MVP Definition with Scope Tiers, Next Steps). Spot-read confirmed non-placeholder.
- [x] Game pillars (recommended at `standard`) — present in-concept (Speed Is Damage / Mistakes Are Materials / Knowledge Is Gear / Honest Ghosts, plus Anti-Pillars).
- [ ] Visual Identity Anchor section (recommended at `standard`) — **ABSENT** → CONCERNS, not blocking at this tier.
- [x] Concept prototype recommendation — satisfied by other means: concept reverse-documented from working prototype `raw-data/lexi-quest-design/src/` (~4,200 LOC React SPA); `/design-review` spot-checked 8 numeric claims against that source with zero discrepancies; concept's "Final Recommendation: GO" is the substantive equivalent of a PROCEED verdict.

## Quality Checks: 3/3 passing

- [x] Game concept reviewed — `/design-review` verdict **APPROVED** (2026-11-08, lean, 0 blocking; `design/gdd/reviews/game-concept-review-log.md`).
- [x] Core loop described and understood — moment-to-moment → short-term → session-level → long-term, all specified.
- [x] Target audience identified — 16–35, TOEIC/IELTS/working-adults segments; web-only platform CONFIRMED 2026-11-08.

## Catalog steps (artifact-check.sh --phase concept)

| Step | Status | Note |
|---|---|---|
| brainstorm | NO_CHECK | Output exists on disk (game-concept.md) — resolved by evidence |
| engine-setup | **ABSENT** (required=true, any_of Godot/Unity/Unreal) | Project direction is web-native TS/React — out of catalog. See Concern 2 |
| game-concept | PRESENT (1) | |
| design-review-concept | NO_CHECK | Review log APPROVED on disk — resolved by evidence |
| art-bible | ABSENT (required=true) | Art bible is not this gate's checklist item (later gate); see Concern 3 |
| map-systems | PRESENT (1) | `design/gdd/systems-index.md` |

NO_CHECK count: 2 — both resolved by on-disk evidence above, none left as MANUAL CHECK NEEDED.

## Director Panel Assessment — 2 of 4 (`workflow: standard`)

> Creative and Art perspectives not consulted at this tier. Raise `modes.rigor` to `full` (or set `modes.workflow: full`) for the complete panel.

**Technical Director: CONCERNS**
Required artifact complete and approved; feasibility proven by the working React 19 / TS 5.7 prototype; platform argument (Godot-HTML5 vs web-native) is a real grounded decision; technical risks honestly named. CONCERN: the web-native direction lives only as prose — `project.yaml` has no engine key while `docs/engine-reference/godot/VERSION.md` (Godot 4.7) remains pinned and @imported by CLAUDE.md; any resolve_config caller defaults toward Godot. Fix (config key readable outside catalog + VERSION.md annotation, or an early ADR) before the Technical Setup gate. Also: when budgets are set later, include a web load-time / time-to-interactive budget, not only frame budgets.

**Producer: CONCERNS**
Gate inputs complete and approved; Systems Design work already substantially executed beyond the gate's requirement — 14/15 systems have GDDs with review logs, MVP tier 10/10 designed and approved, cross-GDD review ran 2026-11-09 with findings verified fixed. CONCERNS: (1) no owner-agreed timeline anywhere (Scope Tiers "INTENT UNKNOWN"); (2) 5 post-MVP systems designed before any production code — acknowledged scope, stop designing ahead of tier; (3) entire phase's outputs uncommitted in git; (4) stale stage config and systems-index progress-tracker undercount. Producer-embedded scope-check: NOT ASSESSED (0% implemented — no meaningful creep percentage); estimate: not generated (no task/sprint history) — run `/estimate` on the MVP build order before `/sprint-plan`.

## Blockers

None.

## Concerns

1. **Uncommitted phase outputs** — all of `design/gdd/`, `design/registry/entities.yaml`, `project.yaml`, `production/` are untracked/modified. Working-tree loss = phase loss. Commit before or immediately upon advancing.
2. **Engine/stack not registered** — no engine key in `project.yaml`; catalog step `engine-setup` ABSENT; Godot 4.7 reference pinned + imported while actual direction is web-native TS/React. Register the decision (config key + VERSION.md annotation, or early ADR) before the Technical Setup gate.
3. **Visual Identity Anchor absent** (recommended at `standard`) — add when art-bible work begins.
4. **No owner-agreed timeline** — run `/estimate` on the MVP build order and agree a timeline before `/sprint-plan`.
5. **Ahead-of-tier design spend** — 5 post-MVP systems (incl. real-pvp, XL) fully designed before any code; documented and deferred, but no further post-MVP design until production validates the MVP tier.

## Verdict: CONCERNS

All required artifacts present and all required quality checks passing; concerns are production hygiene and configuration governance, not concept or design risk. Per Section 6, the stage advances only via explicit user acceptance of the listed risks.

### Accepted Risks

- Concern 1 (uncommitted outputs) — accepted by the user, 2026-11-09
- Concern 2 (engine/stack unregistered) — accepted by the user, 2026-11-09
- Concern 3 (Visual Identity Anchor absent) — accepted by the user, 2026-11-09
- Concern 4 (no owner-agreed timeline) — accepted by the user, 2026-11-09
- Concern 5 (ahead-of-tier design spend) — accepted by the user, 2026-11-09

Stage updated: `project.stage: Systems Design` in `project.yaml` + legacy `production/stage.txt` (set-stage.sh).

Chain-of-Verification: 5 questions checked — verdict unchanged (CONCERNS).
