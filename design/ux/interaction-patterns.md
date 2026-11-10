# Interaction Pattern Library

> **Status**: In Design
> **Author**: autonomous session (ux-designer routing) via `/ux-design`
> **Last Updated**: 2026-11-09
> **Template**: Interaction Pattern Library

## Overview

This library catalogs the interaction patterns every LexiQuest screen spec
must reuse instead of reinventing. Every pattern here is grounded in a written
GDD contract — ui-shell's 12 Core Rules, speech-io's UI contract table, and
the equipment/accessibility commitments — not invented wholesale. A screen
spec that deviates from a pattern flags the deviation explicitly and
`/ux-review` checks it.

Standing constraints that apply to **every** pattern below (from
`design/accessibility-requirements.md`, Standard tier; binding):

- 44 px minimum hit areas; keyboard-complete operation; visible focus.
- Every audio-communicated state has a static equivalent; the MVP build is
  silent (TTS only) and must remain fully playable silent.
- No information by color alone; reduced-motion swaps motion for static
  state changes — information is never removed, only its motion.
- All copy Vietnamese-first against extraction keys; vi-VN number grouping.
- All animation durations/VFX timings/breakpoints come from the presentation
  config (ui-shell Core Rule 9) — never hardcoded.

---

## Pattern Catalog

| # | Pattern | Category | One-line description | Used In (specs, ladder) |
|---|---------|----------|---------------------|------------------------|
| 1 | Hub-and-Spoke Navigation | Navigation | Home is the hub; spokes enter/exit through defined doors | All screen specs |
| 2 | Responsive Column Split | Navigation | Single column mobile-first; ≥768 px two-column; battle never splits | Home hub, League |
| 3 | Commit-State Machine | System state | Idle→Committing→Retrying→Unsaved rendering over every commit action | All commit-requiring specs |
| 4 | Persistent Status Banner | System state | Non-blocking persistent strip for offline/unsaved states | Auth, Home, Forge, Battle |
| 5 | Session-Expiry Overlay | System state | Blocking re-login overlay that preserves return-to-context | Auth, any commit surface |
| 6 | Gated Affordance With Reason | Input | A disabled control always shows *why* it is disabled | Forge, Inventory, Ranked, Tower |
| 7 | Tap-to-Hear Replay Control | Input | Single-instance TTS replay button with three states | Battle (listening/ult) |
| 8 | Dual-Path Picker | Input | Mic path OR spell path, free switch until first submission | Battle (ult round) |
| 9 | Hint Panel Toggle-Reveal | Input | Equipment hint surfaces as toggle-revealed, screen-reader-readable panels | Battle (hint surfaces) |
| 10 | Explicit-Confirm Guard | Input | Irreversible choices state the consequence before confirm | Class pick, Apply stone |
| 11 | Reveal Theater | Feedback | Scheduled reveal delays with fast-forward and static variants | Battle |
| 12 | Damage Number | Feedback | Floating combat numerals; scale/framing differentiates, never new hues | Battle |
| 13 | Health / Resource Bar | Data display | Bar + numeric value + label; threshold markers as glyphs, not hue alone | Battle (HP/shield/mana), Home (XP) |
| 14 | Text+Bar Dual Readout | Data display | Progress always renders as bar width AND text value | Tower, XP bar, quest progress |
| 15 | State Badge + Label | Data display | Lifecycle states as labeled chips, color + weight + label | Quests, Forge queue, Tower, Rarity |
| 16 | Vi-VN Number Rendering | Data display | Thousand separators from launch; explicit sign prefix on deltas | Gold, RP, damage, countdowns |
| 17 | Exit-Only Result Modal | Modal | The only exit door from battle; focus-contained; routes onward | Battle, Forge resolution |
| 18 | Persistent Disclosure Label | System state | Non-dismissible honesty labels (ghost duels) | Ranked banner, League screens |
| 19 | Claim Button vs Receipt | Feedback | Claimable renders an action; Claimed renders a receipt | Quest board |

---

## Patterns

### 1. Hub-and-Spoke Navigation

**Category**: Navigation
**Used In**: every screen spec

**Description**: Home is the single hub (ui-shell Core Rule 3); battle,
forge, tower, inventory and league are spokes entered from Home — battle also
enters from the tower floor map, where the config is composed. Spokes return
through their defined exit door, never by inventing a second path.

**Specification**:
- Entry: Home → spoke; tower floor map → battle (config composed there).
- Exit: battle exits **only** through its result modal (→ forge or → Home);
  mid-battle back navigation is a forfeit/discard per battle Rule 21
  semantics — ranked = forfeit loss after grace, friendly/tower = discard.
  Never a pause.
