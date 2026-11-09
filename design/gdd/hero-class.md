# Hero Class

> **Status**: Complete — pending design review
> **Author**: project-owner + game-designer (via /design-system)
> **Last Updated**: 2026-11-08
> **Last Verified**: 2026-11-08
> **Implements Pillar**: Pillar 1 (Speed Is Damage), Pillar 3 (Knowledge Is Gear)

## Summary

Hero Class is the Foundation system defining the game's three playable classes — Wordsmith, Grammarian, Arcane Speaker — each a base stat block (HP/ATK/DEF/Crit/Time) plus one language-anchored passive that turns a real skill (fast answers, streaks, listening) into combat advantage. The player picks one class permanently during onboarding; the choice shapes their battle strengths, equipment targets, and round-type power profile. Every combat formula in the game reads this system's stat vocabulary, making it the numeric ground floor of battle-system and equipment.

> **Quick reference** — Layer: `Foundation` · Priority: `MVP` · Key deps: `None (upstream); battle-system, equipment, accounts-backend downstream`

## Overview

Hero Class is the Foundation system that defines the three playable classes — **Wordsmith** (Chiến Binh Từ Vựng), **Grammarian** (Pháp Sư Ngữ Pháp), and **Arcane Speaker** (Thi Nhân Âm Ngữ) — chosen once during onboarding and fixed for the account. Each class contributes two things every other system computes against: a **base stat block** (HP, ATK, DEF, Crit %, Time+) that forms the stat vocabulary of the game, and one **language-anchored passive** that converts a real language skill into a combat advantage (fast-answer damage for Wordsmith, streak shields for Grammarian, listening damage for Arcane Speaker). For the player, the class is their combat identity and the first expression of Pillar 3 — the pick screen asks "which skill do you want the game to reward?", and the answer shapes stat targets for equipment, round strengths inside battle, and how the ultimate round charges. For the systems, hero-class is pure data plus passive trigger rules: it owns no screens and no runtime of its own; battle-system reads its stats, equipment balances against its stat targets, and ui-shell renders the pick screen from its class definitions.

## Detailed Design

### Core Rules

1. **Class set** — the game ships exactly 3 classes at MVP. Each class is a data record with: `id` (`wordsmith` | `grammarian` | `arcane` — the stable id literals, persisted and referenced everywhere), English name, Vietnamese name, identity fields (icon, color — consumed by ui-shell rendering), a base stat block, and one passive definition. All values live in a data file; nothing is hardcoded (coding standard: data-driven gameplay values).

2. **Stat vocabulary** — the game's stat vocabulary is exactly five stats, owned by this system:

   | Stat | Symbol | Unit | Meaning |
   |---|---|---|---|
   | Health | `hp` | points | Hero starting HP in battle |
   | Attack | `atk` | points | Scales strike/ultimate damage (battle formulas) |
   | Defense | `def` | points | Scales shield and counterattack (battle formulas) |
   | Crit chance | `crit` | percent (0–100) | Roll for critical hits on vocab strikes |
   | Time bonus | `time` | seconds | Added to every round's answer countdown |

   **Mana is not a hero stat.** Mana is battle-economy, owned by battle-system; no class modifies its gain — the +30 correct / +10 wrong values are flat for every class (battle-system Core Rule 13). Equipment items may modify any of the five stats; they cannot grant mana.

3. **Class selection is permanent** — the player picks one class during onboarding (after auth, before first battle) and it is fixed to the account for life. No class switching exists at MVP: no menu, no item, no quest unlocks it. Rationale: the class is a skill identity ("which skill should the game reward?"), not a loadout — equipment is the loadout layer. The chosen class is persisted by accounts-backend in the player profile and is authoritative on every session.

4. **Base stat blocks** (adopted from the validated prototype as authored baseline — a later battle-system balance pass may retune via the tuning process, not silently):

   | Class | EN / VI name | hp | atk | def | crit | time |
   |---|---|---|---|---|---|---|
   | Wordsmith | Wordsmith / Chiến Binh Từ Vựng | 380 | 80 | 30 | 12 | +0.0 s |
   | Grammarian | Grammarian / Pháp Sư Ngữ Pháp | 420 | 62 | 55 | 6 | +1.0 s |
   | Arcane Speaker | Arcane Speaker / Thi Nhân Âm Ngữ | 360 | 72 | 38 | 9 | +0.5 s |

   Design shape: Wordsmith trades bulk for strike power and crit; Grammarian trades offense for survivability and answer time; Arcane Speaker is mid-line with a listening-burst lean. The three `time` values sum to a spread of ±1 s around the 10 s base countdown — the total time spread across classes is deliberately ≤ 1.5 s so no class feels timed-out into unfairness.

