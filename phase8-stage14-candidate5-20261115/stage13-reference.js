/* Juglog Stage13 isolated candidate. Non-official provisional values approved in discussion.
   No storage writes. Unverified cherry is excluded from likelihood. */
(function(root){'use strict';
const raw={
 // Grape values preserve the user-approved Fix2c figures without alteration.
 // Only Galizou-attributed, explicitly non-overlap reference data may feed cherry likelihood.
 'myjuggler-v':{grape:[5.90,5.85,5.80,5.78,5.76,5.66],nonOverlapCherry:[38.10,38.10,36.82,35.62,35.62,35.62],status:'galizou-nonoverlap',cherrySource:'https://nana-press.com/post/1563951/2',cherryBasis:'ガリぞう氏本人・非重複チェリー独自調査値'},
 'myjuggler-vi':{grape:[5.90,5.85,5.80,5.78,5.76,5.66],nonOverlapCherry:[38.10,38.10,36.82,35.62,35.62,35.62],status:'borrowed-myjuggler-v',cherrySource:'https://nana-press.com/post/1563951/2',cherryBasis:'ガリぞう氏のマイジャグラーⅤ非重複値を暫定流用（Ⅵ独自値ではありません）'},
 'funky-2':{grape:[5.94,5.92,5.88,5.83,5.76,5.67],nonOverlapCherry:[35.62,35.62,35.62,35.62,35.62,35.62],status:'galizou-nonoverlap',cherrySource:'https://nana-press.com/post/1563951/2',cherryBasis:'ガリぞう氏本人・非重複チェリー独自調査値'},
 'neo-im-ex':{grape:[6.02,6.02,6.02,6.02,6.02,5.78],nonOverlapCherry:null,status:'galizou-nonoverlap-unverified'},
 'gogo-3':{grape:[6.25,6.20,6.15,6.07,6.00,5.92],nonOverlapCherry:null,status:'galizou-nonoverlap-unverified',generalCherry:[33.56,33.47,33.32,33.15,33.10,32.97],generalCherryLabel:'チェリー確率（ガリぞう氏の数値として引用・非重複の定義は未照合／参考のみ）',generalCherrySource:'https://juggler7.com/gogo3/kaiseki.html'},
 'mr-juggler':{grape:[6.13,6.07,6.01,5.95,5.88,5.82],nonOverlapCherry:null,status:'galizou-nonoverlap-unverified',generalCherry:[37.24,37.24,37.24,37.24,37.24,37.24],generalCherryLabel:'チェリー確率（非重複の区分なし）',generalCherrySource:'https://nana-press.com/post/1623268/2'},
 'girls-ss':{grape:[5.98,5.98,5.98,5.89,5.88,5.83],nonOverlapCherry:null,status:'galizou-nonoverlap-unverified'},
 'happy-v3':{grape:[6.04,6.01,5.98,5.84,5.81,5.79],nonOverlapCherry:[62.24,62.47,62.95,64.00,64.57,65.34],status:'galizou-nonoverlap',cherrySource:'https://nana-press.com/post/1595428/2',cherryBasis:'ガリぞう氏本人・非重複チェリー独自調査値'},
 'ultra-miracle':{grape:[5.93,5.93,5.93,5.93,5.87,5.81],nonOverlapCherry:[37.22,37.22,37.22,37.09,36.13,35.48],status:'galizou-nonoverlap',cherrySource:'https://nana-press.com/post/1626633/3',cherryBasis:'ガリぞう氏本人・非重複チェリー独自調査値',generalCherry:[35.1,35.0,34.8,34.6,33.5,33.0],generalCherryLabel:'チェリー全体確率（参考・推測不使用）',generalCherrySource:'https://nana-press.com/post/1626633/3'}
};
const models=Object.freeze(Object.fromEntries(Object.entries(raw).map(([id,m])=>[id,Object.freeze({...m,grape:Object.freeze(m.grape),nonOverlapCherry:m.nonOverlapCherry?Object.freeze(m.nonOverlapCherry):null})])));
const api=Object.freeze({models,get:(id)=>models[id]||null});
if(typeof module!=='undefined'&&module.exports)module.exports=api;
root.JGLStage13References=api;
})(typeof globalThis!=='undefined'?globalThis:this);
