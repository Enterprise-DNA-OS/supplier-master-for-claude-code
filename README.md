# Supplier Master for Claude Code

The open-source supplier master record system that is just a database and Claude Code. Created by Enterprise DNA. Works with Claude Code, Codex, OpenCode or Cursor.

<!-- three-doors -->
<table align="center">
  <tr>
    <td align="center"><strong>Do it yourself</strong><br/>Clone it, run it, own it. Free, MIT.<br/><a href="#quick-start">Quick start</a></td>
    <td align="center"><strong>We customise it</strong><br/>Your fields, your rules, your Semarchy xDM data brought across.<br/><a href="https://enterprisedna.co/omni/book/?utm_source=github&utm_medium=readme&utm_campaign=semarchy-xdm">Book a call</a></td>
    <td align="center"><strong>We run it for you</strong><br/>Installed, connected and operated inside Omni. Setup fee, then a retainer.<br/><a href="https://enterprisedna.co/omni/instead-of/semarchy-xdm?utm_source=github&utm_medium=readme&utm_campaign=semarchy-xdm">How it works</a></td>
  </tr>
</table>

## What it does

Keep supplier records from different systems, review duplicate suggestions, choose each master field from its evidence and record an independent approval. Keep every source version and every decision. A changed source, expired review or missing field removes the supplier from the ready list.

This is a focused supplier stewardship base for trusted NZ/AU operators. Semarchy xDM is a broader master-data platform. We have not verified a current public standard annual price on its own website. Bring your quote and models to a scope review. [Research and scorecard](docs/research.md) separate historical price evidence from current claims.

Omni by Enterprise DNA customises and runs your version for a setup fee, then a retainer. Your fields, rules, source mappings, preferred database stack and team screens can be part of that work.

## Quick start

Node 20 or newer. Embedded PGlite needs no database installation.

```bash
npm install
npm run demo
node scripts/supplier.mjs review-queue
node scripts/supplier.mjs field-conflicts
node scripts/supplier.mjs insights
npm run view
npm run docs
npm test
```

Open this folder in your coding agent and ask for /weekly-review. All runtimes use the same .claude/commands library. The demo contains fictional names and deliberately conflicting, stale and overdue records. Business identifiers beginning DEMO are invented fixtures, not valid registry identifiers.

For actual work, use a separate empty DATA_DIR or set DATABASE_URL to your private PostgreSQL database and run npm run migrate. Do not seed an operated database. The seed refuses hosted databases except the isolated test mode. Never put credentials or exports in git.

## Weekly work

| Command | Job |
|---|---|
| /sources | Read the latest imported and manually recorded supplier evidence. |
| /masters | Read supplier master owners, purpose, status and review dates. |
| /duplicates | Inspect exact identifier or normalised-name matches. These are suggestions, never proof of identity. |
| /field-conflicts | Compare conflicting field values with the selected evidence. |
| /crosswalk | Read the link from each master to each source system and record version. |
| /attention | Find missing fields, overdue owner reviews and stale evidence. |
| /compliance | Check local record-quality controls and read docs/compliance.md for their sources and limits. |
| /review-queue | Plan this week’s stewardship reviews by due date and outstanding checks. |
| /ready | Read currently approved suppliers with complete, current evidence. |
| /stale-sources | Find source evidence older than the local 180-day policy. |
| /imports | Read import batch counts and attribution. |
| /insights | Answer ten cross-record questions from the current database. |
| /show | Read one full master or source record using an unambiguous identifier. |
| /history | Read the attributed decision history for one master. |
| /add-source | Append checked supplier evidence as a new version. Never invent an observation date. |
| /add | Create a draft supplier master with an owner and review date. |
| /link | Link one current source record after checking business identity. |
| /unlink | Remove a mistaken link with a reason. Keep source history and invalidate approval. |
| /choose | Select a field from linked evidence and record why that source wins. |
| /scope | Record the purpose, accountable owner and next review date. |
| /approve | Record an independent human review of the original evidence. |
| /retire | Retire a master without deleting its history. |
| /log | Append an internal note. A note does not certify a record. |
| /import | Preview and import a Semarchy xDM CSV using explicit column mapping. |
| /export | Write a portable JSON copy to a new private file. |
| /draft-review | Draft a branded internal review pack in drafts/. Never send it. |
| /weekly-review | Review the week from the queue, field conflicts and attention list. |
| /customise | Add a field or local rule with a tested migration. |
| /new-view | Add a branded read-only report. |

26 CLI commands and 29 workflow commands. [CLI reference](docs/cli.md) has the flags, examples and refusal rules. All commands support --json, partial IDs and case-insensitive names. Ambiguous names list candidates and exit 1.

## Ten questions to ask

The insights command answers these from live local records. They are included analyses, not a claim that Semarchy cannot build equivalent reports.

1. Which masters have overdue owner reviews?
2. Which names match despite different business identifiers?
3. Which masters have competing source addresses?
4. Which linked records have newer source evidence?
5. Which source records have no master?
6. Which owners have the most open checks?
7. Which evidence is too old for the local review rule?
8. Which complete records still need approval?
9. Which fields came from a different source than the supplier name?
10. Which approved suppliers are currently fit for reuse?

## Bring your history

Export supplier collections from Semarchy xDM as CSV. Map the actual headers and import each file with one command, after a dry run. [Switching guide](docs/replace-semarchy-xdm.md) explains model-specific fields, stable IDs, observation dates and what needs separate migration. The supplied CSV is synthetic, not a vendor export sample. Every imported row is preserved. Repeated batches skip and failed files roll back.

## Evidence and review

A source record is an immutable version. A master keeps links to particular versions. Field choices carry the source record and the reason. A match by name is only a suggestion. Conflicting nonempty identifiers or countries block a link. A reviewer must differ from every recorded master editor. Actor names are attribution, not verified identity.

[Compliance checks](docs/compliance.md) support record-quality review using NZ Principle 8 and Australian APP 10 where applicable. The 180-day evidence policy, required fields and second-person review are local controls, not statutory deadlines or certification. No bank details, sanctions check or payment instruction belongs in this system.

## Documents and views

npm run docs creates branded supplier review packs and change registers. /draft-review creates an internal pack in drafts/. npm run view creates three read-only reports: the stewardship week, source conflicts and currently approved suppliers. Set business name, colours and optional logo in brand.json. Nothing sends or updates another system.

[Why no front end](docs/why-no-front-end.md) explains the screen, mobile, authentication and connector capabilities that a custom version would need.

## Your first hour: ten things to ask for

1. Put our business name and colours on the review pack.
2. Show suppliers with overdue reviews.
3. Compare two source records before linking them.
4. Keep the old address and choose the current written evidence.
5. Show which masters became stale after a new import.
6. Name the owner and purpose for each supplier record.
7. Draft a pack for a second person to review.
8. Export only the currently approved supplier list.
9. Add our purchasing category with a tested migration.
10. Add a report grouping open checks by owner.

## Access and recovery

One private database per business, trusted operators only. All domain tables have row-level security enabled without public policies. A database owner bypasses that boundary and can bypass application rules. Append-only records resist ordinary updates, not administrator tampering. Secure original evidence separately, establish retention and erasure rules, and review data-minimisation before import.

PostgreSQL mutations take a transaction lock to keep source versions and review decisions consistent. Local PGlite is single-process. Export produces a portable JSON copy, not a backup or restore tool. Use native backups and test recovery. Generated files escape record text. Reports are snapshots and should be refreshed before use.

[Verification](docs/verification.md) records the tests and platforms actually exercised.

MIT. Semarchy is its owner’s trademark. This project is independent of Semarchy.
