/**
 * 靜態網站建置腳本
 *
 * 讀取 content/*.md 與 pages/*.md，輸出到 dist/：
 *   dist/index.html                     首頁（文章卡片直接寫進 HTML，不靠 JavaScript）
 *   dist/<YYYYMMDD-slug>/index.html     每篇文章各自的網址
 *   dist/<slug>/index.html              固定頁面（例如 /about/）
 *   dist/sitemap.xml, robots.txt, 404.html
 *
 * 「最後更新日期」取自 git 的最後提交時間，若不在 git 中則退回檔案 mtime，
 * 因此每次改完文章重新建置，日期會自動更新，卡片也會依此重新排序。
 */

import {
  readdirSync, readFileSync, writeFileSync, mkdirSync, cpSync, rmSync, statSync, existsSync,
} from 'node:fs';
import { execFileSync } from 'node:child_process';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { marked } from 'marked';
import { site } from './site.config.js';

const ROOT = dirname(fileURLToPath(import.meta.url));
const CONTENT = join(ROOT, 'content');
const PAGES = join(ROOT, 'pages');
const DIST = join(ROOT, 'dist');

const BASE = site.baseUrl.replace(/\/+$/, '');

/* ---------- 小工具 ---------------------------------------------------- */

const escapeHtml = (s) =>
  String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);

