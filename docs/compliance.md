# Record quality, sources and limits

Checked 2026-10-31. This is an evidence workflow, not a legal opinion or a certification. Supplier company details do not always constitute personal information. Where a sole trader or identifiable person is recorded, assess the rules that apply to your business before use.

## Published requirements

- [NZ Privacy Commissioner, Principle 8](https://www.privacy.org.nz/privacy-principles/8/): reasonable accuracy checks before using or disclosing personal information. Recorded provenance, observations and the current-record gate support that review. They do not verify the truth of a source.
- [OAIC, APP 10 guidance](https://www.oaic.gov.au/privacy/australian-privacy-principles/australian-privacy-principles-guidelines/chapter-10-app-10-quality-of-personal-information): covered entities consider quality at collection and use, with relevance assessed for the purpose. Source references, review purpose and explicit field decisions provide evidence for that assessment. Applicability depends on the entity.

## Implemented local controls

| Rule | Check | Meaning |
|---|---|---|
| PURPOSE | Master has a stated purpose | Local evidence for assessing relevance |
| DUE | Owner review date has not passed | Business-set date, not a statutory deadline |
| LINK | At least one source record is linked | Evidence exists, not proof that it is true |
| FIELD | Four required fields are selected from sources | Local completeness policy |
| STALE_LINK | Linked source version is the latest | New evidence requires renewed field decisions |
| OLD_SOURCE | Every linked observation is within 180 days | Local freshness rule, not law |
| LINEAGE | Chosen fields retain linked evidence | Prevents detached field claims |
| Identity | Link rejects different countries or conflicting nonempty identifiers | Human investigation still required, identifiers are not checked with a registry |
| Independent review | Reviewer differs from every recorded editor | Names are attribution, not authenticated separation of duties |

`compliance` and `attention` list record gaps. `approve` refuses those gaps. `ready` also requires an approval of the current revision. None of these certify legal compliance. A director or data steward checks original evidence, rights to use it, privacy applicability and business relevance.

No bank details, sanctions screening, tax validation or payment authorisation are implemented. Access controls, retention, erasure, incident handling and destination-system permissions need a deployment-specific design. The append-only audit history is useful evidence but is not tamper-proof against a database administrator. Do not put unnecessary personal information in imported columns or notes. Full export includes those originals.
