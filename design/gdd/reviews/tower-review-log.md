## Review — 2026-11-09 — Verdict: APPROVED
Review mode: lean · Workflow: standard
Scope signal: M (borderline L by the letter — 3 formulas, 6 named dependencies — but all formulas are trivially small pure predicates and no new ADR is required; producer should verify before sprint planning)
Specialists: none (lean mode — single-session main review)
Blocking items: 0 | Recommended: 3 | Nice-to-have: 2
Summary: All 6 sections required at `standard` are present (Formulas required — the system defines numeric rules). Every registry value restated in the GDD matches `entities.yaml` (pools 6/4, ghost HP 420/600, accuracy 0.55/0.75, reveal 1200/1500, tower_floor_count 4, tower_stages_per_floor 3), all four upstream dependencies exist and name tower back, and reward/commit cross-references (gold 250/xp 180 boss, gold 40/xp 60 defeat, "tower stage result" commit point) verify against battle-system and accounts-backend. ACs TW1–TW23 are independently testable with correct combinatorics (16 combos, 24 orders, 8 combos). No blocking findings.
Prior verdict resolved: First review
Findings:
- [RECOMMENDED] Core Rules: Core Rule 6's exact-repeat probability (1/C(6,4) = 1/15) assumes uniform unordered 4-subset sampling, but battle-system draws k=1 per round across four distinct round types — under ordered draws the figure differs (1/360 under uniform ordering) and round-type sub-pool composition may make it non-uniform. The qualitative claim (overlap ≥ 2, exact repeat possible) stands; hedge or drop the number.
- [RECOMMENDED] Dependencies: battle-system.md:430 Dependencies row still says tower "GDD not yet authored" — link exists but status is stale; same cleanup family as the opponent-ai proviso tower already flags for its next edit.
- [RECOMMENDED] Core Rules: tower_boss "victory" is battle-system's B12 outlast/fraction win (BS26: ghost HP 600 unreachable by damage at base stats) — a one-line pointer in Core Rule 3 or 4 would stop a tower implementer from assuming KO = victory.
- [NICE] Player Fantasy + Tuning Knobs sections absent — advisory at `standard`; Game Feel covers most fantasy content and tuning levers are stated inline (pool sizes, tower_stages_per_floor band).
- [NICE] Concurrent-session edge (same stage attempted from two tabs) not in Edge Cases — benign given monotone flags + atomic commit, but stating it would match E-case discipline.
Reviewed-Content-Hash: design/gdd/tower.md e868ce1f0be5d89feb39d0ed0c57b462f359f1d2
Reviewed-Content-Hash: design/registry/entities.yaml 5ef3a2e4035f3d6e4e091028f12499687f1be4cb
Reviewed-Content-Hash: .claude/skills/design-review/SKILL.md a63d8fba9b7142eeb43791f061e2e1533c429b43
Reviewed-Content-Hash: design/gdd/battle-system.md c2e43c6448f74fef60d733fab367ca4ed241dd75
Reviewed-Content-Hash: design/gdd/question-content.md abd766eed9daca07b252688c8ca054cac1bca832
Reviewed-Content-Hash: design/gdd/opponent-ai.md 66890e06a634a3700cd97bc77dcc3b26f6e3c7a0
Reviewed-Content-Hash: design/gdd/accounts-backend.md ec728fca822161eb68f2ad27ec55dc87f088d452
Reviewed-Content-Hash: design/gdd/game-concept.md 227909cf7f2fd7ac45a6510b3e4fdabf09f997dd

