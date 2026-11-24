// All secrets come from the environment (.env locally, the host's settings in production).
export const isProd = process.env.NODE_ENV === 'production'

export const config = {
  port: Number(process.env.PORT) || 8787,
  mongoUri: process.env.MONGODB_URI,
  jwtSecret: process.env.JWT_SECRET,
  /** Public origin of the site (the static host), used for canonical URLs and the sitemap. */
  siteUrl: (process.env.SITE_URL || 'http://localhost:5173').replace(/\/+$/, ''),
  author: process.env.BLOG_AUTHOR || 'Paurakh Shah',
  /** When set, every request must carry it in X-Proxy-Secret (sent by the static host's proxy). */
  proxySecret: process.env.PROXY_SECRET || '',
  trustProxy: Number(process.env.TRUST_PROXY ?? 1),
  cloudinary: {
    cloudName: process.env.CLOUDINARY_CLOUD_NAME || '',
    apiKey: process.env.CLOUDINARY_API_KEY || '',
    apiSecret: process.env.CLOUDINARY_API_SECRET || '',
    folder: process.env.CLOUDINARY_FOLDER || 'blog',
  },
}

export function checkConfig() {
  const missing = ['MONGODB_URI', 'JWT_SECRET'].filter((k) => !process.env[k])
  if (isProd && !process.env.SITE_URL) missing.push('SITE_URL')
  if (missing.length) throw new Error(`Missing environment variables: ${missing.join(', ')}`)
  if (config.jwtSecret.length < 32) throw new Error('JWT_SECRET must be at least 32 characters')
}
