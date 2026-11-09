# Accounts Backend

> **Status**: In Design
> **Author**: [user + agents]
> **Last Updated**: 2026-11-08
> **Last Verified**: 2026-11-08
> **Implements Pillar**: Pillar 4 (Honest Ghosts) — real backend, no simulated presence; MVP requirement #6/#7 (accounts + persistent rune queue)

## Summary

accounts-backend is the game's foundation persistence system: it owns player
accounts (email + password, no guest mode at MVP), stores all progress
server-side (hero, gear, cursed-rune queue, quests, tower, records) at defined
atomic commit points, and serves versioned question content to battle, tower
and forge. The player experiences it only as "my progress is still here
tomorrow" — every other system builds on its schema. Its key policies:
server-authoritative state with a documented MVP trust model (structure
validated, outcomes client-reported until ranked-league demands more), retry
with an explicit Unsaved-state instead of silent data loss, and no offline
progression.

> **Quick reference** — Layer: `Foundation` · Priority: `MVP` · Key deps: `None` (upstream; 10 downstream dependents listed in Dependencies)

## Overview

accounts-backend is LexiQuest's foundation persistence layer: it owns player
identity (accounts + authentication), server-side progress storage (training
history, equipment, the cursed-rune queue, quest state), and serves the
question content consumed by battle/tower/forge. The player never interacts
with it directly — they experience it as "my progress is still here tomorrow" —
but without it the MVP hypothesis is untestable: the forge loop's retention
hook ("cursed runes waiting in the Forge" — Pillar 2) requires state that
outlives a browser session. It is the one system six other MVP systems depend
on (forge-srs, ui-shell, meta-progression, ranked-league, analytics, real-pvp);
its schema decisions propagate everywhere.

