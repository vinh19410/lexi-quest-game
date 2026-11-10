# ADR-0006: Analytics Sink and Flush Transport

## Status
Proposed

## Date
2026-11-10

## Last Verified
2026-11-10

## Decision Makers
Technical-director role via `/architecture-decision` (autonomous mode, `project.yaml` `modes.automation: autonomous`); user confirmed the sink route (same-Postgres custom tables), the storage shape (single JSONB event table) and the TTL mechanism (native partitions + DROP) via decision prompts. Lean review — TD-ADR skipped (`review_mode: lean`); `lead-programmer` specialist (web engine primary) validated the draft before write — verdict DONE_WITH_CONCERNS, three GDD-alignment blockers folded into this text (commit-piggyback transport restored; consent audit anonymized instead of cascade-deleted; `TrackSink` port replacing a direct net-layer import) plus nine minor concerns folded into Decision/Risks.

## Summary
The analytics GDD pins telemetry *behaviour* (event vocabulary, buffer machine, consent, retention) but routes the sink's *implementation* here (OQ-AN1). This ADR decides it: custom event tables in the **same managed PostgreSQL** as ADR-0002 — one range-partitioned `analytics_events` table, a dual transport (events ride existing commit envelopes, extracted server-side inside the commit transaction; standalone events use a session-authenticated `POST /api/analytics/flush`), dedup via an unpartitioned claim table (a partitioned table's unique constraint cannot carry a global `event_id`), and a 90-day TTL executed as partition drops with rollups written before the drop.

## Engine Compatibility

| Field | Value |
|-------|-------|
| **Engine** | Web — React ^19.0.0 + TypeScript ^5.7.0 client; server stack per ADR-0002 (Node LTS + Fastify + PostgreSQL, versions pinned at scaffold) |
| **Domain** | Networking (backend telemetry transport) / Core (client emission port) |
| **Layer** | Polish (layer map, `architecture.md`) — with the GDD's own carve-out that the MVP event set is emitted from MVP (TR-analytics-021), so the transport and schema land before the Polish tier's dashboards |
| **Knowledge Risk** | MEDIUM — client pins are VERSION.md-verified; the backend surface (Postgres partitioning, Fastify JSON Schema, node-postgres) is **NOT SOURCEABLE from repo pins** (`docs/engine-reference/web/` covers the SPA toolchain only, same gap ADR-0002 records) and gets pinned at scaffold. The mechanisms used here are stable, pre-cutoff platform surface: declarative range partitioning, FK from a partitioned table (PG 11+), `INSERT … ON CONFLICT DO NOTHING RETURNING`, savepoints |
| **References Consulted** | `docs/engine-reference/web/VERSION.md`; `breaking-changes.md`; `deprecated-apis.md` (no analytics/backend rows exist — the gap is stated, not filled); `design/gdd/analytics.md` (primary); `design/gdd/accounts-backend.md` (Hard-sink row); ADR-0002 (storage/session stances); `docs/registry/architecture.yaml` (forbidden patterns) |
| **Post-Cutoff APIs Used** | **UUIDv7 generation** — the browser's `crypto.randomUUID` is v4-only (WHATWG), Node/Postgres have no native uuidv7 across plausible scaffold versions; a small RFC 9562 implementation (or pinned library) with a same-millisecond monotonic counter is chosen at scaffold (**NOT SOURCEABLE — no repo pin covers it**). Fastify route-level JSON Schema is pre-cutoff stable surface already relied on by ADR-0002 |
| **Verification Required** | (1) dedup race: two concurrent flushes carrying the same `event_id` → exactly one stored; (2) commit replay extracts nothing twice; (3) consent flag flipped mid-flush → post-flip events rejected; (4) account deletion → events cascade, consent audit reduces to the anonymized marker within the 30-day SLA; (5) unknown `schema_v` lands in `rejected_version`, sample stored shape-only; (6) oversized batch → 4xx, client drops without retry; (7) partition-maintenance drill: future partitions created, overdue `DEFAULT` partition drained, >90d partitions dropped; (8) a schema-invalid piggyback event is quarantined while its commit still applies |

## ADR Dependencies

