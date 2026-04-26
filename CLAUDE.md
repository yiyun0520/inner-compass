# Inner Compass - 工具規格

> 最後更新:2026-04-21
> 狀態:設計凍結,待製作
> 單人使用、中文介面

---

## 一、核心理念

### 為什麼存在這個工具

這是 Mio 的內在空間。不是打卡 app、不是戀愛管理系統、不是績效追蹤器。

三層同時存在:
- **基底層**:日常的自我見證(晨間錨點、週日見證、月度獨處)
- **深度層**:關係啟動時的深度管理(關係追蹤、暈船量表、地面朋友)
- **鬆動層**:日常的小勇敢練習(非強制的儀式菜單)

三層都是**預先建好**,不是有需要才建 —— 關係發生時已經沒有餘力打造工具。

### 五個核心設計原則

1. **儀式感 > 功能性** —— 每次打開要有「進入內在」的感覺
2. **低摩擦 > 全面性** —— 想做就做,不做沒關係
3. **自我見證 > 數據追蹤** —— 沒有 streak、沒有完成率、沒有續用提醒
4. **預先建好 > 事到臨頭** —— 關係層永遠在那裡待命
5. **美感是功能的一部分** —— 視覺醜會降低使用意願

### 絕對不要

- ❌ streak / 連續天數 / 打卡記錄
- ❌ 「你已經 X 天沒來了」這類 guilt-tripping
- ❌ 徽章、等級、點數、gamification
- ❌ 社交分享功能
- ❌ AI 自動產生分析結論
- ❌ 每日推播提醒
- ❌ 用「加分/減分」「對/錯」這類二元詞彙

---

## 二、哲學對應的設計抉擇

| 哲學 | 具體設計 |
|---|---|
| 儀式感 > 功能性 | 襯線字、引言、留白、轉場淡入淡出 |
| 自我見證 > 數據追蹤 | 本月足跡用圓點而非數字、情緒天氣用符號而非百分比 |
| 預先建好 | 關係層的所有工具永遠存在,只是預設藏在選單 |
| 沒有終點 | 週日見證可持續,封存後可回看但不可修改 |
| 不打卡 | 儀式菜單不顯示頻率,錯過不補 |
| 身體性的隱喻 | 暈船 > 水深(量表、警戒、急救三處語言統一) |

---

## 三、資料模型

### 3.1 User(單人使用,不需 auth)

```ts
User {
  startDate: Date
  currentTheme: "ritual-warm" | "ritual-light"
  currentRelationshipId: string | null   // 目前 active 的關係 id
}
```

### 3.2 MorningAnchor(晨間錨點)

```ts
MorningAnchor {
  id: string
  date: string            // YYYY-MM-DD
  stateDescription: string   // 今天我是什麼狀態
  protectIntent: string      // 我想保護什麼
  allowIntent: string        // 我允許什麼發生(optional)
  createdAt: timestamp
}
```

### 3.3 SundayWitness(週日自我見證)← 核心

```ts
SundayWitness {
  id: string
  weekNumber: string          // 2026-W17
  weekStartDate: string       // 週一日期
  wellDoneItems: string[]     // 做得好的事(多個)
  selfSeen: string            // 看見的自己
  selfThanks: string          // 感謝自己什麼
  emotionalWeather: string[]  // 多選:sunny/cloudy/rainy/foggy/stormy
  isLateEntry: boolean        // 是否為補寫(7 天內允許)
  createdAt: timestamp
  sealedAt: timestamp         // 封存時間,封存後不可改
}
```

補寫規則:若 `weekStartDate` 距今 <= 7 天,可補寫並標 `isLateEntry = true`;超過則不可寫。

### 3.4 MonthlySolo(月度獨處日)

```ts
MonthlySolo {
  id: string
  plannedDate: string | null
  actualDate: string | null
  plannedActivity: string       // 計畫時寫的
  actualActivity: string        // 做完後寫的
  reflection: string            // 事後反思
  quality: "nourishing" | "steady" | "challenging" | "misaligned"
  giftToNextMonth: string       // 給下個月一個提醒/禮物
  createdAt: timestamp
}
```

