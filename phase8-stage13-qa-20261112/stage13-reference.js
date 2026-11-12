/* Juglog Stage13 isolated candidate. Non-official provisional values approved in discussion.
   No storage writes. Unverified cherry is excluded from likelihood. */
(function(root){'use strict';
const raw={
 'myjuggler-v':{grape:[5.90,5.85,5.80,5.78,5.76,5.66],nonOverlapCherry:[38.10,38.10,36.82,35.62,35.62,35.62],status:'existing-provisional-secondary'},
 'myjuggler-vi':{grape:[5.90,5.85,5.80,5.78,5.76,5.66],nonOverlapCherry:[38.10,38.10,36.82,35.62,35.62,35.62],status:'borrowed-myjuggler-v'},
 'funky-2':{grape:[5.94,5.92,5.88,5.83,5.76,5.67],nonOverlapCherry:[35.62,35.62,35.62,35.62,35.62,35.62],status:'galizou-attributed-choice-A'},
 'neo-im-ex':{grape:[6.02,6.02,6.02,6.02,6.02,5.78],nonOverlapCherry:null,status:'previous-model-DMM-choice-A'},
 'gogo-3':{grape:[6.25,6.20,6.15,6.07,6.00,5.92],nonOverlapCherry:null,status:'existing-provisional'},
 'mr-juggler':{grape:[6.13,6.07,6.01,5.95,5.88,5.82],nonOverlapCherry:null,status:'user-choice-A'},
 'girls-ss':{grape:[5.98,5.98,5.98,5.89,5.88,5.83],nonOverlapCherry:null,status:'user-choice-B'},
 'happy-v3':{grape:[6.04,6.01,5.98,5.84,5.81,5.79],nonOverlapCherry:[62.18,62.47,63.02,64.00,64.63,65.41],status:'grape-choice-B-cherry-galizou-A'},
 'ultra-miracle':{grape:[5.93,5.93,5.93,5.93,5.87,5.81],nonOverlapCherry:null,status:'unverified-secondary-provisional-candidate'}
};
const models=Object.freeze(Object.fromEntries(Object.entries(raw).map(([id,m])=>[id,Object.freeze({...m,grape:Object.freeze(m.grape),nonOverlapCherry:m.nonOverlapCherry?Object.freeze(m.nonOverlapCherry):null})])));
const api=Object.freeze({models,get:(id)=>models[id]||null});
if(typeof module!=='undefined'&&module.exports)module.exports=api;
root.JGLStage13References=api;
})(typeof globalThis!=='undefined'?globalThis:this);
