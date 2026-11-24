// Runs without a database: covers the pure helpers and the auth gate.
import { test } from 'node:test'
import assert from 'node:assert/strict'

process.env.JWT_SECRET = 'test-secret-that-is-at-least-32-characters-long'
process.env.SITE_URL = 'https://example.test'

const { slugify } = await import('../lib/slug.js')
const { cleanHtml, esc, jsonLd } = await import('../lib/html.js')
const { createApp } = await import('../app.js')
const jwt = (await import('jsonwebtoken')).default

test('slugify makes URL-safe slugs', () => {
  assert.equal(slugify('Hello, World!'), 'hello-world')
  assert.equal(slugify('  Crème brûlée & Co.  '), 'creme-brulee-co')
  assert.equal(slugify('!!!'), 'post')
  assert.ok(slugify('a'.repeat(200)).length <= 80)
})

test('cleanHtml strips scripts, handlers and unsafe links', () => {
  const dirty =
    '<h1>T</h1><p onclick="x()">Hi<script>alert(1)</script></p><a href="javascript:alert(1)">bad</a><a href="https://x.dev" target="_blank">ok</a><img src=x onerror=alert(1)>'
  const clean = cleanHtml(dirty)
  assert.doesNotMatch(clean, /script|onclick|onerror|javascript:|<img/i)
  assert.match(clean, /<h2>T<\/h2>/)
  assert.match(clean, /<a href="https:\/\/x.dev" target="_blank" rel="noopener noreferrer">ok<\/a>/)
})

test('esc and jsonLd keep user text inert', () => {
  assert.equal(esc(`<a href="x">'&`), '&lt;a href=&quot;x&quot;&gt;&#39;&amp;')
  assert.doesNotMatch(jsonLd({ headline: '</script><script>alert(1)</script>' }), /<\/script>/i)
})

test('CMS routes reject requests without a valid session', async () => {
  const server = createApp().listen(0)
  const base = `http://localhost:${server.address().port}`
  try {
    for (const [method, path] of [
      ['GET', '/api/admin/posts'],
      ['POST', '/api/admin/posts'],
      ['PUT', '/api/admin/posts/1'],
      ['DELETE', '/api/admin/posts/1'],
      ['GET', '/api/admin/stats'],
      ['POST', '/api/admin/upload-signature'],
      ['GET', '/api/auth/me'],
    ]) {
      const res = await fetch(base + path, { method })
      assert.equal(res.status, 401, `${method} ${path}`)
    }
    const forged = jwt.sign({ sub: 'x', role: 'admin' }, 'wrong-secret-wrong-secret-wrong-secret')
    const res = await fetch(`${base}/api/admin/posts`, { headers: { cookie: `cms_token=${forged}` } })
    assert.equal(res.status, 401)

    const robots = await (await fetch(`${base}/robots.txt`)).text()
    assert.match(robots, /Disallow: \/admin/)
    assert.match(robots, /Sitemap: https:\/\/example\.test\/sitemap\.xml/)
  } finally {
    server.close()
  }
})
