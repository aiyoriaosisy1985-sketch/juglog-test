/* v40: isolated storage semantics test. NEVER accesses production jissenhyo_p1_v1. */
(function(){'use strict';
function request(r){return new Promise((yes,no)=>{r.onsuccess=()=>yes(r.result);r.onerror=()=>no(r.error)})}
function done(t){return new Promise((yes,no)=>{t.oncomplete=()=>yes();t.onerror=()=>no(t.error||new Error('transaction error'));t.onabort=()=>no(t.error||new Error('transaction aborted'))})}
function open(name){return new Promise((yes,no)=>{const r=indexedDB.open(name,1);r.onupgradeneeded=()=>{const d=r.result;d.createObjectStore('meta',{keyPath:'key'});const es=d.createObjectStore('events',{keyPath:'eventId'});es.createIndex('operationId','operationId',{unique:false})};r.onsuccess=()=>yes(r.result);r.onerror=()=>no(r.error)})}
function remove(name){return new Promise((yes,no)=>{const r=indexedDB.deleteDatabase(name);let blocked=false;const timeout=setTimeout(()=>no(new Error('テストDB削除が一定時間ブロックされています')),5000);r.onsuccess=()=>{clearTimeout(timeout);yes(blocked?'削除成功（待機後）':'削除成功')};r.onerror=()=>{clearTimeout(timeout);no(r.error||new Error('テストDB削除失敗'))};r.onblocked=()=>{blocked=true}})}
async function append(db,client,epoch,operation,eventId,abort){const t=db.transaction(['meta','events'],'readwrite'),m=t.objectStore('meta'),s=t.objectStore('events'),end=done(t);try{const lease=(await request(m.get('lease')))?.value;if(!lease||lease.owner!==client||lease.epoch!==epoch||lease.expiry<=Date.now())throw new Error('権限不一致');const existing=await request(s.index('operationId').getAll(operation));if(existing.length){if(existing.length!==1||existing[0].eventId!==eventId)throw new Error('操作ID衝突');await end;return 'duplicate'}s.add({eventId,operationId:operation});if(abort){t.abort();try{await end}catch(_){}return 'aborted'}await end;return 'inserted'}catch(e){if(t.readyState==='active')t.abort();try{await end}catch(_){}throw e}}
async function count(db){const t=db.transaction('events','readonly'),end=done(t),v=await request(t.objectStore('events').count());await end;return v}
async function run(){const name='juglog_v40_safety_isolated_'+crypto.randomUUID(),results=[];let db;try{db=await open(name);{const t=db.transaction('meta','readwrite');t.objectStore('meta').put({key:'lease',value:{owner:'A',epoch:1,expiry:Date.now()+60000}});await done(t)}
results.push({name:'正常保存',ok:await append(db,'A',1,'op1','ev1',false)==='inserted'&&await count(db)===1});
results.push({name:'同一操作IDの再送は二重保存しない',ok:await append(db,'A',1,'op1','ev1',false)==='duplicate'&&await count(db)===1});
results.push({name:'トランザクション中断で巻き戻る',ok:await append(db,'A',1,'op2','ev2',true)==='aborted'&&await count(db)===1});
let rejected=false;try{await append(db,'B',1,'op3','ev3',false)}catch(e){rejected=e.message==='権限不一致'}results.push({name:'権限を持たない画面の保存を拒否',ok:rejected&&await count(db)===1});
{const t=db.transaction('meta','readwrite');t.objectStore('meta').put({key:'lease',value:{owner:'B',epoch:2,expiry:Date.now()+60000}});await done(t)}
rejected=false;try{await append(db,'A',1,'op4','ev4',false)}catch(e){rejected=e.message==='権限不一致'}results.push({name:'権限世代が切り替わった旧画面を拒否',ok:rejected&&await count(db)===1});
results.push({name:'新権限で保存可能',ok:await append(db,'B',2,'op5','ev5',false)==='inserted'&&await count(db)===2});
return results;}finally{if(db)db.close();try{const detail=await remove(name);results.push({name:'一時DB削除',ok:true,details:detail})}catch(e){results.push({name:'一時DB削除',ok:false,details:e.message})}}}
window.JuglogSafetyTest={run};
})();
