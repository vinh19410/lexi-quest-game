## Review — 2026-11-09 — Verdict: NEEDS REVISION
Review mode: lean · Workflow: standard
Scope signal: L
Specialists: none (lean mode — main-review arithmetic verification ran in-session: F1/F2 recomputed, def-band construction checked, battle B3/B4/B6/B7 burst math cross-checked against battle-system.md)
Blocking items: 3 | Recommended: 2
Summary: Cross-contract work is strong — FS16/OQ-BS4 close cleanly, the def-band-120 construction verifies exactly, all nine registry constants and the class base blocks match, and burst arithmetic (227/284/240/281/241) reproduces from battle's B3/B4. But the level-0 baseline table's def minima are arithmetically wrong (pinned by an AC that would fail), the progression math contradicts the registry's economy check, and OQ-EQ6 hands battle mislabeled evidence numbers.
Prior verdict resolved: First review
Findings:
- [BLOCKING] Formulas: baseline-table def minima 51/76/59 are not the minimum across the 72 level-0 loadouts — true min is +8 (zero-def weapon + cloak 8 + pet-cat 0) → 38/63/46. EQ5 pins the printed values and fails against the GDD's own F1 and catalog.
- [BLOCKING] Formulas (progression math): "steady-state ≈ 1 stone/day → full catalog ≈ day 60–68" contradicts registry `upgrade_stone` (economy check, 2026-11-09): ~0.5–1/day mature → full catalog ≈ 2–4 months. State the range; move day 60–68 to best case.
- [BLOCKING] Open Questions (OQ-EQ6): "max geared listening strike ≈ 227" contradicts this GDD's own threat check (listening = 240 Wordsmith / 281 Arcane with bow ×1.20; 227 is the vocab-strike figure, or Grammarian's listening at atk 155); "≈ 658–722 across R1/R3/R4" does not reconstruct from the stated components (227 + 240 + 241 = 708; Wordsmith without fast-mult on R1 → 189 + 240 + 241 = 670). These figures are attached as OQ-BS2 evidence for battle's balance pass.
- [RECOMMENDED] Dependencies: "speech-io does not name equipment (its GDD predates this one)" is factually wrong — speech-io names equipment twice (a "forge-srs / equipment / tower | None direct" interactions row and a non-contract list). Substance (no passive contract; owed carry-in) stands; correct the claim.
- [RECOMMENDED] Structure (advisory at `standard`): Player Fantasy and Tuning Knobs sections absent. Fantasy content exists in Overview + Game Feel; Tuning Knobs is worth consolidating — this system is the knob-densest so far (level cap, def band, crit ceiling, time advisory ceiling, 5 passive magnitudes — all already registry candidates).
Reviewed-Content-Hash: design/gdd/equipment.md b9e5689ecb97972b3605da44f3f39057c2b19926
Reviewed-Content-Hash: design/registry/entities.yaml 2c7992545f19f35a84388f7cd1612e90f3d96fe6
Reviewed-Content-Hash: .claude/skills/design-review/SKILL.md a63d8fba9b7142eeb43791f061e2e1533c429b43
Reviewed-Content-Hash: design/gdd/battle-system.md c2e43c6448f74fef60d733fab367ca4ed241dd75
Reviewed-Content-Hash: design/gdd/forge-srs.md fe26a2f762c06d01a7b5503163ba834db21c3c03
Reviewed-Content-Hash: design/gdd/hero-class.md 0742765ec80da476ce96c8052b9b2f7e4a73e4e8
Reviewed-Content-Hash: design/gdd/accounts-backend.md ec728fca822161eb68f2ad27ec55dc87f088d452
Reviewed-Content-Hash: design/gdd/question-content.md abd766eed9daca07b252688c8ca054cac1bca832
Reviewed-Content-Hash: design/gdd/speech-io.md 023f623b63c334ccc806a58c0368166aa86f0b5a

