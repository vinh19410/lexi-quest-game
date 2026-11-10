# UI Shell

> **Status**: Complete — pending design review
> **Author**: user + design-system agents (ux-designer, ui-programmer, game-designer, art-director, systems-designer, qa-lead)
> **Last Updated**: 2026-11-09
> **Last Verified**: 2026-11-09
> **Implements Pillar**: Pillars 1–4 (rendering surface for all; primary owners: 1 — Speed Is Damage made legible, 4 — Honest Ghosts disclosure)

## Summary

ui-shell is the Presentation-layer system that owns every screen, the
navigation between them, and all feedback VFX — while owning **no game rule,
no game value and no trigger**: it renders upstream state (battle, forge,
tower, meta-progression, ranked-league, accounts-backend, with contributing
contracts from equipment, speech-io, hero-class, opponent-ai) through ten
explicit cross-system contract tables, formats every displayed number with
five display formulas (F-UI1–F-UI5), and keeps eight global disciplines:
rendering-only ownership, a screen inventory scoped by feature tier,
hub-and-spoke navigation with battle exiting only via its result modal,
accounts-backend commit-state rendering, offline honesty, Pillar-4 ghost
disclosure, an accessibility baseline (44 px, reduced-motion static
equivalents, no color-only information), and Vietnamese-first
extraction-keyed copy with vi-VN number formatting from launch. Visual polish
(hit shake, floating numbers, combo pops, the compressed purification beat)
is specified as budgeted, config-keyed, first-class work — the prototype
proved it is load-bearing. 30 acceptance criteria (19 unit / 2 integration /
8 screenshot / 1 manual / 0 statistical) cover all 12 core rules, 5 formulas
and 18 edge cases, and discharge the upstream screenshot gates (SI26,
MP-AC27–29, EQ27/EQ28, RKL21–25).

> **Quick reference** — Layer: `Presentation` · Priority: `MVP` · Key deps: battle-system, forge-srs, tower, meta-progression, ranked-league, accounts-backend (contributing contracts: equipment, speech-io, hero-class, opponent-ai)

## Overview

UI Shell is the presentation system that owns every screen the player sees and
every transition between them: the Auth screens, the Home hub, the battle HUD
and its feedback VFX, the forge and tower and inventory surfaces, the league
screens, and the persistent state banners (offline, unsaved, session-expired)
that accounts-backend's commit rules require. It owns **rendering and
navigation only** — every value it displays is data owned by an upstream
system (battle emits the fight, meta counts the rewards, ranked computes the
ladder, accounts decides what may commit), and each upstream GDD's UI
Requirements table is a contract this GDD keeps rather than re-decides. Its
player impact is the game's first impression: the RPG frame — damage numbers,
shields, combo pops, hit shake — is what makes recall speed legible (Pillar
1), and the honest-ghost disclosures it renders are what keep the product
truthful (Pillar 4). The prototype validated that this polish is load-bearing,
not garnish; ui-shell is where that polish becomes specified, budgeted,
screenshot-evidenced work.

## Detailed Design

### Core Rules

1. **Rendering-only ownership.** ui-shell owns screens, navigation, transitions,
   HUD composition and feedback VFX. It never owns game data, rules, or game
   math: every displayed number, label and state is read from an upstream
   system and formatted, never recomputed. Derived displays implement the
   *rendering* of formulas owned elsewhere (XP bar → meta's MP1; tier/division
   → ranked's RL1; speed multiplier → battle's B2) — ui-shell's Formulas
   section holds only display-side math (formatting, progress fractions,
   layout constants).
2. **Screen inventory, scoped by feature tier.**
   - **MVP**: Auth (login · register · password-reset-request ·
     password-reset-set), **Class pick (onboarding, post-auth — rendered from
     hero-class records; account stays `ClassUnpicked` until a class is
     chosen)**, Home hub, Battle (HUD + question interaction panels +
     result modal), Forge (queue · session view · resolution modal), Tower
     (floor map · preview · result-progression surfaces), Inventory/gear
     (4 slot cards · apply confirmation · hint surfaces live in battle), global
     overlays (offline · unsaved · session-expired).
   - **Vertical Slice adds**: Home quest board (4 daily quests, claim flow),
     currency strip (gold with vi-VN separators from launch), streak strip.
   - **Alpha adds**: ranked entry (queue button + tier badge + RP), League
     screens (PvP tab · Study tab · season summary · tier track · forfeit
     notice wording).
   A screen absent from this list is not ui-shell scope; a surface named in an
   upstream GDD's UI Requirements and missing here is a gap in this GDD, not
   in the upstream.
3. **Navigation model: hub-and-spoke.** Home is the hub; battle, forge, tower,
   inventory and league are spokes entered from Home (battle also enters from
   the tower floor map — tower Core Rule 3 composes the config there). Battle
   exits only through its result modal (→ forge or → Home); mid-battle back
   navigation is a forfeit/discard, never a pause (ranked Rule 11 + ADR-0003 §4
   semantics: ranked = forfeit loss after grace, friendly/tower = discard). Unauthenticated
   deep links land on Auth — there is no guest entry point anywhere in
   navigation, including onboarding (accounts-backend AC-A1).
4. **Commit-state rendering.** Every commit-requiring action renders the
   accounts-backend commit machine: Idle → Committing (action locked, spinner)
   → Retrying (client-side `retry_delay` ladder runs; subtle in-place
   indicator) → Unsaved (persistent "Lưu không thành công — Thử lại" banner
   with manual retry restarting the ladder at n=0) → back to Idle on success.
   Navigation away is blocked while Committing/Retrying (edge case E2).
5. **Offline discipline.** While offline: a persistent offline indicator shows;
   commit-requiring actions are visually blocked (accounts-backend AC-C5); the
   forge queue shows its offline gate; a battle may continue client-side but
   its result commit enters the retry ladder on reconnect. The shell never
   fabricates a successful commit.
6. **Honest-ghost disclosure (Pillar 4).** The shell never renders presence it
   does not have: no fabricated online counts, no real-player framing. The
   ranked match banner and every League screen carry the persistent ghost-duel
   disclosure label (ranked-league UI Requirements), fed by opponent-ai
   GhostProfile fields; simulated peers stay labeled ("Nhóm #14" pattern).
7. **Accessibility baseline.** Minimum 44 px hit areas; every
   audio-communicated state has a static equivalent (the IPA panel is itself
   the deaf/hard-of-hearing equivalent of L1 listening); `prefers-reduced-motion`
   swaps pulse/shake/floating-number animations for static state changes
   (color/position/label); no information by color alone — rarity renders as
   color + border weight + label (equipment), quest states as state chips
   (Active/Claimable/Claimed), tower progress as text+bar, unlock conditions
   as text (tower).
8. **Language and number formatting from day one.** All UI copy is
   Vietnamese-first with English placeholder strings at MVP, written against
   stable extraction keys (localization is downstream, Alpha); gold and RP
   values use vi-VN thousand separators (24.500) from launch — meta
   carry-in; tier names render English alongside Vietnamese per the prototype
   ("Gold League").
9. **Data-driven presentation config.** All animation durations, VFX timings,
   breakpoints and layout constants live in a presentation config data file,
   never hardcoded in components (coding standard: data-driven values). The
   config ships with this GDD's Visual/Audio and Formulas sections as its
   initial values.
10. **Evidence discipline.** Every UI story closes with a retained screenshot
    in `production/qa/evidence/` per the coding standards' UI gate; the
    speech-io SI26 and meta MP-AC27–29 screenshot gates are honored by this
    shell's evidence set.
11. **Speech-interaction rendering.** The battle screen renders the speech-io
    UI contract elements — replay control (enabled / "tap to hear" /
    hidden-in-L2), IPA fallback panel, ult mic/spell path picker, mic capture
    pulse, spell input with its normalization-accurate hint copy, cast/fizzle
    flag — exactly per that contract's state tables. The shell adds no
    scoring, gating or audio behavior of its own.
12. **Hint-surface rendering.** Battle renders the equipment hint surfaces
    (etymology panel, example-sentence reveal on miss, option-elimination
    flash, tap-to-hear affordance, first-letter pre-fill) driven by
    LoadoutSnapshot passive flags via the Class-B hook handoff (OQ-EQ1).
    Hint panels are toggle-revealable with screen-reader-readable text; they
    never gate information behind animation or color alone.

### States and Transitions

