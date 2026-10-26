# Phase 8 v5.8.8 — Safari resume lease synchronization (QA only)

Based on the complete 35-file v5.8.7 test package. Changed `p31.html` only.

- Added a shared `leaseTask` promise so Safari resume handlers and new inputs can wait on the same in-flight lease reconciliation.
- A user operation first blocks concurrent inputs, awaits lease renewal/reacquisition (and data refresh if reacquired), then performs the existing read-only acceptance anchor validation and existing transaction-level lease check.
- Retains rejection when a different tab holds the lease, and keeps journal, operation IDs, and event append behavior unchanged.
- Preserves the caller's busy lock across a lease reacquisition.

Known limitation: these checks do not prove real iPhone Safari / IndexedDB behavior. Do not promote to production without real-device reproduction testing. Original v5.8.7 and published tests untouched.
