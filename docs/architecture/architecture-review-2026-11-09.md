# Architecture Review — 2026-11-09

Date: 2026-11-09
Mode: full
Workflow: standard (rigor: standard)
Engine: Web — React ^19.0.0 + TypeScript ^5.7.0 + Vite ^8.0.5 + Tailwind CSS ^4.0.0 + lucide-react ^1.63.0 (out-of-catalog; pin source `docs/engine-reference/web/VERSION.md`)
GDDs Reviewed: 15
ADRs Reviewed: 4 (adr-0001…adr-0004, all `Proposed`)

Reviewed-Content-Hash: docs/architecture/adr-0001-seeded-prng-and-stream-derivation.md 3b339711e87539ff0ff6fd9875ee3d05749f1423
Reviewed-Content-Hash: docs/architecture/adr-0002-persistence-boundary-and-backend-stack.md 21054f7661c6d1ad6e2a35a7de58b2aedc35d133
Reviewed-Content-Hash: docs/architecture/adr-0003-commit-protocol-and-trust-model.md 4769dadfa19c39ef80d1270b62263eb446c33ea3
Reviewed-Content-Hash: docs/architecture/adr-0004-module-layout-and-b-series-extraction.md 5d13c0530de574fd218237e0479d161297dd43f1
Reviewed-Content-Hash: design/gdd/accounts-backend.md c8c97ba0034d0a7f98b01dc0f1b7f3a0c069006e
Reviewed-Content-Hash: design/gdd/analytics.md ee1e73b830bd54a5108099af96cb041ca2e54934
Reviewed-Content-Hash: design/gdd/battle-system.md c07f34eff26aff7a361fcada9ac3a9943efe57be
Reviewed-Content-Hash: design/gdd/equipment.md 6b81f574f9d30340a1ba6b6bbab3356d29bc5e67
Reviewed-Content-Hash: design/gdd/forge-srs.md 3d58219dd1c04a6e48e9ead75c57d428f74a6a96
Reviewed-Content-Hash: design/gdd/game-concept.md 8cac03b91229e2124077facf4c10dc95dc728e46
Reviewed-Content-Hash: design/gdd/gdd-cross-review-2026-11-09.md b6bb2a295efd83b61d7534d0cda910dffc793136
Reviewed-Content-Hash: design/gdd/hero-class.md 78c23f7ae43f25cf3a3f74f9e3db724bab912480
Reviewed-Content-Hash: design/gdd/localization.md f566a20c280cfce826a4821629e921062beabe76
Reviewed-Content-Hash: design/gdd/meta-progression.md 055094dd954982e7c77548e67178e75e8914c7cc
Reviewed-Content-Hash: design/gdd/opponent-ai.md 66890e06a634a3700cd97bc77dcc3b26f6e3c7a0
Reviewed-Content-Hash: design/gdd/question-content.md f60c0c4489ce9c33a2ffbeea3289b3638e3dba6e
Reviewed-Content-Hash: design/gdd/ranked-league.md c751daa0c3ac66250c883fba1e769798b6f3194a
Reviewed-Content-Hash: design/gdd/real-pvp.md b41ee9b6f7748abc164cbc2983657e16c631019c
Reviewed-Content-Hash: design/gdd/speech-io.md 3f8d4d9487a7f794474baece72ce015ded3954d0
Reviewed-Content-Hash: design/gdd/systems-index.md fdaffc97f6d0c363d48c24ce43cb780025b54f76
Reviewed-Content-Hash: design/gdd/tower.md 8c7660fa52272fd32ff38ecf5567fd44dfb6d7c7
Reviewed-Content-Hash: design/gdd/ui-shell.md ed75062fc8fbffd29066ed9cf5a4d6a64c79e9ae
Reviewed-Content-Hash: docs/architecture/tr-registry.yaml b998e0d1f87f3ebbde24a5300487c9c93e1ac471
Reviewed-Content-Hash: docs/architecture/architecture.md fc79e4b231cd87b8ee835232b36062b5cf285bf6
Reviewed-Content-Hash: docs/engine-reference/web/VERSION.md 2c17c3aa1990ea085c23fc32cf6db3244f540588
Reviewed-Content-Hash: project.yaml 09658b04e83a87b3d5025b2f88a883bcfc43a43d
Reviewed-Content-Hash: .claude/docs/technical-preferences.md 0ceda80192cd7a53de20eb35f8aa5fd3a25da758
Reviewed-Content-Hash: .claude/skills/architecture-review/SKILL.md 1a9d28aadbcbd26b5fc6b8ed1c64d73ae82b7b73
Reviewed-Content-Hash: .claude/skills/architecture-review/references/1-load.md 9a65759ebdbb2cb1f9744775bfed18cb25e76347
Reviewed-Content-Hash: .claude/skills/architecture-review/references/2-extract-requirements.md d08ea0b0e9ab9760b0d8bfe0cd9115f0bc40f8e2
Reviewed-Content-Hash: .claude/skills/architecture-review/references/3-traceability.md bb7b6b65c5e5e5b8869fa692413aa831615dede7
Reviewed-Content-Hash: .claude/skills/architecture-review/references/4-conflicts.md 0d30f8173b23248a32523a365b606dd1ce9642ab
Reviewed-Content-Hash: .claude/skills/architecture-review/references/5-engine.md 318ecbc1361d430badaf5dd8ce4cfc6ab0dff0ca
Reviewed-Content-Hash: .claude/skills/architecture-review/references/6-document-coverage.md dcce78482ec2ce60048989b6f9d1f797dd0a9a0e
Reviewed-Content-Hash: .claude/skills/architecture-review/references/7-report.md a007fd66bdac87812dc272e4b14cd231174e979d
Reviewed-Content-Hash: .claude/skills/architecture-review/references/8-write.md bf6d8946fc7b9e19eda7f65503a5c8f593a0d2b1
Reviewed-Content-Hash: .claude/skills/architecture-review/references/9-handoff.md fd5f681f4c3517c6a2e388c6d78075d82dded22e