App-level states (battle's internal round machine, forge's session machine and
tower's encounter machine are upstream-owned; the shell hosts them):

| State | Entered from | Exits to | Notes |
|---|---|---|---|
| `Booting` | app start | `Authenticating`, `Ready` | fetch session + content version (accounts-backend); no game surfaces render before this resolves |
| `Authenticating` | `Booting`, `SessionExpired`, any screen via logout | `Ready`, `PickingClass`, `Authenticating` (inline errors) | inline validation mirrors server rules; generic registration-failure message (no email-exists hint, AC-A5) |
| `PickingClass` | `Authenticating` (account with no class — hero-class `ClassUnpicked`) | `Ready` | onboarding class pick rendered from hero-class records; skipped for accounts that already picked (straight to `Ready`) |
| `Ready` (Home) | `Authenticating`, any spoke via back | all spokes | hub; renders quest board (VS+), currency/streak strips (VS+), ranked entry (Alpha+) |
| `InBattle` | Home battle entry, tower floor map, ranked queue (Alpha) | `Ready` via result modal | hosts battle's round machine; speech + hint surfaces render inside |
| `InForge` | Home forge entry, result modal "to forge" | `Ready` | queue → session view → resolution modal → back to queue |
| `InTower` | Home tower entry | `Ready` via result-progression | floor map (is the stage select) → preview → battle → progression surfaces |
| `InInventory` | Home inventory entry | `Ready` | slot cards, item detail, apply flow |
| `InLeague` (Alpha) | Home ranked entry | `Ready` | PvP/Study tabs, season summary replaces queue button during `Settling` |
| `SessionExpired` (overlay) | any state, on auth failure | previous context | "Session hết hạn" re-login prompt; return-to-context — the pending commit survives re-login (AC-S4) |
| `Unsaved` (overlay) | commit ladder exhaustion, any state | cleared on successful retry | persistent banner; **every commit-requiring action is disabled** until the manual retry succeeds (E1) — the banner informs, the disabling protects |

Global rules: overlays (`SessionExpired`, `Unsaved`, offline indicator) are
orthogonal to spoke states and never replace them; refresh/deep-link mid-flow
returns to `Ready` unless server state reconstructs the context (edge case
E12).

### Interactions with Other Systems

| System | Direction | What flows | Surface(s) | Contract source |
|---|---|---|---|---|
| battle-system | upstream | HP/shield/mana (gate marker at 90), live speedMult, combos, round log, reveal theater, BattleResult (victory/defeat, rewards, cursed-rune word list, max combo, seed) | fighter cards, mana bar, speed readout, combo badge, log, result modal | battle UI Requirements table |
| forge-srs | upstream | rune queue (word, direction, box badge, due countdown, drop count), card payloads, session outcome | queue screen, session view, resolution modal | forge UI Requirements table |
| tower | upstream | floor/stage unlock states (F1), progress (F2), preview list (F3), absent-module rule (E2), content-error (E5) | floor map (= stage select), preview screen, progression deltas | tower UI Requirements §1–4 |
| meta-progression | upstream | quest board rows + states, gold, `cumulative_xp`, streak count + state | quest board, currency strip, streak strip, result-modal reward rows | meta UI Requirements table |
| ranked-league | upstream | tier/division (RL1), RP value + delta, peer board rows + zone positions, season state, study-board payload, forfeit semantics | ranked entry, match banner, League PvP/Study tabs, season summary, tier track, forfeit notice | ranked UI Requirements table |
| accounts-backend | upstream | session state, commit machine states, offline rules, auth validation rules | Auth screens, overlays, all commit-requiring buttons | accounts-backend UI Requirements §1–6 |
| equipment | upstream | `equipped`/`item_levels`/`stones`, catalog data, F1 effective stats, passive active-flags | inventory/gear screen, apply confirmation, battle hint surfaces, HUD stat line | equipment UI Requirements table |
| speech-io | upstream | replay/fallback states, IPA data, ult path states, capture-beat phase, quality flag | replay control, IPA panel, ult path picker, mic pulse, spell input, cast/fizzle flag | speech-io UI contract table |
| hero-class | upstream | class identities, base stat blocks, passive lines | class pick screen (pre-battle), battle HUD passive line | hero-class registry note; UX flag |
| opponent-ai | upstream | GhostProfile `class_ref` + profile fields | ghost fighter card identity, ranked banner disclosure material | opponent-ai UX flag |
| question-content | indirect | question payloads reach the shell only through battle/forge/tower — no direct dependency | question interaction panels | none (rendered via upstream contracts) |
| localization | downstream | extraction keys for every vi-VN UI string | all surfaces | this GDD's Core Rule 8; localization row (systems index #13) |

## Formulas

> **Ownership note for this section** (systems-designer consultation,
> 2026-11-09). Every formula below is *display math*: it formats or scales a
> value owned by an upstream system. It never decides game state. Where a
> display formula and its upstream formula could disagree, the upstream
> formula wins and this is a bug in the shell. The project's global rounding
> convention (round-half-up, per battle-system) applies to every quantization
> step below.

### F-UI1 — `xp_bar_progress`

Renders the Home-hub and result-modal hero level + XP bar from meta's
`cumulative_xp` ledger (MP1). Honors meta's registry note: "Consumed by
ui-shell (level + XP bar: cumulative_xp mod 1000)".

```
level         = floor(cumulative_xp / xp_per_level) + 1
xp_into_level = cumulative_xp mod xp_per_level
progress      = xp_into_level / xp_per_level
```

| Variable | Type | Range | Source | Description |
|---|---|---|---|---|
| `cumulative_xp` | int | 0 – unbounded (int32 safe) | calculated (read from meta ledger) | Hero's lifetime XP; meta owns the ledger |
| `xp_per_level` | int | 1000 (flat, MVP-final) | data file (registry `xp_per_level`, owned by meta-progression MP1) | XP per hero level — referenced, **never** redefined here |
| `level` | int | ≥ 1 (unbounded above) | calculated | Displayed hero level; **level-1 base** per meta Core Rule 4 |
| `xp_into_level` | int | 0 – 999 | calculated | XP held within the current level |
| `progress` | float | 0.0 – 0.999 | calculated | XP bar fill fraction (bar width; a full bar renders as the next level at 0%) |

**Output Range:** `level` ≥ 1, unbounded above (mirrors `cumulative_xp`);
`progress` ∈ [0.0, 0.999) — the bar never draws itself full; reaching 100%
renders as the next level at 0%. No unusable range: `xp_per_level` ≥ 1 here
so division by zero cannot occur; if the registry ever changed
`xp_per_level` to 0 that is a registry bug, not something display clamps.
Pure in `cumulative_xp` — a large grant skipping boundaries renders
correctly with no intermediate-level bookkeeping (meta E11 kept upstream;
the division/remainder reproduces it for free).

**Example:** `cumulative_xp = 3450` → `level = floor(3.45) + 1 = 4`,
`xp_into_level = 450`, `progress = 0.45` (bar 45%, label "Level 4"). Fresh
account: `0` → `level 1`, `progress 0.0`. MP-AC3's jump:
`600 → +1500 → 2100` → level 3, bar 10%, no XP lost.

### F-UI2 — `vi_vn_number_group`

Vietnamese thousand-grouping format for all integer currency displays (gold
on the currency strip, RP on ranked surfaces, rewards in the result modal)
— Core Rule 8, meta carry-in from launch.

```
formatted(n) = digits_of(n) grouped in blocks of 3 from the right,
               joined with '.', applied only when n ≥ 1000
```

| Variable | Type | Range | Source | Description |
|---|---|---|---|---|
| `n` | int | 0 – unbounded (upstream integers; gold and RP never carry decimals) | calculated (read from meta / ranked) | The integer being displayed |
| `formatted` | string | — | calculated | The vi-VN grouped display string |

**Output Range:** string; length grows logarithmically in `n`. `n` cannot be
negative (RP floors at 0 by RL2; negative gold events are rejected by
MP-AC6), but if an upstream bug supplies a negative, the string renders the
minus sign on the leftmost group — a wrong value displays as wrong rather
than being masked, consistent with Pillar 4.

**Example:** `24500 → "24.500"`; `999 → "999"`; `1000 → "1.000"`;
`1234567 → "1.234.567"`; `0 → "0"`.

### F-UI3 — `due_countdown_format`

The forge queue ("weakness list") due-countdown pill and the all-resting
gate copy. Eligibility *computation* belongs to forge (`forge_rune_ladder`:
eligible iff `due_at <= t` on the server clock); the shell re-renders the
supplied state only.

```
remaining_s = (due_at − server_now) / 1000        // server-clock authoritative read

if remaining_s ≤ 0            → "ready"
else if remaining_s < 60      → "resting · <1 m"
else if remaining_s < 3600    → "resting · {N} m",  N = round_half_up(remaining_s / 60)
else                          → "resting · {N} h",  N = round_half_up(remaining_s / 3600)
```

| Variable | Type | Range | Source | Description |
|---|---|---|---|---|
| `due_at` | int (ms) | any timestamp | calculated (read from forge rune state) | The rune's eligibility moment — owned by `forge_rune_ladder` |
| `server_now` | int (ms) | any timestamp | calculated (accounts-backend server-clock sync) | The server clock, not the device clock — the same authority that decides eligibility |
| `remaining_s` | float | ≤ +72·3600 at current defaults | calculated | Seconds until due |
| `N` | int | 1 – 72 at current defaults | calculated | Displayed minutes/hours count |
| rendered | string | — | calculated | Countdown pill copy ("ready" / "resting · 42 m" / "resting · 3 h") |

**Output Range:** with the registered box delays (10 min / 24 h / 72 h),
`N` ≤ 72 — no days unit needed; a `forge_master_delay` change anywhere in
its 24–120 h safe band stays inside the hours display. No unusable
`remaining_s < 0` range: that is exactly the "ready" state (handled by the
branch, not by clamping — a negative value and 0 render identically). Three
boundary conditions are load-bearing: (1) the "ready" branch is the **same
predicate** forge uses to mark a rune eligible (`remaining_s ≤ 0` ≡
`due_at <= server_now` on the same clock), so the display can never
contradict the box badge or the queue's gate state; (2) the shell **never**
gates Start Session from this string — eligibility is forge's state; if
eligible state and the string disagree on one render tick, state wins;
(3) "resting · 0 m" can never render: values < 60 s fall to the "<1 m"
branch, and round-half-up of ≥ 60 s gives `N` ≥ 1.

**Example:** a Box 1 rune dropped 4 minutes ago (`remaining_s = 360`) →
`N = round_half_up(6) = 6` → "resting · 6 m". A Box 2 rune,
`remaining_s = 10 800` → `N = 3` → "resting · 3 h" (matching forge's gate
copy). `remaining_s = 30` → "resting · <1 m"; `remaining_s = −5` → "ready".

### F-UI4 — `quest_progress_fraction`

The Home quest board's per-quest progress bar / percentage label. Owned by
meta MP3, which clamps progress at goal (MP-AC7), so the clamp below is
defensive against transient display, not ownership.

```
fraction = min(progress, goal) / goal
```

| Variable | Type | Range | Source | Description |
|---|---|---|---|---|
| `progress` | int | 0 – goal (meta-clamped; defensive clamp here is read-only) | calculated (read from meta quest row) | Today's counted events for the quest |
| `goal` | int | ≥ 1 (all four MVP goals are 2 / 5 / 1 / combo threshold ≥ 1) | data file (owned by meta: `quest_goal_win2`, `quest_goal_forge5`, `quest_goal_tower_win`, `combo3_threshold`) | The quest's target count |
| `fraction` | float | 0.0 – 1.0 | calculated | Bar width and percentage base |

**Output Range:** clamped [0.0, 1.0]. Minimum 0.0 (zero events — MP-AC11
renders 0, never fabricated progress for an empty forge queue). Maximum 1.0,
reached exactly when `progress ≥ goal` (Claimable, which meta already
declared; an over-delivering event cannot push the bar past 100%).
**Division by zero if goal = 0:** impossible in the MVP quest set (every
goal ≥ 1), but clamp in display code (`goal ≤ 0 → fraction = 0`) rather
than letting a NaN reach the DOM. Rendered as
`round_half_up(fraction × 100)`% or bar width; both read the single
`fraction`.

**Example:** "Thắng 2 trận" progress 1/2 → `fraction = 0.5` → bar 50%,
"50%". Progress 2 (or a transient 5 from a mis-rendered event stream) →
`min(·, 2)/2 = 1.0` → 100%.

### F-UI5 — `speed_mult_display`

The battle HUD's live speed readout during the countdown (Pillar 1 made
legible). The value is **battle's B2 math**
(`speedMult = 1 + 0.3 × remaining_fraction`, registry range [1.0, 1.3]); the
shell quantizes it read-only at each render tick.

