# Phase 8 最終統合候補（検証専用・未合格）

基準: juglog_phase8_storage_integration_review_20261026.zip
用途: 新規名前空間での最終統合回帰検証。正式公開版ではない。

変更ファイル: p31.htmlのみ（既存ファイル）。
- IndexedDB: `juglog_phase8_existing_repo_qa_20261024_v36` → `juglog_phase8_final_integration_qa_20261026_db`
- localStorageキー接頭辞: `juglog_phase8_integration_qa_v58_20261024` → `juglog_phase8_final_integration_qa_20261026`
- 保存・復旧ロジックおよびD07F表示ファイルは変更しない。

警告: URLのフォルダ分割は保存領域の分離を保証しない。P31の新しいDB名とキーで隔離する。
旧本番データの移行は行わない。旧検証版・Netlify v45・P31/D07F原本は変更しない。
既存GitHub Pagesのサイトを上書きしない。公開前の操作を含む実機回帰検証は未実施。

実機回帰候補:
1. 新DBでの新規検証実戦作成（専用テスト番号のみ）
2. BB/RBの登録・保留確定・消化完了、履歴と画面集計の整合
3. Safariアプリ切り替え後の保存、再読込保持
4. 未保存・判定不能の復旧制御（孤立DBのみ）
5. ダーク/ライト、5タブの変更影響確認

検査: ZIP完全性、参照先、JS構文（静的）。実ブラウザ・実機結果ではない。
