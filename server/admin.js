import { createHash } from 'node:crypto'
import { Router } from 'express'
import mongoose from 'mongoose'
import { Post } from './models/Post.js'
import { requireAdmin } from './auth.js'
import { cleanHtml } from './lib/html.js'
import { slugify, saveWithUniqueSlug } from './lib/slug.js'
import { config } from './config.js'

export const adminRouter = Router()
adminRouter.use(requireAdmin)

const str = (v) => (typeof v === 'string' ? v : '')

/** Whitelist the editable fields that are present in the body (so a partial PUT only touches those). */
export function pickPost(body = {}) {
  const data = {}
  for (const key of ['title', 'excerpt', 'category']) if (key in body) data[key] = str(body[key])
  if ('content' in body) data.content = cleanHtml(str(body.content))
  if ('status' in body) data.status = str(body.status)
  if ('tags' in body) {
    const raw = Array.isArray(body.tags) ? body.tags : str(body.tags).split(',')
    data.tags = [...new Set(raw.map((t) => str(t).trim().toLowerCase()).filter(Boolean))]
  }
  if ('coverImage' in body) {
    const c = body.coverImage ?? {}
    data.coverImage = { url: str(c.url), alt: str(c.alt) }
  }
  if ('seo' in body) {
    const s = body.seo ?? {}
    data.seo = { metaTitle: str(s.metaTitle), metaDescription: str(s.metaDescription), canonicalUrl: str(s.canonicalUrl) }
  }
  return data
}

async function findPost(req, res) {
  const post = mongoose.isValidObjectId(req.params.id) ? await Post.findById(req.params.id) : null
  if (!post) res.status(404).json({ error: 'Post not found' })
  return post
}

adminRouter.get('/stats', async (_req, res) => {
  const [total, published, [views]] = await Promise.all([
    Post.countDocuments(),
    Post.countDocuments({ status: 'published' }),
    Post.aggregate([{ $group: { _id: null, views: { $sum: '$views' } } }]),
  ])
  res.json({ total, published, drafts: total - published, views: views?.views ?? 0 })
})

adminRouter.get('/posts', async (_req, res) => {
  const posts = await Post.find()
    .select('title slug status category views publishedAt updatedAt')
    .sort({ updatedAt: -1 })
  res.json(posts)
})

adminRouter.get('/posts/:id', async (req, res) => {
  const post = await findPost(req, res)
  if (post) res.json(post)
})

adminRouter.post('/posts', async (req, res) => {
  const data = pickPost(req.body)
  const post = new Post(data)
  await saveWithUniqueSlug(post, slugify(str(req.body?.slug) || data.title))
  res.status(201).json(post)
})

adminRouter.put('/posts/:id', async (req, res) => {
  const post = await findPost(req, res)
  if (!post) return
  post.set(pickPost(req.body))
  // An empty slug field keeps the current URL; changing the title never moves a published post.
  const wanted = str(req.body?.slug) ? slugify(req.body.slug) : post.slug
  if (wanted === post.slug) await post.save()
  else await saveWithUniqueSlug(post, wanted)
  res.json(post)
})

adminRouter.delete('/posts/:id', async (req, res) => {
  const post = await findPost(req, res)
  if (!post) return
  await post.deleteOne()
  res.status(204).end()
})

/** Signs a direct browser → Cloudinary upload, so the API secret never leaves the server. */
adminRouter.post('/upload-signature', (_req, res) => {
  const { cloudName, apiKey, apiSecret, folder } = config.cloudinary
  if (!cloudName || !apiKey || !apiSecret) {
    return res.status(503).json({ error: 'Image uploads are not configured (CLOUDINARY_* env vars)' })
  }
  const params = { allowed_formats: 'jpg,jpeg,png,webp,avif,gif', folder, timestamp: Math.floor(Date.now() / 1000) }
  const toSign = Object.entries(params)
    .map(([k, v]) => `${k}=${v}`)
    .join('&')
  const signature = createHash('sha1').update(toSign + apiSecret).digest('hex')
  res.json({ cloudName, apiKey, signature, ...params })
})
