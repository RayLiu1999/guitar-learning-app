# Guitar Lab 電吉他學習平台 - 系統規格書 (System Specification)

## 1. 專案總覽 (Project Overview)

Guitar Lab 是一個專為電吉他玩家打造的網頁版學習平台。系統採用前後端分離架構，結合 Markdown 文本驅動與互動式 React 元件，旨在提供結構化、視覺化且具備進度追蹤功能的學習體驗。

## 2. 技術堆疊 (Tech Stack)

### **前端 (Frontend)**

- **核心框架**: React 18, TypeScript, Vite
- **路由管理**: React Router DOM
- **UI 與樣式**: Tailwind CSS (原生 CSS 客製化捲軸與玻璃擬態排版)
- **內容解析**: `react-markdown`, `remark-gfm`
- **圖表與可視化**:
  - `react-activity-calendar` (Github 風格學習熱點圖)
  - `react-force-graph-2d` (知識圖譜)
- **測試工具**: Vitest, React Testing Library

### **後端 (Backend)**

- **核心框架**: Node.js, Express.js, TypeScript
- **資料庫**: MongoDB (使用 Mongoose ORM)
- **環境變數**: dotenv
- **測試工具**: Vitest, Supertest, MongoDB Memory Server

---

## 3. 專案目錄結構 (Directory Structure)

專案根目錄為 `guitar-learning-app/`，主要包含 `frontend/`、`backend/` 兩大子專案，以及位於源碼中的 Markdown 教材目錄。

```text
guitar-learning-app/
├── docs/                   # 專案規格與說明文件
├── frontend/               # React 前端專案
│   ├── src/
│   │   ├── api/            # API 客戶端封裝 (axios/fetch)
│   │   ├── components/     # 共用 UI 與業務元件
│   │   │   ├── fretboard/  # 互動式指板圖 SVG 模組
│   │   │   ├── Layout.tsx  # 主版面佈局
│   │   │   ├── Metronome.tsx # 節拍器
│   │   │   ├── SkillTree.tsx # 技能樹渲染
│   │   │   └── KnowledgeGraph.tsx # 知識圖譜渲染
│   │   ├── pages/          # 路由頁面 (HomePage, CategoryPage, ArticlePage)
│   │   └── hooks/          # 自訂 Hooks (例如 useMetronome)
│   ├── index.html
│   ├── vite.config.ts
│   └── tailwind.config.js
└── backend/                # Express 後端專案
    ├── src/
    │   ├── config/         # 資料庫與全域設定 (db.ts)
    │   ├── content/        # 所有 Markdown 教材 (technique, theory, ghost, dinner)
    │   ├── controllers/    # 路由邏輯控制
    │   ├── models/         # Mongoose Schema 定義 (Progress.ts 等)
    │   ├── routes/         # Express 路由定義 (content.ts, progress.ts)
    │   ├── services/       # 核心商業邏輯 (catalogService.ts, practiceMenuService.ts)
    │   └── index.ts        # 應用程式進入點
    ├── .env
    └── package.json
```

---

## 4. 核心功能模組 (Core Modules)

### A. 動態文章解析與渲染 (Markdown & Interactive Component Rendering)

- 平台以 Markdown 為教材主體，將內容放置於 `backend/src/content/` 底下的不同分類目錄中。
- 前端 `ArticlePage` 動態拉取內容，並透過 `react-markdown` 渲染。
- **自訂元件攔截**：能攔截 Markdown 內的特定語法（例如 YAML/JSON code block 或 `## ✅ 本篇檢查清單`），將其轉換為互動式的 `Fretboard` (指板圖) 或是勾選式的任務清單。

### B. 互動式指板系統 (Interactive Fretboard)

- 基於 SVG 打造的動態吉他指板解說圖（支援無限弦數/格數）。
- 支援和弦按法高亮、音符色彩標記以及觸控/點擊觸發 Web Audio API 的琴音回饋。

### C. 學習進度與熱點圖 (Progress Tracking & Heatmap)

- 支援透過頁面底端檢查清單打卡。
- 首頁包含以 `react-activity-calendar` 為基礎的學習熱點圖 (Heatmap)，展示過去每日的練習活躍度。

### D. 每日智能練習菜單 (Daily Practice Menu)

- **演算法推薦**：後端透過 `practiceMenuService.ts` 自動掃描使用者的閱讀歷程與清單勾選狀態，將課程分類為：
  1. **[Continue] 接續練習**：未完成全部 Check items 的課程。
  2. **[Review] 溫故知新**：已完成超過 7 天的課程。
  3. **[New] 新挑戰**：尚未開始的後續章節。

### E. 知識圖譜與雙向連結 (Knowledge Graph & Backlinks)

- 支援在 Markdown 中使用 `[[article_id]]` 語法進行站內連結。
- 後端 `catalogService.ts` 啟動時掃描全域 Markdown 構建**路由目錄**、**正向連結 (forwardLinks)** 及**反向連結 (backlinks)** 快取。
- 前端根據目錄產出視覺化的 2D 關聯圖譜與文章底部的「反向連結」區塊。

### F. 內建工具：極簡節拍器 (Metronome)

- 使用者可在不離開頁面的情況下使用背景節拍器。
- 支援高精度計時 (`AudioContext` scheduling)、BPM 滑桿與快捷加減按鈕。

---

## 5. 核心 API 規格 (RESTful API Specification)

### 📚 教材與內容路由 (Content)

- `GET /api/content/catalog`
  - 描述：取得全站目錄與各文章的元數據（包含 `forwardLinks`, `backlinks`, `title`）。
  - 回傳：按分類分組的 `CatalogItem[]` 字典。
- `GET /api/content/:category/:filename`
  - 描述：取得解析並驗證過的 Markdown 文件原始碼。

### 📊 進度與追蹤路由 (Progress)

- `GET /api/progress/:userId`
  - 描述：取得該使用者所有課程的學習進度（包含完成的項目與上次更新時間）。
- `POST /api/progress/:userId/item`
  - 描述：寫入/覆蓋特定文章的 Check item 勾選狀態，此動作會同步更新 Heatmap 紀錄。
- `GET /api/progress/daily-menu?userId=:userId`
  - 描述：取得根據演算法生成的每日實踐清單（Continue, Review, New）。
- `GET /api/progress/:userId/heatmap`
  - 描述：統計返回最近數月內，該使用者每日的活動紀錄總數（供日曆圖表渲染）。
