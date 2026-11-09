# Cross-GDD Review Report

Date: 2026-11-09
GDDs Reviewed: 13 of 15 present
Not read: localization.md, real-pvp.md (present but `[To be designed]` placeholders — a stub contradicts nothing; named here per the not-read rule)
Focus: full (consistency + design theory, both run)
Systems Covered: accounts-backend, question-content, hero-class, opponent-ai, battle-system, equipment, forge-srs, speech-io, ui-shell, tower, meta-progression, ranked-league, analytics

Method note: findings produced by two parallel `game-designer` review passes (Phase 2 consistency, Phase 3 design holism) over the Phase 1 section extracts + the 104-entry entity registry + the systems-index dependency map; every Blocking and top Warning was then independently verified against the source GDDs by the orchestrating session (citations below carry line numbers from those spot-reads). Phase 4 scenario walkthrough run in the orchestrating session (7 scenarios).

---

## Consistency Issues

### Blocking (must resolve before architecture begins)

🔴 **C-B1 — Tower and battle define incompatible question-draw architectures over the same content system (both GDDs Approved).**
- `battle-system.md` Rule 22 (line 95): each round draws exactly **k = 1** from "the encounter's **module × round-type** pool" (build-gated `min_battle_pool_size = 8`); BS31 asserts "for every shipped pool, `floor(N_pool / 1) ≥ 2 × 4`" (≥ 8).
- `tower.md` Core Rule 4 (lines 72–85): "Tower never picks questions — battle-system draws from the module × **stage** pool per its Rule 22", with the 4-round battle "drawing 4 questions from the stage's mixed module × stage pool (question-content Rule 4, F2/F3 minimums: stage pools ≥ 6, boss pool ≥ 4)"; TW19 repeats "drawing 4 questions from the module × stage pool (no tower-side draw)".
- Tower **misquotes** battle's Rule 22 (round-type → stage). Under battle's reading, tower stage pools (module × stage, ≥ 6) are never consumed — battle draws from module × round-type pools (≥ 8) ignoring the stage dimension; the stage-pool → four-round-type mapping exists in **neither** GDD. The pool-size gates also conflict: a shipped stage pool of 6 fails BS31's ≥ 8 guard (⚠️ C-W4), while boss pools (≥ 4) fail it by design. This decides what question-content must actually build (round-type pools vs stage pools per mode) and what BS30's seed-stream accounting consumes. **Must be resolved (owner decision: which model yields) before tower or battle implementation stories open.**

### Warnings (should resolve, but won't block)

