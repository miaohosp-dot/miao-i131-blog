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
  shortTitle: '喵屋貓咪專科醫院 · 甲亢與放射碘',

  /**
   * 頁首品牌名稱。suffix 在窄螢幕會隱藏，
   * 讓「喵屋貓咪專科醫院」與導覽列擠得進同一行。
   */
  brand: {
    name: '喵屋貓咪專科醫院',
    suffix: '甲亢與放射碘',
  },

  /** 頁首右上角的行動呼籲按鈕 */
  cta: {
    label: '預約諮詢',
    url: 'https://docs.google.com/forms/d/e/1FAIpQLSdwGYeMCEBEi1mN2byzxcro8L-IkvVt9ys0TfNri4cEG1fyrA/viewform?pli=1',
  },
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
      caption: '貓是上帝最完美的傑作',
    },
    iod: {
      src: 'assets/img/hero-main.webp',
      width: 980,
      height: 840,
      alt: '貓咪碘-131 放射碘治療中心主視覺',
      caption: '喵屋碘-131 放射碘治療中心',
    },
    cat: {
      src: 'assets/img/article-cat.jpg',
      width: 1200,
      height: 627,
      alt: '一隻貓在夕陽下的海邊行走',
      caption: '中老年貓的每一天，都值得被好好照顧',
    },

    /* 以下取自 miao911.com（周春婷獸醫師），每篇文章各用一張 */
    senior: {
      src: 'assets/img/cat-senior.jpg',
      width: 1200,
      height: 770,
      alt: '一隻消瘦的橘貓在住院籠中休息',
      caption: '甲亢常見於中老年貓，體重下降是最早被注意到的變化',
    },
    pupils: {
      src: 'assets/img/cat-pupils.jpg',
      width: 519,
      height: 376,
      alt: '一隻灰貓被毛巾包裹保定，瞳孔明顯放大',
      caption: '躁動、瞳孔放大，是甲亢貓常見的樣子',
    },
    sideEffects: {
      src: 'assets/img/drug-side-effects.jpg',
      width: 1200,
      height: 672,
      alt: '貓甲亢藥物副作用示意圖：皮膚反應、消化系統、行為改變、肝臟問題、血液與免疫',
      caption: '抗甲狀腺藥物可能出現的副作用',
    },
    cage: {
      src: 'assets/img/cat-cage.jpg',
      width: 914,
      height: 613,
      alt: '一隻貓站立扶著住院籠門向外看',
      caption: '放射碘治療期間必須住院隔離，這段時間無法探視',
    },
    clinic: {
      src: 'assets/img/clinic-wide.jpg',
      width: 1600,
      height: 655,
      alt: '喵屋貓咪專科醫院環境',
      caption: '喵屋貓咪專科醫院',
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
    source: 'miao.tw、iod131.com 與 miao911.com',
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
