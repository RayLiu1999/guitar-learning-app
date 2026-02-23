---
name: guitar-app-rules
description: 電吉他學習網站專案的開發規範與技術堆疊
---

# 專案架構與技術堆疊

本專案為一個電吉他互動學習網站，採用前後端分離架構，並以 TDD（測試驅動開發）為開發核心。

## 後端 (backend)

- 語言：Node.js + TypeScript
- 框架：Express
- 資料庫：MongoDB (使用 Mongoose)
- 測試：Vitest + Supertest + mongodb-memory-server
- 開發指令：`pnpm dev`, `pnpm test`

## 前端 (frontend)

- 語言：React + TypeScript
- 框架：Vite
- 樣式：Tailwind CSS (含客製化 theme 與 animations)
- 測試：Vitest + React Testing Library + jsdom
- 開發指令：`pnpm dev`, `pnpm test`

## 核心守則

1. **TDD 優先**：新增任何 API 或元件，必須先撰寫整合測試/單元測試，確保測試通過後才算是功能完成。
2. **型別安全**：前後端皆使用 TypeScript，禁止使用 `any`。
3. **組件設計**：前端組件須套用 Tailwind 的 `glass-card` 等預設樣式，保持網頁風格一致性 (深色吉他主題)。
4. **Markdown 渲染**：文章為 MD 格式，使用 `react-markdown` 渲染，並有客製化的 checkbox 解析作為打卡用。
