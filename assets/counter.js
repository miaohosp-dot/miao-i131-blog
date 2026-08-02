/**
 * 瀏覽次數計數器（Supabase）
 *
 * - 每一篇文章有獨立的計數器，以網址 slug 作為鍵值
 * - 首頁本身也有一個計數器（鍵值為 home）
 * - 首頁的每張卡片會顯示該篇文章的累計次數
 *
 * 未設定 Supabase 時整段靜默略過，計數器保持隱藏，不影響網站其他部分。
 */
(function () {
  'use strict';

  const cfg = window.SUPABASE_CONFIG || {};
  if (!cfg.url || !cfg.anonKey) return; // 尚未設定，直接不做事

  const base = cfg.url.replace(/\/+$/, '');
  const headers = {
    apikey: cfg.anonKey,
    Authorization: 'Bearer ' + cfg.anonKey,
    'Content-Type': 'application/json',
  };

  const format = (n) => Number(n).toLocaleString('zh-TW');

  /** 把數字填進對應的計數器元素並顯示出來 */
  function show(slug, count) {
    document.querySelectorAll('[data-views="' + CSS.escape(slug) + '"]').forEach((el) => {
      const num = el.querySelector('.views__num');
      if (num) num.textContent = format(count);
      el.hidden = false;
    });
  }

  /** 這一頁的 slug；首頁為 home */
  const pageSlug = document.body.dataset.page || 'home';

  /** 累加這一頁的次數，回傳新的數值 */
  async function increment(slug) {
    const res = await fetch(base + '/rest/v1/rpc/increment_view', {
      method: 'POST',
      headers: headers,
      body: JSON.stringify({ page_slug: slug }),
    });
    if (!res.ok) throw new Error('increment failed: ' + res.status);
    return await res.json();
  }

  /** 讀取全部文章的次數，用來填首頁卡片 */
  async function fetchAll() {
    const res = await fetch(base + '/rest/v1/page_views?select=slug,views', {
      headers: headers,
    });
    if (!res.ok) throw new Error('fetch failed: ' + res.status);
    return await res.json();
  }

  async function run() {
    try {
      const count = await increment(pageSlug);
      show(pageSlug, count);
    } catch (err) {
      console.warn('[counter] 累加失敗：', err.message);
    }

    // 首頁還要把每張卡片的數字補上
    if (pageSlug === 'home') {
      try {
        const rows = await fetchAll();
        rows.forEach((row) => {
          if (row.slug !== 'home') show(row.slug, row.views);
        });
      } catch (err) {
        console.warn('[counter] 讀取卡片次數失敗：', err.message);
      }
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', run, { once: true });
  } else {
    run();
  }
})();
