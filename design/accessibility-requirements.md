# Accessibility Requirements

> **Status**: In Design
> **Author**: autonomous session (ux-designer routing) via `/ux-design`
> **Last Updated**: 2026-11-09
> **Template**: Accessibility Requirements

## Accessibility Tier Definition

This project commits to the **Standard** tier, with WCAG 2.2 Level AA as the
web floor and four standing elevations that several GDDs have already committed
to in writing (see In Scope).

The four tiers, as this project defines them:

| Tier | Meaning |
|---|---|
| **Basic** | Playable with default OS/browser assistive tech; no dedicated accommodations |
| **Standard** | WCAG 2.2 AA baseline: contrast, target sizes, zoom/resize, keyboard completeness, reduced-motion support, screen-reader-navigable menus and flows |
| **Comprehensive** | Standard + full customization (text themes, subtitle styling, input timing options in every mode, deep ARIA live coverage of all real-time presentation) |
| **Exemplary** | Comprehensive + platform certification programs, external user panels, dedicated accessibility engineering |

**Commitment rationale.** LexiQuest is a web-only, reading-heavy bilingual
game (Vietnamese UI, English study content) for learners aged 16–35 — the
dominant barriers are visual (bilingual text legibility on a dark,
gradient-accented scheme) and cognitive (timed comprehension under Pillar 1),
not motor: there are no hold inputs, no simultaneous button combinations, and
the only "action" is recall speed. Standard addresses both dominant barrier
families, and the web platform makes much of the tier nearly free: semantic
HTML reaches OS screen readers, `prefers-reduced-motion` reaches OS-level
motion settings, and browser zoom reaches low-vision users without any
project-built UI. Comprehensive is out of reach for an individual-size team
without a dedicated accessibility engineer, and its largest remaining item —
full live-announcement coverage of the battle reveal theater — is reduced to
an honest partial by the round log instead (see Known Intentional
Limitations).

**In scope — standing elevations, already committed by GDDs:**

- **Reduced-motion full swap table** — every motion effect has a static
  equivalent that keeps the information (`ui-shell.md` § Visual/Audio
  Requirements 2; the information is never removed, only its motion).
- **44 px minimum hit areas** — above the WCAG 2.5.8 AA minimum (24 px);
  standing rule in ui-shell and equipment (`tap-to-hear` targets included).
- **No information by color alone** — rarity = color + border weight + label;
  icons never carry information alone; one hue per meaning family.
- **Untimed learning modes** — Forge sessions render no timer UI; tower
  previews are self-paced study lists; only battle rounds are timed, and the
  timing *is* the measured skill (see Known Intentional Limitations for the
  ranked-mode boundary).
- **Mic-optional ult** — the ult speech interaction is mic path *or* spell
  path with free switch until first submission (`speech-io.md`); pointer,
  keyboard, and voice users all have a first-class route.

**Out of scope (documented below):** full live ARIA coverage of the reveal
theater, TTS voice/rate customization, haptic feedback, and timing extensions
inside ranked battles.

---

## Visual Accessibility

The dark scheme with gradient accents (arcane chrome) makes contrast the
primary visual risk: body text never sits on a gradient background (ui-shell
style constraint), and every text/background token pair must meet WCAG 2.2 AA
— 4.5:1 for body text, 3:1 for text ≥ 24 px (or ≥ 18.66 px bold) and for
non-text UI boundaries.

**Text legibility:**

- Body/Vietnamese copy renders in Be Vietnam Pro (full diacritic coverage);
  display numerals and Latin display strings in Chakra Petch. Vietnamese
  diacritics always render in Be Vietnam Pro — never in the display face.
- All text must remain readable at 200 % browser zoom and 200 % text-size
  settings without loss of content or function (WCAG 1.4.4/1.4.10); layouts
  reflow to a single column at phone width by design.
- Minimum rendered body size on phone: 16 px CSS; damage numbers and timed
  readouts (the speed multiplier) use the display face at sizes that survive
  200 % zoom.

