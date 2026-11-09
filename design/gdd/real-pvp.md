# Real PvP (Human Duels)

> **Status**: In Review — revised 2026-11-09 after lean review (R4 example corrected + 7 cross-document corrections); awaiting re-review
> **Author**: user + network-programmer, systems-designer, qa-lead
> **Last Updated**: 2026-11-09
> **Last Verified**: 2026-11-09
> **Implements Pillar**: Pillar 4 (Honest Ghosts) — extended honestly to real players; Pillar 1 (Speed Is Damage) carries over unchanged

## Summary

Real PvP turns LexiQuest's 4-round battle into a duel against a real person:
the server runs battle-system's round engine with two live commit streams
instead of a ghost roll, adjudicates every number server-side, and pays the
same ±28/−14 RP into the existing ladder. Matchmaking widens an RP band over a
45 s wait budget and then offers an honestly-labelled ghost duel rather than
faking a human. It is the Full-Vision endpoint of accounts-backend's recorded
trust-model evolution — shipped only when greenlit, and built so nothing else
in the game depends on it existing.

> **Quick reference** — Layer: `Polish (Feature)` · Priority: `Full Vision` · Key deps: `battle-system, accounts-backend` (+ soft: ranked-league, question-content, speech-io, ui-shell, analytics)

## Overview

Real PvP turns LexiQuest's 4-round battle from a duel against a Shadow Ghost
into a duel against a real person: two players answer the same four questions
simultaneously under the same countdown, and the faster correct answer is what
separates the winner from the loser. The server owns every consequential
number — question draw, both clocks, answer validation, damage, shields, and
the final verdict — while each client renders state it cannot influence, which
is the absolute endpoint of the trust-model evolution accounts-backend already
records. Matchmaking pairs players inside a widening RP band from
ranked-league's ladder and, if no human appears within the wait budget, offers
an honestly-labelled ghost duel instead of a fake one. The system exists
because the single-player game proves the combat identity (speed is damage)
and a real opponent is the strongest possible test of it — but it ships only
when the ghost product has earned its audience, and nothing else in the game
may depend on it existing.

Player fantasy: the same speed-under-pressure rush as a ranked ghost duel,
with one difference that changes everything — on the other side of the win
bar is a mind, not a profile.

## Detailed Design

### Core Rules

> **Source note**: drafted from battle-system's Dependencies contract for this
> system ("the same round state machine, later against human inputs" — battle
> owns rules, netcode owned here), accounts-backend's trust-model evolution
> ("real-pvp makes it absolute"), and game-concept Pillar 4 / anti-pillars.
> Section C drafted without specialists — Lean mode (review_mode: lean
> reserves specialist spawns for Sections D and H); `network-programmer` and
> `systems-designer` consulted for D, `qa-lead` for H. Review manually.

**Identity and trust**

1. **Server-authoritative duels.** The server runs the battle-system round
   engine — same 4 rounds (vocab → grammar → listening → ultimate), same
   formulas B1–B12 — with the opponent's live commits replacing
   `resolve_round(profile, mode, seed, round_index)`. The server owns the
   question draw, both clocks, answer validation, every RNG stream (crit draws
   happen server-side against a server-seeded stream), damage, shields, and
   the verdict. Clients render state and submit inputs; they compute nothing
   consequential. This fulfils accounts-backend's recorded evolution: its
   client-trusted commit model never touches a PvP outcome.
2. **battle-system's GDD stays canonical for ghost battles.** The server twin
   implements the same B-series formulas from one shared implementation —
   formula drift between client ghost battles and server duels is a build
   failure, not a balance question (one formula module, two hosts).
3. **Answer privacy.** A player's commit is never revealed to the opponent
   before the round resolves. The round resolves when both commits have
   arrived or the server window (Rule 4) expires; the resolve payload — both
   answers, both correctness flags, all damage — is broadcast to both clients
   simultaneously. A player sees their own correctness flag at their commit
   (keeps PvE-grade feel); the opponent's correctness is visible only at
   resolve.
4. **Shared round window.** The server window is
   `W = max(round_time_A, round_time_B)` from each player's own B1 clock —
   no player is cut short by the other's gear (R4, Formulas). Each client
   displays its
   player's personal B1 countdown; a commit after that personal deadline is
   recorded but scored as a timeout (`elapsed` clamps to their own
   `round_time_s`, so B2 gives 1.0 and the answer is void — same outcome as
   PvE expiry).
