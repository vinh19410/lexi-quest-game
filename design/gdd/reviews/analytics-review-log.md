# Design Review Log — analytics.md

## Review — 2026-11-09 — Verdict: APPROVED
Review mode: lean · Workflow: standard
Scope signal: L
Specialists: none (lean mode — single-session main review)
Blocking items: 0 | Recommended: 6
Summary: First review. All 6 sections required at `standard` present (Formulas required — the system defines numeric rules; Player Fantasy + Tuning Knobs absent = advisory, the latter explicitly covered by Core Rule 8's variable-table ranges). All arithmetic spot-checks pass (F-AN4–F-AN9 and their AC mirrors); every cross-document fact verified against its owning GDD (forge delays 10 min/24 h/72 h, T_floor 96 h 10 min, OQ-FS5, OQ-MP5, accounts-backend event-sink contract, ranked-league telemetry rows, ui-shell non-dependency quote, game-concept Pillar 4 / visible-debt hook) and against the registry (90-day TTL_raw, 30-day deletion SLA, funnel chain, Asia/Ho_Chi_Minh boundary — no conflicts). Findings are consistency-hygiene items: count errors in the coverage line, dangling E-number cross-references, an undefined retry constant, and two vocabulary/backfill tracking gaps.
Prior verdict resolved: First review
Findings:
- [RECOMMENDED] Acceptance Criteria: coverage line says "12/12 Edge Cases" but the section holds 13 bullets, and "4/4 cross-system checks" but 3 ACs (AC-AN18–20) sit under Cross-system
- [RECOMMENDED] Detailed Design / Formulas / Edge Cases: dangling E-number references — Core Rule 2/3/6, States and F-AN6 cite E1/E7, E3, E4, E9, E11, but the Edge Cases bullets carry no E-numbers and positional numbering mismatches (the toggle bullet is 5th, not 4th; F-AN6's sampled-vs-unsampled misuse guidance is not an edge bullet at all)
- [RECOMMENDED] Formulas (F-AN4) / States: the retry budget `n_max` is tested by AC-AN9 and used by the Backoff state but appears in no variable table — the doc never states whether it is accounts-backend's retry ladder N=5 or its own constant with a range
- [RECOMMENDED] Core Rules (event vocabulary) / Dependencies: ranked-league's telemetry rows list "forfeit events" and "rotation-module mix" as telemetry analytics owns, but the v1 vocabulary table has only `rp_delta` and `season_rollover` — under Core Rule 1 ranked-league cannot invent those names; add the events or an explicit deferred note (forfeit RP deltas riding `rp_delta`?)
- [RECOMMENDED] Open Questions: the 30-day deletion cascade and TTL_raw impose new behavior on accounts-backend's deletion job (its GDD still says "Event sink — Post-MVP design"); the registry notes the backfill need on TTL_raw but no Open Question tracks it (OQ-AN4 covers battle/tower only)
- [RECOMMENDED] Dependencies: the meta-progression row's ✅ overstates — meta's GDD anticipates analytics reading *tower's* `floor_cleared` (its line 473), not meta's own `quest_event`/`economy_event` emission
- [nice-to-have] Formulas (F-AN9): the worked inversion "p50(T1) = 5.6 d → p̂ ≈ 0.75" gives ≈ 0.77 on the literal single-rune E[T_rune](p) curve; state which quantity the example inverts (per-rune vs first-of-batch)
- [nice-to-have] Formulas (F-AN6): `s_round` and `N` are two knobs for one mechanism (s_round = 1/N) — declare the invariant or make one derived
- [nice-to-have] Acceptance Criteria (AC-AN4): the scripted session's given omits an auth flow while the then-branch demands `auth_event` — state that the harness registers/logs in
- [nice-to-have] Formulas: numbering starts at F-AN4 with no F-AN1–F-AN3; the preamble's "numbering follows those citations" does not explain the gap
- [nice-to-have] Core Rules (`rune_queue_state`): fires once per session end — the same lossy teardown the gap sessionizer (F-AN5) exists to compensate for; state the expected loss and that visible-debt validation tolerates it

Reviewed-Content-Hash: design/gdd/analytics.md ee1e73b830bd54a5108099af96cb041ca2e54934
Reviewed-Content-Hash: design/registry/entities.yaml 8379cd958881ee45f75014252db9136909fd3a2e
Reviewed-Content-Hash: .claude/skills/design-review/SKILL.md a63d8fba9b7142eeb43791f061e2e1533c429b43
Reviewed-Content-Hash: design/gdd/forge-srs.md fe26a2f762c06d01a7b5503163ba834db21c3c03
Reviewed-Content-Hash: design/gdd/meta-progression.md 055094dd954982e7c77548e67178e75e8914c7cc
Reviewed-Content-Hash: design/gdd/accounts-backend.md ec728fca822161eb68f2ad27ec55dc87f088d452
Reviewed-Content-Hash: design/gdd/ranked-league.md c751daa0c3ac66250c883fba1e769798b6f3194a
Reviewed-Content-Hash: design/gdd/ui-shell.md ed75062fc8fbffd29066ed9cf5a4d6a64c79e9ae
Reviewed-Content-Hash: design/gdd/tower.md e868ce1f0be5d89feb39d0ed0c57b462f359f1d2
Reviewed-Content-Hash: design/gdd/battle-system.md c2e43c6448f74fef60d733fab367ca4ed241dd75
Reviewed-Content-Hash: design/gdd/game-concept.md 227909cf7f2fd7ac45a6510b3e4fdabf09f997dd
Reviewed-Content-Hash: design/gdd/systems-index.md f68514022a449029ca97ddb6c1739b3f68258bc8
