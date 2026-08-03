-- 瀏覽次數計數表
-- slug 為頁面識別字；首頁使用 'home'
create table if not exists page_views (
  slug       text primary key,
  views      integer not null default 0,
  updated_at text    not null default (datetime('now'))
);
