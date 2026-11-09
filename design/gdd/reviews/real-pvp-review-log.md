# Real PvP (Human Duels) — Review Log

## Review — 2026-11-09 — Verdict: NEEDS REVISION
Review mode: lean · Workflow: standard
Scope signal: XL
Specialists: none (lean mode — single-session main review)
Blocking items: 1 | Recommended: 7
Summary: First review. All 6 sections required at `standard` present (Formulas required — the system defines numeric rules; Player Fantasy + Tuning Knobs absent = advisory, their content lives in Overview and the R-series variable tables). Registry cross-search clean: all 9 owned entries and every restated foreign value (0.92 armor, 3000 ms strict fast threshold, speedMult shape, mana 30/10/90/100, shield 145 at def 120, B9 0.25/600 shape, tier floors, ±28/−14, reveal delays 1000/800/1200/1500, def band 120) verified against owners; R1–R8/N1 arithmetic and AC15/25/30/6/8/10/19 fixtures all recomputed correct. One blocking worked-example defect (R4 teaches the opposite of Core Rule 4's timeout semantics) plus 7 consistency-hygiene corrections (R2's GM-band guarantee number, R3's worst-case distortion, stale analytics status, draw-vocabulary assumption understated, forfeit-parity wording conflates two constructs, AC8 counter wording double-readable, bidirectionality claim imprecise). Autonomous mode chose revise-now: all 8 fixes applied same session (mechanical, no design decisions); status → In Review, fresh-session re-review is the next step.
Prior verdict resolved: First review
Findings:
- [BLOCKING] Formulas (R4 example): the worked example scores a pre-deadline 9.8 s commit as a timeout and contradicts its own "B never commits" premise — Core Rule 4 makes a commit before the personal deadline valid; the recorded-timeout case needs asymmetric clocks (A 10 s / B 11 s, commit 10.4 s = AC5's fixture)
- [RECOMMENDED] Formulas (R2): "a GM at 1900 reaches down to 1600" contradicts its own cap (350 → 1550); the adjacent-tiers guarantee actually holds via min-consent (Gold band cap 300, rp ≤ 1599 + 300 = 1899 < 1900), now stated correctly
- [RECOMMENDED] Formulas (R3): "worst speedMult distortion = 0.0075" holds only for 10 s rounds; the 5 s floor (R4's range) gives 0.015 — conclusion (invisible) unchanged
- [RECOMMENDED] Dependencies: analytics row said "GDD In Design (parallel session)" but analytics is Approved (2026-11-09) — updated
- [RECOMMENDED] Dependencies (provisional assumption 3): the draw outcome (0 delta, no streak movement) is NEW ranked-league event vocabulary, not a "label-only change" — ghost ranked play has no draws (B12 tie-goes-to-player)
- [RECOMMENDED] Core Rule 14: "identical to ranked-league's grace forfeit" conflated ranked-league's 15-minute abandon-detection loss (no opponent win side) with PvP's 20 s reconnect grace (+28 to a real opponent); only the forfeiter's −14 value is shared — reworded
- [RECOMMENDED] Acceptance Criteria (AC8): "damages B without reading B's pool" reads as a shield bypass, contradicting R7 (B7 ∈ incoming, shields absorb in full); meant computation independence — reworded
- [RECOMMENDED] Dependencies (bidirectionality check): ranked-league (OQ-RL3), speech-io and ui-shell DO mention real-pvp without dependency rows — claim corrected, conclusion (no reverse row needed) unchanged
- [nice-to-have] consolidate a `## Tuning Knobs` section (safe ranges already live in the R-series variable tables)
- [nice-to-have] Overview embeds the Player Fantasy paragraph; split into its own section if the project ever moves to workflow `full`

Reviewed-Content-Hash: design/gdd/real-pvp.md b41ee9b6f7748abc164cbc2983657e16c631019c
Reviewed-Content-Hash: design/registry/entities.yaml e9d97c3657e1174cb42fb9831af09490ae2f8a70
Reviewed-Content-Hash: .claude/skills/design-review/SKILL.md a63d8fba9b7142eeb43791f061e2e1533c429b43
Reviewed-Content-Hash: design/gdd/battle-system.md d01736db7155338bf9634459fac0d69648865c19
Reviewed-Content-Hash: design/gdd/accounts-backend.md ec728fca822161eb68f2ad27ec55dc87f088d452
Reviewed-Content-Hash: design/gdd/ranked-league.md c751daa0c3ac66250c883fba1e769798b6f3194a
Reviewed-Content-Hash: design/gdd/question-content.md bc549ac8c9d5a0a72de4f90b0a1adce61e3cdc8a
Reviewed-Content-Hash: design/gdd/speech-io.md 023f623b63c334ccc806a58c0368166aa86f0b5a
Reviewed-Content-Hash: design/gdd/ui-shell.md ed75062fc8fbffd29066ed9cf5a4d6a64c79e9ae
Reviewed-Content-Hash: design/gdd/game-concept.md 227909cf7f2fd7ac45a6510b3e4fdabf09f997dd
Reviewed-Content-Hash: design/gdd/systems-index.md 97bca12e92250d0baea9bf2a90c71637d5491bbe
Reviewed-Content-Hash: design/gdd/equipment.md 6b81f574f9d30340a1ba6b6bbab3356d29bc5e67
Reviewed-Content-Hash: design/gdd/hero-class.md 0742765ec80da476ce96c8052b9b2f7e4a73e4e8

## Review — 2026-11-09 — Verdict: APPROVED
Review mode: lean · Workflow: standard
Scope signal: XL
Specialists: none (lean mode — single-session main review)
Blocking items: 0 | Recommended: 3
Summary: Re-review after same-session revision (receipt-verified: the doc's bytes are the post-fix state). All 8 prior findings confirmed fixed in the current text — R4's worked example now uses the asymmetric-clock fixture consistent with AC5, R2's guarantee rests on min-consent (1599+300=1899<1900), R3's distortion covers the 5 s floor, analytics status reads Approved, draw-event vocabulary stated as new, forfeit-parity wording split, AC8 disambiguated to computation independence, bidirectionality claim precise. Registry and 7 cross-document files changed since the prior stamp; every cross-document fact re-verified clean (0.92 armor, B9 shape, 3000 ms fast-crit, reveal delays, tier floors, ±28/−14, def 120 / shield 145, mana 30/10/100 gate 90, 14.75 s worst round, 15-min abandon window; all 9 owned pvp_* entries). 6/6 required sections at `standard`. New cosmetic note: battle-system already updated its real-pvp row to "GDD Designed (Full Vision)", making this GDD's "may update" clause historical.
Prior verdict resolved: Yes (all 8 items applied and verified)
Findings:
- [RECOMMENDED] Dependencies: consolidate a `## Tuning Knobs` section (safe ranges live in the R-series tables; required at workflow `full`)
- [RECOMMENDED] Overview: split the player-fantasy paragraph into its own section (same `full`-tier trigger)
- [RECOMMENDED] Dependencies (bidirectionality note): battle-system's stale status row was already updated to "GDD Designed (Full Vision)" — the "next edit may update it" clause is now historical; trim on the next edit of this GDD
Reviewed-Content-Hash: design/gdd/real-pvp.md b41ee9b6f7748abc164cbc2983657e16c631019c
Reviewed-Content-Hash: design/registry/entities.yaml bf83d47608cc69223c064ee187e26242f4f10412
Reviewed-Content-Hash: .claude/skills/design-review/SKILL.md a63d8fba9b7142eeb43791f061e2e1533c429b43
Reviewed-Content-Hash: design/gdd/battle-system.md 3b0ab5dba82c8ec77ed09bccf7c395da1cfe2f1d
Reviewed-Content-Hash: design/gdd/accounts-backend.md c8c97ba0034d0a7f98b01dc0f1b7f3a0c069006e
Reviewed-Content-Hash: design/gdd/ranked-league.md c751daa0c3ac66250c883fba1e769798b6f3194a
Reviewed-Content-Hash: design/gdd/question-content.md f60c0c4489ce9c33a2ffbeea3289b3638e3dba6e
Reviewed-Content-Hash: design/gdd/speech-io.md 3f8d4d9487a7f794474baece72ce015ded3954d0
Reviewed-Content-Hash: design/gdd/ui-shell.md ed75062fc8fbffd29066ed9cf5a4d6a64c79e9ae
Reviewed-Content-Hash: design/gdd/game-concept.md 8cac03b91229e2124077facf4c10dc95dc728e46
Reviewed-Content-Hash: design/gdd/systems-index.md cbe8a156960d8d0a8c51bf16219fe5a414ddf10e
Reviewed-Content-Hash: design/gdd/equipment.md 6b81f574f9d30340a1ba6b6bbab3356d29bc5e67
Reviewed-Content-Hash: design/gdd/hero-class.md 78c23f7ae43f25cf3a3f74f9e3db724bab912480