```
displayed = round_half_up(speedMult × 100) / 100
```

| Variable | Type | Range | Source | Description |
|---|---|---|---|---|
| `speedMult` | float | 1.0 – 1.3 (clamped by B2) | calculated (read live from battle state) | The live attack-round speed multiplier — owned by `battle_speed_multiplier` (B2) |
| `displayed` | float | 1.00 – 1.30 (101 quantization levels) | calculated | The rendered value, exactly 2 decimal places |

**Output Range:** structurally clamped to [1.00, 1.30] because inputs are
B2-clamped; 2-decimal quantization never escapes that (round-half-up of
1.30 is 1.30). No unusable input range — B2 floors `remaining_fraction` at
0, so speedMult never drops below 1.0; with no active round countdown the readout
shows the neutral "×1.00" (inside an active round at full time remaining,
battle emits 1.30 per B2). The shell **never** recomputes
speedMult from elapsed time — it formats whatever battle's tick emits. If
battle's interface supplies a value already rounded to 2 decimals, the shell
passes it through unchanged; the quantization here is defensive to keep a
possible dual display source from diverging.

**Example:** 75% of round time remaining → B2 gives 1.225 →
`round_half_up(122.5)/100 = 1.23` → "×1.23". Timer fully elapsed → 1.0 →
"×1.00".

### Considered and excluded (passthroughs, no formula)

- **Combo badge** — battle emits the combo count integer; the badge is the
  mapping "COMBO ×{n}". Documented in UI Requirements.
- **RP delta** — the value is battle's Rule 21 emission (+28 / −14), applied
  by ranked's RL2. The shell adds an explicit sign prefix ("+28", "−14") and
  the damage-number legibility treatment. Sign formatting, not math.
  Documented in UI Requirements.
- **Tower progress** — tower F2 (`floor_progress = cleared_count / 4`) is
  exact, display-only, and owned by tower (TW12/TW13). The shell renders its
  fraction directly as bar width plus a text readout (text+bar accessibility
  rule, Core Rule 7). No re-derivation in the shell.
- **Presentation config constants** (animation durations, breakpoints,
  layout sizes) — data values, not formulas; they live in the Core Rule 9
  presentation config, initialized by Visual/Audio Requirements per that
  section's own rule.

## Edge Cases

- **E1 — If a commit ladder reaches Unsaved while the player is on a spoke
  screen**: the Unsaved banner overlays the current screen; the player may keep
  reading any surface but every commit-requiring action is disabled until a
  manual retry (ladder restarts at n=0) succeeds. Rationale: hiding the banner
  behind navigation would let the player believe progress persisted.
- **E2 — If the player navigates away while a commit is Committing/Retrying**:
  navigation is blocked for the duration of the in-flight ladder (the affected
  button and the back affordance render their disabled states). Rationale:
  navigating mid-commit can orphan a pending mutation (accounts-backend
  whole-commit rejection); blocking for at most D_max=30 s is cheaper than
  reconciling a lost result.
- **E3 — If the session expires mid-battle**: the SessionExpired overlay
  appears over the battle; after re-login the player returns to the exact
  context (AC-S4 return-to-context) — the battle's pending result commit
  survives. If the battle itself was server-invalidated meanwhile, the shell
  renders the result modal with an explicit "không thể lưu" state routed into
  the retry ladder, never a silent discard.
