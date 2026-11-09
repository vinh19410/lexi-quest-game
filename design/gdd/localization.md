# Localization

> **Status**: In Design
> **Author**: user + design-system agents (localization-lead, systems-designer, qa-lead)
> **Last Updated**: 2026-11-09
> **Last Verified**: 2026-11-09
> **Implements Pillar**: Pillar 4 (Honest Ghosts — disclosure copy exact); Pillar 3 (Knowledge Is Gear — the English content layer stays intact)

## Summary

localization is the Polish-layer system that turns ui-shell's MVP copy
discipline (extraction keys, Vietnamese-first, vi-VN number formatting) into
a complete, build-gated string catalog — the mechanism that makes every word
the player reads deliberate. Its language stance is two-layer: Vietnamese UI
chrome, English study content scaffolded with question-content-owned
Vietnamese glosses that localization exposes but never edits. It owns the
key catalog (immutable keys, authored-value release gate F1 at 100% vi-VN
coverage, EN-placeholder fallback that never renders a raw key), three build
formulas (F1 coverage, F2 length-ratio truncation warning, F3
honesty-copy uniqueness for the Pillar-4 disclosure strings), and the
promotion of ui-shell's no-hardcoded-strings sweep to a release-blocking
gate. No new screens, no second locale at Alpha, no server-authored copy;
16 acceptance criteria (3 unit / 8 integration / 3 screenshot / 2 manual /
0 statistical) cover all 11 core rules, all 15 edge cases and all 3
formulas.

> **Quick reference** — Layer: `Presentation` · Priority: `Alpha` · Key deps: ui-shell (hard), question-content (hard), ranked-league + accounts-backend + 6 further copy-meaning owners (wording owned upstream, keyed here)

## Overview

localization is the Polish-layer system that makes every word the player reads
deliberate. LexiQuest's audience is Vietnamese learners of English
(game-concept Player Profile), and the game's language stance is two-layer:
**UI chrome is Vietnamese** — navigation, buttons, labels, errors, gating
reasons, disclosure copy — while **study content is English**, because the
English is the learning material, scaffolded with Vietnamese glosses owned by
question-content (`vi_meaning`). localization owns the *mechanism*, not the
words: the stable extraction-key catalog every upstream system writes copy
against (the discipline ui-shell Core Rule 8 established at MVP becomes a
complete, build-gated vi-VN catalog at Alpha), the fallback behaviour when a
key is missing, the build gates that keep the catalog honest, and the locale
data rules (vi-VN number grouping inherited from ui-shell F-UI2, plural
handling, placeholder interpolation) that a future locale would plug into. The
player never sees the system — they see a game that speaks Vietnamese wherever
the game itself speaks, and English wherever English is the lesson.

A player interacts with this system only passively: they read Vietnamese UI,
see tier names rendered bilingually ("Gold League"), and study English content
with Vietnamese scaffolding. Without localization, the game loses three things:
copy rots into hardcoded strings that drift per surface (ui-shell UI-AC21's
static sweep stops being enforceable as a release gate), the honesty copy
Pillar 4 depends on gets paraphrased inconsistently across screens, and no
future locale is possible without a rewrite.

**Cross-reference**: this matches the systems index #13 description —
"Vietnamese UI strings + EN content with VI glosses as an extraction
discipline" — exactly.

## Detailed Design

### Core Rules

1. **Copy ownership boundary.** localization owns the string catalog (key →
   per-locale value files) and the extraction, fallback and gate machinery
   around it. It owns no screen, no game rule, no number, and no sentence's
   *meaning*: every player-facing copy's meaning originates in an upstream
   system's GDD (ui-shell owns chrome copy inventory, ranked-league owns the
   ghost-duel disclosure wording, forge owns gate copy semantics, …). In this
   GDD "owning copy" means owning the catalog entry and its integrity —
   localization may reject an entry that violates catalog rules (interpolation
   shape, length, bilingual pattern) but never rewrites meaning.
2. **Extraction keys are immutable contracts.** Keys are dot-separated and
   surface-anchored (`battle.hud.combo_badge`, `home.quest.claimable_cta`,
   `ranked.disclosure.ghost_duel`). Once a key ships it never changes meaning
   and is never renamed in place: a rename is deprecate-old + add-new +
   migration entry. Keys are referenced by component code, tests and the
   entity registry — an in-place rename silently breaks all three, which is
   why the discipline exists.
3. **One locale ships at Alpha: vi-VN, complete.** Every reference key must
   resolve to an **authored** vi-VN value in the shipped build (F1 gate) —
   non-empty *and not* the EN placeholder it was drafted with. A key whose
   correct Vietnamese genuinely is the English string (proper nouns, brand
   terms) carries `keep_en: true` and is exempt from the placeholder test
   only. English placeholder strings left over from MVP (ui-shell Core Rule 8
   shipped keys with EN placeholders) are catalog debt: the Alpha goal is
   their elimination, and a key still carrying its EN placeholder as its
   vi-VN value is a build warning that becomes a release failure.
4. **Missing-key fallback.** Build time: a reference key with no vi value is a
   hard failure in release builds and a warning in dev builds. Runtime: a key
   with no vi value renders the catalog's fallback value (the EN placeholder)
   rather than the raw key — a player never sees
   `home.quest.claimable_cta` rendered as text. The miss is logged for the
   sweep; the release gate makes this path unreachable in shipped builds.
