# ADR-0002: Persistence Boundary and Backend Stack

## Status
Proposed

## Date
2026-11-09

## Last Verified
2026-11-09

## Decision Makers
Technical-director role via autonomous run (`project.yaml` `modes.automation: autonomous`); lean review — TD-ADR skipped (review_mode: lean). Requirements sourced from Approved GDDs: accounts-backend (primary, all Core Rules/F1–F3), forge-srs OQ-FS1, hero-class OQ4, question-content delivery split.

## Summary
The accounts-backend GDD pins *what* persists and *how it behaves* (server-authoritative state, atomic commit-point writes with client-generated commit-ID idempotency, 30-day sliding sessions, backend-served versioned content); this ADR pins *how it is built*: a single stateless **Node.js + TypeScript** service sharing the client's language (forced by "one formula module, two hosts" and ADR-0001's pure-TS PRNG module), **PostgreSQL** storage with additive-only schema migrations (freezing the schema — resolving hero-class OQ4's *mechanics* without deciding its product question), **argon2id** password hashing (keeps the GDD's 128-char bound — AC-A3 unchanged), **opaque server-stored session tokens** in httpOnly cookies (revocation is a GDD requirement, which rules out stateless JWTs), provider-agnostic Postgres/email hosting chosen at deploy time, and the schema-level deletion cascade analytics needs.

## Engine Compatibility

