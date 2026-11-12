/* Read-only candidate. Designed to consume P8MachineEstimator.models + Stage13 references.
   Uses mutually exclusive categories; never counts bonus evidence twice.
   Hall base must be valid and anchored at event sequence, not the latest partial snapshot. */
(function(root){'use strict';
const valid=x=>Number.isSafeInteger(x)&&x>=0;
function distribution(logs){
 const max=Math.max(...logs);const w=logs.map(x=>Math.exp(x-max));const total=w.reduce((a,b)=>a+b,0);
 if(!Number.isFinite(total)||total<=0)return null;
 const probs=w.map(x=>x/total),u=probs.map(p=>Math.floor(p*1000));const n=1000-u.reduce((a,b)=>a+b,0);
 const rank=probs.map((p,i)=>({i,f:p*1000-u[i]})).sort((a,b)=>b.f-a.f||a.i-b.i);
 for(let j=0;j<n;j++)u[rank[j].i]++;
 return probs.map((p,i)=>({setting:i+1,probability:p,percent:u[i]/10}));
}
function estimate({machine,games,bb,rb,measuredGames,grape,nonOverlapCherry,nonOverlapVerified=false}={}){
 const model=root.P8MachineEstimator?.models?.[machine],ref=root.JGLStage13References?.get(machine);
 if(!model||!ref)return {ok:false,reason:'機種の基準値がありません。'};
 if(![games,bb,rb].every(valid)||games===0||bb+rb>games)return {ok:false,reason:'G数・BB/RBが不正です。'};
 const useGrape=valid(measuredGames)&&measuredGames>0&&valid(grape)&&grape<=measuredGames;
 // For a mixed hall/personal sample, bonus evidence across the entire hall span and
 // grapes in the personally measured segment would double count the personal games.
 // Conditional small-role evidence uses its own measured sample; bonuses are used only
 // in the full-hall likelihood. The game partition is disjoint by metrics.
 const useCherry=useGrape&&nonOverlapVerified===true&&valid(nonOverlapCherry)&&ref.nonOverlapCherry&&nonOverlapCherry+grape<=measuredGames;
 const logs=model.rows.map((r,i)=>{
  const pB=1/r.bb,pR=1/r.rb,pO=1-pB-pR;
  if(pO<=0)return NaN;
  let log=bb*Math.log(pB)+rb*Math.log(pR)+(games-bb-rb)*Math.log(pO);
  if(useGrape){
   const pg=1/ref.grape[i];
   if(useCherry){const pc=1/ref.nonOverlapCherry[i];const rest=1-pg-pc;if(rest<=0)return NaN;
     log+=grape*Math.log(pg)+nonOverlapCherry*Math.log(pc)+(measuredGames-grape-nonOverlapCherry)*Math.log(rest);
   }else {log+=grape*Math.log(pg)+(measuredGames-grape)*Math.log(1-pg);}
  }
  return log;
 });
 if(logs.some(x=>!Number.isFinite(x)))return {ok:false,reason:'集計モデルの計算に失敗しました。'};
 const settings=distribution(logs);if(!settings)return {ok:false,reason:'参考割合を計算できません。'};
 return {ok:true,machine,games,bb,rb,settings,used:{bonus:true,grape:useGrape,nonOverlapCherry:!!useCherry},
   status:ref.status,notes:[useGrape?'本人実測区間のぶどうを使用':'ぶどうは実測区間が未確認のため不使用',useCherry?'非重複チェリーは区分を検証済みとして使用':'非重複チェリーは区分未保証または参考値未登録のため不使用', '参考割合は独立近似であり、実際の設定確率・勝率ではありません。']};
}
function hallFromEvents(events,sessionId){
 // Effective events must already have cancellations/restores resolved by the host.
 const xs=events.filter(e=>e.sessionId===sessionId).sort((a,b)=>(a.sequence??a.commitSequence??0)-(b.sequence??b.commitSequence??0));
 let base=null;for(const e of xs){if(e.type==='HALL_SNAPSHOT_RECORDED'&&[e.totalG,e.bb,e.rb].every(valid)&&e.bb+e.rb<=e.totalG)base=e;}
 if(!base)return {ok:false,reason:'BB/RBを含むホール観測値がありません。'};
 let games=base.totalG,bb=base.bb,rb=base.rb;const baseSeq=base.sequence??base.commitSequence??0;const reviewed=new Set(xs.filter(e=>e.type==='BONUS_REVIEW_CONFIRMED'&&e.bonusId).map(e=>e.bonusId));
 for(const e of xs){if((e.sequence??e.commitSequence??0)<=baseSeq)continue;
  if(e.type==='GAMES_RECORDED'&&valid(e.delta))games+=e.delta;
  if(e.type==='BONUS_AWARDED'&&(!e.pendingReview||reviewed.has(e.bonusId))&&e.bonusType==='BB')bb++;
  if(e.type==='BONUS_AWARDED'&&(!e.pendingReview||reviewed.has(e.bonusId))&&e.bonusType==='RB')rb++;
 }
 return {ok:true,games,bb,rb,baseSequence:baseSeq,
   note:'最後の完全なホール観測値以降の記録のみを加算。部分観測値は再起点としません。'};
}
const api=Object.freeze({estimate,hallFromEvents});if(typeof module!=='undefined'&&module.exports)module.exports=api;root.JGLStage13Estimator=api;
})(typeof globalThis!=='undefined'?globalThis:this);