/** 極簡 frontmatter 解析：key: value，值不需引號 */
function parseFrontmatter(raw) {
  const match = raw.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n?([\s\S]*)$/);
  if (!match) return { data: {}, body: raw };
  const data = {};
  for (const line of match[1].split(/\r?\n/)) {
    const m = line.match(/^([A-Za-z][\w-]*)\s*:\s*(.*)$/);
    if (m) data[m[1]] = m[2].trim().replace(/^["']|["']$/g, '');
  }
  return { data, body: match[2] };
}

/** 取得檔案的最後更新時間：優先用 git 提交時間，否則用檔案 mtime */
function lastUpdated(filePath) {
  try {
    const out = execFileSync('git', ['log', '-1', '--format=%cI', '--', filePath], {
      cwd: ROOT, encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'],
    }).trim();
    if (out) return new Date(out);
  } catch {
    /* 不在 git 中或 git 不可用 */
  }
  return statSync(filePath).mtime;
}

/**
 * 把 Markdown 產生的 <table> 包進可橫向捲動的容器。
 * 這是表格在手機上不撐破版面的關鍵。
 */
function wrapTables(html) {
  return html.replace(
    /<table>[\s\S]*?<\/table>/g,
    (table) =>
      `<div class="table-wrap">${table}</div>\n<p class="table-hint">← 表格可左右滑動查看完整內容</p>`
  );
}

/**
 * 以「本地時間」組出 YYYY-MM-DD。
 * 不能用 toISOString()——它會轉成 UTC，台灣是 UTC+8，
 * 午夜零點會被推回前一天，導致機器可讀的日期整整差一天。
 */
const isoDate = (d) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

const zhDate = (d) => `${d.getFullYear()} 年 ${d.getMonth() + 1} 月 ${d.getDate()} 日`;

/** 取得指定的 HERO 圖設定，找不到就用預設 */
const heroFor = (key) => site.images[key] || site.images[site.defaultHero];

/* ---------- 讀取內容 -------------------------------------------------- */

function loadPosts() {
  const files = readdirSync(CONTENT).filter((f) => f.endsWith('.md'));

  const posts = files.map((file) => {
    const filePath = join(CONTENT, file);
    const { data, body } = parseFrontmatter(readFileSync(filePath, 'utf8'));

    const slug = file.replace(/\.md$/, '');
    if (!/^\d{8}-[a-z0-9-]+$/.test(slug)) {
      throw new Error(`檔名格式必須是 YYYYMMDD-slug.md，但收到：${file}`);
    }

    const published = data.date
      ? new Date(`${data.date}T00:00:00`)
      : new Date(`${slug.slice(0, 4)}-${slug.slice(4, 6)}-${slug.slice(6, 8)}T00:00:00`);

    return {
      slug,
      title: data.title || slug,
      author: data.author || site.defaultAuthor,
      tag: data.tag || '',
      excerpt: data.excerpt || '',
      readingTime: data.readingTime || '',
      hero: heroFor(data.hero),
      published,
      updated: lastUpdated(filePath),
      html: wrapTables(marked.parse(body)),
    };
  });

  posts.sort((a, b) => b.updated - a.updated); // 最新更新的排最前面
  return posts;
}

function loadPages() {
  if (!existsSync(PAGES)) return [];
  return readdirSync(PAGES)
    .filter((f) => f.endsWith('.md'))
    .map((file) => {
      const filePath = join(PAGES, file);
      const { data, body } = parseFrontmatter(readFileSync(filePath, 'utf8'));
      return {
        slug: file.replace(/\.md$/, ''),
        title: data.title || file,
        description: data.description || site.description,
        hero: heroFor(data.hero),
        updated: lastUpdated(filePath),
        html: wrapTables(marked.parse(body)),
      };
    });
}

/* ---------- 版型片段 -------------------------------------------------- */

/** depth 0 = 根目錄，1 = 子資料夾，用來產生相對路徑 */
const prefix = (depth) => (depth === 0 ? '' : '../');

function head({ title, description, depth, canonicalPath, image, jsonLd }) {
  const p = prefix(depth);
  const canonical = canonicalPath === '' ? `${BASE}/` : `${BASE}/${canonicalPath}/`;
  const img = image || site.images[site.defaultHero];

  return `<!doctype html>
<html lang="${site.lang}">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${escapeHtml(title)}</title>
<meta name="description" content="${escapeHtml(description)}">
<link rel="canonical" href="${canonical}">
<meta property="og:site_name" content="${escapeHtml(site.clinic.name)}">
<meta property="og:title" content="${escapeHtml(title)}">
<meta property="og:description" content="${escapeHtml(description)}">
<meta property="og:type" content="${depth === 0 ? 'website' : 'article'}">
<meta property="og:url" content="${canonical}">
<meta property="og:image" content="${BASE}/${img.src}">
<meta property="og:locale" content="zh_TW">
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:title" content="${escapeHtml(title)}">
<meta name="twitter:description" content="${escapeHtml(description)}">
<meta name="twitter:image" content="${BASE}/${img.src}">
<link rel="stylesheet" href="${p}assets/style.css">
<link rel="icon" href="data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><text y='.9em' font-size='90'>🐱</text></svg>">
${jsonLd ? `<script type="application/ld+json">${JSON.stringify(jsonLd)}</script>` : ''}
<script defer src="${p}assets/supabase-config.js"></script>
<script defer src="${p}assets/counter.js"></script>
</head>
<body data-page="${escapeHtml(canonicalPath || 'home')}">
<a class="skip-link" href="#main">跳到主要內容</a>
<header class="site-header">
  <div class="wrap wrap--wide site-header__inner">
    <a class="brand" href="${p || './'}">
      <span>${escapeHtml(site.shortTitle)}</span>
    </a>
    <nav class="nav" aria-label="主要導覽">
      <a href="${p || './'}"${depth === 0 ? ' aria-current="page"' : ''}>全部文章</a>
      <a href="${p}about/">關於我們</a>
    </nav>
  </div>
</header>
<main id="main">`;
}

function footer(depth) {
  const c = site.heroCredit;
  return `</main>
<footer class="site-footer">
  <div class="wrap wrap--wide">
    <h2>${escapeHtml(site.clinic.name)}</h2>
    <ul class="contact-list">
      <li><span>電話</span><span>${escapeHtml(site.clinic.phone)}</span></li>
      <li><span>信箱</span><span>${escapeHtml(site.clinic.email)}</span></li>
      <li><span>地址</span><span>${escapeHtml(site.clinic.address)}</span></li>
    </ul>

    <p class="site-footer__credit">
      圖片：<a href="${c.titleUrl}" rel="noopener">${escapeHtml(c.title)}</a>
      ／ ${escapeHtml(c.author)}，取自 ${escapeHtml(c.source)}${
        c.license
          ? `，授權條款 <a href="${c.licenseUrl}" rel="license noopener">${escapeHtml(c.license)}</a>`
          : ''
      }。
    </p>

    <p class="site-footer__legal">${escapeHtml(site.legal)}</p>
  </div>
</footer>
</body>
</html>
`;
}

const viewCounter = (slug) =>
  `<span class="views" data-views="${escapeHtml(slug)}" hidden><span class="views__num">–</span> 次瀏覽</span>`;

const heroImg = (img, depth, eager) =>
  `<img class="hero__img" src="${prefix(depth)}${img.src}" width="${img.width}" height="${img.height}" alt="${escapeHtml(img.alt)}" ${eager ? 'fetchpriority="high"' : 'loading="lazy"'}>`;

/* ---------- 首頁 ------------------------------------------------------ */

function renderIndex(posts) {
  const hero = site.images[site.defaultHero];

  const cards = posts
    .map(
      (post) => `      <li class="card">
        <div class="card__meta">
          ${post.tag ? `<span class="tag">${escapeHtml(post.tag)}</span>` : ''}
          <time datetime="${isoDate(post.updated)}">更新於 ${zhDate(post.updated)}</time>
          ${post.readingTime ? `<span>閱讀約 ${escapeHtml(post.readingTime)} 分鐘</span>` : ''}
          ${viewCounter(post.slug)}
        </div>
        <h2><a href="${post.slug}/">${escapeHtml(post.title)}</a></h2>
        <p>${escapeHtml(post.excerpt)}</p>
        <p class="card__author">${escapeHtml(post.author)}</p>
      </li>`
    )
    .join('\n');

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Blog',
    name: site.title,
    description: site.description,
    url: `${BASE}/`,
    inLanguage: 'zh-Hant-TW',
    publisher: {
      '@type': 'VeterinaryCare',
      name: site.clinic.name,
      telephone: site.clinic.phone,
      email: site.clinic.email,
      address: site.clinic.address,
    },
  };

  return (
    head({
      title: `${site.title} ｜ ${site.clinic.name}`,
      description: site.description,
      depth: 0,
      canonicalPath: '',
      image: hero,
      jsonLd,
    }) +
    `
  <section class="hero">
    <div class="wrap">
      ${heroImg(hero, 0, true)}
      <h1>貓咪甲狀腺機能亢進<br>與放射碘治療</h1>
      <p>甲亢是中老年貓最常見的內分泌疾病。這裡整理了從症狀辨識、治療選擇到 I-131 療程的完整說明，希望能幫助你在照顧牠的路上少一點徬徨。</p>
      <p class="hero__views">${viewCounter('home')}</p>
    </div>
  </section>

  <div class="wrap">
    <ul class="post-list">
${cards}
    </ul>
  </div>
` +
    footer(0)
  );
}

