---
description: Preview and import a Semarchy xDM CSV using explicit column mapping.
---
# /import

Preview and import a Semarchy xDM CSV using explicit column mapping.

Read CLAUDE.md and docs/cli.md. Run `node scripts/supplier.mjs import semarchy-xdm <file.csv> --system=<export-source> --observed=YYYY-MM-DD --reference=<evidence> --map=<mapping.json> --actor=<operator> [--dry-run]` with actual values from the operator. Quote arguments containing spaces. Append `--json` for structured results. Read the current record before a mutation. All writes require the named human actor. Never invent evidence, identity, approval or dates. If ambiguous, show the candidates and obtain the specific record. Explain any refused operation. Do not remove a check to make it pass.

Present the result in plain words, naming the affected supplier, evidence and unresolved checks. Any document remains an internal draft. Nothing sends or changes another system.
