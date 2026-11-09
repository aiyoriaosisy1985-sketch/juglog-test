# Phase 8 – surface switch candidate (2026-10-26)

- D07F and P31 use **one** iframe-backed P31 writer. Hiding the overlay intentionally does not release the lease because D07F counts and bonus actions still write via that instance.
- On opening P31, its existing writer lease is checked, then the view is refreshed only if there are no busy/pending/journal entries. No force claim, automatic retry, journal deletion, unlock, or data migration.
- An unavailable writer/blocked journal is shown as a warning, without mutating the saved events.
- UI theme and selected tab persistence from prior candidate retained. Readonly journal diagnostics retained.
- Do not run against the existing blocked PAUSED session. Test in a distinct isolated browser storage namespace before considering deployment to the same GitHub Pages origin.
- JS syntax and ZIP structural checks are static; Safari runtime results remain unverified.
