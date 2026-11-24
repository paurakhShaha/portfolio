# Blog + CMS

The portfolio stays a static Vite site. A small Express server (`server/`) adds:

| Path | What | Rendered by |
|---|---|---|
| `/blog`, `/blog/:slug` | Public blog: list (search `?q=`, filter `?category=`) and articles | Express, on every request (full HTML, no client JS) |
| `/sitemap.xml` | Built from published posts on every request | Express |
| `/robots.txt` | Allows everything except `/admin` and `/api`; points to the sitemap | The Worker in production (so it works while the API sleeps), Express locally |
| `/api/auth/*`, `/api/admin/*` | Login and the CMS API | Express |
| `/api/publish/*` | Token-authenticated publishing from scripts (`npm run post`) | Express |
| `/admin/` | CMS (dashboard + TipTap editor) | Static Vite page (`admin/index.html`) |

In production the site's Cloudflare Worker (`worker/index.js`, config in `wrangler.jsonc`)
serves `dist/` and forwards the Express paths to the API server, so everything is on
`paurakhshah.com.np` and the login cookie is first-party.

```
browser ──► Cloudflare Worker "portfolio" (paurakhshah.com.np)
             ├─ /, /admin/, /assets/*      static files from dist/
             ├─ /robots.txt                answered by the Worker
             └─ /blog*, /api/*, /sitemap.xml, /robots.txt
                    └─► Express API (Render / Railway / Fly) ──► MongoDB Atlas
                                                    admin browser ──► Cloudinary (signed upload)
```

## Code map

```
server/
  index.js          start: check env, connect MongoDB, listen
  app.js            Express app: proxy-secret check, security headers, routes, errors
  config.js         environment variables
  auth.js           login / logout / me, requireAdmin, login rate limit
  admin.js          posts CRUD, stats, Cloudinary upload signature
  publish.js        /api/publish: bearer-token list/read/upsert, Markdown input
  blog.js           /blog pages, sitemap.xml, robots.txt, /blog/blog.css
  views.js          HTML templates (meta tags, Open Graph, Twitter, JSON-LD)
  css.js            builds blog.css from the portfolio's Tailwind config
  models/Post.js, models/User.js
  lib/html.js       escaping, sanitizing, image URLs
  lib/slug.js       slugify + duplicate-safe save
  lib/secret.js     constant-time secret compare
  scripts/create-admin.js
scripts/post.mjs    sends a Markdown file to /api/publish (npm run post)
  test/server.test.js
admin/index.html    CMS entry (noindex)
src/admin/          CMS React app (main.tsx, Dashboard.tsx, PostEditor.tsx, api.ts)
src/prose.css       article styles shared by the blog and the editor
worker/index.js, wrangler.jsonc   Cloudflare Worker: static site + proxy (test: server/test/worker.test.js)
```

## 1. MongoDB Atlas

1. Create a free cluster at <https://cloud.mongodb.com>.
2. **Database Access** → add a database user with *Read and write to any database*
   (or scope it to the `portfolio` database). Use a generated password.
3. **Network Access** → allow your IP for local development. For the deployed API, allow
   the host's outbound IPs (Render/Railway list them), or `0.0.0.0/0` if the host has none
   (the database password is then the only guard, so keep it long).
4. **Connect → Drivers** → copy the `mongodb+srv://…` string, put the database name in the
   path (`…mongodb.net/portfolio?…`) and set it as `MONGODB_URI`.

Collections (`posts`, `users`) and indexes (`slug` unique, `status + publishedAt`,
`username` unique) are created by Mongoose on first start.

## 2. Cloudinary

Dashboard → **API Keys**: copy cloud name, API key and API secret into the `CLOUDINARY_*`
variables. Nothing else to configure: the server signs each upload (images only, into
`CLOUDINARY_FOLDER`), and the browser sends the file straight to Cloudinary. The secret
never leaves the server.

## 3. Local setup