- ⚠️ **C-W1 — Stone +level commit timing defined two contradictory ways.** `accounts-backend.md` AC-X2 (line 461): "the associated gear receives its +level **in the same atomic commit**". `forge-srs.md` FS16: forge sets no +level ("application is equipment's domain"); `equipment.md` EQ13/EQ15: application is a **separate** equipment commit (verified: EQ15 asserts pre-attempt values persist until equipment's own commit accepts). AC-X2 and FS16+EQ13 cannot simultaneously pass. Fix: rewrite AC-X2 to "inventory row created atomically; +level applied per equipment EQ13".
- ⚠️ **C-W2 — Ranked forfeit is unimplementable against battle as designed.** `ranked-league.md` Core Rule 11: forfeit (RP −14) triggers on a battle-start signal owed by battle-system + a 15-min grace window. `battle-system.md` line 1356: "**There is no forfeit state at MVP**: abandoning the session discards the battle with no BattleResult emitted" (BS35 tests the absence); the owed battle-start signal appears nowhere in battle's GDD. Deferrable to the Alpha trust-model ADR (ranked names it), but battle's GDD must grow the minimal signal contract at its next edit or ranked must move the trigger to the persistence layer.
- ⚠️ **C-W3 — ui-shell cites the wrong battle rule for forfeit.** `ui-shell.md` Core Rule 3 + UI-AC8 (lines 2727–2728, 3115): "battle **Rule 21** semantics: ranked = forfeit loss after grace". Battle's Rule 21 is **Rewards** (line 1332). One-line retarget once C-W2 resolves.
- ⚠️ **C-W4 — BS31 burnout guard over-broad.** BS31's "every shipped pool ≥ 8" fails tower stage pools (≥ 6) and boss pools (≥ 4) that battle itself consumes for `tower_stage`/`tower_boss` encounters. Re-scope BS31 to battle-mode pools or raise tower minimums (folded into C-B1's resolution).
- ⚠️ **C-W5 — Battle's shield-pool worst case printed as a stale constant.** Battle Rule 11 + BS15: "worst case ≈ 97 + 60 = **157**". Equipment (line 213, OQ-EQ6): with gear the bound is **205** (`round_half_up((80+120×0.3)×1.25) = 145` + Grammarian 60) — nothing breaks (pool uncapped) but the printed number goes stale the moment equipment ships. Equipment already owns the carry-in flag (OQ-EQ6); battle must restate the bound as an expression, and registry `battle_shield_gain`'s 157 note needs the same.
- ⚠️ **C-W6 — The 11,000 ms ult-rune threshold is unreachable at base stats.** Battle Rule 20 drops a bonus rune on a correct ult answer with `elapsed > 11,000 ms`, but B1's round times are 10.0/10.5/11.0 s with timeout = incorrect — a strict `> 11,000` correct commit cannot exist at base stats (Grammarian's exactly-11,000 fails the strict compare). Reachable only through time gear (max 14.75 s per equipment). Dead letter at MVP unless lowered or documented as gear-gated intentionally. Interacts with SI23/SI24 and OQ-SI1.
- ⚠️ **C-W7 — Batch stale dependency/status debt (the "reconcile when authored" bills coming due).** Verified instances: `accounts-backend.md` Cross-References rows 399–402 still mark forge-srs/equipment/tower/meta-progression "(not yet authored)" (all now Approved); `question-content.md` table rows for battle-system/tower/forge-srs/speech-io/equipment/opponent-ai likewise (lines 386–391); `analytics.md` marks meta-progression "✅ already anticipates" — false, meta never names analytics; battle's Cross-References has no analytics row while analytics claims both as event sources. Cheap mechanical sweep: find "(not yet authored)", "(undesigned)", "(provisional)" across all 13 GDDs; fix the false-✅ claims.
- ⚠️ **C-W8 — question-content F2's repeat claim corrected by tower but not propagated.** Tower Rule 6 shows a full 4-question draw repeat is possible at 1/15 ≈ 6.7% from a ≥ 6 pool ("flagged to question-content's owner"); question-content F2 still asserts "≥ 2 differing questions between consecutive attempts" and registry `min_tower_stage_pool_size` carries the stale claim.
- ⚠️ **C-W9 — Dependency bidirectionality debt** (each needs the named GDD's next edit): accounts-backend ↔ battle-system commit-retry ownership ambiguous (battle declares "no direct dependency"; accounts lists battle Hard); hero-class → accounts-backend unreciprocated; equipment → speech-io unreciprocated (speech-io: "None direct"); question-content ↔ meta-progression Soft edge declined by meta while the index map shows it bidirectional; TW20's `floor_cleared` consumer (meta) explicitly declined the event (meta Core Rules 7–8, OQ-MP5) — TW20 is provisional on a consumer that now exists and refused; analytics ↔ battle/tower one-directional; analytics OQ-AN2 vocabulary change has no matching ui-shell open question.
- ⚠️ **C-W10 — Analytics payload fields unreachable from the emitter.** AC-AN19's `floor_cleared(module_id, attempt_count, time_s)` vs tower TW11: tower records "no attempt count… no per-stage score". Two of three fields cannot be sourced. Tower adds fields (contradicting TW11's minimalism) or analytics drops them.

### Advisory

- 💡 C-A1 — B9's mitigation floors (75/113, need def ≥ 150) unreachable — equipment constructs def ≤ 120 by design. Dead-knob hygiene: say so in the tuning-knob doc.
- 💡 C-A2 — systems-index quotes "boss one-cycle ≈ 708"; equipment's computed totals are 756 max / 713 realistic. Conclusion holds; quote equipment's numbers.
- 💡 C-A3 — question-content `first_letter_assist_eligible` is constant true (dead gate) while speech-io Rule 6 shows the first letter unconditionally — overlapping pet-cat behavior defined twice, no cross-link.
- 💡 C-A4 — equipment EQ19 keys on a `part_of_speech` phrasal-verb value question-content's schema never enumerates. One-word schema fix.
- 💡 C-A5 — "speed-score records" (accounts Core Rule 4) have no owning system. Name an owner or cut.
- 💡 C-A6 — RP retune authority slightly ambiguous: registry `source:` is ranked-league; battle's mirrored emission text should say "value owned by ranked-league".
- 💡 C-A7 — meta-progression.md carries **two** Quick-reference blocks (lines 22 and 44; the first lacks the ui-shell/ranked-league downstream entries). Delete the stale first block.

