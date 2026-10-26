# Phase 8 v5.8.7 — P31/D07F save-result bridge (test build)

Based on v5.8.6. P31's run() now accepts an optional per-invocation result observer, forwarding the same final status it publishes to the native operation-result event. D07F API methods use runForD07F() so rejected, saved-journal-stage-failed, saved-refresh-failed and unknown are not collapsed into unknown. No IndexedDB schema, event types, existing data or lock-release logic changed.

Checks: syntax of inline scripts in index.html and p31.html passed; isolated bridge tests passed for 5 status cases and failure-not-success invariant. No real IndexedDB, Safari or end-to-end verification yet. Do not deploy to production.
