## Review — 2026-11-09 — Verdict: NEEDS REVISION
Review mode: lean · Workflow: standard
Scope signal: L
Specialists: none (lean mode — single-session analysis)
Blocking items: 2 | Recommended: 2
Summary: Structure, AC coverage (38 ACs over 25 rules + 12 formulas) and nearly all arithmetic verified sound. Two blockers: (1) ghost HP/reveal-delay restatements at lines 137/407 use a wrong ordering that contradicts the registry (BS2 line 626 has it right); (2) the Formulas preamble sanity headline ("slow all-correct cannot KO the 420 ghost, ~380 max") omits the B7 counter — correct slow-play burst is 427 > 420, contradicting the GDD's own formulas and the Pillar-1 structural claim feeding OQ-BS2.
Prior verdict resolved: First review
Findings:
- [BLOCKING] Dependencies (line 407) + Formulas preamble (line 137): ghost HP ordering "420/500/500/600" and reveal delays "1200/1000/800/1500" contradict registry (friend 500/ranked 500/tower_stage 420/boss 600; delays 1000/800/1200/1500)
- [BLOCKING] Formulas preamble (line 150): "slow all-correct cannot KO the 420 stage ghost (~380 max)" is false per B3+B4+B5+B7 (74+42+106+205 = 427 > 420) — the ~380 omits the counter-strike
- [RECOMMENDED] Edge Cases (line 397): "vocab strike ≈ 215" at atk ≈ 150 computes to 206 per B3
- [RECOMMENDED] Detailed Design (Rule 8): cross-reference the >6000 ms rune penalty on grammar rounds so Pillar 1's design test is visibly satisfied on the defense round
Reviewed-Content-Hash: design/gdd/battle-system.md 89694d44f589f146e9d654529100b1375b7be38a
Reviewed-Content-Hash: design/registry/entities.yaml 6637339c1ddd7fc24047998fd9db8d40fc2cbea2
Reviewed-Content-Hash: .claude/skills/design-review/SKILL.md a63d8fba9b7142eeb43791f061e2e1533c429b43
Reviewed-Content-Hash: design/gdd/game-concept.md 227909cf7f2fd7ac45a6510b3e4fdabf09f997dd
Reviewed-Content-Hash: design/gdd/systems-index.md 95cb7b4aae45c7d0ce74aa3a8327a191358e3253

## Review — 2026-11-09 — Verdict: APPROVED
Review mode: lean · Workflow: standard
Scope signal: L
Specialists: none (lean mode — single-session analysis)
Blocking items: 0 | Recommended: 2
Summary: Re-review after revision. Both prior blockers verified fixed against the registry: ghost HP/reveal-delay ordering now 500/500/420/600 and 1000/800/1200/1500 (friend/ranked/tower_stage/tower_boss) at all three restatement sites, and the sanity headline now includes the B7 counter (slow totals 427/414/419 — only a perfect slow Wordsmith run edges the 420 stage ghost, by 7; re-derived every summand). Whole-document registry sweep clean; both prior recommended items also applied (vocab-strike example 206; Rule 8 slow-rune cross-ref). Two stale rule-number cross-refs remain (Rule 5→"Rule 11" should be Rule 15; Rule 10→"Rule 16's policy" should be Rule 22) — non-blocking.
Prior verdict resolved: Yes — prior verdict was NEEDS REVISION on 2026-11-09 (lean)
Findings:
- [RECOMMENDED] Detailed Design (Rule 5, line 59): "(Rule 11)" mis-reference — ghost resolution is Rule 15
- [RECOMMENDED] Detailed Design (Rule 10, line 74): "Rule 16's policy" mis-reference — draw policy is Rule 22
Reviewed-Content-Hash: design/gdd/battle-system.md c2e43c6448f74fef60d733fab367ca4ed241dd75
Reviewed-Content-Hash: design/registry/entities.yaml 6637339c1ddd7fc24047998fd9db8d40fc2cbea2
Reviewed-Content-Hash: .claude/skills/design-review/SKILL.md a63d8fba9b7142eeb43791f061e2e1533c429b43
Reviewed-Content-Hash: design/gdd/game-concept.md 227909cf7f2fd7ac45a6510b3e4fdabf09f997dd
Reviewed-Content-Hash: design/gdd/systems-index.md 81266a3e78ea0d0d6ab669c34b928c4ba4920410

