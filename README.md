# Pulmonary Fibrosis Navigator | 肺纖維化診療導航

靜態互動臨床教學網站：IPF／PPF／CTD-ILD，無後端、無病人資料上傳。可直接使用 GitHub Pages。

## 功能

- HRCT UIP / probable UIP / indeterminate / alternative 引導
- ATS 2022 PPF 生理、影像與症狀三構面計算
- 治療計畫引擎 `PFE`（`/*ENGINE-START*/`）：急性處置 → 病因／免疫治療 → nintedanib、pirfenidone、nerandomilast 逐一評估（適應症、Child-Pugh、eGFR、CYP1A2／CYP3A、懷孕、出血）→ 支持療法與移植轉介 → 監測時程 → 失敗與升級
- Nintedanib、Pirfenidone、Nerandomilast、Treprostinil 機轉與研究
- 台灣 TFDA／健保 6.2.7 初步核對：IPF、SSc-ILD、PF-ILD 初次申請，以及續用／停藥（緩衝期）判讀
- 11 例合成病例（含 3 例高難度，可帶入治療計畫與健保核對）、25 題可計分選擇題（含 5 題高難度）、複習版心智圖（13 分支、224 個重點、搜尋、只看考點、必背數字表）
- 響應式版面、列印摘要、原始文件連結

## 本地使用

直接以瀏覽器開啟 `index.html`，或執行 `python3 -m http.server 8000`，開啟 `http://localhost:8000`。

## 測試

`node tests.cjs`：引擎單元測試；有 Playwright 時另跑瀏覽器 e2e（`URL=` 可指定線上網址）。

## GitHub Pages

1. 建立公開 repository：`yht5582-source/pulmonary-fibrosis-`。
2. 上傳 `index.html`、`README.md`、`.nojekyll` 至 `main` 根目錄。
3. Settings → Pages → Build and deployment → Deploy from a branch → main / (root) → Save。
4. 網址預期為 `https://yht5582-source.github.io/pulmonary-fibrosis-/`，部署後應實際驗證。

## 證據與風險揭露

資料核對截至 **2026-11-09**。ATS/ERS/JRS/ALAT 2022 與 ERS/EULAR 2025 為主要國際指引。健保 6.2.7 初次申請篩檢依已找到的 2023-12-01 公開條文，並附健保署 2026-10 更新整份規定下載連結；此版本**未逐字完成 2026-10 整份條文差異核對**。使用前務必查最新正式規定。

Nerandomilast 美國 FDA 已核准 IPF/PPF；未確認台灣 TFDA／健保狀態。吸入 Treprostinil IPF III 期結果不代表台灣核准 IPF 適應症。

本系統為教學及臨床決策輔助，不取代 MDD、正式診斷與醫囑。不要輸入可識別個人資料。

## 主要來源

- https://pmc.ncbi.nlm.nih.gov/articles/PMC9851481/
- https://pmc.ncbi.nlm.nih.gov/articles/PMC12824641/
- https://www.accessdata.fda.gov/drugsatfda_docs/label/2026/218764s001lbl.pdf
- https://info.nhi.gov.tw/api/INAE3000/INAE3000S01/getPDF?DurgFileName=6.2.7._20231201.pdf
- https://www.nhi.gov.tw/ch/cp-13108-67ddf-2508-1.html