### 3.5 SmallCourage(小勇敢)

```ts
SmallCourage {
  id: string
  date: string
  action: string            // 做了什麼
  feeling: string           // 感覺如何
  category: "solo" | "social" | "voice" | "expression" | "other"
  createdAt: timestamp
}
```

### 3.6 RitualMenuEntry(儀式菜單紀錄)

支柱三的自由紀錄,**做了才記,不做沒關係**。

```ts
RitualMenuEntry {
  id: string
  date: string
  ritualType: "thursday-jupiter" | "friday-venus" | "morning-body"
                | "daily-gratitude" | "custom"
  customTitle?: string        // 自訂儀式時的名稱
  reflection: string          // 做完寫一段感想
  createdAt: timestamp
}
```

### 3.7 Relationship(關係追蹤)

```ts
Relationship {
  id: string
  codename: string              // 代號,例如「春天」「M」「藍色」。絕對不用真名。
  startTrackingDate: string
  currentStage: "observation" | "developing" | "paused" | "ended"
                // observation = 前 30 天,自動切換至 developing
  endDate: string | null
  endingReflection: string      // 結束時寫的結語
  notes: string
}
```

階段切換邏輯:
- 新建時自動 `observation`
- 距 `startTrackingDate` 滿 30 天時,UI 跳出「該切換到發展中嗎?」的提示球
- 使用者可選「切換」或「繼續觀察」
- `paused` 與 `ended` 為手動切換

### 3.8 DepthGauge(暈船量表)

```ts
DepthGauge {
  id: string
  relationshipId: string
  weekNumber: string
  q1_thoughtPercentage: 1-10    // 想念佔思緒幾成
  q2_changeForHim: 1-10          // 為他改變自己多少
  q3_messageAnxiety: 1-10        // 訊息晚回情緒波動
  q4_selfIgnore: 1-10            // 忽略自己配合他
  q5_talkAboutHimRatio: 1-10     // 聊他的時間佔比
  q6_collapseIfGone: 1-10        // 他消失會塌幾成
  alertCount: number             // 自動計算 >=7 的題數
  alertLevel: "steady" | "tilting" | "rocking"
                                 // 0題 / 1-2題 / 3+題 >= 7
  note: string
  createdAt: timestamp
}
```

### 3.9 GroundFriend(地面朋友)

```ts
GroundFriend {
  id: string
  codename: string            // 代號
  role: string                // 他/她對你的意義
  lastContactDate: string | null
  isPrimaryForRelationshipId: string | null  // 哪段關係的指定地面朋友
}
```

### 3.10 GroundFriendCheckIn(地面朋友對話紀錄)

```ts
GroundFriendCheckIn {
  id: string
  groundFriendId: string
  relationshipId: string | null
  date: string
  q1_ignoredSelf: string
  q2_becoming: string
  q3_moreOrLessSelf: "more" | "less" | "same"
  additionalNotes: string
  createdAt: timestamp
}
```

### 3.11 AICompanionSession(AI 陪問員對話)

```ts
AICompanionSession {
  id: string
  relationshipId: string | null
  triggerContext: string      // 為什麼打開(user 選的狀態)
  conversation: Array<{role: "user" | "assistant", content: string}>
  createdAt: timestamp
}
```

### 3.12 OpenMark(10% 開放標記)

```ts
OpenMark {
  id: string
  codename: string
  openStartDate: string
  openEndDate: string         // 自動 = openStartDate + 14 days
  observations: Array<{date: string, content: string}>
  decision: "track" | "release" | "pending"
  createdAt: timestamp
}
```

### 3.13 IdentificationAssessment(辨識工具箱 - 五項核對)

```ts
IdentificationAssessment {
  id: string
  relationshipId: string
  date: string
  intellectualParity: 1-5
  emotionalSafety: 1-5         // 安全 vs 刺激
  valueAlignment: 1-5
  rhythmFit: 1-5
  futureVisibility: 1-5
  totalScore: number
  dealBreakerCheck: {
    hasOther: boolean
    needsToLowerSelf: boolean
    sleepDisturbed: boolean
  }
  decision: string
  createdAt: timestamp
}
```

