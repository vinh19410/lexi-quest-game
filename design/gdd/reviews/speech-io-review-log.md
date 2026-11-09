## Review — 2026-11-09 — Verdict: NEEDS REVISION
Review mode: lean · Workflow: standard
Scope signal: M
Specialists: none (lean mode — single-session analysis)
Blocking items: 1 | Recommended: 2
Summary: Structure complete at standard tier (6/6 required incl. Formulas), all arithmetic recomputed independently and clean (S1 boundaries, S3 determinism example, B5 termini 181/201/205, floor 26–31, SI17 stub table, SI25 201-vs-200 discriminator), AC counts (26 = 23 unit + 1 statistical + 1 integration + 1 screenshot) and coverage map (12 rules / 4 formulas / 18 edges) verified. One blocker: the sim_listening_beat_ms rationale claims to match "the longest ghost reveal delay (1200 ms tower boss)" but the registry pins tower_boss at 1500 ms (longest) and tower_stage at 1200 ms — the same misattribution class that blocked battle-system's first review. Value 1200 itself is sound (safe band 600–2000); only the provenance sentence was wrong. Both recommended items: tower dependency row stale ("GDD not yet authored" — tower.md exists, now Approved; bidirectionality holds — tower lists speech-io as an explicit non-dependency), and the mic-permission granted-mid-interaction transition was unspecified (denial covered, grant not).
Prior verdict resolved: First review
Findings:
- [BLOCKING] Formulas (Constant set, line 285) + registry sim_listening_beat_ms notes: "longest ghost reveal delay (1200 ms, tower boss)" contradicts registry — answer_reveal_delay_ms_tower_boss = 1500 (longest), tower_stage = 1200; correct the attribution, keep the locked 1200
- [RECOMMENDED] Dependencies (line 410): tower row "GDD not yet authored" stale — tower.md exists (Approved 2026-11-09)
- [RECOMMENDED] Edge Cases: mic permission granted mid-interaction unspecified (Rule 6 free-switch vs pending prompt) — pin the unlock behavior
- [ADVISORY at standard] Player Fantasy and Tuning Knobs sections absent (Game Feel and the Constant set carry the substance; required only at workflow full)
Revisions applied in-session (autonomous, logged in decision-log): all 3 findings fixed — attribution corrected in Constant set + registry note (value 1200 kept, locked), tower row status updated to GDD Approved, new Edge Case + SI16 extension + coverage count 18→19 for the mid-interaction grant. NOTE: the hashes below are the PRE-revision content (what this review judged) so a re-review of the revised file correctly reads CHANGED and runs a full pass. Advisory items intentionally not applied (not required at standard).
Reviewed-Content-Hash: design/gdd/speech-io.md f9b8412e0210f1cf8b8650446abeef830a2127ab
Reviewed-Content-Hash: design/registry/entities.yaml 5ef3a2e4035f3d6e4e091028f12499687f1be4cb
Reviewed-Content-Hash: design/gdd/systems-index.md ee8f370d2a27db40e478d20813cf6c7c7297002a
Reviewed-Content-Hash: .claude/skills/design-review/SKILL.md a63d8fba9b7142eeb43791f061e2e1533c429b43
Reviewed-Content-Hash: design/gdd/game-concept.md 227909cf7f2fd7ac45a6510b3e4fdabf09f997dd
Reviewed-Content-Hash: design/gdd/battle-system.md c2e43c6448f74fef60d733fab367ca4ed241dd75
Reviewed-Content-Hash: design/gdd/question-content.md abd766eed9daca07b252688c8ca054cac1bca832
Reviewed-Content-Hash: design/gdd/tower.md e868ce1f0be5d89feb39d0ed0c57b462f359f1d2

## Review — 2026-11-09 — Verdict: NEEDS REVISION
Review mode: lean · Workflow: standard
Scope signal: M
Specialists: none (lean mode — single-session analysis)
Blocking items: 1 | Recommended: 1 (+1 routed to OQ-SI2)
Summary: Re-review after revision. All three prior findings verified fixed and correct: sim_listening_beat_ms 1200 now attributed to tower_stage (registry 1200/1500 confirmed both in GDD and registry note), tower row status matches tower.md's explicit non-dependency (verified verbatim), mic-grant-mid-interaction Edge + SI16 + coverage 19 verified. Full registry value sweep clean (0.88/0.98/0.6/2, ghost 100/150, 11 000 ms, B5 175+80×0.38=205.4, mic span 181–201, floor 26/31, S3 200-vs-201, 7 800 ms headroom). AC counts (26 = 23+1+1+1) and coverage map (12/4/19) verified. One new blocker: the round-machine table routes a battle commit during `Speaking` into `Awaiting` — a state defined as pre-commit ("waiting for the player's commit") — contradicting Rule 3 and SI8; commit must land in `Stopped`, and `Prompting` (options actionable from round start) lacks a commit exit entirely. Recommended: constant-set paragraph "no safe ranges by design" contradicts the sim_listening_beat_ms row's printed safe range. Revisions applied in-session (autonomous, logged in decision-log).
Prior verdict resolved: Yes — prior NEEDS REVISION findings all addressed; new finding found in fresh full pass
Findings:
- [BLOCKING] Detailed Design (round machine table, lines 175–176): `Speaking` commit exit routes to `Awaiting` (defined pre-commit) instead of `Stopped`; `Prompting` has no commit exit though options are actionable from round start (SI8)
- [RECOMMENDED] Constant set (lines 287–288): "no safe ranges by design (qa-lead G6)" contradicts row 285's "Safe range 600–2000 ms" — reconcile wording
- [ROUTED] battle-system:428 speech-io dependency row still "GDD not yet authored" — battle-side staleness, covered by OQ-SI2's next battle edit
Reviewed-Content-Hash: design/gdd/speech-io.md 9d44c400c1d3f03ef7a5c192f2296ee1fe481d0c
Reviewed-Content-Hash: design/registry/entities.yaml 1300c00669225828d89feca5628dd9091a546eb6
Reviewed-Content-Hash: .claude/skills/design-review/SKILL.md a63d8fba9b7142eeb43791f061e2e1533c429b43
Reviewed-Content-Hash: design/gdd/game-concept.md 227909cf7f2fd7ac45a6510b3e4fdabf09f997dd
Reviewed-Content-Hash: design/gdd/battle-system.md c2e43c6448f74fef60d733fab367ca4ed241dd75
Reviewed-Content-Hash: design/gdd/question-content.md abd766eed9daca07b252688c8ca054cac1bca832
Reviewed-Content-Hash: design/gdd/tower.md e868ce1f0be5d89feb39d0ed0c57b462f359f1d2
Reviewed-Content-Hash: design/gdd/systems-index.md ea16dcce823ddd5e0c3223469eeb25997ded63d2

