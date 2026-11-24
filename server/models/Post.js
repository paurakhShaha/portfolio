import mongoose from 'mongoose'
import { plainText } from '../lib/html.js'

const httpsUrl = {
  validator: (v) => !v || /^https:\/\/\S+$/i.test(v),
  message: '{PATH} must be an https:// URL',
}

const postSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true, maxlength: 160 },
    slug: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      maxlength: 100,
      match: [/^[a-z0-9]+(?:-[a-z0-9]+)*$/, 'slug may only contain a-z, 0-9 and dashes'],
    },
    excerpt: { type: String, trim: true, maxlength: 300, default: '' },
    /** Sanitized HTML from the TipTap editor. */
    content: { type: String, default: '', maxlength: 500_000 },
    coverImage: {
      url: { type: String, trim: true, default: '', validate: httpsUrl },
      alt: {
        type: String,
        trim: true,
        maxlength: 200,
        default: '',
        validate: {
          validator(v) {
            return !this.get('coverImage.url') || Boolean(v)
          },
          message: 'A cover image needs alt text',
        },
      },
    },
    category: { type: String, trim: true, maxlength: 40, default: '' },
    tags: {
      type: [{ type: String, trim: true, lowercase: true, maxlength: 30 }],
      default: [],
      validate: { validator: (a) => a.length <= 15, message: 'At most 15 tags' },
    },
    status: { type: String, enum: ['draft', 'published'], default: 'draft' },
    seo: {
      metaTitle: { type: String, trim: true, maxlength: 70, default: '' },
      metaDescription: { type: String, trim: true, maxlength: 160, default: '' },
      canonicalUrl: { type: String, trim: true, default: '', validate: httpsUrl },
    },
    views: { type: Number, default: 0, min: 0 },
    /** Minutes, derived from content on save so list pages don't load every body. */
    readingTime: { type: Number, default: 1 },
    publishedAt: { type: Date, default: null },
  },
  { timestamps: true }
)

// slug already has a unique index; this one serves the public list and the sitemap.
postSchema.index({ status: 1, publishedAt: -1 })

postSchema.pre('validate', function () {
  if (this.isModified('content')) {
    const words = plainText(this.content).split(/\s+/).filter(Boolean).length
    this.readingTime = Math.max(1, Math.ceil(words / 200))
  }
  // First publish stamps the date; unpublishing keeps it so a re-publish keeps its place.
  if (this.status === 'published' && !this.publishedAt) this.publishedAt = new Date()
})

export const Post = mongoose.model('Post', postSchema)