5. **Formatting is inherited, never redefined.** vi-VN digit grouping (ui-shell
   F-UI2), the due countdown format, RP sign prefixes ("+28" / "−14"), the
   combo badge — localization consumes these as locale-data rules and creates
   no per-surface formats. Interpolated strings carry `{token}` placeholders so
   every number passes through the shared formatter *before* insertion;
   concatenating translated fragments around a number is forbidden (it is how
   "24.500" becomes "24.5" or "1.000" becomes "1,000" in one surface only).
6. **Content English is never localized away.** Question stems, answer options,
   glossary headwords, tower module text stay English — that content is the
   product being learned. Vietnamese glosses are question-content-owned
   (`vi_meaning`); localization surfaces them as keyed content fields but never
   authors or edits a gloss value. A catalog change that alters a gloss is a
   conflict with question-content — surfaced, never applied.
7. **Bilingual surfaces follow the pair rule.** Where the prototype renders
   English alongside Vietnamese (tier names: "Gold League" — ui-shell Core
   Rule 8), the catalog carries both parts as one key with a defined pair
   pattern (VI label + EN term inside one string template). Which surfaces
   pair is owned upstream and recorded in the catalog; pairing is never
   improvised per surface.
8. **Honesty copy is translated exactly once.** Pillar-4 disclosure copy (the
   ghost-duel label, offline and unsaved banners, gating reasons) has exactly
   one catalog entry each, referenced by every surface that shows it;
   per-surface paraphrase is a build-time duplicate-content warning. These
   keys are flagged `fidelity: exact` — review requires the disclosure's
   meaning preserved with no softening, because the disclosure is the honesty
   contract (ui-shell Core Rule 6, ranked-league UI Requirements). A
   duplicate normalized disclosure string among `fidelity: exact` keys is
   release-blocking (F3), not merely a warning.
