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

test('publish API needs the bearer token, and is off when no token is set', async () => {
  const { config } = await import('../config.js')
  const server = createApp().listen(0)
  const base = `http://localhost:${server.address().port}`
  const saved = config.publishToken
  try {
    config.publishToken = ''
    const off = await fetch(`${base}/api/publish/posts`, { headers: { authorization: 'Bearer ' } })
    assert.equal(off.status, 503)

    const token = 'p'.repeat(40)
    config.publishToken = token
    for (const [method, path, auth] of [
      ['GET', '/api/publish/posts', undefined],
      ['GET', '/api/publish/posts', 'Bearer wrong'],
      ['GET', '/api/publish/posts', `Basic ${token}`],
      ['GET', '/api/publish/posts', `Bearer ${token.slice(1)}`],
      ['GET', '/api/publish/posts/a', 'Bearer wrong'],
      ['PUT', '/api/publish/posts/a', 'Bearer wrong'],
    ]) {
      const res = await fetch(base + path, { method, headers: auth ? { authorization: auth } : {} })
      assert.equal(res.status, 401, `${method} ${path} auth=${auth}`)
    }
    // The token opens only the publish API, not the CMS.
    const cms = await fetch(`${base}/api/admin/posts`, { headers: { authorization: `Bearer ${token}` } })
    assert.equal(cms.status, 401)
    // There is no delete route for the token.
    const del = await fetch(`${base}/api/publish/posts/a`, { method: 'DELETE', headers: { authorization: `Bearer ${token}` } })
    assert.equal(del.status, 404)
    // Only the 6 wrong-token requests count (not the 503 or 404); the 11th in 15 minutes is refused.
    for (const expected of [401, 401, 401, 401, 429]) {
      const res = await fetch(`${base}/api/publish/posts`, { headers: { authorization: 'Bearer wrong' } })
      assert.equal(res.status, expected)
    }
  } finally {
    config.publishToken = saved
    server.close()
  }
})

test('markdown bodies are converted and sanitized, with warnings for dropped parts', async () => {
  const { markdownBody } = await import('../publish.js')
  const { pickPost } = await import('../admin.js')
  const { body, warnings } = markdownBody({
    title: 'T',
    markdown: '# Big\n\nHi **there** [x](https://x.dev)\n\n<script>alert(1)</script>\n\n![a](https://x.dev/a.png)\n\n| a | b |\n|---|---|\n| 1 | 2 |\n\n```js\nlet a = 1 < 2\n```',
  })
  assert.equal('markdown' in body, false)
  const { content } = pickPost(body)
  assert.match(content, /<h2>Big<\/h2>/)
  assert.match(content, /<strong>there<\/strong>/)
  assert.match(content, /<a href="https:\/\/x.dev">x<\/a>/)
  assert.match(content, /<pre><code>let a = 1 &lt; 2/)
  assert.doesNotMatch(content, /<script|<img|<table/i)
  assert.equal(warnings.length, 2)
  assert.deepEqual(markdownBody({ title: 'no md' }), { body: { title: 'no md' }, warnings: [] })
})
