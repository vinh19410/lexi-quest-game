# Analytics

> **Status**: Designed (pending review)
> **Author**: user + analytics-engineer, systems-designer, qa-lead agents
> **Last Updated**: 2026-11-09
> **Last Verified**: 2026-11-09
> **Implements Pillar**: None directly — Meta system; instruments all pillars and serves the MVP hypothesis validation (speed-scored battles + forge-SRS drive return sessions)

## Summary

Analytics is the game's telemetry layer: it owns the v1 event vocabulary and
payload schemas that battle, forge, tower, meta-progression and ranked-league
emit, and sinks them through accounts-backend into queryable session, funnel
and retention data. The player never sees it — its job is to make the core
hypothesis ("speed-scored battles + forge-SRS drive return sessions")
falsifiable, validating forge-srs's purge-funnel and day-5–8 first-stone
predictions (OQ-FS5) and giving meta-progression's orphan `floor_cleared`
event a consumer (OQ-MP5). Designed at Full Vision priority but specified
now because the one non-retrofittable part — event emission — must start at
MVP: events not emitted are lost forever, while dashboards remain a
Beta/Release concern.

> **Quick reference** — Layer: `Meta` · Priority: `Full Vision` · Key deps: `accounts-backend` (Hard upstream sink; six soft event-source systems listed in Dependencies)

## Overview

Analytics is the game's telemetry layer: it owns the event vocabulary that
battle-system, forge-srs, tower, meta-progression and ranked-league emit, and
sinks those events through accounts-backend's storage into queryable session,
funnel and retention data. The player never sees it directly; what they
eventually feel is the game's response to what it learns — which forge cards
block the purification funnel, where tower difficulty breaks players, how the
quest mix shapes session length. It exists because the core hypothesis
("speed-scored battles + forge-SRS drive return sessions — without any real
opponents") is only falsifiable with real-player data: forge-srs's day-5–8
first-stone claim and its purge-funnel `p` estimate are stated as predictions
this system must be able to check (OQ-FS5), and meta-progression's
`floor_cleared` event currently fires with no consumer (OQ-MP5). As a
Full Vision system it is designed now for its event vocabulary — the one part
that cannot be retrofitted, because events not emitted at MVP are lost
forever — while its dashboards and queries remain a Beta/Release concern.

## Detailed Design

> `systems-designer` / `gameplay-programmer` / `engine-programmer` not consulted
> for this section — Lean mode. Review manually before production. (Section D
> consults `systems-designer` + `analytics-engineer`; Section H consults
> `qa-lead`, the two sections Lean mode reserves specialists for.)

### Core Rules

1. **Event vocabulary is owned here; emission is owned by the source.** Each
   source system calls a single `track(event_name, payload)` helper at points
   this GDD names. Analytics owns the event's name, payload schema (versioned,
   mandatory `schema_v` field), and semantic meaning; the source system owns
   *when* it fires. No system invents an event name outside this vocabulary.
   **Semantic versioning rule:** a change to what an *existing* event's fields
   mean requires a new event name (or a `schema_v` bump every funnel query
   filters on) — a `forge_funnel.step` that silently changes meaning would mix
   two definitions into one conversion number.
2. **Fire-and-forget.** Emission never blocks gameplay, never mutates game
   state, and never creates a commit point. Analytics events ride existing
   accounts-backend commits where one exists (battle end, forge action, claim,
   RP change); standalone session events (login, session start/end) ride
   session establishment. An analytics failure can never put the game into
   Unsaved-state (accounts-backend owns that state and analytics never
   triggers it). Every event carries a client-generated `event_id` (UUIDv7,
   created at `track()` time — never at flush time, so a crash between emit
   and flush cannot change it); the sink deduplicates on it, so a retried
   batch never double-stores.
3. **Loss is acceptable; blocking is not.** If the client buffer overflows or
   the sink is unreachable past its retry budget, events are dropped (oldest
   first — see E1/E7). No telemetry gap justifies re-emitting a commit or
   retrying at the cost of play.
4. **The MVP-hypothesis event set is non-deferrable.** Even though dashboards
   are a Beta/Release concern, the event vocabulary below is designed now and
   emitted from MVP onward, because events not emitted at MVP are unrecoverable
   retroactively. The minimum set: battle results (per-round, sampled),
   forge purge funnel (OQ-FS5), `floor_cleared` (OQ-MP5), economy/claim
   events, session boundaries. This is the system's reason to exist ahead of
   its priority tier.
5. **No player-identifying payload beyond the account ID.** Events carry the
   server-side account ID and game facts only — never email, IP, device
   fingerprints, or the content of any answer text. The account ID is already
   pseudonymous server-side state owned by accounts-backend.
6. **Disclosure and exit.** Telemetry is disclosed at registration and in the
   profile screen's privacy note; the toggle defaults **on** with opt-out at
   registration or any time later (rationale: the data collected is
   pseudonymous, non-PII beyond the account ID, free-text-free, and
   90-day-bounded — a default-off toggle would gut the MVP event set that
   Core Rule 4 makes non-deferrable, since almost no player opens settings;
   if the owner later targets jurisdictions requiring parental consent for
   minors, the default flips and a consent flow is added — OQ-AN3). When
   off, no gameplay events are emitted (the buffer is cleared, not paused —
   see E4) **and the sink enforces the consent flag server-side** — client
   suppression alone cannot support a compliance claim. One minimal consent
   audit record (account ID, timestamp, on/off) is written regardless of
   toggle state, so the account's consent history is provable. The toggle is
   a **ui-shell surface by necessity**
   (it lives on the profile/registration screens ui-shell already owns);
   ui-shell currently records analytics as a non-dependency, so this surface
   is flagged in Dependencies and Open Questions (OQ-AN2) rather than assumed.