- Unauthenticated deep links land on Auth; no guest entry point anywhere
  (accounts-backend AC-A1).
- Back/forward browser navigation must leave the app working (smoke item 3);
  history integration follows the router decision in the app scaffold.

**When to Use**: all navigation planning.
**When NOT to Use**: never introduce cross-spoke shortcuts that bypass the
result modal's routing role.

**Reference**: `ui-shell.md` Core Rule 3.

---

### 2. Responsive Column Split

**Category**: Navigation
**Used In**: Home hub, League

**Description**: Mobile-first single column; at ≥ 768 px, Home and League get
a two-column layout (board + side rail). The battle HUD is a fixed
composition at every width — it never splits.

**Specification**:
- Breakpoint constants live in the presentation config (Core Rule 9).
- Two-column screens keep reading order: primary board first in DOM, rail
  second; the rail must remain keyboard-reachable after the board.
- Battle HUD scales via type/spacing tokens, never by recomposition.

**When to Use**: any wide-layout planning.
**When NOT to Use**: battle and modals — fixed compositions.

**Reference**: ui-shell UI Requirements (shell-level requirements).

---

### 3. Commit-State Machine

**Category**: System state
**Used In**: every commit-requiring spec (forge claim/apply, quest claim,
battle result, equip change, tower result, ranked flows)

**Description**: Every action that issues a progress commit renders the
accounts-backend commit machine: **Idle → Committing → Retrying → Unsaved →
Idle**, in place, on the triggering control and its surface.

**Specification**:
- Committing: action locked, spinner, navigation away blocked.
- Retrying: client-side `retry_delay` ladder runs (F3: min(1s×2ⁿ+jitter,
  30s), N=5); subtle in-place indicator; navigation stays blocked.
- Unsaved: persistent "Lưu không thành công — Thử lại" banner (pattern 4)
  with a manual retry that restarts the ladder at n=0.
- The state indicator is text+labeled, never spinner-only (screen readers
  announce state changes via `aria-live="polite"`).

**When to Use**: every screen that calls `POST /api/commits`.
**When NOT to Use**: pure-read surfaces.

**Reference**: ui-shell Core Rule 4; accounts-backend F3.

---

### 4. Persistent Status Banner

**Category**: System state
**Used In**: Auth, Home, Forge, Battle

**Description**: A non-blocking persistent strip at the top of the affected
surface for standing degraded states: offline ("offline indicator" +
commit-requiring actions blocked), unsaved (retry banner of pattern 3).

