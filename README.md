# 天天游戲 · FunLearning

手機優先的學科遊戲平台：完成學科遊戲，照顧一隻會長大的寵物。

## 現在的循環

1. 先選一隻寵物；每天有 3 款不同遊戲的獎勵名額。
2. 分數達 60% 才開始獲得 XP；首次通關、破紀錄、第一次玩某科目有額外獎勵。
3. 完成每日任務可領寵物幣、食物或裝飾。
4. 用寵物幣買食物、玩具、房間和造型；餵食、玩耍、摸摸會影響飽足、心情、好奇與羈絆。
5. 重複玩同一款遊戲可以練習、更新排行榜，但不會重複刷 XP。

## 主要檔案

- `js/pet-care.js`：照顧、每日任務、商城、獎勵規則。
- `js/store.js`：帳號、成績、寵物核心 XP／金幣與 `care` JSON。
- `js/app.js`：首頁、寵物房間、商城、獎勵結算。
- `css/style.css`：手機與桌面樣式。
- `assets/pets-clean/`：去背後的寵物 sprite（保留原始 `assets/pets/`）。
- `supabase/pet-care.sql`：Supabase 的 `pets.care` migration。

## Supabase

`pet-care.sql` 需要在 Supabase SQL Editor 執行一次，照顧狀態才會跨裝置同步。未執行時，XP／金幣仍會存雲端，但飽足、心情、任務、庫存會暫存在同一部裝置的 localStorage。

## 測試

- 390 × 844 直向
- 844 × 390 橫向
- 平台 iframe 內遊玩與獎勵結算
- 0 分、低於 60%、重複遊戲、每日 3 款上限
