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

      const row = await env.DB.prepare(
        `insert into page_views (slug, views) values (?, 1)
         on conflict(slug) do update
           set views = views + 1, updated_at = datetime('now')
         returning views`
      )
        .bind(slug)
        .first();

      return json({ slug, views: row.views }, 200, request);
    }

    // 取得全部，供首頁卡片填數字
    if (request.method === 'GET' && url.pathname === '/all') {
      const { results } = await env.DB.prepare(
        'select slug, views from page_views'
      ).all();
      return json(results, 200, request);
    }

    if (url.pathname === '/') {
      return json(
        { service: 'miao-blog-views', endpoints: ['POST /v/<slug>', 'GET /all'] },
        200,
        request
      );
    }

    return json({ error: 'not found' }, 404, request);
  },
};
