(()=>{'use strict';
const frame=document.getElementById('p31-frame'),modal=document.getElementById('p31-overlay');
const status=document.getElementById('p31-connection');const close=document.getElementById('p31-close');
let lastFocus=null;
function open(){lastFocus=document.activeElement;modal.hidden=false;document.body.style.overflow='hidden';close.focus();}
function hide(){modal.hidden=true;document.body.style.overflow='';if(lastFocus&&lastFocus.focus)lastFocus.focus();}

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
frame.addEventListener('load',syncP31DialogTheme);
new MutationObserver(syncP31DialogTheme).observe(document.documentElement,{attributes:true,attributeFilter:['data-theme']});

document.addEventListener('keydown',e=>{if(e.key==='Escape'&&!modal.hidden){if(p31DialogOpen())return;safeHide();}});
// Complex operations must be performed in the visible P31 UI, not by injecting
// a click into an invisible iframe (which could hide the confirmation dialog).
const directRoles={grapeBtn:'grape',cherryBtn:'cherry'};
let directPending=false, directUncertain=false;
function hasJournal(){try{return !!frame.contentWindow?.__p8ReconcileApi?.journal().blocked;}catch(_e){return true;}}
const directMessage=document.createElement('p');
directMessage.id='p8-direct-status';directMessage.setAttribute('role','status');directMessage.setAttribute('aria-live','polite');
directMessage.textContent='ぶどう・チェリーはP31保存処理に直接接続。';
document.querySelector('[data-p31="grapeBtn"]')?.closest('.button-grid')?.after(directMessage);
function setDirectStatus(message){directMessage.textContent=message;}
function updateDirectButtons(){
 let ready=false;
 try{ready=!!frame.contentWindow?.__p8CountApi?.state().ready;}catch(_e){}
 const gameButton=document.getElementById('p8-games-submit');if(gameButton)gameButton.disabled=!ready||directPending||directUncertain||hasJournal();
 for(const id of Object.keys(directRoles)){
   const btn=document.querySelector(`[data-p31="${id}"]`);
   if(btn) btn.disabled=!ready||directPending||directUncertain||hasJournal();
 }
}
async function directCount(role){
 if(directPending||directUncertain||hasJournal()){setDirectStatus("未照合の操作記録があります。保存記録を照合してください。");return;}
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
document.querySelectorAll('[data-p31]').forEach(button=>button.addEventListener('click',()=>{
 const role=directRoles[button.dataset.p31];if(role){void directCount(role);}else if(['bbBtn','rbBtn','quickComplete','undoBtn'].includes(button.dataset.p31)){visibleNativeAction(button.dataset.p31);}else{open();}
}));
async function directGames(){
 if(directPending||directUncertain||hasJournal()){setDirectStatus("未照合の操作記録があります。保存記録を照合してください。");return;}
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
   setDirectStatus('DBに同一操作ID・同一イベント内容を確認。再入力せず、画面の記録と照合してください。入力ロックは維持します。');
  }else if(r?.state==='未保存'){
   setDirectStatus('DBに同一操作IDがありません。未保存キューを確認してください。自動再登録は行いません。');
  }else if(r?.state==='内容衝突'){
   setDirectStatus('保存内容が一致しません。操作を停止しバックアップを確保してください。');
  }else setDirectStatus('保存状態を判定できません。入力停止を維持します。');
 }catch(_e){setDirectStatus('DB読み取りに失敗しました。入力停止を維持します。');}
 finally{inspectBtn.disabled=false;updateDirectButtons();}
});

document.querySelector('.device')?.addEventListener('click',open);
document.querySelector('.menu')?.addEventListener('click',open);
// Completion type is derived from the P31 engine's rendered active bonus state.
// Never infer BB/RB from lifetime BB/RB counts or from a previous session.
const completeButton=document.querySelector('[data-p31="quickComplete"]');
function syncCompletion(){
 if(!completeButton)return;
 let native;
 try{
   const doc=frame.contentDocument;
   const playing=doc?.getElementById('playing');
   if(!playing||playing.hidden||playing.classList.contains('hidden'))throw Error('no active session');
   native=doc.getElementById('quickComplete');
   if(!native||native.hidden||native.disabled)throw Error('no available completion');
   const label=native.textContent.trim().replace(/\s+/g,' ');
   if(label!=='BB 消化完了'&&label!=='RB 消化完了')throw Error('unknown bonus type');
   completeButton.textContent=label.replace(' ','');
   completeButton.setAttribute('aria-label',label.replace(' ',''));
   completeButton.disabled=false;
   completeButton.title='P31の確認画面で消化完了を確定';
 }catch(_e){
   completeButton.textContent='消化完了（対象なし）';
   completeButton.setAttribute('aria-label','消化完了できるボーナスはありません');
   completeButton.disabled=true;
   completeButton.title='P31側で未消化ボーナスと入力権限を確認してください';
 }
}
const map={totalG:'live-total',personalG:'live-personal',currentG:'live-current',bbN:'live-bb',rbN:'live-rb',grapeN:'live-grape',cherryN:'live-cherry',hallBBRate:'live-bb-rate',hallRBRate:'live-rb-rate',hallCombinedRate:'live-combined-rate',grapeRate:'live-grape-rate',cherryRate:'live-cherry-rate',hallProbBase:'live-prob-base'};
const missing=id=>id==='live-prob-base'?'観測待ち':'—';
let lastSignature='';
function clear(){for(const target of Object.values(map)){document.getElementById(target).textContent=missing(target);}lastSignature='';}

function sync(){syncCompletion();try{
const doc=frame.contentDocument;if(!doc||doc.readyState!=='complete'){clear();return;}
const session=doc.getElementById('playing');
if(!session||session.classList.contains('hidden')||session.hidden){clear();status.textContent='P31に実戦が選択されていません。';return;}
const data={};for(const source of Object.keys(map)){const node=doc.getElementById(source);if(!node){clear();status.textContent='P31の集計項目が不足しています。';return;}data[source]=node.textContent.trim();}
const signature=JSON.stringify(data);if(signature===lastSignature)return;lastSignature=signature;
for(const [source,target] of Object.entries(map)){
document.getElementById(target).textContent=data[source]||missing(target);}
// Do not invent an event count by reading visual samples.
status.textContent='P31の集計表示と同期中（隔離DB・未検証）。操作はP31画面で確定してください。';
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
 container.replaceChildren(heading,list,detailTitle,info,ol);
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