**Clean:** 2d tuning-knob ownership (no double-claims across 104 registry entries; meta-owns/battle-mirrors, hero-class owns `fast_answer_threshold`, equipment owns the def ≤ 120 band — all verified both directions) and 2e formula compatibility (every named chain verified with arithmetic: mana 90 = gate inclusive; def band exactly 120 by construction; forge↔equipment T_floor identical in all three docs; ranked RP math vs tier thresholds consistent; speech quality domain valid for B5).

---

## Game Design Issues

### Blocking (design decision owed)

🔴 **D-B1 — Arcane Speaker is mechanically inert and Pareto-dominated — the permanent onboarding class pick has a clearly-correct answer.**
- Mana math (verified against battle B8/Core Rule 10 + hero-class HC10): every mana sequence reachable in 4 rounds resolves the 90-gate identically with or without Arcane's ×1.35 passive — at 3/3 correct both fire (non-Arcane 30+30+30 = 90; Arcane 30+30+41 capped → 100); at 2C+1W neither fires (70 vs best-case 81 < 90). The passive's only consumer (mana) never changes outcome; mana evaporates at battle end (nothing else consumes it); BS13 records the fact without treating it as a balance problem.
- Stat blocks (`hero-class.md` lines 43–45): Wordsmith 380/80/30/12/+0.0 beats Arcane 360/72/38/9/+0.5 on HP, ATK **and** crit (Arcane keeps only def +8, time +0.5 s); Grammarian beats it on HP, def and time. A strictly dominated pick at the game's first and least reversible decision is a Competence/Autonomy problem (SDT: a false choice).
- **Design question for the owner:** retune the passive into a live effect (e.g. extend ×1.35 to listening damage, or an Arcane-specific gate interaction), or consciously accept and document the class as flavor-only. Fixing this also fixes the coherence gap (Arcane's "mana-economy lean" fantasy is the one Player Fantasy the mechanics don't deliver).

### Warnings (design decisions worth making)

