(()=>{'use strict';
const $=id=>document.getElementById(id);
const ids=['grapeBtn','cherryBtn','undoBtn','bbBtn','rbBtn','quickComplete','addG','addGBtn','measuredBoth','totalG','personalG','currentG','playing'];
if(!ids.every($))return;
const root=document.createElement('aside');root.id='p8-d07f-controls';root.setAttribute('aria-label','P31操作接続・隔離検証');
root.innerHTML=`<div class="p8-head"><strong>ジャグログ <em>Phase 8</em></strong><span>隔離検証版</span></div>
<p>既存P31操作へ委譲します。保存・権限状態はP31内部から取得します。</p>
<div class="p8-stats"><div>総G <b data-mirror="totalG">—</b></div><div>本人G <b data-mirror="personalG">—</b></div><div>現在G <b data-mirror="currentG">—</b></div></div>
<div class="p8-actions"><button data-forward="grapeBtn">ぶどう+1</button><button data-forward="cherryBtn">チェリー+1</button><button type="button" data-native="bbBtn">BB当選（元画面）</button><button type="button" data-native="rbBtn">RB当選（元画面）</button><button type="button" data-native="quickComplete">消化完了（元画面）</button><button type="button" data-native="undoBtn">Undo（元画面）</button></div>
<div class="p8-game"><label for="p8-games">追加G</label><input id="p8-games" type="number" min="1" step="1" inputmode="numeric"><label class="p8-check"><input id="p8-measured" type="checkbox">全ゲームで小役実測</label><button id="p8-game-submit">G数追加</button></div>
<p class="p8-status" role="status" aria-live="polite" id="p8-operation-note">P31の状態通知待機中（操作不可）</p><button id="p8-collapse" type="button">折りたたみ</button>`;
document.body.append(root);
const note=$('p8-operation-note'),buttons=[...root.querySelectorAll('[data-forward],#p8-game-submit')];
let state=null,awaiting=false,terminal=null;
// P31 notification can precede its finally render(); release only after an idle state notification.

const valid=d=>d&&typeof d.writer==='boolean'&&typeof d.busy==='boolean'&&Number.isSafeInteger(d.pending)&&d.pending>=0&&typeof d.active==='boolean'&&typeof d.visible==='boolean';
const permitted=()=>state&&state.writer&&!state.busy&&state.pending===0&&state.active&&state.visible&&!awaiting;
function refresh(){for(const id of ['totalG','personalG','currentG'])root.querySelector(`[data-mirror="${id}"]`).textContent=$(id).textContent;const allow=!!permitted();for(const b of buttons){const el=b.dataset.forward?$(b.dataset.forward):$('addGBtn');b.disabled=!allow||el.disabled||el.hidden}}
window.addEventListener('juglog:p31:state-v1',e=>{if(!valid(e.detail)){state=null;awaiting=true;note.textContent='P31状態通知の形式が不正です';refresh();return}state=e.detail;
// After dispatch, internal P31 render must have reported busy=true before a return to idle.
// Direct click cannot determine if modal is cancelled. Remain locked until next acknowledged state cycle.
if(awaiting){
 if(terminal&&state.writer&&!state.busy&&state.pending===0&&state.active&&state.visible){
  awaiting=false;note.textContent=terminal==='saved-and-refreshed'?'P31保存・再読込完了':'P31は保存を受け付けませんでした';terminal=null;
 } else note.textContent=terminal?'P31終了通知後の入力権限再確認中':state.pending?'P31が保存処理中':'P31の操作結果待機中';
}
else note.textContent=state.pending?'未保存キューあり':state.busy?'P31処理中':state.writer?'P31入力可能':'閲覧専用';refresh();});
window.addEventListener('juglog:p31:operation-result-v1',e=>{
 const d=e.detail;
 if(!awaiting||!d||!['rejected','saved-and-refreshed','saved-refresh-failed','unknown'].includes(d.status))return;
 if(d.status==='saved-and-refreshed'||d.status==='rejected'){
  terminal=d.status;
  note.textContent='操作終了通知を受信。P31の最新状態を照合しています';
 }else{
  terminal=null;awaiting=true;note.textContent=d.status==='saved-refresh-failed'?'DB保存済み・画面再読込失敗。再入力禁止':'保存結果不明。再入力禁止';
 }
 refresh();
});
function forward(el){if(!permitted()||el.disabled||el.hidden){note.textContent='P31が入力可能ではありません';return}awaiting=true;terminal=null;refresh();try{el.click()}catch(e){note.textContent='P31への入力委譲でエラー：'+(e?.message||String(e));} // No auto rearm on click or text change.
}
for(const b of root.querySelectorAll('[data-native]'))b.addEventListener('click',()=>{const target=$(b.dataset.native);if(!target||target.hidden){note.textContent='元画面の対象操作は現在利用できません';return;} target.scrollIntoView({block:'center',behavior:'smooth'});target.focus({preventScroll:true});note.textContent='P31元画面のボタンを使用してください。確認画面をキャンセルしても補助画面はロックされません';});
for(const b of root.querySelectorAll('[data-forward]'))b.addEventListener('click',()=>forward($(b.dataset.forward)));
$('p8-game-submit').addEventListener('click',()=>{const value=$('p8-games').value.trim(),v=Number(value);if(!/^[1-9]\d*$/.test(value)||!Number.isSafeInteger(v)){note.textContent='1以上の整数Gを指定してください';return}if(!permitted())return;$('addG').value=String(v);$('measuredBoth').checked=$('p8-measured').checked;forward($('addGBtn'));});
$('p8-collapse').addEventListener('click',()=>root.classList.toggle('collapsed'));
new MutationObserver(refresh).observe($('playing'),{attributes:true,attributeFilter:['class','hidden']});
for(const id of ['totalG','personalG','currentG'])new MutationObserver(refresh).observe($(id),{childList:true,subtree:true,characterData:true});
document.addEventListener('visibilitychange',()=>{if(document.hidden){state=null;awaiting=true}refresh()});refresh();
})();