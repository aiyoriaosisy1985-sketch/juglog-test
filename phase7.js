(() => {
'use strict';
const output=document.getElementById('p7-result');
const check=async()=>{
 const data={title:'ジャグログ Phase 7 検証',time:new Date().toISOString(),viewport:`${innerWidth} × ${innerHeight}`,secureContext:isSecureContext,HTTPS:location.protocol==='https:',origin:location.origin,standalone:matchMedia('(display-mode: standalone)').matches,IDBAvailable:!!window.indexedDB,cryptoSHA256:!!(window.crypto&&window.crypto.subtle),overflowX:document.documentElement.scrollWidth>innerWidth,theme:document.documentElement.dataset.theme,db:'juglog_d07f_phase6_lab_20261019',iosSafari:/iPhone/.test(navigator.userAgent)?'iPhone系（UAによる判定）':'iPhone以外・未判定'};
 output.textContent=Object.entries(data).map(([k,v])=>`${k}: ${v}`).join('\n');
 return data;
};
document.getElementById('p7-check').addEventListener('click',check);
document.getElementById('p7-copy').addEventListener('click',async()=>{if(output.textContent==='未確認')await check();try{await navigator.clipboard.writeText(output.textContent);output.textContent+='\nコピーしました'}catch(e){output.textContent+='\nコピーできません。表示結果を手動コピーしてください'}});
})();
