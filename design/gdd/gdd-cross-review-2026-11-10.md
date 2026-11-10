# Cross-GDD Review Report

Date: 2026-11-10
GDDs Reviewed: 15 of 15 present
Not read: none (localization.md and real-pvp.md received their first cross-review this run)
Focus: full (consistency + design theory, both run) — re-run after the C-B1/D-B1 remediation; supersedes the 2026-11-09 report's verdict
Systems Covered: accounts-backend, question-content, hero-class, opponent-ai, battle-system, equipment, forge-srs, speech-io, ui-shell, tower, meta-progression, ranked-league, analytics, localization, real-pvp

**Verdict: CONCERNS** — zero blockers. Both 2026-11-09 blockers verified resolved in content with line-level receipts. The open set is warnings + advisories only (2 consistency warnings and 2 design warnings resolved of the prior 17; the rest tracked with owners below).

Method note: findings from two parallel `game-designer` passes (Phase 2 consistency, Phase 3 design holism) over section-scoped reads of all 15 GDDs + the entity registry + the systems-index dependency map; both agents' blocking-relevant claims re-verified against source by the orchestrating session (citations carry line numbers from those spot-reads). Phase 4 scenario walkthrough run in the orchestrating session (7 scenarios, below). Partial-coverage honesty: the full 2d tuning-knob sweep, 2e formula recompute (RL1-5, FS, F-AN, R1-8 series) and full 2f AC-series cross-check were NOT re-run this pass — those areas were clean on 2026-11-09 and saw no edits since except the documented resolutions; spot-checks were made where cheap (2d/2e samples, dependency rows, named pointers). Any regression there would surface at the next full pass or `/balance-check`.

---

## Prior Blockers: both RESOLVED (verified)

✅ **C-B1 (tower/battle draw-pool architecture) — RESOLVED.** `battle-system.md` Rule 22 (line 95) now keys pools **by encounter type** — `tower_stage`/`tower_boss` draws consume the **module × stage** pool; standard modes draw module × round-type. `tower.md` TW19 (line 543) tests exactly that contract (stage pools ≥ 6, boss ≥ 4, per-round-type composition gate). The stage-pool → four-round-type mapping lives in battle's Rule 22; BS31's pool guard is re-scoped accordingly. Verified independently by both directors (per-GDD re-review receipts) and re-walked in Phase 4 scenario 3. **Architecture note for Technical Setup:** the question-draw ADR must follow the tower-verified resolution, not battle's pre-fix Rule 22 wording.

✅ **D-B1 (Arcane Speaker inert passive) — RESOLVED.** `hero-class.md` line 116 retunes the passive to **listening-damage ×1.20** (a Tuning Knob with safe range), consumed by battle B4 (`battle-system.md` lines 224–240); registry entries 1163–1180 mark the old ×1.35 mana entry deprecated and add the new one. The stat block was rebalanced so Arcane is no longer Pareto-dominated — Phase 3's independent check: "the class pick is now a real choice." Residual: one composition rule still owed (new Warning N-1 below — the passive is live but its stacking rule with gear multipliers is undefined).

## Consistency Dispositions (2026-11-09 findings)