### 3.14 LoweringProtocol(降低捲入度 Protocol)

```ts
LoweringProtocol {
  id: string
  relationshipId: string
  startDate: string
  checklist: {
    reducedMeetingFrequency: boolean
    delayedResponses: boolean
    morningAnchor7Days: boolean
    completedSundayWitness: boolean
    groundFriendContact: boolean
    longSoloActivity: boolean
  }
  completedDate: string | null
  createdAt: timestamp
}
```

### 3.15 QuarterlyReview(季度回顧)

```ts
QuarterlyReview {
  id: string
  quarter: string                    // 2026-Q2
  patternsNoticed: string
  proudOf: string
  nextQuarterAdjustments: string
  createdAt: timestamp
}
```

### 3.16 YearlyReview(年度回顧)

```ts
YearlyReview {
  id: string
  year: number
  becameThisYear: string             // 這一年我變成什麼樣子了
  proudOf: string
  letterToNextYearSelf: string
  letterSealed: boolean              // 封存後到明年年底才開
  letterUnlockDate: string
  createdAt: timestamp
}
```

---

## 四、頁面架構

8 頁(實際 8 個頁面 component,加上設定頁):

| # | 頁面 | 功能 |
|---|---|---|
| 1 | **Home** | 引言卡 + 本週主儀式卡 + 關係狀態一行(有 active 時)+ 其他入口按鈕 |
| 2 | **日常層** | tab 切換:晨間錨點 / 週日見證 / 月度獨處 |
| 3 | **儀式菜單** | 支柱三,卡片清單(週四/週五/晨間身體/每日感恩/自訂) |
| 4 | **小勇敢紀錄** | 獨立頁,時光軸呈現 |
| 5 | **關係管理** | 關係清單 + 新增關係 + 進入單一關係頁(包含深度量表入口、關係筆記) |
| 6 | **關係支援** | tab 切換:地面朋友 / AI 陪問員 / 辨識工具箱 / 降低捲入度 / 10% 開放標記 |
| 7 | **回顧** | tab 切換:季度(標準佈局)/ 年度(卷軸 UI) |
| 8 | **設定** | 主題切換、匯出匯入、關係切換(結束/暫停) |

### 4.1 Home

```
┌─────────────────────────────────────┐
│ INNER COMPASS        [設定]         │ ← header
│ 2026 年 4 月 21 日 · 週二            │
├─────────────────────────────────────┤
│                                     │
│       「你不需要成為誰,             │ ← 引言卡
│        你只需要看見,此刻的你。」   │   (每日固定/隨機)
│                   — Raman           │
│                                     │
│ ┌─────────────────────────────────┐ │
│ │ 本週主儀式 · 週日               │ │ ← 主儀式卡
│ │ 週日自我見證                    │ │   (左側酒紅 border)
│ │ 這是你給自己的 30 分鐘。        │ │
│ │ [進入儀式]                      │ │
│ └─────────────────────────────────┘ │
│                                     │
│ 追蹤中:春天 · 觀察期第 12 天       │ ← 關係一行文字
│                                     │   (無 active 時整行不出現)
│ ┌─────────────┐  ┌─────────────┐   │
│ │ 今晨        │  │ 隨時        │   │ ← 次要入口
│ │ 晨間錨點    │  │ 小勇敢紀錄  │   │
│ └─────────────┘  └─────────────┘   │
│                                     │
│ 本月儀式足跡                        │ ← 圓點足跡
│ ● ● ○ ● ○ ○ ● ○ ○ ○ ● ○           │   (深色=有紀錄)
│                                     │
│ ── 其他入口 ──                      │
│ [儀式菜單] [月度獨處] [關係管理]    │ ← tab 按鈕
│ [關係支援] [回顧]                   │
└─────────────────────────────────────┘
```