- ⚠️ **D-W1 — Static ghost difficulty vs a player power curve that roughly doubles.** Ghosts are frozen per mode (0.55/0.65/0.70/0.75 accuracy; HP 420/500/500/600) while atk goes 80 → 173 and hp 380 → 615 over the gear timeline. Equipment's own math: maxed bow path one-cycles the 600-HP boss (756; realistic 713); the crossover is mid-progression (first maxed item day 9–13). Tower structurally refuses scaling levers ("no HP/damage scaling of its own") and MVP ships 1 floor. Decision owed: the post-gear difficulty source (deeper floors at higher accuracy tiers within opponent-ai's 0.40–0.90 band, per-floor HP scaling, or accept trivial PvE + pivot tower to speed-score chasing). OQ-EQ6 (boss KO) should be decided as part of this, not in isolation.
- ⚠️ **D-W2 — Ranked is partially gear-gated while peer boards are gear-blind.** The ranked ghost is static; win rate is a function of skill × gear age; peers are bracketed by season-start tier (RL3), never gear (RKL10 allows rank #1 above the peers' band). Honest (it's a ghost; no human is wronged) but the ladder measures forge attendance as much as language skill for Competitor-motivated players. Decision: document gear-as-advantage, or add a gear-normalized element.
- ⚠️ **D-W3 — Forge payoff rate is p³-gated with no pity: weak learners get gear 3–4× slower.** Expected stones/day at one sitting = p³: 0.512 at p = 0.8 (in the published 0.5–1/day band) but **0.216 at p = 0.6** (~1 stone per 4.6 days; ~9+ months to the 60-stone catalog, vs the published 2–4 months). The equipment claim's "regardless of sessions-per-day" clause only holds when ≥ 6 Box-3 runes are simultaneously due, which a struggling learner's backlog may not supply. Decision: accept competence-correlated gear pacing or add a pity lever; re-derive the 2–4 month claim as a per-p curve.
- ⚠️ **D-W4 — The 32-word MVP glossary caps the forge economy's fuel.** question-content F4 ships 32 entries; `mastered_words` is bounded by it; mature rune supply depends on re-drops from the same 32 words. The loop self-throttles by design, but a *successful* learner — the product's ideal outcome — starves the rune supply with ~55 stones still owed. Decision: confirm the mature rate against the 32-word pool (simulation/playtest) and decide whether gear-max is intended reachable for a learner who mostly stops failing.
- ⚠️ **D-W5 — The daily quest board is the dominant daily payoff (~56% of casual income) paying into a sink-less currency.** Deliberate at MVP (faucet-only gold), but the most-instrumented daily motivation loop terminates in a number that buys nothing. Decision: ship one minimal MVP sink (or convert one quest reward to a felt payoff) vs accept inert gold until OQ-MP1.
- ⚠️ **D-W6 — The boss-replay gold farm is dormant at MVP and becomes a literal anti-pillar violation at Alpha.** meta Rule 6 documents ~4,000 gold/hour via unlimited boss replays; inert while gold has no sink, but the first Alpha sink makes replaying mastered content the optimal route — exactly what the anti-pillar forbids. OQ-MP1 must resolve the farm **before** the first sink ships (cap, diminishing returns, or daily-first-clear bonus).
- ⚠️ **D-W7 — Battle HUD density: ~9 concurrent information channels in a 10-second round** (question, countdown, speed readout, 2× HP, shield pool, mana+gate marker, combo badge, round log, ghost theater) plus opt-in gear hint surfaces. Decision load is one answer per round and UI-AC30 caps animation load, but the channel count is a cross-GDD sum no single GDD owns. ui-shell/ux-designer decision at the UX-spec pass: which channels are passive-ambient (candidates: round log, permanent speed readout).

### Advisory

- 💡 D-A1 — Progression-loop structure verified sound: one dominant felt loop (forge→stone→gear), everything else deliberately inert supports. Matches the MVP hypothesis; no action.
- 💡 D-A2 — Daily-session attention budget sound (~2 active decision surfaces); forge gating and quest auto-progress prevent forced attention.
- 💡 D-A3 — No other dominant strategy found: accuracy strictly dominates speed-maxing (speed is reward-only, never punitive); armor/accessory/pet slots carry real trade-offs (bow near-dominance below excepted).
- 💡 D-A4 — Cung Collocation (bow) is near-dominant in the weapon slot: its ×1.20 always fires (listening round is structurally guaranteed) vs sword-phrasal's conditional ×1.25; bow path maxes 756 vs sword ≈ 713 plus +18 base atk. Decision: is bow intended best-in-slot, and does sword need a condition-independent edge? (Rarity is display-only at MVP, yet both legendaries happen to carry the strongest rows.)
- 💡 D-A5 — Losing streaks verified NOT to starve progression (losses pay reduced nonzero rewards, drop more runes, count toward streak; RP floors at 0 with no debt) — Pillar 2 working as an economy stabilizer.
- 💡 D-A6 — MVP tower (1 floor, 4 battles) exhausts the "long-horizon curiosity engine" within about one session; week-2+ retention rests entirely on forge + quests — fragile given D-W3/D-W4.
- 💡 D-A7 — Two documented in-battle Pillar-1 exceptions (untimed ult quality; unspeeded grammar shields) should get one explicit owner sign-off so a future balance pass doesn't silently "fix" them.
- 💡 D-A8 — Silent quest expiry is the one tonal outlier against the game's calm/non-punishing stance (earned rewards vanish unacknowledged). Both stances defensible; owner call (a zero-cost expired-chip acknowledgment is the middle path).

**Clean:** pillar alignment — all 13 systems serve at least one pillar (infrastructure serves Pillar 4 / the MVP hypothesis); anti-pillar sweep clean at MVP except the dormant farm (D-W6); player-fantasy coherence verified — "mastery made visible" composes one identity across all systems, the arena/forge contrast is designed rhythm, not conflict.

---

## Cross-System Scenario Issues

Scenarios walked: 7 — (1) battle-end commit chain; (2) forge→stone→snapshot→battle; (3) midnight ICT boundary mid-session; (4) ranked forfeit; (5) ult quality contract hand-off; (6) tower encounter→ghost-profile override; (7) forge quest progress from a failed session.

#### Blockers
None beyond C-B1/C-W1/C-W2, which this walkthrough surfaced from the player's side:
- ⚠️ Scenario 2 (forge→stone→snapshot) **is** C-W1: the chain's commit timing is defined two contradictory ways at the accounts/forge/equipment junction.
- ⚠️ Scenario 4 (ranked forfeit) **is** C-W2: battle discards abandons silently; ranked's −14 rule has no emitter-side signal to key on.

#### Warnings
None additional.

#### Info
- ℹ️ Scenario 1 (battle end): verified clean end-to-end — one atomic commit (AC-X1: stored as-reported, MVP trust model documented), meta ledger idempotent on the battle seed, quest progress event-mapped, streak lazy. No double-dip found.
- ℹ️ Scenario 3 (midnight ICT): all time-keyed systems read the same server clock and evaluate lazily from committed state; no race. Player-visible edge: a victory at 23:59 leaves no window to claim a Claimable quest before silent expiry (D-A8's tone question, not a defect).
- ℹ️ Scenario 5 (ult quality): contract is consistent (quality ∈ [0,1], 0.6 presentation-only, recorded value feeds B5); residual: battle's BS11 still carries its provisional OQ-BS5 marker though speech-io resolved it — ride the already-tracked battle-side cleanup batch (OQ-SI2).
- ℹ️ Scenario 6 (tower→ghost override): clean — profile accuracy overrides mode default with defined behavior (OA5); tower Core Rule 3 confirmed the profile contract.
- ℹ️ Scenario 7 (forge quest from failed session): clean — FS10's per-card independence means correct cards in a failed session still count toward meta's "Rèn 5 từ" quest, exactly as meta's progress-source row reads.

---

## GDDs Flagged for Revision

| GDD | Reason | Type | Priority |
|-----|--------|------|----------|
| battle-system.md | C-B1 draw-pool architecture (with tower, question-content); C-W4 BS31 scope; C-W5 stale 157; C-W6 dead 11 s threshold; C-W2 owed battle-start signal; BS11 stale provisional | Consistency | **Blocking** |
| tower.md | C-B1 (same pair — misquotes battle Rule 22); TW20 stale consumer; TW19 "no tower-side draw" phrasing | Consistency | **Blocking** |
| question-content.md | C-B1 pool-structure decision lands here; C-W8 F2 repeat claim; C-W7 stale statuses; C-A4 schema value | Consistency | **Blocking** (rides C-B1) |
| hero-class.md | D-B1 Arcane Speaker inert + dominated (owner decision: retune or accept) | Design Theory | **Blocking** (decision owed) |
| accounts-backend.md | C-W1 AC-X2 rewrite; C-W7 "(not yet authored)" rows; C-W9 hero-class row | Consistency | Warning |
| ranked-league.md | C-W2 forfeit implementability (blocked on battle edit + ADR) | Consistency | Warning |
| ui-shell.md | C-W3 wrong battle-rule pointer; D-W7 HUD channel audit at UX pass | Consistency | Warning |
| analytics.md | C-W7 false-✅ claims; C-W10 payload fields | Consistency | Warning |
| equipment.md | C-W9 speech-io row owed; OQ-EQ6 already tracks C-W5/C-A2 | Consistency | Warning |
| meta-progression.md | C-W9 content Soft-edge reconciliation; C-A7 duplicate Quick-reference | Consistency | Advisory |
| speech-io.md | C-W9 equipment row; C-A3 assist duplication | Consistency | Advisory |
| opponent-ai.md | No findings | — | — |
| forge-srs.md | No findings (FS16 is the correct side of C-W1) | — | — |

---

### Verdict: **FAIL**

One or more blocking issues must be resolved before architecture begins.

- 🔴 C-B1 (consistency): tower/battle question-draw architectures are incompatible and the stage-pool → round-type mapping is defined nowhere; both GDDs are Approved, so architecture built now would inherit a rule nobody co-owns.
- 🔴 D-B1 (design theory): the permanent class pick is decided by an inert passive and a dominated stat block — a design decision the owner owes before the class system is built.

NOT ASSESSED ranking note: the two placeholder GDDs (localization, real-pvp) are present-but-unreviewable and are named above; FAIL outranks that partial coverage. All seven checklist lenses and all 2a–2f categories ran; no phase was skipped.

### Required actions before re-running

1. **Owner decision on C-B1**: which draw model yields (battle's k=1 module × round-type with a stage-slice mapping, or tower's stage pools with raised minimums). Then a coordinated three-GDD edit: battle-system Rule 22/BS30/BS31, tower Core Rule 4/TW19/TW20, question-content pool definitions + F2's corrected repeat claim (C-W8).
2. **Owner decision on D-B1**: retune Arcane Speaker's passive into a live effect, or accept it as flavor-only with documentation; if retuned, battle's B8/mana rules take the corresponding edit.
3. Rewrite accounts-backend AC-X2 per C-W1 (equipment EQ13 owns application timing) — one AC, no architecture impact.
4. Sweep C-W7's stale status strings ("(not yet authored)" / "(undesigned)" / "(provisional)") across all 13 GDDs, and fix the two stale registry notes (`battle_shield_gain` 157; `min_tower_stage_pool_size` "≥ 2 differing").
5. Log the two Pillar-1 exception sign-offs (D-A7) and the remaining Warning-level decisions (D-W1…D-W7) in the owners' Open-Question lists where not already tracked (most are: OQ-EQ6, OQ-MP1, OQ-AN2, OQ-SI2).