> Scope note: "content serving" here means only *delivering* question content —
> whether that content comes from the backend or is statically bundled into the
> SPA is a persistence-boundary decision (game-concept Open Question #2),
> resolved in Detailed Design and a companion ADR.

## Detailed Design

### Core Rules

1. **Authenticated play only.** Every gameplay session requires a logged-in
   account. Guest mode is not offered at MVP (decision 2026-11-08; resolves
   game-concept Open Question #3): the prototype's guest entry is removed and
   account creation is part of first-run onboarding. Rationale: all progress
   is server-side from day one, so no local-to-server migration code ever
   exists.
2. **One account, one profile.** An account is an email + password identity
   with exactly one player profile at MVP (multi-profile / child accounts are
   out of scope).
3. **Email + password auth.** Registration: email (unique, case-insensitive),
   password (minimum 8 characters; checked client-side, enforced server-side).
   Login issues a session that survives browser restarts and expires after 30
   days of inactivity (sliding window — see Formulas). Password reset via
   emailed reset link. No OAuth at MVP (decision 2026-11-08); the identity
   record is provider-agnostic so Google OAuth can be added later without a
   data-model change.
4. **Server-authoritative state.** All persistent game state — hero class and
   stats, XP, gold, gear inventory and loadout, cursed-rune queue, quest
   state, tower progress, records (speed-scores, combos, mastered words) — is
   stored server-side. The client keeps only a display cache in memory; it
   never writes game state to browser storage. Rationale: progress continuity
   is the product promise (MVP reqs #6–#7); local persistence would fork the
   truth.
5. **Commit-point writes.** Client state is pushed to the server at defined
   commit points, not continuously: battle end (BattleResult → rune queue +
   records + rewards), forge actions (review card answered → rune consumed →
   gear +level), equip/loadout change, quest claim, tower stage result. Each
   commit is atomic — fully applied or rejected, never partially. If a commit
   fails (network), the client retains the unsaved state and retries; a
   battle never ends "unsaved" silently (see Edge Cases).
6. **Server validates structure, not outcomes (MVP trust model).** At MVP the
   server checks commit structure (field shapes, id references, monotonic
   guards such as "rune already consumed") but accepts client-reported battle
   outcomes as-is. Single-player, no stakes → deep server revalidation is
   post-MVP, revisited before ranked-league (which has stakes). Recorded as a
   known limitation, not a silent assumption.
7. **Backend-served content.** Question banks (battle pools, tower stage
   pools, forge filler cards) are fetched from the backend, not bundled
   (decision 2026-11-08). Content is versioned: the client caches content
   payloads keyed by content version in **browser storage** (a *content
   cache*, not game state — Core Rule 4 is unaffected: no hero/gear/queue/
   quest/progress data ever lands there); a new version invalidates the cache.
   Persisting the cache across reloads is what lets Core Rule 8's offline
   client still show cached content after a fresh load.
   Rationale: content iteration without redeploy, and a path to
   personalization later. Cost: a content API + caching join the MVP backend
   scope.
8. **No offline progression.** Without a connection the client may show
   cached content but cannot battle, forge, or sync. Any action requiring a
   commit is blocked with a clear offline state.
9. **What this system does NOT own.** Game rules (battle math, SRS
   scheduling, quest logic) live in their own systems; accounts-backend
   stores and serves what those systems produce. It never computes a reward,
   a drop, or a review schedule.

### States and Transitions

| State | Entered when | Transitions out | Player-visible effect |
|---|---|---|---|
| Unauthenticated | App load without a valid session | → Registering, → Authenticating | Login/register screen |
| Registering | Player submits signup form | → Authenticated (auto-login on success), → Unauthenticated (validation error) | Account created; verification email sent |
| Authenticating | Player submits credentials | → Authenticated (valid), → Unauthenticated (invalid/expired) | Brief loading state |
| Authenticated | Valid session established | → Session expired (inactivity TTL reached), → Unauthenticated (logout) | Normal play |
| Session expired | 30-day inactivity TTL reached, or server rejects token | → Authenticating | "Session hết hạn" prompt → re-login |
| Password-reset pending | Reset link opened | → Authenticating (new password set) | Reset form |

Verification behaviour: a verification email is sent at registration; an
unverified account can play at MVP (no abuse pressure at this stage).
Enforcing verification is post-MVP — **flagged provisional**.

### Interactions with Other Systems

Downstream consumers (all undesigned — contracts below are provisional and
must be confirmed when each dependent GDD is authored):

| System | Data flow | Contract (provisional) |
|---|---|---|
| battle-system | Reads round-question payloads; writes one commit at battle end | BattleResult event → new cursed runes appended to rune queue, records + rewards updated |
| question-content | Its banks are stored and served by this system | Content schema owned by the question-content GDD; delivery + versioning owned here |
| forge-srs | Reads/writes the rune queue; writes gear +level commits | Rune queue *storage* owned here; queue *semantics* owned by forge-srs |
| equipment | Reads/writes gear inventory + loadout | Loadout changes committed at equip time |
| tower | Reads stage content; writes stage results | Per-stage pools served; progress record per stage |
| meta-progression | Stores gold/XP/quest state | Commit per economy event |
| ui-shell | Reads auth/session state; renders login/register/reset/profile screens | Session-state API; ui-shell owns the screens, this system owns the behaviour behind them |
| ranked-league (Alpha) | Stores RP history | Post-MVP design |
| analytics (Full Vision) | Event sink | Post-MVP design |
| real-pvp (Full Vision) | Identity + match records | Post-MVP design |

Upstream dependencies: none (Foundation layer).

## Formulas

Three operational formulas (proposed by `systems-designer`, confirmed by owner
2026-11-08). No gameplay math lives here — battle/forge/economy formulas belong
to their own GDDs. Content-cache validity (Core Rule 7) is deliberately **not**
a formula: version-keyed instant invalidation is a one-line comparison
(`cached.version === server.version` at app load), and a TTL would contradict
the locked instant-invalidation decision. Password hashing cost is an
implementation detail → companion ADR.

### F1 — Session sliding-window expiry

The `session_valid` formula is defined as:

`session_valid ⟺ (now − last_active_at) < TTL_idle`
`refresh rule: last_active_at ← now on every authenticated API request`
**[CONFIRMED 2026-11-08: activity-based refresh]**

**Variables:**
| Variable | Type | Range | Source | Description |
|----------|------|-------|--------|-------------|
| `last_active_at` | timestamp (server) | any past time | calculated | Server's last sighting of an authenticated request from this session |
| `now` | timestamp | — | server clock | Current server time; client clock never consulted (immune to device clock skew) |
| `TTL_idle` | int (days) | safe 7–90; locked **30** | constant (backend config) | Inactivity window (Core Rule 3) |

**Output Range:** boolean. Expiry moment = `last_active_at + TTL_idle`, bounded
to [now, now + 30 days] for any live session. Boundary rule: strict `<` — a
request at exactly 30d + 0s is expired and forces re-login; no partial-day
grace (keeps the rule testable).

**Example:** Last request Oct 10 14:00. Open app Nov 7 09:00 → elapsed 27d 19h
< 30d → valid; window resets, now expires Dec 7. Return instead Nov 10 14:01 →
expired → "Session hết hạn" → re-login.

> ADR note (not GDD behaviour): refreshing on every request is one DB write per
> request; persisting the write only when > 1 h has passed since the last is a
> safe optimization with no player-visible change.

### F2 — Login throttling (fixed window + capped progressive lockout)

The `login_allowed` formula is defined as:

```
fails_in_window(K, now) = # failed logins for key K in (now − W, now]
login_allowed ⟺ fails_in_window(K, now) < A_max AND now ≥ lockout_until
on lockout trigger:  lockout_until ← now + min(L₀ × 2^(k−1), L_max);  k ← k + 1
on successful login: fails_in_window and k reset to 0
```
**[CONFIRMED 2026-11-08: key = (email_normalized, IP); progressive ladder]**

**Variables:**
| Variable | Type | Range | Source | Description |
|----------|------|-------|--------|-------------|
| `K` | (email_normalized, IP) tuple | — | calculated | Throttle key — one IP's failures throttle only that IP; a known-email victim can still log in from their own network |
| `A_max` | int | safe 3–10; default **5** | constant (backend config) | Failed attempts allowed per window |
| `W` | int (minutes) | safe 5–60; default **15** | constant (backend config) | Fixed window length |
| `L₀` | int (minutes) | safe 5–30; default **15** | constant (backend config) | First lockout duration |
| `L_max` | int (hours) | safe 1–72; default **24** | constant (backend config) | Lockout cap — `min()` prevents unbounded growth and permanent victim lockout |
| `k` | int | 1+ (duration reaches the `L_max` cap at k = 8: 15 × 2⁷ min > 24 h) | calculated | Consecutive lockout count |
| `fails_in_window` | int | 0–`A_max` | calculated | Failed attempts in current window |

**Output Range:** boolean `allowed`; implied wait ∈ [0 min, 24 h]. Extremes: no
failures → always allowed; repeated lockouts saturate at `L_max`. Failed
attempts *while locked* are rejected but do not increment any counter
(deterministic arithmetic).

**Example:** 5 wrong passwords for `hoa@example.com` from one IP by 10:00 →
locked until 10:15 (k=1). Failures at 10:10 rejected, no count. Correct
password 10:16 → accepted, counters reset. A 4th triggered lockout lasts
min(15 × 2³, 24 h) = 120 min.

Sanity check: at 5 tries/15 min per IP, an attacker gets ~480 guesses/day
against 36⁸ ≈ 2.8 × 10¹² combinations for an 8-char lowercase-alphanumeric
password — infeasible within these bounds. At MVP scale, in-memory throttle
counters are acceptable (server restart clears them — see Edge Cases).

### F3 — Commit retry backoff (client)

The `retry_delay` formula is defined as:

```
delay_n = min(B × 2ⁿ + J_n, D_max),   n = 0, 1, 2, …
J_n = uniform(0, J_max)               (jitter — desynchronizes retries)
after N consecutive failures → stop auto-retrying, enter Unsaved-state
```

**Variables:**
| Variable | Type | Range | Source | Description |
|----------|------|-------|--------|-------------|
| `n` | int | 0 to N−1 | calculated | Auto-retry attempt index |
| `B` | float (s) | safe 0.5–5; default **1** | constant (client config) | Base delay |
| `J_max` | float (s) | safe 0–2; default **0.5** | constant (client config) | Upper jitter bound |
| `D_max` | float (s) | safe 15–120; default **30** | constant (client config) | Delay cap |
| `N` | int | safe 3–8; default **5** | constant (client config) | Auto-retries before manual mode |

**Output Range:** delay ∈ [`B`, `D_max`] = [1 s, 30 s] at defaults — jitter is
added *inside* the `min()`, so the cap bounds the whole delay (this matches
AC-C3's restatement of the formula);
total auto-retry span ≈ 30 s. At max attempts the client enters **Unsaved-state**:
retains the commit in memory, shows a persistent banner ("Lưu không thành công
— Thử lại"), blocks commit-requiring actions (same blocked state as offline,
Core Rule 8). Manual retry restarts the ladder at n=0. This implements Core
Rule 5's "a battle never ends unsaved silently".

**Example:** Battle ends, commit fails at 0 s. Retries at ≈1.2 s, 2.1 s, 4.3 s,
8.2 s, 16.4 s all fail → Unsaved-state at ~30 s. Player reconnects at 2 min,
taps "Thử lại" → commit succeeds, state flushed, play resumes.

## Edge Cases

- **If the tab is closed/reloaded while in Unsaved-state** (F3 exhausted its
  retries): that commit's progress is lost — there is no offline progression
  (Core Rule 8). Mitigation: a `beforeunload` warning fires whenever unsaved
  commits exist. This is the one place the "never unsaved silently" promise
  meets reality; the warning makes the loss explicit, not silent.
- **If a commit succeeds server-side but the response is lost** (client timed
  out and retries): the server detects the duplicate by commit ID — every
  commit carries a client-generated unique commit ID, and a repeated ID is
  answered with the original result without re-applying. Without this, one
  retry could append cursed runes twice.
- **If two devices hold sessions for the same account and both commit**
  (e.g., a forge action consumes rune R on the phone while the laptop's cache
  still shows R available): the second commit references a rune already
  consumed → the server rejects it with a stale-state error → that client
  re-fetches state and replays nothing; the player sees refreshed data.
  Last-writer-wins is never applied to consumables.
- **If the session expires mid-battle** (30-day edge, not mid-play — battles
  are minutes long): play continues locally; the end-of-battle commit fails
  with 401 → the client prompts re-login ("Session hết hạn"), and after a
  successful login retries the pending commit (ladder restarts at n=0).
- **If login fails while the throttle counters are in memory and the server
  restarts** (in-memory counters, F2): lockout state is forgotten; the
  attacker's window restarts. Accepted at MVP — recorded, not hidden.
- **If a password exceeds 128 characters** (or, if the ADR picks bcrypt, 72
  bytes): the server **rejects** it at registration with a clear message —
  long passwords are never silently truncated (a truncated password is a
  security lie: the player believes a longer secret protects the account than
  actually does).
- **If registration uses an email differing only by case** (`Hoa@…` vs
  `hoa@…`): the email is normalized (lowercased) before uniqueness checks —
  same account, one identity.
- **If registration is attempted with an already-registered email**: the
  error is generic ("Không thể tạo tài khoản với thông tin này") and never
  confirms the email exists — account enumeration is a free win for the F2
  attacker's target list.
- **If the content version changes server-side mid-session**: the client
  keeps playing on its cached version until the next full app load, which
  re-fetches and invalidates (Core Rule 7). A session never switches content
  mid-battle.
- **If an account is registered but the verification email is never opened**:
  the account can play normally at MVP (provisional rule, States table).
  Enforcement, if ever added, blocks play at session establishment, not
  mid-session.
- **If an authenticated request arrives with elapsed time exactly equal to
  `TTL_idle`** (F1 boundary): expired — strict `<`; the player re-logs in.
  Deterministic by construction; tests assert the boundary second.
- **If a password reset is requested for an email that is not registered**
  (EC12): the endpoint answers with the same generic success as for a
  registered email ("Nếu địa chỉ này tồn tại, chúng tôi đã gửi hướng dẫn đặt
  lại mật khẩu") and sends nothing — reset must never become the
  account-enumeration oracle that Edge Case 8 closed off at registration.
  Testable byte-for-byte: response status and body are identical for both
  cases.

## Dependencies

**Upstream dependencies: none.** This is a Foundation-layer system and the
first in the recommended design order — it defines, rather than consumes,
the persistence vocabulary other systems build on.

**Downstream dependents** (bidirectional note: each listed GDD must name this
system in its own Dependencies section once authored). Hard = cannot function
without it; Soft = enhanced by it.

| System | Tier | Hard/Soft | Interface | Owner of semantics |
|---|---|---|---|---|
| battle-system | MVP | Hard | Round-question payloads in; one atomic commit out (BattleResult → rune queue + records + rewards) | battle-system owns battle rules; this system owns storage |
| question-content | MVP | Hard (its content must be *delivered*) | Content banks stored + served, versioned | question-content GDD owns schema; this system owns delivery/versioning |
| forge-srs | MVP | Hard | Rune queue persistence (MVP req #7); forge commits consume runes / grant gear levels | forge-srs owns queue semantics; this system owns storage |
| equipment | MVP | Hard | Gear inventory + loadout records; commit at equip time | equipment owns loadout logic |
| ui-shell | MVP | Hard | Session/auth state; login-register-reset-profile behaviour | ui-shell owns screens; this system owns auth behaviour |
| tower | MVP | Hard | Per-stage content pools; stage-result commits | tower owns progression rules |
| meta-progression | Vertical Slice | Hard | Gold/XP/quest-state records | meta-progression owns economy rules |
| ranked-league | Alpha | Hard (once it exists) | RP history + identity | ranked-league owns ladder rules; server-outcome validation becomes required here before this tier (see Core Rule 6) |
| analytics | Full Vision | Soft | Event sink | analytics owns instrumentation |
| real-pvp | Full Vision | Hard (once it exists) | Identity + match records | real-pvp owns netcode; server authority redefines the trust model |

**Trust-model dependency chain (important):** Core Rule 6's client-trusted
outcomes are acceptable while every consumer is single-player. ranked-league
is the first system with stakes — before it ships, this system's commits must
move to server-computed outcomes. real-pvp makes it absolute. This is a
planned, recorded evolution of the trust model, not an afterthought.

**Companion ADR:** the persistence boundary decision set (guest mode removal,
server-authoritative progress, backend-served content) is recorded as an
architecture decision record in `docs/architecture/` after this GDD completes
— the GDD states *what* persists; the ADR states *how* (stack, hosting,
schema mechanics).

**Systems-index discrepancy note:** the index's Dependency Map says "5
downstream dependents" for this system; its own enumeration table lists 6
systems that depend on accounts-backend at MVP-or-later (10 including
post-MVP tiers). This GDD uses the enumeration table's set.

## Visual/Audio Requirements

None owned by this system — it is infrastructure with no visual or audio
surface of its own. All player-visible presentation of its behaviour (login /
register / reset screens, the "Session hết hạn" prompt, the "Lưu không thành
công — Thử lại" banner, the offline state) is owned by **ui-shell** and must
follow the art bible there. This GDD specifies only the behaviour those
screens express. (`art-director` not consulted — Lean mode; the skip is by
rule, not oversight.)

## Game Feel

The system's feel budget is about *perceived reliability*, not flair:

- **Auth actions** (login, register, reset submit): acknowledge within
  ~300 ms (optimistic spinner at minimum); a silent multi-second submit
  reads as broken.
- **Commit acknowledgement**: gameplay continues instantly at battle end —
  the commit is fire-and-retry, never a blocking spinner over the Victory
  modal. The banner (Unsaved-state) is calm and actionable, never an alarm.
- **Content fetch**: cached content renders immediately; version check
  happens in the background so a warm app load never waits on the network.
- Session refresh (F1) is invisible by design — the player should never
  think about sessions at all until the single "Session hết hạn" moment.

Feel targets set here are cheap now and expensive to retrofit after ui-shell
builds screens around different assumptions.

## UI Requirements

Behaviour owned here (screens owned by ui-shell — see Dependencies):
- Login, register, password-reset-request and password-reset-set screens
  call this system's auth surface; inline validation errors (password
  length, email format) mirror the server's rules (AC-A3/A4).
- Generic registration-failure message per Edge Case 8 — no email-exists
  hint (AC-A5).
- "Session hết hạn" re-login prompt with return-to-context (the pending
  commit survives the re-login — AC-S4).
- Persistent Unsaved-state banner "Lưu không thành công — Thử lại" with a
  manual-retry button (AC-C3/C4).
- Offline state: commit-requiring actions visually blocked with a clear
  offline indicator (AC-C5).
- No guest entry point anywhere in navigation, including onboarding
  (AC-A1).

> **📌 UX Flag — accounts-backend**: This system has UI requirements. In
> Phase 4 (Pre-Production), run `/ux-design` to create a UX spec for each
> screen it contributes to (login, register, reset, session-expired,
> unsaved-banner, offline) **before** writing epics. Stories that reference
> UI should cite `design/ux/[screen].md`, not the GDD directly. Screen
> ownership is ui-shell's; these specs should be co-authored with the
> ui-shell GDD.

## Cross-References

| Referenced GDD | What is referenced | Where in this GDD |
|---|---|---|
| design/gdd/battle-system.md | BattleResult commit contract; round-question payload consumption | Core Rules 5–7; Interactions table; AC-X1 |
| design/gdd/question-content.md | Content schema ownership vs delivery/versioning split | Core Rule 7; Interactions table; AC-D1/D2 |
| design/gdd/forge-srs.md | Rune-queue semantics vs storage split; forge commit contract | Core Rule 5; Interactions; Dependencies; AC-X2 |
| design/gdd/equipment.md | Gear inventory + loadout commit | Interactions table |
| design/gdd/tower.md | Stage pools served; stage-result commits | Interactions table |
| design/gdd/meta-progression.md | Gold/XP/quest-state records | Interactions table |
| design/gdd/ui-shell.md | Screen ownership vs auth behaviour ownership | Visual/Audio; UI Requirements; Interactions table |
| design/gdd/ranked-league.md | Trust-model escalation before this tier | Core Rule 6; Dependencies |
| design/gdd/analytics.md | Event-sink consumer | Dependencies |
| design/gdd/real-pvp.md | Final trust-model destination | Dependencies |
| design/gdd/game-concept.md | Open Questions #2/#3 resolved here; MVP reqs #6/#7 | Overview; Core Rules 1, 7 |

All downstream GDDs are undesigned at authoring time — their contracts here
are provisional and must be reconciled when each is authored (tracked in
Open Questions).

## Acceptance Criteria

*Criteria set proposed and coverage-validated by `qa-lead` (2026-11-08): 30
criteria; 1 added at /design-review the same day (AC-A8 — reset-request
enumeration) → 31 criteria covering 9/9 Core Rules, F1–F3, and 12/12 Edge
Cases. Each criterion
is independently verifiable by a QA tester without reading this document. IDs
are stable for test-plan and bug references.*

### Auth & Identity

- **AC-A1** *(Core Rule 1)* — GIVEN the app is loaded with no valid session, WHEN the player attempts to open any gameplay view (battle, forge, tower, profile), THEN they are routed to the login/register screen; and the app offers no "play as guest" entry point anywhere, including first-run onboarding.
- **AC-A2** *(Core Rules 2, 3; Edge Case 10)* — GIVEN an unused email and a valid password (≥ 8 characters), WHEN the player submits the registration form, THEN one account with exactly one player profile is created, a verification email is dispatched, the player is logged in automatically, and gameplay is fully available without opening that email.
- **AC-A3** *(Core Rule 3; Edge Case 6)* — GIVEN registration requests sent directly to the registration API (bypassing the client) with passwords of 7, 8, 128 and 129 characters, WHEN each is submitted, THEN 7 and 129 are rejected with a clear message and 8 and 128 are accepted; no password is ever silently truncated. (The exact upper input bound may tighten if the hash selected by the companion ADR has a lower limit — pending companion ADR hash choice.)
- **AC-A4** *(Core Rule 3; Edge Case 7)* — GIVEN an account registered as `hoa@example.com`, WHEN registration is attempted with `Hoa@example.com`, THEN it is rejected as a duplicate (the email is lowercased before the uniqueness check).
- **AC-A5** *(Edge Case 8)* — GIVEN an already-registered email, WHEN registration is attempted with it, THEN the error is the generic "Không thể tạo tài khoản với thông tin này" and contains no indication the email exists.
- **AC-A6** *(Core Rule 3)* — GIVEN a registered email with one or more live sessions, WHEN the player requests a password reset and sets a new password via the emailed link, THEN login with the new password succeeds, and every other live session for the account is revoked — requests carrying any pre-reset session token are rejected and those clients show the unauthenticated state.
- **AC-A7** *(States table)* — GIVEN an authenticated session, WHEN the player logs out, THEN requests carrying the old session token are rejected and the app shows the unauthenticated state.
- **AC-A8** *(Edge Case 12)* — GIVEN a registered email and an unregistered email, WHEN a password-reset request is submitted for each, THEN both responses are byte-identical (status and body carry no indication whether the account exists), the reset email is sent only for the registered address, and no account-enumeration hint appears anywhere in the flow.
- **AC-T1** *(F2)* — GIVEN 5 consecutive failed logins for one (email, IP) pair within 15 minutes, WHEN a 6th attempt arrives from that pair — even with the correct password — THEN it is rejected until 15 minutes after the 5th failure; and failed attempts made while locked neither extend the lockout nor increment any counter.
- **AC-T2** *(F2)* — GIVEN a key triggering its 4th lockout, WHEN the lockout duration is computed, THEN it is min(15 min × 2³, 24 h) = 120 minutes, and no later lockout for that key can exceed 24 hours.
- **AC-T3** *(F2)* — GIVEN a key with counted failures or lockout count k ≥ 1, WHEN a login from that key succeeds, THEN its failure count and k both reset to 0.
- **AC-T4** *(F2)* — GIVEN IP-A is locked out (or has counted failures) for email E, WHEN a correct login for E arrives from a different IP-B, THEN it is accepted.

### Session

- **AC-S1** *(Core Rule 3)* — GIVEN an authenticated session younger than 30 days, WHEN the browser is fully closed and reopened, THEN the session is still valid and no re-login is required.
- **AC-S2** *(F1)* — GIVEN a session whose last authenticated request was 29 days 23 hours ago, WHEN a new authenticated request arrives, THEN it is accepted and the expiry moves to last_activity + 30 days (sliding-window refresh on every authenticated request).
- **AC-S3** *(F1; Edge Case 11)* — GIVEN a session whose last request was exactly 30 days + 0 seconds ago, WHEN a new authenticated request arrives, THEN it is rejected as expired and the client shows the "Session hết hạn" re-login prompt; validity is computed from the server clock alone (a client clock set hours or days away does not change the outcome).
- **AC-S4** *(Edge Case 4)* — GIVEN a session that expires while a battle is in progress, WHEN the battle ends and its commit receives 401, THEN the client prompts re-login, and after a successful login the pending BattleResult commit is sent and applied (retry ladder restarted at n=0).

### Commits & Sync

- **AC-C1** *(Core Rule 5)* — GIVEN the player completes each of the five defined commit-point actions while online — battle end, forge review answered, equip/loadout change, quest claim, tower stage result — WHEN each action completes, THEN exactly one commit is sent per action and the server state afterwards reflects it (runes/records/rewards, gear level, loadout, quest claim, stage progress).
- **AC-C2** *(Core Rules 5, 6)* — GIVEN a commit that fails server-side structure validation (a nonexistent rune ID or a malformed field), WHEN the server processes it, THEN no part of it is applied — server state is identical to before the attempt — and the client is informed the commit was rejected.
- **AC-C3** *(F3)* — GIVEN the commit endpoint is unreachable, WHEN a commit is attempted, THEN automatic retries follow delay_n = min(1 s × 2ⁿ + jitter(0–0.5 s), 30 s) for n = 0..4 with each delay inside those bounds, and after 5 consecutive failures the client is in Unsaved-state: the commit retained in memory, a persistent "Lưu không thành công — Thử lại" banner shown, and commit-requiring actions blocked.
- **AC-C4** *(F3)* — GIVEN the client in Unsaved-state with connectivity restored, WHEN the player taps "Thử lại", THEN the retained commit is applied, the banner clears, blocked actions unlock, and any subsequent failure restarts the ladder at n=0.
- **AC-C5** *(Core Rule 8)* — GIVEN no network connection, WHEN the player attempts to battle, forge, or any commit-requiring action, THEN the action is blocked with a clear offline state; cached content may still render.
- **AC-C6** *(Core Rule 4)* — GIVEN a fresh browser profile on a new device, WHEN the player logs into an existing account, THEN all persistent state (hero, XP, gold, gear inventory + loadout, rune queue, quest state, tower progress, records) is restored from the server and equals it; and during normal play no game state is written to localStorage/sessionStorage/IndexedDB (only the session token and the versioned content cache of Core Rule 7 — never hero, gear, rune-queue, quest or progress data).

### Content Serving

- **AC-D1** *(Core Rule 7)* — GIVEN a fresh app load, WHEN the client needs battle, tower, or forge-filler question content, THEN it fetches it from the backend content API (observable network request), not from a bundled payload.
- **AC-D2** *(Core Rule 7)* — GIVEN the client holds cached content at version V, WHEN the app loads and the server's content version is still V, THEN the cache is used; and WHEN the server version is V+1, THEN the client fetches V+1 and replaces the cache.

### Cross-System Contracts

- **AC-X1** *(Core Rules 6, 9 — battle-system contract)* — GIVEN a battle ends with a client-computed BattleResult (runes won, records, rewards), WHEN the commit is processed, THEN the server stores exactly what was reported — cursed runes appended to the queue, speed-score/combo/mastered-word records and rewards applied as-reported, atomically in one commit — with no server-side recomputation of the outcome (documented MVP trust model).
- **AC-X2** *(Core Rules 5, 9 — forge-srs contract)* — GIVEN a forge review card answered for queued rune R, WHEN the forge commit is processed, THEN rune R is removed from the stored queue exactly once and the Upgrade Stone is granted in the same atomic commit (forge FS15's shape); the gear `+level` itself happens later, in equipment's separate player-initiated stone-application commit (equipment Core Rule 7 — forge FS16 grants the stone and stops). Queue semantics stay forge-srs's, storage consistency stays here. *(Corrected 2026-11-09 — the prior wording put the `+level` inside the forge commit, contradicting forge FS16 and equipment's application rule.)*

### Edge Cases

- **AC-E1** *(Edge Case 1)* — GIVEN one or more commits in Unsaved-state, WHEN the player tries to close or reload the tab, THEN a `beforeunload` warning is shown; with no unsaved commits, no warning appears; and reloading anyway in Unsaved-state loses that commit's progress (the design's single documented lossy path).
- **AC-E2** *(Edge Case 2)* — GIVEN a commit whose server-side processing succeeded but whose response never reached the client, WHEN the client retries and the server sees the same commit ID again, THEN the server answers with the original result and applies the change exactly once — the rune queue gains no duplicate rune.
- **AC-E3** *(Edge Case 3)* — GIVEN device-1 consumed rune R while device-2 still shows R available, WHEN device-2 submits a commit referencing R, THEN the server rejects it with a stale-state error, device-2 re-fetches and renders refreshed data, and R is consumed exactly once (no last-writer-wins on consumables).
- **AC-E4** *(Edge Case 5)* — GIVEN a key currently locked out by the in-memory login throttle, WHEN the backend server process restarts, THEN login attempts from that key are accepted again (lockout forgotten) — documented, accepted-at-MVP behavior.
- **AC-E5** *(Edge Case 9)* — GIVEN the server bumps content from version V to V+1 while a session is mid-play on cached V, WHEN the session continues, THEN it keeps serving cached V (no mid-battle content switch), and the next full app load fetches and caches V+1.

### Coverage and test notes

- Full coverage: 9/9 Core Rules, F1–F3, 12/12 Edge Cases (EC4→AC-S4,
  EC6→AC-A3, EC7→AC-A4, EC8→AC-A5, EC10→AC-A2, EC11→AC-S3, EC12→AC-A8).
- Core Rule 9 ("never computes a reward") is an architectural property:
  verified indirectly via AC-X1/X2 (stored values equal client-reported
  values) plus code review — the weakest-tested rule in this set, by design
  of what the system is.
- AC-A3's upper bound is provisional pending the companion ADR hash choice.
- AC-X1/X2 are written against the provisional contracts in "Interactions
  with Other Systems" and must be re-confirmed when the battle-system and
  forge-srs GDDs are authored.
- Evidence routing: F1/F2/F3 arithmetic (AC-S2, AC-S3, AC-T1–T4, AC-C3) is
  unit-testable with injected clock/RNG (`tests/unit/accounts-backend/`);
  AC-A2–A8, AC-S1, AC-S4, AC-C1–C6, AC-D1–D2, AC-X1–X2, AC-E1–E5 are
  integration tests (`tests/integration/accounts-backend/`); the
  login/register screens, "Session hết hạn" prompt, "Lưu không thành công"
  banner, offline state and the beforeunload dialog additionally require
  retained screenshots in `production/qa/evidence/`.

## Open Questions

| # | Question | Owner | Target resolution |
|---|---|---|---|
| 1 | Companion ADR: persistence-boundary implementation (stack, hosting, schema mechanics, password hash choice incl. input-bound consequence for AC-A3, session-token mechanism) | technical-director | Before `/gate-check technical-setup` |
| 2 | Do AC-X1/X2 provisional contracts hold when battle-system and forge-srs GDDs are authored? | game-designer + systems-designer | When those GDDs complete |
| 3 | When exactly does the trust model move to server-computed outcomes — at ranked-league design, or earlier? | technical-director + game-designer | At ranked-league GDD authoring (Alpha) |
| 4 | Verification-email enforcement: keep unverified-accounts-can-play, or gate play at some point? | producer | Before Alpha |
| 5 | Email deliverability for verification + reset (provider choice, Vietnamese inbox reachability) | technical-director | With companion ADR |
| 6 | Account deletion / data-erasure request path (privacy baseline even at MVP?) | producer + technical-director | Before public testing |
| 7 | Multi-device session limit: cap concurrent sessions per account, or unlimited? (Design currently allows unlimited) | technical-director | With companion ADR |
