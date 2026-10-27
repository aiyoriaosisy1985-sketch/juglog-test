Phase 8 resume fix (2026-10-26)

Root cause: append() obtains store.getAll() sorted by eventId key, unlike allEvents() which sorts by commitSequence. validateSessionLifecycle(replay(committed)) can therefore see SESSION_PAUSED before SESSION_CREATED or SESSION_RESUMED out of order, and reject a valid resumed PAUSED session as ACTIVE.

Fix: sort committed by commitSequence inside the same readwrite transaction before all validation. Does not change event schema, journal policy, lease policy, database names, or isolation.

QA: isolated candidate. Do not reopen blocked old sessions to retry until safely reconciled.

Isolation: fresh phase8_resume_order_qa identifiers for IndexedDB, journal, lease (within DB), and localStorage settings; no access to 998 or 999 test data.
