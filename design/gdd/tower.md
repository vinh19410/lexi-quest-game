# Tower PvE

> **Status**: In Design
> **Author**: user + game-designer (main session), systems-designer (Formulas), qa-lead (ACs)
> **Last Updated**: 2026-11-09
> **Last Verified**: 2026-11-09
> **Implements Pillar**: 3 (Knowledge Is Gear) — four content modules as climbable floors; 2 (Mistakes Are Materials, indirectly: retry loop)

## Summary

tower is LexiQuest's single-player progression campaign: the four study
modules become climbable floors — each 3 stage battles plus a boss — where
sequential unlocks turn study tracks into territory to conquer. For every
attempt tower composes the encounter configuration, shows a deterministic
vocabulary/grammar preview of the upcoming pool, hands the fight unchanged
to battle-system, and applies the result: victory unlocks the next stage
(the boss clear conquers the floor), defeat costs nothing but the attempt.
It exists to give the short 4-round duel a long-horizon goal — locked floors
and boss checkpoints are the curiosity engine that pulls players back, and
the preview turns each locked door into a visible study list.

> **Quick reference** — Layer: `Feature` · Priority: `MVP` · Key deps: `battle-system, question-content, opponent-ai, accounts-backend`

## Overview

tower is LexiQuest's single-player progression campaign: the four content
modules players self-select are structured as climbable tower floors — each a
fixed ladder of 3 stage battles plus one boss battle — where sequential
unlocks turn "study module" into "territory to conquer". Mechanically it owns
**selection and progression, never the fight**: for each attempt it composes
the encounter configuration (module, stage number, encounter type
`tower_stage | tower_boss`), runs the pre-battle vocabulary/grammar preview
from the module's word entries, hands the config to battle-system, and applies
the returned result — victory unlocks the next stage (boss victory clears the
floor), defeat consumes nothing but a retry. It exists because the MVP
hypothesis needs a long-horizon goal the short 4-round battle cannot supply:
curiosity pulls players toward locked floors and boss checkpoints
(game-concept Flow State), each floor is a discrete, shareable achievement,
and every battle inside it re-exercises one module's vocabulary until the
player can beat it — the study loop wearing an adventure's clothes. Without
it, battles have no arc: the player wins or loses a duel and nothing changes.

## Detailed Design

### Core Rules

> **Source**: game-concept Core Mechanic #5 ("four content modules as tower
> floors (3 stages + boss), sequential unlocks, pre-battle vocabulary/grammar
> preview") and MVP req #5 ("Tower PvE on one module, then all four, with
> per-stage question pools"). Numbers the registry already owns
> (`ghost_hp_tower_stage` / `ghost_hp_boss`, `ghost_accuracy_tower_stage` /
> `ghost_accuracy_tower_boss`, `min_tower_*_pool_size`,
> `answer_reveal_delay_ms_tower_*`) are referenced, never redefined.

1. **Structure — one floor per module; a floor is 3 stages + 1 boss.** The
   tower has exactly 4 floors, one per content module, in the modules' fixed
   content order (module 1 = floor 1, …). Floor *n* contains stages 1–3 and
   one boss battle: **4 battles per floor, 16 battles of tower content at full
   content scale**. MVP ships floor 1 (module 1); floors 2–4 open as their
   modules' content passes build-gate validation — the structure is
   data-defined, so no GDD change is needed when they land.
2. **Sequential unlock (F1).** Floor *n* is unlocked iff floor *n−1*'s boss
   is cleared (floor 1 is unlocked for every player). Within a floor, stage
   *s* is unlocked iff stage *s−1* is cleared (stage 1 is unlocked with the
   floor). The boss is unlocked iff all 3 stages are cleared. There is no
   back-door, purchase, or level-based unlock — the boss clear is the only
   key. This is the curiosity engine game-concept names: locked floors are
   the *visible* goal.
3. **Encounter configuration is tower's one product.** For each attempt tower
   composes and hands battle-system exactly one config:
   `{ module_id, stage_ref (1|2|3|boss), encounter_type ("tower_stage" |
   "tower_boss"), ghost_profile_ref }`. Tower never picks questions —
   battle-system draws from the module × stage pool per its Rule 22 — and
   never sets stats: the ghost profile (HP 420 stage / 600 boss, accuracy
   0.55 / 0.75, reveal delays 1200 / 1500 ms) comes from opponent-ai's
   profiles by `encounter_type` **(profile contract confirmed by this GDD —
   values match opponent-ai's Approved GDD and active registry entries,
   closing the confirmation its Dependencies row requested)**. Encounter
   *selection* lives here; the *fight* lives in battle-system (its
   Dependencies row, honored).
4. **A tower battle is the standard 4-round battle (A2 adopted).** Stages and
   boss both use the unchanged 4-round shape (`vocab_strike`,
   `grammar_shield`, `listening_pierce`, `ultimate_burst`) drawing its
   questions k = 1 per round from the stage's mixed module × stage pool
   (battle-system Rule 22's seeded draw — tower never picks; question-content
   F2/F3 minimums: stage pools ≥ 6, boss pool ≥ 4; composition gate ≥ 1
   question per round-type). Tower adds no round types, no
   modifiers, and no HP/damage scaling of its own — difficulty is carried
   entirely by the ghost tiers and the content itself.
5. **Pre-battle preview (F3).** Before every tower attempt (stage or boss),
   tower composes a vocabulary/grammar preview: the set of `word_id`s
   referenced by the upcoming pool's questions, each rendered as term + VI
   gloss + grammar point tag. The preview is **deterministic** (pure union of
   the pool — no RNG, no "hot streak" concealment) and **skippable**, but
   always shown first. Rationale: the preview is Pillar 3's study scaffold —
   it converts a locked floor into a visible study list *before* the fight,
   which is the tower's distinct contribution to learning; hiding it would
   make the tower a pure difficulty check.