7. **Honest ghosts (Pillar 4) applies to metrics too.** Analytics data feeds
   internal dashboards and tuning only. It never drives player-visible
   counters that imply real presence (no live-player counts, no fake league
   boards). Player-visible "study board" data stays self-owned data, per the
   concept's retention hooks — analytics is not its source.
8. **Everything data-driven.** The event list, payload schemas, batch
   parameters (F-AN4), sampling rates, and metric definitions live in an
   external analytics config file, not in code — per the coding standards'
   data-driven rule. Tuning Knobs are skipped at this tier, so F-AN4's
   variable table carries the safe ranges instead.
9. **Derived metrics are definitions, not code.** Each metric in Formulas is a
   named definition with an exact formula so that a dashboard implementation
   is a translation, not a design act. Disputes about a metric resolve by
   editing the definition here.

**Event vocabulary (v1) — minimum set, by source:**

| Source system | Event | Payload (schema_v: 1) | Fires when |
|---|---|---|---|
| accounts-backend | `session_start` / `session_end` | duration_s, client_ts_offset | Session established / closed |
| accounts-backend | `auth_event` | kind (login/register/reset_request/reset_done/failed), result | Auth flows |
| battle-system | `battle_result` | outcome, rounds[4] (per-round: correct, speed_ms, combo), hero_class, ult_used | End-of-battle commit (piggybacks BattleResult) |
| forge-srs | `forge_funnel` | step (drop → box1_pass → box2_pass → purified → stone_applied), rune_id, card_ids | Each funnel transition (OQ-FS5's purge funnel) |
| forge-srs | `rune_queue_state` | depth, oldest_age_days | Once per session end (validates the "visible debt" hook) |
| tower | `floor_cleared` | module_id, attempt_count, time_s | Boss first-clear (OQ-MP5's orphan event — analytics is its consumer) |
| tower | `stage_attempt` | module_id, stage_id, result | Per stage result commit |
| meta-progression | `quest_event` | quest_id, kind (accepted/progress/claimed/expired) | Quest board transitions |
| meta-progression | `economy_event` | kind (gold_gain/gold_spend/xp_gain), amount, source | Per economy commit |
| ranked-league | `rp_delta` | match_id, delta, tier_before/after | Per ranked result (Alpha, provisional) |
| ranked-league | `season_rollover` | season_id, final_tier | Season boundary (Alpha, provisional) |

High-frequency payloads — `battle_result`'s `rounds[4]` array and
`stage_attempt` — are sampled **per player cohort, never per event**:
`bucket = hash(account_id, week) % N == 0` sends the payload in full, other
buckets omit it entirely (omitted, not empty — downstream must distinguish
"sampled out" from "no rounds"). Cohort membership is stamped on the session
so dashboards can weight denominators. `battle_result` itself (outcome,
ult_used, hero_class) is **never** sampled — it rides the BattleResult commit
at zero marginal cost and sampling it would bias win-rate and retention
inputs. Funnel events (`forge_funnel` chain) are never sampled — the funnel
is the one measurement the hypothesis depends on.

### States and Transitions

**Client buffer** (per session, in memory — telemetry is not persisted across
reloads, see E3):

| State | Condition | Exits |
|---|---|---|
| `Empty` | buffer holds 0 events | → `Filling` on emit (if telemetry on) |
| `Filling` | buffer < `B_max` | → `Flushing` when buffer ≥ `B_batch` OR `T_flush` elapsed since first queued event · → `Dropping` if telemetry turned off |
| `Flushing` | batch in flight to sink | → `Filling`/`Empty` on 2xx (accepted; `Empty` if no events remain) · → `Backoff` on failure |
| `Backoff` | retry n of `n_max` pending | → `Flushing` at next retry · → `Dropping` after `n_max` failures (drop **oldest-first** — the same policy as overflow, never the newest batch — until the buffer is under `B_max`/2; count every dropped event; resume accepting) |
| `Dropping` | telemetry off, or unrecoverable sink failure | → `Empty` (buffer discarded; emission suppressed) |

**Event lifecycle** (server side):

| State | Condition | Exits |
|---|---|---|
| `queued` | in client buffer | → `flushed` |
| `flushed` | batch sent | → `accepted` / `rejected` |
| `accepted` | schema valid, session valid | terminal (stored) |
| `rejected` | schema invalid, unknown name, or `schema_v` > server max | → `quarantined` (unknown *version* lands in its own `rejected_version` bucket, never merged with bad-name rejections — an upgrade wave must not read as junk data) |
| `quarantined` | counted, plus a bounded diagnostic sample stored (first 100 per schema per day, stripped per Core Rule 5) | terminal (rejection rate itself is a metric — E9; the sample is still player data: it inherits retention and deletion rules) |

### Interactions with Other Systems

| System | Direction | Hard/Soft | Data flow | Interface owner |
|---|---|---|---|---|
| accounts-backend | Upstream | **Hard** | Sink storage; batched flush rides the authenticated session; account ID + registration state | accounts-backend owns storage, auth, and commit plumbing; **analytics owns event schema and query/read access** — mirrors its "Event sink / analytics owns instrumentation" row |
| battle-system | Source (downstream of nothing; emits *into* analytics) | Soft | `battle_result` at end-of-battle commit | battle-system owns the trigger; analytics owns payload schema |
| forge-srs | Source | Soft | `forge_funnel`, `rune_queue_state` | forge-srs owns transitions (OQ-FS5 named this need); analytics owns schema |
| tower | Source | Soft | `floor_cleared`, `stage_attempt` | tower owns firing (Core Rule 9); analytics owns schema. **One-directional flag:** tower's GDD does not yet name analytics as a consumer — must be added at tower's next edit (extends OQ-MP5) |
| meta-progression | Source | Soft | `quest_event`, `economy_event` | meta-progression owns ledger semantics; analytics owns schema. Its GDD already anticipates analytics reading its emission |
| ranked-league | Source | Soft (Alpha+) | `rp_delta`, `season_rollover` | ranked-league already lists analytics as the telemetry owner in both its dependency tables |
| ui-shell | Coordination only | Soft | Telemetry toggle + privacy note live on shell screens | ui-shell owns the screens; analytics owns the toggle's behaviour. **Contract change vs. ui-shell's current "non-dependencies" note — flagged, not silently assumed (OQ-AN2)** |

Analytics has **no system downstream dependents**: its outputs are dashboards
and tuning decisions — human processes, not game systems. ranked-league's
"study board" reads the player's own records via accounts-backend, not through
analytics (Core Rule 7).

## Formulas

> Consulted for this section: `systems-designer` (proposed F-AN4–F-AN9) and
> `analytics-engineer` (reviewed). **One specialist disagreement, resolved:**
> the systems-designer proposed per-event Bernoulli sampling for F-AN6; the
> analytics-engineer argued per-player-cohort sampling (whole battles present
> or absent, immune to within-battle misaggregation, stable weekly
> denominators). Cohort scheme adopted — it is already normative in Core
> Rule 4's vocabulary note. Three definitional forks the systems-designer
> flagged (retention denominator, funnel counting mode, T1 cohort) are each
> resolved to its stated recommendation (autonomous mode; logged).
> All constants live in the external analytics config file (Core Rule 8);
> the variable tables carry safe ranges in place of a Tuning Knobs section.
> F-AN4 and F-AN6 are cited by Detailed Design; numbering follows those
> citations.

### F-AN4 — Batch flush trigger

The batch_flush formula is defined as:

`flush ⟺ N_buf ≥ B_batch OR (N_buf > 0 AND t_now − t_first ≥ T_flush)`

Overflow rule: if an incoming event would push `N_buf` past `B_max`, drop the
oldest queued events until it fits (Core Rule 3 — oldest first, counted per E1).

**Variables:**
| Variable | Type | Range | Source | Description |
|----------|------|-------|--------|-------------|
| `B_batch` — batch_size | int | 5–25 (default 10) | data file (analytics config) | Events buffered before a size-triggered flush |
| `T_flush` — flush_interval_s | int (s) | 10–120 (default 30) | data file (analytics config) | Max seconds an event may wait; timer starts at the first queued event |
| `B_max` — buffer_cap | int | 30–200 (default 50) | data file (analytics config) | Hard cap; overflow drops oldest |
| `N_buf` | int | 0–B_max | calculated | Events currently in the client buffer |
| `t_first` | timestamp | [0, ∞) | calculated | Client-queue time of the oldest buffered event |

**Output Range:** boolean; `N_buf ∈ [0, B_max]`. A flush fires on event arrival or at the `T_flush` tick — never blocks gameplay (fire-and-forget).
**Example:** two battles + one forge check in ~20 s queue 12 events; at the 12th, `N_buf = 12 ≥ 10` → the batch flushes. If only 4 events arrive and play stops, the 30 s timer fires the flush anyway, so a session's last events are never stranded in memory.

### F-AN5 — Session definition (gap sessionizer)

The sessionize formula is defined as:

`sessions(a) = split account a's accepted-event stream whenever t_recv(e_i) − t_recv(e_{i−1}) > T_session_gap`, events ordered by **server receive time**.

**Variables:**
| Variable | Type | Range | Source | Description |
|----------|------|-------|--------|-------------|
| `T_session_gap` — session_gap_s | int (s) | 900–3600 (default 1800) | data file (analytics config) | Inactivity gap that ends a session |
| `t_recv` | timestamp | [0, ∞) | calculated (server clock) | Server receive time of each accepted event |

**Output Range:** session count per account ≥ 1 per active day; session duration ∈ [0, ∞), bounded in practice by `T_session_gap` + activity span.
**Example:** accepted events at 19:00, 19:20, then 20:10 → gaps of 20 min and 50 min → **two sessions**; the second session's duration is measured from 20:10 onward.

The gap rule is authoritative, not `session_end`: the client fires
`session_end` on teardown, but a web game's tab close can lose it
(fire-and-forget, Core Rule 3 — see E3). The gap-based sessionizer
reconstructs sessions server-side from *any* accepted event, so dashboards
never depend on a lost boundary event, and it correctly splits a long-lived
SPA tab left open for hours. 30 min is the standard web-analytics default; a
web player's "came back later tonight" pattern sits safely above it.

### F-AN6 — Per-cohort sampling (rounds payloads)

The rounds_cohort formula is defined as:

`rounds_payload_sent(a, week) ⟺ hash(account_id, week) mod N = 0`; equivalently `s_round = 1/N`.

**Variables:**
| Variable | Type | Range | Source | Description |
|----------|------|-------|--------|-------------|
| `s_round` — sample_rate_round | float | 0.1–1.0 (default 0.5) | data file (analytics config) | Fraction of weekly cohorts whose accounts send `rounds[4]` / `stage_attempt` payloads in full |
| `N` — cohort_buckets | int | 1–10 (default 2) | data file (analytics config) | Hash buckets; bucket 0 sends payloads, others omit the field entirely (omitted, not empty) |
| `sampling_class` | enum | {always, cohort} | data file (per event, in the event vocabulary) | Funnel, session, auth, `floor_cleared`, economy/quest, `battle_result` (sans `rounds`) are **always** — never sampled |

**Output Range:** expected payload fraction ≈ `s_round` per week; exactly 1.0 for always-class. The funnel and every retention denominator input can never be sampled away.
**Example:** default `N = 2`: half of a cohort's accounts send full `rounds[4]` for the week — 40 battles across the cohort yield ~20 complete per-round datasets, ample for speed_ms/combo distributions; every `forge_funnel` and `session_start` is retained regardless.

Cohort membership is stamped on the session payload so dashboards weight
denominators; per-round metrics are **cohort-weighted**, and joining sampled
per-round data against unsampled battle-level data without that weighting is
the documented misuse (E11 cross-check).

### F-AN7 — Retention Dn (D1 / D7 / D30)

The retention_dn formula is defined as:

`Dn(d) = |{a ∈ Cohort(d) : ∃ accepted session_start(a) on game-day d+n}| / |Cohort(d)|`

**Variables:**
| Variable | Type | Range | Source | Description |
|----------|------|-------|--------|-------------|
| `n` | int | {1, 7, 30} | constant | Return-day offset |
| `Cohort(d)` | set of accounts | — | calculated | Accounts whose **registration commit** carries `game_day_id` d (meta-progression's per-player game-day identity — E's daily-grouping rule; "server clock" defines only *when* day d+n is complete and Dn may be evaluated) |
| `session_start` | event | accepted only | calculated | Any accepted `session_start` on day d+n — no battle required |
| `Dn` | float | 0–1 | calculated | Share of the cohort with a session on day d+n |

**Output Range:** [0, 1]; evaluated only after game-day d+n is complete — completeness judged on the server clock, membership and grouping on `game_day_id` (no partial-day numerators).
**Example:** cohort day d has 100 registrations; 62 accounts emit an accepted `session_start` on game-day d+1 → **D1 = 0.62**.

**Denominator ruling (flag resolved):** the headline Dn uses **all
registered accounts** — registration is a server-authoritative commit, a
registrant who never battles is real onboarding loss, and this denominator is
the only one that cannot be flattered by client-side loss. A secondary cut
"Dn | activated" (accounts with ≥ 1 `battle_result`) isolates loop retention
among engaged players and is reported alongside once dashboards exist
(Beta/Release). Consistently, the numerator is any accepted `session_start`,
not a battle — a battle-required numerator measures engagement depth, not
return. A lost `session_start` can only undercount the numerator (it rides
session establishment, the lowest-loss path per Core Rule 2) — acceptable
under Core Rule 3.

### F-AN8 — Forge funnel step conversion C_k

The funnel_step formula is defined as:

`C_k = |{rune_id : step k observed in window W}| / |{rune_id : step k−1 observed in W}|`, k = 1..4 over steps (0)=drop → (1)=box1_pass → (2)=box2_pass → (3)=purified → (4)=stone_applied, counted as **distinct rune_ids** per step.

**Variables:**
| Variable | Type | Range | Source | Description |
|----------|------|-------|--------|-------------|
| `W` | interval | analysis window | calculated (dashboard query) | e.g. a registration week; a rune enters the funnel at its first drop in W |
| `rune_id` | string | — | event payload | Distinct per rune; re-drops/re-resets re-emit for the same rune_id |
| `C_k` | float | 0–1 | calculated | Step conversion; C_4 = purified → stone_applied (incl. never-applied) |

**Output Range:** each `C_k ∈ [0, 1]`; the product `C_1·C_2·C_3 ∈ [0, 1]` = share of dropped runes ever purified.
**Example:** W contains 200 distinct dropped runes → 160 box1_pass, 90 box2_pass, 45 purified, 38 stone_applied → C = 0.80 / 0.5625 / 0.50 / 0.844; drop→purified = **22.5%**.

**Counting ruling (flag resolved):** distinct-rune, not raw event counts. A
rune can emit `box1_pass` several times (a battle re-drop or wrong answer
resets it to Box 1 per forge-srs), so event-counting makes C_1 a
review-throughput that can exceed 1; distinct-rune keeps every C_k a survival
share ≤ 1 and measures "what fraction of dropped words ever purify" — the
quantity OQ-FS5 exists to validate.

**Validation mapping to forge-srs F3** (how this design checks its own
predictions): estimate p̂ by inverting F3's `E[T_rune](p)` curve at the
observed p50 of T1 (F-AN9) — e.g. p50(T1) = 5.6 d inverts to p̂ ≈ 0.75 — then
cross-check against observed `C_1·C_2·C_3` (F3's p³ lockstep bound is an
upper bound, not an expectation). The **day-5–8 first-stone claim is
validated by F-AN9's percentiles, not by C_k alone.**

### F-AN9 — First-stone time T1

The first_stone_time formula is defined as:

`T1(a) = t_first_stone(a) − t_first_drop(a)` — earliest `stone_applied` server time among a's runes minus earliest `drop` among a's runes. Reported as **p50 and p90** over the reporting cohort, never the mean.

**Variables:**
| Variable | Type | Range | Source | Description |
|----------|------|-------|--------|-------------|
| `t_first_drop(a)` | timestamp | [0, ∞) | calculated (server) | Account's first `forge_funnel` step = drop |
| `t_first_stone(a)` | timestamp | [0, ∞) | calculated (server) | Account's first step = stone_applied |
| `T1` | float (h) | ≥ T_floor, unbounded above | calculated | First-stone latency per account; cohort reported as p50 / p90 + N |

**Output Range:** lower bound `T_floor = D1 + D2 + D3 ≈ 96 h 10 min` at
registry defaults (forge-srs F3's 10 min / 24 h / 72 h delays) — **p50 below
T_floor is a data-quality incident** (a QA delay override leaking to
production, or clock corruption), not a good result. No upper bound: the
distribution is right-skewed, which is exactly why the mean is banned as the
headline statistic — one 30-day player drags the mean past the claim band
while p50 stays honest.
**Example:** cohort of 40 accounts with ≥ 1 stone: p50(T1) = 5.6 d, p90(T1) = 9.1 d → the **day-5–8 claim holds at p50 and misses at p90** — the typical tester converts on schedule, the slow tail does not.

**Cohort ruling (flag resolved):** at MVP, T1 conditions on accounts with
≥ 1 `stone_applied` — the forge-srs claim is a statement about testers who
*get* a stone, and this needs no censoring model; report N beside it, with
F-AN8's drop-cohort conversion `C_1·C_2·C_3` alongside so the survivor bias
stays visible. The unbiased measure (condition on ≥ 1 drop with
right-censoring, Kaplan–Meier) is a Beta/Release dashboard concern, deferred.

## Edge Cases

> `analytics-engineer` consulted for this section (domain specialist; the
> findings below are its six fixes, folded in). `systems-designer` not
> consulted for E specifically — Lean mode reserves specialists for D and H.

- **If the buffer reaches `B_max` while the sink is unreachable** (E1/E7
  condition): drop **oldest-first** until under `B_max`, increment a client
  drop counter with every dropped event, and flush that counter with the next
  successful batch. Oldest-first, never newest-first: funnel denominators are
  session-anchored — keeping only newest events yields a population that
  "began sessions" but "never finished battles", a bias shaped exactly like
  the effect the funnel measures. Oldest-first yields sessions with
  quantifiable holes instead.
- **If every drop must be visible**: a dashboard may trust funnel conversion
  only when the session's drop rate is below **1%** (`DROP_GATE`, constant);
  above it the funnel is reported as untrusted rather than computed from
  hole-y data. An uncounted drop is indistinguishable from a real conversion
  failure — that is why the counter is a rule, not a nicety.
- **If a flush response is lost after the sink accepted the batch** (client
  retries): the sink deduplicates per event on `event_id` and answers success
  without re-storing. Dedup applies to `event_id` only — never to semantically
  identical events (two real `floor_cleared` events in one session are two
  legitimate clears). Dedup state expires after **7 days** (`TTL_dedup`,
  constant, ≥ worst-case retry span); a duplicate arriving after expiry **is
  stored twice** — the stated limit. Post-TTL duplicates of `economy_event`
  would double-count gold: queries that sum amounts filter on
  `server_ts ≥ now − TTL_dedup`.
- **If the tab is closed or reloaded with unsent events in the buffer**: the
  buffer is in-memory only and is lost — telemetry is *not* persisted across
  reloads (unlike game progress; analytics never earns an Unsaved-state
  warning). The session is reconstructed server-side as ended once no event
  arrives for `T_session_gap` (F-AN5); its duration is recorded as
  "truncated" (flag), not estimated.
- **If the toggle is switched off mid-session**: the buffer is cleared
  immediately (cleared, not paused — nothing accrued while on may leak after
  opt-out), emission stops synchronously, the sink's server-side consent flag
  flips, and exactly one consent audit record is written. No gameplay events
  about the toggle action are emitted. Switching back on starts a fresh
  buffer; nothing retroactive is sent.
- **If the client ships a `schema_v` the server does not know**: the event is
  counted in the `rejected_version` bucket (never merged into bad-name
  rejections) and dropped. Because buffers are in-memory and per-session,
  skew lifetime is one session — no handshake is needed.
- **If an event name is unknown to the server**: quarantined — counted, plus
  a bounded diagnostic sample (first 100 per schema per day, privacy-stripped)
  stored so schema rollouts are not blind. The sample is player data: it
  inherits the retention window and deletion cascade.
- **If the device clock is wrong** (client `ts` offset vs `server_ts` >
  ±5 min): the event is flagged skew-suspect and **still stored**, grouped by
  `server_ts`. Dropping skew-suspect events would bias against players with
  broken clocks — which correlates with device age and demographics. Session
  *duration* uses client-reported deltas (`duration_s`), which are immune to
  offset; server timestamps serve ordering and grouping only.
- **If daily metrics are grouped** (retention Dn, first-stone time, quest
  activity): grouping uses meta-progression's own game-day identity — the
  fixed **Asia/Ho_Chi_Minh** daily boundary (registered constant
  `daily_reset_tz`; server clock governs, client clocks decide nothing),
  evaluated lazily per player — stamped as `game_day_id` on every event,
  never a UTC or device-local wall-clock day. Grouping by device-local day
  would measure retention on a different calendar than the game's own reset
  for any player whose device sits outside Vietnam time: the dashboard would
  say "day 7" while the player's game says day 6. "Daily active" means
  *distinct `game_day_id`s with activity* — skipped days jump the id with no
  events in between, which is correct, and streak metrics must count distinct
  ids, not consecutive ones.
- **If two devices hold sessions for the same account simultaneously**: both
  emit under one `account_id`; each session carries its own session id, so
  session metrics count two sessions and funnel metrics track two parallel
  funnels — both valid. `event_id` dedup prevents double-storage; it is never
  used to merge semantics.
- **If an account is deleted**: deletion is owned by accounts-backend and
  **cascades to telemetry**: all raw events, rollups keyed to the account, and
  quarantined samples are purged or irreversibly anonymized within **30 days**
  (SLA constant). Consent audit records are reduced to an anonymous
  "account deleted, consent revoked" marker. Raw events are retained 90 days
  (`TTL_raw`) then aggregated to rollups and purged — whichever boundary comes
  first.
- **If the sink is reachable but slow** (flush latency high): flushing runs
  behind the network layer and off the hot path (Game Feel rule); a slow sink
  never delays a round countdown or a forge transition. No timeout exception:
  the backoff ladder governs, then oldest-first drop.
- **If `track()` is called with a payload violating its schema** (wrong type,
  missing field, or any free-text field): the client drops the event locally
  (counted in the drop counter) — malformed events are never queued. The
  schema has **no free-text field type** (enums, IDs, numbers only), so a
  player-influenced string cannot enter the pipeline by construction (extends
  Core Rule 5: no answer content, no quest titles, no email/IP/UA/fingerprints,
  no birthdate — age band only if a compliance analysis ever requires it).

## Dependencies

**Upstream: accounts-backend (Hard).** The sink. Every batched flush rides the
authenticated session this system establishes; the account ID that keys all
analytics data is accounts-backend state. Contract (established in that GDD's
Dependencies table as "Event sink — analytics owns instrumentation"): this
system owns the event vocabulary, payload schemas, and query/read access;
accounts-backend owns storage, transport, auth, and commit plumbing. The
relationship is the same shape as ui-shell's ("this system owns the screens,
that system owns the behaviour behind them") inverted onto data: analytics
owns what the events *mean*, accounts-backend owns how they are *stored and
carried*.

**Event sources (Soft, one-way emission — each system emits into analytics;
none reads from it):**

| Source | Events | Bidirectional status |
|---|---|---|
| battle-system | `battle_result` | Not yet named in battle-system's GDD — its BattleResult commit is the natural piggyback point; add analytics at its next edit |
| forge-srs | `forge_funnel`, `rune_queue_state` | ✅ OQ-FS5 explicitly requests these events and names analytics as the owner |
| tower | `floor_cleared`, `stage_attempt` | ⚠️ One-directional: tower's GDD emits `floor_cleared` with no consumer recorded (OQ-MP5). Analytics is that consumer — tower's dependency row must be updated at its next edit |
| meta-progression | `quest_event`, `economy_event` | ✅ Its GDD already anticipates analytics reading its emission |
| ranked-league | `rp_delta`, `season_rollover` | ✅ Both its dependency tables already name analytics as telemetry owner (Alpha, provisional) |
| ui-shell | Telemetry toggle + privacy note (screens only) | ⚠️ Contract change: ui-shell currently lists analytics as a non-dependency ("sinks accounts-backend events, not shell surfaces"). Core Rule 6's toggle makes ui-shell a surface owner for one control. Must be agreed before Alpha — see OQ-AN2 |

**No downstream dependents.** Analytics outputs feed dashboards and tuning
decisions (human processes). The ranked-league study board reads the player's
own records through accounts-backend, not through analytics (Core Rule 7).

**Undesigned-dependency note:** all upstream and source systems have approved
GDDs. Nothing here rests on a provisional interface except the ranked-league
event payloads, which that GDD already marks provisional (Alpha tier).

## Visual/Audio Requirements

None — the system has no player-visible surface of its own. The telemetry
toggle and privacy note inherit ui-shell's established visual language; no
assets, VFX or audio events are introduced by analytics.

## Game Feel

No player-facing feel. The one performance-feel constraint: `track()` must be
a synchronous O(1) enqueue (append to an in-memory buffer) with no re-render
and no await on the hot path — emission happens inside battle-result and
forge transitions where a dropped frame would be visible. Batch flushing runs
behind the existing network layer, never during a round countdown.

## UI Requirements

Analytics owns no screens. One control exists: the telemetry opt-out toggle
(Core Rule 6), rendered on the registration and profile screens that ui-shell
already owns — this GDD specifies its behaviour (clears the buffer on off,
suppressed emission, effective immediately), not its appearance. Screen-level
specification stays with ui-shell's UX specs; the contract change is tracked
as OQ-AN2.

## Cross-References

| Referenced GDD | What this document uses from it |
|---|---|
| [accounts-backend.md](accounts-backend.md) | Event-sink contract ("analytics owns instrumentation"); Unsaved-state boundary (Core Rule 2 never triggers it); commit-piggyback points; account-ID ownership |
| [forge-srs.md](forge-srs.md) | OQ-FS5 purge-funnel event chain (drop → box1_pass → box2_pass → purified → stone_applied); the `p` estimate and day-5–8 first-stone claim F-AN4/F-AN5 must be able to validate |
| [meta-progression.md](meta-progression.md) | OQ-MP5 (`floor_cleared` orphan event); quest board states; lazy daily-reset semantics (E6) |
| [tower.md](tower.md) | `floor_cleared` firing rule (Core Rule 9) and one-directional dependency flag |
| [battle-system.md](battle-system.md) | BattleResult commit as the `battle_result` piggyback point |
| [ranked-league.md](ranked-league.md) | Provisional RP/season telemetry rows (both dependency tables) |
| [ui-shell.md](ui-shell.md) | Non-dependency note being amended by OQ-AN2 (toggle surface) |
| [game-concept.md](game-concept.md) | Core hypothesis (the falsifiability reason this system exists); Pillar 4 Honest Ghosts (Core Rule 7); retention hooks (`rune_queue_state` validates the "visible debt" hook) |

## Acceptance Criteria

> Authored from `qa-lead`'s validation pass (Lean mode's Section H specialist).
> Story type: **Logic/Config** — automated tests are BLOCKING (coding
> standards); only the pure-config item (AC-AN8) closes on the advisory
> smoke check. Analytics has no player-visible surface, so no Visual/UI
> screenshot evidence applies to this system's own stories (the toggle's
> screens belong to ui-shell's story).
>
> **Test scaffolding required before any criterion can run** (one blocking
> infra prerequisite story):
> (a) a **test sink** — an authenticated endpoint or in-process double that
> records received batches and exposes them for assertion;
> (b) an **injectable clock** for T_flush / T_session_gap / 7-day TTL /
> 90-day retention / 30-day deletion tests;
> (c) **query-layer reference implementations** of Dn, C_k and T1 as plain
> importable functions, so metric criteria assert computed values without a
> dashboard. Dashboard-visible behaviour is a Beta/Release concern and is
> deliberately not an acceptance criterion here.

### Core Rules

**AC-AN1 — Vocabulary and schema are enforced end to end (Core Rule 1).**
Given the analytics config defines the v1 vocabulary with a mandatory
`schema_v`, when a client emits an unknown event name, a schema-violating
payload (wrong type, missing field, or any free-text value), or a
`schema_v` above the server max, then malformed events are dropped locally
(counted, never queued); unknown names at the sink are quarantined with a
bounded diagnostic sample (first 100 per schema per day, privacy-stripped);
unknown versions land in the separate `rejected_version` bucket, never
merged with bad-name rejections; valid events are stored exactly once.
*Verify: unit (client validator) + integration (test sink). [automatable]*

**AC-AN2 — Emission is fire-and-forget and dedup-safe (Core Rule 2).**
Given telemetry is on, when `track()` is called inside a battle-result or
forge transition while the sink responds after 2 s (or never), then
`track()` returns synchronously with no await and no game-state mutation;
the event carries a UUIDv7 `event_id` generated at `track()` time (assert:
set before flush, unchanged across retries); a batch retried after a lost
2xx stores each `event_id` exactly once, while two genuinely distinct
events (two `floor_cleared` in one session) both store.
*Verify: unit (fake timers + slow-sink double) + integration. [automatable]*

**AC-AN3 — Overflow loses the oldest, and says so (Core Rule 3, F-AN4
overflow rule).** Given the buffer holds `B_max` events with the sink
unreachable past its retry budget, when further events arrive, then the
oldest queued events are dropped first until the new event fits, every
drop increments the client drop counter, the counter flushes with the next
successful batch, and no game commit is ever re-emitted.
*Verify: unit (buffer state machine, fake clock). [automatable]*

**AC-AN4 — The MVP event set is emitted end to end (Core Rule 4).** Given
a scripted session covering one battle, one forge drop→purify→apply, one
boss first-clear, one gold claim, and session establishment/teardown, when
the session plays against the test sink, then every v1 event
(`session_start`/`session_end`, `auth_event`, `battle_result`,
`forge_funnel`, `rune_queue_state`, `floor_cleared`, `stage_attempt`,
`quest_event`, `economy_event`; `rp_delta`/`season_rollover` from Alpha)
arrives with its documented payload fields, and no event outside the
vocabulary is emitted by any system.
*Verify: integration harness — doubles as the telemetry smoke check.
[automatable]*

**AC-AN5 — No identifying payload beyond the account ID (Core Rule 5).**
Given any accepted or quarantined event in the sink, when its payload is
inspected, then it contains only the account ID, enums, IDs, numbers and
timestamps — no email, IP, user-agent, fingerprint, birthdate, or answer/
quest-title text; a fuzzed `track()` call carrying free-text values is
dropped locally by construction (the schema has no free-text type).
*Verify: unit (schema lint over the config) + integration (sink scan +
fuzz). [automatable]*

**AC-AN6 — Opt-out is immediate, server-enforced, and audited (Core Rule
6; ui-shell surface per OQ-AN2).** Given telemetry on with events queued,
when the toggle is switched off mid-session, then the buffer is cleared
(not paused), emission stops synchronously, the sink's consent flag flips,
exactly one consent audit record (account ID, timestamp, on→off) is
written, no gameplay event about the toggle itself is emitted, and a batch
sent while consent is off — including one forged by bypassing client
suppression — is rejected server-side. Switching back on starts an empty
buffer; nothing retroactive is sent.
*Verify: integration (test sink + consent flag); forged-batch case is a
server-side test. [automatable]*

**AC-AN7 — Nothing gameplay-visible reads the sink (Core Rule 7).** Given
the full code root, when the import/bundle graph is analysed, then no ui,
battle, forge, tower, meta or league module imports the sink or any metric
query; reads are confined to dashboard/query code no runtime surface
consumes.
*Verify: automated import-boundary rule in CI (e.g. dependency-cruiser).
[automatable]*

**AC-AN8 — Behaviour is config-driven (Core Rule 8).** Given the external
analytics config file, when it is edited (e.g. `B_batch` 10→20, `s_round`
0.5→0.25) and client/sink reload, then flush thresholds, sampling and the
drop gate change with no code change, and an invalid config (missing
constant, out-of-range value, unknown event name) fails loudly at load
instead of falling back silently.
*Verify: unit (loader validation); closes on the advisory Config/Data
smoke check. [automatable]*

### Formulas (Core Rule 9 — each metric is one named definition; each
criterion tests the reference implementation against this GDD's own worked
example, so a dashboard is later a translation, not a design act)

**AC-AN9 — Batch flush fires on size or time (F-AN4).** Given `B_batch =
10`, `T_flush = 30 s`, when 12 events queue in ~20 s the 12th triggers an
immediate flush; when only 4 events queue and play stops, the flush fires
at `t_first + 30 s`; after `n_max` flush failures the buffer drops
oldest-first to under `B_max/2`, then resumes accepting.
*Verify: unit, fake clock + sink double. [automatable]*

**AC-AN10 — Sessions split on the gap, not on `session_end` (F-AN5).**
Given accepted events at server receive times 19:00, 19:20, 20:10 with
`T_session_gap = 1800 s`, when the sessionizer runs, then exactly two
sessions result and the second starts at 20:10; a session whose
`session_end` was lost still terminates at the gap and is flagged
"truncated"; two devices interleaving events for one account yield two
valid parallel sessions.
*Verify: unit over a synthetic accepted-event stream. [automatable]*

**AC-AN11 — Payload sampling is per-cohort, deterministic, and never
touches the funnel (F-AN6).** Given `N = 2` buckets, when the same account
is evaluated repeatedly within one week, then `hash(account_id, week) %
N` yields the same bucket every run; bucket 0 sessions carry full
`rounds[4]`/`stage_attempt` payloads plus a cohort stamp; other buckets
omit the field entirely (absent key, never an empty array); `forge_funnel`,
`session_*`, `auth_event`, `floor_cleared`, `economy_event`, `quest_event`
and `battle_result` without `rounds` appear for every account regardless
of bucket.
*Verify: unit with fixed account IDs (determinism rule). [automatable]*

**AC-AN12 — Retention: all-registrations denominator, game-day identity,
no partial days (F-AN7).** Given 100 registration commits on cohort day d
and 62 accepted `session_start` events on d+1, when D1 is computed, then
it equals 0.62; the denominator counts every registration (zero-battle
registrants included); a return event flagged skew-suspect (client offset
> ±5 min) still counts (stored, grouped by `server_ts`); day d+1 yields no
value until fully elapsed; grouping uses `game_day_id` (the fixed
Asia/Ho_Chi_Minh game-day boundary), never a device-local or UTC day.
*Verify: unit on the query-layer function over a seeded store.
[automatable]*

**AC-AN13 — Funnel conversion counts distinct runes; no C_k exceeds 1
(F-AN8).** Given a window with 200 distinct dropped runes, of which 160
emit box1_pass (one rune three times, via battle re-drop), 90 box2_pass,
45 purified, 38 stone_applied, when C_1..C_4 are computed, then they equal
0.80 / 0.5625 / 0.50 / 0.844, the re-dropped rune counts once per step,
C_1·C_2·C_3 = 0.225, and every C_k ∈ [0,1] for any input.
*Verify: unit on the query-layer function. [automatable]*

**AC-AN14 — First-stone time reports p50/p90 over finishers, never the
mean (F-AN9).** Given a cohort of 40 accounts each with ≥ 1
`stone_applied` and a right-skewed T1 including one 30-day outlier, when
the metric is computed, then the output is p50, p90 and N only — no mean
is emitted; accounts with zero `stone_applied` are excluded from this
statistic, with N reported beside C_1·C_2·C_3 so survivor bias stays
visible.
*Verify: unit on the query-layer function. [automatable]*

### Data-quality incidents (flagged, never smoothed over)

**AC-AN15 — p50(T1) below the forge floor raises an incident.** Given
seeded events implying p50(T1) < 96 h 10 min (a QA delay-override leak or
corrupted clocks), when the cohort is evaluated, then the metric layer
emits an explicit data-quality incident flag instead of a passing
first-stone result. (Human alert routing is a Beta concern.)
*Verify: unit on the metric layer's flag. [automatable]*

**AC-AN16 — Funnels above the drop gate are untrusted, not quietly
computed.** Given a session whose flushed drop counter exceeds 1% of its
events, when a funnel query covers it, then conversion is reported with an
explicit "untrusted" flag rather than as a valid number; a session at or
below 1% is trusted.
*Verify: unit on the trust-flag computation. [automatable]*

**AC-AN17 — Post-TTL duplicates are a stated, bounded hazard.** Given an
`economy_event` whose `event_id` left the dedup window (> 7 days) is
replayed, when it reaches the sink, then it is stored twice (the
documented limit), and any gold-summing query filters
`server_ts ≥ now − TTL_dedup` so the replay cannot double-count gold in
the window it reports; a duplicate arriving inside the TTL still stores
once.
*Verify: integration (test sink + seeded store) + unit (query filter).
[automatable]*

### Cross-system

**AC-AN18 — The emitted funnel chain is exactly forge-srs's purge chain
(OQ-FS5).** Given one rune driven through a full forge lifecycle, when its
events arrive at the sink, then the `forge_funnel` steps appear in order
drop → box1_pass → box2_pass → purified → stone_applied for one `rune_id`
(re-drops re-emit earlier steps for the same rune_id), and every step is
present for every account — funnel events are never sampled.
*Verify: integration across forge-srs and the test sink. [automatable]*

**AC-AN19 — `floor_cleared` finally has its consumer (OQ-MP5).** Given a
boss defeated for the first time on a module, when the tower commit
resolves, then exactly one `floor_cleared` (module_id, attempt_count,
time_s) is accepted by the sink; replays and repeat clears emit none;
meta-progression's ledger behaviour is unchanged (analytics consumes the
event; nothing in meta reads it).
*Verify: integration across tower and the test sink. [automatable]*

