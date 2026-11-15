/* Phase 3 v13: pure event-derived charts; no interpolation of medals or hall games. */
(function(root){'use strict';
  function effectiveEvents(events){
    const ordered=[...events].sort((a,b)=>(a.commitSequence||0)-(b.commitSequence||0));
    const cancelled=new Set();
    for(const e of ordered){if(e.type==='EVENT_CANCELLED')cancelled.add(e.targetEventId);else if(e.type==='EVENT_RESTORED')cancelled.delete(e.targetEventId)}
    return ordered.filter(e=>!cancelled.has(e.eventId)&&e.type!=='EVENT_CANCELLED'&&e.type!=='EVENT_RESTORED');
  }
  function build(events,sessionId){
    const ev=effectiveEvents(events).filter(e=>e.sessionId===sessionId);
    const awardById=new Map(),pendingIds=new Set(),confirmedIds=new Set();
    for(const e of ev){
      if(e.type==='BONUS_AWARDED'){
        awardById.set(e.bonusId,e);
        if(e.pendingReview)pendingIds.add(e.bonusId);else confirmedIds.add(e.bonusId);
      }else if(e.type==='BONUS_REVIEW_CONFIRMED'&&awardById.has(e.bonusId)){
        pendingIds.delete(e.bonusId);confirmedIds.add(e.bonusId);
      }
    }
    let games=0,bb=0,rb=0;
    const points=[{games:0,bb:0,rb:0,combined:0}];
    const awards=[];let badG=0;
    for(const e of ev){
      if(e.type==='GAMES_RECORDED'){
        if(!Number.isSafeInteger(e.delta)||e.delta<=0){badG++;continue}
        games+=e.delta;points.push({games,bb,rb,combined:bb+rb});
      }else if(e.type==='BONUS_AWARDED'&&confirmedIds.has(e.bonusId)&&['BB','RB'].includes(e.bonusType)){
        if(e.bonusType==='BB')bb++;else rb++;
        const a={games,type:e.bonusType,trigger:e.trigger||'不明',verified:e.triggerVerification==='confirmed',commitSequence:e.commitSequence,recordedAt:e.recordedAt||null,bonusId:e.bonusId};
        awards.push(a);points.push({games,bb,rb,combined:bb+rb});
      }
    }
    return {games,bb,rb,combined:bb+rb,points,awards,pendingCount:pendingIds.size,badG};
  }
  const api={effectiveEvents,build};
  if(typeof module!=='undefined'&&module.exports)module.exports=api;
  if(root)root.JissenhyoGraph=api;
})(typeof window!=='undefined'?window:null);
