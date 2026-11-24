// Server-rendered blog pages: full content and metadata without client JavaScript.
// Every interpolated value goes through esc(); only the sanitized article body is inserted raw.
// Tailwind classes here are compiled by server/css.js, so keep them as literal strings.
import { config } from './config.js'
import { esc, formatDate, imageUrl, jsonLd, plainText } from './lib/html.js'

const FONTS =
  'https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:wght@400;500&family=Instrument+Serif:ital@0;1&family=Space+Grotesk:wght@400;500;600;700&display=swap'
const label = 'font-mono text-[11px] tracking-[0.15em] uppercase text-muted'

function layout({ title, description, canonical, robots, ogType = 'website', image, imageAlt, head = '', body, current }) {
  const meta = (attr, key, value) => (value ? `<meta ${attr}="${key}" content="${esc(value)}">` : '')
  const navLink = (href, text) =>
    `<a href="${href}" class="hover:text-cobalt transition-colors"${current === href ? ' aria-current="page"' : ''}>${text}</a>`
  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${esc(title)}</title>
${meta('name', 'description', description)}
${canonical ? `<link rel="canonical" href="${esc(canonical)}">` : ''}
${meta('name', 'robots', robots)}
${meta('property', 'og:site_name', config.author)}
${meta('property', 'og:type', ogType)}
${meta('property', 'og:title', title)}
${meta('property', 'og:description', description)}
${meta('property', 'og:url', canonical)}
${meta('property', 'og:image', image)}
${meta('property', 'og:image:alt', image && imageAlt)}
${meta('name', 'twitter:card', image ? 'summary_large_image' : 'summary')}
${meta('name', 'twitter:title', title)}
${meta('name', 'twitter:description', description)}
${meta('name', 'twitter:image', image)}
${meta('name', 'twitter:image:alt', image && imageAlt)}
${head}
<link rel="icon" type="image/svg+xml" href="/favicon.svg">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="${FONTS}">
<link rel="stylesheet" href="/blog/blog.css">
</head>
<body class="min-h-screen flex flex-col bg-paper text-ink font-display antialiased">
<a href="#main" class="sr-only focus:not-sr-only focus:fixed focus:top-3 focus:left-3 focus:z-50 focus:bg-ink focus:text-paper focus:px-4 focus:py-2">Skip to content</a>
<header class="border-b border-ink/10">
  <div class="max-w-6xl mx-auto px-6 md:px-12 h-16 flex items-center justify-between gap-6">
    <a href="/" class="font-display text-lg tracking-tight">${esc(config.author)}</a>
    <nav aria-label="Primary" class="flex gap-6 font-mono text-[11px] tracking-[0.15em] uppercase">
      ${navLink('/', 'Work')}
      ${navLink('/blog', 'Blog')}
    </nav>
  </div>
</header>
<main id="main" class="flex-1">
${body}
</main>
<footer class="mt-24 border-t border-ink/10 py-10 px-6 md:px-12">
  <div class="max-w-6xl mx-auto flex flex-col md:flex-row md:items-center justify-between gap-4">
    <p class="font-display text-lg tracking-tight">${esc(config.author)}</p>
    <p class="font-mono text-[11px] tracking-[0.15em] text-muted">© ${new Date().getFullYear()} — A WORLD IN PROGRESS</p>
  </div>
</footer>
</body>
</html>`
}

const postUrl = (slug) => `/blog/${encodeURIComponent(slug)}`
const categoryUrl = (c) => `/blog?category=${encodeURIComponent(c)}`

function postMeta(post) {
  const parts = []
  if (post.category) parts.push(esc(post.category))
  if (post.publishedAt) {
    parts.push(`<time datetime="${new Date(post.publishedAt).toISOString()}">${formatDate(post.publishedAt)}</time>`)
  }
  parts.push(`${post.readingTime || 1} min read`)
  return parts.join(' <span aria-hidden="true">·</span> ')
}

function card(post, Heading = 'h2') {
  const cover = post.coverImage?.url
    ? `<img src="${esc(imageUrl(post.coverImage.url, 800))}" alt="${esc(post.coverImage.alt)}" width="800" height="500" loading="lazy" decoding="async" class="w-full h-full object-cover transition-transform duration-500 group-hover:scale-[1.03]">`
    : `<span aria-hidden="true" class="w-full h-full flex items-end p-5 font-display font-bold text-7xl leading-none tracking-tighter text-ink/10">${esc((post.category || post.title).slice(0, 2))}</span>`
  return `<li>
  <article class="group">
    <a href="${postUrl(post.slug)}" class="block">
      <div class="aspect-[16/10] overflow-hidden border border-ink/10 bg-ink/[0.04]">${cover}</div>
      <p class="mt-5 ${label}">${postMeta(post)}</p>
      <${Heading} class="mt-3 font-display text-2xl leading-tight tracking-tight group-hover:text-cobalt transition-colors">${esc(post.title)}</${Heading}>
      ${post.excerpt ? `<p class="mt-3 text-[15px] leading-relaxed text-ink/70">${esc(post.excerpt)}</p>` : ''}
    </a>
  </article>
</li>`
}

const grid = (posts, heading) =>
  `<ul class="mt-12 grid gap-x-8 gap-y-14 md:grid-cols-2 lg:grid-cols-3">${posts.map((p) => card(p, heading)).join('')}</ul>`

export function listPage({ posts, categories, q, category }) {
  const chip = (href, text, active) =>
    `<a href="${href}" class="px-3 py-1.5 border font-mono text-[11px] tracking-[0.12em] uppercase transition-colors ${
      active ? 'bg-ink text-paper border-ink' : 'border-ink/15 hover:border-ink'
    }"${active ? ' aria-current="page"' : ''}>${esc(text)}</a>`
  const filtered = Boolean(q || category)

  let results
  if (posts.length) results = grid(posts, 'h2')
  else if (filtered) {
    results = `<div class="mt-16 border border-dashed border-ink/20 p-10 text-center">
      <p class="font-display text-2xl tracking-tight">Nothing matches${q ? ` “${esc(q)}”` : ''}${category ? ` in ${esc(category)}` : ''}.</p>
      <p class="mt-4"><a href="/blog" class="font-mono text-[11px] tracking-[0.15em] uppercase text-cobalt hover:text-ink">Clear filters</a></p>
    </div>`
  } else {
    results = `<div class="mt-16 border border-dashed border-ink/20 p-10 text-center">
      <p class="font-display text-2xl tracking-tight">No articles yet.</p>
      <p class="mt-3 font-serif text-xl text-ink/60">The first one is being written.</p>
    </div>`
  }

  const title = category ? `${category} — Blog — ${config.author}` : `Blog — ${config.author}`
  return layout({
    title,
    description: `Articles by ${config.author} on code, design and building for the web.`,
    canonical: `${config.siteUrl}/blog${category ? `?category=${encodeURIComponent(category)}` : ''}`,
    // Search result pages are thin duplicates of the list; keep them out of the index.
    robots: q ? 'noindex, follow' : '',
    current: '/blog',
    body: `<section class="max-w-6xl mx-auto px-6 md:px-12 pt-16 md:pt-24" aria-labelledby="blog-title">
  <p class="font-mono text-[11px] tracking-[0.24em] uppercase text-muted mb-6">Journal</p>
  <h1 id="blog-title" class="font-display font-medium text-[clamp(3rem,8vw,7rem)] leading-[0.92] tracking-tighter">Writing.</h1>
  <p class="mt-6 max-w-lg font-serif text-xl leading-relaxed text-ink/60">Notes on code, design and the things I build.</p>

  <div class="mt-12 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
    ${
      categories.length
        ? `<nav aria-label="Categories" class="flex flex-wrap gap-2">${chip('/blog', 'All', !category)}${categories
            .map((c) => chip(categoryUrl(c), c, c === category))
            .join('')}</nav>`
        : '<span></span>'
    }
    <form role="search" action="/blog" method="get" class="flex w-full lg:w-80">
      ${category ? `<input type="hidden" name="category" value="${esc(category)}">` : ''}
      <label for="blog-search" class="sr-only">Search articles</label>
      <input id="blog-search" type="search" name="q" value="${esc(q)}" placeholder="Search articles" maxlength="100" class="flex-1 min-w-0 bg-transparent border border-ink/20 px-4 py-2.5 text-[15px] placeholder:text-muted focus:outline-none focus:border-ink">
      <button type="submit" class="px-4 bg-ink text-paper font-mono text-[11px] tracking-[0.12em] uppercase hover:bg-cobalt transition-colors">Search</button>
    </form>
  </div>
  ${filtered && posts.length ? `<p class="mt-8 ${label}">${posts.length} result${posts.length === 1 ? '' : 's'}${q ? ` for “${esc(q)}”` : ''} · <a href="/blog" class="text-cobalt hover:text-ink">Clear</a></p>` : ''}
  ${results}
</section>`,
  })
}