## Review — 2026-11-09 — Verdict: APPROVED (re-review #2, post-cross-review)
Review mode: lean · Workflow: standard
Scope signal: M (borderline L by the letter — 3 formulas, 6 named dependencies, no new ADR; producer should verify before sprint planning)
Specialists: none (lean mode — single-session main review)
Blocking items: 0 | Recommended: 4 | Nice-to-have: 3
Summary: Re-review after the remediation batch. All three cross-review blockers against tower verified fixed: C-B1 resolved (battle Rule 22 now keys pools by encounter type — tower draws from the module × stage mixed pool ≥6/≥4 with composition gate ≥1/round-type; consistent across tower Rule 4, battle Rules 22/30/31, question-content F2/F3, and the registry pool notes), TW20 re-keyed per meta Core Rule 8's deliberate non-consumption (OQ-TW4 RESOLVED), TW19 anchored to battle Rule 22. Registry sweep: 31 restatement lines, every value matches (pools 6/4, HP 420/600, accuracy 0.55/0.75, delays 1200/1500, floors 4, stages 3, rewards 120/250/40 gold · 180/60 XP). 6/6 required sections at `standard`. The one mathematical error found lives outside this document: question-content F2 + the registry note state "at least 2 differing questions" where the pigeonhole proves ≥2 shared (differing can be 0 — their own next sentence admits a full repeat); tower Core Rule 6 states it correctly.
Prior verdict resolved: Yes — prior APPROVED (lean) superseded by cross-review blockers C-B1/TW20/TW19; this pass verifies the revisions
Findings:
- [RECOMMENDED] Cross-document (question-content.md:197-199 + registry min_tower_stage_pool_size note ~1082): "at least 2 differing questions between consecutive attempts" is inverted — pigeonhole 4+4−6 proves ≥2 SHARED questions between retries; differing can be 0. Tower's phrasing is correct; fix at those owners' next edit (question-content already Needs Revision).
- [RECOMMENDED] Statuses/Dependencies: tower still says ui-shell "GDD not yet authored — provisional" (lines 175, 404) and AC preamble "ui-shell / meta-progression (both undesigned)" (521-522) with TW21–23 provisional notes — both docs are authored and Approved; update at next edit (unblocks TW21–23 screenshot capture).
- [RECOMMENDED] Core Rules (carried from prior review): no pointer that boss "victory" is battle-system B12 outlast/fraction win (BS26: max damage 563 < 600) — one line in Rule 3/4 prevents a KO=victory misread.
- [RECOMMENDED] Cross-document (opponent-ai.md:118): "Confirm with tower GDD" proviso closed by tower Core Rule 3 — drop at opponent-ai's next edit (tower already records this debt).
- [RECOMMENDED] Registry hygiene: min_battle_pool_size entry (entities.yaml:1072-1073) has duplicate `revised:` keys — last-wins drops the 2026-11-09 stamp; delete line 1073.
- [NICE] 1/15 ≈ 6.7% repeat figure now consistent across four files but exact only under uniform unordered sampling — optional "≈" phrasing in question-content/registry.
- [NICE] Concurrent-session edge (same stage from two tabs) still absent from Edge Cases — benign (monotone flags + atomic commit).
- [NICE] Player Fantasy + Tuning Knobs absent — advisory at `standard`; Game Feel + inline levers cover the content.
Reviewed-Content-Hash: design/gdd/tower.md 8c7660fa52272fd32ff38ecf5567fd44dfb6d7c7
Reviewed-Content-Hash: design/registry/entities.yaml bf83d47608cc69223c064ee187e26242f4f10412
Reviewed-Content-Hash: .claude/skills/design-review/SKILL.md a63d8fba9b7142eeb43791f061e2e1533c429b43
Reviewed-Content-Hash: design/gdd/battle-system.md e85d7b48cabe455e5abfb21f2d075318800167ab
Reviewed-Content-Hash: design/gdd/question-content.md f60c0c4489ce9c33a2ffbeea3289b3638e3dba6e
Reviewed-Content-Hash: design/gdd/opponent-ai.md 66890e06a634a3700cd97bc77dcc3b26f6e3c7a0
Reviewed-Content-Hash: design/gdd/accounts-backend.md c8c97ba0034d0a7f98b01dc0f1b7f3a0c069006e
Reviewed-Content-Hash: design/gdd/game-concept.md 8cac03b91229e2124077facf4c10dc95dc728e46
Reviewed-Content-Hash: design/gdd/meta-progression.md 055094dd954982e7c77548e67178e75e8914c7cc
Reviewed-Content-Hash: design/gdd/ui-shell.md ed75062fc8fbffd29066ed9cf5a4d6a64c79e9ae
Reviewed-Content-Hash: design/gdd/systems-index.md 3c85f169f5dc874d169c41f86fd48db0b00b0542
