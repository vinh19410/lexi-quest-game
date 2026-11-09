# Review Log — hero-class

## Review — 2026-11-09 — Verdict: APPROVED
Review mode: lean · Workflow: standard
Scope signal: S–M (producer should verify before sprint planning)
Specialists: none (lean mode — main review only; systems-designer/qa-lead ran at authoring)
Blocking items: 0 | Recommended: 3
Summary: Foundation GDD in strong shape — exactly 1 formula + constant set with no ownership creep into battle-system, all values registry-synced (0 conflicts across 73 matched lines), 4 open interface items correctly defer battle-owned decisions (timestamps, shield cap, mana rounding), and 16 testable ACs with full coverage map. Recommended (non-blocking): rewrite HC14's universal-quantifier tail clause ("any MVP surface") into an API-rejection test + persistence-layer static check; clarify the `crit` stat's vocab-strikes scope vs the guaranteed-crit any-attack-round scope (or route to OQ1); correct the bidirectional note — accounts-backend.md:62 does mention "hero class" (it just doesn't list hero-class as a dependent). Balance observation for OQ6: each passive has exactly one trigger opportunity per MVP battle by round structure; Wordsmith's is conditional (<3 s) while Grammarian's is near-guaranteed at ≥3 correct — trigger-rate asymmetry is acceptable as identity but should be confirmed at balance pass.
Prior verdict resolved: First review
Findings:
- [RECOMMENDED] Acceptance Criteria: HC14 tail "any MVP surface, API or data path" not independently testable — rewrite as API-mutation-rejection test + static no-write-path check
- [RECOMMENDED] Detailed Rules (stat table): `crit` rolls "on vocab strikes" but guaranteed crit covers "any attack round" — scopes differ without explanation; clarify or route to OQ1
- [RECOMMENDED] Dependencies: "accounts-backend's GDD does not name hero-class" is imprecise — it mentions "hero class" at line 62 but doesn't list it as a dependent
- [NICE-TO-HAVE] Detailed Rules (Core Rule 4): "±1 s spread" is actually +0 to +1 s (values +0.0/+0.5/+1.0)
- [NICE-TO-HAVE] Core Rule 8 vs Dependencies: unify ghost ClassId wording on "display-only at MVP" (stat framing is OQ5)
- [NICE-TO-HAVE] Acceptance Criteria: HC16 folds 3 screenshots into one AC — consider splitting for evidence counting
Reviewed-Content-Hash: design/gdd/hero-class.md 0742765ec80da476ce96c8052b9b2f7e4a73e4e8
Reviewed-Content-Hash: design/registry/entities.yaml 833b7cec76c32057291ded72f8a83c0d8e2f8cbe
Reviewed-Content-Hash: .claude/skills/design-review/SKILL.md a63d8fba9b7142eeb43791f061e2e1533c429b43
Reviewed-Content-Hash: design/gdd/game-concept.md 227909cf7f2fd7ac45a6510b3e4fdabf09f997dd
Reviewed-Content-Hash: design/gdd/accounts-backend.md ec728fca822161eb68f2ad27ec55dc87f088d452
Reviewed-Content-Hash: design/gdd/question-content.md abd766eed9daca07b252688c8ca054cac1bca832
Reviewed-Content-Hash: design/gdd/systems-index.md 2fa7e220f232a2dcc2477aa350d592ce06e4deb8

## Review — 2026-11-09 — Verdict: APPROVED
Review mode: lean · Workflow: standard
Scope signal: S–M (producer should verify before sprint planning)
Specialists: none (lean mode — main review only)
Blocking items: 0 | Recommended: 4
Summary: Full re-review after the 2026-11-09 revision (cross-review D-B1: Arcane passive moved from provably-inert mana multiplier ×1.35 to listening damage ×1.20). Re-scope is internally and cross-document consistent: battle-system B4 consumes `class_listening_damage_mult` 1.20 (1.0 default), mana flat +30/+10 preserved (battle Rule 13 with D-B1 note), registry retains `arcane_listening_mana_mult` correctly as `deprecated` (never-delete). F1 and B4 arithmetic re-verified (102.4 × 1.20 = 122.88 → 123). All 5 dependents bidirectional. 0 registry conflicts across ~60 matched lines. Recommended (non-blocking): OQ1/OQ2 + interface items 1–2 now stale — battle-system's revised GDD resolves the timestamp pair, attack-round crit scope (damage rounds only) and shield pool (no cap/decay at MVP); stat-table `crit` row should adopt battle's resolved scope; HC14 universal-quantifier tail still not independently testable (carried); accounts-backend bidirectional note still imprecise (carried — line 62 does mention "hero class"). Nice-to-have: ±1 s wording, HC9 non-Arcane fixture pin (106.0 only holds at atk 80), "ultimate" vs `ultimate_burst` id, equipment.md:231 misattributes a ≥ −10 note to this GDD.
Prior verdict resolved: Yes — prior APPROVED (2026-11-09) applied to the pre-D-B1 revision; document changed, full re-review performed
Findings:
- [RECOMMENDED] Open Questions/Dependencies: OQ1/OQ2 and interface items 1–2 stale — battle Core Rules 7 & 11 resolve timestamp pair, crit scope (damage rounds only), shield pool (no cap/decay at MVP); mark RESOLVED with pointers
- [RECOMMENDED] Detailed Rules (stat table): `crit` row "on vocab strikes" narrower than battle's resolved crit scope (vocab_strike, listening_pierce, fallback vocab) — update row
- [RECOMMENDED] Acceptance Criteria: HC14 tail "any MVP surface, API or data path" still not independently testable — rewrite as API-mutation-rejection test + static no-write-path check (carried)
- [RECOMMENDED] Dependencies: accounts-backend note still imprecise — accounts-backend.md:62 mentions "hero class"; it only omits hero-class from its dependents list (carried)
- [NICE-TO-HAVE] Detailed Rules (Core Rule 4): "±1 s spread" is actually +0 to +1 s (carried)
- [NICE-TO-HAVE] Acceptance Criteria: HC9's "non-Arcane class → 106.0" only holds for Wordsmith (atk 80); pin the fixture class
- [NICE-TO-HAVE] Naming: "ultimate" in Core Rule 5/HC10/HC12 vs battle's `ultimate_burst` id — unify on schema id
- [NICE-TO-HAVE] Cross-doc: equipment.md:231 attributes "≥ −10 via equipment" to this GDD; hero-class states no such number (equipment's fix)
Reviewed-Content-Hash: design/gdd/hero-class.md 78c23f7ae43f25cf3a3f74f9e3db724bab912480
Reviewed-Content-Hash: design/registry/entities.yaml bf83d47608cc69223c064ee187e26242f4f10412
Reviewed-Content-Hash: .claude/skills/design-review/SKILL.md a63d8fba9b7142eeb43791f061e2e1533c429b43
Reviewed-Content-Hash: design/gdd/game-concept.md 8cac03b91229e2124077facf4c10dc95dc728e46
Reviewed-Content-Hash: design/gdd/accounts-backend.md c8c97ba0034d0a7f98b01dc0f1b7f3a0c069006e
Reviewed-Content-Hash: design/gdd/question-content.md f60c0c4489ce9c33a2ffbeea3289b3638e3dba6e
Reviewed-Content-Hash: design/gdd/systems-index.md 3d763f67a69918e52c7cb937e5b0396292b2e82e
Reviewed-Content-Hash: design/gdd/battle-system.md 3b0ab5dba82c8ec77ed09bccf7c395da1cfe2f1d
Reviewed-Content-Hash: design/gdd/equipment.md 6b81f574f9d30340a1ba6b6bbab3356d29bc5e67
Reviewed-Content-Hash: design/gdd/ui-shell.md ed75062fc8fbffd29066ed9cf5a4d6a64c79e9ae
Reviewed-Content-Hash: design/gdd/opponent-ai.md 66890e06a634a3700cd97bc77dcc3b26f6e3c7a0