| Field | Value |
|-------|-------|
| **Depends On** | ADR-0002 (Accepted) — storage engine, additive-only migration policy, session-cookie auth the flush rides, FK-cascade rule, commit transaction it must never disturb; ADR-0004 (Accepted) — module boundaries (`TrackSink` port layering, shared config file, no net imports in `src/game/**`) |
| **Enables** | Analytics implementation stories (none exist yet — no epics); closes the TR-analytics-043 traceability gap on acceptance |
| **Blocks** | Analytics implementation stories (the MVP event set is non-deferrable per TR-analytics-021, so the transport + schema land with the first emitting system's stories) |
| **Ordering Note** | ADR-0003 is deliberately **not** a dependency: analytics rides *inside* existing commit envelopes and session requests and touches no protocol semantics — commit envelope ownership, idempotency and rejection vocabularies stay ADR-0003's. The `battle_telemetry` contract (ADR-0003's `/api/battles/start`) is untouched; the flush endpoint is a separate transport |

## Context

### Problem Statement
`architecture.md`'s required-ADR list names this decision (#6): analytics OQ-AN1 — "custom event tables in accounts-backend's store vs a third-party product pipeline" — must be resolved before analytics implementation, with the storage choice riding ADR-0002. The GDD fixes behaviour (schema, consent, retention, dedup, loss policy) but not the route. TR-analytics-043 is the traceability anchor still marked ❌ pending this ADR. Without it no analytics story can be written, and the MVP event set — the one part of the system that cannot be retrofitted — has no declared transport.

### Constraints
- GDD-locked behaviours this ADR must implement, not change: fire-and-forget emission (never blocks, never mutates game state, never creates a commit point — TR-analytics-019); loss acceptable, dropped oldest-first, never re-emitting a commit (TR-analytics-020); client buffer **in memory only** (browser-storage telemetry is the registered forbidden pattern `game_state_in_browser_storage`; GDD E3 agrees); events ride existing commits where one exists (Core Rule 2 — the loss profile of `battle_result` and the forge funnel is commit-grade, not buffer-grade); `event_id` UUIDv7 generated at `track()` time, sink dedups on it; consent toggle default-on and **server-enforced**, one consent audit record always written (TR-analytics-023); server lifecycle accepted/rejected/quarantined with unknown `schema_v` in its own `rejected_version` bucket and a stripped first-100-per-schema-per-day diagnostic sample (TR-analytics-029); raw events 90-day TTL then rollup + purge (TR-analytics-010); account deletion cascades telemetry within 30 days **except** the consent audit, which reduces to an anonymous "account deleted, consent revoked" marker (GDD Edge Case, :721–723); payloads carry only server-side account ID + game facts (TR-analytics-022); event list, schemas, batch params, sampling rates live in an external config file (TR-analytics-025).
- ADR-0002 stances: additive-only migrations; every per-account table FK-cascades to `accounts`; the commit transaction's invariants (atomic apply, `state_digest` increment, collision dispatch) are not to be perturbed.
- ADR-0004 stances: `src/game/**` never imports net/UI/browser surfaces; shared constants/config have one owning file.
- The commit protocol (ADR-0003) and `battle_telemetry` contract must remain byte-compatible — analytics adds payload bytes, not protocol.

### Requirements
- Implement the storage + transport halves of TR-analytics-010/018–035; the schema/query halves stay the analytics GDD's.
- Preserve the GDD's loss profile exactly: hypothesis-critical events (`battle_result`, `forge_funnel` chain) travel with commit-grade delivery guarantees and never depend on the lossy in-memory buffer.
- Server clock is the only authority for storage time, TTL, sessionization and `game_day_id`; `client_ts_offset` is carried for diagnostics, never authoritative.
- The sink must be operable by a small team: one managed Postgres instance, one maintenance job, no second datastore.

## Decision

**Sink route: custom event tables in the same managed PostgreSQL instance as ADR-0002 (resolves OQ-AN1 → custom).** The GDD already pins accounts-backend as the Hard sink (TR-analytics-030); this keeps deletion structural (FK cascade), auth singular (the session cookie the flush and commits already ride), and operations to one datastore. A separate warehouse is a Beta-era *read* optimization federated from this store, not a different sink — named as a revisit trigger below.

