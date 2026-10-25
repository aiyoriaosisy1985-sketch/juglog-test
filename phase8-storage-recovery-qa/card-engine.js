/* Phase 3 v15: store/card-specific membership medal ledger and session summaries. */
(function(root){'use strict';
 const TYPES={CARD_DEPOSIT:'貯メダル入庫',CARD_WITHDRAWAL:'貯メダル引出',CARD_BALANCE_OBSERVED:'貯メダル残高の実測'};
 const normalized=x=>typeof x==='string'?x.trim().replace(/\s+/g,' '):'';
 function key(store,cardLabel){return JSON.stringify([normalized(store),normalized(cardLabel)||'会員カード'])}
 function build(events){
  const effective=root?.JissenhyoGraph?.effectiveEvents||(typeof require==='function'?require('./graph-engine.js').effectiveEvents:null);
  if(!effective)throw Error('graph engine unavailable');
  const sessions=new Map(),cards=new Map(),invalid=[];
  const ordered=effective(events);
  for(const e of ordered){if(e.type==='SESSION_CREATED')sessions.set(e.sessionId,{sessionId:e.sessionId,date:e.date||'',store:e.store||'',machine:e.machine||'',number:e.number||'',games:0,bb:0,rb:0,invested:0,recovered:0,cardDeposits:0,cardWithdrawals:0,cardObservations:0,financeEvents:0});}
  const confirmed=new Set(),awards=new Map();
  for(const e of ordered){if(e.type==='BONUS_AWARDED')awards.set(e.bonusId,e);else if(e.type==='BONUS_REVIEW_CONFIRMED')confirmed.add(e.bonusId)}
  for(const e of ordered){
   const s=sessions.get(e.sessionId);
   if(!s)continue;
   if(e.type==='GAMES_RECORDED'&&Number.isSafeInteger(e.delta)&&e.delta>0)s.games+=e.delta;
   if(e.type==='BONUS_AWARDED'&&(!e.pendingReview||confirmed.has(e.bonusId))){if(e.bonusType==='BB')s.bb++;else if(e.bonusType==='RB')s.rb++}
   if(e.type==='CASH_INVESTED'||e.type==='CASH_RECOVERED'){
    if(!Number.isSafeInteger(e.amount)||e.amount<=0){invalid.push(e.eventId);continue}
    if(e.type==='CASH_INVESTED')s.invested+=e.amount;else s.recovered+=e.amount;s.financeEvents++;continue;
   }
   if(!Object.hasOwn(TYPES,e.type))continue;
   const store=normalized(e.store),cardLabel=normalized(e.cardLabel)||'会員カード';
   if(!store||!Number.isSafeInteger(e.amount)||e.amount<0||(e.type!=='CARD_BALANCE_OBSERVED'&&e.amount===0)||store.length>120||cardLabel.length>60){invalid.push(e.eventId);continue}
   // A card event must belong to a session for that store: prevents silent cross-store transfers.
   if(normalized(s.store)!==store){invalid.push(e.eventId);continue}
   const id=key(store,cardLabel);
   if(!cards.has(id))cards.set(id,{key:id,store,cardLabel,knownBalance:null,deposits:0,withdrawals:0,observations:0,events:[],warning:false});
   const c=cards.get(id);
   c.events.push({eventId:e.eventId,sessionId:e.sessionId,type:e.type,amount:e.amount,commitSequence:e.commitSequence,recordedAt:e.recordedAt||''});
   if(e.type==='CARD_DEPOSIT'){
    c.deposits+=e.amount;s.cardDeposits+=e.amount;
    if(c.knownBalance!==null)c.knownBalance+=e.amount;
   }else if(e.type==='CARD_WITHDRAWAL'){
    c.withdrawals+=e.amount;s.cardWithdrawals+=e.amount;
    if(c.knownBalance!==null){c.knownBalance-=e.amount;if(c.knownBalance<0){c.warning=true;c.knownBalance=null;}}
   }else{c.knownBalance=e.amount;c.observations++;s.cardObservations++;c.warning=false;}
  }
  return {sessions:[...sessions.values()].map(s=>({...s,cashNet:s.recovered-s.invested})),cards:[...cards.values()],invalid};
 }
 const api={build,key,TYPES};
 if(typeof module!=='undefined'&&module.exports)module.exports=api;
 if(root)root.JissenhyoCard=api;
})(typeof window!=='undefined'?window:null);
