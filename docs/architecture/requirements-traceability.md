# Architecture Traceability Index
Last Updated: 2026-11-10
Engine: Web — React ^19.0.0 + TypeScript ^5.7.0 + Vite ^8.0.5 + Tailwind CSS ^4.0.0 + lucide-react ^1.63.0

> Source of the TR-IDs: `docs/architecture/tr-registry.yaml` (418 registered requirements).
> Source of ADR attribution: each ADR's **GDD Requirements Addressed** table (`adr-0001`…`adr-0005`).
>
> **How statuses derive.** ✅ when an **Accepted** ADR names the requirement (or its
> provisional range) in a coverage table; ❌ when its text explicitly defers a decision to a
> pending ADR; "—" when it is implementation tier — governed by its GDD and the coding
> standards, with no architecture-level decision required at `modes.workflow: standard`.
> All five ADRs are now **Accepted** (quartet 2026-11-10; ADR-0005 2026-11-10), so the 2026-11-09
> run's ✅ rows flip to ✅ and ADR-0005 adds 9 newly covered rows (tower-018/019;
> question-content-020/026/027/028/029/030/032). The pre-review provisional baseline of 260 was
> superseded by the registered 418-requirement set (registry header, PROVENANCE).
>
> **Vocabulary note:** no ⚠️ (partial) rows this run. The known partial-decision items are
> recorded as integration notes in the review report, not as coverage rows.

## Coverage Summary

- Total requirements: **418**
- Covered (✅, by Accepted ADRs): **63** (15%)
- Partial (⚠️): **0**
- Gaps (❌, named pending-ADR scope): **2** (<1%) — both Full-Vision deferred tier
- Implementation tier ("—", GDD-owned, no ADR required): **353** (84%)

| System | Total | ✅ | ❌ | — |
|--------|-------|----|----|---|
| accounts-backend | 39 | 10 | 0 | 29 |
| analytics | 27 | 1 | 1 | 25 |
| battle-system | 31 | 7 | 0 | 24 |
| equipment | 22 | 3 | 0 | 19 |
| forge-srs | 28 | 4 | 0 | 24 |
| hero-class | 30 | 2 | 0 | 28 |
| localization | 26 | 0 | 0 | 26 |
| meta-progression | 30 | 4 | 0 | 26 |
| opponent-ai | 21 | 5 | 0 | 16 |
| question-content | 28 | 10 | 0 | 18 |
| ranked-league | 27 | 8 | 0 | 19 |
| real-pvp | 26 | 3 | 1 | 22 |
| speech-io | 30 | 1 | 0 | 29 |
| tower | 25 | 4 | 0 | 21 |
| ui-shell | 28 | 1 | 0 | 27 |

## Full Matrix


### accounts-backend — 39 requirements (10 ✅ / 0 ❌ / 29 —)

| TR-ID | Requirement | ADR | Status |
|-------|-------------|-----|--------|
| TR-accounts-backend-008 | All persistent game state (hero, XP, gold, gear, rune queue, quests, tower, records) stored server-side; client keeps only an in-memory display cache and never writes game state to browser storage | ADR-0002 | ✅ Accepted |
| TR-accounts-backend-009 | Client state pushed at five defined commit points (battle end, forge action, equip/loadout, quest claim, tower stage result) | ADR-0002, ADR-0003 | ✅ Accepted |
| TR-accounts-backend-010 | Each commit is atomic — fully applied or rejected | ADR-0002, ADR-0003 | ✅ Accepted |
| TR-accounts-backend-011 | Every commit carries a client-generated unique commit ID; server answers a repeated ID with the original result without re-applying | ADR-0002, ADR-0003 | ✅ Accepted |
| TR-accounts-backend-012 | Question banks (battle, tower, forge filler) fetched from the backend content API, never bundled into the SPA; content API + caching join MVP backend scope | ADR-0002 | ✅ Accepted |
| TR-accounts-backend-013 | Client caches versioned content payloads in browser storage keyed by content version (content cache, never game state); new version invalidates; cache persists across reloads | ADR-0002 | ✅ Accepted |
| TR-accounts-backend-014 | Commit retry ladder delay_n = min(1 s × 2ⁿ + jitter(0–0.5 s), 30 s), 5 auto-retries then Unsaved-state (commit retained in memory, banner, blocked actions); manual retry restarts at n=0 | ADR-0002, ADR-0003 | ✅ Accepted |
| TR-accounts-backend-015 | On commit failure the client retains unsaved state and retries; a battle never ends unsaved silently | ADR-0002, ADR-0003 | ✅ Accepted |
| TR-accounts-backend-017 | Session expiry mid-battle: commit fails 401 → re-login prompt ("Session hết hạn") → pending commit retried after successful login, ladder restarted | ADR-0002, ADR-0003 | ✅ Accepted |
| TR-accounts-backend-019 | System stores and serves what other systems produce; never computes a reward, drop, or review schedule | ADR-0002 | ✅ Accepted |
| TR-accounts-backend-021 | Authenticated play only — no guest mode at MVP; account creation is part of first-run onboarding so no local-to-server migration code ever exists | — | — Implementation tier |
| TR-accounts-backend-022 | One account, one profile — an email+password identity with exactly one player profile at MVP | — | — Implementation tier |
| TR-accounts-backend-023 | Email+password auth: unique case-insensitive email, min-8-char password checked client-side and enforced server-side, reset via emailed link, no OAuth at MVP with provider-agnostic identity record | — | — Implementation tier |
| TR-accounts-backend-024 | Login session survives browser restarts and expires after 30 days of inactivity (sliding window) | — | — Implementation tier |
| TR-accounts-backend-025 | MVP trust model: server validates commit structure (field shapes, id refs, monotonic guards) but accepts client-reported battle outcomes; deep revalidation post-MVP before ranked-league | — | — Implementation tier |
| TR-accounts-backend-026 | No offline progression — cached content may render but battle/forge/sync blocked with a clear offline state | — | — Implementation tier |
| TR-accounts-backend-027 | Auth state machine: Unauthenticated / Registering / Authenticating / Authenticated / Session expired / Password-reset pending with defined transitions | — | — Implementation tier |
| TR-accounts-backend-028 | Verification email sent at registration; unverified accounts can play at MVP; enforcement (if ever) blocks at session establishment, flagged provisional | — | — Implementation tier |
| TR-accounts-backend-029 | Battle contract: one commit at battle end — BattleResult event appends cursed runes to rune queue and updates records + rewards atomically | — | — Implementation tier |
| TR-accounts-backend-030 | Rune-queue storage owned here, queue semantics by forge-srs; forge commits consume runes / grant stones, gear +level is a separate equipment commit | — | — Implementation tier |
| TR-accounts-backend-031 | Content delivery + versioning owned here; content schema owned by the question-content GDD | — | — Implementation tier |
| TR-accounts-backend-032 | Content-cache validity is a one-line version comparison (cached.version === server.version) at app load; TTL-based invalidation rejected as contradicting the locked instant-invalidation decision | — | — Implementation tier |
| TR-accounts-backend-033 | Session validity: session_valid ⟺ (now − last_active_at) < TTL_idle (locked 30 days); last_active_at refreshed on every authenticated API request; server clock only; strict < boundary | — | — Implementation tier |
| TR-accounts-backend-034 | Login throttling: fixed 15-min window keyed on (email_normalized, IP), 5 failures max, progressive lockout 15 min × 2^(k−1) capped at 24 h, counters reset on successful login | — | — Implementation tier |
| TR-accounts-backend-035 | In-memory throttle counters acceptable at MVP; server restart clears lockout state — documented, accepted | — | — Implementation tier |
| TR-accounts-backend-036 | beforeunload warning fires whenever unsaved commits exist; tab close/reload in Unsaved-state loses that commit (the one documented lossy path) | — | — Implementation tier |
| TR-accounts-backend-037 | Multi-device stale-state: commit referencing an already-consumed rune rejected with stale-state error, client re-fetches; last-writer-wins never applied to consumables | — | — Implementation tier |
| TR-accounts-backend-038 | Password over 128 characters (72 bytes if bcrypt) rejected at registration with a clear message; never silently truncated | — | — Implementation tier |
| TR-accounts-backend-039 | Email normalized (lowercased) before uniqueness checks — case-variant registration hits the same account | — | — Implementation tier |
| TR-accounts-backend-040 | Registration with an already-registered email returns a generic error that never confirms the email exists | — | — Implementation tier |
| TR-accounts-backend-041 | Content version change mid-session: client keeps its cached version until the next full app load; a session never switches content mid-battle | — | — Implementation tier |
| TR-accounts-backend-042 | Password reset for an unregistered email returns a byte-identical generic success and sends nothing (anti-enumeration) | — | — Implementation tier |
| TR-accounts-backend-043 | Trust-model escalation: before ranked-league ships, commits must move to server-computed outcomes; real-pvp makes it absolute | — | — Implementation tier |
| TR-accounts-backend-044 | Feel/perf targets: auth actions acknowledge within ~300 ms; commit is fire-and-retry (no blocking spinner at Victory); cached content renders immediately with background version check | — | — Implementation tier |
| TR-accounts-backend-045 | Behaviour-level UI requirements: inline validation mirrors server rules, session-expired prompt preserves the pending commit, persistent Unsaved banner with manual retry, offline blocking, no guest entry anywhere; screens owned by ui-shell | — | — Implementation tier |
| TR-accounts-backend-046 | Password reset revokes every other live session for the account; pre-reset tokens are rejected | — | — Implementation tier |
| TR-accounts-backend-047 | During normal play no game state is written to localStorage/sessionStorage/IndexedDB — only the session token and the versioned content cache | — | — Implementation tier |
| TR-accounts-backend-048 | Forge commit shape: rune R removed from queue exactly once and Upgrade Stone granted in the same atomic commit; gear +level happens later in equipment's separate commit | — | — Implementation tier |
| TR-accounts-backend-049 | Concurrent-session cap undecided; design currently allows unlimited concurrent sessions per account | — | — Implementation tier |

### analytics — 27 requirements (1 ✅ / 1 ❌ / 25 —)

