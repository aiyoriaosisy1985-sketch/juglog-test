/* Phase 8 read-only optional small-role likelihood, My Juggler V only.
   Sources: manufacturer BB/RB denominators; attributed secondary reports of Galizou small roles.
   No access to storage or live P31 state. */
(function(root){'use strict';
const BONUS=Object.freeze({
 'myjuggler-v':Object.freeze([[273.1,409.6],[270.8,385.5],[266.4,336.1],[254,290],[240.1,268.6],[229.1,229.1]])
});
function valid(n){return Number.isSafeInteger(n)&&n>=0;}
function format(logs){const m=Math.max(...logs),ws=logs.map(v=>Math.exp(v-m)),sum=ws.reduce((a,b)=>a+b,0);const ps=ws.map(v=>v/sum),ints=ps.map(p=>Math.floor(p*1000));let rem=1000-ints.reduce((a,b)=>a+b,0);const order=ps.map((p,i)=>({i,frac:p*1000-ints[i]})).sort((a,b)=>b.frac-a.frac||a.i-b.i);for(let j=0;j<rem;j++)ints[order[j].i]++;return ps.map((p,i)=>({setting:i+1,probability:p,percent:ints[i]/10}));}
function estimate(input={}){
 const {machine,games,bb,rb,grape,measuredG,hasUnmeasuredG,cherryEvidence}=input;
 const reference=root.P8SmallRoleRegistry?.get(machine);
 if(!reference)return {ok:false,reason:'出典管理済みの小役参考値がない機種です。'};
 if(reference.enabled===false)return {ok:false,reason:reference.notice,reference:{status:reference.status,notice:reference.notice}};
 const model=root.P8MachineEstimator?.models?.[machine];
 if(!model||!Array.isArray(model.rows)||model.rows.length!==6)return {ok:false,reason:'対応機種のBB・RB確率テーブルが取得できません。'};
 const DATA=model.rows.map((b,i)=>({...b,...reference.grapeAndCherry[i]}));
 if(!valid(games)||games===0||!valid(bb)||!valid(rb)||bb+rb>games)return {ok:false,reason:'ゲーム数またはボーナス件数が不正です。'};
 const measured=valid(measuredG)&&measuredG===games&&hasUnmeasuredG===false;
 const useGrape=measured&&DATA.every(r=>Number.isFinite(r.grape)&&r.grape>1)&&valid(grape)&&grape+bb+rb<=games;
 // Cherry requires explicit provenance, NOT inferable from old saved aggregate counts.
 const c=cherryEvidence;
 const useCherry=DATA.every(r=>Number.isFinite(r.cherry)&&r.cherry>1)&&measured&&c?.mode==='nonoverlap-direct'&&c?.semanticsConfirmed===true&&c?.bonusOverlapSeparationConfirmed===true&&valid(c.count)&&c.count+bb+rb+(useGrape?grape:0)<=games;
 const counts=[bb,rb,...(useGrape?[grape]:[]),...(useCherry?[c.count]:[])];
 const logs=DATA.map(r=>{const probs=[1/r.bb,1/r.rb,...(useGrape?[1/r.grape]:[]),...(useCherry?[1/r.cherry]:[])];const n=games-counts.reduce((a,b)=>a+b,0),p=1-probs.reduce((a,b)=>a+b,0);if(n<0||p<=0)return NaN;return counts.reduce((a,v,i)=>a+(v?v*Math.log(probs[i]):0),0)+(n?n*Math.log(p):0);});
 if(logs.some(n=>!Number.isFinite(n)))return {ok:false,reason:'集計と確率モデルが一致しません。'};
 return {ok:true,settings:format(logs),used:{bb:true,rb:true,grape:useGrape,cherry:useCherry},notes:[useGrape?'ぶどう：全ゲーム実測・参考値を適用':'ぶどう：全ゲーム実測未確認などのため対象外',useCherry?'非重複チェリー：記録方式を確認し参考値を適用':'非重複チェリー：記録定義を保証できないため対象外'],sources:{bonus:'機種別BB/RBテーブル（別途正確性監査が必要）',smallRoles:reference.sourceName},reference:{status:reference.status,referenceMachine:reference.referenceMachine,notice:reference.notice,primarySourceVerified:reference.primarySourceVerified}};
}
const api=Object.freeze({estimate});if(typeof module!=='undefined'&&module.exports)module.exports=api;root.P8SmallRoleEstimator=api;
})(typeof globalThis!=='undefined'?globalThis:this);