- **E4 — If offline is detected mid-battle**: the battle continues (round
  logic is client-side); the offline indicator appears and the eventual result
  commit enters the retry ladder on reconnect. Forge is hard-gated offline
  (forge queue's offline state); quest claim buttons render blocked (AC-C5).
- **E5 — If `cumulative_xp` lands exactly on a multiple of 1000**: the
  completion flash renders the bar full for one beat (a transient, not
  computed state), then the settled state is the next level at 0% — the bar
  never settles at "0% with no explanation". Worked rule in F-UI1.
- **E6 — If gold or RP exceeds 999.999**: formatting is purely positional —
  the separator rule extends without special-casing; no abbreviation
  (1,2 M-style compaction) at MVP because the faucet ceiling (~4.000 g/h
  replay, OQ-MP1) keeps realistic values readable.
- **E7 — If a forge rune's due time passes while the player is viewing the
  queue**: the countdown re-renders to "ready" on the next state read; the
  client never flips box/due state itself (server clock authority —
  forge_rune_ladder). A stale "resting" label is corrected by re-read, not by
  local arithmetic.
- **E8 — If the day rolls over while the quest board is visible**: the board
  re-renders on the next data read with the new day's quests at progress 0;
  expired claimable rewards disappear silently (meta's reset boundary — no
  notification surface at MVP). No ghost claim buttons.
- **E9 — If the ranked queue button is tapped during `Settling`**: it is
  disabled and the season summary replaces it (ranked UI Requirements); the
  button never renders enabled while Settling regardless of stale client
  state.
- **E10 — If mic permission is denied mid-ult**: the ult path picker renders
  mic-unavailable and spell remains available (free switch until first
  submission); a permission grant after submission lock does not retro-open
  the mic path — the picker reflects the locked state (speech-io's
  mic-permission ruling; its coverage note cites SI16 — cite that section
  directly once speech-io's next edit lands).
- **E11 — If the replay control is in its "tap to hear" state**: playback is
  gesture-blocked; the control renders its blocked state until the browser
  gesture requirement is satisfied — it never renders enabled while playback
  would fail.
- **E12 — If the player refreshes or deep-links mid-flow**: unauthenticated →
  Auth screen; authenticated → `Ready` (Home). Only server-reconstructable
  context survives a refresh; battle round state, preview scroll positions
  and half-completed forge sessions do not persist client-side.
- **E13 — If a LoadoutSnapshot passive flag references an unknown passive**:
  the hint surface for it renders nothing (fail-soft, battle's EC carried
  through) and the HUD stat line still renders the five stats — an unknown
  passive never breaks the screen.
- **E14 — If an apply-confirmation is opened with a maxed item, zero stones,
  or offline**: the confirm button renders its disabled state *before* the
  player commits to the tap ("cấp tối đa" / "cần Đá Tu Luyện" / read-only
  banner), with the reason visible (equipment Game Feel rule).
- **E15 — If `prefers-reduced-motion` is set**: every pulse, shake and
  floating-number animation swaps to its static variant (color/position/label
  change, no motion); the capture-beat uses the non-motion active indicator
  (speech-io accessibility floor). Information never depends on the motion
  itself.
- **E16 — If a League board row's peer data is unavailable** (hash-seeded
  drift read fails): the board renders the player's row plus a loading state
  for peers — never fabricated peer values, never a placeholder roster that
  could read as real players (Pillar 4).
- **E17 — If the streak strip is in the broken state**: it renders the broken
  state distinctly (label + state chip, not color alone) and the count reads
  0 without implying yesterday's streak is recoverable.
- **E18 — If two upstream states disagree on the same value** (e.g. result
  modal rewards vs currency strip gold): the shell renders each surface from
  its own upstream read and never invents a reconciliation — the conflict is
  an upstream bug surfaced by the mismatch, logged in QA evidence, not
  papered over client-side.

## Dependencies

**Upstream — hard (the shell cannot function without them):**

| Dependency | Nature | Interface |
|---|---|---|
| battle-system | All battle surfaces render battle-owned state; the HUD is composition, not logic | BattleResult, per-element emission table (battle UI Requirements), gate marker 90, reveal scheduling |
| forge-srs | Queue/session/resolution screens render forge state | rune queue shape, card payloads, resolution outcomes, offline gate |
| tower | Floor map, preview, progression surfaces render tower state | F1 unlock states, F2 progress, F3 preview list, encounter config entry points |
| meta-progression | Quest board, currency strip, streak strip render meta state | quest rows + states, gold, `cumulative_xp` (F1 rendering), streak state |
| ranked-league (Alpha scope) | Ranked entry, league screens, tier track render ranked state | (tier, division) via RL1, RP + delta, peer board rows, season state, disclosure copy |
| accounts-backend | Auth screens, commit machine rendering, offline rules — the shell's global overlays are this contract | commit states (Idle/Committing/Retrying/Unsaved), `retry_delay` ladder, session-expiry rules, no-guest rule |

**Upstream — contributing contracts (not in the index deps row but
contract-bearing; their UI Requirements tables assign ui-shell screens):**

| Dependency | Nature | Interface |
|---|---|---|
| equipment | Inventory/apply/hint surfaces are equipment-defined, shell-rendered | `equipped`/`item_levels`/`stones`, catalog, F1 stats, passive flags, apply preconditions |
| speech-io | Battle-screen speech UI contract is speech-io-defined, shell-rendered | replay control states, IPA panel, ult path picker, capture pulse, spell input, cast/fizzle flag |
| hero-class | Class pick screen + HUD passive line | class identities, base stat blocks, passive text |
| opponent-ai | Ghost identity rendering + ranked banner disclosure material | GhostProfile `class_ref` and profile fields (via battle) |

**Downstream dependents:**

| Dependent | What it expects from ui-shell |
|---|---|
| localization | All vi-VN UI copy behind stable extraction keys with English placeholders at MVP (Core Rule 8); vi-VN number formatting already in place (Core Rule 8 + F-UI2) |

**Non-dependencies:** question-content (payloads reach the shell only through
battle/forge/tower — no direct schema dependency); analytics (Alpha+, sinks
accounts-backend events, not shell surfaces); real-pvp (deferred — the shell's
honest-ghost rules are what real PvP would *replace*, so this GDD notes the
boundary but designs nothing for it).

**Bidirectionality check:** every hard dependency above names ui-shell in its
own GDD — battle (UI Requirements preamble), forge (registry future-`referenced_by`
candidates, resolved by this GDD), tower (Cross-References row), meta (UI
Requirements preamble), ranked (UI Requirements owner column), accounts
(UI Requirements + Cross-References "not yet authored" row, now authored);
equipment and speech-io both name ui-shell explicitly. hero-class's registry
note names ui-shell for the pick screen. No one-directional dependency found.

## Visual/Audio Requirements

> **Source**: art-director consultation, 2026-11-09. Ownership split mirrors
> battle-system §Visual/Audio: upstream systems own state and emit typed
> events; ui-shell owns all rendering, motion, and style. Battle's per-event
> table (battle-system §Visual/Audio) is **inherited, not restated** — this
> section governs everything the shell adds around it.

**Rendering contract.** Every duration below is a presentation budget in ms,
never wall-clock gating: no animation blocks navigation, commit, or
battle-state advancement, and every effect is skippable (Web Animations API
`playbackRate` or hard-skip) without desync. Where the prototype
(`raw-data/lexi-quest-design`) and an upstream budget disagree, the upstream
budget wins (example: prototype `rise` keyframe = 1300 ms; battle budgets
floating numbers 700–900 ms — the config ships 800 ms).

### 1. Visual feedback inventory

All values live in a presentation config file (`vfx.<event>.<variant>` keys,
initial values below); no component hardcodes a duration, easing, or hex.
Prototype keyframes (`pop`, `shake`, `rise`, `fadeUp`, `slash`, `spark`,
`pulseRing`, `wave`) are the motion vocabulary; the config tunes them.

**Inherited from battle-system (shell implements, budget as specified
there):** correct/wrong confirm, floating damage numbers (normal/crit/pierce/
ult), hit shake, shield gain/absorption, mana gain, ult-ready flare +
persistent pulse, combo pop, live speed-multiplier readout decay
(1.30×→1.00×), ghost reveal gesture + card flip, KO drain, victory/defeat
result rows, cursed-rune drop cue. Intensity hierarchy and the
one-loud-beat-per-resolve rule carry over verbatim.

**Shell-owned events:**

| Event class | Treatment | Budget (ms) | Priority |
|---|---|---|---|
| Forge stone-granted | Stone icon scale-pop + emerald flash on grant surface | 600–900 | Must (MVP) |
| Forge per-card result flash | Card pop (`pop`) + flash border in result hue; staggered rows | 300–450 each, 100–150 stagger | Must (MVP) |
| Purification payoff (resolution modal) | Compressed purification beat: modal entry fade-up → rune-to-card transformation (slash/spark vocabulary) → stat line | 800–1200 total | Must (MVP) |
| Equipment stat-delta preview | Delta rows fade-up beside confirm dialog; green/red arrows never color-only (+/− glyphs) | 250–400 per row, ambient | Must (MVP) |
| Level pips fill | Sequential pip fill (staggered); on level-up the new pip scale-pops | 150–250 per pip; pop 400–600 | Must (MVP); pop flourish Nice |
| Level-up (item gains a level from forge resolution) | Gold flare on the item card + level badge pop | 600–900 | Must (MVP) |
| Quest claim (VS+) | Reward count-up on currency strip + row chip Active/Claimable→Claimed transition | 500–800 | Must (VS); count-up flourish Nice |
| Unlock (tower floor/stage) | Lock→open icon transition + surface un-dim | 500–700 | Must (MVP) |
| Tier badge / tier track (Alpha) | Badge pop on change; track strip segment fill; no shine sweeps at MVP | 400–600 | Must (Alpha); shine sweep Nice (post-MVP) |
| Screen/spoke navigation | Hub→spoke fade-up on enter; back returns without re-animation of already-seen content | 200–300 | Must (MVP) |
| Commit ladder | Idle→Committing: button-locked spinner (radar vocabulary). Retrying: subtle in-place pulse, ≤ 2 s loop, never a modal | continuous / 2000 loop | Must (MVP) |
| Global banners (offline / unsaved / session-expired) | Slide-down + fade entrance; persists while active; exit 150–250 | 250–400 entrance | Must (MVP) |
| Capture-beat pulse (speech-io) | Mic ring wave (`pulseRing`/`wave`) phased per `sim_listening_beat_ms` = 1200 — render exactly per speech-io contract | per contract | Must (MVP) |
| Cast / fizzle flag (speech-io) | Cast: emerald confirm flash on spell line; fizzle: coral soft shake-lite (never full hit shake — the player is not taking damage) | 300–500 | Must (MVP) |
| Crit/ult spark particles | Radial `spark` burst beyond base number | 400–600 | Nice (post-MVP) |
| Combo pitch-ladder visual (escalating badge size/border-weight per 5 combo) | Escalation via scale + border weight only | n/a | Nice (post-MVP) |

**Concurrency caps (global):** ≤ 10 concurrently animating elements per
beat; ≤ 5 floating numbers; shake targets a dedicated wrapper, never the
question panel and never a commit/banner surface.

### 2. Reduced-motion and accessibility variants

`prefers-reduced-motion` (and the equivalent manual toggle in settings,
post-MVP) swaps motion for static state changes — the **information is never
removed, only its motion**:

| Motion effect | Static equivalent |
|---|---|
| Hit shake | Color flash on the struck card border (2 frames, no transform) |
| Floating damage numbers | Number appears in place at 100% opacity, holds 800 ms, removes — no rise |
| Speed-multiplier decay | Numeric readout only, hue-weight step at tier thresholds instead of continuous shift |
| Ult-ready pulse / capture-beat pulse / combo pop | Persistent static highlight (border weight + label "Sẵn sàng") |
| Purification / level-up / unlock flourishes | Instant end-state with static gold/emerald emphasis |
| Ghost reveal gesture | Card shows "Ghost đang trả lời…" text state for the delay duration |

Standing rules: min 44 px hit areas; every audio-communicated state has a
static equivalent; no information by color alone (rarity = color + border
weight + label per equipment; quest chips; tower progress as text+bar); hint
panels are screen-reader-readable and never gate content behind animation.

### 3. Style constraints

- **Pipeline: CSS animation only.** Allowed vocabulary: transform, opacity,
  color/box-shadow/filter transitions, CSS keyframes, `clip-path`, lucide
  glyphs. No canvas/WebGL, sprite pipeline, shaders, or particle libraries —
  impact comes from composition (dim, radial pseudo-element bursts, shake,
  flash), globally as in battle's pipeline constraints.
- **Semantic palette (art-bible tokens, no ad-hoc hex):** emerald = success /
  gain / shield-positive; coral = damage / wrong / fizzle; gold = rewards /
  gold currency / level-up; cyan = mana / speed identity; violet = ultimate /
  arcane emphasis; indigo = primary actions / brand. One hue per meaning
  family; crit/ult differentiate by **scale and framing, never new hues**.
  Rarity hues come from the equipment token set.
- **Gradients:** arcane chrome only — radial dim on ult, meter fills, gold
  shimmer on reward surfaces. Max two stops, same hue family. Body text never
  sits on a gradient background.
- **Typography:** Be Vietnam Pro for all body/Vietnamese copy; Chakra Petch
  display for numerals, damage numbers, and Latin display strings (tier
  names, "Gold League"). Vietnamese diacritics always render in Be Vietnam
  Pro.
- **lucide icons:** single color, consistent stroke width, decorative or
  labeled; an icon never carries information alone.
- **Cross-screen consistency:** shared `.card` chrome (surface + 1px line +
  1rem radius), `grid-bg` arena backdrop on battle/forge/tower only, dark
  scheme globally; the same event always renders the same way regardless of
  which screen hosts it (a rune drop looks identical in battle and in the
  forge queue).
- **Failure is owned, never punished visually** (Pillars 2/4): rune drops,
  fizzle, and ghost reveals stay calm; wrong answers read as loot, not shame.

### 4. Audio stance (MVP: silent)

- **MVP ships silent except TTS.** No music, no SFX at MVP — matching
  game-concept (audio = TTS only; SFX `INTENT UNKNOWN`) and the prototype
  (shipped no SFX). The shell renders speech-io's TTS replay control; it
  synthesizes and plays nothing itself.
- **Design-ready plan, not MVP scope:** battle-system's minimal 8-cue set
  (confirm-correct, confirm-wrong, hit-standard, shield-ring, mana-tick,
  ult-ready, stinger-victory, stinger-defeat) is adopted as the post-MVP
  candidate, gated on the open question and audio-director consultation.
- **If SFX land later, what changes:** (a) the presentation config gains an
  `audio.cues` map keyed to the same event keys as `vfx` — one event, one
  cue; (b) a global mute toggle ships with it and persists with settings;
  (c) battle's constraints carry: ghost reveal gets no dedicated cue,
  per-round sound sets and music remain post-MVP; (d) verification is a
  manual playtest checklist (audio has no screenshot-testable AC); (e) no
  visual effect may depend on audio readiness — the silent build must be
  fully playable.
- **Mood target** (for the eventual consultation): crisp, arcane-UI,
  percussive-impact-forward, matching the visual identity above.

### 5. What ui-shell does NOT own

- **Reveal-theater scheduling** — `answer_reveal_delay_ms_*` constants and
  what happens during them are battle's; the shell renders the window it is
  told about and fast-forwards when battle says so.
- **VFX trigger logic** — battle, forge, meta, ranked, speech-io and accounts
  emit typed events/states; the shell maps event → effect and never decides
  *that* an effect happens (e.g. whether a crit occurred, whether a commit
  retries).
- **Game values and formulas** — all displayed numbers are formatted reads of
  upstream state (Core Rule 1); display-side math only in this GDD's
  Formulas.
- **TTS synthesis/playback and audio direction** — speech-io owns the speech
  pipeline; audio-director owns any future cue palette.

## Game Feel

The shell's feel target is **legible speed**: every moment of the loop must
answer "how fast was that, and what did it cost" within one glance. Three
anchor moments set the bar. (1) **Damage resolution** — a correct answer
resolves into damage/shield with the speed multiplier visibly decaying
1.30×→1.00×; hesitation must be visible per Pillar 1, so the readout decays
smoothly, never snaps to 1.00× while time remains. (2) **The purification
payoff** — forge resolution and stone application land with compressed weight
(~800–1200 ms: select → confirm → commit → pip fills → stat pop, per
equipment's Game Feel); reward moments get one beat of emphasis, never a
celebration longer than the next tap. (3) **The claim moment** — a quest
claim converts instantly to visible gold (vi-VN formatted) on the currency
strip; nothing between tap and number.

Input responsiveness budgets: tap targets highlight within ≤ 100 ms
(equipment rule, globalized); disabled states render *before* the tap, never
after; the Committing spinner appears within one frame of the action, and the
action itself locks immediately (no double-commit window).

Anti-goals, inherited from upstream: the inventory must not read as a
spreadsheet (equipment); the league screens must not manufacture pressure
theater the player didn't earn (ranked); no surface may fake presence the
product doesn't have (Pillar 4). The RPG frame is load-bearing, not garnish —
hit shake, floating numbers and combo pops are first-class work with budgets
in Visual/Audio, and their removal must be *felt* as a downgrade, which is
exactly why each has a reduced-motion static equivalent rather than simply
disappearing.

## UI Requirements

ui-shell is the UI system — this section records its own UX obligations and
the hand-off ladder. Per-surface interaction design (wireframe-level flows,
copy, ordering) is **not** decided here: it belongs to `/ux-design` specs at
Pre-Production, per the flags every upstream GDD raised.

**UX-spec hand-off ladder** — screens this GDD owns that need `/ux-design`
specs before epics (consolidating the upstream flags):

| Spec | Surfaces | Flag origin |
|---|---|---|
| Auth & session | login, register, reset ×2, session-expired overlay, unsaved banner, offline indicator | accounts-backend |
| Home hub | hub layout, quest board + claim flow, currency/streak strips, ranked entry | meta (MP-AC27–29 screenshot gates), ranked |
| Battle HUD | fighter cards, mana bar + 90-gate marker, speed readout, combo badge, round log, reveal theater, result modal | battle |
| Battle interactions | question panels, speech-io contract elements (replay, IPA, ult picker, mic pulse, spell input), equipment hint surfaces | speech-io (SI26 screenshot gate), equipment |
| Forge | queue, session view, resolution modal | forge |
| Tower | floor map/stage select, preview, progression surfaces | tower |
| Inventory | slot cards, item detail, apply confirmation | equipment |
| League (Alpha) | PvP/Study tabs, season summary, tier track, forfeit notice | ranked |

Stories that reference UI cite `design/ux/[screen].md`, never this GDD
directly; every UI story closes with a retained screenshot in
`production/qa/evidence/` (Core Rule 10).

**Shell-level requirements** (decided here, binding on the specs above):

- **Responsive layout**: mobile-first single column; ≥ 768 px two-column
  layouts for Home and League (board + side rail); battle HUD never splits —
  it is a fixed composition at every width (breakpoint constants in the
  Core Rule 9 presentation config).
- **Copy discipline**: Vietnamese-first, extraction-keyed, English
  placeholders at MVP; player-facing hint copy that encodes a normalization
  rule (spell input's "case/spacing forgiven, punctuation significant") is
  routed to `/ux-design` for final wording (speech-io qa-lead G5 note).
- **State visibility**: every gated affordance shows *why* it is gated
  (offline, settling, maxed, no stones, empty queue) — a disabled button
  without its reason is a spec violation.
- **Disclosure surfaces**: ghost-duel labels are persistent on League screens
  and the ranked match banner — not dismissible, not tooltip-only.
- **No guest entry point** anywhere in navigation or onboarding (AC-A1).
- **Passthrough display rules** (no formula — see Formulas exclusions):
  combo badge renders "COMBO ×{n}" from battle's count; RP delta renders
  with an explicit sign prefix ("+28" / "−14") in the damage-number
  legibility treatment; tower progress renders tower's F2 fraction as bar
  width plus a text readout (text+bar, Core Rule 7) — none of the three is
  recomputed shell-side.

## Cross-References

| Referenced GDD | What is referenced | Where in this GDD |
|---|---|---|
| design/gdd/battle-system.md | BattleResult fields, gate marker 90, B2 speed multiplier, Rule 21 reward/RP emission semantics, fail-soft unknown-passive EC, LoadoutSnapshot passive flags | Core Rules 3/4/11/12, States, Interactions, Edge Cases E3/E13, Game Feel |
| design/gdd/forge-srs.md | rune queue shape, box badges, due state (server-clock authority), offline gate, session size 3 | Core Rules 5, Interactions, Edge Cases E7, Formulas F3 |
| design/gdd/tower.md | F1/F2/F3 states, floor map = stage select (Core Rule 3), preview, absent-module E2, content-error E5, accessibility inputs | Core Rules 2/7, Interactions, Edge Cases E12 |
| design/gdd/meta-progression.md | quest states + reset boundary, gold/XP (`xp_per_level` 1000, MP1), streak state, vi-VN separators carry-in, MP-AC27–29 screenshot gates | Core Rules 2/8, Interactions, Edge Cases E5/E6/E8, Formulas F1/F2/F4, UI Requirements |
| design/gdd/ranked-league.md | RL1 tier/division, RP ±28/−14 display, peer board + zones, Settling state, forfeit notice, disclosure label, Alpha scope | Core Rules 2/6, Interactions, Edge Cases E9/E16, UI Requirements |
| design/gdd/accounts-backend.md | commit machine + `retry_delay` (F3 ladder), offline rules, session-expiry return-to-context, no-guest rule, generic registration failure | Core Rules 3/4/5, States, Edge Cases E1–E4/E12 |
| design/gdd/equipment.md | inventory/apply/hint surface contract, rarity non-color rule, 44 px hit areas, apply preconditions copy, passive flags via OQ-EQ1 | Core Rules 7/12, Interactions, Edge Cases E13/E14, Game Feel |
| design/gdd/speech-io.md | UI contract table (replay/IPA/ult picker/mic pulse/spell input/cast-fizzle), SI26 screenshot gate, normalization copy routing, reduced-motion floor | Core Rules 7/11, Interactions, Edge Cases E10/E11/E15, UI Requirements |
| design/gdd/hero-class.md | class identities, pick screen, passive lines | Core Rules 2, Interactions |
| design/gdd/opponent-ai.md | GhostProfile fields feeding ghost cards + banner disclosure | Interactions |
| design/gdd/game-concept.md | Pillars 1/2/3/4, MVP definition, prototype analysis (polish load-bearing), platform decision (web-native TS/React) | Overview, Core Rules 7/9, Game Feel |
| design/gdd/systems-index.md | row #9 (UI · MVP · Presentation), deps row, UX flag compilation | throughout |
| design/registry/entities.yaml | 17 ui-shell-referencing entries (see Phase-2 slice; referenced_by edges added in Phase 5) | known-fact basis for all values |

## Acceptance Criteria

> **Source**: qa-lead consultation, 2026-11-09 (UI-AC1–UI-AC30, coverage-verified
> against all 12 Core Rules, formulas F-UI1–F-UI5, and every Edge Case E1–E18 as
> labeled in file order). **Prefix note**: AC ids use **UI-AC** — F-UI1–F-UI5 are
> taken by the formulas, E1–E18 by the edge cases, OQ-UI1–5 by the open questions
> (house precedent: ranked-league's formulas RL1–RL5 → ACs RKL1–25; speech-io's
> S1–S3/P1 → ACs SI1–26).
> **Legend**: **[unit]** = vitest, deterministic, DI-injected upstream
> collaborators (contract fakes — no network, no device clock, no real
> commit ladder), rendering asserted via the project's DOM test setup, home
> `tests/unit/ui-shell/`, BLOCKING; **[integration]** = automated cross-system
> test over the accounts-backend storage/auth doubles, BLOCKING;
> **[screenshot]** = retained in `production/qa/evidence/`, BLOCKING at every
> `qa.level` (never waived — this system is the UI evidence gate's primary
> debtor); **[manual]** = documented playtest checklist + lead sign-off,
> evidence retained in `production/qa/evidence/` (the Visual/Feel gate — feel
> and animation budgets are deliberately not unit-asserted, per the testing
> standards' What-NOT-to-Automate rule); **[statistical]** = **0 criteria —
> ui-shell owns zero RNG** (rendering only: every value it displays is a
> formatted read of upstream state, so nothing samples and nothing has a
> distribution to test).
> *(provisional)* legs: UI-AC7/UI-AC8's class-pick routing rides **finding F1**
> (repaired in this GDD — the States/Core Rule 2 fix above); UI-AC25's forfeit
> capture rides ranked enablement; UI-AC29 rides Alpha scope; UI-AC30 runs at
> the first playable build. The battle, forge, tower, meta, ranked, accounts,
> equipment and speech-io contracts referenced are non-provisional (all
> Approved or authored).
>
> Shared numbers, restated so no criterion requires reading other sections:
> `xp_per_level` = **1000** flat (meta MP1 registry — referenced, never
> redefined); `level = floor(cumulative_xp / 1000) + 1` (level-1 base),
> `progress = (cumulative_xp mod 1000) / 1000` ∈ [0.0, 0.999). Global rounding
> convention **round-half-up** at every quantization step (battle-system).
> vi-VN grouping: blocks of 3 digits from the right joined with '.', applied
> only when n ≥ 1000. Countdown branches: remaining ≤ 0 → "ready"; < 60 s →
> "resting · <1 m"; < 3600 s → "resting · {N} m"; else "resting · {N} h";
> **server clock only**. B2: `speedMult = 1 + 0.3 × remaining_fraction` ∈
> [1.0, 1.3]; display = `round_half_up(speedMult × 100) / 100`, exactly 2 dp.
> Mana gate marker **90**; `sim_listening_beat_ms` = **1200**; commit ladder
> bound **D_max = 30 s** (accounts' constant); ranked RP **+28 / −14** (battle
> Rule 21 emission); all quest goals ≥ 1 (2 / 5 / 1 / combo ≥ 1).

- **UI-AC1 [unit] — F-UI1 renders the level + XP bar from meta's ledger; the full bar exists only as the completion flash (F-UI1 + Core Rules 1, 10 + E5).** **GIVEN** `cumulative_xp` ∈ {0, 999, 1000, 2100, 3450}, **WHEN** the Home-hub and result-modal renders compute, **THEN** the pairs are exactly level 1 / into 0 / 0.0 (fresh account, "Level 1", empty bar), level 1 / into 999 / 0.999, level 2 / into 0 / 0.0, level 3 / into 100 / 0.10, level 4 / into 450 / 0.45 — meta MP-AC3's jump 600 → +1500 → 2100 lands on level 3, bar 10%, with no intermediate-level bookkeeping (the division/remainder reproduces meta E11 for free); **and THEN** computed `progress` ∈ [0.0, 0.999) at every settled render — the fraction expression cannot return 1.0 (property sweep); **and GIVEN** an exact multiple of 1000 (E5), **THEN** the settled state is the next level at 0% and the completion-flash class fires on that boundary read (trigger: `xp_into_level = 0 ∧ cumulative_xp > 0`) — the bar never settles at "0% with no explanation", and the full-bar frame exists only inside the flash transient, never as computed state (static); **and THEN** `xp_per_level` is referenced from meta's registry by name — static sweep finds no local 1000 constant (Core Rule 1; twin of RKL3's constants leg).
- **UI-AC2 [unit] — F-UI2 groups positionally, abbreviates nothing, masks nothing (F-UI2 + Core Rule 8 + E6).** **GIVEN** n ∈ {0, 5, 999, 1000, 24500, 999999, 1000000, 1234567}, **WHEN** formatted, **THEN** the strings are exactly "0", "5", "999", "1.000", "24.500", "999.999", "1.000.000", "1.234.567" — blocks of 3 from the right joined with '.', applied only when n ≥ 1000; **and THEN** no abbreviation or compaction branch exists (static: E6's > 999.999 case extends purely positionally — identical format at 24.500.000, no "1,2 M" path); **and GIVEN** an upstream bug supplying −1400, **THEN** the string renders "−1.400" — a wrong value displays as wrong, never masked or clamped (Pillar 4); **and THEN** the formatter is one shared implementation consumed by the gold strip, RP surfaces and result-modal reward rows (static: no per-surface copies).
- **UI-AC3 [unit] — F-UI3's branch table with round-half-up and server-clock authority (F-UI3).** **GIVEN** `due_at − server_now` sweeping {−5 s, 0, 30 s, 59.9 s, 60 s, 90 s, 360 s, 3599.4 s, 3600 s, 10800 s, 259200 s}, **WHEN** the countdown pill renders, **THEN** it reads exactly "ready" (−5, 0), "resting · <1 m" (30, 59.9), "resting · 2 m" (90 → round_half_up(1.5) = 2 — the half rounds up), "resting · 6 m" (360), "resting · 60 m" (3599.4), "resting · 1 h" (3600), "resting · 3 h" (10800), "resting · 72 h" (259200); **and THEN** "resting · 0 m" is unreachable (property: every value in (0, 60) renders "<1 m"; every value in [60, 3600) renders N ≥ 1); **and GIVEN** the device clock skewed ±3 days against the injected server clock, **THEN** every rendered pill is identical — the format path reads the server clock only (static: no device-clock read).
- **UI-AC4 [unit] — The "ready" display never gates eligibility; state wins (F-UI3 + Core Rules 1, 5 + E7).** **GIVEN** forge's eligible state (`due_at ≤ server_now` on forge's read) and a stale "resting" string from the previous tick rendered in the same frame, **WHEN** the queue composes, **THEN** Start Session is enabled iff forge marks the rune eligible — never iff the string reads "ready" (static: the gate path reads forge state, not the formatted string; on one disagreeing tick, state wins); **and GIVEN** a rune crossing its due time while the queue is on screen (E7), **THEN** the pill re-renders to "ready" on the next state read and the client never flips box/due state itself (static: no local due-state mutation exists — a stale "resting" label is corrected by re-read only).
- **UI-AC5 [unit] — F-UI4 min-clamps and never feeds the DOM a NaN (F-UI4).** **GIVEN** (progress, goal) ∈ {(0, 2), (1, 2), (2, 2), (5, 2)}, **WHEN** the quest fraction computes, **THEN** 0.0/"0%", 0.5/"50%", 1.0/"100%", 1.0/"100%" — over-delivery is min-clamped, the bar can never exceed 100%, and 1/3 renders round_half_up(33.33) = "33%"; **and GIVEN** goal ≤ 0 (defensive — impossible in the MVP set), **THEN** fraction = 0 with the guard preceding the division, so no NaN reaches the DOM (static); **and THEN** the bar width and the percent label read the single fraction — one source, two renders.
- **UI-AC6 [unit] — F-UI5 quantizes battle's value, never recomputes it (F-UI5 + Core Rule 1).** **GIVEN** battle-emitted speedMult ∈ {1.0, 1.004, 1.005, 1.225, 1.3}, **WHEN** the HUD readout renders, **THEN** "×1.00", "×1.00", "×1.01", "×1.23", "×1.30" — round_half_up at the hundredths, exactly 2 dp; **and GIVEN** a value already at exactly 2 decimals, **THEN** it passes through bit-identical (1.23 → "×1.23", no double-rounding drift); **and THEN** the shell never recomputes speedMult from elapsed time (static: no B2 expression copy — the read is battle's live state only); **and GIVEN** no active round countdown, **THEN** the readout shows the neutral "×1.00" (per the reconciled F-UI5 wording: an active round at full time remaining renders battle's emitted 1.30, per B2).
- **UI-AC7 [unit] — The app state machine matches the States table exactly; overlays stack, never replace (States + Core Rules 3, 4).** **GIVEN** the DI-injected session/auth service, **WHEN** the app boots, **THEN** no game surface renders before session + content version resolve (spy: zero spoke renders during `Booting`), then `Booting` → `Authenticating` → `Ready` (or → `PickingClass` → `Ready` for a `ClassUnpicked` account); inline validation errors stay within `Authenticating`; logout from any spoke returns to `Authenticating`; **and THEN** the `SessionExpired`, `Unsaved` and offline overlays are orthogonal to the spoke states — each stacks over the current spoke and clears back to it, never replacing it (property: no transition enters an overlay as a state); **and GIVEN** a fresh account (`ClassUnpicked` per hero-class States), **THEN** the flow routes `Authenticating` → class pick (shell-rendered from hero-class records) → `Ready`. The transition set is exhaustive — no transition outside the table fires (property). *(Class-pick leg asserts the F1 repair above.)*
- **UI-AC8 [unit] — Battle exits only through its result modal; there is no guest entry (Core Rule 3 + ranked Rule 11 / ADR-0003 §4 semantics).** **GIVEN** the router, **THEN** every spoke is entered from Home; battle additionally from the tower floor map and (Alpha) the ranked queue; **and GIVEN** any mid-battle exit attempt — back affordance, hub link, deep link, overlay dismiss — **THEN** none exits `InBattle` without a result modal (spy); the mid-battle back affordance invokes the ranked Rule 11 ruling (ADR-0003 §4) through the modal path (ranked → forfeit notice after grace; friendly/tower → discard) and the shell renders the outcome without implementing it (static: no forfeit decision code in the shell); **and GIVEN** an unauthenticated deep link to any spoke route, **THEN** it lands on Auth — no guest entry anywhere in navigation or onboarding (static sweep: no route renders game surfaces pre-auth; accounts AC-A1).
- **UI-AC9 [unit] — Refresh and deep-link mid-flow reset to the routing rule, nothing else survives (Core Rule 3 + E12).** **GIVEN** a refresh or deep link mid-flow, **WHEN** the app re-resolves, **THEN** unauthenticated → Auth screen; authenticated → `Ready` (Home); **and THEN** battle round state, preview scroll positions and half-completed forge sessions do not survive (static: no client-side persistence path exists for any of the three); **and GIVEN** server-reconstructable context, **THEN** it survives per accounts' own contract — the shell renders whatever accounts re-serves, nothing more.
- **UI-AC10 [unit] — The commit ladder renders per accounts' machine; Unsaved disables and persists (Core Rule 4 + E1).** **GIVEN** a DI-injected fake commit machine (accounts AC-C1/AC-C2 contract), **WHEN** each state renders, **THEN** Idle shows actions enabled; Committing locks the action immediately — no double-commit window — with the spinner within one frame (Game Feel); Retrying shows the subtle in-place indicator, never a modal; Unsaved shows the persistent "Lưu không thành công — Thử lại" banner overlaying the current spoke (E1: reading any surface stays possible while every commit-requiring action is disabled until the manual retry succeeds — the States table's Unsaved row and E1 say the same thing after the F2 repair); **and WHEN** the manual retry fires, **THEN** the injected ladder receives a restart at n = 0, not a resume (spy); **and WHEN** the commit succeeds, **THEN** the state returns to Idle and the banner clears.
- **UI-AC11 [unit] — Navigation is blocked for the in-flight ladder, and by nothing shell-side (Core Rule 4 + E2).** **GIVEN** a commit in Committing or Retrying, **WHEN** navigation is attempted (back affordance, hub link, deep link), **THEN** it is refused — state unchanged — and the affected button and back affordance render their disabled states for the ladder's duration; the block releases the moment the ladder resolves either way; **and THEN** the only bound is accounts' ladder constant (D_max 30 s) — the shell imposes no timeout of its own (static: no shell-side timer cancels the block).
- **UI-AC12 [integration] — Session expiry mid-battle returns to context; the invalidated result is routed, never discarded (Core Rules 3, 4 + E3; accounts AC-S4).** **GIVEN** the accounts auth double and a battle in progress, **WHEN** the session expires mid-battle, **THEN** the SessionExpired overlay appears over the battle; after re-login the shell returns to the exact context and the pending result commit survives (spy: the pending commit object is re-delivered, not recreated); **and GIVEN** the battle was server-invalidated meanwhile, **THEN** the result modal renders its explicit "không thể lưu" state routed into the retry ladder — never a silent discard (spy: the discard path is never entered).
- **UI-AC13 [integration] — Offline: gated everywhere, honest everywhere, and the shell never fabricates a commit (Core Rule 5 + E4; accounts AC-C5).** **GIVEN** a disconnected client (fake network double), **WHEN** the surfaces render, **THEN** the persistent offline indicator shows, commit-requiring actions are visually blocked, the forge queue shows its offline gate, and quest claim buttons render blocked; a battle in progress continues client-side and its result commit enters the retry ladder on reconnect (spy: queued, delivered exactly once on reconnect); **and THEN** the shell has no path that renders a success state without server acceptance (static: every success render is downstream of the commit machine's success transition).
- **UI-AC14 [unit] — Honest ghosts: disclosure persists, peers are never invented, Settling is respected (Core Rule 6 + E9, E16).** **GIVEN** the ranked match banner and every League screen, **THEN** each renders the persistent ghost-duel disclosure label (ranked's UI Requirements copy, extraction-keyed; static: not tooltip-only, not dismissible), simulated peers carry the "Nhóm #14" pattern, and the material comes from opponent-ai's GhostProfile fields (static: no shell-side peer invention); **and GIVEN** a League render with peer data unavailable (E16: injected drift-read failure), **THEN** the board renders the player's row plus a loading state for peers — never fabricated values (static sweep: no render path synthesizes a peer number); **and GIVEN** the season state `Settling` (E9), **THEN** the queue button renders disabled with the season summary replacing it — never enabled regardless of stale client state.
- **UI-AC15 [unit] — Upstream disagreement is surfaced, not reconciled (E18 + Core Rule 1).** **GIVEN** two injected upstream reads that disagree (result-modal rewards vs currency-strip gold), **WHEN** both surfaces render, **THEN** each renders its own read unchanged — no reconciliation is invented (static: no reconciliation code path exists); **and THEN** the mismatch is logged to the QA evidence channel (spy: one log naming both surfaces and values).
- **UI-AC16 [unit] — The speech-io contract renders exactly, and the shell adds nothing (Core Rule 11 + E10, E11).** **GIVEN** each scripted contract state (replay enabled / "tap to hear" / hidden-in-L2; IPA panel populated; ult path picker mic-available / mic-unavailable; capture-beat phase per `sim_listening_beat_ms` = 1200; spell input with its normalization-accurate hint copy; cast flag; fizzle flag), **WHEN** each renders, **THEN** the readout matches speech-io's UI contract table exactly (table-driven; SI26's scripted set); **and THEN** the shell adds no scoring, gating or audio behavior (static: no synthesis call, no quality decision, no gate on the audio path in shell code); **and GIVEN** mic permission denied mid-ult (E10), **THEN** the picker renders mic-unavailable while spell stays available (free switch until first submission), and a permission grant after submission lock does not retro-open the mic path — the picker reflects the locked state; **and GIVEN** the replay control in "tap to hear" (E11), **THEN** it renders its gesture-blocked state and never renders enabled while playback would fail.
- **UI-AC17 [unit] — Hint surfaces are flag-driven, toggle-revealable, and fail soft on unknown passives (Core Rule 12 + E13).** **GIVEN** a LoadoutSnapshot with passive flags, **THEN** each known flag drives its hint surface (etymology panel, example-sentence reveal on miss, option-elimination flash, tap-to-hear, first-letter pre-fill); every hint is toggle-revealable with screen-reader-readable text present in the DOM independent of animation state (static: content is never gated behind animation or color alone); **and GIVEN** a flag referencing an unknown passive (E13), **THEN** that hint surface renders nothing (fail-soft — battle's EC carried through) while the HUD stat line still renders all five stats — an unknown passive never breaks the screen.
- **UI-AC18 [unit] — Reduced-motion swaps every motion for its static equivalent, information intact (Core Rule 7 + E15).** **GIVEN** injected `prefers-reduced-motion`, **WHEN** each effect renders, **THEN** the Visual/Audio §2 table holds exactly (table-driven fixture): hit shake → 2-frame border color flash, no transform; floating numbers → in-place at 100% opacity, 800 ms hold, no rise; ult-ready / capture / combo pulses → persistent static highlight + "Sẵn sàng"; ghost reveal → "Ghost đang trả lời…" text state for the delay duration; purification / level-up / unlock flourishes → instant end-state; **and THEN** the information content is identical across variants (property: the same labels and data attributes present in both); **and THEN** every motion effect has a registered static variant in the presentation config (static: information never depends on the motion itself).
- **UI-AC19 [unit] — No information travels by color alone; 44 px is a token, not a hope (Core Rule 7 + E17).** **GIVEN** rarity data, **THEN** it renders as color + border weight + label (property: the label and border-weight class remain when the hue is removed); **and GIVEN** quest rows, **THEN** states render as chips (Active/Claimable/Claimed), never color alone; **and GIVEN** tower progress, **THEN** bar width AND a text readout render from tower's F2 fraction — never re-derived shell-side (static); **and GIVEN** the streak strip's broken state (E17), **THEN** it renders label + state chip distinctly, the count reads 0, and no copy implies yesterday's streak is recoverable; **and THEN** the hit-area token is 44 px in the presentation config and every interactive element consumes it (static sweep: no interactive target defines its own smaller size).
- **UI-AC20 [unit] — Presentation config: nothing hardcoded, everything keyed (Core Rule 9).** **GIVEN** the codebase, **THEN** a static sweep finds no component-level hardcoded duration, easing curve, breakpoint or hex — all presentation values resolve through `vfx.<event>.<variant>` config keys; **and GIVEN** the config file, **THEN** it parses and defines every event class in Visual/Audio §1 (each table row has its key) plus the layout/breakpoint constants of Core Rules 7 and 9; **and THEN** budget VALUES (the ms ranges) are deliberately not unit-asserted here — adherence is UI-AC30's [manual] evidence per the testing standards.
- **UI-AC21 [unit] — Copy is extraction-keyed from day one; the day boundary leaves no ghosts (Core Rule 8 + E8).** **GIVEN** the codebase, **THEN** a static sweep finds no hardcoded player-facing string — all copy resolves through extraction keys (Vietnamese-first, English placeholders at MVP), and tier names render English alongside Vietnamese ("Gold League"); **and GIVEN** the day rolling over while the quest board is visible (injected clock), **WHEN** the next data read lands, **THEN** the board re-renders with the new day's quests at progress 0 and expired claimable rewards silently gone — no ghost claim buttons (spy: zero claim actions reachable on the stale rows; the visual pair is UI-AC23's MP-AC29 capture).
- **UI-AC22 [screenshot] — The Auth suite renders accounts' contract, failure included (Core Rules 2, 4).** **GIVEN** each Auth state — login, register, password-reset-request, password-reset-set, one inline validation error, and the generic registration-failure message (accounts AC-A5: no email-exists hint) — **THEN** each renders per accounts' UI Requirements with commit states visible where applicable; plus the SessionExpired overlay ("Session hết hạn") captured over a spoke context. Retained screenshots in `production/qa/evidence/` (one per screen/state).
- **UI-AC23 [screenshot] — The Home hub renders meta's contract — discharges MP-AC27–29 (Core Rules 2, 8, 10).** **GIVEN** the MP-AC27–29 fixtures — board states Active/Claimable/Claimed (claim button enabled on Claimable only; Claimable vs Claimed visually distinct; the paid-state feedback on claim), gold 24.500 with a mid-level XP bar (the mod-1000 render of F-UI1), streak strip alive and broken, and the injected rollover crossing (new board, all four Active at 0, yesterday's unclaimed silently gone) — **THEN** the hub renders all of it per contract. Retained screenshots (one per state; discharges meta's MP-AC27–29 gates). Quest board, currency and streak strips are VS scope — capture at the tier that ships them.
- **UI-AC24 [screenshot, + lead sign-off] — The battle HUD and the speech-io contract read as specified — discharges SI26 (Core Rules 2, 10, 11).** **GIVEN** SI26's scripted states (L1 speaking, L2 fallback, "tap to hear", mic available/unavailable, capture-beat pulse, cast, fizzle), **THEN** the battle HUD renders fighter cards (ghost identity from opponent-ai fields), the mana bar with the 90-gate marker, the live speed readout per F-UI5, the "COMBO ×{n}" badge, the round log, the reveal-theater window as battle schedules it, and the HUD passive line — with the speech-contract elements exactly per the contract table (replay incl. hidden-in-L2; IPA panel carrying no term/tts_text; free-switch path picker; capture beat, its reduced-motion variant captured too) and one capture of an equipment hint panel open (Core Rule 12). Retained screenshots (one per scripted state) + lead sign-off, per SI26's evidence rule.
- **UI-AC25 [screenshot] — The result modal is the only battle exit, and it reads honestly (Core Rules 2, 6).** **GIVEN** a victory result, **THEN** the modal renders victory/defeat rows, reward rows in vi-VN formatting, the cursed-rune word list and max combo; **and GIVEN** a ranked result, **THEN** the RP delta renders with its explicit sign prefix ("+28" / "−14") in the damage-number treatment — formatted, never computed (battle's Rule 21 emission); **and GIVEN** a forfeit, **THEN** the wording states −14 plainly, visually distinct from a played defeat. Retained screenshots (one per result class). *(Forfeit capture rides ranked enablement; co-discharges ranked RKL25.)*
- **UI-AC26 [screenshot] — Forge's three surfaces render its contract, gate included (Core Rules 2, 5).** **GIVEN** the forge fixtures — the queue (box badges, due pills per F-UI3 including one "ready" and one long-resting rune, the offline gate state), the session view (3-card session), and the resolution modal (purification end-state, stone-granted flash, level-up flare per the Visual/Audio §1 table) — **THEN** each renders per forge's UI Requirements. Retained screenshots (one per surface + the offline-gate state).
- **UI-AC27 [screenshot] — Tower's three surfaces render its contract, reasons as text (Core Rules 2, 7).** **GIVEN** the tower fixtures — floor map (= stage select) with locked/unlocked states and unlock conditions as text, the preview screen, and the result-progression surfaces (deltas as text+bar per tower F2) — **THEN** each renders per tower's UI Requirements §1–4, including the absent-module and content-error states. Retained screenshots (one per surface).
- **UI-AC28 [screenshot] — Inventory and apply render equipment's contract — discharges EQ27/EQ28 (Core Rules 2, 12 + E14).** **GIVEN** a mid-progression account (mixed levels, ≥ 2 rarities, stones held), **THEN** the 4 slot cards render with rarity as color + border weight + label, level pips 0–5, the stat block, Vietnamese passive text and the stone counter; **and GIVEN** the apply flow, **THEN** the stat-delta preview is visible before confirmation, and the three disabled states render disabled-not-hidden with their reasons ("cấp tối đa" / "cần Đá Tu Luyện" / offline read-only banner — one capture per state). Retained screenshots. *(Twin captures co-discharge equipment EQ27/EQ28.)*
- **UI-AC29 [screenshot, Alpha] — The League surfaces render ranked's semantics — discharges RKL21–25 (Core Rules 2, 6).** **GIVEN** ranked's RKL21–25 fixtures (mid-season board on the reference hash, the Settling season summary, the tier-crossing pair 999 → 1000 with its demotion twin, the forfeit notice), **THEN** the ranked entry, PvP tab, Study tab, season summary, tier track and forfeit notice render with the persistent disclosure label. Retained screenshots. *(provisional on Alpha scope — the MVP build captures nothing here; captures co-discharge ranked's RKL21–25, provisional on this GDD until now.)*
- **UI-AC30 [manual] — The feel anchors hold on a real build (Game Feel + Visual/Audio budgets).** **GIVEN** a playable build, a documented playtest checklist verifies: the speed readout decays smoothly and never snaps to 1.00× while time remains; the purification payoff lands as one compressed beat (~800–1200 ms), never longer than the next tap; a quest claim converts to visible gold with nothing between tap and number; one loud beat per resolve; ≤ 10 concurrently animating elements and ≤ 5 floating numbers; shake never targets the question panel or a commit/banner surface; tap targets highlight within ≤ 100 ms; disabled states render before the tap. Verified by retained captures + lead sign-off in `production/qa/evidence/` (Visual/Feel gate). Budget values are deliberately not unit-asserted (What-NOT-to-Automate).

**Totals: 30 criteria — 19 unit, 2 integration, 8 screenshot (7 MVP + 1
Alpha-provisional), 1 manual, 0 statistical. 21 automated criteria assertable
now. No statistical criteria by design: ui-shell owns zero RNG — every
displayed value is a formatted read of upstream state (Core Rule 1), so
nothing samples and nothing has a distribution.** Provisional legs: the
forfeit capture in UI-AC25 (ranked enablement), UI-AC29 (Alpha), UI-AC30
(first playable build). Findings F1–F4 are repaired in the body above
(F1: `PickingClass` state + Core Rule 2 entry; F2: Unsaved row aligned with
E1; F3: E5 flash-transient wording; F4: F-UI5 neutral-readout wording); F5
(E10's durable citation) is noted for speech-io's next edit.

**Coverage matrix** (all 12 Core Rules ≥ 1 AC): Rule 1: UI-AC1/UI-AC6/UI-AC15/UI-AC19 ·
Rule 2: UI-AC7/UI-AC22–28 · Rule 3: UI-AC7/UI-AC8/UI-AC9 · Rule 4:
UI-AC10/UI-AC11/UI-AC12 · Rule 5: UI-AC13/UI-AC26 · Rule 6:
UI-AC14/UI-AC25/UI-AC29 · Rule 7: UI-AC18/UI-AC19/UI-AC24/UI-AC27 · Rule 8:
UI-AC2/UI-AC21/UI-AC23 · Rule 9: UI-AC20/UI-AC30 · Rule 10: UI-AC22–29 (the
evidence set; SI26 discharged by UI-AC24, MP-AC27–29 by UI-AC23, EQ27/EQ28 by
UI-AC28, RKL21–25 by UI-AC29) · Rule 11: UI-AC16/UI-AC24 · Rule 12:
UI-AC17/UI-AC24/UI-AC28. Formulas: F-UI1 → UI-AC1/UI-AC23 · F-UI2 →
UI-AC2/UI-AC21/UI-AC23 · F-UI3 → UI-AC3/UI-AC4/UI-AC26 · F-UI4 →
UI-AC5/UI-AC23 · F-UI5 → UI-AC6/UI-AC24/UI-AC30. Every Edge Case mapped
(E1–E18 as labeled, file order): E1 → UI-AC10 · E2 → UI-AC11 · E3 → UI-AC12 ·
E4 → UI-AC13 · E5 → UI-AC1/UI-AC23 · E6 → UI-AC2 · E7 → UI-AC4 · E8 →
UI-AC21/UI-AC23 · E9 → UI-AC14/UI-AC29 · E10 → UI-AC16/UI-AC24 · E11 →
UI-AC16/UI-AC24 · E12 → UI-AC9 · E13 → UI-AC17 · E14 → UI-AC28 · E15 →
UI-AC18/UI-AC24 · E16 → UI-AC14/UI-AC29 · E17 → UI-AC19/UI-AC23 · E18 →
UI-AC15.

**Test-file home**: `tests/unit/ui-shell/` — `display-formats.test.ts`
(UI-AC1, UI-AC2, UI-AC5, UI-AC6) · `countdown.test.ts` (UI-AC3, UI-AC4) ·
`navigation.test.ts` (UI-AC7, UI-AC8, UI-AC9) · `commit-rendering.test.ts`
(UI-AC10, UI-AC11) · `disclosure.test.ts` (UI-AC14, UI-AC15) ·
`speech-contract.test.ts` (UI-AC16) · `hint-surfaces.test.ts` (UI-AC17) ·
`accessibility.test.ts` (UI-AC18, UI-AC19) · `presentation-config.test.ts`
(UI-AC20, UI-AC21); `tests/integration/ui-shell/` — `session-expiry.test.ts`
(UI-AC12) · `offline-commit.test.ts` (UI-AC13); screenshots UI-AC22–29 and
the UI-AC30 sign-off → `production/qa/evidence/`.

## Open Questions

> Each question names an owner and a target resolution point; none blocks the
> GDD's MVP scope.

- **OQ-UI1 — TTS accessibility settings surface (adopted from speech-io
  SI4).** Speech-io routed "TTS accessibility settings" to this GDD: does the
  shell expose rate/voice controls for the TTS replay, and where? MVP ships
  the concept's defaults (rate 0.85, en-US) with **no settings UI**; if a
  settings surface is wanted, it lands with the settings-screen question
  (OQ-UI4). Owner: ui-shell author + audio-director; target: Pre-Production
  `/ux-design` (settings spec, if any).
- **OQ-UI2 — `option_audio_replay` surface owner (equipment OQ-EQ2, half
  closed here).** Equipment's ring-ipa passive adds a replay-audio affordance
  on answer options. Stance taken: it renders as an **equipment hint surface
  under Core Rule 12** (passive-flag-driven, same family as tap-to-hear), not
  as a speech-io UI-contract element — speech-io's contract table covers the
  ult/listening paths, not per-option affordances. The Class-B hook handoff
  (battle OQ-EQ1) must land for the flag to exist at all. Owner: battle
  author (hook) + ui-shell (rendering, stance above); target: battle's next
  edit; equipment's debt note may close at the same time.
- **OQ-UI3 — Are SFX/music wanted at all?** game-concept marks it
  `INTENT UNKNOWN`; Visual/Audio §4 ships silent MVP with the post-MVP 8-cue
  plan and the five changes SFX would bring. Owner: user + audio-director;
  target: post-MVP, before any audio production work.
- **OQ-UI4 — When does a settings screen enter the shell?** The MVP screen
  inventory has none (reduced-motion follows the media query with no UI;
  TTS runs defaults). A settings surface would host: reduced-motion manual
  toggle, TTS settings (OQ-UI1), future mute toggle (OQ-UI3). Owner:
  ux-designer + user; target: Alpha scope decision.
- **OQ-UI5 — Hint-surface toggle interaction detail.** Core Rule 12 requires
  hints to be toggle-revealable with screen-reader text; *how* the toggle
  presents per-passive (auto-reveal vs tap-to-reveal, mobile reach) is
  wireframe territory. Owner: ux-designer; target: Pre-Production
  battle-interactions spec.
