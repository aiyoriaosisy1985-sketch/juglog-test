/* Stage11 candidate: READ-ONLY estimated medal trajectory, never actual net or cash balance.
   Model is intentionally enabled only for explicitly mapped models whose assumptions have been reviewed.
   Unmeasured small roles and unknown machines must not silently produce a plausible-looking curve. */
(function(root){'use strict';
const MODELS=Object.freeze({
 'マイジャグラーV':{bb:240,rb:96,grape:8,cherry:1,replayDenom:7.298},
 'マイジャグラーⅤ':{bb:240,rb:96,grape:8,cherry:1,replayDenom:7.298},
 'マイジャグラーVI':{bb:240,rb:96,grape:8,cherry:1,replayDenom:7.298},
 'マイジャグラーⅥ':{bb:240,rb:96,grape:8,cherry:1,replayDenom:7.298},
 'ネオアイムジャグラーEX':{bb:252,rb:96,grape:8,cherry:1,replayDenom:7.298},
 'ファンキージャグラー2':{bb:240,rb:96,grape:8,cherry:1,replayDenom:7.298},
 'ゴーゴージャグラー3':{bb:240,rb:96,grape:8,cherry:1,replayDenom:7.298},
 'ミスタージャグラー':{bb:240,rb:96,grape:8,cherry:2,replayDenom:7.298},
 'ウルトラミラクルジャグラー':{bb:240,rb:96,grape:8,cherry:1,replayDenom:7.298},
 'ジャグラーガールズSS':{bb:240,rb:96,grape:8,cherry:1,replayDenom:7.298},
 'ハッピージャグラーVⅢ':{bb:240,rb:96,grape:8,cherry:2,replayDenom:7.298}
});
function build(snapshot){
 if(!snapshot?.ok||!snapshot.session||!Array.isArray(snapshot.events))return {ok:false,reason:'実戦記録を取得できません。'};
 const s=snapshot.session,model=MODELS[s.machine];
 if(!model)return {ok:false,reason:'この機種の推定差枚計算条件は未確認です。別機種の条件は流用しません。'};
 const allMeasured=Number.isSafeInteger(s.personalG)&&s.personalG>0&&s.hasUnmeasuredG===false&&s.measuredG===s.personalG;
 if(!allMeasured)return {ok:false,reason:'全ゲームの小役実測が確認できないため、推定差枚を表示しません。'};
 let games=0,net=0,grape=0,cherry=0,bb=0,rb=0,pendingGrape=0,pendingCherry=0,pending=0;
 const points=[{games:0,net:0}],awards=[];
 const reviewIds=new Set(snapshot.events.filter(e=>e.type==='BONUS_REVIEW_CONFIRMED'&&e.bonusId).map(e=>e.bonusId));
 const point=()=>{points.push({games,net:Math.round(net*10)/10});};
 for(const e of snapshot.events){
  if(e.type==='GRAPE_COUNTED'){grape++;pendingGrape++;}
  else if(e.type==='CHERRY_COUNTED'){cherry++;pendingCherry++;}
  else if(e.type==='GAMES_RECORDED'){
   if(!Number.isSafeInteger(e.delta)||e.delta<=0||e.measuredBoth!==true)return {ok:false,reason:'G数記録の実測条件を確認できません。'};
   games+=e.delta;
   net+=e.delta*(-3+3/model.replayDenom)+pendingGrape*model.grape+pendingCherry*model.cherry;
   pendingGrape=pendingCherry=0;point();
  }else if(e.type==='BONUS_AWARDED'&&(e.bonusType==='BB'||e.bonusType==='RB')){
   if(e.pendingReview&&!reviewIds.has(e.bonusId)){pending++;continue;}
   net+=model[e.bonusType.toLowerCase()];
   if(e.bonusType==='BB')bb++;else rb++;
   point();awards.push({games,type:e.bonusType,net:Math.round(net),currentG:Number.isSafeInteger(e.awardedAtCurrentG)?e.awardedAtCurrentG:null});
  }
 }
 if(pendingGrape||pendingCherry){net+=pendingGrape*model.grape+pendingCherry*model.cherry;point();}
 if(games!==s.personalG||bb!==s.bb||rb!==s.rb||grape!==s.grape||cherry!==s.cherry)return {ok:false,reason:'小役・ボーナスの記録と計算結果が一致しないため表示を停止しました。'};
 return {ok:true,machine:s.machine,games,net:Math.round(net),points,awards,bb,rb,grape,cherry,pending,assumptions:'通常時3枚掛け、ぶどう8枚、チェリー・BB・RBは機種別の暫定値、リプレイ平均1/7.298。未記録のベル・ピエロ等は未補正。ボーナス終了後の誤差も未反映。成立時点ではなく入力時点の曲線です。'};
}
function render(){
 const host=document.getElementById('p8-estimated-net');if(!host)return;
 let snap;try{snap=document.getElementById('p31-frame')?.contentWindow?.__p8ViewsApi?.snapshot();}catch(_){}
 const result=build(snap);host.replaceChildren();
 const heading=document.createElement('h2');heading.className='section-title';heading.textContent='推定差枚の推移';host.append(heading);
 const addText=(value,cls)=>{const p=document.createElement('p');p.textContent=value;if(cls)p.className=cls;host.append(p);return p;};
 if(!result.ok){addText(result.reason,'p8-net-note');return;}
 const summary=document.createElement('div');summary.className='p8-data-grid';summary.innerHTML='<div>本人G<strong></strong></div><div>推定差枚<strong></strong></div>';
 summary.querySelectorAll('strong')[0].textContent=result.games.toLocaleString('ja-JP')+'G';
 summary.querySelectorAll('strong')[1].textContent=(result.net>=0?'+':'')+result.net.toLocaleString('ja-JP')+'枚';host.append(summary);
 const svg=document.createElementNS('http://www.w3.org/2000/svg','svg');svg.setAttribute('viewBox','0 0 340 220');svg.setAttribute('role','img');svg.setAttribute('aria-label','本人ゲーム数を横軸とする推定差枚。実測差枚ではありません');
 const ys=result.points.map(p=>p.net), ymin=Math.min(0,...ys),ymax=Math.max(0,...ys),range=Math.max(100,ymax-ymin),lo=ymin-range*.08,hi=ymax+range*.08;
 const px=x=>42+(x/Math.max(1,result.games))*280,py=y=>178-(y-lo)/(hi-lo)*154;
 function el(tag,attrs,txt){const a=document.createElementNS('http://www.w3.org/2000/svg',tag);Object.entries(attrs).forEach(([k,v])=>a.setAttribute(k,String(v)));if(txt!==undefined)a.textContent=txt;svg.append(a);return a;}
 el('line',{x1:42,y1:py(0),x2:323,y2:py(0),stroke:'currentColor',opacity:'.65','stroke-dasharray':'4 4'});
 const displayPoints=[];for(const item of result.points){if(displayPoints.length&&displayPoints.at(-1).games===item.games){displayPoints[displayPoints.length-1]=item;}else displayPoints.push(item);}
 el('polyline',{points:displayPoints.map(p=>px(p.games).toFixed(1)+','+py(p.net).toFixed(1)).join(' '),fill:'none',stroke:'#50d7ad','stroke-width':2.5,'stroke-linecap':'round','stroke-linejoin':'round'});
 // Stage14: The actual recorded award events share the personal-G axis with the estimated net.
 for(const [i,a] of result.awards.entries()){
  const cx=px(a.games),cy=py(a.net),color=a.type==='BB'?'#fa7397':'#6acbff';
  const dot=el('circle',{cx,cy,r:5.5,fill:color,stroke:'#ffffff','stroke-width':1.2});
  const title=document.createElementNS('http://www.w3.org/2000/svg','title');title.textContent=`${a.type} 当選時${a.currentG===null?'G未設定':a.currentG+'G'}／本人累計${a.games}G`;dot.append(title);
  if(a.currentG!==null){
   const horizontal=Math.max(61,Math.min(304,cx));const vertical=Math.max(14,cy-12-(i%2)*14);
   el('text',{x:horizontal,y:vertical,'text-anchor':'middle','font-size':10,'font-weight':'bold',fill:color},a.type+' '+a.currentG+'G');
  }
 }
 const last=result.points.at(-1);el('circle',{cx:px(last.games),cy:py(last.net),r:4,fill:'#50d7ad'});
 for(const g of [0,Math.round(result.games/2),result.games])el('text',{x:px(g),y:199,'text-anchor':'middle','font-size':10,fill:'currentColor'},g.toLocaleString('ja-JP')+'G');
 for(const n of [ymin,ymax])el('text',{x:38,y:py(n)+3,'text-anchor':'end','font-size':10,fill:'currentColor'},Math.round(n).toLocaleString('ja-JP'));
 host.append(svg);
 const detail=document.createElement('p');detail.className='p8-net-note';detail.textContent='線は推定差枚（実測値ではありません）。ピンク＝BB、水色＝RB。各ラベルは当選時の台表示G、横軸は本人累計Gです。重なった点はラベルではなく点の詳細で確認してください。';host.append(detail);
 const assumptions=document.createElement('details');assumptions.className='p8-net-note';const summaryEl=document.createElement('summary');summaryEl.textContent='計算条件・制約を表示';const para=document.createElement('p');para.textContent=result.assumptions;assumptions.append(summaryEl,para);host.append(assumptions);
}
root.P8EstimatedNet=Object.freeze({build,models:MODELS});
if(typeof module!=='undefined'&&module.exports)module.exports={build,models:MODELS};
if(typeof document==='undefined')return;
const parent=document.getElementById('panel-graph');if(!parent)return;
const area=document.createElement('section');area.id='p8-estimated-net';area.className='section-card';const old=parent.querySelector('.section-card');parent.insertBefore(area,old);
let prev='';function update(){let snap;try{snap=document.getElementById('p31-frame')?.contentWindow?.__p8ViewsApi?.snapshot()}catch(_){}const sig=JSON.stringify(snap);if(sig!==prev){prev=sig;render();}}
setInterval(update,1400);update();
})(typeof window!=='undefined'?window:globalThis);