9. **No truncation.** No surface may clip catalog copy: layouts size to the
   longer of the vi and EN strings (Vietnamese chrome typically runs ~10–20%
   longer than the EN placeholder), and ellipsis/truncation of player-facing
   copy is a spec violation (inherits ui-shell's responsive rules).
10. **No server-authored copy.** accounts-backend sends codes, not sentences;
    every server-originated message renders through a key mapped from the
    code. Rendering a raw server string is forbidden — server text is not
    trusted copy (security stance) and cannot be catalog-governed.
11. **The key sweep is a release gate.** The static no-hardcoded-strings sweep
    (ui-shell UI-AC21) becomes a release-blocking check owned here: a build
    containing a player-facing literal string fails. Dev builds warn.

### States and Transitions

Each catalog key moves through one lifecycle; the catalog itself has a locale
state per locale.

| Key state | Meaning | Transitions |
|---|---|---|
| Draft | Key exists with EN placeholder + context note; no vi value | → Translated (vi value authored); → Deprecated |
| Translated | vi value present, not yet reviewed | → Reviewed (passes review); → Translated (review rejection — value corrected); → Deprecated |
| Reviewed | Passed gloss/fidelity review (`fidelity: exact` keys checked against the owning GDD's wording) | → Shipped (included in release gate); → Deprecated |
| Shipped | In the released catalog; immutable in meaning | → Deprecated only |
| Deprecated | Superseded by a rename; excluded from F1's reference set; value retained for migration window | terminal |

| Catalog locale state | Meaning |
|---|---|
| vi-VN: Shipped | The only shipped locale at Alpha; F1 gate at 100% |
| (future locale): Scaffolded | Catalog structure accepts n locales; no second locale ships at Alpha — a Scaffolded locale has no release path (F1 gate is per-shipped-locale) |

### Interactions with Other Systems

**Upstream — hard:**

| Dependency | Nature | Interface |
|---|---|---|
| ui-shell | The key contract. ui-shell established extraction-keyed copy (Core Rule 8), vi-VN formatting (F-UI2), the bilingual tier-name pattern, and the no-hardcoded-strings sweep (UI-AC21); localization formalises that discipline into the gated catalog ui-shell renders from | Key inventory (surface-anchored keys), F-UI2 consumed as locale data, UI-AC21 sweep becomes this GDD's release gate (Core Rule 11) |
| question-content | Content gloss ownership | `vi_meaning` (and the glossary's VI fields) are keyed content fields; localization exposes, never edits (Core Rule 6) |

**Upstream — copy-meaning owners (their GDDs own the wording; localization
keys it):**

| Dependency | Nature | Interface |
|---|---|---|
| ranked-league | Ghost-duel disclosure wording lives in ranked's UI Requirements; keyed here as `fidelity: exact` | Disclosure strings, forfeit notice wording |
| accounts-backend | Server error codes map to keys; offline/unsaved/session-expired copy semantics live there | Error-code → key mapping table; no raw server text (Core Rule 10) |
| battle, forge-srs, tower, meta-progression, equipment, speech-io, hero-class, opponent-ai | Own the *meaning* of their surfaces' copy (gating reasons, hint text, passive descriptions, cast/fizzle wording) via ui-shell's contract tables | Their copy arrives keyed through ui-shell; localization never invents wording an upstream GDD has not specified |

**Downstream dependents:** none designed. (analytics, Full Vision, would tag
events with locale — noted as a future consumer, not an interface.)

**Bidirectionality:** ui-shell names localization as a downstream dependent
(Dependencies table + Core Rule 8) ✅. question-content names localization in
its Dependencies downstream-dependents table (Alpha / Soft row: gloss
semantics owned there, keyed fields consumed here) ✅.

## Formulas

> Proposed by `systems-designer` (Lean retained the specialist for this
> HIGH-risk section). Every formula is **build-time checkable** — this system
> owns no runtime game math; fallback behaviour and formatting are pass/fail
> disciplines (Core Rules 4–5, 10–11), verified by acceptance criteria, not
> computed here.

### F1 — `locale_coverage` (vi-VN release gate — Core Rules 3 + 4)

The `locale_coverage` formula is defined as:

`coverage(L) = |{ k ∈ R : vi(k) ≠ ∅ ∧ ( vi(k) ≠ en(k) ∨ keep_en(k) ) }| / |R|`

`release gate (vi-VN): coverage(L) = 1.0` · derived: `en_placeholder_debt = |R| × (1 − coverage(L))`

"Resolved" means an **authored** vi value — non-empty *and not* the EN
placeholder. A key whose correct Vietnamese genuinely is the English string
(proper nouns, brand terms) carries the catalog flag `keep_en: true` and is
exempt from the placeholder test only. A key with `vi(k) == en(k)` and no flag
counts as unresolved: it passes "non-empty" but is still placeholder debt.

**Variables:**

| Variable | Type | Range | Source | Description |
|----------|------|-------|--------|-------------|
| `R` | set (int cardinality) | ≥ 1 | catalog build (extraction step) | Reference key set — all keys referenced by component code, excluding `Deprecated` keys |
| `vi(k)` | string | ∅ or non-empty | vi-VN value file | Vietnamese value for key k |
| `en(k)` | string | non-empty | EN placeholder in catalog | English placeholder for key k (Draft contract: placeholder + context note) |
| `keep_en(k)` | bool | true/false | catalog flag | Proper-noun exemption — vi intentionally equals en |
| `coverage(L)` | float | [0.0, 1.0] | calculated | Fraction of reference keys carrying an authored vi value |
| `en_placeholder_debt` | int | 0 – \|R\| | calculated | Keys missing vi, or still carrying their EN placeholder as the vi value |

**Output Range:** [0.0, 1.0] by construction; no clamping. Release builds
fail hard below 1.0; dev builds warn and log `en_placeholder_debt` for the
Alpha burndown. The gate threshold is **not tunable below 1.0** — lowering it
defeats Core Rule 3. An Alpha-sprint coverage checkpoint (0.90 → 0.97 → 1.0)
is a schedule aid, never the gate. Note: F1 counts *authored* values; the
separate release condition "every reference key in state Shipped" is stated
as acceptance criteria (AC-LC2), not here.

**Example:** release catalog has 340 reference keys; 312 have authored vi
values, 20 still carry their EN placeholder, 8 have no vi value →
`coverage = 312/340 = 0.918`, `en_placeholder_debt = 28` → dev warning,
release build fails. After authoring the 28: `coverage = 1.0` → gate passes,
debt 0.

### F2 — `vi_en_length_ratio` (truncation warning — Core Rule 9)

The `vi_en_length_ratio` formula is defined as:

`ratio(k) = len(vi(k)) / max(len(en(k)), 1)`

`build warning: ratio(k) > r_max → flag key k for the long-string layout check`

A **soft warning** steering the screenshot QA pass — never a release gate:
clipping is only provable visually (repo testing standards: Visual/UI gates
are screenshots). One-sided: shorter-than-EN Vietnamese is never a clipping
risk. `max(len(en), 1)` guards division by zero should an empty placeholder
slip past validation (which already fails the Draft contract).

**Variables:**

| Variable | Type | Range | Source | Description |
|----------|------|-------|--------|-------------|
| `vi(k)` | string | non-empty | vi-VN value file | Vietnamese value |
| `en(k)` | string | non-empty | EN placeholder | English placeholder |
| `len(s)` | int | ≥ 0 | calculated | Code-point count |
| `ratio(k)` | float | [0, ∞) | calculated | Vietnamese length per EN length for key k |
| `r_max` | float | safe 1.3–2.0; default **1.5** | catalog config (tunable) | Warning threshold |

**Output Range:** unbounded above; no clamping — an extreme ratio is a
signal, not an error. Safe-band rationale: at `r_max = 1.2` roughly half the
catalog flags (Core Rule 9's "~10–20% longer" is descriptive of the typical
band, not a threshold — citing it as a gate trains everyone to ignore the
warning); at `r_max = 3.0` a 3× string passes unflagged and clips a fixed HUD
region, caught only by screenshots. 1.5 sits between: above the typical band
so legitimate strings pass, low enough to catch outliers.

**Example:** `en = "Claim reward"` (12 chars), `vi = "Nhận phần thưởng"`
(16) → 1.33 → no warning. `en = "You must clear the previous floor first"`
(39), `vi` = 66 chars → 1.69 > 1.5 → warning: run the HUD width +
long-string screenshot check before release.

### F3 — `honesty_copy_instances` (uniqueness gate — Core Rule 8)

The `honesty_copy_instances` formula is defined as:

`instances(s) = |{ k ∈ D : norm(vi(k)) = norm(s) }|`

`gate: instances(s) = 1 for every disclosure string s; duplicate_strings = |{s : instances(s) > 1}| = 0`

**Variables:**

| Variable | Type | Range | Source | Description |
|----------|------|-------|--------|-------------|
| `D` | set (int cardinality) | ≥ 1 | catalog flags | Keys flagged `fidelity: exact` (wording owned by ranked-league, accounts-backend — see Dependencies) |
| `norm(·)` | function | — | catalog config | Normalization: lowercase + whitespace collapse (catches copies differing only in case/spacing) |
| `instances(s)` | int | 1 – \|D\| | calculated | Number of fidelity-exact entries carrying disclosure string s |
| `duplicate_strings` | int | 0 – \|D\| | calculated | Disclosure strings with more than one entry |

**Output Range:** `duplicate_strings` ∈ [0, \|D\|]; gate is 0. Escalated
from Core Rule 8's general warning to **release-blocking for
`fidelity: exact` keys** — a paraphrase-by-copy of honesty copy is exactly
the Pillar-4 failure this system exists to prevent; dev builds warn. The "1"
is fixed, not tunable (it is the "exactly once" contract); the tunable is the
normalization rule itself. Fuzzy matching (edit distance) is deliberately
rejected — unbounded false positives at catalog scale; softened paraphrases
are the States-table fidelity review's job, not F3's.

**Example:** `ranked.disclosure.ghost_duel` holds "Đối thủ là hồn ma — không
có người thật". A new screen adds `battle.hud.ghost_note` with the same
normalized string → `instances = 2` → build fails naming both keys; the fix
is deleting the duplicate and referencing the canonical key.

### Formulas considered and rejected

- **Separate placeholder-debt formula** — folded into F1 (one population,
  two metrics drift; gate 1.0 ⇔ debt 0 is one statement).
- **Token-set equality** (vi `{token}` set == EN's, Core Rule 5),
  **unmapped server codes = 0** (Core Rule 10), **key-naming regex**
  (Core Rule 2), **sweep pass rate** (Core Rule 11) — static set/pass
  checks with no range or knob; acceptance-criteria material, not math.
- **Plural-category counts** — locale-data configuration; no second locale
  ships at Alpha.
- **Weighted coverage** (counting fidelity keys above ordinary keys) — a
  release gate must stay binary and legible; weighting invites shipping
  partial coverage, contradicting "vi-VN, complete".

## Edge Cases

- **If a shipped (release) build would render a key with no vi value**: the
  build fails instead (F1 gate) — the case cannot reach players. If a patch
  introduces one anyway (gate bypass), the surface renders the EN placeholder
  fallback and logs the miss; the raw key id is never rendered.
- **If a dev build contains a key with no vi value**: build warning; the
  surface renders the EN placeholder fallback so screens stay testable.
- **If code references a key absent from the catalog entirely**: build
  failure — reference keys are derived from a code scan, not hand-maintained,
  so a dangling reference is caught before packaging.
- **If the sweep finds a hardcoded player-facing string**: release build
  fails (Core Rule 11), dev build warns. A string that is legitimately not
  player-facing (a log line, a test fixture) is exempt by an explicit
  annotation, not by being overlooked.
- **If a deprecated key is still referenced after its migration window**:
  build failure listing every referencing surface. During the window it still
  resolves (to its retained value) so a staged migration does not break
  intermediate builds.
- **If a translation is missing a `{token}` its key's reference value has**
  (or adds an unknown token): build failure — interpolation would crash or
  render a broken string; token sets must match exactly per key.
- **If two keys carry identical vi values**: allowed (short chrome like
  "Hủy" legitimately repeats); warning only when at least one of the pair is
  `fidelity: exact` — duplicate disclosure copy is how paraphrase-by-copy
  happens (Core Rule 8).
- **If a catalog edit changes a `vi_meaning` gloss value**: the change is
  rejected at review and surfaced as a question-content conflict — glosses are
  question-content-owned (Core Rule 6). This mirrors question-content's own
  synonym rule: two entries sharing a `vi_meaning` stay question-content's
  warning to make, not localization's.
- **If a future locale is partially translated**: it cannot ship — F1 is
  per-shipped-locale and a Scaffolded locale has no release path; dev builds
  render its fallback. No mixed-locale release exists.
- **If accounts-backend returns an error code with no key mapping**: the
  surface renders the generic keyed error (`errors.generic`), never the raw
  code or server text; the unmapped code is logged for the mapping table's
  next revision (Core Rule 10).
- **If a number reaches a string template unformatted**: that is a bug, not a
  formatting choice — token values pass the shared formatter (F-UI2 grouping)
  before insertion; a static check covers interpolation callsites so "24.500"
  cannot degrade to "24.5" in one surface only.
- **If a vi string does not fit a fixed layout region** (e.g., the battle HUD's
  fixed composition): no truncation and no ellipsis — the copy pair is
  shortened at the copy-meaning owner (the upstream GDD), and the shorter
  value ships through the same key. Layout never clips; wording is fixed
  upstream (Core Rule 9's boundary with ui-shell's fixed compositions).
- **If `fidelity: exact` review finds a disclosure softened or dropped in
  translation**: the key fails review and cannot reach Shipped — the
  disclosure must carry the honesty contract's full meaning (Pillar 4).
- **If a locale data file is missing or fails schema validation at build**:
  build failure — locale data is a build input; the runtime never fabricates
  or repairs catalog values.
- **If a key family is pluralised**: vi-VN inflects no plurals, so a plural
  family carries exactly one vi form and renders it for every count — no
  crash, no stray category suffix. The schema reserves plural families for
  future locales that inflect.

## Dependencies

**Upstream — hard:**

| Dependency | Nature | Interface |
|---|---|---|
| ui-shell | Contract + consumer: the extraction-key discipline, vi-VN formatting and bilingual patterns this system formalises were established by ui-shell Core Rule 8 / F-UI2 / Core Rule 8's tier-name pairing, and ui-shell renders every surface from the catalog this system owns | Key inventory; F-UI2 consumed as locale data (never redefined); UI-AC21's static sweep promoted to a release gate (Core Rule 11) |
| question-content | Content gloss ownership | `vi_meaning` and glossary VI fields exposed as keyed content fields; never edited here (Core Rule 6) |

**Upstream — copy-meaning owners (wording owned in their GDDs, keyed here):**

| Dependency | Nature | Interface |
|---|---|---|
| ranked-league | Ghost-duel disclosure + forfeit notice wording | Keyed as `fidelity: exact` (Core Rule 8) |
| accounts-backend | Commit/offline/session copy semantics; server errors | Error-code → key mapping; no raw server text (Core Rule 10) |
| battle, forge-srs, tower, meta-progression, equipment, speech-io, hero-class, opponent-ai | Own the meaning of their surfaces' copy via ui-shell's contract tables | Copy arrives keyed through ui-shell; localization never invents upstream wording |

**Schema dependency (carries F3's input set `D`):** the `fidelity: exact`
flag is a catalog schema field this system owns, but its population comes
from the copy-meaning owners — a key is flagged `fidelity: exact` when an
upstream GDD owns its wording as honesty copy (ranked-league's disclosure and
forfeit wording, accounts-backend's offline/unsaved/session banners). Until
upstream GDDs enumerate their honesty-copy keys, `D` is provisionally the
keys ui-shell's Core Rule 6 disclosure surfaces reference.

**Hard vs soft:** ui-shell and question-content are hard — without the key
contract and the gloss ownership boundary the catalog has nothing governed to
hold. The eight copy-meaning owners are hard in a weaker sense: their GDDs
already specify the wording; localization cannot function without an owner to
defer to, but no new interface is built for them.

**Downstream dependents:** none designed. analytics (Full Vision) would tag
events with locale — future consumer, not an interface.

**Non-dependencies:** tower/battle/forge gameplay rules (copy reaches
localization only through ui-shell's contract tables, never directly);
question-content's question schemas (only the gloss fields are keyed);
speech-io's scoring (English pronunciation content is learning material, not
UI copy — localization does not "translate" it).

**Bidirectionality:** ui-shell names localization in its Dependencies table
(downstream dependents row) and Core Rule 8 ✅. question-content names
localization in its Dependencies downstream-dependents table ✅ (see Detailed
Design → Interactions).

## Visual/Audio Requirements

> `art-director` not consulted — Lean mode (visual feedback is not this
> system's centre; text rendering is). Review manually before production.

**Text rendering (the one visual requirement this system genuinely owns):**

- **Vietnamese glyph coverage**: the font stack must include precomposed
  Vietnamese glyphs (ư, ơ, ă, ế, ữ, ễ, đ …) in every text style the shell
  uses — no tofu boxes, no last-resort fallback font that shifts metrics.
  A missing glyph is a build-time font-audit failure, not a runtime surprise.
- **Diacritic clearance**: line-height in the shell's text styles must
  tolerate stacked diacritics and descenders ( Việt Nam's ế/ữ pairs render
  fully without clipping against the line above); inherits ui-shell's
  accessibility text-scaling baseline — scaled text keeps its diacritics.
- **Bilingual pair rendering**: pair-pattern keys ("Gold League") render as
  one text run with the pair pattern's defined emphasis (per ui-shell's
  tier-badge treatment), never as two separately-styled strings stitched by
  layout.

**Audio:** none — the silent-MVP audio stance is inherited from ui-shell
(Visual/Audio); there is no localized audio at Alpha. speech-io's English
pronunciation audio is learning material (Pillar 3), not UI audio to be
localized.

## Game Feel

- **Zero missing-text flash**: the shipped locale's catalog is bundled with
  the client — no network fetch sits between a screen mounting and its copy
  appearing. A screen never renders, then re-renders with different
  language.
- **Copy changes are data, not reflows**: where copy is driven by state
  (quest states, commit banners), the text swaps in place; surfaces do not
  resize or re-anchor around a language event at Alpha (there is only one
  locale; the rule exists so a future locale switch inherits a sane
  behaviour: applied at screen transition, never mid-surface).

## UI Requirements

**No new screens at Alpha.** The locale is fixed (vi-VN); there is no
language picker, no locale settings surface, no translation-review screen in
the client (review is a content-pipeline activity, not a player surface). The
existing screen inventory (ui-shell Core Rule 2) is unchanged; its 8-spec
hand-off ladder to `/ux-design` is unaffected.

What changes is what fills the screens: every string is catalog-resolved vi-VN,
with the bilingual pair pattern on tier names and the EN fallback path that
the release gate makes unreachable in shipped builds.

## Cross-References

| Referenced GDD | What is referenced | Sections referencing it |
|---|---|---|
| design/gdd/ui-shell.md | Core Rule 8 (extraction keys, bilingual tier names), F-UI2 (vi-VN grouping), UI-AC21 (no-hardcoded-strings sweep), Core Rules 6/9 (disclosure, fixed compositions), accessibility text baseline, silent-MVP audio stance | Core Rules 5/7/8/9/11, Edge Cases, Visual/Audio, Dependencies |
| design/gdd/question-content.md | `vi_meaning` gloss ownership; synonym warning rule | Core Rules 6, Interactions, Edge Cases, Dependencies |
| design/gdd/ranked-league.md | Ghost-duel disclosure wording, forfeit notice wording (`fidelity: exact` sources) | Core Rule 8, Dependencies |
| design/gdd/accounts-backend.md | Server error codes; commit/offline/session copy semantics | Core Rule 10, Edge Cases, Dependencies |

## Acceptance Criteria

> Proposed by `qa-lead` (Lean retained the specialist for this HIGH-risk
> section); every testability concern it raised is folded in as stated
> preconditions. Legend inherits ui-shell's: [unit] = deterministic, DI-injected
> doubles, home `tests/unit/localization/`; [integration] = build/validation
> tooling or cross-system contract, home `tests/integration/localization/`;
> [screenshot] = retained in `production/qa/evidence/`, BLOCKING; [manual] =
> checklist + lead sign-off, evidence retained. 0 statistical — a static
> catalog system owns zero RNG. **Build-artifact preconditions:** key states
> (Draft/Translated/Reviewed/Shipped/Deprecated) must be machine-readable in
> the catalog build (AC-LC2 enumerates them), and the server error-code set
> must be imported from accounts-backend's contract artifact, never
> hand-copied (AC-LC9).

- **AC-LC1 [integration] — F1's coverage gate counts authored vi values only, and 1.0 is the floor (F1 + Core Rules 3, 4 + E1, E9).** **GIVEN** a fixture catalog of 10 reference keys — 7 with authored vi values, 2 whose vi value still equals its EN placeholder, 1 with no vi value — **WHEN** the catalog build computes coverage, **THEN** coverage = 7/10 = 0.70 and `en_placeholder_debt` = 3; the dev build warns and logs the debt, the release build fails naming all three keys; **and** after authoring the 3, coverage = 1.0, debt = 0 and the release build passes (negative control — the gate is not a detector that always fails); **and GIVEN** a key carrying `keep_en: true` whose vi value equals its EN value, **THEN** it counts as resolved — the exemption covers the placeholder test only, and the key still passes naming, token and schema validation; the same `vi == en` value *without* the flag counts as debt; **and GIVEN** a Scaffolded second locale at partial coverage, **THEN** the vi-VN gate is unaffected (F1 runs per shipped locale) and no second-locale data ships in the release bundle.

- **AC-LC2 [integration] — The second release condition: every reference key sits in state Shipped (States table + Core Rule 3).** **GIVEN** the release-candidate catalog with machine-readable key states, **WHEN** key states are enumerated, **THEN** every key in R (F1's reference set; Deprecated excluded) is Shipped — zero Draft, zero Translated, zero Reviewed — and the release build otherwise fails naming each un-Shipped key with its state; independent of AC-LC1: a key with an authored vi value passes F1 yet can still sit in Translated, and only this check catches it.

- **AC-LC3 [integration] — Catalog integrity: every defect class fails its own gate, and the migration window holds (Core Rules 1, 2, 5 + E3, E5, E6, E14).** **GIVEN** a fixture catalog holding one key per defect class — (a) a name violating the key regex (not dot-separated, not surface-anchored), (b) an empty EN placeholder (Draft-contract violation), (c) a Draft key with no context note, (d) a vi value missing a `{token}` its EN value has, (e) a vi value adding an unknown token, (f) a code reference to a key absent from the catalog, (g) a Deprecated key still referenced after its migration window, (h) a missing or schema-invalid locale data file — **WHEN** validation runs once per defect, **THEN** each fails the build citing its specific gate, file and key (an unrelated earlier failure never counts as the pass) and no catalog is emitted; **and GIVEN** a clean catalog, **THEN** validation passes and emits (negative control); **and GIVEN** a Deprecated key inside its migration window, **THEN** it still resolves to its retained value and the intermediate build passes.

- **AC-LC4 [unit] — Runtime fallback renders the EN placeholder, never the raw key, and logs the miss (Core Rule 4 + E2).** **GIVEN** a DI-injected catalog double missing one referenced key's vi value, **WHEN** a surface renders that key in a dev configuration, **THEN** the EN placeholder value renders (the screen stays testable), the key id never renders as text (property: no DOM text node equals the key string), and exactly one miss is logged naming the key (spy); **and THEN** a release build cannot reach this path — the F1 gate fails the build before packaging (AC-LC1).

- **AC-LC5 [unit] — Every interpolated number passes the shared formatter; no fragment concatenation (Core Rule 5 + E11; consumes F-UI2 per ui-shell UI-AC2).** **GIVEN** the codebase's interpolation callsites, **THEN** a static sweep finds every `{token}` value routed through the single shared vi-VN formatter (F-UI2: blocks of 3 digits joined with '.', applied at n ≥ 1000) before insertion, and no callsite concatenates translated fragments around a raw number; **and GIVEN** a callsite formatting locally (a per-surface grouping copy), **THEN** the sweep fails naming the callsite. F-UI2's arithmetic is asserted by ui-shell UI-AC2 and deliberately NOT re-asserted here.

- **AC-LC6 [integration] — Glosses are exposed, never edited: the catalog and question-content agree exactly (Core Rules 1, 6 + E8).** **GIVEN** the catalog's keyed content fields (`vi_meaning`, the glossary's VI fields) and question-content's payload, **WHEN** compared, **THEN** every keyed gloss value is identical to question-content's value — no drift, no silent "improvement"; **and GIVEN** a catalog edit that changes a gloss value, **WHEN** validation compares against question-content's payload, **THEN** the edit is rejected and surfaced as a question-content conflict naming the key — never applied; duplicate-`vi_meaning` detection between entries stays question-content's warning (its AC-QE2) and is not asserted here.

- **AC-LC7 [integration] — F3: each disclosure string exists exactly once, and no fuzzy matching exists (F3 + Core Rule 8 + E7).** **GIVEN** D, the keys flagged `fidelity: exact`, with normalization = lowercase + whitespace collapse, **WHEN** normalized vi values are compared, **THEN** `instances(s) = 1` for every disclosure string (`duplicate_strings` = 0); **and GIVEN** a second `fidelity: exact` key carrying the same string modulo case/spacing, **THEN** the release build fails naming both keys (dev warns); **and GIVEN** a duplicate where exactly one of the pair is `fidelity: exact`, **THEN** the build warns and passes; two plain keys sharing a value ("Hủy") pass silently; **and GIVEN** two `fidelity: exact` strings differing by only 1–2 characters (a softened variant, not a normalized match), **THEN** F3 passes both — softening is the fidelity review's job (AC-LC8), and the gate contains no edit-distance comparison (static).

- **AC-LC8 [manual] — Fidelity review: a softened or dropped disclosure cannot reach Shipped (Core Rule 8 + States + E13).** **GIVEN** the review checklist and a fixture set of `fidelity: exact` values — the correct ghost-duel disclosure ("Đối thủ là hồn ma — không có người thật": the opponent is a simulated ghost, no human is involved) and softened variants (dropping "không có người thật"; claiming opponents may be human) — **WHEN** fidelity review checks each against the owning GDD's wording restated in the checklist, **THEN** every softened variant fails review and the key is blocked from Translated → Reviewed → Shipped; only the meaning-preserving value passes; checklist results + lead sign-off retained in `production/qa/evidence/`. *(Fixture set provisional on OQ-LC2 — D is ui-shell Core Rule 6's disclosure keys until ranked-league and accounts-backend enumerate theirs.)*

- **AC-LC9 [integration] — Server codes map completely, and the unmappable renders the generic error (Core Rule 10 + E10).** **GIVEN** the error-code set imported from accounts-backend's contract artifact (never hand-copied), **THEN** the code→key mapping covers every code exactly once — unmapped server codes = 0 (static); **and GIVEN** an injected server response carrying a code outside the table, **WHEN** the surface renders, **THEN** the generic keyed error (`errors.generic`) renders and neither the raw code nor any server-originated text reaches the DOM (property: no DOM text node contains the injected code or string), and the miss is logged for the mapping table's next revision (spy).

- **AC-LC10 [integration] — The sweep is release-blocking: Core Rule 11 promotes UI-AC21 (Core Rule 11 + E4).** **GIVEN** the release build pipeline, **WHEN** the no-hardcoded-strings sweep runs (ui-shell UI-AC21's detector, consumed — not reimplemented), **THEN** any player-facing literal string fails the release build, the dev build warns on the same finding, the only exemption is an explicit not-player-facing annotation (log lines, test fixtures), and the annotated set is enumerated in the build output so the escape valve stays auditable; the sweep covers every surface — no per-surface opt-out. Strictly stronger than UI-AC21: the dev-level detector is unchanged; this AC adds the release-blocking gate.

- **AC-LC11 [integration] — F2 flags long strings for the layout check, and only them (F2 + Core Rule 9).** **GIVEN** `ratio(k) = len(vi(k)) / max(len(en(k)), 1)` with `r_max` = 1.5 (tunable 1.3–2.0): en = "Claim reward" (12) with vi 16 chars → 1.33, no flag; en = "You must clear the previous floor first" (39) with vi 66 chars → 1.69 > 1.5, the key is flagged into the long-string layout-check list (AC-LC12's input); a ratio of exactly 1.5 is not flagged (strict >); shorter-than-EN vi never flags (one-sided); a flag is a warning, never a build failure.

- **AC-LC12 [screenshot] — No truncation anywhere, flagged strings first (Core Rule 9 + E12).** **GIVEN** the keys F2 flagged (AC-LC11) rendered on their real surfaces, including at least one fixed-composition surface (the battle HUD region), **THEN** every string renders in full — no clipping, no ellipsis — and the layout sizes to the longer of the vi/EN pair; where a string cannot fit a fixed region, the captured fix is the shortened copy shipped through the same key (wording fixed upstream), never a clipped render. Retained screenshots in `production/qa/evidence/` (one per flagged key's surface; runs against the Alpha content set — before Alpha content lands an empty flag list is "nothing to capture", not a pass).

- **AC-LC13 [screenshot] — Vietnamese renders in the primary font: glyphs and stacked diacritics clear (Visual/Audio + font audit).** **GIVEN** the shell's text styles rendering the glyph battery (ư ơ ă ế ữ ễ đ, and stacked-diacritic pairs like "ế"/"ữ"), **THEN** every glyph renders from the primary font — no tofu, no last-resort fallback shifting metrics — and stacked diacritics and descenders render unclipped at default size and at the scaled-text baseline; the build-time font audit fails on any missing glyph. Retained screenshots (default + one scaled size, per text style).

- **AC-LC14 [screenshot] — Bilingual pairs render as one run per the pair pattern (Core Rule 7 + Visual/Audio).** **GIVEN** a pair-pattern key ("Gold League" — VI label + EN term in one string template), **THEN** the tier surface renders the pair as one text run with the pattern's defined emphasis (per ui-shell's tier-badge treatment), never two separately-styled strings stitched by layout. Retained screenshots; captures may co-discharge UI-AC29's League surfaces where they coincide, but the asserted rule here is the pair pattern, not ranked's semantics.

- **AC-LC15 [manual] — Zero missing-text flash; copy swaps are data, not reflows (Game Feel).** **GIVEN** a playable build with the network disconnected (the catalog is bundled — no fetch in the locale path), **WHEN** each surface mounts from cold start, **THEN** copy appears with the first paint — no render-then-re-render language swap on any surface, verified on a retained screen recording in `production/qa/evidence/`, not by eye alone; **and GIVEN** state-driven copy (quest states, commit banners), **THEN** text swaps in place and no surface resizes or re-anchors around the change. Playtest checklist + lead sign-off.

- **AC-LC16 [unit] — A plural family carries one vi form for every count (Core Rule 5's locale data + E15).** **GIVEN** a plural-family key (EN one/other forms) and counts {0, 1, 2, 5, 1000}, **WHEN** the key renders, **THEN** the single vi form renders identically for every count — no crash, no plural-category suffix, no missing-string path; the schema's plural structure is reserved for future locales and is inert at Alpha.

**Totals: 16 criteria — 3 unit (LC4, LC5, LC16) / 8 integration (LC1, LC2,
LC3, LC6, LC7, LC9, LC10, LC11) / 3 screenshot (LC12, LC13, LC14) / 2 manual
(LC8, LC15) / 0 statistical.** Coverage: one+ criterion per Core Rule
(CR1→LC3/LC6 · CR2→LC3 · CR3→LC1/LC2 · CR4→LC1/LC4 · CR5→LC3/LC5/LC16 ·
CR6→LC6 · CR7→LC14 · CR8→LC7/LC8 · CR9→LC11/LC12 · CR10→LC9 · CR11→LC10),
per formula (F1→LC1 · F2→LC11+LC12 · F3→LC7) and per Edge Case
(E1→LC1 · E2→LC4 · E3→LC3 · E4→LC10 · E5→LC3 · E6→LC3 · E7→LC7 · E8→LC6 ·
E9→LC1 · E10→LC9 · E11→LC5 · E12→LC12 · E13→LC8 · E14→LC3 · E15→LC16).

## Open Questions

- **OQ-LC1 — EN-placeholder debt burndown schedule.** F1 makes the debt
  countable (`en_placeholder_debt`), but the Alpha milestone plan needs the
  cadence: what debt level must each Alpha sprint reach (e.g. checkpoints
  0.90 → 0.97 → 1.0 as a schedule aid)? Owner: producer, Alpha planning.
- **OQ-LC2 — honesty-copy key enumeration.** F3's set `D` is provisional
  (ui-shell Core Rule 6 disclosure surfaces) until ranked-league and
  accounts-backend enumerate their honesty-copy keys in their own GDDs.
  Owner: ranked-league and accounts-backend authors, next edit of each.
- **OQ-LC3 — second locale selection.** No second locale ships at Alpha
  (Scaffolded locales have no release path), but the choice (EN? or
  Vietnamese-learner-market expansion?) drives the plural-family schema
  workload and whether `keep_en` collisions grow. Owner: creative-director +
  producer, Full Vision planning.
- **OQ-LC4 — RESOLVED 2026-11-09.** question-content's Dependencies section
  now carries the localization row (Alpha / Soft: gloss semantics owned
  there, keyed fields consumed here) — bidirectionality closed at this GDD's
  design review.