| TR-ID | Requirement | ADR | Status |
|-------|-------------|-----|--------|
| TR-analytics-010 | Account deletion cascades to telemetry within 30 days (purge or irreversible anonymize); raw events 90-day TTL (TTL_raw) then rollup + purge. | ADR-0002 | ✅ Accepted |
| TR-analytics-018 | Sources call one track(event_name, payload) helper; analytics owns name + versioned schema (mandatory schema_v); meaning change = new name or schema_v bump. | — | — Implementation tier |
| TR-analytics-019 | Fire-and-forget: emission never blocks, mutates state, or creates a commit point; rides existing commits; UUIDv7 event_id at track() time, sink dedups on it. | — | — Implementation tier |
| TR-analytics-020 | Loss acceptable: overflow or unreachable sink past retry budget drops events oldest-first; never re-emits a commit. | — | — Implementation tier |
| TR-analytics-021 | MVP event set (rounds, forge funnel, floor_cleared, economy, session bounds) non-deferrable — emitted from MVP; dashboards stay Beta/Release. | — | — Implementation tier |
| TR-analytics-022 | Payloads carry only server-side account ID + game facts — no email, IP, fingerprints, or answer-text content. | — | — Implementation tier |
| TR-analytics-023 | Consent toggle default-on and server-enforced; one consent audit record always written; toggle lives on ui-shell screens (contract change, OQ-AN2). | — | — Implementation tier |
| TR-analytics-024 | Analytics feeds internal dashboards only; never drives player-visible counters implying real presence. | — | — Implementation tier |
| TR-analytics-025 | Event list, payload schemas, batch params, sampling rates, metric definitions live in an external analytics config file, not in code. | — | — Implementation tier |
| TR-analytics-026 | v1 event vocabulary (11 events) incl. battle_result, forge_funnel, floor_cleared, stage_attempt, economy_event, rp_delta, season_rollover with schema_v:1 payloads. | — | — Implementation tier |
| TR-analytics-027 | High-frequency payloads sampled per player cohort hash(account_id, week) % N, omitted not empty; battle_result core and funnel events never sampled. | — | — Implementation tier |
| TR-analytics-028 | Client buffer state machine Empty/Filling/Flushing/Backoff/Dropping; flush on B_batch or T_flush; drops oldest-first to under B_max/2, counting each. | — | — Implementation tier |
| TR-analytics-029 | Server lifecycle: accepted/rejected/quarantined; unknown schema_v in separate rejected_version bucket; diagnostic sample first 100/schema/day, stripped. | — | — Implementation tier |
| TR-analytics-030 | accounts-backend is the Hard sink (storage, transport, auth, commit plumbing); analytics owns schema + query/read; flush rides the authenticated session. | — | — Implementation tier |
| TR-analytics-031 | F-AN4: flush ⟺ N_buf ≥ B_batch OR T_flush elapsed since first queued event; defaults B_batch 10, T_flush 30 s, B_max 50, all config-driven. | — | — Implementation tier |
| TR-analytics-032 | F-AN5: sessions split server-side when the server-receive-time gap exceeds T_session_gap (default 1800 s); gap rule authoritative over session_end. | — | — Implementation tier |
| TR-analytics-033 | F-AN6: cohort sampling s_round = 1/N deterministic per (account_id, week); sampling_class {always, cohort} declared per event. | — | — Implementation tier |
| TR-analytics-034 | F-AN7: retention Dn uses all-registrations denominator; cohorts grouped by game_day_id (fixed ICT daily boundary), evaluated only after d+n completes. | — | — Implementation tier |
| TR-analytics-035 | F-AN8: funnel conversion C_k counts distinct rune_ids per step, never raw events, keeping every C_k ≤ 1. | — | — Implementation tier |
| TR-analytics-036 | F-AN9: T1 reported as p50/p90, never the mean; p50 below T_floor ≈ 96 h 10 min is a data-quality incident. | — | — Implementation tier |
| TR-analytics-037 | Skew-suspect events (client offset > ±5 min vs server_ts) still stored, grouped by server_ts — never dropped. | — | — Implementation tier |
| TR-analytics-038 | Schemas have no free-text field type (enums, IDs, numbers only); malformed or free-text payloads dropped locally, never queued. | — | — Implementation tier |
| TR-analytics-039 | track() is a synchronous O(1) enqueue, no await on the hot path; flushing runs behind the network layer, never during a countdown. | — | — Implementation tier |
| TR-analytics-040 | No runtime gameplay module may import the sink or metric queries; enforced by automated import-boundary CI rule. | — | — Implementation tier |
| TR-analytics-041 | Analytics config loader fails loudly on invalid config (missing constant, out-of-range value, unknown event), never silent fallback. | — | — Implementation tier |
| TR-analytics-042 | Blocking test scaffolding: authenticated test sink, injectable clock for TTL/retention constants, query-layer reference implementations of Dn/C_k/T1. | — | — Implementation tier |
| TR-analytics-043 | Sink storage route deliberately open (custom tables vs third-party pipeline, OQ-AN1); GDD fixes behaviour, not the route. | ADR #6 — analytics sink route (OQ-AN1) | ❌ Pending ADR |

### battle-system — 31 requirements (7 ✅ / 0 ❌ / 24 —)

| TR-ID | Requirement | ADR | Status |
|-------|-------------|-----|--------|
| TR-battle-system-003 | Battle runs on a fixed-tick simulated clock, not wall-clock setTimeout; ui-shell renders events and may fast-forward but never mutates battle state | ADR-0001 | ✅ Accepted |
| TR-battle-system-011 | Crit fast path: elapsed < 3000 ms (strict) guarantees 1.25 with zero stream draws; otherwise exactly one draw from battle's crit stream at crit_stat/100 | ADR-0001 | ✅ Accepted |
| TR-battle-system-015 | One crypto-random uint64 seed per battle, persisted in the battle record; child streams derive from (seed, domain_tag); Math.random never appears | ADR-0001 | ✅ Accepted |
| TR-battle-system-019 | Each round draws k=1 from the encounter's pool via the seeded question stream; no in-battle repeats; draw sequence is a pure function of (seed, pools) | ADR-0001, ADR-0005 | ✅ Accepted |
| TR-battle-system-021 | Every battle carries an encounter-type config that selects pools, GhostProfile, ghost HP baseline and reveal delay; battle consumes it, never chooses content | ADR-0004, ADR-0005 | ✅ Accepted |
| TR-battle-system-023 | Elimination draws come from battle's seeded stream — cross-system rule whose home GDD is equipment.md (Edge Case 10 / EQ25); battle owns the stream | ADR-0001 | ✅ Accepted |
| TR-battle-system-026 | Bit-exact replay: same seed + recorded commits reproduce the entire per-round log identically (BS36, blocked only on the PRNG ADR) | ADR-0001 | ✅ Accepted |
| TR-battle-system-028 | Battle is exactly 4 rounds in fixed order (vocab_strike, grammar_shield, listening_pierce, ultimate_burst/fallback), fixed data never shuffled, 1:1 pool mapping | — | — Implementation tier |
| TR-battle-system-029 | Battle reads exactly one immutable LoadoutSnapshot ({class_id, effective_stats, items}) at start; never mutates it or reads inventory mid-battle | — | — Implementation tier |
| TR-battle-system-030 | Round state machine intro→question→commit|timeout→resolve→round_end→result; ghost reveal scheduled after answer_reveal_delay_ms_*; no skip past an unrevealed round | — | — Implementation tier |
| TR-battle-system-031 | round_time = max(5, base_round_time_s 10 + hero_effective_time); the 5 s floor is load-bearing so speedMult never divides by zero | — | — Implementation tier |
| TR-battle-system-032 | Per-round-type elapsed timestamps: reading rounds start at question-displayed + options-interactive; listening at options-actionable; ult measured only for the rune threshold | — | — Implementation tier |
| TR-battle-system-033 | speedMult = 1 + 0.3 × remaining_fraction, applied to attack-round damage only — never shields, counters or ult | — | — Implementation tier |
| TR-battle-system-034 | Ult fires at round 4 iff mana ≥ 90 (inclusive); mana resets to 0 on fire; else R4 is a vocab_strike fallback under the Rule 22 policy; mana evaporates at battle end | — | — Implementation tier |
| TR-battle-system-035 | Shield pool accumulates across rounds, absorbs ghost damage before HP, persists the whole battle with no decay and no cap at MVP | — | — Implementation tier |
| TR-battle-system-036 | Battle implements the Grammarian proc runtime predicate (run_correct mod 3 == 0 → +60 flat shield); it does not re-own the hero-class formula | — | — Implementation tier |
| TR-battle-system-037 | Mana is +30 correct / +10 wrong-timeout, flat per class, integer-exact, capped 100; any future fractional gain must use the shared round-half-up convention | — | — Implementation tier |
| TR-battle-system-038 | Wrong answer and timeout are identical in every respect: combo reset (equipment hook may preserve), +10 mana, word drops as cursed rune | — | — Implementation tier |
| TR-battle-system-039 | Ghost resolution contract: resolve_round(profile, mode, seed, round_index) → {correct, answer_reveal_delay_ms}; battle supplies the seed and never draws from the ghost stream | — | — Implementation tier |
| TR-battle-system-040 | Ghost damage is fixed deterministic data (100 standard / 150 ult) — no extra ghost-stream draws permitted; mitigation min(0.25, def/600), def clamped ≥ 0 | — | — Implementation tier |
| TR-battle-system-041 | Ghost armor 0.92 flat applies to vocab_strike only; listening_pierce pierces it; the grammar counter bypasses armor | — | — Implementation tier |
| TR-battle-system-042 | Win/loss: KO, or higher HP fraction wins (inclusive ≥, tie to player); battles self-contained — no HP/mana/shield carry-over | — | — Implementation tier |
| TR-battle-system-043 | Cursed runes drop on wrong/slow (> 6000 ms standard, > 11000 ms ult, strict); deduplicated by word_id; emitted in BattleResult; forge owns everything downstream | — | — Implementation tier |
| TR-battle-system-044 | Battle emits reward events (gold/XP; RP on ranked only) and owns no ledger or downstream arithmetic (static assertion) | — | — Implementation tier |
| TR-battle-system-045 | battles_per_typical_session = 4 is battle-owned, consumed by question-content's F5 burnout guard (authoring-time assertion, nothing computes at runtime) | — | — Implementation tier |
| TR-battle-system-046 | The ghost's roll participates in no mana arithmetic — mana accrues only on player answers | — | — Implementation tier |
| TR-battle-system-047 | Equipment passives apply through four named hook points; battle applies only GDD-documented effects; an unknown passive_id is ignored with a warning (fail-soft) | — | — Implementation tier |
| TR-battle-system-048 | BattleResult carries cursed runes, rewards, seed and per-round log; abandoned sessions emit nothing and MVP persists nothing mid-battle | — | — Implementation tier |
| TR-battle-system-049 | Global rounding convention: round-half-up everywhere; damage expressions evaluate the full float product and round once at the end — required for bit-exact replay | — | — Implementation tier |
| TR-battle-system-050 | Speech-io boundary: listening consumes TTS of tts_text/ipa; ult consumes quality ∈ [0,1] (threshold 0.6 speech-io-owned); a payload missing both tts fields fails fast | — | — Implementation tier |
| TR-battle-system-051 | Presentation budgets are ms targets that never gate battle-state advancement; CSS-only pipeline (no canvas/WebGL/shaders), fast-forwardable via Web Animations API | — | — Implementation tier |

### equipment — 22 requirements (3 ✅ / 0 ❌ / 19 —)

