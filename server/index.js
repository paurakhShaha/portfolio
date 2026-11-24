import mongoose from 'mongoose'
import { checkConfig, config } from './config.js'
import { createApp } from './app.js'
import { Post } from './models/Post.js'
import { User } from './models/User.js'

checkConfig()
await mongoose.connect(config.mongoUri, { serverSelectionTimeoutMS: 10_000 })
// Wait for the indexes: duplicate-slug handling relies on the unique index existing.
await Promise.all([Post.init(), User.init()])
createApp().listen(config.port, () => {
  console.log(`Blog API on http://localhost:${config.port} (site: ${config.siteUrl})`)
})