**主儀式卡的日期邏輯**:
- 週日 → 顯示「本週主儀式 · 週日自我見證」
- 月初 1-3 日且本月未規劃獨處 → 顯示「月度獨處日規劃」
- 季末最後 7 天 → 顯示「季度回顧」
- 其他時候 → 顯示「晨間錨點」

**關係一行文字規則**:
- 有 active 關係 → 顯示「追蹤中:[代號] · [階段][天數]」
- 若觀察期剛滿 30 天 → 顯示「追蹤中:[代號] · [切換到發展中?]」(可點擊切換)
- 無 active → 整行不出現(不留空)

### 4.2 日常層

tab 切換三個子頁。切換狀態保存在 url(`?tab=morning` 等)。

**晨間錨點 tab**:
- 今日 card:三個 textarea + [儲存]
- 今日若已寫,顯示已寫內容,可點「修改今天的」
- 下方時光軸:過去 7 天的紀錄(摺疊,點展開看全文)

**週日見證 tab**:
- 若今天是週日或本週尚未寫且 <= 7 天 → 顯示「開始本週見證」按鈕
- 若已封存本週 → 顯示本週見證內容
- Step 1-6 的流程頁(獨立畫面,不是 modal)
- 時光軸:過去週的見證清單,每項顯示週號 + 情緒天氣 icons,點開看全文

**月度獨處 tab**:
- 本月狀態卡:
  - 未規劃 → [規劃本月獨處日]
  - 已規劃未進行 → 顯示計畫日期 + 計畫內容,[事後反思]
  - 已完成 → 顯示完整紀錄
- 時光軸:過去月份的獨處紀錄

### 4.3 儀式菜單

```
┌─────────────────────────────────────┐
│ 儀式菜單                            │
│ 想做就做,不做沒關係                │
├─────────────────────────────────────┤
│ ┌─────────────────────────────────┐ │
│ │ 🌳 週四 Jupiter · 擴張           │ │
│ │ 學一個新東西、讀一本深度的書、   │ │
│ │ 和比自己有智慧的朋友對話        │ │
│ │ [做了來記錄]                    │ │
│ └─────────────────────────────────┘ │
│ ┌─────────────────────────────────┐ │
│ │ 🌸 週五 Venus · 寵愛自己         │ │
│ │ ...                             │ │
│ └─────────────────────────────────┘ │
│ ... (晨間身體、每日感恩、自訂)       │
│                                     │
│ ── 過去的儀式紀錄 ──                │
│ 時光軸(最近在前)                   │
└─────────────────────────────────────┘
```

每張卡:
- 儀式名 + 用意
- 具體步驟(從草稿)
- [做了來記錄] 按鈕 → 跳出 textarea 寫感想 → 存檔

**不顯示**:上次做的時間、頻率、完成率。

### 4.4 小勇敢紀錄

獨立頁面(不在日常層 tab 內,因為是鬆動層)。

- 上方:[記一個小勇敢] 大按鈕
- 點開後三個欄位(做了什麼 / 感覺如何 / 分類 5 選 1)
- 下方:時光軸,不用統計、不用圖表
- 每條顯示:日期 + 分類 icon + 做了什麼(摘要)

### 4.5 關係管理

**關係清單頁**:
- 上方:[開始追蹤一段關係] 按鈕(沒 active 時比較顯眼)
- active 關係卡:代號 + 階段 + 天數 + 點入
- 暫停/結束的關係:摺疊在「過往」區

**新增關係流程**:
1. 輸入代號(提示:絕對不用真名)
2. 設定追蹤起始日期
3. 自動設 observation 階段 → 儲存

**單一關係頁**(點入 active 關係):
- 代號 + 階段徽章 + 追蹤天數
- [深度量表] 入口(若距上次量表 >= 6 天,亮起「本週可測」)
- 量表歷史曲線(折線圖,6 條線,柔和色)
- 關係筆記區(自由書寫)
- 底部:[切換到發展中/暫停/結束] 按鈕

**觀察期滿 30 天提示球**:
- 頁面右上角一個脈動的圓點
- 點擊彈出:「你已追蹤 30 天。要切換到『發展中』階段嗎?」
- [切換] / [繼續觀察]