**Color-as-only-indicator audit** (every row must keep its non-color backup
through implementation; palette: emerald/coral/gold/cyan/violet/indigo, one
hue per meaning family):

| Location | Color Signal | What It Communicates | Non-Color Backup | Status |
|----------|-------------|---------------------|-----------------|--------|
| Fighter HP/shield bars | Emerald health, cyan-tinted shield | Remaining health/protection | Numeric values on the bars; shield bar has capped-display label | Not Started |
| Mana gate marker (90) | Gate marker on the mana bar | Ult availability threshold | Marker glyph + "Sẵn sàng" state label when crossed (never color-only — "why didn't my ult fire" must never be a mystery) | Not Started |
| Speed multiplier | Hue-weight shift as it decays | Hesitation cost (Pillar 1) | Numeric readout (`1.30× → 1.00×`) always visible | Not Started |
| Equipment rarity | Rarity hue (equipment token set) | Item quality tier | Border weight + rarity label (name on hover/focus) | Not Started |
| Quest board states | Chip color Active/Claimable/Claimed | Quest lifecycle | Distinct state labels; Claimable renders a claim *button*, Claimed renders a receipt | Not Started |
| Tower floor entries | Locked/Unlocked/Cleared tint | Encounter availability | F1 state text + F2 progress bar (text + bar, never bar alone) | Not Started |
| Correct/wrong answer flash | Emerald / coral | Answer outcome | Round-log entry with time taken and effect; wrong answers also render the cursed-rune loot framing (calm, not shame) | Not Started |
| Crit / ultimate moments | Same hues, larger scale/framing | Enhanced damage event | Round-log crit flag; label + scale differentiation (never new hues) | Not Started |
| Hero vs ghost identity | Avatar styling | Which combatant is which | `display_name` + class icon + persistent ghost-duel disclosure in ranked | Not Started |
| RP/demotion zones | Zone divider placement | Promotion/demotion cuts | Labeled dividers ("promotion zone after rank 5", "demotion before bottom 3") + RP column values | Not Started |

---

## Motor Accessibility

There are no hold-duration inputs, no multi-button chords, and no pointer-only
interactions anywhere in the design; the motor surface is target acquisition
and typing. The standing 44 px hit-area rule covers the primary risk.

Requirements:

- **Keyboard completeness** — every flow (auth, onboarding, class pick, home,
  battle, forge, tower, inventory, league, settings) is operable with
  keyboard alone: visible focus, logical focus order, no keyboard traps,
  modal focus containment and restoration. The spell path is a text field;
  the ult path picker switches from keyboard.
- **Touch targets ≥ 44 px** on phone and desktop pointer alike (standing
  rule; includes hint panels, replay control, claim buttons, tower entries).
- **No hover-gated information** — hover reveals are progressive enhancement;
  every hoverable surface exposes the same content on focus/tap.
- **One-hand / single-pointer viability** — all interactions are single
  taps/clicks or typing; no drag gestures at MVP.
- **Shake/tilt/motion inputs**: none.
- **Timing policy** — battle timing is the measured skill (Pillar 1) and is
  not an accessibility extension target inside ranked (integrity; see Known
  Intentional Limitations). Forge sessions render no timer; tower previews
  and the round log are self-paced; every timed surface outside ranked keeps
  untimed or replayable access to the same information.

---

## Cognitive Accessibility

The 10–20-minute session design and the daily-quest cadence already bound
cognitive load; the risks are state tracking during battle and anxiety under
timed comprehension.

Requirements:

- **Round log as causal record** — the battle log is the round-by-round
  record (time taken, effect, crit flag, rune drop); it stays readable in
  the result modal, so a battle never needs to be re-played to be understood.
- **Result framing** — failure states route into Pillar 2's loot framing
  (cursed runes are materials); wrong answers never render as punishment
  (ui-shell: "wrong answers read as loot, not shame").
- **Repeatable onboarding** — the class pick screen states permanence before
  the confirm action and requires an explicit confirm; tower previews
  re-render the full study list on every attempt; nothing tutorial-critical
  is shown exactly once.