## Review — 2026-11-09 — Verdict: NEEDS REVISION
Review mode: lean · Workflow: standard
Scope signal: L
Specialists: none (lean mode — single-session analysis)
Blocking items: 1 | Recommended: 3
Summary: Re-review — the document changed after its 2026-11-09 APPROVED verdict (equipment OQ-BS4 adoption, D-B1 Arcane listening multiplier, AC updates), so a fresh full pass ran. Registry sweep clean across 53 restatement lines (ghost HP/delay orderings at all three sites now correct; all 10 owned entries and every cross-referenced value match). All B1–B12 examples and the sanity headline re-derived correct. One new blocker: the Edge Case at line 390 still carries the pre-D-B1 Arcane mana arithmetic ("uncapped sum 101", cap truncation) which contradicts Rule 13's flat mana — 3 correct = exactly 90 for every class. Two prior recommended rule-number cross-refs (Rule 5→Rule 15, Rule 10→Rule 22) remain unfixed.
Prior verdict resolved: Yes — prior verdict was APPROVED on 2026-11-09 (lean); re-reviewed because the target document changed
Findings:
- [BLOCKING] Edge Cases (line 390): stale pre-D-B1 Arcane mana clause — "listening path reaches the 100 cap (uncapped sum 101 — B8's cap truncation applies at accrual)" contradicts Rule 13 flat mana (3 correct = 90 for every class, no cap truncation, no Arcane headroom)
- [RECOMMENDED] Detailed Design (Rule 5, line 59): "(Rule 11)" mis-reference — ghost resolution is Rule 15 (carried from 2026-11-09 APPROVED review, still unfixed)
- [RECOMMENDED] Detailed Design (Rule 10, line 74): "Rule 16's policy" mis-reference — draw policy is Rule 22 (carried, still unfixed)
- [RECOMMENDED] Structure: Player Fantasy and Tuning Knobs sections absent — advisory at `standard` (knobs scattered through formula Output Ranges, no consolidated safe-range table)
Reviewed-Content-Hash: design/gdd/battle-system.md 3b0ab5dba82c8ec77ed09bccf7c395da1cfe2f1d
Reviewed-Content-Hash: design/registry/entities.yaml bf83d47608cc69223c064ee187e26242f4f10412
Reviewed-Content-Hash: .claude/skills/design-review/SKILL.md a63d8fba9b7142eeb43791f061e2e1533c429b43
Reviewed-Content-Hash: design/gdd/game-concept.md 8cac03b91229e2124077facf4c10dc95dc728e46
Reviewed-Content-Hash: design/gdd/systems-index.md 5863451e91d8861da0bb52ffcc7a06039202ddd3

## Review — 2026-11-09 — Verdict: NEEDS REVISION
Review mode: lean · Workflow: standard
Scope signal: L
Specialists: none (lean mode — single-session analysis)
Blocking items: 1 | Recommended: 2 (+1 advisory)
Summary: Re-review — the document changed again after the /design-system battle-system session, so a fresh full pass ran. All three prior items verified fixed (Arcane mana edge case now states flat-mana Rule 13 arithmetic; Rule 5 → Rule 15 and Rule 10 → Rule 22 refs corrected). Whole-document registry sweep clean across ~109 restatement lines (all 30+ battle-relevant entries match; BS26/BS1 arithmetic re-derived correct). One new blocker: the Formulas sanity headline still carries pre-D-B1 Arcane arithmetic — slow listening 102 / total 419 instead of B4's ×1.20-inclusive 123 / 440 — making the "only a perfect slow Wordsmith run edges the 420 stage ghost" claim false (a perfect slow Arcane run also KO's it, by 20). Three new rule-ref mis-references in the rewritten Core Rules: Rule 7 ult bullet "(Rule 14)" → Rule 20; Rule 14's "hook points — Rule 19" → Rule 25 and "cursed rune (Rule 15)" → Rule 20. All four findings fixed in-session (autonomous); status stays In Review pending re-review.
Prior verdict resolved: Yes — prior verdict was NEEDS REVISION on 2026-11-09 (lean); document had since changed
Findings:
- [BLOCKING] Formulas (sanity headline, lines 151–160): stale pre-D-B1 Arcane slow arithmetic — listening 102 / total 419 contradicts B4's ×1.20 (123 / 440); "only Wordsmith edges the 420 stage ghost KO" claim false (Arcane also, by 20) — FIXED in-session
- [RECOMMENDED] Detailed Design (Rule 7, line 64): "(Rule 14)" mis-ref — slow-rune threshold is Rule 20 — FIXED in-session
- [RECOMMENDED] Detailed Design (Rule 14, line 78): "Rule 19" mis-ref (combo-keep hook is Rule 25) and "(Rule 15)" mis-ref (cursed runes are Rule 20) — FIXED in-session
- [ADVISORY] Structure: Player Fantasy and Tuning Knobs absent — advisory at `standard` (substance in Game Feel + registry constants)
Reviewed-Content-Hash: design/gdd/battle-system.md c07f34eff26aff7a361fcada9ac3a9943efe57be
Reviewed-Content-Hash: design/registry/entities.yaml bf83d47608cc69223c064ee187e26242f4f10412
Reviewed-Content-Hash: .claude/skills/design-review/SKILL.md a63d8fba9b7142eeb43791f061e2e1533c429b43
Reviewed-Content-Hash: design/gdd/game-concept.md 8cac03b91229e2124077facf4c10dc95dc728e46
Reviewed-Content-Hash: design/gdd/systems-index.md 0c09c383a21867151ec3e38715b402953e9fbb3f

