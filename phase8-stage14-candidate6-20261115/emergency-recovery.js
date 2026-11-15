/* ジャグログ緊急退避 P0 prototype: independent and non-mutating.
 * Does not access IndexedDB, localStorage, or application state.
 * Never auto-recovers events. An explicit writer must enforce lease + atomicity.
 */
(function (root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.JuglogEmergencyRecovery = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';
  const FORMAT = 'juglog.pending-operations.v1';
  function assert(ok, message) { if (!ok) throw new Error(message); }
  function object(x) { return x !== null && typeof x === 'object' && !Array.isArray(x); }
  function canonical(x) {
    if (Array.isArray(x)) return '[' + x.map(canonical).join(',') + ']';
    if (object(x)) return '{' + Object.keys(x).sort().map(k => JSON.stringify(k) + ':' + canonical(x[k])).join(',') + '}';
    return JSON.stringify(x);
  }
  function serializable(x) {
    assert(x !== undefined && x !== null, '退避データがありません');
    const str = JSON.stringify(x);
    assert(typeof str === 'string', 'JSONに変換できません');
    const parsed = JSON.parse(str);
    assert(canonical(parsed) === canonical(x), 'JSONで表現できない値があります');
    return parsed;
  }
  async function sha256(input) {
    const cryptoObj = typeof globalThis !== 'undefined' ? globalThis.crypto : null;
    let digest;
    if (cryptoObj && cryptoObj.subtle) {
      digest = await cryptoObj.subtle.digest('SHA-256', new TextEncoder().encode(input));
      return Array.from(new Uint8Array(digest), b => b.toString(16).padStart(2, '0')).join('');
    }
    if (typeof require === 'function') {
      const c = require('node:crypto');
      return c.createHash('sha256').update(input).digest('hex');
    }
    throw new Error('SHA-256を利用できないため退避データを作成できません');
  }
  function validateQueue(ops) {
    assert(Array.isArray(ops) && ops.length > 0 && ops.length <= 1000, '未保存操作の件数が不正です');
    const ids = new Set(), eventIds = new Set();
    for (const op of ops) {
      assert(object(op) && typeof op.operationId === 'string' && op.operationId.length > 0, '操作IDが不正です');
      assert(!ids.has(op.operationId), '操作IDが重複しています');
      ids.add(op.operationId);
      assert(Array.isArray(op.prepared) && op.prepared.length > 0, 'イベントがありません');
      for (const e of op.prepared) {
        assert(object(e) && typeof e.eventId === 'string' && e.eventId.length > 0, 'イベントIDが不正です');
        assert(e.operationId === op.operationId, 'イベントと操作IDが一致しません');
        assert(typeof e.sessionId === 'string' && e.sessionId.length > 0, '実戦IDが不正です');
        assert(!eventIds.has(e.eventId), 'イベントIDが重複しています');
        eventIds.add(e.eventId);
      }
    }
  }
  function cleanEvent(e) { const { commitSequence, ...rest } = e; return rest; }
  function equalEvent(a, b) { return canonical(cleanEvent(a)) === canonical(cleanEvent(b)); }
  async function exportPending(operations, { appVersion = 'v46.9', dbIdentifier = 'jissenhyo_p1_v1', createdAt = new Date().toISOString() } = {}) {
    const ops = serializable(operations);
    validateQueue(ops);
    const payload = { format: FORMAT, appVersion, dbIdentifier, createdAt, operations: ops };
    const checksum = await sha256(canonical(payload));
    return JSON.stringify({ payload, checksum: 'sha256:' + checksum }, null, 2);
  }
  async function parsePending(json, expectedDb = 'jissenhyo_p1_v1') {
    assert(typeof json === 'string' && json.length <= 10_000_000, '退避ファイルのサイズが不正です');
    const packet = JSON.parse(json);
    assert(object(packet) && object(packet.payload) && typeof packet.checksum === 'string', '退避形式が不正です');
    assert(packet.payload.format === FORMAT, '対応していない退避形式です');
    assert(packet.payload.dbIdentifier === expectedDb, '保存先DBの識別子が一致しません');
    validateQueue(packet.payload.operations);
    assert(packet.checksum === 'sha256:' + await sha256(canonical(packet.payload)), 'チェックサムが一致しません');
    return packet.payload;
  }
  function planReconciliation(payload, savedEvents, lease) {
    assert(object(payload) && payload.format === FORMAT, '退避形式が不正です');
    validateQueue(payload.operations);
    assert(Array.isArray(savedEvents), '保存済みイベント一覧が不正です');
    const result = [];
    const savedByEvent = new Map(), savedByOp = new Map();
    for (const e of savedEvents) {
      if (!object(e) || typeof e.eventId !== 'string' || typeof e.operationId !== 'string') continue;
      if (savedByEvent.has(e.eventId) && !equalEvent(savedByEvent.get(e.eventId), e)) throw new Error('DB内にイベントID衝突があります');
      savedByEvent.set(e.eventId, e);
      if (!savedByOp.has(e.operationId)) savedByOp.set(e.operationId, []);
      savedByOp.get(e.operationId).push(e);
    }
    const ownsLease = !!(lease && lease.isOwner === true && lease.isValid === true && lease.epochMatches === true);
    for (const op of payload.operations) {
      const sameOp = savedByOp.get(op.operationId) || [];
      const collisions = op.prepared.filter(e => savedByEvent.has(e.eventId) && !sameOp.some(s => s.eventId === e.eventId));
      let status, reason;
      if (collisions.length) { status = 'CONFLICT'; reason = 'イベントIDが別の操作で使用されています'; }
      else if (sameOp.length === op.prepared.length && op.prepared.every(e => sameOp.some(s => s.eventId === e.eventId && equalEvent(s, e)))) {
        status = 'ALREADY_SAVED'; reason = '同一イベントがすべて保存済みです';
      } else if (sameOp.length) { status = 'CONFLICT'; reason = '同一操作IDの保存内容が一致しません（一部保存または内容衝突）'; }
      else if (!ownsLease) { status = 'BLOCKED'; reason = '有効な入力権限が確認できません'; }
      else { status = 'ELIGIBLE_FOR_EXPLICIT_RETRY'; reason = 'DB照合後、同一IDの明示的な再試行候補です'; }
      result.push({ operationId: op.operationId, status, reason, prepared: op.prepared });
    }
    return result;
  }
  return Object.freeze({ FORMAT, exportPending, parsePending, planReconciliation });
});
