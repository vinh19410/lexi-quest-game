# Opponent AI

> **Status**: Complete — pending design review
> **Author**: user + game-designer (specialists: systems-designer, qa-lead)
> **Last Updated**: 2026-11-09
> **Last Verified**: 2026-11-09
> **Implements Pillar**: Pillar 4 (Honest Ghosts); supports Pillar 1 (Speed Is Damage — opponent mirrors the same timed round structure)

## Summary

opponent-ai is LexiQuest's single-player opponent: the "Shadow Ghost" the player
duels in every battle mode. It resolves each round with a seeded, deterministic
accuracy roll against data-configured per-mode difficulty (friend 0.65, ranked
0.70, tower stage 0.55, boss 0.75), supplies each encounter's ghost identity
(name, class, HP baseline) as data, and hands battle-system a pure
`{correct, reveal_delay}` result it schedules and dramatizes. It exists because
the MVP must be fun with no real opponents — and honest about that (Pillar 4):
the ghost is always presented as a ghost. The MVP scope is a structured dice
roll — deliberately simple, test-replayable, and interface-shaped so
question-aware or adaptive depth drops in post-MVP without changing consumers.

> **Quick reference** — Layer: `Core` · Priority: `MVP` · Key deps: `question-content, hero-class` (upstream, soft) · `battle-system, tower` (downstream, hard)

## Overview

opponent-ai is LexiQuest's single-player opponent: the "Shadow Ghost" the player
duels in every battle. Mechanically it is a deterministic resolver — for each
round it decides whether the ghost answers correctly using a seeded roll against
a mode-configured accuracy, and hands that result to battle-system, which applies
damage and schedules the reveal. For the player it is the antagonist that makes
the duel feel like a duel: an opponent with a name, a class identity, a visible
answer sequence, and a difficulty tier that changes by mode (friend 0.65, ranked
0.70, tower stage 0.55, tower boss 0.75). It exists because the MVP hypothesis
requires the battle to be fun without any real opponents — and because Pillar 4
(Honest Ghosts) makes that honesty part of the design: the ghost is always
presented as a ghost, never as a fake human. The MVP behavior is a *structured*
dice roll — accuracy values and ghost identities live as data configuration, the
RNG is seeded and test-replayable, and the resolver interface is shaped so a
question-aware or adaptive AI can drop in post-MVP without changing consumers.

## Detailed Design

### Core Rules

1. **The ghost is a deterministic resolver, not a simulated mind.** For each
   battle round, opponent-ai answers exactly one question:
   `ghost_correct = roll < accuracy` where the roll comes from a seeded RNG
   stream (F1). The resolver is **question-unaware** at MVP — it never reads
   the question payload's content or answer; it receives only the round
   context (encounter type, round index). This is the structured-dice-roll
   scope decision (2026-11-09): the MVP weakness the concept flagged
   ("Opponent AI is a dice roll") is accepted at MVP, but made *structured* —
   data-configured, seeded, and interface-shaped — so post-MVP depth does not
   require changing consumers.
2. **Ghost profiles are data.** A `GhostProfile` record holds: `ghost_id`,
   `display_name`, `class_ref` (one of `wordsmith | grammarian | arcane`),
   `accuracy` (0–1), `hp`, `is_boss`, `flavor_note` (honest-ghost label
   material). Stored in a ghost-profile data file (coding standard:
   data-driven). Every encounter's ghost resolves to exactly one profile;
   profiles are the single place ghost identity lives.
3. **Accuracy is configured per encounter type.** Mode-tiered defaults:
   friend **0.65**, ranked **0.70**, tower stage **0.55**, tower boss
   **0.75** (game-concept Flow State Design, authored values). A named
   GhostProfile may carry its own `accuracy` override; the mode default
   applies when it does not. One change point per tier via the data file.
   Each encounter type also carries an HP baseline (`ghost_hp_*`: friend and
   ranked 500, tower stage 420, boss 600 — values and safe bands in Formulas)
   that battle-system applies; opponent-ai emits it in the profile, never
   applies it.
4. **Every roll is seeded and ordered.** battle-system supplies a seed per
   battle (interface item — provisional until the battle-system GDD lands);
   opponent-ai derives a deterministic RNG stream and consumes **exactly one
   roll per round, in round order**. Same seed → same ghost answer sequence.
   Nothing else draws from this stream — reveal delays are fixed data
   (Rule 6), so replays and tests are reproducible.
5. **Ghost class is identity, not behavior.** `class_ref` feeds display only
   (avatar, name styling). Per hero-class Edge Case: **ghost passives do not
   trigger at MVP** — no formula evaluation happens for opponents; they
   resolve by accuracy rolls. Passive data stays present in class records so
   post-MVP enablement needs no schema change.
6. **The ghost's answer resolves at round end; battle owns the theater.**
   opponent-ai returns `correct` plus a data-configured
   `answer_reveal_delay_ms` per encounter type (a pacing hint, fixed — no
   RNG). battle-system owns all scheduling and choreography: when the reveal
   lands, what the player sees while the ghost "thinks". opponent-ai never
   renders anything.
7. **Honest ghosts (Pillar 4).** Profiles carry the display material ui-shell
   must render simulation-transparent: fictional display names, the ranked
   banner disclosing a ghost duel ("Shadow Ghost"), no fabricated online
   counts or invented opponents presented as real. opponent-ai supplies the
   material; ui-shell owns the rendering (→ UX flag when that GDD lands).
8. **What opponent-ai does NOT own:** question selection and mixing
   (battle-system), damage/shield/HP application (battle-system), question
   schema and pools (question-content), any UI rendering (ui-shell), forge/SRS
   semantics. It never decides which question is asked — only whether the
   ghost answers it correctly.

### States and Transitions

The resolver is stateless per round; state lives per battle (stream position
+ selected profile):