5. **Damage symmetry.** The attacker deals their verbatim B-series output:
   B3 (vocab, including the 0.92 armor factor), B4 (listening, piercing), B5
   (ultimate × speech-io quality), B7 (counter), each with B2 speedMult and
   B10 crit computed from *that player's* elapsed and loadout. The defender
   mitigates through B9's shape with `ghost_base` generalised to the incoming
   amount (R7, Formulas): `dmg_taken = round_half_up(incoming × (1 − min(0.25, max(0,
   def_eff_defender) / 600)))`, then shield-first absorption from the
   defender's own B6 pool. Each player's max HP is their own
   LoadoutSnapshot hero HP. The def-mitigation cap keeps defense's 25%
   ceiling identical to PvE; only the *incoming* number differs (a real
   opponent's B3 output instead of the fixed 100/150).
6. **Per-player economies.** Mana (B8), shield pool (B6), counters (B7),
   combo and `ultimate_mana_gate` 90 run independently per player against
   the other. Wrong-answer mana (10) is never multiplied — unchanged.
7. **Win verdict, ties included.** B12's HP-fraction comparison decides the
   match when both survive round 4, with one deliberate change: **tie →
   draw** (R8, Formulas). PvE's `≥` (tie-goes-to-player) cannot be symmetric;
   a draw pays no
   RP to either player and counts neither as a win nor a loss for any
   streak. Simultaneous KO resolves through R6. Ownership: real-pvp owns
   the tie rule; battle-system's B12 row is
   untouched.
8. **Shared question set, delivered per round.** The server draws one
   question set per match
   (one per round, same draw policy k=1, same build gates ≥ 8) and sends the
   same question, in the same order, to both players. Delivery is
   **per-round**: question n is sent only in round n's start message, never
   bundled at match start — a whole-set delivery at `Matched` would let a
   modified client read ahead to round 4 (specialist finding, closed here).
   The F5
   no-immediate-repeat guard runs server-side over the match's draw history.
9. **RP through ranked-league.** Ranked PvP outcomes emit the same events:
   +28 on victory, −14 on defeat and on forfeit (Rule 12), nothing on a
   draw. ranked-league owns tiers, divisions and season placement; PvP wins
   and ghost ranked wins feed the same ladder.
10. **Honesty both ways (Pillar 4).** Every PvP surface labels a human duel
    as human ("Đấu người thật") and the fallback ghost duel as simulated.
    No fabricated presence, no invented queue counts, no disconnect masking.
    The anti-pillar "NOT fake-live" binds this mode harder than any other,
    because here the fake thing would be the whole feature.
11. **Optional by construction.** PvP is a separate encounter type
    (`ranked_pvp`, alongside friend/ranked/tower). No progression, quest, or
    unlock depends on it; disabling the mode (maintenance, low population)
    degrades nothing else. This is the index's "optional" made structural.

**Matchmaking**

12. **Queue by RP band, widening with wait.** The server pairs queued
    players whose RP differs within the band defined by R2 (Formulas);
    band widens on R2's schedule. No client-chosen opponents at launch —
    friend duels are a recorded open question (OQ-RVP6).
13. **Honest fallback.** After the wait budget `T_max` (45 s; R1,
    Formulas) the client
    presents a choice: keep waiting, or take a ghost duel — labelled as
    simulated, exactly as today's ranked banner does. The system never
    silently substitutes a ghost for a human.

**Connection and integrity**

14. **Disconnect and reconnect.** A dropped connection starts a 20 s grace
    window (R5, Formulas); the opponent's client shows the honest state
    ("Đối thủ mất kết
    nối — chờ 20 s"), never a faked still-playing opponent. Reconnection
    inside the window restores full match state from the server snapshot and
    the round continues (the disconnected player's clock keeps running).
    After the window the match is forfeited by the disconnected player: −14
    RP for them, +28 for the opponent. The forfeiter's −14 is ranked-league's
    forfeit value unchanged; the +28 win side is this system's addition (a
    ghost forfeit has no opponent to pay). Different construct from
    ranked-league's 15-minute abandon-detection window — only the forfeiter's
    value is shared.
15. **Server-side validation.** The server checks every answer against the
    content bank and every elapsed against its own timestamps. A commit
    arriving before the round's server start is rejected as invalid, not
    scored at 1.3. The client's perceived timing is presentation; only the
    server's clock scores.
16. **Latency compensation, capped.** Elapsed time is credited from the
    server clock minus half the measured RTT, capped at 250 ms (R3,
    Formulas) — the
    compensation favours the laggy player's credited speed, never the
    low-latency player's. Above the cap the excess latency is the player's
    own cost; the cap also bounds how far a client can inflate a measured
    RTT to shave elapsed time.

### States and Transitions

Match lifecycle, owned by the server (clients mirror it as render state):

| State | Meaning | Valid transitions | Trigger |
|---|---|---|---|
| `Idle` | No match | → `Queueing` | Player enters PvP queue |
| `Queueing` | Waiting for a band-matched opponent | → `Matched`, → `Idle` | R2 pairing found / player cancels |
| `Matched` | Pair locked, both clients notified | → `Countdown` | Both clients confirm snapshot load |
| `Countdown` | Synchronised start (3-2-1 on server clock) | → `Round(1)` | Countdown expires |
| `Round(n)` | Awaiting both commits for question n | → `Resolving`, → `Interrupted` | Both commits in, or window W expires |
| `Resolving` | Server computes round outcome | → `Round(n+1)` (n<4), → `Verdict` (n=4 or KO) | Resolve broadcast sent |
| `Interrupted` | A connection dropped mid-round | → `Round(n)` (reconnect), → `Verdict` (forfeit) | Reconnect inside 20 s / grace expired |
| `Verdict` | Victory / defeat / draw computed | → `PostMatch` | Both clients acknowledge |
| `PostMatch` | `BattleResult` commit + RP event + match record | → `Idle` | Commit acknowledged (accounts-backend) |

- KO (HP ≤ 0) ends the match immediately from `Resolving` — rounds do not
  continue after a knockout, same as PvE.
- `Interrupted` may occur in any of `Round(n)`, `Countdown` (treated as
  restartable: countdown restarts once), and `Resolving` (resolve is
  already computed server-side — reconnect delivers it, no recompute).

### Interactions with Other Systems

| System | Hard/Soft | Data in → out | Owner of semantics |
|---|---|---|---|
| battle-system | Hard | Round engine + formulas B1–B12 reused verbatim; substitution point: opponent input source (ghost `resolve_round` → live opponent commit stream); `BattleResult` emitted at match end | battle owns rules; real-pvp owns synchronisation and server adjudication |
| accounts-backend | Hard | Identity + session auth in; match records + outcome commit out. Trust model: PvP outcomes are server-computed before any commit exists — the F3 retry ladder applies only to the client's *acknowledgement*, never to the outcome | accounts-backend owns storage; real-pvp owns the match record shape |
| ranked-league | Soft (Hard once PvP ships into the ladder) | RP band for R2 matchmaking in; ±28/−14 RP events out | ranked-league owns ladder/tier/season math; real-pvp owns band widening |
| question-content | Hard | Shared question-set draw server-side; pools obey the ≥ 8 build gate; F5 guard runs server-side | question-content owns schema/pools; real-pvp owns the shared-draw policy |
| speech-io | Soft | Ultimate-round `quality ∈ [0,1]` — produced by server-side scoring in PvP (provisional; see OQ-RVP3) | speech-io owns scoring semantics; real-pvp owns where it runs |
| ui-shell | Soft | Live opponent HP/shield/mana, win bar vs human, honest disconnect banner, resolve theater; F-UI3 server-clock countdown reused for both clocks | ui-shell owns rendering; real-pvp owns the state it renders |
| opponent-ai | None | Explicitly not involved: no ghost rolls in PvP. The fallback ghost duel is a plain ranked ghost match, not "opponent-ai inside PvP" | — |
| analytics | Soft | Match lifecycle events (queue wait, pair band, forfeits, reconnects) | analytics owns instrumentation |

## Formulas

> **Sources**: systems-designer + network-programmer consultations, 2026-11-09
> (both run in parallel; reports reconciled here). **ID scheme: R-series =
> formulas** (adjudication/balance — matches the R2/R3 citations Section C
> already carried), **N-series = netcode mechanics** (synchronisation
> protocols that implement R-series numbers). Merges: the resolve-beat
> timing folded into R4; RTT measurement mechanics folded into R3; the
> band *table* is R2's (systems-designer's schedule, chosen over the
> netcode proposal's ±28-steps — see R2's rationale); the queue *message
> flow* is N2. B1–B12 are consumed verbatim everywhere; nothing here
> re-owns a battle expression.
>
> **NOT SOURCEABLE**: every RTT/hosting assumption (p50 ≤ 80 ms / p95 ≤
> 250 ms targets) is an assumption until devops-engineer names hosting
> regions and the transport ADR exists — there is no networking
> engine-reference in this repo and no engine is configured.

### R1 — Queue wait budget & fallback trigger

The `fallback_prompt` rule is defined as:

`fallback_prompt(t) = (t ≥ T_max)` — evaluated at `t = T_max`, then re-evaluated every `T_max` seconds while the player keeps waiting. `T_max = 45` s. Past `T_max`, the band freezes at R2's cap (no further widening).

**Variables:**

| Variable | Type | Range | Source | Description |
|----------|------|-------|--------|-------------|
| `t` | float | 0–unbounded (s) | server queue clock | This player's queue wait |
| `T_max` | int | 45 (safe 30–60) | tuning knob | Wait budget before the honest fallback choice (Core Rule 13) |
| `fallback_prompt` | bool | {true, false} | calculated | Client must present "keep waiting / ghost duel (labelled simulated)" |

**Output Range:** boolean; first fires at exactly t = 45 s, repeats each 45 s. The prompt is a choice, never an automatic substitution.

**Example:** Player queues at t = 0, no R2 pair. At 45 s the choice appears; player keeps waiting (band stays capped); next prompt at 90 s.

### R2 — Matchmaking band widening

The `band` formula is defined as:

`band(t) = min(B_cap, B_start + Δ_step × floor(t / t_step))`; pair(A, B) allowed iff `|rp_A − rp_B| ≤ min(band(t_wait_A), band(t_wait_B))`

**Variables:**

| Variable | Type | Range | Source | Description |
|----------|------|-------|--------|-------------|
| `t` | float | 0–unbounded (s) | server queue clock | Per-player queue wait at the pairing instant |
| `B_start` | int | 100 (GM: 200) | tuning knob | Opening band ±RP |
| `Δ_step` | int | 50 (fixed) | tuning knob | Band growth per step |
| `t_step` | float | 9.0 s (fixed) | tuning knob | Interval between steps |
| `B_cap` | int | 300 (GM: 350) | tuning knob | Maximum band |
| `rp_A`, `rp_B` | int | 0–unbounded | accounts-backend / ranked-league | Ladder RP of each player |

**Output Range:** band ∈ [100, 350]. **Pairing-consent rule**: `min(band_A, band_B)` — each player only receives opponents inside their own currently-widened band; a long waiter's widened band takes effect on a newcomer only once the newcomer's own band reaches the gap.

**Schedule table** (GM substitutes start 200 / cap 350, same step):

| Wait interval | Band (±RP) |
|---|---|
| 0 ≤ t < 9 s | 100 |
| 9 ≤ t < 18 s | 150 |
| 18 ≤ t < 27 s | 200 |
| 27 ≤ t < 36 s | 250 |
| 36 ≤ t < 45 s | 300 (GM: cap binds at t = 27 → 350) |
| t ≥ 45 s (kept waiting, R1) | frozen at cap |

**Why this schedule** (and not one keyed to the ±28 RP win delta): the tier floors 0/1000/1300/1600/1900 make ±28-steps structurally unable to form pairs in a small population — a ±84 window after 30 s of waiting would push most sessions to the R1 fallback. This schedule's structural guarantee: a Bronze at 0 reaches at most rp 300 (still Bronze) — **Bronze-vs-Grandmaster is impossible by construction** — and a GM at 1900 caps down to 1550, below the Diamond floor; **min-consent is what holds the pairing to adjacent tiers**, because a Gold opponent's own band (cap 300) can never reach 1900 from Gold's rp range (≤ 1599 + 300 = 1899 < 1900), so the effective floor stays the Diamond floor 1600 and worst case is adjacent tiers. GM opens wider (±200, cap ±350 → mid-Diamond at t = 27) because its population is the smallest.

**Cross-region pairing**: out of scope — no region/latency-zone entity exists in any GDD or the registry (NOT SOURCEABLE). If it ever ships, gate on measured RTT ≤ 500 ms or R3's full compensation degrades for both players (OQ-RVP8).

**Example:** Player at rp 1450 waited 20 s: `floor(20/9) = 2` → `min(300, 100 + 100) = 200` → window [1250, 1650]. A newcomer at rp 1600 (band 100) does not pair (gap 150 > 100); at their own t = 9 s (band 150) the pair forms.

### R3 — Latency-compensated elapsed credit

The `elapsed_credit` formula is defined as:

`credited_elapsed_ms = max(0, (t_commit_receipt − t_round_start) − round_half_up_ms(min(RTT_ms / 2, 250)))` — the credited value feeds B2's `elapsed_s` and B10's `elapsed_ms`; no other formula changes.

**Variables:**

| Variable | Type | Range | Source | Description |
|----------|------|-------|--------|-------------|
| `t_commit_receipt` | float (ms) | server clock | server receive timestamp | Core Rule 15: only the server's clock scores |
| `t_round_start` | float (ms) | server clock | R4 | Round window start |
| `RTT_ms` | int | 0–unbounded (typical 40–800) | measured (below) | Smoothed round-trip latency to this client |
| `credit cap` | float | 0.25 s (locked) | constant (Core Rule 16) | Favours the laggy player, never beyond |

**RTT measurement (netcode mechanics, folded):** server-initiated ping/echo every `ping_cadence_ms` (default 2000, band 1000–5000); per-sample spike filter discards |sample − RTT_EWMA| > `jitter_clamp_ms` (default 1000); smoothing `RTT_EWMA = 0.75 × RTT_EWMA + 0.25 × sample` (α 0.25, init from N1's sync median). The server measures from its own echoes — client-reported timing is never trusted (Core Rule 15).

**Output Range:** credit ∈ [0, 250 ms]; credited_elapsed ≥ 0. For RTT ≤ 500 ms compensation is exact: `server_elapsed ≈ true_answer + RTT/2`, so subtracting returns the player's true answer time. Above 500 ms the excess is the player's own cost.

**Cap sanity check (250 ms is right):** 250 ms ≪ the 3000 ms fast-crit threshold — credit can move a commit across that boundary by at most 250 ms, which is the *designed* favour to laggy players, bounded: worst speedMult distortion = 0.3 × 0.25/round_time — 0.0075 at a 10 s round, 0.015 at the 5 s floor (invisible either way); with the cap, RTT inflation can never steal more than 250 ms per round regardless of inflated size. **Residual exploit, named honestly — pong-delay inflation**: a modified client can delay ping responses to inflate measured RTT ≥ 500 ms and pocket the full 250 ms credit (its effective fast-crit threshold becomes 3.25 s) — pong delay does not slow its data frames, so this is a real but bounded small cheat. Mitigation verdict: an RTT floor would punish exactly the genuinely-laggy players R3 exists to help; accepted at Alpha with analytics monitoring (RTT distributions per match), deferred baseline-comparison fix recorded as OQ-RVP7.

**Examples:** (1) RTT 120 ms, true answer 2.40 s: server elapsed 2.46, credit 0.06 → credited **2.40 s** < 3000 ms — crit stands. (2) RTT 480 ms, true 2.90 s: server 3.14, credit 0.24 → **2.90 s** — full compensation. (3) RTT 900 ms, true 2.90 s: credit capped 0.25 → **3.10 s** — no guaranteed crit; excess latency is the player's cost.

### R4 — Shared round window & resolve beat

The `W` formula is defined as:

`W(n) = max(round_time_A(n), round_time_B(n))` — each from that player's own B1. `personal_deadline_X(n) = t_round_start + round_time_X(n)`. Round n resolves when **both commits are in or both personal deadlines have passed** (`t_both_done`), whichever comes first — never on the second commit alone (no in-flight commit is orphaned by the opponent's fast answer).

**Resolve beat:** `t_broadcast = t_both_done + pvp_resolve_beat_ms`; round n+1 starts at `t_broadcast + pvp_round_gap_ms`. Defaults: `pvp_resolve_beat_ms = 1000` (safe band 800–1500 — sits inside battle's reveal-delay band 800–1500 ms, so ui-shell's existing reveal theatre renders unchanged, the "ghost answering" gesture becomes "opponent answering"), `pvp_round_gap_ms = 100` (band 50–250).

**Variables:**

| Variable | Type | Range | Source | Description |
|----------|------|-------|--------|-------------|
| `round_time_X(n)` | float | 5–~14.75 s | B1 per player | Personal countdown; practical max = equipment-extended Grammarian grammar round |
| `W(n)` | float | 5–unbounded | calculated | Server window = slower player's B1 |
| `personal_deadline_X` | float | t_start + own round_time | calculated | The only deadline that scores that player — late commit is recorded, scored as timeout (B2 → 1.0, answer void) |
| `pvp_resolve_beat_ms` | int | 800–1500; default 1000 | tuning knob | Fixed theatre beat before broadcast |
| `pvp_round_gap_ms` | int | 50–250; default 100 | tuning knob | Render guard before the next round opens |

**Output Range:** a round always resolves by `t_round_start + W + 1100 ms`. Early resolution is the speed fantasy: a fast pair resolves in ~2 s + beat, never waiting out W.

**Example:** Both Wordsmith, 10 s. A commits 3.2 s, B at 4.1 s → t_both_done = 4.1, broadcast 5.1, round 2 at 5.2. If B never commits: t_both_done = 10.0 (deadlines), broadcast 11.0 — any B commit arriving after 10.0 is rejected whole (post-`t_both_done`), never scored. The recorded-timeout case needs asymmetric clocks: A 10 s / B 11 s (W = 11), A commits at 10.4 s — past A's own deadline, inside W → recorded, scored as a timeout (AC5's fixture).

