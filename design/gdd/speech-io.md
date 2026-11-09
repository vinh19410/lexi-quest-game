# Speech I/O

> **Status**: Complete — pending design review
> **Author**: user + systems-designer, qa-lead (agents); game-designer not consulted (Lean)
> **Last Updated**: 2026-11-09
> **Last Verified**: 2026-11-09
> **Implements Pillar**: Pillar 1 (Speed Is Damage — listening rounds under timer), Sensation aesthetic (TTS audio)

## Summary

Speech I/O speaks and listens: it renders listening-round words as spoken
audio (TTS, with an IPA-first fallback when the browser has no English
voice) and runs the ultimate round's spell-cast interaction — speak the word
into the mic or type its spelling — returning a quality score the battle
converts into ultimate damage. Mic scoring is simulated (0.88–0.98) behind a
fixed scorer interface so a real pronunciation engine can drop in later
without touching gameplay. It exists because listening and spoken production
are the skills being trained (Pillar 3), and because a duel where the
ghost's word is only ever text is a reading quiz, not a language battle.

> **Quick reference** — Layer: `Presentation` · Priority: `MVP` · Key deps: `battle-system, question-content`

## Overview

Speech I/O is LexiQuest's voice layer: it speaks English to the player and
listens back. It owns two player-facing surfaces — the **listening round**
(R3 `listening_pierce`), where it renders the challenge word as spoken audio
(via the Web Speech API) with an IPA-first degraded fallback, and the
**ultimate-round speech interaction** (R4 `ultimate_burst`), where the player
either speaks the incantation into the microphone or spells the word, and the
system returns a `quality ∈ [0, 1]` score the battle consumes as damage
multiplier. Mic scoring is **simulated** (band 0.88–0.98) behind a scoring
interface so a real pronunciation-scoring engine can drop in later without
gameplay changes [CONFIRMED 2026-11-08]. The system exists because a language
battle without audio input is not a language battle: listening comprehension
and spoken production are real skills being trained (Pillar 3), and spoken
audio carries the Sensation aesthetic's "TTS audio" beat. Speech I/O owns
rendering, capability detection, fallback selection, and scoring; it owns
**no** battle state, no timer, no question data (`tts_text`/`ipa` are
question-content's), and no SFX/music (battle specifies cues, ui-shell
renders them).

## Detailed Design

### Core Rules

1. **Ownership boundary**: speech-io is a **service layer, not a game state
   owner**. It owns speech rendering, capability detection, fallback
   selection, and quality scoring. It owns no battle state, no timer, no
   question data, and no SFX/music. Battle invokes it twice per battle:
   once per listening round (R3, and any listening round in tower/fallback
   rotations) and once in the ult round (R4, when the ult fires).

2. **Listening pipeline (R3 `listening_pierce`)**: when battle starts a
   listening round, speech-io receives the question payload's `tts_text`
   (defaults to `term` per question-content Core Rule 3) and optional `ipa`.
   **Ownership pin (qa-lead G4):** the default belongs to question-content's
   schema semantics — consumers read an *effective* `tts_text`; speech-io
   never substitutes the default itself, so an L1 round always has an
   utterance to speak (SI5 asserts the observable, agnostic to plumbing).
   It selects a mode from the **fallback ladder** (Rule 4), speaks the word
   once automatically, and exposes a replay control. Playback never gates the
   round: the battle timer starts when the options become actionable
   (battle BS7), whether or not audio has finished.

3. **Replay policy**: replays are **unlimited and free of any explicit
   cost** — the self-balancing cost is the round timer itself (speedMult
   decays while replaying). A replay never resets, pauses, or extends the
   timer (battle Core Rule 7). At commit, any in-flight playback stops
   immediately.

