# Battle System

> **Status**: Complete — pending design review
> **Author**: project owner + game-designer, systems-designer, qa-lead, art-director (agents)
> **Last Updated**: 2026-11-09
> **Last Verified**: 2026-11-09
> **Implements Pillar**: 1 (Speed Is Damage) — primary; 2 (Mistakes Are Materials) at battle end

## Summary

Battle-system is LexiQuest's core loop: a deterministic, seeded 4-round duel
(vocab strike → grammar shield → listening pierce → earned-mana ultimate) in
which every English question answered is a combat action and every formula
rewards answering *fast* (Pillar 1). It owns the round state machine, the
question-draw policy, all damage/shield/mana/crit arithmetic (B1–B12), ghost
resolution scheduling via opponent-ai's contract, and the end-of-battle
payoff — victory/defeat, reward events, and the cursed-rune list that feeds
the Forge (Pillar 2). It exists because the prototype validated that the RPG
frame — damage numbers, shields, crits, combos — is what makes recall speed
legible and worth training; without it there is no game.

> **Quick reference** — Layer: `Core` · Priority: `MVP` · Key deps: `question-content, hero-class, opponent-ai, equipment (LoadoutSnapshot)`

## Overview

Battle-system is the engine of LexiQuest's core loop: a deterministic, 4-round
duel between the player's hero and a Shadow Ghost, where every English question
answered is a combat action — a vocabulary strike, a grammar shield, a
listening pierce, or an earned-mana ultimate burst. It owns the round state
machine (lobby → four rounds → result), the question-draw policy per round
type, all damage/shield/mana/crit arithmetic, HP pools for both fighters, the
seeded randomness that makes every battle reproducible, and the end-of-battle
payoff: victory/defeat, gold/XP/RP events, and the cursed-rune list that feeds
the Forge (Pillar 2). The player interacts with it directly — answering under
a countdown — but never configures it; what they feel is Pillar 1 made
mechanical: *speed is damage*, because every formula multiplies by how much
of the timer remained at commit. Without battle-system there is no game: the
prototype validated that the quiz-battle frame (damage numbers, shields,
crits, combos) is what makes recall speed legible and worth training.

The system is rules-only at its core (pure, seeded, testable state
transitions); presentation theater (hit shakes, floating numbers, reveal
animations) is ui-shell's, driven by battle events and opponent-ai's pacing
constants.

## Detailed Design

### Core Rules

**Battle structure**

1. **One battle = 4 rounds in fixed order**: R1 `vocab_strike`, R2 `grammar_shield`, R3 `listening_pierce`, R4 `ultimate_burst` — or, when the ult does not fire (Rule 10), R4 is a `vocab_strike` fallback round. The order is fixed data, not shuffled; each round type maps 1:1 to a question-content round-type pool.
2. **Encounter configuration**: every battle carries an encounter type (`friend | ranked | tower_stage | tower_boss`), which selects the module's question pools, the GhostProfile (opponent-ai), the ghost HP baseline and the reveal-delay constant. Encounter *selection* (which module, which stage) belongs to the requesting system (tower / home screen); battle-system consumes the config and never chooses content.
3. **LoadoutSnapshot**: at battle start, battle-system reads exactly one immutable `LoadoutSnapshot` from equipment (plain data — no runtime cycle): `{ class_id, effective_stats {hp, atk, def, crit, time}, items [{item_id, slot, passive_id}] }`. All five stats are already effective (base + equipment bonuses — assembly is equipment's job). Battle never mutates the snapshot and never reads inventory state mid-battle. **Contract owned by equipment; adopted verbatim by its GDD (Approved 2026-11-09 — its Core Rule 10; OQ-BS4's shape item closed there).**
4. **Deterministic tick model**: the battle advances on a simulated clock (fixed-tick state machine), not wall-clock `setTimeout` choreography. Every timestamp the formulas consume (elapsed, remaining) comes from the tick model. ui-shell renders theater from emitted battle events and may fast-forward presentation; it can never alter battle state. This is what makes battles headless-testable and replayable.

**Round flow**

5. **Round sequence**: `intro → question (timer running) → player commit | timeout → resolve (player effect, then ghost reveal after `answer_reveal_delay_ms_*`) → round_end → next round | result`. Both fighters' effects resolve from the single player commit; the ghost's outcome is already determined (Rule 15) and is only *revealed* late — player speed never changes it.
6. **Countdown**: `round_time = base_round_time_s + hero_effective_time`, clamped to a floor of **5 s** (hero-class Edge Case recommendation adopted; prevents negative/absurd timers from equipment stacking). `base_round_time_s = 10`.
7. **Elapsed-time timestamp pair per round type** (resolves hero-class open interface item 1):
   - Reading rounds (`vocab_strike`, `grammar_shield`, fallback vocab): timer starts when the question is fully displayed and answer options are interactive; elapsed = start → answer commit.
   - `listening_pierce`: timer starts when the answer options become actionable — audio may still be playing, replays do not reset or pause the timer; elapsed = options-actionable → commit.
   - `ultimate_burst`: elapsed is measured only for the slow-rune threshold (Rule 20); there is no speed component (Rule 8).
8. **Speed multiplier** (Pillar 1): `speedMult = 1 + 0.3 × remaining_fraction`, where `remaining_fraction = max(0, 1 − elapsed/round_time)` at commit. It multiplies attack-round damage only (vocab_strike, listening_pierce, fallback vocab). Grammar shields and counters are deliberately **not** speed-scaled: speed is the attack identity; defense rewards correctness under pressure. Slowness still has a cost on this round: the > 6000 ms cursed-rune threshold (Rule 20) applies to the grammar round like every standard round.

**Combat resolution (player side)**

9. **Attack rounds** (correct answers):
   - `vocab_strike`: `dmg = round((40 + atk × 0.5) × speedMult × crit_mult × wordsmith_fast_mult_when_fast × ghost_armor)` with `ghost_armor = 0.92`.
   - `listening_pierce` (armor-piercing — no ghost_armor factor): `dmg = round((70 + atk × 0.45) × class_listening_damage_mult × speedMult × crit_mult)` — the class multiplier is Arcane Speaker's passive (hero-class `arcane_listening_damage_mult` = 1.20, cross-review D-B1 resolution 2026-11-09; 1.0 for every other class).
   - `ultimate_burst`: `dmg = round((175 + atk × 0.38) × quality)` where `quality ∈ [0, 1]` comes from the mic/spell-completion interaction (speech-io contract). No speedMult.
   - **Crit**: if `elapsed_ms < fast_answer_threshold` (3000 ms, shared constant — referenced, never redefined): guaranteed `crit_mult = 1.25`. Otherwise a single crit roll is drawn from the battle's own crit stream with probability `crit_stat/100`. **Crit scope** (resolves hero-class open interface item 1b): damage rounds only — vocab_strike, listening_pierce, fallback vocab. NOT grammar_shield (would double-dip defense), NOT ultimate_burst (quality replaces speed). **The fallback round is a full `vocab_strike` for every factor** — fast_mult, crit scope, the 6000 ms slow-rune threshold, and speedMult all apply exactly as R1 (Core Rule 7 lists it among reading rounds); "fallback vocab" is a scheduling label, not a different rule set.
10. **Ultimate round gating** (resolves the systems-index arithmetic gap: 3 × +30 = 90 < 100): the ult fires at round 4 iff `mana ≥ ultimate_mana_gate` where `ultimate_mana_gate = 90`. Three correct prior rounds reach exactly 90; any miss (2C+1W = 70) does not. When the ult fires, mana resets to 0 (spent). When it does not, round 4 falls back to `vocab_strike` (a question drawn by Rule 22's policy) and unspent mana simply evaporates at battle end — nothing carries between battles. The mana cap stays 100 (HUD display material).
11. **Defense round** (`grammar_shield`, correct): `shield_gained = round(80 + def × 0.3)` joins the shield pool; plus a counter-strike `counter = round(30 + def × 0.4)` to the ghost. Neither is speed- or crit-scaled, and the counter **bypasses ghost armor** (it is a warrior's strike, not a vocab question). **Shield pool rules** (resolves hero-class open interface item 2): the pool accumulates across rounds, absorbs ghost damage before HP, and persists for the whole battle — **no decay, no cap at MVP** (structurally bounded by battle length: worst case = 1 grammar shield + 1 Grammarian proc ≈ 97 + 60 = 157 points, since R2 is the battle's only grammar round). Revisit if battle length ever grows.
12. **Grammarian proc**: on each correct answer `run_correct += 1`; on wrong answer or timeout `run_correct = 0`. A proc fires whenever `run_correct mod 3 == 0` → `+ grammarian_shield_flat (60)` shield immediately (formula `grammarian_proc_count`, hero-class F1 — battle implements the runtime predicate, counts runs, applies the flat shield; it does not re-own the formula).
13. **Mana economy**: correct answer `+30` mana; wrong answer or timeout `+10` — **flat for every class**. (The former Arcane mana multiplier `arcane_listening_mana_mult` ×1.35 was removed in the 2026-11-09 cross-review remediation (D-B1): on a +30 gain it could never move any 3-round sequence across the 90 gate — best case 2C+1W = 30+10+41 = 81 < 90 — so the class's passive now lives on listening *damage* (B4). Mana is integer-exact at MVP; if a future tuning pass reintroduces a fractional gain, the house **round-half-up** convention applies (hero-class open interface item 3's documented answer, retained). Cap 100.)
14. **Wrong answers and timeouts**: combo resets to 0 (equipment hook points may preserve it — Rule 25), `+10` mana, and the question's word drops as a cursed rune (Rule 20). A timeout is an incorrect answer in every respect.

**Combat resolution (ghost side)**

15. **Ghost resolution**: at each round end, battle-system calls `resolve_round(profile, mode, seed, round_index) → {correct, answer_reveal_delay_ms}` (opponent-ai F1/F2 contract). The result is final at resolution; the reveal is theater. Battle-system supplies the seed (Rule 18) and never draws from the ghost stream itself.
16. **Ghost damage**: when the ghost answers correctly, it deals **fixed, deterministic** damage — `100` on standard rounds, `150` on the ultimate round. The prototype's `80 + random×45` spread was incidental, not authored; determinism wins at MVP (no extra ghost-stream draws are permitted, and a separate damage stream buys nothing designed). Damage is mitigated by `× (1 − min(0.25, max(0, def_effective)/600))` (mitigation capped at 0.25, defense clamped ≥ 0 so a negative stat can never amplify damage), absorbed by the shield pool first, HP takes the remainder — the ghost therefore always chips (floor 75/113), never zeroes. The ghost never times out at MVP — it always answers within its reveal delay.
17. **Ghost armor**: player `vocab_strike` damage × 0.92 (flat); `listening_pierce` pierces it — that asymmetry is the round type's combat identity.