*(Not stamped — file absent: `docs/consistency-failures.md`, `docs/engine-reference/web/modules/*.md`, `deprecated-apis.md`.)*

---

## Traceability Summary

Total requirements: **418** (15 GDDs; registered this run in `docs/architecture/tr-registry.yaml` — `registry.sh validate` clean: 0 duplicates, 0 layout, 0 path errors)

| Status | Count | Meaning |
|--------|-------|---------|
| ✅ Covered by Accepted ADR | **0** | No ADR is Accepted yet |
| 🟡 Covered by Proposed ADR | **54** (13%) | Decision exists, pending `/architecture-decision` accept |
| ⚠️ Partial | **0** | Partial-decision items recorded as integration notes below |
| ❌ Named pending-ADR gap | **2** (<1%) | Text explicitly defers to ADR #6 / #8 |
| — Implementation tier | **362** (87%) | GDD-owned; no architecture-level decision required at `standard` |

**Baseline supersession.** `architecture.md` v1 recorded a **260-requirement provisional baseline that was never persisted** (the registry was empty when it was written). This run re-extracted all 15 GDDs (418 requirements) and registered that set as the permanent baseline. The provisional IDs already cited by the ADRs and by architecture.md **kept their numbers** (text re-anchored to this run's extraction lines; verified line-by-line against each ADR's GDD Requirements Addressed table — e.g. BS-011←"crit fast path draws nothing", RL-011←"rng_int modulo ≤ 501", FS-005←"filler draw DI-injected"). Un-cited provisional IDs inside the old blocks remain unissued (holes are intentional; IDs are never renumbered). TR-battle-system-023 — cited by ADR-0001 but with no extraction line of its own — was registered from its citation text (elimination draws, home GDD equipment.md Edge Case 10 / EQ25). Full provenance in the registry header.

Full matrix: `docs/architecture/requirements-traceability.md`.

### Coverage Gaps (no ADR exists)

