/* Stage15 Candidate14: inverse-payout profiles, independent of setting-guess small-role registry.
   All nine entries are reference-only, not manufacturer-confirmed small-role probabilities. Machine-specific cherry totals use stated representative values; no setting is inferred. */
(function(root){'use strict';
const shared=Object.freeze({bet:3,grapePay:8,bbNet:240,rbNet:96,replayP:1/7.298,replayPay:3,cherryP:1/34.62,cherryPay:2,oneBetGrapeP:1/10.29954,oneBetGrapePay:8,oneBetReplayP:1/7.298,oneBetReplayPay:1,oneBetCherryP:1/256,oneBetCherryPay:2,oneBetCherryPickup:1,oneBetCherryPayScenarioMin:0,oneBetCherryPayScenarioMax:4,
 bellP:1/1024,bellPay:14,pierrotP:1/1024,pierrotPay:10,
 casualBellPickup:2/9,casualPierrotPickup:1/10,
 cherryBellPickup:0,cherryPierrotPickup:0});
const configs={
 'myjuggler-v':{label:'マイジャグラーⅤ',enabled:true,reference:'マイジャグラーⅤ向け簡易参考モデル',model:shared,notice:'小役出現率は計算用の仮定値です。メーカー公表の確定値ではありません。'},
 'myjuggler-vi':{label:'マイジャグラーⅥ',enabled:true,reference:'Ⅴの簡易参考モデルを暫定流用',model:shared,notice:'マイジャグラーⅥ固有の計算値ではありません。Ⅴの参考定数を暫定流用しています。'},
 'funky-2':{label:'ファンキージャグラー2',enabled:true,reference:'機種別・参考解析値（チェリー合算の代表値）',model:Object.freeze({...shared,cherryP:1/33.0}),notice:'全チェリー合算は設定別参考値1/33.318～1/32.703の代表値1/33.0。払い出しはチェリー実効2枚想定。'},
 'neo-im-ex':{label:'ネオアイムジャグラーEX',enabled:true,reference:'機種別・参考解析値（チェリー合算の代表値）',model:Object.freeze({...shared,bbNet:252,cherryP:1/32.9}),notice:'BB約252枚。全チェリー合算は設定別参考値1/33.183～1/32.556の代表値1/32.9。'},
 'gogo-3':{label:'ゴーゴージャグラー3',enabled:true,reference:'機種別・参考解析値（チェリー合算の代表値）',model:Object.freeze({...shared,cherryP:1/33.08}),notice:'全チェリー合算は設定別参考値1/33.369～1/32.801の代表値1/33.08。'},
 'girls-ss':{label:'ジャグラーガールズSS',enabled:true,reference:'機種別・参考解析値（チェリー合算の代表値）',model:Object.freeze({...shared,cherryP:1/33.3,bellP:1/1092.27,pierrotP:1/1092.27}),notice:'全チェリー合算は設定別参考値1/33.608～1/32.916の代表値1/33.3。'},
 'mr-juggler':{label:'ミスタージャグラー',enabled:true,reference:'機種別・参考解析値',model:Object.freeze({...shared,cherryP:1/37.236,cherryPay:4,oneBetCherryPay:4,bellP:1/655.36,pierrotP:1/655.36,casualBellPickup:1/9,casualPierrotPickup:0.4021,cherryPierrotPickup:0.3016}),notice:'チェリー合算約1/37.236・チェリー払い出し4枚相当。ピエロ取得は適当打ち40.21％・チェリー狙い30.16％、ベルは適当打ち11.11％を独自解析参考値として補正。'},
 'happy-v3':{label:'ハッピージャグラーVⅢ',enabled:true,reference:'機種別・参考解析値',model:Object.freeze({...shared,cherryP:1/56.594,cherryPay:4,oneBetCherryPay:4}),notice:'チェリー合算約1/56.594・主な角チェリー払い出し4枚相当。レアチェリーは一律4枚ではないため参考値。'},
 'ultra-miracle':{label:'ウルトラミラクルジャグラー',enabled:true,reference:'機種別・参考解析値（チェリー合算の代表値）',model:Object.freeze({...shared,cherryP:1/34.5}),notice:'全チェリー合算は設定別参考値1/35.368～1/33.099の代表値1/34.5。'},
};
// 1BET grape/replay/cherry occurrence values originate from published *predicted* 6th-generation Juggler tables,
// and are treated as common reference assumptions across all nine machines (NOT machine-confirmed probabilities).
// One-BET cherry payout remains an unverified proxy; explicit 0..4-pay scenario adds a separate sensitivity range;
// Normal-play bell/pierrot expected payouts are modeled separately by machine and mode.
// Common 1/1024 and pickup fractions are reference assumptions, not maker-confirmed.
// Mr. Juggler uses independent kenslo reel-layout estimates (1/655.36 and 40.21/30.16%).
// Girls SS uses independent estimate 1/1092.27. One-BET bell/pierrot remains unmodeled.
// The 1BET game-count inclusion assumption remains unverified for hall data.
const profiles=Object.freeze(Object.fromEntries(Object.entries(configs).map(([id,data])=>[id,Object.freeze({id,enabled:false,reference:'機種別の逆算定数を確認中',notice:'獲得枚数・チェリー・リプレイ・1BET時の条件が未照合のため、この機種の算出は保留しています。',...data})])));
function get(id){return Object.prototype.hasOwnProperty.call(profiles,id)?profiles[id]:null}
const api=Object.freeze({profiles,get});if(typeof module!=='undefined'&&module.exports)module.exports=api;if(root)root.JGLStage15Profiles=api;
})(typeof window!=='undefined'?window:null);
