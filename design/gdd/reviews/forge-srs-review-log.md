# forge-srs — Design Review Log

## Review — 2026-11-09 — Verdict: APPROVED
Review mode: lean · Workflow: standard
Scope signal: L
Specialists: none (lean — single-session analysis)
Blocking items: 0 | Recommended: 5
Summary: All 6 required sections present at `standard` (Formulas required — numeric rules defined). Every restated registry value matches `entities.yaml` (10 terms searched whole-document); battle Rule 20, accounts-backend AC-C1/C2/C5/C6 + retry ladder, question-content E10 and the game-concept 2:1 lock all verify bidirectionally. All F3 arithmetic recomputed and correct (T_floor 96 h 10 min; E[T_rune] 187.4/127.8/96.2 h). All 28 ACs independently testable with correct coverage maps. 0 blocking; 5 recommended (formula/registry `forge_session_size` band vs game-concept lock; filler-exhausted prose gloss wrong at R=1; "retryable this sitting" wording; stale tower downstream status; unused `battles_per_typical_session` cross-ref), 1 nice-to-have (gate copy for a held-back-only queue).
Prior verdict resolved: First review
Findings:
- [RECOMMENDED] Formulas/F2: hardcodes 3 while declaring `forge_session_size` (band 3–5) — non-default band values violate the game-concept-locked 3-runes-per-stone recipe; shrink band or parameterize
- [RECOMMENDED] Edge Cases (filler exhausted): "31 words queued, 1 drawable filler still lets a full session run" contradicts its own condition when filler slots ≥ 2 (R=1 → short session); normative condition + FS9 are correct, prose gloss wrong
- [RECOMMENDED] Formulas (F3 example): "retryable this sitting" contradicts one-shot snapshot composition (FS21/States)
- [RECOMMENDED] Dependencies (downstream): tower row "Not started" stale — tower.md authored (Approved 2026-11-09)
- [RECOMMENDED] Cross-References: `battles_per_typical_session` listed as Sections D/E/F registry input but never used in the body; the "~4–12 rune drops per sitting" estimate is where it belongs
- [NICE-TO-HAVE] Edge Cases × FS7: gate copy has no case for a queue holding only held-back (missing-word) runes — no earliest `due_at` exists
Reviewed-Content-Hash: design/gdd/forge-srs.md fe26a2f762c06d01a7b5503163ba834db21c3c03
Reviewed-Content-Hash: design/registry/entities.yaml 5ef3a2e4035f3d6e4e091028f12499687f1be4cb
Reviewed-Content-Hash: .claude/skills/design-review/SKILL.md a63d8fba9b7142eeb43791f061e2e1533c429b43
Reviewed-Content-Hash: design/gdd/battle-system.md c2e43c6448f74fef60d733fab367ca4ed241dd75
Reviewed-Content-Hash: design/gdd/accounts-backend.md ec728fca822161eb68f2ad27ec55dc87f088d452
Reviewed-Content-Hash: design/gdd/question-content.md abd766eed9daca07b252688c8ca054cac1bca832
Reviewed-Content-Hash: design/gdd/game-concept.md 227909cf7f2fd7ac45a6510b3e4fdabf09f997dd
Reviewed-Content-Hash: design/gdd/systems-index.md 0c19c39ff0c045202890c797eb9976f400255ae6
