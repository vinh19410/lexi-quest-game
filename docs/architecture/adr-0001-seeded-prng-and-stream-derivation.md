# ADR-0001: Seeded PRNG Algorithm and Stream Derivation

## Status
Proposed

## Date
2026-11-09

## Last Verified
2026-11-09

## Decision Makers
Technical-director role via autonomous run (`project.yaml` `modes.automation: autonomous`); lean review — TD-ADR skipped (review_mode: lean). Requirements sourced from Approved GDDs: opponent-ai F1/F2, battle-system seed policy, ranked-league RL3/RL11.

## Summary
LexiQuest needs every battle-adjacent random draw to be reproducible bit-exactly from one persisted seed: ghost answer rolls (opponent-ai F2), guaranteed-crit/slow-path crit draws and question draws (battle-system), equipment's 50/50 elimination selection, and ranked-league's stateless simulated-peer drift. This ADR pins **splitmix64** as the project's single seeded primitive — 64-bit state, one golden-gamma increment, single 64-bit seed — implemented in pure TypeScript 32-bit-half arithmetic (`Math.imul`, shifts; no BigInt), with per-domain child streams derived as `mix(seed ⊕ fingerprint(tag))`, uniform integers drawn as the **top 53 bits** of one 64-bit output, and `rng_int` by modulo (blessed for ranges ≤ 501). Resolves OQ-BS1 / OA-OQ2.

## Engine Compatibility