**Battle end**

18. **Seeds (OA-OQ1, resolves opponent-ai's open question)**: battle-system generates **one uint64 seed per battle** from a cryptographically random source (`crypto.getRandomValues`) — unpredictable per battle so ghost patterns cannot be farmed — and persists it in the battle record, making every battle bit-exactly replayable. The ghost stream receives the seed via `resolve_round`; the question stream and crit stream are battle-owned and derive their child seeds deterministically from `(seed, domain_tag)` — the derivation is pinned once the PRNG ADR (OA-OQ2, technical-director) lands. `Math.random` never appears in battle math.
19. **Win/loss**: ghost HP ≤ 0 → victory immediately (early KO allowed — though at MVP base stats the maximum three-round burst ≈ 358 stays below every ghost HP, so early KOs become reachable only through equipment scaling); hero HP ≤ 0 → defeat immediately; both alive after round 4 → higher HP *fraction* wins; exact tie → player wins. Battles are self-contained: no carry-over HP, mana or shields between battles. **Boss-fight identity note**: with `ghost_hp_boss = 600` locked, even a perfect full battle (all fast, all crits, quality 1.0) tops out at ≈ 563 damage — every boss victory at MVP base stats is a survive-and-outlast win on HP fraction, never a KO. That is the boss's designed identity (the checkpoint that cannot be burst down); retuning HP toward a KO-reachable 550 (inside the ±30% band) is an owner balance-pass decision, raised as OQ-BS2.
20. **Cursed runes (Pillar 2)**: a question answered wrong **or** slowly — `elapsed > 6000 ms` on standard rounds, `> 11000 ms` on ultimate_burst — drops that question's word as a cursed rune (deduplicated within a battle). The list is emitted in the `BattleResult`; forge-srs owns the queue, scheduling and everything after emission.
21. **Rewards (emitted events, provisional values from the validated prototype)**: victory → `gold 120` (tower-boss stage `250`), `xp 180`; defeat → `gold 40`, `xp 60`. **RP events fire on ranked encounters only** (win `+28`, loss `−14`; every other encounter emits RP 0 — prototype convention, kept). meta-progression owns ledger semantics; ranked-league owns RP tier math; battle emits the events and owns nothing downstream of them. Final reward values are meta-progression's to retune (flagged provisional).

**Question draw policy (OQ#1 — the systems-index high-risk gap)**

22. **Draw policy** (pool keyed by encounter type — resolves the tower/battle draw-pool contradiction, cross-review C-B1 2026-11-09): each round draws exactly **1 question (k = 1)** from the encounter's pool:
    - **friend / ranked**: the **module × round-type** pool (build-gated `min_battle_pool_size = 8`, question-content F1);
    - **tower_stage / tower_boss**: the **module × stage mixed pool** (question-content F2/F3 minimums ≥ 6 / ≥ 4, composition gate: ≥ 1 question per round-type), the round type selecting the slice at draw time — tower never picks questions; battle-system draws, exactly as tower's config contract says.
    Draws come from the battle's seeded question stream (Rule 18); no question repeats within a battle. Across battle-mode battles, floor(N_pool/1) = 8 battles pass before a round-type repeats — question-content F5's no-immediate-repeat policy, instantiated at k=1. Across tower attempts, variety is what the stage pool's size provides (a full 4-question repeat is possible at minimum pool size — 1/15, tower Rule 6's corrected note). The fallback vocab round draws from its encounter's vocab slice under the same policy.
23. **`battles_per_typical_session = 4`** (battle-system's owned definition, owed to question-content F5): the median number of complete battles in a typical 10–20 min session at 2–4 min/battle. Burnout guard satisfied at defaults on battle-mode pools: 8 ≥ 2 × 4 (tower pools are gated by F2/F3 plus the composition gate instead — see Rule 22). If retention data shows longer sessions, raise `N_battle` inside its 8–16 band (question-content's F5 signal) — this constant is re-estimated there, never silently.
24. **Ult/mana non-interaction**: the ghost's roll participates in no mana arithmetic (opponent-ai's mana note, honored): mana accrues only on the player's answers, and fixing the gate (Rule 10) touched no opponent-ai value.

**Equipment hook points**

25. **Passive effect hooks**: battle exposes named hook points — `pre_damage_mult (per attack round)`, `pre_shield_mult (per grammar round)`, `flat_counter_bonus`, `combo_keep_on_miss (once per battle)` — that equipment passives apply through. At MVP the LoadoutSnapshot carries `passive_id`s; the effect vocabulary each passive maps to is **equipment's GDD-authored** (Approved 2026-11-09: battle's four hooks adopted; five Class-B hook additions and the battle-side state handoff are owed per its OQ-EQ1, riding battle's next edit). Battle applies only effects equipment's GDD documents against these hooks.

### States and Transitions