```bash
npm install
cp .env.example .env        # then fill in MONGODB_URI, JWT_SECRET, CLOUDINARY_*
npm run create-admin -- yourname   # asks for a password (min 12 chars), hidden
```

Run the API and the site in two terminals:

```bash
npm run dev:api   # Express on :8787 (restarts on file changes)
npm run dev       # Vite on :5173, proxies /blog, /api, /sitemap.xml, /robots.txt to :8787
```

- Blog: <http://localhost:5173/blog>
- CMS: <http://localhost:5173/admin/>

`npm test` runs the server tests (no database needed).

## 4. Environment variables

| Variable | Where | Required | Notes |
|---|---|---|---|
| `MONGODB_URI` | API | yes | Atlas connection string |
| `JWT_SECRET` | API | yes | ≥ 32 random characters; changing it signs everyone out |
| `SITE_URL` | API | yes in production | `https://paurakhshah.com.np`. Used for canonical URLs, Open Graph and the sitemap |
| `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET` | API | for uploads | Without them the upload button reports "not configured" |
| `CLOUDINARY_FOLDER` | API | no | Default `blog` |
| `NODE_ENV=production` | API | yes in production | Makes the login cookie `Secure` |
| `PROXY_SECRET` | API **and** Worker secret | recommended | Same random value on both; the API then refuses requests that don't come through the Worker |
| `TRUST_PROXY` | API | no | Default `1` (one load balancer in front, as on Render/Railway/Fly) |
| `BLOG_AUTHOR` | API | no | Default `Paurakh Shah` (author in meta tags and JSON-LD) |
| `BLOG_API_TOKEN` | API **and** your `.env` | for `npm run post` | ≥ 32 random characters, same value in both. Unset → `/api/publish` answers 503 |
| `BLOG_API_URL` | your `.env` | no | Where `npm run post` sends posts. Default `http://localhost:8787`; production: `https://paurakhshah.com.np` |
| `PORT` | API | no | Default `8787`; most hosts set it |
| `API_ORIGIN` | Worker (`wrangler.jsonc` → `vars`) | yes | URL of the deployed API, e.g. `https://portfolio-api.onrender.com`. Empty → `/blog` answers 503 |

## 5. Deploy

### API (Render shown; Railway/Fly are the same idea)

1. New **Web Service** from this GitHub repo.
2. Build command: `npm ci`. Start command: `npm start`. Node 22.9 or newer.
3. Environment: `NODE_ENV=production`, `MONGODB_URI`, `JWT_SECRET`, `SITE_URL`,
   `CLOUDINARY_*`, `PROXY_SECRET`, and `BLOG_API_TOKEN` if you publish with `npm run post`.
4. Deploy, then create the admin once from your machine (it only needs the database):
   `npm run create-admin -- yourname` with the production `MONGODB_URI` in `.env`.

`tailwindcss`, `postcss` and `autoprefixer` are regular dependencies because the API builds
`/blog/blog.css` from the portfolio's Tailwind config when it starts.

### Site (Cloudflare Worker `portfolio`, deployed from your PC)

1. Put the API URL in `wrangler.jsonc` → `vars.API_ORIGIN` (no trailing slash).
2. Once: `npx wrangler login`, then `npx wrangler secret put PROXY_SECRET` and paste the same
   value you gave the API. Secrets survive later deploys.
3. Every deploy: `npm run deploy` (builds `dist/`, then `wrangler deploy`).

`wrangler.jsonc` keeps the current setup: SPA fallback for unknown paths, custom domain
`paurakhshah.com.np`. `assets.run_worker_first` limits the Worker to `/api/*`, `/blog`,
`/blog/*`, `/sitemap.xml` and `/robots.txt`; every other request is a plain static file.
Check a config change without deploying: `npx wrangler deploy --dry-run`.

### After the first deploy

- Open `https://<site>/robots.txt` and `/sitemap.xml` and check they show your domain.
- Submit the sitemap in Google Search Console.
- Test an article with the Rich Results Test (Article structured data) and a social card
  preview (Open Graph / Twitter).

