#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import {createHash} from 'node:crypto';
import {pathToFileURL} from 'node:url';
import {getDb,REPO_ROOT} from './lib/db.mjs';
import {parseCsv} from './lib/csv.mjs';
import {table as htmlTable,page,writeOut} from './lib/render.mjs';

export const fields=['name','business_id','country','address'];
export const reads={
 sources:'select id,source_system,source_key,version,name,business_id,country,address,observed_on from v_current_sources order by source_system,source_key',
 masters:'select code,name,owner,purpose,status,revision,review_due from masters order by code',
 duplicates:'select left_id,right_id,left_name,right_name,left_system,right_system,reason from v_duplicates order by left_name',
 'field-conflicts':'select code,field,variants,source_values,chosen_value from v_field_conflicts order by code,field',
 crosswalk:'select code,source_system,source_key,version,current_version,stale_link from v_crosswalk order by code,source_system',
 attention:'select code,rule,issue from v_issues order by code,rule',
 compliance:'select code,rule,issue from v_issues order by code,rule',
 'review-queue':'select code,name,owner,status,issues,current_review,review_due from v_review_queue order by review_due,code',
 ready:'select code,name,business_id,country,address,owner,review_due from v_ready order by code',
 'stale-sources':"select source_system,source_key,name,observed_on,current_date-observed_on age_days from v_current_sources where observed_on<current_date-180 order by observed_on",
 imports:'select id,source_system,file_name,actor,jsonb_array_length(original_rows) row_count,created_at from imports order by created_at'
};
export const questions=[
 ['Which masters have overdue owner reviews?',"select code,owner,review_due from masters where status<>'retired' and review_due<current_date order by review_due"],
 ['Which names match despite different business identifiers?',"select a.name,a.business_id left_identifier,b.business_id right_identifier from v_current_sources a join v_current_sources b on a.id<b.id and lower(a.name)=lower(b.name) where a.business_id<>b.business_id"],
 ['Which masters have competing source addresses?',"select code,source_values,chosen_value from v_field_conflicts where field='address' order by code"],
 ['Which linked records have newer source evidence?',"select code,source_system,source_key,version,current_version from v_crosswalk where stale_link order by code"],
 ['Which source records have no master?',"select s.source_system,s.source_key,s.name from v_current_sources s where not exists(select 1 from master_links l where l.source_system=s.source_system and l.source_key=s.source_key) order by s.name"],
 ['Which owners have the most open checks?',"select m.owner,count(*)::integer checks from v_issues i join masters m on m.id=i.master_id group by m.owner order by checks desc,m.owner"],
 ['Which evidence is too old for the local review rule?',reads['stale-sources']],
 ['Which complete records still need approval?',"select code,owner,revision from v_review_queue where issues=0 and (status<>'approved' or not current_review) order by code"],
 ['Which fields came from a different source than the supplier name?',"select m.code,f.field,s.source_system field_source,n.source_system name_source from master_fields f join masters m on m.id=f.master_id join source_records s on s.id=f.record_id join master_fields nf on nf.master_id=f.master_id and nf.field='name' join source_records n on n.id=nf.record_id where f.field<>'name' and s.source_system<>n.source_system order by m.code,f.field"],
 ['Which approved suppliers are currently fit for reuse?',reads.ready]
];
const mutations={
 'add-source':['system','key','name','business-id','country','address','observed','reference'],
 add:['code','name','owner','purpose','due'],link:['record','replace','reason'],unlink:['record','reason'],
 choose:['field','record','reason'],scope:['purpose','owner','due'],approve:['reference','note'],retire:['reason'],log:['note'],
 import:['system','observed','reference','map','dry-run']
};
export const commands=[...Object.keys(reads),'insights','show','history',...Object.keys(mutations),'export','draft-review'];
const specs={...Object.fromEntries(Object.keys(reads).map(k=>[k,[]])),insights:[],show:[],history:[],...mutations,export:['out','ready'], 'draft-review':[]};
function parse(args){
 const pos=[],opts={};
 for(const a of args){if(!a.startsWith('--')){pos.push(a);continue;}const [k,...v]=a.slice(2).split('=');if(Object.hasOwn(opts,k))throw Error('Duplicate flag: '+k);opts[k]=v.length?v.join('='):true;}
 const cmd=pos.shift()||'help';if(cmd==='help')return {cmd,pos,opts};
 if(!specs[cmd])throw Error('Unknown command. Choose: '+commands.join(', '));
 const allowed=new Set([...specs[cmd],'json',...(mutations[cmd]?['actor']:[])]);
 for(const k of Object.keys(opts)){if(!allowed.has(k))throw Error('Unknown flag: --'+k);if(!['json','replace','dry-run','ready'].includes(k)&&typeof opts[k]!=='string')throw Error('Flag needs a value: --'+k);if(['json','replace','dry-run','ready'].includes(k)&&opts[k]!==true)throw Error('Boolean flag takes no value: --'+k);}
 const n=cmd==='import'?2:cmd==='show'?2:['history','link','unlink','choose','scope','approve','retire','log','draft-review'].includes(cmd)?1:0;
 if(pos.length!==n)throw Error(`${cmd} expects ${n} positional argument(s)`);
 return {cmd,pos,opts};
}
function need(opts,k){const s=opts[k];if(typeof s!=='string'||!s.trim())throw Error('Required --'+k+'=value');return s.trim();}
export function date(v){if(!/^\d{4}-\d{2}-\d{2}$/.test(v)||!Number.isFinite(Date.parse(v))||new Date(v+'T00:00:00Z').toISOString().slice(0,10)!==v)throw Error('Invalid ISO date: '+v);return v;}
const today=()=>new Date().toISOString().slice(0,10);
function sourceData(o){
 const observed=date(need(o,'observed'));if(observed>today())throw Error('Observation cannot be in the future');
 const country=need(o,'country').toUpperCase();if(!['NZ','AU'].includes(country))throw Error('Country must be NZ or AU');
 return {source_system:need(o,'system'),source_key:need(o,'key'),name:need(o,'name'),business_id:String(o['business-id']||'').trim().toUpperCase(),country,address:String(o.address||'').trim(),observed_on:observed,evidence_ref:need(o,'reference')};
}
async function resolve(db,kind,key){
 if(!['masters','sources'].includes(kind))throw Error('Choose masters or sources');
 const rows=await db.query(kind==='masters'?'select * from masters order by code':'select * from v_current_sources order by source_system,source_key');
 const q=String(key).toLowerCase();
 const labels=r=>kind==='masters'?[r.code,r.name]:[r.source_system+'/'+r.source_key,r.source_key,r.name];
 const exact=rows.filter(r=>r.id===q||labels(r).slice(0,kind==='masters'?1:2).some(x=>x.toLowerCase()===q));
 const matches=exact.length?exact:rows.filter(r=>r.id.startsWith(q)||labels(r).some(x=>x.toLowerCase().includes(q)));
 if(matches.length!==1)throw Error((matches.length?'Ambiguous. Candidates: ':'Not found. Available: ')+(matches.length?matches:rows).map(r=>r.id+' '+labels(r)[0]+' '+r.name).join('\n'));
 return matches[0];
}
async function event(db,master,action,actor,detail){await db.query('insert into events(master_id,action,actor,detail) values($1,$2,$3,$4)',[master,action,actor,JSON.stringify(detail)]);}
async function change(db,m,actor){await db.query("update masters set revision=revision+1,status='draft',last_editor=$2 where id=$1",[m.id,actor]);}
async function addSource(db,d,actor,importId=null){
 const old=(await db.query('select * from v_current_sources where source_system=$1 and source_key=$2',[d.source_system,d.source_key]))[0];
 if(old&&d.observed_on<old.observed_on)throw Error('Observation older than existing source evidence: '+d.source_key);
 if(old&&Object.keys(d).every(k=>String(d[k])===String(old[k])))return {id:old.id,skipped:true};
 const row=(await db.query('insert into source_records(source_system,source_key,version,name,business_id,country,address,observed_on,evidence_ref,actor,import_id) values($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11) returning *',[d.source_system,d.source_key,(old?.version||0)+1,d.name,d.business_id,d.country,d.address,d.observed_on,d.evidence_ref,actor,importId]))[0];
 await event(db,null,'add-source',actor,{record_id:row.id,source_system:d.source_system,source_key:d.source_key,version:row.version});return row;
}
async function show(db,kind,key){const r=await resolve(db,kind,key);if(kind==='sources')return r;
 return {...r,fields:await db.query('select field,value,record_id,reason from master_fields where master_id=$1 order by field',[r.id]),sources:await db.query('select * from v_crosswalk where master_id=$1',[r.id]),issues:await db.query('select rule,issue from v_issues where master_id=$1',[r.id]),reviews:await db.query('select revision,actor,evidence_ref,note from reviews where master_id=$1 order by created_at',[r.id])};}
