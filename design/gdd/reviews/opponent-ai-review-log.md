# opponent-ai — Design Review Log

## Review — 2026-11-09 — Verdict: APPROVED
Review mode: lean · Workflow: standard
Scope signal: M
Specialists: none (lean mode — single-session analysis)
Blocking items: 0 | Recommended: 3
Summary: First-pass approval. All 6 required sections present at `standard` (Player Fantasy and Tuning Knobs absent but advisory at this tier; their substance lives in Game Feel and the Constant set). All F3 statistics verified by hand, all registry values cross-checked with zero conflicts, all 20 acceptance criteria independently testable, provisional contracts carry named owners. No blocking issues.
Prior verdict resolved: First review
Findings:
- [RECOMMENDED] Dependencies: stale discrepancy note (lines 303–307) — systems-index row already lists hero-class; remove the outdated note
- [RECOMMENDED] Dependencies: systems-index tower row omits opponent-ai from its planned dependency list despite the declared Hard (profiles) dependency
- [RECOMMENDED] Detailed Design/F2: `round_index` parameter in `resolve_round` is never defined — specify it as an ordering-validation argument or drop it
- [NICE-TO-HAVE] Acceptance Criteria/OA17: "within stated rounding" — name the exact tolerance so the test does not lean on reviewer judgment

Reviewed-Content-Hash: design/gdd/opponent-ai.md 66890e06a634a3700cd97bc77dcc3b26f6e3c7a0
Reviewed-Content-Hash: design/registry/entities.yaml ff621a0a5e7c131c8c9730a651cb8e373351c7a9
Reviewed-Content-Hash: .claude/skills/design-review/SKILL.md a63d8fba9b7142eeb43791f061e2e1533c429b43
Reviewed-Content-Hash: design/gdd/game-concept.md 227909cf7f2fd7ac45a6510b3e4fdabf09f997dd
Reviewed-Content-Hash: design/gdd/question-content.md abd766eed9daca07b252688c8ca054cac1bca832
Reviewed-Content-Hash: design/gdd/hero-class.md 0742765ec80da476ce96c8052b9b2f7e4a73e4e8
Reviewed-Content-Hash: design/gdd/systems-index.md b0224e6ffb4af0df39dcd568edde1b5250c1be41
