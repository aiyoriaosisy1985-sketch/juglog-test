/* Phase 8 browse-only probability table. No writes, no data-store dependencies. */
(function(root){'use strict';
function init(){
 const select=document.getElementById('p8-ref-machine');
 const rowsEl=document.getElementById('p8-ref-rows');
 const noteEl=document.getElementById('p8-ref-notice');
 const sourceEl=document.getElementById('p8-ref-source');
 if(!select||!rowsEl||!noteEl||!sourceEl)return;
 const models=root.P8MachineEstimator?.models;
 const refs=root.P8SmallRoleRegistry;
 if(!models){noteEl.textContent='機種データを読み込めませんでした。';return;}
 const ids=Object.keys(models);
 for(const id of ids){const option=document.createElement('option');option.value=id;option.textContent=models[id].label;select.appendChild(option);}
 function cell(tr,textValue){const el=document.createElement('td');el.textContent=textValue;tr.appendChild(el);}
 const fmt=(v)=>Number.isFinite(v)&&v>1?'1/'+Number(v).toFixed(2).replace(/0+$/,'').replace(/\.$/,''):'—';
 function render(){
  const model=models[select.value];if(!model)return;
  const ref=refs?.get?.(select.value);
  const usable=ref&&ref.enabled!==false&&Array.isArray(ref.grapeAndCherry)&&ref.grapeAndCherry.length===6;
  rowsEl.replaceChildren();
  model.rows.forEach((r,i)=>{const tr=document.createElement('tr'); const th=document.createElement('th');th.scope='row';th.textContent=String(r.setting);tr.appendChild(th);cell(tr,fmt(r.bb));cell(tr,fmt(r.rb));cell(tr,usable?fmt(ref.grapeAndCherry[i].grape):'—');cell(tr,usable?fmt(ref.grapeAndCherry[i].cherry):'—');rowsEl.appendChild(tr);});
  noteEl.textContent=usable?(ref.notice||'小役は参考推定値です。'):(ref?.notice||'この機種の小役参考値は未確認のため掲載していません。');
  sourceEl.replaceChildren();
  const bb=document.createElement('span');bb.textContent='BB・RB：北電子の機種別掲載値（公表値）';sourceEl.appendChild(bb);
  if(model.source&&/^https:\/\//.test(model.source)){sourceEl.appendChild(document.createTextNode(' '));const a=document.createElement('a');a.href=model.source;a.target='_blank';a.rel='noopener noreferrer';a.textContent='メーカー資料';sourceEl.appendChild(a);}
  if(usable){sourceEl.appendChild(document.createTextNode(' ／ 小役：'+ref.sourceName+'（'+(ref.primarySourceVerified?'原資料確認済み':'原著未照合の参考値')+'）'));if(ref.sourceUrl&&/^https:\/\//.test(ref.sourceUrl)){sourceEl.appendChild(document.createTextNode(' '));const a=document.createElement('a');a.href=ref.sourceUrl;a.target='_blank';a.rel='noopener noreferrer';a.textContent='小役資料';sourceEl.appendChild(a);}}
 }
 select.addEventListener('change',render);render();
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});else init();
})(typeof globalThis!=='undefined'?globalThis:this);