## Publishing from a file or from chat (`npm run post`)

`/api/publish` lets a script create and update posts with a bearer token instead of the CMS
login, so Claude Code (or you) can write a post in Markdown and send it with one command.

```bash
npm run post -- post.md               # create a new draft (refuses if the slug is taken)
npm run post -- post.md --update      # create or overwrite the post at that slug (a live post stays live)
npm run post -- post.md --publish     # ...and publish it (combine with --update to edit a live post)
npm run post -- post.md --draft       # ...and unpublish it
npm run post -- --list                # list posts (status, slug, title)
npm run post -- post.md --to http://localhost:8787   # pick the server for one run
```

The file is Markdown with optional front matter:

```markdown
---
slug: my-post
excerpt: One-line summary
category: Code
tags: react, gsap
cover: https://res.cloudinary.com/<cloud>/image/upload/v1/blog/cover.jpg
coverAlt: What the image shows
metaTitle: My post
metaDescription: What the post is about, in one sentence.
canonicalUrl: https://example.com/original
---
# My post title

Body in Markdown...
```

Every key is optional. Values run to the end of the line (no `#` comments). `slug` defaults
to the file name; the same slug always means the same post, so an existing slug needs
`--update`. The title comes from `title:` or a leading `# Heading`. `cover` must be `https://`
and needs `coverAlt`.

The body goes through the same sanitizer as the editor: headings (h1 becomes h2), bold,
italic, strikethrough, links, lists, quotes, code, rules. Images and tables inside the body
are dropped, and the command prints a warning when that happens.

API (all routes need `Authorization: Bearer $BLOG_API_TOKEN`):

| Route | Does |
|---|---|
| `GET /api/publish/posts` | list: id, slug, title, status, url, dates |
| `GET /api/publish/posts/:slug` | one post with its HTML content |
| `PUT /api/publish/posts/:slug` | create (201) or update (200) the post at that slug. Body: the CMS fields (`title`, `excerpt`, `category`, `tags`, `status`, `coverImage`, `seo`) plus `markdown` or `content` (HTML). Fields left out stay as they are; new posts are drafts unless `status: "published"` |

Setup: add `BLOG_API_TOKEN` to `.env` (generate as for `JWT_SECRET`), put the same value in
the API host's environment, and set `BLOG_API_URL=https://paurakhshah.com.np` in `.env` to
send posts to the live site. Use the site's domain, not the Render URL: with `PROXY_SECRET`
set, the API refuses requests that don't come through the Worker.

## Security notes

- Passwords: bcrypt (bcryptjs), cost 12. Admins are created only with the CLI script.
- Session: JWT (HS256, 12 h) in an `httpOnly`, `SameSite=Strict` cookie, `Secure` in
  production. `SameSite=Strict` plus the same-origin API covers CSRF.
- Login: 5 failed attempts per IP per 15 minutes; the same error message for wrong username
  and wrong password.
- Every `/api/admin/*` route checks the cookie and that the user still exists with role `admin`.
- `/api/publish/*` checks the bearer token (constant-time compare; off when unset; 10 wrong-token
  attempts per IP per 15 minutes). It can list, read, create and edit posts, but has no delete
  and no upload signing, and the token does not open `/api/admin`. Rotate it by changing the
  value in both places.
- Input: only known fields are read; Mongoose validates types, lengths, enums, `https://`
  URLs and alt text for cover images.
- Rich text: sanitized with `sanitize-html` on save and again when rendered (only the tags the
  editor produces; `javascript:` links and event handlers removed). Everything else in the
  templates is HTML-escaped, and JSON-LD escapes `<`.
- Secrets live only in the API's environment. The admin bundle contains no keys; Cloudinary
  uploads use a short-lived server signature.

## Known limits

- The blog list shows the newest 60 posts (no pagination yet).
- Views count every article request, including bots.
- Images inside article bodies aren't supported (featured image only).
