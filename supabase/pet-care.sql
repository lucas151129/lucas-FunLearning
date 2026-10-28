-- 在 Supabase 的 SQL Editor 執行一次。
-- 把新的照顧／任務／商城狀態存成 JSON，舊的 xp、coins 欄位保持不變。
-- 未執行時前端仍可在同一部裝置用 localStorage 運作，但換裝置不會同步照顧狀態。

alter table public.pets add column if not exists care jsonb;

-- 可選：讓未登入的舊資料也能有預設值，不影響現有列。
comment on column public.pets.care is 'pet care, quests, inventory and equipment (JSON)';
