# Phase 8 switch & lease isolation QA

- Verification build of 2026-10-26 switch-lease candidate.
- IndexedDB namespace: `juglog_phase8_switch_isolated_qa_20261026_db`.
- LocalStorage journal namespace: `juglog_phase8_switch_isolated_qa_20261026_attempt_journal`.
- Theme, view, preferences, pending/checkpoint keys also isolated.
- Never use for production data; create a fresh test session here.
- Keep the blocked PAUSED session in original `phase8-final-integration-qa/` untouched.
- No service worker registration in P31 runtime.
- QA is not a claim that Safari/IndexedDB runtime tests have passed.