| TR-ID | Requirement | ADR | Status |
|-------|-------------|-----|--------|
| TR-equipment-008 | LoadoutSnapshot publishes only after server commit acceptance; in-flight or failed commits record zero publications; the published object is frozen | ADR-0002, ADR-0003 | ✅ Accepted |
| TR-equipment-009 | Stone application is one atomic whole-commit; server re-validates prerequisites (client gating is UI, not authority); snapshot republished only after acceptance | ADR-0002, ADR-0003 | ✅ Accepted |
| TR-equipment-010 | Equipment state {item_levels, stones, equipped} is stored server-side by accounts-backend — no local game-state cache; offline changes blocked; disconnected view read-only | ADR-0002 | ✅ Accepted |
| TR-equipment-019 | Ownership split: equipment owns catalog, slots, assembly, passive vocabulary, stone application; forge grants and stops; battle consumes the snapshot; accounts-backend stores | — | — Implementation tier |
| TR-equipment-020 | Fixed 12-item catalog as data records (id, display name, slot, rarity, level, stats, perLevel, passive_id); all values in a data file, nothing hardcoded | — | — Implementation tier |
| TR-equipment-021 | Four slots (weapon/armor/accessory/pet), one item each, never empty; default loadout filled at account creation; rarity has no mechanical effect at MVP | — | — Implementation tier |
| TR-equipment-022 | F1 assembly: effective_stat = base + Σ(stats + perLevel × level) over 4 items for hp/atk/def/crit/time; no item grants mana; time rounds half-up to 2 decimals | — | — Implementation tier |
| TR-equipment-023 | Assembly runs client-side for display and snapshot publication; the server re-derives and validates on commit — accounts-backend is authoritative | — | — Implementation tier |
| TR-equipment-024 | Effective def ≤ 120 enforced by construction (level cap 5 + catalog maxima), asserted at assembly, fail fast — never a runtime clamp | — | — Implementation tier |
| TR-equipment-025 | Level cap 5 per item bounds every stat curve; raising it post-MVP requires re-deriving the def band first (one coupled decision, OQ-EQ4) | — | — Implementation tier |
| TR-equipment-026 | Passive vocabulary: one passive_id per item, 12 in 3 groups; Group A binds battle's four hooks; an unknown passive_id still publishes — battle ignores it fail-soft | — | — Implementation tier |
| TR-equipment-027 | Class-B passives condition on question-content-guaranteed fields: part_of_speech, etymology, example_sentence, distractor lists, tile_letters, first_letter_assist_eligible | — | — Implementation tier |
| TR-equipment-028 | answer_eliminate_two's 2-option removal is a pure deterministic function of (seed, round, wrong set) drawn from battle's seeded stream; equipment owns no RNG | — | — Implementation tier |
| TR-equipment-029 | No same-hook stacking on one round: assembly asserts the property and rejects a violating loadout as a data error, never resolves by priority | — | — Implementation tier |
| TR-equipment-030 | LoadoutSnapshot published on every loadout/level change with the verbatim shape; battle reads it once at start; mid-battle changes affect only the next battle | — | — Implementation tier |
| TR-equipment-031 | Blocked actions (maxed item, no stones, offline) render disabled, never hidden; UI precondition gates run before any commit state is entered | — | — Implementation tier |
| TR-equipment-032 | Seven F3 asserts (def ≤ 120, crit ≤ 100, time advisory 3.0, non-negative stats, hp/atk ≥ base, levels 0–5, no stacking) fail fast; no snapshot on violation | — | — Implementation tier |
| TR-equipment-033 | Passive magnitudes are registry-candidate constants (×1.25, ×1.20, +30, ×1.25, +1.5 s) — equipment owns magnitudes, battle owns the equations | — | — Implementation tier |
| TR-equipment-034 | Concurrent stone application: the server validates stone count and rejects the second whole-commit; the loser re-syncs; no negative counts or double levels | — | — Implementation tier |
| TR-equipment-035 | Stones granted server-side while offline sync on next read — no client-side grant path exists (static assertion) | — | — Implementation tier |
| TR-equipment-036 | Static assertion: the equipment module contains no Math.random, crypto.getRandomValues, Date.now or performance.now — fully deterministic data plus arithmetic | — | — Implementation tier |
| TR-equipment-037 | The stored record carries only {item_levels, stones, equipped} — no derived stat fields; the server recomputes effective stats and rejects divergence | — | — Implementation tier |

### forge-srs — 28 requirements (4 ✅ / 0 ❌ / 24 —)

| TR-ID | Requirement | ADR | Status |
|-------|-------------|-----|--------|
| TR-forge-srs-004 | Ownership split: battle emits cursed_runes in BattleResult (Rule 20 thresholds 6000/11000 ms) consumed as-is; accounts-backend owns server-side queue storage; question-content owns card schema | ADR-0002 | ✅ Accepted |
| TR-forge-srs-005 | The filler draw is the forge module's only randomness consumer and is DI-injected (outside battle's seeded streams) | ADR-0001 | ✅ Accepted |
| TR-forge-srs-006 | On a successful session the forge commit (runes consumed + stone granted) is one atomic commit point per accounts-backend AC-C1 | ADR-0002, ADR-0003 | ✅ Accepted |
| TR-forge-srs-007 | QA-profile delay overrides shorten D1–D3 via build config/server data, never shipped defaults; no criterion waits real hours | ADR-0002 | ✅ Accepted |
| TR-forge-srs-016 | A rune is identified by word_id; a re-drop never duplicates — it resets the rune to Box 1 with a fresh due time and increments its drop count | — | — Implementation tier |
| TR-forge-srs-017 | Every rune sits in one of three boxes with a stored per-rune due timestamp; a rune is eligible iff due_at ≤ now (inclusive) | — | — Implementation tier |
| TR-forge-srs-018 | Session auto-composition pads to 3 cards with forge_filler drawn from the global glossary excluding every word currently in the rune queue (question-content E10 contract) | — | — Implementation tier |
| TR-forge-srs-019 | Forge is non-battle: no countdown, no speed multiplier, no forge timeout — elapsed time feeds no forge formula | — | — Implementation tier |
| TR-forge-srs-020 | Per-card SRS outcome is independent of the all-or-nothing stone verdict, which requires a purification sitting (3 rune cards, all Box 3 at composition, all correct) | — | — Implementation tier |
| TR-forge-srs-021 | No offline forge: entry is blocked offline; queue reads come from the server, never a local cache of game state (AC-C5/AC-C6) | — | — Implementation tier |
| TR-forge-srs-022 | Queue is uncapped at MVP — no forge_queue_cap constant or cap check may exist in data or code (FS24) | — | — Implementation tier |
| TR-forge-srs-023 | Forge session state is client-side view state; the only durable change is the single commit at Resolved, and abandoned sessions leave no resume state | — | — Implementation tier |
| TR-forge-srs-024 | BattleResult.cursed_runes is a deduplicated word_id list with strict 6000/11000 ms thresholds; forge never re-derives an emission | — | — Implementation tier |
| TR-forge-srs-025 | forge_recall payload schema is word_id + direction (en_vi|vi_en) + ≥3 distractors; forge_filler draws from the global glossary pool | — | — Implementation tier |
| TR-forge-srs-026 | Forge grants the Upgrade Stone item and stops there; equipment owns application, the +level curve and its own atomic application commit | — | — Implementation tier |
| TR-forge-srs-027 | The F1 commit timestamp `now` is the server clock at commit; the client clock never gates eligibility | — | — Implementation tier |
| TR-forge-srs-028 | D1/D2/D3 ladder delays (10 min / 24 h / 72 h defaults), forge_session_size and forge_direction_mix are registry-owned data-file constants | — | — Implementation tier |
| TR-forge-srs-029 | due_at is stored per rune server-side as absolute epoch ms, never in the past at write time; the ladder has no daily-reset/calendar semantics | — | — Implementation tier |
| TR-forge-srs-030 | Session selection is fully deterministic: due_at ascending, ties by original drop timestamp then word_id, take first min(R,3) | — | — Implementation tier |
| TR-forge-srs-031 | Slot directions are fixed per slot (1–2 EN→VI, 3 VI→EN) and filler is drawn without replacement, word-distinct from all other cards | — | — Implementation tier |
| TR-forge-srs-032 | On commit failure the client-side retry ladder applies the commit exactly once; exhaustion retains it (AC-C3/C4), blocks new sessions, and never persists partial advancement | — | — Implementation tier |
| TR-forge-srs-033 | A commit referencing a nonexistent rune ID is rejected whole server-side (AC-C2); nothing double-consumes | — | — Implementation tier |
| TR-forge-srs-034 | An open session resolves against a composition snapshot; consumption is validated server-side at commit time, so mid-session emissions never race it | — | — Implementation tier |
| TR-forge-srs-035 | A rune whose word left the current content version is held back and skipped, never deleted automatically; deletion is a manual support action | — | — Implementation tier |
| TR-forge-srs-036 | Eligibility is decided by server time: the queue listing serves only runes due by server clock and commits re-validate consumption server-side | — | — Implementation tier |
| TR-forge-srs-037 | Unit criteria run on a DI-injected fake server clock; no criterion reads the device clock | — | — Implementation tier |
| TR-forge-srs-038 | Global glossary MVP bank is 32 entries with a build-gate floor of 24 (min_global_glossary_size) | — | — Implementation tier |
| TR-forge-srs-039 | Browser storage (localStorage/sessionStorage/IndexedDB) holds no rune-queue or forge state; a fresh browser profile on the same account equals the server queue exactly | — | — Implementation tier |

### hero-class — 30 requirements (2 ✅ / 0 ❌ / 28 —)

