/**
 * 全站設定。改這裡就會反映到所有頁面。
 */
export const site = {
  /**
   * 網站的正式網址（結尾不要加斜線）。
   * 這個值決定 canonical、og:image、sitemap 使用的絕對網址，
   * 也是解決「同內容同時存在 pages.dev 與 github.io」重複內容問題的關鍵。
   */
  baseUrl: 'https://miao-i131-blog.pages.dev',

  title: '貓甲亢與放射碘治療',
  shortTitle: '喵屋 · 甲亢與放射碘',
  description:
    '貓咪甲狀腺機能亢進與碘-131 放射碘治療的完整衛教：症狀辨識、四種治療方式比較、療程流程與治療後追蹤。',
  lang: 'zh-Hant-TW',

  /** 文章未指定作者時使用的預設值 */
  defaultAuthor: '喵屋貓咪專科醫院',

  /**
   * 可用的 HERO 圖片。文章 frontmatter 用 `hero: cat` 指定其中一個。
   * 全部都會等比例縮放，寬度不超過內容文字區。
   */
  images: {
    /** 首頁主視覺，取自 miao.tw 的 hero banner */
    main: {
      src: 'assets/img/miao-hero.jpg',
      width: 1400,
      height: 697,
      // 圖上有內嵌文字，alt 必須把文字內容也帶進來，螢幕閱讀器才讀得到
      alt: '貓是上帝最完美的傑作 — The smallest feline is a masterpiece',
    },
    iod: {
      src: 'assets/img/hero-main.webp',
      width: 980,
      height: 840,
      alt: '貓咪碘-131 放射碘治療中心主視覺',
    },
    cat: {
      src: 'assets/img/article-cat.jpg',
      width: 1200,
      height: 627,
      alt: '一隻貓在夕陽下的海邊行走',
    },
    clinic: {
      src: 'assets/img/clinic-wide.jpg',
      width: 1600,
      height: 655,
      alt: '喵屋貓咪專科醫院環境',
    },
  },

  /** 首頁使用的 HERO 圖 */
  defaultHero: 'main',

  /**
   * 圖片出處標示，顯示於 footer。
   * 目前使用的是喵屋自有網站 iod131.com 的素材，非 CC 授權圖片。
   * 若日後改用 CC BY 圖片，把 license / licenseUrl 填上即可自動顯示授權連結。
   */
  heroCredit: {
    title: '網站主視覺與環境照',
    titleUrl: 'https://www.miao.tw/',
    author: '喵屋貓咪專科醫院',
    license: '',
    licenseUrl: '',
    source: 'miao.tw 與 iod131.com',
  },

  clinic: {
    name: '喵屋貓咪專科醫院',
    phone: '(04) 2328-3681',
    email: 'miao.hosp@gmail.com',
    address: '台中市大墩十七街 125 號',
  },

  legal:
    '本站內容為一般衛教資訊，無法取代獸醫師的臨床診斷。每隻貓的年齡、腎功能、心臟狀況與併發症都不同，實際治療方式請與您的主治獸醫師討論後決定。',
};