## Review — 2026-11-09 — Verdict: APPROVED
Review mode: lean · Workflow: standard
Scope signal: M
Specialists: none (lean mode — single-session analysis)
Blocking items: 0 | Recommended: 2
Summary: Re-review #3 after the in-session round-machine fix. Both prior findings verified fixed and correct: round machine now routes commit to `Stopped` from `Prompting` AND `Speaking` (Awaiting correctly only via playback-end), and the constant-set "no safe ranges" wording reconciled with the beat row's rationale band. Fresh full pass: structure 6/6 required at standard (Player Fantasy/Tuning Knobs advisory-absent, substance in Game Feel + Constant set); full registry sweep of 14 terms clean (0.88/0.98/0.6/2/1200 in GDD = registry; tower_stage 1200 vs tower_boss 1500 attribution correct in both GDD and registry note; ghost 100/150 referenced-never-redefined; base_round_time 10/floor 5; fast_answer_threshold 3000 never-redefine); all arithmetic recomputed independently clean (S1 band boundaries + SI17 stub table incl. half-up at 0.885/0.975, S3 200-vs-201 determinism example, B5 = 205.4 × q → mic span 181–201, spell termini 0/205, floor 26/31, 0.01-step ≥ 1.75 damage, SI25 201-vs-200 discriminator, beat headroom 2.2–3.2 s in 11 000 ms); AC counts (26 = 23 unit + 1 statistical + 1 integration + 1 screenshot) and coverage map (12 rules / 4 formulas / 19 edges) verified; bidirectionality confirmed (battle ×10, question-content ×7 mentions; tower explicit non-dependency matches tower.md); concept TTS settings (rate 0.85, en-US, Web Speech API) match game-concept.md:288. Two recommended items, both minor machine-table completeness gaps gated on external pins — no rule contradiction.
Prior verdict resolved: Yes — both re-review-#2 findings verified fixed; fresh full pass found no new blockers
Findings:
- [RECOMMENDED] Detailed Design (round machine): ult-machine states (`UltPrompting`/`MicListening`/`Spelling`) have no expiry/teardown exit in the table — behavior is pinned in Edge Cases + SI23, but the table omits the transition; add the exit row when OQ-SI1 resolves (the exit's shape depends on battle's commit-only vs hard-expiry pin)
- [RECOMMENDED] Detailed Design (round machine): L2-mode and "tap to hear" rounds never enter `Speaking`/`Awaiting` — the Prompting→Stopped direct path is inferable but not stated; one clarifying sentence would pin it
- [ADVISORY at standard] Player Fantasy and Tuning Knobs sections absent (Game Feel and the Constant set carry the substance; required only at workflow full)
Reviewed-Content-Hash: design/gdd/speech-io.md 023f623b63c334ccc806a58c0368166aa86f0b5a
Reviewed-Content-Hash: design/registry/entities.yaml 1300c00669225828d89feca5628dd9091a546eb6
Reviewed-Content-Hash: .claude/skills/design-review/SKILL.md a63d8fba9b7142eeb43791f061e2e1533c429b43
Reviewed-Content-Hash: design/gdd/game-concept.md 227909cf7f2fd7ac45a6510b3e4fdabf09f997dd
Reviewed-Content-Hash: design/gdd/battle-system.md c2e43c6448f74fef60d733fab367ca4ed241dd75
Reviewed-Content-Hash: design/gdd/question-content.md abd766eed9daca07b252688c8ca054cac1bca832
Reviewed-Content-Hash: design/gdd/tower.md e868ce1f0be5d89feb39d0ed0c57b462f359f1d2
Reviewed-Content-Hash: design/gdd/systems-index.md ea16dcce823ddd5e0c3223469eeb25997ded63d2
