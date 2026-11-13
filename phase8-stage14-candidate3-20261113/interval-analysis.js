/* Juglog P7 read-only interval analysis, based on persisted commitSequence. */
(function(root,factory){const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;root.JuglogInterval=api;})(typeof globalThis!=='undefined'?globalThis:this,function(){'use strict';
 function analyze(events,sessionId,start,end){
  if(typeof sessionId!=='string'||!sessionId||!Number.isSafeInteger(start)||!Number.isSafeInteger(end)||start<1||end<start)throw Error('区間の連番を確認してください');
  const sorted=events.slice().sort((a,b)=>a.commitSequence-b.commitSequence);
  const ids=new Set(),cancelled=new Set();
  for(const e of sorted){if(e.type==='EVENT_CANCELLED')cancelled.add(e.targetEventId);else if(e.type==='EVENT_RESTORED')cancelled.delete(e.targetEventId)}
  const effective=sorted.filter(e=>!cancelled.has(e.eventId)&&e.type!=='EVENT_CANCELLED'&&e.type!=='EVENT_RESTORED');
  const session=effective.filter(e=>e.sessionId===sessionId);
  if(!session.some(e=>e.type==='SESSION_CREATED'))throw Error('対象の実戦が見つかりません');
  const within=session.filter(e=>e.commitSequence>=start&&e.commitSequence<=end);
  let games=0,measured=0,grape=0,cherry=0,bb=0,rb=0,invalidG=false;
  const confirmed=new Set(session.filter(e=>e.type==='BONUS_REVIEW_CONFIRMED').map(e=>e.bonusId));
  for(const e of within){
   if(e.type==='GAMES_RECORDED'){if(!Number.isSafeInteger(e.delta)||e.delta<=0){invalidG=true;continue}games+=e.delta;if(e.measuredBoth===true)measured+=e.delta}
   if(e.type==='GRAPE_COUNTED')grape++;
   if(e.type==='CHERRY_COUNTED')cherry++;
   if(e.type==='BONUS_AWARDED'&&(!e.pendingReview||confirmed.has(e.bonusId))){if(e.bonusType==='BB')bb++;else if(e.bonusType==='RB')rb++}
  }
  const validMeasured=!invalidG&&games>0&&measured===games;
  return {start,end,events:within.length,games,measured,grape,cherry,bb,rb,invalidG,measuredComplete:validMeasured,
   bonusRate:games>0&&bb+rb>0?games/(bb+rb):null,bbRate:games>0&&bb>0?games/bb:null,rbRate:games>0&&rb>0?games/rb:null,
   grapeRate:validMeasured&&grape>0?measured/grape:null,cherryRate:validMeasured&&cherry>0?measured/cherry:null};
 }
 function compareRange(events,sessionId,afterSequence,throughSequence){
  if(!Number.isSafeInteger(afterSequence)||afterSequence<0||!Number.isSafeInteger(throughSequence)||throughSequence<afterSequence)throw Error('チェックポイントの順序を確認してください');
  // Empty checkpoint spans are valid even if no events were recorded.
  if(throughSequence===afterSequence){
   // Validate session through original dataset before returning a zero-length slice.
   if(!events.some(e=>e.sessionId===sessionId&&e.type==='SESSION_CREATED'))throw Error('対象の実戦が見つかりません');
   return {start:afterSequence+1,end:throughSequence,events:0,games:0,measured:0,grape:0,cherry:0,bb:0,rb:0,invalidG:false,measuredComplete:false,bonusRate:null,bbRate:null,rbRate:null,grapeRate:null,cherryRate:null};
  }
  return analyze(events,sessionId,afterSequence+1,throughSequence);
 }
 return {analyze,compareRange};
});
