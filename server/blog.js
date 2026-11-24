import { Router } from 'express'
import { Post } from './models/Post.js'
import { config, isProd } from './config.js'
import { blogCss } from './css.js'
import { cleanHtml, esc } from './lib/html.js'
import { articlePage, listPage, messagePage } from './views.js'

export const blogRouter = Router()

const LIST_FIELDS = 'title slug excerpt coverImage category tags readingTime publishedAt'
const published = { status: 'published' }
const param = (v) => (typeof v === 'string' ? v.trim().slice(0, 100) : '')
const escapeRegex = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')

blogRouter.get('/blog/blog.css', async (_req, res) => {
  res
    .type('css')
    .set('Cache-Control', isProd ? 'public, max-age=3600' : 'no-cache')
    .send(await blogCss())
})

blogRouter.get('/blog', async (req, res) => {
  const q = param(req.query.q)
  const category = param(req.query.category)
  const filter = { ...published }
  if (category) filter.category = category
  if (q) {
    const re = new RegExp(escapeRegex(q), 'i')
    filter.$or = [{ title: re }, { excerpt: re }, { tags: re }]
  }
  const [posts, categories] = await Promise.all([
    // shortcut: newest 60 only, add pagination once the blog passes ~60 articles
    Post.find(filter).select(LIST_FIELDS).sort({ publishedAt: -1 }).limit(60).lean(),
    Post.distinct('category', published),
  ])
  res.type('html').send(listPage({ posts, categories: categories.filter(Boolean).sort(), q, category }))
})

blogRouter.get('/blog/:slug', async (req, res) => {
  const post = await Post.findOne({ ...published, slug: req.params.slug.toLowerCase() }).lean()
  if (!post) {
    return res
      .status(404)
      .type('html')
      .send(messagePage({ title: 'Article not found', text: 'It may have been moved or unpublished.' }))
  }
  // Don't wait for the counter, and don't let it bump updatedAt (the sitemap's lastmod).
  Post.updateOne({ _id: post._id }, { $inc: { views: 1 } }, { timestamps: false }).catch((err) =>
    console.error('view count failed', err)
  )

  const related = await Post.find({ ...published, _id: { $ne: post._id }, category: post.category })
    .select(LIST_FIELDS)
    .sort({ publishedAt: -1 })
    .limit(3)
    .lean()
  if (related.length < 3) {
    const more = await Post.find({ ...published, _id: { $nin: [post._id, ...related.map((r) => r._id)] } })
      .select(LIST_FIELDS)
      .sort({ publishedAt: -1 })
      .limit(3 - related.length)
      .lean()
    related.push(...more)
  }
  // Content is sanitized on save too; this also covers anything written to the database directly.
  res.type('html').send(articlePage({ post: { ...post, content: cleanHtml(post.content) }, related }))
})

// Built from the database on every request, so publishing, unpublishing or deleting updates it at once.
blogRouter.get('/sitemap.xml', async (_req, res) => {
  const posts = await Post.find(published).select('slug updatedAt').sort({ publishedAt: -1 }).lean()
  const urls = [
    { loc: `${config.siteUrl}/` },
    { loc: `${config.siteUrl}/blog`, lastmod: posts[0]?.updatedAt },
    ...posts.map((p) => ({ loc: `${config.siteUrl}/blog/${p.slug}`, lastmod: p.updatedAt })),
  ]
  const body = urls
    .map(
      (u) =>
        `  <url><loc>${esc(u.loc)}</loc>${u.lastmod ? `<lastmod>${new Date(u.lastmod).toISOString()}</lastmod>` : ''}</url>`
    )
    .join('\n')
  res
    .type('application/xml')
    .set('Cache-Control', 'no-cache')
    .send(`<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${body}\n</urlset>\n`)
})

blogRouter.get('/robots.txt', (_req, res) => {
  res
    .type('text/plain')
    .send(`User-agent: *\nAllow: /\nDisallow: /admin\nDisallow: /api\n\nSitemap: ${config.siteUrl}/sitemap.xml\n`)
})
