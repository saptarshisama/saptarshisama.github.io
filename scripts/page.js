// Renders a standalone, crawlable HTML page for one blog post.
const { escapeHtml: e } = require('./md');

function fmtDate(d) {
  const t = new Date(d);
  return isNaN(t) ? '' : t.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric', timeZone: 'UTC' });
}

function renderPostPage(post, bodyHtml, baseUrl) {
  const url = `${baseUrl}/blog/${post.filename}`;
  const title = `${post.title} — Saptarshi Samanta`;
  const desc = post.excerpt || '';
  const ld = {
    '@context': 'https://schema.org',
    '@type': 'BlogPosting',
    headline: post.title,
    description: desc,
    datePublished: post.date,
    author: { '@type': 'Person', name: 'Saptarshi Samanta', url: `${baseUrl}/` },
    mainEntityOfPage: url,
    keywords: (post.tags || []).join(', ')
  };
  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${e(title)}</title>
<meta name="description" content="${e(desc).replace(/"/g, '&quot;')}">
<meta name="author" content="Saptarshi Samanta">
<link rel="canonical" href="${url}">
<meta property="og:type" content="article">
<meta property="og:title" content="${e(post.title).replace(/"/g, '&quot;')}">
<meta property="og:description" content="${e(desc).replace(/"/g, '&quot;')}">
<meta property="og:url" content="${url}">
<meta property="og:site_name" content="Saptarshi Samanta">
<meta property="article:published_time" content="${e(post.date || '')}">
<meta name="twitter:card" content="summary">
<script type="application/ld+json">${JSON.stringify(ld).replace(/</g, '\u003c')}</script>
<style>
:root{--bg:#fffff8;--ink:#111;--muted:#555;--link:#07c;--rule:#e6e4de}
@media(prefers-color-scheme:dark){:root{--bg:#0e0e0e;--ink:#e6e6e6;--muted:#b3b3b3;--link:#7db0ff;--rule:#242424}}
*{box-sizing:border-box}
body{margin:0;background:var(--bg);color:var(--ink);font:17px/1.65 Charter,Constantia,"Palatino Linotype",Palatino,Georgia,serif}
main{max-width:70ch;margin:0 auto;padding:2rem 1rem}
a{color:var(--link);text-decoration:none}a:hover{text-decoration:underline}
h1{font-size:2.2rem;line-height:1.2;margin:1rem 0 .5rem}
h2{border-bottom:1px solid var(--rule);padding-bottom:.3rem}
.meta{color:var(--muted);font-size:.9rem}
.tag{display:inline-block;background:var(--rule);color:var(--muted);padding:.15rem .4rem;border-radius:.2rem;font-size:.8rem;margin-right:.3rem}
code{background:var(--rule);padding:.1em .3em;border-radius:.2em}
pre{background:var(--rule);padding:1rem;overflow-x:auto}pre code{background:none;padding:0}
blockquote{border-left:3px solid var(--rule);padding-left:1rem;margin-left:0;color:var(--muted);font-style:italic}
img{max-width:100%}
</style>
</head>
<body>
<main>
<p><a href="${baseUrl}/#blog">&larr; Blog</a> &middot; <a href="${baseUrl}/">Saptarshi Samanta</a></p>
<article>
<h1>${e(post.title)}</h1>
<div class="meta"><time datetime="${e(post.date || '')}">${e(fmtDate(post.date))}</time></div>
${bodyHtml}
<p>${(post.tags || []).map(t => `<span class="tag">${e(t)}</span>`).join('')}</p>
</article>
</main>
</body>
</html>
`;
}

module.exports = { renderPostPage };
