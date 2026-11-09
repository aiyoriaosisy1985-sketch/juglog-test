# Phase 8 機種別小役参考値拡張（静的検査版）

基準：juglog_phase8_machine_sources_QA_20261027.zip

## 実装
- マイジャグラーV：前版を維持。
- マイジャグラーVI：Vの小役値を暫定利用する前版の方針を維持。
- ゴーゴージャグラー3：ぶどうのみ6設定分の参考値を登録し、全G実測条件を満たしたときのみ利用。
- ミスタージャグラー：ぶどうのみ6設定分の参考値を登録し、全G実測条件を満たしたときのみ利用。
- ジャグラーガールズSS：ぶどう参考値候補を登録したが、設定4に出典間の1/5.98と1/5.89の相違があるため利用停止。BB/RB推測は従来どおり。
- 3機種とも非重複チェリーは参照値が未確定のため推測に不使用。

## 確認事項
- 北電子公式のマイジャグラーVとVIのBB/RB確率表は全設定で同値であることを確認。従来の「値が同じこと自体が問題」という監査記載は訂正。
- 参考値はメーカー公表値ではない。ガリぞう氏との対応関係・原著照合は公開前の確認事項。
- 変更ファイル：phase8-smallrole-registry.js、phase8-smallrole-estimator.js（小役値がない機種でチェリーを使用しない安全条件）、本READMEのみ。
- P31保存・復旧・Undo、画面CSS、BB/RBテーブルには変更なし。
- 計算の動作確認はローカル固定入力のみ。iPhone実機テスト前につき本番反映禁止。

公式確率出典：
https://www.kitadenshi.co.jp/slot/myjuggler5/
https://www.kitadenshi.co.jp/slot/myjuggler6/

資料間相違参考：https://jugglersnet.com/analysis/jugglergirls
