# Question Content — Review Log

## Review — 2026-11-08 — Verdict: APPROVED
Review mode: lean · Workflow: standard
Scope signal: L
Specialists: none (lean mode)
Blocking items: 0 | Recommended: 2
Summary: Re-review after revision. The one prior blocker (F4 default 32 vs registry min_global_glossary_size 24) is resolved — F4's gate default is now 24 with 32 correctly framed as an authoring target, and all five registry-sourced values plus the F5 output range now match the registry exactly. All 6 sections required at workflow standard are present; math spot-checks (F2 retry distinctness, F4 duplicate-pair expectation, F5 degenerate floor) hold; the 11 Edge Cases map cleanly onto the AC set with a negative control in AC-QC5. Two stale-reference leftovers from the AC renumbering remain (non-blocking).
Prior verdict resolved: Yes (NEEDS REVISION on 2026-11-08 — blocker F4 fixed)
Findings:
- [RECOMMENDED] Acceptance Criteria (coverage notes, line 498): stale `AC-QE5` reference (id does not exist after renumbering) and current `AC-QE2` missing from the integration-test list.
- [RECOMMENDED] Cross-References (line 392): game-concept row reads "Pillars 1/4" — the body cites Pillars 1 and 2 only; same miscite class fixed earlier in header/Edge Case 10.
- [NICE-TO-HAVE] Edge Cases: clarify whether the `tts_text`→`term` default applies at question-payload or word-entry level.
Reviewed-Content-Hash: design/gdd/question-content.md abd766eed9daca07b252688c8ca054cac1bca832
Reviewed-Content-Hash: design/registry/entities.yaml 8901ea78c15425a8074a8e5e3cf93fdee5895c31
Reviewed-Content-Hash: .claude/skills/design-review/SKILL.md a63d8fba9b7142eeb43791f061e2e1533c429b43
Reviewed-Content-Hash: design/gdd/accounts-backend.md ec728fca822161eb68f2ad27ec55dc87f088d452
Reviewed-Content-Hash: design/gdd/game-concept.md 227909cf7f2fd7ac45a6510b3e4fdabf09f997dd
Reviewed-Content-Hash: design/gdd/systems-index.md 99f3c2310abafaabad79d71b89f12755f371364b

## Review — 2026-11-09 — Verdict: APPROVED
Review mode: lean · Workflow: standard
Scope signal: L
Specialists: none (lean mode)
Blocking items: 0 | Recommended: 6
Summary: Re-review of the 2026-11-09 revision (A1 confirmed via battle Rule 22, A2 resolved via tower GDD). All five registry-owned values match exactly; new resolution text verified against the authored battle-system (Rule 22 k=1, Rule 23 battles_per_typical_session=4, burnout guard 8 ≥ 2×4), tower (1/15 retry edge case) and forge-srs (E10 exclusion) GDDs; dependency graph complete and bidirectional across all 9 dependents. 6/6 required sections at standard; math spot-checks (F4 ≈0.42 duplicate pairs, F5 floors) hold; F2's pigeonhole claim flagged (see findings — prior carry-in). Two carry-over recommended items remain from 2026-11-08 (stale AC-QE5 in coverage notes; "Pillars 1/4" miscite in Cross-References) plus four new: F2 "≥2 differing" self-contradiction (carry-in not applied), OQ1/OQ3 now answerable from authored battle-system GDD, the Dependencies systems-index discrepancy note is resolved but the index equipment row still lacks question-content, and the registry min_battle_pool_size entry carries a duplicate revised: key.
Prior verdict resolved: Yes (APPROVED on 2026-11-08; this run re-reviewed the revision — target doc and registry changed)
Findings:
- [RECOMMENDED] Formulas (F2, line 199-200): "at least 2 differing questions between consecutive attempts (pigeonhole: 6 − 4 = 2)" contradicts the same paragraph's admission that a full 4-question repeat is possible at 1/15 — pigeonhole proves 2 questions exist outside attempt A, not that attempt B draws them. Prior session's carry-in ("soften at next edit") not applied by the 2026-11-09 revision; registry min_tower_stage_pool_size note carries the same self-contradiction.
- [RECOMMENDED] Acceptance Criteria (coverage notes, line 510-511): stale AC-QE5 reference and AC-QE2 (plus AC-QC3/QC7, AC-QF2b) missing from the integration-test list — carry-over from 2026-11-08.
- [RECOMMENDED] Cross-References (line 401): game-concept row reads "Pillars 1/4"; body cites Pillars 1 and 2 — carry-over from 2026-11-08.
- [RECOMMENDED] Open Questions: OQ1 and OQ3 are answered by the authored battle-system GDD (A1 via Rule 22; battles_per_typical_session = 4 via Rule 23) — annotate/close like OQ2.
- [RECOMMENDED] Dependencies (systems-index discrepancy note, line 358-363): equipment GDD now authored and references question-content, but systems-index row #6 still lists only hero-class, forge-srs — update the index row, retire the note.
- [RECOMMENDED] Registry (entities.yaml, min_battle_pool_size): duplicate revised: key ("2026-11-09" then "") — last-wins silently drops the revision date; remove the empty one.
- [NICE-TO-HAVE] Formulas (F5): add the tower stage case to the example (k=4 from one mixed stage pool → floor(6/4) = 1, accepted per F2).
- [NICE-TO-HAVE] Tuning Knobs (advisory): pool minimums + safe bands already in content-config — consolidating satisfies the absent advisory section.
- [NICE-TO-HAVE] Player Fantasy (advisory): short paragraph from the Summary's Pillar 1/2 framing if the project ever moves to workflow full.
Reviewed-Content-Hash: design/gdd/question-content.md f60c0c4489ce9c33a2ffbeea3289b3638e3dba6e
Reviewed-Content-Hash: design/registry/entities.yaml bf83d47608cc69223c064ee187e26242f4f10412
Reviewed-Content-Hash: .claude/skills/design-review/SKILL.md a63d8fba9b7142eeb43791f061e2e1533c429b43
Reviewed-Content-Hash: design/gdd/battle-system.md 3b0ab5dba82c8ec77ed09bccf7c395da1cfe2f1d
Reviewed-Content-Hash: design/gdd/accounts-backend.md c8c97ba0034d0a7f98b01dc0f1b7f3a0c069006e
Reviewed-Content-Hash: design/gdd/systems-index.md cbe8a156960d8d0a8c51bf16219fe5a414ddf10e