1. ❌ **TR-analytics-043** (analytics) — "Sink storage route deliberately open (custom tables vs third-party pipeline, OQ-AN1); GDD fixes behaviour, not the route."
   Suggested ADR: `/architecture-decision` **Analytics sink route** (Required ADR #6 — write before analytics implementation; storage choice rides ADR-0002's stack).
   Domain: Data/Persistence. Engine Risk: LOW.
2. ❌ **TR-real-pvp-039** (real-pvp) — "Provisional: question draw API must be server-callable with same build gates; speech quality scored server-side (OQ-RVP3); ladder needs PvP-source + draw events."
   Suggested ADR: `/architecture-decision` **Server-side speech scoring** (Required ADR #8 — deferred with real-pvp; TR-speech-io-008's scorer interface is the not-preclude contract).
   Domain: AI/Audio. Engine Risk: MEDIUM.

**Required ADR #7** (real-time transport + hosting regions, OQ-RVP4/5/8) has no ❌ rows: real-pvp.md deliberately leaves transport undecided, so no requirement text names it. Its trigger stands — write before any PvP epic, and it must not be precluded by ADR-0002's stack (WebSocket capability, region topology).

**Required ADR #5** (ranked server-computed RP) — resolved by ADR-0003 §3 Stage 1 (replay-verify pinned). No longer a separate gap.

The 362 "—" rows are **not gaps**: they are implementation-tier requirements governed by their GDDs, the coding standards, and the control manifest; they become story material via `/create-stories`.

---

### Cross-ADR Conflicts

**No 🔴 conflicts.** Three integration notes (⚠️-class, to resolve when the quartet's acceptance round touches the schema — both sides are still `Proposed`, so nothing is frozen wrong yet):

1. **Seed-anchored idempotency needs a unique constraint ADR-0002 doesn't declare.** ADR-0003 §1 anchors battle_end/tower_stage_result idempotency on `(commit type, seed)` ("applied_seeds semantics"), but ADR-0002's schema declares only `commit_id` as PK with `seed_hi/seed_lo` as plain columns. The (type, seed) uniqueness must be an explicit constraint (or unique index) in migration 0001, not an implied property.
2. **ADR-0003's `state_digest` has no home in ADR-0002's frozen schema.** ADR-0003 §1 returns a per-account monotonic digest on every applied/replayed commit and accepts `base_digest`; ADR-0002's tables (accounts, sessions, commits, per-domain) hold no per-account revision counter. Additive migration can patch it later, but both ADRs are Proposed now — resolve ownership in whichever ADR the acceptance round touches.
3. **Wire types have two undeclared sources of truth.** ADR-0003's Key Interfaces define TypeScript envelope/response types while the server validates with Fastify JSON Schema. Nothing decides the sync direction (schema→TS codegen, or TS-as-source with derived schema). Drift produces commits that compile but reject. NOT SOURCEABLE — json-schema-to-ts/TypeBox behavior is not covered by `docs/engine-reference/web/`.

### ADR Dependency Order

`adr-dep-graph.sh`: **adr-0001 → adr-0002 → adr-0004 → adr-0003** — no cycles, no unresolved dependencies. Implementation order matches the numbered Required-ADR list in architecture.md.

### GDD Revision Flags

None of these flip systems-index statuses — the conflicting ADRs are only `Proposed`; apply at each GDD's next edit.

1. **battle-system.md Core Rule 15 + opponent-ai.md Interactions** — `resolve_round` signature lacks ADR-0004's `input_source` parameter (B-series extraction contract). Both GDDs self-mark the affected sections provisional; add the parameter at next edit.
2. **ranked-league.md grace-window constant table** — the "or last client event" reading of the 15-minute forfeit window is superseded by ADR-0003 §4 (window measured from battle-start only). Conflict-with-ADR flag: revise the constant table's wording at next edit.
3. **equipment.md Edge Case 10 (EQ25)** — elimination-draws rule cited as TR-battle-system-023 (ADR-0001) while its home GDD is equipment.md. Registered under the battle-system stem with a cross-reference; equipment.md should name battle's stream ownership at next edit.

### Engine Compatibility Issues

**Engine specialist consultation: NOT ASSESSED** — `engine.name: Web` is out-of-catalog; no matching specialist agent exists and `technical-preferences.md`'s specialist table is unconfigured. Per Phase 5's skip rule this is recorded, not silently passed. **Substitute second opinion:** the technical-director agent audited all four ADRs' engine claims (full findings in the session log); headline results:

- 🔶 **HIGH — ADR-0002 `seed_hi/seed_lo INT` overflows as written**: Postgres `integer` is signed int32; a uint32 half reaches 4,294,967,295, so ~half of all seeds fail on insert. Fix before migration 0001 (store halves as BIGINT, or pin a documented signed-reinterpretation with a server-side conversion helper in `src/game/prng.ts`'s U64 type). This sits inside the additive-only schema freeze — it must be decided before migration 0001.
- 🔶 **MED** — Server TS compilation story named but not decided (shared base tsconfig vs project references vs two configs; tsc emit vs tsx vs esbuild in production). ADR-0004's dual-context CI is the drift-enforcement mechanism the trust model rests on — decide before `/test-setup`.
- 🔶 **MED** — `SameSite=Lax` cookies silently require SPA and API on the same registrable domain; ADR-0002 decides cookie attributes but not the deployment co-location constraint they depend on. One sentence needed.
- 🔶 **MED** — Version-risk concentration: every verification mechanism (vector fixtures, dual-context CI, replay-identity test) runs under vitest, whose Vite-8 peer range is explicitly NOT SOURCEABLE until scaffold. Scaffold-time vitest resolution is load-bearing, not incidental.
- 🔶 **LOW** — ADR-0004's boundary lint rules name no linter (oxfmt is formatter-only; eslint/oxlint undecided). NOT SOURCEABLE — oxlint/eslint import-rule plugins are not covered by the engine reference.
- ✅ **Confirmed sound**: ADR-0001's cross-browser determinism claim is spec-guaranteed (`Math.imul`/`>>>` per ECMA-262) provided the implementation stays pure-integer (as mandated); splitmix64/draw53 math verified numerically (max value exactly 2⁵³−1; top-53-bits dodges weak low-order bits); `crypto.getRandomValues` seed generation is a stable pre-cutoff surface; ADR-0002's argon2id m=19456/t=2/p=1 matches OWASP's minimum (re-verify at implementation as the ADR already requires); opaque-token stateful sessions correctly justified over JWT given revocation ACs; ADR-0003's HTTP+JSON no-WebSocket commit shape and exactly-once forfeit scan are sound for turn-based MVP; ADR-0004's single-app + lint-enforced purity + dual-context CI is a genuine mechanical drift-proof, and `content/` never-bundled is correct.
- Minor (not blocking): in-memory throttle is per-instance under horizontal scaling (worth a Risks line); per-minute forfeit scan assumes a persistent Node process (a serverless host needs an external scheduler); argon2 native binding shares the client lockfile (deploy image needs a build toolchain).

**Pinned-version consistency**: `VERSION.md` pins agree with `project.yaml` and `technical-preferences.md` (React 19 / TS 5.7 / Vite 8 / Tailwind 4 / lucide 1.63 / pnpm; pinned 2026-11-09 from `raw-data/lexi-quest-design/package.json`). No ADR cites an unverified post-cutoff API behavior — Vite-8/Tailwind-4/lucide-1.x/React-19 API knowledge is correctly quarantined to scaffold time. **Deprecated-API check: NOT ASSESSED** — the engine reference holds no `deprecated-apis.md` snapshot to check against.

### Architecture Document Coverage

`architecture.md` covers **15/15 systems** (layer map mirrors systems-index's 5 layers; no orphaned architecture, no missing system). Two minor document defects:

1. Line 8: "all 14 system GDDs" — there are 15 systems (the sentence's own enumeration lists 15).
2. "ADRs Referenced: none yet" — stale: 4 Foundation ADRs now exist and are cited by the document's own Required-ADR section.

Both are one-line fixes for the next touch of architecture.md; neither affects decisions.

---

### Verdict: CONCERNS

Some coverage rests on `Proposed` ADRs and named gaps remain, but no blocking conflicts:

- Zero ✅ is structural: all four Foundation ADRs are `Proposed`, so nothing can grade ✅ this run. Route: `/architecture-decision` accept each ADR (adr-0001 first — nothing depends on it).
- NOT ASSESSED line items (named, per the skill's vocabulary rules): engine-specialist consultation (out-of-catalog engine; substitute technical-director audit performed, recorded above), deprecated-API check (no snapshot exists), Required ADRs #6/#7/#8 (pending by design, sequenced with deferred systems).
- Phase 6 ran: 15/15 systems covered, 2 one-line doc defects.
- The substitute audit's HIGH finding (seed column overflow) is a real pre-Acceptance blocker for ADR-0002 — it touches the frozen schema and must be resolved before migration 0001, but it is a defect in a Proposed ADR, not a cross-ADR conflict, so it holds the verdict at CONCERNS rather than FAIL.

### Blocking Issues (must resolve before PASS)

None at FAIL level. The path to PASS is: accept ADRs 0001–0004 (resolving the seed-column and integration-note items in the same pass), then write #6/#7/#8 when their systems come up, and rerun `/architecture-review`.

### Required ADRs

Most foundational first:

1. **Accept adr-0001 (seeded PRNG + stream derivation)** — `/architecture-decision` accept; biggest blocker, gates statistical ACs and replay in four systems.
2. **Accept adr-0002 (persistence boundary + backend stack)** — resolve first: seed_hi/seed_lo column type (HIGH), the (type, seed) unique constraint, `state_digest` home, SameSite co-location sentence.
3. **Accept adr-0004 (module layout + B-series)** — decide server tsconfig story and linter choice before `/test-setup`.
4. **Accept adr-0003 (commit protocol + trust model)** — decide wire-type sync direction; then ADR #5 stays resolved-by-0003.
5. **ADR #6: Analytics sink route (OQ-AN1)** — before analytics implementation.
6. **ADR #7: Real-time transport + hosting regions (OQ-RVP4/5/8)** — before any PvP epic.
7. **ADR #8: Server-side speech scoring (OQ-RVP3)** — before real-pvp speech work.

Rerun `/architecture-review` after each new ADR or acceptance — the next run's freshness check reads this report's receipt lines above.
