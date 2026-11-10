# Smoke Test: Critical Paths

**Purpose**: Run these 10-15 checks in under 15 minutes before any QA hand-off.
**Run via**: `/smoke-check` (which reads this file)
**Update**: Add new entries when new core systems are implemented.

## Core Stability (always run)

1. App loads to the home screen without console errors
2. Every main screen renders without a crash and without a blank viewport (once ui-shell is wired)
3. A hard reload and browser back/forward leave the app in a working state

## Core Mechanic (update per sprint)

<!-- Add the primary mechanic for each sprint here as it is implemented -->
<!-- Example: "A battle round plays end-to-end: question appears, answer is
     submitted, damage resolves per the B-series, round result is shown" -->
4. [Primary mechanic — update when first core system is implemented]

## Data Integrity

5. Login session survives a reload and expires per F1 (once accounts-backend lands)
6. A completed battle commit applies exactly once — replaying it is a no-op (once the commit protocol lands)

## Performance

7. No visible input lag during a battle round (question reveal delays 1000/800/1200/1500 ms feel unchanged)
8. No memory growth over 5 minutes of play (once core loop is implemented)
