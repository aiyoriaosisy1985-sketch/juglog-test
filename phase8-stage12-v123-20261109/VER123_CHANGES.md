# Juglog Ver.12.3 – correction candidate (UNVERIFIED)

- P31 replay: all-zero hall-start observations no longer replace already accumulated personal G with 0. The observer still stores the exact reported snapshot; nonzero hall observations are unchanged.
- P31 read-only details: explicit all-zero hall observation is returned to distinguish it from absence of observation; guess model still uses personal games for a zero observation.
- Correction history: latest 3 real actions/buttons visible initially, expand all on demand. Existing eligibility and write guards retained.
- Fruit symbols: original, simple white six-grape and two-cherry silhouettes redrawn to approximate the user-approved visual reference, not copies of third-party SVG assets.
- Version label: Ver.12.3 (test candidate).
- Settings: inactive action label contrast adjusted.
- Stage 11 and 12 repositories and user data are not modified.
- Required QA: especially zero-start recorded before and after G, nonzero hall snapshot, correction latest3 toggle, fruit renders, and persisted reloading.
