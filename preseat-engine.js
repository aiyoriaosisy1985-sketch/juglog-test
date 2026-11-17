/* Phase 3 v17 - pre-seat grape back-calculation (REFERENCE ONLY). */
(function(root){'use strict';
 const VERSION='v17-2026-10-11';
 const MODEL=Object.freeze({bet:3,grapePay:8,bbNet:240,rbNet:96,replayP:1/7.298,replayPay:3,cherryP:1/34.62,cherryPay:2});
 function isInt(n){return Number.isSafeInteger(n)}
 // Stage 15 reference-only modes, isolated from the legacy P31 estimate API.
 // OFF: all displayed games treated as 3BET; casual cherry pickup = 2/3.
 // ON: one 1BET entry game per bonus INCLUDED in total G; remaining games 3BET.
 // Bonus payout values are net approximations in both modes. 1BET prize/payback is
 // simplified, and the data-display counter's handling of 1BET is unverified.
 function estimateStage15(x){
  if(!x||!isInt(x.games)||x.games<1||!isInt(x.bb)||x.bb<0||!isInt(x.rb)||x.rb<0||x.bb+x.rb>x.games||!isInt(x.net)||!isInt(x.margin)||x.margin<0||x.margin>50000)return {ok:false,reason:'G数・BB・RB・差枚・読み取り誤差を正しく入力してください。'};
  if(!['hall','site'].includes(x.source))return {ok:false,reason:'取得元を選んでください。'};
  if(x.baseline!=='confirmed')return {ok:false,reason:'当日0枚基準か確認できないため算出できません。'};
  if(x.scope!=='confirmed')return {ok:false,reason:'差枚が当日のボーナス込みの増減であることを確認してください。'};
  const profile=(typeof root!=='undefined'&&root&&root.JGLStage15Profiles)?root.JGLStage15Profiles.get(x.machine):null;
  if(!profile)return {ok:false,reason:'機種を選択してください。'};
  if(!profile.enabled||!profile.model)return {ok:false,reason:profile.label+'は逆算定数の照合が未完了のため、算出を保留しています。'};
  const M=profile.model;
  const {games:g,bb,rb,net,margin}=x;
  const on=x.mode==='on';
  const bonusCount=bb+rb, oneBetGames=on?bonusCount:0;
  const normalGames=g-oneBetGames;
  if(normalGames<=0)return {ok:false,reason:'通常時G数を計算できません。総Gとボーナス回数を確認してください。'};
  const totalIn=normalGames*M.bet+oneBetGames;
  const bonus=bb*M.bbNet+rb*M.rbNet;
  // 1BET payouts use a reference approximation, not confirmed machine-specific values.
  const replay=normalGames*M.replayP*M.replayPay + oneBetGames*M.oneBetReplayP*M.oneBetReplayPay;
  const expectedOther=normalGames*M.cherryP*M.cherryPay*(on?1:2/3);
  // Stage15 C14: estimated normal-play bell/pierrot payout, not measured events.
  const bellPickup=on?M.cherryBellPickup:M.casualBellPickup;
  const pierrotPickup=on?M.cherryPierrotPickup:M.casualPierrotPickup;
  const bellExpected=normalGames*M.bellP*M.bellPay*bellPickup;
  const pierrotExpected=normalGames*M.pierrotP*M.pierrotPay*pierrotPickup;
  const nonGrapeRare=bellExpected+pierrotExpected;
  // Published 1BET role *probabilities* are analysis estimates, not manufacturer-certified.
  // Pickup payout for 1BET cherries is an explicitly tentative machine-specific proxy.
  const oneBetCherryPay=oneBetGames*M.oneBetCherryP*M.oneBetCherryPay*M.oneBetCherryPickup;
  // Expected 1BET grape payout is subtracted, NOT counted as a normal 3BET grape.
  const oneBetGrapePay=oneBetGames*M.oneBetGrapeP*M.oneBetGrapePay;
  const center=(totalIn+net-bonus-replay-expectedOther-nonGrapeRare-oneBetGrapePay-oneBetCherryPay)/M.grapePay;
  const replaySd=Math.hypot(M.replayPay*Math.sqrt(normalGames*M.replayP*(1-M.replayP)),M.oneBetReplayPay*Math.sqrt(oneBetGames*M.oneBetReplayP*(1-M.oneBetReplayP)));
  const cherrySd=M.cherryPay*Math.sqrt(normalGames*M.cherryP*(1-M.cherryP))*(on?1:2/3);
  // Rare small-role pickups have stochastic variation even with fixed model rates.
  const bellSd=M.bellPay*Math.sqrt(normalGames*M.bellP*bellPickup*(1-M.bellP*bellPickup));
  const pierrotSd=M.pierrotPay*Math.sqrt(normalGames*M.pierrotP*pierrotPickup*(1-M.pierrotP*pierrotPickup));
  const oneBetGrapeSd=M.oneBetGrapePay*Math.sqrt(oneBetGames*M.oneBetGrapeP*(1-M.oneBetGrapeP));
  const oneBetCherrySd=M.oneBetCherryPay*M.oneBetCherryPickup*Math.sqrt(oneBetGames*M.oneBetCherryP*(1-M.oneBetCherryP));
  // Sensitivity to random small-role outcomes; NOT a formal confidence interval.
  const stochastic=2*Math.hypot(replaySd,cherrySd,bellSd,pierrotSd,oneBetGrapeSd,oneBetCherrySd);
  // Exploratory 1BET-cherry payout scenarios (0..4 coins per hit) are
  // not confirmed physical bounds. Show their incremental model sensitivity
  // separately from the existing fluctuation/graph-reading range.
  const cherryEvents=oneBetGames*M.oneBetCherryP*M.oneBetCherryPickup;
  const cherryPayoutScenarios=[
   M.oneBetCherryPayScenarioMin, M.oneBetCherryPayScenarioMax
  ].map(pay=>oneBetCherryPay+cherryEvents*(pay-M.oneBetCherryPay));
  const oneBetCherryExtraLow=Math.max(...cherryPayoutScenarios)-oneBetCherryPay;
  const oneBetCherryExtraHigh=oneBetCherryPay-Math.min(...cherryPayoutScenarios);
  const low=(totalIn+net-margin-bonus-replay-expectedOther-nonGrapeRare-oneBetGrapePay-oneBetCherryPay-stochastic-oneBetCherryExtraLow)/M.grapePay;
  const high=(totalIn+net+margin-bonus-replay-expectedOther-nonGrapeRare-oneBetGrapePay-oneBetCherryPay+stochastic+oneBetCherryExtraHigh)/M.grapePay;
  if(!Number.isFinite(center)||center<=0||center>normalGames||high<=0||low>normalGames)return {ok:false,reason:'入力値がこの簡易払出モデルと整合しません。G数・差枚の基準・ボーナス込みの表示か確認してください。'};
  const boundedLow=Math.max(0,low),boundedHigh=Math.min(normalGames,high);
  return {ok:true,version:VERSION+'-stage15-c14',machineId:profile.id,machine:profile.label,modelReference:profile.reference,mode:x.mode,grapes:center,grapeRate:normalGames/center,
   minGrapes:boundedLow,maxGrapes:boundedHigh,
   rateLow:normalGames/boundedHigh,rateHigh:boundedLow>0?normalGames/boundedLow:null,
   games:g,normalGames,oneBetGames,net,margin,source:x.source,
   breakdown:{totalIn,bonus,replay,expectedOther,bellExpected,pierrotExpected,nonGrapeRare,bellPickup,pierrotPickup,oneBetGrapePay,oneBetCherryPay,stochastic,oneBetCherryExtraLow,oneBetCherryExtraHigh},oneBetCherrySensitivity:{minPay:M.oneBetCherryPayScenarioMin,maxPay:M.oneBetCherryPayScenarioMax,extraLowGrapes:oneBetCherryExtraLow/M.grapePay,extraHighGrapes:oneBetCherryExtraHigh/M.grapePay},
   warnings:[
    'これは参考値です。読み取り誤差と小役の出現変動（ベル・ピエロを含む）を反映した幅であり、統計的な信頼区間ではありません。',
    on?'ONはボーナス1回につき1BET・1G、そのGが表示総Gに含まれると仮定します。1BET時ぶどう1/10.29954・リプレイ1/7.298・チェリー1/256は解析予測値であり、1BETチェリーの獲得枚数は未確認で、中心値には機種別の暫定代用値を使用しています。参考幅には0〜4枚の仮定変更による感度も加味しています（確定した上下限ではありません）。':'OFFは総Gを全て3BETとして扱い、前任者は適当打ち・チェリー取得2/3と仮定します。',
    '通常時ベル・ピエロの取得を機種別の解析参考値で補正しています（ベル'+bellExpected.toFixed(1)+'枚、ピエロ'+pierrotExpected.toFixed(1)+'枚）。メーカー確定値ではなく、実際の打ち方・目押しで変動します。',
    profile.notice+' 成立後1BETの出現確率は6号機ジャグラー共通の解析予測値です。メーカー確定値ではなく、成立後のベル・ピエロ取得は補正していません。ボーナス約'+M.bbNet+'/'+M.rbNet+'枚・リプレイ約1/'+(1/M.replayP).toFixed(3)+'・チェリー約1/'+(1/M.cherryP).toFixed(2)+'を使用。1BET時のベル・ピエロ、ぶどう抜き、実際の打ち方、総G集計仕様の誤差は十分に評価できません。',
    '差枚・BB/RBから推定したぶどうを本人の実測値・設定推測へ自動反映しません。'
   ]};
 }
 function estimate(x){
  if(x&&(x.mode==='off'||x.mode==='on'))return estimateStage15(x);
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
