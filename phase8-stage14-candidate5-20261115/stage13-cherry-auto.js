/* Juglog Stage13 Fix2: read-only cherry classification derived from effective events. */
(function(root){'use strict';
const integer=x=>Number.isSafeInteger(x)&&x>=0;
function derive(events,record){
 const e=Array.isArray(events)?events:[];
 const chosen=e.filter(x=>x&&x.type==='BONUS_REVIEW_CONFIRMED'&&x.bonusId).map(x=>x.bonusId);
 const confirmed=new Set(chosen);
 const bonuses=e.filter(x=>x?.type==='BONUS_AWARDED' &&
   (x.bonusType==='BB'||x.bonusType==='RB') &&
   (x.pendingReview!==true||confirmed.has(x.bonusId)));
 const overlapping=bonuses.filter(x=>x.trigger==='チェリー重複'&&x.triggerVerification==='confirmed').length;
 const unknown=bonuses.filter(x=>x.triggerVerification!=='confirmed'||!['チェリー重複','単独'].includes(x.trigger)).length;
 const total=record?.cherry,grape=record?.grape,games=record?.measuredG;
 const measured=record?.measuredComplete===true;
 if(!measured||!integer(total)||!integer(grape)||!integer(games)||games===0)
   return {ok:false,reason:'全ゲームの小役実測データがないため使用できません。',totalCherries:total,overlapping,unknown};
 if(total<overlapping)return {ok:false,reason:'チェリー重複の記録数がチェリーカウンターを超えています。記録内容を確認してください。',totalCherries:total,overlapping,unknown};
 if(total+grape>games)return {ok:false,reason:'ぶどうとチェリーの記録数が小役実測G数を超えています。',totalCherries:total,overlapping,unknown};
 return {ok:true,totalCherries:total,overlapping,nonOverlap:total-overlapping,unknown,measuredGames:games};
}
const api=Object.freeze({derive});if(typeof module!=='undefined'&&module.exports)module.exports=api;
root.JGLStage13CherryAuto=api;
})(typeof globalThis!=='undefined'?globalThis:this);