## Review — 2026-11-09 — Verdict: APPROVED
Review mode: lean · Workflow: standard
Scope signal: L
Specialists: none (lean mode — single-session analysis)
Blocking items: 0 | Recommended: 2
Summary: Fresh re-review of the post-fix bytes — the prior NEEDS REVISION receipt stamps the corrected document, but its verdict judged pre-fix content, so a full pass ran (no delta skip). All four prior findings verified fixed in the text: sanity headline now 427/414/440 (vocab 74/65/70 + counter 42/52/45 + listening 106/98/123 + ult 205/199/202) with the Arcane-edges-stage-ghost-by-20 clause correct, Rule 7 "(Rule 20)" and Rule 14 "Rule 25 / (Rule 20)" refs in place, and the two carried refs (Rule 5 → Rule 15, Rule 10 → Rule 22) also fixed. Every formula B1–B12 and all worked examples re-derived by hand — zero arithmetic errors; BS26's boss ceilings (563 max, 358 three-round burst) re-derived correct. Whole-document registry sweep (~69 matching lines): all 4 battle-owned entries (speed_mult, crit_rule, shield_gain, mana_gain) and every cross-referenced constant (ghost HP 500/500/420/600 incl. ghost_hp_boss, reveal delays 1000/800/1200/1500, class stat blocks 380/80/30/12/0.0 etc., fast_mult 1.2, shield_flat 60, listening_mult 1.20, threshold 3000) match — zero conflicts. New recommended: Rule 11's pool worst-case "157" is the no-gear bound only; two new recommended items, both non-blocking.
Prior verdict resolved: Yes — prior verdict was NEEDS REVISION on 2026-11-09 (lean); fixes were applied in-session after that verdict, before this re-review
Findings:
- [RECOMMENDED] Detailed Design (Rule 11, line 75): pool worst-case "≈ 157" holds only without gear — registry battle_shield_gain notes and equipment's tuning row (OQ-EQ6) document 205 at def 120 with the plate-conditional ×1.25 pre_shield_mult; scope the 157 claim as no-gear and note the gear bound
- [RECOMMENDED] UI Requirements (line 597): shield bar "capped display 200" clips the 205 gear-time pool bound — raise the display cap or flag it as a ui-shell convention to revisit with equipment's Class-B hooks
- [ADVISORY] Structure: Player Fantasy and Tuning Knobs sections absent — advisory at `standard` (carried from all prior reviews)
Reviewed-Content-Hash: design/gdd/battle-system.md c07f34eff26aff7a361fcada9ac3a9943efe57be
Reviewed-Content-Hash: design/registry/entities.yaml bf83d47608cc69223c064ee187e26242f4f10412
Reviewed-Content-Hash: .claude/skills/design-review/SKILL.md a63d8fba9b7142eeb43791f061e2e1533c429b43
Reviewed-Content-Hash: design/gdd/game-concept.md 8cac03b91229e2124077facf4c10dc95dc728e46
Reviewed-Content-Hash: design/gdd/systems-index.md 0c09c383a21867151ec3e38715b402953e9fbb3f
Reviewed-Content-Hash: design/gdd/equipment.md 6b81f574f9d30340a1ba6b6bbab3356d29bc5e67
