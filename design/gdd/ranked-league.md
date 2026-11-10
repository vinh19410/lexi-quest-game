# Ranked League

> **Status**: Complete — pending design review (run `/design-review design/gdd/ranked-league.md` in a FRESH session)
> **Author**: project owner + Claude (systems-designer, live-ops-designer, qa-lead)
> **Last Updated**: 2026-11-09
> **Last Verified**: 2026-11-09
> **Implements Pillar**: Pillar 4 — Honest Ghosts (primary); Competence/mastery (League climb)

## Summary

Ranked-league turns ranked battles into a persistent competitive ladder: an RP
total (won +28 / lost −14 per ranked duel) that maps to five tiers × three
divisions, and a weekly league board where the player's real skill and study
counters are ranked against 14 honestly-labeled simulated peers. It exists to
give victory a durable stake and practice a visible standing — the "climb"
that makes the core loop worth returning to beyond gear and tower progress. It
owns only ladder/board semantics: battles are battle-system's, ledgers are
accounts-backend's, study counters are meta-progression's, pixels are
ui-shell's.

> **Quick reference** — Layer: `Feature` · Priority: `Alpha` · Key deps: `battle-system, meta-progression, accounts-backend` (upstream, all Approved) · `ui-shell` (downstream rendering)

## Overview

Ranked-league is the competitive meta layer: it turns committed ranked-battle outcomes into a persistent **RP ladder** (five tiers with III–I divisions), a **weekly league board** where the player's real RP, mastered-words count and streak are ranked against a fixed roster of *simulated* peers, and the **study board** that ranks diligence alongside skill. Data-wise it is a rules layer — it consumes battle-system's RP events (Rule 21: `+28` win / `−14` loss, ranked encounters only), meta-progression's study-board counters, and accounts-backend's RP history storage, and it owns every derivation on top of them: tier/division math, weekly season structure, simulated-peer generation, and board ordering. Player-facing, it is the "climb": the ladder gives victory a durable stake (RP moves, tiers change), and the weekly board gives practice a visible standing — always honestly labeled, per Pillar 4, as ghost duels against simulated peers. Ranked-league owns the semantics of all of this; it never touches battle arithmetic, ledger application, or question delivery.

## Detailed Design

### Core Rules

