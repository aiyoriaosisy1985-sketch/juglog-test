# Phase 8 - isolated integration QA candidate

Built from juglog_phase8_storage_integration_review_20261026.zip.
- IndexedDB database: `juglog_phase8_storage_integration_isolated_20261026_v1`
- Local storage prefix: `juglog_phase8_storage_integration_isolated_20261026_`
- Emergency download prefix: `juglog-isolated-qa-unsaved-emergency-`
- Original DB names and keys in source ZIP are not used in this variant.
- Open `p31.html` directly only on the intended QA GitHub Pages origin.
- This is NOT a passed Safari or IndexedDB runtime test.
- Do not use with production data or deploy over an existing version.
- Tests required: unknown-state safety stop, journal preserved, no duplicate event, and limited regressions.
