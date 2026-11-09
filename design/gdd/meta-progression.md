# Meta-Progression

> **Status**: In Design
> **Author**: user + economy-designer/systems-designer agents (via /design-system)
> **Last Updated**: 2026-11-09
> **Last Verified**: 2026-11-09
> **Implements Pillar**: Pillar 2 (Mistakes Are Materials) — quest routing; Pillar 4 (Honest Ghosts) — honest quest/daily framing

## Summary

Meta-progression is LexiQuest's economy layer: the gold and XP ledgers every
battle feeds, the flat 1000-XP hero-level curve, the four-quest daily board
with manual claim and silent midnight expiry, and the study-board counters
(daily streak, mastered words) that ranked-league will later read. It is pure
ledger logic — event-driven, seed-idempotent, committed through
accounts-backend — and deliberately faucet-only at MVP: no sinks exist, so no
reward caps are needed yet (the Alpha question is OQ-MP1). Final reward values
are owned here (adopted from battle-system Rule 21's emission), and the tower
quest keys on encounter-typed victories rather than tower's first-clear-only
floor event so it stays completable every day.

> **Quick reference** — Layer: `Feature` · Priority: `Vertical Slice` · Key deps: `battle-system, accounts-backend`

## Overview

Meta-progression is LexiQuest's economy layer: it owns the gold and XP ledgers
that battle reward events feed, the hero-level curve those XP totals produce,
the daily quest board that gives each session a goal, and the study-board
counters (mastered words, daily streak) ranked-league will later read. It is a
pure rule-and-ledger system — no engine surface, no real-time behaviour. The
player feels it directly (quest board on Home, gold/XP/level rising after every
battle, a claim button paying out), while the machinery underneath is passive:
battle-system emits reward events inside the committed `BattleResult`, and this
system's rules decide how those events touch the ledgers and the quest board.
Without it, victories would pay nothing, the vertical slice would have no
"visible XP/gold/quest progression", and the session-level loop (30–120 min:
daily quests + tower + forge) from the game concept would have no spine.

This GDD also resolves the two questions routed here by sibling GDDs: **final
reward values** (battle-system Rule 21 emitted its prototype values flagged
provisional and handed ownership of the final numbers to this system) and
**OQ-TW1** (tower replay-farm exposure — decided here, see Core Rule 6).

> **Quick reference** — Layer: `Feature` · Priority: `Vertical Slice` · Key deps: `battle-system, accounts-backend` (upstream) · `ui-shell` (downstream, MVP display) · `ranked-league` (downstream, Alpha study-board consumer)

## Detailed Design

### Core Rules

1. **Ownership.** Meta-progression owns exactly four things: (a) the **gold
   ledger**, (b) the **XP ledger + hero level**, (c) the **daily quest board**
   (generation, progress tracking, claiming, daily reset), (d) the **study-board
   counters** (mastered-words set, daily streak). It does NOT own reward
   *emission* (battle-system Rule 21 owns emission), RP tier math (ranked-league),
   storage (accounts-backend), or any spend semantics — no sinks exist at MVP
   (Rule 5).
2. **Ledger application is event-driven and idempotent.** Reward values are
   battle-emitted events consumed inside the committed `BattleResult`; meta
   applies them exactly once, keyed on the battle's persisted seed (the same
   idempotency anchor accounts-backend commits against). A re-delivered
   `BattleResult` produces zero ledger change. Meta never recomputes a reward
   from battle state — it applies what the event says, and an event carrying an
   unknown reward type is rejected fail-fast (naming the emitter), not clamped.
