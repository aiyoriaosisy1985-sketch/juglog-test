/* 実践表 Phase 2 v12 - 契機別RB/BBを分類完全性に応じて使用。
 * 未確認の契機を単独と推測しない。契機別データはそのボーナス種別の
 * 全件が分類済みのときだけ使用。全件分類済みであっても確認漏れ・
 * 誤分類があると結果は偏るため、実戦上の限界を表示する。
 * 排他的な多項尤度を用い、RB総数とRB内訳の二重計上をしない。
 */
(function(root){'use strict';
const MODEL=Object.freeze({
  id:'myjugglerV-partial-trigger-20261011-v12',machine:'マイジャグラーV',
  sourceUrls:Object.freeze(['https://slomiru.com/my_juggler_v','https://tsumoreru.com/machines/my-juggler-5/','https://cf.slo-map.com/juggler/models/my-juggler-v']),
  denominators:Object.freeze([
    {setting:1,bb:273.1,rb:409.6,grape:5.90,cherry:38.43,bbCherry:1418.43,rbCherry:1091.69},
    {setting:2,bb:270.8,rb:385.5,grape:5.88,cherry:38.29,bbCherry:1406.46,rbCherry:1094.48},
    {setting:3,bb:266.4,rb:336.1,grape:5.82,cherry:37.04,bbCherry:1393.39,rbCherry:1046.38},
    {setting:4,bb:254.0,rb:290.0,grape:5.81,cherry:35.89,bbCherry:1297.56,rbCherry:1026.68},
    {setting:5,bb:240.1,rb:268.6,grape:5.79,cherry:35.82,bbCherry:1210.64,rbCherry:888.35},
    {setting:6,bb:229.1,rb:229.1,grape:5.69,cherry:35.79,bbCherry:1165.49,rbCherry:759.10}
  ].map(Object.freeze))
});
function supportsMachine(name){return /^(?:マイジャグラー(?:V|5)|マイジャグ5)$/i.test(String(name||'').normalize('NFKC').replace(/[\s　]/g,''))}
function validCount(v){return Number.isSafeInteger(v)&&v>=0}
function formatPercent(probs){const raw=probs.map(p=>p*1000),units=raw.map(Math.floor);let remaining=1000-units.reduce((a,b)=>a+b,0);const order=raw.map((v,i)=>({i,rem:v-units[i]})).sort((a,b)=>b.rem-a.rem||a.i-b.i);for(let i=0;i<remaining;i++)units[order[i].i]++;return units.map(n=>n/10)}
function estimate({games,bb,rb,grape,cherry,bbCherry,rbCherry,mode='auto',measuredComplete=false}={}){
  if(![games,bb,rb].every(validCount))return {ok:false,reason:'G数・BB・RBの確定した整数が必要です。'};
  if(!games)return {ok:false,reason:'対象ゲーム数が0Gのため、推測できません。'};
  if(bb+rb>games)return {ok:false,reason:'BB・RBの合計が対象Gを超えています。集計範囲を確認してください。'};
  if(!['auto','bonus'].includes(mode))return {ok:false,reason:'分析モードが不正です。'};
  const notes=[];
  let useGrape=false,useBB=false,useRB=false,useCherry=false;
  if(mode==='bonus')notes.push('比較モード：BB・RB総数のみを使用します。');
  else {
    useBB=validCount(bbCherry)&&bbCherry<=bb;
    useRB=validCount(rbCherry)&&rbCherry<=rb;
    if(!useBB&&bb>0)notes.push('BBに契機不明があるため、BB契機別情報は使用しません。');
    if(!useRB&&rb>0)notes.push('RBに契機不明があるため、RB契機別情報は使用しません。');
    if(measuredComplete&&validCount(grape)&&grape+bb+rb<=games){useGrape=true}
    else notes.push('ぶどうは全Gの測定確認・回数整合がないため使用しません。');
    // 総チェリーを組み込むには、両ボーナス種別の契機が全件分類済みで、
    // 全Gのチェリー測定が完了し、排他的な結果の合計が一致する必要がある。
    if(useBB&&useRB&&useGrape&&validCount(cherry)&&
       cherry>=bbCherry+rbCherry&&grape+cherry<=games&&
       grape+bb+rb+cherry-bbCherry-rbCherry<=games){useCherry=true}
    else if(measuredComplete&&validCount(cherry))notes.push('総チェリーは契機内訳・測定範囲の条件が揃わないため参考表示のみです。');
  }
  const effectiveMode=useCherry?'joint':(useBB||useRB?(useBB&&useRB?'both':useRB?'rb':'bb')+(useGrape?'-grape':''):useGrape?'grape':'bonus');
  const logs=MODEL.denominators.map(row=>{
    const pbb=1/row.bb,prb=1/row.rb,pg=1/row.grape,pc=1/row.cherry,pbc=1/row.bbCherry,prc=1/row.rbCherry;
    const counts=[],ps=[];
    if(useBB){counts.push(bbCherry,bb-bbCherry);ps.push(pbc,pbb-pbc)}
    else{counts.push(bb);ps.push(pbb)}
    if(useRB){counts.push(rbCherry,rb-rbCherry);ps.push(prc,prb-prc)}
    else{counts.push(rb);ps.push(prb)}
    if(useCherry){counts.push(cherry-bbCherry-rbCherry);ps.push(pc-pbc-prc)}
    if(useGrape){counts.push(grape);ps.push(pg)}
    const used=counts.reduce((a,b)=>a+b,0),usedP=ps.reduce((a,b)=>a+b,0);
    counts.push(games-used);ps.push(1-usedP);
    if(ps.some(p=>p<=0)||counts.some(n=>!validCount(n)))return NaN;
    return counts.reduce((sum,n,i)=>sum+(n?n*Math.log(ps[i]):0),0);
  });
  if(logs.some(n=>!Number.isFinite(n)))return {ok:false,reason:'尤度モデルと集計が整合しません。'};
  const max=Math.max(...logs),weights=logs.map(x=>Math.exp(x-max)),sum=weights.reduce((a,b)=>a+b,0),probs=weights.map(x=>x/sum),percents=formatPercent(probs);
  const settings=MODEL.denominators.map((row,i)=>({setting:row.setting,probability:probs[i],percent:percents[i]}));
  const ranked=[...settings].sort((a,b)=>b.probability-a.probability||a.setting-b.setting);
  const mass=min=>settings.filter(x=>x.setting>=min).reduce((a,b)=>a+b.probability,0);
  const observed={bb:bb?games/bb:null,rb:rb?games/rb:null,combined:bb+rb?games/(bb+rb):null,grape:validCount(grape)&&grape?games/grape:null,cherry:validCount(cherry)&&cherry?games/cherry:null};
  const modeLabel=[useBB?'BB契機':'',useRB?'RB契機':'',useGrape?'ぶどう':'',useCherry?'総チェリー':''].filter(Boolean).join('・');
  return {ok:true,modelId:MODEL.id,games,bb,rb,grape,cherry,bbCherry,rbCherry,settings,top:ranked[0],runnerUp:ranked[1],groups:{setting4Plus:mass(4),setting5Plus:mass(5),setting1To3:1-mass(4)},observed,effectiveMode,modeLabel:modeLabel?'BB/RB＋'+modeLabel:'BB/RBのみ',used:{grape:useGrape,bbTrigger:useBB,rbTrigger:useRB,cherry:useCherry},reason:notes.join(' '),
    warning:games<1000?'サンプルが少なく推測は非常に不安定です。':games<3000?'3000G未満のため推測結果の変動に注意してください。':'統計モデルによる相対的な推定です。実際の設定を保証しません。'};
}
const api=Object.freeze({MODEL,supportsMachine,estimate});
if(typeof module!=='undefined'&&module.exports)module.exports=api;
root.JissenhyoEstimator=api;
})(typeof globalThis!=='undefined'?globalThis:this);