1. **RP is the ranked currency — earned only through ranked encounters.** Every committed `BattleResult` with `encounter = ranked` carries an RP event from battle-system Rule 21: **`+28` on victory, `−14` on defeat**. Ranked-league applies exactly that delta to the account's RP total via accounts-backend and owns nothing about how the battle decided victory. This GDD adopts **±28/−14 as Alpha-final** (prototype-validated; the RP half of battle OQ-BS3 resolves pointing here — battle's next edit may mark it, mirroring how meta-progression adopted the gold/XP half). RP events on friend/tower encounters are 0 and never touch this system.
2. **Tiers are pure RP thresholds — five tiers, three divisions each.** Tier floors: **Bronze 0, Silver 1000, Gold 1300, Diamond 1600, Grandmaster 1900** (Vietnamese: Đồng, Bạc, Vàng, Kim Cương, Đại Kiện Tướng). Within a tier, division III→I splits the tier's RP span into thirds (Formula RL1); Grandmaster's span is capped at +300, so GM I is the open-ended top. Tier/division is *derived, never stored* — storage holds one integer RP; tier recomputes on read.
3. **A new account starts at RP 0 (Bronze III).** The prototype's starting 1420 is a demo fixture, not design — starting mid-Gold made the prototype's board readable but hides the ladder from a real player. Climb rate from 0 is a deliberate Alpha tuning question (OQ-RL1); the thresholds themselves are prototype-validated.
4. **Demotion is automatic and unprotected.** Falling below a tier's floor moves the player to the tier below, top division (division recomputed by RL1); Bronze III (RP 0) is the absolute floor. No demotion shields, grace games, or decay at Alpha — recorded as post-Alpha live-ops levers, not MVP/Alpha mechanics.
5. **Ranked queue is one honest button.** Queueing builds the encounter config — `encounter = ranked`, module = the day's rotation (Rule 9), ranked GhostProfile defaults (accuracy 0.70, HP 500, reveal 800 ms — opponent-ai-owned constants), LoadoutSnapshot, seed — and launches a battle-system battle. There is no matchmaking, no search time, no player-count theater (Pillar 4: nothing may imply real opponents; the match banner discloses the ghost duel, per the prototype's existing ranked label).
6. **The weekly league is a 7-day season over a fixed roster.** A season runs Monday 00:00 → Sunday 24:00 Asia/Ho_Chi_Minh (fixed zone, no DST). Each player belongs to one league group per season: **14 simulated peers + the player**, grouped by the player's tier at season start — peers are **RP-bracketed around that tier's band** (±100 beyond its edges, RL3), so the board legitimately spans adjacent tiers and the zone dividers stay populated; the board sorts by RP and peer tier labels are cosmetic (Rule 7). The group is generated deterministically from `season_id` + account identity (Formula RL3), so the same season always shows the same roster on every device. Seasons do **not** reset RP at Alpha — the ladder is persistent; the season only re-rolls the board and records the placement summary.
7. **The board ranks real player data against simulated peers — and says so.** Two tabs, both headed by a persistent simulated-roster disclosure (Pillar 4): the **PvP tab** sorts by RP (player's real value; peers' seeded weekly trajectory, RL3); the **Study tab** sorts by `mastered_words` desc, then `streak` desc (player's real counters from meta-progression's payload; peers' values are generated flavor). Promotion-zone (top 5) and demotion-zone (bottom 3) highlights on the PvP tab are **presentation mirrors of the RP ladder**, not independent mechanics — nothing is granted or removed by board placement at Alpha (OQ-RL2 covers post-Alpha placement rewards).
8. **Study-board payload adopted as-is (resolves OQ-MP3).** This GDD **adopts** meta-progression's provisional contract verbatim: the payload is the `mastered_words` count + the `streak` integer, read through accounts-backend-stored counters. No per-word mastery detail and no battle-only streak variant at Alpha — if a post-Alpha feature needs them, the counter definitions extend in meta-progression, not here.
9. **Ranked content rotates daily across the four modules.** The ranked encounter config's module = deterministic rotation over the four content modules (Daily, TOEIC, IELTS, IT) by server date (Formula RL4). Rotation reuses existing module × round-type pools (no new pool type, no question-content edit), gives repeat ranked players daily variety, and keeps the "one button" honest — module choice is not a second decision the player must make before queueing.
10. **Ranked outcomes are server-validated — this is the trust-model escalation point.** accounts-backend Core Rule 6 allows client-trusted outcomes only while every consumer is single-player with no stakes; ranked is the first stakes consumer, so **ranked RP commits are server-computed**: the backend verifies the battle outcome against the battle seed + submitted answer log before applying any RP delta. This GDD records the *requirement and scope* (ranked encounters at minimum); the mechanism (recompute vs. replay-verify, session telemetry, grace-window detection) is the technical-director's ADR, owed before Alpha ships. **This resolves the adoption half of AB OQ#3** — "at ranked-league design" is now; whether non-ranked commits move earlier is AB's companion-ADR scope, not this GDD's.
11. **Abandoning a ranked battle is a forfeit loss.** Battle-system discards abandoned sessions silently (no `BattleResult`) — acceptable when nothing is at stake, abusable in ranked (quit to dodge the −14). Ruling: once the trust model ships, a ranked battle that has *started* (server saw battle-start) and produces no committed result within a **grace window of 15 minutes** is recorded as a forfeit: RP −14, no rewards, no runes. The window and its measurement are pinned by ADR-0003 §4 (15 min from `started_at`, server clock; client events do not extend it); friend/tower abandons keep battle-system's no-op discard.
12. **Presentation is downstream.** Tier badges, division pips, board rows, zone highlights, disclosure labels, and the season summary are ui-shell rendering of data this system owns. Ranked-league defines the semantic (what a tier *is*, when a season *rolls*, what a peer *is*); ui-shell owns every pixel of how it looks.

### States and Transitions

The ladder itself is stateless derived data (Rule 2). Two stateful objects exist:

| Object | State | Meaning | Valid transitions |
|---|---|---|---|
| Season (global calendar object) | `Active` | Current week; board live; RP deltas apply | → `Settling` at Monday 00:00 ICT |
| | `Settling` | Placement summary recorded per account (final rank within group); board frozen | → `Active` immediately after (new roster drawn, new group assignment) |
| League group (per account, per season) | `Live` | Board rendering from live RP/counter values | → wiped at season rollover |
| | `Settled` | Frozen final placement for the summary screen | → wiped at next rollover |

Ranked membership is not a state — a player is ranked-eligible whenever they have an account; there is no placement series, provisional rank, or opt-in gate at Alpha (OQ-RL3 covers post-Alpha placement matches).

### Interactions with Other Systems

| System | Direction | Hard/Soft | Interface | Owner of semantics |
|---|---|---|---|---|
| battle-system | Upstream | Hard | RP events (`+28`/`−14`, Rule 21) + `encounter = ranked` + victory flag, inside the committed `BattleResult`; battle-start signal (forfeit detection, Rule 11) | battle owns emission + battle rules; ranked-league owns ladder application |
| accounts-backend | Upstream | Hard | RP total + RP history storage; identity; server clock (season boundary + grace window); server-computed outcome validation for ranked commits (Core Rule 6 escalation) | AB owns storage/atomicity/trust mechanics; ranked-league owns ladder rules |
| meta-progression | Upstream | Soft | Study-board payload: `mastered_words` count + `streak` (adopted verbatim, Rule 8) | meta owns counters; ranked-league owns board presentation semantics |
| opponent-ai | Upstream | Soft | Ranked GhostProfile defaults via the encounter config (accuracy 0.70, HP 500, reveal 800 ms — opponent-ai-owned registry constants) | opponent-ai owns profile + roll; ranked-league only selects the mode |
| question-content | Upstream | Soft | Ranked encounters draw from the rotation module's module × round-type pools (`min_battle_pool_size = 8` gate unchanged); no new pool type | question-content owns pools/schemas; ranked-league owns the rotation rule only |
| ui-shell | Downstream | Hard | Ranked screen, league board (2 tabs), tier badge/division pips, season summary, disclosure labels | ranked-league owns semantics/data; ui-shell owns rendering |
| tower / forge-srs / equipment / speech-io | None | — | No interface — ranked reads no tower state, consumes no runes/gear, adds no speech surface | — |
| analytics | Downstream (post-MVP) | Soft | RP events, season rollover, forfeit events as telemetry (Full Vision per systems index) | analytics owns instrumentation |

## Formulas

*(Formulas authored from the systems-designer proposal, 2026-11-09; determinism
rule throughout: integer arithmetic only — server and client must derive
identical boards from stored integers alone.)*

### RL1 — Tier and division resolution

The tier/division resolver is defined as:

```
tier        = max { t ∈ {Bronze, Silver, Gold, Diamond, Grandmaster} : floor_t ≤ rp }
span_t      = next_floor_t − floor_t          (Bronze 1000; Silver/Gold/Diamond/Grandmaster 300)
offset      = rp − floor_t
offset      = min(offset, 300)                (Grandmaster only — span cap)
div_index   = min(2, floor(3 × offset ÷ span_t))
division    = [III, II, I][div_index]
```

**Variables:**

| Variable | Type | Range | Source | Description |
|---|---|---|---|---|
| `rp` | int | 0 – ∞ | calculated (RL2) | Account's ranked points; tier is derived on read, never stored (Core Rule 2) |
| `floor_t` | int | {0, 1000, 1300, 1600, 1900} | data file | Tier floors Bronze/Silver/Gold/Diamond/Grandmaster (tuning knob) |
| `next_floor_t` | int | {1000, 1300, 1600, 1900, 2200} | data file | Next tier's floor; Grandmaster's virtual next-floor 2200 implements the +300 span cap |
| `span_t` | int | {1000, 300} | calculated | Tier RP span; Bronze is the long on-ramp tier |
| `offset` | int | 0 – span_t (GM: capped 300) | calculated | RP into the tier |
| `div_index` | int | 0 – 2 | calculated | 0 = III, 1 = II, 2 = I |
| `tier`, `division` | enum | 5 tiers × 3 divisions | calculated | Displayed rank; 15 total states |

**Output Range:** exactly one (tier, division) pair for every `rp ≥ 0`; Grandmaster I is the open-ended top (`rp ≥ 2100` maps to GM I forever). `rp < 0` is impossible via RL2; defensive handling (clamp to 0 before resolve) is Edge Case behavior.

**Example (all six boundaries):**

| rp | tier | offset | div_index | division |
|---|---|---|---|---|
| 999 | Bronze | 999 | floor(2997/1000) = 2 | Bronze I |
| 1000 | Silver | 0 | 0 | Silver III |
| 1299 | Silver | 299 | floor(897/300) = 2 | Silver I |
| 1900 | Grandmaster | 0 | 0 | Grandmaster III |
| 2100 | Grandmaster | 200 | floor(600/300) = 2 | Grandmaster I |
| 2200 | Grandmaster | 300 → capped | min(2, 3) = 2 | Grandmaster I |

Note: Bronze's 1000-span thirds are uneven by 1 RP (III 0–333, II 334–666, I 667–999) — an integer-arithmetic artifact, cosmetic only. Silver–GM split at exact thirds (100/100/100 within a 300 span).

### RL2 — RP application

The ranked RP application rule is defined as:

```
Δ    = +28 (victory) | −14 (defeat)          (battle-system Rule 21 values, adopted Alpha-final)
rp'  = max(rp + Δ, 0)
```

**Variables:**

| Variable | Type | Range | Source | Description |
|---|---|---|---|---|
| `rp` | int | 0 – ∞ | calculated | RP total before the commit |
| `Δ` | int | {−14, +28} | data file | RP event from the committed `BattleResult` (`encounter = ranked` only; friend/tower Δ = 0 never reach this system). Values owned by battle-system Rule 21, mirrored here |
| `rp'` | int | 0 – ∞ | calculated | New RP total; the single stored integer (Core Rule 2) |

**Output Range:** [0, ∞). Lower bound: any `rp ≤ 14` on a loss floors to 0 — Bronze III is the absolute floor (Core Rule 4), no negative state, no debt. Upper bound deliberately unclamped: Grandmaster I must stay open-ended (RL1).

**Example:** rp = 12, defeat → max(12 − 14, 0) = **0** (Bronze III). rp = 1007, defeat → **993** (re-resolves to Bronze I — automatic demotion, Core Rule 4). rp = 1272, victory → **1300** (crosses the Gold floor exactly; instant promotion, no intermediate state).

### RL3 — Simulated-peer weekly trajectory

The peer board generator is defined as:

```
peer_seed_i    = H(season_id ‖ account_id ‖ i ‖ "roster")
base_i         = max(0, floor_T − 100 + rng_int(peer_seed_i ‖ "base", 0, span_T + 200))
drift_(i,d)    = rng_int(peer_seed_i ‖ "drift" ‖ d, −20, +20)
rp_peer(i, d)  = max(0, base_i + Σ_{k=1..d} drift_(i,k))
mastered_i     = max(0, player_mastered_at_season_start + rng_int(peer_seed_i ‖ "mastered", −80, +120))
streak_i       = max(0, player_streak_at_season_start + rng_int(peer_seed_i ‖ "streak", −5, +8))
```

`T` = the player's tier at season start (Core Rule 6 grouping key); `d` = season day, 0 = Monday … 6 = Sunday (derived in RL5); `H` = the pinned PRNG/hash primitive from the PRNG ADR (OQ-BS1 / OA-OQ2) — ranked-league pins no algorithm of its own, mirroring opponent-ai's F2 contract; `rng_int(seed, lo, hi) = lo + (H(seed) mod (hi − lo + 1))`.

**Variables:**

| Variable | Type | Range | Source | Description |
|---|---|---|---|---|
| `season_id` | int | ≥ 0 (RL5) | calculated | Season key — same season ⇒ same roster on every device (Core Rule 6) |
| `account_id` | int/string | AB identity | constant (upstream) | Per-account namespace so two players in the same tier see different rosters |
| `i` | int | 1 – 14 | data file | Peer index; roster size 14 (tuning knob) |
| `floor_T`, `span_T` | int | per RL1 | calculated | Season-start tier floor/span of the player's group |
| `base_i` | int | max(0, floor_T − 100) – floor_T + span_T + 100 | calculated | Season-start RP; draws ±100 beyond the tier edges so the board spans promotion and demotion zones. Peers are **RP-bracketed, not tier-strict** — the board sorts by RP and peer tier labels are cosmetic (ratified as Core Rule 6's reading of Rule 7) |
| `drift_(i,d)` | int | −20 – +20 | calculated | Stateless per-day delta, derived from a hash of (peer, day) — never a sequential PRNG stream, so any device recomputes day 5's board without replaying days 1–4. Symmetric range: peers are neither rigged to fall behind nor to overtake (Pillar 4) |
| `rp_peer(i, d)` | int | 0 – base_i + 120 | calculated | Peer RP shown on the PvP tab at day d |
| `mastered_i`, `streak_i` | int | ≥ 0; mastered within ±(80/120) of the player's season-start count | calculated | Study-tab flavor, drawn once per season (Rule 7: flavor, not trajectory), bracketed to the player's real counters so a fresh account (mastered 0, per meta MP6) is not shown a 350-word board it can never contest |

**Output Range:** `rp_peer` bounded below at 0, above at `base_i + 20 × 6 = base_i + 120` (weekly max climb). `mastered_i`/`streak_i` bounded below at 0.

**Determinism contract (load-bearing):** the season-start blob stores `base_i`, `mastered_i`, `streak_i` and roster identity; daily drift is *recomputed*, not accumulated from stored state — server and client derive identical boards from `season_id + account_id` alone. `H`'s modulo-bias handling for `rng_int` settles in the PRNG ADR (ranges here ≤ 501, bias negligible but the ADR should bless it once).

**Example:** season 2967, account 42, Silver at season start (floor 1000, span 300). Peer 3: base = max(0, 900 + rng_int(·, 0, 500)) → say 1120. Drifts d1–d5: +12, −5, +18, −9, +3 → rp_peer(3, 5) = 1120 + 19 = **1139**. mastered_3 = 40 + rng_int(·, −80, +120) → say 77; streak_3 = 6 + rng_int(·, −5, +8) → say 9.

### RL4 — Daily module rotation

The ranked module rotation is defined as:

```
days_ict   = floor((unix_time_ms + 7 × 3 600 000) ÷ 86 400 000)      (ICT = UTC+7, fixed, no DST)
module     = MODULES[days_ict mod 4],  MODULES = [daily, toeic, ielts, it]   (fixed order)
```

**Variables:**

| Variable | Type | Range | Source | Description |
|---|---|---|---|---|
| `unix_time_ms` | int | ≥ 0 | constant (upstream) | Server clock at queue time (Core Rule 6's boundary clock) |
| `7 × 3 600 000` | int | — | constant | Asia/Ho_Chi_Minh offset |
| `days_ict` | int | ≥ 0 | calculated | Whole days since epoch on the ICT calendar — shared by RL5 |
| `MODULES` | enum[4] | the 4 content modules | constant | Fixed order; the module set is content-owned (question-content), rotation only indexes it |
| `module` | enum | {daily, toeic, ielts, it} | calculated | The ranked encounter config's module (Core Rule 9) |

**Output Range:** exactly one of the 4 modules, uniformly visited. Keying on `days_ict` rather than season-day means the rotation does not reset on Mondays — a 7-day season is ≡ 3 mod 4, so each season opens on a different module; week-over-week variety for free.

**Example:** `days_ict` = 20766 (Monday 2026-11-09 ICT) → 20766 mod 4 = 2 → **ielts**. Next day 20767 → **it**.

### RL5 — Season identifier and boundary

The season identifier is defined as:

```
season_id = floor((days_ict + 3) ÷ 7)
```

**Variables:**

| Variable | Type | Range | Source | Description |
|---|---|---|---|---|
| `days_ict` | int | ≥ 0 | calculated (RL4) | ICT whole days since epoch. Unix day 0 (1970-01-01) was a Thursday; +3 shifts the step to land on Monday 00:00 ICT |
| `season_id` | int | ≥ 0, non-decreasing | calculated | Week index; rendered as a label by ui-shell (e.g. "Season #2967") |

**Output Range:** [0, ∞), unbounded and monotonic — deliberately chosen over ISO week numbers, whose year-boundary rollover would break "same season_id ⇒ same roster" determinism at exactly the moment the board is most visible. `season_id` increments precisely when `days_ict ≡ 4 (mod 7)`, i.e. Monday 00:00 Asia/Ho_Chi_Minh — the `Settling → Active` transition in States and Transitions. Season day for RL3: `d = (days_ict + 3) mod 7` (Monday ≡ 0, Sunday ≡ 6).

**Example:** `days_ict` = 20766 (Mon 2026-11-09) → floor(20769 ÷ 7) = **2967**. Sunday of that week (20772) → 2967 (unchanged); next Monday (20773) → **2968**.

### Constant candidate — grace window

| Name | Value | Unit | Source | Notes |
|---|---|---|---|---|
| `ranked_forfeit_grace_min` | 15 | minutes | constant (ADR-0003 §4) | Measured from `started_at` (server clock, the battle-start registration) to the battle's result resolution; client events do not extend the window (ADR-0003 §4 supersedes the earlier "last client event" reading). Safe band 10–30 min; blessed at 15. Consumed by accounts-backend forfeit detection — cross-system fact, registry candidate |

### Climb-rate analysis — input to OQ-RL1

Expected RP per battle at win rate p: `E = 28p − 14(1 − p) = 42p − 14`. The 0 → 1000 Bronze climb:

| Win rate | E RP/battle | Battles to Silver (1000) | Sessions (4 battles) | First division beat (III→II at rp 334) |
|---|---|---|---|---|
| 55 % | 9.1 | ≈ 110 | ≈ 28 | ≈ 37 battles |
| 60 % | 11.2 | ≈ 90 | ≈ 23 | ≈ 30 battles |
| 70 % | 15.4 | ≈ 65 | ≈ 17 | ≈ 22 battles |

Variance: per-battle sd at 55 % ≈ 21 RP, so the climb carries a ±20 % spread (a 55 % player sees roughly 90–130 battles, not a flat 110). Session-level morale math is sound: 4-battle sessions are net-positive at 2 W 2 L (+28) and better; only 1 W 3 L (−14) or 0 W 4 L (−56, floored) lose RP — a session feels like progress unless the player genuinely lost it.

**Recommendation (advisory — thresholds untouched):** keep Silver at 1000 for Alpha. At a realistic 60 % win rate the climb is ~23 sessions (~4–6 h of ranked play); Bronze's long span makes the first division promotions early and frequent reward beats; floor 0 means demotion pressure is absent exactly where new players are most fragile. The prototype validated these thresholds only from a mid-Gold start (1420) — the honest position is "defensible, unverified from 0." Retune trigger: *if playtest median time-to-Silver exceeds ~2 weeks of daily play (~14 sessions), drop the Silver floor to 600–700* — a one-line data-file change; every formula here is floor-parametric. Secondary lever if the grind feels ghost-driven: `ghost_accuracy_ranked` 0.70 is the actual win-rate determinant — retune that before touching floors.

## Edge Cases

- **E1 — If a ranked defeat lands at RP 0**: RP clamps at 0 (RL2) — the ladder never goes negative and Bronze III is the hard floor. The defeat still counts in history; only the delta is swallowed.
- **E2 — If RP lands exactly on a tier floor (e.g. 1000)**: the player belongs to that tier (floors are inclusive, `rp ≥ min`) — 1000 is Silver III, not "almost Silver". Division math in RL1 uses the same inclusive boundary.
- **E3 — If the player's RP crosses a tier boundary mid-season**: the ladder (badge, tier, division) updates immediately on the next read, but the **league group does not re-form** — the roster was drawn from the season-start tier and stays fixed until rollover (Rule 6). A player who climbs out of their group's band can hold rank #1; nothing clamps them to the peers' band.
- **E4 — If the player never queues ranked all season**: their RP stays flat while peers drift (RL3) — they slide down the PvP board as the week progresses. The season still settles: they get a placement summary. No inactivity penalty exists at Alpha.
- **E5 — If a ranked battle is committed during `Settling` (the Monday 00:00 boundary)**: the RP delta still applies (the ladder is season-independent), but the frozen board keeps its settle-time snapshot; the new season's board shows the updated RP from its first render. No delta is lost and none is applied twice.
- **E6 — If a client submits a ranked result after the grace window already recorded the forfeit**: the late result is **rejected** — the forfeit stands and the result's RP event is not applied (first resolution wins; a second application would let a lost cause become a win by replaying it). This rejection is only possible once the trust model ships (Core Rule 10); until then the discard rule makes the case unreachable.
- **E7 — If the ranked queue is tapped during `Settling`**: queueing is disabled for the settling instant — the encounter config needs the new season's rotation module (RL4) and group; the UI shows the season-summary screen instead. Duration is one rollover transaction, not a downtime window.
- **E8 — If the device clock is wrong (skewed past a season boundary)**: nothing changes — season boundary, rotation day, and grace window all key on the **server clock** (accounts-backend), mirroring meta-progression's daily boundary and forge-srs's server-time eligibility rule. The client never decides a boundary.
- **E9 — If `mastered_words` or `streak` is 0 at first read**: the Study tab renders 0 for the player and ranks accordingly (bottom until counters grow). Meta-progression already guarantees defined-from-birth counters (its Core Rule 13); no special case here.
- **E10 — If two peers' or a peer and the player's sort keys tie (same RP, or same mastered+streak)**: deterministic tiebreak by account/peer identity string (**code-unit lexicographic** — UTF-8 byte order, never locale-aware collation, which varies per device) — the same tie must resolve identically on every device.
- **E11 — If the player reaches RP above the Grandmaster cap span (2200+)**: tier stays Grandmaster, division stays I (RL1's capped span); the raw RP value keeps increasing and is what the board sorts by. There is no rank above GM I at Alpha.
- **E12 — If a ranked commit and a quest claim race (same account, same instant)**: both go through accounts-backend's whole-commit rejection — one wins, the loser retries; RP application and quest rewards never merge into a partial write. (Cross-ref: accounts-backend AC-C2 / meta-progression Core Rule 9.)
- **E13 — If a forfeit would push RP below 0**: same clamp as a played defeat — floor 0 (RL2 applies to forfeit deltas identically).
- **E14 — If a season boundary falls on a leap-day or year edge**: the boundary is computed from epoch days (RL5), not calendar strings — Asia/Ho_Chi_Minh is a fixed +07:00 zone with no DST, so `epoch_day div 7` style arithmetic has no leap/DST failure mode.

## Dependencies

**Upstream dependencies** (decisions this system must respect):

| System | Tier | Hard/Soft | Interface | Owner of semantics | Status |
|---|---|---|---|---|---|
| battle-system | Alpha | Hard | RP events (`+28` win / `−14` loss — adopted Alpha-final by Core Rule 1, resolving the RP half of OQ-BS3), `encounter = ranked` + victory flag in the committed `BattleResult`; battle-start signal for forfeit detection | battle owns emission; ranked-league owns ladder application | GDD Approved |
| accounts-backend | Alpha | Hard | RP total + RP history storage; identity; server clock (season boundary, rotation day, grace window); **server-computed outcome validation for ranked commits** (Core Rule 6 escalation — required before this tier ships) | AB owns storage/atomicity/trust mechanics; ranked-league owns ladder rules | GDD Approved |
| meta-progression | Alpha | Soft | Study-board payload: `mastered_words` count + `streak` — **adopted verbatim by Core Rule 8 (resolves OQ-MP3)** | meta owns counters; ranked-league owns board presentation semantics | GDD Approved |
| opponent-ai | Alpha | Soft | Ranked GhostProfile defaults through the encounter config (accuracy 0.70, HP 500, reveal 800 ms) + ghost identity/naming for the match banner | opponent-ai owns profile + roll; ranked-league selects the mode and renders nothing itself | GDD Approved |
| question-content | Alpha | Soft | The rotation module's module × round-type pools (unchanged gates — `min_battle_pool_size = 8`); no new pool type introduced | question-content owns pools/schemas; ranked-league owns the rotation rule only | GDD Approved |

All five upstream systems have Approved GDDs — this GDD introduces no new
provisional contract *into* an upstream system. Its one outward-facing change
is an adoption, not an extension: the meta payload and the RP values are taken
as-is (Core Rules 1, 8).

**Downstream dependents** (bidirectional note: each listed GDD must name
ranked-league in its own Dependencies section once authored):

| System | Tier | Hard/Soft | Interface | Owner of semantics | Status |
|---|---|---|---|---|---|
| ui-shell | Alpha | Hard | Ranked screen, league board (PvP + Study tabs), tier badge/division pips, season summary, disclosure labels, forfeit/result feedback | ranked-league owns semantics/data; ui-shell owns rendering | GDD not yet authored |
| analytics | Full Vision | Soft | RP events, season rollover, forfeit events, rotation-module mix as telemetry | analytics owns instrumentation | not designed (Full Vision) |

**Explicit non-dependencies**: tower (reads no tower state; tower's floors are
PvE progression, ranked is PvP-framed ghost duels — separate ladders, shared
battle engine only), forge-srs (no rune surface — ranked reads *purified*
counts via meta's payload, never the queue), equipment (no loadout authority —
the LoadoutSnapshot travels in the encounter config battle-side), speech-io
(no speech surface), localization (string discipline applies to tier/zone
labels but is not a system dependency).

**Bidirectionality check** (verified against each upstream GDD): battle-system
names ranked-league (Dependencies row "RP events ±28/−14; ranked-league owns RP
tier math", status "GDD not yet authored" — its next edit updates the status
and may mark the RP half of OQ-BS3 resolved-pointing-here per Core Rule 1) ✓;
accounts-backend names ranked-league (Alpha Hard row, trust-model escalation
chain) ✓ — and this GDD answers the adoption half of its OQ#3 (Core Rule 10);
meta-progression names ranked-league (provisional payload row + OQ-MP3) ✓ —
resolved by adoption here; opponent-ai names ranked-league (Downstream Soft —
accuracy tier + banner material) ✓; question-content does not name
ranked-league — none required, since this GDD consumes its pools through the
existing battle contract and adds no new pool requirement (its dependency row
here is Soft informational). The one-sided rows are battle-system's stale
status strings only — carry-in noted, no contradiction.

**Trust-model carry-in**: Core Rule 10's server-validation requirement lands
as work in accounts-backend's companion ADR (mechanism) and battle-system's
next edit (battle-start telemetry), not in this GDD — ranked-league states the
requirement and its scope, the ADR states the how.

## Visual/Audio Requirements

Ranked-league owns **no battle VFX and no audio** — all in-battle theater is
battle-system's, all screen rendering is ui-shell's. What this system
contributes is *semantic color data*, from the prototype's validated palette:

| Element | Data owned here | Notes |
|---|---|---|
| Tier colors | Bronze `#B45309` · Silver `#94A3B8` · Gold (theme gold) · Diamond (theme cyan) · Grandmaster `#F43F5E` | Prototype values, carried as data; ui-shell maps them to theme tokens |
| Zone highlights | Promotion `#10B981` (top 5) · Demotion `#F43F5E` (bottom 3) | Zone dividers are ui-shell components fed by board position |
| Disclosure labels | "Đối thủ mô phỏng" / simulated-roster wording | Pillar 4 requirement — presence, not styling, is owned here |
| Rank-up / rank-down | Derived flag from RL1 transition (old tier/division → new) | ui-shell chooses the flourish; ranked-league only reports the transition |

Audio: none — no rank-up jingle, no season-roll sting is specified at Alpha
(the game has no SFX layer at MVP; adding one is a game-wide decision, not
this system's).

📌 **Asset Spec** — Visual/Audio requirements are defined. After the art bible
is approved, run `/asset-spec system:ranked-league` to produce per-asset
visual descriptions, dimensions, and generation prompts from this section.

## Game Feel

The target feeling is **"my standing is real"** — the board is a mirror the
player believes because it moves when they move. Three anchor moments:

- **The climb tick.** Every ranked result visibly moves RP and the tier track;
  the ±delta is shown with the same legibility as battle damage numbers. A
  tier crossing is a *state change*, not a progress increment — the badge
  changes identity (color + name + division pips), which is what makes Bronze
  → Silver feel earned rather than logged.
- **The living board.** Peers drift over the week (RL3), so re-opening the
  league screen is a check-in, not a static table — the player can gain or
  lose a place *without playing*, which is what makes the weekly loop a habit.
  This only works honestly because the disclosure label is always present:
  the board is alive *and labeled simulated* (Pillar 4).
- **The settle.** Monday's placement summary is a receipt — where I finished,
  what it cost, what the new group looks like. It should read in under five
  seconds; nothing at Alpha hinges on it (no rewards, OQ-RL2), so the settle
  stays light rather than ceremonial.

Anti-goal: pressure theater. No "X players online", no countdown urgency on
the queue button, no demotion alarm — the ladder's stakes are the ±14/28 RP
swing, presented plainly.

## UI Requirements

| Surface | Content | Owner of rendering |
|---|---|---|
| Ranked entry (Home) | One ranked-queue button + current tier badge/division + RP value; disabled during `Settling` | ui-shell (Home screen) |
| Match banner | Ghost-duel disclosure + ranked label (Pillar 4; prototype already labels ranked as ghost duels — carried forward) | ui-shell, fed by battle + opponent-ai profile fields |
| League screen — PvP tab | Tier header ("Gold League — Nhóm #14" pattern), 15-row board (14 peers + player highlighted), RP column, win-rate context, promotion-zone divider after rank 5, demotion-zone divider before bottom 3, disclosure label persistent | ui-shell; ranked-league supplies rows + zone positions |
| League screen — Study tab | Same roster sorted by `mastered_words` desc → `streak` desc; "từ đã thuộc" + "ngày" columns; same disclosure label | ui-shell; payload from meta-progression |
| Season summary (Monday) | Final placement, tier badge, new-season roster preview; replaces the queue button during `Settling` | ui-shell |
| Tier track | 5-tier progression strip (Bronze → Grandmaster) with current tier highlighted — prototype pattern carried forward | ui-shell |
| Forfeit notice | Result-modal wording when a battle was closed as a forfeit (grace-window expiry): states the −14 plainly | ui-shell, semantics from Core Rule 11 |

All strings Vietnamese-first (vi-VN), English tier names shown alongside
Vietnamese names per the prototype ("Gold League"); number formatting follows
the vi-VN separator decision already recorded for gold display
(meta-progression carry-in to ui-shell).

> **📌 UX Flag — ranked-league**: This system has UI requirements. In Phase 4
> (Pre-Production), run `/ux-design` to create a UX spec for each screen this
> system contributes to (ranked entry, league board ×2 tabs, season summary)
> **before** writing epics. Stories that reference UI should cite
> `design/ux/[screen].md`, not the GDD directly.

## Cross-References

| Referenced system | What is referenced | Where in this GDD |
|---|---|---|
| battle-system | Rule 21 RP events (±28/−14, ranked-only); Core Rule 2 encounter config; BattleResult fields; battle-start signal; OQ-BS3 RP half | Core Rules 1, 5, 10, 11; Dependencies |
| accounts-backend | Core Rule 6 trust model + escalation chain; whole-commit rejection (AC-C2); server clock | Core Rules 10–11; Edge Cases; Dependencies |
| meta-progression | Study-board payload (`mastered_words` + `streak`, Core Rules 11–12, MP6); server-clock boundary precedent (Core Rule 10); OQ-MP3 | Core Rule 8; Edge Cases; Dependencies |
| opponent-ai | Ranked GhostProfile defaults (`ghost_accuracy_ranked` 0.70, `ghost_hp_ranked` 500, `answer_reveal_delay_ms_ranked` 800); banner material | Core Rule 5; Interactions; Dependencies |
| question-content | Module × round-type pools; `min_battle_pool_size = 8` (F1) | Core Rule 9; Dependencies |
| game-concept | Tier thresholds + divisions (Long-Term Progression); Pillar 4; Alpha scope ("ranked/league layer") | Overview; Core Rules 2, 6; Game Feel |

## Acceptance Criteria

> **Source**: qa-lead consultation, 2026-11-09 (RKL1–RKL25, coverage-verified
> against all 12 Core Rules, formulas RL1–RL5 + the grace constant, and every
> Edge Case E1–E14 as labeled in file order). **Prefix note**: AC ids use
> **RKL** — RL1–RL5 are taken by the formulas, and OQ-RL1–6 by the open
> questions (house precedent: tower's formulas F1–F3 → ACs TW1–23;
> speech-io's formulas S1–S3/P1 → ACs SI1–26).
> **Legend**: **[unit]** = vitest, deterministic, DI-injected collaborators and
> **DI-injected fake server clock** (season boundary, rotation day and grace
> window are server time, Asia/Ho_Chi_Minh — no criterion reads the device
> clock and none sleeps), home `tests/unit/ranked-league/`, BLOCKING;
> **[integration]** = automated cross-system test, BLOCKING;
> **[statistical]** = **unused here by design — ranked-league owns zero
> platform RNG**. RL3's peers are generated from the PRNG ADR's pinned hash
> `H`: a pure function of (season_id, account_id, day), so the board is *fixed
> given the seed*, not sampled — there is no distribution to test, and H's own
> output distribution/modulo-bias belongs to the PRNG ADR's suite
> (OQ-BS1 / OA-OQ2). The climb-rate table is closed-form arithmetic plus
> playtest expectations (input to OQ-RL1), never this suite;
> **[screenshot]** = retained in `production/qa/evidence/`, BLOCKING at every
> `qa.level` (never waived).
> *(provisional — blocked on the server-trust ADR)* = RKL6, RKL7: Core Rules
> 10–11 state the requirement here; the mechanism (recompute vs replay-verify,
> session telemetry, grace-window detection) is the technical-director's ADR
> (OQ-RL4), owed before Alpha ships — in a client-trusted interim build these
> triggers are unreachable. **Sequencing note**: stories implementing Core
> Rules 10–11 carry no runnable evidence until the ADR lands — sequence them
> behind it rather than opening them early. *(provisional: ui-shell
> undesigned)* = RKL21–25 — written against the semantic data this GDD owns,
> capture when ui-shell ships. The battle-system, accounts-backend and
> meta-progression contracts are **non-provisional** (all three GDDs
> Approved). Exact-value fixtures for RL3's board pin when the PRNG ADR pins
> `H`; the determinism properties in RKL8–RKL9 are H-agnostic and assertable
> now against any pure injected hash.
>
> Shared numbers, restated so no criterion requires reading other sections:
> victory → RP **+28**, defeat → **−14**, ranked encounters only (battle Rule
> 21 mirror, adopted Alpha-final); tier floors **Bronze 0, Silver 1000, Gold
> 1300, Diamond 1600, Grandmaster 1900**, GM span capped +300 (virtual next
> floor 2200 → GM I open-ended); divisions III<II<I in thirds of the tier span
> (Bronze's 1000-span thirds uneven by 1 RP: III 0–333, II 334–666, I 667–999);
> new account starts **RP 0 = Bronze III**; demotion automatic, unprotected; RP
> floors at 0. Season = Monday 00:00 → Sunday 24:00 Asia/Ho_Chi_Minh, server
> clock, fixed +07:00, no DST; `days_ict = floor((unix_time_ms + 25 200 000) ÷
> 86 400 000)`; `season_id = floor((days_ict + 3) ÷ 7)`, incrementing when
> `days_ict ≡ 4 (mod 7)`; season day `d = (days_ict + 3) mod 7` (Mon = 0 … Sun
> = 6). Group = **14 simulated peers + the player**, banded on the season-start
> tier T: `base_i ∈ [max(0, floor_T − 100), floor_T + span_T + 100]`; daily
> drift ±20 recomputed statelessly from a pure hash (never a sequential
> stream); `rp_peer(i, 6) ≤ base_i + 120`; `mastered_i ∈ [max(0, M − 80),
> M + 120]`; `streak_i ∈ [max(0, S − 5), S + 8]` (M, S = player's season-start
> counters). Rotation `MODULES = [daily, toeic, ielts, it]`,
> `module = MODULES[days_ict mod 4]`. Board: PvP sorts RP desc, Study sorts
> mastered desc → streak desc; ties break by identity string in **code-unit
> lexicographic UTF-8 byte order** (never locale-aware); 15 rows; promotion
> zone = top 5, demotion zone = bottom 3 — presentation mirrors that grant and
> remove nothing. Grace window **15 minutes** (provisional pending the trust
> ADR). Study payload = `{mastered_words, streak}` from meta-progression (its
> MP-AC23 pins the shape). Fixed instants used throughout: days_ict **20766** =
> Mon 2026-11-09 00:00 ICT (season **2967**, day 0, module **ielts**); boundary
> tests inject 2026-11-15T23:59:59+07:00 → 2026-11-16T00:00:00+07:00
> (days_ict 20772 → 20773, season 2967 → 2968); season-open Mondays
> 20766 / 20773 / 20780 / 20787 rotate ielts / toeic / daily / it.

- **RKL1 [unit] — New account is the zero state; the ladder stores one integer (Core Rule 3 + Core Rule 2).** **GIVEN** a brand-new account, **WHEN** the ladder materializes, **THEN** RP = 0, resolving to Bronze III; **and THEN** the prototype's demo start (RP 1420) exists only in test fixtures — a static sweep of the module's initialization path finds neither; **and THEN** the persisted ranked state holds exactly one RP integer plus the season objects (roster blob, placement record, applied-commit keys) — no stored tier, division, board position or unlock field exists (static on the serializer's output shape; tier re-derives on read per Core Rule 2, twin of tower TW11's schema pin).
- **RKL2 [unit] — RL1 resolves the full boundary table; floors are inclusive; GM I is open-ended (Formula RL1 + Core Rule 2 + E2, E11).** **GIVEN** rp ∈ {0, 333, 334, 666, 667, 999, 1000, 1299, 1300, 1599, 1600, 1899, 1900, 2000, 2099, 2100, 2200, 50 000}, **WHEN** the resolver computes, **THEN** the pairs are exactly Bronze III, Bronze III, Bronze II, Bronze II, Bronze I, Bronze I, Silver III, Silver I, Gold III, Gold I, Diamond III, Diamond I, Grandmaster III, Grandmaster II, Grandmaster II, Grandmaster I, Grandmaster I, Grandmaster I — 1000 is Silver III (the floor belongs to the tier, E2) and every rp ≥ 2100 is Grandmaster I forever (the +300 span cap, E11); **and THEN** no other output is producible — the resolver is a pure function of the one stored integer (sweep-verified: recomputing from RP alone always reproduces the pair), and it clamps a defensively-negative input to 0 before resolving.
- **RKL3 [unit] — RL2 applies ±28/−14 exactly, floors at 0, and demotes without ceremony (Formula RL2 + Core Rules 1, 4 + E1).** **GIVEN** the committed event's victory/defeat flag, **WHEN** the delta applies, **THEN** rp = 12 on a defeat → **0** (Bronze III — the ladder never goes negative, no debt state, E1); rp = 0 on a defeat → stays 0; rp = 1007 on a defeat → **993**, re-resolving to **Bronze I** — an automatic, unprotected demotion with no shield, grace game or decay branch (Core Rule 4; static: none exist); rp = 1272 on a victory → **1300** = Gold III (exact floor crossing promotes instantly, no intermediate state); rp = 2199 on a victory → 2227, still GM I; **and THEN** the values +28/−14 are read from the event fields only — the module references battle-system's Rule 21 constants by name and no local copy exists (static), and the upper bound is unclamped (no cap constant).
- **RKL4 [unit] — Non-ranked results never touch the ladder (Core Rule 1).** **GIVEN** committed results with `encounter` = friend, tower, or any non-ranked value — including victories, **WHEN** each reaches the ladder, **THEN** RP is unchanged, no RP-history entry is written, and no tier transition fires; **and THEN** the resolver consumes only `encounter = ranked` (static: the filter is structural, not a defaulted read) — RP events on friend/tower encounters are 0 by battle's Rule 21 and never reach this system.
- **RKL5 [integration] — The battle→RP commit is atomic, seed-keyed exactly-once, and race-safe (Core Rules 1, 10 + E12; accounts-backend AC-C2).** **GIVEN** a committed ranked victory with seed `b-77123` (battle-system Approved contract, accounts-backend Approved commit machinery), **WHEN** it applies, **THEN** RP +28 and the history entry land in ONE atomic commit with the battle result — never an optimistic local write; **and GIVEN** the same seed re-delivered N times (client timeout retry), **THEN** the first delivery writes and every re-delivery is a no-op — RP moves by exactly +28 once; **and GIVEN** a ranked commit racing a quest-claim commit at the same instant on the same account, **THEN** accounts-backend's whole-commit rejection picks one winner and the loser retries — RP application and quest rewards never merge into a partial write (E12). *(Non-provisional: both upstream GDDs Approved — the trust-model escalation adds validation on top of this commit, it does not change it.)*
- **RKL6 [integration, provisional — blocked on the server-trust ADR] — A failed server validation refuses the RP delta (Core Rule 10).** **GIVEN** the ADR's server-computed validation for ranked commits, **WHEN** a submitted result fails verification against the battle seed + answer log, **THEN** the RP event is not applied, RP and history are exactly pre-commit, and the rejection is recorded against the account; a valid result still applies per RKL5. *(provisional: the mechanism — recompute vs replay-verify, session telemetry — is the technical-director's ADR (OQ-RL4 / AB companion ADR); under the interim client-trusted model this trigger is unreachable, so the criterion asserts nothing until the trust model ships.)*
- **RKL7 [integration, provisional — blocked on OQ-RL4] — The grace window records one forfeit; late results lose (Core Rule 11 + grace constant + E6, E13).** **GIVEN** the server observed battle-start at T and no committed result arrives, **WHEN** the injected server clock reaches T + 15 min (at T + 14:59 nothing has fired), **THEN** exactly one forfeit is recorded: RP −14 with the RL2 floor (a forfeit at rp ≤ 14 lands on 0, E13), no rewards, no runes, and the result path flagged "forfeit" for the modal; **and GIVEN** a forfeit already recorded, **WHEN** the battle's result commits late, **THEN** it is rejected whole — the forfeit stands, the result's RP event is not applied (first resolution wins; replaying a lost cause into a win is impossible, E6), and a second expiry writes nothing (idempotent); **and GIVEN** an abandoned friend or tower battle, **THEN** no forfeit path triggers — battle-system's silent discard stands (spy: the forfeit machinery is never entered for non-ranked encounters). *(provisional: battle-start telemetry, the exact window mechanics and edge behavior are OQ-RL4 / the trust ADR; `ranked_forfeit_grace_min` = 15 is itself provisional with a 10–30 min safe band — the criterion asserts the boundary semantics at whatever value the ADR blesses.)*
- **RKL8 [unit] — RL3 is seed-deterministic and drift-stateless: same season + account, same board, on any device, from any starting day (Formula RL3 + Core Rule 6).** **GIVEN** season 2967, account 42, season-start tier Silver, and any pure injected hash as `H`, **WHEN** the roster derives twice in two fresh instances with no shared state (the "two devices" reading), **THEN** the 14-peer rosters are identical — same identities, same `base_i`, `mastered_i`, `streak_i`; **and GIVEN** the season-start blob alone, **WHEN** day d = 5's board computes, **THEN** it is derived from `season_id + account_id + d` alone — drift is a pure function of (peer, day), recomputed not accumulated (spy: no day-1–4 state is read or replayed; static: no sequential PRNG stream, no stored per-day deltas); **and THEN** re-deriving on every read is pure — N recomputations yield one identical board (static: no `Math.random` / `Date.now` in the derivation path). *(Exact board fixtures pin when the PRNG ADR lands — the properties above hold for any pure H and are assertable now.)*
- **RKL9 [unit] — RL3 stays inside its brackets; peers are neither rigged ahead nor behind (Formula RL3 + Pillar 4).** **GIVEN** a fixture sweep of seeds across peer indices 1–14 and days 0–6 for a Silver start (floor 1000, span 300), **WHEN** the generator computes, **THEN** every `base_i` ∈ [900, 1400] floored at 0 (±100 beyond the tier edges), every `rp_peer(i, 6)` ≤ `base_i` + **120** (six drift days × ±20 — d runs 0–6, so at most six drift terms sum), every `mastered_i` ∈ [max(0, M − 80), M + 120] and `streak_i` ∈ [max(0, S − 5), S + 8] around the player's season-start counters M, S, and every value ≥ 0; **and THEN** across the sweep both drift extremes (−20, +20) are attained — the symmetric range is real, not theoretical (Pillar 4: the board is honest in both directions); **and GIVEN** a fresh account (M = 0, S = 0 per meta MP6), **THEN** peer counters stay within their brackets of 0 — no 350-word board is generated against a 0-word player. *(Bounds are H-agnostic — assertable now; exact fixture values pin with the PRNG ADR.)*
- **RKL10 [unit] — The group keys on season-start tier and never re-forms mid-season (Core Rule 6 + E3).** **GIVEN** a season drawn while the player is Silver, **WHEN** the player's RP crosses into Diamond mid-season, **THEN** the roster is unchanged — same 14 peers, same base values, board membership untouched (static: no mid-season re-draw path exists); **and THEN** the player may hold rank #1 above the peers' band — nothing clamps their row into the group's RP bracket (E3's climb-out case, asserted with a fixture RP above the band).
- **RKL11 [unit] — PvP ordering is RP desc with a device-independent tiebreak; zones are position mirrors (Core Rule 7 + E10, E11).** **GIVEN** a fixture board containing two peers tied at the same RP, a peer–player tie, and a player above the entire band, **WHEN** the PvP tab composes, **THEN** rows sort by RP desc, ties broken by identity string in code-unit lexicographic UTF-8 byte order — the same tie resolves identically everywhere (static: no locale-aware comparator, no insertion-order dependence — E10's exact warning); **and THEN** the board is exactly 15 rows (14 peers + the player highlighted), the promotion divider falls after rank 5 and the demotion divider before rank 13 for any values, and the above-band player ranks #1 (E11 — raw RP sorts, no clamp).
- **RKL12 [unit] — The Study tab consumes the two-counter payload verbatim and fabricates nothing (Core Rule 8 + E9; consumption side of OQ-MP3).** **GIVEN** meta-progression's payload {mastered_words: 0, streak: 0} (fresh account) and a populated fixture payload {mastered_words: 214, streak: 6}, **WHEN** the Study tab composes, **THEN** the player's row carries exactly those counters — no per-word detail, no battle-only streak variant, no synthesized value when a counter is 0 (a fresh account ranks at the bottom legitimately until counters grow, E9); **and THEN** peers' study values are RL3-generated flavor drawn once per season and the payload carries nothing beyond the two counters (shape per meta MP-AC23 — non-provisional: meta Approved).
- **RKL13 [unit] — Placement grants and removes nothing (Core Rule 7 + OQ-RL2 + E4).** **GIVEN** boards at every position — #1, #5, #6, #13, #15 — **WHEN** each season settles, **THEN** no reward, no penalty, no RP change and no counter change follows from position (static: no placement-payout path exists; OQ-RL2 stays post-Alpha); **and GIVEN** an account that queued nothing all season (RP flat while peers drifted), **THEN** it settles identically — a placement summary, no inactivity penalty (E4's tail).
- **RKL14 [unit] — RL4 rotates the four modules in fixed daily order; seasons open on all four (Formula RL4 + Core Rule 9).** **GIVEN** days_ict 20766 / 20767 / 20768 / 20769, **WHEN** the rotation computes, **THEN** the modules are exactly ielts / it / daily / toeic (20766 mod 4 = 2 …), in the fixed order [daily, toeic, ielts, it]; **and GIVEN** a 28-day injected sweep, **THEN** each module serves exactly 7 days — uniform coverage, no skipped slot; **and GIVEN** the four season-open Mondays 20766 / 20773 / 20780 / 20787, **THEN** they map to four distinct modules (ielts / toeic / daily / it) — a 7-day season ≡ 3 mod 4, so no two consecutive seasons open the same module (the "week-over-week variety" claim, pinned); **and THEN** the module set is referenced from question-content's enum — the rotation owns the index, not the list (static: no local module copy).
- **RKL15 [unit] — RL5's season clock: exact table, Monday boundary, leap- and year-proof (Formula RL5 + E14).** **GIVEN** days_ict 20766 / 20772 / 20773, **WHEN** `season_id` computes, **THEN** 2967 / 2967 / 2968 — it increments exactly when days_ict ≡ 4 (mod 7) and never otherwise; **and GIVEN** season-day derivation, **THEN** d = (days_ict + 3) mod 7 gives 0 for 20766 (Monday) through 6 for 20772 (Sunday); **and GIVEN** a 3-year injected sweep across leap day (2028-02-28 → 02-29 → 03-01 ICT) and a year boundary (2027-12-31 → 2028-01-01 ICT), **THEN** season_id is monotone non-decreasing, increments exactly once per 7 days, and every increment lands on Monday 00:00 ICT — epoch-day arithmetic exhibits no leap/DST failure mode (E14).
- **RKL16 [unit] — The server clock governs; the device clock decides nothing (E8).** **GIVEN** the injected server clock and a device clock skewed +3 days and −3 days, **WHEN** season_id, rotation module, grace-window state and board day are read, **THEN** all are identical to the unskewed run (static: no device-clock read anywhere in the module — mirroring meta-progression's Core Rule 10 boundary and forge-srs's server-time rule).
- **RKL17 [unit] — The Settling instant: RP commits, the board freezes, the queue refuses (States + Core Rule 6 + E5, E7).** **GIVEN** the injected clock crossing Monday 00:00 ICT (2026-11-15T23:59:59+07:00 → 2026-11-16T00:00:00+07:00): **(a)** a ranked result committing exactly at the boundary applies its RP delta — none lost, none applied twice — while the frozen board keeps its settle-time snapshot and the new season's first render shows the updated RP (E5); **(b)** a queue tap during Settling composes no encounter config — the module for the new season is not yet served and the season-summary surface is what the client presents (E7; rendering is RKL23's), settling lasting one rollover transaction, not a downtime window; **(c)** the rollover itself records one placement summary per account, draws the new season's roster and group, and wipes the settled board at the *next* rollover (Live → Settled → wiped); the ordering leg of (a) rides RKL5's integration harness.
- **RKL18 [unit] — Rollover never resets RP (Core Rule 6, last sentence).** **GIVEN** rp = 1420 at the boundary, **WHEN** Settling → Active completes, **THEN** rp is still 1420 — the ladder is persistent; only the board re-rolls and the placement records (static: the rollover path writes no RP).
- **RKL19 [integration] — One honest queue button: the encounter config is exactly the ranked contract (Core Rule 5 + Core Rule 9).** **GIVEN** a queue tap on a normal season day (real battle-system module, DI-injected seed), **WHEN** the encounter config composes, **THEN** it is exactly {encounter: ranked, module: RL4's module for the server day, ghost profile: the ranked defaults — accuracy 0.70, HP 500, reveal 800 ms — referenced from opponent-ai's registry by name with no local copies (static), LoadoutSnapshot, seed} and it launches immediately — no matchmaking stage, no search-time value, no player-count or online-count field anywhere in the config or the ranked data path (static; Pillar 4: nothing may imply real opponents); banner material comes from opponent-ai's profile fields, not a ranked-league invention. *(Non-provisional: battle-system, opponent-ai and question-content all Approved; in-battle execution is battle's.)*
- **RKL20 [unit] — Ranked-league emits semantics, never pixels (Core Rule 12).** **GIVEN** the full module, **THEN** no rendering, styling or layout code exists in it (static: no DOM/scene/theme surface — tier colors, zone positions and disclosure strings travel as data per the Visual/Audio table); the badge transition report is the derived old→new pair from RL1 (RKL24's input), and every display concern listed in UI Requirements resolves to a ui-shell consumer (spy/static: the module's exports are data-only).
- **RKL21 [screenshot, provisional: ui-shell undesigned] — The PvP board renders the semantics (UI Requirements + Core Rule 7).** **GIVEN** a fixture board mid-season (injected clock advanced 3 days, reference H), **THEN** the league screen shows the tier header ("Gold League — Nhóm #14" pattern), 15 rows with the player highlighted, the RP column, the promotion divider after rank 5 and the demotion divider before the bottom 3, and the persistent simulated-roster disclosure ("Đối thủ mô phỏng") on both tabs; peer RP values differ from the season-open render — the living board reads as moved. Retained screenshots in `production/qa/evidence/`. *(provisional: the screens are ui-shell's — evidence pins the semantic rows + zone positions ranked-league emits; capture when ui-shell ships, never waived.)*
- **RKL22 [screenshot, provisional: ui-shell undesigned] — The Study tab renders diligence alongside skill (UI Requirements + Core Rule 8).** **GIVEN** the same roster with the study payload applied, **THEN** the Study tab sorts by mastered_words desc → streak desc with the "từ đã thuộc" and "ngày" columns, the same persistent disclosure label, and a fresh account's zero counters render as a legitimate bottom row — visually a ranked row, not an error or an empty state. Retained screenshots. *(provisional: ui-shell undesigned.)*
- **RKL23 [screenshot, provisional: ui-shell undesigned] — The settle is a receipt, and Settling reads as a summary, not downtime (States + UI Requirements + Game Feel).** **GIVEN** the injected clock inside Settling, **THEN** the Home ranked entry presents the season summary — final placement, tier badge, new-season roster preview — with the queue button disabled or absent, and no countdown, alarm or "players online" theater anywhere on the surface (the Game Feel anti-goal); a summary reads complete at a glance. Retained screenshots. *(provisional: ui-shell undesigned.)*
- **RKL24 [screenshot, provisional: ui-shell undesigned] — A tier crossing is a badge identity change, not an increment (Core Rule 2 + Visual/Audio + Game Feel).** **GIVEN** a commit carrying rp 999 → 1000 (and the demotion twin 1000 → 993), **THEN** the badge changes identity — Bronze `#B45309` "Đồng" → Silver `#94A3B8` "Bạc" (reverse for the demotion), division pips reset to III / show Bronze I — and the tier track highlights the new tier; the ±delta is displayed with damage-number legibility alongside. Retained screenshots. *(provisional: ui-shell owns every pixel; ranked-league supplies the transition pair — RKL2/RKL3's outputs.)*
- **RKL25 [screenshot, provisional: ui-shell undesigned — semantics from RKL7] — The forfeit notice states the cost plainly (Core Rule 11 + UI Requirements).** **GIVEN** a battle closed by grace-window expiry, **THEN** the result modal renders the forfeit wording with the −14 stated plainly — no blame language, no alarm styling — and it is visually distinct from a played defeat. Retained screenshots. *(provisional: ui-shell undesigned; unreachable before the trust ADR ships — capture with RKL7's enablement.)*

**Totals: 25 criteria — 16 unit, 4 integration (2 provisional: RKL6 on the
server-trust ADR, RKL7 on OQ-RL4), 5 screenshot (all provisional on ui-shell
— capture when it ships, never waived; the match banner is deliberately NOT
one of them: it is battle + opponent-ai-fed and pinned by battle's own ACs —
the BS37/BS38 pattern), 0 statistical. 18 criteria assertable now. No
statistical criteria by design: ranked-league owns zero platform RNG — RL3's
board is seeded-deterministic (a pure hash of season_id + account_id + day),
so peer values are fixed given the seed, not sampled; H's distribution
belongs to the PRNG ADR's suite (OQ-BS1 / OA-OQ2), and the climb-rate table
is advisory input to OQ-RL1, asserted (if at all) by playtest.**

**Coverage matrix** (all 12 Core Rules ≥ 1 AC): Rule 1: RKL3/RKL4/RKL5 ·
Rule 2: RKL1/RKL2/RKL20 · Rule 3: RKL1 · Rule 4: RKL3 · Rule 5: RKL19 ·
Rule 6: RKL8/RKL10/RKL15/RKL17/RKL18 · Rule 7: RKL11/RKL12/RKL13 ·
Rule 8: RKL12 · Rule 9: RKL14/RKL19 · Rule 10: RKL5/RKL6 · Rule 11:
RKL7/RKL25 · Rule 12: RKL20/RKL21–25. Formulas: RL1 → RKL2 (denominator
values pinned in the legend) · RL2 → RKL3 · RL3 → RKL8/RKL9/RKL10 ·
RL4 → RKL14/RKL16 · RL5 → RKL15/RKL16/RKL17 · grace constant → RKL7 ·
climb analysis → out of suite by design (see totals note). Every Edge Case
mapped (E1–E14 as labeled, file order): E1 → RKL3 · E2 → RKL2 · E3 → RKL10 ·
E4 → RKL13/RKL17 · E5 → RKL17(a) · E6 → RKL7 · E7 → RKL17(b)/RKL23 ·
E8 → RKL16 · E9 → RKL12 · E10 → RKL11 · E11 → RKL2/RKL11 · E12 → RKL5 ·
E13 → RKL7 · E14 → RKL15.

**Test-file home**: `tests/unit/ranked-league/` — `tier-resolution.test.ts`
(RKL1, RKL2) · `rp-application.test.ts` (RKL3, RKL4) · `peer-board.test.ts`
(RKL8, RKL9, RKL10) · `board-order.test.ts` (RKL11, RKL12, RKL13) ·
`rotation.test.ts` (RKL14) · `season-clock.test.ts` (RKL15, RKL16, RKL17,
RKL18) · `ownership-static.test.ts` (RKL20); `tests/integration/ranked-league/`
— `rp-commit.test.ts` (RKL5) · `queue-config.test.ts` (RKL19) ·
`commit-validation.test.ts` (RKL6 — created when the trust ADR lands) ·
`forfeit.test.ts` (RKL7 — ditto); screenshots RKL21–RKL25 →
`production/qa/evidence/`.

## Open Questions

| ID | Question | Owner | Target |
|---|---|---|---|
| OQ-RL1 | **Climb rate from RP 0.** At ±28/−14 and 4 battles/session, 0→1000 (Silver) takes ≈65–110 battles (≈17–28 sessions) at 55–70 % win rates (±20 % variance; climb table in Formulas). The prototype validated these thresholds from a mid-Gold start (fixture 1420), never from 0. **Working recommendation (systems-designer): keep Silver 1000 at Alpha**; retune trigger — playtest median time-to-Silver > ~2 weeks of daily play (~14 sessions) → drop the Silver floor to 600–700 (one-line data-file change; formulas are floor-parametric). Primary lever if the grind feels ghost-driven: `ghost_accuracy_ranked` 0.70, not the floors. | live-ops-designer + economy-designer (with meta OQ-MP1's faucet work) | Alpha tuning, before ranked ships |
| OQ-RL2 | **Placement rewards.** The board grants nothing at Alpha (Core Rule 7). Should season placement pay a weekly reward (gold chest, cosmetic badge)? This collides with OQ-MP1's unanswered faucet-cap question — do not price a sink before that resolves. | live-ops-designer + meta-progression | post-Alpha |
| OQ-RL3 | **Placement matches / provisional rank.** New accounts start Bronze III at RP 0 (Core Rule 3). Should a 3-battle placement series set a starting RP once real skill data exists? Simulated-peer boards don't need it; real PvP would. | game-designer | post-Alpha, with real-pvp decision |
| OQ-RL4 | **Forfeit mechanism contract.** The 15-min grace window (Core Rule 11) needs battle-start telemetry and server-side timeout handling — mechanism, exact threshold, and client/network-edge behavior (late commits, reconnects) belong to the ADR. | technical-director | with accounts-backend companion ADR, before Alpha ships |
| OQ-RL5 | **Demotion protection / RP decay.** Automatic unprotected demotion (Core Rule 4) is the strict default. Demotion shields or inactivity decay are standard live-ops levers — evaluate only with real player data. | live-ops-designer | post-Alpha |
| OQ-RL6 | **Roster size 14.** The 15-row board is prototype display, never playtested for retention. Does a simulated roster of 14 peers produce the check-in habit Game Feel targets, or does it read as static noise? | live-ops-designer (with playtest data) | post-Alpha playtest |