async function importFile(db,pos,o,actor){
 if(pos[0]!=='semarchy-xdm')throw Error('Import supports semarchy-xdm CSV');
 const rows=parseCsv(fs.readFileSync(pos[1],'utf8'));if(!rows.length)throw Error('CSV has no records');
 const mapping=o.map?JSON.parse(fs.readFileSync(o.map,'utf8')):{key:'SupplierID',name:'SupplierName','business-id':'BusinessID',country:'Country',address:'Address'};
 if(!mapping||Array.isArray(mapping)||typeof mapping!=='object')throw Error('Mapping must be an object');
 const keys=['key','name','business-id','country','address'];
 for(const [k,v] of Object.entries(mapping)){if(!keys.includes(k)||typeof v!=='string'||!Object.hasOwn(rows[0],v))throw Error('Unknown mapping or missing CSV column: '+k);}
 for(const k of ['key','name','country'])if(!mapping[k])throw Error('Mapping requires '+k);
 const d=rows.map(r=>sourceData({...o,...Object.fromEntries(Object.entries(mapping).map(([k,h])=>[k,r[h]]))}));
 if(new Set(d.map(x=>x.source_key)).size!==d.length)throw Error('Duplicate source key within CSV');
 const fingerprint=createHash('sha256').update(JSON.stringify({d,mapping,rows})).digest('hex');
 const old=(await db.query('select id from imports where fingerprint=$1',[fingerprint]))[0];if(old)return {duplicate_batch:true,id:old.id,rows:rows.length};
 const batch=(await db.query('insert into imports(fingerprint,source_system,file_name,mapping,original_rows,actor) values($1,$2,$3,$4,$5,$6) returning id',[fingerprint,need(o,'system'),path.basename(pos[1]),JSON.stringify(mapping),JSON.stringify(rows),actor]))[0];
 let added=0,skipped=0;for(const x of d){const r=await addSource(db,x,actor,batch.id);r.skipped?skipped++:added++;}
 return {id:batch.id,rows:rows.length,added,skipped,dry_run:!!o['dry-run']};
}
export async function run(db,args){
 const {cmd,pos,opts:o}=parse(args);
 if(cmd==='help')return {commands,usage:'node scripts/supplier.mjs <command> [record] --flag=value [--json]. Read docs/cli.md.'};
 if(reads[cmd])return db.query(reads[cmd]);
 if(cmd==='insights'){const out=[];for(const [question,sql]of questions)out.push({question,rows:await db.query(sql)});return out;}
 if(cmd==='show')return show(db,pos[0],pos[1]);
 if(cmd==='history'){const m=await resolve(db,'masters',pos[0]);return db.query('select action,actor,detail,created_at from events where master_id=$1 order by created_at,id',[m.id]);}
 if(cmd==='draft-review'){
 const m=await show(db,'masters',pos[0]);const file=writeOut('drafts','review-'+m.code+'-'+Date.now(),page({title:'Internal draft: supplier review',subtitle:m.code,sections:[{title:'Scope',html:htmlTable([{owner:m.owner,purpose:m.purpose,review_due:m.review_due}])},{title:'Chosen evidence',html:htmlTable(m.fields)},{title:'Checks',html:htmlTable(m.issues),note:'Inspect the original evidence. This document does not approve or send anything.'}]}));return {file};
 }
 if(cmd==='export'){
 const out=path.resolve(need(o,'out'));let data;
 await db.exec('BEGIN ISOLATION LEVEL REPEATABLE READ READ ONLY');try{
 data={format:'supplier-master-v1',exported_at:new Date().toISOString()};
 if(o.ready)data.ready=await db.query('select * from v_ready order by code');
 else for(const t of ['imports','source_records','masters','master_links','master_fields','reviews','events'])data[t]=await db.query('select * from '+t+' order by id');
 await db.exec('COMMIT');}catch(e){await db.exec('ROLLBACK');throw e;}
 fs.mkdirSync(path.dirname(out),{recursive:true,mode:0o700});fs.writeFileSync(out,JSON.stringify(data,null,2)+'\n',{flag:'wx',mode:0o600});return {file:out,ready_only:!!o.ready};
 }
 const actor=need(o,'actor');let result;
 await db.exec('BEGIN');
 try{
 // One mutation at a time on PostgreSQL; PGlite already uses one process per local database.
 await db.exec('LOCK TABLE masters,source_records,master_links,master_fields,reviews,imports,events IN SHARE ROW EXCLUSIVE MODE');
 if(cmd==='add-source')result=await addSource(db,sourceData(o),actor);
 else if(cmd==='import')result=await importFile(db,pos,o,actor);
 else if(cmd==='add'){
 const due=date(need(o,'due'));
 result=(await db.query('insert into masters(code,name,owner,purpose,review_due,last_editor) values($1,$2,$3,$4,$5,$6) returning *',[need(o,'code'),need(o,'name'),need(o,'owner'),String(o.purpose||''),due,actor]))[0];
 await event(db,result.id,cmd,actor,{code:result.code,purpose:result.purpose,review_due:due});
 }else{
 const m=await resolve(db,'masters',pos[0]);if(m.status==='retired')throw Error('Retired master is read-only');
 if(cmd==='link'){
 const s=await resolve(db,'sources',need(o,'record'));need(o,'reason');
 const links=await db.query('select l.*,s.business_id,s.country from master_links l join source_records s on s.id=l.record_id where l.master_id=$1',[m.id]);
 const old=links.find(x=>x.source_system===s.source_system&&x.source_key===s.source_key);
 if(old&&!o.replace)throw Error('Already linked. Use --replace to adopt a new source version');
 if(old?.record_id===s.id)throw Error('Already linked to this version');
 const conflict=links.filter(x=>x.id!==old?.id).some(x=>x.country!==s.country||(x.business_id&&s.business_id&&x.business_id.toUpperCase()!==s.business_id.toUpperCase()));
 if(conflict)throw Error('Identity conflict: country or business identifier differs');
 if(old){await db.query('delete from master_fields where master_id=$1 and record_id=$2',[m.id,old.record_id]);await db.query('update master_links set record_id=$2 where id=$1',[old.id,s.id]);}
 else await db.query('insert into master_links(master_id,record_id,source_system,source_key) values($1,$2,$3,$4)',[m.id,s.id,s.source_system,s.source_key]);
 await change(db,m,actor);result={record_id:s.id,previous_record_id:old?.record_id||null,reason:o.reason};
 }else if(cmd==='unlink'){
 need(o,'reason');const key=need(o,'record').toLowerCase();
 const rows=await db.query('select l.*,s.name from master_links l join source_records s on s.id=l.record_id where l.master_id=$1',[m.id]);
 const matches=rows.filter(x=>x.record_id.toLowerCase().startsWith(key)||(x.source_system+'/'+x.source_key).toLowerCase()===key);
 if(matches.length!==1)throw Error('Specify one linked record ID or system/key. Candidates: '+rows.map(x=>x.record_id+' '+x.source_system+'/'+x.source_key).join(', '));
 await db.query('delete from master_fields where master_id=$1 and record_id=$2',[m.id,matches[0].record_id]);await db.query('delete from master_links where id=$1',[matches[0].id]);await change(db,m,actor);result={removed:matches[0],reason:o.reason};
 }else if(cmd==='choose'){
 const field=need(o,'field');if(!fields.includes(field))throw Error('Choose field: '+fields.join(', '));
 const s=await resolve(db,'sources',need(o,'record'));const reason=need(o,'reason');
 if(!(await db.query('select id from master_links where master_id=$1 and record_id=$2',[m.id,s.id])).length)throw Error('Link the current source version first');
 if(!s[field])throw Error('Source field is empty');
 await db.query('insert into master_fields(master_id,field,record_id,value,reason,actor) values($1,$2,$3,$4,$5,$6) on conflict(master_id,field) do update set record_id=excluded.record_id,value=excluded.value,reason=excluded.reason,actor=excluded.actor',[m.id,field,s.id,s[field],reason,actor]);await change(db,m,actor);result={field,value:s[field],record_id:s.id,reason};
 }else if(cmd==='scope'){
 const purpose=need(o,'purpose'),owner=need(o,'owner'),due=date(need(o,'due'));
 await db.query('update masters set purpose=$2,owner=$3,review_due=$4 where id=$1',[m.id,purpose,owner,due]);await change(db,m,actor);result={purpose,owner,review_due:due};
 }else if(cmd==='approve'){
 const reference=need(o,'reference'),note=need(o,'note');const issues=await db.query('select rule,issue from v_issues where master_id=$1',[m.id]);
 if(issues.length)throw Error('Approval blocked: '+issues.map(x=>x.rule+': '+x.issue).join('; '));
 const editors=await db.query("select distinct actor from events where master_id=$1 and action in ('add','link','unlink','choose','scope')",[m.id]);
 if([m.last_editor,...editors.map(x=>x.actor)].some(x=>x.trim().toLowerCase()===actor.toLowerCase()))throw Error('Reviewer must differ from every recorded editor');
 await db.query('insert into reviews(master_id,revision,actor,evidence_ref,note) values($1,$2,$3,$4,$5)',[m.id,m.revision,actor,reference,note]);await db.query("update masters set status='approved' where id=$1",[m.id]);result={revision:m.revision,reference,note};
 }else if(cmd==='retire'){
 const reason=need(o,'reason');await db.query("update masters set status='retired',revision=revision+1,last_editor=$2 where id=$1",[m.id,actor]);result={reason};
 }else if(cmd==='log')result={note:need(o,'note')};
 await event(db,m.id,cmd,actor,result);result={code:m.code,...result};
 }
 await db.exec(o['dry-run']?'ROLLBACK':'COMMIT');return result;
 }catch(e){await db.exec('ROLLBACK');throw e;}
}
function printable(x){return x===null?'':typeof x==='object'?JSON.stringify(x):String(x);}
export function format(rows){
 if(!Array.isArray(rows))return JSON.stringify(rows,null,2);if(!rows.length)return '(no records)';
 if(rows[0].question)return rows.map(x=>x.question+'\n'+format(x.rows)).join('\n\n');
 const keys=Object.keys(rows[0]),widths=keys.map(k=>Math.min(85,Math.max(k.length,...rows.map(r=>printable(r[k]).length))));
 const line=r=>keys.map((k,i)=>printable(r[k]).replace(/[\r\n]+/g,' ').slice(0,widths[i]).padEnd(widths[i])).join('  ');
 return [line(Object.fromEntries(keys.map(k=>[k,k.replaceAll('_',' ')]))),widths.map(w=>'-'.repeat(w)).join('  '),...rows.map(line)].join('\n');
}
if(process.argv[1]&&import.meta.url===pathToFileURL(path.resolve(process.argv[1])).href){
 let db;try{db=await getDb();const result=await run(db,process.argv.slice(2));console.log(process.argv.includes('--json')?JSON.stringify(result,null,2):format(result));}catch(e){console.error(e.message);process.exitCode=1;}finally{if(db)await db.close();}
}