**Specification**:
- Persistent while the condition holds; not dismissible (the condition
  isn't dismissible).
- Announced once on appearance (`role="status"`); color + icon + text —
  never color alone.
- While offline, gated actions render blocked *with the reason* (pattern 6).

**When to Use**: standing conditions.
**When NOT to Use**: transient toasts — the MVP has no toast surface;
transient feedback lives in patterns 11–13 and 19.

**Reference**: ui-shell Core Rules 4–5.

---

### 5. Session-Expiry Overlay

**Category**: System state
**Used In**: Auth, any commit surface

**Description**: A blocking overlay when the session expires: "Session hết
hạn" with re-login. The pending commit survives re-login and resumes —
return-to-context is the contract.

**Specification**:
- Focus moves into the overlay on open, restores to the triggering context
  on resume.
- After re-login, the interrupted action continues (AC-S4); the user never
  re-navigates manually.

**When to Use**: session-expired detection.
**When NOT to Use**: never as a generic login prompt — Auth screens handle
first-entry.

**Reference**: accounts-backend AC-S4; ui-shell Edge Cases.

---

### 6. Gated Affordance With Reason

**Category**: Input
**Used In**: Forge, Inventory, Ranked, Tower, any disabled control

**Description**: Every gated affordance shows **why** it is gated — a
disabled button without its reason is a spec violation (ui-shell UI
Requirements). Reasons come from the owning GDD's precondition.

**Specification**:
- Canonical reasons and copy sources: offline (accounts AC-C5), settling
  (ranked), "cấp tối đa" (maxed item), "cần Đá Tu Luyện" (no stones), empty
  queue / all resting (forge).
- Rendering: the control stays in the layout, disabled, with the reason
  text adjacent (visible without hover/focus); `aria-disabled` +
  `aria-describedby` on the reason.
- Touch: a disabled 44 px target still reports its reason on tap (speak the
  reason; do not dead-click).

**When to Use**: every precondition-gated control.
**When NOT to Use**: never hide a disabled control entirely — the player
must be able to discover what would unlock it.

**Reference**: ui-shell UI Requirements (state visibility); equipment/forge/ranked UI Requirements.

---

### 7. Tap-to-Hear Replay Control

**Category**: Input
**Used In**: Battle (listening rounds, ult mic path, ring passive)

**Description**: The single-instance TTS replay button per speech-io's UI
contract: restarts `tts_text` playback from 0.

**Specification**:
- States: **enabled** · **"tap to hear"** (gesture-blocked/suspended — e.g.,
  autoplay policies; requires a user gesture) · **hidden** (L2 mode).
- ≥ 44 px target; keyboard-operable; `aria-label` states the action
  ("Nghe lại câu hỏi").
- The control is visual — a player who never presses it loses nothing (the
  text/IPA route is first-class, per the accessibility doc's TTS audit).

**When to Use**: every TTS surface.
**When NOT to Use**: never auto-play TTS without the gesture-gated state.

**Reference**: speech-io UI Requirements contract table.

---

### 8. Dual-Path Picker

**Category**: Input
**Used In**: Battle (ult round)

**Description**: The ult round offers mic path or spell path as two
affordances with free switching until the first submission locks the choice.

**Specification**:
- States: mic available · mic unavailable (denied/no API — spell path
  remains, explicit permission-denied copy) · spell focused · submitted
  (locked).
- Both affordances are always visible when the round allows choosing; the
  picker is keyboard-operable; the mic capture beat renders a listening
  state with a non-motion variant under reduced motion (static border +
  label).
- Spell input: submit disabled until non-whitespace input; normalization
  hint copy (case/spacing forgiven, punctuation significant) is routed for
  final wording (OQ-P1 below).

**When to Use**: the ult speech interaction only.
**When NOT to Use**: regular rounds — they are single-path.

**Reference**: speech-io UI Requirements; battle ult rules.

---

### 9. Hint Panel Toggle-Reveal

**Category**: Input
**Used In**: Battle (equipment hint surfaces)

**Description**: Equipment passives that add information (etymology panel,
example-sentence reveal, option-elimination flash, tap-to-hear, first-letter
pre-fill) render as **toggle-revealable** panels — never forced, never
animation-gated, never color-only.

**Specification**:
- Toggle control ≥ 44 px with visible state (revealed/collapsed).
- Panel text is screen-reader-readable in both states (equipment UI
  Requirements).
- Reveal-on-miss variants render their static equivalent under reduced
  motion (ui-shell swap table).

**When to Use**: all five hint surface types.
**When NOT to Use**: never auto-open a hint panel on a timer.

**Reference**: equipment UI Requirements; ui-shell Core Rule 12.

---

### 10. Explicit-Confirm Guard

**Category**: Input
**Used In**: Class pick, Apply-stone confirmation

**Description**: Irreversible choices state the consequence **before** the
confirm action and require an explicit confirm — no accidental picks.

**Specification**:
- Consequence copy precedes the confirm control ("Lựa chọn vĩnh viễn" for
  class pick).
- Confirm is a two-step affordance where the GDD names one (apply
  confirmation renders target + stat-delta preview + confirm).
- Cancel returns cleanly with no state change.

**When to Use**: permanent or resource-spending actions.
**When NOT to Use**: reversible actions — confirmation fatigue harms more
than it protects.

**Reference**: hero-class Core Rule 3 + UI Requirements; equipment apply flow.

---

### 11. Reveal Theater

**Category**: Feedback
**Used In**: Battle

**Description**: The scheduled sequence between answer submission and round
resolution: ghost result appears after `answer_reveal_delay_ms_*`, then
resolution. Battle owns the scheduling; the shell renders the window it is
told about and fast-forwards when battle says so.

**Specification**:
- Durations come from the presentation config (reveal delays
  1000/800/1200/1500 ms as current values).
- Fast-forward: player-initiated skip of remaining delay (≥ 44 px,
  keyboard-operable); the shell only renders what battle instructs.
- Reduced motion: "Ghost đang trả lời…" text state replaces the reveal
  gesture; floating numbers appear in place and hold (swap table).
- State changes during the theater announce politely (round verdict, per
  OQ-AX2's resolution in the battle HUD spec).

**When to Use**: battle rounds only.
**When NOT to Use**: forge sessions (untimed, no theater).

**Reference**: battle UI Requirements (reveal theater row); ui-shell Core Rule 5 (what the shell does not own); accessibility doc swap table.

---

### 12. Damage Number

**Category**: Feedback
**Used In**: Battle

**Description**: Floating combat numerals for damage, shield gain, crit, and
ult. Differentiation uses **scale and framing, never new hues** (ui-shell
style constraint): crit/ult are larger and framed, not recolored.

**Specification**:
- Normal: standard size, Chakra Petch display face; crit: ~1.5× scale pop;
  ult: largest, radial-dim framing (arcane chrome vocabulary).
- Motion: rise + fade per presentation config; reduced motion: number
  appears in place at 100 % opacity, holds 800 ms, removes — no rise.
- Shield gain: emerald with "+" prefix and upward framing (non-color
  backups per the accessibility guide's damage-number rules).
- Damage numbers are supplementary — the round log (authoritative record)
  lists every value; a disable-damage-numbers setting is a post-MVP
  candidate (accessibility doc).

**When to Use**: battle combat events.
**When NOT to Use**: resource/progress values (use patterns 13/14).

**Reference**: ui-shell Visual/Audio § 1–3; accessibility guide Damage Number calibration.

---

### 13. Health / Resource Bar

**Category**: Data display
**Used In**: Battle (HP/shield/mana), Home (XP)

**Description**: Continuously varying critical resources render as a bar
**with numeric value and label** — the bar is never the only carrier.

**Specification**:
- HP: emerald fill, numeric readout on the bar; shield: separate segment,
  capped display 200 (prototype convention), labeled.
- Mana: cap-100 bar with the **90 gate marker rendered as a visible glyph +
  label state** ("Sẵn sàng" once crossed) — "why didn't my ult fire" is
  never a mystery.
- Threshold state changes (below-25 % HP) use a static badge/label in
  reduced-motion mode, never pulse-alone.
- Value changes announce politely when they cross a threshold (not per tick).
- Ghost-bar drain effect optional per presentation config; values are
  battle-owned reads, never recomputed (Core Rule 1).

**When to Use**: all fighter resources, XP.
**When NOT to Use**: countdown-style values (pattern 14 for time).

**Reference**: battle UI Requirements (fighter cards, mana gate); guide Health/Resource Bar calibration; accessibility color audit rows 1–2.

---

### 14. Text+Bar Dual Readout

**Category**: Data display
**Used In**: Tower (floor progress), XP bar, quest progress

**Description**: Any progress value renders as bar width **and** a text
readout — never bar alone (Core Rule 7).

**Specification**:
- XP: `cumulative_xp mod 1000` of 1000 as fill + "x/1000" text (F-UI1).
- Tower: F2 fraction as width + text; quest progress: F-UI4 fraction +
  goal text ("2/5").
- Text uses vi-VN grouping (pattern 16).

**When to Use**: every bounded progress value.
**When NOT to Use**: continuous resources with their own numeric readout
(pattern 13 already satisfies this by construction).

**Reference**: ui-shell Core Rules 1/7; tower F2; meta F-UI1/F-UI4.

---

### 15. State Badge + Label

**Category**: Data display
**Used In**: Quest board, Forge queue, Tower floor map, Inventory rarity

**Description**: Lifecycle states render as labeled chips/badges — color +
border weight + label, never color alone.

**Specification**:
- Quests: Active / Claimable / Claimed chips; Claimable additionally renders
  the claim button (pattern 19).
- Forge queue: Fresh / Settling / Purifiable box badges + due countdown
  text ("ready" / "resting · 3 h").
- Tower: Locked (with unlock-condition text) / Unlocked / Cleared.
- Rarity: color + border weight + label (name on focus).

**When to Use**: every enumerated lifecycle state.
**When NOT to Use**: boolean toggles (use a labeled switch).

**Reference**: ui-shell Core Rule 7; meta/equipment/forge/tower UI Requirements.

---

### 16. Vi-VN Number Rendering

**Category**: Data display
**Used In**: Gold, RP, damage, countdowns, any number ≥ 10,000

**Description**: Numbers render in Vietnamese convention from day one: dot
thousand separators (24.500), and signed values carry an explicit sign
prefix.

**Specification**:
- F-UI2 grouping for all integers ≥ 10,000; currency amounts from launch
  (uncapped gold faucet crosses five digits within weeks).
- RP deltas render "+28" / "−14" with explicit sign in the damage-number
  legibility treatment — never a bare number or color-only delta.
- Countdowns read as natural language ("resting · 3 h", "ready"), not bare
  epoch deltas.

**When to Use**: every displayed number.
**When NOT to Use**: damage numerals keep plain digits (display face, no
separators — they are short-lived and scale-differentiated).

**Reference**: F-UI2; meta UI Requirements; ui-shell passthrough rules.

---

### 17. Exit-Only Result Modal

**Category**: Modal
**Used In**: Battle (result), Forge (resolution)

**Description**: Battle's only exit door is its result modal; forge's session
ends in its resolution modal. Modals are focus-contained; the onward route is
a stated choice, never an implicit dismissal.

**Specification**:
- Focus moves in on open; tab is contained; close restores focus to the
  underlying surface's entry point.
- Battle result: victory/defeat, rewards, **cursed-rune list with the
  words** (not a count), max combo, seed; onward buttons → forge / → Home.
- Forge resolution: verdict + payoff (stone-granted animation with static
  variant, per-card next-due times, or failure with returned runes).
- Ranked forfeit notice renders inside the result modal with the −14 stated
  plainly (ranked UI Requirements).

**When to Use**: terminal moments of battle/forge sessions.
**When NOT to Use**: never as a mid-session interruption (banners/overlays
of patterns 4/5 handle those).

**Reference**: battle UI Requirements (result modal row); forge UI Requirements; ui-shell Core Rule 3.

---

### 18. Persistent Disclosure Label

**Category**: System state
**Used In**: Ranked match banner, League screens

**Description**: The ghost-duel disclosure is **required, persistent UI**
(Pillar 4): not dismissible, not tooltip-only. The shell never renders
presence it does not have.

**Specification**:
- Placement: the ranked match banner and every League screen carry the
  label persistently (ranked-league UI Requirements); simulated peers stay
  labeled ("Nhóm #14" pattern).
- Wording is a `fidelity: exact` localization source (ranked-league →
  localization Core Rule 8) — final Vietnamese copy routed to the League
  spec.
- Style: readable body size, contrast-compliant, in the content flow (not
  a faded footnote).

**When to Use**: every surface implying an opponent.
**When NOT to Use**: single-player surfaces with no opponent framing
(tower, forge) — no disclosure needed, none faked.

**Reference**: ui-shell Core Rule 6; opponent-ai UI Requirements; ranked-league UI Requirements.

---

### 19. Claim Button vs Receipt

**Category**: Feedback
**Used In**: Quest board (Home)

**Description**: A Claimable quest renders a **claim button**; a Claimed
quest renders a **receipt**. Claimable invites action; Claimed is history —
they must never look alike (meta UI Requirements).

**Specification**:
- Claimable: primary-action button (≥ 44 px) + reward chip; triggers the
  commit machine (pattern 3) on claim.
- Claimed: reward chip + claimed-state label; button removed, not
  disabled-with-tooltip.
- Active: progress bar + text (pattern 14); no claim affordance.
- Reset boundary: new board at progress 0; expired rewards vanish silently
  (no notification surface at MVP — documented).

**When to Use**: any reward-claim lifecycle.
**When NOT to Use**: one-way states without an action (use pattern 15).

**Reference**: meta-progression UI Requirements; MP-AC27–29 screenshot gates.

---

## Gaps & Patterns Needed

| Gap | Needed By | Owner / When |
|---|---|---|
| Matchmaking surface pattern (queue entry, real elapsed wait, 45 s fallback choice "keep waiting / ghost duel", cancel) | real-pvp (post-MVP) | League (Alpha) spec may stub it; full pattern when real-pvp enters build |
| Settings pattern (reduced-motion manual toggle, TTS rate, mute — post-MVP settings screen) | accessibility doc OQ-AX1 + ui-shell post-MVP toggle | When the settings screen is specced |
| Onboarding/tour pattern (first-session guidance) | Not committed by any GDD at MVP | Only if a GDD adds it — do not invent scope |
| Empty-state spec per data surface (empty forge queue renders the gate reason — pattern 6 covers the control; a full empty-state layout is per-screen work) | Each screen spec | Per-spec, checked by `/ux-review` |
| SFX captioning pattern | Only if the 8-cue post-MVP set lands (OQ-AX1) | With the audio-director consultation |

---

## Open Questions

| # | Question | Owner | Resolution |
|---|----------|-------|-----------|
| OQ-P1 | Final Vietnamese wording for the spell-input normalization hint ("case/spacing forgiven, punctuation significant") — routed to `/ux-design` by speech-io (qa-lead G5) | writer + qa-lead | At the Battle interactions spec |
| OQ-P2 | ARIA live-region verbosity during reveal theater (round verdicts only vs also rune drops) — decides pattern 11's announcement spec | ux-designer + accessibility-specialist | At the Battle HUD spec (mirror of accessibility OQ-AX2) |
| OQ-P3 | Presentation-config initial values (animation durations, breakpoints) — the config file ships with the app scaffold (ADR-0004 story); patterns reference tokens, not seconds, until then | ui-programmer | App scaffold story |
| OQ-P4 | Fast-forward placement in the reveal theater (dedicated control vs any-tap-skips) | ux-designer | At the Battle HUD spec |
