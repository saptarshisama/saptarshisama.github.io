// Unified blog build:
//   1. Convert every Markdown draft in blog/drafts/*.md into a styled HTML
//      post in blog/posts/<slug>.html (front matter preserved).
//   2. Scan blog/posts/*.html, build blog/index.json (sorted, newest first).
//   3. Write a standalone, crawlable page blog/<slug>.html per post (the SPA
//      only renders posts client-side at #post-N, which search engines skip).
//   4. Regenerate sitemap.xml from the index.
//
// Authoring: drop a .md file in blog/drafts/ with front matter, run
// `npm run build`. The slug comes from the file name (foo-bar.md ->
// foo-bar.html). The template draft (_template.md) is ignored.

const fs = require('fs');
const path = require('path');
const { mdToHtml } = require('./md');
const { parseFrontMatter } = require('./frontmatter');
const { renderPostPage } = require('./page');

const ROOT = path.join(__dirname, '..');
const DRAFTS_DIR = path.join(ROOT, 'blog/drafts');
const POSTS_DIR = path.join(ROOT, 'blog/posts');
const INDEX_FILE = path.join(ROOT, 'blog/index.json');
const PAGES_DIR = path.join(ROOT, 'blog');
const SITEMAP_FILE = path.join(ROOT, 'sitemap.xml');
const BASE_URL = 'https://saptarshisama.github.io';

function isTemplate(name) {
  return name.startsWith('_') || /^template\./.test(name);
}

// --- 1. Markdown drafts -> HTML posts ---------------------------------------
function buildDrafts() {
  if (!fs.existsSync(DRAFTS_DIR)) return 0;
  const drafts = fs.readdirSync(DRAFTS_DIR).filter(f => f.endsWith('.md') && !isTemplate(f));
  fs.mkdirSync(POSTS_DIR, { recursive: true });

  drafts.forEach(file => {
    const raw = fs.readFileSync(path.join(DRAFTS_DIR, file), 'utf8');
    const { meta, body } = parseFrontMatter(raw);
    if (!meta) {
      console.warn(`Skipping draft ${file}: no front matter.`);
      return;
    }
    const slug = file.replace(/\.md$/, '');
    const html = mdToHtml(body).trim();

    // Re-emit the same front matter block so index generation stays uniform.
    const fm = [
      '---',
      meta.id != null ? `id: ${meta.id}` : null,
      `title: ${JSON.stringify(meta.title || slug)}`,
      `date: ${JSON.stringify(meta.date || '')}`,
      `tags: [${(Array.isArray(meta.tags) ? meta.tags : []).map(t => JSON.stringify(t)).join(', ')}]`,
      `excerpt: ${JSON.stringify(meta.excerpt || '')}`,
      '---',
      ''
    ].filter(l => l !== null).join('\n');

    fs.writeFileSync(path.join(POSTS_DIR, `${slug}.html`), `${fm}\n${html}\n`);
  });

  if (drafts.length) console.log(`Converted ${drafts.length} markdown draft(s) to HTML.`);
  return drafts.length;
}

// --- 2. Posts -> index.json -------------------------------------------------
function buildIndex() {
  if (!fs.existsSync(POSTS_DIR)) {
    console.error(`Posts directory not found: ${POSTS_DIR}`);
    process.exit(1);
  }
  const files = fs.readdirSync(POSTS_DIR)
    .filter(f => f.endsWith('.html') && !isTemplate(f));

  const posts = [];
  files.forEach(file => {
    const content = fs.readFileSync(path.join(POSTS_DIR, file), 'utf8');
    const { meta } = parseFrontMatter(content);
    if (!meta) { console.warn(`Skipping ${file}: no front matter.`); return; }
    posts.push({ filename: file, ...meta });
  });

  posts.sort((a, b) => new Date(b.date) - new Date(a.date));

  // Stable IDs: keep declared ids, fall back to a descending counter.
  let fallback = posts.length;
  posts.forEach(post => {
    post.id = post.id != null ? parseInt(post.id, 10) : fallback;
    fallback--;
  });

  const seen = new Map();
  posts.forEach(p => {
    if (seen.has(p.id)) console.warn(`Duplicate id ${p.id}: ${seen.get(p.id)} and ${p.filename}`);
    seen.set(p.id, p.filename);
  });

  fs.writeFileSync(INDEX_FILE, JSON.stringify(posts, null, 2) + '\n');
  console.log(`Generated blog index with ${posts.length} post(s).`);
  return posts;
}

// --- 3. posts -> standalone pages ------------------------------------------
function buildPostPages(posts) {
  posts.forEach(post => {
    const raw = fs.readFileSync(path.join(POSTS_DIR, post.filename), 'utf8');
    const { body } = parseFrontMatter(raw);
    fs.writeFileSync(path.join(PAGES_DIR, post.filename), renderPostPage(post, body.trim(), BASE_URL));
  });
  console.log(`Generated ${posts.length} standalone post page(s).`);
}

// --- 4. index.json -> sitemap.xml -------------------------------------------
function buildSitemap(posts) {
  const today = new Date().toISOString().split('T')[0];
  let xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url>
    <loc>${BASE_URL}/</loc>
    <lastmod>${today}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>1.0</priority>
  </url>`;

  posts.forEach(post => {
    xml += `
  <url>
    <loc>${BASE_URL}/blog/${post.filename}</loc>
    <lastmod>${post.date || today}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.8</priority>
  </url>`;
  });

  xml += `
</urlset>\n`;
  fs.writeFileSync(SITEMAP_FILE, xml);
  console.log(`Generated sitemap with ${posts.length + 1} URL(s).`);
}

buildDrafts();
const posts = buildIndex();
buildPostPages(posts);
buildSitemap(posts);
