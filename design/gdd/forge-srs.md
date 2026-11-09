# Forge-SRS

> **Status**: In Design
> **Author**: user + systems-designer/game-designer agents (see session log)
> **Last Updated**: 2026-11-09
> **Last Verified**: 2026-11-09
> **Implements Pillar**: Pillar 2 (Mistakes Are Materials) — primary; Pillar 3 (Knowledge Is Gear) — upgrade payoff

## Summary

forge-srs is the game's spaced-repetition engine disguised as an RPG crafting station: every word the player answers wrong, too slowly, or not at all in battle arrives here as a cursed rune, and the forge schedules each rune through a three-box Leitner ladder (10 min → 24 h → 72 h) until it is due for review. A forge session is a 3-card recall quiz (2× EN→VI, 1× VI→EN, no timer); passing all three rune cards purifies them into one Upgrade Stone, which equipment applies as a gear `+level`. It exists to make Pillar 2 (Mistakes Are Materials) real machinery: failure stops being a dead end and becomes the player's visible weakness list — and the raw material their power grows from.

> **Quick reference** — Layer: `Progression` · Priority: `MVP` · Key deps: `battle-system (BattleResult), equipment (Upgrade Stone target), accounts-backend (rune-queue storage), question-content (card schema + filler pool)`

## Overview

The forge-srs system turns the player's own mistakes into progression material. When a battle question is answered wrong, answered too slowly, or times out, battle-system emits that word as a cursed rune; forge-srs owns everything after that emission — the rune queue's *semantics* (which runes exist, their review state, and when each is next due), the spaced-repetition schedule that spaces those reviews over real time, and the purification action that converts three mastered runes into an Upgrade Stone through a 3-card recall quiz (2× EN→VI, 1× VI→EN) that must be passed in full. Passing purifies the runes and grants the stone, which equipment applies as a gear `+level`. The player interacts with the Forge directly as a screen in the core loop — the game's visible "weakness list" — while the SRS scheduling underneath runs automatically. Without it, Pillar 2's promise ("mistakes are materials") has no machinery: battles would punish failure without converting it into growth, and the spaced-repetition claim the pitch makes would have no substance.

## Detailed Design

### Core Rules

> `game-designer` and its supporting agents (per the routing table: `narrative-director`, `writer`, `art-director`, `systems-designer`) not consulted — Lean mode. Review manually before production.

1. **Ownership split (mirrors dependency GDDs)**: battle-system owns cursed-rune *emission* (`BattleResult.cursed_runes`, its Rule 20 — wrong/timeout, or `elapsed > 6000 ms` standard / `> 11000 ms` burst); forge-srs owns everything after emission: queue semantics, SRS scheduling, purification; accounts-backend owns queue *storage* (server-side); question-content owns the card *schema*. Forge never re-derives whether a word deserved its rune — it consumes the emitted list as-is.
2. **One rune per word**: a rune is identified by `word_id`. Dropping a word that is already in the queue does **not** create a duplicate — it *resets* that rune to Box 1 with a new due time (the player just failed it again; lapsed words restart the ladder). The rune's drop count increments for display.
3. **The ladder (real spacing)**: every rune sits in one of three boxes with a per-rune due timestamp:
   - **Box 1 — Fresh**: due `fresh_delay` after drop/reset (10 min default).
   - **Box 2 — Settling**: reached by passing a quiz card in Box 1; due `settle_delay` after the pass (24 h default).
   - **Box 3 — Purifiable**: reached by passing a quiz card in Box 2; due `master_delay` after the pass (72 h default).
   - A rune becomes **eligible** for a forge session only once `due_at ≤ now`. The purification quiz is the ladder's third review; a rune that passes it leaves the queue. Exact delay values are Section D formulas (systems-designer owns the numbers).