| Field | Value |
|-------|-------|
| **Engine** | Web — React ^19.0.0 + TypeScript ^5.7.0 client; server stack pinned here (Node LTS + Fastify + PostgreSQL) |
| **Domain** | Networking (backend) / Core |
| **Layer** | Foundation — accounts-backend's own ADR; every other system's persistence builds on this schema |
| **Knowledge Risk** | MEDIUM — the client pins are VERSION.md-verified, but **no backend version pins exist in `docs/engine-reference/web/`** (VERSION.md covers the SPA stack only). Node LTS / Fastify v5 / Postgres 17 are from training data (pre-cutoff families); exact versions are **NOT SOURCEABLE** from repo pins and get pinned at scaffold time against current docs. Mechanisms decided here (opaque tokens, argon2id, SQL transactions, FK cascades) are stable, pre-cutoff platform surface |
| **References Consulted** | `docs/engine-reference/web/VERSION.md` (no backend coverage — stated, not filled from training data); `design/gdd/accounts-backend.md` (primary); `design/gdd/forge-srs.md` OQ-FS1; `design/gdd/hero-class.md` OQ4 |
| **Post-Cutoff APIs Used** | Possibly Fastify v5 minor APIs — resolved at scaffold, flagged there |
| **Verification Required** | (1) argon2id params current against OWASP guidance at implementation (this ADR's numbers are pre-cutoff); (2) commit-ID idempotency + consumable-guard integration tests; (3) sliding-TTL boundary (exactly 30d + 0s → expired) on the server clock; (4) deletion-cascade test proving no orphaned per-account rows |

## ADR Dependencies

| Field | Value |
|-------|-------|
| **Depends On** | None at decision level (independent of ADR-0001's algorithm choice). Storage-shape consistency: the battle-record table carries the battle seed as two uint32 columns matching ADR-0001's `U64` halves — no BigInt in storage or transport |
| **Enables** | ADR-0003 (commit protocol) rides this storage: the commits table and idempotency mechanics decided here are what ③ formalizes on the wire |
| **Blocks** | accounts-backend implementation stories; every persistence-dependent story in forge-srs, equipment, tower, meta-progression; ranked-league persistence (Alpha). None exist yet (no epics) |
| **Ordering Note** | ADR-0003 must not contradict the storage semantics recorded here (atomic whole-commit, commit-ID idempotency, stale-state rejection); code root/repo topology/raw-data fate is ADR-0004's surface and is deliberately absent here |

## Context

### Problem Statement
accounts-backend's GDD names its companion ADR explicitly (Dependencies: "the GDD states *what* persists; the ADR states *how* — stack, hosting, schema mechanics") and routes five implementation questions here: Open Question 1 (the ADR itself), 5 (email deliverability), 7 (multi-device session limit), plus AC-A3's provisional password upper bound ("may tighten if the hash selected by the companion ADR has a lower limit"), and hero-class OQ4 (schema freeze ordering). Without these answers no backend story can be written.

### Constraints
- GDD-locked behaviours this ADR must implement, not change: server-authoritative state (client never writes game state to browser storage — AC-C6); atomic whole-commit apply/reject (AC-C2); commit-ID idempotency (AC-E2); consumable stale-state rejection, never last-writer-wins (AC-E3); session validity from the **server clock only** with 30-day sliding TTL and strict `<` (F1, AC-S3); reset/logout revokes other sessions (AC-A6/A7); version-keyed content cache with instant invalidation (Core Rule 7, AC-D2); no offline progression (Core Rule 8); in-memory login throttle acceptable at MVP (F2, AC-E4).
- The server must eventually host the battle engine ("one formula module, two hosts", ranked/PVP trust escalation) — the stack choice must keep that door open, which effectively requires the client's language: TypeScript.
- Password input bound is a GDD AC (128 chars) — a hash with a lower hard limit would rewrite AC-A3/Edge Case 6; avoiding that rewrite is preferred.
- Schema freeze must land now (hero-class OQ4 is "Before accounts-backend schema freeze") — but OQ4's actual product question (post-MVP class switching) is owned by **project-owner**; the ADR may only resolve the *mechanics* that decouple the freeze from that answer.
- Content iteration without redeploy (Core Rule 7 rationale) — content payload route must be data-versioned, not build-versioned.

### Requirements
- Implement F1/F2/F3 exactly as written (sliding TTL, throttle key (email_normalized, IP), client retry ladder is client-side — server only needs deterministic rejection semantics).
- Support AC-A6/A7 revocation → session state must be server-side and instantly revocable.
- Support the deletion cascade (TR-analytics-010, accounts OQ6): every per-account table must cascade on account deletion.
- Resolve OQ-FS1's mechanism (QA delay-override profiles) without touching the persistence schema or shipped defaults.
- Keep the PvP future not-precluded: stateless app servers (horizontal scale), server-side session state (a second host can validate), no client-trusted magic anywhere in the storage layer.

## Decision

**Backend stack: Node.js (current LTS) + TypeScript + Fastify, one stateless HTTP API service.** TypeScript is forced end-to-end by the shared B-series formula package and ADR-0001's PRNG module ("must be dependency-free pure TS so the future PvP server host can import it verbatim") — a non-TS server would fork the formula module. Fastify over Express (untyped middleware heritage) and NestJS (decorator/heavyweight for a 10-endpoint MVP): built-in JSON-Schema validation gives Core Rule 6's "server validates structure" a first-class mechanism, TS-first, small surface. Exact versions pinned at scaffold against current docs (NOT SOURCEABLE from repo pins — VERSION.md does not cover the backend).

**Storage engine: PostgreSQL (single managed instance), accessed provider-agnostically** through a standard connection string — the provider (Supabase/Neon/RDS-class) is a deploy-time choice by cost/region criteria, exactly like the GDD's provider-agnostic identity record for OAuth. Postgres because every storage requirement here is native to it: transactional whole-commit apply (AC-C2), unique-constraint idempotency (AC-E2), conditional-update consumable guards (AC-E3), FK `ON DELETE CASCADE` (analytics-010), JSONB for commit payloads and content banks. No ORM religion at MVP: a thin query layer is enough; the schema is the contract.

**Schema mechanics (the freeze):**
- `accounts(id, email_normalized UNIQUE, password_hash, created_at, …)` — one account, one profile (Core Rule 2).
- `sessions(token_hash, account_id FK, last_active_at, created_at)` — opaque tokens, hashed at rest; F1 refresh writes `last_active_at` only when > 1 h stale (the GDD's own noted optimization; no player-visible change).
- `commits(commit_id PK, account_id FK, type, payload JSONB, applied_at)` — client-generated commit ID, unique: a replayed ID answers with the recorded original result without re-applying (AC-E2). Commit *protocol semantics* stay ADR-0003's; the storage contract is fixed here.
- Per-domain tables (rune queue, gear, loadout, quests, tower progress, records, battle records) all `FK → accounts ON DELETE CASCADE` — the deletion path analytics-010/OQ6 needs exists from day one. Battle records carry the battle seed as `seed_hi INT, seed_lo INT` (ADR-0001's `U64` halves; uint64 does not fit Postgres int8 — do not "simplify" to one column).
- Consumable guards: conditional `UPDATE … WHERE not_consumed` inside the commit transaction; zero rows affected → stale-state rejection (AC-E3).
- **Freeze policy: additive, nullable, backward-compatible migrations only.** Post-freeze schema changes must not rewrite or drop existing columns. This is what resolves hero-class OQ4 *mechanically*: post-MVP class switching — whatever project-owner later decides — is an additive migration (e.g., a `class_history` table), so the freeze does not force the product answer now, and no speculative `class_history` column is added at MVP. The product question stays open, owned by project-owner, decoupled from the freeze.
- Login-throttle counters stay **in memory** (F2, AC-E4 accepts restart clearing); they are deliberately not persisted.

**Session tokens: opaque 256-bit crypto-random strings, stored SHA-256-hashed server-side, delivered as `httpOnly; Secure; SameSite=Lax` cookies.** Server-side state is required anyway by AC-A6/A7 (instant revocation) — stateless JWTs would need a server-side denylist to satisfy them, i.e. the worst of both. SameSite=Lax is the MVP CSRF posture (no third-party embedding of the game); revisited if an embedding need ever appears. F1 expiry check is `now − last_active_at < TTL_idle` against the **server clock** on every authenticated request (AC-S3). **OQ7 resolved: unlimited concurrent sessions at MVP** (design's current stance); a per-account cap is later application logic, no schema change.

**Password hashing: argon2id, m=19456 KiB, t=2, p=1** (OWASP's minimum recommended configuration — re-verify against current OWASP guidance at implementation, flagged above). argon2id has no 72-byte input ceiling, so **AC-A3's 128-char bound is kept as-written** — the GDD is not rewritten, and passwords above the bound are rejected, never truncated (Edge Case 6).

**Content payload delivery: version-keyed API, client-side cache.** `GET /api/content/version` returns the current content version (cheap, every app load); the client compares to its browser-storage cache (`cached.version === server.version` — the GDD's locked one-line invalidation) and fetches `GET /api/content` only on mismatch. Publishing content = inserting a new content-version row; no deploy. A session never switches content mid-battle (AC-E5 — the client only re-reads at full app load). No CDN at MVP: the client cache is the delivery optimization, and content volume is small.

**Hosting shape (MVP): one stateless service + managed Postgres + transactional email API.** Stateless app servers keep horizontal scaling available; single region; no auto-scaling complexity at MVP. Transport/TLS termination/CDN for the PvP era remain ADR-⑦'s surface. **OQ5 resolved as an interface: a thin `Mailer` port (verify + reset + future mail) with the provider chosen at deployment; selection criteria = Vietnamese-inbox deliverability verified by a seed-list test before public testing.** **OQ-FS1 resolved: QA delay-override profiles are client build config** — forge delays are data-driven constants in the sim core (coding standards), QA builds swap the profile at build time; overrides never alter the persistence schema, never ship in production defaults, and `due_at` remains plain committed server data.

### Architecture Diagram

```
Browser SPA (React)                          Backend (Node LTS + Fastify, stateless, TS)
┌─────────────────────────┐                 ┌──────────────────────────────────────────┐
│ memory display cache    │  commits ──────►│ structure validation (JSON Schema)       │
│ (never persisted)       │  (commit ID,    │ ├─ unique commit_id → idempotent replay  │
│ versioned content cache │   atomic)       │ ├─ tx: conditional updates (consumables) │
│  (browser storage,      │  content fetch  │ └─ per-domain tables FK→accounts         │
│   Core Rule 7 — the     │  auth cookie    │      ON DELETE CASCADE                   │
│   ONLY allowed store)   │ ◄────────────── │ sessions (opaque token, hashed, TTL 30d) │
└─────────────────────────┘                 │ argon2id verify · throttle (in-memory)   │
                                            └───────────────┬──────────────────────────┘
                                                        PostgreSQL (managed, provider-agnostic)
                                                        + Mailer port → provider at deploy
```

### Key Interfaces

```ts
// Storage contract (server-internal, the schema is the API):
// commits(commit_id PK, account_id FK→accounts ON DELETE CASCADE, type, payload JSONB, applied_at)
// sessions(token_hash PK, account_id FK→accounts ON DELETE CASCADE, last_active_at, created_at)
// battle_records(..., seed_hi INT /* uint32 */, seed_lo INT /* uint32 */)  -- ADR-0001 U64 halves

// Client-facing (wire shape formalized by ADR-0003):
POST /api/commits        // idempotent by client-generated commit ID; atomic apply-or-reject
POST /api/auth/*         // register, login, logout, reset-request, reset-set
GET  /api/content/version
GET  /api/content        // current content payload (fetched only on version mismatch)

interface Mailer {       // provider-agnostic port — provider chosen at deploy (OQ5)
  sendVerification(to: string, token: string): Promise<void>;
  sendPasswordReset(to: string, token: string): Promise<void>;
}
```

### Implementation Guidelines
- **Must** apply each commit inside one transaction with the unique `commit_id` insert and all conditional updates; **must never** partially apply, and **must never** re-apply a seen commit ID.
- **Must** reject consumable conflicts with the stale-state error (client re-fetches; no last-writer-wins — AC-E3).
- **Must** compute session validity from the server clock with strict `<`; **must never** consult a client-supplied timestamp for validity.
- **Must** store only the session-token hash server-side; **must never** log or persist raw tokens.
- **Must** reject passwords above the input bound with a clear message (Edge Case 6); **must never** truncate.
- **Must** return generic registration/reset responses (Edge Cases 8/12) — byte-identical for exist/nonexist (AC-A5/A8).
- **Must** FK-cascade every per-account table to `accounts`; **must never** orphan progress rows on deletion.
- **Must** keep game state out of browser storage except the session cookie and the version-keyed content cache (AC-C6).
- **Must** keep QA delay-override profiles in build config only; **must never** ship them as production defaults or encode them in the schema.
- **Must** keep `due_at`, `seed_hi/seed_lo`, `commit_id` plain data — no double meaning, no computed-on-read magic.

## Alternatives Considered

### Alternative 1: BaaS platform as the backend (Supabase/Firebase as the architecture)
- **Description**: Auth, DB, and storage consumed as platform features; custom code only for rules.
- **Pros**: Fastest scaffold; auth and Postgres managed for free.
- **Cons**: Commit semantics (atomic multi-table apply with conditional consumable guards and idempotent replay) live in platform-specific rules/edge-function layers; the trust escalation to server-computed outcomes (ranked/PVP) needs real server code hosting the battle engine anyway; provider lock-in on the schema that "propagates everywhere" (GDD Overview).
- **Rejection Reason**: The GDD's commit model is the system's core; owning it as ordinary code in the same language as the client is worth more than scaffold speed. Managed Postgres *as a component* (above) keeps the speed where it is cheap.

### Alternative 2: Stateless JWT sessions
- **Description**: Signed tokens, no session table; expiry checked cryptographically.
- **Pros**: No DB write per request (though the GDD's 1-hour-refresh note already caps that cost); trivially horizontally scalable.
- **Cons**: AC-A6 (password reset revokes all sessions) and AC-A7 (logout revokes) require a server-side denylist — at which point the statelessness is fictional; sliding 30-day TTL means re-issuing tokens anyway.
- **Rejection Reason**: Revocation is a GDD acceptance criterion, not an optimization. Opaque server-side tokens implement the GDD as written.

### Alternative 3: bcrypt password hashing
- **Description**: The incumbent; universally available.
- **Cons**: Hard 72-byte input ceiling → the GDD's own Edge Case 6 rule forces either silent truncation (a "security lie", the GDD's words) or rewriting AC-A3/Edge Case 6 to a 72-byte bound.
- **Rejection Reason**: argon2id is current OWASP guidance, tunable, and keeps every GDD AC byte-identical. Revisit only if the chosen runtime lacks a maintained argon2id binding (scaffold-time check, recorded then).

## Consequences

### Positive
- Every accounts-backend AC is implementable as written — no GDD rewrite needed (the AC-A3 bound survives via argon2id; F1/F2/F3 map directly).
- Schema freeze lands now with a documented additive-only policy; hero-class OQ4's product question is decoupled from the freeze instead of blocking it.
- TypeScript end-to-end means the B-series formula package and the PRNG module are literally shared files — the ranked/PVP server-computed future imports them unchanged.
- Deletion cascade is structural (FK), not a cleanup script; analytics-010's storage half is pre-paid.
- Commit-ID idempotency and consumable guards live in the storage layer where ADR-0003 can formalize, not reinvent, them.

### Negative
- A custom commit pipeline to own and test (vs BaaS convenience) — mitigated by it being ~10 endpoints with the GDD's ACs as the test plan.
- argon2id's memory cost (~19 MiB/verify) is real on small instances — mitigated by login throttling (F2) bounding verification rate.
- In-memory throttle counters and unlimited sessions are recorded MVP simplifications with named revisit triggers (server restart AC-E4; abuse appearance OQ7).

## Risks
- **Backend version drift post-cutoff** (Fastify/Node minor APIs) → exact pins land at scaffold time with the NOT-SOURCEABLE marker; mechanisms decided here are stable surface.
- **argon2id parameter staleness** (OWASP guidance moves) → re-verify at implementation; the GDD ACs don't depend on the exact numbers, only on no-truncation.
- **Schema freeze too tight** (a post-MVP need needs a non-additive migration) → the additive-only policy is the ADR's own testable rule; violations surface in `/architecture-review`.
- **Commit-table growth** (append-only log) → MVP volume is trivial; retention/pruning is a later ops concern, not a schema change.

## GDD Requirements Addressed

| GDD System | Requirement | How This ADR Addresses It |
|------------|-------------|--------------------------|
| accounts-backend.md | Companion ADR (Dependencies; OQ1): stack, hosting, schema mechanics, password hash + AC-A3 bound, session-token mechanism | The whole decision section; argon2id keeps the 128-char bound (AC-A3 unchanged); opaque hashed tokens satisfy AC-A6/A7 |
| accounts-backend.md | F1 sliding TTL, server clock only, strict `<`; F2 throttle key + in-memory acceptance; AC-C2/E2/E3 commit atomicity, idempotency, stale-state | F1 on server clock via sessions table with 1-hour write coalescing; F2 in-memory by key (email_normalized, IP); commits table + unique constraint + conditional updates |
| accounts-backend.md | Core Rule 7 / AC-D1/D2/E5: backend-served versioned content, instant invalidation, no mid-session switch | Version-keyed content API + browser-storage cache, fetch-on-mismatch only (game-concept OQ2's implementation recorded) |
| accounts-backend.md | OQ5 (email deliverability), OQ7 (session limit), OQ6-adjacent (deletion cascade) | Mailer port + deploy-time provider with deliverability test; unlimited sessions at MVP (documented); FK ON DELETE CASCADE everywhere |
| hero-class.md | OQ4 "before accounts-backend schema freeze" | Freeze mechanics resolved (additive-only policy); the product question stays open with project-owner — deliberately not decided here |
| forge-srs.md | OQ-FS1: QA delay-override profiles without touching shipped defaults | Build-config override in the client sim core; schema and production defaults untouched; due_at stays plain committed data |
| question-content.md | Delivery/versioning owned here, schema owned by that GDD (Interactions table) | Content API stores/serves that GDD's schema as versioned JSONB payloads |
| analytics.md | TR-analytics-010 deletion cascade | Structural FK cascade from every per-account table |
| battle-system.md (consistency) | Battle seed persisted in the battle record (ADR-0001) | `seed_hi/seed_lo` uint32 columns matching `U64` halves — no BigInt in storage |

## Performance Implications
- **CPU**: argon2id ~19 MiB × t=2 per login verify — bounded by F2 throttling; commit validation is trivial JSON work.
- **Memory**: in-memory throttle counters (keyed, bounded by W and traffic); sessions live in Postgres, not RAM.
- **Load Time**: warm app load = one cheap version check (GDD Game Feel: never waits on network for cached content).
- **Network**: one commit per commit-point action (Core Rule 5) — five calls per battle session at most; content payload fetched only on version mismatch.

## Migration Plan
Greenfield — no backend exists. The scaffold story lands the service skeleton + schema migration 0001 (accounts, sessions, commits, content) + the Mailer port; per-domain tables land with each system's first persistence story under the additive-only rule. accounts-backend OQ1/5/7 and forge-srs OQ-FS1 get their resolved-marks at those GDDs' next edits, pointing here.

## Validation Criteria
1. Integration tests (`tests/integration/accounts-backend/`): commit atomicity (AC-C2), commit-ID replay answers original result with no re-apply (AC-E2), consumable stale-state rejection (AC-E3).
2. Boundary test: session valid at 29d23h59m59s, expired at exactly 30d + 0s, computed from a fake server clock (AC-S3).
3. Throttle ladder test: 5 failures/15 min → lockout 15 min; 4th lockout → 120 min; cap 24 h; success resets (AC-T1–T4); restart clears (AC-E4, documented).
4. Password bound test: 7-char and 129-char rejected; 8 and 128 accepted; no truncation ever (AC-A3).
5. Reset/logout revocation test: pre-reset tokens rejected after password change (AC-A6/A7).
6. Content invalidation test: version match uses cache; bump fetches and replaces; mid-session session stays on cached version (AC-D2/E5).
7. Deletion cascade test: deleting an account leaves zero rows in every per-account table.
8. Byte-identical generic responses for enumeration cases (AC-A5/A8) — asserted on serialized response bodies.

## Related
- Companion to `design/gdd/accounts-backend.md` (the GDD names this ADR in Dependencies and Open Question 1); resolves that GDD's OQ1/5/7 and hero-class OQ4's mechanics, forge-srs OQ-FS1, game-concept OQ2's implementation.
- ADR-0001: its `U64` halves define the battle-seed storage shape; its pure-TS module is why the server is TypeScript.
- ADR-0003 (commit protocol + trust escalation) builds on the storage semantics here; ADR-0004 (module layout) owns code root/repo topology/raw-data fate; ADR-⑦ (transport/hosting) owns the PvP-era hosting escalation.
- Design records: `design/gdd/accounts-backend.md` (primary), `design/gdd/hero-class.md` OQ4, `design/gdd/forge-srs.md` OQ-FS1.
