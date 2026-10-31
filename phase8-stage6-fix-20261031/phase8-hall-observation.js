(()=>{'use strict';
const form=document.getElementById('p8-hall-form'),status=document.getElementById('p8-hall-status'),frame=document.getElementById('p31-frame');if(!form||!frame)return;
let pending=false;
const say=t=>{status.textContent=t;};
form.addEventListener('submit',async ev=>{
 ev.preventDefault();if(pending)return;
 const api=frame.contentWindow?.__p8HallApi;
 if(!api||!api.state().ready){say('P31の入力権限・実戦選択・未照合操作を確認してください。');return;}
 const snapshot={};for(const k of ['totalG','currentG','bb','rb']){
  const raw=String(form.elements.namedItem(k)?.value??'').trim();if(raw===''){snapshot[k]=null;continue;}
  if(!/^\d+$/.test(raw)||!Number.isSafeInteger(Number(raw))){say('0以上の整数を入力してください。');return;}snapshot[k]=Number(raw);
 }
 if(Object.values(snapshot).every(v=>v===null)){say('1項目以上入力してください。');return;}
 if(snapshot.totalG!==null&&snapshot.bb!==null&&snapshot.rb!==null&&snapshot.bb+snapshot.rb>snapshot.totalG){say('BB・RB合計が累計Gを超えています。');return;}
 if(!window.confirm(`ホール累計値を保存しますか？\n総G：${snapshot.totalG??'未入力'} / 現在G：${snapshot.currentG??'未入力'}\nBB：${snapshot.bb??'未入力'} / RB：${snapshot.rb??'未入力'}`))return;
 pending=true;const btn=form.querySelector('[type=submit]');btn.disabled=true;say('保存結果を確認中…');
 try{const result=await api.save(snapshot);if(result?.status==='saved-and-refreshed'){say('ホール観測値を保存しました。');form.reset();}else if(result?.status==='rejected')say('保存されませんでした：'+(result.reason||'保存権限を確認してください'));else say('保存結果を確定できません。再入力せず保存履歴を確認してください。');}
 catch(_e){say('保存結果を確認できません。再入力せず保存履歴を確認してください。');}
 finally{pending=false;btn.disabled=false;}
});})();