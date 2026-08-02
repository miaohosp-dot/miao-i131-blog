# 貓甲亢與放射碘治療 · 衛教部落格

喵屋貓咪專科醫院的衛教部落格。純靜態網站，內容以 Markdown 撰寫，由建置腳本產生 HTML。

## 網址結構

每篇文章都是同一網域下的獨立網址，格式為 `/YYYYMMDD-slug/`：

```
/                                     首頁（文章列表）
/20260802-what-is-hyperthyroidism/    什麼是貓甲狀腺機能亢進？
/20260802-treatment-comparison/       四種治療方式，該怎麼選？
```

網址直接由 `content/` 底下的檔名決定，檔名必須是 `YYYYMMDD-英文小寫slug.md`。

## 新增一篇文章

1. 在 `content/` 新增檔案，例如 `20260915-methimazole-side-effects.md`
2. 開頭寫上 frontmatter，然後接內文（Markdown）：

```markdown
---
title: 甲亢用藥的副作用該怎麼觀察？
date: 2026-09-15
author: 周春婷 獸醫師
tag: 用藥照護
readingTime: 5
excerpt: 顯示在首頁卡片上的一段摘要。
---

這裡開始寫內文……
```

3. 執行建置：

```bash
npm run build
```

首頁的卡片會自動新增、自動依「最後更新時間」重新排序（最新的在最前面），不需要手動改首頁。

## 修改既有文章

直接編輯 `content/` 裡的 `.md` 檔，然後重新建置即可。

「最後更新」日期取自該檔案的 **git 最後提交時間**；若檔案尚未進 git，則退回使用檔案的修改時間。因此每次改完並提交，日期會自動更新，卡片排序也會跟著變動。

## 本機預覽

```bash
npm run serve
```

然後開啟 http://localhost:8899

## 目錄結構

```
content/          文章來源（Markdown）
assets/style.css  全站樣式
assets/img/       圖片
assets/counter.js 瀏覽次數計數器
site.config.js    站名、聯絡資訊、HERO 圖、圖片出處
build.js          建置腳本
dist/             產生的網站（不進版控）
```

## 瀏覽次數計數器（Supabase）

每篇文章有獨立計數器，首頁本身也有一個，且首頁卡片會顯示各篇的累計次數。

設定步驟：

1. 到 [supabase.com](https://supabase.com) 建立專案
2. 進入 **SQL Editor**，貼上並執行 `supabase-setup.sql`
3. 到 **Project Settings → API**，複製 Project URL 與 anon public key
4. 填進 `assets/supabase-config.js`
5. 重新建置

未設定時計數器會自動隱藏，網站其他功能完全正常。

`anon key` 是設計成可公開的（受資料表 RLS 政策保護），提交到 git 沒有問題。
**不要**把 `service_role` key 放進前端。

## 排版原則：不破框

`assets/style.css` 中特別處理了幾件事，修改樣式時請保留：

- 全域 `box-sizing: border-box`
- 圖片、影片 `max-width: 100%; height: auto`
- 文字元素 `overflow-wrap: break-word`，長英文藥名與網址不會撐破容器
- 表格一律包在 `.table-wrap` 中，改為表格自身橫向捲動
- HERO 圖片寬度不超過內容文字區，並保持原始長寬比

已在 320px 與 375px 兩種寬度下驗證全部頁面無橫向溢出。

## 部署

`.github/workflows/deploy.yml` 在推送到 `main` 時會：

1. 建置網站
2. 部署到 GitHub Pages
3. 同步部署到 Cloudflare Pages

Cloudflare 部署需要在 repo 的 **Settings → Secrets and variables → Actions** 設定兩個 secret：

| 名稱 | 取得方式 |
| --- | --- |
| `CLOUDFLARE_API_TOKEN` | Cloudflare 後台 → My Profile → API Tokens，權限選 `Cloudflare Pages:Edit` |
| `CLOUDFLARE_ACCOUNT_ID` | Cloudflare 後台 Workers & Pages 頁面右側 |

GitHub Pages 需要在 **Settings → Pages → Source** 選擇 `GitHub Actions`。

## 內容聲明

本站文章為一般衛教資訊，不能取代獸醫師的臨床診斷。發布前請由具獸醫師資格者審閱內容的正確性。