**Transport: dual, routed per event by the shared analytics config file.** Each event declares its route alongside its schema and sampling class (Core Rule 8's data-driven rule — the server derives extraction behaviour from the same file the client routes by):
- **commit-piggyback** — every event whose firing point coincides with a commit (`battle_result`, `forge_funnel`, `stage_attempt`, `floor_cleared`, `quest_event`, `economy_event`; `rp_delta`, `season_rollover` when Alpha lands). The client attaches the event inside the commit envelope's payload; the server extracts it into `analytics_events` **inside the commit transaction**, savepoint-guarded: any analytics failure (schema violation, claim conflict, unknown version) rolls back only the savepoint and counts a rejection — **the commit itself always applies** (fire-and-forget, TR-analytics-019). Commit replay answers the recorded result without re-running the transaction, so extraction cannot double-insert; the claim row lives in the same transaction.
- **session-ride** — events emitted server-side at auth time (`session_start`, `auth_event`); the same claim+insert path inside the auth transaction, identically savepoint-guarded.
- **buffered flush** — events with no commit or auth home in v1 (`session_end`, `rune_queue_state` at session close): the client buffer state machine (GDD E-states, F-AN4) batches them to the flush endpoint. This is the only lossy path, and by construction it carries no hypothesis-critical event.

**Flush endpoint: `POST /api/analytics/flush`, session-cookie auth.** Envelope `{batch_id, events: [{event_id, event_name, schema_v, client_ts_offset, payload}]}`, bounded at the config's `B_max` (50 at MVP). The response is **per-event statuses** `[{event_id, status: accepted|rejected, reason?}]` — whole-batch atomicity is deliberately not provided (Core Rule 3: loss is acceptable). Route-level JSON Schema validates the **envelope shape only**; per-event validation dispatches app-side to precompiled per-version validators selected by each event's own `schema_v` (a route-level `oneOf` over versions is both slow and unable to express the `rejected_version` path — an unknown version must be a per-event rejection, never a route 400). HTTP semantics: a well-formed envelope always answers 200 with per-event statuses; a structurally invalid one (oversized, malformed) answers 4xx and the client **drops the batch without retry** (counted — a permanently invalid batch must never spin the retry ladder and then evict valid events oldest-first); 5xx/network failure drives the buffer's `Backoff` state as the GDD defines.

**Storage: one partitioned event table + an unpartitioned claim table.**
- `analytics_events(event_id UUID, account_id FK→accounts ON DELETE CASCADE, event_name, schema_v int, payload JSONB, session_ref, received_at timestamptz, PRIMARY KEY (event_id, received_at))` — declaratively range-partitioned **monthly on `received_at`** (server clock). The composite PK is honest: a partitioned table's unique constraints must include the partition key, and `received_at` is server-assigned per delivery, so the events table alone cannot enforce global `event_id` uniqueness — real dedup lives in the claim table. A `DEFAULT` partition catches rows when the scheduled partition is missing, so a missed maintenance run degrades to a drain-later state instead of failing every flush.
- `analytics_event_ids(event_id UUID PRIMARY KEY, account_id FK→accounts ON DELETE CASCADE, claimed_at timestamptz)` — the dedup claim table, deliberately **unpartitioned** (partitioning would force `claimed_at` into the key and break `ON CONFLICT (event_id)`). Inside each flush/extract transaction: validate first, then `INSERT INTO analytics_event_ids … ON CONFLICT (event_id) DO NOTHING RETURNING event_id` — a returned row wins and the event is stored; no row means a duplicate → answer `accepted`, store nothing. Claims are inserted **only for events that pass validation**; a rejected event must not consume its `event_id` (a surviving claim would silently dedup-drop a corrected re-send after the server gains that schema version). The winning transaction blocks a concurrent same-`event_id` inserter on the index entry until commit — the race answer is exactly one store. Claim purge runs on the same 90-day schedule as partition drops (`DELETE` + vacuum monitoring on this one unpartitioned table is the **sanctioned exception** to "never DELETE-purge", which applies to the partitioned events table). GDD `TTL_dedup` (7 days) is the guaranteed *minimum* the economy_event query filters rely on; 90-day claim retention is this implementation's strictly larger guarantee.
- `accounts.telemetry_consent BOOLEAN NOT NULL DEFAULT true` — additive column (a no-rewrite default), the server-side consent flag TR-analytics-023 requires. It is read **inside** each flush/extract transaction, never from a pre-transaction read (a concurrent opt-out then rejects post-flip events). Consent-off events answer per-event `rejected / consent_off`.
- `consent_audit(account_id FK NULLABLE, at timestamptz, enabled boolean, anonymized boolean DEFAULT false)` — append-only, written on every toggle change **and** once at registration. **No `ON DELETE CASCADE` — the one telemetry table deletion must not cascade from**: on account deletion the 30-day-SLA routine sets `account_id = NULL, anonymized = true`, reducing the account's rows to the GDD's anonymous "account deleted, consent revoked" marker. Deleting the audit outright would destroy the provable consent history exactly when a deletion/compliance dispute may need it.
- `analytics_rejections(day, event_name, schema_v, reason, count)` — a **global aggregate** upsert counter keyed per day/schema/reason. It carries no `account_id` by construction and must never gain one: aggregate rejection rates are a metric (GDD E9), attributed rejection rows would be player data. It therefore needs no FK and no cascade.
- `analytics_quarantine_samples(id, account_id FK→accounts ON DELETE CASCADE, day, event_name, schema_v, reason, payload_shape JSONB, received_at)` — the first 100 per schema per day, capped at insert. Samples inherit retention and deletion, so they cascade. For **`rejected_version`** events the payload is unvalidated arbitrary JSONB — exactly where banned free text would hide — so samples store **shape only** (field names/types/structure, never values) regardless of schema; known-schema rejections are stripped per Core Rule 5 as the GDD states.

**TTL and rollups: monthly partitions, dropped, never DELETE-purged.** The maintenance job (single scheduled task): create future partitions ahead (alert on failure — the `DEFAULT` partition is the safety net, not the plan), write the rollup aggregates for a partition before dropping it, then `DROP` partitions older than `TTL_raw` = 90 days, and drain+purge the `DEFAULT` partition and expired claim rows. Rollup tables are written by the same job; the rollup/query layer itself is a Beta-era story — **accepted consequence**: until that story lands, dropped partitions take their history past 90 days with them (the GDD's own "whichever boundary comes first" wording); the Beta rollup story is the named revisit trigger. Sessionization (F-AN5's receive-time gap rule), `game_day_id` (F-AN7's ICT daily boundary) and the cohort bucket (F-AN6's `hash(account_id, week) % N`) are **query-time pure functions of server-received data** — none is materialized at MVP: `game_day_id` derives from `received_at` in Asia/Ho_Chi_Minh, the cohort bucket from `(account_id, week)`, and session identity is the ADR-0002 server session identifier stamped into `session_ref` at flush/extract time (the F-AN5 gap rule splits it at query time and remains authoritative over `session_end`). No sessions dimension table exists, so none needs a cascade.

**Client shape: a `TrackSink` port, injected — never imported.** The GDD's `track(event_name, payload)` helper is a port interface in a neutral shared module, injected into the game systems whose call sites the GDD names (forge transitions, battle end, stage results — all inside `src/game/**`, which must never import the net layer: the registered forbidden pattern `ui_or_network_imports_in_sim_core`). This is the project's established injection pattern (`RoundInputSource`, time-as-parameter, ADR-0004). The app-layer implementation binds the port at the composition root and owns the buffer machine, the per-event route decision, piggyback attachment to in-flight commits, and the flush call. One analytics config file is shared by both hosts (path pinned at scaffold per ADR-0004's layout); `B_max`/`B_batch`/`T_flush`/sampling/schemas/routes are read from it on both sides — the server bound must never be hardcoded, or a config bump would structurally reject every flush. `event_id` is UUIDv7 generated at `track()` time by the pinned RFC 9562 implementation with a same-millisecond monotonic counter (so v7 ordering holds for bursts); `client_ts_offset` is carried for diagnostics and never authoritative.

### Architecture Diagram

```
Client (React SPA)                              accounts-backend (Node + Fastify)
┌──────────────────────────────┐                ┌───────────────────────────────────────────┐
│ game systems (src/game/**)   │                │ commit endpoint ── extract piggyback      │
│   │ inject TrackSink port    │  commits       │   events (savepoint: analytics failure    │
│   ▼                          │ (+events in    │   never fails the commit)                 │
│ app-layer sink impl          │  envelope)     │ auth endpoints ── session-ride events     │
│  ├─ route: piggyback ────────┼───────────────►│ POST /api/analytics/flush                 │
│  ├─ route: session-ride      │                │   session auth · envelope 4xx? drop no-   │
│  └─ route: buffered flush ───┼───────────────►│   retry; per-event validators (schema_v)  │
│     (in-memory buffer only,  │  POST /api/    │   consent read INSIDE tx                  │
│      E-states, F-AN4)        │  analytics/    └───────────────┬───────────────────────────┘
└──────────────────────────────┘  flush        │ PostgreSQL (ADR-0002 instance)            │
                                               │ analytics_events (monthly partitions on   │
                                               │   received_at; DEFAULT partition)         │
                                               │ analytics_event_ids (unpartitioned claim) │
                                               │ consent_audit (NO cascade → anonymized)   │
                                               │ analytics_rejections (global aggregate)   │
                                               │ analytics_quarantine_samples (cascade)    │
                                               │ maintenance: create-ahead · rollup ·      │
                                               │   DROP >90d · drain DEFAULT · claim purge │
                                               └───────────────────────────────────────────┘
```

### Key Interfaces

```sql
-- Storage contract (server-internal; schema is the API, per ADR-0002's stance)
analytics_events(event_id UUID, account_id FK→accounts ON DELETE CASCADE,
                 event_name TEXT, schema_v INT, payload JSONB,
                 session_ref,                 -- ADR-0002 server session identifier
                 received_at TIMESTAMPTZ,     -- server clock; partition key (monthly)
                 PRIMARY KEY (event_id, received_at))
  + DEFAULT partition; monthly partitions created ahead by the maintenance job
analytics_event_ids(event_id UUID PRIMARY KEY, account_id FK→accounts ON DELETE CASCADE,
                    claimed_at TIMESTAMPTZ)    -- unpartitioned; DELETE-purged ≥90d
consent_audit(account_id FK→accounts NULLABLE, at TIMESTAMPTZ, enabled BOOLEAN,
              anonymized BOOLEAN DEFAULT false) -- NO cascade; deletion anonymizes
analytics_rejections(day DATE, event_name TEXT, schema_v INT, reason TEXT, count INT)
                                                -- global aggregate; no account_id, ever
analytics_quarantine_samples(id, account_id FK→accounts ON DELETE CASCADE, day DATE,
                 event_name TEXT, schema_v INT, reason TEXT, payload_shape JSONB,
                 received_at TIMESTAMPTZ)       -- first 100/schema/day; shape-only for rejected_version
accounts.telemetry_consent BOOLEAN NOT NULL DEFAULT true   -- additive column
```

```ts
// Client-facing
POST /api/analytics/flush       // session-cookie auth; {batch_id, events[]} ≤ B_max (from config)
//   → 200 [{event_id, status: "accepted"|"rejected", reason?}]   (per-event, never whole-batch)
//   → 4xx on structural rejection (client drops batch without retry, counted)

// Client port (neutral module; game systems receive it by injection — never import the net layer)
interface TrackSink {
  track(event_name: string, payload: object): void;  // sync, never throws, never awaits
}
// Event ids: UUIDv7 at track() time — RFC 9562 impl + same-ms monotonic counter,
// pinned at scaffold (NOT SOURCEABLE from repo pins)
```

### Implementation Guidelines
- **Must** extract piggyback events inside the commit transaction under a savepoint, and **must never** let an analytics failure abort, reject, or delay-fail a commit; a savepoint rollback counts one rejection and the commit proceeds.
- **Must never** touch `/api/commits` semantics, the `commits` table, `accounts.state_digest`, or create any new commit point from analytics; analytics adds payload bytes inside envelopes whose protocol stays ADR-0003's.
- **Must** read `telemetry_consent` inside each flush/extract transaction; **must never** act on a pre-transaction read.
- **Must** validate an event before claiming its `event_id`; **must never** let a rejected event's claim survive its transaction, and **must never** re-store on a duplicate id (answer `accepted`, store nothing).
- **Must** dispatch per-event validation through precompiled per-version validators selected by `schema_v`; **must never** fold event schemas into the route-level schema (an unknown version is a per-event `rejected_version`, never a route 400).
- **Must** answer structural envelope violations with 4xx and **must never** let the client retry them (5xx/network alone drive `Backoff`).
- **Must** keep the claim table unpartitioned; **must** schedule its DELETE-purge with vacuum/bloat monitoring, and **must never** DELETE-purge the partitioned `analytics_events` table (DROP partitions only).
- **Must** keep the `DEFAULT` partition drained by the maintenance job and alert on create-ahead failures; **must never** treat the DEFAULT partition as long-term storage.
- **Must** cap quarantine samples at the first 100 per schema per day, store **shape only** for `rejected_version` samples, and **must never** store unvalidated payload values.
- **Must** keep `analytics_rejections` aggregate-only (no `account_id`, no cascade); **must never** attribute rejections to accounts.
- **Must** anonymize `consent_audit` rows on account deletion (`account_id → NULL`, marker) within the 30-day SLA; **must never** cascade-delete them, and **must never** cascade any other telemetry table to anything but full delete.
- **Must** source `B_max`, `B_batch`, `T_flush`, routes, schemas and sampling from the shared analytics config on both hosts; **must never** hardcode them.
- **Must** generate `event_id` at `track()` time with the pinned UUIDv7 implementation; **must never** regenerate at flush time, and **must never** treat `client_ts_offset` as authoritative for storage, TTL, sessionization or `game_day_id`.
- **Must** keep `src/game/**` free of net imports — `TrackSink` is injected; **must never** bind the port inside game modules.

## Alternatives Considered

### Alternative 1: Separate analytics store (second Postgres instance or columnar warehouse)
- **Description**: The sink lives in its own database (another Postgres, or a ClickHouse-class warehouse), written by accounts-backend or by the client directly.
- **Pros**: Query load and retention policing never touch the primary; columnar engines make funnel/retention queries cheap at Beta scale.
- **Cons**: Contradicts TR-analytics-030's pinned split (accounts-backend is the Hard sink; analytics owns schema + query/read); a second deletion path and second auth boundary for data whose compliance SLAs (30-day deletion, consent enforcement) must hold; federation complexity before there is query load to federate.
- **Rejection Reason**: The GDD's own Hard-sink row decides the route; the warehouse's value arrives only at Beta-era query volumes. Named revisit trigger: the Beta rollup/query story may add a read replica or federated warehouse **derived from** this store — the sink itself does not move.

### Alternative 2: Third-party SaaS telemetry SDK (PostHog/Amplitude-class) as the sink
- **Description**: The client ships events to a vendor SDK; dashboards are the vendor's product.
- **Pros**: Dashboards and funnels for free; no schema storage to own.
- **Cons**: TR-analytics-023's server-enforced consent and the 30-day deletion SLA require deleting and suppressing data inside a vendor store the project does not control; TR-analytics-022's payload discipline (account ID + game facts only, no free text) cannot be audited behind a vendor's auto-capture; ADR-0002's owns-the-pipeline stance exists precisely to keep ranked/PvP-critical data paths in project code.
- **Rejection Reason**: Compliance-critical behaviour (consent, deletion, retention, payload content) cannot be delegated to a pipeline that might capture more than the GDD allows. Dashboards were always a Beta/Release concern (TR-analytics-021) — buying them now buys the wrong tier.

## Consequences

### Positive
- OQ-AN1 is resolved and TR-analytics-043's anchor exists; analytics stories become writable.
- The GDD's loss profile is preserved exactly: `battle_result` and the forge funnel ride commit-grade delivery; the lossy buffer carries only session-boundary events.
- Deletion is structural for every telemetry table except the one the GDD exempts; consent history survives deletion as the anonymous marker.
- One datastore, one auth boundary, additive-only migrations — the operational surface matches ADR-0002's single-instance stance.
- The dedup race is answered by one constraint (`ON CONFLICT DO NOTHING RETURNING`) with no read-modify-write anywhere.

### Negative
- The claim table adds one insert per event and one unpartitioned table to vacuum-monitor (the sanctioned DELETE-purge exception).
- Partition maintenance is a new scheduled ops surface; its failure mode (missed create-ahead) is degraded-but-alive thanks to the DEFAULT partition, but draining it is manual work.
- Rollups are a later story: raw history is bounded at 90 days until the Beta rollup story lands — the GDD's own "whichever boundary comes first".
- UUIDv7 needs a small pinned implementation (with a same-ms monotonic counter) because no pinned platform surface provides it.

## Risks
- **Partition-maintenance failure** (job dies; create-ahead missed) → inserts land in the `DEFAULT` partition instead of failing; alerting fires; the job drains it. Mitigation tested by the partition drill in Verification Required.
- **Claim-table bloat** (only unpartitioned table with deletes) → purge on the 90-day schedule with vacuum monitoring; volume is one row per accepted event, bounded by TTL.
- **UUIDv7 implementation drift** (hand-rolled generator bugs, collision or misordering) → pinned at scaffold against RFC 9562 with test vectors; NOT SOURCEABLE marker stands until then. A temporary v4 fallback would weaken time-ordering only — dedup correctness is unaffected.
- **Backend version drift post-cutoff** (partitioning/`ON CONFLICT` behaviour, driver int8/timestamptz mapping) → exact pins at scaffold like ADR-0002; all mechanisms used are pre-cutoff stable surface (PG 11+).
- **Consent flip racing a flush** → flag is read inside the transaction; the residual window narrows to in-flight statement evaluation, which the GDD's compliance framing tolerates (consent audit proves state changes; events post-flip are rejected).
- **Config drift between hosts** (client routes an event the server config no longer carries) → per-event rejection (`rejected`/`rejected_version` buckets absorb it), never a route failure; both hosts read one file.

## GDD Requirements Addressed

| GDD System | Requirement | How This ADR Addresses It |
|------------|-------------|--------------------------|
| analytics.md | OQ-AN1 sink route (Dependencies; architecture.md required-ADR #6) | Resolved: custom tables, same Postgres instance (Decision §1) |
| analytics.md | Core Rule 2 / TR-analytics-019: rides existing commits, fire-and-forget, UUIDv7 at `track()` time, dedup on `event_id` | Dual transport with commit-piggyback extraction savepoint-guarded inside the commit tx; claim-table dedup; replay cannot double-insert |
| analytics.md | Core Rule 3 / TR-analytics-020: loss acceptable, oldest-first, never re-emit a commit | Per-event statuses; buffer is the only lossy path and carries no hypothesis-critical event; 4xx drops without retry |
| analytics.md | Core Rule 5 / TR-analytics-022: no PII beyond account ID; stripped samples | Payload discipline enforced by per-version validators; `rejected_version` samples shape-only; samples FK-cascade |
| analytics.md | Core Rule 6 / TR-analytics-023: consent default-on, server-enforced, audit record always | `accounts.telemetry_consent` read inside the tx; `consent_audit` append-only, anonymized (not deleted) on account deletion |
| analytics.md | TR-analytics-010 / Edge Case :721–723: 90-day TTL → rollup + purge; deletion ≤30d; consent audit → anonymous marker | Monthly partitions dropped >90d; FK cascades everywhere except `consent_audit`, which the deletion routine anonymizes within the SLA |
| analytics.md | TR-analytics-025 / Core Rule 8: everything data-driven | One shared analytics config file: event list, schemas, routes, batch params, sampling — read by both hosts |
| analytics.md | TR-analytics-028 / F-AN4: buffer state machine, batch/cap/flush params | Buffered-flush route implements the E-states verbatim; params from the shared config |
| analytics.md | TR-analytics-029: accepted/rejected/quarantined; `rejected_version` bucket; diagnostic sample first 100/schema/day | Per-event lifecycle with separate rejection buckets; capped quarantine-samples table |
| analytics.md | TR-analytics-030: accounts-backend = Hard sink; analytics owns schema + query/read | Sink storage + transport decided here inside accounts-backend; schema/query remain the GDD's |
| analytics.md | F-AN5 / F-AN6 / F-AN7: gap sessionization, cohort sampling, `game_day_id` (ICT boundary) | All query-time pure functions of server-received data; session identity from the ADR-0002 session identifier; nothing materialized at MVP |
| analytics.md | TR-analytics-018: one `track()` helper; analytics owns name + versioned schema | `TrackSink` port injected into game systems; per-version validators dispatch on GDD-owned schemas |
| accounts-backend.md | Interactions :320: analytics = event sink, analytics owns instrumentation | Storage/transport owned by accounts-backend per this ADR; instrumentation/schema stay the analytics GDD's |

## Performance Implications
- **CPU**: one claim insert + one event insert per accepted event; a savepoint per event-carrying commit — negligible against the commit's own validation; batch inserts on flush.
- **Memory**: client buffer ≤ `B_max` (50) events in RAM, never persisted; server stateless (all telemetry state in Postgres).
- **Load Time**: zero — fire-and-forget; no telemetry work on the app-load critical path.
- **Network**: piggyback events add bytes to commits that exist anyway (zero extra calls); the flush path is ≤ one batch per `T_flush` (30 s) when session-boundary events occur.

## Migration Plan
Greenfield — no schema exists. The tables and the `telemetry_consent` column join the accounts-backend scaffold migration set (migration 0001 or the first additive migration after it, whichever the scaffold story ships first) under ADR-0002's additive-only policy. The maintenance job ships with the same story (create-ahead is needed the day the first partition exists). The `TrackSink` port, config file and client sink implementation land with the first emitting system's story — the MVP event set (TR-analytics-021: rounds, forge funnel, `floor_cleared`, economy, session bounds) is non-deferrable and rides battle/forge/tower/meta stories as they land. analytics OQ-AN1 gets its resolved-mark at the GDD's next edit, pointing here.

## Validation Criteria
1. Dedup race: two concurrent flushes (or a flush + an extraction) carrying the same `event_id` → exactly one stored row, both answer `accepted`.
2. Commit replay: replaying a seed-anchored commit answers the recorded result and extracts nothing twice.
3. Analytics failure isolation: an event with a schema violation inside a valid commit is quarantined/counted while the commit applies with its game effects intact.
4. Consent: toggle-off → every subsequent event rejected `consent_off`; one audit row per change plus the registration row; a consent flip concurrent with a flush rejects post-flip events; consent **on** from registration writes exactly one initial audit row.
5. Deletion: deleting an account cascades `analytics_events`, claims, samples to zero rows for that account; `consent_audit` rows become the anonymized marker (`account_id` NULL, `anonymized` true) within the 30-day SLA; `analytics_rejections` is untouched (aggregate).
6. Version buckets: an event with an unknown `schema_v` lands in `rejected_version`, never merged with bad-name rejections; its stored sample contains shape only — asserted on serialized storage, no payload values.
7. Structural rejection: an oversized batch (`> B_max`) answers 4xx and the client drops it without retry, counting the drop; a 5xx drives `Backoff` instead.
8. Claim hygiene: an event rejected after claim (any path) leaves no surviving claim row — a corrected re-send with the same `event_id` is stored.
9. Partition drill: with the future partition absent, an insert lands in `DEFAULT`; the maintenance job creates partitions ahead, drains `DEFAULT`, and drops a partition older than `TTL_raw`; an event whose `received_at` is day 91 is unreachable after the drop.
10. Claim-TTL window: the same `event_id` re-sent after claim purge stores again (documented: dedup guarantee = claim retention, 90 d ≥ GDD `TTL_dedup` 7 d).
11. Config bound: bumping `B_max` in the shared config moves the server's structural bound — a batch the old bound rejected passes after the bump (no hardcoded 50).
12. Layering: no `src/game/**` module imports the net layer or binds `TrackSink`; the port's implementation resolves only at the composition root (asserted by an import-boundary test per ADR-0004's pattern).

## Related
- ADR-0002 (Accepted): storage engine, additive-only migrations, session auth, FK-cascade rule, the commit transaction this ADR must never disturb; its `telemetry_consent` column and analytics tables are additive schema under that ADR's freeze policy.
- ADR-0003 (Accepted): owns commit protocol semantics and the commit envelope's wire shape — analytics rides inside it unchanged; `battle_telemetry` (`/api/battles/start`) is a different transport and untouched here.
- ADR-0004 (Accepted): module boundaries — `TrackSink` port layering, the shared analytics config file, the `src/game/**` import ban this ADR implements around.
- Design records: `design/gdd/analytics.md` (primary — resolves its OQ-AN1); `design/gdd/accounts-backend.md` (Hard-sink row, :320).
- Registry: adds sink-route and dedup stances to `docs/registry/architecture.yaml` (see that file's entries).
