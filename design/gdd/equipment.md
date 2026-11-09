# Equipment

> **Status**: In Design
> **Author**: user + game-designer/systems-designer/economy-designer/qa-lead agents
> **Last Updated**: 2026-11-09
> **Last Verified**: 2026-11-09
> **Implements Pillar**: Pillar 3 — Knowledge Is Gear (primary); Pillar 2 — Mistakes Are Materials (stone supply)

## Summary

Equipment is the Progression system that owns the player's gear: a fixed 12-item catalog across four always-filled slots (weapon/armor/accessory/pet), the assembly of class base stats plus item bonuses into the five-stat effective block battle reads, and a passive vocabulary where every item scaffolds a real language skill — etymology hints, grammar round time, a 50/50 option lifeline, tap-to-hear pronunciations, a first-letter spelling assist (Pillar 3: "Knowledge Is Gear" as machinery). It is also the endpoint of the forge loop: Upgrade Stones purified from the player's own mistakes apply here as gear `+levels` (0–5, one stone per level, no gold), raising stats through a curve that takes ~2–4 months of daily play to max (best case ~2 months at a sustained 1/day cadence). It publishes the immutable `LoadoutSnapshot` battle consumes and defers to approved contracts everywhere else — hero-class's "no mana" rule, battle's hook points, forge's stone grant-and-stop.

> **Quick reference** — Layer: `Core` · Priority: `MVP` · Key deps: `hero-class (stat targets), forge-srs (Upgrade Stone supply), accounts-backend (storage + atomic commits); downstream: battle-system (LoadoutSnapshot + hooks), question-content, speech-io, ui-shell`

## Overview

Equipment is the Progression system that turns the player's permanent class into a tunable loadout: it owns the gear catalog, the four equipment slots, the assembly of base class stats plus item bonuses into the five-stat effective block battle reads, the passive vocabulary that makes every item teach or scaffold a real language skill (Pillar 3 — "Knowledge Is Gear"; a proposed sword with "+10 ATK, no passive" fails the pillar's design test), and the application of Upgrade Stones as gear `+levels` — the endpoint of the forge loop (Pillar 2: three purified cursed runes become one stone, and the stone becomes power here). For the player it is the inventory/gear screen and the visible payoff of studying: equipping the Phrasal-Verb Sword makes phrasal-verb questions hit harder, the Etymology Charm reveals word roots during vocabulary rounds, and each stone spent visibly raises a stat. For the systems it is a contract hub: it publishes the immutable `LoadoutSnapshot` battle consumes once per battle (contract authored by battle-system, owned here), it consumes Upgrade Stones from forge-srs (which grants the stone and stops there), and it reads hero-class's base stat blocks as its targets. Without it, the class choice would be a fixed stat line, the forge's stones would have nowhere to go, and Pillar 3 would be a slogan with no machinery.

## Player Fantasy

**Knowledge made physical, mastery made visible.** The shelf is the player's study history rendered as gear: the sword that bites harder when a phrasal verb appears, the charm that whispers a word's Latin root, the owl that clears two wrong answers when the player is one hit from losing. The class picked at onboarding is the combat identity; equipment is the trainable body layered onto it — every item is a language promise written in Vietnamese ("gặp câu hỏi Cụm động từ…"), and spending a stone is the moment a promise visibly levels toward kept. Because every stone was purified from the player's own mistakes, the `+level` pop carries a double meaning the fantasy depends on: *I grew from what I got wrong* (Pillar 2's payoff executed as Pillar 3's machinery). The screen must feel like the forge's quieter sibling — a second exhale, no timers, no pressure — and never like a spreadsheet: rarity is identity, level pips are mastery of the promise, and the stat delta shown before confirm is the felt purchase.

## Detailed Design

### Core Rules

1. **Ownership split** — equipment owns the gear catalog, the slot model, effective-stat assembly, the passive effect vocabulary, and Upgrade Stone application. forge-srs owns stone *supply* (it grants the stone and stops — FS16); battle-system *consumes* the published `LoadoutSnapshot` (contract authored in the battle GDD, owned here — OQ-BS4 resolves here); accounts-backend *stores* the resulting state. Nothing outside this GDD computes an effective stat or applies a stone.

2. **Fixed MVP catalog — 12 items, all owned from account creation.** Every item is a data record: `id`, Vietnamese display name, `slot`, `rarity`, `level` (0–5), `stats` (base, at level 0), `perLevel` (per-`+level` gains), `passive_id` (one per item, from the vocabulary in Rule 8). All values live in a data file — nothing hardcoded (coding standard). The catalog is adopted from the validated prototype as authored baseline (same convention hero-class used for class blocks), with **all items entering at level 0** (the prototype's nonzero demo levels are discarded — see Formulas' progression math); a later balance pass may retune via the tuning process, not silently. There are **no item drops, no shop, and no item acquisition at MVP** — the catalog is complete at account creation; post-MVP acquisition is an Alpha question (OQ-EQ3).

3. **Four slots, one item each, never empty.** `weapon | armor | accessory | pet` — each slot always holds exactly one catalog item; "unequip" does not exist, only swap. Rationale: an empty slot is a state with no player value and a whole family of snapshot edge cases; the default loadout fills all four at account creation. Rarity (`common | rare | epic | legendary`) is display identity and future acquisition weighting — it has **no mechanical effect** at MVP.

4. **Effective-stat assembly** (formula F1): `effective_stat = base_stat(class) + Σ over the 4 equipped items of (stats[stat] + perLevel[stat] × level)`, for each of the five stats `hp, atk, def, crit, time`. Equipment modifies **only the five stats** — no item may alter passive magnitudes (hero-class constraint verbatim) and **no item may grant mana** (hero-class: "Mana is not a hero stat… Equipment… cannot grant mana"). `time` is summed in seconds and rounded **round-half-up to 2 decimals** (global rounding rule); the other four stats are integers (inputs are integers, so no rounding arises). Assembly runs entirely client-side for display and snapshot publication; the server re-derives and validates on commit (accounts-backend is authoritative).

5. **The `def` band — effective DEF ≤ 120 at MVP, enforced by construction.** Battle's B6/B7 are uncapped in `def` while B9's mitigation saturates at 150, so unbounded def turns counters into KOs — battle's owed handoff (recommend ≤ 120) is adopted here and closed as OQ-BS4's band item. Enforcement is structural, not a clamp: **level cap 5** (Rule 6) plus the catalog's def values make the worst case exactly 120 — Grammarian (55) + staff-perfect at +5 (8 + 2×5 = 18) + plate-conditional at +5 (22 + 3×5 = 37) + pet-owl at +5 (5 + 1×5 = 10) = **120**. Assembly additionally **asserts** `def ≤ 120` and fails fast on violation (a data bug, not a player state — see Edge Cases).

6. **Level cap 5 per item.** Levels run 0–5; one Upgrade Stone raises one item by exactly one level (Rule 7). Six levels per item bounds every stat curve and keeps the def-band arithmetic closed. Raising the cap post-MVP requires re-deriving the def band first (Edge Case).

