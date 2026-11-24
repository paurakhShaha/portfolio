import { Router } from 'express'
import { rateLimit, ipKeyGenerator } from 'express-rate-limit'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import { User } from './models/User.js'
import { config, isProd } from './config.js'

const COOKIE = 'cms_token'
const SESSION_MS = 12 * 60 * 60 * 1000
const cookieOptions = { httpOnly: true, secure: isProd, sameSite: 'strict', path: '/' }
// Compared against when the username doesn't exist, so timing doesn't reveal valid usernames.
const DUMMY_HASH = bcrypt.hashSync('no-such-user-placeholder', 12)

const readCookie = (req) => {
  const match = (req.headers.cookie || '').match(/(?:^|;\s*)cms_token=([^;]+)/)
  return match ? decodeURIComponent(match[1]) : null
}

export async function requireAdmin(req, res, next) {
  try {
    const token = readCookie(req)
    if (!token) return res.status(401).json({ error: 'Not signed in' })
    const payload = jwt.verify(token, config.jwtSecret, { algorithms: ['HS256'] })
    const user = await User.findById(payload.sub)
    if (!user || user.role !== 'admin') return res.status(401).json({ error: 'Not signed in' })
    req.user = user
    next()
  } catch (err) {
    if (err instanceof jwt.JsonWebTokenError) return res.status(401).json({ error: 'Not signed in' })
    next(err)
  }
}

const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 5,
  skipSuccessfulRequests: true,
  standardHeaders: 'draft-8',
  legacyHeaders: false,
  // Behind the static host's proxy (verified by PROXY_SECRET) the visitor's IP arrives in X-Client-IP.
  keyGenerator: (req) => ipKeyGenerator((config.proxySecret && req.get('x-client-ip')) || req.ip),
  message: { error: 'Too many login attempts. Try again in 15 minutes.' },
})

export const authRouter = Router()

authRouter.post('/login', loginLimiter, async (req, res, next) => {
  try {
    const { username, password } = req.body ?? {}
    if (typeof username !== 'string' || typeof password !== 'string' || username.length > 40 || password.length > 200) {
      return res.status(400).json({ error: 'Username and password are required' })
    }
    const user = await User.findOne({ username: username.trim().toLowerCase() }).select('+passwordHash')
    const ok = await bcrypt.compare(password, user?.passwordHash ?? DUMMY_HASH)
    if (!user || !ok || user.role !== 'admin') {
      return res.status(401).json({ error: 'Invalid username or password' })
    }
    const token = jwt.sign({ sub: user.id, role: user.role }, config.jwtSecret, {
      algorithm: 'HS256',
      expiresIn: SESSION_MS / 1000,
    })
    res.cookie(COOKIE, token, { ...cookieOptions, maxAge: SESSION_MS })
    res.json({ username: user.username })
  } catch (err) {
    next(err)
  }
})

authRouter.post('/logout', (_req, res) => {
  res.clearCookie(COOKIE, cookieOptions)
  res.status(204).end()
})

authRouter.get('/me', requireAdmin, (req, res) => {
  res.json({ username: req.user.username })
})
