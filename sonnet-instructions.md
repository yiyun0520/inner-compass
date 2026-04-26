# Inner Compass · 製作計劃

> 規格來源：`inner_compass/CLAUDE.md`
> 工作環境：Claude Code（直接編輯 `src/App.jsx`，不再附完整檔案）

---

## 整體拆批

工具規模大（16 個 entity、Firebase、AI API、4000+ 行），分 4 批做：

| 批次 | 內容 | 狀態 |
|---|---|---|
| A | 基礎架構 + 日常層（Home、日常層、儀式菜單、小勇敢、設定） | ✅ 完成 |
| B | 關係管理 + 深度量表 + 觀察期提示 | 🔄 進行中 |
| C | 關係支援（5 tab，含 AI 陪問員） | ⏳ 待做 |
| D | 回顧（季度 + 年度卷軸）+ 整體打磨 + 完整匯出 | ⏳ 待做 |

每批做完跑 `npm run dev` 驗收，再進下一批。架構大改時用 `/clear` 開新 session。

---

## 批次 B：關係管理 + 深度量表

### 已完成

- ✅ 關係清單：active 關係卡、過往關係（摺疊）
- ✅ [開始追蹤一段關係] 流程：輸入代號、起始日期，自動 `stage = observation`
- ✅ 單一關係頁：代號 + 階段徽章 + 追蹤天數 + [深度量表] 入口 + 關係筆記
- ✅ 深度量表 6 題可填（漸高刻度視覺、7 分警戒線 dashed border、7-10 coral 數字）
- ✅ 警戒訊息依 alertCount 正確顯示（船的語言）

### 尚未完成

1. **觀察期脈動提示球**：`stage = observation` 且距起始日 >= 30 天，右上角 8px coral 圓點脈動，點擊彈確認框切換到 `developing`
2. **Home 關係一行文字**：有 active 時顯示「追蹤中：代號 · 階段第N天」；觀察期剛滿 30 天改為「追蹤中：代號 · \[切換到發展中?\]」可點；無 active 整行不出現
3. **切換 developing / 暫停 / 結束**：單一關係頁底部狀態按鈕（目前有無此功能？確認後補）
4. **結束關係寫結語**：結束時開 textarea 寫 `endingReflection`，存後移至「過往」摺疊區
5. **`relationships.json` 匯出**：設定頁加關係資料的獨立匯出

### 視覺要求

- 量表填寫頁的襯線字體 + italic 引導語（已完成部分確認）
- **折線圖已決定跳過**（recharts 不裝），歷史量表改以文字清單或簡單色塊呈現

### 驗收清單

- [x] 可新增關係，代號儲存
- [x] 深度量表 6 題可填，漸高刻度視覺到位
- [x] 警戒訊息依 alertCount 正確顯示
- [ ] 觀察期滿 30 天出現脈動提示球
- [ ] 點擊提示球可切換到 developing
- [ ] Home 顯示關係一行文字，邏輯正確
- [ ] 可切換 developing / 暫停 / 結束
- [ ] 結束關係可寫結語，進「過往」區
- [ ] relationships.json 可匯出

---

## 批次 C：關係支援頁

5 個 tab + AI API 呼叫，這是工具最複雜的一頁。

### ⚠️ 開工前先做：Netlify Function 設定

AI 陪問員呼叫 Anthropic API，前端不能暴露 API key，必須走 Netlify Function 代理。

1. 參照 `believe_tool/netlify/functions/` 建 `inner_compass/netlify/functions/claude.js`
2. `netlify.toml` 加：
   ```toml
   [functions]
     directory = "netlify/functions"
   ```
3. 設環境變數 `ANTHROPIC_API_KEY`（本機 `.env`，部署在 Netlify dashboard）
4. 前端用 `fetch('/.netlify/functions/claude', ...)` 呼叫
5. 模型用 `claude-sonnet-4-6`，`max_tokens` 1000

### 建議拆做順序（由簡到難）

每個 tab 做完都跑 dev 驗收：

1. 地面朋友（規格 4.6、資料模型 3.9-3.10）
2. 辨識工具箱（規格 4.6、資料模型 3.13）
3. 降低捲入度（規格 4.6、資料模型 3.14）
4. 10% 開放標記（規格 4.6、資料模型 3.12）
5. AI 陪問員（規格 4.6 + 第六節 prompt、資料模型 3.11）— 最後做，要先有 Netlify Function

### 各 tab 重點

**地面朋友**
- 朋友清單（1-3 位），代號 + 角色描述
- 新增朋友表單
- 每張朋友卡顯示「上次聯繫 X 天前」
- [記錄新對話] → 三題表單 + 額外筆記
- 可指派某位為「當前關係的地面朋友」

**AI 陪問員**
- 軟閘門 A：進入時先顯示距真人聯繫天數，兩個按鈕
- 若沒指派地面朋友，軟閘門跳過直接進對話
- 對話介面：使用者右、Raman 左，襯線字
- system prompt 依規格第 6 節全文（Raman 稱呼「孩子」）
- 三題結構化對話：一次一題，使用者答後 Raman 問下一題
- 第三題答完後 Raman 給結語 + 提醒約真人
- 對話全程存入 `AICompanionSession`
- API 失敗訊息：「Raman 暫時沉默，要不要改天再來?」（不顯示 stack trace）

**辨識工具箱**
- 子清單：[30 天觀察窗] [五項核對] [三個 deal breaker]
- 五項核對：5 個 1-5 slider，自動算總分
- Deal breaker：3 個 checkbox，任一勾選顯示警示
- 最後寫結論文字 + 存檔

**降低捲入度**
- 6 項 checklist + 兩句提醒（「不要告訴他」/「不是懲罰」）
- 啟動後 14 天自動提示「該再測一次量表」
- 完成後記錄 `completedDate`

**10% 開放標記**
- 新增標記（代號 + 起始日 → 自動算 `endDate = startDate + 14 天`）
- 標記卡：剩餘天數 + [新增觀察] 區
- 觀察紀錄時光軸
- 到期彈出 [轉為追蹤] / [放下]

### 視覺要求

- AI 陪問員對話介面用襯線字，對話氣泡用 `bgCard`
- Raman 頭像用 SVG（簡單的月亮或星星），不用圓形頭像
- 辨識工具箱五項核對用 slider（和量表不衝突)
- 降低捲入度 checklist 勾選後有淡入打勾動畫

### 驗收清單

- [ ] 地面朋友新增、修改、對話紀錄可運作
- [ ] AI 陪問員軟閘門邏輯正確
- [ ] AI 對話三題流程完整，Raman 語氣溫柔有底線
- [ ] AI 對話可存為 session
- [ ] 辨識工具箱三個子項可運作
- [ ] 降低捲入度 checklist 可勾選、14 天後提示
- [ ] 10% 開放標記到期邏輯正確
- [ ] Netlify Function 在本機（`netlify dev`）跑得起來
- [ ] API 失敗時顯示 Raman 沉默訊息，不噴 stack trace

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
- 三個檔案（daily / relationships / reviews）分別下載 / 上傳
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
- [ ] 三個匯出檔都可下載、匯入可復原
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

> 做批次 B 的「深度量表頁」

或：

> 批次 C 的 Netlify Function 前置先做

我會自己讀 `inner_compass/CLAUDE.md` + 編輯 `src/App.jsx`，不需附檔。
