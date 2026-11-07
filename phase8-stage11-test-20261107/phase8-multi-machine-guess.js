/* Phase8 v2.9: official bonus-only relative likelihood. No guessed grape/trigger model. */
(function(root){'use strict';
const rows=Object.freeze([
  {setting:1,bb:273.1,rb:409.6},{setting:2,bb:270.8,rb:385.5},
  {setting:3,bb:266.4,rb:336.1},{setting:4,bb:254.0,rb:290.0},
  {setting:5,bb:240.1,rb:268.6},{setting:6,bb:229.1,rb:229.1}
].map(x=>Object.freeze(x)));
const urlV='https://www.kitadenshi.co.jp/slot/myjuggler5/';
const urlVI='https://www.kitadenshi.co.jp/slot/myjuggler6/';
const models=Object.freeze({
 'myjuggler-v':Object.freeze({id:'myjuggler-v',label:'マイジャグラーV',source:urlV,metrics:'BB/RBのみ',rows}),
 'myjuggler-vi':Object.freeze({id:'myjuggler-vi',label:'マイジャグラーVI',source:urlVI,metrics:'BB/RBのみ',rows}),
 'neo-im-ex':Object.freeze({id:'neo-im-ex',label:'ネオアイムジャグラーEX',source:'https://www.kitadenshi.co.jp/slot/neoimjugglerex/',metrics:'BB/RBのみ',rows:Object.freeze([[273.1,439.8],[269.7,399.6],[269.7,331.0],[259.0,315.1],[259.0,255.0],[255.0,255.0]].map(([bb,rb],i)=>Object.freeze({setting:i+1,bb,rb})))}),
 'funky-2':Object.freeze({id:'funky-2',label:'ファンキージャグラー2',source:'https://www.kitadenshi.co.jp/slot/funkyjuggler2/',metrics:'BB/RBのみ',rows:Object.freeze([[266.4,439.8],[259.0,407.1],[256.0,366.1],[249.2,322.8],[240.1,299.3],[219.9,262.1]].map(([bb,rb],i)=>Object.freeze({setting:i+1,bb,rb})))}),
 'gogo-3':Object.freeze({id:'gogo-3',label:'ゴーゴージャグラー3',source:'https://www.kitadenshi.co.jp/slot/gogojuggler3/',metrics:'BB/RBのみ',rows:Object.freeze([[259.0,354.2],[258.0,332.7],[257.0,306.2],[254.0,268.6],[247.3,247.3],[234.9,234.9]].map(([bb,rb],i)=>Object.freeze({setting:i+1,bb,rb})))}),
 'mr-juggler':Object.freeze({id:'mr-juggler',label:'ミスタージャグラー',source:'https://www.kitadenshi.co.jp/slot/mrjuggler/',metrics:'BB/RBのみ',rows:Object.freeze([[268.6,374.5],[267.5,354.2],[260.1,331.0],[249.2,291.3],[240.9,257.0],[237.4,237.4]].map(([bb,rb],i)=>Object.freeze({setting:i+1,bb,rb})))}),
 'ultra-miracle':Object.freeze({id:'ultra-miracle',label:'ウルトラミラクルジャグラー',source:'https://www.kitadenshi.co.jp/slot/ultramiraclejuggler/',metrics:'BB/RBのみ',rows:Object.freeze([[267.5,425.6],[261.1,402.1],[256.0,350.5],[242.7,322.8],[233.2,297.9],[216.3,277.7]].map(([bb,rb],i)=>Object.freeze({setting:i+1,bb,rb})))}),
 'girls-ss':Object.freeze({id:'girls-ss',label:'ジャグラーガールズSS',source:'https://www.kitadenshi.co.jp/slot/jugglergirlsss/',metrics:'BB/RBのみ',rows:Object.freeze([[273.1,381.0],[270.8,350.5],[260.1,316.6],[250.1,281.3],[243.6,270.8],[226.0,252.1]].map(([bb,rb],i)=>Object.freeze({setting:i+1,bb,rb})))}),
 'happy-v3':Object.freeze({id:'happy-v3',label:'ハッピージャグラーVⅢ',source:'https://www.kitadenshi.co.jp/slot/happyjugglerv3/',metrics:'BB/RBのみ',rows:Object.freeze([[273.1,397.2],[270.8,362.1],[263.2,332.7],[254.0,300.6],[239.2,273.1],[226.0,256.0]].map(([bb,rb],i)=>Object.freeze({setting:i+1,bb,rb})))}),
});
function identify(input){
 const n=String(input||'').normalize('NFKC').replace(/[\s　]/g,'').toUpperCase();
 if(/^(ミスタージャグラー|MRJUGGLER|MISTERJUGGLER)$/.test(n))return 'mr-juggler';
 if(/^(ウルトラミラクルジャグラー|ULTRAMIRACLEJUGGLER)$/.test(n))return 'ultra-miracle';
 if(/^(ジャグラーガールズSS|JUGGLERGIRLSSS)$/.test(n))return 'girls-ss';
 if(/^(マイジャグラー(?:VI|6)|マイジャグ6|MYJUGGLER(?:VI|6))$/.test(n))return 'myjuggler-vi';
 if(/^(ネオアイムジャグラーEX|ネオアイムEX|NEOIMJUGGLEREX)$/.test(n))return 'neo-im-ex';
 if(/^(ファンキージャグラー2|ファンキージャグラーII|ファンキー2|FUNKYJUGGLER2)$/.test(n))return 'funky-2';
 if(/^(ゴーゴージャグラー3|ゴーゴージャグラーIII|ゴージャグ3|GOGOJUGGLER3)$/.test(n))return 'gogo-3';
 if(/^(ハッピージャグラーVIII|ハッピージャグラーV3|ハッピーV3|HAPPYJUGGLERVIII|HAPPYJUGGLERV3)$/.test(n))return 'happy-v3';
 if(/^(マイジャグラー(?:V|5)|マイジャグ5|MYJUGGLER(?:V|5))$/.test(n))return 'myjuggler-v';
 return null;
}
function estimate({machine,games,bb,rb}={}){
 const id=identify(machine),model=id?models[id]:null;
 if(!model)return {ok:false,code:'UNSUPPORTED_MACHINE',reason:'機種未特定、または未対応のため推測しません。'};
 if(![games,bb,rb].every(x=>Number.isSafeInteger(x)&&x>=0)||games===0||bb+rb>games)
   return {ok:false,code:'INVALID_DATA',reason:'G数・確定BB/RB件数に整合しない値があります。'};
 const logs=model.rows.map(r=>{
  const pb=1/r.bb,pr=1/r.rb,pOther=1-pb-pr;
  return bb*Math.log(pb)+rb*Math.log(pr)+(games-bb-rb)*Math.log(pOther);
 });
 const max=Math.max(...logs),ws=logs.map(x=>Math.exp(x-max));
 const sum=ws.reduce((a,b)=>a+b,0);
 const probabilities=ws.map(x=>x/sum);
 // Integer tenths summing exactly 100%; sorted largest fractional remainder.
 const scaled=probabilities.map(p=>p*1000),units=scaled.map(Math.floor);
 const pending=1000-units.reduce((a,b)=>a+b,0);
 const ranking=scaled.map((x,i)=>({i,part:x-units[i]})).sort((a,b)=>b.part-a.part||a.i-b.i);
 for(let i=0;i<pending;i++)units[ranking[i].i]++;
 const settings=model.rows.map((r,i)=>({setting:r.setting,percent:units[i]/10,probability:probabilities[i]}));
 return {ok:true,machineId:id,machine:model.label,source:model.source,metrics:'BB/RBのみ',games,bb,rb,settings,
 note:'公式BB/RB確率・設定1〜6同一の事前重みで算出した相対的な参考値です。実際の設定確率や勝率を保証しません。ぶどう・チェリー・契機別情報は使用していません。',
 warning:games<1000?'1000G未満：結果が大きく変動します。':games<3000?'3000G未満：結果の変動に注意してください。':'試行の偏りが残ります。'};
}
const api=Object.freeze({models,identify,estimate});
if(typeof module!=='undefined'&&module.exports)module.exports=api;
root.P8MachineEstimator=api;
})(typeof globalThis!=='undefined'?globalThis:this);
