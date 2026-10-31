import fs from 'node:fs';import path from 'node:path';import {pathToFileURL} from 'node:url';
import {getDb,REPO_ROOT} from './lib/db.mjs';
export async function seed(db){
 if(db.mode==='postgres'&&!process.env.TEST_DATABASE_URL)throw Error('Demo seed refuses a hosted database');
 if(Number((await db.query('select count(*) n from events'))[0].n)>0||Number((await db.query('select count(*) n from imports'))[0].n)>0)throw Error('Cannot seed an operated database');
 await db.exec('BEGIN');try{await db.exec(fs.readFileSync(path.join(REPO_ROOT,'supabase/seed.sql'),'utf8'));await db.exec('COMMIT');}catch(e){await db.exec('ROLLBACK');throw e;}
}
if(process.argv[1]&&import.meta.url===pathToFileURL(path.resolve(process.argv[1])).href){const db=await getDb();try{await seed(db);console.log('seed: fictional supplier records ready');}finally{await db.close();}}