### R5 — Disconnect grace & forfeit timing

The `grace` rule is defined as:

`t_forfeit = t_disconnect + grace_s`, `grace_s = 20`. **The engine never pauses** — the round continues; the absent player's pending round auto-resolves at their personal deadline as a timeout (elapsed clamped, speedMult 1.0, answer void, they still take the opponent's damage through R7). A paused engine would let a losing player weaponise disconnect as a 20 s stall every round; non-pausing removes that exploit and is the load-bearing reading of Core Rule 14's "clock keeps running".

**Variables:**

| Variable | Type | Range | Source | Description |
|----------|------|-------|--------|-------------|
| `t_disconnect` | float | any match time | server clock | Last healthy heartbeat |
| `grace_s` | int | 20 (safe 10–30) | tuning knob | Reconnect window |
| `t_forfeit` | float | t_disconnect + 20 | calculated | Forfeit instant — fires only while the match is live |

**Output Range:** outcome per instant. Reconnect ≤ t_forfeit → snapshot restore, live resume. t_forfeit on a live match → forfeit: −14 absent, +28 opponent. **Verdict precedence: KO > forfeit** — if the absent player was KO'd before t_forfeit, the label is "KO loss" (same −14), never "forfeit".

**Why 20 s:** round windows are 5–11 s (14.75 worst), so 20 s ≈ 2× the longest common round — a disconnected player gets the rest of the current round plus most of the next; 10 s < one round feels random, 30 s punishes the honest opponent with three rounds of dead air.

