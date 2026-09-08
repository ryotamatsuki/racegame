# ASSET_SOURCES

最終更新: 2026-09-08

このゲームは、初回リリースの実行時に外部CDN、有料素材、外部画像、外部音声、GLB/GLTFを必要としません。

| 対象 | 出自 | ライセンス/条件 | 備考 |
| --- | --- | --- | --- |
| 4機種の車体、シャーシ、ホイール、ローラー、翼等 | 本リポジトリのThree.js手続き生成コード | 本リポジトリと同条件 | `src/game/rendering/CarFactory.ts`で生成。実在製品のロゴ・名称・固有モデルを使用しない |
| 3コース、レーン、レール、床、観客席風オブジェクト | 本リポジトリのThree.js手続き生成コード | 本リポジトリと同条件 | `src/data/courses.ts`と`CourseFactory.ts`から生成 |
| 工房の机、カッティングマット、工具、トレー、壁面 | 本リポジトリのThree.js手続き生成コード | 本リポジトリと同条件 | `GarageScene.ts`でプリミティブと材質を組み合わせて生成 |
| モーター音、スタート、ゴール、着地、交換音 | Web Audio APIによる実時間合成 | 録音素材なし | `AudioManager.ts` |
| UIアイコン・ロゴ | CSS/HTMLによる幾何表現とテキスト | 外部素材なし | 実在ブランドのロゴを使用しない |
| フォント | OSのsystem-uiフォント | 各OSの利用条件 | Webフォントを配信しない |

## ランタイム依存ライブラリ

- React / React DOM: MIT License
- Three.js: MIT License
- Vite: MIT License（開発・ビルド）
- TypeScript: Apache-2.0 License（開発）
- Vitest: MIT License（テスト）
- Playwright: Apache-2.0 License（E2Eテスト）

各依存ライブラリの著作権表示とライセンス本文はnpmパッケージに含まれるものを正とします。

## 参考サイトの扱い

`https://storm-race.vercel.app/` は体験・画面構成の参考です。ソースコード、3D素材、画像、音声を取得・複製していません。
