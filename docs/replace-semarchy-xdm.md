# Bring supplier records from Semarchy xDM

Semarchy’s [guided authoring tutorial](https://www.semarchy.com/tutorials-content/guided-data-authoring/) documents CSV and Excel export actions. Model designers control available actions and columns. There is no universal supplier header layout. Checked 2026-10-31.

1. In your xDM supplier collection, clear filters unless you deliberately want a subset. Use the authorised Export action and choose CSV with all required columns. If it only offers Excel, save the relevant sheet as UTF-8 CSV. Check exported row counts against the collection and confirm export permission with your administrator.
2. Preserve a copy outside git. Identify the stable supplier ID, legal name, country, business identifier and correspondence address. Do not import bank details or unnecessary personal columns. The importer preserves every original column in its batch record.
3. Copy examples/column-map.json and map each internal field to the exact exported header. SupplierID and the other supplied headers are synthetic fixture headers, not a claim about xDM defaults. Preserve IDs as text, including leading zeroes. An NZ or AU country code is required. Normalise other country labels explicitly before import.
4. In a fresh database, migrate and run the command below with --dry-run. Check the row count and resolve every error. Remove --dry-run to import the same file in one command.

```bash
node scripts/supplier.mjs import semarchy-xdm suppliers.csv --system=xDM --observed=2026-10-31 --reference=export-checked-by-owner --map=column-map.json --actor="Named operator" --dry-run
```

The observation date describes when the source evidence was actually checked, not merely the download date. If rows have different observation dates, import separate dated files. An export timestamp alone does not prove accuracy. Reconcile source count, IDs and sampled values after import using sources and imports. The import creates source evidence, not pre-approved masters. Create masters, link sources, select fields and obtain independent review.

The stable identity is source system plus source key. Keep that name and mapping unchanged on subsequent imports. Repeating a batch skips it. Changed observations append versions and flag linked masters for review. A conflicting or invalid row rolls the entire file back.

## What maps

Supplier key, name, business identifier, NZ/AU country and address map to source records. Original exported rows and the chosen column map stay in the import batch. A single master-export file can be used as a source snapshot, but it does not reconstruct all upstream source records.

## What needs explicit migration work

xDM match rules, workflows, source lineage, relationships, attachments, users, roles and model configuration do not travel through this CSV importer. Export each source-level collection separately if you need its history, then map it deliberately. The free base uses simple exact-match suggestions and human field selection. Enterprise DNA builds the additional mappings and connections into a custom version.

## Switch-in-a-day scope

One mapped CSV imports with one command. Trial the files and reconcile counts in a separate database before changing an operating process. A complete enterprise platform migration depends on your models and integrations. Keep the original exports, attachment store and vendor access until the business owner accepts the migrated scope. This tool never writes back to xDM.