- **Plain-language states** — due countdowns read as "ready" / "resting · 3 h";
  offline, session-expiry, and retry states render explicit Vietnamese copy
  with the recovery action inline (re-login preserves the pending commit).
- **Honest-system disclosure** — the ghost-duel disclosure is required,
  persistent UI in ranked (Pillar 4); no fabricated presence for the player
  to decode.
- **Consistent event rendering** — the same event renders identically
  regardless of hosting screen (a rune drop looks the same in battle and in
  the forge queue).
- **Bounded simultaneity** — during a round the player tracks one question
  and at most three bars (own HP/shield/mana, mirrored opponent HP); the
  round log, not working memory, carries history.

---

## Auditory Accessibility

MVP ships **silent except TTS** (ui-shell audio stance): no music, no SFX.
The guiding principle — every sound that changes what the player should do
next has a visual equivalent — is therefore trivially satisfied at MVP and is
bound into the post-MVP work: the candidate 8-cue set may only land with (a)
a global mute toggle and (b) no visual effect depending on audio readiness —
the silent build must remain fully playable.

**TTS (gameplay-critical audio) audit:**

| Sound | What It Communicates | Visual Backup | Caption Required | Status |
|-------|---------------------|--------------|-----------------|--------|
| Listening-question TTS (`tts_text`, en-US, rate 0.85) | The question itself (L1 mode) | IPA fallback panel in L2 mode is the deaf/hard-of-hearing equivalent of L1; replay control always visible | No — text/IPA route is first-class, not a caption | Not Started |
| TTS replay | Same audio, re-heard | Replay control state + "tap to hear" affordance | No — control is visual | Not Started |
| Mic capture beat | Mic is listening/scoring | Active-state visual (listening pulse) + non-motion variant under reduced motion (static border + label) | No — fully visual | Not Started |
| Mic denied / unavailable | Ult mic path is blocked | Spell path remains; explicit permission-denied copy | No — fully visual | Not Started |

TTS failure degrades to the text route (speech-io degraded mode) — a player
who cannot or does not use audio is never locked out of any content.

---

## Platform Accessibility API Integration

Web platform — no console certification programs apply. The floor is the
browser/OS assistive stack:

| Mechanism | Requirement |
|---|---|
| Semantic HTML | Buttons are `<button>`, inputs are labelled (`<label>`/`aria-label`), headings structure each screen; native elements before ARIA |
| WAI-ARIA | Round-verdict and status messages announced via `aria-live="polite"` (round result, commit failure/retry, session expiry); decorative icons `aria-hidden`; icon-only controls get accessible names |
| Focus management | Screen changes and modals move focus deliberately (modal open → first focusable, close → restoring element); skip-to-content link on shell screens |
| `prefers-reduced-motion` | Drives the ui-shell swap table (static equivalents); the manual settings toggle lands post-MVP |
| `prefers-contrast` / forced-colors | Custom palette must not break forced-colors mode: state survives on borders/labels alone (the no-color-alone rule already requires this) |
| Zoom / text resize | No viewport meta that blocks pinch-zoom; layouts usable at 200 % zoom |
| `lang` attributes | Root `vi-VN`; English study content (terms, TTS strings, tier display names) wrapped in `lang="en"` spans so screen readers pronounce it correctly — a bilingual-content requirement, not decoration |
| Mobile screen readers | VoiceOver (iOS) and TalkBack (Android) are the verification targets (phone-first target profile) |

Form errors (auth inline validation) associate with their inputs via
`aria-describedby` and mirror the server's rules (AC-A3/A4), with the generic
registration-failure message per Edge Case 8.

---

## Per-Feature Accessibility Matrix