**Reconnect mechanics (netcode, folded):** `client → reconnect {match_id, last_seen_seq}` → `server → full snapshot {match_seq, state}` — always a **full snapshot** (a 4-round match's state is ~1–2 KB; delta compression buys nothing). `match_seq` is a monotonic integer incremented on every server state mutation, carried by every server→client message; the client renders what it receives and never reconstructs history. Restored: lifecycle state, round index, per-player HP/shield/mana/combo/gate, current question only, personal deadline, any commit already received, last resolve payload (if in `Resolving` — already computed, reconnect delivers it, no recompute), verdict if decided. The reconnecting client sees the current round with **true remaining time** (no reset they didn't earn) plus a compact result strip for completed rounds. Socket re-establishment tries at 0.5/1/2/4 s (four tries inside the grace); after forfeit, match-socket retries stop and the F3 ladder governs only the result acknowledgement, exactly as in PvE.

**Example:** Disconnect at round 2, 4.0 s into a 10 s personal window; opponent committed at 3.6. At 10 s the absent player's round auto-times-out; the round resolves (they take damage, deal 0). Reconnect at +13 s (≤ 20) → snapshot, resume at round 3. No reconnect → at +20 s: forfeit, −14/+28.

### R6 — Simultaneous-KO resolution

Applies at **every** round resolve, not only round 4 — both players' outgoing damage resolves simultaneously in any round type (both B3s, both B7 counters, both B5s), so mutual KO is possible whenever both are low enough.

```
apply both players' outgoing damage simultaneously through R7
if hp_A_after ≤ 0 AND hp_B_after ≤ 0:          # mutual KO
    winner = argmax(hp_before / hp_max)  (strict compare)
    exact fraction tie → DRAW
else: standard KO / survive rules
```

**Variables:**

| Variable | Type | Range | Source | Description |
|----------|------|-------|--------|-------------|
| `hp_X_after` | int | ≤ hp_max | battle state | 0 = KO |
| `hp_X_before` | int | (0, hp_max] | battle state | Strictly positive — a 0 would already have ended the match |
| `hp_X_max` | int | 360–615 | own LoadoutSnapshot | Base 360–420; equipment raises |

**Output Range:** {A, B, draw}. **No RNG, no seed** — the tiebreak is deterministic from server state, preserving Core Rule 18's replay discipline (a seeded coin would make the verdict seed-dependent, not just the damage stream). Fairness: the pre-round HP fraction is exactly the quantity B12 ranks on, so the tiebreak extends "who played better so far" to the mutual-KO case without inventing a new metric.

**Example:** Round 4: A (max 380) at 96 HP, B (max 420) at 110; both ults land: frac_A = 0.2526, frac_B = 0.2619 → **B wins**. Exact tie (0.2500 vs 0.2500) → **draw**, 0 RP both.

### R7 — PvP incoming mitigation & shield absorption

The `dmg_taken` formula is defined as:

`dmg_taken = round_half_up(incoming × (1 − min(0.25, max(0, def_eff_defender) / 600)))`; `absorbed = min(shield_pool_defender, dmg_taken)`; `hp_loss = dmg_taken − absorbed`; `shield_pool' = shield_pool − absorbed`

`incoming` = the attacker's verbatim B-series output (B3/B4/B5/B7) — an integer from the attacker's shared-module call, never re-rounded.

**Variables:**

| Variable | Type | Range | Source | Description |
|----------|------|-------|--------|-------------|
| `incoming` | int | ≥ 0 | attacker's B3/B4/B5/B7 | Wrong answer / timeout → 0 |
| `def_eff_defender` | int | 0–120 (equipment band) | defender's LoadoutSnapshot | Clamped ≥ 0 — negative never amplifies |
| `shield_pool_defender` | int | 0–~145+ | defender's own B6 pool | Per-player economy (Core Rule 6) |
| `dmg_taken`, `hp_loss` | int | ≥ 0 | calculated | `hp_loss = 0` iff incoming = 0 or full shield absorb — legitimate |

**Output Range:** `[round_half_up(incoming × 0.8), incoming]` under the def-120 band (min(0.25, 0.20) = 0.20). **The 0.25 cap saturates only at def ≥ 150 — dead code in PvP today**; kept verbatim from B9's shape so the one shared implementation stays identical (Core Rule 2) and a future def retune re-arms it automatically. **Pinned explicitly: B4's pierce is armor-only — shields absorb listening damage in full.** The pierce is what distinguishes listening from vocab (battle Core Rule 17), not a shield-bypass; noted so a future editor doesn't "fix" it.

**Example:** Bow-Wordsmith fast-crit vocab, incoming 227; Grammarian def 120: `227 × 0.80 = 181.6 → 182`; shield 97 absorbs 97 → hp_loss 85, pool empty.

### R8 — PvP verdict (B12 with tie → draw)

The `verdict` rule is defined as:

```
hp_A ≤ 0 xor hp_B ≤ 0       → KO decides (survivor wins)
both KO'd                   → R6
both alive after round 4    → frac_A vs frac_B (hp/hp_max, strict compare)
                              frac_A > frac_B → A wins; frac_B > frac_A → B wins; equal → DRAW
RP: win +28 | loss −14 | draw 0, no streak movement either way
```

**Variables:**

| Variable | Type | Range | Source | Description |
|----------|------|-------|--------|-------------|
| `hp_X`, `hp_X_max` | int | (0, max] / 360–615 | battle state / LoadoutSnapshot | Each player's **own hero HP** — no ghost HP anywhere in PvP |
| `frac_A`, `frac_B` | float | (0, 1] | calculated | B12's fraction, symmetric strict compare (`=` → draw, not PvE's tie-goes-to-player) |

**Output Range:** three outcomes; registry deltas verbatim (+28/−14, `rp_delta_win_ranked`/`rp_delta_loss_ranked`).

**Example:** Both survive: A 220/380 = 0.5789 vs B 252/420 = 0.6000 → B wins, +28/−14. Equal fractions → draw, 0 RP, streaks untouched.

### N1 — Clock synchronisation

The `θ*` (server-clock offset) formula is defined as:

`RTT_i = (t4 − t1) − (t3 − t2)`; `θ_i = ((t2 − t1) + (t3 − t4)) / 2`; `θ* = median(θ_1, θ_2, θ_3)` — three exchanges during Countdown. Client render: `remaining_s = round_time_s − ((monotonic_now + θ*) − t_start_server)` — F-UI3's server-clock countdown shape, reused exactly.

**Variables:**

