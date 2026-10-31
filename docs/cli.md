# CLI reference

Node 20 or newer. Run commands from this folder. `--json` works on every command. Flags use `--name=value`. Quote values containing spaces. Human output is a compact table for lists. Unknown flags, missing values, duplicate flags and ambiguous records fail with exit 1. Dates use YYYY-MM-DD. The supported initial countries are NZ and AU.

## Reads

- `sources`: Read the latest imported and manually recorded supplier evidence.
- `masters`: Read supplier master owners, purpose, status and review dates.
- `duplicates`: Inspect exact identifier or normalised-name matches. These are suggestions, never proof of identity.
- `field-conflicts`: Compare conflicting field values with the selected evidence.
- `crosswalk`: Read the link from each master to each source system and record version.
- `attention`: Find missing fields, overdue owner reviews and stale evidence.
- `compliance`: Check local record-quality controls and read docs/compliance.md for their sources and limits.
- `review-queue`: Plan this week’s stewardship reviews by due date and outstanding checks.
- `ready`: Read currently approved suppliers with complete, current evidence.
- `stale-sources`: Find source evidence older than the local 180-day policy.
- `imports`: Read import batch counts and attribution.
- `insights`: Answer ten cross-record questions from the current database.

Use `show masters SUP-001`, `show sources ERP/V100` and `history SUP-001` for details. Exact codes win over partial matches. Otherwise IDs and names match without case sensitivity. Ambiguity lists candidates and exits 1.

## Writes and files

### add-source

`node scripts/supplier.mjs add-source --system=<system> --key=<key> --name=<name> --business-id=<id> --country=NZ --address=<address> --observed=YYYY-MM-DD --reference=<evidence> --actor=<operator>`

Append checked supplier evidence as a new version. Never invent an observation date.

### add

`node scripts/supplier.mjs add --code=<code> --name=<label> --owner=<owner> --purpose=<purpose> --due=YYYY-MM-DD --actor=<operator>`

Create a draft supplier master with an owner and review date.

### link

`node scripts/supplier.mjs link <code> --record=<system/key> --reason=<reason> --actor=<operator> [--replace]`

Link one current source record after checking business identity.

### unlink

`node scripts/supplier.mjs unlink <code> --record=<system/key-or-linked-id> --reason=<reason> --actor=<operator>`

Remove a mistaken link with a reason. Keep source history and invalidate approval.

### choose

`node scripts/supplier.mjs choose <code> --field=name|business_id|country|address --record=<system/key> --reason=<reason> --actor=<operator>`

Select a field from linked evidence and record why that source wins.

### scope

`node scripts/supplier.mjs scope <code> --purpose=<purpose> --owner=<owner> --due=YYYY-MM-DD --actor=<operator>`

Record the purpose, accountable owner and next review date.

### approve

`node scripts/supplier.mjs approve <code> --reference=<review-evidence> --note=<findings> --actor=<reviewer>`

Record an independent human review of the original evidence.

### retire

`node scripts/supplier.mjs retire <code> --reason=<reason> --actor=<operator>`

Retire a master without deleting its history.

### log

`node scripts/supplier.mjs log <code> --note=<text> --actor=<operator>`

Append an internal note. A note does not certify a record.

### import

`node scripts/supplier.mjs import semarchy-xdm <file.csv> --system=<export-source> --observed=YYYY-MM-DD --reference=<evidence> --map=<mapping.json> --actor=<operator> [--dry-run]`

Preview and import a Semarchy xDM CSV using explicit column mapping.

### export

`node scripts/supplier.mjs export --out=<new-file.json> [--ready]`

Write a portable JSON copy to a new private file.

### draft-review

`node scripts/supplier.mjs draft-review <code>`

Draft a branded internal review pack in drafts/. Never send it.

## Evidence rules

Source records are immutable versions. The same values, observation date and evidence reference skip. Changed evidence appends a version. Earlier observation dates fail. A master links one source version per system/key, and the same system/key cannot belong to two masters.

Link refuses different countries or different nonempty business identifiers. Missing identifiers do not prove a match. A human still confirms identity, and a complete master needs a nonempty identifier selected from evidence. `--replace` adopts a new source version and removes fields selected from its previous version. Choose those fields again, with reasons.

The four required fields are name, business_id, country and address. Each chosen value must come from the linked current source version. All links must be current and no more than 180 days old. Purpose and an unexpired owner review date are required. Approval records a review of the current revision, by someone other than every recorded master editor. No role identity is authenticated by this CLI.

Ready status is calculated at read time. Even if stored status says approved, a newer source version, an expired review date or an old observation removes it from ready. Ordinary notes do not invalidate a review. Retired masters are read-only and excluded from active checks.

## Import and export

Imports validate the entire CSV and mapping, preserve original rows and run in one transaction. A repeated batch skips. A changed batch can append source versions. A validation or identity error rolls the whole batch back. `--dry-run` performs the same checks and rolls back every write. Mapping and source system determine identity, so keep them stable between imports.

Full export includes every record and history. `--ready` exports only currently approved, clear masters. Both write a new file and refuse overwrite. No file is transmitted. Coordinate destination-system mappings and authorisation separately. The JSON export is not a restore command.
