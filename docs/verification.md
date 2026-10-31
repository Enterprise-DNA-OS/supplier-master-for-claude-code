# Verification

2026-10-31, Node 22.23.4 on Linux.

- npm install: clean dependency audit.
- npm test: PASS, 116 assertions across all 26 CLI commands on PGlite.
- PostgreSQL test against an isolated local instance: PASS, the same 116 assertions.
- npm run demo, npm run view and npm run docs: PASS. Three views and six documents generated from fictional data.
- Tests cover migration reruns, seed idempotency, identity conflicts, field provenance, independent review, stale approval exclusion, import preview, repeated imports, full transaction rollback, malformed CSV, dates, unknown flags, ambiguity, append-only history, exports, escaped HTML and actual CLI subprocesses.

The GitHub workflow tests Windows and Linux PGlite plus PostgreSQL. CI results are recorded after the private push. No claims of enterprise-scale performance, authenticated multi-user access or a complete Semarchy migration are made. No customer database or vendor account was accessed.