| State | Entered when | Transitions out | Effect |
|---|---|---|---|
| Idle | Battle configured — profile selected, seed received | → Resolving (battle-system requests round resolution) | Holds profile + current stream position |
| Resolving | Round resolution requested | → Resolved (roll consumed) | Consumes exactly 1 roll; emits `correct` + `answer_reveal_delay_ms` |
| Resolved | Roll consumed for this round | → Resolving (next round request) | Result handed to battle-system; **no re-roll** — the emitted result is final |

There is no persistent ghost state between battles: two battles with the same
seed and profile produce identical sequences by design (Rule 4).

### Interactions with Other Systems

| System | Direction | Data flow | Contract |
|---|---|---|---|
| question-content | Upstream — Soft | Round context only (encounter type, round index); resolver does not read payload content | Accuracy roll is opponent-ai's (per question-content Dependencies); questions carry no AI-specific data — no per-question difficulty field at MVP (question-content locked decision) |
| battle-system | Downstream — Hard | `resolve_round(profile, mode, seed, round_index) → {correct, answer_reveal_delay_ms}`; battle supplies seed | **Provisional** — battle-system owns result application (damage, HP, reveal scheduling) and seed generation; opponent-ai owns the roll itself. Confirm interface when battle-system GDD lands |
| tower | Downstream — Hard (profiles) | Stage ghost profiles (accuracy 0.55, HP 420) and boss profiles (0.75, 600) | **Provisional** — tower selects the encounter; opponent-ai supplies the profile. Confirm with tower GDD |
| ui-shell | Downstream — Soft | Display fields: `display_name`, `class_ref`, `flavor_note`, ghost-duel disclosure strings | ui-shell owns rendering; must honor honest-ghost labels (Pillar 4) |
| ranked-league | Downstream — Soft | Ranked accuracy tier (0.70) + ghost naming for the match banner | League owns RP math; opponent-ai supplies ghost identity material |
| hero-class | Upstream — Soft | `class_ref` vocabulary (`wordsmith \| grammarian \| arcane`) | Identity only at MVP — no passive evaluation (hero-class EC); class records keep passive data for post-MVP |

## Formulas

opponent-ai owns **exactly one owned formula (F1)**, **one stream contract (F2)** and **one tuning-context formula (F3)**, plus a constant set. As with hero-class supplying factors battle-system applies: the ghost supplies the correctness bit and the pacing constants; battle-system supplies the equations that consume them (damage, HP, mana, reveal scheduling). No formula here computes damage, HP, or mana — those are battle-system's.

### F1 — Round resolution predicate

The round resolution predicate is defined as:

`ghost_correct = roll < accuracy`

where `roll` is the next value drawn from the battle's ghost stream (F2). The comparison is **strict**: a roll exactly equal to the threshold is NOT correct (same convention as hero-class's "exactly 3000 ms is NOT fast" fast-answer threshold). F2 requires the comparison to run in a domain with exactly decidable equality (fixed-point integer), so this strict semantics is testable rather than a float-equality footnote.

**Variables:**

| Variable | Type | Range | Source | Description |
|----------|------|-------|--------|-------------|
| `roll` | fixed-point integer | [0, 2⁵³) | F2 stream | Next draw from this battle's ghost stream — a uniform [0, 1) value expressed in F2 rule 5's comparison domain; exactly one roll per round |
| `accuracy` | float | 0.55–0.75 at MVP (band 0.40–0.90) | data file — mode default, or GhostProfile `accuracy` override if the profile carries one | Probability the ghost answers this round correctly |
| `ghost_correct` | bool | {true, false} | calculated | Emitted to battle-system as part of `resolve_round` |

**Output Range:** Boolean. P(true) = `accuracy` exactly (uniform [0, 1) draws, strict comparison; the equality case occurs with probability ≤ 2⁻⁵³ under the F2 contract). No clamping. At the extremes: `accuracy = 0` → the ghost never answers correctly; `accuracy = 1` → always correct — both are outside the safe tuning band (0.40–0.90, locked 2026-11-09). The stream is consumed exactly once per round, **in round order** (round 1 draws first), and the emitted result is final — never re-rolled (Detailed Design Rule 4, Resolved state).

