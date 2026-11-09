# D07F 果実アイコン原本復元（2026-10-27）

- D07F_dual_theme.html の原本にある白いぶどう・チェリー SVG の形状を index.html に復元。
- 変更対象：index.html の `key grape`、`key cherry` 内の表示要素のみ。
- BB/RB、操作用 data-p31、ボタン色・寸法、P31、保存・復旧処理には変更なし。
- 原本の SVG の `viewbox` は HTML 属性として大小文字無関係。今回は `viewBox` に正規化。
- 静的検証のみ。ブラウザ実機未検証。
