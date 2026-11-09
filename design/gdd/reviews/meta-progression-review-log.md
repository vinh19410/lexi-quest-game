# meta-progression — Review Log

## Review — 2026-11-09 — Verdict: APPROVED
Review mode: lean · Workflow: standard
Scope signal: L
Specialists: none (lean — single-session analysis)
Blocking items: 0 | Recommended: 4
Summary: First review of the completed meta-progression GDD. All 6 sections required at `standard` are present (the 5 standard sections + Formulas — the system defines numeric rules). All arithmetic re-verified by hand (MP1 examples, MP4 max +450/day = 150+120+80+100, E[gold]=40+80·p / E[xp]=60+120·p, level-pace and faucet estimates, AC15 1240→1360, AC2 sweep incl. xp 1,000,000 → level 1001); whole-document registry sweep of the 15 meta-owned entries found zero conflicts, and battle's Rule 21 mirror (120/250/40 · 180/60) matches exactly. Bidirectionality claims verified against all four upstream GDDs (battle-system Rule 21 + two dependency rows; accounts-backend three sites incl. quest-claim commit point and whole-commit rejection; forge-srs "indirect only / no direct interface" row honored by the read-from-records framing; tower divergence documented with carry-ins for its next edit). ACs MP-AC1–29 all independently testable — deterministic, DI-injected fake server clock, no wall-clock timing, static assertions marked as such. One arithmetic slip found in the advisory economy check (grinder ceiling), non-blocking; OQ-MP1 quotes it.
Prior verdict resolved: First review
Findings:
- [RECOMMENDED] Formulas (Economy sanity check): "250 gold per ~3-min win" computes to 5,000 g/h, not the stated ~4,000 g/h (registry reward_gold_victory_boss note repeats ~4000) — reconcile the per-win time or the ceiling; OQ-MP1 quotes it as the number an Alpha sink price must survive
- [RECOMMENDED] Consumption contract: BattleResult field names (gold_event, xp_event, max_combo, encounter, victory, seed) are pinned here but battle-system's GDD names none of them in prose (BS29 describes values; the states table says "runes, rewards, seed, per-round log") — add a battle-edit carry-in adopting these names alongside the OQ-BS3 mark
- [RECOMMENDED] Open Questions: tower's OQ-TW4 (floor_cleared event schema, owner: meta-progression) is neither answered nor routed here — mark it resolved-by-OQ-MP5 or answer it at tower's next edit
- [RECOMMENDED] Dependencies: tower expected meta to own a "one-time clear bonus" value (tower's provisional floor_cleared note); meta implicitly declines it (floor_cleared unconsumed → no first-clear bonus at MVP) but never states it — one clarifying sentence near Core Rule 6/8 or in the carry-ins
- [ADVISORY] Player Fantasy + Tuning Knobs absent (advisory at `standard`; fantasy substance lives in Game Feel "receipts, not slot machines", knobs in the Constant set — which lacks safe ranges, something a future Tuning Knobs section would add)
Reviewed-Content-Hash: design/gdd/meta-progression.md 055094dd954982e7c77548e67178e75e8914c7cc
Reviewed-Content-Hash: design/registry/entities.yaml 1029dee1b9ef7deb2c39fd22812ef932b2c6f248
Reviewed-Content-Hash: .claude/skills/design-review/SKILL.md a63d8fba9b7142eeb43791f061e2e1533c429b43
Reviewed-Content-Hash: design/gdd/battle-system.md c2e43c6448f74fef60d733fab367ca4ed241dd75
Reviewed-Content-Hash: design/gdd/accounts-backend.md ec728fca822161eb68f2ad27ec55dc87f088d452
Reviewed-Content-Hash: design/gdd/forge-srs.md fe26a2f762c06d01a7b5503163ba834db21c3c03
Reviewed-Content-Hash: design/gdd/tower.md e868ce1f0be5d89feb39d0ed0c57b462f359f1d2
Reviewed-Content-Hash: design/gdd/game-concept.md 227909cf7f2fd7ac45a6510b3e4fdabf09f997dd
Reviewed-Content-Hash: design/gdd/systems-index.md cb5de838cac34377c800911da357cdc20281f5ba
