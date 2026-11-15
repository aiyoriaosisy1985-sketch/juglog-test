/* Stage12 read-only bonus-position timeline. Source: effective P31 event projection. */
(function(root){'use strict';
function build(snapshot){
 if(!snapshot?.ok||!Array.isArray(snapshot.events)||!snapshot.session)return {ok:false,reason:'実戦を選択してください。'};
 const ev=snapshot.events,confirmed=new Set(ev.filter(e=>e.type==='BONUS_REVIEW_CONFIRMED'&&e.bonusId).map(e=>e.bonusId));
 let games=0,bb=0,rb=0,pending=0;const awards=[];
 for(const e of ev){
  if(e.type==='GAMES_RECORDED'){
   if(!Number.isSafeInteger(e.delta)||e.delta<=0||!Number.isSafeInteger(games+e.delta))return {ok:false,reason:'G数の記録に不整合があります。'};
   games+=e.delta;
  }else if(e.type==='BONUS_AWARDED'&&(e.bonusType==='BB'||e.bonusType==='RB')){
   if(e.pendingReview&&(!e.bonusId||!confirmed.has(e.bonusId))){pending++;continue;}
   awards.push({games,type:e.bonusType,currentG:Number.isSafeInteger(e.awardedAtCurrentG)?e.awardedAtCurrentG:null});if(e.bonusType==='BB')bb++;else rb++;
  }
 }
 if(games!==snapshot.session.personalG||bb!==snapshot.session.bb||rb!==snapshot.session.rb)return {ok:false,reason:'保存済みのG数・当選件数と一致しないため、表示を停止しました。'};
 return {ok:true,games,awards,bb,rb,pending};
}
root.Stage12BonusTimeline=Object.freeze({build});
if(typeof module!=='undefined'&&module.exports)module.exports={build};
if(typeof document==='undefined')return;
const panel=document.getElementById('panel-graph');if(!panel)return;
const area=document.createElement('section');area.className='section-card stage12-timeline';area.id='stage12-bonus-timeline';
const old=panel.querySelector('.section-card');if(old)old.insertAdjacentElement('afterend',area);else panel.append(area);
const ns='http://www.w3.org/2000/svg';
function render(snap){
 const result=build(snap);const integrated=!!root.P8EstimatedNet?.build(snap)?.ok;area.hidden=integrated;if(integrated)return;area.replaceChildren();
 const h=document.createElement('h2');h.className='section-title';h.textContent='BB・RB当選タイムライン';area.append(h);
 if(!result.ok){const p=document.createElement('p');p.className='muted';p.textContent=result.reason;area.append(p);return;}
 const summary=document.createElement('p');summary.className='stage12-timeline-summary';summary.textContent=`本人 ${result.games.toLocaleString('ja-JP')}G ／ BB ${result.bb}回 ／ RB ${result.rb}回`;area.append(summary);
 if(!result.awards.length){const p=document.createElement('p');p.className='muted';p.textContent='確定したボーナスはまだありません。';area.append(p);return;}
 const svg=document.createElementNS(ns,'svg');svg.setAttribute('viewBox','0 0 340 134');svg.setAttribute('role','img');svg.setAttribute('aria-label','本人記録Gに沿ったBBとRBの当選位置（G数記録単位の近似）');
 const add=(tag,attr,label)=>{const a=document.createElementNS(ns,tag);for(const [key,val] of Object.entries(attr))a.setAttribute(key,String(val));if(label!==undefined)a.textContent=label;svg.append(a);return a;};
 const x=g=>40+Math.max(0,Math.min(1,g/Math.max(1,result.games)))*279;
 for(const [name,y,color] of [['BB',41,'#fa7397'],['RB',81,'#6acbff']]){
  add('text',{x:5,y:y+4,fill:'currentColor','font-size':12},name);
  add('line',{x1:40,y1:y,x2:319,y2:y,stroke:'currentColor',opacity:'.26','stroke-width':1});
  for(const [idx,a] of result.awards.filter(a=>a.type===name).entries()){
    const cx=x(a.games),circle=add('circle',{cx,cy:y,r:5,fill:color,stroke:'currentColor','stroke-width':'.5'});
    const title=document.createElementNS(ns,'title');title.textContent=`${name} 当選時${a.currentG===null?'G未設定':a.currentG+'G'}／本人累計${a.games}G`;circle.append(title);
    if(a.currentG!==null){const pos=Math.max(47,Math.min(309,cx));add('text',{x:pos,y:y-10-(idx%2)*13,fill:'currentColor','font-size':11,'font-weight':'bold','text-anchor':'middle'},a.currentG+'G');}
   }
 }
 for(const g of [0,Math.round(result.games/2),result.games])add('text',{x:x(g),y:116,fill:'currentColor','font-size':10,'text-anchor':'middle'},g.toLocaleString('ja-JP')+'G');
 area.append(svg);
 const n=document.createElement('p');n.className='muted';n.textContent='横軸：本人記録G。ボーナスの位置はG数を記録した時点での近似値です。正確な当選Gを保証しません。'+(result.pending?` 未確定${result.pending}件は除外。`:'');area.append(n);
 const details=document.createElement('details');details.className='stage12-timeline-details';const button=document.createElement('summary');button.textContent='当選位置の一覧';details.append(button);
 const list=document.createElement('ol');for(const a of result.awards){const item=document.createElement('li');item.textContent=a.type+' 当選時 '+(a.currentG===null?'G未設定':a.currentG+'G')+'（本人累計 '+a.games.toLocaleString('ja-JP')+'G付近）';list.append(item);}details.append(list);area.append(details);
}
let last='';function update(){let snap;try{snap=document.getElementById('p31-frame')?.contentWindow?.__p8ViewsApi?.snapshot()}catch(_e){}const sign=JSON.stringify(snap??null);if(sign!==last){last=sign;render(snap);}}
setInterval(update,1400);update();
})(typeof window!=='undefined'?window:globalThis);
