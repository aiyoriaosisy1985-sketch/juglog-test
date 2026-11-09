/* Phase 3 v14: financial entries remain distinct; no currency/medal conversion. */
(function(root){'use strict';
  const TYPES={CASH_INVESTED:{label:'現金投資',unit:'円'},CASH_RECOVERED:{label:'現金回収',unit:'円'},MEDALS_INSERTED:{label:'投入枚数（記録分）',unit:'枚'},MEDALS_PAID_OUT:{label:'獲得枚数（記録分）',unit:'枚'},MEDALS_BALANCE_OBSERVED:{label:'持ちメダル実測',unit:'枚'},NET_MEDALS_OBSERVED:{label:'累計差枚の実測',unit:'枚'}};
  function build(events,sessionId){
    const effective=root?.JissenhyoGraph?.effectiveEvents || (typeof require==='function'?require('./graph-engine.js').effectiveEvents:null);
    if(!effective)throw Error('graph engine unavailable');
    const ev=effective(events).filter(e=>e.sessionId===sessionId);
    let games=0,invested=0,recovered=0,inserted=0,paidOut=0,latestBalance=null,latestNet=null;
    const netPoints=[],records=[],invalid=[];
    for(const e of ev){
      if(e.type==='GAMES_RECORDED'){
        if(Number.isSafeInteger(e.delta)&&e.delta>0)games+=e.delta;
        continue;
      }
      if(!Object.hasOwn(TYPES,e.type))continue;
      const signed=e.type==='NET_MEDALS_OBSERVED';
      if(!Number.isSafeInteger(e.amount)||(!signed&&e.amount<0)||(!signed&&e.type!=='MEDALS_BALANCE_OBSERVED'&&e.amount===0)){
        invalid.push(e.eventId);continue;
      }
      const record={eventId:e.eventId,type:e.type,amount:e.amount,games,commitSequence:e.commitSequence,recordedAt:e.recordedAt};
      records.push(record);
      switch(e.type){
        case 'CASH_INVESTED':invested+=e.amount;break;
        case 'CASH_RECOVERED':recovered+=e.amount;break;
        case 'MEDALS_INSERTED':inserted+=e.amount;break;
        case 'MEDALS_PAID_OUT':paidOut+=e.amount;break;
        case 'MEDALS_BALANCE_OBSERVED':latestBalance=e.amount;break;
        case 'NET_MEDALS_OBSERVED':latestNet=e.amount;netPoints.push({games,amount:e.amount,eventId:e.eventId,commitSequence:e.commitSequence});break;
      }
    }
    return {games,invested,recovered,cashNet:recovered-invested,inserted,paidOut,recordedMedalNet:paidOut-inserted,latestBalance,latestNet,netPoints,records,invalid,types:TYPES};
  }
  const api={build,TYPES};
  if(typeof module!=='undefined'&&module.exports)module.exports=api;
  if(root)root.JissenhyoFinance=api;
})(typeof window!=='undefined'?window:null);
