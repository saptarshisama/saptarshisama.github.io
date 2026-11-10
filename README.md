# saptarshisama.github.io

Personal portfolio + blog. A single static `index.html` (no framework, no
runtime dependencies) served by GitHub Pages. Content lives in JSON/Markdown
files and is rendered client-side.

## Writing a blog post (Markdown)

You write posts in plain **Markdown** — no HTML needed.

1. Copy the template: `blog/drafts/_template.md` → `blog/drafts/my-post.md`
   (use hyphens, no spaces; the file name becomes the URL slug).
2. Edit the front matter between the `---` lines:
   - `id`: unique number (next available)
   - `title`: post title
   - `date`: `YYYY-MM-DD`
   - `tags`: `["tag1", "tag2"]`
   - `excerpt`: one-line summary shown in the blog list
3. Write your post body in Markdown below the front matter.
4. Run the build:
   ```bash
   npm run build
   ```
   This converts your draft to `blog/posts/my-post.html`, regenerates
   `blog/index.json`, writes a standalone crawlable page at
   `blog/my-post.html`, and updates `sitemap.xml`.
5. Commit and push. The post appears automatically.

### Supported Markdown

Headings (`#`–`######`), **bold**, _italic_, `inline code`, links
`[text](url)`, images `![alt](src)`, bullet/numbered lists, `>` blockquotes,
fenced code blocks (```` ``` ````), and `---` rules. Raw HTML also passes
through if you ever need it.

> Existing posts authored directly as HTML in `blog/posts/*.html` still work —
> the build picks them up too. New posts should be written as Markdown drafts.

## Infoperhour (curated links)

The Infoperhour section is a curated link list stored in `data/websites.json`.

```json
{
  "websites": [
    { "url": "https://example.com/", "name": "Example", "category": "Tech" }
  ]
}
```

Each entry needs `url`, `name`, and `category`. Categories become filter
buttons automatically. Search filters by name or URL. Favicons load lazily as
you scroll.

## Features

- **Hash routing** between About / Projects / Experience / Infoperhour / Blog / Contact
- **Live search + category filters** on Infoperhour
- **Markdown blog pipeline** with a zero-dependency build step
- **Automatic dark mode** via `prefers-color-scheme`
- **Responsive** desktop sidebar + mobile menu
- **Reduced-motion aware** and keyboard-accessible

## Local development

```bash
# Node (recommended)
npm install -g http-server
http-server -p 8000

# or Python
python -m http.server 8000
```

Then open http://localhost:8000

## Deployment

Push to the repository; GitHub Pages serves it. 100% static, no backend.
Remember to run `npm run build` before committing if you added/edited posts.
