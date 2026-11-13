/* Phase 8 read-only elapsed G since the most recent confirmed BB/RB.
   Uses only P31's effective event snapshot. No writer or persistence. */
(function(root){
'use strict';
function compute(snapshot){
 const none={bb:null,rb:null,reason:'unavailable'};
 if(!snapshot||!snapshot.ok||!snapshot.session||!Array.isArray(snapshot.events))return none;
 const expected=snapshot.session.personalG;
 if(!Number.isSafeInteger(expected)||expected<0)return none;
 let total=0,bb=null,rb=null,invalid=false;
 const accepted=new Set(snapshot.events.filter(e=>e.type==='BONUS_REVIEW_CONFIRMED'&&e.bonusId).map(e=>e.bonusId));
 for(const e of snapshot.events){
  if(e.type==='GAMES_RECORDED'){
   if(!Number.isSafeInteger(e.delta)||e.delta<1||!Number.isSafeInteger(total+e.delta)){invalid=true;break;}
   total+=e.delta;
  }else if(e.type==='BONUS_AWARDED' && (e.bonusType==='BB'||e.bonusType==='RB')){
   if(e.pendingReview && (!e.bonusId||!accepted.has(e.bonusId)))continue;
   if(e.bonusType==='BB')bb=total;else rb=total;
  }
 }
 if(invalid||total!==expected)return {bb:null,rb:null,reason:'inconsistent'};
 return {bb:bb===null?null:total-bb,rb:rb===null?null:total-rb,reason:'ok'};
}
root.P8LastBonusGap=Object.freeze({compute});
if(typeof document==='undefined')return;
const ids={bb:document.getElementById('p8-since-bb'),rb:document.getElementById('p8-since-rb')};
if(!ids.bb||!ids.rb)return;
let last='';
function update(){
 let snapshot;try{snapshot=document.getElementById('p31-frame')?.contentWindow?.__p8ViewsApi?.snapshot();}catch(_e){}
 const result=compute(snapshot);
 const signature=JSON.stringify(result);if(signature===last)return;last=signature;
 ids.bb.textContent=result.bb===null?'—':`${result.bb.toLocaleString('ja-JP')}G`;
 ids.rb.textContent=result.rb===null?'—':`${result.rb.toLocaleString('ja-JP')}G`;
}
document.getElementById('p31-frame')?.addEventListener('load',update);
setInterval(update,1200);update();
})(window);