export function articlePage({ post, related }) {
  const canonical = post.seo?.canonicalUrl || `${config.siteUrl}${postUrl(post.slug)}`
  const description = post.seo?.metaDescription || post.excerpt || plainText(post.content).slice(0, 155)
  const image = post.coverImage?.url ? imageUrl(post.coverImage.url, 1200) : ''
  const published = new Date(post.publishedAt).toISOString()
  const modified = new Date(post.updatedAt).toISOString()

  const structured = {
    '@context': 'https://schema.org',
    '@type': 'BlogPosting',
    headline: post.title,
    description,
    ...(image && { image: [image] }),
    datePublished: published,
    dateModified: modified,
    author: { '@type': 'Person', name: config.author, url: `${config.siteUrl}/` },
    publisher: { '@type': 'Person', name: config.author, url: `${config.siteUrl}/` },
    mainEntityOfPage: { '@type': 'WebPage', '@id': canonical },
    url: canonical,
    ...(post.category && { articleSection: post.category }),
    ...(post.tags?.length && { keywords: post.tags.join(', ') }),
  }
  const head = [
    `<meta property="article:published_time" content="${published}">`,
    `<meta property="article:modified_time" content="${modified}">`,
    post.category ? `<meta property="article:section" content="${esc(post.category)}">` : '',
    ...(post.tags ?? []).map((t) => `<meta property="article:tag" content="${esc(t)}">`),
    `<script type="application/ld+json">${jsonLd(structured)}</script>`,
  ].join('\n')

  return layout({
    title: `${post.seo?.metaTitle || post.title} — ${config.author}`,
    description,
    canonical,
    ogType: 'article',
    image,
    imageAlt: post.coverImage?.alt,
    head,
    current: '/blog',
    body: `<article class="px-6 md:px-12 pt-12 md:pt-20">
  <nav aria-label="Breadcrumb" class="max-w-3xl mx-auto ${label}"><a href="/blog" class="hover:text-cobalt transition-colors">← All articles</a></nav>
  <header class="max-w-3xl mx-auto mt-10">
    <p class="${label}">${post.category ? `<a href="${categoryUrl(post.category)}" class="hover:text-cobalt">${esc(post.category)}</a> <span aria-hidden="true">·</span> ` : ''}<time datetime="${published}">${formatDate(post.publishedAt)}</time> <span aria-hidden="true">·</span> ${post.readingTime || 1} min read</p>
    <h1 class="mt-6 font-display font-medium text-[clamp(2.5rem,6vw,5rem)] leading-[0.95] tracking-tighter">${esc(post.title)}</h1>
    ${post.excerpt ? `<p class="mt-6 font-serif text-2xl leading-snug text-ink/70">${esc(post.excerpt)}</p>` : ''}
  </header>
  ${
    post.coverImage?.url
      ? `<figure class="max-w-5xl mx-auto mt-12"><img src="${esc(imageUrl(post.coverImage.url, 1600))}" alt="${esc(post.coverImage.alt)}" width="1600" height="900" fetchpriority="high" class="w-full aspect-[16/9] object-cover border border-ink/10"></figure>`
      : ''
  }
  <div class="prose-blog max-w-2xl mx-auto mt-12 md:mt-16">${post.content}</div>
  ${
    post.tags?.length
      ? `<footer class="max-w-2xl mx-auto mt-16 pt-8 border-t border-ink/10"><h2 class="sr-only">Tags</h2><ul class="flex flex-wrap gap-2">${post.tags
          .map((t) => `<li class="px-2.5 py-1 border border-ink/15 font-mono text-[11px] text-ink/70">#${esc(t)}</li>`)
          .join('')}</ul></footer>`
      : ''
  }
</article>
${
  related.length
    ? `<aside aria-labelledby="related-title" class="max-w-6xl mx-auto px-6 md:px-12 mt-24">
  <h2 id="related-title" class="font-mono text-[11px] tracking-[0.24em] uppercase text-muted">Keep reading</h2>
  ${grid(related, 'h3')}
</aside>`
    : ''
}`,
  })
}

export function messagePage({ title, text }) {
  return layout({
    title: `${title} — ${config.author}`,
    description: text,
    robots: 'noindex',
    body: `<section class="max-w-3xl mx-auto px-6 md:px-12 pt-24">
  <h1 class="font-display font-medium text-[clamp(2.5rem,6vw,4.5rem)] leading-[0.95] tracking-tighter">${esc(title)}</h1>
  <p class="mt-6 font-serif text-xl text-ink/60">${esc(text)}</p>
  <p class="mt-10"><a href="/blog" class="inline-flex px-5 py-3 bg-ink text-paper font-mono text-[11px] tracking-[0.14em] uppercase hover:bg-cobalt transition-colors">Back to the blog</a></p>
</section>`,
  })
}
