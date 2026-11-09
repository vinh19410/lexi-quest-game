# Question Content

> **Status**: In Design
> **Author**: [user + agents]
> **Last Updated**: 2026-11-08
> **Last Verified**: 2026-11-08
> **Implements Pillar**: Pillar 1 (Speed Is Damage — four question types anchor four language skills); Pillar 2 (Mistakes Are Materials — wrong answers become cursed runes; forge cards draw from the player's own mistakes)

## Summary

question-content is LexiQuest's content data layer: it defines the one schema
family every question uses (6 types in a discriminated union), the word
entries all questions reference, and the pool structure (module × stage/type)
battle, tower and forge draw from. It guarantees any question a consumer
selects is complete, valid and non-degenerate — enforced by a build-gate
validation pass and five pool-size minimums — while selection, scheduling and
delivery stay owned by battle-system, forge-srs and accounts-backend
respectively. It exists so the prototype's 20-question template can grow into
versioned production banks without any consumer inventing its own question
shape.

> **Quick reference** — Layer: `Foundation` · Priority: `MVP` · Key deps: `None` upstream (delivered via accounts-backend; 8 downstream dependents listed in Dependencies)

## Overview

question-content is LexiQuest's content data layer: it defines the schema every
answerable question uses (battle round questions, tower stage questions, forge
recall cards, forge filler cards), organizes that content into the four content
modules players self-select by CEFR and track, and owns the authoring rules that
keep a hand-authored bank consistent and playable at scale. It owns the *what* —
schemas, modules, pool structure, the glossary; it does not own the *how it
moves* (accounts-backend delivers and versions content payloads — Core Rule 7),
the *how it is picked* (battle-system owns per-battle mixing, resolved via
game-concept OQ#1; tower and forge-srs own their selection rules), or the *how
it is scheduled* (forge-srs owns SRS semantics). Without it, every consumer
invents its own question shape and the prototype's 20-question template can
never grow into the production banks the MVP hypothesis needs.

## Detailed Design

### Core Rules

1. **Content is hand-authored data.** Every question, word entry and module
   definition lives as data (JSON/TS data modules in a content directory) — no
   procedural generation (game-concept: "all content is hand-authored data";
   Forge filler draws randomly from existing entries, it does not generate
   content). Authoring happens in files; there is no runtime authoring UI at
   MVP.
2. **One schema family, discriminated by `type`.** Every question shares a base
   shape (`id`, `type`, `module`, `cefr`, `prompt`) and each type owns a
   distinct required payload (discriminated union):
   - `vocab_strike` — EN→VI meaning multiple choice; payload: `word_id`,
     `distractor_word_ids[]` (≥ 3, distinct, ≠ answer)
   - `grammar_shield` — grammar cloze/multiple choice; payload: `sentence_with_gap`,
     `options[]` (≥ 3, one correct), `correct_index`, `skill_note`
   - `listening_pierce` — audio-first; payload: `word_id`, `tts_text`, `ipa`,
     `distractor_word_ids[]` (≥ 3); rendered by speech-io (Web Speech TTS)
   - `spell_challenge` — spelling production; payload: `word_id`,
     `hint_vi_meaning`, `tile_letters` (pre-shuffled set incl. correct letters),
     `first_letter_assist_eligible: true`
   - `forge_recall` — Forge card; payload: `word_id`, `direction`
     (`en_vi` | `vi_en`), `distractor_word_ids[]` (≥ 3 for multiple-choice
     rendering; typed mode ignores them)
   - `forge_filler` — non-cursed glossary card used when a Forge session is
     short; payload: `word_id`, `direction`
   Consumers parse only the payload of the type they were given; unknown types
   are a build-time error (Rule 6), never a runtime surprise. **Strict schema
   (decision 2026-11-08):** a payload carrying a field not in its type's
   schema fails the build — this catches authoring typos outright and makes
   Core Rule 8's "no per-question difficulty field" mechanically enforced.
   Adding a field means changing the schema first, deliberately.
3. **Word entries are the atoms.** A glossary entry is the single source of a
   word's data; questions reference `word_id`, never inline strings. Fields
   (each has at least one consuming mechanic): `term`, `vi_meaning`,
   `ipa` (listening rounds, spell assist), `tts_text` (listening rounds —
   defaults to `term` when absent), `part_of_speech` (grammar distractor
   quality), `cefr`, `module_tags[]`, `etymology` (Etymology Charm passive),
   `example_sentence` (hint surface + authoring context), `status`
   (`active` | `deprecated` — deprecation is how a word exits the bank without
   breaking live player references; see Edge Case 6).
4. **Pools are keyed module × stage/type — never global.** Battle pools: one
   per module × round-type. Tower pools: one per module × stage (MVP req #5:
   per-stage question pools; a floor is 3 stages + boss, boss has its own pool).
   Forge: `forge_recall` cards are built from the player's cursed-rune queue
   (forge-srs owns which runes); `forge_filler` draws from the *global
   glossary*, unrestricted by module. Two pools never share entries by
   accident — sharing is an explicit authoring decision via `module_tags`.
5. **Ownership split — this system owns the *what*.** Schema, bank structure,
   authoring rules and content validation live here. The *how it is picked* is
   downstream: battle mixing (battle-system, game-concept OQ#1), tower stage
   selection (tower), Forge card selection and SRS scheduling (forge-srs). The
   *how it moves* is accounts-backend (Core Rule 7 there: versioned delivery,
   browser-storage cache). The *how it is scheduled* is forge-srs. This
   system's guarantee: any question a consumer's rule draws is complete,
   valid and unambiguous — every referenced `word_id` resolves, every payload
   field its type requires is present.
6. **Validation is a build gate, not a hope.** A validation pass runs at
   authoring/build time and fails the build on: duplicate ids anywhere;
   unresolvable `word_id` references; missing required payload fields per type;
   distractor counts below the type's minimum or containing the answer;
   `cefr` inconsistent with the owning module's band; `listening_pierce`
   entries missing both `tts_text` and `ipa`. Invalid content never ships and
   never reaches accounts-backend's payload.
7. **One global content version.** The deliverable is a single versioned
   payload (`version` + banks) — decision 2026-11-08, matching accounts-backend
   AC-D2's single-version cache contract. Any content change bumps the version;
   per-module versioning is post-MVP and would be a contract change requiring
   accounts-backend reconciliation.
8. **What this system does NOT own.** No difficulty math (opponent accuracy,
   damage scaling — battle-system/opponent-ai), no mixing policy, no
   scheduling (forge-srs), no delivery or caching (accounts-backend), no
   mastery records (records reference `word_id`s but belong to their own
   systems). It never decides which question a player sees — only what every
   possible question is.

### States and Transitions

Content lifecycle (authoring-side states — the client never sees these):

| State | Entered when | Transitions out | Effect |
|---|---|---|---|
| Draft | Content added or edited | → Validated (validation pass passes) / stays Draft (fails) | Not eligible for any payload |
| Validated | Validation pass (Core Rule 6) passes | → Published (bundled into the next content version) | Eligible for delivery |
| Published | Included in a released content payload | → Superseded (a newer version ships) | Served to clients at that version |
| Superseded | A newer content version replaced the payload | — | Client caches invalidate on next full app load (accounts-backend Core Rule 7); old version still playable mid-session (accounts-backend EC9) |

### Interactions with Other Systems

Downstream consumers (battle-system, tower, forge-srs, speech-io, equipment,
opponent-ai are undesigned — contracts marked provisional must be confirmed
when each GDD is authored):

| System | Data flow | Contract (provisional where noted) |
|---|---|---|
| battle-system | Consumes battle pools (module × round-type) from the payload | Mixing policy + draw counts owned by battle-system (OQ#1); this system guarantees pool validity and minimum sizes (Formulas) |
| tower | Consumes per-stage pools (module × stage incl. boss) | Tower owns stage selection, previews, progression; pre-battle vocabulary/grammar preview consumes word entries |
| forge-srs | `forge_recall` cards built from cursed runes; `forge_filler` drawn from global glossary | forge-srs owns which runes become cards and scheduling; this system owns card schema + filler pool |
| speech-io | Consumes `tts_text` + `ipa` from `listening_pierce` payloads | speech-io owns TTS rendering and degraded-mode fallback (e.g., IPA-first); fields exist here so fallback never needs schema changes |
| equipment | Passives consume word-entry data: Etymology Charm → `etymology`; 50/50 lifeline → distractor lists; first-letter spell assist → `term` | Equipment owns passive math; this system guarantees the fields its passives read exist and are populated |
| opponent-ai | Consumes the same question payload the player answers | Accuracy roll is opponent-ai's; questions carry no AI-specific data (no per-question difficulty field at MVP) |
| accounts-backend | Receives the content payload (`version` + banks) | Shape defined here (Core Rule 7); delivery, caching, version invalidation owned there (AC-D1/D2). Upstream *dependency*: this system cannot ship content without it |

Upstream dependencies: none — this system defines the content vocabulary
everything else consumes.

## Formulas

Five content-config quantities proposed by `systems-designer`, confirmed by
owner 2026-11-08. All live in ONE content-config data file
(`content/config/pool-minimums.ts`), consumed by Core Rule 6's build-gate
validation; battle-system, tower and forge-srs read the same constants — never
hardcode. No gameplay math lives here (damage/shield formulas are
battle-system's).

**Provisional assumptions** (confirm when the named GDD is authored):
- **A1 — CONFIRMED with one refinement 2026-11-09** (battle Rule 22): an MVP
  battle draws exactly k = 1 per round — from the module × round-type pool on
  friend/ranked encounters, from the mixed stage pool on tower encounters
  (battle selects the slice at draw time). F5's `k` stays 1.
- **A2 — RESOLVED 2026-11-09** (tower GDD authored): a tower stage battle is
  the standard 4-round battle shape, drawing k = 1 per round from the mixed
  module × stage pool under battle-system Rule 22 (composition gate ≥ 1
  question per round-type). Tower owns selection; battle owns the draw.

### F1 — Battle-pool minimum (per module × round-type)

The `min_battle_pool_size` formula is defined as:

`build gate: N_battle ≥ min_battle_pool_size` — the validation pass fails the
build on any battle pool below the minimum.

**Variables:**
| Variable | Type | Range | Source | Description |
|----------|------|-------|--------|-------------|
| `N_battle` | int | ≥ 0 (gate: ≥ 8) | calculated | Valid questions in one module × round-type battle pool |
| `min_battle_pool_size` | int | safe 8–16; default **8** | data file (content-config) | Build-gate floor per battle pool |

**Output Range:** pass/fail. At the default 8 with one draw per round-type
(A1): 8 consecutive battles before any question repeats in that round type —
roughly two sittings, attacking design risk #1 (fixed-question burnout).
Authoring load is small: vocab_strike, listening_pierce and spell_challenge
all reference `word_id`, so ~8 words + 8 grammar sentences per module populate
all four pools.

### F2 — Tower stage-pool minimum (per module × stage, non-boss)

The `min_tower_stage_pool_size` formula is defined as:

`build gate: N_stage ≥ min_tower_stage_pool_size`

**Variables:**
| Variable | Type | Range | Source | Description |
|----------|------|-------|--------|-------------|
| `N_stage` | int | ≥ 0 (gate: ≥ 6) | calculated | Valid questions in one module × stage pool (mixed round types) |
| `min_tower_stage_pool_size` | int | safe 6–12; default **6** | data file (content-config) | Build-gate floor per stage pool |

**Output Range:** pass/fail. A stage battle draws k = 1 per round — 4 questions
per attempt (A2, resolved): gate 6 guarantees no duplicate within one attempt
and at least 2 differing questions between consecutive attempts of the same
stage (pigeonhole: 6 − 4 = 2) — retries stay non-degenerate without
production-scale banks. A full 4-question repeat across attempts is possible
at minimum pool size (chance 1/15 — tower's retry-variety Edge Case): variety
comes from pool breadth, not a draw guarantee. The composition gate
additionally requires ≥ 1 question per round-type. Below 6, stage retries
collapse into near-identical fights.

### F3 — Tower boss-pool minimum (per module × boss)

The `min_tower_boss_pool_size` formula is defined as:

`build gate: N_boss ≥ min_tower_boss_pool_size`

**Variables:**
| Variable | Type | Range | Source | Description |
|----------|------|-------|--------|-------------|
| `N_boss` | int | ≥ 0 (gate: ≥ 4) | calculated | Valid questions in one module × boss pool |
| `min_tower_boss_pool_size` | int | safe 4–8; default **4** | data file (content-config) | Build-gate floor per boss pool |

**Output Range:** pass/fail. Bosses get a deliberately *lower* minimum: gate 4
equals battle length, so a boss fight never repeats a question within itself
but may replay the same 4 across attempts. The composition gate (≥ 1 question
per round-type) applies to boss pools too. Bosses are checkpoint content
fought ~once per floor at MVP — repetition pressure is the lowest of any pool,
and a 6+ gate would multiply authoring cost for the least-revisited content.
Raise toward 6+ if boss floors become replayable grind content post-MVP.

### F4 — Global glossary minimum (forge_filler + distractor headroom)

The `min_global_glossary_size` formula is defined as:

`build gate: N_glossary ≥ min_global_glossary_size`

**Variables:**
| Variable | Type | Range | Source | Description |
|----------|------|-------|--------|-------------|
| `N_glossary` | int | ≥ 0 (gate: ≥ 24) | calculated | Glossary entries across all modules |
| `min_global_glossary_size` | int | safe 24–120; default **24** | data file (content-config) | Build-gate floor on the global glossary |

**Output Range:** pass/fail. forge_filler draws unrestricted from the global
glossary (Core Rule 4): below ~4 words no multiple-choice question can satisfy
the ≥ 3-distinct-distractor payload rule; below ~20, a short Forge session
(≈ 5 filler cards) visibly repeats. 24 keeps degeneracy bounded (expected
duplicate pairs in a 5-card session = C(5,2)/24 ≈ 0.42 — most sessions clean).
The MVP bank ships 32 entries — an authoring target, not the gate (registry
note) — matching the prototype's validated 29-word scale with headroom.
Derived authoring note: at MVP, one vocab question per word implies per-module
distinct words ≥ `N_battle` (8) — the build gate checks module word count
alongside pool counts.

### F5 — Interaction rule — battles-before-repeat

The `battles_before_repeat` formula is defined as:

`battles_before_repeat = floor(N_pool / k)`

**Variables:**
| Variable | Type | Range | Source | Description |
|----------|------|-------|--------|-------------|
| `N_pool` | int | 4–16 | calculated | Size of the pool being drawn from (battle `N_battle` or stage/boss pool) |
| `k` | int | 1–4 | calculated | Maximum questions drawn from that ONE pool in a single battle |
| `battles_before_repeat` | int | 1–16 | calculated | Consecutive battles before any question in that pool must repeat (under a no-immediate-repeat draw policy owned by battle-system) |

**Output Range:** bounded 1–16; no clamping needed — `floor()` and the gated
pool minimums bound it. Degenerate floor 1 = floor(4/4): a boss pool at gate
drawing its whole pool in one fight — exactly why F3's gate equals battle
length is acceptable only for bosses. **Design rule:** require
`battles_before_repeat ≥ 2 × battles_per_typical_session` per mode so a player
never sees a repeat within two sittings (the burnout guard) —
`battles_per_typical_session` is battle-system's to define (OQ#1). At
defaults: k=1, N_battle=8 → 8 battles per round-type.

**Example:** defaults — battle pool: floor(8/1) = 8 battles before repeat; a
battle shows 4 of 8×4 = 32 distinct module questions. If battle-system later
mixes 2 vocab draws per battle (k=2): floor(8/2) = 4 battles — the signal to
raise `N_battle` within its band. Boss: floor(4/4) = 1 battle of unique
content, accepted per F3. Derived variety stat: `distinct_battle_sequences =
N_vocab × N_grammar × N_listening × N_spell` = 8⁴ = 4,096 per module at
defaults — the emergent payoff of per-round-type pools over one mixed battle
pool.

## Edge Cases

- **If a word appears in several modules or several pools** (via
  `module_tags`): intentional sharing — each pool reference is independent and
  the build gate validates each pool separately. Sharing is explicit
  (Core Rule 4); a word never lands in a pool by inference.
- **If a distractor list contains the answer's `word_id`**: the build gate
  fails that question — a question whose correct answer is also offered as a
  wrong option is unplayable.
- **If two glossary entries share a `vi_meaning`** (synonyms): any `vi_en`
  multiple-choice question (forge card or battle round) drawing both becomes
  ambiguous — the player's correct translation is marked wrong. A duplicate
  `vi_meaning` *pair in the glossary alone* is a build **warning** (synonyms
  may stay); the same pair *inside one `vi_en` question* (answer + distractor
  set) is a build **failure** — the warning cannot be ignored into a
  question.
- **If a `listening_pierce` entry lacks `tts_text` but has `ipa`**: playable —
  `tts_text` defaults to `term` (Core Rule 3). If it lacks **both**: the build
  gate fails it (Core Rule 6) — speech-io's degraded mode needs at least one
  signal to fall back to.
- **If `tile_letters` does not match the term's letters** (`spell_challenge`):
  the build gate requires tile multiset = term letter multiset
  (case-insensitive, duplicates included — "apple" → a,p,p,l,e). A typo'd tile
  set makes the word unspellable and the round unwinnable.
- **If a word entry is removed while live player state references it**
  (cursed runes in queues, records, mastered-word lists persist in
  accounts-backend across content versions): hard deletion is forbidden — the
  entry is **deprecated** (kept in the glossary, excluded from new pool
  authoring) while any live `word_id` reference exists. Runtime last resort:
  forge-srs skips a card whose word no longer resolves (that GDD must specify;
  provisional). This is the one case the build gate cannot catch — it guards
  authoring, not other players' saved state.
- **If a module declares a tower stage pool but not the full floor** (3 stages
  + boss): the build gate fails — a module is tower-playable only with a
  complete floor, so a player can never hit a mid-ladder dead end.
- **If content edits drop a pool below its F1–F4 minimum**: the build fails —
  an invalid payload never ships and never reaches accounts-backend
  (Core Rule 6). There is no runtime pool-size check: gate at authoring, trust
  the shipped version.
- **If the content version changes mid-session**: the client keeps playing its
  cached version until the next full app load (accounts-backend Edge Case 9);
  this system's single-version payload (Core Rule 7) is what makes that
  guarantee possible — banks are version-tagged as a unit.
- **If forge_filler draws a word currently in the player's rune queue**:
  forbidden — the filler draw excludes the player's current cursed-rune words
  (forge-srs owns the draw; this exclusion rule is part of the filler pool
  contract here). Pillar 2 (Mistakes Are Materials): forge cards come from *your* mistakes; a filler
  card that is secretly one of your runes blurs that line and pre-teaches the
  answer before its real review.
- **If duplicate ids exist anywhere in the bank**: the build gate fails with
  file + id reported — no partial payload is ever produced (a duplicated
  question id would silently make two pools draw the same question).

## Dependencies

**Upstream: none by design; one delivery dependency.** This system defines the
content vocabulary — no system feeds it data. Its content reaching players,
however, runs entirely through **accounts-backend** (delivery + versioning,
Core Rule 7 there) — listed below as a Hard dependency on delivery, while
authoring itself needs nothing upstream.

**Downstream dependents** (bidirectional note: each listed GDD must name this
system in its own Dependencies section once authored; contracts are provisional
until then). Hard = cannot function without it; Soft = enhanced by it.

| System | Tier | Hard/Soft | Interface | Owner of semantics |
|---|---|---|---|---|
| accounts-backend | MVP | Hard (delivery) | Content payload (`version` + banks) it stores and serves; cache/version contract per its AC-D1/D2 | Payload shape owned here; transport, caching, invalidation owned there |
| battle-system | MVP | Hard | Battle pools (module × round-type) | battle-system owns mixing policy + draw counts (OQ#1) |
| tower | MVP | Hard | Per-stage pools (module × stage, incl. boss pools); word entries for stage previews | tower owns stage selection + progression |
| forge-srs | MVP | Hard | `forge_recall` card schema; `forge_filler` draws from global glossary | forge-srs owns rune selection + scheduling |
| speech-io | MVP | Hard (listening rounds) | `tts_text` + `ipa` fields on listening payloads | speech-io owns TTS rendering + fallback |
| equipment | MVP | Soft | Word-entry fields its passives read (`etymology`, distractor lists, `term`) | equipment owns passive math |
| opponent-ai | MVP | Soft | Same question payload the player answers | opponent-ai owns the accuracy roll |
| meta-progression | Vertical Slice | Soft | Records reference `word_id`s (mastered words, speed-scores) | meta-progression owns record semantics |
| localization | Alpha | Soft | `vi_meaning` and the glossary's VI fields exposed as keyed content fields; localization consumes glosses as keyed content fields, never edits them (its Core Rule 6) | question-content owns gloss semantics |

**Systems-index discrepancy note:** the index's equipment row lists only
`hero-class, forge-srs`, but this GDD names equipment as a Soft dependent
(its passives read `etymology`, distractor lists and `term`) — when the
equipment GDD is authored, its Dependencies section must name this system
(and the index row should gain it). The forge-srs row already names
question-content (card schema + filler pool).

## Visual/Audio Requirements

None owned by this system — it is a data layer with no visual or audio surface
of its own. It *carries* audio-adjacent data (`tts_text`, `ipa` on listening
and word entries) that speech-io renders, and its questions render inside
consumers' screens (battle, tower, forge — owned by ui-shell's specs there).
(`art-director` / `audio-director` not consulted — Lean mode; the skip is by
rule, not oversight.)

## Game Feel

No interaction surface of its own, but content quality is a feel input:
distractors should be *near misses* (same part of speech, plausible
translations) rather than random — a question with an absurd distractor reads
as filler and deflates the battle. Authoring guidance, not a formula: prefer
distractors drawn from the same `cefr` band and `part_of_speech` as the
answer. Perceived responsiveness of content itself (cache-first rendering) is
accounts-backend's feel budget.

## UI Requirements

None owned. The payload must be *render-complete* — no placeholder strings
("TODO", empty prompts) may ship: the build gate treats an empty `prompt` or
`vi_meaning` as a missing required field (Core Rule 6).

## Cross-References

| Referenced GDD | What is referenced | Where in this GDD |
|---|---|---|
| design/gdd/accounts-backend.md (authored) | Delivery/versioning vs schema ownership split; AC-D1/D2; Edge Case 9 (mid-session version) | Core Rule 7; Edge Cases; Dependencies; Interactions |
| design/gdd/battle-system.md | Mixing policy (game-concept OQ#1 — resolved by battle Rule 22's encounter-keyed pools); pool consumption; `k` in F5 | Core Rules 4–5; Interactions; F5 |
| design/gdd/tower.md | Per-stage pools; complete-floor rule; previews | Core Rule 4; Edge Cases; Dependencies |
| design/gdd/forge-srs.md | Rune→card build; filler draw + exclusion rule; scheduling | Core Rules 4–5; Edge Cases; Dependencies |
| design/gdd/speech-io.md | `tts_text`/`ipa` consumption; degraded mode | Core Rule 3; Interactions |
| design/gdd/equipment.md | Passives reading word fields (etymology, distractors, term) | Core Rule 3; Interactions |
| design/gdd/opponent-ai.md | Same-payload consumption; no difficulty field | Interactions |
| design/gdd/game-concept.md | OQ#1 pointer; hand-authored content; Pillars 1/4 | Overview; Core Rule 1 |

## Acceptance Criteria

*Criteria set drafted by the main review and coverage-validated by `qa-lead`
(2026-11-08): 16 criteria covering 8/8 Core Rules, F1–F5, and 11/11 Edge
Cases. E9 is verified via accounts-backend AC-E5 (its local anchor here is
AC-QC6 — the payload moves as one versioned unit); E10's filler-rune
exclusion is forge-srs runtime behaviour — a provisional contract verified in
that GDD's ACs, with no local criterion (this system's build gate cannot see a
player's rune queue). Each criterion is independently verifiable without
reading this document.*

### Schema & Bank

- **AC-QC1** *(Core Rule 1)* — GIVEN the content directory and a completed
  build, WHEN the payload's id sets (questions, words, modules) are compared
  with the data files, THEN they are exactly equal — no extra, no missing id
  (no runtime generation; the no-authoring-UI half is verified by code review
  per AC-QC7).
- **AC-QC2** *(Core Rule 2)* — GIVEN one test question per each of the 6
  types, each missing its type's required payload field, WHEN validation
  runs, THEN each fails with the missing field named; and GIVEN the same 6
  fully populated, THEN each passes.
- **AC-QC3** *(Core Rules 3, 5)* — GIVEN any pool in the shipped payload,
  WHEN each member is resolved, THEN every referenced `word_id` resolves to a
  glossary entry, every payload field that member's type requires is present
  and non-empty, and the member sits in a pool key matching its declared
  module (module × round-type for battle pools, module × stage for tower
  pools).
- **AC-QC4** *(Core Rule 4; Edge Case 1)* — GIVEN the shipped payload, WHEN
  pools are enumerated, THEN battle pools are keyed exactly module ×
  round-type, tower pools exactly module × stage (boss separate),
  `forge_recall` has no stored pool (built at runtime from the rune queue),
  and `forge_filler`'s declared source is the global glossary; AND GIVEN a
  word referenced by pools of two different modules, WHEN validation runs,
  THEN it passes — duplicate-id detection applies to bank *definitions*, never
  to cross-pool *references* (intentional sharing).
- **AC-QC5** *(Core Rule 6; Edge Cases 2, 5, 11)* — GIVEN one bank containing
  each defect class — duplicate id; unresolvable `word_id`; missing required
  payload field; **unknown field** (strict schema); **unknown type** outside
  the discriminated union; distractor count below the type minimum;
  **duplicate distractor**; distractor containing the answer; **out-of-range
  enum value** (`direction`, `cefr`); `cefr` inconsistent with module band;
  `listening_pierce` missing both `tts_text` and `ipa`; `tile_letters`
  multiset ≠ term letters (duplicate-letter case: "apple" missing a p);
  **declared module missing one of its 4 battle pools** — WHEN validation
  runs, THEN each defect fails the build with the specific gate, file and id
  reported, and no payload is emitted; AND GIVEN a bank with none of these
  defects, THEN validation passes and a payload is emitted (negative control —
  the gate must not be a detector that always fails).
- **AC-QC6** *(Core Rule 7)* — GIVEN two builds where any content file
  changed between them, WHEN both payloads are produced, THEN their global
  version fields differ; and GIVEN identical inputs, THEN the version is
  identical (deterministic).
- **AC-QC7** *(Core Rule 8)* — architectural, verified by code review (the
  weakest-tested rule, by design of what the system is): the question-content
  module exposes no question-selection, mixing, or scheduling API in its
  exports; strict schema (AC-QC5's unknown-field class) mechanically enforces
  "no per-question difficulty field".

### Formulas

- **AC-QF1** *(F1)* — GIVEN a module × round-type pool with 7 valid
  questions, WHEN validation runs, THEN the build fails citing the
  battle-pool gate; with 8, it passes.
- **AC-QF2** *(F2)* — GIVEN a module × stage pool with 5, WHEN validation
  runs, THEN the build fails citing the stage-pool gate; with 6, it passes.
- **AC-QF2b** *(F2, composition gate)* — GIVEN a module × stage pool of 6 or
  more questions containing no listening item, WHEN validation runs, THEN the
  build fails citing the composition gate (≥ 1 question per round-type); with
  one of each round-type added, it passes.
- **AC-QF3** *(F3)* — GIVEN a boss pool with 3, WHEN validation runs, THEN
  the build fails citing the boss-pool gate; with 4, it passes.
- **AC-QF4** *(F4)* — WITH `min_global_glossary_size` = 24 (band floor):
  23 entries fail citing the glossary gate, 24 pass; WITH the gate raised to the 32-entry bank target:
  31 fail, 32 pass. AND GIVEN any module with fewer distinct words than F1's
  minimum (8), THEN the build fails.
- **AC-QF5** *(F5)* — GIVEN (N_pool=8, k=1), (8, 2), (4, 4), WHEN
  `battles_before_repeat` is computed, THEN the results are 8, 4, 1
  (pure unit test; the `battles_per_typical_session` design rule is
  battle-system's and out of scope here).

### Edge Cases

- **AC-QE1** *(Edge Case 6)* — GIVEN a golden payload (checked-in fixture)
  containing word W, WHEN a new build removes W outright, THEN the build
  fails; and WHEN W is instead marked `status: deprecated` (kept in the
  glossary), THEN the build passes.
- **AC-QE2** *(Edge Case 3)* — GIVEN two glossary entries with identical
  `vi_meaning` co-occurring inside one `vi_en` question (answer + distractor
  set), WHEN validation runs, THEN the build fails; and GIVEN the pair exists
  only in the glossary (never co-occurring in a question), THEN the build
  emits a warning and passes.
- **AC-QE3** *(Edge Case 4, positive half)* — GIVEN a `listening_pierce`
  question whose word carries `ipa` but no `tts_text`, WHEN validation runs,
  THEN it passes (`tts_text` defaults to `term` per Core Rule 3) — the
  both-missing failure is covered in AC-QC5.
- **AC-QE4** *(Edge Case 7)* — GIVEN a module declaring any tower content
  with an incomplete floor — a missing boss pool, 2 of 3 stage pools, or no
  stage pools at all — WHEN validation runs, THEN the build fails with the
  incomplete floor named.

### Coverage and test notes

- Full coverage: 8/8 Core Rules, F1–F5, 11/11 Edge Cases (E1→AC-QC4,
  E2→AC-QC5, E3→AC-QE2, E4→AC-QE3+AC-QC5, E5→AC-QC5, E6→AC-QE1,
  E7→AC-QE4, E8→AC-QF1–QF4, E9→accounts-backend AC-E5 anchored by AC-QC6,
  E10→documented hand-off to forge-srs ACs, E11→AC-QC5).
- The build gate is the system's primary artifact: AC-QC2/QC4/QC6/QE1/QE3/
  QE4/QE5 and AC-QF1–QF4 are integration tests of the validation tool
  (`tests/integration/question-content/`); AC-QF5 is a pure unit test
  (`tests/unit/question-content/`); AC-QC7 is code review.
- AC-QF4 tests the gate at both the band floor (24) and the 32-entry
  authoring target — they differ by design.
- Fixture note: gate-value fixtures assert *which gate* fired, not just
  "build failed" — an unrelated earlier failure must not count as a pass.

## Open Questions

| # | Question | Owner | Target resolution |
|---|---|---|---|
| 1 | A1: does an MVP battle draw exactly 1 question per round-type pool? (F5's `k` already handles more) | game-designer | At battle-system GDD (OQ#1) |
| 2 | ~~A2: is a tower stage battle the same 4-round draw from the mixed stage pool?~~ **RESOLVED 2026-11-09** — yes: standard 4-round shape, k = 1 per round from the mixed pool under battle Rule 22 (composition gate ≥ 1 per round-type); tower owns selection, battle owns the draw | tower + battle-system GDDs | closed |
| 3 | `battles_per_typical_session` per mode — needed to apply F5's burnout-guard rule | game-designer | At battle-system GDD |
| 4 | Production content volume per module (word count, pools per CEFR band) — MVP minimums here are floors, not targets | producer | Before Alpha content authoring |
| 5 | Authoring workflow + pedagogical review pass (who writes content, who reviews quality) | producer + game-designer | Before content production starts |
| 6 | Deprecated-word GC: when is a deprecated entry truly deletable (needs a live-reference check against accounts-backend data) | technical-director | With companion ADR |
