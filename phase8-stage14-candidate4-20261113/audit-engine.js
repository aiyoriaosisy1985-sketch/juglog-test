/* Phase 3 v16: read-only cross-feature integrity audit; no data repair or mutation. */
(function(root){'use strict';
 function inspect(events){
  const issues=[];const add=(code,message,sessionId=null)=>issues.push({code,message,sessionId});
  const sorted=[...events].sort((a,b)=>(a.commitSequence||0)-(b.commitSequence||0));
  const ids=new Set(),seq=new Set(),raw=new Map(),sessions=new Map();
  for(const e of sorted){
   if(!e||typeof e.eventId!=='string'||!e.eventId){add('INVALID_EVENT','イベントIDが不正です');continue}
   if(ids.has(e.eventId))add('DUPLICATE_ID','イベントIDが重複しています');ids.add(e.eventId);raw.set(e.eventId,e);
   if(!Number.isSafeInteger(e.commitSequence)||e.commitSequence<1||seq.has(e.commitSequence))add('INVALID_SEQUENCE','保存順序が重複または不正です',e.sessionId);
   seq.add(e.commitSequence);
  }
  sorted.forEach((e,i)=>{if(e?.commitSequence!==i+1)add('SEQUENCE_GAP','イベントの保存順序に欠番があります',e?.sessionId)});
  for(const e of sorted){
   if(!e||!['EVENT_CANCELLED','EVENT_RESTORED'].includes(e.type))continue;
   const target=raw.get(e.targetEventId);
   if(!target||target.commitSequence>=e.commitSequence||target.sessionId!==e.sessionId||['EVENT_CANCELLED','EVENT_RESTORED'].includes(target.type))add('INVALID_CORRECTION','取消・復元の参照関係が不正です',e.sessionId);
  }
  const effective=root?.JissenhyoGraph?.effectiveEvents||(typeof require==='function'?require('./graph-engine.js').effectiveEvents:null);
  if(!effective){add('ENGINE_MISSING','グラフ集計エンジンが読み込めません');return {ok:false,issues,checked:events.length}}
  const ev=effective(sorted);
  for(const e of ev)if(e.type==='SESSION_CREATED'){
   if(sessions.has(e.sessionId))add('DUPLICATE_SESSION','同じ実戦IDが複数回作成されています',e.sessionId);
   sessions.set(e.sessionId,{games:0,grape:0,cherry:0,bonuses:new Map(),status:'ACTIVE'});
  }
  for(const e of ev){
   if(e.type==='SESSION_CREATED')continue;
   const s=sessions.get(e.sessionId);
   if(!s){add('ORPHAN_EVENT','実戦の作成記録が存在しません',e.sessionId);continue}
   // 着席前の参考逆算は本人Gや設定推測に混ぜず、原本の入力条件だけを検査。
   if(e.type==='PRESEAT_GRAPH_OBSERVED'){
    const validCount=n=>Number.isSafeInteger(n)&&n>=0;
    const valid=Number.isSafeInteger(e.games)&&e.games>0&&validCount(e.bb)&&validCount(e.rb)&&e.bb+e.rb<=e.games&&
      Number.isSafeInteger(e.net)&&validCount(e.margin)&&e.margin<=50000&&
      ['hall','site'].includes(e.source)&&['unknown','cherry','casual'].includes(e.playStyle)&&
      e.baseline==='confirmed'&&e.scope==='confirmed'&&typeof e.modelVersion==='string'&&e.modelVersion.length>0;
    if(!valid)add('INVALID_PRESEAT','着席前の差枚参考逆算の入力条件が不正です',e.sessionId);
   }
   if(e.type==='GAMES_RECORDED'){
    if(!Number.isSafeInteger(e.delta)||e.delta<=0)add('INVALID_GAMES','G数追加が正の整数ではありません',e.sessionId);
    else{s.games+=e.delta;if(!Number.isSafeInteger(s.games))add('GAME_OVERFLOW','本人Gが安全な整数の範囲を超えています',e.sessionId)}
   }
   if(e.type==='GRAPE_COUNTED')s.grape++;
   if(e.type==='CHERRY_COUNTED')s.cherry++;
   if(e.type==='BONUS_AWARDED'){
    if(!['BB','RB'].includes(e.bonusType)||!e.bonusId)add('INVALID_BONUS','ボーナスの種類またはIDが不正です',e.sessionId);
    else if(s.bonuses.has(e.bonusId))add('DUPLICATE_BONUS','同一ボーナスIDが重複しています',e.sessionId);
    else s.bonuses.set(e.bonusId,{pending:!!e.pendingReview,completed:false});
   }
   if(['BONUS_REVIEW_CONFIRMED','BONUS_COMPLETED'].includes(e.type)){
    const b=s.bonuses.get(e.bonusId);
    if(!b)add('ORPHAN_BONUS_ACTION','元ボーナスのない確認・消化完了があります',e.sessionId);
    else if(e.type==='BONUS_REVIEW_CONFIRMED'){
     if(!b.pending)add('DUPLICATE_CONFIRM','保留ではないボーナスが再確認されています',e.sessionId);
     b.pending=false;
    }else{
     if(b.pending||b.completed)add('INVALID_COMPLETION','保留中または消化済みのボーナスが消化完了されています',e.sessionId);
     b.completed=true;
    }
   }
   if(e.type==='SESSION_PAUSED')s.status='PAUSED';
   if(e.type==='SESSION_RESUMED')s.status='ACTIVE';
   if(e.type.startsWith('SESSION_CLOSED_'))s.status='CLOSED';
  }
  for(const [id,s] of sessions){
   if(s.grape+s.cherry>s.games&&s.games>0)add('FRUIT_OVERFLOW','ぶどう＋チェリーの記録数が本人Gを超えています',id);
  }
  const graph=root?.JissenhyoGraph||(typeof require==='function'?require('./graph-engine.js'):null);
  const finance=root?.JissenhyoFinance||(typeof require==='function'?require('./finance-engine.js'):null);
  const card=root?.JissenhyoCard||(typeof require==='function'?require('./card-engine.js'):null);
  if(graph&&finance)for(const [id,s] of sessions){
   const g=graph.build(sorted,id),f=finance.build(sorted,id);
   if(g.games!==s.games||f.games!==s.games)add('GAME_MISMATCH','グラフと収支の本人Gが一致しません',id);
   if(f.invalid.length)add('INVALID_FINANCE','不正な収支イベントがあります（'+f.invalid.length+'件）',id);
  }
  if(card){const c=card.build(sorted);if(c.invalid.length)add('INVALID_CARD','不正な会員カード・収支イベントがあります（'+c.invalid.length+'件）');for(const x of c.cards)if(x.warning)add('CARD_BALANCE_CONFLICT',x.store+'／'+x.cardLabel+'の貯メダル残高が不整合です')}
  return {ok:issues.length===0,issues,checked:sorted.length,sessions:sessions.size};
 }
 const api={inspect};if(typeof module!=='undefined'&&module.exports)module.exports=api;
 if(root)root.JissenhyoAudit=api;
})(typeof window!=='undefined'?window:null);
