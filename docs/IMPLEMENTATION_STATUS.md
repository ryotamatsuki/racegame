# IMPLEMENTATION_STATUS

更新: 2026-09-08

状態表記: `IMPLEMENTED` = コード実装済み、`VERIFIED` = 自動/実ブラウザ検証済み、`PENDING` = 検証待ち、`BLOCKED` = 実行環境等で検証不能。

## 必須要件

| ID | 状態 | 実装 |
| --- | --- | --- |
| F01 | IMPLEMENTED | 形状生成ロジックが異なる4機種 |
| F02 | IMPLEMENTED | 9カテゴリ×各3パーツ、互換性理由表示 |
| F03 | IMPLEMENTED | OrbitControls、ズーム、分解/組立、カテゴリ強調、車輪テスト |
| F04 | IMPLEMENTED | 変更前後の5性能指標、重量/ギヤ/電圧/タイヤ径、説明 |
| F05 | IMPLEMENTED | 自車+CPU3、3周、タイムアタック、順位/結果/DNF |
| F06 | IMPLEMENTED | OVAL、TECHNICAL、SKY LOOP |
| F07 | IMPLEMENTED | 追尾、車載、沿道、全景、AUTO |
| F08 | IMPLEMENTED | 3スロット、設定、コース別BEST、schema v1 |
| F09 | IMPLEMENTED | タッチ可能なHTML UI、レスポンシブ横画面、縦画面案内 |
| F10 | PENDING | Pages workflowは実装予定。実デプロイ確認待ち |
| F11 | PENDING | 単体/E2Eテストは実装済み。GitHub Actionsと公開URL検証待ち |

## 受入試験マッピング

| ID | 自動化/証拠 | 現在 |
| --- | --- | --- |
| A01 | CI: npm ci / typecheck / vitest / build | PENDING |
| A02 | Vitestデータ検査 + Playwright 4機種操作 | PENDING |
| A03 | Vitestカテゴリ検査 + Playwright交換/保存 | PENDING |
| A04 | Playwright分解/組立 + screenshot | PENDING |
| A05 | `simulation.test.ts`直線bench | PENDING |
| A06 | 同一BALANCE ORCAの2構成をOVAL/TECHNICALで比較 | PENDING |
| A07 | 3コースのRaceEngine完走 + Playwright OVAL完走 | PENDING |
| A08 | ループ頂点の低速接触喪失単体テスト | PENDING |
| A09 | 自車/CPU識別子だけを変えた同一状態の完全一致 | PENDING |
| A10 | 30/60/120fps相当accumulator比較 | PENDING |
| A11 | pause中の時刻不変 + browser pause/resume | PENDING |
| A12 | Playwright 5カメラ、desktop/mobile projects | PENDING |
| A13 | WebGL2 fallback、localStorage fallback、DNF、context lost handler | PENDING |
| A14 | `RaceScene.getPerformance()` + E2E実測記録 | PENDING |
| A15 | Pages公開後のURL実操作 | PENDING |
| A16 | `ASSET_SOURCES.md` | IMPLEMENTED |

## 直近の次作業

1. GitHub Actions上でlockfileを生成し、リポジトリへ固定する。
2. `npm ci`、型検査、Vitest、本番ビルドを実行し、失敗を修正する。
3. Playwright Chromiumでdesktop/mobile E2Eを実行する。WebGL2が無い場合はBLOCKED扱い。
4. Pages workflowを実行し、公開URLでガレージ→レース結果を再確認する。
5. `QA_REPORT.md`を実測結果、workflow run、証拠へ更新する。