4. **Fallback ladder** (evaluated top-down at round start, per-question):
   - **L1 — TTS**: a voice whose `lang` starts with `en` is available →
     speak `tts_text` with the configured voice parameters (Rule 6).
   - **L2 — IPA-first**: no English voice available (or the speech engine
     itself is missing) **and** the payload carries `ipa` → display the IPA
     transcription prominently instead of audio. The English `term` and
     `tts_text` are **never displayed** in this mode — the options already
     include the answer's meaning, and showing the term would collapse a
     listening round into a reading round. IPA shows pronunciation, not
     meaning, so the round stays a listening-comprehension task.
   - **Fail fast**: a payload with neither renderable path is impossible by
     question-content's build gate (Core Rule 6); if a content bug ever
     delivers one, speech-io raises an error naming the question id and
     battle fails the round fast (battle BS34's contract).

5. **Voice parameters** (data-driven config, not hardcoded):
   `voice_lang_preference = "en-US"` (fall through to any `en-*` voice),
   `tts_rate = 0.85`, `tts_pitch = 1.0`, `tts_volume = 1.0`. These are the
   concept's locked TTS settings [rate 0.85, en-US, CONFIRMED 2026-11-08].

6. **Ultimate-round speech interaction (R4 `ultimate_burst`)**: speech-io
   presents **two paths** to cast the spell:
   - **Mic path** — the player speaks the target word; the active scorer
     (Rule 8) returns `quality`. At MVP the scorer is simulated (Formula S1).
   - **Spell path** — the player types the word; an exact match under the
     normalization defined in Formula S2 (NFC, lowercased, trimmed, internal
     whitespace collapsed; punctuation is significant at MVP) scores
     `1.0`, anything else `0.0` (Formula S2).
   The player may switch paths freely **until the first submission**; a
   submission locks the score (one attempt per ult). The prompt displays the
   word's Vietnamese meaning and the target word's first letter; the English
   word itself is never displayed on the mic path.

7. **Timer discipline in the ult round**: the ult has battle's timer with the
   11 000 ms slow-rune threshold; the mic/spell interaction is done *inside*
   that window. Speech-io makes the paths usable immediately (no permission
   round-trip blocks the timer start — see Edge Cases for the denied-permission
   flow). Elapsed time does **not** scale ult damage (quality replaces speed,
   battle B5) — the timer only threatens the > 11 000 ms cursed rune.

8. **Scoring engine interface**: all quality passes through one interface —
   `score(target_word, attempt) → quality ∈ [0, 1]` — implemented at MVP by
   `SimulatedScorer` (random 0.88–0.98, Formula S1). A real pronunciation
   engine later implements the same interface with no gameplay or battle
   changes [2026-11-08 decision]. The simulated scorer uses the **platform
   RNG, not battle's seeded PRNG streams** — speech-io never draws from the
   ghost/crit streams (battle's stream discipline). Replay determinism is
   preserved because the resulting `quality` is **recorded in the battle
   commit log** (battle replays from recorded commits + seed, Core Rule 18);
   the sim never needs to be reproducible itself. **Battle consumes the
   recorded, precision-rounded value** (`quality_precision_decimals`,
   Formula S3) — never the scorer's raw float — so live and replay damage
   are identical by construction.

9. **Quality contract (resolves battle OQ-BS5)**:
   - `quality` is a continuous value in `[0, 1]`, delivered exactly as
     scored — speech-io applies **no floor and no clamp** beyond the range
     check (out-of-range from a future real engine → Edge Cases).
   - The pass/fail threshold `quality_success_threshold = 0.6` gates
     **presentation only**: ≥ 0.6 the ult animation lands as a successful
     cast; < 0.6 it plays as a fizzle. Battle consumes the raw value either
     way — B5's math is unchanged and `quality = 0 → 0` damage remains a
     legitimate failure state.
   - **No quality floor at MVP.** The ±350-swing floor lever (≈ 0.15)
     suggested in battle Edge Cases stays with the owner balance pass: at
     MVP the simulated band 0.88–0.98 makes both the threshold and any floor
     unreachable, so adopting a floor now would be unfalsifiable. If a floor
     is ever adopted it must be reconciled against battle's B5 output range
     (a 0.15 floor raises minimum ult damage from 0 to ≈ 26–31) — a
     battle-GDD edit, not a silent speech-io retune. The ghost's fixed ult
     damage of 150 (registry `ghost_base_damage`) is a battle constant and
     is **never** touched by any quality lever.

10. **Capability probe and warm-up**: at battle start speech-io probes the
    speech engine once (availability + voice list, including the async
    `voiceschanged` settlement) and caches the result; each round re-checks
    only that the cached voice still exists. Probing never happens mid-round
    (a mid-round engine loss degrades to L2 for that round, Edge Cases).

11. **TTS is not mutable**: the spoken word *is* the question — battle's
    mute (SFX cues) never applies to speech-io playback. Volume follows the
    OS/browser. (Post-MVP: a TTS volume/repeat setting can join ui-shell's
    accessibility options.)

12. **Speech-io emits no game events**: it is called, it returns. All
    battle-visible outcomes arrive as return values (`quality`, the mode
    selected, errors) — never via events battle must listen for. This keeps
    the dependency direction one-way (battle → speech-io).

### States and Transitions

Two independent machines: a **capability machine** (lives for the whole
battle) and a **round machine** (one per listening/ult round).

| State | Meaning | Exits |
|---|---|---|
| `Unprobed` | Battle not started | → `Probing` (battle start) |
| `Probing` | Engine + voice-list probe in flight | → `TTSReady` (en voice found) · `Degraded` (no engine / no en voice) |
| `TTSReady` | Cached en-US/en-* voice available | → `Degraded` (cached voice vanished at a round re-check) |
| `Degraded` | IPA-first fallback in effect; re-evaluated **per round** (a restored voice returns the machine to `TTSReady` at the next round re-check) | → `TTSReady` (voices restored) |

| State | Meaning | Exits |
|---|---|---|
| `Prompting` (listening) | Payload received, mode selected, options actionable — timer running (battle-owned) | → `Speaking` (auto-play once) · → `Stopped` (battle commit before playback starts — options are actionable from round start, Core Rule 2 / SI8) |
| `Speaking` | TTS playback in flight | → `Awaiting` (playback ends) · → `Stopped` (battle commit — playback cut, Rule 3) · → `Speaking` (replay pressed) |
| `Awaiting` | Audio done; waiting for the player's commit (replay still available) | → `Speaking` (replay) · → `Stopped` (battle commit) |
| `Stopped` | Round resolved | → `Prompting` (next listening round) |
| `UltPrompting` | Ult paths presented; no submission yet | → `MicListening` (mic path armed) · `Spelling` (spell path focused) — switching is free |
| `MicListening` | Mic path armed, capture "in flight" (simulated beat) | → `Scoring` (capture beat elapsed) · → `UltPrompting` (player switches path before submitting) |
| `Spelling` | Text input focused, no submission yet | → `Scoring` (submit) · → `UltPrompting` (switch to mic) |
| `Scoring` | Scorer running | → `Resolved` (quality returned; score locked) |
| `Resolved` | `quality` delivered to battle; presentation flag (`cast`/`fizzle` vs 0.6 threshold) handed to ui-shell | terminal for the round |

### Interactions with Other Systems

| System | Direction | Interface | Owner of semantics |
|---|---|---|---|
| question-content | Upstream (Hard) | `tts_text` (defaults to `term`), `ipa` on `listening_pierce` payloads; word entries (`term`, VI meaning) for the ult prompt | question-content owns schema + build gates; speech-io owns rendering/fallback over those fields |
| battle-system | Upstream (Hard) | Calls: round start (payload), replay, commit/cut, ult interaction start; Returns: selected mode, `quality ∈ [0,1]`, errors. Battle owns timer, round state, B5 consumption | speech-io owns speech/scoring; battle owns rounds, timer, and the recorded commit (Rule 8) |
| ui-shell | Downstream (Soft) | Renders the speech-io UI contract: replay button, IPA fallback display, mic/spell path picker, mic permission state, cast/fizzle beat; consumes the capability machine's state for display | speech-io owns what the states mean; ui-shell owns rendering (same split as battle/ui-shell) |
| accounts-backend | None direct | — | — |
| forge-srs / equipment / tower | None direct | Tower reuses battle's rounds, so tower listening rounds flow through the same battle → speech-io calls with no separate contract | — |

## Formulas

> **Source**: systems-designer consultation, 2026-11-09 (Formulas is a
> HIGH-implementation-risk section — the one specialist spawn Lean mode
> keeps). Findings F1–F6 resolved: F1/F2/F3 folded into Core Rules 6/8 and
> S3 below; F4/F5 became Edge Cases; F6 (B5 class numbers cross-check) was
> verified clean, no action.

### S1 — Simulated mic-path quality

The `simulated_quality` (S1) formula is defined as:

`quality = round_half_up_to_precision(sim_quality_band_low + platform_rng() × (sim_quality_band_high − sim_quality_band_low), quality_precision_decimals)`

**Variables:**

| Variable | Type | Range | Source | Description |
|----------|------|-------|--------|-------------|
| `platform_rng()` | float | [0, 1) | calculated | One uniform draw per mic submission; never drawn from battle's seeded PRNG streams (Core Rule 8) |
| `sim_quality_band_low` | float | 0.88 (fixed) | data file | Lower bound of the simulated mic quality band |
| `sim_quality_band_high` | float | 0.98 (fixed) | data file | Upper bound of the band |
| `quality_precision_decimals` | int | 2 (fixed) | data file | Rounding precision before commit-log recording (S3) |
| `quality` | float | 0.88–0.98, discrete 0.01 steps | calculated | Returned to battle; the recorded (rounded) value is what battle consumes |

**Output Range:** [0.88, 0.98] — bounded by construction, no clamp needed.
The interval is closed at *both* ends only because of the rounding rule
(`platform_rng()` never returns 1, so raw 0.98 is unattainable; raw
≥ 0.975 rounds up to 0.98). Min 0.88 occurs at raw < 0.885; max 0.98 at
raw ≥ 0.975.

**Example:** `platform_rng()` draw = 0.413 → 0.88 + 0.413 × 0.10 = 0.9213
→ recorded as **0.92**. Battle consumes it via B5 at Wordsmith:
(175 + 80 × 0.38) × 0.92 = 188.968 → **189 damage**.

### S2 — Spell-path quality

The `spell_path_quality` (S2) formula is defined as:

`quality = 1.0  if  normalize(attempt) == normalize(target_word),  else 0.0`

`normalize(s) = collapse_internal_whitespace(trim(to_lowercase(nfc(s))))`

**Variables:**

| Variable | Type | Range | Source | Description |
|----------|------|-------|--------|-------------|
| `target_word` | string | question payload `term` | data (question-content) | The correct answer; never displayed on the mic path (Core Rule 6) |
| `attempt` | string | player-typed text | calculated (input) | Raw string before normalization |
| `quality` | float | {0.0, 1.0} | calculated | Exactly two possible outcomes |

**Output Range:** exactly {0.0, 1.0}. The spell path is the *only* MVP
route to B5's lower terminus (0 damage — the legitimate failure state) and
to the fizzle presentation, and the only route to the exact 205 upper
terminus (quality 1.0). Punctuation is significant at MVP (a hyphen or
apostrophe mismatch is a miss) — matches a spelling test's semantics.

**Example:** target `necessary`, attempt `"  Neccessary "` → normalize →
`neccessary` ≠ `necessary` → **0.0** → B5 → **0 damage**. Attempt
`"Necessary"` → **1.0** → Wordsmith: 205.4 → **205 damage**.

### S3 — Quality precision and recording (constant + persistence rule, not a formula)

`quality_precision_decimals = 2`, round-half-up (global project
convention), applied **before recording** to the commit log; battle
consumes the recorded value (normative — Core Rule 8). Rationale:
(a) **determinism** — without rounding, live and replay can differ by 1
damage (raw 0.975: live 205.4 × 0.975 = 200.265 → 200, replay-from-log
0.98 → 201); (b) **resolution** — at 2 decimals each 0.01 quality step
moves B5 damage by ≥ 1.75 at any atk, so no two recorded values produce
identical damage (3 decimals buys sub-point resolution for nothing);
(c) the commit log stays human-readable.

### P1 — Cast/fizzle presentation predicate

`cast = quality ≥ quality_success_threshold` — a comparison predicate,
not math; the boolean goes to ui-shell for the cast/fizzle beat while
battle consumes the raw quality regardless (Core Rule 9).

### Constant set

| Constant | Value | Unit | Rationale |
|----------|-------|------|-----------|
| `tts_rate` | 0.85 | × default speech rate | Concept-locked [CONFIRMED 2026-11-08]; drift breaks listening-round pacing |
| `tts_pitch` | 1.0 | × default pitch | Neutral; keeps platform voice character |
| `tts_volume` | 1.0 | × default volume | Core Rule 11 — TTS follows OS/browser volume |
| `voice_lang_preference` | "en-US" | BCP-47 tag | Falls through to any `en-*` voice (Ladder L1) |
| `quality_success_threshold` | 0.6 | quality | Presentation-only cast/fizzle gate; never gates damage |
| `sim_quality_band_low` | 0.88 | quality | Sim band floor; keeps every mic cast above the 0.6 threshold |
| `sim_quality_band_high` | 0.98 | quality | Sim band ceiling; spelling exactly always out-damages the sim (1.0 > 0.98) |
| `quality_precision_decimals` | 2 | decimal places | Commit-log determinism; ≥ 1 damage step per 0.01 quality step (S3) |
| `sim_listening_beat_ms` | 1200 | ms | Simulated capture beat. Matches the tower-stage ghost's reveal delay (1200 ms — registry `answer_reveal_delay_ms_tower_stage`; the longest tier is the tower boss's 1500 ms, not matched) so it reads as an established rhythm; mic total ≈ 2.2–3.2 s inside the 11 000 ms window (≥ ~7.8 s headroom); keeps mic competitive with typing (3–6 s). Safe range 600–2000 ms — below 600 the beat is imperceptible, above 2000 it dominates the path and pushes slow speakers toward the rune threshold |

All constants are **locked** at MVP (concept decision or cross-system
rationale above) — no tunable safe ranges by design (qa-lead G6); the
600–2000 ms band on `sim_listening_beat_ms` documents the choice rationale,
not a tuning knob. The one future
knob is `quality_success_threshold`: in the real-scoring-engine era it
becomes tunable (plausible range 0.4–0.8 — below 0.4 a fizzle stops
informing, above 0.8 it punishes real learners), and the three
sim-band/precision constants retire with the simulator.

### B5 termini provenance (cross-check, no new math)

Battle's documented B5 output range 0–205 at base stats holds with S1/S2:
the **0 and 205 termini are spell-path-only**; the mic path alone spans
**181–201** (205.4 × 0.88 = 180.752 → 181; × 0.98 = 201.292 → 201 at
Wordsmith base). The 0.6 threshold and any future floor lever (0.15 ⇒
min damage 26 at atk 0, 31 at atk 80 — matching Core Rule 9's "≈ 26–31")
sit below the sim band's floor, so neither is reachable at MVP — the
documentation of that unreachability lives in Edge Cases.

## Edge Cases

- **If the browser exposes no speech engine at all** (`speechSynthesis`
  undefined): the capability machine settles in `Degraded` for the whole
  battle — every listening round renders IPA-first (L2). If a payload also
  lacks `ipa`, that is a build-gate violation: fail fast naming the question
  id (battle BS34). The ult round is unaffected — the spell path needs only
  a text input.
- **If a payload has `tts_text` but no `ipa` and the engine is missing**:
  impossible by question-content's build gate (at least one of the two
  fields must exist); when it happens anyway, the round fails fast — it is
  never rendered as a silent, unplayable round.
- **If TTS playback errors mid-round** (voice fails after options are
  actionable): one silent retry; if the retry also fails, the round falls
  back to L2 (IPA) for that question when `ipa` exists, otherwise the round
  fails fast. The timer keeps running throughout — battle owns it and no
  speech failure pauses it.
- **If the browser blocks auto-play of speech until a user gesture**
  (common on mobile Safari): the round still starts with options actionable
  (timer running) and the replay control is shown in a "tap to hear" state;
  the player's first tap both satisfies the gesture requirement and plays.
  This is the replay cost, not a timer reset.
- **If replay is pressed while audio is already speaking**: the current
  playback is cancelled and restarted from the beginning of `tts_text` — a
  single voice instance, never overlapping playbacks.
- **If the player commits an answer while audio is playing**: playback is
  cut immediately at commit; elapsed time was already fixed at
  options-actionable → commit (battle BS7), so the cut changes nothing.
- **If mic permission is denied in the ult round**: the mic path renders as
  unavailable ("mic unavailable" state), the spell path is auto-focused,
  and no re-prompt is shown this battle. Permission state is re-read next
  battle, not next round.
- **If mic permission is granted mid-interaction** (a prompt that was
  pending when the ult started resolves while the interaction is live):
  the mic path unlocks immediately — switching is free until the first
  submission (Core Rule 6). A grant landing after the score has locked
  changes nothing this ult (the lock is final) and is picked up by the
  next battle's re-read.
- **If no mic capture API exists** (`getUserMedia`/ equivalents absent):
  same as denial — spell path only, mic path never rendered as available.
- **If the player switches from mic to spell mid-capture** (or back): the
  partial capture is discarded with no score; no quality exists until a
  first submission lands (Core Rule 6's free-switch rule).
- **If the ult timer expires mid-interaction** (capture beat running, or
  spell text half-typed): speech-io cancels the interaction cleanly and
  returns nothing — battle resolves the timeout by its own rules (the
  11 000 ms slow-rune threshold is battle's). Speech-io never extends or
  pauses the window. Whether `ultimate_burst` has a hard expiry at all is
  battle's unpinned timer semantics (OQ-SI1): under a commit-only reading
  this case reduces to battle teardown, and the beat-completion rule below
  is written to hold under the no-expiry reading — it yields to a hard
  expiry if battle later defines one.
- **If the player double-submits** (double-tap on spell submit, or a
  submit racing the score resolution): the first submission locks the
  score; the second is ignored idempotently (`Scoring`/`Resolved` accept no
  further input).
- **If the spell submission is empty or whitespace-only**: the submit
  control is disabled until the input contains a non-whitespace character;
  an empty attempt can never be scored.
- **If a future real scoring engine returns a value outside [0, 1]**:
  the interaction fails fast with an error naming the scorer — scorer
  output is combat-relevant data, and silently clamping would feed battle a
  value B5's documented output range does not cover (the same fail-fast
  idiom as the unplayable-payload case). The MVP simulated scorer cannot
  produce this (Formula S1's output range is closed by construction).
- **If voices change mid-battle** (async `voiceschanged` adds or removes
  voices): the per-round re-check picks it up at the next round start — a
  round already in flight never switches mode mid-playback. A removed
  voice degrades that next round to L2; a newly available voice upgrades
  `Degraded` → `TTSReady`.
- **If `tts_text` differs from `term`** (author override): the override is
  spoken verbatim; `term` is never substituted and never displayed on the
  mic path.
- **If the capture beat is still running when the 11 000 ms ult threshold
  passes**: the beat always completes and `quality` is always returned —
  slowness never downgrades a correct answer (the > 11 000 ms cursed rune
  is battle's call, made on the commit after quality lands). A player who
  starts speaking late is never cut off mid-beat.
- **If the ult is cast via the mic path**: the fizzle presentation is
  unreachable at MVP — the simulated band's floor (0.88) sits above the
  0.6 threshold, so every mic cast presents as a successful cast. The
  fizzle is spell-miss-only content until a real scoring engine lands
  (by design, not an omission).
- **If the tab is hidden during a listening round**: browsers may suspend
  audio; if playback is suspended or fails, the "tap to hear" replay state
  covers it. The timer keeps running (battle owns time; no auto-pause —
  pausing would let a player freeze speedMult decay by tabbing away).

## Dependencies

**Upstream dependencies** (decisions this system must respect):

| System | Tier | Hard/Soft | Interface | Owner of semantics | Status |
|---|---|---|---|---|---|
| question-content | MVP | Hard | `tts_text` (defaults to `term` when absent), `ipa` on `listening_pierce` payloads; build gate guarantees at least one field; word entries (`term`, VI meaning, first letter) for the ult prompt | question-content owns schema + build gates; speech-io owns rendering and fallback over the fields | GDD Approved |
| battle-system | MVP | Hard | Call/response interface (Core Rules 2, 6, 12): round start with payload, replay, commit/cut, ult interaction returning `quality ∈ [0, 1]`; battle owns timer, round state, B5 consumption, the recorded commit | speech-io owns speech rendering + scoring; battle owns rounds and time | GDD Approved |

**Locked values this GDD references, never redefines** (from battle/registry):
`ghost_base_damage` 100/150 (the quality-floor lever must reference the 150,
never retune it — registry note), `base_round_time_s` 10 (floor 5), the
11 000 ms ult slow-rune threshold, `fast_answer_threshold` 3000 ms
(unused by speech-io — listening has no speed exemption — listed to prevent
accidental redefinition), battle's stream discipline (speech-io never draws
from the ghost/crit PRNG streams).

**Downstream dependents** (bidirectional note: battle-system and
question-content already name speech-io in their Dependencies sections; the
rest must name speech-io once authored):

| System | Tier | Hard/Soft | Interface | Owner of semantics | Status |
|---|---|---|---|---|---|
| ui-shell | MVP | Soft | Renders the speech-io UI contract: replay button, "tap to hear" state, IPA fallback display, mic/spell path picker, mic-permission states, cast/fizzle beat; reads the capability machine for display | speech-io owns state semantics; ui-shell owns rendering | GDD not yet authored |
| tower | MVP | None direct | Tower listening rounds flow through battle's calls — no separate contract | — | GDD Approved (tower lists speech-io as an explicit non-dependency — consistent) |
| localization | Alpha | Soft | UI strings for mic/spell prompts and states (Vietnamese); speech content itself is English learning content, never localized | localization owns string extraction | GDD not yet authored |

**No dependency** on accounts-backend (speech capabilities are client-side;
nothing persists), hero-class (Arcane Speaker's listening damage multiplier
lives in battle's B4 — speech-io returns quality and owns no passive
arithmetic),
opponent-ai, forge-srs, equipment, meta-progression, ranked-league, or
real-pvp (a real PvP battle reuses the same call/response interface).

## Visual/Audio Requirements

> **Source**: authored from battle-system's Visual/Audio ownership split and the
> concept's locked audio settings. `art-director` not consulted — Lean mode
> (speech has no visual surface of its own). Review manually before production.

**Ownership.** Speech-io owns exactly one audio stream: **speech** (TTS
playback and the ult capture beat). It owns zero SFX and zero music — the
8-cue battle set (confirm-correct … stinger-defeat) is battle's
specification, rendered by ui-shell; the ult's cast/fizzle *sound* is part of
that cue set, triggered by battle's resolve, not by speech-io. Speech-io
hands ui-shell only the **presentation flag** (`cast` ≥ 0.6 / `fizzle`
< 0.6) so the animation and cue can be composed on battle's resolve beat.

**Speech audio constraints.**
- Single voice instance; a new utterance cancels the previous one (Edge
  Cases). No speech ever overlaps another speech playback.
- Speech is cut, never faded, at commit — an abrupt cut is correct feedback
  (the answer landed), a fade would imply softness the timer does not have.
- Speech volume follows the OS/browser; battle's SFX mute never applies to
  speech (Core Rule 11). The two streams may mix freely — battle cues are
  short percussive hits, speech is the longest audio object in the game, and
  no ducking is specified at MVP.
- The capture beat (simulated mic listening window) is *silence with an
  active-state visual* — no fake "listening" sound; the visual is ui-shell's
  (mic icon pulse per its icon system).

**Visual surface.** Speech-io has none of its own: the replay control,
"tap to hear" state, IPA fallback panel, mic/spell path picker and
permission states are ui-shell renderings of the UI contract (see UI
Requirements). Iconography belongs to the lucide set per the concept's
pipeline constraints (e.g. `mic`, `volume-2`/replay, `keyboard-hide` class
glyphs) — named here as intent, owned by ui-shell.

## Game Feel

- **The word is a projectile, not a cassette.** The word speaks the moment
  the round opens — no menu, no "press play first" gate — because the timer
  is already running. Latency target: `speak()` call → audible onset
  ≤ 300 ms on a warm engine (tuned at first build; a slow onset is
  indistinguishable from a laggy game).
- **Replay must feel free but cost time.** Instant restart (no spinner, no
  re-fetch) so the player never blames the tool for the speedMult they are
  burning. If replay ever lags, players will feel cheated of damage — the
  worst possible association for Pillar 1.
- **The capture beat is a held breath, not a wait.** The ~1.2 s simulated
  "listening" window is staged as the ghost pausing to hear you — an active
  state with a pulsing mic — never a progress bar. It must read as
  *anticipation*, the one beat in the game where time slows before the
  loudest hit.
- **A fizzle is information, not punishment.** Below the 0.6 threshold the
  cast fizzles: quick, legible, and immediately followed by the damage
  number (which at MVP's 0.88–0.98 band will be large anyway). The fizzle
  teaches the future real-engine stakes without ever lying about damage —
  battle consumes the raw quality either way.

## UI Requirements

Speech-io contributes no screen of its own; it defines the **UI contract**
ui-shell renders inside battle screens:

| Element | Contract | States |
|---|---|---|
| Replay control | Restart `tts_text` playback from 0; single instance | enabled · "tap to hear" (gesture-blocked/suspended) · hidden (L2 mode) |
| IPA fallback panel | Renders `ipa` prominently in L2 mode; never shows `term`/`tts_text` | visible (L2) · hidden (L1) |
| Ult path picker | Two affordances: mic path + spell path; free switch until first submission | mic available · mic unavailable (denied/no API) · spell focused · submitted (locked) |
| Mic capture state | Active-state visual during the capture beat | idle · listening (pulse) · scoring |
| Spell input | Text field; submit disabled until non-whitespace input; exact-match hint copy must reflect the full normalization (case, spacing and NFC form forgiven; punctuation significant — final player-facing copy routed to `/ux-design`, qa-lead G5) | empty · filled · submitted |
| Cast/fizzle flag | Boolean presentation flag ≥ / < `quality_success_threshold` | cast · fizzle |

- All prompt copy (mic/spell labels, permission-denied message) is
  Vietnamese UI text — a localization extraction concern (Alpha tier), with
  English placeholder strings at MVP.
- Accessibility floor (carried from battle's pipeline constraints): every
  audio-communicated state has a static equivalent — the IPA panel is itself
  the deaf/hard-of-hearing equivalent of L1; the capture beat needs a
  non-motion active indicator variant under `prefers-reduced-motion`.

> **📌 UX Flag — speech-io**: This system has UI requirements. In Phase 4
> (Pre-Production), run `/ux-design` to create a UX spec for the listening
> replay/fallback states and the ult speech-interaction panel before writing
> epics. Stories that reference these UI elements should cite
> `design/ux/[screen].md`, not the GDD directly. Note this in the systems
> index for this system.

## Cross-References

| Referenced GDD | What it supplies | Sections consumed |
|---|---|---|
| battle-system | Round types, timer semantics (options-actionable start, replay no-reset), B5 quality consumption, stream discipline (no PRNG draws), commit recording, fail-fast listening contract, OQ-BS5 handoff | Detailed Design (Rules 2, 5–9, 12), Formulas (B2, B5), Edge Cases, Open Questions (OQ-BS5) |
| question-content | `tts_text`/`ipa` fields + `term` default, build gate (≥ 1 field), listening payload shape, word entries for the ult prompt | Core Rule 3, Interactions, Edge Cases |

## Acceptance Criteria

> **Source**: qa-lead consultation, 2026-11-09. Math in S1/S2/S3/P1 and the
> B5-termini cross-check recomputed independently — clean. **Browser-boundary
> statement**: real mic capture and acoustic TTS output are never AC-asserted;
> every criterion tests at the interface boundaries (mode selection, the two
> state machines, recorded values) with capture/audio doubles injected. The
> scorer interface (Rule 8) and the injectable platform RNG are the designed
> seams that make the unhearable testable. 26 criteria: 23 unit (SI23/SI24
> provisional on OQ-SI1), 1 statistical, 1 integration (replay leg blocked
> with OQ-BS1), 1 screenshot (blocked on ui-shell GDD). SI1–SI22 assertable
> now.

### Capability machine (Core Rules 4, 10)

- **SI1 [unit] — Capability probes once per battle; rounds re-check the cache only (Core Rule 10).** **GIVEN** a battle start with a spy-wrapped speech engine, 2 listening rounds and 1 ult, **WHEN** the battle runs, **THEN** exactly one full probe (engine availability + voice list, including async `voiceschanged` settlement) runs at battle start; each round start performs only the cached-voice membership re-check (zero further full probes); and no probe ever runs mid-round — a mid-round engine loss waits for the next round's re-check.

- **SI2 [unit] — Fallback ladder selects per round; mid-battle voice changes re-evaluate only at round start; Degraded leaves the ult untouched (Core Rule 4 + States).** **GIVEN** an English voice (`en-US` or any `en-*`) in the cached list, **WHEN** a listening round starts, **THEN** mode = L1 and the utterance queues; **and GIVEN** no engine or no `en` voice with `ipa` present, **THEN** mode = L2 for that round; **and GIVEN** a voice removed mid-battle, **THEN** the round in flight completes in its original mode (never switches mid-playback) and the next round re-evaluates — removed degrades to L2, newly available upgrades `Degraded` → `TTSReady`; **and GIVEN** Degraded for the session (no engine at all), **WHEN** the ult starts, **THEN** it proceeds normally — the spell path needs only a text input.

- **SI3 [unit] — L2 display contract excludes the English answer (Core Rule 4).** **GIVEN** L2 mode, **WHEN** the round's display payload is produced, **THEN** it carries `ipa` and contains neither `term` nor `tts_text` in any string field (the options' meaning set is battle/question-content's, untouched). Contract-level: speech-io produces the L2 payload; the rendered pixels are ui-shell's (SI26).

- **SI4 [unit] — Unplayable listening payload fails fast naming the question id (Core Rule 4 + Edge Cases; battle-side twin BS34).** **GIVEN** a `listening_pierce` payload missing both `tts_text` and `ipa` (constructible only by breaking question-content's build gate), **WHEN** round start is attempted, **THEN** speech-io raises an error naming the question id and queues no playback; **and GIVEN** a payload with `tts_text` but no `ipa` on a session where no audio path exists (no engine), **THEN** the same fail-fast fires — the round never renders as silently unplayable. *(BS34 pins battle's behavior upon receiving the error; SI4 pins speech-io detecting and raising.)*

### Listening pipeline (Core Rules 2, 3, 5, 11)

- **SI5 [unit] — Auto-play once per round; `tts_text` defaults to `term`; override verbatim (Core Rule 2 + Edge `tts_text` ≠ `term`; question-content Core Rule 3).** **GIVEN** a payload without `tts_text`, **WHEN** the listening round starts, **THEN** the spoken utterance text is `term` (asserted on the utterance, not the payload plumbing — deliberately agnostic to which side applies the default, Finding G4); **and GIVEN** a payload with `tts_text` ≠ `term`, **THEN** the override is spoken verbatim and `term` is never substituted; **and THEN** exactly one automatic playback occurs per round start.

- **SI6 [unit] — Voice parameters are data-driven; `en-US` preference with `en-*` fallthrough (Core Rule 5).** **GIVEN** the config, **WHEN** any utterance is constructed, **THEN** rate/pitch/volume are read from config (0.85 / 1.0 / 1.0) — static assertion that these literals appear nowhere in code; **and GIVEN** a voice list, **WHEN** selection runs, **THEN** `en-US` wins; with only `en-GB` present, `en-GB` is selected; a non-en voice is never selected while any `en` voice exists; with no `en` voice, L2 applies (SI2).

- **SI7 [unit] — Replay is unlimited, free, single-instance, restart-from-zero (Core Rule 3 + Edge replay-while-speaking).** **GIVEN** replay pressed any number of times in any round state (`Speaking` or `Awaiting`), **WHEN** each press lands, **THEN** playback restarts from the beginning of `tts_text`, at most one utterance is active at any instant (cancel-then-start; spy asserts zero overlaps), and no cost, counter or limit attaches (static: no such interface exists for a cost to bind to).

- **SI8 [unit] — Commit cuts playback; replays and in-flight audio shift elapsed by nothing (Core Rules 2–3 + battle BS7).** **GIVEN** a stubbed tick clock and a scripted replay between options-actionable and commit, **WHEN** the listening round resolves, **THEN** elapsed = commit − ticks-at(options-actionable) — replays shift it by nothing (no reset, no pause, no extension), and options are actionable from round start whether or not playback has finished; **and GIVEN** audio in flight at commit, **THEN** playback stops at the commit tick — a cut, never a fade (no fade parameter exists). *(Elapsed arithmetic is battle's, pinned by BS7; SI8 pins the speech-io side: no speech call can move it.)*

- **SI9 [unit] — Gesture-blocked autoplay → "tap to hear"; playback error → one silent retry, then L2 or fail-fast (Edges autoplay, TTS-error).** **GIVEN** an engine that defers speech until a user gesture, **WHEN** the round starts, **THEN** options are actionable with the timer reference unaffected and the replay control presents "tap to hear"; the first tap satisfies the gesture and plays — a replay, never a timer event; **and GIVEN** a TTS error mid-round after options are actionable, **WHEN** it occurs, **THEN** exactly one silent retry runs; on second failure the round degrades to L2 when `ipa` exists, else raises SI4's error; the timer runs throughout — no speech-io path pauses it.

- **SI10 [unit] — Tab hidden triggers no pause from speech-io (Edge tab-hidden + Core Rule 12).** **GIVEN** `visibilitychange` to hidden during a listening round, **WHEN** it fires, **THEN** speech-io performs no pause, no cancel and no timer action (static: no such interface exists); suspended audio recovers through SI9's replay path; the round clock is battle's, untouched (BS7 — no auto-pause, or tabbing away would freeze speedMult decay).

- **SI11 [unit] — Battle's mute never applies to speech (Core Rule 11).** **GIVEN** battle SFX/music muted, **WHEN** a listening round auto-plays, replays and the ult capture runs, **THEN** every utterance is still constructed and queued at the config volume (1.0) and no mute flag is read anywhere in the speech-io path (spy/static); OS/browser volume governs audibility — asserted at the parameter boundary, not acoustically (manual checklist M1/M2).

- **SI12 [unit] — Call/response discipline: speech-io emits no game events (Core Rules 1, 12).** **GIVEN** a full battle with listening rounds and an ult, **WHEN** every speech-io interaction runs, **THEN** it publishes zero events on the game event bus (spy) — selected mode, `quality` and errors arrive only as return values to battle; **and THEN** battle calls it exactly once per listening round and exactly once when the ult fires (call-count assertion, twin of BS19's discipline), and speech-io holds no battle state between calls (static: no round/mana/HP references).

### Ult interaction (Core Rules 6, 7)

- **SI13 [unit] — Free path switching until first submission; partial capture discarded with zero draws (Core Rule 6 + Edge mid-capture switch).** **GIVEN** the ult interaction in `MicListening` (capture beat running) or `Spelling`, **WHEN** the player switches paths any number of times before submitting, **THEN** switching is free and instant — state returns to `UltPrompting`, the partial capture is discarded with no score, and the scorer records zero draws (spy); no quality exists until a first submission lands.

- **SI14 [unit] — First submission locks; double-submit is idempotent; empty input never scores (Core Rule 6 + Edges double-submit, empty input).** **GIVEN** any first submission (mic or spell), **WHEN** it lands, **THEN** quality locks — `Scoring`/`Resolved` accept no further input; **and GIVEN** a double submission (double-tap, or submit racing resolution), **WHEN** the second arrives, **THEN** it is ignored idempotently: no second scorer call, no error, no state change, one recorded quality; **and GIVEN** an empty or whitespace-only spell input, **THEN** submit is disabled (predicate: non-whitespace present) and the scorer is unreachable — an empty attempt can never produce a quality.

- **SI15 [unit] — Ult prompt contract: meaning + first letter, never the word (Core Rule 6).** **GIVEN** the ult interaction pre-submission, **WHEN** the prompt payload is produced, **THEN** it contains the Vietnamese meaning and the target word's first letter and not the English word (contract-level as SI3; the spell field echoes only what the player types); `tts_text`-override words follow the same rule (Edge `tts_text` ≠ `term`).

- **SI16 [unit] — Mic denied or absent → spell-only, no re-prompt this battle; mid-interaction grant unlocks mic (Edges mic-denied, mic-granted-mid-interaction, no-API + Core Rule 7).** **GIVEN** permission denied OR no capture API (`getUserMedia`/equivalents absent), **WHEN** the ult interaction starts, **THEN** the mic path renders unavailable, the spell path is auto-focused and usable immediately — round start and its timer reference are blocked by no permission round-trip; **and THEN** no second permission request occurs for the rest of the battle (spy count ≤ 1), and permission state is re-read at the next battle's start, not the next round; **and GIVEN** a pending permission granted while the interaction is live pre-submission, **THEN** the mic path unlocks immediately (free switch per Core Rule 6); a grant landing after the score locks changes nothing this ult.

### Scoring (Core Rules 8–9; Formulas S1–S3, P1)

- **SI17 [unit] — S1 band boundaries under a stubbed RNG; one draw per submission; battle's streams untouched (Formula S1 + Core Rule 8).** **GIVEN** an injectable platform RNG (the BS21 pattern), **WHEN** mic submissions resolve with stubbed draws 0 / 0.049 / 0.05 / 0.949 / 0.95 / 0.9999, **THEN** recorded quality = 0.88 / 0.88 / 0.89 / 0.97 / 0.98 / 0.98 — closed band [0.88, 0.98] by half-up rounding at 2 decimals (raw ≥ 0.975 → 0.98; endpoints reachable only through rounding); **and THEN** exactly one draw occurs per submission, consuming zero positions of battle's ghost/crit streams (spy, twin of BS19/OA9). *(Stub values constructed to avoid binary-float traps — compare via the project's decimal rounding helper.)*

- **SI18 [statistical] — Sim transform distribution over a fixture-seeded draw list; mic-path fizzle unreachable (Formula S1 + Edge mic-fizzle).** **GIVEN** a fixture seed list driving the injected uniform RNG over N ≥ 1000 mic submissions, **WHEN** qualities record, **THEN** every value ∈ [0.88, 0.98] on 0.01 steps, both 0.88 and 0.98 occur, and per-bucket frequency sits within the pinned uniform band (α = 0.01, the BS23 pattern — deterministic via the fixture list; the platform crypto RNG is not under test); **and THEN** every mic quality exceeds the 0.6 threshold (floor 0.88 > 0.6): the fizzle is spell-miss-only content at MVP, unreachable on the mic path by construction.

- **SI19 [unit] — S2 normalization match table; exactly two outcomes (Formula S2).** **GIVEN** target `necessary`, **WHEN** attempts normalize (NFC → lowercase → trim → collapse internal whitespace) and compare, **THEN**: `"Necessary"` → 1.0; `"  necessary  "` → 1.0; `"NECESSARY"` → 1.0; `"nec  essary"` → 1.0; the NFD-decomposed form of `necessary` → 1.0; `"neccessary"` → 0.0; `"necessary-"` → 0.0 (punctuation significant); `"nécessary"` → 0.0 (NFC composes, never transliterates); **and THEN** quality ∈ {0.0, 1.0} exactly — no partial credit exists.

- **SI20 [unit] — P1 threshold is inclusive and presentation-only (P1 + Core Rule 9).** **GIVEN** scorer-stubbed qualities 0.6 / 0.5999 / 0.0 / 1.0, **WHEN** the presentation flag computes, **THEN** cast at exactly ≥ 0.6 (0.6 → cast; 0.5999 → fizzle); **and THEN** the flag travels to ui-shell independently of the value battle receives — B5's input is the raw recorded quality regardless of the flag (interface assertion; damage consequences are BS11's).

- **SI21 [unit] — S3: rounded-before-record; no floor, no clamp inside [0,1] (Formula S3 + Core Rule 9).** **GIVEN** scorer-stubbed raw values, **WHEN** recorded to the commit log, **THEN** the stored value is round-half-up to 2 decimals of the raw (0.9749 → 0.97) and battle consumes exactly the stored value; **and GIVEN** legal in-range values outside the sim band from the stub (0.0, 0.5, 1.0), **THEN** they pass through unmodified — speech-io applies no floor and no clamp within [0,1] (0 → 0 damage and the exact-spell 205 terminus stay reachable).

- **SI22 [unit] — Out-of-range scorer output fails fast naming the scorer (Edge out-of-range).** **GIVEN** a future-scorer stub returning 1.2 (and −0.1), **WHEN** a mic submission resolves, **THEN** the interaction fails fast with an error naming the scorer — nothing is clamped, floored, or delivered to battle; the MVP `SimulatedScorer` cannot produce this (SI17's closed band), so the AC is written against the interface and exercised with the stub.

- **SI23 [unit, provisional — blocked on OQ-SI1] — Expiry mid-interaction: cancel cleanly, return nothing (Edge expiry).** **GIVEN** battle signals round expiry while the interaction is mid-flight (`MicListening` capture running, or `Spelling` half-typed), **WHEN** the signal arrives, **THEN** speech-io cancels cleanly, returns no quality, emits nothing (Rule 12), and never extends or pauses the window (static). *(provisional: the GIVEN presumes a hard ult expiry distinct from the 11 000 ms rune threshold — OQ-SI1. Under the no-expiry reading the trigger is unreachable and the Edge reduces to battle teardown.)*

- **SI24 [unit, provisional — blocked on OQ-SI1] — The capture beat always completes past the 11 000 ms threshold (Edge beat-past-threshold).** **GIVEN** a capture beat still running when the stubbed clock passes 11 000 ms, **WHEN** it completes, **THEN** quality is returned and the commit lands — slowness never truncates the beat or downgrades the answer; the rune call is battle's, on the commit after quality (BS27 pins the 11 000/11 001 boundary). *(provisional with SI23: reachable only if no hard ult expiry preempts 11 000 ms — OQ-SI1.)*

### Cross-system integration

- **SI25 [integration, provisional replay leg — blocked with BS36 on OQ-BS1] — Recorded quality drives identical live and replay damage (Formula S3 + Core Rule 8 + battle Core Rule 18).** **GIVEN** a Wordsmith battle whose mic ult records quality 0.98 (stubbed raw 0.975), **WHEN** the ult resolves live, **THEN** damage = round_half_up(205.4 × 0.98) = 201 — the recorded value, not the raw (raw 0.975 would yield 200, so the assertion distinguishes recorded from raw by construction); **and WHEN** the battle replays from seed + commit log with the scorer never invoked (the sim is deliberately not reproducible), **THEN** ult damage is again exactly 201. *(Live leg assertable now against BS11's harness; the replay leg inherits BS36's blocker.)*

- **SI26 [screenshot, provisional — blocked on ui-shell GDD] — The UI contract renders as specified (UI Requirements; BS37/BS38 pattern).** **GIVEN** scripted capability and round states (L1 speaking, L2 fallback, "tap to hear", mic available/unavailable, capture-beat listening pulse, cast and fizzle outcomes), **WHEN** each renders, **THEN** the readout matches the UI contract table — replay control states incl. hidden in L2; IPA panel prominence with no term/tts_text; path picker with free-switch affordance; capture beat as an active-state visual with a `prefers-reduced-motion` variant; cast/fizzle styling distinct. Retained screenshots in `production/qa/evidence/`. *(Rendering is ui-shell's; the evidence pins that speech-io's emitted contract data produces the specified readout.)*

### Coverage and evidence mapping

- **Coverage**: all 12 Core Rules ≥ 1 AC (R1→SI12, R2→SI5/SI8, R3→SI7/SI8, R4→SI2/SI3/SI4, R5→SI6, R6→SI13/SI14/SI15, R7→SI16/SI24, R8→SI17/SI25, R9→SI20/SI21, R10→SI1, R11→SI11, R12→SI12); all 4 formulas ≥ 1 AC (S1→SI17/SI18, S2→SI19, S3→SI21/SI25, P1→SI20); all 19 Edge Cases mapped (SI16 covers the mic-denied and mic-granted-mid-interaction pair).
- **Evidence types**: SI1–SI25 map to Logic/Integration stories → automated unit/integration tests (BLOCKING at `qa.level` standard); SI26 maps to the UI story → retained screenshot + lead sign-off, BLOCKING (inherits to ui-shell stories rendering this contract).
- **Manual by design (playtest checklist, not ACs)**: (M1) speak-onset ≤ 300 ms feel on a warm engine, incl. mobile Safari's gesture path; (M2) voice intelligibility at rate 0.85 across shipped platform voices; (M3) capture beat reads as anticipation, not a progress bar; reduced-motion variant reads as active; (M4) replay feels instant — no spinner, no blame-the-tool; (M5) real mic flow: one prompt, denied → spell-only, no re-prompt within the battle; (M6) cut-at-commit reads as intentional; a fizzle reads as information followed immediately by the damage number. (Audio precedent: battle's 8-cue set has no automatable AC — manual checklist at first build.)

## Open Questions

| ID | Question | Owner | Target |
|---|---|---|---|
| OQ-SI1 | **Ult timer semantics (qa-lead G1, HIGH)**: does `ultimate_burst` have a hard expiry? Battle's countdown (Core Rule 6: round time 10.0/10.5/11.0 s by class) never exempts the ult, yet the 11 000 ms rune threshold exceeds every class's round time — under the countdown reading the > 11 s rune and speech-io's beat-completion rule are unreachable; under a commit-only reading battle's "timeout" never fires mid-ult. Battle-side pin needed: "no hard timeout — commit-only; 11 000 ms is a rune marker, not a deadline" (consistent with BS7's elapsed note) **or** a defined ult expiry. Blocks SI23/SI24 | battle-system author (technical-director rules pass) | next battle-system edit |
| OQ-SI2 | Battle-side propagation of OQ-BS5's resolution (qa-lead G2/G8): BS11's "provisional" tag can drop (its stated reason was the undesigned quality contract — now authored here); the OQ-BS5 row can close; optionally broaden BS34's GIVEN to also cover `tts_text`-present/no-`ipa`/no-engine (SI4's second fail-fast) | producer → next battle-system edit | next battle-system edit |
| OQ-SI3 | Real pronunciation-scoring engine selection (post-MVP): candidate engines, on-device vs cloud latency, per-cast cost; its arrival re-opens the quality floor lever (Core Rule 9) and makes `quality_success_threshold` tunable | project owner | post-MVP, before ranked play |
| OQ-SI4 | TTS accessibility settings (volume/repeat/slower rate) beyond the no-mute rule — belongs with ui-shell's accessibility options screen | ui-shell author | ui-shell GDD |
