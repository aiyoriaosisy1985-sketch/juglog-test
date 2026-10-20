// P31 original function, extracted unchanged for isolated tests.
function validateCorrectionDependencies(history, upcoming){
 const ordered=history.slice().sort((a,b)=>a.commitSequence-b.commitSequence);
 const byId=new Map(ordered.map(e=>[e.eventId,e]));
 const cancelled=new Set();
 for(const e of ordered){if(e.type==='EVENT_CANCELLED')cancelled.add(e.targetEventId);if(e.type==='EVENT_RESTORED')cancelled.delete(e.targetEventId)}
 const effective=ordered.filter(e=>!cancelled.has(e.eventId)&&!['EVENT_CANCELLED','EVENT_RESTORED'].includes(e.type));
 const corrections=upcoming.filter(e=>['EVENT_CANCELLED','EVENT_RESTORED'].includes(e.type));
 if(corrections.length>1)throw Error('複数の訂正は一操作ずつ保存してください');
 for(const e of corrections){
  const target=byId.get(e.targetEventId);
  if(!target||target.sessionId!==e.sessionId||['EVENT_CANCELLED','EVENT_RESTORED'].includes(target.type))throw Error('取消・復元先が不正です');
  if(e.type==='EVENT_CANCELLED'&&!effective.some(x=>x.eventId===target.eventId))throw Error('この操作は既に取消されています');
  if(e.type==='EVENT_RESTORED'&&!cancelled.has(target.eventId))throw Error('この操作は取消状態ではありません');
  if(target.type==='BONUS_AWARDED'){
   const related=effective.filter(x=>x.sessionId===target.sessionId&&x.bonusId===target.bonusId);
   if(related.some(x=>x.type==='BONUS_COMPLETED'||x.type==='BONUS_REVIEW_CONFIRMED'))throw Error('消化完了・保留確認と依存する当選記録は訂正できません');
   if(e.type==='EVENT_RESTORED'&&related.some(x=>x.type==='BONUS_AWARDED'))throw Error('同一ボーナスの有効な当選記録があります');
  }
  if(target.type==='BONUS_COMPLETED'){
   const tail=ordered.at(-1);
   if(e.type==='EVENT_CANCELLED'&&tail?.eventId!==target.eventId)throw Error('消化完了後に別の操作があるため訂正できません');
   if(e.type==='EVENT_RESTORED'&&(tail?.type!=='EVENT_CANCELLED'||tail.targetEventId!==target.eventId||tail.sessionId!==target.sessionId))throw Error('消化完了の取消後に別の操作があるため復元できません');
  }
  if(e.type==='EVENT_CANCELLED')cancelled.add(target.eventId);else cancelled.delete(target.eventId);
 }
 return true;
}