/* ---------- 文章頁 ---------------------------------------------------- */

function renderPost(post, prev, next) {
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'MedicalWebPage',
    headline: post.title,
    description: post.excerpt,
    datePublished: isoDate(post.published),
    dateModified: isoDate(post.updated),
    inLanguage: 'zh-Hant-TW',
    mainEntityOfPage: `${BASE}/${post.slug}/`,
    image: `${BASE}/${post.hero.src}`,
    author: { '@type': 'Organization', name: post.author },
    publisher: {
      '@type': 'VeterinaryCare',
      name: site.clinic.name,
      telephone: site.clinic.phone,
      address: site.clinic.address,
    },
    about: { '@type': 'MedicalCondition', name: '貓甲狀腺機能亢進' },
  };

  const navLink = (p, label, cls) =>
    p
      ? `<a class="post-nav__item ${cls}" href="../${p.slug}/">
           <span class="post-nav__label">${label}</span>
           <span class="post-nav__title">${escapeHtml(p.title)}</span>
         </a>`
      : '';

  const postNav =
    prev || next
      ? `  <nav class="post-nav wrap" aria-label="文章導覽">
${navLink(prev, '上一篇', 'post-nav__item--prev')}
${navLink(next, '下一篇', 'post-nav__item--next')}
  </nav>`
      : '';

  return (
    head({
      title: `${post.title} ｜ ${site.shortTitle}`,
      description: post.excerpt || site.description,
      depth: 1,
      canonicalPath: post.slug,
      image: post.hero,
      jsonLd,
    }) +
    `
  <article class="article wrap">
    <a class="back-link" href="../">← 回到文章列表</a>

    ${heroImg(post.hero, 1, true)}

    <header class="article__header">
      <h1>${escapeHtml(post.title)}</h1>
      <div class="article__meta">
        ${post.tag ? `<span class="tag">${escapeHtml(post.tag)}</span>` : ''}
        <span class="article__author">${escapeHtml(post.author)}</span>
        <time datetime="${isoDate(post.published)}">發布於 ${zhDate(post.published)}</time>
        <time datetime="${isoDate(post.updated)}">最後更新 ${zhDate(post.updated)}</time>
        ${post.readingTime ? `<span>閱讀約 ${escapeHtml(post.readingTime)} 分鐘</span>` : ''}
        ${viewCounter(post.slug)}
      </div>
    </header>

${post.html}
  </article>

${postNav}
` +
    footer(1)
  );
}

