# ARCHITECTURE

版: 1.0 / 2026-09-08

## 1. 全体構成

```text
src/data/             機種・パーツ・コース・調整値
src/game/simulation/  DOM/WebGL非依存の固定刻み走行・レース進行
src/game/rendering/   Three.jsシーン、手続き的車体、コース
src/game/audio/       Web Audio API
src/storage/           localStorage schema v1
src/ui/                React UI
```

Reactは画面遷移、選択、結果等の低頻度状態を担当し、毎フレームの車両位置更新はThree.js側で直接行います。`RaceEngine`はDOMやWebGLを参照せず、Vitestだけで検証できます。

## 2. データ境界

`PartDefinition` → `Setup` → `deriveVehicle()` → `DerivedVehicle` の順に、装着部品から走行パラメータを一意に導出します。レンダリングも同じ`Setup`を`CarFactory`へ渡すため、「画面上の部品」と「物理計算上の部品」を別管理しません。

レース状態`VehicleRaceState`とThree.jsの`CarVisual`も分離しています。CPUと自車は同じ`stepVehiclePhysics()`を使用し、プレイヤー専用の加速補正はありません。

## 3. 座標、コース、姿勢

世界座標はY-up、単位はm、kg、s、N、radです。各コースはパラメトリック中心線を1周900点でサンプリングし、4レーンを横方向へオフセットします。各点に次を持たせます。

- 弧長 `s`
- 位置 `position`
- 接線 `tangent`
- 路面法線 `normal`
- 横方向 `side`
- 曲率 `curvature`
- バンク `bank`
- ジャンプ、着地点、ループ等のセクション情報

`CourseFactory`の路面メッシュと`RaceEngine`の走行経路は、同じ`LaneTrack`を参照します。レース中の車体姿勢は `(side, normal, tangent)` の連続フレームからThree.jsの回転行列を生成します。SKY LOOPではループ中心向きの法線を明示し、閉路継ぎ目で外周路の法線へ連続するよう設計しています。

## 4. 固定時間刻み

物理刻みは `1/120 s`。レンダリング側はフレーム時間をaccumulatorへ加え、120 Hzの固定ステップを必要回数だけ進めます。1フレーム最大10ステップに制限し、250 msを超える大幅な遅延は時間飛びを防ぐため破棄します。

描画FPSを30/60/120相当に変えても、固定ステップの結果が1刻み以内になることを単体テストします。

## 5. 駆動モデル

ゲーム用近似であり、実在ミニ四駆の実測再現ではありません。

モーター回転数:

`omega_motor = (v / r_tire) * gearRatio`

トルク曲線:

`torque = stallTorque * max(0, 1 - rpm / maxRpm) * voltageFactor`

電池係数:

`voltageFactor = (nominalVoltage / 2.35) * (0.78 + 0.22 * sqrt(chargeRatio))`

駆動力:

`F_drive = torque * gearRatio * efficiency / tireRadius`

接線方向加速度:

`a = (F_drive - F_roll - F_aero - F_roller - F_brake + F_grade) / mass`

転がり抵抗は `mass*g*Crr`、空気抵抗は速度二乗、勾配項は接線のY成分から導出します。速度を直接加点するパーツ補正は使用しません。

## 6. コーナー、ループ、ジャンプ

コーナーでは `v^2 * curvature` を必要横加速度とし、タイヤグリップ、ローラー支持、ウイング安定性から許容値を求めます。超過するとまず減速と不安定量が増え、累積不安定量が閾値を越えた場合のみコースアウトします。事故は乱数抽選では決定しません。

垂直ループでは中心向き法線に対して

`N/m = v^2 / R - g_inward`

を計算し、支持力が小さすぎる場合に接触喪失とします。頂点で低速の車両が路面へ吸着したまま進めないことを単体テストします。ループ内で逸脱した場合は入口側の安全地点へ戻し、2秒停止後に再走します。

ジャンプでは離陸後だけ弾道運動を使います。`airY = launchVy*t - 0.5*g*t^2`。着地点は同一レーンに記録された弧長で判定し、高架下の別路面を世界Y座標だけで誤認しません。着地時の許容差はグリップとウイング安定性で変化します。

## 7. レース、公平性、順位

- 通常レース: 自車1 + CPU3、3周。
- タイムアタック: 基準レーン1を使用。
- CPUは公開されたパーツ構成を使い、同一物理モデルで計算。
- レーン割当はseedから決定。
- 順位は `lap + s/laneLength` を共通進捗として比較し、外周レーンの総距離だけで不利にしません。
- 3回コースアウトまたは180秒上限でDNF。
- コースアウト復帰は2秒停止。レース時計は進行。

## 8. カメラと音

追尾、車載、沿道、全景、AUTOの5視点を`RaceScene`が所有します。AUTOは6秒ごとに視点を変更しますが、「動きを減らす」設定時は追尾視点へ固定します。

`AudioManager`がAudioContext、モーターOscillator、GainNodeを単独所有します。モーター音程はRPMに連動し、スタート、ゴール、着地、交換音はWeb Audio APIで短い合成音を生成します。画面非表示・一時停止ではゲインを停止し、復帰時に再開します。

## 9. GPU・イベント資源の所有

`GarageScene`と`RaceScene`は、それぞれ作成したRenderer、Scene、ResizeObserver、DOM/Windowイベントを`dispose()`で破棄します。`CarVisual`と`CourseVisual`はGeometry/Materialを明示disposeします。画面遷移時にReact effect cleanupから必ず`dispose()`します。

## 10. 保存

localStorage key: `racegame-save-v1`。schema versionは1です。

保存内容:
- 3つのセッティングスロット
- 画質、音量、ミュート、動きを減らす
- コース別自己ベスト

復元時に機種ID、全9カテゴリの部品IDとカテゴリ一致を検査します。不明ID、JSON破損、アクセス拒否は既定値へフォールバックし、ゲーム自体は継続します。

## 11. GitHub Pages

Vite `base='/racegame/'`。SSR・API・秘密鍵なしの静的配信です。`main`のPages workflowだけがデプロイし、PR workflowは型検査・単体テスト・ビルド・E2Eを行うだけで公開しません。