**AC-AN20 — Account deletion cascades to telemetry within 30 days.** Given
an account holding raw events, rollups and quarantined samples, when
deletion runs (owned by accounts-backend), then within 30 days all raw
events, account-keyed rollups and quarantined samples are purged or
irreversibly anonymized, and the consent audit reduces to an anonymous
"account deleted, consent revoked" marker; a raw event crossing 90 days
(`TTL_raw`) is aggregated to rollups and purged at whichever boundary
comes first.
*Verify: integration against a test store with an injected clock; the
deployed production job is verified once in staging (release-checklist
item, not a unit test).*

Coverage: 9/9 Core Rules · 6/6 formulas · 3/3 data-quality incidents ·
4/4 cross-system checks · 12/12 Edge Cases mapped. 19/20 automatable
against scaffolding (a)–(c); AC-AN20's deployed-job check is a staging
verification.

## Open Questions

| ID | Question | Owner | Target |
|---|---|---|---|
| OQ-AN1 | **Sink implementation route** — custom event tables in accounts-backend's store vs a third-party product pipeline. Affects the ADR set, cost, and the query layer's shape. The GDD fixes behaviour (schema, consent, retention, dedup), not the route. | technical-director | Pre-Production, alongside the accounts-backend persistence ADR |
| OQ-AN2 | **ui-shell contract change** — the telemetry toggle + privacy note put one control on screens ui-shell owns, but ui-shell's GDD lists analytics as a non-dependency ("sinks accounts-backend events, not shell surfaces"). ui-shell must acknowledge the surface (one row in its Dependencies + a UX-spec pointer) at its next edit. | ui-shell GDD owner | ui-shell's next edit; hard stop before Alpha |
| OQ-AN3 | **Minors / parental consent** — the toggle defaults ON (rationale in Core Rule 6). If launch targets jurisdictions requiring parental consent for minors (COPPA/GDPR-K analysis), the default flips to OFF and a consent flow is added to registration. | project owner | Before Beta/Release marketing in any such jurisdiction |
| OQ-AN4 | **Source-GDD backfill** — battle-system and tower must name analytics in their Dependencies at their next edit (battle: `battle_result` piggyback row; tower: analytics as `floor_cleared`'s consumer, closing the one-directional flag this GDD records and extending meta-progression's OQ-MP5). ranked-league, forge-srs and meta-progression already name analytics. | battle-system / tower GDD owners | Each file's next edit (routine propagation, no re-review needed) |
