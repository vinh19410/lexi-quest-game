# Systems Index: LexiQuest — Đấu Trường Anh Ngữ

> **Status**: Approved
> **Created**: 2026-11-08
> **Last Updated**: 2026-11-09
> **Source Concept**: design/gdd/game-concept.md (APPROVED, lean review 2026-11-08)

---

## Overview

LexiQuest is a web-native (TypeScript + React) educational quiz-battle RPG: a
4-round duel against a "Shadow Ghost" AI where answer speed scales damage
(Pillar 1: Speed Is Damage), wrong/slow answers drop cursed runes that are
purified through a forge quiz into gear upgrades (Pillar 2: Mistakes Are
Materials), and every equipment passive scaffolds a real language skill
(Pillar 3: Knowledge Is Gear). Mechanically this decomposes into three
Foundation systems (backend accounts/persistence, question-content pipeline,
hero classes), a Core quartet (opponent AI, battle, equipment, forge) linked
by two data contracts rather than a runtime cycle, Feature systems (tower PvE,
meta progression, ranked/leagues), and Presentation/Audio wrappers (speech
I/O, UI shell). The MVP hypothesis — speed-scored battles + forge-SRS drive
return sessions without real opponents — needs 10 of the 15 systems; PvP
netcode, analytics and localization GDD work sit deliberately later. The
review of the concept doc flagged one arithmetic gap that the battle-system
GDD must resolve: at +30 mana per correct answer, three prior rounds yield at
most 90, so an ult gated at 100 is unreachable.

---

## Systems Enumeration

| # | System Name | Category | Priority | Status | Design Doc | Depends On |
|---|-------------|----------|----------|--------|------------|------------|
| 1 | accounts-backend | Persistence | MVP | Approved | [accounts-backend.md](accounts-backend.md) | — |
| 2 | question-content | Core | MVP | Approved | [question-content.md](question-content.md) | Re-approved 2026-11-09 (lean re-review after revision; 6 recommended in log) |
| 3 | hero-class | Gameplay | MVP | Approved | [hero-class.md](hero-class.md) | —  Re-approved 2026-11-09 (lean re-review after D-B1 re-scope; 4 recommended in log) |
| 4 | opponent-ai | Gameplay | MVP | Approved | [opponent-ai.md](opponent-ai.md) | question-content, hero-class |
| 5 | battle-system | Gameplay | MVP | Approved | [battle-system.md](battle-system.md) | question-content, hero-class, opponent-ai, equipment (LoadoutSnapshot)  Approved 2026-11-09 (lean re-review — all prior findings verified fixed, registry sweep clean; 2 recommended in log) |
| 6 | equipment | Progression | MVP | Approved | [equipment.md](equipment.md) | hero-class, forge-srs (+levels) |
| 7 | forge-srs | Progression | MVP | Approved | [forge-srs.md](forge-srs.md) | battle-system (BattleResult), equipment, accounts-backend, question-content (card schema + filler pool) |
| 8 | speech-io | Audio | MVP | Approved | [speech-io.md](speech-io.md) | battle-system, question-content |
| 9 | ui-shell | UI | MVP | Approved | [ui-shell.md](ui-shell.md) | battle-system, forge-srs, tower, meta-progression, ranked-league, accounts-backend |
| 10 | tower | Gameplay | MVP | Approved | [tower.md](tower.md) | battle-system, question-content, opponent-ai (profiles), accounts-backend (persistence)  Re-review 2026-11-09 (lean): C-B1/TW20/TW19 resolutions verified, 0 blocking |
| 11 | meta-progression | Economy | Vertical Slice | Approved | [meta-progression.md](meta-progression.md) | battle-system, accounts-backend (+forge-srs, tower as event sources) |
| 12 | ranked-league | Meta | Alpha | Approved | [ranked-league.md](ranked-league.md) | battle-system, meta-progression, accounts-backend |
| 13 | localization | UI | Alpha | Approved | [localization.md](localization.md) | ui-shell (+question-content gloss ownership; ranked-league/accounts-backend wording) |
| 14 | analytics | Meta | Full Vision | Approved | [analytics.md](analytics.md) | accounts-backend |
| 15 | real-pvp | Gameplay | Full Vision | Approved | [real-pvp.md](real-pvp.md) | battle-system, accounts-backend |

---

## Categories

