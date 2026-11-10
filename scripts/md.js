// Tiny, dependency-free Markdown -> HTML converter.
// Supports: ATX headings, **bold**, *italic*, `code`, links, images,
// fenced code blocks (```), blockquotes, ordered/unordered lists, --- rules,
// and paragraphs. Output is intentionally minimal and clean so it inherits
// the site's typography. HTML in the source is passed through as-is.

function escapeHtml(s) {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

// Bold / italic. Underscore forms only apply at word boundaries so that
// snake_case_identifiers are left alone.
function emphasis(text) {
  text = text.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
  text = text.replace(/(^|[^\w])__([^_]+)__(?!\w)/g, '$1<strong>$2</strong>');
  text = text.replace(/(^|[^*])\*([^*\n]+)\*/g, '$1<em>$2</em>');
  text = text.replace(/(^|[^\w_])_([^_\n]+)_(?!\w)/g, '$1<em>$2</em>');
  return text;
}

// Inline formatting applied to a single line of text.
// Code spans, images and links are swapped for placeholders first so that
// emphasis markers inside URLs / code (e.g. foo_bar_baz) are never touched.
function inline(text) {
  const stash = [];
  const hold = (html) => `\u0000${stash.push(html) - 1}\u0000`;

  // Inline code: `code`
  text = text.replace(/`([^`]+)`/g, (_, code) => hold(`<code>${escapeHtml(code)}</code>`));
  // Images: ![alt](src)
  text = text.replace(/!\[([^\]]*)\]\(([^)\s]+)(?:\s+"([^"]*)")?\)/g,
    (_, alt, src, title) =>
      hold(`<img src="${src}" alt="${alt}"${title ? ` title="${title}"` : ''} loading="lazy">`));
  // Links: [text](href) — the label may itself contain emphasis
  text = text.replace(/\[([^\]]+)\]\(([^)\s]+)(?:\s+"([^"]*)")?\)/g,
    (_, label, href, title) => {
      const ext = /^https?:\/\//.test(href);
      const attrs = ext ? ' target="_blank" rel="noopener"' : '';
      return hold(`<a href="${href}"${title ? ` title="${title}"` : ''}${attrs}>${emphasis(label)}</a>`);
    });

  text = emphasis(text);
  return text.replace(/\u0000(\d+)\u0000/g, (_, i) => stash[+i]);
}

function mdToHtml(md) {
  const lines = md.replace(/\r\n/g, '\n').split('\n');
  const out = [];
  let i = 0;

  const flushParagraph = (buf) => {
    if (buf.length) out.push(`<p>${inline(buf.join(' ').trim())}</p>`);
    buf.length = 0;
  };

  const paragraph = [];

  while (i < lines.length) {
    let line = lines[i];

    // Fenced code block
    const fence = line.match(/^```(\w*)\s*$/);
    if (fence) {
      flushParagraph(paragraph);
      const lang = fence[1];
      const code = [];
      i++;
      while (i < lines.length && !/^```\s*$/.test(lines[i])) { code.push(lines[i]); i++; }
      i++; // skip closing fence
      const cls = lang ? ` class="language-${lang}"` : '';
      out.push(`<pre><code${cls}>${escapeHtml(code.join('\n'))}</code></pre>`);
      continue;
    }

    // Blank line -> paragraph break
    if (/^\s*$/.test(line)) { flushParagraph(paragraph); i++; continue; }

    // Horizontal rule
    if (/^(\s*[-*_]){3,}\s*$/.test(line) && !/[a-zA-Z]/.test(line)) {
      flushParagraph(paragraph); out.push('<hr>'); i++; continue;
    }

    // Headings
    const h = line.match(/^(#{1,6})\s+(.*)$/);
    if (h) {
      flushParagraph(paragraph);
      const level = h[1].length;
      out.push(`<h${level}>${inline(h[2].trim())}</h${level}>`);
      i++; continue;
    }

    // Blockquote (consume consecutive > lines)
    if (/^\s*>\s?/.test(line)) {
      flushParagraph(paragraph);
      const quote = [];
      while (i < lines.length && /^\s*>\s?/.test(lines[i])) {
        quote.push(lines[i].replace(/^\s*>\s?/, '')); i++;
      }
      out.push(`<blockquote>${mdToHtml(quote.join('\n'))}</blockquote>`);
      continue;
    }

    // Lists (unordered or ordered) — consume the whole block
    if (/^\s*([-*+]|\d+\.)\s+/.test(line)) {
      flushParagraph(paragraph);
      const ordered = /^\s*\d+\.\s+/.test(line);
      const items = [];
      while (i < lines.length && /^\s*([-*+]|\d+\.)\s+/.test(lines[i])) {
        items.push(lines[i].replace(/^\s*([-*+]|\d+\.)\s+/, '')); i++;
      }
      const tag = ordered ? 'ol' : 'ul';
      out.push(`<${tag}>${items.map(it => `<li>${inline(it.trim())}</li>`).join('')}</${tag}>`);
      continue;
    }

    // Raw HTML block (line starts with a tag) — pass through verbatim
    if (/^\s*<\/?[a-zA-Z]/.test(line)) {
      flushParagraph(paragraph);
      out.push(line);
      i++; continue;
    }

    // Default: accumulate into a paragraph
    paragraph.push(line);
    i++;
  }
  flushParagraph(paragraph);

  return out.join('\n');
}

module.exports = { mdToHtml, escapeHtml };
