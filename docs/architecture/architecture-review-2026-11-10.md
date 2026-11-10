# Architecture Review Report

Date: 2026-11-10 (re-run — supersedes this morning's same-day report, preserved as `architecture-review-2026-11-10-run1.md`)
Mode: full
Workflow: standard (rigor: standard)
Engine: Web — React ^19.0.0 + TypeScript ^5.7.0 + Vite ^8.0.5 + Tailwind CSS ^4.0.0 + lucide-react ^1.63.0 (pin: `docs/engine-reference/web/VERSION.md`)
GDDs Reviewed: 15 system GDDs (+ `systems-index.md`, `game-concept.md`)
ADRs Reviewed: 5 — ADR-0001…0005, all **Accepted**

## Run Provenance (freshness check outcome)

- **ADR-0002 CHANGED** since the morning report (2026-11-10 amendment: BIGINT seed halves + CHECKs, `commits_seed_anchor` partial unique index, `state_digest`/`result_state_digest`, SameSite=Lax co-location) — the morning report predates the amendment and does not cover this run.
- **UNRESOLVED: `docs/engine-reference/web/modules/*.md`** — the `modules/` directory does not exist (the web reference is flat: VERSION, breaking-changes, deprecated-apis, current-best-practices, threejs, phaser, pixijs). Per Phase 1a this disqualifies standing on or scoping from the prior report; the full review ran as asked. Per-domain module checks remain **NOT ASSESSED** (no module docs exist) — recorded in the Engine section, not silently skipped.
- Every other review input `UNCHANGED` since the morning run; its 418-requirement extraction is reproduced by this run (registry = extraction; 0 new IDs).

Reviewed-Content-Hash: docs/architecture/adr-0001-seeded-prng-and-stream-derivation.md 8910b9da8ad6ac113453acf0aeb6adf18e287345
Reviewed-Content-Hash: docs/architecture/adr-0002-persistence-boundary-and-backend-stack.md d98641c7ce000d457d9d0cb9556a37631e6b6cad
Reviewed-Content-Hash: docs/architecture/adr-0003-commit-protocol-and-trust-model.md e5c23e47d81e9aa20f678554b323140b69aa2c6f
Reviewed-Content-Hash: docs/architecture/adr-0004-module-layout-and-b-series-extraction.md a3511e9b2f21fafdb1ad5f851d9fb1bab05a14e8
Reviewed-Content-Hash: docs/architecture/adr-0005-encounter-keyed-question-pools.md 87210b78bf9338418b19fe89e5b9ca47837a66e9
Reviewed-Content-Hash: design/gdd/accounts-backend.md c8c97ba0034d0a7f98b01dc0f1b7f3a0c069006e
Reviewed-Content-Hash: design/gdd/analytics.md ee1e73b830bd54a5108099af96cb041ca2e54934
Reviewed-Content-Hash: design/gdd/battle-system.md 2575939e48bc52e75978f680ac62c0233b09971c
Reviewed-Content-Hash: design/gdd/equipment.md 6b81f574f9d30340a1ba6b6bbab3356d29bc5e67
Reviewed-Content-Hash: design/gdd/forge-srs.md 3d58219dd1c04a6e48e9ead75c57d428f74a6a96
Reviewed-Content-Hash: design/gdd/game-concept.md 8cac03b91229e2124077facf4c10dc95dc728e46
Reviewed-Content-Hash: design/gdd/gdd-cross-review-2026-11-09.md b6bb2a295efd83b61d7534d0cda910dffc793136
Reviewed-Content-Hash: design/gdd/gdd-cross-review-2026-11-10.md d4c8cb1b3d7e8062a5a03ead3ce36d06a94cb845
Reviewed-Content-Hash: design/gdd/hero-class.md 78c23f7ae43f25cf3a3f74f9e3db724bab912480
Reviewed-Content-Hash: design/gdd/localization.md f566a20c280cfce826a4821629e921062beabe76
Reviewed-Content-Hash: design/gdd/meta-progression.md 055094dd954982e7c77548e67178e75e8914c7cc
Reviewed-Content-Hash: design/gdd/opponent-ai.md 66890e06a634a3700cd97bc77dcc3b26f6e3c7a0
Reviewed-Content-Hash: design/gdd/question-content.md f60c0c4489ce9c33a2ffbeea3289b3638e3dba6e
Reviewed-Content-Hash: design/gdd/ranked-league.md 8129168b5f6a06ed7f0919ddc4c753d428ec8674
Reviewed-Content-Hash: design/gdd/real-pvp.md b41ee9b6f7748abc164cbc2983657e16c631019c
Reviewed-Content-Hash: design/gdd/speech-io.md 3f8d4d9487a7f794474baece72ce015ded3954d0
Reviewed-Content-Hash: design/gdd/systems-index.md fdaffc97f6d0c363d48c24ce43cb780025b54f76
Reviewed-Content-Hash: design/gdd/tower.md 8c7660fa52272fd32ff38ecf5567fd44dfb6d7c7
Reviewed-Content-Hash: design/gdd/ui-shell.md c3566a74d8d446486e89c2773642ad30ca1903b7
Reviewed-Content-Hash: docs/architecture/tr-registry.yaml a43920cae48c3d8c4ce482bbf8b792abe367ef58
Reviewed-Content-Hash: docs/architecture/architecture.md 499aa50b6c40abada1bcb0f29114055d69832b1d
Reviewed-Content-Hash: docs/engine-reference/web/breaking-changes.md 0b9fe8a9f3edd92f2e48eb8956038366b4bb1d97
Reviewed-Content-Hash: docs/engine-reference/web/current-best-practices.md 24e89268200a118b8ec78ab2e31b7e9e2f8374ea
Reviewed-Content-Hash: docs/engine-reference/web/deprecated-apis.md 4811d5d832a2f70f755cc3724d7f32b386f11740
Reviewed-Content-Hash: docs/engine-reference/web/phaser.md 7b5a7e9ee74fdec8db14d195cdc2d0e298639d16
Reviewed-Content-Hash: docs/engine-reference/web/pixijs.md 3bca6bc9754c6dd9e3e078e775b951e2d61a17fa
Reviewed-Content-Hash: docs/engine-reference/web/threejs.md a0657198ca81ec6a97d0b5692e878256c2cce43e
Reviewed-Content-Hash: docs/engine-reference/web/VERSION.md b87e3c70aec67af0e541b8f942cfc1a9b54f0bd1
Reviewed-Content-Hash: project.yaml 7f2aaf7c4f4cc0b3f764e0006a7064e4ec18e2b2
Reviewed-Content-Hash: .claude/docs/technical-preferences.md 38f5aea0a7a929f0edfa69ca642c7ac75a49b38a
Reviewed-Content-Hash: .claude/skills/architecture-review/SKILL.md 8c1dd9d6f27f396e3b769b939de27d780d7c486a
Reviewed-Content-Hash: .claude/skills/architecture-review/references/1-load.md 9a65759ebdbb2cb1f9744775bfed18cb25e76347
Reviewed-Content-Hash: .claude/skills/architecture-review/references/2-extract-requirements.md d08ea0b0e9ab9760b0d8bfe0cd9115f0bc40f8e2
Reviewed-Content-Hash: .claude/skills/architecture-review/references/3-traceability.md bb7b6b65c5e5e5b8869fa692413aa831615dede7
Reviewed-Content-Hash: .claude/skills/architecture-review/references/4-conflicts.md 0d30f8173b23248a32523a365b606dd1ce9642ab
Reviewed-Content-Hash: .claude/skills/architecture-review/references/5-engine.md 9a0de3ccca214e473e9433450462e0c6e57f9de2
Reviewed-Content-Hash: .claude/skills/architecture-review/references/6-document-coverage.md dcce78482ec2ce60048989b6f9d1f797dd0a9a0e
Reviewed-Content-Hash: .claude/skills/architecture-review/references/7-report.md a43e17378df952791974dab5f10d7a98c16156fe
Reviewed-Content-Hash: .claude/skills/architecture-review/references/8-write.md bf6d8946fc7b9e19eda7f65503a5c8f593a0d2b1
Reviewed-Content-Hash: .claude/skills/architecture-review/references/9-handoff.md ade419da14b200ae3bc8d00ed3f2c04707a6275b
Reviewed-Content-Hash: .claude/skills/architecture-review/references/lens-engine.md d7770f2737d185cf51a338aaf550fa01b773fb07

---

## Traceability Summary

Total requirements: **418** (permanent registry baseline, 2026-11-09 provenance)

| Status | Count | Note |
|--------|-------|------|
| ✅ Covered (Accepted ADR) | **63** (15%) | incl. 9 via ADR-0005; ADR-0002 amendment strengthens existing coverage (seed storage, idempotency anchor, state_digest) without new rows |
| ⚠️ Partial | **0** | |
| ❌ Gaps | **2** (<1%) | both Full-Vision deferred tier, named pending ADRs |
| — Implementation tier | **353** (84%) | GDD-owned at `modes.workflow: standard`; no ADR required |

Per-system counts unchanged from `requirements-traceability.md` (headings there were stale `🟡` — fixed this run to match the rows and summary).

### Coverage Gaps (no ADR exists)

- ❌ **TR-analytics-043** (analytics) — sink storage route deliberately open (custom tables vs third-party pipeline, OQ-AN1).
  Suggested ADR: `/architecture-decision` **Analytics sink route** (Required ADR #6 — write before analytics implementation; storage rides ADR-0002's stack). Domain: Persistence. Engine Risk: LOW.
- ❌ **TR-real-pvp-039** (real-pvp) — server-side speech scoring (OQ-RVP3) + server-callable question draw with same build gates.
  Suggested ADR: `/architecture-decision` **Server-side speech scoring** (Required ADR #8 — deferred with real-pvp; scorer interface TR-speech-io-008 is the not-preclude contract). Domain: Networking. Engine Risk: MEDIUM (server speech APIs unverifiable pre-PvP).
- **ADR #7** (real-time transport + hosting regions, OQ-RVP4/5/8) has no ❌ rows — real-pvp deliberately leaves transport undecided, so no requirement text names it. Trigger stands: write before any PvP epic; must not be precluded by ADR-0002's stack.

## Cross-ADR Conflicts

### Conflict: ADR-0003 vs ADR-0005 / battle-system GDD — encounter enum spelling
Type: Integration contract
ADR-0003 claims: `/api/battles/start` registration wire shape spells the friend-encounter value **`friendly`** (`encounter: friendly | tower_stage | tower_boss | ranked` — ADR-0003 §2, line 83).
ADR-0005 + GDD claim: battle-system Core Rule 2 and AC BS2 pin the enum as **`friend | ranked | tower_stage | tower_boss`**; ADR-0005's pool selection (`friend`, `ranked` = battle-mode) keys on that same value at this endpoint.
Impact: fail-closed registration validation (ADR-0005 §4) would reject every friend battle started by a client built to the GDD/ADR-0005 enum — or the reverse, depending which spelling the scaffold implements.
Resolution options:
  1. Pin **`friend`** (GDD is source of truth; one-word fix in ADR-0003 §2's wire comment) — recommended.
  2. Pin `friendly` and rewrite battle-system Core Rule 2 + BS2 — rejected: rewrites an Approved GDD to match a wire-comment typo.
Severity: **non-blocking** (one token in a wire-shape comment; no Foundation/Core requirement uncovered) but must be fixed before scaffold stories wire `/api/battles/start`.

### Carried alignment item (documented, not a new conflict): ADR-0002 vs ADR-0003 — seed uniqueness scope
Type: Data identity
ADR-0002's `battle_registrations` uses `seed` as a **globally unique PK** (ADR-0003 §2), while the commit anchor `commits_seed_anchor(account_id, type, seed_hi, seed_lo)` is **per-account**. Two different identities for "the battle identity" (registration identity vs idempotency anchor). Crypto-random uint64 seeds make collision practically impossible, so no behavioural break is reachable, but the scopes should be stated consistently. Named in ADR-0002's Amendment History as an alignment item for ADR-0003's next edit — still open.

## ADR Dependency Order

Script output (`adr-dep-graph.sh`, observations only): `ADRS: 5` · edges 0002→0001, 0003→0001, 0003→0002, 0004→0001 · **no cycles** · `NO_DEPS_SECTION: adr-0005` · `ORDER: adr-0001, adr-0005, adr-0002, adr-0004, adr-0003`.

- **ADR-0005 NO_DEPS_SECTION is a structural gap, not a clean graph**: its `## ADR Dependencies` uses a table format the script cannot parse. Its real edges (Depends on ADR-0001/0002/0003/0004) are recorded in that table and all four are Accepted — the topological result is unaffected in substance, but the script's ORDER line overstates 0005's independence.
- No unresolved dependencies: every `Depends On` target exists and is **Accepted**.
- Stale prose inside ADR-0003's `Depends On` row ("Both currently Proposed — this ADR cannot be Accepted before them") — its dependencies were accepted 2026-11-10; the row's reasoning text predates that. Hygiene fix at ADR-0003's next edit (same pass as the seed-PK alignment item and the `friendly` fix).

### Recommended ADR Implementation Order (topologically sorted, all Accepted)
1. ADR-0001 — Seeded PRNG + stream derivation (no deps)
2. ADR-0005 — Encounter-keyed question pools (deps 0001–0004, recorded in unparsed table)
3. ADR-0002 — Persistence boundary + backend stack (requires 0001)
4. ADR-0004 — Module layout + B-series extraction (requires 0001)
5. ADR-0003 — Commit protocol + trust model (requires 0001, 0002)

## GDD Revision Flags

Carried from the 2026-11-10 morning run (unchanged):

| GDD | Assumption | Reality | Action |
|-----|-----------|---------|--------|
| battle-system + opponent-ai | `resolve_round(profile, mode, seed, round_index)` signature wording — the `input_source` parameter flag | ADR-0004 requires the input source to be a first-class parameter, never a branch buried in battle code | Revise both GDD signatures at next edit (open; no registry text change) |

No new engine-based revision flags — no verified engine behaviour contradicts a GDD assumption.

## Engine Compatibility Issues

### Engine Audit Results
Engine: Web — React ^19.0.0 + TypeScript ^5.7.0 + Vite ^8.0.5 (Tailwind ^4.0.0, lucide-react ^1.63.0)
ADRs with Engine Compatibility section: **5 / 5**

Deprecated API References: **none** — grep of all ADRs + architecture.md against every row of `deprecated-apis.md` (three.js/Phaser/PixiJS/Vite 8/TS 6–7/Vitest/Playwright tables): NO HITS.

Stale Version References: **none** — all ADRs cite the same VERSION.md pins. Note (not a finding): the toolchain reference records current Vite 8.3 / TS 7.0; the project's ^8.0.5 / ^5.7.0 pins are prototype-sourced decisions owned by VERSION.md.

Post-Cutoff API Conflicts: **none**. ADR-0002's "possibly Fastify v5 minor APIs" is scaffold-resolved and conflicts with nothing; ADR-0001/0003/0005 claim none; ADR-0004's HIGH flags attach to Vite 8 config specifics, verified at `/test-setup` by design.

**Per-domain module checks: NOT ASSESSED** — `docs/engine-reference/web/modules/` does not exist (Phase 1a UNRESOLVED glob; structural fact about the reference, not a missed read). The reference covers the toolchain and three render libraries the project does not use (threejs/phaser/pixijs); no module docs exist for the project's actual domains (React/Tailwind component surface, Web Speech, WebCrypto). This limitation is shared by every ADR.

### Engine Specialist Findings (Web — lead-programmer lens)

- **Confirmed clean**: constants are data-file-owned (ADR-0004 §2, ADR-0005 §2 — no hardcoded tuning); sim core is pure TS with DI over singletons (ADR-0004, coding standards); no per-frame-work or allocation-in-hot-path decisions in any ADR; cost claims are bounded and modest (ADR-0001 ≤ ~20 draws/battle O(1); ADR-0003 one replay per ranked commit + one forfeit query/min — no unverifiable frame-budget numbers).
- **ADR-0002** (in-memory throttle counters): process-global mutable state — acceptable: keyed, bounded, restart-clearing documented and blessed by the GDD (F2/AC-E4). Named here because the lens flags global mutable state; the ADR already records the trade.
- **ADR-0001 claim correction (stale basis)**: its Knowledge Risk row states "no `modules/`, `breaking-changes.md`, or `deprecated-apis.md` exist". Today `breaking-changes.md` and `deprecated-apis.md` **do exist** (they grew after ADR-0001 was written); only `modules/` is still absent. The substance stands — the ADR consults no module doc, and its per-domain checks remain honestly NOT ASSESSED — but the stated reason is half-outdated. Fix the row at ADR-0001's next edit (or on a Last Verified bump).
- **ADR-0002 BIGINT amendment verified against reference**: the seed-half storage fix is platform arithmetic (Postgres signed int32), not engine-API surface — nothing in the reference contradicts it. The `driver int8-mapping note` remains correctly flagged NOT SOURCEABLE → scaffold.

## Architecture Document Coverage

`docs/architecture/architecture.md` exists and covers **all 15 systems** from `systems-index.md` in its layer map; no orphaned architecture (every layer item maps to an Approved GDD). Data-flow seams: the four plain-data contracts (LoadoutSnapshot, BattleResult, encounter config, scorer interface), the commit envelope, content API, and battle-start registration cover every cross-system communication the GDDs define; API boundaries are pinned by ADR-0002/0003/0005.

Stale lines (carried + verified still present; fix at architecture.md's next edit):

1. **"ADRs Referenced: ADR-0001…0004"** — ADR-0005 (Accepted 2026-11-10) is missing from the list.
2. **Engine Knowledge Gap paragraph** states the reference "contains only VERSION.md; no breaking-changes.md, deprecated-apis.md, current-best-practices.md, or modules/" — three of the four now exist; only `modules/` is still absent. The paragraph's NOT ASSESSED scoping underreads what the reference now covers.
3. **Open Questions table** — QQ-04 (OQ-FS1) and QQ-05's mechanics half are resolved by ADR-0002 (QA build-config profiles; additive-only freeze) but the table rows still point at "ADR #2" as future work.

---

## Verdict: **CONCERNS**

- All Foundation/Core-layer requirements are covered by **Accepted** ADRs; the 2 gaps are deferred Full-Vision tier with named pending ADRs (#6, #8).
- One real cross-ADR integration conflict found (`friendly` vs `friend`) — one-word, non-blocking, with a clear resolution.
- Carried items: ADR-0002↔0003 seed-scope alignment, ADR-0005 unparsed dependency table, architecture.md stale lines, ADR-0001 stale reference-basis row.
- Module-level engine checks remain **NOT ASSESSED** (no `modules/` docs exist) — a named limitation of the reference, not a pass.

### Blocking Issues (must resolve before PASS)

None (no FAIL conditions: no Foundation/Core coverage gap, no blocking conflict).

### Required ADRs (remaining, prioritised)

1. **ADR #6 — Analytics sink route** (OQ-AN1) — before analytics implementation; storage rides ADR-0002's stack. Unblocks TR-analytics-043.
2. **ADR #7 — Real-time transport + hosting regions** (OQ-RVP4/5/8) — deferred with real-pvp; write before any PvP epic.
3. **ADR #8 — Server-side speech scoring** (OQ-RVP3) — deferred with real-pvp; unblocks TR-real-pvp-039.

## Files Written This Run

- `docs/architecture/architecture-review-2026-11-10.md` — this report (morning report preserved as `-run1.md`).
- `docs/architecture/requirements-traceability.md` — 15 stale `🟡` section headings → `✅` (matching rows/summary); TR-ranked-league-026 row text re-pinned to the GDD's post-ADR-0003 §4 wording (blessed 15, from `started_at`).
- `docs/architecture/tr-registry.yaml` — TR-ranked-league-026 `requirement` text revised + `revised: 2026-11-10`; `last_updated` bumped. `registry.sh validate`: 0 errors. New TR-IDs: **none**.

## Pre-Gate Checklist

| Item | Status |
|------|--------|
| `tests/unit/` + `tests/integration/` | ✅ exist (empty — pre-scaffold, expected at Technical Setup) |
| `.github/workflows/tests.yml` | ✅ |
| `design/accessibility-requirements.md` | ✅ |
| `design/ux/interaction-patterns.md` | ✅ |

Rerun trigger: re-run `/architecture-review` after each new ADR (next expected: ADR #6, analytics sink).