| Variable | Type | Range | Source | Description |
|----------|------|-------|--------|-------------|
| `t1, t4` | float (s) | local monotonic | client `performance.now()` | **Monotonic clock only — never `Date.now()`** (carries ui-shell UI-AC3's no-device-clock rule forward) |
| `t2, t3` | float (s) | server clock | echo payload | Server receive/send times |
| `θ*` | float | typically ±100 ms | calculated | Client's estimate of server − local offset |
| `t_start_server` | float | server clock | `round_start` message | The only time the server scores against |

**Output Range / tolerances:** target residual skew ≤ 100 ms (invisible at the 100 ms countdown tick); tolerated ≤ 250 ms (one cosmetic tick of disagreement — the server, not the display, adjudicates); **> 500 ms at any round boundary → forced full re-sync** before the next round opens (server holds the start up to 750 ms). Every `round_start` piggybacks a fresh echo — a free per-round offset refresh that absorbs drift. Second consecutive sync failure → countdown restart (once per match) → honest dissolution, no RP change (see Edge Cases).

**Example:** (corrected after QA review — the specialist's original example computed the path-asymmetry term, not the offset) client sends `t1 = 100.000` (monotonic), true offset θ = +0.250 s, one-way latency 0.300 s, server processing 0.001 s: `t2 = 100.550`, `t3 = 100.551` (server clock), `t4 = 100.601` (client). Then `RTT = (0.601) − (0.001) = 0.600 s`; `θ = ((100.550 − 100.000) + (100.551 − 100.601))/2 = (0.550 − 0.050)/2 = +0.250 s` ✅ — the fixture needs all three exchanges (θ* is their median).

### N2 — Queue message flow

Per-step client-side timeouts (server owns the search; the client's budget is R1's `T_max`):

| Step | Message | Client timeout | On timeout |
|---|---|---|---|
| Enqueue | `enqueue {rp, loadout_digest}` → `queued` ack | 5 s, 2 retries 0.5 s apart | Honest offline state (below) — no fake spinner |
| Band search | server `paired {opponent_digest, band_used}` | none — T_max governs | R1 fallback choice at 45 s |
| Snapshot exchange | `match_ready {snapshot digest}` each side | 5 s per client | Pair dissolves → both re-queue, wait budget preserved; max 2 dissolves → fallback dialog opens early |
| Countdown sync | 3 × N1 exchange | 3 s | Countdown restarts once; second failure → match dissolved, no RP change |

**Server unreachable:** the queue button enters the offline-gate pattern ("Máy chủ không khả dụng — thử lại"), entry disabled — **no fabricated queue counts, no simulated searching animation, no client-invented wait estimate** (Pillar 4; here the fake thing would be the whole feature).

### N3 — Transport requirements (design-level only)

What the design requires of whatever transport implements it (stack choice → ADR):

1. **Ordered, reliable, low-latency bidirectional channel** per match — commits and round events never reorder; add-on latency budget ≤ 100 ms beyond network RTT.
2. **Server-authoritative flow** — client messages are requests rendered against server receive time (Core Rule 15); nothing the client sends is a consequential number.
3. **Per-message server timestamps** — every server→client message carries `t_server` and `match_seq`; the client's clock never enters scoring (R3/N1 depend on this).
4. **Versioned envelope** `{v: 1, type, match_id, seq, t_server, payload}` — unknown `type` dropped, not fatal (server can ship ahead of clients).
5. **Bandwidth envelope:** ~4–6 messages/round at ~0.5–1 KB; peak burst ≈ 6 KB at a resolve broadcast; sustained < 1 KB/s per player. Trivial by design — explicitly **not** building delta compression or prioritisation tiers (YAGNI).

**NOT SOURCEABLE (pending stack/hosting decisions):** WebSocket library choice and fallbacks; hosting regions and the RTT targets derived from them (p50 ≤ 80 / p95 ≤ 250 / tail 500 ms are assumptions); TLS and transport reconnection specifics; presence/lobby infrastructure for friend duels (OQ-RVP6); server-side speech-scoring latency (OQ-RVP3).

## Edge Cases

> Assembled from both specialists' findings (systems-designer degenerate-outcome
> analysis; network-programmer failure-path review) plus a walkthrough of the
> R/N formula space. `systems-designer` not separately re-consulted for this
> section — Lean mode; its D-consultation findings are incorporated below.

- **If both players disconnect simultaneously**: match void — no RP event to
  either player, no match record counted as a ranked result, both clients see
  the honest state ("Mất kết nối cả hai"). Never two forfeits (which would pay
  +28 to nobody and −14 to both) and never asymmetric awards. (network-programmer
  finding, adopted verbatim.)
- **If clock sync fails repeatedly**: countdown restarts **once** per match
  (States table); a second consecutive N1 failure (skew > 500 ms after re-sync)
  dissolves the match honestly — no RP change to either player, return to
  queue with the wait budget preserved. Without the bound, a sync-broken
  client could loop the lobby forever.
- **If snapshot exchange fails at `Matched`**: the pair dissolves and both
  players re-queue with their wait budget preserved (elapsed time counts);
  after **2** dissolves the R1 fallback dialog opens early — honesty over
  silence.
- **If a commit arrives before the round's server start** (client clock
  manipulation, stale replay): rejected as invalid — not scored at 1.3, not
  scored at all. Core Rule 15: only the server's clock and question sequence
  are admissible.
- **If a commit arrives after the sender's personal deadline but inside W**:
  recorded, scored as a timeout (elapsed clamped to own `round_time_s`, B2 →
  1.0, answer void) — the identical outcome to PvE expiry; the extra window
  time exists for the *opponent*, not for late answers.
- **If a commit arrives after `t_both_done`**: rejected whole (R4's trigger is
  both-done, not second-commit, so no in-flight commit is ever orphaned by a
  fast opponent).