**Example:** A ranked duel (accuracy 0.70), battle-system-supplied seed `20261109`. The stream (illustrative values — the real vectors get pinned as test fixtures once F2's ADR picks the algorithm) yields `0.7312, 0.4055, 0.8921, 0.5499` for rounds 1–4:

| Round | Draw | Comparison | Ghost answer |
|---|---|---|---|
| 1 | 0.7312 | 0.7312 ≥ 0.70 | wrong |
| 2 | 0.4055 | 0.4055 < 0.70 | correct |
| 3 | 0.8921 | 0.8921 ≥ 0.70 | wrong |
| 4 | 0.5499 | 0.5499 < 0.70 | correct |

Same seed → the same W-C-W-C sequence, on every replay and every browser. If the ranked ghost profile instead carried an accuracy override of 0.80, round 1 becomes correct (0.7312 < 0.80) with the same stream — overrides change the threshold, never the draws.

### F2 — Seed → ghost stream (contract spec; algorithm choice is ADR territory)

This is a **contract, not an implementation**. The GDD pins what each side must guarantee; the concrete PRNG family, its internal state, and the seed-expansion routine are a technical decision recorded as an ADR (escalation path: technical-director / lead-programmer).

**Variables:**

| Variable | Type | Range | Source | Description |
|----------|------|-------|--------|-------------|
| `seed` | uint64 | [0, 2⁶⁴) | battle-system (provisional interface) | One integer per battle |
| `stream` | float sequence | each ∈ [0, 1) | derived from `seed` | Infinite uniform draws; only the first R positions are ever consumed (R = battle length) |
| `accuracy_threshold` | uint64 | [0, 2⁵³] | calculated once from `accuracy` | Fixed-point threshold for F1: `round(accuracy × 2⁵³)` |

**Contract spec:**

1. **Family**: a deterministic, seedable PRNG producing uniform [0, 1), platform-stable (same seed → same sequence on every browser and session — web-native TS requirement; `Math.random` never). A counter/PCG-family generator is recommended: 64-bit state, single 64-bit seed, no observable warm-up at battle length. **The exact algorithm and its parameterization are an ADR, not this section.**
2. **One stream per battle, seeded once**: battle-system supplies `seed`; opponent-ai seeds exactly once and never re-seeds mid-battle.
3. **Consumption discipline**: exactly one draw per round, in strict round order, and no draws for anything else — reveal delays are fixed data (Rule 6), question selection is battle-system's own independent stream. The two streams never interleave: the ghost sequence depends only on `(seed, profile)`.
4. **No re-draw**: the Resolved state emits a final result; a round is never re-rolled.
5. **Comparison domain**: draws are converted once to a uniform integer in [0, 2⁵³) and compared to `accuracy_threshold` with a strict integer `<`. This makes P(correct) = accuracy within 2⁻⁵³ and keeps the equality boundary testable (a test fixture can construct a draw exactly equal to the threshold and assert NOT correct).
6. **Replay pinning**: once the ADR selects the algorithm, its seed→draw vectors get pinned as test fixtures (known seed → known first-draw sequence). The GDD pins the contract; the fixtures pin the behavior.
7. **Post-MVP compatibility**: future depth (question-aware accuracy, adaptive difficulty, per-round-type accuracy) must **append new draws as named positions after the existing draws** — never reorder or insert before them — so previously recorded battles still replay identically.

**Battle-system must guarantee**: (a) one uint64 `seed` per battle (its generation policy is theirs); (b) it never draws from the ghost stream itself; (c) any other battle randomness uses its own independent streams.

### F3 — Expected ghost correct rounds per battle (tuning context)

This is not a runtime formula — it is the statistical surface a balance pass and a QA statistical test assert against. With battle length R and constant per-round accuracy p (MVP: p is the same across all four rounds — one accuracy per encounter type, not per round type — locked stance 2026-11-09; per-round-type accuracy is the first post-MVP depth step and slots into F2 rule 7 without a contract change), the number of ghost-correct rounds is Binomial(R, p):

`E[ghost_correct_rounds] = R × p`  ·  `Var = R × p × (1 − p)`  ·  `P(sweep) = p^R`

**Variables:**

| Variable | Type | Range | Source | Description |
|----------|------|-------|--------|-------------|
| `p` | float | 0.55–0.75 at MVP | F1 / constant set | Accuracy of the encounter type |
| `R` | int | 4 at MVP | battle length (battle-system) | Rounds per battle |
| `E[ghost_correct_rounds]` | float | 0–R | calculated | Mean ghost correct answers |

**Output Range:** 0 to R (2.20–3.00 at MVP values); variance 0.75–0.99. Bounded by construction (Binomial); no clamping needed.

**Per-tier expectations (R = 4):**

| Tier | p | E | σ | P(ghost sweeps 4/4) | P(ghost ≤ 1 correct) |
|---|---|---|---|---|---|
| tower stage | 0.55 | 2.20 | 0.995 | 9.2% | 24.1% |
| friend | 0.65 | 2.60 | 0.954 | 17.9% | 12.6% |
| ranked | 0.70 | 2.80 | 0.917 | 24.0% | 8.4% |
| tower boss | 0.75 | 3.00 | 0.866 | 31.6% | 5.1% |

**QA assertion surface**: over N ≥ 1000 seeded battles, the per-tier per-round correct frequency must sit within ±0.03 of that tier's p, and the distribution of per-battle correct counts must pass a Binomial(4, p) goodness-of-fit at α = 0.01. This becomes Acceptance Criteria material; it is only testable because F2 makes every battle fully reproducible.

**Example:** a typical ranked duel sees the ghost answer 2.80 of 4 rounds correctly (σ 0.92); about 1 battle in 4 has the ghost sweeping all four.

### Constant set

All values live in the ghost-profile data file (coding standard: data-driven). Accuracy and HP values are authored intent from game-concept plus the 2026-11-09 locked decisions; reveal delays were authored 2026-11-09 (proposed by `systems-designer`, confirmed by owner).

**Accuracy by encounter type** (F1 input; flat across all four rounds at MVP):

| Name | Value | Unit | Consumer |
|---|---|---|---|
| `ghost_accuracy_friend` | 0.65 | probability | opponent-ai F1 (friend duels) |
| `ghost_accuracy_ranked` | 0.70 | probability | opponent-ai F1 (ranked duels); ranked-league banner material |
| `ghost_accuracy_tower_stage` | 0.55 | probability | opponent-ai F1 (tower non-boss stages) |
| `ghost_accuracy_tower_boss` | 0.75 | probability | opponent-ai F1 (tower boss floors) |

A GhostProfile may override `accuracy`; the mode default applies when it does not (Rule 3). **Safe tuning band for any accuracy (locked 2026-11-09): 0.40–0.90** — below 0.40 the ghost feels broken; above 0.90 the player loses without their own play mattering. Keep adjacent tiers ≥ 0.05 apart so tier differences stay perceptible.

**Difficulty ladder (confirmed 2026-11-09, authored intent):** tower stage 0.55 < friend 0.65 < ranked 0.70 < tower boss 0.75 — deliberately non-monotonic by game layer (tower is a progression ramp and its stage ghosts practice-tier; friend is casual practice below ranked; boss is the hardest checkpoint). Do not "fix" this into a single monotonic scale without a design decision.

**HP baselines by encounter type** (applied by battle-system; opponent-ai never touches HP after emitting the value):

| Name | Value | Unit | Consumer |
|---|---|---|---|
| `ghost_hp_friend` | 500 | points | battle-system HP application |
| `ghost_hp_ranked` | 500 | points | battle-system HP application |
| `ghost_hp_tower_stage` | 420 | points | battle-system; tower stage authoring |
| `ghost_hp_boss` | 600 | points | battle-system; tower boss authoring |

Safe band: ±30% of baseline per balance pass; boss always ≥ ranked; tower stage always ≤ friend/ranked (intentional, per the ladder note above). Supersedes the prototype's flat 500 across all modes (game-concept authored values 420/600; decision 2026-11-09).

**Answer reveal delay by encounter type** (authored 2026-11-09 — pacing hint, fixed data, no RNG):

| Name | Value | Unit | Consumer |
|---|---|---|---|
| `answer_reveal_delay_ms_friend` | 1000 | ms | battle-system reveal scheduling |
| `answer_reveal_delay_ms_ranked` | 800 | ms | battle-system reveal scheduling |
| `answer_reveal_delay_ms_tower_stage` | 1200 | ms | battle-system reveal scheduling |
| `answer_reveal_delay_ms_tower_boss` | 1500 | ms | battle-system reveal scheduling |

Rationale: long enough that the "ghost is answering" theater reads, short enough not to stall a 4-round battle (~3.2–4.5 s added per battle); ranked fastest (competitive density), boss longest (gravitas). Safe band: 600–2000 ms.

### Consumption contract (references, not owned formulas)

| Downstream formula / behavior | Owner | opponent-ai input |
|---|---|---|
| `ghost_correct` → round outcome, ghost-side damage | battle-system | boolean from F1 |
| Ghost HP baseline and damage-to-ghost application | battle-system | `ghost_hp_*` constant by encounter type |
| Reveal scheduling and "ghost thinking" theater | battle-system | `answer_reveal_delay_ms_*` constant by encounter type (fixed, no RNG) |
| Stage/boss encounter selection | tower | GhostProfile records (accuracy 0.55/0.75, hp 420/600) |
| Ranked banner material (tier accuracy, ghost names, ghost-duel disclosure) | ranked-league, ui-shell | `ghost_accuracy_ranked`, profile display fields |
| Mana gains (+30 correct / +10 wrong) and ult gate | battle-system | **none** — see note below |

### Mana note — interaction with battle-system's ult/mana arithmetic gap

The ghost's roll **does not participate in mana arithmetic, confirmed**. Mana is player-side economy: it accrues on the *player's* answers (+30 correct / +10 wrong, battle-owned), and the ghost's roll affects only the ghost's round outcome and the ghost's reveal scheduling — nothing else. The ult/mana gap flagged in systems-index (3 prior rounds × +30 = 90 < the 100 ult gate) is therefore entirely battle-system's to resolve, and no opponent-ai lever touches it: the ghost draws no mana, grants no mana, and has no mana-related draw. Equally, the ghost stream stays one-draw-per-round (F2, rule 3) — no hidden draws are added for mana reasons, so battle-system fixing the gap by raising mana gain cannot break ghost reproducibility.

## Edge Cases

- **If a roll is exactly equal to the accuracy threshold**: NOT correct — the comparison is strict (`roll < accuracy`, F1). A test fixture can construct this exactly because F2 compares fixed-point integers; the equality case cannot be asserted against floats.
- **If a GhostProfile carries an `accuracy` override outside the safe band 0.40–0.90** (e.g., an authored 0.95 or 0.20): the profile loader **clamps to the band and logs an authoring warning** — the battle stays playable and inside the locked difficulty envelope; the warning surfaces the data bug. It does not fail the session: profiles are static client config without question-content's build gate, so runtime clamping is the last line of defense, and the warning is the signal to fix the data.
- **If the battle seed is missing or invalid when the first round resolves**: the resolver **errors immediately (fail fast)** — it never silently falls back to `Math.random()` or an unseeded stream. An unseeded ghost breaks replay, determinism, and every statistical acceptance test; a loud integration failure is the correct behavior. (battle-system owns seed supply — provisional interface until its GDD lands.)
- **If the player answers before the ghost's reveal delay elapses**: the ghost's result already exists (resolved at round end, Rule 6) — player speed cannot change it. Battle-system owns how the reveal is presented (may fast-forward or truncate the theater); opponent-ai's contract is unaffected. The ghost never "reacts" to the player within a battle — adaptive difficulty is post-MVP.
- **If two battles run with the same seed and the same profile**: the ghost plays the identical W/C sequence in both — **by design, not a bug** (F2 rule 2). This is what makes replays, tests and statistical verification possible. Anti-monotony for the *player* comes from question mixing (battle-system's stream), not from ghost variance.
- **If battle-system stops requesting resolutions mid-battle** (e.g., ghost HP hit 0 and the battle ends early, or a forfeit): the stream simply holds unconsumed positions — there is no cleanup, no re-roll, no leak. opponent-ai does not observe HP or battle state; battle-system decides when the battle is over.
- **If a battle is longer than 4 rounds (post-MVP)**: nothing changes structurally — the stream supplies one draw per round for as many rounds as battle-system requests (F2 rule 7: any new draw types append after the per-round resolution draws). F3's expectations recompute with the actual R.
- **If a GhostProfile references an unknown `class_ref`** (typo, removed class): the profile loader fails at load (fail fast) — class_ref must resolve against hero-class's `wordsmith | grammarian | arcane` vocabulary. Ghosts render identity, so an unresolvable class is a data bug, not a degraded display.
- **If an encounter type and profile disagree** (e.g., a boss profile used in a friend duel): the resolver uses the profile's `accuracy` override when present, else the encounter-type default (Rule 3 precedence: override > mode default) — behavior is always defined. Encounter selection correctness (tower picks stage profiles for stages, boss profiles for bosses) is tower's contract; a mismatch produces a *legal but odd* fight, not undefined behavior.
- **If accuracy sits exactly on a band edge** (0.40 or 0.90): allowed — the band is inclusive; only values strictly outside are clamped.
- **If battle-system later changes mana or damage formulas**: no opponent-ai impact — the ghost draws exactly one value per round for resolution and nothing else (mana note in Formulas). Formula changes on the player side cannot desynchronize ghost sequences.

## Dependencies

**Upstream** (decisions this system must respect):

| System | Tier | Hard/Soft | Interface | Owner of semantics |
|---|---|---|---|---|
| question-content | MVP | Soft | Round context only (encounter type, round index) — the resolver never reads payload content; the accuracy roll is opponent-ai's per question-content's Dependencies row | question-content owns schema, pools, authoring; no per-question difficulty field at MVP (locked) — question-aware AI post-MVP is a contract change requiring reconciliation |
| hero-class | MVP | Soft | `class_ref` vocabulary (`wordsmith \| grammarian \| arcane`) for ghost identity | hero-class owns class records and passives; ghost passives do not trigger at MVP (hero-class EC) |

**Downstream dependents** (bidirectional note: each listed GDD must name
opponent-ai in its own Dependencies section once authored; contracts are
provisional until then). Hard = cannot function without it; Soft = enhanced by it.

| System | Tier | Hard/Soft | Interface | Owner of semantics |
|---|---|---|---|---|
| battle-system | MVP | Hard | Resolver interface: `resolve_round(profile, mode, seed, round_index) → {correct, answer_reveal_delay_ms}`; battle supplies the seed | battle-system owns result application (damage, HP, reveal scheduling, seed generation); opponent-ai owns the roll |
| tower | MVP | Hard (profiles) | Stage ghost profiles (accuracy 0.55, HP 420) and boss profiles (0.75, HP 600) | tower selects the encounter; opponent-ai owns profile data |
| ui-shell | MVP | Soft | Display material: `display_name`, `class_ref`, `flavor_note`, ghost-duel disclosure strings | ui-shell owns rendering; must honor honest-ghost labels (Pillar 4) |
| ranked-league | Alpha | Soft | Ranked accuracy tier (0.70) + ghost naming for the match banner | league owns RP math; opponent-ai supplies ghost identity material |

**No direct dependency** on accounts-backend, forge-srs, speech-io,
equipment, meta-progression. Note on profile delivery: GhostProfiles ship as
static client-side config at MVP; if ghost tuning ever needs live updates,
moving profiles into accounts-backend's versioned content payload is a
contract change (question-content Core Rule 7), not a config edit.

**Systems-index discrepancy note:** the index's opponent-ai row lists only
`question-content` as dependency; this GDD adds **hero-class** as a Soft
upstream (`class_ref` vocabulary, per the hero-class registry note "opponent-ai
(ghost identities)"). When the systems index is next updated, the row should
gain hero-class.

## Visual/Audio Requirements

opponent-ai renders nothing itself — it is a resolver plus profile data. Its
visual obligation is supplying the material that makes the ghost *read* as an
honest opponent (Pillar 4), consumed by battle-system (choreography) and
ui-shell (rendering):

- **Ghost avatar**: each profile's `class_ref` selects the class avatar
  rendered in ghost variant (prototype: same HeroAvatar component, `ghost`
  flag, opacity ~0.8). Must stay visibly non-human — a spectral variant of
  the class look, never a plausible player portrait.
- **Display fields**: `display_name` + `flavor_note` feed the battle HUD's
  opponent panel and the ranked match banner; the ranked banner must carry
  the ghost-duel disclosure (prototype wording: "Không có người chơi trực
  tuyến — đấu với bản ghi chiến thuật (Shadow Ghost)").
- **Reveal theater**: `answer_reveal_delay_ms_*` (Formulas) sizes the
  "ghost is answering" beat — the pacing is battle-system's to schedule;
  the values here are the design target the feel section anchors to.
- No audio surface (no TTS, SFX or music owned here; the ghost is silent —
  any battle audio is ui-shell/speech-io scope).

`art-director` not consulted — Lean mode; the visual surface this system owns
is display data, not rendering. Review the ghost-variant avatar direction
against the art bible when one exists.

## Game Feel

The system's entire feel contribution is **the opponent as a present,
legible antagonist** — delivered through data, scheduled by battle-system:

- **The "thinking" beat** (800–1500 ms by encounter type): long enough that
  the ghost's answer feels decided rather than instantly stamped; ranked
  fastest so competitive density stays high, boss slowest so the checkpoint
  feels weighty. These are fixed values — the beat never jitters, and the
  ghost never feels laggy or random-slow.
- **Legible answer sequence**: the player should be able to read what the
  ghost did each round (right/wrong in the battle log) — the duel needs a
  counterable opponent, not hidden dice. Ghost correctness must surface as
  clearly as the player's own.
- **Honest presence**: the ghost has a name, a class identity and a tier —
  an opponent to beat, presented as exactly what it is. The feel target is
  "rival", not "system message"; the disclosure label keeps it honest
  without making it sterile.
- **Fairness signal**: because accuracy is tiered and overrides stay in-band
  (0.40–0.90), a loss should always feel attributable — the statistical
  envelope (F3: the ghost answers 2.2–3.0 of 4 rounds) is chosen so player
  play quality, not variance alone, decides most battles at the margins.

## UI Requirements

No screens owned. The system supplies display material to two ui-shell
surfaces:

1. **Battle HUD opponent panel** — ghost avatar (ghost variant by
   `class_ref`), `display_name`, HP bar (battle-owned), and the per-round
   ghost answer indicator scheduled by battle-system.
2. **Ranked match banner** — `display_name`, tier label, and the mandatory
   ghost-duel disclosure line (Rule 7; prototype wording above). The
   disclosure is required UI, not flavor: omitting it violates Pillar 4.

**📌 UX Flag — opponent-ai**: the ghost panel and ranked banner consume this
GDD's fields. When the ui-shell GDD lands (it owns all screens), its
`/ux-design` pass must spec both surfaces against these data requirements
and the honest-ghost labels.

## Cross-References

| GDD | Relationship | Section(s) there |
|---|---|---|
| question-content | Upstream Soft — resolver consumes round context only; no per-question difficulty field (locked) | Detailed Design Core Rule 8; Dependencies (opponent-ai row) |
| hero-class | Upstream Soft — `class_ref` vocabulary; ghost passives dormant at MVP | Edge Case "ghost class has a passive"; Formulas constant set |
| battle-system | Downstream Hard — resolver interface, seed supply, HP/mana application (provisional until its GDD) | Detailed Design Interactions; Formulas F2 battle-system guarantees, mana note |
| tower | Downstream Hard (profiles) — stage/boss encounter selection | Detailed Design Interactions (provisional) |
| ranked-league | Downstream Soft — ranked accuracy tier, banner material | Formulas constant set |
| ui-shell | Downstream Soft — rendering, honest-ghost disclosure | UI Requirements above |

## Acceptance Criteria

Legend: **[unit]** = automatable unit test (vitest, deterministic, DI-injected RNG/clock/collaborators — no real PRNG needed); **[integration]** = automated integration test requiring another GDD's system; **[stat]** = statistical harness — automatable and deterministic per run (committed seed lists, fixed tolerance bands, pinned significance level; home: `tests/unit/opponent-ai/` — if more statistical harnesses appear project-wide, a `tests/statistical/` home is a separate standards decision); **[screenshot]** = retained screenshot in `production/qa/evidence/`. *(provisional)* = asserts behavior at the boundary with battle-system, tower or the F2 ADR, none of which have landed; written against the consumption contract in Formulas and must be re-verified when those land.

Shared numbers, restated so no criterion requires reading other sections: ghost accuracy friend 0.65 / ranked 0.70 / tower stage 0.55 / tower boss 0.75 (safe band 0.40–0.90 inclusive, adjacent tiers ≥ 0.05 apart); ghost HP 500 / 500 / 420 / 600; `answer_reveal_delay_ms` 1000 / 800 / 1200 / 1500 (friend / ranked / stage / boss); fixed-point draw domain [0, 2⁵³) integer with `accuracy_threshold` = round(accuracy × 2⁵³) and strict `<`; seed uint64 [0, 2⁶⁴); battle length R = 4; F3 tolerances N ≥ 1000, ±0.03, α = 0.01.

- **OA1 [unit] — Ghost profile data file shape (Core Rule 2).** **GIVEN** the ghost-profile data file is loaded, **WHEN** the profile registry is read, **THEN** profile ids are unique so every lookup resolves to exactly one record; each record carries exactly the keys `ghost_id`, `display_name`, `class_ref`, `accuracy`, `hp`, `is_boss`, `flavor_note`, with `class_ref` ∈ {`wordsmith`, `grammarian`, `arcane`} and `accuracy` a number in [0, 1]; and no ghost identity, accuracy or HP value is defined in source code — editing the data file changes what the registry serves with no code change.
- **OA2 [unit] — Authored tier values and ladder (Core Rule 3 + constant set).** **GIVEN** the ghost-profile data file, **WHEN** the mode-default accuracies, HP baselines and reveal delays are read, **THEN** `ghost_accuracy_friend` = 0.65, `ghost_accuracy_ranked` = 0.70, `ghost_accuracy_tower_stage` = 0.55, `ghost_accuracy_tower_boss` = 0.75; `ghost_hp_friend` = `ghost_hp_ranked` = 500, `ghost_hp_tower_stage` = 420, `ghost_hp_boss` = 600; `answer_reveal_delay_ms_*` = 1000 / 800 / 1200 / 1500 (friend / ranked / stage / boss); all four accuracies sit inside the safe band 0.40–0.90 with adjacent tiers ≥ 0.05 apart; and boss HP ≥ ranked HP with tower-stage HP ≤ friend HP. (Exact numbers are the assertion — boundary-value exception applies.)
- **OA3 [unit] — Strict predicate: equality is wrong (F1 + Edge Case "exactly equal").** **GIVEN** the fixed-point comparison domain (draw ∈ [0, 2⁵³) integer, `accuracy_threshold` = round(accuracy × 2⁵³)), draws injected by the test, **WHEN** a draw equals `accuracy_threshold` exactly, **THEN** the ghost is NOT correct; **and WHEN** the draw is threshold − 1, **THEN** the ghost is correct; **and WHEN** the draw is 2⁵³ − 1, **THEN** the ghost is wrong for every in-band accuracy. Exact equality is constructible only because F2 rule 5 fixes the comparison domain — this criterion is void against float draws.
- **OA4 [unit] — Override changes the threshold, never the draws (Core Rule 3 + F1 example).** **GIVEN** a pinned injected stream whose first draw sits between two thresholds (the GDD's illustrative 0.7312: wrong at 0.70, correct at 0.80), **WHEN** the same battle re-runs with a GhostProfile `accuracy` override of 0.80 instead of the ranked default 0.70, **THEN** exactly the verdicts that cross the new threshold flip and the drawn values are bit-identical — the override never re-seeds, re-orders or adds a draw.
- **OA5 [unit, provisional] — Precedence when encounter type and profile disagree (Core Rule 3 + Edge Case).** **GIVEN** a boss profile carrying `accuracy` 0.75 resolving inside a friend duel, **WHEN** the round resolves, **THEN** the threshold is the profile's 0.75 — override beats mode default, so any encounter/profile pairing resolves with defined behavior (a legal-but-odd fight, never an error); **and GIVEN** a profile with no `accuracy` override, **WHEN** it resolves in each of the four encounter types, **THEN** the tier default applies (0.65 / 0.70 / 0.55 / 0.75). *(provisional: the `resolve_round(profile, mode, seed, round_index)` shape is battle-system's interface, unconfirmed until its GDD.)*
- **OA6 [unit] — Ghost class is identity, not behavior (Core Rule 5 + hero-class Edge Case; sibling of HC13).** **GIVEN** a ghost whose `class_ref` is `grammarian`, **WHEN** three consecutive ghost rounds resolve correctly — the exact slot where the hero-side Grammarian proc fires — **THEN** nothing happens beyond the per-round results: no +60 shield value, no proc flag, no passive-derived field anywhere in the emitted output or held state; **and WHEN** the hero-class records are read directly, **THEN** passive data is still present in them (post-MVP enablement needs no schema change) but no resolver code path reads it.
- **OA7 [unit, provisional] — Fixed reveal delay; verdict blind to player timing (Core Rule 6 + Edge Case "player answers early").** **GIVEN** each encounter type, **WHEN** `resolve_round` returns, **THEN** `answer_reveal_delay_ms` equals the data constant (1000 / 800 / 1200 / 1500), identical across all four rounds of a battle and across two same-type battles with different seeds — the delay carries no RNG; **and WHEN** the same round resolves alongside stubbed player-elapsed inputs of any value, **THEN** the verdict is unchanged — the result exists at round end and receives no player-timing input; the emitted record is pure data (no timer, callback or scheduling side effect — battle-system owns the theater). *(provisional: `resolve_round`'s signature is battle-system's interface.)*
- **OA8 [unit, provisional] — Question-unaware resolver (Core Rule 1 + question-content contract).** **GIVEN** two resolver runs identical in (seed, profile, mode, round count) but with completely different — or empty — question payloads supplied alongside the round context, **WHEN** all rounds resolve, **THEN** the ghost W/C sequences are identical; the round context carries only (encounter type, round index), and no question content, answer key or difficulty field reaches the comparison. *(provisional: the round-context shape is confirmed when battle-system's GDD lands.)*
- **OA9 [unit, provisional] — Consumption discipline: one draw per round, nothing else (Core Rule 4 + F2 rule 3 + mana note).** **GIVEN** an instrumented spy stream over a 4-round battle, **WHEN** rounds resolve in order 1→4, **THEN** exactly 4 draws are consumed and draw k feeds round k — no draw for reveal delay, mana, question selection or anything else; the ghost draws nothing for mana and no battle-side change can make it; **and WHEN** the same seed+profile battle re-runs with battle-side collaborators stubbed to different damage/mana values, **THEN** the ghost draws and sequence are bit-identical.
- **OA10 [unit, provisional] — No re-draw; early battle end leaves the stream intact (F2 rule 4 + Resolved state + Edge Case "ends early").** **GIVEN** a battle abandoned after 2 of 4 rounds (ghost HP 0 or forfeit — battle-system's call, invisible to the resolver), **WHEN** a fresh battle with the same seed and profile runs all 4 rounds, **THEN** rounds 1–4 match the pinned injected sequence exactly — the abandoned battle consumed only its 2 draws and left unconsumed positions with no cleanup, re-roll or leak; **and WHEN** an already-resolved round's result is read again, **THEN** the recorded value is re-served with no new draw — the Resolved emission is final.
- **OA11 [unit, provisional] — Same seed + profile replays identically; nothing else moves it (Core Rule 4 + F2 rules 1–2 + Edge Case "same seed twice").** **GIVEN** two battles with the same seed and same profile, **WHEN** both resolve 4 rounds, **THEN** their W/C sequences are identical — by design, not a bug (this is the replay contract every other criterion leans on); **and GIVEN** battles differing in seed, profile, wall-clock or session state, **WHEN** they resolve, **THEN** the sequence depends on nothing but (seed, profile) — the resolver seeds exactly once per battle and never re-seeds (spy-asserted). *(provisional on the seed-supply interface; algorithm-level platform stability is OA12.)*
- **OA12 [unit, provisional — blocked on F2 ADR] — Pinned vectors for the selected PRNG (F2 rules 1 and 6).** **GIVEN** the PRNG family the F2 ADR selects, **WHEN** the committed vector fixtures run (known seed → known first-R draws), **THEN** the draws match the fixtures on this platform and across the browser matrix (platform-stable, web-native TS requirement), and `Math.random` / `Date.now` appear nowhere in the stream implementation. **Untestable until the ADR lands** — every other criterion here injects deterministic streams precisely so nothing else blocks on this.
- **OA13 [unit] — Missing or invalid seed fails fast (Edge Case).** **GIVEN** `resolve_round` called with seed undefined, null, NaN or outside [0, 2⁶⁴), **WHEN** the first round resolution is requested, **THEN** it throws immediately with an error naming the missing/invalid seed; a spy confirms `Math.random` is never invoked and zero draws occur — the unseeded fallback path does not exist.
- **OA14 [unit] — Out-of-band override clamps with a warning; band edges inclusive (Edge Cases).** **GIVEN** profiles authored with `accuracy` 0.95 and 0.20, **WHEN** the profile loader serves them, **THEN** accuracy is clamped to 0.90 and 0.40 respectively, an authoring warning naming the profile and both values is logged, the battle stays playable and nothing throws; **and GIVEN** profiles authored at exactly 0.40 and 0.90, **WHEN** loaded, **THEN** they are served unchanged — the band is inclusive; only strictly-outside values clamp.
- **OA15 [unit] — Unknown class_ref fails at load (Edge Case + hero-class vocabulary).** **GIVEN** a profile whose `class_ref` is `wordsmyth` (typo) or any id outside `wordsmith | grammarian | arcane`, **WHEN** the profile loader runs, **THEN** it fails at load with an error naming the profile and the offending id — no default-class fallback exists, because an unresolvable ghost identity is a data bug, not a degraded display.
- **OA16 [unit] — Honest-ghost disclosure material present (Core Rule 7 — data presence only).** **GIVEN** the ghost-profile data file and the ranked encounter material, **WHEN** profile records are read, **THEN** every profile carries `display_name` and `flavor_note`, the ranked encounter carries the ghost-duel disclosure strings ("Shadow Ghost" banner material), and no field anywhere encodes a fabricated online count, a fake player-joined event, or any opponent presented as real; **and THEN** no rendering behavior is asserted here — ui-shell owns rendering and its GDD carries the disclosure screenshot (hand-off tracked by the UX flag in UI Requirements).
- **OA17 [unit] — F3 published table matches the Binomial math (F3).** **GIVEN** R = 4 and each tier's p, **WHEN** E = R×p, σ = √(R·p·(1−p)), P(sweep) = p⁴ and P(≤ 1 correct) are computed, **THEN** they reproduce the Formulas table (E 2.20 / 2.60 / 2.80 / 3.00; P(sweep) 9.2% / 17.9% / 24.0% / 31.6%; P(≤1) 24.1% / 12.6% / 8.4% / 5.1%) within stated rounding — the tuning narrative cannot silently drift from the math.
- **OA18 [stat, provisional — blocked on F2 ADR] — Binomial(4, p) statistical surface (F3 QA assertion).** **GIVEN** the seeded-battle harness with committed per-tier seed lists (N ≥ 1000 battles per tier; the seed list is a fixture, never generated at run time — determinism rule), **WHEN** all battles resolve at each tier, **THEN** the per-round correct frequency sits within ±0.03 of p (0.65 / 0.70 / 0.55 / 0.75) and the per-battle correct-count distribution passes a Binomial(4, p) goodness-of-fit at α = 0.01. Runs on the real ADR-selected stream — an injected fake uniform stream would make it vacuous, so it is blocked with OA12.
- **OA19 [unit, provisional] — Negative scope: emit-only contract (Core Rules 3 and 8).** **GIVEN** a profile in any encounter type, **WHEN** it is served and rounds resolve, **THEN** the emitted record contains exactly `{correct, answer_reveal_delay_ms}` — no damage, no HP mutation, no mana field; the `ghost_hp_*` value travels as data to battle-system, and opponent-ai performs no HP arithmetic and no death detection; and the resolver issues no question-selection call of its own. *(provisional: the record shape is battle-system's interface.)*
- **OA20 [integration, provisional — blocked on battle-system GDD] — Seeded battle replays end-to-end.** **GIVEN** battle-system wired to opponent-ai with seed s and a fixed question set, **WHEN** the same battle is replayed, **THEN** the ghost W/C sequence, the reveal delays and the battle outcome are identical, and battle's own randomness (question mixing, crits) never shifts the ghost sequence. Cannot be authored until battle-system's GDD defines the interface, seed supply and its independent streams.

Coverage: Core Rules 1→OA8, 2→OA1, 3→OA2/OA4/OA5/OA14/OA19, 4→OA9/OA10/OA11/OA12/OA13, 5→OA6, 6→OA7, 7→OA16, 8→OA19/OA6/OA9; F1→OA3/OA4, F2→OA9–OA13/OA18/OA20, F3→OA17/OA18; edge cases: roll-equals-threshold→OA3, out-of-band-override→OA14, missing-seed→OA13, player-answers-early→OA7, same-seed-twice→OA11, early-battle-end→OA10, unknown-class_ref→OA15, encounter-profile-disagree→OA5, band-edge-inclusive→OA14, battle-changes-mana/damage→OA9. Total 20: 18 unit (OA5, OA7–OA12, OA19 provisional), 1 statistical (provisional), 1 integration (provisional), **0 screenshot — this system renders nothing** (Rules 6 and 8); the honest-ghost disclosure screenshot is ui-shell's.

Asserted elsewhere (deliberately not criteria here): tower picks stage profiles for stages and boss profiles for bosses (encounter-selection correctness is tower's contract — its GDD must carry that criterion and name opponent-ai in Dependencies); battle-system's seed generation policy and its independent-stream guarantee (battle-system GDD); disclosure rendering (ui-shell GDD). Post-MVP surface carries no criteria by design: >4-round battles (F2 rule 7 append-only) and per-round-type accuracy get criteria when they enter MVP scope.

> **Note — provisional scope**: OA5, OA7–OA12, OA18, OA19 depend on the `resolve_round` interface, seed supply and stream guarantees that battle-system's GDD owns (Dependencies: Provisional); OA12 and OA18 additionally on the F2 ADR (algorithm choice + test vectors). The ten non-provisional criteria (OA1–OA4, OA6, OA13–OA17) are fully assertable now against the resolver boundary with injected streams.

## Open Questions

- **OA-OQ1 — Seed generation policy**: how battle-system generates the
  uint64 seed per battle (random per battle? derived from battle id? stored
  for replay?). Owner: battle-system GDD. Resolve when battle-system is
  designed.
- **OA-OQ2 — PRNG algorithm + pinned test vectors**: pick the concrete
  seedable PRNG (counter/PCG family recommended), record as ADR, pin
  seed→draw vectors as test fixtures. Owner: technical-director /
  lead-programmer. Resolve before battle-system implementation.
- **OA-OQ3 — Post-MVP depth ladder**: order of adoption among
  per-round-type accuracy → question-aware accuracy (needs a
  question-content contract change) → adaptive difficulty. Owner:
  game-designer, post-MVP.
- **OA-OQ4 — Profile delivery path**: static client config at MVP; decide
  whether ghost tuning needs the accounts-backend versioned payload before
  ranked tuning begins. Owner: game-designer with accounts-backend owner,
  before Alpha.
- **OA-OQ5 — Ghost name roster**: which fictional display names/flavor
  notes ship at MVP (prototype has `BanThan_Lan`, `MinhTuan_99`); needs a
  written roster so profiles are not invented ad hoc in battle code. Owner:
  writer with game-designer, before ui-shell implementation.
