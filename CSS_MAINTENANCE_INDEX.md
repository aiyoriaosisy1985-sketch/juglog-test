# Juglog 工程16｜CSS保守索引（実機検証前）

## 更新場所

| 画面・対象 | 編集先 | 留意点 |
|---|---|---|
| 主画面の共通部品 | `stage16-main.css` | ダーク／ライト、工程15シミュの上書きに注意 |
| 主画面の後段補正 | `stage16-post.css` | 最終読込順の維持が必要 |
| P31の実戦画面・縦向き調整 | `stage16-p31.css` | `@media` と `!important` に注意 |
| 元CSSの参照用記録 | `_css_source_archive/` | 実行時には読み込まない |

## 今回整理した指定

- 後段の同条件・同セレクター・同優先度に確実に上書きされる指定のみ削除。
- CSSセレクターとメディア条件のルール順序は変更しない。
- 既存の最終宣言値の比較は一致。ただしブラウザ上の計算済みCSS一致とは異なる。

## 例外台帳：異なる値の再指定（7組）

| CSS | 条件 | セレクター | 属性 | 判断 |
|---|---|---|---|---|
| `stage16-main.css` | 通常 | `#p8-create-dialog,#p8-bonus-dialog` | `max-height` | 旧ブラウザ向けフォールバック可能性。維持 |
| `stage16-main.css` | 通常 | `#jgl15-sim-result` | `padding` | 工程15保護。実機承認前は維持 |
| `stage16-main.css` | 通常 | `#jgl15-sim-result` | `background` | 工程15保護。実機承認前は維持 |
| `stage16-main.css` | 通常 | `html[data-theme="light"] #jgl15-sim-result` | `background` | 工程15保護。実機承認前は維持 |
| `stage16-p31.css` | media (orientation:portrait) and (max-width:600px) | `#tab-play .action-board.sp .record-card` | `box-shadow` | 装飾／互換性の差があるため維持 |
| `stage16-p31.css` | media (orientation:portrait) and (max-width:600px) | `#tab-play .action-board.sp .record-card` | `background` | 装飾／互換性の差があるため維持 |
| `stage16-p31.css` | media (orientation:portrait) and (max-width:600px) | `#tab-play .action-board.sp .record-card` | `border` | 装飾／互換性の差があるため維持 |

## 構造整理完了時の保護判断

残る7組はCSS_STAGE16_PRE_DEVICE_AUDIT.mdで理由を明記した保護例外です。視覚差分を確認できるまで変更しません。新しい採用デザインCSSを追加する作業には進みません。

## 未検証事項

- 実ブラウザのComputed Style／レイアウト比較：未実施
- iPhoneでの限定実機確認：未実施
- デザイン反映：未実施
- GitHub反映・ライブラリ登録：未実施