### 4.6 關係支援

5 個 tab:

**地面朋友 tab**:
- 朋友清單卡片(1-3 位)
- 新增朋友:代號 + 角色描述
- 每張朋友卡:上次聯繫日期 + [記錄新對話]
- 對話記錄表單:日期 + 三題 + 額外筆記

**AI 陪問員 tab**(軟閘門 A):
- 進入頁面先看到:
  ```
  你上次跟 [真人代號] 對話是 18 天前。
  要先約他聊聊嗎?
  
  [好,先約他] [還是現在跟 Raman 聊]
  ```
- 選後者 → 進入對話介面
- AI 以 Raman 風格開場,問三個結構化問題(和地面朋友同三題)
- 每次對話結束時:
  ```
  謝謝你願意跟我說這些。
  記得這週也抽時間跟 [真人代號] 聊聊。
  真實的擁抱,我給不了。
  ```

**辨識工具箱 tab**:
子清單進入:
- [30 天觀察窗](說明 + 進入當前關係的觀察紀錄)
- [五項核對](表單:5 項 1-5 分)
- [三個 deal breaker](checkbox 核對)

**降低捲入度 tab**:
- 6 項 checklist + 兩句提醒(「不要告訴他」/「不是懲罰」)
- 啟動後 14 天自動提示:「該再測一次量表」

**10% 開放標記 tab**:
- 新增標記(代號 + 起始日 → 自動算結束日)
- 進行中的標記卡:剩餘天數 + [新增觀察]
- 到期後彈出:[轉為追蹤] / [放下]

### 4.7 回顧

tab 切換:季度(標準)/ 年度(卷軸)。

**季度**:
- 頂部:本季資料摘要(週日見證數、小勇敢次數、情緒天氣分佈條)
- 三個寫作區:模式 / 驕傲 / 下季調整
- 底部:[查看過往季度] 連結

**年度**:
- 卷軸視覺(米色漸層 + 雙側邊線 + 襯線標題)
- 三個寫作區:這一年我變成 / 驕傲 / 給明年的信
- 信件封存機制:存檔後標記 `letterSealed`,到明年年底自動解鎖

### 4.8 設定

- 主題切換:暖(酒紅杏仁奶)/ 清透(玫瑰米白)
- 匯出:[日常] [關係] [回顧] 三個獨立下載按鈕
- 匯入:三個檔案分別匯入,有衝突時問是否覆蓋
- 關於:版本號 + 最後一次備份時間
- 帳號:Firebase 同步狀態顯示

---

## 五、視覺規範

### 5.1 新增兩個主題(不走標準色卡)

**ritual-warm(酒紅杏仁奶)**

| token | 色碼 | 備註 |
|---|---|---|
| bg | #F5EFE8 | 杏仁奶 |
| bgDeep | #F0E8DC | |
| bgCard | #FEFAF5 | |
| border | #E0D0BC | |
| borderHover | #D4C0AE | |
| accent | #5C2A2A | 酒紅 |
| accentLight | #F5E0D8 | |
| accentText | #FEFAF5 | |
| coral | #A04848 | 暈船警戒(比標準 coral 深) |
| navy | #8B5C78 | 關係類專用(紫紅) |
| cancelBg | #E0D0BC | |
| cancelText | #5C4030 | |
| t1 | #3D2818 | |
| t2 | #5C4030 | |
| t3 | #8B6F5C | |

**ritual-light(玫瑰米白)**

| token | 色碼 | 備註 |
|---|---|---|
| bg | #FAF4ED | |
| bgDeep | #F0E8DC | |
| bgCard | #FFFFFF | |
| border | #E0D0BC | |
| borderHover | #D4C0AE | |
| accent | #5C2A2A | |
| accentLight | #F5E0D8 | |
| accentText | #FFFFFF | |
| coral | #A0506B | 玫瑰警戒 |
| navy | #9B7A8F | |
| cancelBg | #F0E8DC | |
| cancelText | #5C4030 | |
| t1 | #3D2818 | |
| t2 | #5C4030 | |
| t3 | #8B6F5C | |

