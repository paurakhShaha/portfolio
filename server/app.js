import express from 'express'
import mongoose from 'mongoose'
import { config } from './config.js'
import { authRouter } from './auth.js'
import { adminRouter } from './admin.js'
import { blogRouter } from './blog.js'
import { publishRouter } from './publish.js'
import { sameSecret } from './lib/secret.js'
import { messagePage } from './views.js'

export function createApp() {
  const app = express()
  app.disable('x-powered-by')
  app.set('trust proxy', config.trustProxy)

  // Only the static host's proxy knows the secret, so the API can't be reached around it.
  if (config.proxySecret) {
    app.use((req, res, next) =>
      sameSecret(req.get('x-proxy-secret') ?? '', config.proxySecret) ? next() : res.status(403).end()
    )
  }

  app.use((_req, res, next) => {
    res.set({
      'X-Content-Type-Options': 'nosniff',
      'Referrer-Policy': 'strict-origin-when-cross-origin',
      'X-Frame-Options': 'DENY',
    })
    next()
  })

  app.use('/api', express.json({ limit: '1mb' }), (_req, res, next) => {
    res.set('Cache-Control', 'no-store')
    next()
  })
  app.use('/api/auth', authRouter)
  app.use('/api/admin', adminRouter)
  app.use('/api/publish', publishRouter)
  app.use('/api', (_req, res) => res.status(404).json({ error: 'Not found' }))
  app.use(blogRouter)

  app.use((err, req, res, _next) => {
    let status = err.status || err.statusCode || 500
    let body = { error: status < 500 ? err.message : 'Something went wrong' }
    if (err instanceof mongoose.Error.ValidationError) {
      status = 400
      body = {
        error: 'Please fix the highlighted fields',
        fields: Object.fromEntries(Object.entries(err.errors).map(([path, e]) => [path, e.message])),
      }
    } else if (err instanceof mongoose.Error.CastError) {
      status = 400
      body = { error: `Invalid value for ${err.path}` }
    }
    if (status >= 500) console.error(err)
    if (req.path.startsWith('/api')) return res.status(status).json(body)
    res
      .status(status >= 500 ? 503 : status)
      .type('html')
      .send(messagePage({ title: 'The blog is unavailable', text: 'Something went wrong on our side. Please try again in a minute.' }))
  })

  return app
}