3. **Final reward values (resolves battle-system Rule 21's "provisional" flag).**
   The prototype values are adopted as MVP-final and owned here from now on:
   victory → gold 120 (tower-boss stage: gold 250), xp 180; defeat → gold 40,
   xp 60. Any future retune edits THIS GDD (and battle's emission table follows);
   battle's copy stays a mirrored emission table, not the authority.
4. **Hero level.** `level = floor(cumulative_xp / xp_per_level) + 1` with
   `xp_per_level = 1000` (flat, prototype-validated). At MVP level gates nothing:
   tower unlocks are boss-clear-only (tower Core Rule 8 — "no purchases/level
   gates"), so XP/level is visible progression and account identity, not a gate.
   A scaling curve is a post-MVP knob, not an open question here.
5. **Gold is faucet-only at MVP — deliberate.** No sinks exist: forge costs
   Upgrade Stones (never gold, forge-srs Core Rule 7), equipment application is
   free, and game-concept explicitly excludes shop/monetization systems from
   MVP. Farming gold therefore inflates a number that does nothing — which is
   why Rule 6's answer is safe at this tier.
6. **OQ-TW1 resolved: no replay caps or diminishing returns at MVP.** Cleared
   tower floors replay for fixed rewards (120/180 stage, 250/180 boss) with
   unlimited retries, and meta-progression adds no cap, decay, or daily limit —
   with zero sinks the farm is economically inert, and any cap would be
   untestable against player behaviour we have no telemetry for. The question
   **re-opens at Alpha** when gold sinks and ranked stakes arrive
   (OQ-MP1, owner: meta-progression + economy-designer). Tower's row may cite
   this as its answer.
7. **Daily quest board — fixed MVP set, honest framing (Pillar 4).** Four
   quests per day, generated from one fixed MVP set:
   | Quest | Goal | Reward | Progress source |
   |---|---|---|---|
   | "Thắng 2 trận" (Win 2 battles) | 2 | 150 gold | battle victory events |
   | "Rèn 5 từ bị lỗi trong Lò Rèn" (Forge 5 missed words) | 5 | 120 gold | forge rune-card correct outcomes |
   | "Đạt COMBO ×3 trong một trận" (Reach COMBO ×3 in one battle) | 1 | 80 gold | max-combo-per-battle ≥ 3 |
   | "Thắng 1 trận Tháp" (Win 1 tower battle) | 1 | 100 gold | committed victory with encounter ∈ {tower_stage, tower_boss} |
   The prototype's "Thắng 2 trận **PvP**" label is corrected: there is no
   real PvP at MVP and the UI must not fake it (Pillar 4). The tower quest's
   source is deliberately a **battle-type key, not tower's `floor_cleared`
   event** — that event fires first-clear-only (tower Core Rule 9), and with
   `tower_floor_count` = 4 a floor-keyed quest is permanently uncompletable
   after ~4–5 days of play, a dead slot on Home forever (systems-designer
   finding, resolved at authoring). A tower-battle win is achievable every day
   forever: tower replays are unlimited and defeat costs nothing (tower Core
   Rules 6–7). Reward values keep the prototype's proportions
   (win > forge > tower > combo).
8. **Quest progress is event-mapped, never self-computed.** Each quest keys on
   exactly one progress source (table above). Sources: battle events from a
   *committed* `BattleResult` (victory; max combo per battle — combo reached in
   a lost battle still counts, the quest keys on the combo, not the win); forge
   rune-card correct outcomes read from forge's committed session records
   (stored via accounts-backend — meta reads the records, forge exposes no live
   interface, respecting forge-srs's "no direct interface at MVP" row);
   and tower-encounter victories read from the committed `BattleResult`'s
   encounter type (battle Core Rule 2 — the result already knows it, Rule 21's
   RP events key on it). Tower's `floor_cleared` event is **not** a quest
   source: it fires first-clear-only (tower Core Rule 9), which would strand
   the quest once all floors are cleared.
9. **Claim is the only manual act — and a commit point.** A quest reaching its
   goal becomes Claimable; claiming grants the reward in one atomic commit
   (accounts-backend commit family), marks the quest Claimed, and clamps
   progress at goal. Quest progress past the goal accrues nothing; a claimed
   quest ignores further events that day. Players cannot claim uncompleted
   quests, and there is no partial reward.
10. **Daily reset.** The board resets at the Asia/Ho_Chi_Minh day boundary
    (fixed — Vietnam has no DST, so the boundary never shifts; server clock
    governs, mirroring forge's server-time eligibility rule). At reset: a new
    board is generated from the same fixed set with progress 0, and **unclaimed
    Claimable rewards expire and are lost**. Expiry is silent at MVP (no
    push/mail; the Home board simply shows the new day).
11. **Daily streak.** `streak` = consecutive calendar days (same fixed
    boundary) each containing at least one committed battle (`BattleResult`
    of any outcome). The first battle of a day with `streak == N` sets it to
    `N + 1`; a full boundary passing with no committed battle resets it to 0
    (today's battle then starts it at 1). Display-only at MVP;
    ranked-league's study board consumes it at Alpha.
12. **Mastered words.** `mastered_words` = the count of **distinct** words
    whose rune has been purified (forge-srs purification records). Set
    semantics: re-dropping and re-purifying a word already in the set never
    increments the count. Meta owns the aggregation and display counter; forge
    owns purification semantics. This counter — with the streak — is the
    study-board payload ranked-league reads at Alpha (provisional contract).
13. **Starting state.** A new account starts at gold 0, xp 0, level 1,
    streak 0, `mastered_words` 0, and a fresh quest board (generated at first
    login of the day). The prototype's demo values (gold 2450, level 27) are
    fixtures, not design.

### States and Transitions

The ledgers and counters are passive state (no lifecycle). The quest — the
only player-actuated object — has a strict lifecycle per daily board:

| Quest state | Meaning | Valid transitions |
|---|---|---|
| `Active` | progress < goal | → `Claimable` (progress event reaches goal) · → wiped at daily reset |
| `Claimable` | progress ≥ goal, not claimed | → `Claimed` (player claim, atomic commit) · → expires at daily reset (reward lost) |
| `Claimed` | reward paid | → wiped at daily reset (terminal within its board) |

Board-level: `Current` → `Rolled Over` at the day boundary (all quests wiped,
new board `Current`). There is no quest carry-over in either direction.

### Interactions with Other Systems

| System | Direction | Hard/Soft | Interface | Owner of semantics |
|---|---|---|---|---|
| battle-system | Upstream | Hard | Reward events + victory + per-battle max combo, inside committed `BattleResult` (Rule 21 values adopted as final by Core Rule 3) | battle emits; meta owns ledger application + final values |
| accounts-backend | Upstream | Hard | Storage of gold/xp/level/quest state/streak/mastered set; commit points at battle end and quest claim; idempotency anchor (battle seed) | AB owns storage + atomicity; meta owns economy rules |
| forge-srs | Upstream | Soft | Rune-card correct outcomes + purification records, read from AB-stored forge session records (no live interface — per forge-srs Dependencies row) | forge owns records; meta owns aggregation |
| tower | Upstream | Soft | Tower-encounter victories via the committed `BattleResult`'s encounter type ∈ {tower_stage, tower_boss}; `floor_cleared` deliberately unconsumed (Core Rule 8) | tower emits; meta maps to quest progress |
| ui-shell | Downstream | Hard | Home quest board (progress bars, claim button), gold/XP/level displays, streak display; claim interaction | meta owns board state/semantics; ui-shell owns rendering |
| ranked-league | Downstream | Soft (provisional) | Study-board payload: `mastered_words` count + `streak` (Alpha) | meta owns counters; ranked-league owns presentation + ladder |
| equipment | None | — | No interface: equipment consumes Upgrade Stones, never gold | — |
| speech-io | None | — | No interface | — |

## Formulas

> **Source**: systems-designer + economy-designer consultation, 2026-11-09
> (autonomous). Formula IDs are prefixed **MP** to avoid collision with
> battle-system's B range, which this section *references* (the emission
> values) but never re-owns. The section contains **no float math anywhere**:
> every quantity is an integer or a calendar day, so the house round-half-up
> convention (battle §Formulas prelude) is **never triggered** — stated
> explicitly so future auditors do not hunt for it. Ledgers are stored as
> integers (safe: ~10⁴ XP/gold per month is far inside JS `Number`'s safe
> range, but integer remains the AB-stored contract).
>
> The entire section is **pure ledger logic**: no PRNG, no non-reproducible
> numbers, no time-dependent state except the server clock's calendar day
> (Core Rule 10). Every ledger-writing step sits inside one accounts-backend
> atomic commit keyed by the battle seed (MP2) — the single idempotency
> anchor, shared by MP2, MP3 and MP5.

### MP1 — Level from XP

The `hero_level` formula is defined as:

`hero_level = floor(cumulative_xp / xp_per_level) + 1` — with derived display
quantity `xp_into_level = cumulative_xp mod xp_per_level`

**Variables:**

| Variable | Type | Range | Source | Description |
|----------|------|-------|--------|-------------|
| `cumulative_xp` | int | ≥ 0 | AB-stored ledger (written only by MP2) | Account-total XP across all battles, any outcome |
| `xp_per_level` | int | 1000 (fixed, MVP) | constant | XP per hero level, flat (Core Rule 4) |
| `hero_level` | int | ≥ 1 | calculated | Displayed level; unbounded above |
| `xp_into_level` | int | 0–999 | calculated | Level progress bar fill (ui-shell, read-only) |

**Output Range:** `hero_level` ≥ 1 (cumulative_xp = 0 → level 1); **no upper
bound** — no level cap, since level gates nothing at MVP (Core Rule 4) and
replay farming is uncapped (Core Rule 6). Exactly 1000 XP = exactly 1 level,
forever. `xp_into_level` never reaches 1000 (the mod binds it to 999).

**Example:** An account at cumulative_xp 4,150: `hero_level = 5`,
`xp_into_level = 150`. The next victory (+180) → 4,330 → still level 5, bar
at 330.

### MP2 — Ledger application (exactly-once, seed-keyed)

The `ledger_apply` rule is defined as:

`ledger_delta(result) = (0, 0) if result.seed ∈ applied_seeds; else
(result.gold_event, result.xp_event)` — write `gold' = gold + Δgold`,
`cumulative_xp' = cumulative_xp + Δxp`, and `applied_seeds' =
applied_seeds ∪ {seed}` **in one atomic commit**.

**Variables:**

| Variable | Type | Range | Source | Description |
|----------|------|-------|--------|-------------|
| `result.seed` | string | unique per battle attempt | committed BattleResult | accounts-backend's idempotency anchor |
| `applied_seeds` | set of strings | committed seeds only | AB-stored | Seeds whose rewards have hit the ledger; never pruned |
| `gold_event` | int | {40, 120, 250} | battle emission (Rule 21 mirrored table) | defeat 40 · victory 120 · tower-boss victory 250 |
| `xp_event` | int | {60, 180} | battle emission | defeat 60 · victory 180 (identical for stage and boss) |
| `Δgold, Δxp` | int | (0, 0) or event values | calculated | The only ledger change; (0, 0) on re-delivery |

**Output Range:** each distinct BattleResult delivery writes exactly once. No
recomputation (Core Rule 2): meta applies event values blindly and never
derives them from battle state. An unknown reward type → **fail-fast
rejection**, naming the emitter, no partial ledger write — the commit rejects
whole. Target balances unbounded (faucet-only, Core Rule 5).

**Example:** Battle with seed `b-77123` ends in victory: first delivery →
gold +120, xp +180, seed recorded. A re-delivered BattleResult (client
timeout retry) → seed ∈ applied_seeds → Δ = (0, 0), and quest/streak state is
untouched **same-day**; a re-delivery arriving after the boundary moves only
the day attribution (`last_battle_day`, possibly starting that day's streak
per MP5) — ledger and quest effects stay zeroed by the seed key. Core Rule 2
guarantees zero *ledger* change; the day-attribution carve-out is Edge Case
"committed after the day it was played" (MP-AC14/MP-AC25 assert this
reading).

### MP3 — Quest progress application

The `quest_progress` rule is defined as, per event matching a quest whose
state is `Active`:

`additive sources`: `progress' = min(goal, progress + n)` ·
`threshold source`: `progress' = max(progress, indicator)`

**Variables:**

| Variable | Type | Range | Source | Description |
|----------|------|-------|--------|-------------|
| `n` | int | 0–k (event count in the commit) | matching events | Additive sources only: victories (+1 per committed victory, any encounter), forge-corrects (+1 per correct rune card), tower wins (+1 per committed victory with encounter ∈ {tower_stage, tower_boss}) |
| `indicator` | bool→int | 0 or 1 | matching event | COMBO quest only: 1 if max-combo-per-battle ≥ 3, else 0 |
| `goal` | int | {2, 5, 1, 1} per quest | constants | Quest goals per Core Rule 7 |
| `progress'` | int | 0 – goal | calculated | Clamped at goal by construction |

**Output Range:** [0, goal] per quest, per day. Never overshoots the goal
(Core Rule 9). Events matching a `Claimable` or `Claimed` quest are ignored
entirely. COMBO is a **threshold** source, not additive — one battle reaching
COMBO ×7 writes progress exactly once, never a sum of multiples (an additive
implementation would auto-complete the quest at COMBO ×3 in a single round
run — the likeliest implementation trap in this section). One victory event
may feed two quests at once (win-2 additive + tower-win additive when the
encounter is tower-type) — that is by design, not double-counting: they are
separate quests reading the same commit. Re-delivered BattleResults do not
double-count — quest updates ride the original MP2 commit under the same seed
key.

**Example:** Second victory of the day (a tower-stage win) → "Thắng 2 trận"
additive: min(2, 1+1) = 2 = goal → `Claimable`; "Thắng 1 trận Tháp" additive:
min(1, 0+1) = 1 → `Claimable` — one commit, two quests. Later a COMBO ×4 in a
lost battle → combo quest threshold: max(0, 1) = 1 → also `Claimable` (keys
on combo, not win — Core Rule 8).

### MP4 — Quest claim payout

The `quest_claim` rule is defined as:

`gold' = gold + quest.reward if quest.state == Claimable else gold` — the
claim sets `quest.state = Claimed`, **one atomic commit**.

**Variables:**

| Variable | Type | Range | Source | Description |
|----------|------|-------|--------|-------------|
| `quest.state` | enum | Active / Claimable / Claimed | States table | Only Claimable pays |
| `quest.reward` | int | {80, 100, 120, 150} | constants (Core Rule 7) | combo 80 · tower-win 100 · forge 120 · win-2 150 |
| `gold'` | int | unbounded | calculated | Target ledger |

**Output Range:** Δgold ∈ {0, 80, 100, 120, 150} per claim; **maximum +450
per day** across all four quests, reached only if all four are Claimable and
claimed before reset. No partial claims, no claim before goal, no double
claim. At daily reset every non-Claimed quest is wiped; an unclaimed
Claimable reward is **forfeited** — its value is never written.
Reset-vs-claim ordering: the reset is an atomic board swap; a claim writes
only if committed strictly before the boundary swap on the server clock.

**Example:** Forge quest Claimable at 22:40, gold 1,240 → claim → 1,360,
state Claimed. A combo quest turns Claimable at 23:58 but the player sleeps:
the board resets at Asia/Ho_Chi_Minh midnight → quest and its 80 gold vanish
silently (Core Rule 10).

### MP5 — Streak update

The `streak_update` rule is defined as, on a committed BattleResult on server
day `d` (Asia/Ho_Chi_Minh):

`streak' = streak if last_battle_day == d; streak + 1 if last_battle_day ==
d − 1; 1 otherwise (gap ≥ 2 days or first ever)` — with `last_battle_day' =
d`, in the same atomic commit and under the same seed key as MP2.

**Variables:**

| Variable | Type | Range | Source | Description |
|----------|------|-------|--------|-------------|
| `last_battle_day` | date | any (server tz) | AB-stored | Calendar day of the most recent committed battle |
| `d` | date | any | server clock, Asia/Ho_Chi_Minh | This commit's day; fixed boundary, no DST |
| `streak` | int | ≥ 0 | AB-stored | Consecutive-day count |

**Output Range:** ≥ 0; at most one increment per calendar day — four battles
in one day leave the streak unchanged. The `d − 1` branch works on calendar
days, not 24-hour gaps. Lazily evaluated: no reset timer; a new day is
established at the first committed event that crosses the boundary.

**Example:** Streak 4, last battle Monday. Tuesday battle → 5 (d−1 branch).
Thursday skipped, Saturday battle → gap ≥ 2 → 1. A second Saturday battle →
unchanged (same day).

### MP6 — Mastered-words counter

The `mastered_words` rule is defined as:

`mastered_words = |P|`, with `P' = P ∪ {w}` on a purification event for word
`w`

**Variables:**

| Variable | Type | Range | Source | Description |
|----------|------|-------|--------|-------------|
| `P` | set of word ids | 0 – total curated words | AB-stored, from forge purification records | Distinct words whose rune has been purified |
| `w` | word id | curated words | forge session record | The purified word |
| `mastered_words` | int | 0 – \|total curated words\| | calculated | Study-board counter |

**Output Range:** bounded by curated content, never negative, never decreases
(P only grows). Set semantics make the rule duplicate-safe and order-safe —
unlike the ordered ledgers, this counter needs no idempotency key.
Re-purifying a word already in P changes nothing (Core Rule 12).

**Example:** Purify "mèo" → |P| = 1. Re-drop, re-purify "mèo" → still 1.
Purify "chó" → 2.

### Constant set (registry candidates)

| Name | Value | Unit | Status | Notes |
|------|-------|------|--------|-------|
| `xp_per_level` | 1000 | XP per hero level | constant | Meta-owned; flat curve is MVP-final, scaling is a post-MVP knob (Core Rule 4) |
| `reward_gold_victory` | 120 | gold | constant (mirrored) | Final value **owned here** (Core Rule 3); battle keeps a mirrored emission table |
| `reward_gold_victory_boss` | 250 | gold | constant (mirrored) | Tower-boss victory |
| `reward_gold_defeat` | 40 | gold | constant (mirrored) | Any defeat |
| `reward_xp_victory` | 180 | XP | constant (mirrored) | Any victory (stage or boss) |
| `reward_xp_defeat` | 60 | XP | constant (mirrored) | Any defeat |
| `quest_reward_win2` | 150 | gold | constant | Daily quest claim values (Core Rule 7) |
| `quest_reward_forge5` | 120 | gold | constant | |
| `quest_reward_combo3` | 80 | gold | constant | |
| `quest_reward_tower_win` | 100 | gold | constant | |
| `quest_goal_win2` | 2 | committed victories per day | constant | |
| `quest_goal_forge5` | 5 | correct rune cards per day | constant | Inverse-skill finding → OQ-MP2 |
| `combo3_threshold` | 3 | max combo in one battle | constant | Threshold source, not additive (MP3) |
| `quest_goal_tower_win` | 1 | tower-encounter victory per day | constant | |
| `daily_reset_tz` | Asia/Ho_Chi_Minh | timezone (non-numeric) | constant | Fixed boundary, no DST (Core Rule 10) |

### Economy sanity check (advisory, values locked)

- **Pace.** E[xp/battle] = 60 + 120·p → a daily one-session player
  (4 battles, p ≈ 0.5–0.7) reaches level ~4–5 in a week, ~15–18 in a month;
  ~2 days per level. Flat 1000 curve is fine for MVP: level gates nothing and
  the visible cadence rewards exactly the players who need early motivation.
  A grinding player farming boss replays levels every ~21 minutes — harmless
  while nothing gates on level (Core Rule 4), but if Alpha gates anything on
  level, the flat curve converts grinder/casual playtime differences into
  power differences (folded into OQ-MP1).
- **Faucet.** E[gold/battle] = 40 + 80·p → 80–96 on stage encounters; quests
  add up to +450/day. Casual daily faucet ~700–880 gold; grinder ceiling
  ~4,000 gold/hour via unlimited boss replays (250 per win, zero cost, zero
  difficulty) — the single number OQ-MP1 must answer before any Alpha gold
  sink is priced, since no flat price survives it. Quests contribute ~56% of
  a casual player's daily income — the board, not battle repetition, is the
  dominant daily payoff (the right shape for an educational product).
- **Achievability.** Win-2 completes in ~69–92% of single sessions at
  p = 0.5–0.7; COMBO ×3 in ~76–95%; both higher with a second session —
  honest, achievable goals. Forge-5 and the tower quest are the two
  structural exceptions, both resolved above: the tower quest re-keyed to
  encounter-typed wins (Core Rules 7–8), forge-5's inverse-skill failure
  accepted at MVP and routed to OQ-MP2.

### Consumption contract

These formulas consume: battle's Rule 21 emission values (mirrored in the
constant set), the `BattleResult` fields `seed`, `gold_event`, `xp_event`,
`encounter`, `victory`, `max_combo`; forge's rune-card outcomes + purification
records (AB-stored); the server clock (Asia/Ho_Chi_Minh calendar day). They
produce: `gold`, `cumulative_xp`, `hero_level`, `xp_into_level`, quest board
state, `streak`, `last_battle_day`, `mastered_words` — the full state
accounts-backend stores (Core Rule 1) and ui-shell renders (UI Requirements).

## Edge Cases

- **If the same `BattleResult` is applied twice** (commit retry, duplicate
  delivery): the second application is a no-op — ledger application is keyed on
  the battle's persisted seed (Core Rule 2), which accounts-backend already
  anchors its atomic commit against. Gold/XP change exactly once per battle.
- **If a battle is abandoned mid-session** (tab close/refresh): no
  `BattleResult` exists, so no rewards apply, no quest progress accrues, and
  the streak does not advance (Core Rule 11 requires a *committed* battle).
  Consistent with battle Edge Case "no forfeit state at MVP".
- **If quest progress exceeds the goal** (e.g. a 3rd victory on the "win 2"
  quest): progress clamps at goal; the excess event is discarded for that
  quest's counter. The reward is claimable exactly once.
- **If progress events arrive for an already-Claimed quest** (same day): they
  are ignored — a claimed quest is terminal within its board (States table).
- **If a claim request races the daily reset** (claim submitted before the
  boundary, processed after): the server validates the claim against the
  *current* active board; the reset has already wiped the quest, so the claim
  is rejected as "quest no longer available" with no reward, and the client
  refreshes to the new board. No partial payout, no cross-board carry.
- **If an unclaimed Claimable quest crosses the daily reset**: the reward is
  lost (Core Rule 10) — it does not roll into the new board, does not
  auto-claim, and is not mailed/pushed. Silent expiry is an accepted MVP
  behaviour; a warning surface is ui-shell's call (UX flag territory, not a
  meta requirement).
- **If a player completes a quest on two devices concurrently**: the claim
  commit follows accounts-backend's whole-commit rejection model (first commit
  wins, second rejected) — the reward is paid once, never twice.
- **If the streak boundary is ambiguous** (player plays at 23:59 and 00:01
  Asia/Ho_Chi_Minh): those are two calendar days — the second battle starts a
  new streak day. There is no DST and no shift; the boundary is a fixed,
  server-clock rule, and client clocks never decide anything (mirrors forge's
  server-time eligibility).
- **If a player's first-ever battle is a loss**: the streak still starts at 1
  (Core Rule 11 counts any outcome) and defeat rewards (gold 40 / xp 60) still
  apply. Losing is progress at MVP by design.
- **If a player loses enough that "Thắng 2 trận" stays Active at session
  end**: that is the honest board (Pillar 4), not a bug — the quest is
  achievable ~69–92% of single sessions at realistic win rates (economy
  check), and unclaimed rewards simply expire. QA should not file this as a
  failure.
- **If cumulative XP would skip a level boundary twice** (a future large grant):
  `floor` division jumps the level accordingly — no XP is lost and no
  intermediate level is "skipped" in the sense of missed rewards, because level
  grants nothing at MVP (Core Rule 4). The formula has no special case.
- **If a purified word re-drops later and is purified again**: the
  `mastered_words` count does not increment (set semantics, Core Rule 12) — the
  count tracks distinct words, not purification events. Forge's own purification
  records may list both events; only the set changes.
- **If a reward event carries an unknown type or a negative delta**: rejected
  fail-fast naming the emitting battle (Core Rule 2) — never clamped, never
  partially applied, consistent with the project's out-of-range-output stance
  (speech-io S-scorer precedent). Ledger deltas are non-negative by
  construction at MVP; a negative delta is a contract violation, not data.
- **If the tower `floor_cleared` event fires**: nothing in meta consumes it —
  no quest or ledger keys on the event (Core Rule 8). It remains tower's
  emission for other surfaces (analytics at Full Vision could read it); its
  unconsumed status at MVP is deliberate, not a dropped wire. The tower quest
  keys on encounter-typed battle victories instead, which is why it stays
  completable every day.
- **If a battle is committed after the day it was played** (boundary race):
  streak, quest progress, and the day's board all key on the **commit day**
  (server clock), not the play-start day — a battle played 23:59 but committed
  00:00:01 belongs to the new day (starts that day's streak, feeds the new
  board). Re-deliveries map by their own commit day, which is why a re-delivery
  can start a new day's streak — but idempotency (same seed) still zeroes its
  ledger and quest effects; only the day attribution is new.
- **If the forge queue is empty or all rune cards are not yet due** (the
  "forge 5" quest): the quest is still displayed at progress 0. Progress
  accrues only from forge sessions actually played; the quest does not
  fabricate progress or substitute filler-card outcomes (filler cards are
  question-content content, not runes — question-content E10, enforced by
  forge-srs's filler draw).
- **If the player is a strong learner who drops fewer than 5 runes a day**
  (high accuracy, mostly fast answers — drop rate is wrong/slow only): the
  forge quest is routinely uncompletable for exactly the strongest students
  (economy check: ~40–60% failure days for 90%+-accuracy players). Accepted
  at MVP — the goal stays 5 (prototype value; adaptive goals are an Alpha
  question, OQ-MP2) — but QA must not file the strong learner's expired quest
  as a bug: it is the honest board, same as the win-2 case above.
- **If gold/XP arrive while the player is offline** (no such path exists at
  MVP — every reward source is commit-time and player-initiated): none. This
  edge case exists to state the invariant: meta has no background accrual, so
  an offline player's ledgers cannot change.
- **If the study-board payload is read before any forge activity**
  (ranked-league at Alpha): `mastered_words` reads 0 and `streak` reads its
  real value — both are valid states, not errors. No floor is fabricated.

## Dependencies

**Upstream dependencies** (decisions this system must respect):

| System | Tier | Hard/Soft | Interface | Owner of semantics | Status |
|---|---|---|---|---|---|
| battle-system | MVP | Hard | Reward events (Rule 21 values, adopted as MVP-final by Core Rule 3), victory flag, per-battle max combo — all inside the committed `BattleResult`; idempotency anchor = battle seed | battle owns emission + battle rules; meta owns ledger application + final values | GDD Approved |
| accounts-backend | MVP | Hard | Storage of gold/xp/level/quest board/streak/mastered set; commit points at battle end + quest claim; whole-commit rejection (concurrency); server clock for the daily boundary | AB owns storage/atomicity/clock; meta owns economy rules | GDD Approved |
| forge-srs | Vertical Slice | Soft | Rune-card correct outcomes + purification records, read from AB-stored forge session records — **no live interface** (respects forge-srs Dependencies "indirect only" row) | forge owns records; meta owns aggregation | GDD Approved |
| tower | MVP | Soft | Tower-encounter victories, read from the committed `BattleResult`'s encounter type ∈ {tower_stage, tower_boss} (battle Core Rule 2) — one quest's progress source. Tower's own `floor_cleared` event is deliberately **not** consumed by meta (first-clear-only would strand the quest — see Core Rules 7–8); no meta behavior reads any tower-owned event at MVP | tower owns progression + its event; battle owns the result fields; meta owns quest mapping | GDD Approved |

All four upstream systems have Approved GDDs — no provisional contracts are
introduced by this system except the ranked-league payload below.

**Downstream dependents** (bidirectional note: each listed GDD must name
meta-progression in its own Dependencies section once authored):

| System | Tier | Hard/Soft | Interface | Owner of semantics | Status |
|---|---|---|---|---|---|
| ui-shell | MVP | Hard | Home quest board (progress, claim), gold/XP/level/streak displays; the claim interaction | meta owns board state; ui-shell owns rendering | GDD not yet authored |
| ranked-league | Alpha | Soft (provisional) | Study-board payload: `mastered_words` count + `streak`. Shape deliberately minimal — ranked-league's GDD may extend or contest it at its authoring session | meta owns counters; ranked-league owns ladder/presentation | GDD not yet authored — **provisional** |

**Explicit non-dependencies**: equipment (consumes Upgrade Stones, never gold —
no interface at any tier), speech-io (no economy surface), question-content
(meta draws no content), opponent-ai (no interface), localization (string
extraction discipline applies to quest labels but is not a system dependency).

**Bidirectionality check** (verified against each upstream GDD): battle-system
names meta-progression (Rule 21 + Dependencies row "owns ledger + final
values") ✓; accounts-backend names meta-progression (Gold/XP/quest-state
records row) ✓; forge-srs names meta-progression (Downstream Soft, "indirect
only") ✓ — this GDD's read-from-records framing keeps that row honest; tower
names meta-progression (`floor_cleared` row + OQ-TW1 routed here) — **with one
recorded divergence**: tower's dependency row offers `floor_cleared` as the
interface, and this GDD declines it (Core Rules 7–8; a first-clear-only event
strands the quest). Tower's emission rule (Core Rule 9, TW9) is untouched —
the event still fires; meta just doesn't consume it. Tower's next edit should
update its dependency row to "tower-encounter victories via `BattleResult`"
(pointing at this GDD's Core Rule 8) and may mark OQ-TW1 resolved-pointing-here.

**Carry-in for tower's next edit**: update the `floor_cleared` dependency row
as above, and re-verify **TW20** (its integration criterion tests
"floor_cleared consumption exactly-once by meta's ledger" — meta has landed
and declines the event; re-key TW20 to encounter-typed victories or retire
it). No contradiction — a divergence note, not a conflict flag. **Carry-in
for battle-system's next edit**: mark OQ-BS3 resolved-pointing-here (Core
Rule 3 adopts 120/250/40 · 180/60 as MVP-final, owned here) — same pattern
as OQ-TW1.

**OQ-TW1 answer for tower's Open Questions table**: resolved in this GDD
(Core Rule 6) — no caps/diminishing returns at MVP (faucet-only gold makes the
farm economically inert); re-opens at Alpha as OQ-MP1. Tower may mark its row
resolved-pointing-here; the row stays its file's, not edited from this session.

**Persistence-boundary note**: this GDD states *what* meta state persists
(everything in Core Rule 1 — ledgers, board, counters) and *when* (commit
points per Core Rules 2, 9). *How* it persists is accounts-backend's
companion ADR, still pending — this GDD references it, it does not decide it.

## Visual/Audio Requirements

Minimal by nature — this system's events are already theatrical in battle's
result modal (staggered reward rows, battle-owned). What meta adds is **claim
feedback on the Home board**: a claim action needs a clear paid-state (reward
row + toast, prototype tone `gold`) and a visually distinct Claimed state.
No new VFX family, no audio events of its own — if a claim sting is wanted, it
joins the shared UI audio set owned by ui-shell's spec, not this GDD. Number
tick-up animation on gold/XP counters is a feel nicety, listed under Game Feel.

## Game Feel

The economy should feel like **receipts, not slot machines**: numbers land
where the action happened (battle result modal, forge commit, quest claim),
with no ambient income to watch. Deliberate absence of feel at MVP: no
level-up ceremony (level gates nothing — a full celebration would advertise a
gate that doesn't exist), no currency-count-up loops on idle screens. The one
place feel is worth budgeting: the **streak** — it is the system's only
comeback hook, and its daily state ("streak alive / broken") should be
readable at a glance on Home. Count-up animation on claim payout: cheap,
optional, ui-shell's call.

## UI Requirements

| Surface | Content | Notes |
|---|---|---|
| Home — quest board | 4 daily quests: label, goal, progress bar, reward chip, state (Active / Claimable / Claimed); claim button on Claimable only | Claimable ≠ Claimed must be visually distinct (claimable invites, claimed is receipt) |
| Home — currency strip | gold amount, level + XP progress toward next level | XP bar = `cumulative_xp mod 1000` of 1000; gold formatted with thousand separators in vi-VN convention (24.500) from day one — uncapped faucet + replay farming crosses 10,000 within a month, and a raw 8-digit number reads as a rendering bug |
| Home — streak | streak count + alive/broken state | glance-readable (Game Feel) |
| Battle result modal | reward rows (battle-owned rendering) | meta supplies nothing new — values only |
| Reset boundary | new board appears with progress 0; expired rewards are silently gone | no notification surface required at MVP |
| Study board (Alpha, ranked-league) | mastered_words + streak payload | ranked-league owns this screen; payload only here |

Every surface above is ui-shell-owned rendering over meta state; nothing here
authorizes meta-owned visuals.

> **📌 UX Flag — meta-progression**: quest board + claim interaction +
> currency/streak strip are Home-screen UX work. Run `/ux-design` for the Home
> spec in Phase 4 (Pre-Production) before epics; stories should cite
> `design/ux/[screen].md`, not this GDD.

## Cross-References

| Referenced GDD | What is referenced | Where in this GDD |
|---|---|---|
| battle-system | Rule 21 reward events + provisional→final handoff; battle seed idempotency; no-forfeit edge | Core Rules 2, 3, 8; Edge Cases 1–2; Dependencies |
| accounts-backend | Commit points (battle end, quest claim); whole-commit rejection; server clock; pending persistence ADR | Core Rules 2, 9, 10; Edge Cases 5, 7; Dependencies |
| forge-srs | Rune-card outcomes + purification records; "indirect only" dependency row; filler exclusion (question-content E10, enforced by forge-srs's filler draw) | Core Rules 8, 12; Edge Cases 12, 16, 17; Dependencies |
| tower | Core Rule 9 `floor_cleared` emission (deliberately unconsumed by meta); OQ-TW1 | Core Rules 6, 8; Edge Case 14; Dependencies |
| game-concept | Session-level loop (daily quests), XP_PER_LEVEL 1000, MVP exclusions (no shop), Pillar 4 honesty | Overview; Core Rules 4, 5, 7, 11 |

## Acceptance Criteria

> **Source**: qa-lead consultation, 2026-11-09 (MP-AC1–MP-AC29, coverage-verified
> against all 13 Core Rules, formulas MP1–MP6, and every Edge Case — the section
> holds **19 Edge Cases**, E1–E19 in file order). **Legend**: **[unit]** = vitest,
> deterministic, DI-injected collaborators and **DI-injected fake server clock**
> (the daily boundary is server time, Asia/Ho_Chi_Minh — no criterion reads the
> device clock and none sleeps), home `tests/unit/meta-progression/`, BLOCKING;
> **[integration]** = automated cross-system test against the accounts-backend
> commit path, BLOCKING; **[statistical]** = **unused here by design** — the
> system is closed-form integer and calendar arithmetic with no PRNG (Formulas
> prelude), so there is no distribution to test; the Economy sanity check's
> percentages are expectations about *player behaviour*, asserted (if at all) by
> playtest, never by this suite; **[screenshot]** = retained in
> `production/qa/evidence/`, BLOCKING at every `qa.level` (never waived).
> *(provisional)* = boundary with a not-yet-authored GDD — ui-shell (MVP display,
> MP-AC27–29) and ranked-league (Alpha payload, MP-AC23) — written against the
> contract this GDD names, re-verify when the owner lands. The battle-system and
> accounts-backend contracts are **non-provisional** (both GDDs Approved).
>
> Shared numbers, restated so no criterion requires reading other sections:
> victory → gold 120 (tower-boss 250), xp 180; defeat → gold 40, xp 60 (Core
> Rule 3 — MVP-final, owned here; battle's Rule 21 table is the mirror); quest
> rewards 150 / 120 / 80 / 100 gold for win-2 / forge-5 / combo-3 / tower-win;
> goals 2 / 5 / 1 / 1; combo threshold 3; `xp_per_level` 1000; daily boundary =
> Asia/Ho_Chi_Minh midnight on the server clock (no DST); streak counts committed
> battles of **any outcome**. Boundary tests advance the injected clock across a
> fixed instant (2026-03-15T23:59:59+07:00 → 2026-03-16T00:00:00+07:00); race
> tests inject commit ordering at the commit layer — no wall-clock timing
> anywhere.

- **MP-AC1 [unit] — Starting state is exactly the zero state; the ownership boundary holds (Core Rules 1, 13 + Rule 5).** **GIVEN** a brand-new account, **WHEN** meta state materializes, **THEN** gold 0, cumulative_xp 0, hero_level 1, streak 0, mastered_words 0, and a fresh quest board generated at first login of the server day; **and THEN** the prototype's demo values (gold 2450, level 27) exist only in test fixtures — a static sweep of the module's initialization path finds neither; **and THEN** the module owns exactly the four stores of Core Rule 1 and no others: no RP-tier arithmetic (ranked-league's), no storage engine (accounts-backend's), and no spend path of any kind — every gold write is additive (static: no gold subtraction exists anywhere in the module).
- **MP-AC2 [unit] — The level curve is flat floor division (MP1 + Core Rule 4).** **GIVEN** cumulative_xp ∈ {0, 999, 1000, 4150, 4330}, **WHEN** hero_level and xp_into_level compute, **THEN** levels 1, 1, 2, 5, 5 and xp_into_level 0, 999, 0, 150, 330 — the MP1 example's exact values; **and THEN** xp_into_level ∈ 0–999 by construction (never 1000), hero_level is unbounded (xp 1,000,000 → level 1001 — no cap constant exists), and the module references `xp_per_level` by name with no local 1000 literal (static).
- **MP-AC3 [unit] — A large grant skips boundaries without loss (MP1 + Edge Case E11).** **GIVEN** an account at xp 600 (level 1), **WHEN** a single +1500 write applies, **THEN** cumulative_xp 2100 → level 3 directly — floor division, no intermediate-level bookkeeping, no special case, no XP lost; **and THEN** level is a pure function of cumulative_xp across a sweep (recomputing from the ledger alone always reproduces the stored level).
- **MP-AC4 [unit] — The ledger applies emitted values exactly (MP2 + Core Rules 2–3).** **GIVEN** the three emission shapes, **WHEN** each committed BattleResult applies, **THEN** stage victory → gold +120 / xp +180, tower-boss victory → gold +250 / xp +180, defeat → gold +40 / xp +60; **and THEN** values are read from the event fields only — static assertion: no re-derivation from battle state feeds the delta (Core Rule 3's ownership pinned: these are MVP-final here; battle's table is the mirror).
- **MP-AC5 [unit] — Seed-keyed exactly-once (MP2 + Core Rule 2 + E1).** **GIVEN** a committed BattleResult with seed `b-77123`, **WHEN** it applies and is then re-delivered N times (client timeout retry), **THEN** the first delivery writes its delta and records the seed, and every re-delivery computes Δ = (0, 0) — the ledger is identical after delivery 1; **and THEN** applied_seeds only grows (never pruned), and N deliveries of k distinct seeds yield exactly k writes.
- **MP-AC6 [unit] — An unknown type or negative delta rejects the whole commit (MP2 + Core Rule 2 + E13).** **GIVEN** an event with reward type `mystery_coin` (and a twin with gold_event −5), **WHEN** it reaches the ledger, **THEN** the commit rejects fail-fast naming the emitting battle, and gold/xp/applied_seeds are identical to pre-commit — no partial write, no clamping to a default (static: no clamp branch exists).
- **MP-AC7 [unit] — Additive progress clamps at goal (MP3 + Core Rule 8 + E3).** **GIVEN** "Thắng 2 trận" Active at progress 1, **WHEN** a 2nd then a 3rd committed victory applies, **THEN** progress → min(goal, ·) = 2 → Claimable → stays 2 (the 3rd victory is discarded for this quest's counter), claimable exactly once.
- **MP-AC8 [unit] — COMBO is a threshold source, never additive (MP3 + Core Rule 8).** **GIVEN** battles with per-battle max combo 2, 3, then 7, **WHEN** each commits, **THEN** combo-quest progress is 0, 1, 1 — one battle reaching ×7 writes progress exactly once (max(progress, indicator), never a sum); **and GIVEN** a COMBO ×3 reached inside a LOST battle, **THEN** progress 1 — the quest keys on the combo, not the win; **and GIVEN** two separate battles each reaching ×3, **THEN** still 1 (per-battle threshold, not a cumulative count).
- **MP-AC9 [unit] — Events past goal or post-claim are ignored (MP3 + States + E4).** **GIVEN** a Claimable quest (twin: Claimed), **WHEN** matching progress events arrive, **THEN** progress and state are unchanged — a claimed quest is terminal within its board and silently absorbs further events that day.
- **MP-AC10 [unit] — One commit can feed two quests (MP3 + Core Rules 7–8).** **GIVEN** "Thắng 2 trận" at progress 1 and "Thắng 1 trận Tháp" at 0, **WHEN** a tower-stage victory commits, **THEN** both quests advance in that one commit (win-2 → 2 Claimable, tower → 1 Claimable) — two counters reading one event, by design, not double-counting; **and GIVEN** the same commit shape with a non-tower encounter, **THEN** only win-2 advances.
- **MP-AC11 [unit] — Forge progress reads committed records and fabricates nothing (MP3 + Core Rule 8 + E16; the E10 exclusion).** **GIVEN** fixture forge session records (2 correct rune cards + 1 correct filler card), **WHEN** forge-5 progress applies, **THEN** +2 — filler-card outcomes never count (filler is question-content content, not runes); **and GIVEN** an empty forge queue or no rune yet due, **THEN** the quest renders at progress 0 — no fabricated progress, no filler substitution.
- **MP-AC12 [unit] — Streak branches, any outcome (MP5 + Core Rule 11 + E9).** **GIVEN** the fake server clock and last_battle_day, **WHEN** committed battles apply, **THEN** same-day → unchanged (four battles in one day = exactly one increment, the first), prior calendar day (d−1) → +1, gap ≥ 2 days or first ever → 1; **and GIVEN** a player's first-ever battle is a loss, **THEN** streak 1 and the ledger takes +40/+60 — any outcome commits (the d−1 branch works on calendar days, not 24-hour gaps).
- **MP-AC13 [unit] — Streak is lazy and committed-only; nothing accrues in the background (MP5 + Core Rule 11 + E2, E18).** **GIVEN** a streak and no committed battle, **WHEN** the injected clock crosses any number of boundaries, **THEN** streak is unchanged until a committed event evaluates it (no reset timer — static: no interval/timeout path in the module); **and GIVEN** a battle abandoned mid-session (no BattleResult), **THEN** no reward, no quest progress, no streak movement; **and THEN** an offline player's ledgers cannot change (static: every write sits on a player-initiated commit path — no background accrual exists).
- **MP-AC14 [unit] — The commit day governs; client clocks decide nothing (MP5 + Core Rule 10 + E8, E15).** **GIVEN** the injected server clock advanced across 23:59:59 → 00:00:00 Asia/Ho_Chi_Minh, **WHEN** battles commit at 23:59 and at 00:01, **THEN** those are two calendar days — the 00:01 battle starts that day's streak and feeds the new board (E8); **and GIVEN** a battle played 23:59 but committed 00:00:01, **THEN** quest progress, board and streak all key on the commit day (E15); **and GIVEN** a re-delivery of an already-applied seed arriving on a later day, **THEN** only the day attribution is new — last_battle_day moves and the streak may start that day per MP5, while ledger and quest effects stay zeroed by the seed key (E15's carve-out); **and THEN** a device clock set forward by any amount changes nothing (static: no device-clock read in the module).
- **MP-AC15 [unit] — Claim pays once, only from Claimable (MP4 + Core Rule 9).** **GIVEN** a Claimable forge quest and gold 1240, **WHEN** claimed, **THEN** one atomic write → gold 1360, state Claimed, progress clamped at goal; **and GIVEN** a claim attempted on an Active quest (twin: an already-Claimed quest), **THEN** it is refused — Δgold 0, no partial reward, no state change; a successful claim writes exactly quest.reward ∈ {80, 100, 120, 150}; maximum +450/day across all four quests (150+120+80+100).
- **MP-AC16 [unit] — Daily reset wipes and regenerates; expiry is silent (MP4 + Core Rule 10 + E6).** **GIVEN** a board holding an Active quest, an unclaimed Claimable quest, and a Claimed quest, **WHEN** the injected clock crosses the boundary, **THEN** all three are wiped, the new board holds the same fixed set at progress 0, the unclaimed Claimable reward is never written (forfeited), and nothing mails, pushes or notifies (static: no notification path exists); no carry-over in either direction.
- **MP-AC17 [integration] — Claim vs reset resolves by commit order on the server clock (MP4 + Core Rule 10 + E5).** **GIVEN** a Claimable quest at 23:58 and a claim request submitted before the boundary, **WHEN** (a) it commits before the swap, **THEN** it pays in full; **WHEN** (b) an identical request is processed after the swap (injected ordering), **THEN** it is rejected as "quest no longer available" — zero reward, no partial payout, no cross-board carry, and the client refreshes to the new board.
- **MP-AC18 [integration] — Concurrent claims from two devices pay once (MP4 + E7; accounts-backend whole-commit rejection).** **GIVEN** devices A and B both holding the same Claimable quest, **WHEN** both claims race, **THEN** the first commit pays and the second is rejected whole — the reward is paid exactly once, and B's client re-syncs to the server board state.
- **MP-AC19 [unit] — The board is the fixed MVP set with locked goals, rewards and honest labels (Core Rule 7).** **GIVEN** boards regenerated across many fake days, **WHEN** each composes, **THEN** exactly 4 quests — "Thắng 2 trận" (goal 2, 150 gold), "Rèn 5 từ bị lỗi trong Lò Rèn" (5, 120), "Đạt COMBO ×3 trong một trận" (threshold 3, 80), "Thắng 1 trận Tháp" (1, 100) — the same set every day, no randomization, no fifth slot; **and THEN** the win-2 label carries no "PvP" wording (static on the label strings — the prototype's PvP framing is corrected, Pillar 4).
- **MP-AC20 [unit] — Replay farming is uncapped by design (Core Rule 6 + OQ-TW1/OQ-MP1).** **GIVEN** N identical tower-boss replay victories, **WHEN** each commits, **THEN** each pays the full +250/+180 — no cap, no decay, no daily limit (static: no cap constant or replay counter exists); a cap would be a deliberate post-MVP addition re-opening Core Rule 6 at Alpha.
- **MP-AC21 [unit] — `floor_cleared` is unconsumed; the tower quest keys on encounter type (Core Rule 8 + E14).** **GIVEN** the full meta module, **THEN** no code path reads tower's `floor_cleared` event (static — E14's deliberate dead wire at MVP); **and GIVEN** a boss replay victory on an already-cleared floor (tower emits no `floor_cleared` — its TW9), **WHEN** it commits with encounter `tower_boss`, **THEN** the tower quest still advances — the exact case a `floor_cleared` keying would strand, and the reason for the re-key.
- **MP-AC22 [unit] — Mastered words are a set, not a counter (MP6 + Core Rule 12 + E12).** **GIVEN** P = {"mèo"}, **WHEN** "mèo" re-drops and is purified again, **THEN** |P| stays 1 (forge's records may list both purification events; only the set counts); purify "chó" → 2; **and THEN** the count never decreases, is order-independent, and needs no idempotency key (set semantics are duplicate-safe by construction).
- **MP-AC23 [unit, provisional] — The study-board payload is the two counters, unfabricated (Core Rules 11–12 + E19 + OQ-MP3).** **GIVEN** an account with zero forge activity, **WHEN** the payload composes, **THEN** it is exactly {mastered_words: 0, streak: <real value>} — valid states, no floor fabricated; **and THEN** the payload carries nothing else (shape per the Dependencies provisional row). *(provisional: ranked-league's GDD is unauthored — written against the provisional contract; re-verify at its authoring session, OQ-MP3.)*
- **MP-AC24 [integration] — One battle commit moves ledgers, quests and streak together (MP2/MP3/MP5 + Core Rule 2).** **GIVEN** a tower-stage victory with win-2 at 1, the tower quest at 0, and streak N from yesterday, **WHEN** the BattleResult commits, **THEN** gold +120, xp +180, both quests advancing, streak N+1 and last_battle_day = today land in ONE atomic commit keyed on the seed; **and GIVEN** an injected failure mid-commit, **THEN** server state is exactly pre-commit — all five effects or none (whole-commit rejection).
- **MP-AC25 [integration] — Quest and streak idempotency ride the same seed (MP3/MP5 + E1, E15).** **GIVEN** a committed victory already applied (win-2 at 2, Claimable), **WHEN** the same seed re-delivers the same day, **THEN** win-2 stays 2/Claimable — no double-count, no second transition; **and GIVEN** the re-delivery arrives after the boundary, **THEN** ledger and quest effects stay zeroed while only the day attribution moves (MP-AC14's carve-out).
- **MP-AC26 [integration] — The forge read path touches records, never the forge module (Core Rule 8; forge-srs Dependencies "indirect only" row).** **GIVEN** a committed forge session (2/3 rune cards correct, 1 filler) and its purification records in accounts-backend storage, **WHEN** meta derives the day's forge-5 progress and mastered_words, **THEN** progress +2 from the session records and the purified word enters P — via the AB-stored records only; a spy confirms zero calls into the forge module (no live interface).
- **MP-AC27 [screenshot, provisional] — The Home quest board reads at a glance (Core Rule 7 + UI Requirements).** **GIVEN** accounts at Active / Claimable / Claimed board states, **THEN** each quest renders label, goal, progress bar, reward chip and state; the claim button is enabled on Claimable only; Claimable and Claimed are visually distinct (claimable invites, claimed is receipt); a claim shows the paid-state feedback (reward row + toast, prototype tone `gold`). Retained screenshots in `production/qa/evidence/`. *(provisional: ui-shell's GDD is unauthored — capture when ui-shell ships; never waived.)*
- **MP-AC28 [screenshot, provisional] — Currency strip and streak (UI Requirements + Game Feel).** **GIVEN** an account at gold 24,500 with mid-level XP, **THEN** gold renders with vi-VN thousand separators (24.500) and the XP bar shows cumulative_xp mod 1000 of 1000; the streak strip shows count + alive/broken state, readable at a glance. Retained screenshots. *(provisional: ui-shell undesigned.)*
- **MP-AC29 [screenshot, provisional] — The reset boundary is visible as a new day (Core Rule 10 + UI Requirements).** **GIVEN** the injected clock crossed the boundary, **THEN** Home shows the new board with all four quests Active at progress 0 and yesterday's unclaimed reward silently gone — no notification surface exists. Retained screenshots. *(provisional: ui-shell undesigned.)*

**Totals: 29 criteria — 21 unit (MP-AC23 provisional on ranked-league), 5
integration (MP-AC17, MP-AC18, MP-AC24, MP-AC25, MP-AC26), 3 screenshot (all
provisional on ui-shell — capture when it ships, never waived). No statistical
criteria by design: the system is closed-form integer and calendar arithmetic
with zero RNG; MP1–MP6 are pure and exhaustively enumerable at the fixture
level.**

**Coverage matrix** (all 13 Core Rules ≥ 1 AC): Rule 1: MP-AC1 · Rule 2:
MP-AC4/5/6/24/25 · Rule 3: MP-AC4 (+AC15/AC19 pin the quest-side locked
values) · Rule 4: MP-AC2/AC3 · Rule 5: MP-AC1 (no-sink static)/AC20 · Rule 6:
MP-AC20 · Rule 7: MP-AC19/AC10/AC11 · Rule 8: MP-AC7–AC11/AC21 · Rule 9:
MP-AC15/AC17/AC18 · Rule 10: MP-AC14/AC16/AC17 · Rule 11: MP-AC12/AC13/AC14 ·
Rule 12: MP-AC22/AC23 · Rule 13: MP-AC1. Formulas: MP1→AC2/AC3 ·
MP2→AC4/5/6/24/25 · MP3→AC7–AC11/AC25 · MP4→AC15/16/17/18 ·
MP5→AC12/13/14/25 · MP6→AC22/23. Every Edge Case mapped (E-numbers in file
order, 19): E1→AC5/AC25 · E2→AC13 · E3→AC7 · E4→AC9 · E5→AC17 · E6→AC16 ·
E7→AC18 · E8→AC14 · E9→AC12 · E10→coverage note — the honest-board case:
AC15/AC16/AC19 assert the only behaviours available (stays Active, expires
silently, no error state); a quest left Active at session end is correct
behaviour, not a bug · E11→AC3 · E12→AC22 · E13→AC6 · E14→AC21 ·
E15→AC14/AC25 · E16→AC11 · E17→coverage note — the accepted inverse-skill
failure (OQ-MP2): AC11's progress-0 and AC16's silent expiry assert the
mechanics; the suite deliberately asserts no completion, and QA must not file
the strong learner's expired quest as a bug · E18→AC13 (background-accrual
static) · E19→AC23.

**Test-file home**: `tests/unit/meta-progression/` — `level.test.ts` (AC2, AC3)
· `ledger.test.ts` (AC4–AC6) · `quest-progress.test.ts` (AC7–AC11) ·
`streak.test.ts` (AC12–AC14) · `claim.test.ts` (AC15) ·
`board-and-reset.test.ts` (AC16, AC19) · `counters.test.ts` (AC22, AC23) ·
`ownership-static.test.ts` (AC1, AC20, AC21); `tests/integration/meta-progression/`
— `battle-commit.test.ts` (AC24, AC25) · `claim-races.test.ts` (AC17, AC18) ·
`forge-read.test.ts` (AC26); screenshots AC27–AC29 → `production/qa/evidence/`.

## Open Questions

| ID | Question | Owner | Target |
|---|---|---|---|
| OQ-MP1 | **Alpha faucet cap.** Unlimited boss replays emit 250 gold per ~3-min win with zero difficulty — a ~4,000 g/h ceiling. Before any Alpha gold sink is priced (equipment upgrades, shop, quest utilities), answer: daily caps, diminishing returns, or boss-replay reward reduction? No flat sink price survives the ceiling. Sequencing: sink pricing cannot precede this answer. | meta-progression + economy-designer (with battle-system as emitter) | Alpha tier — re-opens Core Rule 6 |
| OQ-MP2 | **Forge-5 goal is inverse-skill.** Strong learners (90%+ accuracy, mostly fast) drop < 5 runes/day and fail the quest ~40–60% of days; the best students fail the board most. Keep goal 5 at MVP (accepted); at Alpha: adaptive goal (e.g., `min(5, eligible_runes_yesterday)`), or counting filler-card corrects, or a strong-learner alternative quest. | meta-progression (with forge-srs) | Alpha tier |
| OQ-MP3 | **Ranked payload confirmation.** The study-board contract (`mastered_words` count + `streak`, Dependencies) is provisional until ranked-league's GDD either adopts it or contests it at its authoring session. If ranked needs battle-only streaks or per-word mastery detail, the counter definitions extend here. | ranked-league | ranked-league GDD (Alpha) |
| OQ-MP4 | **Quest-set scaling at Alpha.** Flat 450g quest income falls from ~56% of a casual player's daily faucet to ~13% for a grinder, losing its schedule-anchor function for engaged players; and the fixed set degrades in both progression directions (forge-5 above; tower quest fine after re-key but win-2 could scale with difficulty). Convert goals to progression-relative expressions at Alpha? | meta-progression + live-ops-designer | Alpha tier |
| OQ-MP5 | **Unconsumed `floor_cleared` event.** Meta declines to consume it (Core Rules 7–8); the event still fires per tower Core Rule 9. Confirm at tower's next edit: keep the event for future surfaces (analytics could read it) with its dependency row updated to encounter-typed victories, or drop the event as dead wire. | tower | tower GDD next edit |