5. **Passives — trigger and effect.** Each class has exactly one passive. Hero-class owns the *trigger condition* and *effect magnitude*; battle-system owns the formulas that apply the effect (speed multiplier, crit, shield, mana). Effects are multiplicative unless stated.

   - **Wordsmith — Lưỡi Kiếm Tốc Ngôn** (Blade of Swift Speech): when a **vocab_strike** round is answered correctly in **under 3 seconds**, that strike's damage is multiplied by **1.2**. Scope: vocab_strike rounds only — listening and ultimate rounds have their own identities (armor-piercing, ult burst) and do not stack this bonus.
   - **Grammarian — Kết Giới Cú Pháp** (Syntax Wards): every time the correct-answer streak **reaches a multiple of 3** (per F1 — at 3, and at 6, 9… in longer battles) within one battle, the hero gains **+60 shield** immediately. The streak resets on a wrong answer or timeout, so the passive can re-trigger multiple times per battle. Shield amount is flat — it does not scale with `def`.
   - **Arcane Speaker — Cộng Hưởng Âm Vị** (Phonemic Resonance): damage dealt on a correct **listening_pierce** round is multiplied by **1.20**. The bonus is unconditional — it applies at any answer speed (unlike Wordsmith's speed-gated trigger). Scope: listening_pierce damage only; no effect on vocab or ultimate damage, and none on mana (flat +30/+10 for every class — battle Core Rule 13). *Re-scoped 2026-11-09 (cross-review D-B1): the former mana-rate passive (×1.35) was provably inert — no 3-round mana sequence could cross the 90 gate with it (best case 30+10+41 = 81 < 90) — so the passive moved to the round its identity names.*

6. **Fast-answer crit is a battle rule, not a class rule** — answering any attack round in under 3 seconds guarantees a critical hit for *all* classes (battle-system owns the crit formula and its 1.25× multiplier). Wordsmith's passive stacks multiplicatively *on top of* this: a sub-3-second Wordsmith vocab strike deals ×1.2 (passive) × 1.25 (crit) × speed multiplier. This is what makes Pillar 1 legible: Wordsmith is the class that leans hardest into the speed mechanic everyone shares.

7. **Time bonus applies to every round** — the countdown for each round is `base_time + hero.time` (battle-system owns `base_time`, 10 s in the prototype). It is not conditional on round type; Grammarian's +1 s is a general answer-comfort stat, including the grammar rounds their identity favors.

8. **Ghost opponents carry class identities** — each Shadow Ghost is assigned a `ClassId` for display (avatar, name color). Ghost passives do **not** trigger at MVP (opponents resolve by accuracy rolls); the ghost's class id is display-only at MVP — whether ghost stat blocks are ever used in resolution is an opponent-ai/battle-system decision, and this system only supplies the data records. The data must be present so post-MVP enablement needs no schema change.

### States and Transitions

Hero-class is stateless at runtime — it is data plus pure trigger rules. The only state lives in the player profile:

| State | Meaning | Valid transitions |
|---|---|---|
| `ClassUnpicked` | Account exists but no class chosen (fresh registration) | → `ClassPicked` when the player confirms a class on the pick screen |
| `ClassPicked` | A class id is persisted to the account; permanent | Terminal — no transition out. Battle, equipment and ui-shell read it; it never changes |

Per battle, the class's *effective stats* are derived data: `effective_stat = base_stat + equipment_bonus`, assembled by equipment into the **LoadoutSnapshot** (contract owned by the battle-system GDD). Hero-class never computes effective stats itself; it supplies the base half.

### Interactions with Other Systems

| System | Direction | Data flow | Interface owner |
|---|---|---|---|
| battle-system | downstream (reads this) | Reads base stat block + passive definitions each battle; applies them inside its damage/shield/mana formulas | battle-system owns the formulas; hero-class owns trigger rules and magnitudes |
| equipment | downstream (reads this) | Uses base stats as its stat targets; items add stat bonuses; publishes the combined LoadoutSnapshot | equipment owns the snapshot assembly; hero-class owns base values |
| opponent-ai | downstream (reads this) | Ghost identities reference a `ClassId` for display; no formula input at MVP | opponent-ai decides whether ghost passives trigger |
| ui-shell | downstream (reads this) | Renders the class pick screen from class records (names, VI names, icons, colors, passive text); battle HUD shows the hero's passive line | ui-shell owns screens; hero-class owns the content |
| accounts-backend | downstream (reads this) | Persists the chosen class id in the player profile; serves it on session start | accounts-backend owns storage; hero-class owns the "permanent choice" rule |

## Formulas

Hero-class owns **exactly one formula** (F1) plus a constant set. The passive multipliers are NOT hero-class formulas — the multiplication happens inside battle-system's damage and mana formulas; hero-class supplies the factor, battle supplies the equation. This section also lists the consumption contract: which downstream formula each constant feeds, as references (not owned formulas).

### F1 — Grammarian Syntax Wards proc count

The `grammarian_proc_count` formula is defined as:

`shields_gained_per_battle = Σᵢ floor(runᵢ / proc_streak)` — for each maximal uninterrupted correct-answer run i

Equivalent runtime predicate (what battle-system implements): on each correct answer, `run_correct += 1` (reset to 0 on wrong answer or timeout); a proc fires whenever `run_correct mod proc_streak == 0`. No reset-on-proc is needed — the modulo form is self-counting and equals the floor form. This resolves the "streak reaches 3" wording for runs longer than 3: **a proc fires on every multiple of 3 within a run** (a 6-streak procs twice).

**Variables:**

| Variable | Type | Range | Source | Description |
|----------|------|-------|--------|-------------|
| `runᵢ` | int | 0–4 at MVP (unbounded if battle length grows) | calculated | Length of the i-th maximal run of consecutive correct answers in one battle; battle-system counts it |
| `proc_streak` | int | 3 (fixed) | data file | Correct answers per proc (`grammarian_proc_streak`) |
| `shields_gained` | int | 0–1 at MVP | calculated | Number of +60 shield procs granted in the battle |

**Output Range:** 0 to 1 at MVP battle length 4 (floor(4/3) = 1); general max floor(battle_rounds / 3). No clamping needed — naturally bounded by battle length. **Note: the re-trigger clause is dormant at MVP** — a 4-round battle can never produce 2 procs (needs ≥ 6 correct); the modulo form is chosen so it becomes live without a rule change.

**Example:** MVP battle, answers C C C C. After the 3rd correct resolves, `run_correct = 3` → 1 proc: +60 shield immediately, before round 4 begins. The 4th correct sets `run_correct = 4`; 4 mod 3 ≠ 0 → no proc. Total: **1 shield**. Future 6-round battle C C C C C C → procs at counts 3 and 6 → 2 shields.

### Constant set

All values live in the class data file (coding standard: data-driven).

**Passive magnitudes** (consumed by battle-system):

| Name | Value | Unit | Consumer |
|---|---|---|---|
| `wordsmith_fast_answer_mult` | 1.2 | × damage multiplier | battle-system damage formula (vocab_strike rounds only) |
| `grammarian_shield_flat` | 60 | shield points per proc | battle-system shield application — deliberately flat, def-independent; does NOT enter shield = 80 + def×0.3 |
| `arcane_listening_damage_mult` | 1.20 | × damage multiplier | battle-system listening damage formula B4 (correct listening_pierce only; unconditional — not speed-gated; vocab/ultimate damage and all mana unaffected) |

**Trigger thresholds:**

| Name | Value | Unit | Consumer |
|---|---|---|---|
| `fast_answer_threshold` | 3.0 (3000 ms) | seconds | battle-system — **twice**: its guaranteed-crit rule AND the Wordsmith trigger timing. Must be the same value and the same elapsed-time measurement in both. Ownership is **provisionally hero-class's**; when the battle-system GDD lands it must reference, not redefine. Single change point via the registry. |
| `grammarian_proc_streak` | 3 | correct answers | battle-system streak counting (parameter of F1) |

Safe tuning bands (for a future balance pass): wordsmith mult 1.10–1.30 (below 1.1 the class identity fades; above 1.3 it outclasses the shared fast-crit ×1.25); grammarian shield 40–80; arcane listening-damage mult 1.10–1.30 (×1.20 ≈ the size of Wordsmith's crit-stat edge, 12 vs 9; above 1.3 the pierce round stops reading as a shared identity); fast_answer_threshold 2.5–3.5 s — any change is made once, via the registry entry, never separately in the two consumers.

### Arcane listening-damage representation (interface decision)

The passive is a **rate, not an amount**. Hero-class stores the float multiplier 1.20; no damage integer is stored here. Battle-system applies the multiplier inside its listening damage formula (B4) as `class_listening_damage_mult`, defaulting to 1.0 for non-Arcane classes. B4 rounds once, at its end, so the multiplier commutes with the speed and crit factors — the house rounding convention applies to the final product only. If battle retunes base listening damage, Arcane's proportional edge survives automatically.

*Illustrative worked example (base values are battle-owned):* Arcane atk 72 → base `70 + 72 × 0.45 = 102.4`; × 1.20 = 122.88 at speedMult 1.0, no crit → battle rounds to **123**. Wordsmith same round: 106 × 1.0 → **106**. *(The rounding mode is battle-system's documented decision — round_half_up once at B4's end.)*

### Consumption contract (references, not owned formulas)

| Downstream formula | Owner | Hero-class input |
|---|---|---|
| `round_time = base_time + hero.time` | battle-system | `time` stat (+0.0/+1.0/+0.5 s) |
| `shield = 80 + def × 0.3` (correct grammar rounds) | battle-system | `def` stat; +60 flat on F1 procs |
| `speedMult = 1 + 0.3 × remaining` | battle-system | (context for Wordsmith trigger — no input) |
| guaranteed crit < 3 s, ×1.25 | battle-system | `fast_answer_threshold` (shared value) |
| `dmg = (70 + atk × 0.45) × class_listening_damage_mult × …` (B4, listening_pierce) | battle-system | `atk` stat; `arcane_listening_damage_mult` ×1.20 (Arcane only) |
| `effective_stat = base_stat + equipment_bonus` | equipment | base stat blocks |

## Edge Cases

- **If the Grammarian streak passes 3** (4th, 5th correct in one run): no additional proc until the count hits the next multiple of 3 (per F1). At MVP battle length 4, maximum 1 proc per battle — acceptance tests assert this so QA does not chase a phantom second proc.
- **If the streak breaks**: `run_correct` resets to 0 on a wrong answer **or** a timeout. A fresh streak of 3 procs again (in a long-enough battle).
- **If elapsed time is exactly 3000 ms**: NOT fast. "Under 3 seconds" is strict — `elapsed_ms < 3000`. The same comparison operator and the same elapsed timestamp (question display → answer commit) apply to both consumers of `fast_answer_threshold` (Wordsmith trigger and battle's guaranteed crit), measured by battle-system's deterministic tick model.
- **If shields would stack beyond max HP**: hero-class imposes no cap — Grammarian's +60 stacks with battle's def-shield per battle-system's shield-pool rules. Cap/decay are battle-system's to define; recorded as an open interface item in Dependencies.
- **If equipment modifies stats**: it modifies ONLY the five stats; no item may alter passive magnitudes (nothing raises `wordsmith_fast_answer_mult` to 1.3 at MVP). Passive triggers evaluate against effective stats where stats are involved (e.g., countdown = base_time + **effective** time).
- **If effective `time` goes negative or very large**: hero-class's base half can be 0 (Wordsmith) and takes no clamp of its own; battle-system clamps the countdown (recommended floor ≥ 5 s). Large positive stacking (Grammarian +1.0 s base + equipment bonuses) is an equipment balance concern, not a hero-class rule.
- **If a listening answer is slow but correct**: Arcane's ×1.20 applies regardless of answer speed — the passive is not speed-gated (unlike Wordsmith's); the damage boost lands at any pace. Stated explicitly so the two passives are not conflated.
- **If a wrong answer occurs on listening** (Arcane): the passive deals nothing — wrong answers deal no damage in any round. There is no mana multiplier left to leak into the +10; mana is flat for every class (battle Core Rule 13).
- **If a vocab-flavored question appears in a non-vocab round**: Wordsmith's ×1.2 keys on `round_type == vocab_strike`, never on question tags. A vocab question drawn into the ultimate round gets no passive bonus.
- **If a ghost opponent's class has a passive**: ghost passives do not trigger at MVP — no formula evaluation happens for opponents (they resolve by accuracy rolls). The passive data must remain present in class records so post-MVP enablement needs no schema change.

## Dependencies

**Upstream dependencies: none.** Hero-class is a Foundation-layer system: it depends on no other system's GDD or runtime. Its only external contract is persistence (the chosen class id in the player profile), which accounts-backend provides as infrastructure rather than a design dependency.

**Downstream dependents:**

| System | Dependency type | What it needs from hero-class | Status |
|---|---|---|---|
| battle-system | Hard | Base stat blocks (hp/atk/def/crit/time) as formula inputs; passive trigger rules + magnitudes (×1.2 vocab, +60 shield @ streak 3, ×1.20 listening damage) to apply inside its formulas; `time` added to every round countdown | GDD Approved — contract adopted; battle consumes these as data (its Rules 9, 12–13) and its balance pass may retune magnitudes through the tuning process only |
| equipment | Hard | Base stats as the stat-target baseline (items add bonuses on top); class id to theme item pools and passives | GDD Approved — equipment owns LoadoutSnapshot assembly (its Core Rule 10); hero-class supplies base values only |
| opponent-ai | Soft | `ClassId` references for ghost identities (display + stat framing); no formula input | GDD Approved |
| ui-shell | Soft | Full class records (names, VI names, icons, colors, passive text) for the pick screen and battle HUD passive line | GDD Approved |
| accounts-backend | Hard (storage) | Persists the chosen class id permanently in the player profile; serves it on session start | GDD Approved — storage contract exists; hero-class adds the "permanent, never mutated" rule |

**Bidirectional consistency note**: the systems index lists battle-system and equipment as dependents of hero-class (✓ both listed above). Opponent-ai and ui-shell both list hero-class in their own Dependencies sections (verified 2026-11-09). Accounts-backend's GDD predates this one and does not name hero-class — when next revised it should add hero-class to its dependents list.

**Contract status**: both hard downstream consumers (battle-system, equipment) are authored and Approved (battle-system revised 2026-11-09, pending re-review); the contracts above were adopted without shape conflicts.

**Open interface items — decisions battle-system owes this GDD** (referenced by Edge Cases):

1. **Elapsed-time timestamp pair per round type** — "question display → answer commit" is unambiguous for reading rounds but not for listening rounds (audio onset vs. audio end vs. UI-ready). Also: which round types count as "attack rounds" for the guaranteed-crit rule (is grammar_shield included? the ultimate round?).
2. **Shield-pool cap/decay rules** — whether Grammarian's +60 flat shield is capped, and how shields decay.
3. ~~**Mana rounding mode**~~ — **RESOLVED 2026-11-09**: battle Core Rule 13 documents round_half-up for any future fractional gain; at MVP mana is integer-exact (flat +30/+10), so nothing rounds.
4. ~~**Mana gain formula shape**~~ — **SUPERSEDED 2026-11-09 (D-B1)**: mana gain is flat `min(100 − mana, 30 | 10)` for every class — the multiplier slot was removed when the Arcane passive moved to listening damage (B4's `class_listening_damage_mult`). This item no longer applies.

## Visual/Audio Requirements

Hero-class owns no runtime visuals or audio — it owns the **content records** other systems render. Requirements on those records:

- **Identity fields are mandatory per class**: icon (lucide set, per concept's iconography style), accent color (prototype: Wordsmith `#F43F5E` rose, Grammarian `#10B981` emerald, Arcane Speaker `#8B5CF6` violet), EN + VI names, passive display text (Vietnamese, shown verbatim on the pick screen and battle HUD).
- **Passive feedback events** (rendered by battle-system/ui-shell, styled per art direction): Wordsmith proc → damage-number emphasis on fast vocab strikes; Grammarian proc → shield-gain pop ("Kết Giới +60 Shield", emerald); Arcane resonance → pierce-damage emphasis on listening strikes. Hero-class supplies the display strings; VFX styling belongs to ui-shell's battle HUD spec.
- **No audio events** are owned by this system at MVP (concept: audio needs minimal, `INTENT UNKNOWN` whether SFX are wanted).

## Game Feel

- **The pick moment** is the first power-fantasy beat of onboarding: three clearly differentiated identities, each answering "which skill should the game reward?" — read speed (Wordsmith), calm accuracy (Grammarian), listening flow (Arcane Speaker). The screen must communicate the trade-off (bulk vs. burst vs. time) in one glance; the player commits permanently, so the choice must feel significant, not test-like.
- **Class identity must stay legible in battle**: each passive proc should read as *the class moment* — Wordsmith players feel rewarded for daring to answer fast, Grammarian for staying perfect, Arcane for riding listening rounds. If a proc fires and the player cannot tell why, the feel has failed (ui-shell requirement, fed by this system's display strings).
- **Time stat is felt, not seen**: Grammarian's +1 s reads as comfort (fewer timeouts), Arcane's +0.5 s as a slight ease; Wordsmith's +0 s is the risk identity. The spread is deliberately ≤ 1.5 s so no class feels cheated by the clock.

## Cross-References

| Referenced system | Section/value referenced | Direction |
|---|---|---|
| accounts-backend | Player profile storage (class id persisted) | this → accounts-backend |
| battle-system | Damage/shield/mana formulas consume hero-class constants; `fast_answer_threshold` shared | battle-system → this (Approved) |
| question-content | `vocab_strike` / `grammar_shield` / `listening_pierce` round-type ids (discriminated-union schema) | this → question-content |
| equipment | Base stats as stat targets; LoadoutSnapshot assembly | equipment → this (Approved) |
| ui-shell | Class pick screen, battle HUD passive line | ui-shell → this (Approved) |
| opponent-ai | Ghost `ClassId` identities | opponent-ai → this (Approved) |
| game-concept | Pillar 1 (Speed Is Damage), Pillar 3 (Knowledge Is Gear), MVP item 4 | this → concept |

## Acceptance Criteria

Legend: **[unit]** = automatable unit test (vitest, deterministic, DI-stubbed clock/RNG/collaborators); **[integration]** = automated integration test; **[screenshot]** = retained screenshot required in `production/qa/evidence/`. *(provisional)* = asserts behavior at the boundary with battle-system or equipment; both GDDs are now authored and Approved, so the tag marks boundary fixtures only, not undesigned contracts.

Shared numbers, restated so no criterion requires reading other sections: base_time = 10 s; correct-answer mana = +30, wrong-answer mana = +10 (flat, every class); guaranteed-crit multiplier = ×1.25; Arcane listening-damage multiplier = ×1.20; round types = `vocab_strike`, `grammar_shield`, `listening_pierce`, ultimate.

- **HC1 [unit] — Class registry shape (Core Rules 1–2).** **GIVEN** the class data file is loaded, **WHEN** the class registry is read, **THEN** it contains exactly 3 records with distinct stable ids (`wordsmith`, `grammarian`, `arcane`); each record carries an English name, a Vietnamese name, an icon, an accent color, exactly one passive definition, and a stat block with exactly the keys `hp`, `atk`, `def`, `crit`, `time` (numeric) and no other stat key — in particular no mana key; and no stat or passive value is defined in source code (editing the data file changes what the registry serves, with no code change).
- **HC2 [unit] — Authored baseline values (Core Rule 4 + constant set).** **GIVEN** the class data file, **WHEN** each class's stat block and the passive constants are read, **THEN** Wordsmith = hp 380 / atk 80 / def 30 / crit 12 / time +0.0 s; Grammarian = hp 420 / atk 62 / def 55 / crit 6 / time +1.0 s; Arcane Speaker = hp 360 / atk 72 / def 38 / crit 9 / time +0.5 s; `wordsmith_fast_answer_mult` = 1.2; `grammarian_shield_flat` = 60; `arcane_listening_damage_mult` = 1.20; `fast_answer_threshold` = 3000 ms; `grammarian_proc_streak` = 3; and max(time) − min(time) ≤ 1.5 s. (Exact numbers are the assertion — boundary-value exception applies.)
- **HC3 [unit] — Wordsmith trigger (Core Rule 5).** **GIVEN** a Wordsmith hero, **WHEN** a `vocab_strike` round is answered correctly with elapsed 2500 ms (stub clock), **THEN** the passive exposes the ×1.2 factor to the battle damage formula; **and WHEN** the same round is answered correctly at 3500 ms, **THEN** the exposed factor is 1.0.
- **HC4 [unit] — Wordsmith keys on round type, not question content (Edge Case).** **GIVEN** a Wordsmith hero and a listening_pierce or ultimate round whose question content happens to be a vocabulary item, **WHEN** it is answered correctly in 1500 ms, **THEN** the exposed factor is 1.0 — the trigger requires `round_type == vocab_strike`; question tags alone never trigger it.
- **HC5 [unit] — Grammarian proc at MVP battle length (Core Rule 5 + F1 + Edge Case "streak past 3").** **GIVEN** a Grammarian hero in an MVP-length battle (4 rounds), **WHEN** all 4 answers are correct in one run, **THEN** exactly one proc fires — +60 flat shield immediately when the 3rd correct resolves, before round 4 begins — and the 4th correct grants no second proc; the +60 does not enter battle's `shield = 80 + def × 0.3` and does not scale with `def`.
- **HC6 [unit] — F1 modulo form and streak reset (F1 + Edge Case "streak breaks").** **GIVEN** the F1 predicate (run counter +1 per correct answer, reset to 0 on wrong answer or timeout; proc when counter mod 3 = 0), **WHEN** the sequence is correct ×3, wrong, correct ×3, **THEN** exactly 2 procs fire — after the 3rd and after the 6th correct — none on counts 1, 2, 4 or 5; a timeout at the same slot produces the identical result. (6-length runs are unreachable in MVP battles; this test pins the modulo form so it goes live without a rule change, per F1's own example.)
- **HC7 [unit, provisional] — Exactly 3000 ms is not fast, for both consumers of the shared threshold (Core Rule 6 + Edge Case).** **GIVEN** the shared `fast_answer_threshold`, **WHEN** a correct `vocab_strike` resolves at elapsed exactly 3000 ms, **THEN** the Wordsmith ×1.2 does not fire and battle's guaranteed crit does not fire (strict `elapsed_ms < 3000`); **and WHEN** elapsed is 2999 ms, **THEN** both fire. Both consumers read the same constant and the same elapsed measurement.
- **HC8 [unit, provisional] — Wordsmith stacks on the shared battle crit (Core Rule 6).** **GIVEN** a fixed speed-multiplier context (stub clock) and a DI-stubbed crit roll that suppresses random crits, **WHEN** a Wordsmith answers the same `vocab_strike` question correctly at 1500 ms and again at 8000 ms, **THEN** fast damage = exactly 1.5 × (= 1.25 × 1.2) slow damage; **and WHEN** a Grammarian runs the same comparison, **THEN** the ratio is exactly 1.25 — the ×1.2 is the Wordsmith passive only, and no other factor is added by answering fast.
- **HC9 [unit, provisional] — Arcane listening damage ×1.20, not speed-gated (Core Rule 5 + Edge Case "slow but correct").** **GIVEN** an Arcane Speaker with atk 72, **WHEN** a `listening_pierce` round is answered correctly at 7000 ms (slow — outside any fast-answer window) with the crit roll DI-suppressed, **THEN** the damage value entering battle's rounding step is 102.4 × 1.20 = 122.88; **and WHEN** a non-Arcane class answers the same round correctly, **THEN** that value is 106.0 (multiplier defaults to 1.0). The final displayed integer follows battle-system's B4 rounding (round_half_up once, at the formula's end → 123 / 106) — this criterion pins only the pre-rounding product.
- **HC10 [unit, provisional] — The multiplier touches listening damage only (Edge Case).** **GIVEN** an Arcane Speaker, **WHEN** a `vocab_strike` or ultimate round is answered correctly at any speed, **THEN** the multiplier battle exposes for that round is 1.0 — the ×1.20 exists only inside B4's listening formula; **and WHEN** a `listening_pierce` round is answered incorrectly, **THEN** no damage is dealt and nothing is multiplied (the +10 mana is flat for every class, Core Rule 13).
- **HC11 [unit, provisional] — Equipment reaches only the five stats (Core Rule 2 + Edge Case "equipment modifies stats").** **GIVEN** equipment's LoadoutSnapshot assembly, **WHEN** any item's bonuses are applied to any class, **THEN** only `hp`/`atk`/`def`/`crit`/`time` may change; `wordsmith_fast_answer_mult`, `grammarian_shield_flat`, `arcane_listening_damage_mult`, `fast_answer_threshold`, `grammarian_proc_streak` are not addressable by items; no item can add a mana value; and stat-involving triggers evaluate against effective values (countdown = base_time + effective time).
- **HC12 [unit, provisional] — Time bonus applies to every round (Core Rule 7).** **GIVEN** each class's `time` stat and base_time = 10 s, **WHEN** the countdown is computed for each round type (`vocab_strike`, `grammar_shield`, `listening_pierce`, ultimate), **THEN** it is 10.0 s / 11.0 s / 10.5 s for Wordsmith / Grammarian / Arcane Speaker on every round type — unconditional, including rounds outside the class's identity.
- **HC13 [unit, provisional] — Ghost carries identity, not passives (Core Rule 8 + Edge Case).** **GIVEN** a ghost opponent assigned the Grammarian class id, **WHEN** battle resolves the ghost's actions at MVP, **THEN** no passive evaluation runs for the ghost — it never gains a +60 proc shield and its outcomes come from accuracy rolls only; **and WHEN** the ghost is rendered, **THEN** its record supplies the class id and identity fields (icon, color) for display.
- **HC14 [integration] — Permanent choice persisted by accounts-backend (Core Rule 3 + States).** **GIVEN** a fresh account in `ClassUnpicked`, **WHEN** the player confirms a class on the pick screen, **THEN** the class id is persisted to the player profile, the account state is `ClassPicked`, and a new session (logout → re-login) is served the same class as authoritative; **and WHEN** any MVP surface, API or data path is exercised afterwards, **THEN** none changes the persisted class id — `ClassPicked` is terminal at MVP.
- **HC15 [screenshot] — Pick screen renders the full class records (ui-shell interaction).** **GIVEN** a `ClassUnpicked` account opening the onboarding pick screen, **WHEN** it renders, **THEN** all three classes display their English name, Vietnamese name (Chiến Binh Từ Vựng / Pháp Sư Ngữ Pháp / Thi Nhân Âm Ngữ), icon, accent color (rose #F43F5E, emerald #10B981, violet #8B5CF6) and Vietnamese passive text verbatim. Retained screenshot in `production/qa/evidence/`.
- **HC16 [screenshot, provisional] — Grammarian proc is legible in the battle HUD (Visual/Audio Requirements).** **GIVEN** a Grammarian whose 3rd consecutive correct answer has just resolved, **WHEN** the proc fires, **THEN** a shield-gain feedback element reading "Kết Giới +60 Shield" in emerald is visible in the battle HUD before the next round begins. Retained screenshot required. The sibling Wordsmith (fast-strike damage-number emphasis) and Arcane Speaker (pierce-damage emphasis) feedback moments listed in Visual/Audio Requirements each require their own retained screenshot at the same gate.

Coverage: Core Rules 1→HC1, 2→HC1/HC11, 3→HC14, 4→HC2, 5→HC3/4/5/9/10, 6→HC7/HC8, 7→HC12, 8→HC13; F1→HC5/HC6; edge cases: streak-past-3→HC5, exactly-3000ms→HC7, listening-only scope→HC10, ghost passives→HC13; cross-system: accounts-backend→HC14, equipment→HC11, battle→HC7–HC13, ui-shell→HC15/16. Total 16: 13 automatable (HC7–HC13 provisional on boundary fixtures — the consumer GDDs are authored), 1 integration, 2 screenshot.

> **Note — HC7/HC8 scope limit**: the elapsed-time timestamp pair per round type is battle-system's to define (Dependencies, interface item 1); battle's GDD is authored (revised 2026-11-09), and HC7/HC8 remain pinned to `vocab_strike` as written.

## UI Requirements

Hero-class contributes content to two screens (owned and specified by ui-shell):

- **Class pick screen** (onboarding, after auth — accounts-backend serves the profile): full class records — EN/VI names, icons, accent colors, passive text, and the base stat block rendered comparably (so the trade-off reads at a glance). The screen must state the choice is permanent before the confirm action (Core Rule 3); confirm requires explicit action, no accidental pick.
- **Battle HUD passive line** (during battle): the hero's passive text displayed with the class accent color (prototype placement: below the hero's HP/shield/mana bars).
- No input flows, no navigation, no accessibility requirements beyond ui-shell's global standard originate here — hero-class supplies records, ui-shell owns the screens. UX specs for both screens are produced by `/ux-design` at Pre-Production.

> **📌 UX Flag — hero-class**: This system has UI requirements. In Phase 4 (Pre-Production), run `/ux-design` to create a UX spec for the class pick screen (and the battle HUD passive line) before writing epics. Stories that reference UI should cite `design/ux/[screen].md`, not the GDD directly.

## Open Questions

| # | Question | Owner | Target resolution |
|---|---|---|---|
| OQ1 | Elapsed-time timestamp pair per round type + which round types are "attack rounds" for the guaranteed crit | battle-system GDD | At its authoring session (design order #5) |
| OQ2 | Shield-pool cap/decay rules (does +60 flat stack unbounded?) | battle-system GDD | At its authoring session |
| OQ3 | ~~Mana rounding mode + multiplier-slot shape confirmation~~ **RESOLVED 2026-11-09** — rounding: round_half-up, retained for future fractional gains only (mana is integer-flat at MVP); multiplier slot: removed with the passive's move to listening damage (D-B1) | battle-system Core Rule 13 | closed |
| OQ4 | Post-MVP class switching: is it a product possibility the schema should tolerate (e.g., a `class_history` field), or permanently closed? MVP is settled (fixed); this decides forward-compatibility only | project-owner | Before accounts-backend schema freeze |
| OQ5 | Ghost stat framing: do ghost opponents ever use hero stat blocks in resolution, or stay pure accuracy rolls? MVP settled (display-only) | opponent-ai GDD | At its authoring session (design order #4) |
| OQ6 | Balance pass on baseline stats/magnitudes — safe bands noted in Formulas; actual retuning happens against battle math | battle-system GDD + `/balance-check` | After battle-system formulas exist |
