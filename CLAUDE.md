# Supplier Master for Claude Code

For trusted supplier-data stewards in an NZ or AU business. Enter your business name, operator roles and agreed review policy before handling real data. The demo is fictional.

## One workflow library

Use scripts/supplier.mjs for records. Read the record and original evidence before a write. Claude Code, Codex, OpenCode and Cursor use the same .claude/commands library.

| Job | Recipe |
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

## Operating rules

Every answer starts with current CLI data. All writes need --actor and append history. A name match is a suggestion, not identity. Never invent a business identifier, evidence reference, source observation date or independent approval. Actor names are attribution, not authentication.

A reviewer must differ from every recorded master editor. Changing evidence or a field removes ready status. Read docs/compliance.md before making a compliance statement. The 180-day freshness policy is local, not a statutory deadline. No payment details or payment instructions belong here.

Nothing sends, pays, publishes or writes to a source system. Draft to drafts/. Retire obsolete masters. Source snapshots, import batches, reviews and events are append-only to ordinary application commands. An administrator can bypass application controls. Plan retention and erasure of personal data separately.

Use one private database for one business. Never expose a database owner connection to untrusted users. Keep source files, credentials and generated reports out of git. Export is a portable copy, not a database backup. Use tested native backups for recovery.

Run npm test after code changes. Add migrations in sequence. Use npm run demo only in the local demo database. Reports are read-only snapshots and must be refreshed before a decision.

Omni by Enterprise DNA: https://enterprisedna.co/omni/instead-of/semarchy-xdm