| System | Visual Concerns | Motor Concerns | Cognitive Concerns | Auditory Concerns | Addressed | Notes |
|--------|----------------|---------------|-------------------|------------------|-----------|-------|
| battle-system | Bars vs labels; speed-mult hue decay; reveal-theater motion | Recall-speed timing (the skill, not an input demand); 44 px answer options | Round log carries history; reveal delays visible | Silent at MVP | Partial | Reduced-motion swap table covers all motion rows |
| ui-shell | Dark scheme contrast; gradient chrome | Keyboard completeness; focus management; 44 px | Consistent event rendering; owned failure framing | Shell renders TTS control only | Partial | Owns the global standing rules this document elevates |
| speech-io | IPA panel prominence (L2) | Mic OR spell path; replay target size | Ult path free switch until submit | TTS = primary audio; text route first-class | Yes (design) | Degraded mode keeps non-audio players unblocked |
| question-content | Render-complete payloads (no placeholder strings) | None (payload only) | Glosses (`vi_meaning`) on every term; synonym warning | `tts_text`/`ipa` supplied for listening | Partial | Content-side of the bilingual legibility requirement |
| opponent-ai | Ghost vs hero identity | None (display only) | Ghost-duel disclosure = required UI (Pillar 4) | None | Yes (design) | Honesty disclosures reduce decode burden |
| accounts-backend | Offline/expiry states need explicit copy | Form error association; typing-only auth | Generic failure message (EC8); re-login preserves context | None | Partial | Session-expiry prompt with return-to-context |
| equipment | Rarity = color + weight + label; hint panels readable | 44 px hint targets; toggle-revealable passives | Hint text screen-reader-readable | Tap-to-hear = TTS replay control | Yes (design) | No MVP item gates information behind color alone |
| forge-srs | Box badges + due countdown labels | Untimed 3-card session; 44 px cards | Wrong answers return as materials (calm); progress pips 1/3 | None | Yes (design) | No timer UI is the timing-policy anchor |
| tower | Locked/Unlocked/Cleared = text + tint | 44 px floor-map entries | Preview = repeatable study list | None | Yes (design) | Floor state never bar/tint alone |
| meta-progression | Quest states labeled; vi-VN number grouping | 44 px claim targets | Claimable vs Claimed distinct; streak glanceable | None | Partial | Reset boundary silent by design (no notification surface at MVP) |
| ranked-league | Zone dividers labeled; tier badges bilingual | 44 px queue/entry | Forfeit −14 stated plainly; settling state explicit | None | Partial | Tier colors carry bilingual names per prototype |
| hero-class | Class accent ≠ identity-only (name + icon) | 44 px class cards; explicit confirm | Permanence stated before confirm; comparable stat blocks | None | Yes (design) | No accidental picks |
| localization | Fixed vi-VN; bilingual tier names | None | Consistent copy = predictable states | None | Partial | `lang="en"` spans are a localization+AT joint requirement |
| analytics | None (no screens) | 44 px opt-out toggle | Opt-out behavior immediate + explained | None | Yes (design) | One toggle on registration/profile screens |
| real-pvp (post-MVP) | PvP HUD mirror; disconnect banner | 45 s fallback choice is a real decision — generous targets | Draw verdict alongside win/loss; honest queue copy | None | Not Started | Rows go Partial at spec time |

---

## Accessibility Test Plan

- **Automated (CI, per screen spec):** axe-core runs in the vitest suite for
  every screen with a UX spec; violations at `serious`/`critical` are
  blocking for that screen's UI ACs. Contrast token pairs are checked once
  against the palette (the token set is finite — check tokens, not pages).
- **Manual internal (pre-production):** keyboard-only pass of every core
  flow; 200 % zoom pass on battle + home; `prefers-reduced-motion` pass
  verifying the full swap table; VoiceOver (iOS) and TalkBack (Android)
  smoke on auth → class pick → one battle; forced-colors spot check.
- **User testing:** post-MVP, with players who use assistive tech; internal
  impairment simulation is explicitly *not* a substitute and is labelled as
  orientation only.
- **Regression:** any AC citing this document re-runs the relevant automated
  check; the swap-table rows each get a screenshot pair (motion/static) in
  `production/qa/evidence/`.

---

