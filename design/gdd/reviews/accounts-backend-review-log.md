## Review — 2026-11-08 — Verdict: NEEDS REVISION
Review mode: lean · Workflow: standard
Scope signal: L
Specialists: none (lean — single-session analysis)
Blocking items: 3 | Recommended: 4
Summary: Foundation GDD is disciplined — trust model recorded as a known
limitation, atomic idempotent commits, 30 testable GIVEN-WHEN-THEN ACs at
authoring. Three small spec gaps blocked: F3 self-contradiction on where the
jitter sits relative to the cap, unspecified content-cache location colliding
with AC-C6, and missing enumeration protection on the password-reset-request
path. All three revised in-session the same day (see blocklist below); a
re-review in a fresh session issues the final verdict.
Prior verdict resolved: First review
Revisions applied 2026-11-08 (post-verdict, same session):
- F3 Output Range corrected to [B, D_max] = [1 s, 30 s]; jitter inside min()
- Core Rule 7: content cache lives in browser storage (content cache, not game
  state); AC-C6 parenthetical aligned
- EC12 + AC-A8 added (reset-request enumeration); coverage 31 criteria, 12/12
  Edge Cases; evidence routing updated
Findings:
- [BLOCKING] Formulas (F3): formula caps at D_max but Output Range claimed
  D_max + J_max — fixed (Output Range now [1, 30] s)
- [BLOCKING] Detailed Design / AC-C6: content-cache storage location
  unspecified and contradicted AC-C6's "only the session token" — fixed
  (browser-storage content cache, both sites aligned)
- [BLOCKING] Edge Cases / Auth: password-reset request had no enumeration
  protection (EC8 covered registration only) — fixed (EC12 + AC-A8)
- [RECOMMENDED] game-concept.md: OQ#2/#3 still read open; annotate resolutions
- [RECOMMENDED] Formulas (F2): "fails_in_window reset to 0" mixes window count
  with persistent counter; restate as failure-counter reset
- [RECOMMENDED] Edge Cases (EC1): beforeunload unreliable on mobile browsers;
  note pagehide/visibilitychange fallback
- [RECOMMENDED] Advisory: Player Fantasy + Tuning Knobs absent (by design at
  standard tier); multi-instance throttle note is ADR material
Reviewed-Content-Hash: design/gdd/accounts-backend.md f0c04febe274d2f4be890eb32f87cf915f78259b
Reviewed-Content-Hash: design/registry/entities.yaml 4543f1d29389619023a69b65685618a73bb1fbde
Reviewed-Content-Hash: .claude/skills/design-review/SKILL.md a63d8fba9b7142eeb43791f061e2e1533c429b43
Reviewed-Content-Hash: design/gdd/game-concept.md 227909cf7f2fd7ac45a6510b3e4fdabf09f997dd
Reviewed-Content-Hash: design/gdd/systems-index.md 7703416584ac24c0687627b29081535e0aceb108

## Review — 2026-11-08 — Verdict: NEEDS REVISION
Review mode: lean · Workflow: standard
Scope signal: L
Specialists: none (lean — single-session analysis)
Blocking items: 2 | Recommended: 4
Summary: Re-review of the same-day revised document. All three prior blockers
verified fixed and internally consistent (F3 ↔ AC-C3 aligned; Core Rule 7 ↔
AC-C6 aligned; EC12 + AC-A8 close the enumeration path). Two one-line remnants
blocked: the registry's retry_delay output_range still held the pre-revision
[1, 30.5] while the GDD says [1, 30], and F2's k range "1–6 (capped by L_max)"
misstates the arithmetic — the L_max cap first binds at k = 8, not 6. Both
revised in-session the same day (registry [1, 30] + revised note; k range
corrected). Recommended items (Overview MVP-dependent list, game-concept OQ
annotations, F2 reset phrasing, beforeunload mobile fallback) carried forward.
Prior verdict resolved: Yes — 2026-11-08 NEEDS REVISION; all 3 prior blockers
verified fixed this pass
Findings:
- [BLOCKING] Registry/entities.yaml: retry_delay output_range [1, 30.5] vs GDD
  F3 [1, 30] — fixed ([1, 30] + revised note; registry.sh validate clean)
