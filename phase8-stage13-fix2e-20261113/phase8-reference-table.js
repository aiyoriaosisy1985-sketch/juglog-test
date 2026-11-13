/* Stage13 Fix2e: browse-only references. General cherry reference is not used for inference. */
(function(root){'use strict';
function init(){
 const select=document.getElementById('p8-ref-machine');
 const rowsEl=document.getElementById('p8-ref-rows');
 const noteEl=document.getElementById('p8-ref-notice');
 const sourceEl=document.getElementById('p8-ref-source');
 if(!select||!rowsEl||!noteEl||!sourceEl)return;
 const machines=root.P8MachineEstimator?.models;
 const refs=root.JGLStage13References;
 if(!machines||!refs){noteEl.textContent='機種データを読み込めませんでした。';return;}
 for(const [id,m] of Object.entries(machines)){
  const option=document.createElement('option');option.value=id;option.textContent=m.label;select.appendChild(option);
 }
 function cell(tr,value){const el=document.createElement('td');el.textContent=value;tr.appendChild(el);}
 const fmt=(v)=>Number.isFinite(v)&&v>1?'1/'+Number(v).toFixed(3).replace(/0+$/,'').replace(/\.$/,''):'—';
 function render(){
  const model=machines[select.value];if(!model)return;
  const ref=refs.get(select.value);
  const grape=Array.isArray(ref?.grape)&&ref.grape.length===6?ref.grape:null;
  const cherry=Array.isArray(ref?.nonOverlapCherry)&&ref.nonOverlapCherry.length===6?ref.nonOverlapCherry:null;
  rowsEl.replaceChildren();
  model.rows.forEach((r,i)=>{
   const tr=document.createElement('tr');const th=document.createElement('th');th.scope='row';th.textContent=String(r.setting);tr.appendChild(th);
   cell(tr,fmt(r.bb));cell(tr,fmt(r.rb));cell(tr,grape?fmt(grape[i]):'—');cell(tr,cherry?fmt(cherry[i]):'—');rowsEl.appendChild(tr);
  });
  noteEl.textContent=!ref?'この機種の小役参考値は未登録です。':
   !cherry?'非重複チェリー：—（ガリぞう氏の機種別・非重複値を未確認）。設定推測には使用しません。':
   ref.status==='borrowed-myjuggler-v'?'非重複チェリーはガリぞう氏のマイジャグラーⅤの数値をⅥへ暫定流用しています。Ⅵ独自値ではありません。':
   '非重複チェリーはガリぞう氏の独自調査値です。メーカー公表値ではありません。';
  sourceEl.replaceChildren();
  const bb=document.createElement('span');bb.textContent='BB・RB：北電子の機種別掲載値（公表値）';sourceEl.appendChild(bb);
  if(model.source&&/^https:\/\//.test(model.source)){
   sourceEl.appendChild(document.createTextNode(' '));const a=document.createElement('a');a.href=model.source;a.target='_blank';a.rel='noopener noreferrer';a.textContent='メーカー資料';sourceEl.appendChild(a);
  }
  if(grape){sourceEl.appendChild(document.createTextNode(' ／ ぶどう：既存採用参考値（変更なし）'));}
  if(cherry){sourceEl.appendChild(document.createTextNode(' ／ 非重複チェリー：'+(ref.cherryBasis||'ガリぞう氏の独自調査値'))); if(ref.cherrySource && /^https:\/\//.test(ref.cherrySource)){const a=document.createElement('a');a.href=ref.cherrySource;a.target='_blank';a.rel='noopener noreferrer';a.textContent=' 出典';sourceEl.appendChild(a);}}
  if(ref.generalCherry && ref.generalCherry.length===6){
    sourceEl.appendChild(document.createTextNode(' ／ '+ref.generalCherryLabel+'：'+ref.generalCherry.map((v,i)=>'設定'+(i+1)+' '+fmt(v)).join('、')+'（設定推測には不使用）'));
    if(ref.generalCherrySource && /^https:\/\//.test(ref.generalCherrySource)){const a=document.createElement('a');a.href=ref.generalCherrySource;a.target='_blank';a.rel='noopener noreferrer';a.textContent=' 参考出典';sourceEl.appendChild(a);}
  }
 }
 select.addEventListener('change',render);render();
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});else init();
})(typeof globalThis!=='undefined'?globalThis:this);
