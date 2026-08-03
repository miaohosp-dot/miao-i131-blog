/**
 * 瀏覽次數計數 API（Cloudflare Worker + D1）
 *
 *   POST /v/<slug>   累加該頁次數，回傳新的數值
 *   GET  /all        取得所有頁面的次數，供首頁卡片使用
 *
 * 用 SQL 的 views = views + 1 做累加，這是原子操作，
 * 多人同時瀏覽也不會漏算（這是選 D1 而非 KV 的主要原因）。
 */

/** 允許呼叫這個 API 的來源 */
const ALLOWED_ORIGINS = [
  'https://miao-i131-blog.pages.dev',
  'https://miaohosp-dot.github.io',
  'http://localhost:8899',
];

/** slug 只允許小寫英數與連字號，長度上限 128，避免被塞入垃圾資料 */
const SLUG_RE = /^[a-z0-9-]{1,128}$/;

function corsHeaders(request) {
  const origin = request.headers.get('Origin') || '';
  const allowed = ALLOWED_ORIGINS.includes(origin) ? origin : ALLOWED_ORIGINS[0];
  return {
    'Access-Control-Allow-Origin': allowed,
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Max-Age': '86400',
    Vary: 'Origin',
  };
}

const json = (body, status, request) =>
  new Response(JSON.stringify(body), {
    status,
    headers: {
      'content-type': 'application/json; charset=utf-8',
      'cache-control': 'no-store',
      ...corsHeaders(request),
    },
  });

export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    if (request.method === 'OPTIONS') {
      return new Response(null, { status: 204, headers: corsHeaders(request) });
    }

    // 累加單一頁面
    if (request.method === 'POST' && url.pathname.startsWith('/v/')) {
      const slug = decodeURIComponent(url.pathname.slice(3));
      if (!SLUG_RE.test(slug)) {
        return json({ error: 'invalid slug' }, 400, request);
      }

      // Cloudflare 邊緣節點提供的地理資訊。只取國家與區域，
      // 不取也不儲存 IP——國家層級的彙總無法識別個人。
      const cf = request.cf || {};
      const country = typeof cf.country === 'string' ? cf.country.slice(0, 2) : 'XX';
      const region = typeof cf.region === 'string' ? cf.region.slice(0, 64) : '';

      const [total] = await env.DB.batch([
        env.DB.prepare(
          `insert into page_views (slug, views) values (?, 1)
           on conflict(slug) do update
             set views = views + 1, updated_at = datetime('now')
           returning views`
        ).bind(slug),
        env.DB.prepare(
          `insert into page_views_geo (slug, country, region, views) values (?, ?, ?, 1)
           on conflict(slug, country, region) do update
             set views = views + 1, updated_at = datetime('now')`
        ).bind(slug, country, region),
      ]);

      return json({ slug, views: total.results[0].views }, 200, request);
    }

    // 取得全部，供首頁卡片填數字
    if (request.method === 'GET' && url.pathname === '/all') {
      const { results } = await env.DB.prepare(
        'select slug, views from page_views'
      ).all();
      return json(results, 200, request);
    }

    // 依國家彙總；帶 ?slug= 可看單篇，帶 ?detail=region 可展開到區域
    if (request.method === 'GET' && url.pathname === '/geo') {
      const slug = url.searchParams.get('slug');
      const byRegion = url.searchParams.get('detail') === 'region';

      if (slug && !SLUG_RE.test(slug)) {
        return json({ error: 'invalid slug' }, 400, request);
      }

      const cols = byRegion ? 'country, region' : 'country';
      const where = slug ? 'where slug = ?' : '';
      const stmt = env.DB.prepare(
        `select ${cols}, sum(views) as views
         from page_views_geo ${where}
         group by ${cols}
         order by views desc`
      );

      const { results } = await (slug ? stmt.bind(slug) : stmt).all();
      return json(results, 200, request);
    }

    if (url.pathname === '/') {
      return json(
        {
          service: 'miao-blog-views',
          endpoints: [
            'POST /v/<slug>',
            'GET /all',
            'GET /geo',
            'GET /geo?slug=<slug>',
            'GET /geo?detail=region',
          ],
        },
        200,
        request
      );
    }

    return json({ error: 'not found' }, 404, request);
  },
};
