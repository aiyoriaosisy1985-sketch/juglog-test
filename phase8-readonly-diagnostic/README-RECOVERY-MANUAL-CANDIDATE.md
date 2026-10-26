# Phase 8 — manual recovery candidate (2026-10-25)

Unapproved test candidate. Does NOT overwrite v5.8.7 or the GitHub deployment.

- No automatic queue resend on Safari return.
- Explicit user confirmation before queued recovery.
- A single in-memory queued operation must exactly match the durable acceptance journal.
- Refresh and classify the same operation ID before doing anything.
- If saved and projected effectively: clear the journal, then clear the matching in-memory queue without resending.
- If provably unsaved: retry under same operation ID and verify the commit, projection and journal completion.
- If missing queue after reload, corrupted journal, ambiguous save, mismatch or stale lease: stop without resend.

NOT VALIDATED: live Safari failpoint tests, IndexedDB write races, and restoration of in-memory queues after browser termination. Do NOT deploy to production or run fault injection against the existing 999 test session.
