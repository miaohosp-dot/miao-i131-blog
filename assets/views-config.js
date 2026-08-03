/**
 * 瀏覽次數 API 位址
 *
 * 對應的 Worker 原始碼在 counter-worker/，資料存在 Cloudflare D1。
 * 要重新部署 API：cd counter-worker && npx wrangler deploy
 *
 * 留空時計數器會自動隱藏，網站其他功能不受影響。
 */
window.VIEWS_API = 'https://miao-blog-views.miao131.workers.dev';
