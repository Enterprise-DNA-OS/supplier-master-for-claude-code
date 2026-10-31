insert into source_records(id,source_system,source_key,version,name,business_id,country,address,observed_on,evidence_ref,actor) values
 ('10000000-0000-4000-8000-000000000001','ERP','V100',1,'Kauri Components Ltd','DEMO-NZ-100','NZ','8 Harbour Road, Auckland',current_date-12,'demo:supplier-form-100','Demo'),
 ('10000000-0000-4000-8000-000000000002','Purchasing','P44',1,'Kauri Components Limited','DEMO-NZ-100','NZ','18 Harbour Road, Auckland',current_date-8,'demo:address-confirmation-100','Demo'),
 ('10000000-0000-4000-8000-000000000003','ERP','V200',1,'Southern Bearings','DEMO-AU-200','AU','7 Foundry Street, Geelong',current_date-250,'demo:old-onboarding-200','Demo'),
 ('10000000-0000-4000-8000-000000000004','Purchasing','P88',1,'Southern Bearings','DEMO-AU-999','AU','22 River Road, Ballarat',current_date-5,'demo:different-company-999','Demo'),
 ('10000000-0000-4000-8000-000000000005','ERP','V300',1,'Tui Packaging Ltd','DEMO-NZ-300','NZ','4 Port Road, Tauranga',current_date-3,'demo:form-300','Demo') on conflict do nothing;
insert into masters(id,code,name,owner,purpose,review_due,last_editor) values
 ('20000000-0000-4000-8000-000000000001','SUP-001','Kauri Components','Mere','Purchasing and supplier correspondence',current_date+30,'Demo'),
 ('20000000-0000-4000-8000-000000000002','SUP-002','Southern Bearings','Aroha','',current_date-5,'Demo'),
 ('20000000-0000-4000-8000-000000000003','SUP-003','Tui Packaging','Mere','Supplier correspondence',current_date+30,'Demo') on conflict do nothing;
insert into master_links(master_id,record_id,source_system,source_key)
 select '20000000-0000-4000-8000-000000000001',id,source_system,source_key from source_records where source_key in('V100','P44') on conflict do nothing;
insert into master_links(master_id,record_id,source_system,source_key)
 select '20000000-0000-4000-8000-000000000002',id,source_system,source_key from source_records where source_key='V200' on conflict do nothing;
insert into master_links(master_id,record_id,source_system,source_key)
 select '20000000-0000-4000-8000-000000000003',id,source_system,source_key from source_records where source_key='V300' on conflict do nothing;
insert into master_fields(master_id,field,record_id,value,reason,actor)
 select l.master_id,f.field,s.id,f.value,'Demo source selection','Demo' from master_links l join source_records s on s.id=l.record_id
 cross join lateral(values('name',s.name),('business_id',s.business_id),('country',s.country),('address',s.address)) f(field,value)
 where s.source_key in('V100','V300') on conflict do nothing;