6. **Defeat costs nothing but the attempt.** A stage or boss defeat ends the
   battle, records the attempt via accounts-backend's `tower stage result`
   commit point, and returns the player to the stage select with an immediate
   retry available. **No energy, lives, keys, or wait timers at MVP** (the
   anti-monetization stance is explicit in game-concept). Question variety
   across retries comes from pool breadth, not a draw guarantee: ≥ 6
   stage-pool questions with 4 drawn means any two attempts **overlap in at
   least 2 questions, and an exact 4-question repeat is possible** (at the
   6-question minimum, a 1/C(6,4) = 1/15 ≈ 6.7% chance per retry pair under
   independent seeded draws) — accepted; the variety lever is pool size
   (OQ-TW2). *(This corrects the stronger "≥ 2 differing questions between
   consecutive retries" phrasing inherited from question-content F2's pool
   note, which battle-system's k=1 seeded draw does not guarantee — flagged
   to question-content's owner.)*
7. **Cleared content is replayable; repeat questions are accepted.** Any
   cleared stage (and the cleared boss) can be replayed freely — replays emit
   normal battle rewards and count as practice, but never change progression
   state (already-cleared stays cleared). Cross-attempt question repeats in a
   small boss pool are accepted by design (question-content F3's note);
   **if boss floors turn into a replay-grind meta, raising
   `min_tower_boss_pool_size` to 6+ is the lever — flagged, not decided**.
8. **Progression state is small, server-owned, and event-complete.** Tower
   state is exactly: per module, per stage/boss — `cleared: bool` (plus
   implicit unlock derived by F1 from cleared flags; nothing else is stored —
   no attempt counts, no stars, no per-stage scores at MVP). It reaches the
   server through accounts-backend's existing commit point ("tower stage
   result", atomic with the battle result) and is re-derived from it on load.
   (Display-only progress — floor-map percentage — is derived by F2, never
   stored.)
9. **Tower grants no rewards of its own at MVP.** Gold/XP flow from
   battle-system's Rule 21 events (tower-boss stages already emit the higher
   `gold 250`); tower *emits* a `floor_cleared(module_id)` event when a boss
   first falls, consumed by meta-progression for quests/records
   **(provisional — meta-progression is Vertical-Slice tier and undesigned;
   ui-shell may read the same event for a floor-clear celebration)**. Any
   one-time clear bonus is meta-progression's value to own, not this GDD's.
10. **Honest-ghost and content discipline carry over unchanged.** Ghost
    presentation, question validity, and CEFR banding are owned upstream;
    tower's only content rule is that an encounter config must reference a
    module whose payload passed build-gate validation (question-content Rule
    6) — an unvalidated module can never be a floor.

### States and Transitions

Tower is a small state machine over per-floor progression plus a per-attempt
session flow.

**Per-floor progression state** (stored, server-side via accounts-backend):

| State | Meaning | Transition in | Transition out |
|---|---|---|---|
| `Locked` | Boss of prior floor uncleared | — | → `Unlocked` (F1 satisfied) |
| `Unlocked` | Reachable, no stage cleared | F1 satisfied | → per-stage sub-state below |

Per-stage sub-states (stages 1–3 and boss, within an `Unlocked` floor):
`Locked` → `Unlocked` (prior stage cleared) → `Cleared` (victory). Boss
sub-state additionally drives the floor's own `Locked → Unlocked` transition
for the next floor (F1).

**Per-attempt session flow** (ephemeral, client-side until the result commit):

| State | What happens | Exits |
|---|---|---|
| `Selecting` | Stage select for an unlocked floor; locked entries render with unlock condition | → `Previewing` (player picks an unlocked, uncleared-or-cleared stage) |
| `Previewing` | Compose + show preview (Rule 5); skip available | → `Battling` (start) · → `Selecting` (back) |
| `Battling` | battle-system owns everything; tower is idle | → `Resolved` (battle result event) |
| `Resolved` | Apply result: victory → mark cleared, emit `floor_cleared` if boss first-clear; defeat → mark nothing | → `Selecting` (retry/continue) |

### Interactions with Other Systems

| System | Direction | Interface | Owner of semantics | Status |
|---|---|---|---|---|
| battle-system | Upstream — Hard | Tower → encounter config (Core Rule 3); battle → result incl. victory + reward events | tower owns selection/progression; battle owns the fight | battle GDD Approved — contract confirmed both directions |
| question-content | Upstream — Hard | Module × stage pools (incl. boss pool) for the battle draw; word entries (term, VI gloss, grammar tag, etymology) for the preview (F3) | question-content owns schema, pool minimums (F2/F3), validation; tower owns selection + preview composition | GDD Approved — **A2 (4-round stage battle, tower draws) confirmed adopted as Core Rule 4** |
| opponent-ai | Upstream — Hard | `GhostProfile` per encounter type (HP 420/600, accuracy 0.55/0.75, reveal delays 1200/1500 ms) referenced by `ghost_profile_ref` | opponent-ai owns profile data + roll; tower only references | GDD Approved — **profile contract confirmed by Core Rule 3, closing the confirmation its Dependencies row requested** (its own row's "Confirm with tower GDD" proviso can drop at its next edit) |
| accounts-backend | Upstream — Hard (persistence) | `tower stage result` commit point (atomic with battle result); server-side storage of per-stage cleared flags; content payload fetch | accounts-backend owns storage/commit; tower owns state semantics | GDD Approved — commit point already specified (Core Rule 5 there) |
| ui-shell | Downstream — Soft | Floor map + stage select rendering, preview screen, locked-floor display with unlock condition, floor-clear celebration | ui-shell owns all screens; tower owns the state they render | GDD not yet authored (MVP) — UX flag below |
| meta-progression | Downstream — Soft | Tower-encounter victories via the committed `BattleResult`'s encounter type (`tower_stage`/`tower_boss`) — one quest's progress source. `floor_cleared` is **emitted but deliberately unconsumed** by meta (its Core Rule 8: a first-clear-only event would strand the quest) | meta-progression owns quest mapping + ledger semantics | GDD Approved — divergence recorded, row re-keyed per its carry-in |

## Formulas

> **Source**: systems-designer consultation, 2026-11-09. tower owns exactly
> three formulas — all pure functions of (stored cleared flags, validated
> content payload, registry constants). No clocks, no RNG, no rounding (the
> global round-half-up convention is never exercised here); every formula is
> headless-testable. Ghost accuracy/HP/reveal delays and battle rewards are
> referenced from opponent-ai and battle-system, never re-owned. Numbering
> note: F1 and F3 were cited by Core Rules 2 and 5 before this section was
> authored; F2 fills the open slot so all cross-references stay correct.

The unlock predicates formula is defined as:

`floor_unlocked(n) = (n = 1) OR boss_cleared(n-1)`

`stage_unlocked(n, s) = floor_unlocked(n) AND (s = 1 OR stage_cleared(n, s-1))`

`boss_unlocked(n) = stage_cleared(n, 1) AND stage_cleared(n, 2) AND stage_cleared(n, 3)`

**Variables:**

| Variable | Type | Range | Source | Description |
|----------|------|-------|--------|-------------|
| `n` | int | 1–4 (MVP: 1 only) | data file — fixed content-order-to-floor mapping | Floor index |
| `s` | int | 1–3 | data file | Stage index within a floor |
| `stage_cleared(n, s)` | bool | {true, false} | server (accounts-backend "tower stage result" commit), re-derived on load | Stored progression flag |
| `boss_cleared(n)` | bool | {true, false} | server (same commit) | Stored boss flag |
| `floor_unlocked` / `stage_unlocked` / `boss_unlocked` | bool | {true, false} | calculated | Rendered state; **never stored** |

**Output Range:** boolean; monotone in the cleared flags (once unlocked,
always unlocked — flags never unset). Three structural boundaries:
`floor_unlocked(1)` is unconditionally true (implementations must never
dereference floor 0); `stage_unlocked(n, 1)` reduces to `floor_unlocked(n)`;
`boss_unlocked` requires all three individual stage flags — no count
aggregate, so no "2 of 3 + boss" glitch state can exist.

**Example:** stages 1–2 cleared on floor 1: `boss_unlocked(1)` = false,
`stage_unlocked(1, 3)` = true, `floor_unlocked(2)` = false. Beating stage 3
unlocks the boss; the boss falling fires `floor_cleared("module-1")` exactly
once and flips `floor_unlocked(2)`.

**Adjunct firing rule** (same transition family): the `floor_cleared(n)`
event (Core Rule 9) fires **iff `boss_cleared(n)` transitions false→true** —
first clear only. Since flags never go true→false, the event is idempotent
by construction.

**Retry-scaling coherence:** no retry math exists here and none should —
fixed per-encounter-type ghost stats plus read-only pools wider than one
attempt draws (≥ 6 vs 4) make a retry a re-run of the same fight against the
same fixed difficulty, with the pool's unused breadth as the only variety;
the player closes the gap by learning content, not by waiting for adjustment
factors. Adding retry arithmetic would contradict Core Rules 6 and 8.

The floor progress metric formula is defined as:

`floor_progress(n) = cleared_count(n) / battles_per_floor`

where `cleared_count(n) = Σ(s=1..3) [stage_cleared(n, s)] + [boss_cleared(n)]`
and `battles_per_floor = tower_stages_per_floor + 1`.

**Variables:**

| Variable | Type | Range | Source | Description |
|----------|------|-------|--------|-------------|
| `stage_cleared(n, s)` | bool | {true, false} | server | As in F1 |
| `boss_cleared(n)` | bool | {true, false} | server | As in F1 |
| `tower_stages_per_floor` | int | 2–5 (safe band); 3 at MVP | registry constant (`tower_stages_per_floor` = 3) | Stages per floor |
| `battles_per_floor` | int | 4 | calculated (never stored — one derived, one stored) | 3 stages + 1 boss |
| `cleared_count` | int | 0–4 | calculated | Cleared battles in the floor |
| `floor_progress` | float | [0, 1] | calculated | Display metric for ui-shell's floor map |

**Output Range:** exactly {0, 0.25, 0.5, 0.75, 1.0} — integer algebra over a
fixed denominator of 4; no rounding, no other value possible. Monotone
non-decreasing. 0 = freshly unlocked; 1.0 = conquered (F1's input for the
next floor).

**Ownership:** tower **owns the derivation** (pure function of tower state)
but the metric is **derived display-only** — never stored, never sent to the
server, never consumed by gameplay logic; F1 reads raw flags, never
`floor_progress`. ui-shell renders it.

**Example:** stages 1–2 cleared: `cleared_count(1)` = 2,
`floor_progress(1)` = 2/4 = 0.5.

The preview word set formula is defined as:

`preview_words(n, ref) = { w : q ∈ pool(n, ref), w ∈ q.word_ids }` — the
**distinct union** of words referenced by the pool serving the upcoming
attempt, **sorted by the module's word-entry index, tie-break by `word_id`**
(the sort rule makes rendering and headless tests deterministic; a raw set is
unordered).

**Variables:**

| Variable | Type | Range | Source | Description |
|----------|------|-------|--------|-------------|
| `n` | int | 1–4 | data file | Floor/module index |
| `ref` | int \| "boss" | 1–3 or boss | tower attempt config | Upcoming encounter within the floor |
| `pool(n, ref)` | set of questions | ≥ 6 (stage) / ≥ 4 (boss) | module payload via accounts-backend; build-gate-validated (question-content Rule 6) | Question pool for the attempt |
| `q.word_ids` | set of word IDs | ≥ 1 per question | question-content schema | Words the question exercises |
| `preview_words` | ordered list of word IDs | 1 – bounded by pool × words-per-question | calculated | Rendered pre-battle (term + VI gloss + grammar tag); skippable; no RNG |

**Output Range:** minimum 1 (every valid question references ≥ 1 word; a
degenerate all-one-word pool yields a one-element preview — valid, render
it). Same payload + same `ref` → same ordered list on every browser,
every retry — pure and deterministic.

**Boss case:** the boss preview draws from the module × **boss pool alone**,
not a union of the three stage pools — the boss preview's study value is its
own checkpoint vocabulary, and stretching it across stage pools would erase
the stage/boss distinction. If repeat boss retries feel brutal (smallest boss
pool = battle length), the lever is raising `min_tower_boss_pool_size` to 6+
(Core Rule 7's flagged lever) — never widening the union.

**Example:** floor 1 stage 1's pool holds 6 questions referencing W01–W07
(question 3 reuses W02 for grammar): `preview_words` = [W01 … W07] — 7
entries in content order, identical before every retry.

**Registry candidates** (registered in Phase 5): new constants
`tower_floor_count` = 4 floors (safe band: raise only with a
build-gate-validated module) and `tower_stages_per_floor` = 3 stages/floor
(safe band 2–5; changing it rescales F2's denominator and F1's conjunction —
change once, all math follows). `battles_per_floor` is deliberately **not**
registered (derived). `min_tower_stage_pool_size` / `min_tower_boss_pool_size`
gain tower in `referenced_by`. No new ghost/reward/delay constants — owned by
opponent-ai / battle-system, referenced only.

## Edge Cases

> Formula-space cases (E1–E6) surfaced by the systems-designer's F1–F3
> analysis; rule-space cases (E7–E14) from the Core Rules. Each names the
> exact condition and the exact resolution.

- **E1 — If the unlock derivation runs for floor 1 on a fresh player**:
  `floor_unlocked(1)` short-circuits to true without evaluating
  `boss_cleared(0)` — floor 0 must never be dereferenced. An implementation
  that evaluates the general form at `n = 1` fails on fresh-player state
  (no floor-0 record exists server-side).
- **E2 — If a floor is unlocked but its module payload is absent or
  unvalidated** (post-MVP case: floor 1 conquered, module 2 not yet shipped):
  F1 grants *visibility*; the build gate (question-content Rule 6) grants
  *availability*. A floor whose module did not pass build-gate validation is
  **not listed at all** (Core Rule 1's data-defined structure) — not shown
  locked, not shown with a padlock tooltip, absent from the map. QA must not
  file "floor 2 unlocked but missing" as a bug; it is the designed
  unlock≠available split.
- **E3 — If an already-cleared boss is re-cleared**: battle rewards replay
  (battle-system Rule 21, identical values), `floor_cleared` does **not**
  re-fire (F1's false→true rule), and every F1 output is unchanged. The
  event is idempotent by construction; no "second clear" reward exists.
- **E4 — If a pool's questions all reference the same single word**: the
  preview renders as a **one-element list** — valid, rendered as-is.
  Variety is never manufactured for display; the fix for a thin preview is
  content authoring, not presentation.
- **E5 — If the pool fetch fails or returns an empty pool at `Previewing`**:
  the attempt is **blocked before battle start** — an error state renders in
  place of the preview and the only exit is back to `Selecting`. A battle is
  never started on an empty pool, and an empty preview is never rendered
  (an attempt without content is not an attempt).
- **E6 — If the client reloads mid-progression**: all unlock states are
  re-derived from server flags by F1 on load; any cached client-side unlock
  state is discarded, never trusted. F1 is the single chokepoint for
  progression truth — this is what makes it headless-testable.
- **E7 — If the content version changes between attempts** (accounts-backend
  versioned content delivery): the next attempt's config and preview are
  composed from the **current** payload (F3 is a pure function of it — new
  payload, new preview, that is correct); a battle already in progress runs
  to completion on the questions it drew and its result commits normally.
  No attempt is invalidated mid-flight.
- **E8 — If the tower-result commit fails (network)**: victory/defeat is
  retained client-side as unsaved state and retried per accounts-backend's
  Unsaved-state policy — a cleared stage is not silently lost and not
  silently claimed. Tower defers the retry mechanics to accounts-backend's
  Edge Cases; its own rule is that progression state changes only on
  committed results, never on optimistic local writes.
- **E9 — If a player defeats a boss on the first attempt after stage 3**:
  normal flow — no special case. (Stated because it is the *desired* shape:
  the boss requires the 3 stage flags and nothing else; there is no
  "fast-track" and no boss-only lockout period.)
- **E10 — If a cleared stage is replayed and lost**: progression state does
  not change — cleared stays cleared (flags are monotone; F1 output
  unchanged), rewards are the defeat values, retry is immediate. Losing a
  replay never re-locks anything.
- **E11 — If a player re-enters `Selecting` from `Previewing` repeatedly**
  (back out of the preview): no state mutates — the preview is recomputed
  from the current payload on every entry (E7 semantics), the stage remains
  unlocked-and-uncleared, and no attempt is counted. Previewing is free and
  side-effect-free.
- **E12 — If every battle on floor 1 is cleared** (the MVP end-state):
  `floor_progress(1)` = 1.0, `floor_unlocked(2)` = true, and floor 2
  appears only when module 2's validated payload ships (E2). Until then the
  end-state screen is the floor-complete state itself — no prestige, no NG+
  loop, no post-floor content at MVP.
- **E13 — If the same word appears in both a stage pool and the boss pool
  of the same floor**: both previews list it — this is *intended* spaced
  re-exposure (Pillar 2), not duplication. F3 unions within one pool only;
  cross-pool repeats are a content-authoring fact, never deduplicated
  across attempts.
- **E14 — If battle-system reports a result for an encounter the tower did
  not configure** (defensive; e.g., a stale result event after a client
  restart): the result is **discarded for progression purposes** — cleared
  flags change only for a config tower issued in the current attempt
  session. The reward events still flow (battle-system owns them); tower
  never marks progress from a foreign result.

## Dependencies

> The Interactions table above is the contract detail; this section records
> direction, hardness, and bidirectionality for `/review-all-gdds` and the
> consistency checks. Bidirectional rule honored: every upstream GDD listed
> already names tower in its own Dependencies section (verified 2026-11-09
> against battle-system, question-content, opponent-ai, accounts-backend).

**Upstream dependencies:**

| System | Tier | Hard/Soft | Interface | Owner of semantics | Status |
|---|---|---|---|---|---|
| battle-system | MVP | Hard | Encounter config in → battle result (incl. victory, reward events) out | tower owns selection + progression; battle owns the fight | GDD Approved |
| question-content | MVP | Hard | Module × stage/boss pools; word entries for preview (F3) | question-content owns schema + pool minimums + validation; tower owns selection + preview composition | GDD Approved (A2 confirmed by Core Rule 4) |
| opponent-ai | MVP | Hard | `GhostProfile` referenced per encounter type (accuracy/HP/reveal delays) | opponent-ai owns profiles + roll; tower references only | GDD Approved — **confirmation closed: this GDD's Core Rule 3 confirmed the profile contract; its row's proviso drops at its next edit** |
| accounts-backend | MVP | Hard | `tower stage result` commit point; server-side storage; content payload delivery | accounts-backend owns storage/commits; tower owns state semantics | GDD Approved |

**Downstream dependents:**

| System | Tier | Hard/Soft | Interface | Owner of semantics | Status |
|---|---|---|---|---|---|
| ui-shell | MVP | Soft | Floor map, stage select, preview screen, locked-state display, clear celebration | ui-shell owns all rendering; tower owns the state | GDD not yet authored — **provisional** |
| meta-progression | Vertical Slice | Soft | Tower-encounter victories via `BattleResult`'s encounter type; `floor_cleared` emitted but unconsumed (its Core Rule 8) | meta-progression owns ledger/quest semantics | GDD Approved — row re-keyed per its recorded divergence |

**Explicit non-dependencies:** equipment (no direct interface — tower battles
read stats via battle-system's LoadoutSnapshot; tower never touches gear);
forge-srs (cursed runes flow from battle results, not from tower); speech-io
(listening rounds are battle-owned); ranked-league (tower is PvE — RP events
fire on ranked encounters only, battle-system Rule 21). These absences are
deliberate and should be preserved in review: a tower that grants gear or RP
would double-own progression semantics.

**Provisional-contract summary** (re-verified 2026-11-09): LoadoutSnapshot
shape (equipment — authored and adopted; consumed indirectly via
battle-system); `floor_cleared` event schema (tower-owned, Core Rule 9 —
meta-progression deliberately does not consume it); ui-shell's floor-map
state requirements (authored; UX flag below).

## Visual/Audio Requirements

> Requirements-level direction only — ui-shell owns all rendering (battle
> theater is battle-system's section). `art-director` not consulted — Lean
> mode. Review against the art bible (when approved) before production.

**Visual states tower requires representations for** (each maps to a
Detailed Design state):

| State / event | Required representation | Notes |
|---|---|---|
| `Locked` floor/stage | Dimmed entry + explicit unlock condition ("Clear Floor 1 Boss") | Locked = *visible* goal (Overview); never hide locked entries except E2's unvalidated-module case (absent entirely) |
| `Unlocked` stage | Normal entry + progress state (F2 → per-floor 0/0.25/0.5/0.75/1.0 readout or bar) | The only numeric display tower requires |
| `Cleared` stage/boss | Distinct cleared marker (e.g., banner/check) | Monotone — once shown, never un-shown |
| `Previewing` | Study-card list (term + VI gloss + grammar tag), content order (F3 sort), skippable | Pillar 3 scaffold — readable, calm, quiz-adjacent styling; not a battle screen |
| Boss unlocked | Weightier entry styling vs stages | Boss is the checkpoint spike (opponent-ai F3) — visual gravitas before the fight, matching its 1500 ms reveal delay |
| Floor cleared (first time) | One-time celebration beat on `floor_cleared` | Consumed by ui-shell; replays (E3) must **not** re-trigger it |
| Attempt blocked (E5) | Content-error state in place of preview | Never an empty screen |

**Audio:** no tower-owned audio at MVP. Battle sounds belong to
battle-system/ui-shell; the celebration beat and preview interactions reuse
the shell's existing cue vocabulary. If the art bible later wants a distinct
tower theme per module, that is ui-shell scope — flagged, not required here.

## Game Feel

> `art-director` not consulted — Lean mode (see Visual/Audio note).

Tower feel is **map feel, not battle feel** — the fights inherit
battle-system's; what tower itself must deliver:

- **Legible progression**: the climb must be readable at a glance — where am
  I, what's locked, what's next. F2's coarse 0.25 steps are a feature: four
  distinct beats per floor, each a visible state change, no ambiguous
  partial progress.
- **Anticipation over pressure**: locked floors with explicit conditions
  (Core Rule 2) should pull, not gate-slam; the unlock condition text is
  part of the feel (the goal is always named).
- **Study-as-preparation**: the preview (F3) should feel like *arming
  yourself*, not homework — skippable, fast to scan, same list every retry
  (deterministic) so mastery of the list is itself felt progress.
- **Failure is cheap**: defeat → back to select with one-tap retry (Core
  Rule 6). No loss screen friction, no "are you sure", no cooldown tick.
  The retry loop must be *faster* than the frustration it answers.
- **Check-point gravity**: the boss entry should read as an event — heavier
  styling, the longest reveal delay in the game behind it. First-clear
  celebration lands once (E3); its rarity is what makes it land.

## UI Requirements

> ui-shell owns all screens; tower owns the state they render. Full flows →
> `/ux-design` at Pre-Production.

Screens/surfaces tower contributes requirements to:

1. **Tower floor map** (per floor): 4 entries (3 stages + boss) in climb
   order, each rendering its F1 state (Locked w/ condition · Unlocked ·
   Cleared), the floor's F2 progress, and E2's absent-module rule (floor
   not listed without a validated payload).
2. **Stage select** (`Selecting` state): the floor map *is* the select —
   tapping an unlocked, available encounter composes the config (Core Rule
   3) and enters `Previewing`. Cleared entries remain tappable (replay,
   Core Rule 7).
3. **Preview screen** (`Previewing`): ordered study list (F3 sort: content
   order, tie-break word_id), term + VI gloss + grammar tag per entry,
   **Skip → Battle** and **Back** actions, content-error state for E5.
   Boss previews render the boss-pool-only list (F3 boss case).
4. **Result → progression surfaces** (`Resolved`): battle result modal is
   battle-system's; tower adds the progression delta — stage-cleared
   marker update, next-stage unlock reveal, floor-clear celebration on
   first boss clear (never on replay).
5. **Accessibility inputs**: unlock conditions as text (not icon-only),
   preview list as real text (screen-reader traversable), progress as
   text+bar (not color-only). Consistent with the project-wide
   accessibility requirements; full spec at `/ux-design`.

## Cross-References

| Referenced GDD | What this GDD references | Where |
|---|---|---|
| battle-system | Encounter config consumption (its Core Rules 2–3); result + reward events (Rule 21); 4-round shape (Rule 5) | Core Rules 3–4, 9; F1; Dependencies |
| question-content | Pool structure + minimums F2/F3 (`min_tower_stage_pool_size` 6, `min_tower_boss_pool_size` 4); build-gate validation (Rule 6); word-entry schema for preview; A2 (4-round stage battle) | Core Rules 1, 4–6, 10; F3; Edge Cases E2/E5 |
| opponent-ai | `GhostProfile` per encounter type; tower tiers (accuracy 0.55/0.75, HP 420/600, reveal delays 1200/1500 ms) | Core Rule 3; Dependencies |
| accounts-backend | "tower stage result" commit point; server-authoritative flags; versioned content delivery | Core Rule 8; F1 variables; Edge Cases E6–E8 |
| ui-shell | All tower screens; UX flag below | UI Requirements; Dependencies |
| meta-progression | Quest progress via `BattleResult` encounter type; `floor_cleared(module_id)` emitted, deliberately unconsumed (its Core Rule 8) | Core Rule 9; Dependencies; Open Questions |
| game-concept | Core Mechanic #5 (tower structure); MVP req #5; Flow State (curiosity); anti-monetization stance | Core Rules 1, 6; Overview |

## Acceptance Criteria

> **Source**: qa-lead consultation, 2026-11-09 (TW1–TW23, coverage-verified
> against all 10 Core Rules, F1–F3 including F1's adjunct firing rule, and
> every Edge Case E1–E14). **Legend**: **[unit]** = vitest, deterministic,
> DI-injected collaborators, home `tests/unit/tower/`, BLOCKING;
> **[integration]** = automated cross-system test, BLOCKING;
> **[statistical]** = committed seed-list harness, pinned tolerances
> (**unused here by design — tower owns zero RNG**; see coverage note);
> **[screenshot]** = retained in `production/qa/evidence/`, BLOCKING at
> every `qa.level` (never waived). *(provisional)* = boundary with ui-shell
> / meta-progression (both undesigned) — written against the contract this
> GDD names, re-verify when the owner lands. The accounts-backend commit is
> **non-provisional** (GDD Approved; commit point "tower stage result"
> already specified, its AC-C1).

- **TW1 [unit] — Tower structure and registry constants (Core Rule 1 + F2's battles_per_floor).** **GIVEN** the tower data file and the registry, **WHEN** the structure enumerates, **THEN** it defines exactly `tower_floor_count` = 4 floors in the modules' fixed content order, each floor = `tower_stages_per_floor` = 3 stages + 1 boss → `battles_per_floor` = 4, 16 tower battles at full content scale, with MVP scope exposing floor 1 only (floors 2–4 present as data, gated per TW14); **and WHEN** upstream numbers are read, **THEN** the tower module references registry constants by name — `min_tower_stage_pool_size` 6, `min_tower_boss_pool_size` 4, ghost HP 420/600, accuracy 0.55/0.75, reveal delays 1200/1500 ms — and defines no local copy of any of them (static assertion: no such literal in the tower module), and `battles_per_floor` is nowhere a stored or registered constant (derived only). *(Pins the Phase-5 registration values of `tower_floor_count` / `tower_stages_per_floor`; fails loudly until they are registered.)*
- **TW2 [unit] — floor_unlocked predicate; floor 0 is never dereferenced (F1 floor_unlocked + Core Rule 2 + E1).** **GIVEN** fresh-player flags (no floor records exist at all), **WHEN** `floor_unlocked(1)` computes, **THEN** it returns true with zero flag-store lookups keyed on floor 0 (spy: `boss_cleared(0)` is never accessed — a short-circuit, not a defaulted read); **and GIVEN** `boss_cleared(1)` = false / true, **THEN** `floor_unlocked(2)` = false / true, same at the 3→4 boundary; **and THEN** across any flag-setting commit sequence no unlock output ever flips true→false (monotone).
- **TW3 [unit] — stage_unlocked predicate and its reductions (F1 stage_unlocked + Core Rule 2).** **GIVEN** a fixture flag matrix over an unlocked and a locked floor, **WHEN** `stage_unlocked` computes, **THEN** on an unlocked floor stage 1 is always true, stage 2 iff stage 1 cleared, stage 3 iff stages 1–2 cleared; **and THEN** `stage_unlocked(n, 1)` equals `floor_unlocked(n)` for every fixture combination (the stated reduction, asserted as an identity) — a locked floor can never expose a playable stage 1.
- **TW4 [unit] — boss_unlocked requires all three stage flags; no fast-track (F1 boss_unlocked + Core Rule 2 + E9).** **GIVEN** each of the 8 stage-flag combinations of an unlocked floor, **WHEN** `boss_unlocked` computes, **THEN** it is true exactly at (cleared, cleared, cleared) and false at the other 7, including (true, true, false); **and GIVEN** the 3-flag-satisfied state, **WHEN** a boss attempt is requested — immediately or at any later time — **THEN** it starts with no additional condition: no cooldown, no lockout window, no attempt counter consulted (E9's "no special case", tested as the absence of any time- or count-based gate in the start path).
- **TW5 [unit] — Encounter config: exact shape, ghost by type, nothing else (Core Rule 3 + Core Rule 4).** **GIVEN** each unlocked target (stages 1–3 and boss, any floor), **WHEN** tower composes the attempt config, **THEN** the object is exactly `{module_id, stage_ref (1|2|3|"boss"), encounter_type ("tower_stage" | "tower_boss"), ghost_profile_ref}` with `ghost_profile_ref` resolving via encounter_type to the profile whose constants are the registry tiers (HP 420 stage / 600 boss, accuracy 0.55 / 0.75, reveal 1200 / 1500 ms); **and THEN** the config carries no question ids, no round-type sequence, no HP/damage modifiers and no seed — battle-system draws per its Rule 22 and tower performs no draw (static: no RNG call in the tower module); the 4-round shape `vocab_strike, grammar_shield, listening_pierce, ultimate_burst` appears nowhere in tower's config path.
- **TW6 [unit] — Preview composition: distinct union in content order (F3 + Core Rule 5).** **GIVEN** a fixture module payload whose stage-1 pool holds 6 questions referencing W01–W07 with question 3 reusing W02 (this GDD's F3 example), **WHEN** `preview_words(1, 1)` computes, **THEN** the result is exactly [W01 … W07] — distinct (W02 once), sorted by word-entry index, tie-broken by word_id (sort key per OQ-TW6; degrade to word_id-only if the schema lacks an index) — each entry resolving to term + VI gloss + grammar point tag from the payload; **and WHEN** recomputed any number of times on the same payload + ref, **THEN** the ordered list is identical (pure; static assertion: no `Math.random` / `Date.now` in the preview path).
- **TW7 [unit] — Boss preview is the boss pool alone; cross-pool repeats stay (F3 boss case + E13).** **GIVEN** a floor fixture where word W appears in both a stage pool and the boss pool, **WHEN** `preview_words(1, "boss")` computes, **THEN** its set is the distinct union over boss-pool questions only — not the union of the three stage pools; **and WHEN** the stage preview computes for the same floor, **THEN** it also lists W — neither preview deduplicates against the other (spaced re-exposure is intended).
- **TW8 [unit] — Degenerate one-word pool renders one element (F3 output range + E4).** **GIVEN** a build-gate-valid pool in which every question references the same single word, **WHEN** `preview_words` computes, **THEN** the result is exactly [that word] — a valid one-element list rendered as-is, no manufactured variety, no error.
- **TW9 [unit] — floor_cleared fires iff boss_cleared transitions false→true (F1 adjunct firing rule + Core Rule 9 + E3).** **GIVEN** a commit sequence driving `boss_cleared(1)` false→true, **WHEN** the transition applies, **THEN** exactly one `floor_cleared("module-1")` event is emitted; **and GIVEN** a subsequent boss replay victory (flag already true), **WHEN** its result applies, **THEN** battle-owned rewards replay identically (gold 250 / xp 180 — the tower-boss emission) but zero `floor_cleared` events fire and every F1/F2 output is unchanged; **and THEN** across all 24 monotone flag-setting orders of a floor's 4 flags no second emission occurs (idempotent by construction, exhaustively enumerated — deterministic).
- **TW10 [unit] — Defeat and lost replays change nothing; no cost mechanics exist (Core Rules 6, 7 + E10).** **GIVEN** a stage defeat, a boss defeat, and a defeat on an already-cleared stage, **WHEN** each result applies, **THEN** no cleared flag changes, no unlock output changes, and the only exit is back to Selecting with an immediate retry available; defeat rewards are battle-owned (gold 40 / xp 60) and tower emits nothing of its own; **and THEN** the tower module defines no energy, lives, keys, wait-timer or attempt-limit state (static assertion — the fields do not exist), and progression mutation happens only inside the committed-result path, never an optimistic local write (E8's tower-side half).
- **TW11 [unit] — State schema is exactly the cleared-flag set; load re-derives (Core Rule 8 + E6).** **GIVEN** the tower state through a persist/load cycle, **WHEN** serialized, **THEN** it contains only per-module per-slot `cleared: bool` — no attempt count, stars, per-stage score, stored unlock or stored progress value (static: the serializer's output shape); **and WHEN** load runs with a stale client cache present, **THEN** every unlock state and floor_progress value re-derives from the fetched server flags by F1/F2 and the cached values inform nothing (spy: cache read never feeds the derivation).
- **TW12 [unit] — floor_progress is exact and finite (F2 + Core Rule 1).** **GIVEN** all 16 cleared-flag combinations of a floor, **WHEN** `floor_progress` computes, **THEN** the output is exactly `cleared_count / 4` ∈ {0, 0.25, 0.5, 0.75, 1.0} — no other value producible, no rounding applied — and monotone non-decreasing under every flag-setting order; pins: fresh floor → 0; stages 1–2 → 0.5; all four cleared → 1.0 (E12's value).
- **TW13 [unit] — floor_progress is display-only (F2 ownership).** **GIVEN** the tower module, **THEN** F2's output is referenced only by the display-binding export: a spy confirms `floor_unlocked(2)` reads raw `boss_cleared`, never `floor_progress`, and the value is never serialized to or requested from the server (static: absent from the commit payload — TW11's schema is the whole state).
- **TW14 [unit] — Unvalidated or absent payload is never a floor (Core Rule 10 + Core Rule 1 + E2 + E12).** **GIVEN** module 2's payload absent or failed build-gate validation while `floor_unlocked(2)` = true (floor 1 conquered — E12's MVP end-state), **WHEN** the floor list composes, **THEN** floor 2 is absent entirely — not rendered locked, not padlock-tooltipped — and config composition refuses a non-validated `module_id`; floor 1 stays fully playable and its floor-complete presentation is the terminal state until a validated payload ships.
- **TW15 [unit] — Empty pool or failed fetch blocks before battle (E5 + Core Rule 5).** **GIVEN** a Previewing selection whose pool fetch fails or resolves empty, **WHEN** the preview composes, **THEN** the attempt blocks: no encounter config is issued, an error state replaces the preview (rendering: TW23), the only enabled exit is back to Selecting, and no progression state changes; an empty preview list is never rendered and a battle never starts on an empty pool.
- **TW16 [unit] — Previewing is free and side-effect-free (E11 + E7 preview half + Core Rule 5).** **GIVEN** repeated Selecting→Previewing→back cycles on the same stage, **WHEN** each entry composes the preview, **THEN** progression flags, unlock outputs and attempt bookkeeping are untouched at every exit (there is no attempt counter to bump — TW11's schema), each re-entry recomputes from the current payload (a payload change between cycles yields the new preview), and skip mutates nothing — it only advances to Battling.
- **TW17 [unit] — Content-version change: current payload only (E7 + F3 purity).** **GIVEN** a recorded preview at payload v1, **WHEN** the payload advances to v2 and a new preview composes, **THEN** it reflects v2 exactly — no cached v1 entry survives (F3 is a pure function of the current payload; "new payload, new preview" is correct behavior, asserted by diffing the two ordered lists).
- **TW18 [unit] — Foreign results are discarded for progression (E14 + Core Rule 8).** **GIVEN** a result event for an encounter config this tower session did not issue (stale event after a client restart), **WHEN** the result applies, **THEN** no cleared flag changes and no `floor_cleared` fires — dropped for progression purposes while its reward events pass through untouched (battle-owned); **and GIVEN** the twin control — a result for a config issued in-session — **THEN** it applies normally. *(Production binding of the correlation mechanism: OQ-TW7.)*
- **TW19 [integration] — Full round-trip: config → battle → result → commit → progression (Core Rules 2, 3, 4, 6, 8 + F1 + E6, E8).** **GIVEN** a fresh floor 1 against fixture pools (≥ 6 stage / ≥ 4 boss, build-gate-valid) and the real battle-system module, **WHEN** the player runs stage 1 through the boss to a boss victory, **THEN** each attempt's config drives a standard 4-round battle drawing k = 1 question per round from the module × stage pool under battle-system Rule 22 (no tower-side draw), the victory commits through accounts-backend's "tower stage result" point atomically with the battle result (accounts-backend AC-C1 semantics), the cleared flag persists server-side, and a simulated reload re-derives the next unlock purely from the server flags (E6); the boss victory fires `floor_cleared` once and leaves floor 2 unlockable (F1); **and GIVEN** a lost attempt, **THEN** its defeat commits, changes no flag, and an immediate retry starts a fresh standard battle (Core Rule 6); a commit failure retains the result as unsaved state retried per accounts-backend's policy — never silently lost, never silently claimed (E8). *(Non-provisional: accounts-backend is Approved; battle-system is revised 2026-11-09 pending re-review — the Rule 22 draw asserted here is exactly what that revision pinned.)*
- **TW20 [integration, provisional] — floor_cleared: exactly-once emission, no MVP consumer (Core Rule 9 + E3; re-keyed per meta-progression's recorded divergence).** **GIVEN** a first boss clear and later boss replays both delivering the `floor_cleared(module_id)` event, **WHEN** each applies, **THEN** the false→true transition fires exactly once (TW9's exhaustively-enumerated idempotence) and no MVP consumer records a floor-clear credit — meta-progression's GDD deliberately declines the event (its Core Rule 8; quest progress keys on `BattleResult`'s encounter type instead). *(provisional: the consumption half asserts against a consumer that does not exist at MVP — re-verify when a consumer lands, analytics (Full Vision).)*
- **TW21 [screenshot, provisional] — Floor map and stage select legibility (Core Rules 1, 2 + States `Selecting` + E2 rendering half).** **GIVEN** three accounts — fresh, mid-floor (stages 1–2 cleared), and floor-1-complete — **THEN** the map shows floor 1's 3 stages + boss in order with Locked / Unlocked / Cleared visually distinct, each locked entry renders its unlock condition, and on the complete account floor 2 is absent (E2's not-listed split — no padlock styling) with the floor-complete presentation showing. Retained screenshots in `production/qa/evidence/`. *(provisional: ui-shell's GDD is unauthored; pins the state readout tower emits.)*
- **TW22 [screenshot, provisional] — Preview screen renders the study scaffold (Core Rule 5 + F3 + States `Previewing` + E4 rendering).** **GIVEN** any unlocked attempt, **THEN** the preview screen lists every `preview_words` entry as term + VI gloss + grammar tag, presents skip and back, and start proceeds to the battle; the valid one-element preview of TW8 renders as a normal single-entry list — visually distinct from TW15's error state. Retained screenshots. *(provisional: ui-shell undesigned.)*
- **TW23 [screenshot, provisional] — Floor-complete end state and pool-error state (E12 + E5 rendering half + Core Rule 9 celebration).** **GIVEN** floor 1 fully cleared, **THEN** the floor-complete state is the terminal MVP presentation (progress 1.0 rendered on the floor map; no post-floor content, no prestige affordance); **and GIVEN** a failed pool fetch at Previewing, **THEN** the error state renders in place of the preview with only the back exit enabled. Retained screenshots. *(provisional: ui-shell undesigned; the floor-clear celebration reads TW20's event.)*

**Totals: 23 criteria — 18 unit, 2 integration (1 provisional: TW20), 3
screenshot (all provisional on ui-shell). No statistical criteria by design:
tower owns zero RNG — F1–F3 are pure and exhaustively enumerable (F2: 16
flag combinations; firing rule: 24 monotone orders; boss_unlocked: 8), and
ghost-accuracy statistics stay in opponent-ai's own ACs.**

**Coverage matrix** (all 10 Core Rules ≥ 1 AC): Rule 1: TW1/TW14 · Rule 2:
TW2–TW4 · Rule 3: TW5 · Rule 4: TW5/TW19 · Rule 5: TW6–TW8, TW15, TW16,
TW22 · Rule 6: TW10/TW19 · Rule 7: TW9/TW10 · Rule 8: TW11/TW18/TW19 ·
Rule 9: TW9/TW20/TW23 · Rule 10: TW14. Formulas: F1 all 3 predicates +
adjunct firing rule (TW2/TW3/TW4/TW9); F2 (TW12/TW13; denominator pinned in
TW1); F3 (TW6/TW7/TW8/TW17). Every Edge Case mapped: E1 TW2 · E2 TW14/TW21 ·
E3 TW9/TW20 · E4 TW8/TW22 · E5 TW15/TW23 · E6 TW11/TW19 · E7 TW16/TW17/TW19 ·
E8 TW10/TW19 · E9 TW4 · E10 TW10 · E11 TW16 · E12 TW12/TW14/TW23 · E13 TW7 ·
E14 TW18.

**Test-file home** (sibling precedent `tests/unit/opponent-ai/`):
`tests/unit/tower/` — `unlock-predicates.test.ts` (TW2–TW4, TW9) ·
`floor-progress.test.ts` (TW12, TW13) · `preview.test.ts` (TW6–TW8, TW17) ·
`encounter-config.test.ts` (TW5, TW14, TW15) · `progression-state.test.ts`
(TW10, TW11, TW18) · `structure-constants.test.ts` (TW1);
`tests/integration/tower/` — `tower-round-trip.test.ts` (TW19) ·
`floor-cleared-consumption.test.ts` (TW20, provisional); screenshots TW21–
TW23 → `production/qa/evidence/` (capture when ui-shell ships — never
waived).

## Open Questions

| ID | Question | Owner | Target resolution |
|---|---|---|---|
| OQ-TW1 | **Replay-farm exposure**: cleared-floor replays emit fixed rewards (120/180 stage, 250/180 boss) with unlimited retries — a fixed gold/XP-per-minute farm once content is conquered. Tower's only lever is pool breadth; reward/ledger tuning is not tower's. Does meta-progression need replay-diminishing returns or daily caps? | meta-progression (with battle-system as reward emitter) | **RESOLVED 2026-11-09, pointing here** — meta-progression Core Rule 6: no replay-diminishing returns or caps at MVP (faucet-only gold makes the farm economically inert); re-opens at Alpha as meta OQ-MP1 |
| OQ-TW2 | **Boss retry brutality**: smallest boss pool (= 4) can exhaust variety across repeated boss attempts. Raise `min_tower_boss_pool_size` to 6+? (question-content F3 pre-flagged this exact trigger.) | content/balance pass | first boss-floor playtest |
| OQ-TW3 | **Floor-map state contract**: exact ui-shell data requirements (progress rendering, celebration trigger payload, E2 absent-floor representation) | ui-shell | ui-shell GDD (MVP) |
| OQ-TW4 | **`floor_cleared` event schema**: event name, payload fields (module_id? floor index? timestamp?), delivery channel | meta-progression | **RESOLVED 2026-11-09** — schema is tower-owned (Core Rule 9: `floor_cleared(module_id)`, emitted on the boss flag's false→true transition); meta-progression's GDD deliberately does not consume the event (its Core Rule 8), so no delivery channel is owed at MVP |
| OQ-TW5 | **Floors 2–4 shipping order**: structure is data-defined (Core Rule 1) but which module is floor 2 (content order = difficulty order?) is a curriculum sequencing call | content owner | module 2 content pass |
| OQ-TW6 | **F3 sort key stability**: F3 sorts by "the module's word-entry index, tie-break `word_id`" — confirm question-content's schema exposes an explicit stable order field; if not, the sort rule degrades to `word_id`-only (deterministic but content-order-blind) | question-content owner | next question-content edit |
| OQ-TW7 | **Result→config correlation (E14)**: encounter config carries no attempt id; for TW18/E14's foreign-result discard to bind in production, BattleResult must echo the issued config (or an id). Implementation-level decision — interface flag for lead-programmer | lead-programmer | architecture pass |
