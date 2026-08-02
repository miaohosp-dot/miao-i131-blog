/**
 * 靜態網站建置腳本
 *
 * 讀取 content/*.md，輸出到 dist/：
 *   dist/index.html                     首頁（文章卡片直接寫進 HTML，不靠 JavaScript）
 *   dist/<YYYYMMDD-slug>/index.html     每篇文章各自的網址
 *
 * 「最後更新日期」取自 git 的最後提交時間，若不在 git 中則退回檔案 mtime，
 * 因此每次改完文章重新建置，日期會自動更新，卡片也會依此重新排序。
 */

import { readdirSync, readFileSync, writeFileSync, mkdirSync, cpSync, rmSync, statSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { marked } from 'marked';
import { site } from './site.config.js';

const ROOT = dirname(fileURLToPath(import.meta.url));
const CONTENT = join(ROOT, 'content');
const DIST = join(ROOT, 'dist');

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
      cwd: ROOT,
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'ignore'],
    }).trim();
    if (out) return new Date(out);
  } catch {
    /* 不在 git 中或 git 不可用，往下走 */
  }
  return statSync(filePath).mtime;
}

/**
 * 把 Markdown 產生的 <table> 包進可橫向捲動的容器。
 * 這是表格在手機上不撐破版面的關鍵，讓作者可以直接寫 Markdown 表格。
 */
function wrapTables(html) {
  return html.replace(
    /<table>[\s\S]*?<\/table>/g,
    (table) =>
      `<div class="table-wrap">${table}</div>\n<p class="table-hint">← 表格可左右滑動查看完整內容</p>`
  );
}

const isoDate = (d) => d.toISOString().slice(0, 10);

const zhDate = (d) =>
  `${d.getFullYear()} 年 ${d.getMonth() + 1} 月 ${d.getDate()} 日`;

/* ---------- 讀取文章 -------------------------------------------------- */

function loadPosts() {
  const files = readdirSync(CONTENT).filter((f) => f.endsWith('.md'));

  const posts = files.map((file) => {
    const filePath = join(CONTENT, file);
    const raw = readFileSync(filePath, 'utf8');
    const { data, body } = parseFrontmatter(raw);

    const slug = file.replace(/\.md$/, '');
    if (!/^\d{8}-[a-z0-9-]+$/.test(slug)) {
      throw new Error(`檔名格式必須是 YYYYMMDD-slug.md，但收到：${file}`);
    }

    const published = data.date
      ? new Date(`${data.date}T00:00:00`)
      : new Date(
          `${slug.slice(0, 4)}-${slug.slice(4, 6)}-${slug.slice(6, 8)}T00:00:00`
        );

    return {
      slug,
      file: filePath,
      title: data.title || slug,
      author: data.author || site.defaultAuthor,
      tag: data.tag || '',
      excerpt: data.excerpt || '',
      readingTime: data.readingTime || '',
      published,
      updated: lastUpdated(filePath),
      html: wrapTables(marked.parse(body)),
    };
  });

  // 最新更新的排在最前面
  posts.sort((a, b) => b.updated - a.updated);
  return posts;
}

/* ---------- 版型片段 -------------------------------------------------- */

/** depth 0 = 根目錄，1 = 文章頁（在子資料夾中），用來產生相對路徑 */
const prefix = (depth) => (depth === 0 ? '' : '../');

function head({ title, description, depth, canonicalPath }) {
  const p = prefix(depth);
  return `<!doctype html>
<html lang="${site.lang}">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${escapeHtml(title)}</title>
<meta name="description" content="${escapeHtml(description)}">
<meta property="og:title" content="${escapeHtml(title)}">
<meta property="og:description" content="${escapeHtml(description)}">
<meta property="og:type" content="${depth === 0 ? 'website' : 'article'}">
<meta property="og:image" content="${p}${site.hero.src}">
<link rel="stylesheet" href="${p}assets/style.css">
<link rel="icon" href="data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><text y='.9em' font-size='90'>🐱</text></svg>">
<script defer src="${p}assets/supabase-config.js"></script>
<script defer src="${p}assets/counter.js"></script>
</head>
<body data-page="${escapeHtml(canonicalPath)}">
<a class="skip-link" href="#main">跳到主要內容</a>
<header class="site-header">
  <div class="wrap wrap--wide site-header__inner">
    <a class="brand" href="${p}index.html">
      <span class="brand__mark" aria-hidden="true">🐱</span>
      <span>${escapeHtml(site.shortTitle)}</span>
    </a>
    <nav class="nav" aria-label="主要導覽">
      <a href="${p}index.html"${depth === 0 ? ' aria-current="page"' : ''}>全部文章</a>
    </nav>
  </div>
</header>
<main id="main">`;
}

function footer(depth) {
  const p = prefix(depth);
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
      主視覺：<a href="${c.titleUrl}" rel="noopener">${escapeHtml(c.title)}</a>
      ／ ${escapeHtml(c.author)}，取自 ${escapeHtml(c.source)}${
        c.license
          ? `，授權條款 <a href="${c.licenseUrl}" rel="license noopener">${escapeHtml(c.license)}</a>`
          : ''
      }。
    </p>

    <p class="site-footer__legal">${escapeHtml(site.legal)}</p>
  </div>
</footer>
<script>void 0;</script>
</body>
</html>
`;
}

/** 瀏覽次數顯示元件；slug 為 home 時代表首頁本身 */
const viewCounter = (slug) =>
  `<span class="views" data-views="${escapeHtml(slug)}" hidden><span class="views__num">–</span> 次瀏覽</span>`;

/* ---------- 首頁 ------------------------------------------------------ */

function renderIndex(posts) {
  const h = site.hero;

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

  return (
    head({
      title: `${site.title} ｜ ${site.clinic.name}`,
      description: site.description,
      depth: 0,
      canonicalPath: 'home',
    }) +
    `
  <section class="hero">
    <div class="wrap">
      <img class="hero__img" src="${h.src}" width="${h.width}" height="${h.height}"
           alt="${escapeHtml(h.alt)}" fetchpriority="high">
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

function renderPost(post) {
  const h = site.hero;
  return (
    head({
      title: `${post.title} ｜ ${site.shortTitle}`,
      description: post.excerpt || site.description,
      depth: 1,
      canonicalPath: post.slug,
    }) +
    `
  <article class="article wrap">
    <a class="back-link" href="../index.html">← 回到文章列表</a>

    <img class="hero__img" src="../${h.src}" width="${h.width}" height="${h.height}"
         alt="${escapeHtml(h.alt)}" loading="eager">

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
` +
    footer(1)
  );
}

/* ---------- 建置 ------------------------------------------------------ */

function build() {
  rmSync(DIST, { recursive: true, force: true });
  mkdirSync(DIST, { recursive: true });

  const posts = loadPosts();

  writeFileSync(join(DIST, 'index.html'), renderIndex(posts));

  for (const post of posts) {
    const dir = join(DIST, post.slug);
    mkdirSync(dir, { recursive: true });
    writeFileSync(join(dir, 'index.html'), renderPost(post));
  }

  cpSync(join(ROOT, 'assets'), join(DIST, 'assets'), { recursive: true });

  // GitHub Pages 不要用 Jekyll 處理
  writeFileSync(join(DIST, '.nojekyll'), '');

  console.log(`建置完成：${posts.length} 篇文章`);
  for (const p of posts) {
    console.log(`  /${p.slug}/  ${isoDate(p.updated)}  ${p.title}`);
  }
}

build();
