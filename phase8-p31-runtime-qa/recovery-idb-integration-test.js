/* Phase 8 isolated IndexedDB recovery integration probe.
 * Only creates juglog_p8_recovery_probe_*; never opens application DB.
 * Exercises durable intent + event store + repeated writes + reload-like restart.
 * This is a model integration test, NOT a direct call to P31 retryQueue().
 */
(function(){'use strict';
const request=r=>new Promise((resolve,reject)=>{r.onsuccess=()=>resolve(r.result);r.onerror=()=>reject(r.error||Error('request'));});
const finished=t=>new Promise((resolve,reject)=>{t.oncomplete=resolve;t.onerror=()=>reject(t.error||Error('transaction'));t.onabort=()=>reject(t.error||Error('aborted'));});
const name='juglog_p8_recovery_probe_'+crypto.randomUUID();
const event={eventId:'evt-001',operationId:'op-001',sessionId:'sandbox',type:'GAMES_RECORDED',delta:1,recordedAt:'2026-10-25T00:00:00.000Z'};
function open(){return new Promise((resolve,reject)=>{const r=indexedDB.open(name,1);r.onupgradeneeded=()=>{const d=r.result;d.createObjectStore('journal',{keyPath:'key'});const events=d.createObjectStore('events',{keyPath:'eventId'});events.createIndex('operationId','operationId');};r.onsuccess=()=>resolve(r.result);r.onerror=()=>reject(r.error);});}
async function putJournal(db,payload){const t=db.transaction('journal','readwrite');t.objectStore('journal').put({key:'pending',value:payload});await finished(t);}
async function journal(db){const t=db.transaction('journal','readonly'),r=await request(t.objectStore('journal').get('pending'));await finished(t);return r?.value||null;}
async function inspect(db,operationId){const t=db.transaction('events','readonly');const rows=await request(t.objectStore('events').index('operationId').getAll(operationId));await finished(t);return rows;}
function matches(a,b){return JSON.stringify(a)===JSON.stringify(b);}
async function append(db,e,abort){const t=db.transaction('events','readwrite'),s=t.objectStore('events');const done=finished(t);const rows=await request(s.index('operationId').getAll(e.operationId));if(rows.length){if(rows.length!==1||!matches(rows[0],e)){t.abort();try{await done}catch{}throw Error('operation-conflict');}await done;return 'duplicate';}s.add(e);if(abort){t.abort();try{await done}catch{}return 'aborted';}await done;return 'written';}
async function clearJournal(db){const t=db.transaction('journal','readwrite');t.objectStore('journal').delete('pending');await finished(t);}
async function explicitRecover(db){const j=await journal(db);if(!j||j.operationId!==event.operationId||!matches(j.event,event))return 'blocked-journal';const found=await inspect(db,j.operationId);if(found.length===1&&matches(found[0],j.event)){await clearJournal(db);return 'acknowledged';}if(found.length!==0)return 'blocked-ambiguous';const res=await append(db,j.event,false);if(res!=='written'&&res!=='duplicate')return 'blocked-write';const verified=await inspect(db,j.operationId);if(verified.length!==1||!matches(verified[0],j.event))return 'blocked-verify';await clearJournal(db);return 'recovered';}
async function run(){const rows=[];let db;const check=(n,pass)=>{rows.push({name:n,ok:!!pass});if(!pass)throw Error('FAILED: '+n);};try{
 db=await open();await putJournal(db,{operationId:event.operationId,event});check('ジャーナル永続化',!!await journal(db));db.close();db=await open();
 check('再読み込み相当のDB再オープン後に復旧',await explicitRecover(db)==='recovered');check('イベントは1件', (await inspect(db,event.operationId)).length===1);check('ジャーナル解消',await journal(db)===null);
 check('同じ操作IDの再送は重複しない',await append(db,event,false)==='duplicate'&&(await inspect(db,event.operationId)).length===1);
 await putJournal(db,{operationId:event.operationId,event});check('既に保存済みなら再送せず照合',await explicitRecover(db)==='acknowledged');
 const another={...event,eventId:'evt-002',operationId:'op-002'};check('中断トランザクションは書き込まれない',await append(db,another,true)==='aborted'&&(await inspect(db,another.operationId)).length===0);
 await putJournal(db,{operationId:'wrong',event});check('不一致ジャーナルは停止',await explicitRecover(db)==='blocked-journal');
 return rows;
 }catch(e){rows.push({name:'実行例外',ok:false,details:String(e.message||e)});return rows;}finally{if(db)db.close();try{await new Promise((resolve,reject)=>{const r=indexedDB.deleteDatabase(name);r.onsuccess=resolve;r.onerror=()=>reject(r.error);r.onblocked=()=>reject(Error('delete blocked'));});rows.push({name:'一時DB削除',ok:true});}catch(e){rows.push({name:'一時DB削除',ok:false,details:String(e)});}}}
window.JuglogRecoveryIdbProbe={run};
})();
