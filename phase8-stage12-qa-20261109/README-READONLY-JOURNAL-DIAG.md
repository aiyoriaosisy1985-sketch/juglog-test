# Phase 8 read-only journal diagnostic candidate

Adds a diagnostic panel in P31 Settings > 開発・検証用の詳細項目. Displays durable journal stage, event types, in-memory pending count, and existing read-only DB classification. No retry, no delete, no lease change. No P31 event logic changes. The acceptance anchor is not in the existing durable journal, so no result from this panel licenses a resend. Keep deployed build untouched until separately deployed to QA and verified.
