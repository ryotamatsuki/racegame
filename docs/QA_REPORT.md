# QA_REPORT

更新: 2026-09-08

最終判定: **公開・主要機能 PASS / 実GPU端末性能認証のみ BLOCKED**

ビルド成功だけをWebGL描画成功の代替にはしていません。PR、main、公開GitHub Pagesの3段階で検証し、公開URLに対して実際のChromium WebGL E2Eを完走させています。

## 1. 確定した公開状態

- ソース: `ryotamatsuki/racegame` `main`
- 検証・配布artifact生成コミット: `3d20a083ba60660c152261914b41534a90467935`
- 公開基盤: GitHub Pages有効化済み `ryotamatsuki/ryotamatsuki.github.io`
- 公開同期コミット: `a299a4e55df9961c75d0257fa4864f80a44035da`
- 公開URL: `https://ryotamatsuki.github.io/racegame/`
- 公開workflow: `Publish racegame` Run `34193676899`
- 公開E2E: **6/6 PASS**（desktop 3 + mobile 3、1 worker）
- 公開E2E evidence artifact: `racegame-public-e2e-34193676899` / artifact ID `10043312906`

`Publish racegame` は `ryotamatsuki/racegame@main` をcheckoutし、`npm ci`、型検査、14件のVitest、production buildを再実行してから`dist/`だけをユーザーPagesの`/racegame/`へ同期しました。同期後、公開HTMLが反映されるまで待機した上で、公開URLをPlaywrightのbase URLとして6本のE2Eを実行しています。

## 2. 検証環境

### GitHub Actions / 公開E2E

- Runner: Ubuntu 24.04 GitHub-hosted runner
- Node: 22.23.2
- npm install: npm 11系 (`npm ci`)
- Playwright Chromium: Chrome for Testing 151.0.7922.34 / Playwright chromium v1234
- desktop viewport: 1440 × 900
- mobile project: Pixel 7相当、915 × 412 CSS px
- 画質: 既定 `medium`
- WebGL2: 利用可能であり、描画テストはskipされず実行

これはGitHub-hosted runner上のChromiumであり、実GPU搭載PC、実iPhone/iOS Safari、実Android Chromeの性能保証ではありません。

## 3. 自動テスト結果

### Unit / simulation

- `tests/storage.test.ts`: 2 PASS
- `tests/simulation.test.ts`: 12 PASS
- 合計: **14 PASS**

検証内容には、4機種/9カテゴリのデータ整合性、互換性理由、モーター/ギヤの方向性、セッティングの優劣逆転、3コースのRaceEngine完走、低速ループ接触喪失、自車/CPU公平性、30/60/120fps相当固定刻み、pause semantics、保存schema/破損データfallbackを含みます。

### 公開URL Playwright

Run `34193676899` で以下を **6/6 PASS**。

1. desktop: 4機種、9カテゴリ全交換、分解/組立、車輪テスト、保存→別機種→保存構成復元
2. desktop: WORKSHOP OVAL、5カメラ、pause/resume、3周完走、結果
3. desktop: TECHNICAL RIDGEとSKY LOOPを安定構成で各3周完走
4. mobile: 1と同等
5. mobile: 2と同等
6. mobile: 3と同等

公開E2Eの所要は7.8分で、すべて同一の公開URLからJS/CSSを取得して実行しました。結果画面ではプレイヤーが`DNF`ではなく`#順位`であることもassertしています。

## 4. 公開成果物

production buildの主要ファイル:

- `dist/index.html`: 0.61 kB（gzip 0.42 kB）
- `dist/assets/index-BeVCJUkO.css`: 16.40 kB（gzip 4.74 kB）
- `dist/assets/index-B8AWxuvp.js`: 827.54 kB（gzip 225.81 kB）
- source map: 3,822.84 kB（通常閲覧時の初回実行には不要）

外部画像、音声、3Dモデルの実行時依存はありません。車体・コース等はThree.jsで手続き生成し、音はWeb Audio APIで合成します。

## 5. 性能記録とA14の扱い

公開desktop ChromiumのWORKSHOP OVAL結果画面で、既定medium画質・1440×900において、このセッションの記録は次のとおりでした。

- median frame time: **215.1 ms**
- p95 frame time: **242.4 ms**
- 表示対象サンプル: **47**

これはGitHub-hosted runnerのソフトウェア/仮想化WebGL環境であり、仕様の「PC 60fps」「実スマホ30fps以上」を評価する対象端末ではありません。また仕様が要求する実機60秒性能計測を満たす測定ではないため、この値を製品性能として扱いません。A14は虚偽のPASSにせず **BLOCKED（実GPU実機測定未実施）** とします。

描画負荷が高い環境でもレース進行が停止しないこと自体は、250ms frame clamp、最大30 fixed-step catch-upと公開E2E完走で確認済みです。

## 6. A01〜A16 最終判定

| ID | 判定 | 証拠/備考 |
| --- | --- | --- |
| A01 | PASS | clean `npm ci` → typecheck → 14 Vitest → Vite production build成功 |
| A02 | PASS | 公開desktop/mobile E2Eで4機種すべて選択。3D canvasとレース導線も正常 |
| A03 | PASS | 公開E2Eで9カテゴリすべて実交換、保存・別機種変更・保存構成復元一致 |
| A04 | PASS | 公開E2Eで分解/組立・車輪テストを連続操作し3D破綻なし。OrbitControlsの回転/ズーム実装も同一canvasで稼働 |
| A05 | PASS | Vitest直線benchで高トルク/高回転、加速/速度ギヤの方向性を検証 |
| A06 | PASS | 同一BALANCE ORCAでOVAL向け/TECHNICAL向け構成の優劣逆転をVitestで検証 |
| A07 | PASS | RaceEngine 3コース + 公開desktop/mobileでOVAL/TECHNICAL/SKY LOOPの3周完走 |
| A08 | PASS | VitestでSKY LOOP頂点の低速接触喪失。公開SKY LOOPはdesktop/mobileとも完走・結果画面到達 |
| A09 | PASS | 同一状態のplayer/CPUで速度・距離・電池・rpm完全一致 |
| A10 | PASS | 30/60/120fps相当accumulatorで固定刻み結果を比較し許容範囲内 |
| A11 | PASS | engine pause時刻不変 + 公開E2Eのpause/resume。visibilitychange時の自動pause実装あり |
| A12 | PASS | 公開desktop/mobileで追尾/車載/沿道/全景/AUTOを操作 |
| A13 | PASS | WebGL2 fallback、context lost停止、localStorage失敗/破損fallback、DNF処理を実装。外部素材依存がないため素材ネットワーク失敗は非該当 |
| A14 | BLOCKED | CI内記録は取得したが、仕様が要求する実GPU PC/実スマホの60秒性能計測はこの環境では実施不能。未測定をPASSにしない |
| A15 | PASS | 公開URL反映確認後、そのURLに対するWebGL E2E 6/6 PASS。ガレージ→3コース完走まで確認 |
| A16 | PASS | `ASSET_SOURCES.md`保存済み。外部配信素材なし、手続き生成/合成音の出自を記録 |

## 7. 結論

ゲーム本体、公開、desktop/mobile Chromiumでの主要操作、3コース完走については **PASS** です。公開不能・未マージ・テスト待ちの項目は残っていません。

唯一、仕様上の受入条件のうちA14だけは、実GPU端末をこの実行環境から操作できないため **BLOCKED** として残します。これは機能不具合を示すFAILではなく、未測定端末を対応確認済みと偽らないための区分です。