| ID | Finding (short) | Status |
|----|-----------------|--------|
| C-W1 | Stone +level commit timing contradiction | ✅ RESOLVED — `accounts-backend.md` AC-X2 (line 461) corrected 2026-11-09: inventory row atomic; +level applied per equipment EQ13. Phase 4 scenario 2 re-walked clean. |
| C-W2 | Ranked forfeit unimplementable (no battle-start/abandon signal) | ⚠️ OPEN — battle still discards abandons silently (BS35); ranked's −14 has no emitter-side signal. Deferrable to the Alpha trust-model ADR, but needs a **named owning ADR during Technical Setup** (commit/forfeit boundary). |
| C-W3 | ui-shell cites battle "Rule 21" for forfeit semantics | ⚠️ OPEN — paired with C-W2; one-line retarget (`ui-shell.md` Core Rule 3 + UI-AC8) once C-W2 resolves. |
| C-W4 | BS31 burnout guard over-broad vs tower pools | ✅ RESOLVED — folded into C-B1's resolution (encounter-keyed pools; tower minimums first-class). |
| C-W5 | Shield worst case printed as stale 157 constant | ⚠️ OPEN — `battle-system.md` lines 75, 651 spot-verified 2026-11-10; equipment's gear-aware bound is 205. Restate as an expression (battle-side numeric-hygiene batch with C-W6). |
| C-W6 | 11,000 ms ult-rune threshold unreachable at base stats | ⚠️ OPEN — `battle-system.md` line 90 spot-verified. Dead letter at MVP unless lowered or documented gear-gated; interacts with OQ-SI1/SI23/SI24. |
| C-W7 | Stale dependency/status debt sweep | ⚠️ OPEN, EXTENDED — prior instances stand (accounts-backend:399–402 "(not yet authored)"; question-content:386–391; analytics' false "meta already anticipates"; battle missing its analytics Cross-References row). **New instance this run:** `opponent-ai.md` line 118 marks the tower profile contract "Provisional — Confirm with tower GDD" while line 224 records the difficulty ladder as **confirmed 2026-11-09, authored intent** — the marker is stale by its own doc. |
| C-W8 | question-content F2 repeat claim corrected by tower but not propagated | ⚠️ OPEN, self-contradictory — `question-content.md` lines 197–203 now carry **both** the corrected repeat phrasing and the stale "≥ 2 differing questions" claim; registry `min_tower_stage_pool_size` (lines 1082–1086) still carries the stale note. The half-applied fix now contradicts itself in one passage. One-line fix ×2. |
| C-W9 | Dependency bidirectionality debt | ⚠️ OPEN — accounts↔battle commit-retry ownership; hero-class→accounts-backend; equipment→speech-io; question-content↔meta Soft edge; TW20's `floor_cleared` consumer declined (OQ-MP5); analytics↔battle/tower one-directional; OQ-AN2 vocabulary change unmatched in ui-shell. Each needs the named GDD's next edit or an explicit "declined, recorded" entry. |
| C-W10 | Analytics payload fields unreachable from emitter | ⚠️ OPEN, EXTENDED — AC-AN19's `floor_cleared(module_id, attempt_count, time_s)` vs tower TW11's minimalism stands. **First cross-review of real-pvp found the same class of gap:** real-pvp's analytics emission rows do not map onto the analytics GDD's event contract (no named payload owner). Both resolve the same way: analytics owns a payload-sourcing table or drops the fields. |

Consistency advisories C-A1–C-A7: carried unchanged (none re-verified in full this pass except C-A4's factual base — `grep "phrasal"` in `question-content.md` returns nothing, so EQ19 still keys on a value the schema never enumerates). C-A7's duplicate Quick-reference block in meta-progression was not re-checked.

## Game Design Dispositions (2026-11-09 findings)

| ID | Finding (short) | Status |
|----|-----------------|--------|
| D-W1 | Static ghosts vs ~2× player power curve | ⚠️ OPEN (tracked) — post-gear difficulty source decision still owed (deeper floors / per-floor HP scaling / accept trivial PvE). Related: new Advisory N-3. |
| D-W2 | Ranked partially gear-gated, peers gear-blind | ⚠️ OPEN (tracked) — document gear-as-advantage or add a normalized element. Honest (ghost), Competitor-fantasy cost. |
| D-W3 | Forge payoff p³-gated, no pity; weak learners 3–4× slower | ⚠️ PARTIAL — decision still owed; equipment's "2–4 months" claim still unqualified by p (new Advisory N-4). |
| D-W4 | 32-word glossary caps forge fuel; successful learners starve runes | ⚠️ PARTIAL — confirm mature rate vs the 32-word pool (simulation/playtest) still owed. |
| D-W5 | Quest board dominant payoff → sink-less gold | ✅ RESOLVED — `meta-progression.md` lines 74–86 record the MVP decision (faucet-only gold accepted, one felt quest payoff path documented). |
| D-W6 | Boss-replay gold farm dormant → anti-pillar at first sink | ✅ RESOLVED — `meta-progression.md` lines 74–86 gate OQ-MP1: the farm must be resolved **before** the first gold sink ships. |
| D-W7 | Battle HUD ~9 concurrent channels, no single owner | ⚠️ OPEN (tracked) — ui-shell/ux-designer decision at the UX-spec pass (passive-ambient candidates named: round log, permanent speed readout). |

Design advisories D-A1–D-A8: D-A1/D-A2/D-A5 verified clean and standing; D-A4 (bow near-dominance) stands and now interacts with N-1 (the ×1.20 composition); D-A3/D-A6/D-A7/D-A8 carried unchanged.

## New Findings This Run

⚠️ **N-1 — B4 damage composition: how the class passive (×1.20) combines with gear multipliers is undefined.** `equipment.md` line 206 prints a maxed Arcane + bow listening hit as **281** — a single ×1.20 applied once — while the same loadout computed **multiplicatively** (passive × bow row) yields **339**. `battle-system.md` line 226 defines exactly **one** multiplier slot in B4, but `equipment.md`'s item-hook mapping (line 206) reads as a second, per-item multiplier surface. Both docs are internally consistent; they disagree with each other. One composition rule owed (single multiplicative chain with a stated order, or additive multiplier pool) — **rides battle's next edit; not architecture-blocking**, but the question-draw/damage ADR pair in Technical Setup should not pin either number before it exists.

💡 **N-2 — No per-class damage matrix exists.** The ×1.20 passive now makes class × item interaction load-bearing (N-1), but no table cross-checks the three classes against the gear slots. Recommend OQ-BS2 produce one when B4's composition rule lands.

💡 **N-3 — Tower floors 2–4 reuse floor 1's ghost values verbatim** (placeholder risk in shipped config: identical accuracy/HP ladders at every floor). Harmless at MVP (1 floor ships) but becomes a live bug the moment floor 2 unlocks. Flag for the tower config story.

💡 **N-4 — Equipment's stone-supply claim is still unqualified by p** ("2–4 months regardless of sessions-per-day" holds only at high p; at p = 0.6 it is ~9+ months). Same substance as D-W3's open decision — restate the claim as a per-p curve.

## Cross-System Scenario Walkthrough (Phase 4)

Scenarios walked: 7 — (1) battle-victory commit chain; (2) forge→stone→snapshot→battle (incl. AC-X2); (3) tower stage battle post-C-B1; (4) ultimate-round speech-io→battle hand-off; (5) ranked forfeit; (6) analytics emission; (7) localization surface.

- ℹ️ **Scenario 1 — clean.** Battle Rule 21 rewards (120/250/40 gold · 180/60 XP) adopted MVP-final and owned by meta-progression; RP ±owned by ranked-league (+28/−14); runes drop from wrong/slow answers; one atomic commit at battle end (AC-X1, MVP trust model per ADR-0003); meta ledger idempotent on the battle seed (verified 2026-11-09, unchanged). No double-dip.
- ⚠️ **Scenario 2 — clean except N-1.** AC-X2's corrected split holds end-to-end: forge mints the stone (FS16 sets no +level), equipment EQ13 owns +level application, EQ15 asserts pre-attempt values persist until equipment's commit. Snapshot-at-battle-start via the carry-in flag (OQ-EQ6) is coherent. N-1's composition ambiguity sits exactly on this loop's damage math — the loop's *economy* is sound; its *printed numbers* are not yet single-sourced.
- ℹ️ **Scenario 3 — clean (C-B1 verified from the player's side).** A tower stage battle draws k = 1 per round from the module × **stage** pool (Rule 22), TW19 gates the pool sizes, opponent-ai supplies the stage ghost profile (0.55 accuracy / 420 HP) and tower selects the encounter — the confirmed difficulty ladder (opponent-ai:224) orders tower stage 0.55 < friend 0.65 < ranked 0.70 < boss 0.75. The stale "Provisional" marker at opponent-ai:118 is bookkeeping (C-W7), not a contract gap.
- ⚠️ **Scenario 4 — C-W6 unchanged; contract otherwise consistent.** Speech quality ∈ [0,1]; 0.6 is presentation-only; the recorded value feeds B5. Mana gate at 90 verified inclusive (prior arithmetic). The 11,000 ms rune threshold remains unreachable at base stats. BS11 still carries the provisional OQ-BS5 marker — tracked battle-side cleanup (OQ-SI2).
- ⚠️ **Scenario 5 — C-W2/C-W3 unchanged** as dispositioned above.
- ⚠️ **Scenario 6 — C-W10 (+ real-pvp extension) unchanged** as dispositioned above.
- ℹ️ **Scenario 7 — clean.** Localization's first cross-review passed; its pointer to ui-shell's extraction-keyed day-boundary check resolves to a real, fully-specified element (`ui-shell.md` line 798, UI-AC21 — this run's spot-read closes Phase 2's "named-but-unchecked" flag). Gloss ownership resolves: question-content Core Rule 6 (lines 123, 150) is the build-gate consumer.

---

## Required Actions (none blocking; owners named)

1. **C-W8** — delete the stale "≥ 2 differing" residue in `question-content.md` (197–203) and the registry note (1082–1086). One line each; the passage currently contradicts itself. Owner: question-content's next edit.
2. **N-1** — write the B4 multiplier composition rule (one sentence + one worked example). Rides battle's next edit; **before** any ADR pins the 281 or 339 numbers.
3. **C-W2 / C-W9 / C-W10** — fix or name the owning ADR during Technical Setup: forfeit signal contract, commit-retry ownership, analytics payload sourcing. These sit exactly on boundaries that phase pins.
4. **C-W5 / C-W6** — battle-side numeric-hygiene batch: restate the shield bound as an expression; decide the 11,000 ms threshold (lower or document gear-gated).
5. **C-W7** — finish the mechanical sweep; add opponent-ai:118 to the verified list.
6. **D-W1 / D-W2 / D-W7** — tracked owner decisions (difficulty source; ranked gear stance; HUD density at UX-spec). None block Technical Setup.
7. **N-3** — tower config story must author floors 2–4's own ghost values before floor 2 ships.

## Gate Relevance

This report resolves the Systems Design → Technical Setup gate's FAIL blocker (stale cross-review verdict). The gate re-runs against this file; its remaining quality items map 1:1 to the OPEN warnings above and are advanceable only by explicit user risk acceptance.
