create function touch_updated() returns trigger language plpgsql as $$ begin new.updated_at=now(); return new; end $$;
create function immutable_record() returns trigger language plpgsql as $$ begin raise exception 'Append-only record'; end $$;
create table imports (
 id uuid primary key default gen_random_uuid(), fingerprint text not null unique, source_system text not null,
 file_name text not null, mapping jsonb not null, original_rows jsonb not null, actor text not null,
 created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create table source_records (
 id uuid primary key default gen_random_uuid(), source_system text not null check (btrim(source_system)<>''),
 source_key text not null check (btrim(source_key)<>''), version integer not null check(version>0),
 name text not null check(btrim(name)<>''), business_id text not null default '', country text not null check(country in ('NZ','AU')),
 address text not null default '', observed_on date not null, evidence_ref text not null check(btrim(evidence_ref)<>''),
 import_id uuid references imports(id), actor text not null,
 created_at timestamptz not null default now(), updated_at timestamptz not null default now(), unique(source_system,source_key,version)
);
create table masters (
 id uuid primary key default gen_random_uuid(), code text not null unique check(btrim(code)<>''), name text not null,
 owner text not null check(btrim(owner)<>''), purpose text not null default '', review_due date not null,
 status text not null default 'draft' check(status in ('draft','approved','retired')), revision integer not null default 1,
 last_editor text not null, created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create table master_links (
 id uuid primary key default gen_random_uuid(), master_id uuid not null references masters(id),
 record_id uuid not null references source_records(id), source_system text not null, source_key text not null,
 created_at timestamptz not null default now(), updated_at timestamptz not null default now(), unique(source_system,source_key), unique(master_id,record_id)
);
create table master_fields (
 id uuid primary key default gen_random_uuid(), master_id uuid not null references masters(id),
 field text not null check(field in ('name','business_id','country','address')), record_id uuid not null references source_records(id),
 value text not null check(btrim(value)<>''), reason text not null check(btrim(reason)<>''), actor text not null,
 created_at timestamptz not null default now(), updated_at timestamptz not null default now(), unique(master_id,field)
);
create table reviews (
 id uuid primary key default gen_random_uuid(), master_id uuid not null references masters(id), revision integer not null,
 actor text not null, evidence_ref text not null, note text not null,
 created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create table events (
 id uuid primary key default gen_random_uuid(), master_id uuid references masters(id), action text not null, actor text not null,
 detail jsonb not null, created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create index source_lookup on source_records(source_system,source_key,version desc);
create index event_master on events(master_id,created_at);
create index link_master on master_links(master_id);
create view v_current_sources as select distinct on(source_system,source_key) * from source_records order by source_system,source_key,version desc;
create view v_duplicates as
 select a.id left_id,b.id right_id,a.name left_name,b.name right_name,a.source_system left_system,b.source_system right_system,
 case when a.business_id<>'' and upper(a.business_id)=upper(b.business_id) and a.country=b.country then 'identifier match' else 'name match only: inspect identity' end reason
 from v_current_sources a join v_current_sources b on a.id<b.id and a.country=b.country
 where (a.business_id<>'' and upper(a.business_id)=upper(b.business_id)) or lower(regexp_replace(a.name,'[^a-zA-Z0-9]','','g'))=lower(regexp_replace(b.name,'[^a-zA-Z0-9]','','g'));
create view v_crosswalk as
 select m.id master_id,m.code,l.source_system,l.source_key,s.version,s.name,s.observed_on,l.record_id,
 c.version current_version,(s.id<>c.id) stale_link
 from master_links l join masters m on m.id=l.master_id join source_records s on s.id=l.record_id
 join v_current_sources c on c.source_system=l.source_system and c.source_key=l.source_key;
create view v_field_conflicts as
 select m.id master_id,m.code,f.field,count(distinct f.value) variants,string_agg(distinct f.value,' | ') source_values,
 (select value from master_fields mf where mf.master_id=m.id and mf.field=f.field) chosen_value
 from masters m join master_links l on l.master_id=m.id join source_records s on s.id=l.record_id
 cross join lateral (values ('name',s.name),('business_id',s.business_id),('country',s.country),('address',s.address)) f(field,value)
 where f.value<>'' group by m.id,m.code,f.field having count(distinct f.value)>1;
create view v_issues as
 select m.id master_id,m.code,'PURPOSE' rule,'Record the business purpose' issue from masters m where m.status<>'retired' and btrim(m.purpose)=''
 union all select m.id,m.code,'DUE','Owner review is overdue' from masters m where m.status<>'retired' and m.review_due<current_date
 union all select m.id,m.code,'LINK','No source record linked' from masters m where m.status<>'retired' and not exists(select 1 from master_links l where l.master_id=m.id)
 union all select m.id,m.code,'FIELD','Choose source evidence for '||f.field from masters m cross join (values('name'),('business_id'),('country'),('address')) f(field)
 where m.status<>'retired' and not exists(select 1 from master_fields mf where mf.master_id=m.id and mf.field=f.field)
 union all select m.id,m.code,'STALE_LINK','Source has a newer version: '||c.source_system||'/'||c.source_key from v_crosswalk c join masters m on m.id=c.master_id where c.stale_link and m.status<>'retired'
 union all select m.id,m.code,'OLD_SOURCE','Evidence older than 180 days: '||s.source_system||'/'||s.source_key from master_links l join masters m on m.id=l.master_id join source_records s on s.id=l.record_id where s.observed_on<current_date-180 and m.status<>'retired'
 union all select m.id,m.code,'LINEAGE','Chosen field no longer has linked evidence: '||f.field from master_fields f join masters m on m.id=f.master_id where m.status<>'retired' and not exists(select 1 from master_links l where l.master_id=f.master_id and l.record_id=f.record_id);
create view v_review_queue as
 select m.id,m.code,m.name,m.owner,m.status,m.revision,m.review_due,
 (select count(*)::integer from v_issues i where i.master_id=m.id) issues,
 exists(select 1 from reviews r where r.master_id=m.id and r.revision=m.revision) current_review
 from masters m where m.status<>'retired';
create view v_ready as
 select m.id,m.code,m.owner,m.purpose,m.review_due,
 max(f.value) filter(where f.field='name') name,max(f.value) filter(where f.field='business_id') business_id,
 max(f.value) filter(where f.field='country') country,max(f.value) filter(where f.field='address') address
 from masters m join master_fields f on f.master_id=m.id where m.status='approved'
 and not exists(select 1 from v_issues i where i.master_id=m.id)
 and exists(select 1 from reviews r where r.master_id=m.id and r.revision=m.revision)
 group by m.id,m.code,m.owner,m.purpose,m.review_due;
alter table imports enable row level security;
revoke all on imports from public;
create trigger immutable_imports before update or delete on imports for each row execute function immutable_record();
alter table source_records enable row level security;
revoke all on source_records from public;
create trigger immutable_source_records before update or delete on source_records for each row execute function immutable_record();
alter table masters enable row level security;
revoke all on masters from public;
create trigger touch_masters before update on masters for each row execute function touch_updated();
alter table master_links enable row level security;
revoke all on master_links from public;
create trigger touch_master_links before update on master_links for each row execute function touch_updated();
alter table master_fields enable row level security;
revoke all on master_fields from public;
create trigger touch_master_fields before update on master_fields for each row execute function touch_updated();
alter table reviews enable row level security;
revoke all on reviews from public;
create trigger immutable_reviews before update or delete on reviews for each row execute function immutable_record();
alter table events enable row level security;
revoke all on events from public;
create trigger immutable_events before update or delete on events for each row execute function immutable_record();