| Field | Value |
|-------|-------|
| **Engine** | Web — React ^19.0.0 + TypeScript ^5.7.0 (out-of-catalog; `docs/engine-reference/web/VERSION.md`) |
| **Domain** | Core |
| **Layer** | Foundation — shared deterministic-utility module consumed by Core (battle-system, opponent-ai) and Feature (ranked-league); it must exist before any Core-layer code |
| **Knowledge Risk** | LOW — pure TypeScript integer arithmetic plus one stable platform API (`crypto.getRandomValues`, pre-cutoff). No Vite/React/Tailwind API is involved. Per-domain module checks are NOT ASSESSED: `docs/engine-reference/web/` contains only `VERSION.md` (no `modules/`, `breaking-changes.md`, or `deprecated-apis.md` exist) — this decision consults none of them |
| **References Consulted** | `docs/engine-reference/web/VERSION.md`; `design/gdd/opponent-ai.md` §Formulas (F1/F2/F3); `design/gdd/battle-system.md` §Formulas (seed policy, crit/question/elimination streams); `design/gdd/ranked-league.md` §Formulas (RL3/RL11) |
| **Post-Cutoff APIs Used** | None — `Math.imul`, `>>>`, `crypto.getRandomValues` all predate the training cutoff and are stable platform surface |
| **Verification Required** | (1) Pinned vector fixtures pass in CI; (2) one cross-browser determinism smoke: same seed → identical draw sequences on every target browser (expected trivially from spec'd integer ops; verify once); (3) statistical QA of OA-014 (per-tier ±0.03, Binomial GoF α = 0.01) unblocked and passing on the implemented primitive |

## ADR Dependencies

| Field | Value |
|-------|-------|
| **Depends On** | None — first of the four Foundation ADRs; 0002–0004 are independent of it |
| **Enables** | Not an ADR: unblocks all seeded-random acceptance criteria — opponent-ai OA-014/OA18/OA20 (statistical QA, stream-compat), battle-system BS-026 (bit-exact replay) and the slow-branch crit statistical AC, ranked-league RKL8/RKL9 (peer-board determinism fixtures, H-agnostic parts already assertable) |
| **Blocks** | Core-layer battle-system and opponent-ai implementation stories; ranked-league peer-generation stories — none can start while this ADR is only Proposed |
| **Ordering Note** | Write and Accept before any battle-module story; the PRNG story itself is the natural first Core-layer story |

## Context

### Problem Statement
Four approved GDDs depend on a seeded random source but deliberately do not name an algorithm — opponent-ai F2 states "the concrete PRNG family, its internal state, and the seed-expansion routine are a technical decision recorded as an ADR." Until this ADR lands, six-plus acceptance criteria are blocked (statistical ghost QA, replay identity, ranked board fixtures), and no battle code can be written without inventing a random source that would then be retrofitted.

### Constraints
- Platform-stable: same seed → same sequence on every browser and session; `Math.random` never (opponent-ai F2 rule 1; battle seed policy).
- 64-bit state, single 64-bit seed, no observable warm-up at battle length (F2 rule 1's recommendation class).
- Fixed-point comparison domain: draws converted once to uniform integers in [0, 2⁵³), compared with strict integer `<` against `accuracy_threshold = round_half_up(accuracy × 2⁵³)` — equality = NOT correct (F1/F2 rule 5; testable boundary).
- JavaScript number precision ceiling is 2⁵³, which is exactly the comparison domain — 64-bit values must be carried as 32-bit halves.
- Ranked-league needs a **stateless** hash: any device derives day-d's peer board from `(season_id, account_id, d)` alone, without replaying prior days (RL-010).
- Replay contract: battle seed is crypto-random uint64 persisted in the battle record; same seed + recorded commits must reproduce the entire battle log (battle BS-026) — including stream positions, so every draw must be accounted for.
- Post-MVP stream compatibility: new draw types append named positions after existing draws — never reorder or insert (F2 rule 7).

### Requirements
- One pinned primitive + pinned seed→draw vectors as test fixtures (F2 rule 6; the fixtures pin behavior, the GDD pins the contract).
- Per-domain child streams that never interleave: ghost, crit, question, elimination each consume only their own stream (F2 rule 3; battle seed policy).
- `rng_int(seed, lo, hi)` for ranked peer values with modulo-bias handling blessed for ranges ≤ 501 (RL-011).
- Out-of-scope RNG stays out: speech-io's simulated scorer draws from the platform RNG deliberately outside battle streams (SI-008); forge filler draw is DI-injected (FS-005). This ADR must not annex them.

## Decision

**Primitive: splitmix64** (Steele, Leiserson, Vigna — "Fast Splittable Pseudorandom Number Generators"), pinned as follows:

```
GAMMA   = 0x9E3779B97F4A7C15            (golden ratio, 64-bit)
MIX1    = 0xBF58476D1CE4E5B9
MIX2    = 0x94D049BB133111EB

step(state):  state += GAMMA
mix(z):       z ^= z >>> 30;  z *= MIX1
              z ^= z >>> 27;  z *= MIX2
              z ^= z >>> 31;  return z
draw:         output = mix(state after step)
```

All 64-bit arithmetic is implemented as 32-bit halves with `Math.imul` and unsigned shifts (ECMAScript-spec'd, therefore engine-identical). BigInt is banned in the module (determinism is fine but the hot path and serialization are worse; state travels as `[hi, lo]` or hex). splitmix64 is BigCrush-clean; its documented weak spot is low-order output bits, which is why uniform integers take the **top 53 bits**: `draw53 = hi × 2²¹ + (lo >>> 11)` — exactly representable in a JS number, uniform on [0, 2⁵³).

**Child-stream derivation.** Each domain tag is a module-owned string constant (`"ghost"`, `"crit"`, `"question"`, `"eliminate"`, `"ranked-peer"` — open set, appended never mutated). Fingerprint: FNV-1a 64 over the tag's UTF-8 bytes (offset basis `0xCBF29CE484222325`, prime `0x100000001B3`), computed once at module load. Child seed: `state₀(tag) = mix(battleSeed ⊕ fingerprint(tag))` — one standard step's output on the XOR. The child stream then draws by stepping its own state. Consequences: streams are independent (XOR-mixed), cheap, and derivable from the battle seed alone — the replay record needs only the seed.

**Ranked-league `H` binding.** RL-011's `H` is pinned as a stateless single draw: `H(x) = draw53` of a fresh stream with `state₀ = mix(x ⊕ fingerprint("ranked-peer"))`; `rng_int(seed, lo, hi) = lo + (H(seed) mod (hi − lo + 1))` exactly as the GDD wrote it. Modulo bias for a range r on a 53-bit draw is r/2⁵³ — for the GDD's maximum range 501 that is ≈ 5.6×10⁻¹⁴, statistically undetectable: **naive modulo is blessed for r ≤ 501**; any future range > 2³² must use rejection sampling (bias would approach 10⁻⁶-scale, measurable in board fixtures).

**Seed generation (unchanged from GDD):** one uint64 per battle from `crypto.getRandomValues`, persisted in the battle record (battle seed policy). This ADR adds no seed-generation logic.

**Vector policy (honest one):** this ADR pins the spec, constants, derivation, and the vector-file contract — it does **not** hand-compute 64-bit literals. The implementing story generates `tests/unit/prng/` vector fixtures from the reference implementation and cross-checks them against a published independent splitmix64 implementation; a vector failure is a build failure. Stream fixtures then pin: (a) seed `20261109` (the GDD's example seed) per tag → first-draw sequences; (b) a constructed draw-exactly-equals-threshold case asserting NOT correct (F2 rule 5's testable boundary); (c) append-only compatibility vectors for F2 rule 7.

### Architecture Diagram

```
crypto.getRandomValues ──► battleSeed (uint64, persisted in battle record)
                                 │
        ┌────────────────────────┼──────────────────────────┐
        ▼                        ▼                          ▼
 fingerprint("ghost")     fingerprint("crit")        fingerprint("question") ...
        │                        │                          │
 state₀ = mix(seed⊕fp) ──► RngStream ──► draw53 per round (strict order)
                                 │
              opponent-ai: threshold = round_half_up(accuracy × 2⁵³)
              ghost_correct = draw53 < threshold   (equality → NOT correct)
```

### Key Interfaces

```ts
// src/game/prng.ts — the project's ONLY seeded random source for game math
export type U64 = { hi: number; lo: number };        // unsigned 32-bit halves
export type DomainTag = 'ghost' | 'crit' | 'question' | 'eliminate' | 'ranked-peer';

export interface RngStream {
  nextU64(): U64;        // one splitmix64 step; advances state (for derivation/tests)
  draw53(): number;      // uniform integer [0, 2^53) — the comparison domain
  rngInt(lo: number, hi: number): number;  // lo + (draw53() % (hi-lo+1)); range ≤ 501 blessed
}

export function childStream(seed: U64, tag: DomainTag): RngStream;  // state₀ = mix(seed ⊕ fp(tag))
export function hashH(x: U64): number;  // ranked-league RL-011's H: stateless single draw53
```

Callers never convert draws to float for gameplay comparison; the [0, 1) framing in the GDDs is illustrative, the runtime domain is fixed-point integers.

### Implementation Guidelines
- **Must** implement 64-bit ops as 32-bit halves with `Math.imul`/`>>>`; **must never** use BigInt, floats in state evolution, or `Math.random` anywhere in game math.
- **Must** derive every battle-adjacent stream via `childStream(battleSeed, tag)`; **must never** interleave streams, share one stream across domains, re-seed mid-battle, or re-draw a resolved round.
- **Must** draw exactly once per ghost round in strict round order; the crit fast path (elapsed < 3000 ms) draws nothing; wrong answers and timeouts draw nothing.
- **Must** generate and commit vector fixtures with the implementation (build-failing on mismatch); **must never** hand-write 64-bit vector literals into tests without cross-implementation confirmation.
- **Must** keep new draw kinds append-only as named positions (F2 rule 7); a tag is immutable once shipped.
- **Must** keep speech-io's scorer and forge's filler draw OUT of this module's streams (platform RNG / DI-injected respectively, per their GDDs).
- The module **must** be dependency-free pure TS so the future PvP server host can import it verbatim ("one formula module, two hosts" applies to the streams too).

## Alternatives Considered

### Alternative 1: PCG-XSH-RR (pcg32)
- **Description**: The F2 recommendation names the PCG family; pcg32 has 64-bit state, single 64-bit seed, 32-bit output.
- **Pros**: Matches the recommendation letter-for-letter; excellent output quality; small code.
- **Cons**: 32-bit output needs two steps per 53-bit draw (double draws for every ghost round and question draw); still needs the same 64×64-multiply helper splitmix64 needs; the derivation mixer would still be splitmix64 (industry-standard child seeding), so two primitives ship instead of one.
- **Rejection Reason**: No quality advantage at LexiQuest's draw rates (≤ ~20 draws/battle); splitmix64 satisfies every stated F2 property with one primitive that doubles as the derivation mixer.

### Alternative 2: xoshiro256** (splitmix-seeded)
- **Description**: Superior statistical headroom; seeded from the battle seed via splitmix64.
- **Pros**: Best-in-class statistical quality; fast.
- **Cons**: 256-bit state violates the "64-bit state, single 64-bit seed" property the GDD pins; more state to serialize into replay records; quality headroom is worthless at ≤ dozens of draws.
- **Rejection Reason**: Overkill; violates a stated contract property.

### Alternative 3: Math.random with recorded outputs / hand-rolled LCG
- **Description**: Record outcomes instead of seeding, or implement a textbook LCG.
- **Pros**: Zero new code (recording variant).
- **Cons**: `Math.random` is unseedable — replay requires recording every draw, breaking the seed-only replay contract; LCGs fail the statistical QA opponent-ai OA-014 mandates.
- **Rejection Reason**: Fails platform-stability and statistical requirements outright.

## Consequences

### Positive
- Every seeded-random AC unblocks: statistical ghost QA, bit-exact replay, ranked board fixtures.
- One dependency-free primitive portable to the future PvP server host unchanged — vectors are the portability contract.
- Testability by construction: a `RngStream` double replaces the real one in unit tests; the equality boundary is constructible.
- Stream independence means a new draw kind never perturbs recorded battles (append-only tags + per-tag streams).

### Negative
- Custom ~40-line implementation to own and vector-pin (vs a library) — mitigated by cross-implementation vector checks.
- Low-bits discipline is load-bearing: any future contributor drawing from `nextU64` low bits gets weaker entropy — mitigated by the module exposing `draw53`/`rngInt` as the only draw APIs.
- 53-bit ceiling caps single-draw range at [0, 2⁵³) — irrelevant for game ranges; documented here so nobody "fixes" it with floats.

## Risks
- **Implementation bug in half-word arithmetic** → vector fixtures + a uniformity/range property test suite make it a build failure, not a shipped artifact.
- **Cross-engine drift** (a future runtime without exact `Math.imul` semantics) → ECMAScript defines these ops exactly; the CI determinism smoke runs the vector set on all target browsers; the server host runs the same vectors in Node.
- **Modulo blessing misread as a general license** → the ≤ 501 bound and the > 2³² rejection-sampling rule are both stated here and belong in the control manifest.

## GDD Requirements Addressed

| GDD System | Requirement | How This ADR Addresses It |
|------------|-------------|--------------------------|
| opponent-ai.md | F2 rules 1–7: platform-stable seedable PRNG, one stream per battle, strict round-order consumption, no re-draw, fixed-point [0, 2⁵³) comparison, pinned vectors, append-only evolution | Pins splitmix64 + child streams + draw53 + vector contract; every rule maps to a Key Interface or Implementation Guideline |
| opponent-ai.md | F1 strict comparison (equality = NOT correct); OA-014 statistical QA (±0.03, Binomial GoF) | Fixed-point draw53 vs threshold with constructible equality fixture; BigCrush-clean primitive makes the QA surface meaningful |
| battle-system.md | Seed policy: crypto-random uint64 persisted; child streams by (seed, domain_tag); streams never interleave; `Math.random` never | Derivation scheme `mix(seed ⊕ fingerprint(tag))`; stream discipline mandated; RNG surface reduced to this module |
| battle-system.md | BS-011 crit fast path draws nothing; BS-019 question draws pure in (seed, pools); BS-023 elimination draws from battle's stream; BS-026 bit-exact replay | Per-tag streams with draw-accounting discipline; replay = seed + recorded commits reproduces every stream position |
| ranked-league.md | RL-009/RL-010 stateless per-(peer, day) drift from season_id + account_id; RL-011 pins `H` + `rng_int` modulo handling for ranges ≤ 501 | `hashH` stateless single-draw binding; naive modulo blessed ≤ 501 (bias ≈ 5.6×10⁻¹⁴), rejection sampling required > 2³² |
| speech-io.md / forge-srs.md (consistency) | SI-008 scorer uses platform RNG outside battle streams; FS-005 filler draw DI-injected | Explicitly out of this ADR's scope — the module's streams must not annex them |

## Performance Implications
- **CPU**: negligible — ≤ ~20 draws/battle, each O(1) (~4 imuls); no frame-budget claim registered.
- **Memory**: one `[hi, lo]` pair per live stream; streams are per-battle ephemeral.
- **Load Time**: none (module-load tag fingerprinting is microseconds).
- **Network**: none. (Future PvP: same module runs server-side; only the seed and commit log cross the wire, per real-pvp's design.)

## Migration Plan
Greenfield — no code exists to migrate. The implementing story lands `src/game/prng.ts` + `tests/unit/prng/` vectors together; battle/opponent-ai/ranked modules then import the module instead of ever touching `Math.random`. The GDD-side OQ rows (OQ-BS1 / OA-OQ2) get their resolved-marks at those GDDs' next edits, pointing here.

## Validation Criteria
1. Vector fixtures pass in CI on all target browsers (cross-browser determinism smoke).
2. Property tests: every `draw53` in [0, 2⁵³); same seed → identical sequences; distinct tags → independent sequences; append-only fixture replays old battles identically.
3. Equality-boundary fixture: draw exactly equal to threshold → NOT correct.
4. opponent-ai OA-014 statistical QA passes per tier (N ≥ 1000 seeded battles).
5. Battle replay test: same seed + recorded commits reproduce BS-026's full log bit-identically.

## Related
- Resolves OQ-BS1 (battle-system) and OA-OQ2 (opponent-ai); prerequisite for RKL8/RKL9 fixture pinning.
- Referenced by future ADR-0002 (persistence — battle-record seed storage), ADR-0003 (commit/replay protocol), ADR-0004 (module layout — the `src/game/prng.ts` home).
- Design records: `design/gdd/opponent-ai.md` §F2, `design/gdd/battle-system.md` §Formulas (seed policy), `design/gdd/ranked-league.md` §RL3/RL11.
