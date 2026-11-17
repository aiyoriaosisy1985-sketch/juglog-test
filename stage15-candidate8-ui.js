/* Stage15 Candidate8 UI pilot. No modification to existing save engine. */
(()=>{'use strict';
 const $=id=>document.getElementById(id);
 const field=$('p8-games'),dialog=$('jgl15-keypad-dialog'),open=$('jgl15-keypad-open'),display=$('jgl15-keypad-value');
 if(!field||!dialog||!open||!display)return;
 let draft='';
 function render(){display.textContent=draft||'—'}
 open.addEventListener('click',()=>{draft=field.value||'';render();if(typeof dialog.showModal==='function')dialog.showModal();});
 dialog.querySelectorAll('[data-jgl15-digit]').forEach(button=>button.addEventListener('click',()=>{
 const digit=button.dataset.jgl15Digit;
 if(digit==='C')draft='';else if(digit==='⌫')draft=draft.slice(0,-1);else if(draft.length<7)draft+=digit;
 render();
 }));
 $('jgl15-keypad-cancel').addEventListener('click',()=>dialog.close());
 $('jgl15-keypad-apply').addEventListener('click',()=>{
 field.value=draft;field.dispatchEvent(new Event('input',{bubbles:true}));field.dispatchEvent(new Event('change',{bubbles:true}));dialog.close();
 });
 const launch=$('jgl15-grape-open'),panel=$('jgl15-grape-panel');
 launch.addEventListener('click',()=>{
 panel.hidden=false;launch.setAttribute('aria-expanded','true');requestAnimationFrame(()=>panel.scrollIntoView({behavior:'smooth',block:'start'}));
 });
 const calc=$('jgl15-sim-calc'),result=$('jgl15-sim-result');
 const machine=$('jgl15-machine'),machineNote=$('jgl15-machine-note');
 const registry=window.JGLStage15Profiles;
 if(!machine||!machineNote||!registry){result.textContent='機種別計算データを読み込めません。';return;}
 for(const p of Object.values(registry.profiles)){
  const opt=document.createElement('option');opt.value=p.id;opt.textContent=p.label+(p.enabled?'':'（算出保留）');machine.appendChild(opt);
 }
 machine.value='myjuggler-v';
 let mode='off', hasCalculated=false;
 function machineChanged(){const p=registry.get(machine.value);machineNote.textContent=p?p.reference+'。'+p.notice:'機種を選択してください。';if(hasCalculated)calculate();}
 machine.addEventListener('change',machineChanged);

 const modeOff=$('jgl15-cherry-off'),modeOn=$('jgl15-cherry-on'),modeNote=$('jgl15-mode-note');
 machineChanged();
 function setMode(next){
  mode=next;
  modeOff.classList.toggle('is-selected',mode==='off');modeOn.classList.toggle('is-selected',mode==='on');
  modeOff.setAttribute('aria-pressed',String(mode==='off'));modeOn.setAttribute('aria-pressed',String(mode==='on'));
  modeNote.textContent=mode==='on'?'ON：通常時チェリー狙い・3枚掛け。成立後は1BET・平均1G/ボーナス、かつそのGを表示総Gに含むと仮定。ぶどう抜き補正なし。':'OFF：通常時適当打ち・全G3枚掛け換算。ボーナス成立後の1枚掛けは補正しません。';
  if(hasCalculated)calculate();
 }
 modeOff.addEventListener('click',()=>setMode('off'));
 modeOn.addEventListener('click',()=>setMode('on'));
 function integer(id){const raw=$(id).value.trim();if(!/^-?\d+$/.test(raw))throw Error('G数・BB・RB・差枚を整数で入力してください');const n=Number(raw);if(!Number.isSafeInteger(n))throw Error('入力値が大きすぎます');return n}
 function showError(message){result.replaceChildren();const label=document.createElement('p');label.className='jgl15-result-error';label.textContent=message;result.append(label)}
 function calculate(){
  try{
   const data={machine:machine.value,games:integer('jgl15-total'),bb:integer('jgl15-bb'),rb:integer('jgl15-rb'),net:integer('jgl15-net'),margin:Number($('jgl15-margin').value),source:$('jgl15-source').value,mode,baseline:$('jgl15-baseline').checked?'confirmed':'unknown',scope:$('jgl15-scope').checked?'confirmed':'unknown'};
   const engine=window.JissenhyoPreseat;if(!engine)throw Error('計算エンジンを読み込めません');
   const out=engine.estimate(data);if(!out.ok){showError('算出不可：'+out.reason);return}
   const machineProfile=registry.get(machine.value);
   const card=document.createElement('div');card.className='jgl15-result-card';card.setAttribute('role','group');card.setAttribute('aria-label','ぶどう参考逆算結果');
   const heading=document.createElement('div');heading.className='jgl15-result-label';heading.textContent='推定ぶどう確率（参考値）';
   const probability=document.createElement('strong');probability.className='jgl15-result-rate';probability.textContent='1/'+out.grapeRate.toFixed(2);
   const count=document.createElement('div');count.className='jgl15-result-count';count.textContent='約'+Math.round(out.grapes).toLocaleString('ja-JP')+'回';
   const range=document.createElement('div');range.className='jgl15-result-range';range.textContent='参考幅：1/'+out.rateLow.toFixed(2)+'〜'+(out.rateHigh===null?'上限不明':'1/'+out.rateHigh.toFixed(2));
   card.append(heading,probability,count,range);
   const detail=document.createElement('p');detail.className='jgl15-result-detail';
   detail.textContent=out.machine+'（'+out.modelReference+'）｜'+(mode==='on'?'チェリーON（成立後1BET仮定）':'チェリーOFF（全G3BET換算）')+'。'+(mode==='on'?'通常時G：'+out.normalGames.toLocaleString('ja-JP')+'G。':'')+'実測値ではなく参考値です。'+(machineProfile?.notice||'');
   result.replaceChildren(card,detail);
  }catch(e){showError('入力エラー：'+e.message)}
 }
 calc.addEventListener('click',()=>{hasCalculated=true;calculate()});
 for(const id of ['jgl15-total','jgl15-bb','jgl15-rb','jgl15-net','jgl15-margin','jgl15-source','jgl15-baseline','jgl15-scope'])$(id).addEventListener('input',()=>{if(hasCalculated)calculate()});
})();