- **If pong-delay inflation is detected in aggregate** (RTT distributions far
  above the account's non-PvP baseline): no in-match action — R3's 250 ms cap
  already bounds the theft; analytics records the distribution for the OQ-RVP7
  baseline-comparison decision. Anti-cheat escalation is a separate system's
  concern, not this GDD's.
- **If a maxed-gear account meets a fresh account inside one band**: R2 matches
  RP, not gear — near-guaranteed 3-round blowouts at low RP are accepted at
  Alpha with an analytics watch on rounds-per-match (OQ-RVP7's sibling); a
  gear-score matchmaking key would be a ranked-league ownership change and is
  deliberately not invented here. The damage-symmetry contract (Core Rule 5) is
  not broken to patch it.
- **If both players miss the ult round** (`quality = 0` both): zero outgoing
  damage both ways; the match proceeds to the round-4 verdict through R8 (or,
  if round 4 *is* the ult round, the survived-match fraction comparison).
  Quality 0 is a legitimate failure state, never a crash.
- **If the ult round carries the match to mutual KO**: R6 applies normally —
  B5's quality is just `incoming`; the tiebreak uses pre-round HP fractions,
  deterministic, no seed.
- **If a disconnect happens during `Countdown`**: countdown restarts once
  (shared with the sync-failure budget above — one restart total per match,
  whichever cause); second failure dissolves with no RP change.
- **If a disconnect happens during `Resolving`**: the resolve is already
  computed server-side; reconnect delivers it — no recompute, no double-apply
  of round damage. The absent player's verdict (KO loss vs forfeit) follows
  R5's precedence: KO > forfeit.
- **If grace expires while the disconnected player would have won** (opponent
  is lower on HP): the forfeit stands — −14/+28 exactly as any forfeit. Mercy
  exceptions would create a stall incentive; the honest label ("forfeit") and
  the ranked-league-identical values are the whole rule.
- **If a player at RP 0 queues**: the band window clamps at `max(0, rp −
  band)` — they can only be pulled upward, never below 0; RP floors at 0 per
  ranked-league RL2 (no debt state).
- **If a player accepts the fallback ghost duel at 45 s**: it is a *plain
  ranked ghost match* (opponent-ai, existing mode) — no PvP match record, no
  PvP telemetry, counted in the ladder exactly like any ranked ghost duel. The
  fallback must never create a third, hybrid encounter type.
- **If a player queues then enters another match mode** (tower, ranked ghost):
  the queue entry is cancelled (queueing is exclusive with being in a match);
  re-entering PvP restarts the wait budget at 0 — no phantom priority for
  abandoned queues.
- **If the server rolls back or restarts mid-match**: matches in flight are
  dissolved with no RP change to either player (the same honest-dissolution
  budget as sync failure); PostMatch commits already written persist through
  accounts-backend's normal durability. No "resume match" exists — a
  90-second match is cheaper to re-queue than to journal and replay.
- **If the mitigation cap 0.25 is never reached** (def band 120 → 0.20 max):
  expected, not a bug — the dead-code cap is kept verbatim from B9's shape so
  the shared implementation stays one formula (Core Rule 2); see R7. Nobody
  "simplifies" the two apart.
- **If the ult round's speech upload latency exceeds what R3 credits**
  (server-side scoring not yet landed, OQ-RVP3): until OQ-RVP3 resolves, PvP
  ult rounds run with the same client-measured quality as PvE but scored
  server-side against the recorded audio — if neither is implementable within
  W, the ult round falls back to the PvE spelling variant (B5's spell path)
  with no mic step. Provisional; OQ-RVP3 owns the final call.

## Dependencies

**Upstream dependencies** (decisions this system must respect):

| System | Tier | Hard/Soft | Interface | Owner of semantics | Status |
|---|---|---|---|---|---|
| battle-system | Full Vision | Hard | Round engine + formulas B1–B12 reused verbatim; opponent input source substitution (`resolve_round` → live commit stream); `BattleResult` emission at match end | battle owns rules; real-pvp owns synchronisation and server adjudication | GDD Approved |
| accounts-backend | Full Vision | Hard | Identity + session auth in; match records + outcome commit out. PvP outcomes are server-computed before any commit — the trust-model evolution this GDD's Dependencies records ("real-pvp makes it absolute") is fulfilled here | accounts-backend owns storage; real-pvp owns the match-record shape | GDD Approved |

**Soft dependencies** (enhanced by, functional without):

| System | Interface | Owner of semantics | Status |
|---|---|---|---|
| ranked-league | RP band for R2 matchmaking; ±28/−14 RP events from PvP outcomes feed the same ladder as ghost ranked duels | ranked-league owns tiers/divisions/seasons; real-pvp owns band widening | GDD Approved |
| question-content | Shared question-set draw server-side; pools obey the ≥ 8 build gate; F5 guard over the match's draw history | question-content owns schema/pools; real-pvp owns shared-draw policy | GDD Approved |
| speech-io | Ultimate-round `quality ∈ [0,1]` produced by server-side scoring in PvP | speech-io owns scoring semantics; real-pvp owns where it runs | GDD Approved — **provisional contract** (OQ-RVP3: server-side scoring approach undecided) |
| ui-shell | PvP HUD state (opponent HP/shield/mana, win bar), honest labels, disconnect banner, F-UI3 server-clock countdown | ui-shell owns rendering; real-pvp owns the state | GDD Approved |
| analytics | Match lifecycle events (queue wait, band, forfeits, reconnects) | analytics owns instrumentation | GDD Approved (2026-11-09) |

**Explicit non-dependency:** opponent-ai. No ghost rolls exist inside PvP; the
honest fallback after the wait budget is a plain ranked ghost match, which is
opponent-ai operating in its existing mode, not a dependency.

**Bidirectionality check** (Dependencies must be bidirectional):

- `battle-system.md` Dependencies → downstream dependents lists real-pvp
  (Soft, "the same round state machine, later against human inputs") ✅ —
  its row's status string ("deferred, not designed") is now stale; battle's
  next edit may update it to point here, the same way it did for
  ranked-league's OQ-BS3 resolution. Not edited from this session —
  battle-system is Approved; flagging only.
- `accounts-backend.md` Dependencies → downstream dependents lists real-pvp
  (Full Vision, Hard once it exists, "real-pvp owns netcode; server
  authority redefines the trust model") ✅ — this GDD adopts exactly that
  framing in Core Rule 1.
- `ranked-league` (OQ-RL3), `speech-io` (its call/response cross-reference
  note) and `ui-shell` (its deferred-replacement note) mention real-pvp
  without a dependency row; `question-content` does not mention it. It
  postdates them and is downstream of their contracts, not a consumer. This is
  acceptable bidirectionality: dependency edges point
  *from* this system *to* them; no GDD declares a dependency on real-pvp, so
  no GDD needs a reverse row. `/consistency-check` should confirm none of
  them grew a real-pvp dependency.

**Provisional assumptions** (contracts defined here, to be confirmed or
conflicted by their owners' next edit):

1. speech-io's scorer can run server-side for PvP ult rounds (OQ-RVP3).
2. question-content's draw API is callable from the server with the same
   build gates it enforces client-side today.
3. ranked-league's RP event vocabulary accepts a PvP match source distinct
   from ghost ranked matches AND a draw outcome (0 delta, no streak movement) —
   draws cannot occur in ghost ranked play (PvE's B12 tie-goes-to-player), so
   the draw event is new vocabulary, not a label-only change; the ±28/−14
   values are unchanged.

**Trust-model dependency chain** (accounts-backend's, made concrete): MVP
client-trusted → ranked-league ship: server-computed outcomes → real-pvp:
server-authoritative, absolute. Nothing in this system reads a
client-computed battle number, ever.

**Build prerequisite** (specialist finding, recorded here): Core Rule 2's
"one formula module, two hosts" is a *prerequisite*, not a by-product — the
shared B-series implementation package must be extracted and server-tested
before any PvP work starts. Named as OQ-RVP1 so the architecture phase
schedules it.

## Visual/Audio Requirements

Rendering stays owned by ui-shell over battle's event contract (battle-system
Visual/Audio: "battle owns state and emits typed events; ui-shell owns all
rendering"). Real-pvp adds *states*, not effects. `art-director` not consulted
— Lean mode; this system's visual feedback is not central to it (no new
impact events exist; every round resolves through the same B-series event
vocabulary ui-shell already renders). Review manually.

- **New states to render, honestly labelled:** queueing (with real elapsed
  wait time — never an invented count of other seekers), matched, opponent
  disconnect ("Đối thủ mất kết nối — chờ 20 s"), reconnect, forfeit, draw.
  All follow Pillar 4: the UI must never fake presence it does not have.
- **Resolve theater parity:** the PvP resolve beat uses the same
  intensity-hierarchy rules as battle's (one loud event per resolve beat);
  the ghost reveal delays (1000/800/1200/1500 ms) do not apply — the
  opponent's answer reveal beat is defined in R-series sync (network-programmer
  proposal), bounded so it never gates the next round's state.
- **Human-opponent identity:** the opponent portrait/name area needs a
  visual treatment that reads "real person" (verified account identity from
  accounts-backend), distinct from the ghost aesthetic. Direction →
  `/asset-spec` after the art bible exists; no new VFX budget claimed here.
- **Audio:** no new SFX owned. Existing battle event sounds suffice; an
  optional queue-found cue is ui-shell's call, not a requirement.

## Game Feel

Required for a `Gameplay` category system — authored here with the same lean
caveat: feel targets, not implementation.

- **The pace must not change.** A PvP round feels like a ghost round: same
  countdown, same resolve rhythm. Any added sync latency must be invisible —
  the design's clock-skew and reveal-beat numbers exist precisely so the
  player never feels the server between commit and resolve.
- **The one difference is the opponent.** Where the ghost's reveal is
  theatre (deliberately not louder than the player's own effect — Pillar 4),
  the human opponent's answer landing is *competition*: the win bar moving
  because someone else was faster is the system's signature moment. The
  resolve beat should let that read (win bar animation is ui-shell's).
- **Latency is never the excuse.** A player who loses must be able to
  attribute the loss to answers, not ping. That is why compensation is
  capped (R-series) and why the cap's residual is disclosed in the GDD
  rather than hidden.
- **Disconnects are tense, not silent.** The 20 s grace window should be
  visible on both sides as a countdown — tension, not abandonment; and it
  must resolve into an honest verdict either way.

## UI Requirements

Real-pvp owns no screens — ui-shell owns all screens (its GDD's
rendering-only ownership). This system contributes **state and copy
requirements** to two ui-shell surfaces:

1. **Matchmaking surface** (new, inside the existing ranked/league area):
   queue entry, real elapsed wait, the 45 s fallback choice (keep waiting /
   ghost duel, labelled simulated), cancel. Honest copy throughout; no
   fabricated queue depth.
2. **Battle HUD (PvP variant)**: opponent HP/shield/mana mirror, win bar vs
   human, disconnect/reconnect banner with visible 20 s countdown, draw
   verdict alongside victory/defeat.

> **📌 UX Flag — Real PvP**: This system has UI requirements (matchmaking
> surface + PvP HUD variant). In Phase 4 (Pre-Production), run `/ux-design`
> for these surfaces before writing epics; stories should cite
> `design/ux/[screen].md`, not this GDD.

## Cross-References

| Referenced GDD | What this GDD uses | Where |
|---|---|---|
| battle-system.md | B1–B12 formulas; round state machine; BattleResult; reveal-theater intensity hierarchy | Core Rules 1, 4–9; Interactions; Visual/Audio |
| accounts-backend.md | Identity/auth; match records; trust-model evolution (server-authoritative absolute); F3 retry ladder (ack only) | Core Rules 1, 15; Dependencies |
| ranked-league.md | RP tiers for R2 bands; ±28/−14 deltas; grace-forfeit parity | Core Rules 9, 14; Formulas R2 |
| question-content.md | Pool build gate ≥ 8; F5 no-immediate-repeat guard; draw policy k=1 | Core Rule 8 |
| speech-io.md | Ult-round `quality ∈ [0,1]` contract | Core Rule 5; OQ-RVP3 |
| ui-shell.md | F-UI3 server-clock countdown; honest-label copy baseline; rendering ownership | Core Rule 10; UI Requirements |
| game-concept.md | Pillar 1 (Speed Is Damage), Pillar 4 (Honest Ghosts), anti-pillar "NOT fake-live", Technical Considerations (WebSocket direction) | Overview; Core Rules 5, 10 |

## Acceptance Criteria

> **Source**: qa-lead validation, 2026-11-09, over a 27-criterion draft — 5 fixed
> per its findings, ~14 coverage gaps closed as AC28–AC41, the N1 worked example
> corrected (specialist arithmetic error found by QA; the golden values below
> are the corrected ones). Determinism: every timing-dependent criterion runs on
> an injected server clock over a simulated timeline — no wall-clock sleeps;
> RNG-dependent criteria inject fixed seeds (Core Rule 1's server-owned streams);
> band constants and RP deltas are read from tuning config / registry, not
> literals in test code. AC2/AC26's parity halves are blocked-by OQ-RVP1 (shared
> B-series module) — flagged in the test plan, not failures.

**RVP-AC1** — GIVEN a live PvP match with a protocol-level test double replacing one client, WHEN the double sends each tamper vector in turn (claimed HP value, inflated damage number, elapsed = 0, fabricated crit flag, fabricated wrong-answer outcome), THEN the next server broadcast is byte-identical to a control execution with an honest client (server authority, Core Rule 1).

**RVP-AC2** — GIVEN the shared B-series module, WHEN a PvP round computes damage for a fixed input set, THEN every output equals the ghost-battle implementation's output for identical inputs (cross-host golden test; blocked-by OQ-RVP1).

**RVP-AC3** — GIVEN round n in progress, WHEN player A commits, THEN no message delivered to player B before the resolve broadcast contains A's answer text or correctness flag (answer privacy, Core Rule 3).

**RVP-AC4** — GIVEN A's round_time 10 s and B's 11 s (W = 11), WHEN both commit by 5 s, THEN the round resolves at `t_both_done + 1000 ms` (not at W) and round n+1 opens 100 ms after the broadcast (early resolution, R4).

**RVP-AC5** — GIVEN A's personal deadline (10 s) has passed, WHEN A commits at 10.4 s (inside W), THEN the commit is recorded and scored as a timeout: speedMult 1.0, answer void (R4/Core Rule 4).

**RVP-AC6** — GIVEN defender def 120, incoming 227, shield pool 97, WHEN the hit resolves, THEN dmg_taken = 182, absorbed = 97, hp_loss = 85, pool = 0 (R7).

**RVP-AC7** — GIVEN listening damage incoming and defender shield ≥ incoming, WHEN it resolves, THEN the shield absorbs in full and hp_loss = 0 — the pierce never bypasses shields (R7's pinned note).

**RVP-AC8** — GIVEN both players' mana, shield pools, combos and ult-gates at distinct values, WHEN a round resolves (A: arcane correct listening, B: wrong), THEN each player's four resources update independently: only A's mana rises by min(100 − 60, 41) = 40; B's resources are untouched by A's resolution; A's B7 counter (if grammar round) computes from A's state alone (per-player economies, Core Rule 6) and then lands on B through R7 — B's def mitigates it and B's shield pool absorbs it like any incoming damage (armor-only pierce, per R7's pin).

**RVP-AC9** — GIVEN both players survive round 4 with equal HP fractions, THEN the verdict is a draw: +0 RP to both, no streak movement either way (R8/Core Rule 7).

**RVP-AC10** — GIVEN a mutual KO with pre-round HP fractions 0.2526 vs 0.2619, THEN B wins deterministically; GIVEN exact fractions 0.2500 vs 0.2500, THEN draw; GIVEN the same seeded inputs replayed, THEN the identical winner both times (R6; verdict carries no seed draw).

**RVP-AC11** — GIVEN match start, WHEN round 1 begins, THEN the client has received question 1 only; questions 2–4 appear in no message captured before their own rounds (per-round delivery, Core Rule 8).

**RVP-AC12** — GIVEN a ranked PvP victory / defeat / draw, THEN the RP event emitted is +28 / −14 / 0 respectively, matching registry `rp_delta_win_ranked` and `rp_delta_loss_ranked` (Core Rule 9).

**RVP-AC13** — GIVEN the four PvP surfaces (matchmaking surface, PvP HUD variant, fallback dialog, disconnect banner), THEN each renders both the human-duel copy and the simulated/ghost copy as distinct strings sourced from the shared copy file — no surface reuses the ghost string for a human opponent or vice versa (Core Rule 10).

**RVP-AC14** — GIVEN `pvp.enabled: false` in project config, WHEN the game boots and ghost, tower and forge flows run, THEN each passes its existing ACs unchanged (optional by construction, Core Rule 11).

**RVP-AC15** — GIVEN a player at rp 1450 with t = 20 s queue wait, THEN band = min(300, 100 + 50 × 2) = 200 and window [1250, 1650]; GIVEN a newcomer at rp 1600 with band 100, THEN the pair is rejected (gap 150 > min(200, 100)) until the newcomer's band reaches 150 at t = 9 s (R2, min-consent).

**RVP-AC16** — GIVEN queue wait reaches 45 s with no pair, THEN the client presents keep-waiting / ghost-duel (labelled simulated) and no ghost match starts before the user's choice; on "keep waiting", the band stays at its cap and the prompt repeats at 90 s (R1/Core Rule 13).

**RVP-AC17** — WHEN a commit arrives before the server round start, THEN it is rejected as invalid and scores nothing (Core Rule 15).

**RVP-AC18** — GIVEN RTT 480 ms and true answer 2.90 s, THEN credited elapsed = 2.90 s (full compensation, fast crit stands); GIVEN RTT 900 ms and true 2.90 s, THEN credited = 3.10 s — cap binds, no guaranteed crit (R3).

**RVP-AC19** — GIVEN a three-exchange sync fixture with t1 = 100.000, t2 = 100.550, t3 = 100.551, t4 = 100.601 (offset +0.250, one-way 0.300, processing 0.001), THEN measured RTT = 0.600 s and θ* = +0.250 s (median of three); GIVEN injected sustained skew > 500 ms at a round boundary, THEN a forced re-sync occurs before the next round opens (N1).

**RVP-AC20** — GIVEN a disconnect with no reconnect by t + 20 s on a live match, THEN forfeit: −14 disconnected, +28 opponent; GIVEN the absent player was KO'd before t + 20 s, THEN the verdict is "KO loss" (−14), never "forfeit" (R5 precedence).

**RVP-AC21** — GIVEN a reconnect inside the grace window, THEN a full snapshot restores lifecycle state, round, resources, current question and true remaining time; the opponent's clock never paused (R5/N2 mechanics).

**RVP-AC22** — WHEN both players' connections drop inside the same grace window, THEN the match is void: 0 RP to both, no ranked record (Edge Cases).

**RVP-AC23** — WHEN the player accepts the ghost fallback, THEN the encounter is a standard ranked ghost match (opponent-ai) and no PvP match record is created (Edge Cases).

**RVP-AC24** — GIVEN a resolve broadcast, THEN its serialized payload ≤ 6 KB and a full round's message count ∈ [4, 6] (deterministic assertions); sustained KB/s remains a perf-smoke advisory, not a blocking unit assertion (N3).

**RVP-AC25** — GIVEN a GM at rp 2050 at t = 30 s, THEN band = min(350, 200 + 50 × 3) = 350 and window [1700, 2400]; GIVEN a player at rp 0, THEN the window clamps to [0, band] — never negative RP (R2).

**RVP-AC26** — GIVEN a defender with def 120 (equipment band max), THEN the applied mitigation factor is 0.20 (the 0.25 saturation branch is unexercised in PvP); GIVEN def 150+ inputs in the shared module's parity golden, THEN PvP mitigation branches identically to B9 (blocked-by OQ-RVP1).

**RVP-AC27** — WHEN the PvP matchmaking surface and PvP HUD variant ship, THEN each carries a retained screenshot in `production/qa/evidence/` showing: matchmaking — real elapsed wait and the 45 s keep-waiting/ghost choice; HUD — opponent HP/shield/mana mirror, win bar vs human, disconnect banner with visible 20 s countdown, and the draw verdict alongside victory/defeat (UI evidence gate; qa evidence, not unit).

**RVP-AC28** — GIVEN player B disconnected mid-round with A already committed, WHEN B's personal deadline passes, THEN B's contribution scores as a timeout (outgoing 0) while B still receives A's damage through R7 — the engine never paused (R5's anti-stall core).

**RVP-AC29** — GIVEN B's HP ≤ 0 at a round resolve (single KO), THEN the match ends immediately — no round n+1 starts — with A winning +28/−14 (R8's most common path).

**RVP-AC30** — GIVEN queue waits of exactly t = 9.0, 18, 27, 36 s, THEN the band steps to 150/200/250/300 at those instants (floor semantics); GIVEN t = 27 s GM, THEN band = 350 (cap binds); GIVEN t > 45 s while kept waiting, THEN the band stays frozen at its cap (R2 + R1's freeze; constants read from tuning config).

**RVP-AC31** — WHEN a commit arrives after `t_both_done`, THEN it is rejected whole — no partial scoring (R4's both-done trigger).

**RVP-AC32** — GIVEN both players' ult-round quality = 0, WHEN the round resolves, THEN outgoing damage is 0 both ways and the match proceeds to verdict normally — no crash, no special state (Edge Cases).

**RVP-AC33** — GIVEN a disconnect during `Resolving`, WHEN the player reconnects, THEN the precomputed resolve payload is delivered exactly once and round damage is applied exactly once — no recompute, no double-apply (Edge Cases).

**RVP-AC34** — GIVEN grace expiry while the absent player leads on HP fractions, THEN the forfeit stands (−14/+28) — no mercy exception (Edge Cases).

**RVP-AC35** — WHEN a queued player enters another match mode (tower or ranked ghost), THEN the PvP queue entry is cancelled and a re-entry starts the wait budget at 0 (Edge Cases).

**RVP-AC36** — GIVEN a server restart mid-match, THEN the match dissolves with 0 RP to both players and any already-committed PostMatch results persist (infrastructure test; Edge Cases).

**RVP-AC37** — GIVEN the enqueue ack times out twice (5 s each), THEN the client shows the honest offline state ("Máy chủ không khả dụng — thử lại") with entry disabled — no spinner, no simulated search (N2).

**RVP-AC38** — GIVEN a snapshot-exchange timeout, THEN the pair dissolves and both players re-queue with wait budget preserved; GIVEN a second dissolve, THEN the R1 fallback dialog opens early (N2).

**RVP-AC39** — GIVEN a countdown-sync timeout, THEN the countdown restarts once; GIVEN a second consecutive failure, THEN the match dissolves with no RP change to either player (N2/Edge Cases).

**RVP-AC40** — GIVEN any server→client message, THEN it carries `t_server` and a strictly increasing `match_seq`; GIVEN a message with an unknown envelope `type`, THEN it is dropped without fatal error (N3).

**RVP-AC41** — GIVEN a match's full draw history, WHEN each round's question is drawn, THEN no question repeats an immediately-preceding draw per the F5 guard, evaluated server-side (Core Rule 8).

**Classification** (per `.claude/docs/coding-standards.md` evidence table): 25 unit-testable (Logic — blocking), 13 integration (multi-party/protocol flows — blocking), 2 UI (retained screenshot evidence — blocking), 1 mixed (AC24: deterministic halves unit-blocking + perf-smoke advisory). AC2/AC26 parity halves blocked-by OQ-RVP1.

## Open Questions

| ID | Question | Owner | Target resolution |
|---|---|---|---|
| OQ-RVP1 | Shared B-series implementation package ("one formula module, two hosts") must be extracted and server-tested before any PvP work — build prerequisite from the Dependencies section. Confirm the extraction plan and regression harness. | technical-director | Architecture phase, before the first PvP epic |
| OQ-RVP2 | `pvp_resolve_beat_ms` 1000 is provisional (safe band 800–1500) — playtest the resolve pacing before locking; verify the reveal theatre reads identically for human opponents. | game-designer | First PvP playtest |
| OQ-RVP3 | Server-side scoring of speech-io ult-round quality: scoring approach, audio upload size/latency inside W, and whether the spell-path fallback (Edge Cases) is the shipping form. speech-io owns semantics; this system owns where it runs. | speech-io owner + network-programmer | Before PvP ult-round implementation |
| OQ-RVP4 | Hosting regions and RTT targets — every latency number in this GDD (p50 ≤ 80 ms / p95 ≤ 250 ms / tail 500 ms; the 250 ms credit cap's fairness) is an assumption until devops names regions (NOT SOURCEABLE flag in Formulas). | devops-engineer / technical-director | Transport/hosting ADR |
| OQ-RVP5 | Transport ADR: WebSocket stack choice, socket-level fallback, TLS, envelope versioning — N3 states requirements, not a stack. | technical-director | Same ADR as OQ-RVP4 |
| OQ-RVP6 | Friend duels (client-chosen opponents): needs presence/lobby infrastructure outside this GDD's queue design; not launched with PvP. | game-designer + technical-director | Post-PvP-launch evaluation |
| OQ-RVP7 | Analytics watch items with a revisit trigger: (a) latency-camping — per-match RTT distributions vs non-PvP baseline; if abuse shows, adopt the baseline-comparison credit cap (cap at baseline/2 when match RTT > 2× baseline). (b) gear-power mismatch — rounds-per-match at low RP; if blowouts dominate, consider a loadout-score matchmaking key (a ranked-league ownership change, decided there, not here). | analytics-engineer | First data review after PvP Alpha |
| OQ-RVP8 | Cross-region pairing for Grandmaster (small population): if ever shipped, gate on measured RTT ≤ 500 ms or R3's compensation degrades for both players. Region topology unknown (NOT SOURCEABLE). | technical-director | With OQ-RVP4/5 |