/* ---------- 固定頁面 -------------------------------------------------- */

function renderPage(page) {
  return (
    head({
      title: `${page.title} ｜ ${site.shortTitle}`,
      description: page.description,
      depth: 1,
      canonicalPath: page.slug,
      image: page.hero,
    }) +
    `
  <article class="article wrap">
    <a class="back-link" href="../">← 回到文章列表</a>
    ${heroImg(page.hero, 1, true)}
    <header class="article__header">
      <h1>${escapeHtml(page.title)}</h1>
    </header>
${page.html}
  </article>
` +
    footer(1)
  );
}

/* ---------- 404 ------------------------------------------------------- */

function render404() {
  return (
    head({
      title: `找不到這個頁面 ｜ ${site.shortTitle}`,
      description: '找不到這個頁面。',
      depth: 0,
      canonicalPath: '',
    }) +
    `
  <article class="article wrap">
    <header class="article__header">
      <h1>找不到這個頁面</h1>
    </header>
    <p>你要找的網址不存在，可能是連結有誤，或該篇文章已經調整過網址。</p>
    <p><a href="/">← 回到文章列表</a></p>
  </article>
` +
    footer(0)
  );
}

/* ---------- sitemap / robots ------------------------------------------ */

function renderSitemap(entries) {
  const urls = entries
    .map(
      (e) => `  <url>
    <loc>${e.loc}</loc>
    <lastmod>${isoDate(e.lastmod)}</lastmod>
  </url>`
    )
    .join('\n');
  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls}
</urlset>
`;
}

const renderRobots = () => `User-agent: *
Allow: /

Sitemap: ${BASE}/sitemap.xml
`;

/* ---------- 建置 ------------------------------------------------------ */

function build() {
  rmSync(DIST, { recursive: true, force: true });
  mkdirSync(DIST, { recursive: true });

  const posts = loadPosts();
  const pages = loadPages();

  writeFileSync(join(DIST, 'index.html'), renderIndex(posts));

  posts.forEach((post, i) => {
    // 依排序：前一篇是較新的，後一篇是較舊的
    const prev = posts[i - 1] || null;
    const next = posts[i + 1] || null;
    const dir = join(DIST, post.slug);
    mkdirSync(dir, { recursive: true });
    writeFileSync(join(dir, 'index.html'), renderPost(post, prev, next));
  });

  for (const page of pages) {
    const dir = join(DIST, page.slug);
    mkdirSync(dir, { recursive: true });
    writeFileSync(join(dir, 'index.html'), renderPage(page));
  }

  const newest = posts.length ? posts[0].updated : new Date();
  const sitemapEntries = [
    { loc: `${BASE}/`, lastmod: newest },
    ...posts.map((p) => ({ loc: `${BASE}/${p.slug}/`, lastmod: p.updated })),
    ...pages.map((p) => ({ loc: `${BASE}/${p.slug}/`, lastmod: p.updated })),
  ];

  writeFileSync(join(DIST, 'sitemap.xml'), renderSitemap(sitemapEntries));
  writeFileSync(join(DIST, 'robots.txt'), renderRobots());
  writeFileSync(join(DIST, '404.html'), render404());
  writeFileSync(join(DIST, '.nojekyll'), '');

  cpSync(join(ROOT, 'assets'), join(DIST, 'assets'), { recursive: true });

  console.log(`建置完成：${posts.length} 篇文章、${pages.length} 個固定頁面`);
  for (const p of posts) console.log(`  /${p.slug}/  ${isoDate(p.updated)}  ${p.title}`);
  for (const p of pages) console.log(`  /${p.slug}/  （固定頁）${p.title}`);
  console.log(`  sitemap.xml：${sitemapEntries.length} 筆`);
}

build();
