---
description: Select a field from linked evidence and record why that source wins.
---
# /choose

Select a field from linked evidence and record why that source wins.

Read CLAUDE.md and docs/cli.md. Run `node scripts/supplier.mjs choose <code> --field=name|business_id|country|address --record=<system/key> --reason=<reason> --actor=<operator>` with actual values from the operator. Quote arguments containing spaces. Append `--json` for structured results. Read the current record before a mutation. All writes require the named human actor. Never invent evidence, identity, approval or dates. If ambiguous, show the candidates and obtain the specific record. Explain any refused operation. Do not remove a check to make it pass.

Present the result in plain words, naming the affected supplier, evidence and unresolved checks. Any document remains an internal draft. Nothing sends or changes another system.