| State | Description | Exits |
|---|---|---|
| `Lobby` | Encounter config assembled (mode, module, encounter type, LoadoutSnapshot, seed generated, GhostProfile resolved) | → `Intro` |
| `Intro` | Fighters presented, round cards shown (per concept's in-lobby rules) | → `Question (R1)` |
| `Question` | Timer runs on the round's timestamp rule; player commits or times out | → `Resolve` |
| `Resolve` | Player effect applies; ghost reveal scheduled after `answer_reveal_delay_ms_*`; damage/shield/mana/combo mutate | → `RoundEnd` |
| `RoundEnd` | HP checks (Rule 19); runes recorded; round index advances | → `Question` (next round) or → `Result` |
| `Result` | Victory/defeat computed; `BattleResult` emitted (runes, rewards, seed, per-round log) | → exit (to Forge / queue / home — caller's choice) |

- Battle length is fixed at 4 rounds **or** first KO, whichever comes first. There is no draw state: Rule 19 always produces a winner.
- There is **no forfeit state at MVP**: abandoning the session (tab close) discards the battle with no `BattleResult` emitted — no runes, no rewards (Edge Cases). Ranked forfeit is server-side and needs no battle state: ADR-0003 §4 records an open ranked registration as forfeited at T+15 min (RP −14, no rewards, no runes); battle's silent discard stands unchanged at every stage. Mid-battle reconnect/resume is post-MVP (OQ-BS8's resume half).
- The ghost has no observable state machine of its own from battle's perspective: one `resolve_round` call per round, result consumed, theater scheduled.

### Interactions with Other Systems

| System | Direction | Interface | Owner of semantics |
|---|---|---|---|
| question-content | Upstream (Hard) | Battle pools (module × round-type) + question payloads (`term`, choices, `tts_text`/`ipa`, `tile_letters`, `word_id`); `min_battle_pool_size = 8`; F5 repeat guard | question-content owns schema/pools/gates; battle owns draw policy + counts (Rule 22) |
| hero-class | Upstream (Hard) | Base stat blocks → snapshot inputs; passive constants (×1.2 vocab, +60 shield, ×1.20 listening damage) applied inside battle formulas; `fast_answer_threshold` referenced, never redefined; `grammarian_proc_count` predicate implemented | hero-class owns class data + magnitudes; battle owns the equations (its documented consumption contract) |
| opponent-ai | Upstream (Hard) | `resolve_round(profile, mode, seed, round_index) → {correct, answer_reveal_delay_ms}`; `ghost_hp_*` and `answer_reveal_delay_ms_*` constants applied by battle | opponent-ai owns the roll + profile data; battle owns seed supply (Rule 18), HP/reveal application |
| equipment | Upstream (Hard) | `LoadoutSnapshot` (Rule 3); passive effects via hook points (Rule 25) | equipment owns snapshot assembly + passive vocabulary (equipment GDD Approved 2026-11-09; Class-B hook additions owed per its OQ-EQ1) |
| forge-srs | Downstream (Hard) | `BattleResult.cursed_runes` — word list from Rule 20 | battle owns emission; forge owns queue, SRS scheduling, purification |
| tower | Downstream (Hard) | Encounter config (module, stage, encounter type) → battle; battle returns result incl. victory | tower owns floor/stage selection + progression; battle owns the fight |
| speech-io | Downstream (Hard) | Listening rounds: TTS rendering of `tts_text`/`ipa` + fallback mode; ult round: mic/spell interaction returning `quality ∈ [0, 1]` (simulated engine behind interface, 2026-11-08 decision) | speech-io owns rendering/scoring; battle consumes quality |
| ui-shell | Downstream (Soft) | Battle events (damage, shield, crit, reveal scheduling, round transitions) + HUD data (HP, shield, mana, combo, speedMult); theater presentation | battle owns state + emitted events; ui-shell owns rendering (may fast-forward, never mutates) |
| meta-progression | Downstream (Soft) | Reward events (gold/XP, Rule 21) | meta-progression owns ledger + final values (provisional) |
| ranked-league | Downstream (Soft) | RP events (±28/−14, Rule 21); ranked banner material from opponent-ai via ui-shell | ranked-league owns RP tier math (provisional) |

## Formulas

> **Source**: systems-designer consultation, 2026-11-09 (sanity-checked against the
> registry's locked stat blocks: wordsmith 80/30/12/0.0 · grammarian 62/55/6/1.0 ·
> arcane 72/38/9/0.5; ghost HP 500/500/420/600 = friend/ranked/tower_stage/tower_boss). Formula IDs are prefixed **B** to
> avoid collision with hero-class F1 and opponent-ai F1–F3, which this section
> *references* but never re-owns.
>
> **Global rounding convention: round-half-up, everywhere.** Mana (Rule 13),
> damage, shields, counters and ghost mitigation all use the same mode —
> Grammarian's shield lands on a real 96.5 and Arcane's ult-round ghost damage
> on a real 140.5, and deterministic replay (Core Rule 4) leaves no room for
> "whatever the platform's float rounding does". Damage expressions evaluate
> the full float product left-to-right and round **once**, at the end.
>
> Sanity-check headline (systems-designer, verified; re-derived 2026-11-09
> after D-B1 added Arcane's ×1.20 listening damage multiplier): at base stats
> an all-correct but slow player maxes out at 427 / 414 / 440 ghost damage
> (Wordsmith / Grammarian / Arcane = vocab 74/65/70 + grammar counter 42/52/45
> + listening 106/98/123 + ult 205/199/202 — the B7 counter included; no slow
> crit rolls). Against the 420 stage ghost only a perfect slow Wordsmith (by
> 7) or Arcane (by 20) run edges a KO — no slow run comes near the 500
> friend/ranked ghosts or the 600 boss. Pillar 1 is structurally enforced in
> that sense: knockout is
> the fast-play route (speedMult + guaranteed crits + fast_mult, up to 563);
> the slow route can at best scrape past the stage ghost. Ghost sweep damage
> (max 450) never kills a player who held the grammar round.

### B1 — Countdown

The `round_time` formula is defined as:

`round_time_s = max(5, base_round_time_s + hero_effective_time)` — `base_round_time_s = 10`

**Variables:**

| Variable | Type | Range | Source | Description |
|----------|------|-------|--------|-------------|
| `base_round_time_s` | float | 10 (fixed) | constant | Base seconds per round |
| `hero_effective_time` | float | ≥ −10 possible via equipment; class base 0.0/1.0/0.5 | LoadoutSnapshot | Effective `time` stat |
| `round_time_s` | float | 5 – unbounded above | calculated | Round countdown in seconds |

**Output Range:** floor 5 s (hero-class Edge Case recommendation adopted; large positive stacking is an equipment balance concern, not a battle rule). Class values: Wordsmith 10.0, Arcane 10.5, Grammarian 11.0. **The floor is load-bearing for B2** — it guarantees `round_time > 0`, so the speed multiplier can never divide by zero.

**Example:** Grammarian, no equipment: `max(5, 10 + 1.0) = 11.0 s`. Equipment −6 s on Arcane: `max(5, 10.5 − 6) = 5 s`.

### B2 — Speed multiplier (Pillar 1)

The `speedMult` formula is defined as:

`speedMult = 1 + 0.3 × remaining_fraction`, where `remaining_fraction = max(0, 1 − elapsed_s / round_time_s)`

**Variables:**

| Variable | Type | Range | Source | Description |
|----------|------|-------|--------|-------------|
| `elapsed_s` | float | 0 – round_time_s (tick model) | calculated (B1 clock) | Commit time minus timer start (Core Rule 7 timestamps) |
| `round_time_s` | float | 5 – unbounded | B1 | This round's countdown |
| `remaining_fraction` | float | 0–1 | calculated | Clamped at 0 — a commit at/after expiry contributes nothing |
| `speedMult` | float | 1.0–1.3 | calculated | Damage multiplier on attack rounds only |

**Output Range:** exactly [1.0, 1.3], bounded by construction — no clamp needed. Instant commit → 1.3; timeout → 1.0. Never applied to grammar_shield, ultimate_burst, shields, or counters (Core Rule 8: speed is the attack identity only).

**Example:** Wordsmith commits at 2.5 s of 10 s: `1 + 0.3 × (1 − 0.25) = 1.225`.

### B3 — Vocab damage

The `vocab_damage` formula is defined as:

`dmg = round_half_up((40 + atk × 0.5) × speedMult × crit_mult × fast_mult × ghost_armor)` — `ghost_armor = 0.92`

**Variables:**

| Variable | Type | Range | Source | Description |
|----------|------|-------|--------|-------------|
| `atk` | int | ≥ 0 (class 62–80 at base) | LoadoutSnapshot | Effective attack |
| `speedMult` | float | 1.0–1.3 | calculated (B2) | Speed reward |
| `crit_mult` | float | 1.25 or 1.0 | calculated (B10) | Guaranteed 1.25 when fast, else stream roll |
| `fast_mult` | float | 1.2 or 1.0 | registry `wordsmith_fast_answer_mult` | 1.2 iff class = wordsmith AND round = vocab_strike AND `elapsed_ms < 3000`; else 1.0 |
| `ghost_armor` | float | 0.92 (fixed) | constant | Vocab-only armor (Core Rule 17); listening pierces |
| `dmg` | int | ≥ 37; 144 max at base stats | calculated | Damage to ghost |

**Output Range:** min 37 (`atk = 0`, no mults: 40 × 0.92 = 36.8 → 37) — never 0 or negative. Max at base Wordsmith, perfect play: 80 × 1.3 × 1.25 × 1.2 × 0.92 = 143.52 → **144**. Unbounded upward only through equipment `atk`.

**Example:** Wordsmith, elapsed 2.5 s (fast → guaranteed crit + ×1.2): 80 × 1.225 × 1.25 × 1.2 × 0.92 = 135.24 → **135**. Slow, no crit: 80 × 1.0 × 1.0 × 1.0 × 0.92 = 73.6 → **74**.

### B4 — Listening damage (armor-piercing)

The `listening_damage` formula is defined as:

`dmg = round_half_up((70 + atk × 0.45) × class_listening_damage_mult × speedMult × crit_mult)`

**Variables:**

| Variable | Type | Range | Source | Description |
|----------|------|-------|--------|-------------|
| `atk` | int | ≥ 0 | LoadoutSnapshot | Effective attack |
| `class_listening_damage_mult` | float | 1.20 (Arcane) or 1.0 | registry `arcane_listening_damage_mult` (hero-class) | Arcane Speaker's passive — a rate, not an amount; unconditional (not speed-gated) |
| `speedMult` | float | 1.0–1.3 | calculated (B2) | Speed reward |
| `crit_mult` | float | 1.25 or 1.0 | calculated (B10) | Guaranteed when fast, else roll |
| `dmg` | int | ≥ 70; 172 max Wordsmith / 200 max Arcane at base stats | calculated | Damage to ghost |

**Output Range:** min 70 (`atk = 0`) — never degenerate. Max at base: Wordsmith 106 × 1.3 × 1.25 = 172.25 → **172**; Arcane (atk 72 → base 102.4) 102.4 × 1.3 × 1.25 × 1.2 = 199.68 → **200**. No `ghost_armor` factor — that absence *is* the round type's identity (Core Rule 17): higher base (70 vs 40) plus piercing is why listening hits ≈ 40% harder than vocab. (Class multiplier added 2026-11-09 — cross-review D-B1: Arcane's passive moved off the inert mana multiplier onto the round its identity names.)

**Multiplier composition (damage rounds):** every damage multiplier on a round — the class passive (`class_listening_damage_mult`), an equipment hook value (`pre_damage_mult`, equipment-owned; defaults to 1.0 when no equipped item maps to the round), `speedMult`, `crit_mult`, `fast_mult` — composes **multiplicatively into the float product**, with exactly **one** `round_half_up` at the end (the rounding convention equipment's hook table already assumes: "multiplies the full float product; rounded once at the end"). The class passive and an item hook are different sources and **stack** when both fire — equipment's hook-uniqueness rule binds equipped items against each other, never a passive against an item. Worked example — Arcane Speaker wielding Cung Collocation, fast, crit: `102.4 × 1.3 × 1.25 × 1.20 × 1.20 = 239.616 → 240`; applying either ×1.20 only once would print 200. *(Cross-review 2026-11-10 N-1: composition made explicit before any ADR pins a damage number.)*

**Example:** Wordsmith, elapsed 2.5 s, fast: 106 × 1.225 × 1.25 = 162.31 → **162**. Slow, no crit: **106**. Arcane, slow, no crit: 102.4 × 1.0 × 1.0 × 1.2 = 122.88 → **123**.

### B5 — Ultimate damage

The `ultimate_damage` formula is defined as:

`dmg = round_half_up((175 + atk × 0.38) × quality)`

**Variables:**

| Variable | Type | Range | Source | Description |
|----------|------|-------|--------|-------------|
| `atk` | int | ≥ 0 | LoadoutSnapshot | Effective attack |
| `quality` | float | 0–1 | speech-io contract (authored; `quality_success_threshold` 0.6) | Mic/spell-completion score |
| `dmg` | int | 0–205 at base stats | calculated | Damage to ghost |

**Output Range:** 0 (`quality = 0` — failed spell) to 205 (Wordsmith, quality 1; Grammarian 199, Arcane 202). No speedMult (quality replaces speed), no crit, no armor. `quality = 0 → 0` damage is a legitimate failure state — see Edge Cases for the ±350 round swing it implies.

**Example:** Arcane, quality 0.85: 202.36 × 0.85 = 172.01 → **172**.

### B6 — Shield gain (defense round)

The `shield_gained` formula is defined as:

`shield_gained = round_half_up(80 + def × 0.3)`

**Variables:**

| Variable | Type | Range | Source | Description |
|----------|------|-------|--------|-------------|
| `def` | int | ≥ 0 (class 30–55) | LoadoutSnapshot | Effective defense |
| `shield_gained` | int | 80 – unbounded via def | calculated | Added to the shield pool |

**Output Range:** min 80 (`def = 0`). Class values: Wordsmith **89**, Grammarian **97** (96.5 rounds half-up — a real .5 case), Arcane **91**. Not speed- or crit-scaled (Core Rule 11). Joins the pool additively with Grammarian's flat +60 (which never enters this expression — per the registry's factor-vs-equation split).

**Example:** Grammarian correct on R2: `round_half_up(80 + 55 × 0.3) = 97` shield.

### B7 — Counter-strike (defense round)

The `counter` formula is defined as:

`counter = round_half_up(30 + def × 0.4)`

**Variables:**

| Variable | Type | Range | Source | Description |
|----------|------|-------|--------|-------------|
| `def` | int | ≥ 0 | LoadoutSnapshot | Effective defense |
| `counter` | int | 30 – unbounded via def | calculated | Direct damage to ghost, **bypasses ghost armor** |

**Output Range:** min 30. Class values: Wordsmith **42**, Grammarian **52**, Arcane **45** (45.2 → 45). Not speed- or crit-scaled; not armored. Note the asymmetry with B9: ghost mitigation caps its `def` term at 150, this one is uncapped — see the equipment def-band handoff in Dependencies.

**Example:** Grammarian correct on R2: ghost takes `round_half_up(30 + 22) = 52`.

### B8 — Mana gain

The `mana_gained` formula is defined as:

`mana_gained = min(100 − mana, base_gain)`, where `base_gain = 30` (correct) | `10` (wrong or timeout) — flat for every class (Core Rule 13; the former Arcane multiplier slot was removed 2026-11-09, cross-review D-B1)

**Variables:**

| Variable | Type | Range | Source | Description |
|----------|------|-------|--------|-------------|
| `base_gain` | int | {10, 30} | constant | Flat for every class and round type |
| `mana` | int | 0–100 | battle state | Current mana before the gain |
| `mana_gained` | int | 0–100 | calculated | Applied gain after the cap |

**Output Range:** clamped [0, 100]. Integer-exact at MVP (no fractional gain). Cap truncation example: a correct answer at mana 95 applies `min(5, 30) = 5`; the excess is discarded.

**Example:** Non-Arcane correct round: `min(100 − mana, 30)`.

### B9 — Ghost damage mitigation

The `ghost_damage_to_player` formula is defined as:

`dmg_to_player = round_half_up(ghost_base × (1 − min(0.25, max(0, def_eff) / 600)))`, where `ghost_base = 100` (standard rounds) | `150` (ultimate_burst round)

**Variables:**

| Variable | Type | Range | Source | Description |
|----------|------|-------|--------|-------------|
| `ghost_base` | int | {100, 150} | constant (Core Rule 16) | Fixed, deterministic — no roll |
| `def_eff` | int | ≥ 0 after clamp | LoadoutSnapshot | Effective defense, clamped ≥ 0 (a negative stat must never amplify damage) |
| `dmg_to_player` | int | 75–100 (standard), 113–150 (ult) | calculated | Pre-shield damage |

**Output Range:** min 75 / 113 (def ≥ 150 saturates the 0.25 cap: 100 × 0.75 = 75; 150 × 0.75 = 112.5 → 113); max 100 / 150 (def 0). Never 0 — the ghost always chips. Class values: Wordsmith 95 / 143; Grammarian 91 / 136; Arcane 94 / **141** (140.5 → 141 — another real .5 case).

**Example:** Grammarian (def 55) on the ult round: 150 × (1 − min(0.25, 55/600)) = 150 × 0.9083 = 136.25 → **136**.

### B10 — Crit rule (guaranteed + probability stream)

The `crit_mult` rule is defined as:

`if elapsed_ms < fast_answer_threshold (3000, strict): crit_mult = 1.25` (no stream draw)
`else: crit_mult = (crit_stream.draw() < crit_stat/100) ? 1.25 : 1.0` (exactly one draw)

**Variables:**

| Variable | Type | Range | Source | Description |
|----------|------|-------|--------|-------------|
| `elapsed_ms` | int | 0 – round_time_ms | tick model | Same timestamp measurement as the Wordsmith trigger (Core Rule 7) |
| `fast_answer_threshold` | int | 3000 ms | registry (referenced, never redefined) | Strict `<` — exactly 3000 is NOT fast |
| `crit_stat` | int | 0–100+ (class 6–12) | LoadoutSnapshot | Effective crit |
| `p` | float | 0.06–0.12 at base | calculated = crit_stat/100 | Slow-answer crit probability |

**Output Range:** `crit_mult ∈ {1.0, 1.25}`. Scope: damage rounds only — vocab_strike, listening_pierce, fallback vocab; never grammar_shield, never ultimate_burst (Core Rule 9's scope list, verbatim). Stream discipline: the fast branch consumes **zero** draws; the slow branch draws **exactly once**; wrong answers and timeouts draw nothing. Which rounds were fast therefore shifts later rounds' stream positions — replayability still holds because battles replay from the recorded commits plus seed (Core Rule 18).

**Example:** Grammarian (crit 6) slow on R1: one draw, 6% chance of 1.25. Wordsmith fast on R1 (2.9 s): 1.25 with certainty, stream untouched.

### B11 — Battles per typical session (consumed constant)

The `battles_per_typical_session` constant is defined as: **4** — consumed by question-content F5's burnout guard:

`floor(N_pool / k) ≥ 2 × battles_per_typical_session`

**Variables:**

| Variable | Type | Range | Source | Description |
|----------|------|-------|--------|-------------|
| `B` | int | 4 (fixed) | battle-system owned (Core Rule 23) | Median complete battles per 10–20 min session |
| `N_pool` | int | 8–16 | question-content F1 gate | Questions in a round-type pool |
| `k` | int | 1 at MVP (Core Rule 22) | battle draw policy | Draws per battle from one pool |

**Output Range:** guard boolean. At defaults `floor(8/1) = 8 ≥ 2 × 4 = 8` — satisfied **exactly at the boundary**, zero slack; that is precisely why `min_battle_pool_size = 8` exists and why any pool dip below 8 breaks the gate loudly at authoring. Nothing to compute at runtime.

**Example:** N_pool 8, k 1 → 8 battles before a round-type repeats ≥ 2 × 4. If a future retune sets k = 2, the guard demands N_pool ≥ 16 (top of band) — the F5 signal to raise pool sizes.

### B12 — Win-fraction comparison

The `player_wins` rule is defined as:

`player_wins = (hp_hero_current / hp_hero_max) ≥ (hp_ghost_current / ghost_hp_baseline)` — evaluated only when both survive round 4

**Variables:**

| Variable | Type | Range | Source | Description |
|----------|------|-------|--------|-------------|
| `hp_hero_current` | int | (0, hp_hero_max] | battle state | 0 would already be defeat (Core Rule 19) |
| `hp_hero_max` | int | > 0 (class 360–420 at base) | LoadoutSnapshot | Effective max HP |
| `hp_ghost_current` | int | (0, ghost_hp_baseline] | battle state | 0 would already be victory |
| `ghost_hp_baseline` | int | 420–600 | registry `ghost_hp_*` | Encounter-type baseline — **the ghost's max HP** |
| `player_wins` | bool | {true, false} | calculated | The `≥` encodes tie-goes-to-player (Core Rule 19) |

**Output Range:** two booleans feeding Core Rule 19; fractions in (0, 1], so no degenerate inputs; ghost HP is damage-only so `ghost_frac ≤ 1` always. The fraction (not absolute HP) is what matters — a low-HP hero can lose to a nearly-dead ghost; that asymmetry is the design and is surfaced live by ui-shell as a win bar.

**Example:** Wordsmith ends R4 at 200/380 = 0.526 vs ghost 78/500 = 0.156 → **victory**. Inverted (hero 19/380 = 0.050 vs ghost 78/500 = 0.156) → defeat despite the ghost being nearly dead.

## Edge Cases

- **If hero and ghost damage would both KO in the same round**: effects resolve in fixed order — player effect first, ghost second. A KO'd fighter deals no damage (`if ghost HP ≤ 0, its reveal deals nothing`). If the player's strike drops the ghost, the battle ends in victory before the ghost's effect resolves; the ghost can therefore never "trade" a post-mortem hit.
- **If the hero and ghost finish round 4 with exactly equal HP fractions**: the player wins (comparison is `hero_hp_fraction ≥ ghost_hp_fraction`, prototype convention). There is no draw state.
- **If mana sits exactly at 90 when round 4 begins**: the ult fires — the gate is inclusive (`mana ≥ 90`). Under flat mana (Rule 13) every class accrues identically: 3 correct answers = exactly 90 for every class, so the gate is class-neutral and the 100 cap never truncates a gate-reaching sequence. Still exactly 3/3 correct required — any miss (2C+1W = 70) falls short.
- **If mana exceeds 100**: the cap holds at 100; excess gain is discarded silently (never banks into the next battle — mana evaporates at battle end regardless).
- **If elapsed time is exactly 3000 ms**: NOT fast — `elapsed_ms < 3000` is strict (shared `fast_answer_threshold` convention). No guaranteed crit; the stat-based crit roll can still fire.
- **If a correct answer takes exactly 6000 ms**: NOT slow — the slow-rune threshold is strict (`elapsed > 6000`). Exactly 6000 scores normally and drops no rune; 6001 drops one.
- **If a correct answer is also slow (> 6000 ms)**: it scores normally — full damage/shield/mana apply — AND the word drops as a cursed rune. Slowness never downgrades a correct answer's combat effect; it only adds the rune (Pillar 2: the mistake is still material even when the recall succeeded).
- **If equipment pushes the countdown below 5 s**: clamped to exactly 5 s (`base_round_time_s + effective_time ≥ 5`). Hero-class's base `time` of 0.0 plus negative-item stacking cannot produce an unanswerable round.
- **If `def_effective ≥ 600`**: ghost-damage mitigation is capped at 0.25 (the `min(0.25, def/600)` term saturates); defense can never zero ghost damage.
- **If `quality = 0` on the ultimate round** (speech-io passed the interaction but scored zero quality): damage is `round((175 + atk × 0.38) × 0) = 0` — the round still counts as correct, mana is still spent. Battle does not second-guess quality; the pass/fail threshold is speech-io's contract (provisional — its GDD owns it). **This is the largest single moment in the game by design**: a failed ult pairs the player's 0 damage with the ghost's fixed 150 — a ≈ 350-point round swing. If playtesting shows it too swingy, the lever is a quality floor (e.g. 0.15), never the ghost's 150.
- **If the hero's shield pool exceeds incoming ghost damage**: the full amount is absorbed, HP untouched, and the *remainder stays in the pool* (shields persist; no decay — Rule 11).
- **If the same word would drop as a cursed rune twice in one battle**: impossible by draw policy (no in-battle repeats, k=1 per pool), but the emission path deduplicates by `word_id` anyway — the guard is free and makes the contract robust to future draw-count changes.
- **If two battles receive the same uint64 seed**: ghost sequences AND question draws replay identically in both — by design (opponent-ai F2 rule 2), not a bug. Collision probability at 2⁶⁴ is negligible; unpredictability (Rule 18) prevents deliberate seeding by players.
- **If the session is abandoned mid-battle** (tab close, refresh): no `BattleResult` is emitted — no runes, no rewards, no RP change. MVP persists nothing mid-battle; there is nothing to resume. (Reconnect/resume is post-MVP; the battle record's seed makes replay-from-log possible then.)
- **If a LoadoutSnapshot carries a `passive_id` battle does not know**: the passive is ignored and a warning is logged — the battle stays playable (fail-soft for player-facing data), unlike ghost `class_ref` which fails fast (identity data, opponent-ai EC). Divergent failure modes are deliberate: a broken player item degrades quietly; a broken ghost identity breaks the fiction.
- **If `crit_stat = 0`**: the stat roll can never crit (probability 0), but the guaranteed sub-3-second crit still fires — the two crit paths are independent, and speed-crit is not stat-gated.
- **If a listening question arrives without `tts_text` and `ipa`**: impossible by question-content's build gate; if a content-version bug ever delivers one, battle fails fast — it never renders a silently unplayable round.
- **If the ghost's reveal delay would overlap the next round**: it cannot — the tick model schedules reveal → `RoundEnd` → next `Question` strictly in sequence; presentation may fast-forward (ui-shell) but state never advances past an unrevealed round.
- **If attack values grow beyond MVP ranges** (late-game equipment): damage has no cap by design — at plausible MVP maxima (atk ≈ 150 with gear) a max-crit Wordsmith vocab strike ≈ 206 (115 × 1.3 × 1.25 × 1.2 × 0.92 = 206.3) vs boss HP 600, so 4-round battles stay decided by rounds, not one-shots. A damage cap becomes a tuning knob only if equipment ranges change materially.

## Dependencies

**Upstream dependencies** (decisions this system must respect):

| System | Tier | Hard/Soft | Interface | Owner of semantics | Status |
|---|---|---|---|---|---|
| question-content | MVP | Hard | Battle pools (module × round-type, build-gated ≥ 8); question payloads; F5 no-immediate-repeat guard inputs | question-content owns schema/pools; battle owns draw policy (k=1) + `battles_per_typical_session = 4` | GDD Approved |
| hero-class | MVP | Hard | Stat blocks; passive constants ×1.2 vocab mult / +60 shield flat / ×1.20 listening damage mult; `fast_answer_threshold` 3000 ms (referenced); `grammarian_proc_count` predicate | hero-class owns data + magnitudes; battle owns equations | GDD Approved |
| opponent-ai | MVP | Hard | `resolve_round(profile, mode, seed, round_index)`; ghost HP baselines 500/500/420/600 and reveal delays 1000/800/1200/1500 ms (order: friend/ranked/tower_stage/tower_boss) | opponent-ai owns roll + profile; battle owns seed supply, HP/reveal application | GDD Approved |
| equipment | MVP | Hard | `LoadoutSnapshot` (plain data); passive effect vocabulary via hook points | equipment owns assembly + passives. `def` band closed: effective DEF ≤ 120 at MVP by construction (level cap 5 + catalog maxima), retiring the unbounded-def KO concern for B6/B7 | **GDD Approved 2026-11-09 — snapshot + band adopted (equipment Rules 5, 10; OQ-BS4 closed); Class-B hook additions owed per OQ-EQ1** |

**equipment's contract is closed** — its GDD (Approved 2026-11-09) adopted the
LoadoutSnapshot shape verbatim (its Core Rule 10) and closed the `def ≤ 120`
band item (its Core Rule 5). The fixture snapshot (three stat blocks, empty
items list) remains the unit-test fixture; the residual open item is the five
Class-B hook additions (equipment OQ-EQ1), which ride battle's next edit.

**Downstream dependents** (bidirectional note: each listed GDD names
battle-system in its own Dependencies section — verified during the
2026-11-09 cross-review; statuses mirror systems-index):

| System | Tier | Hard/Soft | Interface | Owner of semantics | Status |
|---|---|---|---|---|---|
| forge-srs | MVP | Hard | `BattleResult.cursed_runes` (word list, Rule 20); battle outcome | battle emits; forge owns queue + SRS scheduling + `BattleResult` consumption semantics | GDD Approved |
| speech-io | MVP | Hard | Listening-round TTS + fallback; ult-round mic/spell interaction returning `quality ∈ [0,1]` | speech-io owns rendering/scoring; battle consumes quality | GDD Approved |
| ui-shell | MVP | Soft | Battle events + HUD data (HP/shield/mana/combo/speedMult/reveal theater) | battle owns state; ui-shell owns rendering | GDD Approved |
| tower | MVP | Hard | Encounter config → battle; result → progression | tower owns selection; battle owns the fight | GDD authored — Needs Revision (revised 2026-11-09, pending re-review) |
| meta-progression | Vertical Slice | Soft | Reward events (gold/XP) | meta-progression owns ledger + final values | GDD Approved |
| ranked-league | Alpha | Soft | RP events (±28/−14) | ranked-league owns RP tier math | GDD Approved |
| real-pvp | Full Vision | Soft | The same round state machine, later against human inputs | battle owns rules; netcode owned there | GDD Designed (Full Vision) |

**Circular-dependency resolution** (systems-index): battle ↔ forge ↔ equipment
is broken by two data contracts, no runtime cycle — battle reads only the
`LoadoutSnapshot` (equipment publishes it on loadout change), forge consumes
only `BattleResult` events (emitted at battle end). Both contract sections are
authored here; forge-srs authors the consumption side of `BattleResult` in its
own GDD.

**No direct dependency** on accounts-backend (persistence of the rune queue
and progress is downstream systems' storage, not battle's), question-content's
build gates (they run at authoring, before battle ever loads a pool), or
localization.

## Visual/Audio Requirements

> **Source**: art-director consultation, 2026-11-09. Ownership split: battle-system
> owns state and emits typed events; ui-shell owns all rendering (Core Rule 4).

**Rendering contract.** Every duration below is a **presentation budget in
ms**, not battle time: the tick model never waits on an animation, and
ui-shell must be able to fast-forward or skip any effect without desyncing
from emitted state. No effect may gate battle-state advancement.

### Per-event visual feedback

**Intensity hierarchy (loudest first).** Within one resolve beat, exactly one
event may be *loud*; the rest render at ambient level:

1. **Ultimate burst damage** — the battle's peak, fires at most once, is
   earned (gate 90): brief arena dim + full-screen impact frame.
2. **Crit damage** — the Pillar 1 payoff on every fast answer; reads as
   "special hit" without competing with the ult.
3. **Listening-pierce damage** — visually distinct *shape*, not just size:
   the armor-pierce identity (Rule 17) needs a signature (e.g. a
   through-line/break effect) so players learn each round's combat identity.
4. **KO / victory / defeat** — state-change loudness, not impact loudness.
5. **Normal damage, counter** — floating number + shake.
6. **Shield gain/absorption, mana gain, combo** — ambient resource feedback;
   never shake the screen.
7. **Ghost reveal** — legible, deliberately *not* louder than the player's
   own effect (Pillar 4).

| Event | What must appear | Intensity | Budget |
|---|---|---|---|
| Correct answer | Option confirm flash + player-cast gesture toward ghost | Medium | 200–300 ms |
| Wrong / timeout | Wrong mark (icon + color); cursed-rune drop cue on the word — the word visibly leaves the fight | Medium (negative, not punishing) | 250–400 ms |
| Damage — normal | Floating number over ghost, hit shake (transform, ≤ 8 px) | Standard | number 700–900 ms; shake 150–250 ms |
| Damage — crit | Larger number, reserved crit styling, stronger shake | Loud | number 900–1200 ms; shake 250–350 ms |
| Damage — listening-pierce | Standard damage read + pierce signature | Loud | ≤ 1200 ms |
| Damage — ultimate | Screen dim 200 ms, full-width impact frame, number center-stage | Loudest | 1200–1600 ms total |
| Counter (grammar_shield) | Small number on ghost + shield visual on hero simultaneously | Standard, half-volume | 500–700 ms |
| Shield gain | Bar/ring fill + delta number; Grammarian proc reuses this — no separate visual | Ambient | 250–400 ms |
| Shield absorption | Chip/flash on shield pool + combined absorbed/HP number read | Ambient | 200–300 ms |
| Mana gain | Bar pulse + small delta | Ambient | 150–250 ms |
| **Ult-ready (mana crosses 90)** | One-time flare on the meter at crossing, then **persistent** idle pulse on the ult meter until round 4 | One-shot 400–600 ms; pulse ≤ 2 s loop | |
| Combo | Scale-pop per increment; quick fade on reset (no penalty flourish) | Ambient | 200–300 ms |
| Speed multiplier (live) | Readout beside countdown decays continuously 1.30×→1.00×; color shifts toward the fast tier. **Derived display: ui-shell reads tick state, never computes gameplay values** | Continuous | n/a |
| Ghost reveal | "Ghost answering" gesture during `answer_reveal_delay_ms_*` (fills 60–70% of the delay), then correct/wrong card flip 250–400 ms; interruptible by fast-forward | Legible-medium | per delay constant |
| KO | HP drain to zero (400–600 ms), fighter dims, transition to Result | Loud (state) | 600–900 ms |
| Victory / defeat | Result entry 400–600 ms; rewards + rune drops as staggered rows (100–150 ms each) | State-level | unbounded |

**Budget rule (deterministic tick model).** Per-round theater must fit inside
`answer_reveal_delay_ms (800–1500) + one 300 ms tail` on non-final rounds; if
it would overrun, ui-shell compresses durations, never skips events. The
ultimate round and KO may exceed this (they sit adjacent to `RoundEnd → Result`).

### Audio requirements

> Battle-system specifies only *which events need a cue*; palette and
> implementation belong to audio-director (prototype shipped no SFX —
> `INTENT UNKNOWN`). Mood: crisp, arcane-UI, percussive-impact-forward.

**Minimal MVP set (8 cues):** confirm-correct · confirm-wrong ·
hit-standard (pitch-shifted for crit/ult variants) · shield-ring (gain +
absorption reuse) · mana-tick · ult-ready · stinger-victory · stinger-defeat.
Crit, listening-pierce and counter reuse `hit-standard`. **Ghost reveal gets
no dedicated cue** — it must not out-shout the player's own beat.

**Post-MVP (out of MVP scope):** per-round-type sound sets, combo pitch
ladder, cursed-rune drop sound, ult speech-interaction audio (coordinate with
speech-io), ambient music, volume settings beyond mute, ghost personality audio.

> Audio verification note (qa-lead): the 8-cue set has no automatable AC —
> screenshots and unit tests cannot pin audio. Verify via a manual playtest
> checklist at the first build; the prototype shipped no SFX.

### Pipeline constraints (CSS + icon only)

- **Allowed vocabulary**: transform, opacity, color transitions, box-shadow/
  filter, CSS keyframes, `clip-path`; lucide icons as glyph ornaments. No
  particle systems, canvas/WebGL, or shaders — impact comes from composition
  (dim, radial pseudo-element bursts, shake, flash), within ~10 concurrently
  animating elements per resolve beat.
- **Floating damage numbers**: absolutely positioned, `will-change:
  transform/opacity`, self-removing, ~5 concurrent max.
- **Hit shake** targets a dedicated wrapper, never the question panel (the
  panel stays motion-stable during `Question` state); shake only
  ghost/arena layers, only during `Resolve`.
- **Fast-forward**: animations drivable via Web Animations API
  (`playbackRate`) or short enough to hard-skip.
- **Accessibility floor**: every motion-communicated state has a static
  equivalent; `prefers-reduced-motion` replaces shakes/flares with color
  emphasis — the damage *number* is never removed, only its motion.
- All effect colors come from the future art-bible token set — no ad-hoc hex.

### Art-bible principles (to carry into the art bible)

1. **Legibility beats spectacle** — the floating number *is* the effect.
2. **Color is semantics, intensity is emphasis** — one hue per meaning family; crit/ult differentiate by scale and framing, never new hues.
3. **The arena is UI, not a scene** — arcane identity from typography, glyphs and color, not painted backdrops.
4. **One loud beat per resolve** — motion never overlaps the next question's legibility.
5. **Failure is owned, never punished visually** — rune drops and ghost reveals stay calm (Pillars 2 and 4); a mistake is loot, not shame.

### Shell vs battle-emitted responsibility split

- **Battle-emitted (data)**: correct/wrong, damage `{amount, round_type, crit}`, counter, shield gain/absorption, mana delta, combo change, ult-ready crossing, reveal `{correct, answer_reveal_delay_ms}`, state transitions, KO/victory/defeat, speedMult at commit, cursed-rune drops, reward events.
- **Ui-shell (rendering, never mutating)**: floating numbers, shakes, flashes, bar animations, combo pops, ult-ready flare + pulse, reveal choreography, KO drain, result screen.
- **Boundary — live speed multiplier**: the *value* lives in battle state; ui-shell renders it from read-only tick state and may color-interpolate, but never computes gameplay values from it.

## Game Feel

Battle feel is Pillar 1's delivery vehicle — the prototype's key learning was
that "damage numbers, shields and crits make *recall speed* legible; the same
quiz with a progress bar would not." Feel targets:

- **Responsiveness**: the player's answer commit resolves instantly on their
  side (damage/shield/mana apply on the next tick, ≤ 1 tick); ghost theater is
  the only deliberate delay and it is data-owned (`answer_reveal_delay_ms_*`).
  Player input is never gated behind ghost presentation.
- **Weight**: every point of damage is a visible, numbered event — no silent
  HP changes. Crits and the ultimate are the two loudest events; a correct
  grammar shield is the quietest (defense is steady, not flashy).
- **Speed made legible**: the speed multiplier is visible *during* the
  countdown, decaying live from 1.30× toward 1.00× — the player watches the
  value of hesitation drain in real time. Post-commit, the round log states
  "Đúng trong {secs}s → gây {dmg} sát thương" so speed→damage causality is
  explicit.
- **Comeback pulse**: the ult-ready moment (mana crossing 90) is a distinct
  beat — the fourth round visibly changes character. The fallback round
  (mana < 90) must read as a normal round, not a failure screen; the mana bar
  simply stops short.
- **Determinism does not mean sterile**: the tick model produces the same
  *state* timeline every replay; presentation layering (ui-shell) supplies
  the juice on top. Feel budgets live in the Visual/Audio section.

Feel targets that need playtesting (not automatable): whether the 10 s base
timer creates pressure without panic at A2–C1 CEFR levels, and whether the
ghost's reveal delays read as "thinking" rather than lag.

## UI Requirements

Battle-system owns the *data* for these surfaces; ui-shell owns rendering
(the battle HUD/VFX are named in ui-shell's systems-index row). What battle
must expose per element:

| Surface | Data battle emits | Notes |
|---|---|---|
| Fighter cards (hero + ghost) | HP, max HP, shield pool, class identities (via GhostProfile `class_ref`) | Shield bar capped display 200 (prototype convention) |
| Mana bar | mana, cap 100, gate marker at 90 | The 90 gate must be visually marked so "why didn't my ult fire" is never a mystery |
| Speed multiplier | live `speedMult` during countdown (decays 1.30×→1.00×) | Per Pillar 1: hesitation must be visible |
| Combo badge | current + max combo, both fighters | Grammarian proc moment flags its +60 separately |
| Round log | per-round entries: time taken, effect, crit flag, rune-drop notice | The battle log is the round-by-round causal record |
| Reveal theater | ghost result + `answer_reveal_delay_ms_*` scheduling | Honest-ghost rules apply (Pillar 4): ghost-duel disclosure in ranked banners is ui-shell's, fed by opponent-ai's profile fields |
| Result modal | victory/defeat, rewards, cursed-rune list, max combo, seed | The cursed-rune list is the Pillar 2 payoff surface — must list the *words*, not just a count |

**📌 UX Flag — battle-system**: This system has UI requirements. In Phase 4
(Pre-Production), run `/ux-design` to create a UX spec for the battle HUD
(and the ult-gate mana marker, and the result modal) before writing epics.
Stories that reference UI should cite `design/ux/[screen].md`, not the GDD
directly. (Note in systems index at Phase 5.)

## Cross-References

| Referenced system | What is referenced | Where in this GDD |
|---|---|---|
| question-content | Round-type pools, `min_battle_pool_size` 8, F1–F5 build gates, F5 burnout guard, payload fields | Detailed Design (Rules 22–23), Dependencies, Formulas |
| hero-class | Stat blocks, `wordsmith_fast_answer_mult` 1.2, `grammarian_shield_flat` 60, `arcane_listening_damage_mult` 1.20, `fast_answer_threshold` 3000 ms, `grammarian_proc_count` F1, countdown clamp | Detailed Design (Rules 6, 9, 12–13), Formulas, Edge Cases |
| opponent-ai | `resolve_round` contract, F1 strict predicate, F2 stream contract, `ghost_hp_*`, `answer_reveal_delay_ms_*`, mana non-interaction note | Detailed Design (Rules 15–16, 18, 24), Formulas, Edge Cases |
| game-concept | Pillars 1–4, earned-mana decision, reward baselines, prototype analysis | Overview, Detailed Design (Rules 10, 20–21), Game Feel |
| accounts-backend | Battle outcome persistence is downstream systems' storage; retry contract wraps every commit | Dependencies (no direct dependency note) |
| forge-srs | `BattleResult.cursed_runes` emission | Detailed Design (Rule 20), Dependencies |
| speech-io | `quality ∈ [0,1]` ult input; TTS/fallback for listening | Detailed Design (Rules 9, 3rd interaction row) |

## Acceptance Criteria

> **Source**: qa-lead consultation, 2026-11-09 (BS1–BS38, coverage-verified against
> all 25 Core Rules, B1–B12 and every Edge Case; zero contradictions with
> opponent-ai's OA1–OA20 or hero-class's HC1–HC16). **Legend**: **[unit]** = vitest,
> deterministic, DI-injected clock/streams/collaborators, home
> `tests/unit/battle-system/`, BLOCKING; **[integration]** = automated cross-system
> test, BLOCKING; **[statistical]** = committed seed-list harness, pinned tolerances
> and α; **[screenshot]** = retained in `production/qa/evidence/`, BLOCKING at every
> `qa.level` (never waived). *(provisional)* = boundary with equipment/speech-io
> (undesigned, OQ-BS4/BS5) or the PRNG ADR (OQ-BS1) — written against the contract,
> re-verify when the owner lands. Fixture stat blocks: Wordsmith 380/80/30/12/0.0 ·
> Grammarian 420/62/55/6/+1.0 · Arcane 360/72/38/9/+0.5.

- **BS1 [unit] — Fixed 4-round structure and fallback round (Core Rule 1).** **GIVEN** a battle on a fixture snapshot with stubbed collaborators, **WHEN** mana is below 90 entering round 4, **THEN** exactly 4 rounds resolve in the order `vocab_strike, grammar_shield, listening_pierce, vocab_strike` (fallback); **and WHEN** mana is ≥ 90, **THEN** round 4 is `ultimate_burst`; **and WHEN** two battles run with different seeds and identical commits, **THEN** the round-type sequence is identical — the order is fixed data, never shuffled or drawn.
- **BS2 [unit] — Encounter config consumed, never chosen (Core Rule 2).** **GIVEN** each of the four encounter configs (`friend`, `ranked`, `tower_stage`, `tower_boss`), **WHEN** a battle starts from each, **THEN** question pools are served for the config's module × round-type mapping, the config's GhostProfile is resolved via `resolve_round`, and the applied ghost HP baseline (500/500/420/600) and reveal delay (1000/800/1200/1500 ms) are the encounter type's constants; **and THEN** the battle issues no module/stage/content-selection call — every selection input arrives fully formed in the config.
- **BS3 [unit, provisional] — One immutable LoadoutSnapshot (Core Rule 3).** **GIVEN** the three class fixture snapshots (registry base stats, empty `items`), **WHEN** a battle runs, **THEN** the snapshot source is read exactly once, at battle start (spy: one call, no read after `Intro`); **and WHEN** the battle completes, **THEN** the snapshot object is deeply identical to its pre-battle state (frozen-object assertion). *(provisional: LoadoutSnapshot shape is equipment's contract, OQ-BS4 — fixtures stand in until its GDD lands.)*
- **BS4 [unit] — Deterministic tick model; presentation cannot mutate (Core Rule 4).** **GIVEN** a battle advanced by an injected fixed-tick clock, **WHEN** it runs, **THEN** every timestamp any formula consumes (elapsed, remaining) comes from tick state — advancing injected wall-clock/stub timers changes nothing, and a static assertion confirms no `setTimeout`/`setInterval`/`Date.now` in the battle module; **and WHEN** presentation is fully fast-forwarded (all emitted-event animations skipped), **THEN** battle state, the per-round log and the `BattleResult` are identical to the un-fast-forwarded run.
- **BS5 [unit] — Round sequence, reveal scheduling, no skip past an unrevealed round (Core Rule 5 + Edge Case reveal-overlap).** **GIVEN** a round with a stubbed resolver returning `{correct, answer_reveal_delay_ms}`, **WHEN** it resolves, **THEN** events emit strictly in order: question start (timer start per BS7's rule) → commit|timeout → player effect → ghost reveal scheduled exactly the encounter's `answer_reveal_delay_ms_*` later → `RoundEnd` → next `Question` | `Result`; **and WHEN** the presentation layer requests fast-forward, **THEN** tick state still never advances past an unrevealed round.
- **BS6 [unit] — Countdown B1 with load-bearing floor (B1 + Core Rule 6).** **GIVEN** each class fixture and equipment-shifted `time` stats, **WHEN** `round_time_s` computes, **THEN** `round_time_s = max(5, 10 + hero_effective_time)`: Wordsmith 10.0, Arcane 10.5, Grammarian 11.0 on every round type; effective_time −6 → exactly 5.0; **and THEN** round_time > 0 for every input ≥ −10 (the guarantee that B2 never divides by zero).
- **BS7 [unit] — Per-round-type timestamp pair (Core Rule 7 — resolves hero-class OQ1 item 1).** **GIVEN** a stubbed tick clock, **WHEN** a reading round (`vocab_strike`, `grammar_shield`, fallback vocab) resolves, **THEN** elapsed = commit tick − ticks-at(question fully displayed AND options interactive); **and WHEN** `listening_pierce` resolves, **THEN** elapsed = commit − ticks-at(options-actionable), and an injected audio replay between timer start and commit shifts elapsed by nothing (no reset, no pause); **and WHEN** `ultimate_burst` resolves, **THEN** elapsed is measured only for the 11000 ms rune threshold and no speed input is computed.
- **BS8 [unit] — Speed multiplier B2, bounded and attack-only (B2 + Core Rule 8).** **GIVEN** controlled commit ticks on a Wordsmith `vocab_strike` (round_time 10 s), **WHEN** elapsed = 0 / 2.5 / 10 s / past expiry, **THEN** speedMult = 1.3 / 1.225 / 1.0 / 1.0 (remaining_fraction clamps at 0; range exactly [1.0, 1.3]); **and WHEN** the same commits occur on `grammar_shield` and `ultimate_burst`, **THEN** no speedMult enters shield (B6), counter (B7) or ult damage (B5).
- **BS9 [unit] — Vocab damage B3 (B3 + Core Rules 9, 17).** **GIVEN** controlled speedMult/crit/fast-mult inputs, **WHEN** `vocab_strike` damage computes, **THEN** `dmg = round_half_up((40 + atk × 0.5) × speedMult × crit_mult × fast_mult × 0.92)`, full float product rounded once: Wordsmith at 2.5 s fast → 135; slow, no crit → 74; atk 0, no mults → 37 (floor); perfect Wordsmith → 144; **and THEN** a non-Wordsmith at the same elapsed yields fast_mult 1.0 (the ×1.2 trigger itself is HC3/HC4's, asserted at their boundary). The fallback round is treated as `vocab_strike` for every factor including `fast_mult`.
- **BS10 [unit] — Listening damage B4, armor-piercing (B4 + Core Rule 17).** **GIVEN** the BS9 harness at identical inputs, **WHEN** `listening_pierce` damage computes, **THEN** the expression carries no ghost_armor factor: Wordsmith fast → 162, slow no crit → 106, perfect → 172; Arcane (atk 72, ×1.20 class multiplier) fast → 188, slow no crit → 123, perfect → 200; **and THEN** the vocab-vs-listening delta at identical Wordsmith inputs equals exactly the missing ×0.92 plus the 70-vs-40 base (pinning the pierce identity against accidental armor reuse).
- **BS11 [unit] — Ultimate damage B5 (B5 + Core Rule 9 + Edge Case quality 0).** **GIVEN** quality injected at 0 / 0.5 / 1.0, **WHEN** `ultimate_burst` resolves, **THEN** `dmg = round_half_up((175 + atk × 0.38) × quality)`: Wordsmith 0 / 103 / 205; no speedMult, no crit, no armor; **and WHEN** quality = 0, **THEN** the round still counts correct and the spent mana does not refund — battle never second-guesses quality. (Quality ∈ [0,1] is speech-io's authored contract — `quality_success_threshold` 0.6, no floor at MVP; the ≈ 0.15 floor lever remains the documented fallback. OQ-BS5 closed 2026-11-09 per speech-io OQ-SI2.)
- **BS12 [unit] — Crit rule B10 and stream discipline; exactly-3000 NOT fast (B10 + Core Rule 9).** **GIVEN** controlled elapsed and an injected crit stream, **WHEN** a correct attack-round answer resolves at 2999 ms, **THEN** crit_mult = 1.25 with zero stream draws; **and WHEN** elapsed is exactly 3000 ms (and 3001 ms), **THEN** the guaranteed branch does not fire, exactly one draw occurs, and the verdict follows that draw against `crit_stat/100`; **and WHEN** crit_stat = 0, **THEN** the slow branch never crits while the sub-3000 branch still yields 1.25 (paths independent, speed-crit not stat-gated); **and THEN** wrong answers, timeouts, `grammar_shield` and `ultimate_burst` consume zero draws. *(HC7 owns the shared-threshold contract for both consumers; this AC adds battle's draw accounting, which HC7 does not assert.)*
- **BS13 [unit] — Ultimate gating at exactly 90; fallback; mana reset (Core Rule 10).** **GIVEN** three correct rounds (mana exactly 90 entering round 4), **WHEN** round 4 resolves, **THEN** the ult fires — the gate is inclusive `mana ≥ 90`; **and GIVEN** 2 correct + 1 wrong (mana 70), **THEN** round 4 is the `vocab_strike` fallback and no ult occurs; **and WHEN** the ult fires, **THEN** mana resets to 0; when it does not, mana freezes through battle end and evaporates — the next battle starts at 0; the HUD cap value stays 100. The gate arithmetic is class-identical under flat mana (Core Rule 13) — every class needs exactly 3/3.
- **BS14 [unit] — Defense round shield and counter B6/B7 (B6, B7 + Core Rule 11).** **GIVEN** a correct `grammar_shield` per class fixture, **WHEN** it resolves, **THEN** `shield_gained = round_half_up(80 + def × 0.3)` (Wordsmith 89, Grammarian 97 — the real 96.5 half-up case, Arcane 91) joins the pool AND `counter = round_half_up(30 + def × 0.4)` (42/52/45) hits the ghost; **and THEN** both values are identical at elapsed 1 s and 9 s (not speed-scaled), the counter is not crit-scaled, and the ghost's HP delta equals the counter exactly — it bypasses ghost armor (no ×0.92).
- **BS15 [unit] — Shield pool behavior (Core Rule 11).** **GIVEN** pool P and mitigated ghost damage D, **WHEN** D applies, **THEN** the pool absorbs first: D ≤ P → HP untouched, remainder P − D stays in the pool; D > P → pool empties, HP takes exactly D − P; **and WHEN** a Grammarian runs an all-correct battle, **THEN** the pool holds 97 (R2 shield) + 60 (R3 proc) = 157 with no decay and no cap through round 4 — the GDD's stated worst case; **and THEN** no shield value carries into a subsequent battle.
- **BS16 [unit] — Grammarian proc runtime predicate, battle-side (Core Rule 12).** **GIVEN** a Grammarian battle, **WHEN** run state updates per commit, **THEN** `run_correct` increments per correct and resets to 0 on wrong AND timeout, and the +60 flat joins the shield pool immediately at the 3rd correct's resolve — before that round's ghost reveal damage is mitigated (order-of-application assertion); no proc on counts 1 or 2. *(Complements HC5/HC6, which own the F1 predicate, the flat value and the modulo form; this AC asserts only battle-side integration.)*
- **BS17 [unit] — Mana economy B8 (B8 + Core Rule 13).** **GIVEN** player commits, **WHEN** mana updates, **THEN** correct = +30 and wrong or timeout = +10 — flat for every class and every round type (no class multiplier exists); **and WHEN** mana is 60 on a correct answer, **THEN** `min(40, 30) = 30` applies (mana 90); at mana 95, +5 applies and the excess is discarded; **and THEN** mana never exceeds 100 and never carries into another battle.
- **BS18 [unit] — Wrong answer ≡ timeout (Core Rule 14).** **GIVEN** a wrong commit and, in a twin battle, a timeout at expiry, **WHEN** each resolves, **THEN** the state deltas are identical: combo → 0 with a reset event, +10 mana, the word emitted as a cursed rune, no damage or shield to the ghost; the diff of the two rounds' deltas is empty except commit timing — a timeout is an incorrect answer in every respect.
- **BS19 [unit] — Ghost resolution interface discipline (Core Rule 15).** **GIVEN** a battle with a spy-wrapped `resolve_round`, **WHEN** 4 rounds resolve, **THEN** battle calls it exactly once per round with `(profile, mode, seed, round_index)`, round_index advancing 1→4; **and THEN** battle's own streams (question, crit) consume zero ghost-stream positions — the spy stream sees exactly 4 draws while battle's internal streams are separately rooted — and battle never stores or re-derives ghost draws beyond the returned record. *(Caller-side twin of OA9/OA19.)*
- **BS20 [unit] — Ghost damage B9, fixed and floored (B9 + Core Rule 16).** **GIVEN** a ghost correct on standard and ult rounds, **WHEN** damage to the player computes, **THEN** `dmg = round_half_up(base × (1 − min(0.25, max(0, def_eff)/600)))`, base 100/150: Wordsmith 95/143, Grammarian 91/136 (136.25 → 136), Arcane 94/**141** (the real 140.5 case); def_eff ≥ 150 saturates → 75/113; negative def clamps to 0 → full 100/150, never amplified; no input yields 0; **and THEN** twin battles with different seeds and identical commits produce identical ghost damage — it is fixed data, never rolled.
- **BS21 [unit] — Seed generation and persistence (Core Rule 18).** **GIVEN** N battles started with an injectable entropy source, **WHEN** each generates its seed, **THEN** every seed is a uint64 in [0, 2⁶⁴) from the injected source, the production path is `crypto.getRandomValues` (static assertion; `Math.random` appears nowhere in the battle module — complementing OA12's stream-implementation assertion), and the seed is present in the battle record/`BattleResult`; **and THEN** two battles run under the same seed replay identically by design (BS36), and seed collision is handled as a normal battle, not an error.
- **BS22 [unit, provisional] — Child-stream derivation contract (Core Rule 18 + opponent-ai F2 rule 3).** **GIVEN** the battle's question stream and crit stream, **WHEN** they are created, **THEN** each derives its child seed deterministically from `(seed, domain_tag)` with distinct tags — same battle seed → identical question and crit sequences; differing pool content does not shift the ghost sequence (streams never interleave); no stream re-seeds mid-battle. **Assertion is against the derivation contract only** — the algorithm and its pinned seed→draw vectors land with the PRNG ADR (OA12/OA18/OA20, OQ-BS1); no algorithm is named or asserted here.
- **BS23 [statistical, provisional — blocked on OQ-BS1] — Slow-branch crit frequency surface (B10 statistical half).** **GIVEN** the committed seed-list harness (N ≥ 1000 battles, fixture seed list, slow commits scripted on every attack round, α = 0.01), **WHEN** battles run on the real ADR-selected stream, **THEN** observed slow-answer crit frequency sits within the pinned band of `crit_stat/100` per class (0.12 / 0.06 / 0.09) and the replay log confirms B10's draw accounting (zero draws on fast rounds). Blocked with OA12/OA18 — an injected fake stream would make it vacuous.
- **BS24 [unit] — KO, early KO, no post-mortem trade (Core Rule 19).** **GIVEN** commits instrumented so the player's strike drops the ghost to 0, **WHEN** the round resolves, **THEN** victory emits before the ghost's reveal effect applies and the ghost deals nothing post-mortem (HP ≤ 0 short-circuits its damage — no trade hit); **and WHEN** hero HP would reach 0, **THEN** defeat emits immediately with no further rounds; battle length is 4 rounds or first KO, whichever comes first.
- **BS25 [unit] — Win-fraction comparison B12 (B12 + Core Rule 19).** **GIVEN** both fighters alive after round 4, **WHEN** the result computes, **THEN** victory iff `hero_hp_fraction ≥ ghost_hp_fraction` — inclusive: an engineered exact tie (both 0.5) → player wins; and hero 19/380 vs ghost 78/500 → defeat despite the near-dead ghost; **and THEN** a subsequent battle starts with full HP, 0 mana, empty pool — nothing carries between battles.
- **BS26 [integration] — Boss identity: survive-and-outlast, never KO at base stats (Core Rule 19 + OQ-BS2 evidence).** **GIVEN** a `tower_boss` encounter at base Wordsmith stats with the committed commit-script fixtures (fast/slow × crit/no-crit × quality 0…1, injected streams), **WHEN** every script runs the full battle, **THEN** the maximum achievable ghost damage is 563 (144 + 42 + 172 + 205) < ghost_hp_boss 600 — every outcome is a B12 fraction win and no script reaches ghost HP ≤ 0; the three-round burst ceiling is 358. (Regression-pin of the boss's designed identity; re-derive the expected numbers if OQ-BS2 retunes HP to ≈ 550.)
- **BS27 [unit] — Cursed-rune thresholds; exactly-6000 NOT slow (Core Rule 20).** **GIVEN** correct commits at controlled elapsed, **WHEN** elapsed = 5999 or exactly 6000 ms on a standard round (including the fallback), **THEN** no rune drops; at 6001 ms, **THEN** the word drops as a cursed rune; **and WHEN** the round is `ultimate_burst`, **THEN** the same strict boundary sits at 11000/11001 ms; **and THEN** wrong answers and timeouts drop their rune regardless of elapsed, and the emitted list deduplicates by `word_id` (a repeated id yields one entry).
- **BS28 [unit] — Correct-but-slow scores fully AND drops the rune (Core Rule 20).** **GIVEN** a correct `vocab_strike` at 6500 ms, **WHEN** it resolves, **THEN** full damage/shield/mana apply exactly as any correct answer (speedMult per B2 from the elapsed — slowness costs speed, never correctness) AND the rune drops; no combo reset, no +10 mana — slowness never downgrades a correct answer's combat effect.
- **BS29 [unit, provisional] — Reward event emission only (Core Rule 21).** **GIVEN** a ranked victory, a tower-boss-stage victory, and a defeat, **WHEN** `BattleResult` emits, **THEN** the events carry victory gold 120 (boss stage 250), XP 180, and RP +28 on the ranked encounter only (RP 0 on the tower-stage victory); defeat gold 40, XP 60, RP −14 on ranked; **and THEN** battle holds no ledger state — no downstream gold/XP/RP arithmetic exists in the battle module (static assertion). *(provisional: values are OQ-BS3, meta-progression's to retune.)*
- **BS30 [unit] — Draw policy k = 1, no in-battle repeat (Core Rule 22).** **GIVEN** fixture battle-mode pools (module × round-type, ≥ 8 each) and the battle's seeded question stream, **WHEN** each round draws, **THEN** exactly 1 question (k = 1) is drawn from that round-type's pool, no question repeats within the battle, and the R4 fallback draws a vocab question **different** from R1's from the same pool under the same policy; **and GIVEN** tower fixtures (module × stage mixed pools, stage ≥ 6 / boss ≥ 4, composition gate ≥ 1 per round-type), **WHEN** a tower encounter runs, **THEN** each round still draws k = 1 from the stage's single mixed pool under the same seeded policy; **and THEN** the draw sequence is a pure function of (seed, pools) — same seed, same sequence.
- **BS31 [unit] — Session constant B11 and burnout guard (B11 + Core Rule 23).** **GIVEN** the battle data/config, **WHEN** read, **THEN** `battles_per_typical_session = 4` and, for every shipped **battle-mode** pool (module × round-type), `floor(N_pool / 1) ≥ 2 × 4` — satisfied exactly at the boundary at N_pool = 8; a pool of 7 fails the guard loudly at authoring with an error naming the pool; **and THEN** tower stage/boss mixed pools are asserted against their own gates instead (question-content F2/F3: stage ≥ 6, boss ≥ 4, composition ≥ 1 per round-type) — the two-session burnout premise does not apply to a fixed ladder stage. (Authoring-time assertion — nothing computes at runtime; the "median" is an authored constant, never a runtime statistic; re-estimation is OQ-BS6.)
- **BS32 [unit] — Ult/mana non-interaction, negative (Core Rule 24).** **GIVEN** twin battles identical in every player commit but with stubbed resolvers returning different ghost W/C sequences, **WHEN** both run, **THEN** the mana ledger is identical: per-round gains, the ult-ready crossing event, and round 4's type — the ghost's roll participates in no mana arithmetic (caller-side twin of OA9's mana clause).
- **BS33 [unit, provisional] — Equipment hook points and fail-soft unknown passive (Core Rule 25).** **GIVEN** fixture snapshots exercising each named hook (`pre_damage_mult` per attack round, `pre_shield_mult` per grammar round, `flat_counter_bonus`, `combo_keep_on_miss` once per battle), **WHEN** the battle resolves, **THEN** each hook applies at its named point and nowhere else, and `combo_keep_on_miss` preserves the combo on the first miss only; **and GIVEN** a snapshot carrying a `passive_id` battle does not know, **WHEN** the battle runs, **THEN** the passive is ignored, a warning naming the id is logged, and the battle completes playable (fail-soft, deliberately unlike ghost `class_ref`'s fail-fast — OA15). *(provisional: battle's four hooks are adopted and firm (equipment Rule 8); the five Class-B hook additions and their state handoff are equipment OQ-EQ1, riding battle's next edit — fixtures only until then.)*
- **BS34 [unit] — Unplayable listening payload fails fast (Edge Case, question-content contract).** **GIVEN** a `listening_pierce` payload missing both `tts_text` and `ipa` (constructible only by breaking the build gate), **WHEN** the battle attempts to start the round, **THEN** it fails fast with an error naming the question id — it never renders a silently unplayable round.
- **BS35 [unit] — Abandoned battle emits nothing (Edge Case + States).** **GIVEN** a session disposed mid-battle after k < 4 rounds (tab close/refresh simulated), **WHEN** disposal runs, **THEN** no `BattleResult` is emitted — no runes, no rewards, no RP event — and no resumable state persists (a fresh session starts at round 1, mana 0).
- **BS36 [integration, provisional — blocked on OQ-BS1] — Same-seed replay reproduces the identical battle log.** **GIVEN** a recorded battle (seed, commit script, per-round log) from a committed fixture set of N ≥ 100 battles, **WHEN** the same seed + same commit script replays on the real ADR-selected streams, **THEN** the entire per-round log is bit-identical: round types, question ids drawn, speedMult values, crit verdicts and stream draw positions, damage/shield/mana integers, ghost W/C sequences and reveal delays, rune drops, and the outcome. *(Division of labor: OA11 pins the ghost W/C sequence, OA20 pins end-to-end ghost+outcome; BS36 pins battle's own log — the part only this GDD owns. Contract-level determinism with injected streams is already covered by BS4/BS19.)*
- **BS37 [screenshot] — Ult-ready beat and mana gate marker (Core Rule 10 + UI Requirements + Game Feel).** **GIVEN** a battle where mana crosses 90, **WHEN** the crossing resolves and round 4 begins, **THEN** the HUD shows the 90 gate marker on the mana bar, the one-time crossing flare and the persistent ult-meter pulse; **and GIVEN** mana 70 entering round 4, **THEN** the fallback round reads as a normal round (no failure styling) with the mana bar stopped short of the gate. Retained screenshots in `production/qa/evidence/`. (Rendering is ui-shell's; the evidence pins that battle's emitted data produces the specified readout.)
- **BS38 [screenshot] — Rune drop and listening-pierce identity are legible (Core Rules 17, 20 + Visual/Audio).** **GIVEN** a wrong answer and a fast `listening_pierce` correct in scripted battles, **WHEN** each resolves, **THEN** the word visibly leaves the fight with the rune-drop cue in calm, non-punishing styling, and the listening-pierce damage carries its distinct pierce signature, visually separate from standard damage styling. Retained screenshots in `production/qa/evidence/`. (Class-passive feedback moments — Grammarian proc line, Wordsmith fast-strike, Arcane pierce emphasis — remain HC16's; no overlap.)

**Totals: 38 criteria — 33 unit (5 provisional: BS22, BS29, BS33; BS23, BS36 blocked on OQ-BS1), 2 integration (BS26; BS36), 1 statistical (BS23), 2 screenshot.**
**Coverage: all 25 Core Rules ≥ 1 AC; all 12 formulas B1–B12 ≥ 1 AC; every Edge Case mapped (qa-lead matrix, 2026-11-09).**
**Resolved for siblings (per qa-lead):** hero-class OQ1 (timestamp pair + crit scope) and OQ2 (shield cap/decay) and OQ3 (mana rounding) can close — HC7/HC8 extend beyond vocab_strike to listening_pierce and the fallback vocab round, never ultimate_burst; opponent-ai OA-OQ1 is answered (Core Rule 18) and OA20 is authorable now, while OA12/OA18 stay blocked solely on the PRNG ADR (OQ-BS1), which likewise gates BS22/BS23/BS36.

## Open Questions

| ID | Question | Owner | Target |
|---|---|---|---|
| OQ-BS1 | PRNG ADR (carried as OA-OQ2): algorithm + parameterization for the seed→stream contract; pins the child-stream derivation `(seed, domain_tag)` (Core Rule 18) and opponent-ai's replay fixtures | technical-director | before battle implementation (blocks OA12/OA18/OA20) |
| OQ-BS2 | Boss KO identity: `ghost_hp_boss = 600` makes every boss win an outlast/fraction win at base stats (max burst ≈ 563). Retune to ≈ 550 (inside the ±30% band) so near-perfect play can KO? Evidence: systems-designer arithmetic, 2026-11-09 | project owner (balance pass) | first balance pass / playtest |
| OQ-BS3 | Reward values (gold 120/250, XP 180/60, RP ±28/−14) are prototype baselines flagged provisional (Core Rule 21). meta-progression's GDD owns the final curve | meta-progression author | meta-progression GDD |
| OQ-BS4 | **RESOLVED 2026-11-09** — equipment's GDD adopted the `LoadoutSnapshot` verbatim (its Core Rule 10) and the `def ≤ 120` band by construction (its Core Rule 5). Residual: the five Class-B hook additions + battle-side state handoff are equipment OQ-EQ1, riding battle's next edit | closed; residual: battle-system author | equipment GDD (Approved); battle-system next edit |
| OQ-BS5 | **RESOLVED 2026-11-09** — speech-io's GDD owns the contract: `quality_success_threshold` 0.6 gates the pass/fail; no quality floor at MVP (the ≈ 0.15 floor lever stays the documented fallback if playtest shows the ±350 swing too swingy). BS11's provisional tag dropped per speech-io OQ-SI2 | closed (speech-io owner) | speech-io GDD (Approved) |
| OQ-BS6 | `battles_per_typical_session = 4` is an estimate, not retention data: re-estimate from first playtest telemetry; if sessions run longer, raise `N_battle` inside question-content's 8–16 band (F5 signal) | battle-system owner / playtest | post-first-playtest |
| OQ-BS7 | PRNG ADR dependency chain for stats: F3's statistical ACs (ghost frequency ±0.03 over 1000 battles) and this GDD's stream ACs all block on OQ-BS1 | qa-lead | with OQ-BS1 |
| OQ-BS8 | resume half only: forfeit is decided (ADR-0003 §4 — server-side grace expiry, no battle state; Edge Cases cross-ref added 2026-11-10). Mid-battle reconnect + replay-from-log remains post-MVP scope — decide when ranked play starts | project owner | pre-Alpha |
