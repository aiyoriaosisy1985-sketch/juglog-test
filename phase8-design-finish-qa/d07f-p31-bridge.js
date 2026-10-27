(()=>{'use strict';
const frame=document.getElementById('p31-frame'),modal=document.getElementById('p31-overlay');
const status=document.getElementById('p31-connection');const close=document.getElementById('p31-close');
let lastFocus=null;
let surfaceGeneration=0;
async function validateOpenSurface(generation){
 const api=frame.contentWindow?.__p8SurfaceApi;
 if(!api){if(generation===surfaceGeneration)status.textContent='P31を読み込んでいます。保存操作は行わないでください。';return;}
 try{
  const result=await api.enter();
  if(generation!==surfaceGeneration||modal.hidden)return;
  if(!result.ready)status.textContent='P31の入力権限または未照合記録を確認してください。自動的に再送・解除しません。';
 }catch(_e){if(generation===surfaceGeneration)status.textContent='P31の再確認に失敗しました。再入力せず状態を確認してください。';}
}
function open(){lastFocus=document.activeElement;modal.hidden=false;document.body.style.overflow='hidden';close.focus();void validateOpenSurface(++surfaceGeneration);}
function hide(){++surfaceGeneration;try{frame.contentWindow?.__p8SurfaceApi?.leave();}catch(_e){}modal.hidden=true;document.body.style.overflow='';if(lastFocus&&lastFocus.focus)lastFocus.focus(); }

// Preserve P31's native confirmation/cancellation/event logic. Only style its dialog.
const dialogSkinUrl='p31-d07f-dialog.css';
function syncP31DialogTheme(){
  try {
    const doc=frame.contentDocument;
    if(!doc)return;
    doc.documentElement.dataset.d07fTheme=document.documentElement.dataset.theme==='light'?'light':'dark';
    if(!doc.getElementById('p8-dialog-theme-style')){
      const link=doc.createElement('link');link.id='p8-dialog-theme-style';link.rel='stylesheet';link.href=dialogSkinUrl;
      doc.head.append(link);
    }
  }catch(_e){status.textContent='P31確認画面のテーマ適用に失敗しました。';}
}
function p31DialogOpen(){
  try{return !!frame.contentDocument?.getElementById('modal')?.open;}catch(_e){return true;}
}
function safeHide(){
  // A P31 dialog must stay visible until the user confirms or cancels natively.
  if(p31DialogOpen()){
    status.textContent='P31の確認画面で「確定」または「キャンセル」を選択してください。';
    frame.contentDocument?.getElementById('modal')?.focus();
    return;
  }
  hide();
}
close.addEventListener('click',safeHide);
frame.addEventListener('load',()=>{syncP31DialogTheme();if(!modal.hidden)void validateOpenSurface(++surfaceGeneration);});
new MutationObserver(syncP31DialogTheme).observe(document.documentElement,{attributes:true,attributeFilter:['data-theme']});

document.addEventListener('keydown',e=>{if(e.key==='Escape'&&!modal.hidden){if(p31DialogOpen())return;safeHide();}});
// Complex operations must be performed in the visible P31 UI, not by injecting
// a click into an invisible iframe (which could hide the confirmation dialog).
const directRoles={grapeBtn:'grape',cherryBtn:'cherry'};
let directPending=false, directUncertain=false;
// If a confirmation crosses an iOS app/background transition, cancel its
// pending write and require a fresh confirmation in the foreground.
let foregroundEpoch=0;
document.addEventListener('visibilitychange',()=>{if(document.hidden)foregroundEpoch++;});
window.addEventListener('pagehide',()=>{foregroundEpoch++;});
window.addEventListener('pageshow',e=>{if(e.persisted)foregroundEpoch++;});
function foregroundUnchanged(epoch){return !document.hidden && foregroundEpoch===epoch;}

function hasJournal(){try{return !!frame.contentWindow?.__p8ReconcileApi?.journal().blocked;}catch(_e){return true;}}
const directMessage=document.createElement('p');
directMessage.id='p8-direct-status';directMessage.setAttribute('role','status');directMessage.setAttribute('aria-live','polite');
directMessage.textContent='ぶどう・チェリーはP31保存処理に直接接続。';
document.querySelector('[data-p31="grapeBtn"]')?.closest('.button-grid')?.after(directMessage);
function setDirectStatus(message){directMessage.textContent=message;}
function updateDirectButtons(){
 let ready=false;
 try{ready=!!frame.contentWindow?.__p8CountApi?.state().ready;}catch(_e){}
 const gameButton=document.getElementById('p8-games-submit');if(gameButton)gameButton.disabled=!ready||p8WriteBlocked();
 for(const id of Object.keys(directRoles)){
   const btn=document.querySelector(`[data-p31="${id}"]`);
   if(btn) btn.disabled=!ready||p8WriteBlocked();
 }
}
async function directCount(role){
 if(p8WriteBlocked()){setDirectStatus("未照合の操作記録があります。保存記録を照合してください。");return;}
 let api;
 try{api=frame.contentWindow?.__p8CountApi; if(!api?.state().ready){setDirectStatus('P31で実戦選択・入力権限を確認してください。');open();return;}}
 catch(_e){setDirectStatus('P31に接続できません。元画面で確認してください。');open();return;}
 directPending=true;updateDirectButtons();setDirectStatus('P31で保存処理中…');
 try{
   const result=await api.count(role);
   if(result.status==='saved-and-refreshed'){
     setDirectStatus(`${role==='grape'?'ぶどう':'チェリー'}を保存しました。`);sync();
   } else if(result.status==='rejected'){
     setDirectStatus('入力は受け付けられませんでした。P31元画面の状態を確認してください。');
   } else {
     directUncertain=true;setDirectStatus('保存結果が確定できません。再タップせずP31元画面で確認してください。');open();
   }
 }catch(_e){directUncertain=true;setDirectStatus('保存結果不明。再入力せずP31元画面で確認してください。');open();}
 finally{directPending=false;updateDirectButtons();}
}
// First D07F-native write flow. P31 still owns acceptance, persistence and replay.
const bonusDialog=document.createElement('dialog');
bonusDialog.id='p8-bonus-dialog';
bonusDialog.setAttribute('aria-label','ボーナス当選の記録');
bonusDialog.innerHTML=`<form method="dialog" class="p8-bonus-form"><h2 id="p8-bonus-heading">ボーナス当選</h2><label for="p8-bonus-trigger">当選契機</label><select id="p8-bonus-trigger"><option value="不明">不明・判別できず</option><option value="単独">単独（確認済み）</option><option value="チェリー重複">チェリー重複（確認済み）</option></select><p>前回のボーナスが未消化の場合は保留として記録します。チェリー回数は自動加算されません。</p><div class="p8-bonus-actions"><button value="cancel" type="submit">キャンセル</button><button id="p8-bonus-save" type="button">当選を記録</button></div><p id="p8-bonus-feedback" role="status" aria-live="polite"></p></form>`;
document.body.append(bonusDialog);
let bonusType=null;
function showBonusForm(type){
 if(p8WriteBlocked()){setDirectStatus('未照合の操作記録があります。保存状態を確認してください。');return;}
 try{if(!frame.contentWindow?.__p8CountApi?.state().ready){setDirectStatus('P31の入力権限と実戦状態を確認してください。');open();return;}}
 catch(_e){setDirectStatus('P31の接続状態を確認してください。');return;}
 bonusType=type;
 bonusDialog.querySelector('#p8-bonus-heading').textContent=type+' 当選';
 bonusDialog.querySelector('#p8-bonus-trigger').value='不明';
 bonusDialog.querySelector('#p8-bonus-feedback').textContent='';
 bonusDialog.showModal();
}
bonusDialog.querySelector('#p8-bonus-save').addEventListener('click',async()=>{
 if(!bonusType||p8WriteBlocked())return;
 const btn=bonusDialog.querySelector('#p8-bonus-save');
 const feedback=bonusDialog.querySelector('#p8-bonus-feedback');
 const type=bonusType, trigger=bonusDialog.querySelector('#p8-bonus-trigger').value;
 directPending=true;btn.disabled=true;updateDirectButtons();feedback.textContent='保存処理中…';
 try{
  const api=frame.contentWindow?.__p8CountApi;
  if(!api?.state().ready){feedback.textContent='入力権限がないため記録できません。';return;}
  const result=await api.awardBonus(type,trigger);
  if(result.status==='saved-and-refreshed'){
   bonusDialog.close();bonusType=null;setDirectStatus(type+'を保存しました。');sync();
  }else if(result.status==='rejected'){feedback.textContent='操作を受け付けられませんでした。実戦状態を確認してください。';}
  else {directUncertain=true;feedback.textContent='保存結果を確認できません。再操作しないで保存照合を行ってください。';setDirectStatus(feedback.textContent);}
 }catch(_e){directUncertain=true;feedback.textContent='保存結果不明です。再操作しないでください。';setDirectStatus(feedback.textContent);}
 finally{directPending=false;btn.disabled=false;updateDirectButtons();}
});
bonusDialog.addEventListener('cancel',e=>{if(directPending)e.preventDefault();});
bonusDialog.querySelector('form').addEventListener('submit',e=>{if(directPending)e.preventDefault();});
bonusDialog.addEventListener('close',()=>{if(directUncertain){setDirectStatus('保存結果不明。再度BB・RBを押さず保存記録を照合してください。');}});
// Bonus completion and pending review use the authoritative P31 event writer.
// The user confirms in D07F; no hidden P31 button is clicked.
async function directBonusAction(action){
 if(p8WriteBlocked()){setDirectStatus('未照合の操作記録があります。保存状態を照合してください。');return;}
 let api,info;
 try{api=frame.contentWindow?.__p8CountApi;info=api?.bonusActions();}
 catch(_e){setDirectStatus('P31への接続を確認できません。');return;}
 const target=action==='complete'?info?.completion:info?.review;
 if(!info?.ready||!target){setDirectStatus('現在、このボーナス操作はできません。P31の状態を確認してください。');return;}
 const message=action==='complete'?`${target.type}を消化完了し、現在Gを0にしますか？`:`${target.type}の保留を確認済みとして計上しますか？\nこの操作だけでは現在Gはリセットしません。`;
 const confirmationEpoch=foregroundEpoch;
 if(!window.confirm(message))return;
 if(!foregroundUnchanged(confirmationEpoch)){
  setDirectStatus('確認中にアプリが切り替わりました。保存は開始していません。画面を確認してからもう一度操作してください。');
  sync();return;
 }
 directPending=true;updateDirectButtons();setDirectStatus('保存処理中…');
 try{
  const result=await api.bonusAction(action);
  if(result.status==='saved-and-refreshed'){setDirectStatus(`${target.type}の${action==='complete'?'消化完了':'保留確認'}を保存しました。`);sync();}
  else if(result.status==='rejected'){setDirectStatus('状態が変更されたため操作を受け付けませんでした。');sync();}
  else{directUncertain=true;setDirectStatus('保存結果が不明です。再操作せず保存記録を照合してください。');}
 }catch(_e){directUncertain=true;setDirectStatus('保存結果が不明です。再操作しないでください。');}
 finally{directPending=false;updateDirectButtons();}
}
// D07F Undo calls P31's event cancellation API, not its old UI button.
async function directUndo(){
 if(p8WriteBlocked()){setDirectStatus('未照合の操作があります。保存記録を確認してください。');return;}
 let api,proposal;
 try{api=frame.contentWindow?.__p8CountApi;proposal=api?.undoCandidate();}
 catch(_e){setDirectStatus('P31に接続できません。');return;}
 if(!proposal?.ready){setDirectStatus(proposal?.reason||'Undo対象の操作がありません。');return;}
 const confirmationEpoch=foregroundEpoch;
 if(!window.confirm(`${proposal.description} を取り消しますか？\n記録は履歴に残ります。`))return;
 if(!foregroundUnchanged(confirmationEpoch)){
  setDirectStatus('確認中にアプリが切り替わったためUndoは開始していません。再確認してください。');sync();return;
 }
 directPending=true;updateDirectButtons();setDirectStatus('Undo保存処理中…');
 try{
  const result=await api.undoLatest();
  if(result.status==='saved-and-refreshed'){setDirectStatus('直前操作の取消を保存しました。');sync();}
  else if(result.status==='rejected'){setDirectStatus(result.reason||'操作状態が変わりました。Undoは実行していません。');sync();}
  else{directUncertain=true;setDirectStatus('Undoの保存結果が不明です。再実行せず保存記録を照合してください。');}
 }catch(_e){directUncertain=true;setDirectStatus('Undoの保存結果が不明です。再操作しないでください。');}
 finally{directPending=false;updateDirectButtons();}
}
// Modal/confirmation operations are invoked only after the P31 pane is visibly opened.
// The P31 native handlers own cancellation, dependency checks, and event persistence.
function visibleNativeAction(id){
  open();
  try{
    const w=frame.contentWindow,api=w?.__p8CountApi,button=frame.contentDocument?.getElementById(id);
    if(!api?.state().ready||!button||button.disabled||button.hidden){
      setDirectStatus('P31元画面で入力権限と操作可能状態を確認してください。');return;
    }
    button.click();
  }catch(_e){setDirectStatus('P31へ接続できません。元画面で確認してください。');}
}
// Session management routes into visible native P31 controls. Native dialogs,
// write permissions, and event persistence remain entirely owned by P31.
const sessionStatus=document.getElementById('p8-session-status');
function nativeTab(doc,name){
 const tab=doc.querySelector(`button[data-tab="${name}"]`);
 if(tab&&!tab.classList.contains('active'))tab.click();
}
function nativeTarget(target,tab,activate){
 open();
 try{
  const doc=frame.contentDocument;
  if(!doc)throw Error('P31 not loaded');
  nativeTab(doc,tab);
  const btn=doc.getElementById(target);
  if(!btn)throw Error('Missing P31 control');
  btn.scrollIntoView({block:'center'});
  if(activate){
   if(btn.disabled||btn.hidden||btn.closest('.hidden,[hidden]')){
    sessionStatus.textContent='現在の実戦状態ではこの操作はできません。P31画面で状態を確認してください。';
    return;
   }
   btn.click();
   sessionStatus.textContent='P31画面の確認内容を確認し、確定またはキャンセルしてください。';
  }else sessionStatus.textContent='P31の履歴・訂正画面を開きました。';
 }catch(_e){sessionStatus.textContent='P31の操作画面を開けません。読み込み状態を確認してください。';}
}
// Data management and session selection always use the native P31 handlers.
// Import/restore buttons are deliberately *not* auto-clicked: the user must
// select the intended JSON and check P31's safeguards inside the visible pane.
const dataToolStatus=document.getElementById('p8-tool-status');
function showDataTool(button){
 open();
 try{
  const doc=frame.contentDocument;
  if(!doc)throw Error('P31未読込');
  const tab=button.dataset.p8ToolTab||'settings';
  nativeTab(doc,tab);
  const target=doc.getElementById(button.dataset.p8Tool);
  if(!target)throw Error('P31対象がありません');
  // Browser-native file picker cannot be safely launched through an iframe
  // with uncertain user activation; focus the visible input instead.
  target.scrollIntoView({block:'center'});
  if(button.dataset.p8ToolActivate==='true'){
   if(target.disabled||target.hidden||target.closest('.hidden,[hidden]')){
    dataToolStatus.textContent='この操作は現在利用できません。P31の画面で確認してください。';return;
   }
   target.click();
  }
  dataToolStatus.textContent=button.dataset.p8Tool==='restoreBtn'
   ? 'P31側で復元前に内容と件数を検証してください。既存DBへの上書きは禁止です。'
   : 'P31の該当項目を表示しました。';
 }catch(_e){dataToolStatus.textContent='対象の操作を開けません。P31の読込状態を確認してください。';}
}
// D07F direct JSON operations. P31 still owns the authoritative validation,
// empty-DB check and the confirmation before a restore.
const directBackupFile=document.getElementById('p8-direct-backup-file');
const directRestoreBtn=document.getElementById('p8-direct-restore');
let backupBusy=false;
// All D07F writes and session changes must yield during backup/import operations.
function p8WriteBlocked(){return backupBusy||directPending||directUncertain||hasJournal();}
async function withBackupApi(fn,{restore=false}={}){
 if(backupBusy)return;
 // The restore confirmation is itself part of a write operation: prevent any
 // other D07F event writer from starting until P31 has finished or rejected it.
 if(p8WriteBlocked()){
  dataToolStatus.textContent='保存操作が進行中または未照合のため復元を開始できません。';return;
 }
 backupBusy=true;updateDirectButtons();populateSessionSelect();syncBonusState();syncCompletion();
 if(restore){directPending=true;updateDirectButtons();populateSessionSelect();}
 directRestoreBtn.disabled=true;
 try{
  const api=frame.contentWindow?.__p8BackupApi;
  if(!api)throw Error('P31の保存機能がまだ読み込まれていません');
  await fn(api);
  if(restore){
   // The P31 API returns an explicit safety flag; presentation wording must
   // never decide whether another write is allowed.
   if(dataToolStatus.dataset.p8RestoreNeedsVerification==='true'){
    directUncertain=true;
    setDirectStatus('復元結果を確認するまで入力を停止します。保存記録を照合してください。');
   }
   delete dataToolStatus.dataset.p8RestoreNeedsVerification;
  }
 }catch(err){
  dataToolStatus.textContent='処理できません：'+(err?.message||String(err));
  if(restore){directUncertain=true;setDirectStatus('復元結果を確認できません。再操作せず保存状態を照合してください。');}
 }finally{
  backupBusy=false;updateDirectButtons();populateSessionSelect();syncBonusState();syncCompletion();
  if(restore)delete dataToolStatus.dataset.p8RestoreNeedsVerification;
  if(restore){directPending=false;updateDirectButtons();populateSessionSelect();sync();}
  try{directRestoreBtn.disabled=!frame.contentWindow?.__p8BackupApi?.status()?.validated;}catch(_e){directRestoreBtn.disabled=true;}
 }
}
directBackupFile.addEventListener('change',()=>withBackupApi(async api=>{
 const file=directBackupFile.files?.[0];if(!file)return;
 const result=await api.validate(file);
 dataToolStatus.textContent=result.ok?`構造検証OK：${result.sessionCount}実戦／${result.eventCount}イベント。復元は空のDB限定です。`: `検証失敗：${result.reason}`;
}));
directRestoreBtn.addEventListener('click',()=>withBackupApi(async api=>{
 const result=await api.restore();
 // Reject an unknown API contract safely instead of accepting a string.
 if(!result||typeof result.message!=='string'||typeof result.requiresVerification!=='boolean'){
  dataToolStatus.dataset.p8RestoreNeedsVerification='true';
  throw Error('復元結果の形式を確認できません');
 }
 dataToolStatus.dataset.p8RestoreNeedsVerification=String(result.requiresVerification);
 dataToolStatus.textContent=result.message;
},{restore:true}));
document.querySelectorAll('[data-p8-tool]').forEach(button=>button.addEventListener('click',()=>{
 if(button.dataset.p8Tool==='exportBtn'){
  withBackupApi(async api=>{dataToolStatus.textContent=await api.export();});
 }else if(button.dataset.p8Tool==='importFile'){
  directBackupFile.click();
 }else if(button.dataset.p8Tool==='restoreBtn'){
  if(directRestoreBtn.disabled){dataToolStatus.textContent='先にJSONファイルを選択・検証してください。';return;}
  directRestoreBtn.click();
 }else showDataTool(button);
}));
// D07F session management uses P31's committed event writer; never synthetic clicks.
const sessionSelect=document.getElementById('p8-session-select');
function populateSessionSelect(){
 try{
  const state=frame.contentWindow?.__p8SessionApi?.state();if(!state)return;
  const keep=sessionSelect.value;
  sessionSelect.replaceChildren();
  for(const item of state.sessions){
   const option=document.createElement('option');option.value=item.id;
   option.textContent=`${item.date}｜${item.store}｜${item.number}番台 (${item.status})`;
   sessionSelect.append(option);
  }
  if(state.sessions.some(x=>x.id===keep))sessionSelect.value=keep;
  else if(state.selectedId)sessionSelect.value=state.selectedId;
  for(const button of document.querySelectorAll('[data-p8-session-action]')){
   const action=button.dataset.p8SessionAction;
   button.disabled=!state.ready||(action==='resume'?state.selectedStatus==='ACTIVE':state.selectedStatus!=='ACTIVE')||p8WriteBlocked();
  }
 }catch(_e){}
}
const sessionStatusEl=document.getElementById('p8-session-status');
async function directSessionTransition(action){
 if(p8WriteBlocked()){sessionStatusEl.textContent='保存状態を確認するまで操作できません。';return;}
 const api=frame.contentWindow?.__p8SessionApi;const current=api?.state();
 if(!current?.ready){sessionStatusEl.textContent='入力権限または実戦状態を確認してください。';return;}
 const message=action==='pause'?'この実戦を中断しますか？':action==='resume'?'この実戦を新しい区間で再開しますか？':'この実戦を終了しますか？ 未消化があれば未確定終了として記録されます。';
 if(!window.confirm(message))return;
 directPending=true;populateSessionSelect();sessionStatusEl.textContent='保存処理中…';
 try{const result=await api.transition(action);
  if(result.status==='saved-and-refreshed'){sessionStatusEl.textContent='実戦状態を保存しました。';sync();}
  else if(result.status==='rejected')sessionStatusEl.textContent='状態が変更されたため操作できません。';
  else{directUncertain=true;sessionStatusEl.textContent='保存結果が不明です。再操作しないでください。';}
 }catch(_e){directUncertain=true;sessionStatusEl.textContent='保存結果が不明です。再操作しないでください。';}
 finally{directPending=false;populateSessionSelect();updateDirectButtons();}
}
// D07F native session creation. Validation and commit remain P31-owned.
const createDialog=document.createElement('dialog');createDialog.id='p8-create-dialog';
createDialog.innerHTML=`<form method="dialog" class="p8-bonus-form"><h2>新規実戦</h2><label>日付<input id="p8-create-date" type="date" required></label><label>店舗<input id="p8-create-store" maxlength="120" required></label><label>機種<input id="p8-create-machine" value="マイジャグラーV" maxlength="120" required></label><label>台番号<input id="p8-create-number" inputmode="numeric" maxlength="30" required></label><div class="p8-bonus-actions"><button value="cancel" type="submit">キャンセル</button><button type="button" id="p8-create-save">作成する</button></div><p id="p8-create-feedback" role="status" aria-live="polite"></p></form>`;
document.body.append(createDialog);
document.getElementById('p8-create-session')?.addEventListener('click',()=>{
 if(p8WriteBlocked()){sessionStatusEl.textContent='未照合の保存操作があります。';return;}
 const api=frame.contentWindow?.__p8SessionApi;
 if(!api?.state().ready){sessionStatusEl.textContent='入力権限と保存状態を確認してください。';return;}
 const local=new Date();const yyyy=local.getFullYear(),mm=String(local.getMonth()+1).padStart(2,'0'),dd=String(local.getDate()).padStart(2,'0');
 document.getElementById('p8-create-date').value=`${yyyy}-${mm}-${dd}`;
 document.getElementById('p8-create-feedback').textContent='';createDialog.showModal();
});
createDialog.querySelector('#p8-create-save').addEventListener('click',async()=>{
 if(p8WriteBlocked())return;
 const get=id=>document.getElementById(id).value.trim();
 const input={date:get('p8-create-date'),store:get('p8-create-store'),machine:get('p8-create-machine'),number:get('p8-create-number')};
 const feedback=document.getElementById('p8-create-feedback');
 if(Object.values(input).some(x=>!x)){feedback.textContent='すべての項目を入力してください。';return;}
 const button=createDialog.querySelector('#p8-create-save');directPending=true;button.disabled=true;feedback.textContent='保存しています…';updateDirectButtons();
 try{
  const result=await frame.contentWindow?.__p8SessionApi?.create(input);
  if(result?.status==='saved-and-refreshed'){createDialog.close();sessionStatusEl.textContent='新規実戦を保存しました。';sync();}
  else if(result?.status==='rejected'){feedback.textContent=result.reason||'入力または権限を確認してください。';}
  else{directUncertain=true;feedback.textContent='保存結果が不明です。再作成せず保存記録を照合してください。';sessionStatusEl.textContent=feedback.textContent;}
 }catch(_e){directUncertain=true;feedback.textContent='保存結果が不明です。再作成しないでください。';sessionStatusEl.textContent=feedback.textContent;}
 finally{directPending=false;button.disabled=false;populateSessionSelect();updateDirectButtons();}
});
createDialog.addEventListener('cancel',e=>{if(directPending)e.preventDefault();});
createDialog.querySelector('form').addEventListener('submit',e=>{if(directPending)e.preventDefault();});
document.querySelectorAll('[data-p8-session-action]').forEach(btn=>btn.addEventListener('click',()=>void directSessionTransition(btn.dataset.p8SessionAction)));
document.getElementById('p8-session-switch-btn')?.addEventListener('click',()=>{
 if(p8WriteBlocked()){sessionStatusEl.textContent='未照合の保存状態があります。';return;}
 const result=frame.contentWindow?.__p8SessionApi?.select(sessionSelect.value);
 if(result?.status==='selected'){sessionStatusEl.textContent='実戦を切り替えました。';sync();}
 else sessionStatusEl.textContent='実戦を切り替えられません。保存状態を確認してください。';
});
frame.addEventListener('load',populateSessionSelect);
setInterval(populateSessionSelect,3000);
document.querySelectorAll('[data-p8-native-action]').forEach(btn=>btn.addEventListener('click',()=>nativeTarget(btn.dataset.p8NativeAction,'play',true)));
document.querySelectorAll('[data-p8-native-nav]').forEach(btn=>btn.addEventListener('click',()=>nativeTarget(btn.dataset.p8NativeNav,btn.dataset.p8NativeTab||'play',false)));
document.querySelectorAll('[data-p31]').forEach(button=>button.addEventListener('click',()=>{
 const role=directRoles[button.dataset.p31];if(role){void directCount(role);}else if(['bbBtn','rbBtn'].includes(button.dataset.p31)){showBonusForm(button.dataset.p31==='bbBtn'?'BB':'RB');}else if(button.dataset.p31==='quickComplete'){void directBonusAction('complete');}else if(button.dataset.p31==='undoBtn'){void directUndo();}else{open();}
}));
async function directGames(){
 if(p8WriteBlocked()){setDirectStatus("未照合の操作記録があります。保存記録を照合してください。");return;}
 const field=document.getElementById('p8-games'),raw=field.value.trim(),n=Number(raw);
 if(!/^[1-9]\d*$/.test(raw)||!Number.isSafeInteger(n)){
   setDirectStatus('ゲーム数は1以上の整数で入力してください。');return;
 }
 let api;try{api=frame.contentWindow?.__p8CountApi;if(!api?.state().ready){open();return;}}
 catch(_e){open();return;}
 directPending=true;updateDirectButtons();setDirectStatus('ゲーム数を保存しています…');
 try{
   const result=await api.games(n,document.getElementById('p8-measured').checked);
   if(result.status==='saved-and-refreshed'){
     field.value='';document.getElementById('p8-measured').checked=false;
     setDirectStatus('ゲーム数の保存が完了しました。');sync();
   }else if(result.status==='rejected')setDirectStatus('入力不可。P31側の実戦状態を確認してください。');
   else{directUncertain=true;setDirectStatus('ゲーム数の保存結果が不明です。再入力しないでください。');open();}
 }catch(_e){directUncertain=true;setDirectStatus('保存結果が不明です。再入力しないでください。');open();}
 finally{directPending=false;updateDirectButtons();}
}
document.getElementById('p8-games-submit').addEventListener('click',()=>void directGames());

// A frame reload is NOT proof of commit. Keep the uncertainty lock.
frame.addEventListener('load',()=>{
 updateDirectButtons();
 if(directUncertain||hasJournal())setDirectStatus('未照合の操作記録があります。保存済みか照合するまで入力できません。');
});
const inspectBtn=document.createElement('button');
inspectBtn.id='p8-inspect-last';inspectBtn.type='button';inspectBtn.textContent='直前操作の保存記録を読み取り専用で照合';
directMessage.after(inspectBtn);
const acknowledge=document.createElement('button');acknowledge.id='p8-ack-saved';acknowledge.type='button';
acknowledge.textContent='照合済みの保存操作を確定してロック解除';inspectBtn.after(acknowledge);
acknowledge.addEventListener('click',async()=>{
 if(directPending){setDirectStatus('保存処理中は解除できません。');return;}
 try{const api=frame.contentWindow?.__p8ReconcileApi;if(!api){setDirectStatus('照合APIに接続できません。');return;}
 const r=await api.acknowledgeSaved();if(r.ok){directUncertain=false;setDirectStatus('保存済みを確認しました。次の操作を許可します。');}
 else setDirectStatus('保存確定の照合条件を満たしていません。入力停止を維持します。');
 }catch(_e){setDirectStatus('照合に失敗しました。入力停止を維持します。');}
 finally{updateDirectButtons();}
});
inspectBtn.addEventListener('click',async()=>{
 if(directPending){setDirectStatus('操作処理中です。');return;}
 inspectBtn.disabled=true;
 try{
  const api=frame.contentWindow?.__p8ReconcileApi;
  if(!api){setDirectStatus('P31の照合APIがありません。入力停止を維持します。');return;}
  const r=await api.inspectLast();
  if(r?.state==='保存済み'){
   const projectionLabel=({
    'effective-in-memory-view':'メモリ上の有効履歴にも存在',
    'cancelled-or-restored-view':'メモリ上には存在するが有効履歴には非表示',
    'partial-in-memory-view':'メモリ上の履歴には一部のみ存在',
    'not-in-memory-view':'現在のメモリ上の履歴には存在しない'
   })[r.projection]||'画面側の状態は未確認';
   setDirectStatus('DB内の操作ID・内容は一致。画面側：'+projectionLabel+'（'+String(r.viewCount??'?')+'/'+String(r.expectedCount??'?')+'件）。受付段階：'+String(api.journal()?.stage||'不明')+'。自動復旧・再登録は行いません。');
  }else if(r?.state==='未保存'){
   setDirectStatus('DBに同一操作IDがありません。未保存キューを確認してください。自動再登録は行いません。');
  }else if(r?.state==='内容衝突'){
   setDirectStatus('保存内容が一致しません。操作を停止しバックアップを確保してください。');
  }else if(r?.reason==='no-accepted-attempt')setDirectStatus('照合対象の直前操作がありません。保存異常とは限りません。入力可否はP31側の権限表示で確認してください。');
  else if(r?.reason==='corrupt-journal')setDirectStatus('操作記録の形式が不正です。入力停止を維持し、再入力しないでください。');
  else setDirectStatus('保存状態を判定できません（'+String(r?.reason||'原因不明')+'）。入力停止を維持します。');
 }catch(_e){setDirectStatus('DB読み取りに失敗しました。入力停止を維持します。');}
 finally{inspectBtn.disabled=false;updateDirectButtons();}
});

document.querySelector('.device')?.addEventListener('click',open);
document.querySelector('.menu')?.addEventListener('click',open);
// Completion type is derived from the P31 engine's rendered active bonus state.
// Never infer BB/RB from lifetime BB/RB counts or from a previous session.
const completeButton=document.querySelector('[data-p31="quickComplete"]');
// Pending review remains in P31's native confirmation UI. Never auto-confirm.
const reviewOpen=document.getElementById('p8-review-open');
const pendingCount=document.getElementById('p8-pending-count');
const uncompletedCount=document.getElementById('p8-uncompleted-count');
function syncBonusState(){
 try{
  const info=frame.contentWindow?.__p8CountApi?.bonusActions();
  if(!info)throw Error('not loaded');
  pendingCount.textContent=String(info.pendingCount);
  const doc=frame.contentDocument;
  const n=doc?.getElementById('uncompletedN')?.textContent.trim();
  uncompletedCount.textContent=/^\d+$/.test(n||'')?n:'—';
  reviewOpen.disabled=!info.ready||!info.review||p8WriteBlocked();
 }catch(_e){pendingCount.textContent='—';uncompletedCount.textContent='—';reviewOpen.disabled=true;}
}
reviewOpen?.addEventListener('click',()=>{void directBonusAction('review');});
function syncCompletion(){
 if(!completeButton)return;
 try{
  const info=frame.contentWindow?.__p8CountApi?.bonusActions();
  const b=info?.completion;
  if(!b||!['BB','RB'].includes(b.type))throw Error('no eligible bonus');
  completeButton.textContent=b.type+'消化完了';
  completeButton.setAttribute('aria-label',b.type+'を消化完了し、現在Gを0にする');
  completeButton.disabled=!info.ready||p8WriteBlocked();
  completeButton.title='D07F内で確認して保存';
 }catch(_e){completeButton.textContent='消化完了（対象なし）';completeButton.disabled=true;completeButton.title='未消化ボーナスまたは入力権限を確認してください';}
}
const map={totalG:'live-total',personalG:'live-personal',currentG:'live-current',bbN:'live-bb',rbN:'live-rb',grapeN:'live-grape',cherryN:'live-cherry',hallBBRate:'live-bb-rate',hallRBRate:'live-rb-rate',hallCombinedRate:'live-combined-rate',grapeRate:'live-grape-rate',cherryRate:'live-cherry-rate',hallProbBase:'live-prob-base'};
const missing=id=>id==='live-prob-base'?'観測待ち':'—';
let lastSignature='';
function clear(){for(const target of Object.values(map)){document.getElementById(target).textContent=missing(target);}lastSignature='';}

function sync(){syncBonusState();syncCompletion();try{
const doc=frame.contentDocument;if(!doc||doc.readyState!=='complete'){clear();return;}
const session=doc.getElementById('playing');
if(!session||session.classList.contains('hidden')||session.hidden){clear();status.textContent='P31に実戦が選択されていません。';return;}
const data={};for(const source of Object.keys(map)){const node=doc.getElementById(source);if(!node){clear();status.textContent='P31の集計項目が不足しています。';return;}data[source]=node.textContent.trim();}
// Display data and editability are independent: a lease can expire without
// changing any BB/RB/G counts. Never skip the capability/status update.
const signature=JSON.stringify(data);
if(signature!==lastSignature){
 lastSignature=signature;
 for(const [source,target] of Object.entries(map)){
  document.getElementById(target).textContent=data[source]||missing(target);
 }
}
const capability=frame.contentWindow?.__p8CountApi?.state();
if(directUncertain||hasJournal()){
 status.textContent='保存照合が必要です。記録の重複を避けるため入力停止中。';
}else if(directPending){
 status.textContent='P31で保存処理中。ほかの操作はできません。';
}else if(!capability?.writer){
 status.textContent='P31は閲覧専用です。入力権限を確認してください。';
}else if(capability?.pending>0||capability?.busy){
 status.textContent='P31の未保存操作・保存処理を確認してください。';
}else if(capability?.ready){
 status.textContent='実戦データと同期中。記録操作ができます。';
}else{
 status.textContent='P31の操作条件を満たしていません。実戦状態を確認してください。';
}
}catch(err){clear();status.textContent='P31接続不可。同一オリジンから起動してください。';}}

// Read-only tab projections. No direct IndexedDB access and no inferred payout/setting values.
const esc=v=>String(v??'—').replace(/[&<>"']/g,ch=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]));
let lastViewSignature='';
let historyDetailId=null;
function renderSessionHistory(){
 const container=document.getElementById('p8-history-content');if(!container)return;
 let api;try{api=frame.contentWindow?.__p8ViewsApi;}catch(_e){}
 if(!api?.listSessions||!api?.snapshotFor){container.textContent='P31の実戦一覧を取得できません。';return;}
 let sessions;try{sessions=api.listSessions();}catch(_e){container.textContent='実戦一覧を読み取れません。';return;}
 if(!Array.isArray(sessions)||!sessions.length){container.textContent='記録された実戦はありません。';return;}
 sessions.sort((a,b)=>String(b.date||'').localeCompare(String(a.date||''))||String(a.id).localeCompare(String(b.id)));
 if(historyDetailId&&!sessions.some(s=>s.id===historyDetailId))historyDetailId=null;
 const chosen=sessions.find(s=>s.id===historyDetailId)||sessions.find(s=>s.isActive)||sessions[0];
 const detail=api.snapshotFor(chosen.id);
 const heading=document.createElement('p');heading.textContent=`保存済み実戦 ${sessions.length}件・選択した実戦の訂正反映済みイベント`;
 const list=document.createElement('div');list.className='p8-history-sessions';
 for(const s of sessions){
  const btn=document.createElement('button');btn.type='button';btn.className='p8-history-session';
  btn.setAttribute('aria-pressed',String(s.id===chosen.id));
  btn.textContent=`${s.date||'日付不明'} ｜ ${s.store||'店舗未記録'} ｜ ${s.machine||'機種未記録'} ${s.number??'—'}番 ｜ ${s.personalG??'—'}G ｜ BB${s.bb??'—'} / RB${s.rb??'—'}${s.isActive?'（実戦中選択）':''}`;
  btn.addEventListener('click',()=>{historyDetailId=s.id;renderSessionHistory();});list.append(btn);
 }
 // History selection changes the read-only preview only. Never silently switch
 // the P31 active session or apply a correction to another session.
 const actions=document.createElement('div');actions.className='p8-history-actions';
 const edit=document.createElement('button');edit.type='button';edit.textContent='この実戦の訂正画面へ';
 const advice=document.createElement('p');advice.className='p8-history-advice';
 const selectedActive=chosen.isActive===true;
 advice.textContent=selectedActive
   ? '現在P31で選択中の実戦です。訂正内容はP31の画面で確認してから確定してください。'
   : '閲覧対象とP31で選択中の実戦が異なります。P31で対象の実戦を選択し直すまで、訂正しないでください。';
 edit.addEventListener('click',()=>{
   open();
   try{
     const doc=frame.contentDocument;if(!doc)throw Error('P31未読込');
     if(!selectedActive){
       doc.getElementById('sessionsBtn')?.scrollIntoView({block:'center'});
       status.textContent='履歴の閲覧対象とP31の操作対象が異なります。先に「台一覧」で該当する実戦を選択してください。';
       return;
     }
     nativeTab(doc,'history');
     doc.getElementById('historyRows')?.scrollIntoView({block:'center'});
     status.textContent='P31で対象と訂正内容を確認してください。訂正操作は自動実行しません。';
   }catch(_e){status.textContent='P31の訂正画面を開けませんでした。';}
 });
 actions.append(edit,advice);
 // Individual cancellation/restoration uses P31's committed-event validator.
 const corrections=document.createElement('section');corrections.className='p8-history-corrections';
 if(selectedActive){
   let capability;try{capability=frame.contentWindow?.__p8CorrectionApi?.entries();}catch(_e){}
   const h=document.createElement('h3');h.textContent='個別訂正・取消の復元';corrections.append(h);
   const hint=document.createElement('p');hint.textContent='対象を確認して1操作ずつ確定します。依存する操作がある場合は訂正できません。';corrections.append(hint);
   if(capability?.sessionId===chosen.id){
     for(const item of capability.entries.slice(0,30)){
       const line=document.createElement('div');line.className='p8-correction-row';
       const name=document.createElement('span');name.textContent=`#${item.sequence} ${item.description}`;
       const btn=document.createElement('button');btn.type='button';btn.textContent=item.action==='cancel'?'取消':'取消を復元';
       btn.disabled=!item.eligible||p8WriteBlocked();btn.title=item.reason||'';
       btn.addEventListener('click',async()=>{
         // Corrections share the same write gate as count, bonus, Undo and session operations.
         if(btn.disabled||p8WriteBlocked()){
           setDirectStatus('保存中または未照合の操作があります。個別訂正は実行できません。');return;
         }
         const message=`#${item.sequence} ${item.description} を${item.action==='cancel'?'取り消し':'復元'}しますか？`;
         if(!confirm(message))return;
         // Recheck after confirmation: the P31 owner may have changed meanwhile.
         if(p8WriteBlocked()){
           setDirectStatus('操作状態が変わりました。保存状態を確認してください。');return;
         }
         directPending=true;btn.disabled=true;updateDirectButtons();
         setDirectStatus('訂正の保存処理中…');
         try{
           let result;
           try{result=await frame.contentWindow.__p8CorrectionApi.apply(item.sequence,item.action,chosen.id);}
           catch(_e){result={status:'unknown'};}
           if(result?.status==='saved-and-refreshed'){
             lastViewSignature='';renderSessionHistory();setDirectStatus('訂正を保存し、表示を更新しました。');
           }else if(result?.status==='rejected'){
             setDirectStatus('訂正は受け付けられませんでした：'+(result.reason||'条件を確認してください'));
             renderSessionHistory();
           }else{
             directUncertain=true;
             setDirectStatus('保存結果を判定できません。再操作せずP31の記録を照合してください。');open();
           }
         }finally{directPending=false;updateDirectButtons();}
       });
       line.append(name,btn);corrections.append(line);
     }
   }else{const p=document.createElement('p');p.textContent='訂正機能に接続できません。';corrections.append(p);}
 }else{
   const p=document.createElement('p');p.textContent='この実戦は閲覧対象です。訂正するにはP31で対象実戦を選択してください。';corrections.append(p);
 }
 const detailTitle=document.createElement('h3');detailTitle.textContent=`${chosen.store||'店舗未記録'}・${chosen.number??'—'}番台のイベント`;
 const info=document.createElement('p');info.textContent=detail?.ok?`有効イベント ${detail.events.length}件（この一覧は読み取り専用）`:'イベント詳細を読み取れません。';
 const ol=document.createElement('ol');ol.className='p8-event-list';
 if(detail?.ok){const ev=detail.events;const confirmedIds=new Set(ev.filter(e=>e.type==='BONUS_REVIEW_CONFIRMED'&&e.bonusId).map(e=>e.bonusId));
  for(const e of ev.slice().reverse()){
   const li=document.createElement('li'),label=document.createElement('span'),small=document.createElement('small');
   const names={SESSION_CREATED:'実戦開始',SEGMENT_STARTED:'区間開始',GAMES_RECORDED:'G数追加',GRAPE_COUNTED:'ぶどう',CHERRY_COUNTED:'チェリー',BONUS_AWARDED:'ボーナス当選',BONUS_COMPLETED:'消化完了',HALL_SNAPSHOT_RECORDED:'ホール観測',SESSION_PAUSED:'一時中断',SESSION_RESUMED:'再開',SESSION_CLOSED_PENDING:'終了申請',SESSION_CLOSED_CONFIRMED:'終了確定',BONUS_REVIEW_CONFIRMED:'当選契機確認'};
   label.textContent=(names[e.type]||e.type)+(e.bonusType?`（${e.bonusType}）`:'')+(e.pendingReview&&!confirmedIds.has(e.bonusId)?'［保留］':'')+(e.delta!==null?` +${e.delta}G`:'');
   small.textContent=e.sequence===null?'順序不明':`#${e.sequence}`;li.append(label,small);ol.append(li);
  }
 }
 container.replaceChildren(heading,list,actions,corrections,detailTitle,info,ol);
}

function syncDataTabs(){
 const guess=document.getElementById('p8-guess-summary'),graph=document.getElementById('p8-graph-content'),history=document.getElementById('p8-history-content');
 if(!guess||!graph||!history)return;
 let snapshot;try{snapshot=frame.contentWindow?.__p8ViewsApi?.snapshot();}catch(_e){}
 if(!snapshot?.ok){
  if(lastViewSignature!=='NONE'){guess.textContent=graph.textContent=history.textContent='実戦未選択、またはP31へ接続できません。';lastViewSignature='NONE';}
  renderSessionHistory();
  return;
 }
 const signature=JSON.stringify(snapshot);if(signature===lastViewSignature)return;lastViewSignature=signature;
 const s=snapshot.session,ev=snapshot.events;
 const rate=(count)=>s.personalG>0&&!s.hasUnmeasuredG&&s.measuredG===s.personalG&&count>0?'1/'+(s.measuredG/count).toFixed(2):'—';
 guess.innerHTML=`<p class="p8-provenance">データ元：P31隔離版の選択中実戦／確定記録</p><div class="p8-data-grid"><div>本人G<strong>${esc(s.personalG)}</strong></div><div>BB / RB<strong>${esc(s.bb)} / ${esc(s.rb)}</strong></div><div>ぶどう<strong>${esc(s.grape)}　${esc(rate(s.grape))}</strong></div><div>チェリー<strong>${esc(s.cherry)}　${esc(rate(s.cherry))}</strong></div></div><p>小役実測G：${esc(s.measuredG)} ／ 本人G：${esc(s.personalG)}</p><p>小役確率：${s.hasUnmeasuredG||s.measuredG!==s.personalG?'全ゲーム実測条件を満たさないため未算出':'全ゲーム実測時のみ算出'}</p><p class="p8-provenance">設定推測は対応機種の確定BB・RBのみで参考評価します。小役は判定に含めません。</p>`;

 const prediction=window.P8MachineEstimator?.estimate({machine:s.machine,games:s.personalG,bb:s.bb,rb:s.rb});
 const extra=window.P8SmallRoleEstimator?.estimate({machine:prediction?.machineId,games:s.personalG,bb:s.bb,rb:s.rb,grape:s.grape,measuredG:s.measuredG,hasUnmeasuredG:s.hasUnmeasuredG});
 const guessSection=document.createElement('section');guessSection.className='p8-machine-prediction';
 if(prediction?.ok){
  const h=document.createElement('h3');h.textContent=prediction.machine+'｜BB・RB限定参考推測';guessSection.append(h);
  const intro=document.createElement('p');intro.textContent=`対象 ${prediction.games}G｜BB ${prediction.bb}・RB ${prediction.rb}`;guessSection.append(intro);
  const table=document.createElement('table');table.className='p8-prob-table';
  const tbody=document.createElement('tbody');
  for(const row of prediction.settings){
   const tr=document.createElement('tr');const c1=document.createElement('th'),c2=document.createElement('td');
   c1.textContent=`設定${row.setting}`;
   const bar=document.createElement('span');bar.className='p8-estimate-bar';bar.setAttribute('aria-hidden','true');
   const fill=document.createElement('span');fill.className='p8-estimate-fill';fill.style.width=`${Math.max(0,Math.min(100,row.percent))}%`;bar.append(fill);
   const num=document.createElement('span');num.textContent=`${row.percent.toFixed(1)}%`;num.className='p8-estimate-percent';
   c2.append(bar,num);tr.append(c1,c2);tbody.append(tr);
  }
  table.append(tbody);guessSection.append(table);
  const label=document.createElement('p');label.className='p8-estimate-disclaimer';label.textContent='表示割合は設定1〜6に同じ事前重みを置いたモデル上の相対値です。ホールの実際の設定配分・勝率を表しません。';guessSection.append(label);
  const note=document.createElement('p');note.textContent=prediction.note+' '+prediction.warning;guessSection.append(note);
  const source=document.createElement('a');source.href=prediction.source;source.target='_blank';source.rel='noopener noreferrer';source.textContent='数値の出典：北電子公式製品情報';guessSection.append(source);
 }else{
  const warn=document.createElement('p');warn.textContent='設定推測：'+(prediction?.reason||'推測エンジンを読み込めません。');guessSection.append(warn);
 }
 guess.append(guessSection);
 if(extra?.ok){
  const small=document.createElement('section');small.className='p8-machine-prediction';
  const title=document.createElement('h3');title.textContent='小役を含む参考推測（機種別・暫定値）';small.append(title);
  const explanation=document.createElement('p');explanation.textContent=extra.notes.join('。')+'。'+extra.reference.notice+' BB・RBの公式値と、小役の非公式参考値に基づく同一事前重みの相対比較です。';small.append(explanation);
  const t=document.createElement('table');t.className='p8-prob-table';const tb=document.createElement('tbody');
  for(const row of extra.settings){const tr=document.createElement('tr'),th=document.createElement('th'),td=document.createElement('td');th.textContent='設定'+row.setting;td.textContent=row.percent.toFixed(1)+'%';tr.append(th,td);tb.append(tr);}t.append(tb);small.append(t);
  const source=document.createElement('p');source.className='p8-estimate-disclaimer';source.textContent='小役参考値：'+extra.sources.smallRoles+'。メーカー非公表・原著未照合。現行の旧チェリー記録は推測に使用しません。';small.append(source);
  guess.append(small);
 }

 // Use the same confirmed-bonus rule as the P31 projection. A pending award
 // is counted only if its BONUS_REVIEW_CONFIRMED event is effective.
 const confirmedIds=new Set(ev.filter(e=>e.type==='BONUS_REVIEW_CONFIRMED'&&e.bonusId).map(e=>e.bonusId));
 let bb=0,rb=0,pending=0;const steps=[];
 for(const e of ev){if(e.type==='BONUS_AWARDED'){
  if(e.bonusType!=='BB'&&e.bonusType!=='RB')continue;
  if(e.pendingReview && (!e.bonusId||!confirmedIds.has(e.bonusId))){pending++;continue;}
  if(e.bonusType==='BB')bb++;else rb++;
  steps.push({bb,rb});
 }}
 // A disagreement is visible rather than silently publishing an incorrect graph.
 if(bb!==s.bb||rb!==s.rb){graph.textContent='グラフ集計とP31確定件数に差があります。安全のため表示を停止しました。';}
 else if(!steps.length){graph.textContent=pending?'確定済み当選はありません。保留中の当選はグラフから除外しています。':'確定した当選イベントがありません。';}
 else{
  const max=Math.max(1,bb,rb),w=310,height=140,offset=15,step=Math.max(1,(w-offset*2)/Math.max(1,steps.length));
  const line=(k)=>'0,'+height+' '+steps.map((p,i)=>`${Math.round(offset+(i+1)*step)},${Math.round(height-p[k]/max*(height-18))}`).join(' ');
  graph.innerHTML=`<div class="p8-data-grid"><div>BB<strong>${bb}</strong></div><div>RB<strong>${rb}</strong></div></div><svg role="img" aria-label="確定済み当選イベント順の累積BBとRB" viewBox="0 0 320 150" width="100%" height="160" preserveAspectRatio="xMidYMid meet"><polyline fill="none" stroke="#ff7296" stroke-width="3" points="${line('bb')}"/><polyline fill="none" stroke="#73c9ff" stroke-width="3" points="${line('rb')}"/></svg><p>ピンク：BB ／ 水色：RB ／ 確定${steps.length}件${pending?' ／ 保留'+pending+'件除外':''}</p>`;
 }
 const labels={SESSION_CREATED:'実戦開始',SEGMENT_STARTED:'区間開始',GAMES_RECORDED:'G数追加',GRAPE_COUNTED:'ぶどう',CHERRY_COUNTED:'チェリー',BONUS_AWARDED:'ボーナス当選',BONUS_COMPLETED:'消化完了',HALL_SNAPSHOT_RECORDED:'ホール観測',SESSION_PAUSED:'一時中断',SESSION_RESUMED:'再開',SESSION_CLOSED_PENDING:'終了申請',SESSION_CLOSED_CONFIRMED:'終了確定',BONUS_REVIEW_CONFIRMED:'当選契機確認'};
 const recent=ev.slice(-20).reverse();
 renderSessionHistory();
}
frame.addEventListener('load',()=>{sync();syncDataTabs();});
syncCompletion();
setInterval(()=>{sync();syncDataTabs();updateDirectButtons();},1200);
})();