## Revision — 2026-11-09 (same day, findings applied)
All 3 blocking + both recommended findings fixed in `design/gdd/equipment.md`; systems-index #6 → In Review (fresh-session re-review decides Approved).
- **BLOCKING 1 (Formulas baseline def minima)**: 51/76/59 → **38/63/46** (+ per-slot span construction note; EQ5 updated with the same values and reasoning). Verified programmatically: min = zero-def weapon + cloak 8 + pet-cat 0.
- **BLOCKING 2 (progression math vs registry)**: steady-state "≈ 1 stone/day → day 60–68" → **mature 0.5–1/day → full catalog ≈ 2–4 months** (day 60–68 = sustained-1/day best case); Summary's "~2 months" → "~2–4 months"; "saturation at ~week 9" → "≈ months 2–4"; first-item-maxed day 9–13 marked fast-end. Now matches registry `upgrade_stone` (economy check).
- **BLOCKING 3 (OQ-EQ6 mislabeled evidence)**: root cause was the Formulas threat-check atk bullet, fixed there first — the "284" phrasal hit assumed bow atk 173 + the sword's ×1.25 together (unreachable, one weapon slot); Wordsmith's listening 240 omitted the bow's own ×1.20. Corrected per weapon path: bow 227/288/241 → one-cycle sum **756**; sword (atk 150) 258/223/232 → **≈713**; Arcane listening 281. Worked example "hardest hit" → bow listening 288. OQ-EQ6 rewritten with the corrected envelope (756 / 713, both > 600 — conclusion unchanged, stronger). All values re-verified with an exact ROUND_HALF_UP script.
- **RECOMMENDED 4 (speech-io claim)**: "does not name equipment" → corrected (names equipment as a non-contract "None direct" row; owed carry-in unchanged).
- **RECOMMENDED 5 (advisory sections)**: **Player Fantasy** section added after Overview (distilled from Overview/Game Feel — no new design); **Tuning Knobs** section added before Acceptance Criteria (11 knobs with values, safe ranges, affected gameplay, couplings — all registry candidates already existed).
Receipts above are the pre-revision reviewed content; the doc hash now differs by design — next /design-review run does a full re-review (correct behavior).

## Review — 2026-11-09 — Verdict: APPROVED
Review mode: lean · Workflow: standard
Scope signal: L
Specialists: none (lean mode — main-review arithmetic verification ran in-session: all three prior blocking numbers recomputed independently — baseline def minima 38/63/46 from the catalog, burst chain 227/288/241/258/223/232 verified against battle B3/B4/B5 expressions, def-band construction and EC15 cap-7 arithmetic re-derived; registry's 96 entries name-searched across the whole document, 34 hit lines, zero conflicts)
Blocking items: 0 | Recommended: 0
Summary: Fresh-session re-review of the revised document (prior NEEDS REVISION, same day). All 5 prior findings verified as addressed: def minima corrected and pinned by EQ5, progression math now matches the registry's economy check (0.5–1/day → 2–4 months, day 60–68 best case), OQ-EQ6's per-weapon-path evidence reconstructs exactly from battle's B3/B4/B5 (bow 756 / sword ≈713, both > 600 boss HP), the speech-io claim is now accurate, and Player Fantasy + Tuning Knobs added. Completeness 6/6 required at standard (both advisory sections also present); every dependency exists and is bidirectional; cross-contract claims verified verbatim against hero-class (no-mana), battle (snapshot shape, Rule 25 hooks, EC 206 figure), forge (FS16), accounts (AC-C1/C2), question-content (field guarantees) and meta (never-gold). Two nice-to-have notes only (premature "existing ux-patterns" cite; optional cross-seed-uniformity pointer, battle-side).
Prior verdict resolved: Yes — NEEDS REVISION (2026-11-09), all findings applied same day; this re-review confirms.
Findings:
- none
Reviewed-Content-Hash: design/gdd/equipment.md 6b81f574f9d30340a1ba6b6bbab3356d29bc5e67
Reviewed-Content-Hash: design/registry/entities.yaml 2c7992545f19f35a84388f7cd1612e90f3d96fe6
Reviewed-Content-Hash: .claude/skills/design-review/SKILL.md a63d8fba9b7142eeb43791f061e2e1533c429b43
Reviewed-Content-Hash: design/gdd/battle-system.md c2e43c6448f74fef60d733fab367ca4ed241dd75
Reviewed-Content-Hash: design/gdd/forge-srs.md fe26a2f762c06d01a7b5503163ba834db21c3c03
Reviewed-Content-Hash: design/gdd/hero-class.md 0742765ec80da476ce96c8052b9b2f7e4a73e4e8
Reviewed-Content-Hash: design/gdd/accounts-backend.md ec728fca822161eb68f2ad27ec55dc87f088d452
Reviewed-Content-Hash: design/gdd/question-content.md abd766eed9daca07b252688c8ca054cac1bca832
Reviewed-Content-Hash: design/gdd/speech-io.md 023f623b63c334ccc806a58c0368166aa86f0b5a
Reviewed-Content-Hash: design/gdd/game-concept.md 227909cf7f2fd7ac45a6510b3e4fdabf09f997dd
Reviewed-Content-Hash: design/gdd/meta-progression.md 055094dd954982e7c77548e67178e75e8914c7cc
Reviewed-Content-Hash: design/gdd/systems-index.md 02f7f80384b329a3bbf304677ae561fa299b9885
