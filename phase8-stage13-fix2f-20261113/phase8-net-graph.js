/* Phase 8 read-only: plot recorded net medal observations only. No inferred trend. */
(function(root){'use strict';
function series(events){
 if(!Array.isArray(events))return [];
 let games=0;const points=[];
 for(const e of events){
  if(e.type==='GAMES_RECORDED'){
   if(!Number.isSafeInteger(e.delta)||e.delta<=0)return [];
   games+=e.delta;
  }else if(e.type==='NET_MEDALS_OBSERVED'&&Number.isSafeInteger(e.netMedals)){
   points.push({games,net:e.netMedals});
  }
 }
 return points;
}
function render(){
 const host=document.getElementById('p8-net-graph');if(!host)return;
 const frame=document.getElementById('p31-frame');let snap;
 try{snap=frame?.contentWindow?.__p8ViewsApi?.snapshot();}catch(_e){}
 host.replaceChildren();
 const title=document.createElement('h3');title.textContent='差枚の実測記録';host.append(title);
 const note=document.createElement('p');note.className='p8-net-note';
 if(!snap?.ok){note.textContent='実戦未選択です。';host.append(note);return;}
 const pts=series(snap.events);
 if(!pts.length){note.textContent='累計差枚の実測記録がありません。推定線は表示しません。';host.append(note);return;}
 const svg=document.createElementNS('http://www.w3.org/2000/svg','svg');svg.setAttribute('viewBox','0 0 320 194');svg.setAttribute('role','img');svg.setAttribute('aria-label','累計差枚の実測点。線による推測補間なし');
 const xs=pts.map(p=>p.games),ys=pts.map(p=>p.net);const xmin=Math.min(0,...xs),xmax=Math.max(xmin+1,...xs),ymin=Math.min(0,...ys),ymax=Math.max(1,...ys);
 const px=x=>32+(x-xmin)/(xmax-xmin)*272,py=y=>169-(y-ymin)/(ymax-ymin||1)*145;
 const add=(tag,attrs,txt)=>{const e=document.createElementNS('http://www.w3.org/2000/svg',tag);Object.entries(attrs).forEach(([k,v])=>e.setAttribute(k,String(v)));if(txt!=null)e.textContent=txt;svg.append(e);return e};
 add('line',{x1:32,y1:169,x2:306,y2:169,stroke:'currentColor',opacity:'.45'});
 if(ymin<=0&&ymax>=0)add('line',{x1:32,y1:py(0),x2:306,y2:py(0),stroke:'currentColor',opacity:'.23','stroke-dasharray':'3 3'});
 for(const p of pts)add('circle',{cx:px(p.games),cy:py(p.net),r:4,fill:'#e9ad57',stroke:'#fff','stroke-width':1.2});
 add('text',{x:34,y:186,fill:'currentColor','font-size':10},xmin+'G');add('text',{x:300,y:186,fill:'currentColor','text-anchor':'end','font-size':10},xmax+'G');
 add('text',{x:30,y:13,fill:'currentColor','font-size':10},'累計差枚（枚）');
 host.append(svg);note.textContent='実測 '+pts.length+'点／最終 '+pts.at(-1).net.toLocaleString('ja-JP')+'枚。ゲーム数は本人記録G。観測間は補間せず、ホール表示の総Gとも混同しません。';host.append(note);
}
root.P8NetGraph={series};
const container=document.getElementById('p8-graph-content');if(container){const area=document.createElement('section');area.id='p8-net-graph';container.insertAdjacentElement('afterend',area);let signature='';const update=()=>{let snap;try{snap=document.getElementById('p31-frame')?.contentWindow?.__p8ViewsApi?.snapshot()}catch(_e){}const sig=JSON.stringify(snap?.ok?{id:snap.session?.id,events:snap.events?.filter(e=>e.type==='NET_MEDALS_OBSERVED'||e.type==='GAMES_RECORDED')}:null);if(sig!==signature){signature=sig;render()}};setInterval(update,1400);update()}
})(typeof window!=='undefined'?window:globalThis);