7. **Upgrade Stone application — player-initiated, atomic, gold-free at MVP.** From the inventory screen the player picks any item below the cap and applies a stone: `level + 1`, `stones − 1`, one atomic commit through accounts-backend (the same whole-commit shape as forge's AC-C1; server re-validates stone count — AC-C2 analog). Stat recomputation and `LoadoutSnapshot` republication happen after the commit succeeds. Stone application **costs no gold at MVP** (meta-progression: "equipment consumes Upgrade Stones, never gold") — this is **MVP-final, not a permanent closure**: an Alpha gold component (hybrid cost, attunement fee) stays available to OQ-MP1's answer, and equipment must not silently foreclose it. Stones the player cannot yet spend (all candidate items maxed) simply accumulate.

8. **Passive effect vocabulary — one `passive_id` per item, 12 in 3 groups.** Group A: **5 hook effects** binding to **battle's four hook points, adopted verbatim** (battle Core Rule 25: `pre_damage_mult`, `pre_shield_mult`, `flat_counter_bonus`, `combo_keep_on_miss`). Group B: **6 affordance effects this GDD authors** (they surface in question rendering and the ult spell interaction; battle/ui/speech-io consume them — five need new battle-side hook/effect points, the dagger's miss-reveal rides the existing wrong-answer event). Group C: **1 stat-carried entry** (cloak — a stat, not a hook; listed here because it occupies the passive text slot). Battle applies only effects documented here; a `passive_id` battle does not know is ignored with a warning (battle's fail-soft rule — a broken player item degrades quietly).

   | `passive_id` | Item (slot, rarity) | Class | Condition | Effect |
   |---|---|---|---|---|
   | `pre_damage_mult_phrasal` | Kiếm Phrasal Verb (weapon, epic) | A | `vocab_strike` round whose word is tagged phrasal-verb (`part_of_speech`) | damage ×1.25 |
   | `flat_counter_bonus_perfect` | Trượng Thì Hoàn Thành (weapon, rare) | A | `grammar_shield` round answered correctly | counter damage +30 |
   | `pre_damage_mult_collocation` | Cung Collocation (weapon, legendary) | A | `listening_pierce` round | damage ×1.20 |
   | `vocab_example_on_miss` | Dao Găm Thành Ngữ (weapon, common) | B | `vocab_strike` round answered wrong | resolution surface shows the word's `example_sentence` — failure becomes input (Pillar 2 language) |
   | `combo_keep_on_miss_once` | Khiên Bất Khuất (armor, epic) | A | first wrong answer of the battle | combo preserved (once per battle) |
   | `flat_time_bonus` | Áo Choàng Mạo Từ (armor, common) | stat-carried | none | +0.5 s thinking time every round — carried as `stats.time = 0.5` (assembly, not a hook; the passive text describes the stat) |
   | `pre_shield_mult_conditional` | Giáp Câu Điều Kiện (armor, rare) | A | `grammar_shield` round | shield ×1.25 |
   | `round_time_bonus_grammar` | Đồng Hồ Cát Học Giả (accessory, legendary) | B | `grammar_shield` round | +1.5 s answer time for that round (new hook `round_time_bonus` — battle computes `round_time_s` and takes the conditional bonus) |
   | `vocab_etymology_hint` | Bùa Từ Gốc Latin (accessory, epic) | B | `vocab_strike` round | hint surface shows the word's `etymology` (prefix/suffix roots) from question display |
   | `option_audio_replay` | Nhẫn Phát Âm IPA (accessory, rare) | B | `vocab_strike` round | answer options gain tap-to-hear pronunciation (speech-io's existing "tap to hear" capability, extended to options) |
   | `answer_eliminate_two` | Cú Tinh Anh (pet, legendary) | B | options round **with ≥ 3 distractors** (vocab/listening by schema) AND hero HP ≤ 30% of max (inclusive) | 2 wrong options removed — the "50/50" lifeline; grammar rounds are **excluded** (their minimum 3 options would make 2 removals auto-solve the round) |
   | `spell_first_letter_assist` | Mèo Chính Tả (pet, rare) | B | `ultimate_burst` spell path | the word's first letter is pre-filled in the spelling tiles (question-content guarantees `first_letter_assist_eligible` + `tile_letters`) |

   **Two prototype passives are re-authored here, both against approved rules**: ring-ipa's "+20 starting mana" violated hero-class's "items cannot grant mana" — it becomes `option_audio_replay` (its IPA-pronunciation identity kept); dagger-idiom's "no passive" failed Pillar 3's design test ("+10 ATK, no passive fails") — it becomes `vocab_example_on_miss` (idioms are learned in context; keyed on the guaranteed `example_sentence` field, not on an idiom tag the content schema does not have). cloak-article's "+0.5 s" moves from a special-case branch into `stats.time` — one representation, not two.

9. **No same-hook stacking on one round.** At most one equipped item may apply to a given hook on a given round. The MVP catalog satisfies this by condition design (the two `pre_damage_mult` items key on disjoint round types; the two Class-B vocab effects target different surfaces). Assembly **asserts** the property so a future catalog edit cannot silently break it — a violating loadout is a data error, not a player state.

10. **`LoadoutSnapshot` publication.** The snapshot is published on every loadout or level change (equip swap, stone application commit): `{ class_id, effective_stats {hp, atk, def, crit, time}, items [{item_id, slot, passive_id}] }` — **adopted verbatim from battle Core Rule 3** (shape confirmed; OQ-BS4's shape item closes here). All five stats are already effective — assembly is equipment's job, battle never re-derives. Battle reads it exactly once at battle start; a change published mid-battle affects the *next* battle, never the running one. The passive extension (five Class-B hooks beyond battle's four) is **surfaced, not silent**: battle's Rule 25 vocabulary grows from 4 to 9 hooks and battle must implement the Class-B state handoff in its next edit — this GDD's OQ-EQ1, riding the same battle edit as OQ-SI1/OQ-BS4.

11. **Persistence.** Equipment state is `{ item_levels: {item_id → 0–5}, stones: int, equipped: {slot → item_id} }`, stored server-side by accounts-backend (no local game-state cache — accounts AC-C6). Commit points: stone application (Rule 7) and equip swap. Offline changes are blocked (accounts' offline rule); the client renders read-only from last-known state when disconnected.

12. **What the player cannot do** (constraints are as important as capabilities): no buying, selling, crafting-from-scratch, or item deletion; no slot emptying; no applying a stone to a maxed item (the UI renders the action disabled, not hidden — forge's Start-button convention); no item that alters class passive magnitudes or grants mana; no loadout that stacks one hook twice on one round.

### States and Transitions

Item lifecycle (per item, persisted):

| State | Meaning | Exits |
|---|---|---|
| `Level 0–4` | Owns stats `stats + perLevel × level`; stone appliable | → `Level n+1` on stone application commit |
| `Maxed (Level 5)` | Final stat contribution; stone application **disabled** (rendered disabled, never hidden) | none — terminal at MVP |

Stone-application transaction (per application attempt):

| State | Meaning | Transitions |
|---|---|---|
| `Idle` | No application in flight | → `Committing` on apply action (preconditions: `stones ≥ 1` ∧ target `level < 5`; UI gates before this) |
| `Committing` | Atomic commit in flight to accounts-backend | → `Committed` on server acceptance; → `Retrying` on commit failure |
| `Retrying` | Commit failed; accounts' retained-commit/retry ladder governs | → `Committing` on retry (once, per accounts' ladder); → `Idle` with **no state change** if abandoned — a failed commit never half-applies |
| `Committed` | Server state advanced: level +1, stones −1 | → client recomputes stats (F1), republishes snapshot, → `Idle` |

Equip swap is a single atomic state write (one slot, one item id) followed by snapshot republication — no transaction machine of its own.

### Interactions with Other Systems

| System | Direction | Interface | Ownership |
|---|---|---|---|
| hero-class | Upstream (Hard) | Base stat blocks (380/80/30/12/0.0 · 420/62/55/6/1.0 · 360/72/38/9/0.5) are equipment's stat targets; the five-stat vocabulary and "stats only, no mana" constraint are hero-class's | base values theirs; assembly ours |
| forge-srs | Upstream (Hard) | Upgrade Stone supply: forge grants one stone per purification sitting and stops (FS16) — stone enters gear inventory with no slot target, no `+level` value, no stat recomputation; **application, stat effects and the `+level` curve are this GDD's — FS16 confirmed here, the provisional contract closes** | stone semantics theirs; application ours |
| accounts-backend | Upstream (Hard) | Server-side storage of `{item_levels, stones, equipped}`; atomic whole-commit for stone application (AC-C1 shape, AC-C2 validation); offline changes blocked; commit failures route through the `retry_delay` ladder | storage theirs; state semantics ours |
| battle-system | Downstream (Hard) | Consumes the immutable `LoadoutSnapshot` (Core Rule 3 shape, confirmed verbatim) + applies passives through the hook vocabulary (Rule 8 — battle's 4 hooks adopted, 5 Class-B hooks added, OQ-EQ1); fail-soft on unknown `passive_id` (battle EC) | snapshot contract owned here; hook points owned by battle, vocabulary authored here |
| question-content | Downstream (Soft) | Class-B passives read word-entry fields it guarantees: `etymology` (charm), `example_sentence` (dagger), distractor lists (owl), `term`/`tile_letters`/`first_letter_assist_eligible` (cat) | passive math ours; field guarantee theirs |
| speech-io | Downstream (Soft) | `option_audio_replay` extends tap-to-hear to vocab options; `spell_first_letter_assist` surfaces in the ult spell interaction's tiles. Replays never pause the countdown (speech-io: the timer is the cost) | rendering/scoring theirs; trigger conditions ours |
| ui-shell | Downstream (Soft) | Inventory/gear screen (slots, levels, stone apply), hint surfaces (etymology, example-on-miss), elimination animation, stat-delta displays | screens theirs; states and copy source this GDD |
| meta-progression | None direct | Indirect only: stones → levels → stats. Equipment never touches gold (explicit non-dependency, mirrors meta's own row) | — |

## Formulas

> **Catalog baseline** (values adopted from the validated prototype as authored baseline — one stated retune: shield-steadfast `perLevel.def` 4 → **3**, because at +5 it would reach 38 def and break the `def ≤ 120` band by construction; plate-conditional stays the def-max armor. Full-catalog maxima below are computed from this table — these sums are checkable design facts, not assertions):

| Item (id) | Slot | Rarity | stats (base) | perLevel | passive_id |
|---|---|---|---|---|---|
| Kiếm Phrasal Verb (`sword-phrasal`) | weapon | epic | atk 20 | atk +5 | `pre_damage_mult_phrasal` |
| Trượng Thì Hoàn Thành (`staff-perfect`) | weapon | rare | atk 18, def 8 | atk +4, def +2 | `flat_counter_bonus_perfect` |
| Cung Collocation (`bow-collocation`) | weapon | legendary | atk 38, crit 6 | atk +6, crit +1 | `pre_damage_mult_collocation` |
| Dao Găm Thành Ngữ (`dagger-idiom`) | weapon | common | atk 16 | atk +3 | `vocab_example_on_miss` |
| Khiên Bất Khuất (`shield-steadfast`) | armor | epic | hp 90, def 18 | hp +10, **def +3** | `combo_keep_on_miss_once` |
| Áo Choàng Mạo Từ (`cloak-article`) | armor | common | hp 60, def 8, time +0.5 | hp +8, def +2 | `flat_time_bonus` (stat-carried — no hook) |
| Giáp Câu Điều Kiện (`plate-conditional`) | armor | rare | hp 80, def 22 | hp +10, def +3 | `pre_shield_mult_conditional` |
| Đồng Hồ Cát Học Giả (`hourglass-scholar`) | accessory | legendary | crit 7 | crit +2 | `round_time_bonus_grammar` |
| Nhẫn Phát Âm IPA (`ring-ipa`) | accessory | rare | crit 4, time +0.5 | crit +1 | `option_audio_replay` |
| Bùa Từ Gốc Latin (`charm-latin`) | accessory | epic | atk 10, time +0.5 | atk +3, time +0.25 | `vocab_etymology_hint` |
| Cú Tinh Anh (`pet-owl`) | pet | legendary | hp 30, def 5 | hp +5, def +1 | `answer_eliminate_two` |
| Mèo Chính Tả (`pet-cat`) | pet | rare | crit 3, hp 20 | crit +1 | `spell_first_letter_assist` |

All items enter at **level 0** at account creation (prototype demo levels discarded — the stone line tells the whole progression story; see the progression math below).

The `equipment_effective_stats` formula is defined as:

`effective_stat(s) = base_stat(class, s) + Σ over the 4 equipped items i of (item_stats[i][s] + item_perLevel[i][s] × item_level[i])`, for each stat `s ∈ {hp, atk, def, crit, time}`

**Variables:**

| Variable | Type | Range | Source | Description |
|----------|------|-------|--------|-------------|
| `base_stat(class, s)` | int (hp, atk, def, crit); float (time) | 360–420 / 62–80 / 30–55 / 6–12 / 0.0–1.0 | data file (hero-class) | Class base block — the stat targets equipment adds onto |
| `item_stats[i][s]` | int (hp, atk, def, crit); float (time) | ≥ 0, per catalog record | data file | Item's level-0 stat contribution |
| `item_perLevel[i][s]` | int (hp, atk, def, crit); float (time) | ≥ 0, per catalog record | data file | Per-`+level` stat gain |
| `item_level[i]` | int | 0 – `equipment_level_cap` (5) | accounts-backend state | The item's current `+` level |
| `equipped` | map slot → item_id | 4 slots, one item each | accounts-backend state | Which item occupies `weapon / armor / accessory / pet` |
| `effective_stat(s)` | int (hp, atk, def, crit); float 2-dp (time) | see output tables | computed | The stat published in `LoadoutSnapshot` |

Two deliberate exceptions are constants, not catalog values: `equipment_level_cap = 5` (bands the def formula, Core Rule 6) and `equipment_def_band = 120` (verified by F3). Everything else is a data-file catalog value. Integer stats are sums of integer inputs — no rounding arises; `time` sums in seconds and rounds **round-half-up to 2 decimals** (the catalog steps +0.5/+0.25 are exactly 2-dp, so the rule fixes the mode without changing results). Product compositions (passives multiplying into battle formulas) round **once, at the end**, per battle's documented rule.

**Output Range — level-0 baseline** (fresh account; min/max are per-stat spans across the catalog, not one loadout):

| Class | hp | atk | def | crit | time |
|---|---|---|---|---|---|
| Wordsmith (380/80/30/12/0.0) | 460 – 500 | 96 – 128 | 38 – 65 | 12 – 28 | 0.0 – 1.0 |
| Grammarian (420/62/55/6/1.0) | 500 – 540 | 78 – 110 | 63 – 90 | 6 – 22 | 1.0 – 2.0 |
| Arcane Speaker (360/72/38/9/0.5) | 440 – 480 | 88 – 120 | 46 – 73 | 9 – 25 | 0.5 – 1.5 |

*Per-slot span construction: hp minima pair cloak (60) with pet-cat (20); def minima take a zero-def weapon + cloak (8, the lightest armor) + pet-cat (0 def) — the def-bearing staff/plate/owl never all equip together; def maxima take staff (8) + plate (22) + owl (5); crit maxima take bow (6) + hourglass (7) + pet-cat (3); the time floor excludes cloak (shield/plate armor), the ceiling pairs cloak (0.5) with the better time accessory — ring and charm share the one accessory slot.*

**Output Range — maxed loadouts** (each stat maximized independently at +5; the extrema are **not simultaneously reachable** — def-max equips staff+plate+owl while atk-max equips bow+charm, and hp-max equips shield-armor while def-max equips plate):

| Class | hp | atk | def | crit | time |
|---|---|---|---|---|---|
| Wordsmith | 575 | 173 | 95 | 48 | 2.25 |
| Grammarian | 615 | 155 | **120** | 42 | 3.25 |
| Arcane Speaker | 555 | 165 | 103 | 45 | 2.75 |

**Def-band verification by construction (Core Rule 5).** The only def sources are staff (8+2/L), shield (18+3/L), cloak (8+2/L), plate (22+3/L), owl (5+1/L); only one armor equips, staff is the only def weapon, owl the only def pet. Worst case = Grammarian (55) + staff +5 (18) + plate +5 (37) + owl +5 (10) = **exactly 120**; every other combination is lower (next closest: shield-armor variant 116). Assembly additionally asserts the band (F3) so a catalog edit cannot silently break it.

**Battle-formula threat check (per stat):**
- **crit → B10**: max 48 (Wordsmith) → slow-answer crit probability 0.48 — far below the probability ceiling (F3 #2), fast-crit guarantee untouched.
- **time → B1/B2**: max effective time 3.25 (Grammarian) → `round_time = 13.25 s`, 14.75 s on a grammar round with the hourglass conditional. B2 stays structurally capped (`speedMult ≤ 1.3`), and battle's two absolute time thresholds (3000 ms fast-crit, 6000 ms cursed-rune) compare *elapsed*, not `round_time` — time gear can never raise the damage ceiling or devalue fast-crit; it only makes full speedMult easier to reach. Mild dilution noted (a 5 s answer in 14.75 s still scores 1.20).
- **atk → B3/B4/B5**: max 173 (Wordsmith: 80 + bow 68 + charm 25). Best single hits, **per weapon path** — one weapon slot, so a mult and the atk maximum cannot mix: **bow path** — vocab fast-crit `round_half_up(126.5 × 1.3 × 1.25 × 1.2 × 0.92) = 227`; listening pierce `round_half_up(147.85 × 1.3 × 1.25 × 1.20) = 288` (the bow's own collocation mult applies on listening for every class — Arcane reaches 281 at its atk 165); ult `round_half_up(175 + 173 × 0.38) = 241`. **sword path** (atk 150 = 80 + sword 45 + charm 25) — phrasal vocab fast-crit `round_half_up(115 × 1.3 × 1.25 × 1.2 × 0.92 × 1.25) = 258`; listening (no bow mult) 223; ult 232. Max three attack rounds (R1 + R3 + R4): bow path **227 + 288 + 241 = 756**, sword-phrasal path ≈ **713** — both > 600 — **early boss KO becomes reachable at maxed gear**, reversing the "outlast" identity note at the extreme (predicted by battle Core Rule 19, flagged to OQ-BS2's owner — see OQ-EQ6; not resolved here).
- **hp → B9/B12 ghost pressure**: max hp 615 (Grammarian + shield 140 + owl 55). A losing sweep's maximum ghost damage is 450 raw, ≥ 338 after def mitigation — a maxed-HP hero cannot be KO'd by the ghost even answering everything wrong. Deliberate: hp gear converts "survive" pressure into "win the fraction race" (B12 compares hp *fractions*), so the loss direction is preserved; logged as a balance watch-item, not a failure mode (OQ-EQ6).

**Worked examples.**
1. *Fresh account, default loadout, everything +0* (sword, shield-armor, hourglass, owl), Grammarian: hp = 420+90+30 = 540; atk = 62+20 = 82; def = 55+18+5 = 78; crit = 6+7 = 13; time = 1.0. Band check 78 ≤ 120 ✓; snapshot published.
2. *Bulwark Grammarian* (staff +5, plate +5, owl +5): hp = 420+130+55 = 605; def = 55+18+37+10 = **120 — exactly at band, accepted**; B6 shield `round_half_up((80+36)×1.25) = 145`; B7 counter `round_half_up(30+48)+30 = 108` (once per battle — R2 is the only grammar round).

The `equipment_stone_application` formula is defined as:

`level' = min(equipment_level_cap, level + 1)`; `stones' = stones − 1`; applied as **one atomic commit**, gated by prerequisites.

**Variables:**

| Variable | Type | Range | Source | Description |
|----------|------|-------|--------|-------------|
| `item_id` | string | catalog id (12) | player action | Target item |
| `level` | int | 0–5 | accounts-backend state | Item's current level |
| `stones` | int | ≥ 0 | accounts-backend state | Player's Upgrade Stone inventory |
| `equipment_level_cap` | int | 5 | constant (registry candidate) | Per-item cap (Core Rule 6) |
| `level'` / `stones'` | int | 0–5 / ≥ 0 | computed | Post-commit level and stone count |

**Prerequisites** (both required; UI renders the action disabled on failure — Core Rule 12): `stones ≥ 1` ∧ `level < equipment_level_cap`. When they hold, the `min` is redundant (kept as a guard against corrupt lower layers). **Output Range:** `level' ∈ [0, 5]` — capped, never decreasing; `stones' ≥ 0`. Blocked attempts are no-state-change, not errors. **Atomicity and ordering** (Core Rule 7 enforced here): the server writes `{level', stones'}` as one whole commit (AC-C1 shape), re-validates both prerequisites server-side (AC-C2 shape) — client validation is UI, not authority. Only after server acceptance does the client re-run F1 on committed state, validate F3, and republish the `LoadoutSnapshot`; a failed commit never half-applies (States machine).

**Worked example:** Trượng at +2, player holds 3 stones → commit: level 2→3, stones 3→2; F1 recomputes (atk 18+4×3 = 30, def 8+2×3 = 14); F3 passes; snapshot republished — the *next* battle reads the new stats, the running one does not (Core Rule 10).

The `equipment_band_validation` assert set — enforced by F1 on every assembly (client for display, server recomputation on every commit; the two never diverge). Every violation is a **fail-fast data error**: at MVP stats arise only from the catalog file plus stone-capped levels, so *no player action can create a violation* — a failing assert always means corrupted catalog data or storage. No assert is ever player-visible state; the only player-visible gate is the disabled stone action (Core Rule 12), which is not an assert.

| # | Assert | Bound | Constant (registry candidate) | Severity | Rationale |
|---|---|---|---|---|---|
| 1 | effective `def ≤ equipment_def_band` | 120 | `equipment_def_band` | **fail-fast** | Counter B7 is uncapped in def (B9 mitigation saturates at 150); the band keeps counters computable (Core Rule 5). By construction, not a runtime clamp |
| 2 | effective `crit ≤ equipment_crit_ceiling` | 100 | `equipment_crit_ceiling` | **fail-fast** | B10 reads `crit_stat/100` as a probability — p > 1 breaks probability semantics and stream discipline. Catalog headroom is large (max 48) |
| 3 | equipment `time` **contribution** ≤ `equipment_time_advisory_ceiling` | 3.0 s | `equipment_time_advisory_ceiling` | **advisory** (logged warning) | Scoped to the *equipment contribution* (max 2.25), not effective time — Grammarian's legitimate max 3.25 effective must not fire it. B1 is deliberately unceilinged and B2 stays capped; a violation is a balance signal, not an invariant break |
| 4 | every `item_stats[s] ≥ 0` ∧ `item_perLevel[s] ≥ 0`; at least one stat > 0 per item | ≥ 0 | — (schema check) | **fail-fast** | A negative stat would invert battle formulas (B9's def clamp exists precisely because assembly doesn't vouch for this); an all-zero item fails Pillar 3 (no passive) |
| 5 | effective `hp ≥ base` ∧ `atk ≥ base` | class base | — | **fail-fast** | Implied by #4 for the MVP catalog; asserted independently to guard future negative-base edits |
| 6 | `item_level ∈ [0, 5]` per loadout | 0–5 | `equipment_level_cap` | **fail-fast** | A stored level > 5 breaks both F1 scaling and the def band |
| 7 | no two equipped items map to the same hook on the same round (Core Rule 9) | catalog-file construction | — | **fail-fast** | Stacking would silently multiply damage/shield factors; guards future catalog edits, not loadouts (satisfied by condition design today) |

Any failing assert → assembly error, **no LoadoutSnapshot published**, battle never sees wrong state.

**Passive magnitude constants** — each a registry candidate; the magnitude is equipment-owned, the equation is battle-owned (the coefficient-vs-equation split hero-class established):

| Constant | Value | Item | Plugs into | Rounding |
|---|---|---|---|---|
| `eq_pre_damage_mult_phrasal` | ×1.25 | Kiếm Phrasal Verb | `pre_damage_mult` → B3, on a phrasal-tagged `vocab_strike` | multiplies the full float product; rounded once at the end |
| `eq_pre_damage_mult_collocation` | ×1.20 | Cung Collocation | `pre_damage_mult` → B4, on `listening_pierce` | same; B4 has no armor factor |
| `eq_flat_counter_bonus_perfect` | +30 | Trượng Thì Hoàn Thành | `flat_counter_bonus` → B7, after a correct grammar round | added **after** B7's rounding — no rounding interaction |
| `eq_pre_shield_mult_conditional` | ×1.25 | Giáp Câu Điều Kiện | `pre_shield_mult` → B6, on `grammar_shield` | applies to the float `(80 + def × 0.3) × 1.25`, rounded once |
| `eq_round_time_bonus_grammar` | +1.5 s | Đồng Hồ Cát Học Giả | new Class-B hook `round_time_bonus` → B1 conditional | added to computed round_time; an *effect*, never a stat — never enters F1 (cloak is the only stat-carried time) |
| — (presence only) | — | Khiên Bất Khuất | `combo_keep_on_miss` (once per battle) | boolean |
| — (presence only) | — | Dao Găm / Bùa / Nhẫn / Cú / Mèo | Class-B affordances: `vocab_example_on_miss`, `vocab_etymology_hint`, `option_audio_replay`, `answer_eliminate_two`, `spell_first_letter_assist` | presentation properties, no math |

**Worked examples:** Grammarian shield ×1.25 at def 55: `round_half_up((80+16.5)×1.25) = 121`; at def 120: 145. Battle's structural shield-pool worst case "≈157" (one B6 shield + Grammarian proc at base def) becomes **205** with gear (145 + 60 at def 120) — the pool has no cap, so nothing breaks, but battle's printed 157 goes stale the moment equipment exists (carry-in: battle should cite the pool bound as an expression, not a constant — see OQ-EQ6). Hardest single hit: bow listening pierce at max atk, `round_half_up(147.85 × 1.3 × 1.25 × 1.20) = 288` — reachable, because atk 173 requires the bow and the ×1.20 is the bow's own; the sword-phrasal hit at its own atk 150 caps at `round_half_up(115 × 1.3 × 1.25 × 1.2 × 0.92 × 1.25) = 258` — both still under half of boss HP. Hourglass grammar time: Grammarian base `max(5, 10+1.0) + 1.5 = 12.5 s`; fully maxed 14.75 s.

**Progression math (Upgrade Stone supply):** total demand = 12 items × 5 stones = **60 stones** for the full catalog; 5 for one maxed item. Supply (from forge-srs `forge_time_to_first_stone`): first stone arrives day **5–8**; FS16 grants one stone per purification sitting and the D2/D3 ladder delays (24 h + 72 h) throttle the pipeline, so the mature rate is **≈ 0.5–1 stone/day** of daily play regardless of sessions-per-day (economy check — the D2/D3 delays and the p³ sitting gate dominate; multi-session days buy almost nothing). Curve: day 0–5 nothing to apply (expected; first stone lands day 5–8); first stone → first allocation day 5–8; first item maxed ≈ **day 9–13** at the fast end of the band, stretching toward ~week 3 at the slow end (the first felt power spike either way — e.g., Kiếm Phrasal +5 is +25 atk over base); the mature 0.5–1/day stream then delivers the remaining 55 → **full catalog ≈ 2–4 months** of daily play (day 60–68 is the sustained-1/day best case, not the expectation). Shape verdict: sound at MVP — a short early game paced by the forge, a mid game with one early spike and genuinely scarce allocation choices, a late stream of small gains. The known weak point is **saturation at catalog completion (≈ months 2–4)**: everything maxed, stones accumulate unboundedly, progression halts until post-MVP acquisition exists (OQ-EQ3) — a declared MVP boundary, not a defect, but the saturation window should stay in view alongside OQ-EQ3.

## Edge Cases

- **If a stone is applied and the commit fails** (server error, connection drop): the application enters `Retrying` — accounts' retained-commit/retry ladder governs, the level is **not** applied client-side until the server accepts, and one retry is offered ("Thử lại"); abandoning leaves equipment state exactly as before the attempt. A failed application never half-applies (no level-without-stone, no stone-without-level — the atomic whole-commit shape).
- **If two devices apply stones concurrently**: the server validates stone count at commit (AC-C2 analog) and rejects the second whole-commit — the loser's client re-syncs to server state on next read; no negative stone counts, no double level.
- **If every catalog item is maxed (level 5) and the player holds stones**: stone application is unavailable everywhere (buttons rendered disabled with "cấp tối đa" copy, never hidden); stones accumulate **uncapped** — the count is display-only at MVP and needs no sink (Alpha sink pricing is OQ-MP1's; OQ-EQ5 carries the equipment-side note).
- **If assembly computes `def > 120`**: fail-fast data error at assembly time (before any snapshot publication) — by catalog + level-cap construction the worst case is exactly 120, so a violation means the catalog data was edited without re-deriving the band. It is never clamped silently (a silent clamp would misbalance B6/B7 without anyone knowing).
- **If the catalog ever contains two equipped items that can hit the same hook on the same round** (Rule 9): assembly rejects the loadout as a data error — the property is asserted, not resolved by priority, so a future catalog edit cannot create silent stacking.
- **If the snapshot carries a `passive_id` battle does not know**: battle ignores it with a warning and stays playable (battle's own fail-soft rule, referenced here for completeness). Divergent failure modes are deliberate: a broken player item degrades quietly, a broken ghost identity fails fast.
- **If an equip swap happens mid-battle**: the running battle is untouched — it read its snapshot once at start; the change is picked up by the next battle's snapshot read.
- **If a Class-B passive's data field is missing or empty on a drawn question** (no `etymology` populated, empty distractor list): the affordance degrades to absent for that round — no hint surface, no elimination — and the round stays fully playable. A missing field is never an error thrown at the player (question-content guarantees populated fields; this handles content drift gracefully).
- **If the pet-owl HP condition is evaluated at exactly 30% of max HP**: eligible (inclusive boundary, `hp ≤ 0.30 × hp_max`). Once triggered, the elimination applies to the current round's options only; it does not persist across rounds.
- **If `answer_eliminate_two` fires on a round with more than 2 wrong options**: exactly 2 wrong options are removed (never more), chosen by battle's seeded draw stream — a deterministic function of (seed, round, wrong set), replay-identical under same-seed replay, statistically uniform across seeds (equipment itself owns no RNG; every stream is battle's). The outcome is "4+ options → 2+ remaining incl. correct", never an auto-solve. Grammar rounds cannot fire it at all (schema minimum 3 options there — see Rule 8).
- **If `option_audio_replay` is tapped repeatedly during a timed vocab round**: replay never pauses, resets or extends the countdown (speech-io's timer-is-the-cost principle) — the speedMult decay keeps running while audio plays.
- **If `spell_first_letter_assist` is equipped but the ult interaction takes the mic path**: the assist is spell-path-only — the mic path is untouched. If the player free-switches from mic to spell, the assist applies to the spell attempt (one attempt total, speech-io's ult rule).
- **If `round_time_bonus_grammar` would push `round_time_s` past any bound**: no bound exists above the floor — `round_time_s = max(5, 10 + effective_time)` accepts any positive bonus; with the maxed catalog the grammar round reaches 10 + 3.25 + 1.5 = **14.75 s** (Grammarian's max effective time 3.25 = base 1.0 + cloak 0.5 + charm +5 at 1.75). The floor (5 s) is battle-owned and unaffected (no MVP item subtracts time; negative `time` items are a post-MVP idea — hero-class notes ≥ −10 possible via equipment).
- **If a stone arrives while the player is offline**: forge grants stones server-side; the inventory count updates on next sync — no client-side stone grant exists to conflict with. Offline equipment *changes* (apply, swap) are blocked (accounts offline rule); viewing is read-only from last-known state.
- **If the level cap is raised post-MVP** (say 5 → 7): the def band MUST be re-derived before the cap change ships (new worst case 55 + 8+2×7 + 22+3×7 + 5+1×7 = 55+22+43+12 = 132 > 120 — the band, a battle-handoff value, would be violated by construction). The cap and the band are one coupled decision (OQ-EQ4).

## Dependencies

| System | Status | Hard/Soft | Interface | Notes |
|---|---|---|---|---|
| hero-class | GDD Approved | **Hard** | Base stat blocks = equipment's stat targets; five-stat vocabulary; "stats only, cannot grant mana" constraint (its Core Rule 5 note) | Bidirectional ✓ — hero-class lists equipment downstream ("uses base stats as stat targets; equipment owns snapshot assembly") |
| forge-srs | GDD Approved | **Hard** | Upgrade Stone supply — forge grants one stone per purification sitting (3 Box-3 runes, 3/3 correct) and stops; stone carries no slot target, no `+level` value (FS16) | **FS16 confirmed here — the provisional contract closes.** Bidirectional ✓ — forge-srs lists equipment downstream-Hard ("application, stat effects and `+level` curve are equipment's; confirmed when the equipment GDD lands") |
| accounts-backend | GDD Approved | **Hard** | Server-side storage `{item_levels, stones, equipped}`; atomic whole-commit for application (AC-C1 shape, AC-C2-style validation); offline changes blocked; commit failures via `retry_delay` ladder | Bidirectional ✓ — accounts-backend lists equipment among its persistence consumers |
| battle-system | GDD Approved | **Hard (downstream)** | Consumes immutable `LoadoutSnapshot` (battle Core Rule 3 shape — adopted verbatim here) + passive effects via the hook vocabulary (battle Rule 25's 4 hooks adopted; 5 Class-B hooks added — OQ-EQ1, battle's next edit) | **OQ-BS4 resolves here**: shape confirmed, `def ≤ 120` band adopted and enforced by construction (Core Rule 5). Bidirectional ✓ — battle lists equipment upstream-Hard with the owed handoff |
| question-content | GDD Approved | Soft (downstream) | Class-B passives read word-entry fields it guarantees: `etymology`, `example_sentence`, distractor lists, `term`/`tile_letters`/`first_letter_assist_eligible` | Bidirectional ✓ — question-content lists equipment downstream-Soft ("equipment owns passive math; this system guarantees the fields its passives read") |
| speech-io | GDD Approved | Soft (downstream) | `option_audio_replay` extends tap-to-hear to vocab options; `spell_first_letter_assist` in the ult spell path; replays never pause timers | speech-io names equipment only as a non-contract row (Interactions: "forge-srs / equipment / tower — None direct"; no passive contract exists there) — **owed carry-in** stands: note both passives as future referenced_by at speech-io's next edit |
| ui-shell | Not designed (MVP order #9) | Soft (downstream) | Inventory/gear screen (slots, levels, stone apply, stat deltas), hint surfaces (etymology, example-on-miss), elimination animation | Contract defined here; confirmed when ui-shell lands |
| meta-progression | GDD Approved | None direct | Indirect only: stones → levels → stats. Equipment never touches gold | Mirrors meta's own "equipment — None" row ✓ |

**Explicit non-dependencies**: tower (no interface — battles read the snapshot regardless of encounter type), opponent-ai (ghost stats never derive from player gear), ranked-league (RP events never read equipment state), meta-progression's gold economy (no sink, no cost at MVP — OQ-MP1 owns any Alpha pricing), localization (vi-VN display names are catalog data, not a localization dependency at MVP).

**Circular-dependency resolution** (systems-index): battle ↔ forge ↔ equipment stays a two-contract triangle, no runtime cycle — battle emits `BattleResult` events and reads only the snapshot; forge consumes only those events and grants stones; equipment consumes stones and publishes the snapshot battle reads. Each contract side is owned by exactly one GDD; this GDD owns both of its sides (snapshot publication, stone application).

## Visual/Audio Requirements

**Visual language — the arsenal shelf.** The inventory is the player's visible growth record: each item card shows rarity color (prototype palette: common gray / rare blue / epic purple / legendary orange — carried as display identity only, Rule 3), level pips (0–5), the stat block, and the passive text in Vietnamese. The `+level` moment is the Pillar-2 payoff landing: stone icon → item flash → level pip fills → stat-delta pop, in the same warm "transmutation, not destruction" family forge-srs established (the stone arrives purified; it becomes power here). Rarity borders use the same saturation hierarchy battle's reward modal uses, so "legendary" reads the same everywhere.

**Audio (MVP set, ≤ 3 cues)**: stone-apply chime (shares the forge purify chime's tail — same material, same family), equip-swap soft click, level-cap "full" thud (disabled-action feedback). Cue names and mixing specs are a `sound-designer` task post-GDD; the set must stay quieter than battle's arena cues and no louder than the forge's workshop set.

**Art-bible alignment**: item icons are the prototype's Lucide family (Sword, Wand, Crosshair, Flame, Shield, Shirt, ShieldHalf, Hourglass, Gem, ScrollText, Bird, Cat) held as authored baseline; passives that surface inside battle (hints, elimination, first-letter) render with battle's UI kit, not inventory styling — the battlefield reads as one system.

> 📌 **Asset Spec** — Visual/Audio requirements are defined. After the art bible is approved, run `/asset-spec system:equipment` to produce per-asset visual descriptions, dimensions, and generation prompts from this section.

## Game Feel

The inventory is a **second exhale** — the forge's quieter sibling. No timers, no pressure; the only quantitative moment is the stone application, which should land with the weight of the forge's purification payoff compressed into one beat (~800–1200 ms: select → confirm → commit → pip fills → stat pop). Input responsiveness: slot tap highlights immediately (≤ 100 ms); the apply button shows its disabled state (maxed item / no stones / offline) before the player commits to the tap, never after. The stat-delta preview ("+5 ATK → +10 ATK") must render *before* confirmation — the player should feel the purchase, not discover it. What must NOT happen: the inventory reading as a spreadsheet. Every passive's text is a language promise ("gặp câu hỏi Cụm động từ…" — "when phrasal-verb questions appear…"), and the level pips should read as mastery of that promise, not abstract RPG filler.

## UI Requirements

Screens owned by ui-shell (equipment supplies states, copy and data):

| Surface | Purpose | Equipment-supplied state |
|---|---|---|
| **Inventory / gear screen** | 4 slot cards (weapon/armor/accessory/pet, one item each, never empty), item detail (rarity, level pips, stats, passive text vi-VN), stone counter, apply flow | `equipped`, `item_levels`, `stones`, catalog data, F1-computed effective stats |
| **Apply confirmation** | Target item + stat-delta preview + confirm; disabled states: maxed ("cấp tối đa"), no stones ("cần Đá Tu Luyện"), offline (read-only banner) | preconditions from Rule 7/F2; commit states (Idle/Committing/Retrying) |
| **Hint surfaces (in battle)** | etymology hint panel (charm), example-sentence reveal on miss (dagger), option elimination flash (owl), tap-to-hear affordance (ring), first-letter pre-fill (cat) | passive active-flags via the snapshot + Class-B hook handoff (OQ-EQ1) |
| **Battle HUD stat line** | effective stats at battle intro (existing battle surface) | the snapshot's five stats, display-only |

**Accessibility**: passives that add information (hints, elimination) must be toggle-revealable, not forced-visual-only — the etymology panel and example-sentence reveal need screen-reader-readable text; tap-to-hear targets need ≥ 44 px hit areas (existing ux-patterns rule). No MVP item may gate information behind color alone (rarity is color + border weight + label).

> **📌 UX Flag — equipment**: This system has UI requirements. In Phase 4 (Pre-Production), run `/ux-design` to create a UX spec for the inventory/gear screen and the hint surfaces **before** writing epics. Stories that reference UI should cite `design/ux/[screen].md`, not the GDD directly. Note this in the systems index.

## Cross-References

| Referenced doc | What it supplies here | Where |
|---|---|---|
| design/gdd/hero-class.md | Base stat blocks (380/80/30/12/0.0 · 420/62/55/6/1.0 · 360/72/38/9/0.5); five-stat vocabulary; "items cannot grant mana" constraint | Core Rule 4, Rule 8, Dependencies |
| design/gdd/forge-srs.md | FS16 stone contract (grants, stops); purification sitting definition; F3 time-to-stone cadence | Core Rules 2/7, Dependencies |
| design/gdd/battle-system.md | LoadoutSnapshot shape (Core Rule 3); hook points (Rule 25); B2/B5/B6/B7/B9/B10 consumption targets; `def ≤ 120` handoff; fail-soft unknown-passive EC | Core Rules 5/8/10, Edge Cases |
| design/gdd/accounts-backend.md | AC-C1 atomic commit shape; AC-C2-style server validation; offline rules; `retry_delay` ladder | Core Rules 7/11, States machine |
| design/gdd/question-content.md | Word-entry field guarantees (`etymology`, `example_sentence`, distractors, `term`/`tile_letters`/`first_letter_assist_eligible`); `spell_challenge` schema | Core Rule 8 (Class-B conditions), Edge Cases |
| design/gdd/speech-io.md | Tap-to-hear capability; ult mic/spell free-switch, one attempt | Core Rule 8, Edge Cases |
| design/gdd/meta-progression.md | Gold non-dependency (stones never gold); OQ-MP1 Alpha sink ownership | Core Rule 7, Dependencies |
| design/gdd/systems-index.md | Enumeration #6, circular-dependency resolution (two-contract triangle) | Dependencies |

## Tuning Knobs

Every value below is a data-file entry or named constant (each is a registry candidate); retunes go through the tuning process, never silently (Core Rule 2). Safe ranges are derived from this GDD's own constraints — leaving a range reopens the coupling noted.

| Knob | Value | Safe range | Affects | Coupling / guard |
|---|---|---|---|---|
| `equipment_level_cap` | 5 | 5 at MVP — any raise re-derives the def band first (cap 7 → worst case 132 > 120, EC15) | progression length; every stat ceiling | coupled to `equipment_def_band` (OQ-EQ4) — one decision, battle re-verifies |
| `equipment_def_band` | 120 | 120 at MVP — battle-handoff value; change only with battle-side re-check of B6/B7 against B9's 150 saturation | counter/shield ceiling | catalog def rows + cap (band enforced by construction, F3 #1) |
| `equipment_crit_ceiling` | 100 | 100 — probability semantics (`crit_stat/100`, B10); never lower below the catalog max 48 | crit-roll validity | battle B10 |
| `equipment_time_advisory_ceiling` | 3.0 s | ≥ the shipped contribution max 2.25; advisory only — it warns, never blocks | when the pacing warning fires | none (F3 #3) |
| Catalog `stats` / `perLevel` rows | Formulas table | any non-negative values that keep: def worst case ≤ 120, crit ≤ 100, time contribution within the advisory, ≥ 1 stat > 0 per item (F3 #4) | every battle formula via F1 | asserts #1–#6 are the guard — a firing assert is a data error, not a clamp |
| `eq_pre_damage_mult_phrasal` | ×1.25 | ≤ ×1.5 pending OQ-BS2's geared-burst retune (the envelope already clears 600 at max) | vocab damage on phrasal-tagged words | OQ-EQ6 one-cycle evidence |
| `eq_pre_damage_mult_collocation` | ×1.20 | ≤ ×1.5, same envelope watch | listening damage | OQ-EQ6 (bow-path listening 288) |
| `eq_flat_counter_bonus_perfect` | +30 | ≤ +50 — the counter bypasses ghost armor and scales with uncapped-in-formula def (108 at def 120 today) | grammar counter damage | def band |
| `eq_pre_shield_mult_conditional` | ×1.25 | ≤ ×1.5 — the shield pool is uncapped; the pool bound grows with the mult (205 at def 120 today) | grammar shield size | battle pool-bound carry-in (OQ-EQ6) |
| `eq_round_time_bonus_grammar` | +1.5 s | ≤ +3.0 s — pacing dilution: full speedMult gets easier (threat check); never enters F1 | grammar round time | B1/B2 pacing; the 5 s floor is battle-owned |
| Rarity labels | common…legendary | display-only at MVP — mechanical only with post-MVP acquisition | acquisition weighting (future) | OQ-EQ3 |

## Acceptance Criteria

> **Source**: qa-lead consultation, 2026-11-09 (EQ1–EQ28, coverage-verified against all 12 Core Rules, F1/F2 and all 7 F3 asserts, and every one of the 15 Edge Cases; cross-checked against battle-system's BS1–BS38, which own the battle-side twins). **Legend**: **[unit]** = vitest, deterministic, DI-injected accounts-backend / question-content / battle collaborators (contract fakes — no network, no device clock), home `tests/unit/equipment/`, BLOCKING; **[integration]** = automated cross-system test against the accounts-backend storage/commit path (test double implementing the AC-C1/AC-C2 commit contract), BLOCKING; **[screenshot]** = retained in `production/qa/evidence/`, BLOCKING at every `qa.level` (never waived); **[statistical]** = **0 criteria — equipment has no stochastic element.** Assembly, stone application and every passive condition are deterministic data + arithmetic; the only randomness in the battle loop (question draws, crit stream) is battle's and is already covered there (BS12, BS23, BS30). A static assertion (EQ1) pins that no RNG and no device-clock read exists anywhere in the equipment module. *(provisional)* = boundary with battle's Class-B hook implementation (OQ-EQ1) — the equipment-side half is assertable now, the battle-rendering half is not. qa-lead findings EQ-AC-F1 (EC13's 13.5 s) and EQ-AC-F2 (baseline hp minima) were arithmetic slips in this GDD, ruled and repaired the same day (13.5 → 14.75 s; hp minima 460/500/440); EQ-AC-F3 (taxonomy count) and EQ-AC-F4 (elimination determinism) were applied as clarifications to Rules 8/EC10. Fixture base blocks: Wordsmith 380/80/30/12/0.0 · Grammarian 420/62/55/6/1.0 · Arcane Speaker 360/72/38/9/0.5. (AC ids `EQ…` coexist with open-question ids `OQ-EQ…` exactly as `BS…` coexists with `OQ-BS…` in the battle GDD.)

- **EQ1 [unit] — Catalog manifest: 12 items, data-file only, all level 0 at account creation (Core Rules 2, 12).** **GIVEN** the shipped catalog data file, **WHEN** it loads, **THEN** it parses to exactly 12 records with unique ids, each carrying `id`, Vietnamese display name, `slot` ∈ {weapon, armor, accessory, pet}, `rarity` ∈ {common, rare, epic, legendary}, base `stats`, `perLevel`, and a `passive_id` (cloak-article's being the stat-carried time entry, no hook); **and THEN** every stat map's keys are a subset of {hp, atk, def, crit, time} — a mana key cannot exist (hero-class: items cannot grant mana), every item has at least one stat > 0 (Pillar 3), and the ring's `passive_id` is `option_audio_replay` (the re-authored identity — nothing grants mana); **and GIVEN** a fresh account state, **WHEN** read, **THEN** `item_levels` are all 0, `stones` = 0, and `equipped` is the default loadout (sword-phrasal, shield-steadfast, hourglass-scholar, pet-owl — the worked-example loadout); **and THEN** a static assertion confirms the module exposes no buy/sell/craft/delete surface and contains no `Math.random`, `crypto.getRandomValues`, `Date.now` or `performance.now` — equipment is deterministic data plus arithmetic.
- **EQ2 [unit] — Four slots, one item each, never empty; swap only; rarity is display-only (Core Rule 3).** **GIVEN** all 72 reachable loadouts (4 weapons × 3 armor × 3 accessory × 2 pets), **WHEN** any equip swap is applied, **THEN** every slot remains filled (no unequip operation exists in the module's public surface — static assertion) and exactly one slot→item pair is written; **and WHEN** assembly runs on loadouts whose rarity labels are permuted arbitrarily, **THEN** the effective stats are bit-identical — rarity is not an assembly input.
- **EQ3 [unit] — F1 assembly across classes and levels (F1 + Core Rule 4).** **GIVEN** the three class base blocks and injected account states at several level vectors, **WHEN** effective stats compute, **THEN** `effective_stat(s) = base_stat(class, s) + Σ(stats[i][s] + perLevel[i][s] × level[i])` for each of the five stats: the fresh default-loadout Grammarian reads exactly 540 hp / 82 atk / 78 def / 13 crit / 1.0 time (worked example 1, band check 78 ≤ 120 passing); **and WHEN** staff-perfect sits at +2, **THEN** its contribution is atk 18+2×4 = 26, def 8+2×2 = 12 — integer stats are exact integer sums with no rounding anywhere.
- **EQ4 [unit] — `time` sums in seconds, round-half-up to 2 decimals; cloak is the only stat-carried time (F1 + Core Rule 4).** **GIVEN** loadouts combining cloak-article (0.5), ring-ipa (0.5) and charm-latin (0.5 + 0.25 × level), **WHEN** time assembles, **THEN** charm +5 alone contributes 1.75 and charm +5 with cloak contributes 2.25 — the catalog maximum, matching the maxed-loadout table; **and WHEN** a synthetic catalog value of 0.125 is injected, **THEN** it rounds to 0.13 (the mode is pinned; all shipped catalog steps are exact 2-dp, so the rule changes no shipped result); **and THEN** the hourglass's +1.5 s appears in no effective time at any level — it is an effect, never a stat (EQ21).
- **EQ5 [unit] — Level-0 output ranges are checkable facts (F1 + Formulas baseline table).** **GIVEN** an enumeration of all 72 level-0 loadouts per class, **WHEN** per-stat min/max compute, **THEN** they equal the baseline table with hp minima **460 / 500 / 440** (Wordsmith / Grammarian / Arcane — every loadout includes a mandatory pet, and pet-cat's hp 20 counts) and hp maxima 500 / 540 / 480; atk (96–128 / 78–110 / 88–120), def (**38–65 / 63–90 / 46–73** — def minima take a zero-def weapon, cloak (8, the lightest armor) and pet-cat (0 def); the def-bearing staff/plate/owl never all equip together), crit (12–28 / 6–22 / 9–25) and time (0.0–1.0 / 1.0–2.0 / 0.5–1.5) match as printed.
- **EQ6 [unit] — Maxed extrema and the def band by construction, exact 120 (Core Rule 5 + Formulas).** **GIVEN** the same enumeration at level 5 per stat, **WHEN** extrema compute, **THEN** maxed hp 575/615/555, maxed atk 173 (Wordsmith 80 + bow 68 + charm 25 — attached as OQ-EQ6's evidence), maxed crit 48 (Wordsmith; far under the 100 ceiling), maxed time 2.25; **and WHEN** the def-max loadout computes (Grammarian + staff +5 + plate +5 + owl +5), **THEN** def is exactly 55 + 18 + 37 + 10 = **120 — at band, accepted**, the next-closest combination is 116 (shield-armor variant), and the extrema are not simultaneously reachable (def-max equips plate, hp-max shield); **and THEN** the worst-case-def-as-a-function-of-cap helper evaluates to 132 at cap 7 — pinning Edge Case 15's arithmetic (55 + 22 + 43 + 12) and why cap and band are one coupled decision (OQ-EQ4): the shipped cap 5 is the only value whose worst case passes the band.
- **EQ7 [unit] — Band asserts #1/#2: def ≤ 120 and crit ≤ 100 fail fast, never clamp (F3 #1, #2 + Edge Case def > 120).** **GIVEN** a synthetic corrupt catalog or level vector driving effective def to 121 (or crit to 101), **WHEN** assembly runs, **THEN** it fails fast with an error naming the assert and **no LoadoutSnapshot is published** — battle never sees wrong state; **and WHEN** effective def is exactly 120 (EQ6's loadout) or crit exactly 100, **THEN** assembly passes with the values unmodified — the bound accepts the boundary; **and THEN** no input path silently clamps (a > 120 def never yields a published 120 — a silent clamp would misbalance B6/B7 without anyone knowing).
- **EQ8 [unit] — Assert #3 is advisory: contribution-scoped, warning not block (F3 #3).** **GIVEN** the maxed time loadout (equipment contribution 2.25) and a Grammarian whose *effective* time is 3.25, **WHEN** assembly runs, **THEN** no warning fires — the ceiling scopes the equipment contribution, not effective time, so Grammarian's legitimate 3.25 must not trip it; **and GIVEN** a synthetic catalog whose time contribution reaches 3.5, **WHEN** assembly runs, **THEN** a warning naming `equipment_time_advisory_ceiling` is logged AND the snapshot still publishes — an advisory is a balance signal, deliberately unlike the fail-fast asserts.
- **EQ9 [unit] — Data-integrity asserts #4/#5/#6 fail fast (F3 #4, #5, #6).** **GIVEN** a catalog record with a negative stat, an item with all-zero stats, a synthetic negative class base driving effective hp or atk below base, or a stored level outside [0, 5] (e.g. 6), **WHEN** assembly runs on each, **THEN** each case fails fast at assembly time with an error naming the offending item and stat, and no snapshot publishes — no player action can create any of these, so a firing assert always means corrupted catalog data or storage.
- **EQ10 [unit] — No same-hook stacking on one round, asserted not resolved (Core Rule 9 + F3 #7 + Edge Case hook collision).** **GIVEN** all 72 loadouts over the real catalog, **WHEN** items are indexed by hook and matching round type, **THEN** at most one item maps to any hook on any round (the two `pre_damage_mult` items additionally share the weapon slot, so they are unreachable together); **and GIVEN** a synthetic catalog edit adding a second `pre_damage_mult` item in a different slot, **WHEN** a loadout equips both, **THEN** assembly rejects the loadout as a data error — the property is asserted, never resolved by priority, so a future catalog edit cannot create silent stacking.
- **EQ11 [unit] — Snapshot shape, publication timing, immutability (Core Rule 10).** **GIVEN** an equip swap and a stone application, **WHEN** each commits, **THEN** a snapshot publishes carrying exactly `{class_id, effective_stats {hp, atk, def, crit, time}, items [{item_id, slot, passive_id}]}` with all five stats already effective (battle never re-derives); **and WHEN** the commit is in flight or has failed (Retrying), **THEN** the publish spy records zero calls — publication happens only after server acceptance; **and THEN** the published object is frozen — a battle-side mutation attempt throws or no-ops, and the snapshot is deeply identical before and after a battle (twin of BS3's frozen-object assertion).
- **EQ12 [integration] — Battle reads the snapshot once; mid-battle changes affect the next battle only (Core Rule 10 + Edge Case mid-battle swap).** **GIVEN** a battle started from a published snapshot, **WHEN** the battle runs, **THEN** the snapshot source is read exactly once, at battle start; **and WHEN** an equip swap or stone commit publishes a new snapshot mid-battle, **THEN** the running battle's stats, damage and outcome are unchanged, and the next battle's intro reads the new values (its HUD stat line shows the new effective five). *(Battle-side read-once twin: BS3.)*
- **EQ13 [unit] — F2 arithmetic, prerequisites and the level-5 terminal state (F2 + Core Rules 6, 7, 12 + Edge Case all maxed).** **GIVEN** `stones ≥ 1` and target `level < 5`, **WHEN** the apply action commits, **THEN** `level' = min(5, level + 1)` and `stones' = stones − 1` — Trượng at +2 with 3 stones commits to level 3 / stones 2, after which F1 recomputes (atk 30, def 14), F3 passes, and only then republishes (the ordering is asserted); **and GIVEN** 0 stones or a level-5 target, **WHEN** the apply action is attempted, **THEN** it is a no-state-change block, never an error, and the UI precondition gate rejects before any commit state is entered; **and THEN** a maxed item is terminal — no state transition leaves Maxed at MVP, and with every item maxed the apply action is unavailable everywhere while stones accumulate uncapped (display-only).
- **EQ14 [integration] — Stone application is one atomic whole-commit, server-revalidated, gold-free (Core Rule 7 + Core Rule 1).** **GIVEN** a valid apply action against the accounts-backend commit contract (AC-C1 shape), **WHEN** the commit lands, **THEN** the server re-validates both prerequisites itself (client gating is UI, not authority), recomputes the effective stats from stored raw state, and rejects on divergence from the client's computed values — the stored record carries only `{item_levels, stones, equipped}` and no derived stat fields (assembly is this system's alone; storage is accounts'); **and THEN** no reader between write steps can observe level-without-stone or stone-without-level, and the gold ledger is untouched by the commit — equipment never touches gold at MVP (meta non-dependency, asserted).
- **EQ15 [integration] — A failed commit never half-applies; retained-commit retry (Edge Case commit failure + States machine).** **GIVEN** an injected server failure or connection drop during the commit, **WHEN** the accounts `retry_delay` ladder runs, **THEN** the client's level and stones remain exactly as before the attempt until the server accepts, one retry is offered ("Thử lại"), and abandoning returns to Idle with no state change; **and THEN** a read after the failure shows pre-attempt values — no level-without-stone, no stone-without-level, in either direction.
- **EQ16 [integration] — Concurrent application: the loser's whole-commit is rejected (Edge Case two devices).** **GIVEN** two devices applying stones to the same account concurrently, **WHEN** both commits reach the server, **THEN** exactly one is accepted whole, the second is rejected whole by server-side stone-count validation, the loser's client re-syncs to server state on next read, and no negative stone count and no double level exist at any observation point.
- **EQ17 [integration] — Offline: changes blocked, view read-only, server-side stones sync (Core Rule 11 + Edge Case offline stone arrival).** **GIVEN** a disconnected client, **WHEN** apply or swap is attempted, **THEN** both are blocked client-side (disabled actions with the offline banner, per the UI states); **and WHEN** the gear view renders offline, **THEN** it renders last-known state flagged read-only; **and GIVEN** a stone granted server-side while offline, **WHEN** the client syncs, **THEN** the count updates from the server with no client-side grant path existing to double it (no local stone mutation outside the commit response — static assertion).
- **EQ18 [unit] — Snapshot carries the passive vocabulary verbatim; unknown id publishes fail-soft (Core Rule 8 + Edge Case unknown passive_id).** **GIVEN** the catalog, **WHEN** snapshots publish, **THEN** each item's `passive_id` appears verbatim in `items[]` — all 12 ids from the Rule 8 table; **and GIVEN** a synthetic catalog record whose `passive_id` is outside the vocabulary, **WHEN** assembly runs, **THEN** the snapshot publishes without error (equipment does not gate on battle's knowledge) — the ignore-with-warning behavior is battle's fail-soft rule and is asserted battle-side in BS33; this AC pins only that publication is not the place it breaks.
- **EQ19 [unit] — Class-A condition predicates and magnitude constants (Core Rule 8 + Formulas magnitude table).** **GIVEN** injected battle round descriptors, **WHEN** each Class-A condition evaluates, **THEN** `pre_damage_mult_phrasal` fires only on a `vocab_strike` round whose word is tagged phrasal-verb (`part_of_speech`), `pre_damage_mult_collocation` only on `listening_pierce`, `flat_counter_bonus_perfect` only on a `grammar_shield` round answered correctly (its +30 joins after B7's rounding — no rounding interaction), and `pre_shield_mult_conditional` on every `grammar_shield` round; **and THEN** the data-file constants read exactly ×1.25 / ×1.20 / +30 / ×1.25, and the R4 fallback vocab round — which battle labels `vocab_strike` for every factor (BS9) — satisfies the vocab-keyed conditions; the application of these multipliers into B3/B4/B6/B7 is battle's (BS9/BS10/BS14/BS33); the equipment contract is snapshot flags plus condition evaluation.
- **EQ20 [unit] — combo_keep_on_miss_once: first miss only, once per battle (Core Rule 8).** **GIVEN** a battle whose first miss is a wrong commit or a timeout (battle treats them identically — BS18), **WHEN** it resolves, **THEN** the combo is preserved exactly once and a second miss in the same battle resolves as a normal miss; **and THEN** the passive is presence-only — no magnitude constant exists for it.
- **EQ21 [unit, provisional] — round_time_bonus_grammar: +1.5 s, grammar rounds only, an effect never a stat (Core Rule 8 + Edge Case hourglass bound).** **GIVEN** injected round descriptors, **WHEN** the hourglass condition evaluates, **THEN** it fires only on `grammar_shield` rounds and never on vocab, listening or the fallback; **and THEN** the +1.5 s never enters F1 at any level (EQ4's cross-assert) and is added to battle's computed `round_time_s`, whose 5 s floor is battle-owned and unaffected and which accepts any positive bonus — no bound exists above the floor; with the maxed catalog the grammar round reaches 10 + 3.25 + 1.5 = **14.75 s**, per the Formulas threat check and magnitude worked example. *(provisional: the end-to-end applied timing rides OQ-EQ1's battle edit; the Edge Case and Formulas now agree at 14.75 s — EQ-AC-F1's contradiction repaired same-day.)*
- **EQ22 [unit, provisional] — vocab_etymology_hint affordance, with missing-field degradation (Core Rule 8 + Edge Case missing field).** **GIVEN** the charm equipped and an injected question-content collaborator returning a vocab word with a populated `etymology`, **WHEN** a `vocab_strike` round starts, **THEN** the snapshot flag is set, the condition evaluates, and the affordance hands the word's etymology to the hint surface; **and GIVEN** the field missing or empty on a drawn question, **WHEN** the round starts, **THEN** the affordance degrades to absent for that round — no hint surface, no error thrown at the player, the round fully playable. *(provisional: hint-surface rendering in battle/ui rides OQ-EQ1; the equipment half above is assertable now.)*
- **EQ23 [unit, provisional] — vocab_example_on_miss affordance (Core Rule 8 + Edge Case missing field).** **GIVEN** the dagger equipped, **WHEN** a `vocab_strike` round is answered wrong, **THEN** the condition evaluates on the round's resolution data and the word's guaranteed `example_sentence` is handed to the resolution surface — failure becomes input; **and GIVEN** the field missing or empty, **THEN** the affordance degrades to absent for that round, the round playable, no error. *(provisional: end-to-end rendering rides OQ-EQ1; the effect rides the existing miss event rather than a new battle hook.)*
- **EQ24 [unit, provisional] — option_audio_replay: tap-to-hear never touches the countdown (Core Rule 8 + Edge Case repeated replay).** **GIVEN** the ring equipped on a timed vocab round, **WHEN** the condition evaluates, **THEN** the answer options gain the tap-to-hear affordance; **and WHEN** replay is tapped repeatedly, **THEN** no timer-mutation call is emitted — the countdown neither pauses, resets nor extends, and the speedMult decay keeps running (the timer is battle's; the trigger condition is equipment's). *(provisional: end-to-end rendering rides OQ-EQ1; the option-level surface owner is OQ-EQ2.)*
- **EQ25 [unit, provisional] — answer_eliminate_two gates and effect (Core Rule 8 + Edge Cases 30% boundary, > 2 wrong options).** **GIVEN** the owl equipped, **WHEN** the condition evaluates, **THEN** it fires only on an options round with ≥ 3 distractors (vocab/listening by schema — grammar rounds are excluded; their minimum 3 options would make 2 removals auto-solve) and only while `hp ≤ 0.30 × hp_max`, with exactly 30% **eligible** (inclusive boundary); **and WHEN** it fires on a round with more than 2 wrong options, **THEN** exactly 2 wrong options are removed — never more — the correct answer always survives ("4+ options → 2+ remaining incl. correct", never an auto-solve), the selection is a pure deterministic function of (seed, question identity, wrong set) via battle's seeded stream — replay-identical under same-seed replay (EC10's clarified determinism) — and the effect is scoped to the current round's options, never persisting. *(provisional: end-to-end rendering rides OQ-EQ1. Cross-seed uniformity is a statistical property deliberately unasserted — this GDD has 0 statistical criteria.)*
- **EQ26 [unit, provisional] — spell_first_letter_assist: spell path only (Core Rule 8 + Edge Case mic path).** **GIVEN** the cat equipped, **WHEN** the ult interaction takes the spell path, **THEN** the condition evaluates only there — requiring question-content's `first_letter_assist_eligible` and `tile_letters` — and the word's first letter is handed to the spelling tiles; **and WHEN** the interaction takes the mic path, **THEN** the assist does not apply; **and WHEN** the player free-switches mic → spell, **THEN** the assist applies to that spell attempt (one attempt total — speech-io's rule, asserted at the contract boundary). *(provisional: end-to-end tile rendering rides OQ-EQ1.)*
- **EQ27 [screenshot] — Inventory / gear screen reads as specified (UI Requirements + Visual language).** **GIVEN** a mid-progression account (mixed levels, ≥ 2 rarities, stones held), **WHEN** the inventory/gear screen renders, **THEN** it shows 4 slot cards — one item each, never empty — with rarity as color **plus** border weight **plus** label (never color alone), level pips 0–5, the stat block, the passive text in Vietnamese, and the stone counter. Retained screenshots in `production/qa/evidence/`. (Screens are ui-shell's — undesigned, order #9; the evidence pins that equipment's supplied state and copy render as specified. Stories cite `design/ux/[screen].md` once the UX spec lands.)
- **EQ28 [screenshot] — Apply confirmation: delta preview before commit; disabled states rendered, never hidden (Game Feel + UI Requirements + Core Rule 12).** **GIVEN** an item below cap and stones held, **WHEN** the apply flow opens, **THEN** the stat-delta preview ("+5 ATK → +10 ATK") is visible **before** confirmation — the player feels the purchase, not discovers it; **and GIVEN** a maxed item, an empty stone count, and a disconnected client, **WHEN** each state renders, **THEN** the action renders disabled — not hidden — with copy "cấp tối đa", "cần Đá Tu Luyện", and the offline read-only banner respectively. Retained screenshots in `production/qa/evidence/` (one per state). (Same ui-shell ownership note as EQ27.)

**Totals: 28 criteria — 21 unit (6 provisional on OQ-EQ1: EQ21–EQ26), 5 integration (EQ12, EQ14–EQ17), 2 screenshot (EQ27, EQ28), 0 statistical — equipment is fully deterministic; no statistical harness exists or is needed (see legend).**
**Coverage: all 12 Core Rules ≥ 1 AC; F1 and F2 ≥ 1 AC each; all 7 F3 asserts ≥ 1 AC; every Edge Case mapped (qa-lead matrix, 2026-11-09 — see the qa-lead report's coverage table, reproduced in the review packet).**

| Source item | AC ids |
|---|---|
| Core Rule 1 (ownership split) | EQ11, EQ14 |
| Core Rule 2 (catalog) | EQ1 |
| Core Rule 3 (slots / rarity) | EQ2 |
| Core Rule 4 (assembly, no mana) | EQ3, EQ4, EQ5, EQ1 |
| Core Rule 5 (def band) | EQ6, EQ7 |
| Core Rule 6 (level cap 5) | EQ6, EQ9, EQ13 |
| Core Rule 7 (stone application) | EQ13, EQ14, EQ15, EQ16 |
| Core Rule 8 (passive vocabulary) | EQ18, EQ19, EQ20, EQ21, EQ22, EQ23, EQ24, EQ25, EQ26 |
| Core Rule 9 (no stacking) | EQ10 |
| Core Rule 10 (snapshot) | EQ11, EQ12 |
| Core Rule 11 (persistence / offline) | EQ14, EQ17 |
| Core Rule 12 (cannot-do list) | EQ1, EQ2, EQ10, EQ13, EQ18, EQ28 |
| F1 (effective stats) | EQ3, EQ4, EQ5, EQ6 |
| F2 (stone application) | EQ13, EQ14, EQ15, EQ16 |
| F3 #1 (def band) | EQ6, EQ7 |
| F3 #2 (crit ceiling) | EQ7 |
| F3 #3 (time advisory) | EQ8 |
| F3 #4/#5/#6 (data integrity) | EQ9 |
| F3 #7 (no stacking) | EQ10 |
| EC1 (commit failure) | EQ15 |
| EC2 (concurrent devices) | EQ16 |
| EC3 (all maxed, stones held) | EQ13, EQ28 |
| EC4 (def > 120) | EQ7 |
| EC5 (hook collision) | EQ10 |
| EC6 (unknown passive_id) | EQ18 (equipment half; battle half = BS33) |
| EC7 (mid-battle swap) | EQ12 |
| EC8 (missing Class-B field) | EQ22, EQ23, EQ25 |
| EC9 (30% inclusive boundary) | EQ25 |
| EC10 (> 2 wrong options) | EQ25 |
| EC11 (replay vs countdown) | EQ24 |
| EC12 (mic path) | EQ26 |
| EC13 (hourglass no upper bound) | EQ21 |
| EC14 (offline stone arrival) | EQ17 |
| EC15 (cap raise ↔ band) | EQ6 (cap-7 = 132 pinned) + OQ-EQ4 |

## Open Questions

| # | Question | Owner | Tier / target |
|---|---|---|---|
| OQ-EQ1 | **Battle hook extension.** Rule 25's vocabulary grows 4 → 9 (five Class-B hooks: `round_time_bonus`, `vocab_etymology_hint`, `option_audio_replay`, `answer_eliminate_two`, `spell_first_letter_assist`). Battle must implement the hooks and the affordance state handoff to ui/speech-io. Rides the battle edit already carrying OQ-SI1, the BS3/BS4 resolution marks, and meta's BattleResult field-name carry-in. Blocks end-to-end Class-B ACs (they stay provisional until it lands). | battle-system author / technical-director | Next battle-system edit |
| OQ-EQ2 | **`option_audio_replay` surface owner.** Tap-to-hear is speech-io's state; extending it to vocab answer options needs an owner for the option-level audio affordance (speech-io renders vs ui-shell triggers vs battle exposes). Confirm at ui-shell GDD or speech-io's next edit. | speech-io author + ui-shell | ui-shell GDD (order #9) |
| OQ-EQ3 | **Item acquisition post-MVP.** Fixed 12-item catalog with everything owned from account creation is MVP-only; Alpha needs drops/shop/rarity weighting (rarity is display-only until then). | economy-designer + live-ops-designer | Alpha |
| OQ-EQ4 | **Level cap ↔ def band coupling.** Raising cap 5 → 7 pushes worst-case def to 132 > 120 — cap and band are one decision requiring battle-side re-verification (B6/B7 uncapped in def; B9 saturates at 150). | equipment + battle-system owner | Post-MVP, before any cap change |
| OQ-EQ5 | **Stone surplus sink.** Uncapped stone accumulation is display-only at MVP; Alpha needs either a sink or an explicit acceptance (ties to OQ-MP1's faucet-cap answer — sink pricing cannot precede it). | economy-designer | Alpha, after OQ-MP1 |
| OQ-EQ6 | **Geared stats vs battle's burst assumptions.** Battle's Edge Case ("attack values grow beyond MVP ranges") assumed **atk ≈ 150 with gear** (max vocab strike ≈ 206) and handed off explicitly: "a damage cap becomes a tuning knob only if equipment ranges change materially." This catalog's maxima exceed that assumption — max atk **173** (Wordsmith + Cung Collocation +5 at 68 + Bùa +5 at 25), max geared strikes: vocab **227** (bow path fast-crit), phrasal **258** (sword path at its own atk 150 — an earlier draft's 284 assumed bow atk and the sword's mult together, unreachable on one weapon slot), listening **288** (bow path incl. its ×1.20; 281 for Arcane; battle's EC figure 206 = the sword path at atk 150 without the phrasal mult), ult **241** → a maxed damage build can one-cycle the 600-HP boss (**756** across R1/R3/R4 on the bow path; ≈ **713** on the sword-phrasal path), the same outcome OQ-BS2's retune would produce anyway. Also: max crit ≈ 48 (Wordsmith) makes slow-answer crit ~48% (B10), softening the fast-answer crit's value (Pillar 1). Second stale battle note, same edit: battle's printed structural shield-pool bound "≈157" assumes base def — with gear the bound is 205 (shield `round_half_up((80+120×0.3)×1.25) = 145` + Grammarian 60); pool has no cap so nothing breaks, but battle should cite the bound as an expression, not a constant. Resolution is battle-side: recompute the geared burst math inside OQ-BS2 (or cap weapon perLevel atk ≤ ~60 to hold 150 — needs its own balance call). Attach this GDD's maxima table as OQ-BS2 evidence. | battle-system owner (with economy-designer) | With OQ-BS2, first balance pass |