- [BLOCKING] Formulas (F2): k range "1–6 (capped by L_max)" contradicts
  min(L₀ × 2^(k−1), L_max) arithmetic — cap first binds at k = 8 — fixed
- [RECOMMENDED] Overview: "six other MVP systems" parenthetical mismatches the
  Dependencies tier table (lists post-MVP systems; omits battle-system,
  question-content, equipment, tower)
- [RECOMMENDED] game-concept.md: OQ#2/#3 still read open there; annotate
  resolutions pointing here
- [RECOMMENDED] Formulas (F2): "fails_in_window and k reset to 0" mixes a
  time-derived window count with a stored counter; restate as failure-counter
  reset
- [RECOMMENDED] Edge Cases (EC1): beforeunload unreliable on mobile; note
  pagehide/visibilitychange fallback
Reviewed-Content-Hash: design/gdd/accounts-backend.md ec728fca822161eb68f2ad27ec55dc87f088d452
Reviewed-Content-Hash: design/registry/entities.yaml 3726003b7f0cd3739084a5e4f1b5ac0970f6fb9a
Reviewed-Content-Hash: .claude/skills/design-review/SKILL.md a63d8fba9b7142eeb43791f061e2e1533c429b43
Reviewed-Content-Hash: design/gdd/game-concept.md 227909cf7f2fd7ac45a6510b3e4fdabf09f997dd
Reviewed-Content-Hash: design/gdd/systems-index.md 7703416584ac24c0687627b29081535e0aceb108

## Review — 2026-11-08 — Verdict: APPROVED
Review mode: lean · Workflow: standard
Scope signal: L
Specialists: none (lean — single-session analysis)
Blocking items: 0 | Recommended: 4
Summary: Partial re-verification rather than a full re-review — the target GDD is byte-identical to the post-fix state stamped by the prior review, while only the registry and systems-index changed. Both prior blockers re-verified against the changed files: registry retry_delay output_range [1, 30] now matches GDD F3 [1 s, 30 s], and the F2 k-range fix ("cap binds at k = 8") is present at accounts-backend.md:194. The four recommended items from the prior review carry forward, non-blocking. Final verdict re-issued per the freshness-check rule (prior review covers this run; no conflict found in changed cross-document files).
Prior verdict resolved: Yes — 2026-11-08 NEEDS REVISION; both blockers verified fixed against the changed registry
Findings:
- [RECOMMENDED] Overview: "six other MVP systems" parenthetical mismatches the Dependencies tier table (carried forward)
- [RECOMMENDED] game-concept.md: OQ#2/#3 still read open there; annotate resolutions pointing here (carried forward)
- [RECOMMENDED] Formulas (F2): "fails_in_window and k reset to 0" mixes a time-derived window count with a stored counter (carried forward)
- [RECOMMENDED] Edge Cases (EC1): beforeunload unreliable on mobile; note pagehide/visibilitychange fallback (carried forward)
Reviewed-Content-Hash: design/gdd/accounts-backend.md ec728fca822161eb68f2ad27ec55dc87f088d452
Reviewed-Content-Hash: design/registry/entities.yaml 8901ea78c15425a8074a8e5e3cf93fdee5895c31
Reviewed-Content-Hash: .claude/skills/design-review/SKILL.md a63d8fba9b7142eeb43791f061e2e1533c429b43
Reviewed-Content-Hash: design/gdd/game-concept.md 227909cf7f2fd7ac45a6510b3e4fdabf09f997dd
Reviewed-Content-Hash: design/gdd/systems-index.md 99f3c2310abafaabad79d71b89f12755f371364b
