# QA_REPORT

更新: 2026-09-08

このファイルは初回実装コミット時点の検証台帳です。GitHub Actionsと公開URLでの検証完了後に、各項目をPASS/FAIL/BLOCKEDへ確定します。ビルド成功をWebGL描画成功の代替にはしません。

## 環境

- ローカル作業環境: Node.js 22.16.0 / npm 10.9.2
- 制約: 作業コンテナからgithub.com/npm registryへのDNS通信が遮断されているため、依存インストールとブラウザ取得はGitHub Actionsで実施する。
- 純粋TypeScriptのsimulation/dataサブセットはローカルのTypeScript 5.8.3でCommonJSへ一時コンパイルして動作確認済み。最終判定はpackage.jsonで固定したTypeScript 5.9.3のActions結果を正とする。

## 事前モデル確認

正式なA01〜A16判定前のチューニング確認として次を実施した。

- 4機種の標準構成がWORKSHOP OVALを3周完走。
- 高安定構成でTECHNICAL RIDGEとSKY LOOPを完走可能。
- SKY LOOP頂点へ低速進入する状態では接触喪失条件が成立。
- 同一BALANCE ORCAで、直線寄り構成とテクニカル寄り構成のコース別タイム順位が逆転。
- ループ内逸脱後はループ途中へ停止復帰せず、入口側の安全地点へ戻す。

これらは開発中のローカルモデル確認であり、GitHub Actionsの正式PASSではない。

## A01〜A16

| ID | 判定 | 証拠/備考 |
| --- | --- | --- |
| A01 | PENDING | Actions待ち |
| A02 | PENDING | Vitest + Playwright待ち |
| A03 | PENDING | Vitest + Playwright待ち |
| A04 | PENDING | Playwright screenshot待ち |
| A05 | PENDING | Vitest待ち |
| A06 | PENDING | Vitest待ち |
| A07 | PENDING | Vitest + Playwright待ち |
| A08 | PENDING | Vitest待ち |
| A09 | PENDING | Vitest待ち |
| A10 | PENDING | Vitest待ち |
| A11 | PENDING | Vitest + Playwright待ち |
| A12 | PENDING | desktop/mobile Playwright待ち |
| A13 | PENDING | unit/browser異常系確認待ち |
| A14 | PENDING | 実ブラウザ計測待ち |
| A15 | PENDING | Pages公開後確認待ち |
| A16 | PENDING | `ASSET_SOURCES.md`のリポジトリ保存確認待ち |
