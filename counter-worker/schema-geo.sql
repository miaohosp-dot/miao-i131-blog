-- 依國家／區域彙總的瀏覽次數
--
-- 只記錄國家與區域代碼，不記錄 IP、不記錄任何可識別個人的資訊。
-- 資料由 Cloudflare 邊緣節點提供（request.cf），不需要第三方分析服務。
create table if not exists page_views_geo (
  slug       text not null,
  country    text not null,          -- ISO 3166-1 兩碼，例如 TW、JP、US
  region     text not null default '', -- 州／省／縣市層級，可能為空
  views      integer not null default 0,
  updated_at text not null default (datetime('now')),
  primary key (slug, country, region)
);

create index if not exists idx_geo_country on page_views_geo (country);
