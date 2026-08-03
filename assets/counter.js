/**
 * 瀏覽次數計數器
 *
 * - 每一篇文章有獨立的計數器，以網址 slug 作為鍵值
 * - 首頁本身也有一個計數器（鍵值為 home）
 * - 首頁的每張卡片會顯示該篇文章的累計次數
 *
 * 資料來自 counter-worker/（Cloudflare Worker + D1）。
 * 未設定 API 位址時整段靜默略過，計數器保持隱藏。
 */
(function () {
  'use strict';

  const API = (window.VIEWS_API || '').replace(/\/+$/, '');
  if (!API) return; // 尚未設定，不做任何事

  const format = (n) => Number(n).toLocaleString('zh-TW');

  /** 把數字填進對應的計數器元素並顯示出來 */
  function show(slug, count) {
    document
      .querySelectorAll('[data-views="' + CSS.escape(slug) + '"]')
      .forEach((el) => {
        const num = el.querySelector('.views__num');
        if (num) num.textContent = format(count);
        el.hidden = false;
      });
  }

  /** 這一頁的 slug；首頁為 home */
  const pageSlug = document.body.dataset.page || 'home';

  async function increment(slug) {
    const res = await fetch(API + '/v/' + encodeURIComponent(slug), {
      method: 'POST',
    });
    if (!res.ok) throw new Error('increment failed: ' + res.status);
    return (await res.json()).views;
  }

  async function fetchAll() {
    const res = await fetch(API + '/all');
    if (!res.ok) throw new Error('fetch failed: ' + res.status);
    return await res.json();
  }

  async function run() {
    try {
      show(pageSlug, await increment(pageSlug));
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
