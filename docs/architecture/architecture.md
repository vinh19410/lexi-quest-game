# LexiQuest — Master Architecture

## Document Status
- Version: 1
- Last Updated: 2026-11-09
- Engine: Web (browser SPA) — React ^19.0.0 + TypeScript ^5.7.0 + Vite ^8.0.5 + Tailwind CSS ^4.0.0 + lucide-react ^1.63.0 (out-of-catalog stack; pin source `docs/engine-reference/web/VERSION.md`, pinned 2026-11-09 from the prototype's `package.json`)
- Workflow mode: **standard** — this document carries the System Layer Map and the critical ADR list. Full module-ownership tables, per-scenario data-flow walkthroughs, and API-boundary signatures are the `/create-architecture` `full` section set; the layer-map paragraphs below record the ownership essentials each GDD already authorizes.
- GDDs Covered: `game-concept.md`, `systems-index.md`, and all 14 system GDDs (accounts-backend, question-content, hero-class, opponent-ai, battle-system, equipment, forge-srs, speech-io, ui-shell, tower, meta-progression, ranked-league, localization, analytics, real-pvp) — 15 systems, all Approved
- Technical Requirements Baseline: **260 requirements** extracted across the 15 systems (all provisional — `docs/architecture/tr-registry.yaml` was empty at extraction time; `/architecture-review` registers permanent TR-IDs). Per-system: accounts-backend 20, question-content 16, hero-class 15, opponent-ai 16, battle-system 27, equipment 18, tower 15, meta-progression 18, ranked-league 18, forge-srs 15, speech-io 15, ui-shell 16, localization 17, analytics 17, real-pvp 17.
- ADRs Referenced: none yet — 4 Foundation ADRs Proposed (see Required ADRs)
- TD-ARCHITECTURE: skipped — lean mode
- LP-FEASIBILITY: skipped — lean mode

## Engine Knowledge Gap Summary

The LLM's training data ends ~May 2025 (Vite through the 6.x/7.0 era). Per the project's own
pin (`docs/engine-reference/web/VERSION.md`), **HIGH RISK** (post-cutoff or edge — verify against
`node_modules/` types or official docs before any implementation claim): **Vite 8** (config/plugin
surface), **Tailwind CSS 4.x** (theme/token API differs materially from v3), **lucide-react 1.x**.
**NOT ASSESSED** (no reference file exists — `docs/engine-reference/web/` contains only
`VERSION.md`; no `breaking-changes.md`, `deprecated-apis.md`, `current-best-practices.md`, or
`modules/`): React 19 minor APIs, TS 5.7 minors, pnpm behavior, and every per-domain engine
constraint check this skill normally runs against module docs. Browser platform APIs the design
depends on — Web Speech (TTS/voices), `getUserMedia`, WebCrypto `getRandomValues`, Web Animations
API — are version-unpinned platform surfaces; the GDDs already design around their variance
(speech-io L1/L2 fallback ladder, permission flows, seeded-RNG requirement banning `Math.random`).
No architectural decision in this document rests on an unsourced post-cutoff API claim; the HIGH
RISK flags attach to implementation-time verification, and `NOT SOURCEABLE — <claim> is not
covered by docs/engine-reference/web/` is the required notation for any that surface later.

## System Layer Map

```
┌────────────────────────────────────────────────────────────────────┐
│  POLISH LAYER       localization · analytics · real-pvp (deferred)  │
├────────────────────────────────────────────────────────────────────┤
│  PRESENTATION       ui-shell · speech-io                            │
├────────────────────────────────────────────────────────────────────┤
│  FEATURE LAYER      tower · meta-progression · ranked-league        │
├────────────────────────────────────────────────────────────────────┤
│  CORE LAYER         battle-system · forge-srs · equipment ·         │
│                     opponent-ai                                     │
├────────────────────────────────────────────────────────────────────┤
│  FOUNDATION         accounts-backend · question-content ·           │
│                     hero-class                                      │
├────────────────────────────────────────────────────────────────────┤
│  PLATFORM           Browser (React 19 / DOM / Web APIs)             │
│                     + backend host (stack = ADR, Proposed)          │
└────────────────────────────────────────────────────────────────────┘
```

The layer assignment is the one `systems-index.md` already established and all 15 GDDs were
reviewed against — this run confirms it as the architecture's layer map. One structural fact
cuts across every layer: **this is a client SPA plus a real backend**. At MVP the simulation
(battle, forge scheduling math, equipment assembly) runs client-side as pure TypeScript; the
server is authoritative for *state* (accounts TR-accounts-backend-008/011). Ranked-league
(Alpha) moves RP computation server-side, and real-pvp (deferred) moves the whole battle engine
server-side — the layer boundaries below are drawn so those migrations reuse contracts instead
of breaking them.

**Foundation** — no dependencies; everything else builds on these.
- **accounts-backend** (20 TRs) owns auth (email+password, 30-day sliding sessions, throttle
  F2), all server-side game state, the versioned content payload delivery (`version` + banks,
  one-line cache invalidation), and the commit-point write protocol (atomic whole-commits,
  client-generated commit IDs, idempotent retries, F3 retry ladder B=1 s/J=0.5 s/D_max=30 s/N=5).
  It stores and serves but never computes game semantics (TR-accounts-backend-019). Exposes:
  session API, commit API, content fetch, storage for every downstream ledger/queue/flag.
  Consumes: nothing upstream. **Companion ADR Required** (persistence boundary + stack).
- **question-content** (16 TRs) owns the discriminated-union question schema family (6 types +
  word-entry atoms), strict build-gate validation (unknown field = build failure), pool minimums
  (battle ≥ 8, tower stage ≥ 6, boss ≥ 4, glossary ≥ 24) in ONE shared config file, and the
  single global content version. Exposes: typed banks + validation as *data*; deliberately NO
  selection/mixing/scheduling API (TR-question-content-012) — battle owns mixing, tower owns
  stage selection, forge owns card scheduling.
- **hero-class** (15 TRs) owns the 3-class data registry, the five-stat vocabulary
  (hp/atk/def/crit/time), passive constants (×1.2 fast vocab, +60 shield @ streak 3, ×1.20
  listening), and the shared `fast_answer_threshold` = 3000 ms (battle must reference, not
  redefine). Stateless at runtime; owns no derived stats.

**Core** — the simulation. Pure, deterministic, headless-testable TypeScript; no engine API and
no HIGH-risk domain surface here.
- **battle-system** (27 TRs) owns the 4-round state machine, the fixed-tick simulated clock
  (no `setTimeout`/`Date.now` in battle code, TR-battle-system-003), formulas B1–B12 with global
  round-half-up and single-final-rounding, the seeded stream architecture (one crypto-random
  uint64 per battle; child streams by `(seed, domain_tag)`; never `Math.random`), the
  `LoadoutSnapshot` input contract (read once, frozen), the `BattleResult` output contract
  (cursed runes, reward/RP events, seed, per-round log — replay-identical), and the equipment
  hook vocabulary. Consumes: encounter config (never chooses content), ghost resolver, scorer
  interface. Emits: battle events + HUD data for ui-shell. **PRNG ADR Required**.
- **opponent-ai** (16 TRs) owns `GhostProfile` data and the question-unaware resolver
  `resolve_round(profile, mode, seed, round_index) → {correct, answer_reveal_delay_ms}` —
  fixed-point integer draws in [0, 2⁵³) compared strictly `<` against
  `round(accuracy × 2⁵³)`; one draw per round in strict order, never re-seeded.
- **equipment** (18 TRs) owns the 12-item catalog data, effective-stat assembly
  (`base + Σ(stats + perLevel × level)`, def ≤ 120 by construction, assert fail-fast),
  `LoadoutSnapshot` publication (only after server commit acceptance, frozen), and Upgrade Stone
  application (atomic commit, server re-validated). Zero RNG, zero device-clock reads.
- **forge-srs** (15 TRs) owns rune-queue *semantics* (accounts-backend owns storage): the
  3-box Leitner ladder (10 min / 24 h / 72 h, `due_at ≤ server_now` inclusive — server clock
  only), deterministic session composition (oldest-due-first, fixed 2:1 direction mix, filler
  excluding queued words), and the one atomic stone-granting commit. Client-only view state;
  abandonment discards, no resume.

**Feature** — gameplay/economy layers over Core.
- **tower** (15 TRs) owns floor/stage structure as pure data (4 floors × 3 stages + boss),
  pure unlock predicates over per-slot `cleared` flags (server-persisted, re-derived on load,
  never cached client-side), the one-product encounter config it hands battle, and the
  deterministic preview function. Zero RNG, zero clocks, zero rounding.
- **meta-progression** (18 TRs) owns four stores: gold ledger, XP ledger + level, daily quest
  board (fixed 4-quest set, Asia/Ho_Chi_Minh midnight reset on server clock, commit-day
  attribution), study-board counters. Exactly-once ledger application keyed on the battle seed
  (`applied_seeds`); integer-only math; whole-commit rejection races.
- **ranked-league** (18 TRs) owns RP state (one persisted integer + season objects; tier/division
  derived on read), the epoch-day season calendar (Monday 00:00 ICT, rollover transaction), the
  14 hash-seeded simulated peers (stateless per-(peer, day) drift via the PRNG ADR's pinned `H`),
  and the 15-minute ranked forfeit grace window. **Server-computed RP commits (OQ-RL4) are the
  trust-model escalation point — ADR Required before Alpha.**

**Presentation** — renders; never decides.
- **speech-io** (15 TRs) owns the capability probe (once per battle, cached), the L1 TTS / L2
  IPA-first fallback ladder, the scorer interface `score(target, attempt) → quality ∈ [0,1]`
  (MVP: simulated, platform RNG — never battle's seeded streams; quality rounded half-up to
  2 dp *before* the commit log), and the battle-lifetime/per-round state machines. Emits zero
  game events; strictly one-way battle → speech-io calls.
- **ui-shell** (16 TRs) owns every screen, the app state machine (Booting → Authenticating →
  PickingClass → Ready + spokes), navigation, and rendering of all upstream contract tables.
  Rendering-only: never recomputes upstream state (display-side math limited to F-UI1–F-UI5);
  CSS-animation-only VFX pipeline with data-driven presentation config; accessibility baseline
  (44 px, reduced-motion static equivalents, never color-only); vi-VN formatting from launch.
  Engine awareness: this layer touches both HIGH RISK domains — Tailwind 4 token/theme API and
  lucide-react 1.x. Verify component-level API claims against installed types at implementation.

**Polish** — cross-cutting, later tiers.
- **localization** (17 TRs) owns the string catalog (immutable surface-anchored keys, Draft →
  Deprecated lifecycle machine-readable in the build), the F1 coverage gate (= 1.0 at release),
  extraction-sweep release gate, and the error-code → key mapping imported from
  accounts-backend. Content English is never localized. Client-only, bundled — no locale fetch.
- **analytics** (17 TRs) owns the event vocabulary + payload schemas (`schema_v`), fire-and-forget
  `track()` riding existing commits, buffer state machine (batch 10 / 30 s / cap 50), cohort
  sampling, consent + 90-day/30-day SLAs, and server-authoritative gap sessionization on
  `game_day_id`. Sink storage route = ADR (OQ-AN1) riding the accounts-backend stack decision.
- **real-pvp** (17 TRs, **deferred Full Vision** — architecture must only not-preclude): requires
  the shared B-series formula module ("one formula module, two hosts" — extraction = OQ-RVP1,
  folded into the module-layout ADR below), server-authoritative engine hosting, ordered reliable
  low-latency transport (transport ADR, deferred), and the absolute end of the trust-model
  escalation chain. No MVP module may close a door this GDD needs (e.g. battle's `resolve_round`
  substitution point, question draw callable server-side).

## Required ADRs

ADR audit: no ADRs exist (`docs/architecture/` holds only the empty TR registry), so coverage is
**0 / 260** — every baseline requirement is a gap, and the gaps group into the ADRs below.
Foundation first; each cites the TR ranges (provisional IDs, GDD-stem slugs) it must cover.

**Must have before coding starts (Foundation & Core):**

1. **ADR: Seeded PRNG algorithm + stream derivation** — pins the platform-stable seedable
   generator (counter/PCG family recommended: 64-bit state, single 64-bit seed), the
   `(seed, domain_tag)` child-stream derivation, `rng_int` modulo-bias handling for ranges
   ≤ 501, and seed→draw test vectors as fixtures. *The single largest blocker* — it gates
   statistical ACs and replay guarantees in four systems.
   Covers: TR-opponent-ai-008…011/014, TR-battle-system-011/015/019/023/026, TR-ranked-league-009…011,
   TR-forge-srs-005, and (negatively) TR-speech-io-008's platform-RNG scorer.
   Resolves OQ-BS1 / OA-OQ2; unblocks RKL8/RKL9 fixtures, OA12/OA18/OA20, BS22/BS23/BS36.
2. **ADR: Persistence boundary + backend stack** — hosting, storage engine, schema mechanics,
   session/token handling, password-hashing parameter (may tighten the 128-char bound), content
   payload delivery + cache invalidation, QA delay-override profiles (OQ-FS1), and the
   code-root/repo-topology decision (incl. `raw-data/` fate) if not split out.
   Covers: TR-accounts-backend-001…020 (core), TR-question-content-007/012, TR-forge-srs-004/006/007,
   TR-equipment-008…010, TR-tower-002/003, TR-meta-progression-002/003/017, TR-ranked-league-001/005/018,
   TR-analytics-010 (deletion cascade).
   Resolves: accounts-backend companion ADR, hero-class OQ4 (schema freeze ordering), game-concept
   open question #2.
3. **ADR: Client↔server commit protocol + trust model** — commit points, commit-ID idempotency,
   atomic whole-commit rejection semantics, the shared F3 retry ladder, unsaved-state UX contract,
   and the trust-model escalation chain (MVP client-trusted outcomes → ranked server-computed →
   PvP server-authoritative; each stage's verification mechanism, incl. OQ-RL4's
   recompute-vs-replay choice and battle-start telemetry).
   Covers: TR-accounts-backend-009…011/014/015/017, TR-meta-progression-002/003/014, TR-ranked-league-004…006,
   TR-forge-srs-006, TR-equipment-008/009, TR-real-pvp-003/016 (not-preclude).
4. **ADR: Module layout + shared B-series extraction plan** — code root (`src/` at repo root per
   `resolve_code_root` auto-detect), module boundaries mirroring the layer map, the shared
   B1–B12 formula package ("one formula module, two hosts") with drift = build failure, the
   shared constants/config module (registry-owned values: pool minimums, passive constants,
   `fast_answer_threshold`, ghost HP/delays), and the content directory contract.
   Covers: TR-real-pvp-002 (OQ-RVP1), TR-question-content-006, TR-hero-class-006/007,
   cross-system boundary TRs (TR-question-content-012, TR-battle-system-021, TR-ui-shell-001).

**Should have before the relevant system is built:**

5. **ADR: Ranked server-computed RP mechanism** (if not folded into #3) — before Alpha ships
   (RKL6/RKL7 blocked on it).
6. **ADR: Analytics sink route** (OQ-AN1: custom event tables vs third-party pipeline) — before
   analytics implementation; storage choice rides #2.
7. **ADR: Real-time transport + hosting regions** (OQ-RVP4/5/8) — deferred with real-pvp;
   must be written before any PvP epic and must not be precluded by #2's stack (e.g. WebSocket
   capability, region topology).
8. **ADR: Server-side speech scoring approach** (OQ-RVP3) — deferred with real-pvp; the scorer
   interface (TR-speech-io-008) is the not-preclude contract.

**Can defer to implementation:** friend-duel presence infrastructure (OQ-RVP6);
ghost-profile move into the content payload (OA-OQ4, Alpha contract change); settings-surface
scope (OQ-SI4/OQ-UI1/OQ-UI4, Alpha); statistical-test home (`tests/statistical/`, standards
decision when the second harness appears).

## Architecture Principles

1. **Server-authoritative state; the client is input and display.** All persistent game state
   lives server-side; browser storage holds only the session token and the versioned content
   cache. The client never renders success without server acceptance (accounts-backend-008/013,
   ui-shell-005).
2. **Deterministic simulation core.** Battle is a fixed-tick state machine over seeded streams;
   same seed + recorded commits reproduce the entire battle log bit-identically. Every formula
   rounds once, round-half-up, at the end. Pure modules are headless-testable with injected
   clocks/RNG (battle-system-003/015/026, forge-srs-015, equipment-014).
3. **Data-driven values, registry-owned constants.** Classes, items, ghosts, questions, pool
   minimums, delays, and presentation config are data files; shared constants have exactly one
   owning system and every consumer references by name (studio coding standard; hero-class-007,
   question-content-006, tower-006, ranked-league-013).
4. **Plain-data contracts at the seams, one owner each.** `LoadoutSnapshot`,
   `BattleResult`, the encounter config, and the scorer interface break every potential runtime
   cycle (battle↔forge↔equipment resolved by systems-index's two-contract design). A module
   owns its contract's semantics; counterparties store or render them (accounts-backend-019,
   question-content-012, ui-shell-001).
5. **Honest presentation.** The shell renders upstream state without re-deriving it; the game
   never fabricates presence (Pillar 4 disclosure is data and copy, static-asserted); offline
   and unsaved states are explicit, never masked (ui-shell-005/007, ranked-league-013/017).

## Open Questions

| ID | Summary | Priority | Resolution Path |
|----|---------|----------|-----------------|
| QQ-01 | Ult-round expiry semantics (OQ-SI1): does `ultimate_burst` have a hard timeout? 11 000 ms threshold exceeds every class round time | High | battle-system next edit (owner: battle author / technical-director); affects speech-io ult state machine |
| QQ-02 | BattleResult must echo the issued encounter config or attempt id so tower can discard foreign results (OQ-TW7) | Medium | folded into ADR #3/#4 contract shapes (lead-programmer) |
| QQ-03 | Stable word-entry index for deterministic tower preview sort (OQ-TW6); degrades to word_id-only otherwise | Low | question-content schema next edit |
| QQ-04 | QA server profile for minutes-scale forge delays (OQ-FS1) — build-config/server-profile mechanism | Medium | ADR #2 (data-profile section) |
| QQ-05 | Post-MVP class switching: `class_history` schema forward-compatibility vs closed (hero-class OQ4) — must resolve before accounts-backend schema freeze | Medium | ADR #2 schema section (project-owner decision) |
| QQ-06 | Telemetry toggle surface is a ui-shell contract change (OQ-AN2) — hard stop before Alpha | Medium | ui-shell Dependencies next edit |
| QQ-07 | Honesty-copy `fidelity: exact` key enumeration owed by ranked-league + accounts-backend (OQ-LC2) | Low | those GDDs' next edits |
| QQ-08 | `floor_cleared` event: keep live-but-unconsumed (for analytics) or drop (OQ-MP5/OQ-AN4 family) | Low | tower next edit; analytics ADR #6 notes the consumer |
| QQ-09 | Boss HP 600 retune (OQ-BS2) would re-derive BS26 pinned numbers; geared-burst evidence attached (OQ-EQ6) | Medium | owner balance pass before boss tuning |
| QQ-10 | Equipment battle-hook vocabulary 4 → 9 (OQ-EQ1) — battle-side growth riding battle's next edit | Medium | battle-system next edit; hook shapes belong in ADR #4 module boundaries |
