# Phase 8 UI state regression repair candidate

- `index.html` only: persists selected D07F tab and theme in localStorage.
- Storage keys scoped to this QA candidate; P31 IndexedDB, journal, lease and saving code are untouched.
- During reload, temporary read-only status until a writer lease is reacquired is treated as requiring observation, not an established bug.
- Prior successful tests remain prior results; this new candidate has not been tested in iPhone Safari.
- Do not overwrite deployed folders or production.
