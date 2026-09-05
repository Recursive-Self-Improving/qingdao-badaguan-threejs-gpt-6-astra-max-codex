# 山海漫遊 · 青島八大關

以 Three.js 建立的秋日海岸虛擬景觀。花石樓、山海關路的梧桐、第二海水浴場與公主樓串成一段可以自由探索的慢旅行。

## 啟動

```sh
npm install
npm run dev
```

開啟 `http://localhost:5173`。正式建置與預覽：

```sh
npm run build
npm run preview
```

使用 Node.js 20.19+ 或 22.12+，以及支援 WebGL 2 的現代瀏覽器。建議開啟瀏覽器硬體加速；無 GPU 時會自動使用較簡單的材質與陰影，並依效能調整畫布解析度，實際影格率仍取決於裝置。網站的場景、字型、縮圖與音訊均在本機載入或生成，執行時不依賴第三方服務。

## 操作

| 操作 | 功能 |
| --- | --- |
| 拖曳滑鼠／手指 | 旋轉自由視角，或在步行模式環顧 |
| W A S D／方向鍵 | 前後左右移動 |
| Shift | 加速 |
| Q / E | 自由視角下降／上升 |
| 滾輪 | 自由視角拉近／拉遠；步行模式前進／後退 |
| R | 重置目前景點視角，返回自由探索 |
| P | 拍攝目前場景，製作明信片 |
| M | 顯示／隱藏景觀地圖 |
| ? | 操作說明 |
| Esc | 關閉視窗、停止導覽，或釋放鎖定的滑鼠 |

手機可從底部「沿途風景」選擇景點及開始步行，使用畫面方向鍵移動。步行具有建築碰撞、地形高度與海岸邊界限制。

頁面包含四個景點切換、慢遊導覽、08:00–19:00 的光線控制、海霧與落葉設定、全螢幕、合成海浪／鳥鳴，以及可下載的明信片。最多六張明信片可收藏於瀏覽器 localStorage；儲存不可用時會提示下載保留。

## 場景與真實地點

這是根據實景特徵製作的藝術化重建，並非測繪或一比一數位孿生。道路距離、建築尺度與地形為漫遊體驗重新編排；時間、海霧與環境音也屬模擬。

- 街區的多國風格別墅、林蔭路與海岸氣質，參考[青島政務網「八大關風景區」](https://www.qingdao.gov.cn/yfqd/qdwl/cjfw/wyqtsjd/202009/t20200910_521991.shtml)。
- 花石樓的花崗岩立面、圓形塔樓、多角形樓體及雉堞式女兒牆，參考[青島城市發展集團的歷史建築資料](https://www.qdcfjt.com/index.php/building/detail/69.html)。
- 山海關路的法國梧桐與居庸關路的銀杏，參考[青島日報的八大關街區介紹](https://www.dailyqd.com/channelzt/2020-09/02/content_521220.htm)。

Noto Serif TC 與 Noto Sans TC 使用 Google Fonts 提供的子集，授權文字位於 `public/fonts/OFL-serif.txt` 及 `public/fonts/OFL-sans.txt`。建築、材質、植被、海面、地圖與縮圖由程式生成，未使用外部 3D 模型或照片作為場景替代品。

## 驗證

```sh
npx playwright install chromium
npm run test:e2e
```

端到端測試覆蓋場景啟動、四個景點切換、滑鼠旋轉、鍵盤移動、步行碰撞、光線／音訊／地圖設定、導覽、明信片下載與跨重新整理收藏，以及手機上的實際觸控移動。

`node scripts/visual-check.mjs --all` 可擷取桌面、四個景點、步行與手機視角，輸出至 `/tmp/badaguan-*.png`，並回報瀏覽器錯誤與軟體渲染的參考影格率。可用 `PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH` 指定瀏覽器執行檔。

主要程式：`src/main.ts`（介面）、`src/scene/engine.ts`（渲染與導航）、`src/scene/architecture.ts`（建築）、`src/scene/landscape.ts`（地形與植被）、`src/scene/atmosphere.ts`（天空與海面）、`src/audio.ts`（環境音）。