4. **Forge session = fixed 3 cards**: the player starts a session; the system auto-composes it — eligible runes first (oldest-due first), then `forge_filler` cards pad the session to 3 from the global glossary, **excluding every word currently in the player's rune queue** (question-content E10 contract; verified by this GDD's ACs). Direction mix is 2× EN→VI + 1× VI→EN across the 3 slots (game-concept lock), applied to filler cards too.
5. **Forge is a non-battle mode — no timer**: per Pillar 1's design test, forge cards carry no countdown and no speed multiplier. A card resolves on the player's answer only: correct, or wrong (there is no forge timeout). Recall quality is measured by correctness alone; pressure belongs to the arena.
6. **Per-card SRS outcome, all-or-nothing crafting outcome**: each rune card answered correctly advances its rune one box (new due time per Rule 3) — and for a rune already in Box 3, *advancing* means it is **purified and removed immediately**, even when the session's overall crafting verdict fails (a 2/3 session still purifies its correctly-recalled Box 3 runes); answered wrong, it resets to Box 1. The **Upgrade Stone** is granted only if the session is a **purification sitting**: **all 3 cards are correct AND all 3 are rune cards AND all 3 runes were Purifiable (Box 3) at composition** — the ladder's third review, the payoff Rule 3 promises (a session containing filler or any lower-box rune can advance its runes but can never grant the stone). A failed crafting attempt grants no stone and spends nothing — but its per-card outcomes (advancement, purification) still apply.
7. **Purification grant**: on a successful crafting session, exactly one Upgrade Stone is granted and the three runes are removed from the queue (marked purified in the player's records). The stone enters gear inventory; *applying* it to a slot is equipment's domain (provisional contract — equipment GDD not yet authored). The forge commit (runes consumed + stone granted) is one atomic commit point per accounts-backend AC-C1.
8. **Auto-composition at MVP**: the player cannot hand-pick which runes enter a session — the system selects the 3 oldest-due eligible runes (curation/burying is post-MVP). The queue screen itself is the "weakness list": the player sees every rune's word, box, and due countdown.
9. **No offline forge**: with no network connection the Forge is blocked with the offline state (accounts-backend AC-C5); queue reads come from the server, never a local cache of game state (accounts-backend AC-C6).
10. **Queue cap — none at MVP**: the queue grows unboundedly (every drop adds or resets a rune). Bounded natural play and the ladder's consumption path keep it finite; a cap is a post-MVP lever.

### States and Transitions

**Rune lifecycle** (per rune in the queue):

| State | Meaning | Enters via | Exits via |
|---|---|---|---|
| `Fresh (Box 1)` | Just dropped or just reset | BattleResult rune append; reset (re-drop or failed card) | Card correct → `Settling`; re-drop → stays `Fresh` (due refreshed) |
| `Settling (Box 2)` | Passed one spaced review | Card correct in `Fresh` | Card correct → `Purifiable`; card wrong / re-drop → `Fresh` |
| `Purifiable (Box 3)` | Passed two spaced reviews; due and eligible for a purification slot | Card correct in `Settling` | Purification quiz pass → removed (Purified); card wrong / re-drop → `Fresh` |
| `Purified` | Terminal — consumed, recorded | Successful purification quiz | — (leaves the queue; drop history remains) |

**Forge session** (client-side view state; the only durable change is the commit at resolution):

| State | Happens | Next |
|---|---|---|
| `Idle` | Queue screen; Forge entry allowed (online) | → `Composing` on player start |
| `Composing` | Auto-select 3 oldest-due eligible runes; pad with filler to 3; build card payloads | → `Quizzing` (immediate) |
| `Quizzing` | 3 cards shown sequentially, no timer; per-card answer records locally (client view state — nothing durable until `Resolved`) | → `Resolved` after card 3 |
| `Resolved` | Per-card SRS updates computed; stone verdict = (3 rune cards ∧ all correct); one atomic commit → server | → `Idle` (queue screen re-rendered) |

### Interactions with Other Systems

| System | Direction | Interface | Ownership |
|---|---|---|---|
| battle-system | Upstream (Hard) | `BattleResult.cursed_runes` — deduplicated `word_id` list (Rule 20); battle outcome | battle owns emission; forge owns consumption semantics |
| accounts-backend | Upstream (Hard) | Rune-queue storage (server-side); forge commit = runes consumed + stone granted, one atomic commit (AC-C1); rune-ID server validation (AC-C2); offline forge blocked (AC-C5); no local game-state cache (AC-C6) | storage theirs, queue semantics ours |
| question-content | Upstream (Hard) | `forge_recall` payload (`word_id`, `direction` en_vi\|vi_en, distractors ≥3) built from our selected runes; `forge_filler` drawn from the global glossary; filler draw excludes current rune-queue words (E10) | schema + filler pool theirs; rune selection + scheduling ours |
| equipment | Downstream (Hard) | Upgrade Stone item → gear `+level` on application. Forge grants the stone and stops there; equipment owns application, stat effects and the `+level` curve. *Confirmed by equipment's GDD (Approved 2026-11-09): it consumes Upgrade Stones from forge and owns the atomic application commit (its Core Rule 7).* | stone semantics ours; application theirs |
| ui-shell | Downstream (Soft) | Forge screen (queue "weakness list", session quiz view, purification payoff); rune-drop payoff also surfaces in battle's result modal | ui-shell owns screens; forge owns states/data |
| meta-progression | Downstream (Soft) | Indirect only: stones → gear `+levels` → hero stat growth. No direct interface at MVP | — |
| tower | None direct | Tower drops runes only *through* battles (tower encounters are battle-system sessions); forge is agnostic to the rune's battle source | — |

## Formulas

> `systems-designer` consulted (2026-11-09, DONE_WITH_CONCERNS): full F1–F3 proposal adopted with rulings on 10 findings — see session decision log. All delay constants are registry-owned tuning values; this section owns the math. `systems-designer` findings #2/#3/#7 deferred to Open Questions; #6/#8/#9 rejected (no change).

The **forge_rune_ladder** formula is defined as:

`eligible(rune, t) ⟺ rune.due_at ≤ t` and `box' / due_at'` per event:

```
on drop, reset, wrong, or re-drop:  box' = 1;  due_at' = now + D1
on card correct, box = 1:           box' = 2;  due_at' = now + D2
on card correct, box = 2:           box' = 3;  due_at' = now + D3
on card correct, box = 3:           rune → Purified (removed from queue; no due_at)
```

**Variables:**
| Variable | Type | Range | Source | Description |
|----------|------|-------|--------|-------------|
| `box` | int | {1, 2, 3} | calculated (stored per rune) | Ladder box: 1 = Fresh, 2 = Settling, 3 = Purifiable |
| `event` | enum | {drop, reset, correct, wrong, re_drop} | calculated (session resolution / BattleResult) | Triggering event |
| `now` | timestamp (ms) | [0, ∞) | calculated (**server** clock at commit) | Commit time — the atomic forge commit (AC-C1); client clock never gates eligibility |
| `D1` — `forge_fresh_delay` | constant | 5–60 min (default 10) | data file (registry) | Box 1 delay after drop/reset/wrong/re-drop |
| `D2` — `forge_settle_delay` | constant | 12–48 h (default 24) | data file (registry) | Box 2 delay after a Box 1 pass |
| `D3` — `forge_master_delay` | constant | 24–120 h (default 72) | data file (registry) | Box 3 delay after a Box 2 pass |
| `due_at` | timestamp (ms) | [now, ∞) | calculated | Next eligibility moment; stored per rune server-side |

**Output Range:** `box ∈ {1, 2, 3}` while queued; purified runes have no `due_at`. `due_at` is never in the past at write time.
**Example** (defaults, server clock): 19:00 battle drops "nhàn nhạt" (7.2 s > 6000 ms) → `box=1`, due 19:10. 19:14 player forges; eligible → card correct → `box=2`, due next day 19:14. Next day 19:30: correct → `box=3`, due +72 h. Third sitting 19:35: correct → **Purified**; wrong → `box=1`, due 19:45 (retryable this sitting).

**F1.3 — Selection order:** eligible runes sorted by `due_at` ascending; ties by original drop timestamp ascending, then `word_id` ascending — fully deterministic. Take the first `min(R, 3)`.

The **forge_session_composition** formula is defined as:

`rune_cards = min(R, 3); filler_cards = 3 − rune_cards`, where `R` = eligible rune count at composition. Slot directions are fixed per slot, never per card: `[slot 1: EN→VI, slot 2: EN→VI, slot 3: VI→EN]` — whichever content lands in slot 3 is tested VI→EN, filler included (game-concept lock). Filler draws uniformly from the global glossary minus every word currently in the player's rune queue (question-content E10), **without replacement** — filler cards are word-distinct from each other as well as from every rune card.

**Variables:**
| Variable | Type | Range | Source | Description |
|----------|------|-------|--------|-------------|
| `R` | int | [0, ∞) | calculated (server queue state) | Eligible runes (`due_at ≤ now`) at composition |
| `rune_cards` | int | 0–3 | calculated | `min(R, 3)`, in F1.3 order |
| `filler_cards` | int | 0–3 | calculated | `3 − rune_cards`; forge_filler draw, E10 exclusion applies |
| `forge_session_size` | constant | 3–5 (default 3) | data file (registry) | Cards per session; also the stone denominator (3/3 rune cards) |
| `forge_direction_mix` | constant | "2:1" | data file (registry) | EN→VI : VI→EN, slot-assigned (slots 1–2 EN→VI, slot 3 VI→EN) |

**Output Range:** `rune_cards + filler_cards = 3` (short sessions when the filler pool is exhausted — see Edge Cases; those can never grant a stone).
**Example:** R = 5 → 3 rune cards (3 oldest-due), 0 filler, 2 remain due (backlog). R = 2 → rune 1 → slot 1 (EN→VI), rune 2 → slot 2 (EN→VI), filler → slot 3 (VI→EN). R = 0 → **Forge entry is gated** (no session — see Edge Cases).

The **forge_time_to_first_stone** formula is defined as:

`T_floor = D1 + D2 + D3` (perfect play) and `E[T_rune] = (D1 + p·D2 + p²·D3) / p³` (expected wall-clock to purify one rune; K ~ Geometric(p³) full-ladder runs, per-run cost by Wald's identity), where `p` = per-card pass probability, i.i.d. across reviews.

**Variables:**
| Variable | Type | Range | Source | Description |
|----------|------|-------|--------|-------------|
| `p` | float | 0–1 | calculated (telemetry-estimated) | Per-review pass probability of the target learner |
| `D1`, `D2`, `D3` | constants | per F1 | data file (registry) | Ladder delays |
| `T_floor` | calculated | 96 h 10 min (defaults) | calculated | Minimum possible drop→stone time |
| `E[T_rune]` | calculated | 96–190 h (p ∈ [0.6, 1]) | calculated | Expected per-rune purification time |

**Output Range:** `T_floor` ≈ **4.0 days** at defaults — no behavior beats it. `E[T_rune]`: 7.8 days at p = 0.6, 5.3 days at p = 0.8, 4.0 days at p = 1. Stone gate is `p³` per purification sitting (0.216 at p = 0.6, 0.512 at p = 0.8); with a starting batch of ~8 runes cohorts desynchronize, so first stone lands ≈ **day 5–8 for a typical tester**. Worst-case lockstep bound `(D1 + p³·D2 + p⁶·D3)/p⁹` ≈ 36 days at p = 0.6 — an upper bound only; real cohorts break lockstep. Cadence note: once-daily play loses almost nothing vs. multi-session play (Box 1 retries fold into one sitting; D2/D3 dominate) — the forge's retention hook is the comeback, not the second session of a day.
**Example:** p = 0.8, defaults: cost/run = 0.167 + 0.8·24 + 0.64·72 = 65.4 h; E[K] = 1/0.512 = 1.95 → E[T_rune] = 127.8 h ≈ 5.3 days.

## Edge Cases

- **If fewer than 3 eligible runes exist at session start**: the session runs anyway — eligible runes take their slots and `forge_filler` pads the rest (F2). The session is practice-only; no stone is possible regardless of answers (Core Rule 6).
- **If there are zero eligible runes** (empty queue, or every rune still resting): the Forge **entry is gated** — the Start Session button renders **disabled** with gate copy: "The forge is cold — win runes in battle" (empty queue) or "All runes are resting — next ready in 3 h" (all resting, with the earliest `due_at` countdown). A filler-only session (R = 0) is never offered — it can never grant a stone and would be grinding mastered content (anti-pillar).
- **If the filler pool is exhausted** (`glossary size − rune-queue words < filler slots to pad` — so at glossary 32 with 31 words queued, 1 drawable filler still lets a full session run; at 32 queued, no filler slot can be filled): the session runs **short** (1–2 cards) using only the eligible runes; a short session can never grant a stone (Core Rule 6 requires a purification sitting). It is not an error. **This is a mainline case, not an exotic edge**: the glossary ships 32 entries and the queue is uncapped (Rule 10), so a tester running ~4–12 rune drops per sitting exceeds the glossary within 2–3 sittings (systems-designer Finding 10). The queue-word-padding alternative was rejected — it would contradict question-content's E10 filler contract.
- **If a word already in the queue is dropped again by a battle** while its rune is in Box 2 or Box 3: the rune resets to Box 1 with a fresh due time and its drop count increments — the reset wins even if the rune was not yet due (Core Rule 2).
- **If a rune is answered correctly but the session's crafting verdict fails** (another card was wrong, or the session contains filler or a lower-box rune): the correct rune's advancement **still applies** — per-card SRS outcome and the all-or-nothing stone verdict are independent (Core Rule 6). For a Box 3 rune this means it **purifies and leaves the queue even in a failed session** — the player keeps that progress; the stone alone is all-or-nothing. The failed attempt spent nothing — the purification it earned still counts.
- **If a filler card is answered wrong**: nothing happens — no penalty, no tracking, no rune. Filler cards have no progression effect in either direction (Core Rule 6).
- **If the session is abandoned mid-quiz** (tab close, refresh): no commit was sent — all per-card advancements are discarded and every rune stays exactly as it was before the session. Forge sessions are 3 untimed cards; redoing one is cheap, so there is no resume state (contrast: battle's discarded-session rule).
- **If the resolution commit fails** (network drop at the `Resolved` transition): the accounts-backend retry ladder applies (`retry_delay` F3, client-side; forge commits are among the commits it covers). On eventual success the commit applies **exactly once**. If the ladder exhausts and the client enters Unsaved-state, the commit is **retained** (accounts-backend AC-C3/C4 semantics — forge is deliberately *not* a carve-out): the queue keeps displaying server state with an unsaved marker over the affected runes, starting a new forge session is blocked until the player taps **"Thử lại"** (retry restarts the ladder at n=0 and applies the commit exactly once), and no partial advancement ever persists — the server is always pre-session or fully post-session.
- **If two devices forge concurrently** (rune consumed on the phone while the laptop's stale view still shows it): the second commit references a rune that no longer exists — the server rejects the whole commit (accounts-backend AC-C2, "nonexistent rune ID"), the client is informed, re-syncs the queue, and discards that session's outcome. The rune that survived wins; nothing double-consumes.
- **If a battle ends (emitting new cursed runes) while a forge session is open** in another tab: the open session's composition is a snapshot — it is unaffected and resolves normally; the new runes appear after the next queue sync. Emission and consumption never race because consumption is validated server-side at commit time.
- **If a rune's word is missing from the current content version** (a content update removed or re-keyed the word): the rune is **held back**, not deleted — session composition skips it and the queue screen marks it unavailable. It resumes eligibility if the word returns in a later content version. Deletion is a manual support action, never automatic.
- **If a rune reaches Box 3 but the player never returns**: it stays Purifiable indefinitely; `due_at` long past means always eligible, and oldest-due-first selection keeps it at the front of every session until consumed or reset.
- **If the client clock is manipulated** (device time set forward to skip waits): eligibility is decided by **server time** — the queue listing returns only runes due by the server's clock, and the commit re-validates consumption server-side. Client clock never gates a stone.
- **If the same word appears twice in one session** (as rune and as filler): impossible by construction — the filler draw excludes every word currently in the rune queue (question-content E10; asserted by this GDD's ACs).
- **If the same word would appear twice as two rune cards in one session**: impossible — one rune per word (Core Rule 2) and composition draws distinct runes.
- **If a timezone or DST boundary crosses a due time**: nothing special — all due times are absolute epoch milliseconds; the ladder is pure elapsed time with no "daily reset" semantics.

## Dependencies

**Upstream** (forge consumes these; their GDDs are the authority):

| System | Status | Coupling | Interface |
|---|---|---|---|
| battle-system | GDD Approved | Hard | `BattleResult.cursed_runes` (deduplicated `word_id` list, Rule 20 thresholds 6000/11000 ms strict); forge consumes the emitted list as-is and never re-derives it |
| accounts-backend | GDD Approved | Hard | Server-side rune-queue storage; forge commit (runes consumed + stone granted) is one atomic commit point (AC-C1); whole-commit rejection on bad rune IDs (AC-C2); offline forge blocked (AC-C5); no local game-state cache (AC-C6); commit failures route through the `retry_delay` ladder |
| question-content | GDD Approved | Hard | `forge_recall` payload (`word_id`, `direction`, distractors ≥3) and `forge_filler` (global-glossary draw); E10 filler-rune exclusion is part of the filler-pool contract and is *asserted here* (this GDD's ACs are its runtime verification); `min_global_glossary_size` 24 bounds the filler pool |
| equipment | **GDD not yet authored** | Hard (**provisional**) | Forge grants an Upgrade Stone item and stops; equipment owns application to a gear slot, the `+level` curve and stat recomputation. *Provisional contract, mirroring battle-system's treatment; confirmed when the equipment GDD lands (order #6).* |

**Downstream** (systems that depend on forge):

| System | Status | Coupling | Interface |
|---|---|---|---|
| ui-shell | Not started | Soft | Forge screen set: queue "weakness list", session quiz view, purification payoff; consumes queue state and session outcomes |
| meta-progression | Not started | Soft | Indirect: stones → gear `+levels` → stat growth; no direct forge interface at MVP |
| tower | Not started | None direct | Tower encounters drop runes only through battle-system; forge is source-agnostic |

**Circular-dependency resolution** (systems-index): battle ↔ forge ↔ equipment is a triangle, not a cycle of blockers — battle emits `BattleResult` events and never reads forge state; forge consumes only those events and never writes battle state; equipment's `LoadoutSnapshot` is published on loadout change and read by battle, not by forge. Each contract side is owned by exactly one GDD; forge owns the consumption side of `BattleResult`.

**Bidirectionality check**: battle-system's Dependencies table lists forge-srs (MVP/Hard, "battle emits; forge owns queue + SRS scheduling + `BattleResult` consumption semantics") ✓; accounts-backend lists forge-srs ("rune queue storage owned here; queue semantics owned by forge-srs") ✓; question-content lists forge-srs ("forge-srs owns rune selection + scheduling") ✓. Equipment cannot reciprocate yet — its GDD is authored next and must name forge-srs as upstream (Upgrade Stone supply).

## Visual/Audio Requirements

> `art-director` not consulted — Lean mode (Progression category, spawn not mandatory). Review manually before production.

**Visual events** (web-native: CSS transforms/keyframes + icon set; no canvas required at MVP):

| Event | Visual | Intensity | Duration |
|---|---|---|---|
| Card correct (rune) | Rune glyph cracks → "purifying" glow step; box badge ticks up | Low–medium (progress, not combat) | 300–500 ms |
| Card wrong (rune) | Rune darkens, cracks reseal; "cursed" badge reasserts | Low (setback, not punishing — Pillar 2 tone) | 250–400 ms |
| Purification payoff | The 3 rune cards converge into a single Upgrade Stone; stone lands in a brief inventory flourish | **High — the Pillar 2 payoff moment of the whole loop** | 800–1200 ms |
| Filler card result | Neutral tick/cross, no rune imagery (it was never cursed) | Minimal | 200–300 ms |
| Box advance on queue screen | Due-countdown pill swaps to next-box label | Minimal (ambient) | — |

**Audio (MVP set, ≤ 4 cues)**: purify chime (payoff, brightest cue in the forge), card-correct tick, card-wrong dull thud (softer than battle's wrong-answer cue — the forge is a workshop, not an arena), stone-granted flourish (may share the purify chime's tail). Cue names and mixing specs are a `sound-designer` task post-GDD; battle's audio set owns the arena's cues and the forge must stay quieter than it.

**Art-bible alignment**: the forge's visual language is *transmutation, not destruction* — cursed (dark, cracked) → purified (warm, molten → stone). Same rune glyph asset family battle uses for cursed-rune drops, in its purified variant, so the player recognizes "their" word as it travels from battle result modal to queue to stone.

## Game Feel

The forge is the game's **exhale**. Battles are timed, scored and pressurized; the forge has deliberately no timer, no combo, no damage — the only quantitative feedback is the box badge moving and, at the end, a stone. Input responsiveness is conversational: immediate answer highlight (≤ 100 ms), then the per-card resolution animation, then the next card; nothing interrupts typing or selection mid-card. The emotional target is *quiet satisfaction*: "these were my failures and I just turned them into a sword upgrade." The payoff moment (Purification) is the single loudest feedback in the system and the loop's visible proof that losing was worth it. What must NOT happen: the forge feeling like homework — if the queue screen reads as a to-do list, the due-countdown language ("ready in 3 h") should lean on anticipation ("resting — ready soon"), not obligation.

## UI Requirements

| Screen / element | Purpose | Content |
|---|---|---|
| **Forge queue screen** ("weakness list") | Hub; Pillar 2 made visible | Every rune: word, direction, box badge (Fresh/Settling/Purifiable), due countdown ("ready" / "resting · 3 h"), drop count; Start Session button (disabled when gated: offline, empty queue, all resting) |
| **Session view** | 3-card quiz | Card per `forge_recall`/`forge_filler` payload (multiple-choice ≥ 3 distractors or typed mode); no timer UI; per-card result flash; progress pips 1/3 → 3/3 |
| **Resolution modal** | Verdict + payoff | Crafting success: stone-granted animation + "3 runes purified"; practice outcome: per-card results with next-due times; failure: which cards were wrong, runes returned to queue with reset badge |
| **Offline state** | Gate | Forge blocked message per accounts-backend offline rules |

**📌 UX Flag — forge-srs**: This system has UI requirements. In Phase 4 (Pre-Production), run `/ux-design` to create a UX spec for each screen above **before** writing epics — stories should cite `design/ux/[screen].md`, not this GDD. Screenshot evidence for these screens belongs in `production/qa/evidence/` per the UI evidence gate.

## Cross-References

| Referenced GDD | What it provides | Sections referenced here |
|---|---|---|
| design/gdd/battle-system.md | Cursed-rune emission contract | Detailed Design Rule 20; Dependencies (forge row); Interactions |
| design/gdd/accounts-backend.md | Queue storage, commit/validation/offline rules | Core Rules 5 (commit points), Interactions; AC-C1, AC-C2, AC-C5, AC-C6; `retry_delay` (F3) |
| design/gdd/question-content.md | Card schema + filler pool | `forge_recall`/`forge_filler` payloads (Core Rule 4); E10 filler-rune exclusion; F4 glossary minimum |
| design/gdd/equipment.md *(not yet authored)* | Upgrade Stone application, `+level` curve | Provisional contract in Interactions/Dependencies |
| design/gdd/game-concept.md | Forge loop lock: 3 runes → stone via 3-card quiz (2× EN→VI, 1× VI→EN) | Core Rules 4, 6, 7; Pillars 1–3 design tests |
| design/gdd/systems-index.md | forge-srs row + high-risk row (real SRS scheduling) | Resolved by Core Rule 3 (real ladder) |
| design/registry/entities.yaml | `min_global_glossary_size`, `retry_delay`, `battles_per_typical_session` | Sections D, E, F |

## Acceptance Criteria

> **Source**: drafted 2026-11-09 by `qa-lead` (DONE_WITH_CONCERNS, 11 findings), in the battle-system/opponent-ai house format. Both FIX FIRST contradictions were ruled the same day and the affected text repaired: the stone gate gained its Box-3 clause (Core Rule 6) and the commit-failure Edge Case was aligned to accounts-backend's retained-commit ladder. Findings 3–5 applied as text repairs; notes 6–9 applied or consciously accepted (short sessions are EN→VI-heavy by construction — accepted at MVP); notes 10–11 resolved by the Open Questions section and Phase-5 registration respectively. **Legend**: **[unit]** = vitest, deterministic, DI-injected **fake server clock** (eligibility is server time — no criterion reads the device clock) and injected collaborators, home `tests/unit/forge-srs/`, BLOCKING; **[integration]** = automated cross-system test against the server queue store and commit path, BLOCKING; **[statistical]** = not used — forge's only math is closed-form, pinned as a unit assertion (FS25); **[screenshot]** = retained in `production/qa/evidence/`, BLOCKING at every `qa.level`. *(provisional)* = boundary with equipment (undesigned, Interactions row) — FS16 only.

Shared numbers, restated so no criterion requires reading other sections: D1 `forge_fresh_delay` = 10 min, D2 `forge_settle_delay` = 24 h, D3 `forge_master_delay` = 72 h (registry bands 5–60 min / 12–48 h / 24–120 h); session size 3 (`forge_session_size`); slot directions fixed — slot 1 EN→VI, slot 2 EN→VI, slot 3 VI→EN (`forge_direction_mix` "2:1"); a rune is eligible ⟺ `due_at ≤ server_now`, inclusive; a **purification sitting** is a session whose 3 rune cards were all Box 3 at composition (Core Rule 6); global glossary MVP bank 32 entries, build-gate floor 24 (`min_global_glossary_size`); retry ladder defaults B = 1 s, J_max = 0.5 s, D_max = 30 s, N = 5 (accounts-backend F3, `retry_delay`; exhausted banner "Lưu không thành công — Thử lại"). Criteria pin the defaults above; a balance-pass retune re-derives the affected counts. **Determinism**: delays are server data — unit criteria advance the fake server clock; the delay-bound integration criterion (FS26) runs on the **QA server profile**, which shortens D1–D3 to minutes-scale; **no criterion waits real hours and none asserts against device time**. The filler draw is the forge module's only randomness consumer and is DI-injected like every collaborator.

- **FS1 [unit] — Cursed runes are consumed as emitted, never re-derived (Core Rule 1).** **GIVEN** a `BattleResult` whose `cursed_runes` carries a word — as it would from a wrong answer, a timeout, or a correct-but-slow 6.1 s answer, with no flag distinguishing them — **WHEN** the queue syncs, **THEN** the queue holds exactly one rune for that word at Box 1 with `due_at = server_now + D1`, identical in all three cases; **and THEN** a static assertion confirms the forge module contains no 6000/11000 ms thresholds and no correctness/elapsed re-derivation, and forge issues no call to battle or question-content to validate an emission; **and GIVEN** the same word emitted from a tower-stage battle and from a ranked duel, **THEN** the resulting runes are indistinguishable (forge is source-agnostic).
- **FS2 [unit] — One rune per word; a re-drop resets (Core Rule 2 + Edge Case re-drop in Box 2/3).** **GIVEN** a queued rune at Box 2 (and, in a twin fixture, Box 3) that is **not yet due**, **WHEN** its word is dropped again by a battle, **THEN** the queue still holds exactly one rune for that word — Box 1, `due_at = server_now + D1`, drop count incremented, queue length unchanged; **and GIVEN** a Box 1 rune re-dropped, **THEN** it stays Box 1 with `due_at` refreshed to `server_now + D1` and its drop count incremented.
- **FS3 [unit] — Ladder transitions and due stamps (Core Rule 3 + formula F1).** **GIVEN** the fake server clock and a rune at Box b, **WHEN** its card is answered correct, **THEN** Box 1 → Box 2 with `due_at = now + D2`; Box 2 → Box 3 with `due_at = now + D3`; Box 3 → Purified (removed from the queue, no `due_at`, recorded); **and WHEN** its card is answered wrong at any box, **THEN** Box 1 with `due_at = now + D1`; **and WHEN** eligibility evaluates at `due_at − 1 ms` and at exactly `due_at`, **THEN** ineligible, then eligible (inclusive `≤`); **and THEN** every written `due_at` lies in the future at write time.
- **FS4 [unit] — Oldest-due selection with total tie-breaking (Core Rules 3, 8 + formula F1.3 + Edge Case Box-3-never-returned).** **GIVEN** a queue of 5 eligible runes with due times crafted to include exact ties, **WHEN** a session composes, **THEN** selection is `due_at` ascending, ties by original drop timestamp ascending then `word_id` ascending, and the first `min(R, 3)` are taken — the same queue state always yields the same 3; **and GIVEN** a Box 3 rune whose `due_at` is months past (player never returned), **THEN** it stays Purifiable, remains eligible, and fronts every session until consumed or reset.
- **FS5 [unit] — Composition: min(R, 3) runes, filler pads, slot-fixed directions (Core Rule 4 + formula F2).** **GIVEN** R = 5 eligible runes, **WHEN** a session composes, **THEN** it carries 3 rune cards in F1.3 order and 0 filler, 2 runes remain queued, and `rune_cards + filler_cards = 3`; **and GIVEN** R = 2, **THEN** slots 1–2 carry the two runes (both EN→VI) and slot 3 carries a filler card (VI→EN); **and THEN** every card's direction equals its slot's fixed direction whichever content landed there — direction is slot data, never derived from the word; every card payload is `forge_recall` (rune) or `forge_filler` (filler) carrying `word_id` + `direction`.
- **FS6 [unit] — Filler never draws a queue word; draws are word-distinct (Core Rule 4 + formula F2 + Edge Cases rune+filler-same-word and rune+rune-same-word; question-content's E10 hand-off).** **GIVEN** a queue whose word set W is known (including the session's selected runes), **WHEN** filler slots compose across a fixture sweep of sessions with R ∈ {1, 2, 3, 5} and the injected RNG, **THEN** every filler `word_id` resolves in the global glossary and lies outside W — so a queue word never appears as filler and the session's rune cards and filler cards are word-disjoint; **and THEN** filler cards are word-distinct from each other (draws without replacement, F2); **and GIVEN** the 3 selected runes, **THEN** their `word_id`s are pairwise distinct (one rune per word).
- **FS7 [unit] — Zero eligible runes gates entry; no filler-only session exists (Core Rule 4 + Edge Case zero-eligible).** **GIVEN** an empty queue, **WHEN** the Forge renders, **THEN** no session can start — Start Session renders disabled with the empty-queue gate copy; **and GIVEN** a queue where every rune has `due_at > server_now`, **THEN** entry is likewise gated and the gate carries the earliest `due_at` countdown (rendered value = earliest due − server now under the fake clock); **and WHEN** session start is invoked with R = 0, **THEN** the composer refuses — no session is ever composed from filler alone.
- **FS8 [unit] — Fewer than 3 eligible runes still runs, practice-only (Core Rule 6 + Edge Case fewer-than-3).** **GIVEN** R = 2 and one filler pad, **WHEN** all 3 cards are answered correctly, **THEN** the session verdict is practice-only — no Upgrade Stone — while per-card advancement applies in full (FS3 transitions); a short roster is never an error.
- **FS9 [unit] — Filler pool exhausted: short session, never a stone (Core Rule 6 + formula F2 output range + Edge Case filler-exhausted).** **GIVEN** a 32-entry glossary with all 32 words queued and 2 eligible runes (the draw can fill none of the 1 filler slot), **WHEN** a session composes, **THEN** it runs with exactly 2 rune cards and 0 filler — a short session, not an error; **and WHEN** both cards are answered correctly, **THEN** no stone is granted (no purification sitting is possible); **and THEN** composition never pads to 3 with a queue word — the E10 exclusion holds at exhaustion too; **and GIVEN** the boundary interior (glossary 32, queue 31, filler need 1), **THEN** the session runs full — exhaustion triggers exactly when `glossary − queue < filler slots`.
- **FS10 [unit] — Per-card outcome is independent of the crafting verdict (Core Rule 6 + Edge Case correct-in-a-failed-session).** **GIVEN** 3 rune cards where cards 1–2 are answered wrong and card 3 is a Box 3 rune answered correctly, **WHEN** the session resolves, **THEN** the verdict fails (no stone) while card 3's rune purifies and leaves the queue and cards 1–2's runes reset to Box 1 (`due_at = now + D1`) — a failed session still applies every per-card outcome.
- **FS11 [unit] — The stone gate requires a purification sitting (Core Rule 6, Box-3 clause).** **GIVEN** the fixture sessions (a: 3 Box 3 runes, 3/3 correct · b: 2 Box 3 + 1 Box 2, 3/3 correct · c: 3 fresh Box 1 runes at `t = D1`, 3/3 correct · d: 3 Box 3 runes, 2/3 correct · e: 3/3 correct with a filler in slot 3 · f: a 2-card short session, all correct), **WHEN** each resolves, **THEN** exactly (a) grants a stone — exactly one — and (b)–(f) grant none; **and THEN** per-card outcomes still apply in every session (b: the Box 2 rune advances to Box 3 and both Box 3 runes purify; c: all three advance to Box 2; d: two purify, one resets to Box 1; e: rune cards resolve per-box and the filler is inert; f: both runes advance or purify per box) — the stone is the purification sitting's payoff, never a fast ladder bypass.
- **FS12 [unit] — Filler cards have no progression effect in either direction (Core Rule 6 + Edge Case filler-wrong).** **GIVEN** a filler card answered wrong (and, in a twin session, answered correctly), **WHEN** the session resolves, **THEN** no rune is created, reset or advanced for the filler word, no tracking record references it, and the queue delta attributable to the filler is empty — its only mechanical effect is the stone ineligibility it forces.
- **FS13 [unit] — No timer, no speed, no timeout (Core Rule 5).** **GIVEN** a session advanced by the fake server clock in +30 min jumps between answers, **WHEN** each card resolves, **THEN** outcomes are identical to the un-advanced run — elapsed time feeds no forge formula; **and GIVEN** a card left unanswered indefinitely, **THEN** it never resolves itself (no forge timeout exists); **and THEN** a static assertion confirms no countdown/timer UI element and no elapsed-based multiplier or speed input anywhere in the forge module.
- **FS14 [unit] — An abandoned session discards everything (Edge Case mid-quiz abandonment + States).** **GIVEN** a session disposed after k of 3 cards answered locally (tab close/refresh simulated, k ∈ {1, 2}), **WHEN** the queue next syncs, **THEN** every rune is exactly as before the session — no advancement, no reset, no commit in flight — and no resume state exists: a fresh session recomposes from the current queue.
- **FS15 [integration] — The forge commit is atomic: runes consumed + stone granted together (Core Rule 7 + accounts-backend AC-C1's shape — verified here).** **GIVEN** a purification sitting answered 3/3, **WHEN** it commits while online, **THEN** exactly one commit is sent for the session and the server afterwards shows the session's purified runes removed and marked Purified AND exactly one Upgrade Stone in the gear inventory — both halves or neither; **and GIVEN** a forced server failure injected mid-commit, **THEN** server state is identical to pre-commit: no runes-consumed-without-stone, no stone-without-consumption.
- **FS16 [unit] — Forge grants the stone item and stops there (Core Rule 7 + equipment's authored contract, confirmed 2026-11-09).** **GIVEN** a successful session's commit payload, **WHEN** it is inspected, **THEN** it grants exactly one Upgrade Stone item — id/type per the shared item vocabulary, count 1, traceable to the granting session — and carries no gear-slot target, no `+level` value and no stat recomputation: application is equipment's domain. *(provisional: the equipment GDD is unauthored; written against the Interactions row, re-verify when it lands.)*
- **FS17 [integration] — A stale rune ID rejects the whole commit; nothing double-consumes (Core Rule 7 + accounts-backend AC-C2 + Edge Case two-devices — verified here).** **GIVEN** device A commits a session consuming rune r while device B's stale view still shows r eligible, **WHEN** B's commit arrives referencing r, **THEN** the server rejects B's commit **in full** — no part of it, including B's other rune outcomes, applies — informs the client, and B re-syncs to the server queue (r absent, A's outcomes present) and discards its session's outcome; **and THEN** r is consumed exactly once server-side.
- **FS18 [integration] — The server clock gates everything; client clock manipulation is inert (Core Rule 3 + formula F1's `now` + Edge Case client-clock — verified here).** **GIVEN** a rune with `due_at = T` by server time and a client whose device clock is set forward past T by any amount, **WHEN** the queue lists and sessions compose, **THEN** the rune is still gated (the listing serves only runes due by the server clock) and start refuses it; **and WHEN** a hand-crafted commit claims eligibility the server does not see, **THEN** the commit re-validates consumption server-side and is rejected whole (FS17's shape); **and THEN** with the device clock forward by days, purification still cannot occur before server-elapsed D1 + D2 + D3 since drop.
- **FS19 [unit] — Pure elapsed time; no calendar semantics (Edge Case timezone/DST).** **GIVEN** the fake server clock jumped forward across a DST boundary (and, in a twin, across a timezone change) between drop and due, **WHEN** eligibility evaluates, **THEN** `due_at` is the plain epoch sum (write time + delay) and flips at exactly that instant; **and THEN** a static assertion confirms no daily-reset or local-midnight logic exists in the module.
- **FS20 [unit] — A rune whose word left the content version is held back, never deleted (Edge Case missing-content-version).** **GIVEN** a queue rune whose `word_id` is absent from the current content version, **WHEN** sessions compose, **THEN** the rune is skipped (the next-oldest eligible rune takes its slot) and the queue screen marks it unavailable; **and GIVEN** a later content version restores the word, **THEN** the rune resumes with box and `due_at` unchanged; **and THEN** no code path deletes it — deletion is a manual support action (static assertion).
- **FS21 [unit] — A battle's mid-session emission cannot perturb an open session (Edge Case battle-ends-while-open).** **GIVEN** an open session composed as snapshot S, **WHEN** new cursed runes drop mid-session, **THEN** the open session resolves exactly against S and its commit references only S's runes; **and WHEN** the queue next syncs, **THEN** the new runes appear — never retroactively inside the closed session.
- **FS22 [integration] — Commit-failure: retry applies exactly once; exhaustion retains, never discards (Core Rule 9's commit path + Edge Case commit-failure + accounts-backend F3/AC-C3/C4 — verified here).** **GIVEN** the resolution commit failing at the endpoint with the ladder's delays injected, **WHEN** a later attempt succeeds, **THEN** the session applies exactly once — a replayed/duplicated commit is a server-side no-op, and at no ladder point does partial advancement persist (server state is always pre-session or fully post-session); **and GIVEN** the ladder exhausting into Unsaved-state, **THEN** the commit is **retained** (not discarded), the queue shows the unsaved marker over the affected runes, new forge session start is blocked, **and WHEN** the player taps "Thử lại", **THEN** the ladder restarts at n=0 and the commit applies exactly once — forge follows accounts-backend's ladder with no carve-out.
- **FS23 [integration] — Offline forge is blocked and the queue is never local (Core Rule 9 + accounts-backend AC-C5/AC-C6).** **GIVEN** no network connection, **WHEN** the player opens the Forge, **THEN** entry is blocked with the offline state (no session starts, the queue cannot refresh); **and GIVEN** normal online play, **WHEN** browser storage is inspected, **THEN** localStorage/sessionStorage/IndexedDB hold no rune-queue or forge state (session token + versioned content cache only); **and GIVEN** a fresh browser profile logging into the same account, **THEN** the queue equals the server's exactly.
- **FS24 [unit] — The queue is uncapped at MVP (Core Rule 10).** **GIVEN** 40 distinct words dropped across fixtures, **WHEN** the queue syncs, **THEN** it holds 40 runes — no eviction, no truncation, no error; **and THEN** no `forge_queue_cap` constant or cap check exists in data or code (a cap would be a deliberate post-MVP addition).
- **FS25 [unit] — Published time-to-stone numbers match the math (formula forge_time_to_first_stone).** **GIVEN** the defaults D1 = 10 min, D2 = 24 h, D3 = 72 h and p ∈ {0.6, 0.8, 1.0}, **WHEN** `T_floor = D1 + D2 + D3` and `E[T_rune] = (D1 + p·D2 + p²·D3) / p³` compute, **THEN** `T_floor` = 96 h 10 min and `E[T_rune]` ≈ 187.4 h / 127.8 h / 96.2 h — matching the section's stated 7.8 / 5.3 / 4.0 days and its 96–190 h envelope at the stated rounding; the worst-case lockstep bound ≈ 36 days at p = 0.6 is asserted as a bound only (deterministic arithmetic, twin of opponent-ai OA17).
- **FS26 [integration] — T_floor is a hard floor under perfect play (formula forge_time_to_first_stone + Core Rule 3; QA-profile delays).** **GIVEN** the QA server profile (D1/D2/D3 shortened to minutes-scale — delays are server data) and a freshly dropped rune with perfect play, **WHEN** the player reviews at the earliest moment each rung allows, **THEN** the rune purifies at server-elapsed exactly D1 + D2 + D3 after drop — each commit re-stamps `due_at` from the server clock and no path reviews a rune early; no play pattern beats the floor. *(Runs on the QA profile; never waits real 24/72 h.)*
- **FS27 [screenshot] — The queue screen reads as the weakness list (Core Rule 8 + UI Requirements + Game Feel).** **GIVEN** a fixture queue holding runes in all three boxes, **WHEN** the queue screen renders online, **THEN** every rune shows its word, direction, box badge (Fresh/Settling/Purifiable), due countdown ("ready" / "resting · 3 h" form) and drop count, with Start Session enabled; **and GIVEN** the offline state and the empty-queue state, **THEN** the respective gate renders — disabled button with its copy (FS7/FS23); **and THEN** no hand-picking affordance exists anywhere on the screen (auto-composition only). Retained screenshots in `production/qa/evidence/`.
- **FS28 [screenshot] — The resolution modal carries all three verdicts (Core Rules 6–7 + UI Requirements + Visual/Audio).** **GIVEN** a purification sitting answered 3/3, **WHEN** the modal renders, **THEN** the stone-granted payoff animation and "3 runes purified" show — the loop's loudest feedback moment; **and GIVEN** a practice outcome and a failed session, **THEN** the modal shows per-card results with next-due times, and which cards were wrong with their runes' returned/reset badges, respectively. Retained screenshots in `production/qa/evidence/`.

**Totals: 28 criteria — 20 unit, 6 integration (FS15, FS17, FS18, FS22, FS23, FS26), 2 screenshot.**
**Coverage: Core Rules 1→FS1, 2→FS2, 3→FS3/FS4/FS18/FS19/FS26, 4→FS5/FS6/FS7, 5→FS13, 6→FS8–FS12, 7→FS15–FS17, 8→FS4/FS27, 9→FS22/FS23, 10→FS24 — all ≥ 1. Formulas: forge_rune_ladder→FS3/FS4/FS19/FS25/FS26; forge_session_composition→FS5/FS6/FS8/FS9; forge_time_to_first_stone→FS25/FS26. Edge Cases: fewer-than-3→FS8; zero-eligible→FS7; filler-exhausted→FS9; re-drop→FS2; correct-in-failed-session→FS10; filler-wrong→FS12; abandonment→FS14; commit-failure→FS22; two-devices→FS17; battle-while-open→FS21; missing-word→FS20; Box-3-never-returned→FS4; client-clock→FS18; rune+filler-same-word→FS6; rune+rune-same-word→FS6; DST→FS19 — all 16 mapped.**
**Owned cross-system contracts, discharged here:** E10 filler-rune exclusion at runtime (question-content hands it over — its build gate cannot see a rune queue) → FS6; the atomic forge commit in AC-C1's shape → FS15; whole-commit rejection on a stale rune ID in AC-C2's shape → FS17; server-clock eligibility → FS18; the retained-commit ladder's forge side (AC-C3/C4 shape) → FS22; offline gate + no-local-cache per AC-C5/C6 → FS23.
**Asserted elsewhere (deliberately not criteria here):** cursed-rune emission and the 6000/11000 ms thresholds (battle-system BS27/BS28 — forge consumes, never re-derives); the retry ladder's own arithmetic and the Unsaved-state banner (accounts-backend AC-C3/C4); forge screen layouts beyond the two pinned readouts (ui-shell + its UX specs per the GDD's UX flag); stone application to a gear slot (equipment, when authored — FS16 stops at the grant).

## Open Questions

| ID | Question | Owner | Target |
|---|---|---|---|
| OQ-FS1 | QA build override for ladder delays (e.g., 1 min / 1 h / 2 h profile) — shipped defaults make drop→stone unobservable in a QA sitting (~4-day floor). due_at is plain server data; the override is build config, not a shipped value. (systems-designer Finding 2) | qa-lead + tools-programmer | Technical Setup |
| OQ-FS2 | Player-facing first-forge onboarding: compressed delays for the player's *first* rune cohort (e.g., settle 1 h, master 4 h) so a first-day tester sees a stone. Preserves the steady-state waiting hook but adds a special case the SRS carries forever. Owner call vs. OQ-FS1's QA-only override. (Finding 3) | game-designer (user) | before playtest |
| OQ-FS3 | Oldest-due rune to the VI→EN slot when R < 3 — currently runes occupy slots 1–2 (EN→VI) whenever the session is short, so a rune can be purified having rarely faced VI→EN. Optional pedagogy refinement; slight composition complexity. (Finding 7) | game-designer (user) | post-MVP depth pass |
| OQ-FS4 | Upgrade Stone item shape: `word_id[]` provenance (the 3 purified words), rarity (fixed vs. earned), granted-vs-applied semantics — equipment owns application; the stone's *item* fields are needed by both GDDs and the registry. Coordinate at the equipment GDD (order #6). | economy-designer + equipment GDD | equipment authoring |
| OQ-FS5 | Telemetry: purge-funnel events (drop → Box 1 pass → Box 2 pass → purified → stone applied) — needed to validate F3's p estimate and the day-5–8 first-stone claim against real players. | analytics-engineer | Pre-Production |
| OQ-FS6 | Retention surface honesty: F3's cadence note says the forge alone won't drive a same-day second session (24 h/72 h dominate). Confirm daily quests/streaks (meta-progression) carry the multi-session hook instead of shortening these delays. | game-designer (user) | meta-progression authoring |
