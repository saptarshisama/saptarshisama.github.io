// Parse simple YAML-ish front matter from the top of a file.
// Returns { meta, body } where meta is an object and body is everything
// after the closing --- fence. Returns { meta: null, body: content } if
// no front matter is present.

function parseFrontMatter(content) {
  const match = content.match(/^---\s*\r?\n([\s\S]*?)\r?\n---\s*\r?\n?/);
  if (!match) return { meta: null, body: content };

  const yaml = match[1];
  const body = content.slice(match[0].length);
  const meta = {};

  yaml.split('\n').forEach(rawLine => {
    const line = rawLine.replace(/\r$/, '');
    const keyMatch = line.match(/^(\w+):\s*(.*)$/);
    if (!keyMatch) return;
    const key = keyMatch[1];
    let value = keyMatch[2].trim();

    // Arrays: [a, b, c]
    if (value.startsWith('[') && value.endsWith(']')) {
      value = value
        .slice(1, -1)
        .split(',')
        .map(s => s.trim().replace(/^['"]|['"]$/g, ''))
        .filter(Boolean);
    } else {
      // Quoted scalars: decode JSON-style escapes (\"), else strip the quotes
      if (/^".*"$/.test(value)) {
        try { value = JSON.parse(value); } catch (_) { value = value.slice(1, -1); }
      } else {
        value = value.replace(/^'|'$/g, '');
      }
    }
    meta[key] = value;
  });

  return { meta, body };
}

module.exports = { parseFrontMatter };
