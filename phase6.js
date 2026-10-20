(()=>{
'use strict';
const DB='juglog_d07f_phase6_lab_20261019', STORE='snapshots',KEY='active';
const $=id=>document.getElementById(id), say=s=>{$('p6-status').textContent=s};
const api=window.JuglogPhase5Test;
let db=null, enabled=false, restoring=false, writeQueue=Promise.resolve();
function requestPromise(req){return new Promise((resolve,reject)=>{req.onsuccess=()=>resolve(req.result);req.onerror=()=>reject(req.error||new Error('IndexedDB request failed'))})}
async function openDB(){if(db)return db;if(!('indexedDB' in window))throw Error('この環境でIndexedDBを使用できません');const req=indexedDB.open(DB,1);req.onupgradeneeded=()=>{if(!req.result.objectStoreNames.contains(STORE))req.result.createObjectStore(STORE)};db=await requestPromise(req);db.onversionchange=()=>{db.close();db=null;enabled=false;say('別タブでDB更新がありました。再読込してください')};return db}
async function read(){const d=await openDB();return requestPromise(d.transaction(STORE,'readonly').objectStore(STORE).get(KEY))}
async function put(payload){const d=await openDB();return new Promise((res,rej)=>{const t=d.transaction(STORE,'readwrite');t.objectStore(STORE).put(payload,KEY);t.oncomplete=()=>res();t.onerror=()=>rej(t.error||Error('保存失敗'));t.onabort=()=>rej(t.error||Error('保存中断'))})}
async function remove(){const d=await openDB();return new Promise((res,rej)=>{const t=d.transaction(STORE,'readwrite');t.objectStore(STORE).delete(KEY);t.oncomplete=()=>res();t.onerror=()=>rej(t.error||Error('削除失敗'));t.onabort=()=>rej(t.error||Error('削除中断'))})}
async function digest(doc){const raw=new TextEncoder().encode(JSON.stringify(doc));if(!crypto?.subtle)throw Error('検証には安全なコンテキスト（localhost/HTTPS）が必要です');const bits=await crypto.subtle.digest('SHA-256',raw);return [...new Uint8Array(bits)].map(v=>v.toString(16).padStart(2,'0')).join('')}
async function check(saved){if(!saved||saved.format!=='juglog-phase6-isolated'||saved.version!==1||!saved.doc||typeof saved.sha256!=='string')throw Error('保存形式が不正です');if(await digest(saved.doc)!==saved.sha256)throw Error('ハッシュ不一致（保存破損）');return saved.doc}
async function save(){const doc=api.exportDoc();const sha256=await digest(doc);const payload={format:'juglog-phase6-isolated',version:1,savedAt:new Date().toISOString(),sha256,doc};await put(payload);const verify=await read();await check(verify);if(JSON.stringify(verify.doc)!==JSON.stringify(doc))throw Error('保存読戻しで値が一致しません');return verify}
function enqueueSave(){writeQueue=writeQueue.then(()=>save()).then(s=>{say('自動保存済み｜'+s.savedAt+'\n件数 '+s.doc.events.length+'｜SHA-256一致')}).catch(err=>{enabled=false;$('p6-save').disabled=true;say('保存失敗：'+err.message+'。自動保存を停止しました')});return writeQueue}
async function applySaved(){await writeQueue;const saved=await read();if(!saved){say('検証DBに保存データはありません');return false}const doc=await check(saved);restoring=true;try{api.importDoc(doc)}finally{restoring=false}enabled=true;$('p6-save').disabled=false;say('検証DBから復元済み｜'+saved.savedAt+'\n'+doc.events.length+'件｜SHA-256一致');return true}
$('p6-enable').onclick=async()=>{try{if(await read()){say('保存済みデータがあります。先に「保存データを復元」してください');return} enabled=true;$('p6-save').disabled=false;await enqueueSave()}catch(err){say('保存開始に失敗：'+err.message)}};
$('p6-save').onclick=()=>{if(enabled)enqueueSave()};
$('p6-reload').onclick=async()=>{try{await applySaved()}catch(err){say('復元拒否：'+err.message)}};
$('p6-export').onclick=async()=>{try{await writeQueue;const saved=await read();const doc=await check(saved);const str=JSON.stringify(doc,null,2);const p5=$('p5-json');if(p5){p5.value=str;}const blob=new Blob([str],{type:'application/json'});const u=URL.createObjectURL(blob),a=document.createElement('a');a.href=u;a.download='juglog-phase6-isolated-backup.json';a.click();setTimeout(()=>URL.revokeObjectURL(u),1000);say('検証用JSONを書き出しました（P31正式バックアップ形式ではありません）')}catch(err){say('書出し失敗：'+err.message)}};
$('p6-delete').onclick=async()=>{if(!confirm('Phase 6検証DBの保存分だけ削除します。画面のイベントは残ります。続行しますか？'))return;try{enabled=false;await writeQueue;await remove();$('p6-save').disabled=true;say('Phase 6の検証保存データを削除しました。P31のDBには触れていません')}catch(err){say('削除失敗：'+err.message)}};
window.addEventListener('juglog:phase6-mutated',()=>{if(enabled&&!restoring)enqueueSave()});
(async()=>{try{const saved=await read();if(saved){await applySaved()}else{say('検証DBに保存なし。初回は「検証DBへ保存を開始」を押してください')}}catch(err){enabled=false;say('保存DBの確認に失敗：'+err.message)}})();
Object.defineProperty(window,'JuglogPhase6Test',{value:Object.freeze({database:DB,store:STORE,read,save,applySaved,check, digest})});
})();