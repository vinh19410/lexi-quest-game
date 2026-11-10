# ADR-0003: Client↔Server Commit Protocol and Trust-Model Escalation

## Status
Proposed

## Date
2026-11-09

## Last Verified
2026-11-09

## Decision Makers
Technical-director role via autonomous run (`project.yaml` `modes.automation: autonomous`); lean review — TD-ADR skipped (review_mode: lean). Requirements sourced from Approved GDDs: accounts-backend (Core Rules 5–6, F3, Edge Cases 2–4), ranked-league (Core Rules 10–11, RKL5–RKL7, OQ-RL4), meta-progression (MP2 seed anchor), forge-srs, equipment (Core Rule 7), real-pvp (not-preclude).

## Summary
The GDDs pin the commit *behaviours* (five commit points, atomic apply-or-reject, idempotent retries, F3 backoff ladder, Unsaved-state) and ranked-league pins the *requirement* that ranked RP becomes server-computed — but explicitly owe the *mechanism* to this ADR (Core Rule 10: "recompute vs. replay-verify, session telemetry, grace-window detection"). Decided here: one commit envelope (`POST /api/commits`, idempotency anchored on the battle seed for battle commits and client commit-ID for the rest), battle-start telemetry for every battle from MVP (registration keyed by seed — the battle identity), **replay-verify** as the Stage-1 ranked verification (server re-runs the shared deterministic module over seed + submitted answer log — no parallel recompute implementation), a 15-minute forfeit window with RKL7's strict boundary semantics (client events do NOT extend it — closing the ranked GDD's internal conflict in RKL7's favor), and the three-stage trust escalation (client-trusted MVP → ranked replay-verified at Alpha → server-authoritative PvP).

## Engine Compatibility

