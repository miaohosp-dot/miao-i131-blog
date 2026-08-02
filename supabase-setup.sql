-- ===========================================================================
-- 瀏覽次數計數器：Supabase 資料庫設定
--
-- 使用方式：
--   1. 到 Supabase 專案 → 左側選單 SQL Editor
--   2. 貼上這整份檔案，按 Run
--   3. 把 Project URL 與 anon key 填進 assets/supabase-config.js
-- ===========================================================================

-- 1. 計數資料表 --------------------------------------------------------------
create table if not exists public.page_views (
  slug       text primary key,
  views      bigint      not null default 0,
  updated_at timestamptz not null default now()
);

-- 2. 開啟資料列層級安全性（RLS）----------------------------------------------
-- 沒有這一步的話，anon key 會有完整的讀寫權限。
alter table public.page_views enable row level security;

-- 只允許匿名使用者「讀取」，不允許直接寫入。
-- 累加只能透過下面那個函式進行，避免有人任意竄改數字。
drop policy if exists "anyone can read view counts" on public.page_views;
create policy "anyone can read view counts"
  on public.page_views
  for select
  to anon, authenticated
  using (true);

-- 3. 累加用的函式 ------------------------------------------------------------
-- security definer 讓這個函式能繞過 RLS 寫入，但它只做「+1」這一件事。
create or replace function public.increment_view(page_slug text)
returns bigint
language plpgsql
security definer
set search_path = public
as $$
declare
  new_count bigint;
begin
  -- 基本防呆：slug 長度與字元限制
  if page_slug is null or length(page_slug) = 0 or length(page_slug) > 128 then
    raise exception 'invalid slug';
  end if;

  insert into public.page_views as pv (slug, views)
  values (page_slug, 1)
  on conflict (slug)
  do update set views = pv.views + 1, updated_at = now()
  returning pv.views into new_count;

  return new_count;
end;
$$;

-- 4. 授權 --------------------------------------------------------------------
grant execute on function public.increment_view(text) to anon, authenticated;
grant select on public.page_views to anon, authenticated;
