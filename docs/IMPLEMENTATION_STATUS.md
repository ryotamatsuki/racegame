# IMPLEMENTATION_STATUS

更新: 2026-09-08

状態表記: `VERIFIED` = 実装済みかつ自動/実ブラウザ検証済み、`BLOCKED` = 機能実装は済んでいるが指定実機環境での検証が実行不能。

## 必須要件

| ID | 状態 | 実装・検証 |
| --- | --- | --- |
| F01 | VERIFIED | 形状生成ロジックが異なるオリジナル4機種。公開desktop/mobile E2Eで全機種選択 |
| F02 | VERIFIED | 9カテゴリ×各3パーツ以上、互換性理由表示。公開E2Eで9カテゴリ全交換 |
| F03 | VERIFIED | OrbitControls、ズーム、分解/組立、カテゴリ強調、車輪テスト。公開3D canvasで操作 |
| F04 | VERIFIED | 変更前後の5性能指標、重量/ギヤ/電圧/タイヤ径、説明 |
| F05 | VERIFIED | 自車+CPU3、3周、タイムアタック、順位/結果/DNF |
| F06 | VERIFIED | WORKSHOP OVAL、TECHNICAL RIDGE、SKY LOOP。公開desktop/mobileで全3コース完走 |
| F07 | VERIFIED | 追尾、車載、沿道、全景、AUTO。公開E2Eで5視点操作 |
| F08 | VERIFIED | 3スロット、設定、コース別BEST、schema v1。公開E2Eで保存復元 |
| F09 | VERIFIED | タッチ可能なHTML UI、レスポンシブ横画面、縦画面案内。mobile projectで検証 |
| F10 | VERIFIED | GitHub Actionsでbuildし、Pages有効化済みユーザーサイトの `/racegame/` へ静的配信。公開URL反映確認済み |
| F11 | VERIFIED / A14のみBLOCKED | 14 unit/simulation + 公開WebGL E2E 6/6 PASS。実GPU端末の60秒性能認証だけ環境制約でBLOCKED |

## 受入試験マッピング

| ID | 自動化/証拠 | 現在 |
| --- | --- | --- |
| A01 | clean npm ci / typecheck / 14 Vitest / build | PASS |
| A02 | 公開Playwrightで4機種選択 | PASS |
| A03 | 公開Playwrightで9カテゴリ交換 + save/restore | PASS |
| A04 | 公開Playwrightで分解/組立・車輪テスト + 3D screenshot | PASS |
| A05 | `simulation.test.ts`直線bench | PASS |
| A06 | 同一BALANCE ORCAの2構成をOVAL/TECHNICALで比較 | PASS |
| A07 | 3コースRaceEngine + 公開desktop/mobile 3コース完走 | PASS |
| A08 | ループ頂点の低速接触喪失 + 公開SKY LOOP完走 | PASS |
| A09 | 自車/CPU識別子だけを変えた同一状態の完全一致 | PASS |
| A10 | 30/60/120fps相当accumulator比較 | PASS |
| A11 | pause時刻不変 + 公開browser pause/resume | PASS |
| A12 | 公開Playwright 5カメラ、desktop/mobile projects | PASS |
| A13 | WebGL2 fallback、context lost、storage fallback、DNF | PASS |
| A14 | frame time記録あり。ただし実GPU PC/実スマホ60秒測定 | BLOCKED |
| A15 | `https://ryotamatsuki.github.io/racegame/` 公開後WebGL E2E 6/6 | PASS |
| A16 | `ASSET_SOURCES.md`、外部実行時素材依存なし | PASS |

## 確定したCI / 公開証拠

- PR #1 strict CI: Run `34191921442`、desktop/mobile E2E **6/6 PASS**
- source artifact build: Run `34193496248`、typecheck / 14 tests / build / artifact **PASS**
- Pages同期コミット: `ryotamatsuki/ryotamatsuki.github.io@a299a4e55df9961c75d0257fa4864f80a44035da`
- 公開workflow: Run `34193676899` **success**
- 公開WebGL E2E: Run `34193676899` 内で **6/6 PASS**
- 公開E2E artifact: `racegame-public-e2e-34193676899` (ID `10043312906`)
- 公開URL: `https://ryotamatsuki.github.io/racegame/`

## 現在の残作業

機能実装、マージ、公開、公開URLの主要E2Eについて残作業はありません。

任意の追加検証として、実GPU搭載PCおよび実iPhone/Android端末で仕様A14の60秒性能計測を行えば、唯一のBLOCKEDを解消できます。未実施の実機を「確認済み」とは扱いません。
