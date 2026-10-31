---
description: Create a draft supplier master with an owner and review date.
---
# /add

Create a draft supplier master with an owner and review date.

Read CLAUDE.md and docs/cli.md. Run `node scripts/supplier.mjs add --code=<code> --name=<label> --owner=<owner> --purpose=<purpose> --due=YYYY-MM-DD --actor=<operator>` with actual values from the operator. Quote arguments containing spaces. Append `--json` for structured results. Read the current record before a mutation. All writes require the named human actor. Never invent evidence, identity, approval or dates. If ambiguous, show the candidates and obtain the specific record. Explain any refused operation. Do not remove a check to make it pass.

Present the result in plain words, naming the affected supplier, evidence and unresolved checks. Any document remains an internal draft. Nothing sends or changes another system.