| TR-ID | Requirement | ADR | Status |
|-------|-------------|-----|--------|
| TR-hero-class-006 | Exactly 3 classes at MVP, each a data record (stable ids wordsmith|grammarian|arcane, EN/VI names, icon, color, stat block, one passive); all values live in a data file, nothing hardcoded | ADR-0004 | ✅ Accepted |
| TR-hero-class-007 | fast_answer_threshold = 3.0 s (3000 ms) is one shared constant read by both consumers (battle guaranteed-crit rule and Wordsmith trigger); ownership provisionally hero-class's; single change point via the registry | ADR-0004 | ✅ Accepted |
| TR-hero-class-016 | Stat vocabulary is exactly five stats (hp, atk, def, crit, time); mana is battle-economy owned by battle-system and flat +30/+10 for every class; equipment may modify the five but cannot grant mana | — | — Implementation tier |
| TR-hero-class-017 | Class choice is permanent — picked during onboarding, fixed to the account for life, persisted by accounts-backend in the player profile and authoritative every session | — | — Implementation tier |
| TR-hero-class-018 | Pinned baseline stat blocks (Wordsmith 380/80/30/12/+0.0 s; Grammarian 420/62/55/6/+1.0 s; Arcane 360/72/38/9/+0.5 s) as authored baseline; retune only via the tuning process | — | — Implementation tier |
| TR-hero-class-019 | Hero-class owns each passive's trigger condition and effect magnitude; battle-system owns the formulas that apply the effect | — | — Implementation tier |
| TR-hero-class-020 | Wordsmith passive: correct vocab_strike answered in under 3 s multiplies that strike's damage by 1.2 — vocab_strike rounds only, never stacking with listening/ultimate identities | — | — Implementation tier |
| TR-hero-class-021 | Grammarian passive: +60 flat shield (def-independent, not entering shield = 80 + def × 0.3) each time the correct streak reaches a multiple of 3 within one battle | — | — Implementation tier |
| TR-hero-class-022 | Arcane passive: correct listening_pierce damage multiplied by 1.20 unconditionally (not speed-gated); re-scoped 2026-11-09 from the provably inert ×1.35 mana-rate passive | — | — Implementation tier |
| TR-hero-class-023 | Sub-3-second guaranteed crit (×1.25) is a battle rule for all classes; Wordsmith's ×1.2 stacks multiplicatively on top (×1.2 × 1.25 × speed multiplier) | — | — Implementation tier |
| TR-hero-class-024 | Round countdown = base_time + hero.time for every round type, unconditional; battle-system owns base_time (10 s in the prototype) | — | — Implementation tier |
| TR-hero-class-025 | Ghost opponents carry a ClassId for display only at MVP — no passive evaluation, resolved by accuracy rolls; passive data kept in records so post-MVP enablement needs no schema change | — | — Implementation tier |
| TR-hero-class-026 | Hero-class is stateless at runtime; only profile state is ClassUnpicked → ClassPicked, with ClassPicked terminal | — | — Implementation tier |
| TR-hero-class-027 | Effective stats are derived data (effective_stat = base_stat + equipment_bonus) assembled by equipment into the LoadoutSnapshot; hero-class never computes effective stats | — | — Implementation tier |
| TR-hero-class-028 | Grammarian proc count = Σ floor(runᵢ / 3), equivalently proc when run_correct mod 3 == 0 with reset on wrong answer or timeout; re-trigger clause dormant at MVP battle length 4 | — | — Implementation tier |
| TR-hero-class-029 | Passive magnitudes (wordsmith_fast_answer_mult 1.2, grammarian_shield_flat 60, arcane_listening_damage_mult 1.20) live in the class data file, consumed by battle-system formulas | — | — Implementation tier |
| TR-hero-class-030 | grammarian_proc_streak = 3 lives in the data file as the F1 parameter consumed by battle-system streak counting | — | — Implementation tier |
| TR-hero-class-031 | Arcane multiplier is stored as a float rate (1.20), no damage integer; battle applies it inside B4 defaulting to 1.0 for non-Arcane classes and rounds once at B4's end | — | — Implementation tier |
| TR-hero-class-032 | Consumption contract table pins five downstream formulas (round_time, shield, speedMult, guaranteed crit, B4 listening damage, effective_stat) and the exact hero-class input each reads | — | — Implementation tier |
| TR-hero-class-033 | Exactly 3000 ms is not fast — strict elapsed_ms < 3000, same comparison operator and same elapsed measurement (question display → answer commit) for both consumers, on battle's deterministic tick model | — | — Implementation tier |
| TR-hero-class-034 | Equipment modifies only the five stats — no item may alter passive magnitudes or thresholds, and stat-involving triggers evaluate against effective stats | — | — Implementation tier |
| TR-hero-class-035 | Battle-system clamps the countdown for negative/very-large effective time (recommended floor ≥ 5 s); hero-class takes no clamp of its own | — | — Implementation tier |
| TR-hero-class-036 | Wordsmith's ×1.2 keys on round_type == vocab_strike, never on question tags — a vocab question drawn into another round type gets no bonus | — | — Implementation tier |
| TR-hero-class-037 | Open interface items battle-system owes: elapsed-time timestamp pair per round type + which round types are attack rounds; shield-pool cap/decay rules | — | — Implementation tier |
| TR-hero-class-038 | Mandatory per-class identity fields: icon (lucide set), accent colors (rose #F43F5E, emerald #10B981, violet #8B5CF6), EN + VI names, Vietnamese passive display text shown verbatim | — | — Implementation tier |
| TR-hero-class-039 | AC-HC1: registry contains exactly 3 records with distinct stable ids and exactly the keys hp/atk/def/crit/time (no mana key); no stat or passive value defined in source code — editing the data file changes what the registry serves | — | — Implementation tier |
| TR-hero-class-040 | Both fast_answer_threshold consumers read the same constant and the same elapsed measurement — pinned by boundary tests at 2999/3000 ms | — | — Implementation tier |
| TR-hero-class-041 | Class id persisted to the player profile, served as authoritative on a new session after logout/re-login, and no MVP surface or data path may change it — ClassPicked is terminal | — | — Implementation tier |
| TR-hero-class-042 | Pick screen renders the full class records (EN/VI names, icons, hex accent colors, passive text) and must state the choice is permanent before an explicit confirm action | — | — Implementation tier |
| TR-hero-class-043 | OQ4: whether post-MVP class switching should be schema-tolerated (e.g. class_history field) must be decided before the accounts-backend schema freeze | — | — Implementation tier |

### localization — 26 requirements (0 ✅ / 0 ❌ / 26 —)

| TR-ID | Requirement | ADR | Status |
|-------|-------------|-----|--------|
| TR-localization-018 | Copy ownership boundary: localization owns the catalog and its machinery; every copy's meaning originates upstream — it may reject a rule-violating entry but never rewrite meaning | — | — Implementation tier |
| TR-localization-019 | Extraction keys are immutable dot-separated surface-anchored contracts; a rename is deprecate-old + add-new + migration entry, never an in-place rename | — | — Implementation tier |
| TR-localization-020 | One locale ships at Alpha (vi-VN, complete): every reference key resolves to an authored vi value (F1 gate); `keep_en: true` exempts proper nouns from the placeholder test only | — | — Implementation tier |
| TR-localization-021 | Missing-key fallback: release build hard-fails, dev warns; at runtime the EN placeholder renders, never the raw key; the miss is logged for the sweep | — | — Implementation tier |
| TR-localization-022 | Formatting is inherited, never redefined: vi-VN grouping, countdown, RP signs consumed as locale data; `{token}` values pass the shared formatter before insertion; fragment concatenation forbidden | — | — Implementation tier |
| TR-localization-023 | Content English is never localized away; `vi_meaning` glosses are question-content-owned, exposed as keyed fields but never authored or edited here | — | — Implementation tier |
| TR-localization-024 | Bilingual surfaces follow the pair rule: one key carries a defined VI-label + EN-term pair pattern; pairing is never improvised per surface | — | — Implementation tier |
| TR-localization-025 | Honesty copy is translated exactly once; keys flagged `fidelity: exact`; a duplicate normalized disclosure string among fidelity-exact keys is release-blocking (F3) | — | — Implementation tier |
| TR-localization-026 | No truncation: layouts size to the longer of the vi and EN strings; ellipsis/truncation of player-facing copy is a spec violation | — | — Implementation tier |
| TR-localization-027 | No server-authored copy: accounts-backend sends codes, not sentences; rendering a raw server string is forbidden (server text is untrusted copy) | — | — Implementation tier |
| TR-localization-028 | The no-hardcoded-strings sweep is release-blocking: a release build containing a player-facing literal string fails; dev builds warn | — | — Implementation tier |
| TR-localization-029 | Key lifecycle Draft→Translated→Reviewed→Shipped→Deprecated, machine-readable in the catalog build; Deprecated keys excluded from F1's reference set, retained during a migration window | — | — Implementation tier |
| TR-localization-030 | Catalog locale state: vi-VN Shipped is the only shipped locale at Alpha; a Scaffolded locale has no release path (F1 runs per-shipped-locale) | — | — Implementation tier |
| TR-localization-031 | F1 coverage gate: coverage = authored-vi keys / reference keys, release gate at exactly 1.0 (not tunable below); derived `en_placeholder_debt` logged for the Alpha burndown | — | — Implementation tier |
| TR-localization-032 | F2 length-ratio warning: ratio = len(vi)/max(len(en),1), flag for layout check when > `r_max` (default 1.5, tunable 1.3–2.0); soft warning, never a release gate | — | — Implementation tier |
| TR-localization-033 | F3 honesty uniqueness gate: instances(s) = 1 for every disclosure string under lowercase + whitespace-collapse normalization; duplicate_strings = 0 is release-blocking; fuzzy matching deliberately rejected | — | — Implementation tier |
| TR-localization-034 | Catalog-integrity build gates: key-regex violation, empty placeholder, missing context note, token-set mismatch, dangling key reference (keys derived from a code scan), deprecated key referenced after its window, missing/schema-invalid locale data — each fails the build | — | — Implementation tier |
| TR-localization-035 | An unmapped server error code renders the generic keyed error (`errors.generic`), never the raw code or server text; the miss is logged for the mapping table's revision | — | — Implementation tier |
| TR-localization-036 | vi-VN inflects no plurals: a plural family carries exactly one vi form rendered for every count; the schema reserves plural structure for future locales (inert at Alpha) | — | — Implementation tier |
| TR-localization-037 | Font stack must include precomposed Vietnamese glyphs in every text style; a missing glyph is a build-time font-audit failure, not a runtime surprise | — | — Implementation tier |
| TR-localization-038 | Line-height must tolerate stacked diacritics/descenders unclipped (including scaled text); bilingual pairs render as one text run, never two stitched strings | — | — Implementation tier |
| TR-localization-039 | The shipped locale's catalog is bundled with the client — no network fetch between a screen mounting and its copy appearing (zero missing-text flash) | — | — Implementation tier |
| TR-localization-040 | Copy changes are data, not reflows: state-driven text swaps in place; locale switches apply at screen transitions, never mid-surface | — | — Implementation tier |
| TR-localization-041 | No new screens at Alpha: no language picker, no locale settings surface, no translation-review screen in the client (review is a content-pipeline activity) | — | — Implementation tier |
| TR-localization-042 | Key states must be machine-readable in the catalog build; the server error-code set is imported from accounts-backend's contract artifact, never hand-copied | — | — Implementation tier |
| TR-localization-043 | ui-shell is the hard contract: its key inventory, F-UI2 (consumed as locale data, never redefined) and UI-AC21 sweep (promoted to this GDD's release gate) formalize the discipline | — | — Implementation tier |

### meta-progression — 30 requirements (4 ✅ / 0 ❌ / 26 —)

| TR-ID | Requirement | ADR | Status |
|-------|-------------|-----|--------|
| TR-meta-progression-002 | Ledger application is event-driven and exactly-once, keyed on the battle's persisted seed; a re-delivered BattleResult produces zero ledger change and meta never recomputes a reward from battle state | ADR-0002, ADR-0003 | ✅ Accepted |
| TR-meta-progression-003 | The board resets at the Asia/Ho_Chi_Minh day boundary on the server clock (fixed, no DST); unclaimed Claimable rewards expire and are lost silently | ADR-0002, ADR-0003 | ✅ Accepted |
| TR-meta-progression-014 | MP2 ledger_apply: applied_seeds is an AB-stored set of committed seeds, never pruned; gold+xp+seed are written in one atomic commit and re-delivery computes (0,0) | ADR-0003 | ✅ Accepted |
| TR-meta-progression-017 | Meta owns exactly four stores (gold ledger, XP ledger + hero level, daily quest board, study-board counters); reward emission is battle's, storage is accounts-backend's, no sinks exist | ADR-0002 | ✅ Accepted |
| TR-meta-progression-019 | An event carrying an unknown reward type is rejected fail-fast naming the emitter — never clamped, no partial ledger write | — | — Implementation tier |
| TR-meta-progression-020 | Final reward values are owned here (victory gold 120 / boss 250 / defeat 40; xp 180/60); battle's Rule 21 table is a mirrored copy, not the authority | — | — Implementation tier |
| TR-meta-progression-021 | Hero level = floor(cumulative_xp / xp_per_level) + 1 with flat xp_per_level = 1000 and no level cap (level gates nothing at MVP) | — | — Implementation tier |
| TR-meta-progression-022 | The daily board is a fixed 4-quest MVP set; the tower quest keys on committed victories with encounter ∈ {tower_stage, tower_boss}, deliberately not tower's first-clear-only floor_cleared event | — | — Implementation tier |
| TR-meta-progression-023 | Quest progress is event-mapped, never self-computed: committed BattleResult events, forge rune-card outcomes read from AB-stored forge session records (no live forge interface), encounter type from the commit; floor_cleared is not a source | — | — Implementation tier |
| TR-meta-progression-024 | Claim is the only manual act and a commit point: one atomic commit (accounts-backend commit family) grants the reward, marks Claimed and clamps progress at goal; no partial or double claim | — | — Implementation tier |
| TR-meta-progression-025 | streak = consecutive calendar days each containing at least one committed BattleResult of any outcome; lazily evaluated, no reset timer | — | — Implementation tier |
| TR-meta-progression-026 | mastered_words = count of distinct purified word ids from forge purification records; meta owns the aggregation, forge owns purification semantics | — | — Implementation tier |
| TR-meta-progression-027 | A new account starts at gold 0, xp 0, level 1, streak 0, mastered_words 0, fresh board generated at first login of the server day; prototype demo values are fixtures only | — | — Implementation tier |
| TR-meta-progression-028 | Ledgers are stored as integers (AB-stored contract); every ledger-writing step sits inside one accounts-backend atomic commit keyed by the battle seed (MP2) — the single idempotency anchor shared by MP2, MP3 and MP5 | — | — Implementation tier |
| TR-meta-progression-029 | Quest progress is additive with min(goal, ·) clamping, except COMBO which is a threshold source (max(progress, indicator), one write per battle, never a sum) | — | — Implementation tier |
| TR-meta-progression-030 | A claim pays only if committed strictly before the boundary swap on the server clock; the reset is an atomic board swap | — | — Implementation tier |
| TR-meta-progression-031 | The streak update runs in the same atomic commit and under the same seed key as MP2, writing last_battle_day (AB-stored) | — | — Implementation tier |
| TR-meta-progression-032 | mastered_words uses set semantics (P AB-stored from forge purification records) — duplicate-safe and order-safe, needing no idempotency key | — | — Implementation tier |
| TR-meta-progression-033 | 15 registry-candidate constants (xp_per_level, 5 mirrored reward values, 4 quest rewards, 3 quest goals + combo3_threshold, daily_reset_tz) are named, with battle keeping only the mirrored emission table | — | — Implementation tier |
| TR-meta-progression-034 | The consumption contract fixes the BattleResult field set consumed (seed, gold_event, xp_event, encounter, victory, max_combo) and the full state produced for AB storage and ui-shell rendering | — | — Implementation tier |
| TR-meta-progression-035 | A claim racing the daily reset is validated server-side against the current board: processed after the swap it is rejected whole with no reward and no cross-board carry | — | — Implementation tier |
| TR-meta-progression-036 | Concurrent claims from two devices follow whole-commit rejection — first commit wins, second rejected; the reward is paid exactly once | — | — Implementation tier |
| TR-meta-progression-037 | The streak/day boundary is a fixed server-clock rule; client clocks never decide anything (mirrors forge's server-time eligibility) | — | — Implementation tier |
| TR-meta-progression-038 | Quest progress, board and streak all key on the commit day (server clock), not the play-start day; re-deliveries map by their own commit day but seed idempotency still zeroes ledger and quest effects | — | — Implementation tier |
| TR-meta-progression-039 | The forge-5 quest accrues only from rune-card outcomes in committed forge session records; filler-card outcomes never count (question-content E10, enforced by forge's filler draw) | — | — Implementation tier |
| TR-meta-progression-040 | Meta has no background accrual: every write sits on a player-initiated commit-time path, so an offline player's ledgers cannot change | — | — Implementation tier |
| TR-meta-progression-041 | Unit criteria run on a DI-injected fake server clock (Asia/Ho_Chi_Minh boundary); no criterion reads the device clock and none sleeps | — | — Implementation tier |
| TR-meta-progression-042 | The module references xp_per_level by name with no local 1000 literal (static assertion) — constants live in the shared registry, not local copies | — | — Implementation tier |
| TR-meta-progression-043 | No cap, decay or replay-counter constant or state exists for replay farming — uncapped by design, a cap would be a deliberate post-MVP addition re-opening Core Rule 6 | — | — Implementation tier |
| TR-meta-progression-044 | One battle commit moves ledgers, both quests, streak and last_battle_day in ONE atomic seed-keyed commit — all five effects or none on mid-commit failure (whole-commit rejection) | — | — Implementation tier |

### opponent-ai — 21 requirements (5 ✅ / 0 ❌ / 16 —)

| TR-ID | Requirement | ADR | Status |
|-------|-------------|-----|--------|
| TR-opponent-ai-008 | F2 rule 1: deterministic seedable platform-stable PRNG, uniform [0,1), same sequence on every browser; Math.random never; algorithm is ADR territory | ADR-0001 | ✅ Accepted |
| TR-opponent-ai-009 | F2 rule 2: one stream per battle, seeded exactly once from battle's uint64 seed, never re-seeded mid-battle | ADR-0001 | ✅ Accepted |
| TR-opponent-ai-010 | Consumption discipline: exactly one draw per round in strict round order, nothing else draws, no re-draw; the ghost sequence depends only on (seed, profile) | ADR-0001 | ✅ Accepted |
| TR-opponent-ai-011 | F2 rule 5: draws convert once to fixed-point integers in [0, 2^53) and compare strictly < against accuracy_threshold = round(accuracy × 2^53) | ADR-0001 | ✅ Accepted |
| TR-opponent-ai-014 | QA statistical surface: over N ≥ 1000 seeded battles, per-tier frequency within ±0.03 of p and per-battle counts pass a Binomial(4, p) goodness-of-fit at α = 0.01 | ADR-0001 | ✅ Accepted |
| TR-opponent-ai-017 | The ghost is a deterministic resolver: ghost_correct = roll < accuracy from a seeded stream, exactly one roll per round, strict comparison; result final, never re-rolled | — | — Implementation tier |
| TR-opponent-ai-018 | The resolver is question-unaware: it receives only round context (encounter type, round index), never question payload content or answer | — | — Implementation tier |
| TR-opponent-ai-019 | GhostProfile records (ghost_id, display_name, class_ref, accuracy, hp, is_boss, flavor_note) live in a data file, unique ids, no identity in source code | — | — Implementation tier |
| TR-opponent-ai-020 | Accuracy is per-encounter-type data (0.65/0.70/0.55/0.75) with GhostProfile override precedence; ghost_hp_* values are emitted as data — battle applies them | — | — Implementation tier |
| TR-opponent-ai-021 | Ghost class_ref is display identity only — no passive evaluation at MVP; passive data stays in class records so post-MVP enablement needs no schema change | — | — Implementation tier |
| TR-opponent-ai-022 | answer_reveal_delay_ms is fixed data per encounter type (1000/800/1200/1500, no RNG); battle owns all scheduling; opponent-ai never renders | — | — Implementation tier |
| TR-opponent-ai-023 | Profiles carry honest-ghost display material (fictional names, ranked ghost-duel disclosure) that ui-shell must render; no fabricated-online-count fields | — | — Implementation tier |
| TR-opponent-ai-024 | Emit-only contract: the resolver returns exactly {correct, answer_reveal_delay_ms} — no damage, HP mutation, mana field or question selection | — | — Implementation tier |
| TR-opponent-ai-025 | F2 rule 6: once the ADR picks the algorithm, its seed→draw vectors are pinned as test fixtures (the fixtures pin the behavior) | — | — Implementation tier |
| TR-opponent-ai-026 | F2 rule 7: post-MVP draw types must append after existing draws, never reorder or insert, so recorded battles still replay identically | — | — Implementation tier |
| TR-opponent-ai-027 | Battle-system must guarantee: one uint64 seed per battle, it never draws from the ghost stream, and all other randomness uses independent streams | — | — Implementation tier |
| TR-opponent-ai-028 | The ghost's roll participates in no mana arithmetic — no hidden draws added for mana; battle-side formula changes cannot desynchronize ghost sequences | — | — Implementation tier |
| TR-opponent-ai-029 | A missing or invalid seed fails fast — never a silent Math.random or unseeded fallback path | — | — Implementation tier |
| TR-opponent-ai-030 | Accuracy overrides outside 0.40–0.90 are clamped by the profile loader with an authoring warning — runtime clamping because profiles have no build gate | — | — Implementation tier |
| TR-opponent-ai-031 | An unknown class_ref fails at profile load (fail fast) — no default-class fallback exists | — | — Implementation tier |
| TR-opponent-ai-032 | GhostProfiles ship as static client-side config at MVP; moving them to accounts-backend's versioned payload is a contract change, not a config edit | — | — Implementation tier |

### question-content — 28 requirements (10 ✅ / 0 ❌ / 18 —)

| TR-ID | Requirement | ADR | Status |
|-------|-------------|-----|--------|
| TR-question-content-006 | All content hand-authored as data (JSON/TS data modules in a content directory) — no procedural generation, no runtime authoring UI at MVP | ADR-0004 | ✅ Accepted |
| TR-question-content-007 | One global content version — deliverable is a single versioned payload (version + banks); any content change bumps the version; per-module versioning post-MVP would be a contract change | ADR-0002 | ✅ Accepted |
| TR-question-content-012 | System owns only the "what": no mixing policy, no scheduling, no delivery/caching, no mastery records, no per-question difficulty field, and no selection/mixing/scheduling API in its exports | ADR-0002, ADR-0004 | ✅ Accepted |
| TR-question-content-017 | One schema family: base shape (id, type, module, cefr, prompt) plus 6 typed payloads in a discriminated union (vocab_strike, grammar_shield, listening_pierce, spell_challenge, forge_recall, forge_filler) with per-type required fields | — | — Implementation tier |
| TR-question-content-018 | Strict schema: a payload carrying a field not in its type's schema fails the build; adding a field means changing the schema first | — | — Implementation tier |
| TR-question-content-019 | Glossary entries are the atoms — questions reference word_id, never inline strings; fields include term, vi_meaning, ipa, tts_text, part_of_speech, cefr, module_tags[], etymology, example_sentence, status (active|deprecated) | — | — Implementation tier |
| TR-question-content-020 | Pools keyed module × round-type (battle) and module × stage incl. separate boss pool (tower, 3 stages + boss); forge_recall built at runtime from the rune queue, forge_filler drawn from the global glossary | ADR-0005 | ✅ Accepted |
| TR-question-content-021 | Ownership split: schema/bank/validation here; mixing to battle-system, stage selection to tower, card selection + SRS scheduling to forge-srs, delivery to accounts-backend | — | — Implementation tier |
| TR-question-content-022 | Validation is a build gate failing the build on duplicate ids, unresolvable word_id, missing required fields, distractor count/answer violations, cefr-band mismatch, listening entries missing both tts_text and ipa | — | — Implementation tier |
| TR-question-content-023 | Authoring-side lifecycle states Draft → Validated → Published → Superseded; Draft never eligible for a payload; Superseded invalidates client caches at next full load | — | — Implementation tier |
| TR-question-content-024 | speech-io consumes tts_text + ipa from listening_pierce payloads; fields exist here so degraded-mode fallback never needs a schema change | — | — Implementation tier |
| TR-question-content-025 | Equipment passives consume word-entry fields — Etymology Charm → etymology, 50/50 → distractor lists, first-letter assist → term; this system guarantees the fields exist and are populated | — | — Implementation tier |
| TR-question-content-026 | MVP battle draws exactly k = 1 per round; a tower stage battle is the standard 4-round shape drawing k = 1 per round from the mixed module × stage pool under battle Rule 22 (composition gate ≥ 1 per round-type) | ADR-0005 | ✅ Accepted |
| TR-question-content-027 | All five pool constants live in ONE content-config data file (content/config/pool-minimums.ts) consumed by the build gate; battle-system, tower and forge-srs read the same constants — never hardcode | ADR-0005 | ✅ Accepted |
| TR-question-content-028 | Battle-pool build gate: N_battle ≥ min_battle_pool_size, default 8, per module × round-type | ADR-0005 | ✅ Accepted |
| TR-question-content-029 | Tower stage-pool build gate: N_stage ≥ 6 per module × stage (non-boss) plus composition gate ≥ 1 question per round-type | ADR-0005 | ✅ Accepted |
| TR-question-content-030 | Tower boss-pool build gate: N_boss ≥ 4 per module × boss, composition gate applies too | ADR-0005 | ✅ Accepted |
| TR-question-content-031 | Global glossary build gate: N_glossary ≥ 24 (MVP bank target 32 as authoring target, not gate); per-module distinct words ≥ 8 checked alongside pool counts | — | — Implementation tier |
| TR-question-content-032 | battles_before_repeat = floor(N_pool / k) with design rule battles_before_repeat ≥ 2 × battles_per_typical_session per mode | ADR-0005 | ✅ Accepted |
| TR-question-content-033 | Duplicate vi_meaning pair in the glossary alone is a build warning; the same pair inside one vi_en question (answer + distractors) is a build failure | — | — Implementation tier |
| TR-question-content-034 | listening_pierce with ipa but no tts_text is playable (tts_text defaults to term); missing both fails the build | — | — Implementation tier |
| TR-question-content-035 | tile_letters multiset must equal the term's letter multiset (case-insensitive, duplicates included) or the build fails | — | — Implementation tier |
| TR-question-content-036 | Hard deletion of a word referenced by live player state is forbidden — deprecate via status while any live word_id reference exists; forge-srs skips unresolvable cards (provisional); live state persists in accounts-backend across content versions | — | — Implementation tier |
| TR-question-content-037 | A module declaring tower content must declare the complete floor (3 stage pools + boss pool) or the build fails | — | — Implementation tier |
| TR-question-content-038 | No runtime pool-size check — pools gated at authoring only; trust the shipped version | — | — Implementation tier |
| TR-question-content-039 | forge_filler draw must exclude the player's current cursed-rune words (exclusion rule part of the filler pool contract here; forge-srs owns the draw) | — | — Implementation tier |
| TR-question-content-040 | Duplicate ids fail the build with file + id reported; no partial payload is ever produced | — | — Implementation tier |
| TR-question-content-041 | Payload must be render-complete — empty prompt or vi_meaning treated as a missing required field and fails the build | — | — Implementation tier |

### ranked-league — 27 requirements (8 ✅ / 0 ❌ / 19 —)

| TR-ID | Requirement | ADR | Status |
|-------|-------------|-----|--------|
| TR-ranked-league-001 | Persisted ranked state is one RP integer plus season objects (roster blob, placement record, applied-commit keys); tier/division derived on read, never stored. | ADR-0002 | ✅ Accepted |
| TR-ranked-league-004 | Ranked RP commits are server-computed: the backend verifies the outcome against battle seed + submitted answer log before applying any delta. | ADR-0003 | ✅ Accepted |
| TR-ranked-league-005 | The battle→RP commit is atomic with the battle result and seed-keyed exactly-once (same-seed re-delivery is a no-op). | ADR-0002, ADR-0003 | ✅ Accepted |
| TR-ranked-league-006 | Failed server verification refuses the RP delta: RP and history stay exactly pre-commit and the rejection is recorded against the account. | ADR-0003 | ✅ Accepted |
| TR-ranked-league-009 | Ranked module rotates daily over the four modules by server date, reusing existing module × round-type pools (no new pool type). | ADR-0001 | ✅ Accepted |
| TR-ranked-league-010 | RL3: peer board = H(season_id‖account_id‖i); season blob stores base_i/mastered_i/streak_i; daily drift ±20 stateless per (peer, day), recomputed. | ADR-0001 | ✅ Accepted |
| TR-ranked-league-011 | RL3: H is the PRNG-ADR-pinned hash; rng_int = lo + H(seed) mod (hi−lo+1); ADR must bless modulo-bias handling (ranges here ≤ 501). | ADR-0001 | ✅ Accepted |
| TR-ranked-league-018 | accounts-backend (Hard) owns RP total + history storage, identity, server clock (season boundary, rotation, grace) and ranked outcome validation. | ADR-0002 | ✅ Accepted |
| TR-ranked-league-019 | RP deltas (+28 win / −14 loss) reach the ladder only via committed BattleResults with encounter=ranked, applied through accounts-backend; friend/tower never touch it. | — | — Implementation tier |
| TR-ranked-league-020 | New account initializes at RP 0 (Bronze III); the prototype's 1420 start is a demo fixture kept out of the initialization path. | — | — Implementation tier |
| TR-ranked-league-021 | Demotion is automatic unprotected re-derivation — no shield, grace-game or decay state exists at Alpha. | — | — Implementation tier |
| TR-ranked-league-022 | Queue composes encounter config {encounter: ranked, RL4 module, GhostProfile 0.70/500/800 ms from opponent-ai's registry, LoadoutSnapshot, seed}; no matchmaking stage. | — | — Implementation tier |
| TR-ranked-league-023 | Season = Monday 00:00 → Sunday 24:00 Asia/Ho_Chi_Minh; 14-peer group drawn deterministically from season_id + account identity; RP never resets at rollover. | — | — Implementation tier |
| TR-ranked-league-024 | PvP tab sorts by RP desc, Study tab by mastered_words desc then streak desc; zone highlights are presentation mirrors granting nothing. | — | — Implementation tier |
| TR-ranked-league-025 | Study payload adopted verbatim: {mastered_words, streak} read through accounts-backend; no per-word detail or battle-only streak variant. | — | — Implementation tier |
| TR-ranked-league-026 | A started ranked battle with no committed result within the 15-min grace window (ranked_forfeit_grace_min, blessed 15, safe band 10–30, measured from started_at — ADR-0003 §4; client events do not extend it) records one forfeit: −14, no rewards/runes. | — | — Implementation tier |
| TR-ranked-league-027 | Ranked-league emits data-only semantics (colors, zones, labels, transitions as data); all rendering is ui-shell's. | — | — Implementation tier |
| TR-ranked-league-028 | Season transitions Active → Settling at Monday 00:00 ICT and back; the per-account league group (Live/Settled) is wiped at next rollover. | — | — Implementation tier |
| TR-ranked-league-029 | RL1: tier/division resolver is integer-only, pure function of rp; floors 0/1000/1300/1600/1900 data-file; GM virtual next-floor 2200 caps span. | — | — Implementation tier |
| TR-ranked-league-030 | RL2: rp' = max(rp + Δ, 0) — ladder floors at 0, unclamped above; result is the single stored integer. | — | — Implementation tier |
| TR-ranked-league-031 | RL4: days_ict = floor((unix_time_ms + 7×3600000) ÷ 86400000), module = MODULES[days_ict mod 4], from the server clock. | — | — Implementation tier |
| TR-ranked-league-032 | RL5: season_id = floor((days_ict+3) ÷ 7), monotonic, incrementing only at days_ict ≡ 4 (mod 7); epoch-day arithmetic, no leap/DST failure (E14). | — | — Implementation tier |
| TR-ranked-league-033 | A result submitted after forfeit is recorded is rejected whole (first resolution wins); forfeit recording idempotent; non-ranked never enters forfeit machinery. | — | — Implementation tier |
| TR-ranked-league-034 | Season boundary, rotation day, grace window and board day all key on the server clock; the client never decides a boundary. | — | — Implementation tier |
| TR-ranked-league-035 | Sort ties break by identity string in code-unit lexicographic UTF-8 byte order, never locale-aware collation. | — | — Implementation tier |
| TR-ranked-league-036 | A ranked commit racing a quest claim goes through whole-commit rejection; RP and quest rewards never merge into a partial write. | — | — Implementation tier |
| TR-ranked-league-037 | Analytics (downstream, post-MVP) receives RP events, season rollover and forfeit events as telemetry. | — | — Implementation tier |

### real-pvp — 26 requirements (3 ✅ / 1 ❌ / 22 —)

| TR-ID | Requirement | ADR | Status |
|-------|-------------|-----|--------|
| TR-real-pvp-002 | B-series from one shared module ("one formula module, two hosts"); formula drift = build failure; package extracted + server-tested before PvP work (OQ-RVP1). | ADR-0004 | ✅ Accepted |
| TR-real-pvp-003 | Server draws one shared question set (k=1, ≥ 8 gates); per-round delivery, never bundled at Matched; F5 no-repeat guard runs server-side. | ADR-0003 | ✅ Accepted |
| TR-real-pvp-016 | Server runs the round engine and owns question draw, clocks, validation, RNG (server-seeded), damage, verdict; clients compute nothing consequential. | ADR-0003 | ✅ Accepted |
| TR-real-pvp-018 | Answer privacy: a commit is never revealed to the opponent before resolve; the resolve payload broadcasts to both clients simultaneously. | — | — Implementation tier |
| TR-real-pvp-019 | Shared window W = max of both players' B1 clocks; a commit past the personal deadline is recorded, scored as timeout (elapsed clamped, B2 1.0, void). | — | — Implementation tier |
| TR-real-pvp-020 | Attacker deals verbatim B-series output; defender mitigates via B9 shape (25% ceiling), shield-first from own B6 pool; own LoadoutSnapshot hero HP. | — | — Implementation tier |
| TR-real-pvp-021 | Mana, shield pool, counters, combo and ultimate_mana_gate 90 run independently per player. | — | — Implementation tier |
| TR-real-pvp-022 | Verdict = B12 HP-fraction comparison with tie → draw; draw pays 0 RP and moves no streak; PvP owns the tie rule, battle's B12 untouched. | — | — Implementation tier |
| TR-real-pvp-023 | PvP outcomes emit +28/−14/0 (draw) into ranked-league's ladder; ranked-league owns tiers/divisions/seasons. | — | — Implementation tier |
| TR-real-pvp-024 | PvP is a separate encounter type (ranked_pvp), optional by construction: nothing depends on it; disabling degrades nothing. | — | — Implementation tier |
| TR-real-pvp-025 | Server pairs queued players by widening RP band; no client-chosen opponents at launch. | — | — Implementation tier |
| TR-real-pvp-026 | At T_max 45 s (re-evaluated every 45 s, band frozen at cap) the client chooses keep-waiting or labelled ghost duel; never a silent substitution. | — | — Implementation tier |
| TR-real-pvp-027 | 20 s disconnect grace (R5): reconnect restores full server snapshot, engine never pauses; expiry forfeits −14/+28, KO > forfeit precedence. | — | — Implementation tier |
| TR-real-pvp-028 | Server validates every answer against the content bank and every elapsed against its own timestamps; pre-round-start commits rejected invalid. | — | — Implementation tier |
| TR-real-pvp-029 | Credited elapsed = server clock − min(RTT/2, 250 ms); RTT measured by server ping/echo + EWMA; client-reported timing never trusted. | — | — Implementation tier |
| TR-real-pvp-030 | Server-owned lifecycle state machine Idle→Queueing→Matched→Countdown→Round(n)→Resolving→(Interrupted)→Verdict→PostMatch; KO ends match immediately. | — | — Implementation tier |
| TR-real-pvp-031 | R2: band(t) = min(B_cap, B_start + 50 × floor(t/9)), consent min(band_A, band_B); GM start 200/cap 350; Bronze-vs-GM impossible by construction. | — | — Implementation tier |
| TR-real-pvp-032 | R4: resolves at t_both_done (never second commit alone); broadcast after 1000 ms beat, next round +100 ms; post-t_both_done commits rejected whole. | — | — Implementation tier |
| TR-real-pvp-033 | R6: simultaneous KO resolves by strict compare of pre-round HP fractions, exact tie → draw — deterministic, no RNG, no seed. | — | — Implementation tier |
| TR-real-pvp-034 | R7: mitigation round_half_up(incoming × (1 − min(0.25, max(0,def)/600))) + shield-first; dead 0.25 branch kept for shared module; pierce armor-only. | — | — Implementation tier |
| TR-real-pvp-035 | N1: three-exchange clock sync, θ* = median offset, monotonic clock only (never Date.now()); skew > 500 ms forces re-sync; second failure dissolves match. | — | — Implementation tier |
| TR-real-pvp-036 | N2: per-step queue timeouts (enqueue 5 s ×2, snapshot 5 s, sync 3 s) with honest outcomes; no fabricated queue counts or search animation. | — | — Implementation tier |
| TR-real-pvp-037 | N3: ordered reliable channel ≤ 100 ms added latency; envelope {v:1, type, match_id, seq, t_server, payload}, unknown type dropped; ≤ 6 KB burst, < 1 KB/s. | — | — Implementation tier |
| TR-real-pvp-038 | Simultaneous disconnect voids the match (0 RP both, no ranked record); server restart dissolves in-flight matches while committed PostMatch records persist. | — | — Implementation tier |
| TR-real-pvp-039 | Provisional: question draw API must be server-callable with same build gates; speech quality scored server-side (OQ-RVP3); ladder needs PvP-source + draw events. | ADR #8 — server-side speech scoring (OQ-RVP3; server-callable draw also rides ADR #7) | ❌ Pending ADR |
| TR-real-pvp-040 | Cross-host golden test: shared-module damage outputs must equal ghost-battle outputs for identical inputs (blocked-by OQ-RVP1). | — | — Implementation tier |

### speech-io — 30 requirements (1 ✅ / 0 ❌ / 29 —)

| TR-ID | Requirement | ADR | Status |
|-------|-------------|-----|--------|
| TR-speech-io-008 | All quality passes one interface `score(target_word, attempt) → quality ∈ [0,1]`; MVP `SimulatedScorer` (random 0.88–0.98) is replaceable by a real engine without gameplay changes | ADR-0003 | ✅ not-preclude contract |
| TR-speech-io-016 | Speech-io is a service layer, not a game state owner: owns rendering, capability detection, fallback selection, quality scoring; no battle state/timer/question data/SFX | — | — Implementation tier |
| TR-speech-io-017 | Listening rounds consume the question payload's `tts_text` (consumers read an effective value; speech-io never substitutes the `term` default) and optional `ipa` | — | — Implementation tier |
| TR-speech-io-018 | Playback never gates the round (timer starts at options-actionable, BS7); replays never reset/pause/extend the timer; playback is cut immediately at commit | — | — Implementation tier |
| TR-speech-io-019 | Fallback ladder per question: L1 TTS with any `en-*` voice; L2 IPA-first with `term`/`tts_text` never displayed; unplayable payload fails fast naming the question id | — | — Implementation tier |
| TR-speech-io-020 | TTS voice parameters are data-driven config: `voice_lang_preference` "en-US" (fall through `en-*`), `tts_rate` 0.85, `tts_pitch` 1.0, `tts_volume` 1.0 | — | — Implementation tier |
| TR-speech-io-021 | Ult offers mic path (scorer) and spell path (normalized exact match → 1.0/0.0); free switching until first submission locks; prompt shows VI meaning + first letter, never the word | — | — Implementation tier |
| TR-speech-io-022 | Ult interaction runs inside battle's timer with the 11 000 ms slow-rune threshold; paths usable immediately (no permission round-trip gates round start) | — | — Implementation tier |
| TR-speech-io-023 | Simulated scorer draws the platform RNG, never battle's seeded ghost/crit streams; determinism holds because quality is recorded in the battle commit log and replayed from it | — | — Implementation tier |
| TR-speech-io-024 | Quality is rounded half-up to `quality_precision_decimals` = 2 before commit-log recording; battle consumes the recorded value so live and replay damage are identical by construction | — | — Implementation tier |
| TR-speech-io-025 | Quality is delivered as scored, no floor/clamp inside [0,1]; `quality_success_threshold` 0.6 gates presentation only; no quality floor at MVP | — | — Implementation tier |
| TR-speech-io-026 | Capability probe runs once per battle (including async `voiceschanged` settlement) and is cached; rounds re-check only cached-voice membership; never probed mid-round | — | — Implementation tier |
| TR-speech-io-027 | TTS is not mutable: battle's SFX mute never applies to speech playback; volume follows OS/browser | — | — Implementation tier |
| TR-speech-io-028 | Speech-io emits no game events; outcomes (`quality`, selected mode, errors) arrive as return values, keeping the battle → speech-io dependency one-way | — | — Implementation tier |
| TR-speech-io-029 | Two state machines: capability machine (Unprobed/Probing/TTSReady/Degraded, re-evaluated per round) and round machine (Prompting→Speaking→Awaiting→Stopped; UltPrompting→MicListening/Spelling→Scoring→Resolved) | — | — Implementation tier |
| TR-speech-io-030 | S1: mic quality = round_half_up(0.88 + platform_rng() × 0.10, 2); exactly one uniform draw per mic submission; band [0.88, 0.98] closed only by the rounding rule | — | — Implementation tier |
| TR-speech-io-031 | S2: normalize = collapse_internal_whitespace(trim(to_lowercase(nfc(s)))); exact match scores 1.0 else 0.0; punctuation is significant at MVP | — | — Implementation tier |
| TR-speech-io-032 | P1: cast/fizzle is the boolean predicate `quality ≥ 0.6` handed to ui-shell while battle consumes the raw quality regardless | — | — Implementation tier |
| TR-speech-io-033 | Nine locked constants incl. `quality_success_threshold` 0.6, sim band 0.88/0.98, `quality_precision_decimals` 2, `sim_listening_beat_ms` 1200 (matches registry tower reveal delay) | — | — Implementation tier |
| TR-speech-io-034 | No speech engine at all settles Degraded for the whole battle (L2 every round); a payload then lacking `ipa` is a build-gate violation failing fast | — | — Implementation tier |
| TR-speech-io-035 | TTS error mid-round: one silent retry, then L2 if `ipa` exists else fail-fast; the battle timer never pauses for a speech failure | — | — Implementation tier |
| TR-speech-io-036 | Gesture-blocked autoplay (mobile Safari): options actionable with timer running, replay shows "tap to hear"; first tap satisfies the gesture and plays | — | — Implementation tier |
| TR-speech-io-037 | Mic denied or `getUserMedia` absent: mic path unavailable, spell auto-focused, no re-prompt this battle, permission re-read next battle; mid-capture path switch discards partial capture with zero draws | — | — Implementation tier |
| TR-speech-io-038 | Empty/whitespace spell input cannot be scored (submit disabled); double-submission is ignored idempotently — first submission locks the score | — | — Implementation tier |
| TR-speech-io-039 | A future scorer returning outside [0,1] fails fast naming the scorer — never clamped or floored | — | — Implementation tier |
| TR-speech-io-040 | `voiceschanged` mid-battle is picked up at the next round start; a round in flight never switches mode mid-playback | — | — Implementation tier |
| TR-speech-io-041 | The capture beat always completes past the 11 000 ms threshold and quality is always returned; slowness never truncates the beat | — | — Implementation tier |
| TR-speech-io-042 | Latency target: `speak()` call → audible onset ≤ 300 ms on a warm engine; replay must restart instantly (no spinner) | — | — Implementation tier |
| TR-speech-io-043 | Speech-io owns the single speech audio stream (zero SFX/music); speech is cut, never faded, at commit; one voice instance, never overlapping playbacks | — | — Implementation tier |
| TR-speech-io-044 | Real mic capture and acoustic TTS output are never AC-asserted; tests run at interface boundaries with injected doubles — the scorer interface and injectable platform RNG are the designed seams | — | — Implementation tier |

### tower — 25 requirements (4 ✅ / 0 ❌ / 21 —)

| TR-ID | Requirement | ADR | Status |
|-------|-------------|-----|--------|
| TR-tower-002 | Progression state is exactly per-module per-slot cleared:bool (unlock derived, never stored), re-derived from the battle result on load | ADR-0002 | ✅ Accepted |
| TR-tower-003 | Progression commits through the tower stage result commit point, atomic with the battle result | ADR-0002 | ✅ Accepted |
| TR-tower-016 | Tower structure is data-defined: tower_floor_count=4 and tower_stages_per_floor=3 are registry constants; floors 2–4 open when their module passes build-gate validation | — | — Implementation tier |
| TR-tower-017 | Sequential unlock: floor n unlocked iff floor n−1 boss cleared; stage s iff s−1 cleared; boss iff all 3 stages cleared — the boss clear is the only key | — | — Implementation tier |
| TR-tower-018 | Encounter config is exactly {module_id, stage_ref (1|2|3|boss), encounter_type ("tower_stage"|"tower_boss"), ghost_profile_ref}; ghost profile resolves from opponent-ai by encounter_type (HP 420/600, accuracy 0.55/0.75, reveal 1200/1500 ms) | ADR-0005 | ✅ Accepted |
| TR-tower-019 | Tower battles are the unchanged 4-round battle with k=1 seeded draw per round by battle-system Rule 22; pool minimums stage ≥6 / boss ≥4; tower adds no round types, modifiers or scaling | ADR-0005 | ✅ Accepted |
| TR-tower-020 | The pre-battle preview is deterministic (pure union of the pool — no RNG, no concealment) and skippable but always shown first | — | — Implementation tier |
| TR-tower-021 | Every attempt (win or lose) records via accounts-backend's "tower stage result" commit point; no energy, lives, keys or wait-timer state exists | — | — Implementation tier |
| TR-tower-022 | Cleared content is replayable but replays never change progression state — cleared flags are monotone and never unset | — | — Implementation tier |
| TR-tower-023 | Tower grants no rewards of its own; it emits a floor_cleared(module_id) event on a boss's first clear, consumed by meta-progression (provisional) | — | — Implementation tier |
| TR-tower-024 | An encounter config may only reference a module whose payload passed build-gate validation (question-content Rule 6); an unvalidated module can never be a floor | — | — Implementation tier |
| TR-tower-025 | The per-attempt session flow (Selecting/Previewing/Battling/Resolved) is ephemeral client-side until the result commit | — | — Implementation tier |
| TR-tower-026 | F1 unlock predicates are pure functions of cleared flags; unlock state is never stored, outputs are monotone, and floor_unlocked(1) must never dereference floor 0 | — | — Implementation tier |
| TR-tower-027 | floor_cleared(n) fires iff boss_cleared(n) transitions false→true (first clear only); idempotent by construction since flags never unset | — | — Implementation tier |
| TR-tower-028 | floor_progress is a derived display-only metric — never stored, never sent to the server, never consumed by gameplay logic; F1 reads raw flags | — | — Implementation tier |
| TR-tower-029 | preview_words is the distinct union sorted by word-entry index, tie-break word_id — same payload + ref yields the identical ordered list on every browser and retry, no Math.random/Date.now in the path | — | — Implementation tier |
| TR-tower-030 | The boss preview draws from the module × boss pool alone, never a union of the stage pools | — | — Implementation tier |
| TR-tower-031 | tower_floor_count and tower_stages_per_floor register as constants; battles_per_floor is deliberately never stored or registered (derived); upstream constants (pool sizes, ghost tiers, delays) are referenced by name with no local copies (TW1 static) | — | — Implementation tier |
| TR-tower-032 | An unlocked floor whose module payload is absent or unvalidated is not listed at all — not shown locked, absent from the map (unlock ≠ available) | — | — Implementation tier |
| TR-tower-033 | A failed pool fetch or empty pool blocks the attempt before battle start — no encounter config is issued and a battle never starts on an empty pool | — | — Implementation tier |
| TR-tower-034 | On client reload all unlock states re-derive from server flags by F1; any cached client-side unlock state is discarded, never trusted — F1 is the single chokepoint | — | — Implementation tier |
| TR-tower-035 | On a content-version change the next attempt's config and preview compose from the current payload only; an in-flight battle finishes and commits normally | — | — Implementation tier |
| TR-tower-036 | On commit failure the result is retained client-side as unsaved state retried per accounts-backend's policy; progression changes only on committed results, never optimistic local writes | — | — Implementation tier |
| TR-tower-037 | A battle result for an encounter tower did not configure is discarded for progression purposes — cleared flags change only for a config issued in the current attempt session | — | — Implementation tier |
| TR-tower-038 | For E14's foreign-result discard to bind in production, BattleResult must echo the issued encounter config (or an id) — implementation decision flagged to lead-programmer | — | — Implementation tier |

### ui-shell — 28 requirements (1 ✅ / 0 ❌ / 27 —)

| TR-ID | Requirement | ADR | Status |
|-------|-------------|-----|--------|
| TR-ui-shell-001 | Rendering-only ownership: ui-shell never recomputes game state — every displayed number/label/state is a formatted read of upstream state; only display math lives here | ADR-0004 | ✅ Accepted |
| TR-ui-shell-017 | Screen inventory scoped by feature tier (MVP: Auth, class pick, Home, Battle, Forge, Tower, Inventory, global overlays; VS adds quest/currency/streak; Alpha adds League); absent screen = not scope | — | — Implementation tier |
| TR-ui-shell-018 | Hub-and-spoke navigation from Home; battle exits only through its result modal (mid-battle back = forfeit/discard); unauthenticated deep links land on Auth — no guest entry | — | — Implementation tier |
| TR-ui-shell-019 | Every commit-requiring action renders the accounts-backend commit machine (Idle→Committing→Retrying with client-side `retry_delay` ladder→Unsaved→Idle); navigation blocked while Committing/Retrying | — | — Implementation tier |
| TR-ui-shell-020 | Offline discipline: persistent indicator, commit actions visually blocked, forge offline gate, battle continues client-side with result commit entering the retry ladder on reconnect; the shell never fabricates a successful commit | — | — Implementation tier |
| TR-ui-shell-021 | Honest-ghost disclosure: no fabricated presence; persistent ghost-duel label on ranked banner and League screens; simulated peers labeled ("Nhóm #14" pattern) | — | — Implementation tier |
| TR-ui-shell-022 | Accessibility baseline: 44 px minimum hit areas, static equivalents for audio-communicated states, `prefers-reduced-motion` swaps, no information by color alone | — | — Implementation tier |
| TR-ui-shell-023 | All copy Vietnamese-first with extraction keys and EN placeholders at MVP; gold/RP use vi-VN thousand separators (24.500) from launch; tier names bilingual | — | — Implementation tier |
| TR-ui-shell-024 | All animation durations, VFX timings, breakpoints and layout constants live in a presentation config data file, never hardcoded in components | — | — Implementation tier |
| TR-ui-shell-025 | Evidence discipline: every UI story closes with a retained screenshot in `production/qa/evidence/`; discharges SI26 and MP-AC27–29 gates | — | — Implementation tier |
| TR-ui-shell-026 | Battle screen renders the speech-io UI contract (replay, IPA panel, path picker, mic pulse, spell input, cast/fizzle) exactly; the shell adds no scoring, gating or audio behavior | — | — Implementation tier |
| TR-ui-shell-027 | Equipment hint surfaces (etymology, example-sentence, elimination flash, tap-to-hear, first-letter) render driven by LoadoutSnapshot passive flags via the Class-B hook | — | — Implementation tier |
| TR-ui-shell-028 | App state machine: Booting (fetch session + content version; no game surfaces render before resolve) → Authenticating → PickingClass (ClassUnpicked only) → Ready; overlays stack orthogonally, never replace spoke states | — | — Implementation tier |
| TR-ui-shell-029 | F-UI1: level = floor(cumulative_xp / xp_per_level) + 1, progress = (cumulative_xp mod xp_per_level)/xp_per_level; `xp_per_level` 1000 referenced from meta's registry, never redefined | — | — Implementation tier |
| TR-ui-shell-030 | F-UI2: vi-VN grouping — blocks of 3 digits from the right joined with '.', applied only when n ≥ 1000; no abbreviation at MVP; one shared formatter for gold, RP, rewards | — | — Implementation tier |
| TR-ui-shell-031 | F-UI3: due countdown reads the server clock only (never the device clock); "ready" branch is the same predicate forge uses for eligibility; the shell never gates Start Session from the string | — | — Implementation tier |
| TR-ui-shell-032 | F-UI4: quest fraction = min(progress, goal)/goal, defensively clamped in display code so no NaN reaches the DOM | — | — Implementation tier |
| TR-ui-shell-033 | F-UI5: speed readout = round_half_up(speedMult × 100)/100 (2 dp) of battle's emitted B2 value; the shell never recomputes speedMult from elapsed time | — | — Implementation tier |
| TR-ui-shell-034 | Navigation blocked for the in-flight commit ladder, bounded only by accounts' D_max = 30 s; the shell imposes no timeout of its own | — | — Implementation tier |
| TR-ui-shell-035 | Refresh/deep-link mid-flow resets to Auth or Ready; battle round state, preview scroll positions and half-completed forge sessions do not persist client-side | — | — Implementation tier |
| TR-ui-shell-036 | Rendering contract: durations are presentation budgets, never wall-clock gating; every effect skippable without desync; upstream budget wins over the prototype where they disagree | — | — Implementation tier |
| TR-ui-shell-037 | Concurrency caps: ≤ 10 concurrently animating elements per beat, ≤ 5 floating numbers; shake targets a dedicated wrapper, never the question panel or commit/banner surfaces | — | — Implementation tier |
| TR-ui-shell-038 | CSS animation only — transform/opacity/color/keyframes/clip-path/lucide; no canvas/WebGL, sprites, shaders, or particle libraries | — | — Implementation tier |
| TR-ui-shell-039 | Semantic palette tokens (emerald/coral/gold/cyan/violet/indigo) with no ad-hoc hex; Be Vietnam Pro for Vietnamese copy, Chakra Petch for numerals/Latin display; lucide icons never carry information alone | — | — Implementation tier |
| TR-ui-shell-040 | MVP ships silent except TTS: no music, no SFX; the shell synthesizes and plays nothing itself (8-cue set is post-MVP, design-ready) | — | — Implementation tier |
| TR-ui-shell-041 | Non-ownership: reveal-theater scheduling, VFX trigger logic, game values/formulas and TTS synthesis belong upstream — the shell maps event → effect only | — | — Implementation tier |
| TR-ui-shell-042 | Input responsiveness budgets: tap targets highlight within ≤ 100 ms; disabled states render before the tap; Committing spinner within one frame, action locked immediately | — | — Implementation tier |
| TR-ui-shell-043 | Ui-shell owns zero RNG — every displayed value is a formatted read of upstream state, so nothing samples; statistical AC count is 0 by design | — | — Implementation tier |

## Known Gaps

Requirements whose text explicitly defers a decision to a pending ADR (suggested
invocation in parentheses):

1. **TR-analytics-043** (analytics) — sink storage route deliberately open: custom event
   tables vs third-party pipeline (OQ-AN1). → `/architecture-decision` **Analytics sink
   route** (Required ADR #6; write before analytics implementation — storage choice rides
   ADR-0002's stack).
2. **TR-real-pvp-039** (real-pvp) — speech quality scored server-side (OQ-RVP3), plus
   server-callable question draw with same build gates. → `/architecture-decision`
   **Server-side speech scoring** (Required ADR #8; deferred with real-pvp; the scorer
   interface TR-speech-io-008 is the not-preclude contract).

**Scope with no extraction line:** Required ADR #7 (real-time transport + hosting regions,
OQ-RVP4/5/8) has no ❌ rows because real-pvp.md deliberately leaves transport undecided —
no requirement text names a transport choice. Its trigger stands: write it before any PvP
epic, and it must not be precluded by ADR-0002's stack (WebSocket capability, region
topology).

**Required ADR #5 (ranked server-computed RP)** — resolved by ADR-0003 §3 Stage 1
(replay-verify pinned); no longer a separate gap.

**Everything marked "—"** is implementation tier: those requirements are governed by their
GDDs, the coding standards, and the control manifest. They are not architectural gaps at
`modes.workflow: standard`; they become story material via `/create-stories`.

## Superseded Requirements

None. No registry requirement was superseded by this review. The 2026-11-09 run's one GDD
revision flag that carried a registry implication (ranked-league grace-window constant table
vs ADR-0003 §4) was **applied** in the ranked GDD 2026-11-10 (Core Rule 11 + constant table
re-pinned to `started_at`); the remaining open flags (battle/opponent-ai `resolve_round`
`input_source` parameter) carry no registry text change — tracked in the 2026-11-10 review
report's GDD Revision Flags.
