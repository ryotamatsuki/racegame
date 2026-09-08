# MICRO RACER WORKSHOP / racegame

ミニ四駆風のオリジナル模型マシンを選び、9カテゴリのパーツを組み替え、CPU 3台との3周レースまたはタイムアタックでセッティングを比較する3Dブラウザゲームです。

公開URL: https://ryotamatsuki.github.io/racegame/

## 主な機能

- シルエットの異なるオリジナル4機種。
- ボディー、シャーシ、モーター、ギヤ、タイヤ、ローラー、電池、ウイング、ブレーキの各3種以上。
- Three.jsの手続き的3Dモデル。回転、ズーム、分解、再組立、部品強調、車輪テスト。
- 同じ装着データから3D表現と走行パラメータを更新。
- 1/120秒固定刻みの走行モデル。モータートルク曲線、減速比、タイヤ径、質量、抵抗、勾配、カーブ、バンク、ブレーキ、ジャンプ、垂直ループ、電池消費を反映。
- WORKSHOP OVAL / TECHNICAL RIDGE / SKY LOOP の3コース、4レーン、CPU3台。
- 追尾、車載、沿道、全景、AUTOの5カメラ。
- 3保存スロット、コース別ベスト、画質、音量、ミュート、動きを減らす設定をlocalStorageへ保存。
- PCキーボードとタッチUI。WebGL 2非対応、コンテキスト喪失、保存失敗を明示処理。

## 開発

要件: Node.js 22以上。

```bash
npm ci
npm run typecheck
npm test
npm run dev
```

本番ビルド:

```bash
npm run build
npm run preview
```

Viteの`base`はGitHub Pages用に`/racegame/`です。

## 操作

ガレージではドラッグで回転、ホイール/ピンチでズームします。分解表示、車輪テスト、パーツ選択、3枠の保存・読込ができます。

レース中は `1`〜`5` でカメラを切り替え、`Space`で一時停止/再開します。スマートフォンでは画面上の同等ボタンを使用できます。タブが非表示になると自動的に一時停止します。

## テスト

`npm test` はDOM/WebGLに依存しない走行モデルの受入テストを実行します。`npm run test:e2e` はPlaywrightで3D canvas、4機種、9カテゴリの交換、保存復元、分解/再組立、5カメラ、一時停止、3コースのレース完走をdesktop/mobileで確認します。WebGL 2を利用できないテスト環境では描画テストをBLOCKEDとしてskipし、PASSには置き換えません。

詳細は [ゲーム仕様](docs/GAME_SPEC.md)、[アーキテクチャ](docs/ARCHITECTURE.md)、[実装状況](docs/IMPLEMENTATION_STATUS.md)、[QA報告](docs/QA_REPORT.md) を参照してください。

## 公開

ソース・テスト・lockfile・再現可能な配布artifactは、この `ryotamatsuki/racegame` の `main` を正とします。`main`へのpushでは型検査、14件の単体/シミュレーションテスト、production build、desktop/mobile WebGL E2Eを実行します。また `Build deployable site artifact` workflowが検証済みの`dist/`を保存します。

公開先はGitHub Pagesです。連携GitHub Appには新しいPagesサイトを作成するAdministration権限がないため、既にPages有効化済みの `ryotamatsuki/ryotamatsuki.github.io` の `/racegame/` サブディレクトリへproduction buildを同期しています。同リポジトリの `Publish racegame` workflowは `ryotamatsuki/racegame@main` を改めてcheckout・検証・buildし、生成物だけを同期した後、公開URL `https://ryotamatsuki.github.io/racegame/` に対してPlaywrightのdesktop/mobile E2Eを実行します。ユーザーサイトの既存コンテンツは維持します。

## 素材

配信時の外部画像・音声・3Dモデル依存はありません。車体、コース、工房背景はThree.jsで手続き生成し、効果音とモーター音はWeb Audio APIで合成します。詳細は [ASSET_SOURCES.md](ASSET_SOURCES.md) を参照してください。
