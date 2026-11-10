# Architecture Review — 2026-11-10

Date: 2026-11-10
Mode: full
Workflow: standard (rigor: standard)
Engine: Web — React ^19.0.0 + TypeScript ^5.7.0 + Vite ^8.0.5 + Tailwind CSS ^4.0.0 + lucide-react ^1.63.0 (out-of-catalog; pin source `docs/engine-reference/web/VERSION.md`)
GDDs Reviewed: 15 (all system GDDs; `game-concept.md` + `systems-index.md` read as context)
ADRs Reviewed: 5 (adr-0001…adr-0005, **all Accepted** — quartet + ADR-0005 on 2026-11-10)

Reviewed-Content-Hash: docs/architecture/adr-0001-seeded-prng-and-stream-derivation.md 8910b9da8ad6ac113453acf0aeb6adf18e287345
Reviewed-Content-Hash: docs/architecture/adr-0002-persistence-boundary-and-backend-stack.md aead69e2163c6607a852fde17c94075a9af3d81a
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
Reviewed-Content-Hash: docs/architecture/tr-registry.yaml b998e0d1f87f3ebbde24a5300487c9c93e1ac471
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

Total requirements: **418** (unchanged from the 2026-11-09 registration — no new TR-IDs this run; the changed GDDs' edits were cross-reference re-pins and formula-hygiene repairs, not new requirements)

| Status | Count | Meaning |
|--------|-------|---------|
| ✅ Covered by Accepted ADR | **63** (15%) | Quartet (54 rows, flipped from 🟡) + ADR-0005 (9 new rows: TR-tower-018/019; TR-question-content-020/026/027/028/029/030/032; plus added attribution on TR-battle-system-019/021) |
| ⚠️ Partial | **0** | Partial-decision items remain integration notes below |
| ❌ Named pending-ADR gap | **2** (<1%) | Both Full-Vision deferred tier |
| — Implementation tier | **353** (84%) | GDD-owned; no architecture-level decision required at `standard` |

Full matrix: `docs/architecture/requirements-traceability.md` (updated this run).

### Coverage Gaps (no ADR exists)

1. ❌ **TR-analytics-043** (analytics) — sink storage route deliberately open (custom tables vs third-party pipeline, OQ-AN1).
   Suggested ADR: `/architecture-decision` **Analytics sink route** (Required ADR #6 — write before any analytics implementation story; storage rides ADR-0002's stack). Domain: Data/Persistence. Engine Risk: LOW.
2. ❌ **TR-real-pvp-039** (real-pvp) — server-callable question draw + server-side speech scoring (OQ-RVP3) + PvP-source ladder events.
   Suggested ADR: `/architecture-decision` **Server-side speech scoring** (Required ADR #8 — deferred with real-pvp; draw transport rides Required ADR #7). Domain: AI/Audio/Networking. Engine Risk: MEDIUM.

**Required ADR #7** (real-time transport + hosting regions) still has no ❌ rows — real-pvp.md deliberately leaves transport undecided. Trigger stands: write before any PvP epic; must not be precluded by ADR-0002's stack.

**Required ADR #5** (ranked server-computed RP): resolved by ADR-0003 §3 (Accepted).

---

### Cross-ADR Conflicts

**No 🔴 conflicts.** Dependency graph (`adr-dep-graph.sh`): no cycles; all edges resolve to Accepted ADRs. One **structural gap** (not a conflict):

- **ADR-0005 reports `NO_DEPS_SECTION`** — its dependencies are recorded as a relationship *table* (`## ADR Dependencies` → ADR/Relationship columns) rather than a `Depends On` row the script parses, so the graph sorts it as if independent. Content-wise it declares dependence on ADR-0001…0004 (all Accepted), so nothing is actually out of order — but the script's output is wrong until the table gains a parseable `Depends On` row. One-line ADR-0005 edit; flag to `/architecture-decision` next touch.

Three **integration notes carried from 2026-11-09** — both sides are now **Accepted**, so these are no longer "resolve at acceptance" items; they are **defects in accepted decisions** that must be fixed before migration 0001 exists (additive-only freeze makes post-hoc repair a migration):

1. **Seed-anchored idempotency lacks its unique constraint.** ADR-0003 §1 anchors `battle_end`/`tower_stage_result` idempotency on seed ("unique constraint — the battle's identity"), but ADR-0002's `commits(commit_id PK, …)` schema declares no `(type, seed)` uniqueness and no `applied_seeds` structure. A replayed battle commit would double-apply until this is an explicit unique index in migration 0001.
2. **ADR-0003's `state_digest`/`base_digest` has no home in ADR-0002's schema.** The per-account monotonic counter is returned on every commit response but no table holds it. Additive migration can add it, but the ownership should be pinned now while the schema is still only on paper.
3. **Wire types have two undeclared sources of truth** (ADR-0003's TS envelope types vs Fastify JSON-Schema validation). NOT SOURCEABLE — json-schema-to-ts/TypeBox behavior is not covered by `docs/engine-reference/web/`; decide the sync direction (schema→codegen or TS→derived schema) at `/test-setup`/scaffold time and record it in an ADR note or the scaffold story.

### ADR Dependency Order

`adr-dep-graph.sh`: **ORDER: adr-0001, adr-0005*, adr-0002, adr-0004, adr-0003** — no cycles, no unresolved dependencies (*adr-0005 sorts early only because of the NO_DEPS_SECTION gap above; its declared order is 0001 → 0002 → 0004 → 0003 → 0005). All five Accepted; the quartet's numbered order in architecture.md holds.

### GDD Revision Flags

Carried from 2026-11-09, re-checked in GDD content this run:

| GDD | Flag | State |
|-----|------|-------|
| ranked-league.md | grace-window constant table vs ADR-0003 §4 | **RESOLVED 2026-11-10** — Core Rule 11 + constant table re-pinned to `started_at`, "client events do not extend it" (line-level verified) |
| equipment.md | name battle's stream ownership for elimination draws | **RESOLVED in content** — EQ25 now states the draw is "via battle's seeded stream"; TR-battle-system-023 cross-reference registered |
| battle-system.md + opponent-ai.md | `resolve_round` signature lacks ADR-0004's `input_source` parameter | **OPEN** — both GDDs still write `resolve_round(profile, mode, seed, round_index)`; add the parameter at each GDD's next edit |

New flags this run: **none** — the 2026-11-10 GDD edits (battle B4 multiplier-composition rule, ranked CR11 re-pin, ui-shell retarget) are consistent with the ADR set.

### Engine Compatibility Issues

**Engine audit** (Phase 5, run against the now-populated engine reference):

- **ADRs with Engine Compatibility section: 5 / 5.**
- **Deprecated-API check: now ASSESSABLE for the first time** (the 2026-11-09 run recorded it NOT ASSESSED — no `deprecated-apis.md` existed). Grep of all five ADRs against every row of `deprecated-apis.md` (Vite 8 `rollupOptions`/`esbuild`/`manualChunks` family, TS 6/7 `moduleResolution: node`/`baseUrl`, Vitest 4/5 removals, Playwright removals, three.js/Phaser/PixiJS sets): **zero hits**. ADR-0004's "workspace" mentions are pnpm-workspace alternatives prose, not Vitest config. Clean.
- **Stale-version/stale-reference rows** (informational — none changes a decision):
  - ADR-0001's Knowledge Risk row and `architecture.md`'s Engine Knowledge Gap Summary both state the engine reference holds *only* `VERSION.md`. That was true when written; `breaking-changes.md`, `deprecated-apis.md` and `current-best-practices.md` now exist (plus phaser/pixijs/threejs framework pages). architecture.md's HIGH-RISK flags on Vite 8 / Tailwind 4 / lucide 1.x can now be partially verified against these files instead of staying fully quarantined; refresh that paragraph at architecture.md's next touch.
  - `architecture.md` "ADRs Referenced: ADR-0001…0004" — **ADR-0005 (Accepted 2026-11-10) is missing** from that line and from the Required-ADR numbering's record (see Architecture Document Coverage).
- **Version consistency**: all ADRs cite the same pin set (React 19 / TS 5.7 / Vite 8 / Tailwind 4 / lucide 1.63); no ADR cites an unverified post-cutoff API behavior — the quarantine discipline held. Note for the scaffold story: `breaking-changes.md` documents TypeScript 6.0/7.0 hard errors (`baseUrl` banned, `moduleResolution: node` banned) — `/test-setup` should now consult `breaking-changes.md` when writing the tsconfig, since the reference that was missing at ADR-writing time exists.
- **Engine specialist look (Web / lead-programmer lens, `references/lens-engine.md`)**:

  ### Engine Specialist Findings
  1. **🔴 HIGH (carried, escalated) — ADR-0002 `seed_hi/seed_lo INT` overflows as written.** Postgres `integer` is signed int32; a uint32 half reaches 4,294,967,295, so ~half of all seeds fail on insert. The 2026-11-09 finding said "fix before the acceptance round touches the schema"; **the acceptance round happened and the fix did not land** — ADR-0002 §Decision still reads `seed_hi INT, seed_lo INT` with "uint32 columns". Fix before migration 0001: store halves as BIGINT, or pin a documented signed-reinterpretation with a server-side conversion helper on ADR-0001's `U64` type. This is now a defect inside an Accepted ADR, not a Proposed-vs-Proposed note.
  2. **🔶 MED — Server TS compilation story still undecided** (shared tsconfig vs project references vs two configs; tsc emit vs tsx vs bundler for production). ADR-0004's dual-context CI is the drift-enforcement mechanism the trust model rests on — decide at `/test-setup`, now against `breaking-changes.md`'s TS-7 facts.
  3. **🔶 MED — `SameSite=Lax` cookie posture silently requires SPA and API on one registrable domain.** ADR-0002 decides cookie attributes but not the deployment co-location constraint they depend on. One sentence needed in ADR-0002's hosting shape.
  4. **🔶 MED — Version-risk concentration unchanged**: every verification mechanism (vector fixtures, dual-context CI, replay identity) runs under vitest, whose Vite-8 peer range remains resolved only at scaffold. `breaking-changes.md` now documents Vitest 4→5 removals — the scaffold story should pin the vitest version *and* check it against that page.
  5. **🔶 LOW — ADR-0004's boundary lint rules still name no linter** (oxfmt is formatter-only; eslint/oxlint undecided). NOT SOURCEABLE — import-rule plugins are not covered by the engine reference.
  6. ✅ **Re-confirmed sound**: splitmix64/draw53 math (top-53-bits dodges weak low-order bits; max value exactly 2⁵³−1); `crypto.getRandomValues` seed generation; argon2id m=19456/t=2/p=1 matches OWASP minimum (re-verify at implementation as the ADR requires); opaque-token stateful sessions over JWT given revocation ACs; ADR-0003's HTTP+JSON commit shape and exactly-once forfeit scan; ADR-0004's single-app + lint purity + dual-context CI; ADR-0005's two-pool-shape split is server-verifiable without new wire fields (all inputs already ride `/api/battles/start`).
  7. Minor (not blocking): in-memory throttle is per-instance under horizontal scaling; per-minute forfeit scan assumes a persistent Node process (serverless host needs an external scheduler); argon2 native binding shares the client lockfile.

### Architecture Document Coverage

`architecture.md` covers **15/15 systems** (layer map mirrors systems-index; no orphaned architecture, no missing system). Defects found this run:

1. "ADRs Referenced: ADR-0001…0004" — stale: **ADR-0005** exists and is Accepted; the Required-ADR list should record #6/#7/#8 as the only open ones.
2. Engine Knowledge Gap Summary paragraph stale — states no `breaking-changes.md`/`deprecated-apis.md`/`current-best-practices.md` exist; all three now do (see Engine Compatibility Issues).
3. Open-Questions table: QQ-01 (OQ-SI1 ult-timer semantics), QQ-03 (OQ-TW6 word-entry index), QQ-06 (OQ-AN2 toggle contract), QQ-07 (OQ-LC2 fidelity keys), QQ-08 (OQ-MP5 `floor_cleared` consumer), QQ-09/QQ-10 remain open — correctly tracked; QQ-04 and QQ-05's mechanisms are resolved by ADR-0002 and could gain resolved-marks at the next touch.

Both document defects are one-line fixes for architecture.md's next touch.

---

### Verdict: CONCERNS

Coverage is no longer the problem it was on 2026-11-09: every MVP/Alpha/Foundation/Core architecture-level requirement is now covered by an **Accepted** ADR, no conflicts, and the engine audit is clean. What keeps this at CONCERNS:

1. Two named pending-ADR gaps (both deliberately deferred: analytics sink → ADR #6 before analytics stories; speech scoring → ADR #8 with PvP).
2. The three integration notes are now defects **inside Accepted ADRs** — above all the seed-column int32 overflow, which would corrupt ~50% of battle-record inserts if migration 0001 shipped as written.
3. One open GDD revision flag (`resolve_round` `input_source` parameter, battle-system + opponent-ai next edit).

**Blocking before scaffold/`/test-setup`** (not before the verdict):
- Amend ADR-0002: seed halves → BIGINT (or pinned signed-reinterpretation), `(type, seed)` unique constraint, `state_digest` home, SameSite co-location sentence.
- Resolve the wire-type source of truth at scaffold time.

**Not blocking, tracked**: ADR-0005 `Depends On` row for the dep-graph script; architecture.md's two stale lines; ADR-0001/architecture.md engine-gap paragraph refresh; TR-analytics-043 and TR-real-pvp-039 at their tier's trigger.

### Required ADRs (remaining)

1. **ADR #6 — Analytics sink route** (OQ-AN1 / TR-analytics-043): custom event tables vs third-party pipeline. Before any analytics implementation story; rides ADR-0002's stack.
2. **ADR #7 — Real-time transport + hosting regions** (OQ-RVP4/5/8): before any PvP epic; must not be precluded by ADR-0002 (WebSocket capability, region topology).
3. **ADR #8 — Server-side speech scoring** (OQ-RVP3 / TR-real-pvp-039): deferred with real-pvp; the scorer interface (TR-speech-io-008) is the not-preclude contract.