| Category | Description | Typical Systems |
|----------|-------------|-----------------|
| **Core** | Data and rules everything plays against | question-content |
| **Gameplay** | The systems that make the game fun | battle-system, hero-class, opponent-ai, tower, real-pvp |
| **Progression** | How the player grows over time | equipment, forge-srs |
| **Economy** | Resource creation and consumption | meta-progression (gold, XP, quests) |
| **Persistence** | Save state and continuity | accounts-backend |
| **UI** | Player-facing information displays | ui-shell, localization |
| **Audio** | Sound and speech systems | speech-io |
| **Meta** | Systems outside the core game loop | ranked-league, analytics |
| *Narrative* | — | Not used: no story mode (per concept, MDA Narrative: N/A) |

---

## Priority Tiers

| Tier | Definition | Target Milestone | Design Urgency |
|------|------------|------------------|----------------|
| **MVP** | Required for the core loop to function — 4-round ghost battle, forge loop, persistent rune queue, backend accounts, one tower module. Without these you cannot test the MVP hypothesis. | First playable MVP (concept's "Required for MVP" list) | Design FIRST |
| **Vertical Slice** | One complete, polished experience: core loop + forge + tower end-to-end with visible XP/gold/quest progression. | Vertical slice / demo | Design SECOND |
| **Alpha** | All features present in rough form: ranked/league layer, all 4 content modules, localization discipline. | Alpha milestone | Design THIRD |
| **Full Vision** | Analytics, and (deferred, owner decision pending) real-PvP netcode. | Beta / Release | Design as needed |

---

## Dependency Map

Systems sorted by dependency order — design and build from top to bottom.

### Foundation Layer (no dependencies)

1. **accounts-backend** — auth, server-side progress, content serving; 10 downstream dependents across all tiers (6 by MVP), so its schema decisions (guest mode — RESOLVED 2026-11-08: removed, account required; persistence boundary — backend-served versioned content) propagate everywhere. GDD complete; companion ADR pending.
2. **question-content** — question banks, per-stage pools, CEFR/module tagging; consumed by battle, tower and forge filler cards.
3. **hero-class** — 3 classes with base stats and language-anchored passives; defines the stat vocabulary (ATK/DEF/crit/time) every formula uses. GDD complete (2026-11-08): 3 class entities + 4 passive constants + F1 proc formula registered; `fast_answer_threshold` (3 s) is a shared cross-system value — battle-system must reference it, not redefine. Arcane's passive re-scoped to ×1.20 listening damage (2026-11-09, cross-review D-B1 — the mana-rate form was provably inert). Has UI surface (class pick screen, battle HUD passive line) → UX flag for `/ux-design`.

### Core Layer (depends on foundation)

1. **opponent-ai** — depends on: question-content (round context only — the
   resolver is question-unaware at MVP), hero-class (`class_ref` ghost-identity
   vocabulary; ghost passives dormant — GDD complete 2026-11-09: structured
   dice-roll resolver, seeded deterministic stream (PRNG algorithm = ADR
   pending), GhostProfile data + accuracy tiers 0.55/0.65/0.70/0.75 with safe
   band 0.40–0.90, HP 420/600/500, reveal delays authored, F3 Binomial tuning
   surface + 20 ACs). UX flag: ghost panel + ranked banner disclosure →
   /ux-design when ui-shell GDD lands.
2. **battle-system** — depends on: question-content (round questions; k=1 draw
   per round-type pool, `battles_per_typical_session = 4` — OQ#1 resolved
   2026-11-09), hero-class (stats/time; all four open interface items resolved:
   per-round-type timestamps, crit scope = damage rounds only, shield pool
   no-cap/no-decay, mana round-half-up), opponent-ai (opponent scoring; seed
   policy answered — uint64 crypto-random per battle, persisted for replay;
   OA-OQ1 closed), equipment (reads LoadoutSnapshot contract — authored in the
   battle GDD as provisional, with a `def ≤ 120` band handoff). GDD complete
   (2026-11-09): 25 Core Rules + tick-model state machine, formulas B1–B12
   (round-half-up global), ult gate 90 (systems-index arithmetic gap RESOLVED),
   ghost damage fixed 100/150, boss fights = outlast/fraction wins at base
   stats (retune option = OQ-BS2), ACs BS1–BS38. UX flag: battle HUD
   (mana gate marker, speed multiplier readout, ult-ready beat) + result modal
   → /ux-design at Pre-Production. Answered for siblings: hero-class OQ1–OQ3
   closable; opponent-ai OA20 authorable.
3. **equipment** — depends on: hero-class (stat targets), forge-srs (supplies
   +levels via Upgrade Stones). GDD complete (2026-11-09): 12-item catalog
   (4 slots × 3), level cap 5, def ≤ 120 band enforced BY CONSTRUCTION
   (worst case exactly 120 — shield-steadfast perLevel def retuned 4→3 to
   hold it), LoadoutSnapshot contract confirmed verbatim (OQ-BS4 closed),
   forge FS16 stone contract confirmed, 12-passive vocabulary in 3 groups
   (5 battle hooks / 6 affordances needing new battle hooks — OQ-EQ1 / 1
   stat-carried), formulas F1–F3 + progression math (60 stones ≈ 2–4 months
   to full catalog), ACs EQ1–EQ28 (0 statistical — elimination is battle's
   seeded stream). OQ-EQ1–EQ6; OQ-EQ6 carries the geared maxima (atk 173,
   boss one-cycle ≈ 708 > 600) to battle's OQ-BS2 recompute. UX flag:
   inventory/gear screen + hint surfaces → /ux-design when ui-shell lands.
4. **forge-srs** — depends on: battle-system (consumes BattleResult cursed runes), equipment (upgrade targets), accounts-backend (persistent rune queue).

### Feature Layer (depends on core)

1. **tower** — depends on: battle-system (encounter config → result; GDD complete 2026-11-09: 4 floors × (3 stages + boss), F1 unlock predicates, F2 display-only progress, F3 deterministic preview — boss pool alone, no retry math, defeat costs nothing, TW1–TW23), question-content (per-stage pools, previews; A2 confirmed adopted), opponent-ai (Hard — stage/boss GhostProfiles; profile contract CONFIRMED by tower Core Rule 3), accounts-backend (tower stage result commit point). UX flag: floor map, stage select, preview screen, result-progression surfaces → /ux-design at Pre-Production.
2. **meta-progression** — depends on: battle-system (reward events + encounter-typed victories; Rule 21's provisional flag RESOLVED — values 120/250/40 gold · 180/60 XP adopted MVP-final, owned by meta), accounts-backend (ledgers + quest state; commit points at battle end + quest claim). GDD complete (2026-11-09): 13 Core Rules (faucet-only gold at MVP, no replay caps — OQ-TW1 RESOLVED, tower quest re-keyed to encounter-typed victories off tower's first-clear-only floor event), formulas MP1–MP6 (seed-keyed idempotent ledger, threshold-vs-additive quest sources, commit-day streak), 4-quest fixed daily board with silent expiry, study-board payload (mastered_words + streak) provisional for ranked-league, ACs MP-AC1–29, OQ-MP1–MP5 (Alpha faucet cap first). UX flag: Home quest board + currency/streak strip → /ux-design at Pre-Production.
3. **ranked-league** — depends on: battle-system (RP events — Rule 21's ranked values +28/−14 adopted Alpha-final, the RP half of OQ-BS3 resolves pointing here), meta-progression (study-board payload `mastered_words` + `streak` — OQ-MP3 payload adopted verbatim), accounts-backend (ranked RP commits are server-computed — adoption half of AB OQ#3; weekly rollover commit). GDD complete (2026-11-09): weekly seasons (epoch-week `season_id`, Monday 00:00 ICT), RP ladder with automatic unprotected demotion (tiers Bronze 0 / Silver 1000 / Gold 1300 / Diamond 1600 / Grandmaster 1900, divisions III–I, RP floor 0), 14 hash-seeded simulated peers per league group (stateless per-(peer,day) drift; H = PRNG ADR primitive; Pillar 4 honest-ghosts disclosure is a Core Rule, not copy), daily module rotation over [daily, toeic, ielts, it], formulas RL1–RL5, ranked forfeit −14 after a 15-min grace window (OQ-BS8 resolved for ranked), ACs RKL1–25 (0 statistical — the system owns no platform RNG; 18 assertable now). OQ-RL1–RL6. UX flag: ladder screen (league board, tier track, season settle) + honest-queue button + ghost disclosure copy → /ux-design when ui-shell lands.

### Presentation Layer (depends on features)

1. **speech-io** — depends on: battle-system (listening rounds), question-content (word audio data); owns the simulated mic-scoring interface (2026-11-08 decision). GDD complete (2026-11-09): fallback ladder L1 TTS / L2 IPA-first, ult mic+spell interaction, scorer interface with simulated 0.88–0.98 band, **OQ-BS5 RESOLVED** (quality continuous [0,1], threshold 0.6 presentation-only, no floor at MVP — battle-side cleanup OQ-SI2: drop BS11 provisional, close OQ-BS5 row), ult-timer-semantics question raised back to battle (OQ-SI1), ACs SI1–SI26. UX flag: listening replay/fallback states + ult speech-interaction panel → /ux-design at Pre-Production. **Approved 2026-11-09** (lean re-review #3 — verdict + receipt in `design/gdd/reviews/speech-io-review-log.md`).
2. **ui-shell** — depends on: battle-system, forge-srs, tower, meta-progression, ranked-league, accounts-backend (reads state; owns all screens, battle HUD/VFX, navigation). GDD complete (2026-11-09): rendering-only ownership (10 upstream contract tables kept, not re-decided), 12 Core Rules incl. commit-state rendering, offline honesty, Pillar-4 disclosure, accessibility baseline (44 px / reduced-motion static variants / no color-only), vi-VN formatting from launch; screen inventory scoped by tier (MVP auth→inventory, VS quest board, Alpha league); display formulas F-UI1–F-UI5 (XP bar level-1 base, vi-VN grouping, server-clock countdown, quest fraction, speed-mult quantization); 18 edge cases; Visual/Audio = silent-MVP audio stance + CSS-only budgeted VFX; 30 ACs (19u/2i/8s/1m/0 stat) discharging SI26, MP-AC27–29, EQ27/EQ28, RKL21–25. OQ-UI1–UI5 (OQ-UI2 takes a stance closing half of equipment's EQ2; OQ-UI1 adopts speech-io SI4). UX flag: 8-spec hand-off ladder (auth, home, battle HUD, battle interactions, forge, tower, inventory, league) → /ux-design at Pre-Production.

### Polish Layer (depends on everything)

1. **localization** — depends on: ui-shell; Vietnamese UI strings + EN content with VI glosses as an extraction discipline.
2. **analytics** — depends on: accounts-backend.
3. **real-pvp** — depends on: battle-system, accounts-backend; deferred post-MVP, optional, not designed until greenlit. GDD complete (2026-11-09, greenlit by explicit `/design-system real-pvp` invocation): server-authoritative reuse of battle's B1–B12 ("one formula module, two hosts"), R1–R8 formula series (band widening ±100→±300 GM 200/350, 250 ms latency credit cap, 20 s grace with a never-pausing engine, deterministic simultaneous-KO → tie = draw, B12 symmetric verdict), N1–N3 netcode mechanics (clock sync, queue flow, transport requirements); 19 edge cases; trust model made absolute per accounts-backend's recorded evolution; 41 ACs (qa-lead-validated) + 8 open questions OQ-RVP1–8 (build prerequisite: shared B-series module extraction). UX flag: matchmaking surface + PvP HUD variant → /ux-design at PvP implementation. Lean review 2026-11-09: NEEDS REVISION (1 blocking — R4 worked example) → revised same session (8 mechanical fixes; review log `reviews/real-pvp-review-log.md`). Lean re-review 2026-11-09 (fresh session, registry + 7 cross-doc files re-verified): **Approved** — all 8 fixes confirmed in content, 0 blocking, 3 advisory carried (Tuning Knobs / Player Fantasy sections at `full`-tier trigger; battle-status-row clause now historical).

---

## Recommended Design Order

| Order | System | Priority | Layer | Agent(s) | Est. Effort |
|-------|--------|----------|-------|----------|-------------|
| 1 | accounts-backend | MVP | Foundation | technical-director, systems-designer | M |
| 2 | question-content | MVP | Foundation | systems-designer | L |
| 3 | hero-class | MVP | Foundation | game-designer | S |
| 4 | opponent-ai | MVP | Core | game-designer | S |
| 5 | battle-system | MVP | Core | game-designer, systems-designer | L |
| 6 | equipment | MVP | Core | game-designer, economy-designer | M |
| 7 | forge-srs | MVP | Core | game-designer, systems-designer | M |
| 8 | speech-io | MVP | Audio | game-designer, audio-director | M |
| 9 | ui-shell | MVP | UI | ux-designer, ui-programmer | L |
| 10 | tower | MVP | Feature | game-designer, level-designer | M |
| 11 | meta-progression | Vertical Slice | Economy | economy-designer | M |
| 12 | ranked-league | Alpha | Meta | game-designer, live-ops-designer | M |
| 13 | localization | Alpha | UI | localization-lead | S |
| 14 | analytics | Full Vision | Meta | analytics-engineer | S |
| 15 | real-pvp | Full Vision | Gameplay | network-programmer | XL (deferred) |

Effort estimates: S = 1 session, M = 2-3 sessions, L = 4+ sessions.
A "session" is one focused design conversation producing a complete GDD.

---

## Circular Dependencies

- **battle-system <-> forge-srs <-> equipment**: battle produces cursed runes
  for forge; forge produces gear +levels for equipment; equipment produces the
  stats battle reads. **Resolution — break with two data contracts, no runtime
  cycle**: battle reads only a *LoadoutSnapshot* (plain data, published by
  equipment whenever the loadout changes — contract defined in the
  battle-system GDD); forge consumes only *BattleResult events* (cursed-rune
  list emitted at battle end — contract defined in the forge-srs GDD). Both
  GDDs must author their contract sections explicitly.

---

## High-Risk Systems

| System | Risk Type | Risk Description | Mitigation |
|--------|-----------|-----------------|------------|
| battle-system | Design | Fixed 4-question sets burn out the loop (concept's highest-priority gap); earned-mana arithmetic gap (3 rounds × +30 = 90 < 100 ult gate) | **Both gaps RESOLVED in the GDD (2026-11-09)**: k=1 draw per round-type pool with `battles_per_typical_session = 4` satisfying F5's guard; ult gate lowered to 90 (inclusive) — base gains and the 100 cap untouched. Residual risk: boss fights are outlast-only at base stats (OQ-BS2, owner balance pass) |
| question-content | Scope | Content volume (banks per CEFR band × module) is the long pole; 20 prototype questions are a template, not a library | Author the schema + pool-mixing rules first; treat "12,000+ từ vựng" as aspiration, not commitment |
| accounts-backend | Technical | New ground — prototype has zero backend; persistence boundary (server vs client-cached) undecided | Resolve persistence boundary as an ADR alongside the GDD; decide guest mode first |
| speech-io | Technical | Web Speech API voice availability/quality varies per browser/OS; listening rounds degrade unfairly | Design IPA-first fallback mode into the GDD; mic scoring stays simulated behind an interface (2026-11-08 decision) |
| forge-srs | Design | No real spacing in prototype — review is same-session; pitch promises "spaced-repetition" | **RESOLVED in the GDD (2026-11-09)**: real 3-box Leitner ladder (10 min / 24 h / 72 h, due_at per rune, server-clock eligibility); purification quiz = the ladder's third review; time-to-first-stone ≈ day 5–8 at p = 0.6–0.8 (floor ~4 days). Residual: QA needs a delay override to observe a full loop (OQ-FS1); onboarding acceleration = owner call (OQ-FS2) |

---

## Progress Tracker

| Metric | Count |
|--------|-------|
| Total systems identified | 15 |
| Design docs started | 14 (accounts-backend, question-content, hero-class, opponent-ai, battle-system, forge-srs, tower, speech-io, meta-progression, equipment, ranked-league, ui-shell, analytics, localization) |
| Design docs reviewed | 4 (game-concept.md — APPROVED; accounts-backend.md — APPROVED; question-content.md — APPROVED; hero-class.md — APPROVED, lean 2026-11-09) |
| Design docs approved | 6 (game-concept.md, accounts-backend.md, question-content.md, hero-class.md, battle-system.md, localization.md) |
| MVP systems designed | 10/10 (accounts-backend — Approved; question-content — Needs Revision, cross-review 2026-11-09; hero-class — Needs Revision, cross-review 2026-11-09; opponent-ai — Approved, lean 2026-11-09; battle-system — Needs Revision, cross-review 2026-11-09; forge-srs — Approved, lean 2026-11-09; tower — Approved, lean re-review #2 2026-11-09 (cross-review repairs verified); speech-io — Approved, lean re-review #3 2026-11-09; equipment — Approved, lean 2026-11-09; ui-shell — Approved, lean re-review 2026-11-09) |
| Vertical Slice systems designed | 1/1 (meta-progression — Designed pending review, 2026-11-09) |
| Alpha systems designed | 2/2 (ranked-league — Approved; localization — Approved, lean re-review 2026-11-09: repairs verified in-document, registry delta re-checked clean) |
| Full Vision systems designed | 2/2 (analytics — Approved 2026-11-09; real-pvp — Designed pending review, 2026-11-09) |

---

## Next Steps

- [x] Review and approve this systems enumeration (2026-11-08, guided session)
- [ ] Design MVP-tier systems first (use `/design-system [system-name]`, order above)
- [ ] Run `/design-review` on each completed GDD
- [ ] Run `/gate-check systems-design` (Concept → Systems Design gate) if still at stage Concept
- [ ] Run `/gate-check technical-setup` when MVP systems are designed
- [ ] Validate the highest-risk systems with `/vertical-slice` before committing to Production