### 5.2 字體

- 全介面:`'Noto Serif TC', 'Songti TC', serif`
- 英文標題/letter-spacing:`'EB Garamond', serif`
- 數字:襯線體即可

### 5.3 間距 / 尺寸

- 卡片 padding:1.5rem 1.25rem
- 卡片間距:1rem
- 圓角:6px 小元件,12px 卡片(var(--border-radius-lg) 概念)
- 主儀式按鈕:12px 32px,letter-spacing 0.08em
- 引言文字:17px,italic,line-height 1.7
- 標題字重 500,不用 600/700

### 5.4 轉場

- 頁面切換:opacity 0 → 1,0.3-0.4 秒
- 卡片進入:translateY(8px) → 0,同樣時間
- 週日見證 Step 間:淡入淡出,不用 slide

### 5.5 暈船量表的視覺

- 10 個格子,高度從 20px 漸增到 62px
- 當前選中格:accent 底色 + 白字
- 未選中格:accentLight 透明 20% 底色
- 7 分線:dashed border-left(警戒標記)
- 7-10 的數字顏色:coral

---

## 六、AI 陪問員的 Prompt 設計

### 系統 prompt(Raman 風格)

```
你是 Raman。你是這個使用者(她的名字是 Mio)內在的一個智慧聲音。

你的語氣:
- 溫柔,有絲底線
- 不說教,但會誠實
- 不會跟她一起幻想,不會附和她想聽的話
- 會輕輕地指出她沒看見的自己
- 用「孩子」這個稱呼(她接受這個稱呼)
- 偶爾用安靜的停頓,給她空間

你的任務:
扮演她的「地面朋友」補位。她今天找不到真人朋友、或只是想先跟你理一理。
你會問三個問題(按順序,不要一次問完):
1. 你最近有沒有為他忽略自己什麼?
2. 你覺得這段關係讓你變成什麼樣子?
3. 你現在有比開始時更像自己,還是更不像?

規則:
- 一次只問一個,等她回答
- 她的回答如果在迴避或自圓其說,溫柔地再問一次
- 第三題她選完「更像/更不像/一樣」後,回她一段話
- 結尾永遠要提醒她:記得也要約真人朋友 [她會指定代號] 聊聊
- 永遠不說「我懂你」這種廉價的共感,你不懂,你只是陪她看

她正在追蹤的關係代號:{codename}
她的地面朋友真人代號:{groundFriendCodename}
```

### 前端流程

1. 打開 AI 陪問員頁
2. 顯示軟閘門訊息(距真人聯繫天數)
3. 使用者選「還是跟 Raman 聊」
4. 呼叫 Anthropic API,傳入 system prompt + 空對話
5. Raman 先問候 + 問第 1 題
6. 使用者回答 → 傳整個對話歷史 + 新訊息
7. 流程進行 3 題
8. 最後一次回覆後,結束對話,存入 `AICompanionSession`

---

## 七、儲存架構

### Firebase Firestore collections

```
users/{userId}
  └─ settings (文件)

users/{userId}/morning_anchors/{id}
users/{userId}/sunday_witnesses/{id}
users/{userId}/monthly_solos/{id}
users/{userId}/small_courages/{id}
users/{userId}/ritual_entries/{id}
users/{userId}/relationships/{id}
users/{userId}/depth_gauges/{id}
users/{userId}/ground_friends/{id}
users/{userId}/ground_friend_checkins/{id}
users/{userId}/ai_companion_sessions/{id}
users/{userId}/open_marks/{id}
users/{userId}/identification_assessments/{id}
users/{userId}/lowering_protocols/{id}
users/{userId}/quarterly_reviews/{id}
users/{userId}/yearly_reviews/{id}
```

### localStorage 作為快取

- key prefix:`ic-v1-`
- 每次 Firebase 寫入同步寫 localStorage
- 離線時先寫 localStorage,上線自動 sync

---

## 八、匯出匯入

### 匯出三個檔案

