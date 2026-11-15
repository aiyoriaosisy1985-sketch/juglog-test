/* Phase 3 v17 - pre-seat grape back-calculation (REFERENCE ONLY). */
(function(root){'use strict';
 const VERSION='v17-2026-10-11';
 const MODEL=Object.freeze({bet:3,grapePay:8,bbNet:240,rbNet:96,replayP:1/7.298,replayPay:3,cherryP:1/34.62,cherryPay:2});
 function isInt(n){return Number.isSafeInteger(n)}
 function estimate(x){
  if(!x||!isInt(x.games)||x.games<1||!isInt(x.bb)||x.bb<0||!isInt(x.rb)||x.rb<0||x.bb+x.rb>x.games||!isInt(x.net)||!isInt(x.margin)||x.margin<0||x.margin>50000)return {ok:false,reason:'G数・BB・RB・差枚・読み取り誤差を正しく入力してください。'};
  if(!['hall','site'].includes(x.source))return {ok:false,reason:'取得元を選んでください。'};
  if(x.baseline!=='confirmed')return {ok:false,reason:'当日0枚基準か確認できないため算出できません。'};
  if(x.scope!=='confirmed')return {ok:false,reason:'差枚が当日のボーナス込みの増減であることを確認してください。'};
  if(!['unknown','cherry','casual'].includes(x.playStyle))return {ok:false,reason:'前任者の打ち方を選んでください。'};
  const {games:g,bb,rb,net,margin}=x;
  const totalIn=MODEL.bet*g;
  const bonus=bb*MODEL.bbNet+rb*MODEL.rbNet;
  const replay=g*MODEL.replayP*MODEL.replayPay;
  const cherryPerG=MODEL.cherryP*MODEL.cherryPay;
  // 'unknown': non-grape payouts span 0..cherry and occasional bell/pierrot payout;
  // intentionally wide; not a statistical confidence interval.
  const cherryFactors=x.playStyle==='cherry'?[1]:x.playStyle==='casual'?[2/3]:[0,1];
  const extraUpper=x.playStyle==='unknown'?g*(14+10)/1024:0;
  const expectedOther=cherryPerG*g*(x.playStyle==='cherry'?1:x.playStyle==='casual'?2/3:0.5);
  const center=(totalIn+net-bonus-replay-expectedOther)/MODEL.grapePay;
  const replaySd=MODEL.replayPay*Math.sqrt(g*MODEL.replayP*(1-MODEL.replayP));
  const cherrySd=MODEL.cherryPay*Math.sqrt(g*MODEL.cherryP*(1-MODEL.cherryP));
  const stochastic=2*Math.hypot(replaySd,cherrySd); // approx 2 SD of these two roles only
  const otherLow=Math.min(...cherryFactors)*cherryPerG*g;
  const otherHigh=Math.max(...cherryFactors)*cherryPerG*g+extraUpper;
  const low=(totalIn+net-margin-bonus-replay-otherHigh-stochastic)/MODEL.grapePay;
  const high=(totalIn+net+margin-bonus-replay-otherLow+stochastic)/MODEL.grapePay;
  if(!Number.isFinite(center)||center<=0||center>g||high<=0||low>g)return {ok:false,reason:'入力値がこの簡易払出モデルと整合しません。G数・差枚の基準・ボーナス込みの表示か確認してください。'};
  const boundedLow=Math.max(0,low),boundedHigh=Math.min(g,high);
  const plausibleCenter=Math.max(0,Math.min(g,center));
  return {ok:true,version:VERSION,grapes:plausibleCenter,grapeRate:g/plausibleCenter,
   minGrapes:boundedLow,maxGrapes:boundedHigh,
   // reciprocal: more grapes means smaller denominator
   rateLow:g/boundedHigh,rateHigh:boundedLow>0?g/boundedLow:null,
   games:g,net,margin,source:x.source,playStyle:x.playStyle,
   breakdown:{totalIn,bonus,replay,expectedOther,stochastic},
   warnings:['目視誤差・リプレイ/チェリーの統計的なブレを加味した参考幅です。信頼区間ではありません。','ボーナス獲得枚数の個体差、実際の打ち方、ベル・ピエロの取得、データ表示機の集計仕様による誤差は十分に評価できません。','BB/RB・差枚から逆算したぶどうを独立した実測値として設定推測に加算しません。']};
 }
 const api={estimate,MODEL,VERSION};if(typeof module!=='undefined'&&module.exports)module.exports=api;if(root)root.JissenhyoPreseat=api;
})(typeof window!=='undefined'?window:null);
