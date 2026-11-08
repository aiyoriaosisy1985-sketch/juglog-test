/* Phase 8 reference registry — non-official small role estimates; no storage writes. */
(function(root){'use strict';
const V=Object.freeze([[5.90,38.10],[5.85,38.10],[5.80,36.82],[5.78,35.62],[5.76,35.62],[5.66,35.62]].map(([grape,cherry],i)=>Object.freeze({setting:i+1,grape,cherry})));
function grapeRows(values){return Object.freeze(values.map((grape,i)=>Object.freeze({setting:i+1,grape,cherry:null})));}
function item({status,referenceMachine,sourceName,sourceUrl=null,primarySourceVerified=false,rows,notice,enabled=true}){return Object.freeze({status,referenceMachine,sourceName,sourceUrl,primarySourceVerified,grapeAndCherry:rows,notice,enabled});}
const records=Object.freeze({
 'myjuggler-v':item({status:'provisional-secondary',referenceMachine:'myjuggler-v',sourceName:'ガリぞう氏の予想値として紹介された二次情報',rows:V,notice:'マイジャグラーV向け非公式参考値。原著資料との照合は未完了です。'}),
 'myjuggler-vi':item({status:'borrowed-provisional',referenceMachine:'myjuggler-v',sourceName:'ガリぞう氏のマイジャグラーV向け参考値（二次情報）',rows:V,notice:'マイジャグラーVIの小役はマイジャグラーV向け参考値を暫定使用。VI独自の参考値ではなく、確認後に差し替えます。'}),
 'gogo-3':item({status:'attributed-provisional',referenceMachine:'gogo-3',sourceName:'ガリぞう氏の設定別ぶどう参考値として紹介された数値',rows:grapeRows([6.25,6.20,6.15,6.07,6.00,5.92]),notice:'ぶどうのみを使用。非重複チェリーは出典未確認のため推測対象外。原著への直接照合は継続中。'}),
 'mr-juggler':item({status:'attributed-provisional',referenceMachine:'mr-juggler',sourceName:'ガリぞう氏が更新したぶどう推定値として紹介された数値（2024年9月）',rows:grapeRows([6.29,6.22,6.15,6.09,6.02,5.96]),notice:'ぶどうのみを使用。非重複チェリーは出典未確認のため推測対象外。'}),
 'girls-ss':item({status:'source-conflict-hold',referenceMachine:'girls-ss',sourceName:'ガリぞう氏の予想値を紹介する資料（設定4の数値に資料間差異あり）',rows:grapeRows([5.98,5.98,5.98,5.98,5.88,5.83]),enabled:false,notice:'設定4のぶどう分母が資料により1/5.98と1/5.89で不一致のため、推測への使用を保留しています。'})
});
function get(id){return Object.prototype.hasOwnProperty.call(records,id)?records[id]:null;}
const api=Object.freeze({get,records});if(typeof module!=='undefined'&&module.exports)module.exports=api;root.P8SmallRoleRegistry=api;
})(typeof globalThis!=='undefined'?globalThis:this);