| Field | Value |
|-------|-------|
| **Engine** | Web — React ^19.0.0 + TypeScript ^5.7.0 client; Node LTS + Fastify backend (ADR-0002) |
| **Domain** | Networking (backend) / Core |
| **Layer** | Foundation — the protocol every commit-point system (battle, forge, equipment, tower, meta) speaks; ranked-league's Stage-1 gate |
| **Knowledge Risk** | LOW — plain HTTP + JSON envelope, no post-cutoff API. Replay-verify depends on the deterministic core (ADR-0001's vectors prove it cross-host). Backend version risk is ADR-0002's, already flagged |
| **References Consulted** | `docs/engine-reference/web/VERSION.md`; `design/gdd/ranked-league.md` Core Rules 10–11, grace constant, RKL6/RKL7, OQ-RL4; `design/gdd/accounts-backend.md` Core Rules 5–6, F3, Edge Cases 2–4; `design/gdd/meta-progression.md` MP2; `design/gdd/forge-srs.md`, `design/gdd/equipment.md` commit rules |
| **Post-Cutoff APIs Used** | None |
| **Verification Required** | (1) RKL6 integration test: failed verification refuses RP delta, rejection recorded, valid result still applies; (2) RKL7 boundary test: nothing at T+14:59, exactly one forfeit at T+15, late result rejected whole, second expiry writes nothing; (3) commit-ID replay test (AC-E2); (4) replay-verify cross-host test: same seed + answer log yields identical outcome client-side and server-side (the "two hosts" proof) |

## ADR Dependencies

| Field | Value |
|-------|-------|
| **Depends On** | ADR-0001 (replay-verify needs seed-only deterministic replay + the pure-TS module), ADR-0002 (commits table, idempotency constraints, opaque-session transport). Both currently Proposed — this ADR cannot be Accepted before them |
| **Enables** | RKL6/RKL7 exit their provisional-blocked state once this ADR is Accepted and Stage 1 ships; ADR-⑦ (transport) inherits only the wire shapes fixed here |
| **Blocks** | Ranked-league implementation stories (Alpha); the trust-escalation slice of accounts-backend. No stories exist yet (no epics) |
| **Ordering Note** | Stage 0 (envelope + telemetry, no verification) ships with MVP accounts-backend; Stage 1 (ranked verification + forfeit) is Alpha scope, landed before ranked ships (GDD: "owed before Alpha ships"). Stage 2 is recorded, not designed — real-pvp is deferred Full Vision |

## Context

### Problem Statement
Three GDDs converge on this decision. accounts-backend Core Rule 6 permits client-trusted outcomes only while no consumer has stakes, and names the evolution "planned, recorded — not an afterthought". ranked-league Core Rule 10 is the escalation trigger: ranked RP commits are server-computed, "the mechanism (recompute vs. replay-verify, session telemetry, grace-window detection) is the technical-director's ADR, owed before Alpha ships". Core Rule 11 + OQ-RL4 owe the forfeit machinery: battle-start telemetry, exact threshold, client/network-edge behavior (late commits, reconnects). RKL6/RKL7 are written but *provisional — blocked on this ADR*. Until the mechanism exists, ranked cannot ship and the GDD's anti-abuse ruling (quit-to-dodge −14) is unenforceable.

### Constraints
- Storage semantics are already fixed (ADR-0002): atomic whole-commit, commit-ID idempotent replay, conditional consumable guards, stale-state rejection. This ADR formalizes the wire and the trust model on top — it must not re-decide storage.
- The battle seed is the idempotency anchor for BattleResult commits (meta-progression MP2: "applied_seeds ∪ {seed} in one atomic commit"; seed unique per battle attempt).
- Battle replay is seed-only (ADR-0001/BS-026): seed + recorded answers reproduce the full log. The server can therefore re-derive any battle it holds the seed and answer log for.
- RKL7's boundary semantics are the assertable contract: forfeit at exactly T+15 min, one forfeit, late results rejected whole, idempotent expiry, non-ranked never enters the machinery.
- ranked-league's grace constant table says "measured … to either a committed result or last client event" — in tension with RKL7's strict T+15. The AC, not the prose, is the contract (and event-extension is a dodge vector: a retried-forever client would never forfeit). This ADR resolves the conflict explicitly: **the window is measured from battle-start only; client events do not extend it**; `ranked_forfeit_grace_min` = 15 (blessed, inside the GDD's 10–30 safe band).
- Not-preclude (real-pvp, deferred): no MVP mechanism may close the door on server-authoritative play — battle's `resolve_round` substitution point (ADR-④'s module extraction), question draw callable server-side, ordered reliable low-latency transport (ADR-⑦).
- F3 is client-side and already pinned (delay_n = min(1 s × 2ⁿ + jitter(0–0.5 s), 30 s), N = 5, manual retry restarts at n = 0, AC-S4 re-login retry restarts at n = 0).

### Requirements
- Every GDD commit point (battle end, forge resolution, stone application, equip change, quest claim, tower stage result) maps to exactly one commit type with one idempotency rule.
- A redelivered commit never re-applies and always returns the original result (AC-E2); a consumable conflict rejects whole (AC-E3); a structure failure applies nothing (AC-C2).
- Ranked verification must be able to prove a submitted outcome wrong, not just fail to confirm it (RKL6: "failed server validation refuses the RP delta … rejection recorded against the account").
- Forfeit detection must be server-side, idempotent, and invisible to honest players (RKL7).
- The MVP build must not carry Stage-1 machinery that misfires on client-trusted commits (ranked doesn't exist at MVP; RKL6/RKL7 are "unreachable" there by design).

## Decision

### 1. Commit envelope (all stages)

```
POST /api/commits
  { commit_id: uuid,                       // client-generated (crypto random), all types
    type: battle_end | forge_resolution | stone_application
        | equip_change | quest_claim | tower_stage_result,
    seed?: string,                         // battle_end + tower_stage_result only — see below
    base_digest?: string,                  // optional client last-known state digest (stale guard)
    payload: { … } }                       // type-specific, JSON-Schema validated server-side
→ 200 { status: applied | replayed, state_digest }      // replayed = original result, no re-apply
→ 409 { status: rejected, reason: structure | stale_state | forfeited | replay_mismatch }
→ 401 { … }                                             // session expired — AC-S4 re-login path
```

**Idempotency anchor by type** (formalizing MP2 + AC-E2): `battle_end` and `tower_stage_result` are anchored on **seed** (unique constraint — the battle's identity; a redelivered result replays the original answer). All other types anchor on **commit_id**. Every commit carries both anyway; the anchor is which uniqueness constraint fires first. `state_digest` is a per-account monotonic counter returned with every applied/replayed response; a client may send `base_digest` and receive `stale_state` on mismatch — the multi-device forge edge (AC-E3) needs the conditional guards, the digest is the cheap belt-and-braces.

### 2. Battle-start telemetry (all battles, from MVP)

```
POST /api/battles/start
  { seed, encounter: friendly | tower_stage | tower_boss | ranked,
    module, opponent_config_ref, content_version, loadout_digest }
→ 200 { registered: true | already }   // idempotent: same seed re-answers existing record
```

`battle_registrations(seed PK, account_id FK, encounter, module, content_version, started_at — server clock, status: open → resolved | forfeited)`. The seed is the battle identity end-to-end: registration key, commit anchor, replay input. **MVP (Stage 0): registration is written for every battle but a battle-end commit is NOT rejected for a missing registration** (telemetry only — a bug in the new path must never block the critical commit path; logged, recorded interim). **Stage 1: ranked result commits without an open registration are rejected (structure)** — RKL7's "server observed battle-start" precondition becomes enforceable. No mid-battle heartbeats at any stage: the grace window needs one signal (start) and one signal (result).

### 3. Trust-model escalation chain

**Stage 0 — MVP, all encounters: client-trusted outcomes, structure-validated commits.** As accounts-backend Core Rule 6 / AC-X1: field shapes, referential checks (rune exists, stone count, level < cap), conditional consumable guards, idempotency. Outcomes stored as-reported. Battle-start telemetry accumulates silently. Recorded limitation, not a silent assumption.

**Stage 1 — Alpha, ranked encounters: server-computed RP via replay-verify.** A ranked `battle_end` commit carries `answer_log`: per-round `{ question_id, submitted, elapsed_ms }` (already client-side — replay and speed-records need it). The server re-runs the battle through the **shared deterministic module** (ADR-0001 streams + battle rules, imported verbatim per "one formula module, two hosts"): ghost rolls drawn from `(seed, "ghost")`, submitted answers compared, HP advanced, outcome derived. Derived vs reported must agree on victory flag, completion, and record aggregates; on agreement the RP delta (±28/−14, RL2 floored at 0) is applied server-side. **On mismatch: the whole commit is rejected (`replay_mismatch`), no RP applied, the rejection recorded against the account** (RKL6's assertable shape). **Why replay-verify over a separate recompute:** any recompute that does not reuse the battle engine is a second implementation of battle rules — a drift risk with two truths; a recompute that does reuse the engine *is* replay. The module is pure TS, dependency-free, and its vectors already prove cross-host identity — replay is the cheap, single-truth choice. Non-ranked commits **stay Stage 0 at Alpha** (resolves AB OQ#3's open half: escalation is per-consumer by stakes; friend/tower have none). Full replay per ranked commit is affordable at Alpha volume; sampling/spot-audit is the recorded post-Alpha lever if volume ever demands it.

**Stage 2 — Full Vision, real-pvp: server-authoritative.** The server hosts the engine live; clients render and transmit inputs. Trust verification dissolves into authority. Recorded, not designed — the not-preclude constraints are: module extraction (ADR-④), server-callable question draw (already required by Core Rule 7's architecture), ordered reliable low-latency transport (ADR-⑦).

### 4. Forfeit mechanism (Stage 1, ranked only — resolves OQ-RL4)

- `ranked_forfeit_grace_min` = **15** (blessed; safe band 10–30). Measured from `started_at` (server clock) to the battle's result resolution. **Client events do not extend the window** — the ranked constant-table's "last client event" reading is superseded by RKL7's boundary semantics (the assertable contract; event-extension is a dodge vector). A result commit in F3 retry that lands inside 15 min applies normally.
- A scheduled server scan (per-minute) plus lazy checks on any commit/read touching the battle marks an `open` ranked registration `forfeited` at T+15: **exactly one forfeit** — RP −14 floored at 0 (E13), no rewards, no runes, battle flagged `forfeit` for the result modal (RKL25). Second expiry writes nothing (idempotent).
- **Late result after forfeit: rejected whole (`forfeited`) — first resolution wins.** Replaying a lost cause into a win is impossible (E6); the forfeit stands, the result's RP event is never applied.
- Reconnects: session-expired-mid-battle (AB EC4) re-login + retry inside the window applies normally; outside it, forfeit stands. Ranked UI copy for the abandon consequence is ui-shell's (contract: the client MAY warn beforeunload during ranked battles; AB's unsaved-commit warning is unchanged).
- Friend/tower abandons never enter the forfeit machinery (RKL7 spy clause): battle-system's silent discard stands.

### 5. Client commit state machine (all stages)

`idle → committing → applied|replayed → idle`; on failure, F3 auto-retries (n < 5) then **Unsaved-state**: commit retained in memory, persistent "Lưu không thành công — Thử lại" banner, commit-requiring actions blocked (same blocked set as offline), `beforeunload` warning (AC-E1). Manual retry and post-re-login retry restart the ladder at n = 0 (AC-S4). Retry jitter draws from the platform RNG — client networking, not game math, and therefore outside ADR-0001's seeded streams by that ADR's own scope note. Presentation of every state is ui-shell's; the contract here is the state set, transitions, and the never-half-applied guarantee.

### Architecture Diagram

```
MVP (Stage 0)                          Alpha (Stage 1, ranked)               Full Vision (Stage 2)
┌──────────────────────────┐           ┌──────────────────────────────┐      ┌─────────────────────┐
│ battle_start (telemetry) │           │ battle_start (enforced)      │      │ server hosts engine │
│ commit → structure +     │  escalate │ commit + answer_log →        │      │ client = input +    │
│ referential + guards +   │ ────────► │ replay via shared module ────┼──►   │ render transport    │
│ idempotency; outcomes    │  stakes   │ match → RP applied server-   │      │ every outcome       │
│ stored as-reported       │           │ side; mismatch → reject +    │      │ server-computed     │
│ (AB Core Rule 6)         │           │ record (RKL6); forfeit @T+15 │      │ (real-pvp)          │
└──────────────────────────┘           └──────────────────────────────┘      └─────────────────────┘
        seed = battle identity: registration key · commit anchor · replay input
```

### Key Interfaces

```ts
type CommitType = 'battle_end' | 'forge_resolution' | 'stone_application'
                | 'equip_change' | 'quest_claim' | 'tower_stage_result';

interface CommitEnvelope {
  commit_id: string;            // crypto-random UUID (all types)
  type: CommitType;
  seed?: string;                // battle_end, tower_stage_result — idempotency anchor (MP2)
  base_digest?: string;         // optional stale guard
  payload: object;              // JSON-Schema validated per type
  // Stage 1, battle_end + encounter=ranked only:
  answer_log?: Array<{ question_id: string; submitted: string; elapsed_ms: number }>;
}

type CommitResponse =
  | { status: 'applied';  state_digest: string }
  | { status: 'replayed'; state_digest: string }                 // original result, no re-apply
  | { status: 'rejected'; reason: 'structure' | 'stale_state' | 'forfeited' | 'replay_mismatch' };
```

### Implementation Guidelines
- **Must** validate structure, references, and guards before any write; **must never** partially apply a commit (AC-C2).
- **Must** answer a seen anchor (seed or commit_id) with the original result and no re-apply (AC-E2).
- **Must** record battle-start for every battle from MVP; **must never** let a telemetry failure block the MVP commit path; **must** enforce registration on ranked commits once Stage 1 ships.
- **Must** run Stage-1 replay through the shared module imported verbatim from the client codebase; **must never** fork a parallel outcome computation.
- **Must** apply the forfeit exactly once at T+15 with RP floored at 0; **must never** let a late result overwrite a forfeit, a client event extend the window, or the machinery touch non-ranked battles.
- **Must** restart the F3 ladder at n = 0 on manual retry and post-re-login retry; **must never** persist unsaved commits to browser storage (they live in memory — AC-C6).
- **Must** keep the answer_log requirement scoped to ranked commits; **must never** require it of friend/tower commits.

## Alternatives Considered

### Alternative 1: Server-side recompute (outcome math reimplemented server-side)
- **Description**: Server recomputes victory from the answer log with its own outcome code, no full battle replay.
- **Pros**: Slightly less CPU (no ghost-roll draws); smaller answer log (only aggregates needed).
- **Cons**: A second implementation of battle rules (HP math, round timing, record aggregation) — the exact drift the B-series extraction (ADR-④) exists to prevent; verifying aggregates catches less than replaying rounds.
- **Rejection Reason**: Recompute-without-reuse is a two-truths drift risk; recompute-with-reuse is replay with less coverage. Replay-verify dominates.

### Alternative 2: Signed client attestations (HMAC over the result, secret in the client)
- **Description**: Client signs results with an embedded key; server verifies authenticity.
- **Pros**: No server replay cost; trivial to ship.
- **Cons**: Any secret shipped in a browser bundle is extractable — it authenticates the client build, not the outcome's truth. Defeats RKL6's "prove it wrong" requirement while adding crypto ceremony.
- **Rejection Reason**: Security theater against the one adversary (a modified client) it exists for.

### Alternative 3: Event-extension grace window (the constant table's "last client event" reading)
- **Description**: Each client event (commit retry, ping) pushes the forfeit deadline out.
- **Pros**: Forgiving to flaky-network players mid-retry.
- **Cons**: A scripted retry loop never forfeits — the quit-to-dodge abuse Core Rule 11 exists to close returns as a hang; contradicts RKL7's explicit T+14:59/T+15 boundary, which is the assertable contract.
- **Rejection Reason**: RKL7 wins (AC over prose); a 15-min flat window already covers the F3 ladder's ~30 s worst case many times over.

## Consequences

### Positive
- RKL6/RKL7 unblock into implementable, testable criteria with the exact semantics their provisional notes reserved.
- One envelope, two anchors, four rejection reasons — the whole commit surface is enumerable and testable; every GDD commit AC (AC-C1…C6, AC-E2/E3, AC-X1/X2) maps onto it.
- Battle-start telemetry from MVP means Stage 1 activates on data that already exists — no historical gap, no backfill.
- The escalation is per-consumer: ranked gets verification at Alpha without taxing friend/tower play; PvP inherits authority without redesigning the wire.
- Forfeit closes ranked's only abuse path with server-side, idempotent, GDD-exact machinery.

### Negative
- Ranked commits carry the answer log (~10–20 rounds of small objects) — trivial bandwidth, accepted.
- Replay-verify burns server CPU per ranked commit (full battle sim) — negligible at Alpha volume; sampling is the recorded lever if that changes.
- A strict window means a player genuinely disconnected at minute 14:30 forfeits — the GDD's own ruling (forfeit = the cost of leaving a stakes match); mitigated by re-login retry inside the window and plain-wording disclosure (RKL25).
- Two idempotency anchors (seed, commit_id) instead of one — justified per-type by MP2; both carry the same replay contract.

## Risks
- **Replay divergence** (client and server derive different outcomes from the same seed + log) → the cross-host vector test is the gate (Verification Required #4); a divergence is an ADR-0001 vector failure class, build-blocking.
- **Forfeit scan miss** (scheduler down) → lazy check on commit/read covers expiry before any RP-affecting read; worst case forfeits late, never never.
- **Stage-0/Stage-1 boundary bugs** (verification accidentally enabled for friend/tower) → the encounter field gates every Stage-1 path; RKL7's spy clause is the regression test.
- **Commit-ID collisions** → crypto-random UUIDs; the constraint fires on a 128-bit collision, not a realistic event.

## GDD Requirements Addressed

| GDD System | Requirement | How This ADR Addresses It |
|------------|-------------|--------------------------|
| ranked-league.md | Core Rule 10: ranked RP commits server-computed; mechanism (recompute vs replay-verify, session telemetry, grace detection) owed to this ADR; resolves adoption half of AB OQ#3 | Replay-verify pinned (§3 Stage 1) with the no-parallel-implementation rule; battle-start telemetry (§2); non-ranked stays Stage 0 |
| ranked-league.md | Core Rule 11 + OQ-RL4: forfeit mechanism contract — battle-start telemetry, exact threshold, client/network-edge behavior (late commits, reconnects) | §4: 15-min window from battle-start only, exactly-once forfeit, late-result rejection, reconnect flows, non-ranked exemption |
| ranked-league.md | RKL5/RKL6: valid result applies; failed verification refuses RP delta, rejection recorded | §3 Stage 1 response semantics; RKL6 exits provisional on acceptance |
| ranked-league.md | RKL7: T+15 boundary, one forfeit, RP −14 floored (E13), late result rejected (E6), idempotent expiry, non-ranked spy clause | §4 implements each clause; `ranked_forfeit_grace_min` = 15 blessed |
| accounts-backend.md | Core Rule 5: five commit points, atomic, commit-ID dedupe; Core Rule 6: structure-validated MVP trust model, planned escalation | §1 envelope enumerates the points (tower_stage_result splits out per tower's own commit); Stage 0 = Core Rule 6 as written |
| accounts-backend.md | F3 retry ladder; Edge Cases 2 (idempotent replay), 3 (stale-state, never last-writer-wins), 4 (session expiry mid-battle) | §5 client machine; §1 response contract (replayed / stale_state); 401 → re-login → retry at n=0 (AC-S4) |
| meta-progression.md | MP2: battle seed is the single idempotency anchor for BattleResult commits; re-delivery never double-counts | §1: seed anchor for battle_end + tower_stage_result; applied_seeds semantics preserved |
| forge-srs.md / equipment.md | Forge commit exactly-once; concurrent-device whole-commit rejection; stone application server re-validation; failed commit never half-applies | §1 guards + stale_state; §5 machine (equipment's Committing→Retrying→Idle maps onto it) |
| real-pvp.md | Not-preclude (deferred Full Vision): module extraction, server-callable question draw, server authority | §3 Stage 2 records the destination and inherits the constraints; no MVP mechanism closes them |

## Performance Implications
- **CPU**: Stage 0 negligible; Stage 1 one battle replay per ranked commit (sub-millisecond scale sim); forfeit scan one query per minute.
- **Memory**: none beyond ADR-0002's storage (registrations and commits are rows, not RAM).
- **Load Time**: battle-start registration is one insert at battle start, off the critical render path (fire-before-first-round).
- **Network**: one extra request per battle (registration); ranked commits +1–2 KB (answer log).

## Migration Plan
Greenfield sequencing, not migration: Stage 0 lands with the accounts-backend scaffold (envelope, telemetry, storage semantics already in ADR-0002). Stage 1 activates with ranked-league's Alpha stories: answer_log schema on ranked commits, registration enforcement, replay-verify, forfeit scan — flagged `encounter = ranked` so nothing else changes. Stage 2 is recorded intent only. ranked OQ-RL4 and accounts OQ#3's remaining half get resolved-marks at their GDDs' next edits, pointing here.

## Validation Criteria
1. RKL6 integration: valid ranked result applies RP; tampered result (one edited answer) → whole-commit rejection, RP and history exactly pre-commit, rejection recorded.
2. RKL7 boundary: injected server clock — nothing at T+14:59, exactly one forfeit at T+15 (RP −14 floored at 0, no rewards/runes, flagged); late result rejected whole; second expiry writes nothing; friend/tower abandon never enters the machinery.
3. AC-E2: every commit type redelivered → `replayed` with the original result, applied exactly once.
4. AC-E3: stale consumable reference → `stale_state`, whole rejection, client re-fetch.
5. Cross-host replay identity: same seed + answer log through the client module and the server import → identical derived outcome (the two-hosts proof).
6. AC-S4: 401 mid-battle → re-login → pending commit applies with ladder restarted at n=0.
7. Telemetry safety: battle-start endpoint down at MVP → battle-end commit still applies (logged gap), no player-visible failure.

## Related
- Resolves OQ-RL4 (ranked-league) and the remaining half of AB OQ#3; unblocks RKL6/RKL7 from their provisional state upon acceptance.
- Depends on ADR-0001 (replayable seed-only battles) and ADR-0002 (commit storage semantics); ADR-0004 owns the module extraction that makes the Stage-1 import physical; ADR-⑦ owns the Stage-2 transport.
- Design records: `design/gdd/ranked-league.md` Core Rules 10–11 (primary), `design/gdd/accounts-backend.md` Core Rules 5–6, `design/gdd/meta-progression.md` MP2.
