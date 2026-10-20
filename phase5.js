(() => {
'use strict';
// P31 reference replay from bundled p31-reference.js. No IndexedDB, localStorage or fetch.
const play=document.getElementById('panel-play'), el=id=>document.getElementById(id);
const SESSION='phase5-demo', SEGMENT='phase4-segment';
let seq=0, events=[];
function make(type,p={}){return {eventId:'p5-'+(++seq),sessionId:SESSION,type,...p}}
function init(){seq=0;events=[make('SESSION_CREATED',{segmentId:SEGMENT,store:'架空ホール',machine:'マイジャグラー',number:'1',date:'2026-10-19'}),make('GAMES_RECORDED',{delta:1200,measuredBoth:true,segmentId:SEGMENT})];
for(let i=0;i<196;i++)events.push(make('GRAPE_COUNTED',{segmentId:SEGMENT}));
for(let i=0;i<39;i++)events.push(make('CHERRY_COUNTED',{segmentId:SEGMENT}));
for(let i=0;i<9;i++){let b='fixture-b'+i;events.push(make('BONUS_AWARDED',{bonusId:b,bonusType:i%2===0?'BB':'RB',pendingReview:false,segmentId:SEGMENT}));if(i<8)events.push(make('BONUS_COMPLETED',{bonusId:b,completedSegmentId:SEGMENT}))}
events.push(make('HALL_SNAPSHOT_RECORDED',{totalG:4250,currentG:85,bb:5,rb:4,segmentId:SEGMENT}));render()}
const active=()=>correctedEvents(events);
function state(){return replay(events).get(SESSION)}
function project(){const s=state(), snap=s.snapshots.at(-1),confirmed=s.bonuses.filter(b=>!b.pendingReview),pending=s.bonuses.filter(b=>b.pendingReview).length,unc=s.bonuses.filter(b=>!b.completed).length;return {selfG:s.g,hallTotalG:snap?.totalG??null,currentG:s.current,grape:s.grape,cherry:s.cherry,bb:confirmed.filter(b=>b.bonusType==='BB').length,rb:confirmed.filter(b=>b.bonusType==='RB').length,pending,uncompleted:unc,measuredG:s.measuredG,hasUnmeasuredG:s.hasUnmeasuredG,status:s.status,bonuses:s.bonuses}}
const fmt=x=>x===null?'未観測':x.toLocaleString('ja-JP');
const ratio=(v,den)=>v>0&&den>0?`1/${(den/v).toFixed(2)}`:'–';
function status(x){el('p2-status').textContent=x}
function render(){const s=project();let labels={'総ゲーム数':s.hallTotalG,'本人G':s.selfG,'現在G':s.currentG,'保留':s.pending,'未消化':s.uncompleted};for(const n of play.querySelectorAll('.stat,.smallstat')){const lbl=n.querySelector('small,span')?.textContent.trim(),v=n.querySelector('strong');if(v&&Object.hasOwn(labels,lbl))v.textContent=fmt(labels[lbl])}
for(const k of ['bb','rb','grape','cherry']){const nd=play.querySelector('.key.'+k+' .count');if(nd)nd.textContent=(k==='grape'||k==='cherry')?`${fmt(s[k])}  |  ${s.hasUnmeasuredG?'実測区間要確認':ratio(s[k],s.measuredG)}`:fmt(s[k])}
const next=s.bonuses.slice().reverse().find(b=>!b.completed&&!b.pendingReview);const complete=play.querySelector('.complete');complete.disabled=!next;complete.textContent=next?`${next.bonusType} 消化完了`:'消化完了';
const rate=play.querySelectorAll('.rategrid .rate strong');let snapshot=state().snapshots.at(-1);if(rate.length===3){rate[0].textContent=ratio(snapshot?.bb||0,s.hallTotalG);rate[1].textContent=ratio(snapshot?.rb||0,s.hallTotalG);rate[2].textContent=ratio((snapshot?.bb||0)+(snapshot?.rb||0),s.hallTotalG)}
const last=active().at(-1);el('p2-undo').disabled=!last;const log=el('p2-log');log.replaceChildren();for(const e of events.slice(-14).reverse()){const li=document.createElement('li');li.textContent=`${e.type} ${e.bonusType||''} ${e.delta||''} (${e.eventId})`;log.append(li)}
}
function add(type,p={}){const e=make(type,p);if(['EVENT_CANCELLED','EVENT_RESTORED'].includes(type)){try{validateCorrectionDependencies(events.map((v,i)=>({...v,commitSequence:i+1})),[e]);}catch(err){seq--;status('拒否: '+err.message);return null;}}events.push(e);render();window.dispatchEvent(new Event('juglog:phase6-mutated'));status(type+' を記録しました');return e}
function recordBonus(bonusType){const pendingReview=project().bonuses.some(b=>!b.completed);add('BONUS_AWARDED',{bonusId:'bonus-'+(seq+1),bonusType,pendingReview,trigger:el('p2-trigger').value,segmentId:SEGMENT})}
for(const type of ['BB','RB'])play.querySelector('.key.'+type.toLowerCase()).addEventListener('click',()=>recordBonus(type));
for(const [k,t] of [['grape','GRAPE_COUNTED'],['cherry','CHERRY_COUNTED']])play.querySelector('.key.'+k).addEventListener('click',()=>add(t,{segmentId:SEGMENT}));
function undo(){const all=active(),last=all.at(-1);if(!last||!['GAMES_RECORDED','GRAPE_COUNTED','CHERRY_COUNTED','BONUS_AWARDED'].includes(last.type)){status('直近の記録は取消対象外です');return}
if(last.type==='BONUS_AWARDED'&&all.some(e=>['BONUS_COMPLETED','BONUS_REVIEW_CONFIRMED'].includes(e.type)&&e.bonusId===last.bonusId)){status('依存イベントがある当選は取り消せません');return}add('EVENT_CANCELLED',{targetEventId:last.eventId})}
el('p2-undo').addEventListener('click',undo);
for(const [k,t] of [['bb','BONUS_AWARDED'],['rb','BONUS_AWARDED'],['grape','GRAPE_COUNTED'],['cherry','CHERRY_COUNTED']])play.querySelector('.key.'+k).parentElement.querySelector('.cancel').addEventListener('click',()=>{const last=active().at(-1);if(last?.type!==t||(t==='BONUS_AWARDED'&&last.bonusType.toLowerCase()!==k)){status('途中の記録は飛び越して取り消せません');return}undo()});
function games(n){if(!Number.isSafeInteger(n)||n<=0||n>100000){status('1〜100000Gの整数で指定してください');return}add('GAMES_RECORDED',{delta:n,segmentId:SEGMENT,measuredBoth:play.querySelector('.entry input[type=checkbox]').checked})}
const input=play.querySelector('input[placeholder]'),buttons=play.querySelectorAll('button.action');buttons[0].addEventListener('click',()=>{const raw=input.value.trim();if(!/^\d+$/.test(raw)){status('整数を入力してください');return}games(Number(raw));input.value=''});buttons[1].addEventListener('click',()=>games(50));buttons[2].addEventListener('click',()=>games(100));
play.querySelector('.complete').addEventListener('click',()=>{const s=project();const next=s.bonuses.slice().reverse().find(b=>!b.completed&&!b.pendingReview);if(!next){status('未消化ボーナスなし');return}add('BONUS_COMPLETED',{bonusId:next.bonusId,completedSegmentId:SEGMENT})});
el('p2-reset').addEventListener('click',()=>{init();window.dispatchEvent(new Event('juglog:phase6-mutated'));status('架空イベントを初期化しました')});

const p5=id=>document.getElementById(id);const p5say=m=>{p5('p5-result').textContent=m};
p5('p5-confirm').onclick=()=>{const s=project();const pending=s.bonuses.find(b=>b.pendingReview);if(!pending){p5say('保留ボーナスがありません');return}if(s.bonuses.some(b=>!b.completed&&!b.pendingReview)){p5say('未消化ボーナスを先に完了してください');return}add('BONUS_REVIEW_CONFIRMED',{bonusId:pending.bonusId,segmentId:SEGMENT});p5say('保留確認を記録しました（現在Gは維持）')};
p5('p5-completion-undo').onclick=()=>{const last=active().at(-1);if(!last||last.type!=='BONUS_COMPLETED'){p5say('消化完了が最後の有効操作ではありません');return}const r=add('EVENT_CANCELLED',{targetEventId:last.eventId});p5say(r?'消化完了の訂正に成功':'訂正に失敗')};
const allowed=new Set(['SESSION_CREATED','GAMES_RECORDED','GRAPE_COUNTED','CHERRY_COUNTED','BONUS_AWARDED','BONUS_COMPLETED','BONUS_REVIEW_CONFIRMED','HALL_SNAPSHOT_RECORDED','EVENT_CANCELLED','EVENT_RESTORED']);
function verifyDoc(doc){if(!doc||doc.format!=='juglog-phase5-test'||doc.version!==1||!Array.isArray(doc.events)||doc.events.length>10000||doc.events.length<1)throw Error('形式・件数が不正です');const ids=new Set();let sessions=0;for(let i=0;i<doc.events.length;i++){const e=doc.events[i];if(!e||typeof e!=='object'||Array.isArray(e)||!allowed.has(e.type)||typeof e.eventId!=='string'||!/^p5-[1-9]\d*$/.test(e.eventId)||ids.has(e.eventId)||e.sessionId!==SESSION||JSON.stringify(e).length>6000)throw Error('イベント内容が不正です: '+i);ids.add(e.eventId);if(e.type==='SESSION_CREATED')sessions++;if(e.type==='GAMES_RECORDED'&&(!Number.isSafeInteger(e.delta)||e.delta<=0))throw Error('ゲーム数が不正です');if(e.type==='BONUS_AWARDED'&&(!['BB','RB'].includes(e.bonusType)||typeof e.bonusId!=='string'))throw Error('当選データが不正です');if(e.type==='HALL_SNAPSHOT_RECORDED'&&(!Number.isSafeInteger(e.totalG)||e.totalG<0))throw Error('ホール観測が不正です');if(['EVENT_CANCELLED','EVENT_RESTORED'].includes(e.type)){if(!ids.has(e.targetEventId))throw Error('訂正対象が不正です');validateCorrectionDependencies(doc.events.slice(0,i).map((v,n)=>({...v,commitSequence:n+1})),[e]);}}
if(sessions!==1||doc.events[0].type!=='SESSION_CREATED')throw Error('実戦作成イベントが不正です');const candidate=replay(doc.events).get(SESSION);if(!candidate)throw Error('再生に失敗しました');return candidate}
p5('p5-export').onclick=()=>{const doc={format:'juglog-phase5-test',version:1,events:events.map(e=>({...e}))};p5('p5-json').value=JSON.stringify(doc,null,2);p5say('JSONを生成しました。自動保存は行いません。')};
p5('p5-import').onclick=()=>{try{const raw=p5('p5-json').value;if(raw.length>4000000)throw Error('サイズ上限を超えています');const doc=JSON.parse(raw);verifyDoc(doc);const copy=doc.events.map(e=>({...e}));events=copy;seq=Math.max(...copy.map(e=>Number(e.eventId.slice(3))));render();window.dispatchEvent(new Event('juglog:phase6-mutated'));p5say('検証・復元に成功しました（この画面内だけ）')}catch(err){p5say('読込拒否: '+err.message)}};

init();Object.defineProperty(window,'JuglogPhase5Test',{value:Object.freeze({getEvents:()=>events.map(e=>({...e})),getProjection:()=>({...project(),bonuses:project().bonuses.map(x=>({...x}))}),getReferenceState:()=>state(),getEvents:()=>events.map(e=>({...e})),injectEvent:(type,p)=>add(type,p),exportDoc:()=>({format:'juglog-phase5-test',version:1,events:events.map(e=>({...e}))}),importDoc:(doc)=>{verifyDoc(doc);const copy=doc.events.map(e=>({...e}));events=copy;seq=Math.max(...copy.map(e=>Number(e.eventId.slice(3))));render();window.dispatchEvent(new Event('juglog:phase6-mutated'));return project()},validateCorrectionDependencies})});
})();