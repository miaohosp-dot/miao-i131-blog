/**
 * 全站設定。改這裡就會反映到所有頁面。
 */
export const site = {
  title: '貓甲亢與放射碘治療',
  shortTitle: '喵屋 · 甲亢與放射碘',
  description:
    '貓咪甲狀腺機能亢進與碘-131 放射碘治療的完整衛教：症狀辨識、四種治療方式比較、療程流程與治療後追蹤。',
  lang: 'zh-Hant-TW',

  /** 文章未指定作者時使用的預設值 */
  defaultAuthor: '喵屋貓咪專科醫院',

  /** HERO 區圖片（等比例縮放，寬度不超過內容區） */
  hero: {
    src: 'assets/img/hero-main.webp',
    width: 980,
    height: 840,
    alt: '貓咪碘-131 放射碘治療中心主視覺',
  },

  /**
   * HERO 圖片出處標示，顯示於 footer。
   * 目前使用的是喵屋自有網站 iod131.com 的主視覺，非 CC 授權素材。
   * 若日後改用 CC BY 圖片，把 license / licenseUrl 填上即可自動顯示授權連結。
   */
  heroCredit: {
    title: '碘-131 放射碘治療中心主視覺',
    titleUrl: 'https://www.iod131.com/',
    author: '喵屋貓咪專科醫院',
    license: '', // 自有素材，無需 CC 授權標示
    licenseUrl: '',
    source: 'iod131.com',
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
