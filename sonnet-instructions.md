# Inner Compass · 製作計劃

> 規格來源：`inner_compass/CLAUDE.md`
> 工作環境：Claude Code（直接編輯 `src/App.jsx`，不再附完整檔案）

---

## 整體拆批

工具規模大（16 個 entity、Firebase、AI API、5000+ 行），分 4 批做：

| 批次 | 內容 | 狀態 |
|---|---|---|
| A | 基礎架構 + 日常層（Home、日常層、儀式菜單、小勇敢、設定） | ✅ 完成 |
| B | 關係管理 + 深度量表 + 觀察期提示 | ✅ 完成 |
| C | 關係支援（5 tab，含 AI 陪問員） | ✅ 完成 |
| D | 回顧（季度 + 年度卷軸）+ 整體打磨 + 完整匯出 | ✅ 完成 |

每批做完跑 `npm run build` 驗收，再進下一批。架構大改時用 `/clear` 開新 session。

---

## 批次 A：完成內容

- ✅ Home 頁（引言卡、主儀式卡、關係一行文字、月份足跡圓點、其他入口）
- ✅ 日常層（晨間錨點 / 週日見證 Step 流程 / 月度獨處）
- ✅ 儀式菜單（4 固定 + 自訂，做了才記）
- ✅ 小勇敢紀錄（時光軸）
- ✅ 設定頁（主題切換、daily.json / relationships.json 匯出入）
- ✅ 底部導航 (mobile) + 側邊導航 (desktop)

---

## 批次 B：完成內容

- ✅ 關係清單：active 關係卡、過往關係（摺疊）
- ✅ [開始追蹤一段關係] 流程：輸入代號、起始日期，自動 `stage = observation`
- ✅ 單一關係頁：代號 + 階段徽章 + 追蹤天數 + [深度量表] 入口 + 關係筆記
- ✅ 深度量表 6 題可填（漸高刻度視覺、7 分警戒線 dashed border、7-10 coral 數字）
- ✅ 警戒訊息依 alertCount 正確顯示（船的語言）
- ✅ 觀察期滿 30 天出現脈動提示球 + 點擊可切換 developing
- ✅ Home 顯示關係一行文字，邏輯正確
- ✅ 可切換 developing / 暫停 / 結束
- ✅ 結束關係可寫結語，進「過往」區
- ✅ relationships.json 可匯出（含 depthGauges）

---

## 批次 C：完成內容

**新建檔案**
- `netlify/functions/claude.js` — Anthropic API proxy（`claude-sonnet-4-6`，max_tokens 1000）
- `netlify/functions/package.json` + `@anthropic-ai/sdk` 已安裝
- `netlify.toml` 加入 `[functions] directory = "netlify/functions"`

**新資料狀態（localStorage 持久化，key prefix: `ic-v1-`）**
- `groundFriends`、`groundFriendCheckIns`、`openMarks`、`identificationAssessments`、`loweringProtocols`、`aiCompanionSessions`

**關係支援頁（`RelationshipSupportPage`，5 tabs）**

| Tab | component | 功能 |
|---|---|---|
| 地面朋友 | `GroundFriendTab` | 新增/編輯最多 3 位；記錄對話三題；顯示上次聯繫天數 |
| 辨識工具箱 | `IdentificationTab` | 五項核對（1–5）→ 總分；三個 Deal Breaker checkbox；結果存檔 |
| 降低捲入度 | `LoweringTab` | 6 項 checklist；14 天提示再測量表；全勾完成訊息 |
| 開放標記 | `OpenMarkTab` | 新增標記（自動 +14 天）；觀察紀錄；到期轉追蹤/放下 |
| AI 陪問員 | `AICompanionTab` | 軟閘門 → Raman 月亮頭像對話（三題）→ 可儲存 session |

**已加入 Icon**：`send`（送出）、`back`（返回）

**部署注意**：Netlify dashboard 需設定環境變數 `ANTHROPIC_API_KEY`，本機測試用 `netlify dev`。

---

## 批次 D：回顧 + 打磨 + 完整匯出

### 1. 回顧頁（規格 4.7）

tab 切換：季度 / 年度。

### 2. 季度（標準佈局）

- 頂部資料摘要：
  - 週日見證完成次數 / 總週數
  - 小勇敢總次數
  - 情緒天氣分佈（橫條比例）
- 三個寫作區：模式 / 驕傲 / 下季調整
- [查看過往季度] 顯示歷史列表

### 3. 年度（卷軸 UI）

依規格 4.7 年度節：

- 卷軸視覺：米色漸層 background（`linear-gradient`）
- 雙側邊線（`border-left/right` 0.5px）
- 襯線標題，`letter-spacing` 0.3em，加 ⸻ 符號裝飾
- 三個寫作區：這一年我變成 / 驕傲 / 給明年的信
- 信件封存：儲存後 `letterSealed = true`，顯示「此信將於 YYYY 年底自動開啟」
- 到達 `letterUnlockDate` 後信件自動可讀
- 封存時間用 Firestore `serverTimestamp()`，不靠本地時間

### 4. 完整匯出匯入（規格 8）

- 設定頁補齊 `reviews.json` 的匯出匯入
- relationships.json 補齊批次 C 新增的 6 種資料（`groundFriends`、`groundFriendCheckIns`、`openMarks`、`identificationAssessments`、`loweringProtocols`、`aiCompanionSessions`）
- 匯入時檢查 `type` 欄位正確才接受
- 衝突時問是否覆蓋

### 5. 整體打磨

- 所有頁面襯線字體一致
- 兩個主題切換無遺漏的硬編碼顏色
- textarea padding 和 line-height 一致
- 所有轉場 0.3-0.4 秒淡入淡出
- 手機 RWD：所有頁面在 375px 寬度可用
- 本月足跡圓點在兩主題都清楚
- 暈船量表漸高刻度在手機上不要太擠

### 6. 最後一層檢查

- 沒有 streak / 完成率 / guilt-tripping 文字
- 沒有 emoji（全部 SVG icon）
- AI 陪問員 system prompt 依規格全文
- 年度信件封存後無法修改

### 視覺要求

- 年度卷軸 UI 要讓人「哇一聲」，是工具的壓軸時刻
- 卷軸背景漸層只用米色系，不跳太多色
- 季度情緒天氣分佈用相同 SVG icon，不用 emoji

### 驗收清單

- [ ] 季度回顧資料摘要正確
- [ ] 年度卷軸視覺到位
- [ ] 年度信件封存、解鎖邏輯正確（Firestore 時間）
- [ ] relationships.json 匯出包含批次 C 全部資料
- [ ] reviews.json 可下載、匯入可復原
- [ ] 手機 375px 寬度所有頁面可用
- [ ] 兩主題切換無漏網顏色
- [ ] 所有頁面襯線字體一致
- [ ] 沒有 streak / 完成率 / guilt-tripping 文字

### 完工後

- 在根 `CLAUDE.md`「現有工具」區把 inner_compass 從「開發中」改為「已部署」
- 版本號定為 v1.0

---

## 在 Claude Code 怎麼用這份文件

開工時直接說：

> 做批次 D

我會自己讀 `inner_compass/CLAUDE.md` + 編輯 `src/App.jsx`，不需附檔。
 