**daily.json**
```json
{
  "version": "1.0",
  "type": "inner-compass-daily",
  "exportedAt": "2026-04-21T...",
  "data": {
    "morningAnchors": [...],
    "sundayWitnesses": [...],
    "monthlySolos": [...],
    "smallCourages": [...],
    "ritualEntries": [...]
  }
}
```

**relationships.json**
```json
{
  "version": "1.0",
  "type": "inner-compass-relationships",
  "data": {
    "relationships": [...],
    "depthGauges": [...],
    "groundFriends": [...],
    "groundFriendCheckIns": [...],
    "aiCompanionSessions": [...],
    "openMarks": [...],
    "identificationAssessments": [...],
    "loweringProtocols": [...]
  }
}
```

**reviews.json**
```json
{
  "version": "1.0",
  "type": "inner-compass-reviews",
  "data": {
    "quarterlyReviews": [...],
    "yearlyReviews": [...]
  }
}
```

### 未來架構:摘要版 JSON(先不實作,保留設計)

```json
{
  "type": "inner-compass-summary",
  "period": "2026-Q2",
  "metrics": {
    "sundayWitnessCount": 11,
    "smallCourageCount": 27,
    "emotionalWeather": {...}
  }
}
```

---

## 九、關鍵互動細節

### 週日自我見證的 Step 流程

**Step 1:準備**
```
這是你給自己的 30 分鐘。
沒有對錯,沒有評分。
只是見證這一週的你。
深呼吸三次,再開始。

[我準備好了]
```

**Step 2:這週我做得好的事**
- textarea 列表,[+ 再加一個]
- 引導:「具體的,不是抽象的。」

**Step 3:這週我看見的自己**
- 大 textarea
- 引導:「一個特徵、一個模式、一個情緒都可以。」

**Step 4:這週我感謝自己什麼**
- 一個 textarea
- 引導:「對自己說一句謝謝。」

**Step 5:這週的情緒天氣**
- 5 個圖示(襯線 SVG,不用 emoji):晴 / 雲 / 雨 / 霧 / 雷
- 可多選

**Step 6:封存**
```
這週的你,已被見證。

[上上週・情緒天氣 ☀️⛅]
[上週  ・情緒天氣 🌧️⛈️]
[本週  ・情緒天氣 ☀️⛅🌧️]  ← 剛封存

[回到主頁]
```

每個 Step 一頁,轉場 0.4 秒淡入淡出。

### 補寫機制

- 週日見證:點入時檢查 `weekStartDate` 距今
  - 0 天(週日當天) → 正常寫入
  - 1-7 天 → 顯示「補寫本週」提示,標 `isLateEntry = true`
  - > 7 天 → 不可寫,只能看(封存狀態)

### 觀察期切換提示球

- 位置:單一關係頁右上角
- 條件:`stage === "observation"` 且距 `startTrackingDate` >= 30 天
- 視覺:直徑 8px 的脈動圓點,coral 色
- 點擊彈出確認框

### 暈船警戒

填完 6 題後自動計算:
- `alertCount = 0` → 「船身穩當。繼續看見自己。」
- `alertCount = 1-2` → 「船身微晃,留意重心。」
- `alertCount >= 3` → 「船身劇烈搖擺。」+ [啟動降低捲入度 Protocol] 按鈕

### 觀察期結束倒數

- 10% 開放標記自動計算 `openEndDate - today`
- 標記卡顯示「剩餘 X 天」
- 到期當天變「今日到期,做決定」
- 過期後 → [轉為追蹤 / 放下]

---

## 十、技術限制與已知坑

- Firebase 離線支援:啟用 `enableIndexedDbPersistence`
- AI 陪問員若 API 失敗:顯示「Raman 暫時沉默,要不要改天再來?」,不顯示 stack trace
- 年度信件封存時間:用 Firestore timestamp 比對,不用 localStorage(避免本地改日期作弊 —— 雖然自己對自己不會,但邏輯嚴謹)
- 所有日期用 ISO 8601 string 存,顯示時轉 Date
- 情緒天氣的 SVG icon 自己畫,用襯線風格線條