## Known Intentional Limitations

| Feature | Tier Required | Why Not Included | Risk / Impact | Mitigation |
|---------|--------------|-----------------|--------------|------------|
| Timing extensions / pause inside ranked battles | Comprehensive | Round timing is the measured skill (Pillar 1: "Speed Is Damage"); extending it per-player breaks ranked integrity for everyone else | Players whose disability affects processing speed under pressure compete at a measured disadvantage in ranked | Practice-adjacent surfaces are untimed by design (forge, previews); tower offers replay; ranked is opt-in, never the only progression path; the forfeit window (15 min from battle start) means abandoning never punishes beyond the stated −14, stated plainly |
| Full live ARIA coverage of the reveal theater | Comprehensive | Announcing every reveal step live would flood screen-reader users during the exact window they need for the next question | Screen-reader users get round outcomes after the fact, not mid-theater | Round-verdict announcements (`aria-live` polite) + the persistent round log + result modal carry the complete causal record; the *input* moment (question, options) is fully announced |
| TTS voice/rate customization | Comprehensive | System TTS voices vary by platform (speech-io); custom synthesis settings are post-MVP settings work | Listening-heavy players with specific rate/comprehension needs get one rate (0.85) | IPA panel + full text route are always available; L2 mode exists exactly for this; replay control is unlimited |
| Haptic feedback | Exemplary | Web haptics are unreliable across browsers; MVP is silent (no cue set to mirror) | Deaf players get no haptic channel — mitigated by the fact that nothing gameplay-critical is audio-only | None needed at MVP (silent build fully playable); revisit with the post-MVP cue set |
| Light theme / text-theme customization | Comprehensive | Dark scheme is the global visual identity; theme system is post-MVP | Low-vision players needing light/high-contrast themes use OS forced-colors instead | Forced-colors support is in scope (state survives on borders/labels); OS-level zoom and text resize supported |
| Guest access (no account) | Product decision, not a tier item | accounts-backend AC-A1: no guest entry point anywhere | Not an assistive-tech barrier; noted because it gates first contact | None — explicit product decision recorded in the GDD |

---

## Audit History

| Date | Auditor | Type | Scope | Findings Summary | Status |
|------|---------|------|-------|-----------------|--------|
| 2026-11-09 | Internal — `/ux-design` (autonomous session) | Initial authoring | Tier commitment + all sections from the 15 approved GDDs | Standard tier committed; 5 standing elevations grounded in existing GDD commitments; matrix: 7 systems Yes (design), 7 Partial, 1 Not Started (real-pvp, post-MVP); 6 intentional limitations documented | Complete (initial) |

---

## External Resources

- WCAG 2.2 (W3C Recommendation) — the AA baseline cited throughout
- WAI-ARIA Authoring Practices Guide (APG) — dialog, live-region, and
  disclosure patterns referenced by Platform API Integration
- MDN: `prefers-reduced-motion`, `prefers-contrast`, forced-colors mode
- axe-core rules documentation (the automated CI checker)

---

## Open Questions

| # | Question | Owner | Deadline | Resolution |
|---|----------|-------|----------|-----------|
| OQ-AX1 | Do SFX land post-MVP (8-cue candidate) — game-concept has SFX `INTENT UNKNOWN` | project-owner | Before the audio-director consultation | Unresolved — ui-shell audio stance carries the plan either way |
| OQ-AX2 | ARIA live-region verbosity on battle rounds (round verdicts only, or also rune drops?) | ux-designer + accessibility-specialist | At the battle HUD UX spec | Unresolved |
| OQ-AX3 | Forced-colors verification on Windows High Contrast (browser-dependent rendering) | qa-lead | First manual accessibility pass | Unresolved |
| OQ-AX4 | `technical-preferences.md` platform block — filled by hand this session (web-only, touch+KB/M, primary touch); confirm `/setup-engine` ownership is not violated | technical-director | Next `/setup-engine`-adjacent session | Resolved 2026-11-09 — filled with confirmed game-concept facts only |
