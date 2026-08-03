/**
 * 成績數據區的進場動畫
 *
 * 設計原則：HTML 已經輸出正確的數字與長條高度，這支腳本只負責「動畫」。
 * 因此腳本沒載入、被擋掉、或觀察器沒觸發時，使用者看到的仍是正確數據，
 * 只是少了動畫效果——不會出現一整排 0。
 *
 * - 數字從 0 跳動到目標值
 * - 長條由下往上長高，逐根延遲
 * - 捲到該區塊時才觸發，只播一次
 * - 系統設定要求減少動態效果時完全不動
 */
(function () {
  'use strict';

  const section = document.querySelector('.stats');
  if (!section) return;

  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

  const counts = section.querySelectorAll('.count');
  const bars = section.querySelectorAll('.bar__fill');
  if (!counts.length) return;

  const format = (n) => Number(n).toLocaleString('zh-TW');
  const easeOut = (t) => 1 - Math.pow(1 - t, 3); // 末段減速，跳動比較自然

  let played = false;

  function play() {
    if (played) return;

    // 頁面在背景時 requestAnimationFrame 會被凍結。若此時歸零再動畫，
    // 數字會卡在 0 直到使用者切回分頁。所以先等到頁面可見再播。
    if (document.hidden) {
      document.addEventListener('visibilitychange', function onShow() {
        if (document.hidden) return;
        document.removeEventListener('visibilitychange', onShow);
        play();
      });
      return;
    }

    played = true;

    // 動畫開始的瞬間才歸零，避免「JS 有載入但沒觸發」時停在 0
    counts.forEach((el) => {
      el.textContent = '0';
    });
    bars.forEach((el, i) => {
      el.style.transition = 'none';
      el.style.height = '0';
      // 強制重排，讓瀏覽器認得「從 0 開始」這個起點
      void el.offsetHeight;
      el.style.transition = '';
      el.style.transitionDelay = i * 90 + 'ms';
      el.style.height = ''; // 交還給 CSS 的 var(--h)，觸發 transition
    });

    const DURATION = 1500;
    const start = performance.now();

    function step(now) {
      const t = Math.min((now - start) / DURATION, 1);
      const eased = easeOut(t);
      counts.forEach((el) => {
        el.textContent = format(Math.round(Number(el.dataset.to) * eased));
      });
      if (t < 1) requestAnimationFrame(step);
      else counts.forEach((el) => (el.textContent = format(el.dataset.to)));
    }
    requestAnimationFrame(step);
  }

  /** 區塊是否已經進入視窗 */
  function inView() {
    const r = section.getBoundingClientRect();
    return r.top < window.innerHeight * 0.85 && r.bottom > 0;
  }

  if ('IntersectionObserver' in window) {
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (!e.isIntersecting) return;
          io.disconnect();
          play();
        });
      },
      { threshold: 0.2 }
    );
    io.observe(section);
  }

  // 後備：某些環境（如內嵌預覽視窗）不會觸發 IntersectionObserver，
  // 用捲動事件補上，確保動畫該播的時候會播。
  function onScroll() {
    if (inView()) {
      window.removeEventListener('scroll', onScroll);
      play();
    }
  }
  window.addEventListener('scroll', onScroll, { passive: true });
  if (inView()) play();
})();
