// Token-authenticated publishing API for scripts (scripts/post.mjs), so posts can be written
// in Markdown and sent without the CMS. Deliberately smaller than /api/admin: list, read and
// create-or-update by slug only. No delete and no upload signing, so a leaked token can add
// or edit posts but never remove them.
import { Router } from 'express'
import { rateLimit, ipKeyGenerator } from 'express-rate-limit'
import { marked } from 'marked'
import { Post } from './models/Post.js'
import { pickPost } from './admin.js'
import { slugify } from './lib/slug.js'
import { sameSecret } from './lib/secret.js'
import { config } from './config.js'

const failedTokenLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 10,
  // Only wrong or missing tokens count, so validation errors while drafting can't lock you out.
  requestWasSuccessful: (_req, res) => res.statusCode !== 401,
  skipSuccessfulRequests: true,
  standardHeaders: 'draft-8',
  legacyHeaders: false,
  keyGenerator: (req) => ipKeyGenerator((config.proxySecret && req.get('x-client-ip')) || req.ip),
  message: { error: 'Too many failed attempts. Try again in 15 minutes.' },
})

function requireToken(req, res, next) {
  if (!config.publishToken) {
    return res.status(503).json({ error: 'The publishing API is off (BLOG_API_TOKEN is not set)' })
  }
  const given = (req.get('authorization') || '').match(/^Bearer\s+(\S+)$/i)?.[1]
  if (!sameSecret(given, config.publishToken)) return res.status(401).json({ error: 'Invalid API token' })
  next()
}

/** Markdown → sanitized HTML (via pickPost), plus notes about what the sanitizer will drop. */
export function markdownBody(body = {}) {
  if (typeof body.markdown !== 'string') return { body, warnings: [] }
  const md = body.markdown
  const warnings = []
  if (/!\[[^\]]*\]\([^)]*\)|<img\b/i.test(md)) {
    warnings.push('Images inside the article are not supported and were removed (use a cover image instead).')
  }
  if (/^\s*\|?\s*:?-{3,}:?\s*\|/m.test(md)) {
    warnings.push('Tables are not supported; their text was kept without the table layout.')
  }
  const { markdown: _md, ...rest } = body
  return { body: { ...rest, content: marked.parse(md, { gfm: true, async: false }) }, warnings }
}

const summary = (post) => ({
  id: post.id,
  slug: post.slug,
  title: post.title,
  status: post.status,
  url: `${config.siteUrl}/blog/${post.slug}`,
  publishedAt: post.publishedAt,
  updatedAt: post.updatedAt,
})

export const publishRouter = Router()
publishRouter.use(failedTokenLimiter, requireToken)

publishRouter.get('/posts', async (_req, res) => {
  const posts = await Post.find().select('title slug status publishedAt updatedAt').sort({ updatedAt: -1 })
  res.json(posts.map(summary))
})

publishRouter.get('/posts/:slug', async (req, res) => {
  const post = await Post.findOne({ slug: slugify(req.params.slug) })
  if (!post) return res.status(404).json({ error: 'Post not found' })
  res.json(post)
})

/**
 * Create or update the post at this slug, so re-sending a file edits it instead of making
 * `my-post-2`. Fields left out are untouched; a new post is a draft unless status says otherwise.
 */
publishRouter.put('/posts/:slug', async (req, res) => {
  const slug = slugify(req.params.slug)
  const { body, warnings } = markdownBody(req.body ?? {})
  const data = pickPost(body)
  let post = await Post.findOne({ slug })
  const created = !post
  if (!post) post = new Post({ slug })
  post.set(data)
  await post.save()
  res.status(created ? 201 : 200).json({ created, ...summary(post), warnings })
})
