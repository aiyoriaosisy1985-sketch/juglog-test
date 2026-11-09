/* Stage12: presentation-only input feedback and text-size preference. */
(()=>{
 const root=document.documentElement;
 let pulseTimer=null;
 const overlay=document.createElement('div');overlay.id='stage12-flash';overlay.setAttribute('aria-hidden','true');document.body.append(overlay);
 const colors={grape:'rgba(116,214,130,.23)',cherry:'rgba(245,132,177,.24)',BB:'rgba(235,101,107,.22)',RB:'rgba(97,162,255,.23)'};
 let enabled=true;
 try{enabled=localStorage.getItem('juglog_stage12_flash')!=='off';}catch(_e){}
 window.__stage12Flash=(kind)=>{
  if(!enabled||!colors[kind]||window.matchMedia?.('(prefers-reduced-motion: reduce)').matches)return;
  overlay.style.background=colors[kind];overlay.classList.remove('stage12-active');
  void overlay.offsetWidth;overlay.classList.add('stage12-active');
  if(pulseTimer)clearTimeout(pulseTimer);
  pulseTimer=setTimeout(()=>overlay.classList.remove('stage12-active'),(kind==='BB'||kind==='RB')?420:220);
 };
 const settings=document.querySelector('#panel-settings .section-card');
 if(!settings)return;
 const row=document.createElement('div');row.className='settings-row';
 row.innerHTML='<div>入力時に画面を光らせる<span class="setting-desc">小役・BB・RBを記録できたときに、淡い色で一瞬お知らせします。</span></div><input type="checkbox" id="stage12-flash-toggle" style="width:22px;height:22px;flex:none;accent-color:#64c99b" aria-label="入力時の発光">';
 settings.append(row);
 const toggle=row.querySelector('input');toggle.checked=enabled;
 toggle.addEventListener('change',()=>{enabled=toggle.checked;try{localStorage.setItem('juglog_stage12_flash',enabled?'on':'off');}catch(_e){}});
 const fontRow=document.createElement('div');fontRow.className='settings-row';
 fontRow.innerHTML='<div>文字サイズ<span class="setting-desc">画面全体の文字を調整します。ボタンの押せる範囲は維持します。</span></div><select id="stage12-font-size" aria-label="文字サイズ"><option value="small">小さめ</option><option value="normal">標準</option><option value="large">大きめ</option></select>';
 settings.append(fontRow);
 const picker=fontRow.querySelector('select');let initial='normal';
 try{initial=localStorage.getItem('juglog_stage12_font')||'normal';}catch(_e){}
 if(!['small','normal','large'].includes(initial))initial='normal';
 picker.value=initial;root.dataset.stage12Font=initial;
 picker.addEventListener('change',()=>{root.dataset.stage12Font=picker.value;try{localStorage.setItem('juglog_stage12_font',picker.value)}catch(_e){}});
})();
