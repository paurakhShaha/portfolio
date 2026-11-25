// The Cloudflare Worker (worker/index.js), run in Node against a stub API.
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { createServer } from 'node:http'
import worker from '../../worker/index.js'

test('worker serves assets, robots.txt, and proxies the API paths', async () => {
  const seen = []
  const api = createServer((req, res) => {
    let body = ''
    req.on('data', (c) => (body += c))
    req.on('end', () => {
      seen.push({ method: req.method, url: req.url, headers: req.headers, body })
      res.setHeader('Set-Cookie', 'cms_token=x; HttpOnly')
      res.end('from-api')
    })
  }).listen(0)
  const env = {
    API_ORIGIN: `http://localhost:${api.address().port}`,
    PROXY_SECRET: 'shh',
    ASSETS: { fetch: () => new Response('from-assets') },
  }
  const site = 'https://paurakhshah.com.np'
  try {
    const robots = await worker.fetch(new Request(`${site}/robots.txt`), env)
    assert.match(await robots.text(), /Sitemap: https:\/\/paurakhshah\.com\.np\/sitemap\.xml/)

    assert.equal(await (await worker.fetch(new Request(`${site}/`), env)).text(), 'from-assets')
    assert.equal(await (await worker.fetch(new Request(`${site}/admin/`), env)).text(), 'from-assets')
    assert.equal(await (await worker.fetch(new Request(`${site}/blogroll`), env)).text(), 'from-assets')

    // Verification files are fetched without .html so the asset handler can't redirect them.
    const assetPaths = []
    const assetEnv = { ...env, ASSETS: { fetch: (r) => (assetPaths.push(new URL(r.url).pathname), new Response('ok')) } }
    await worker.fetch(new Request(`${site}/google712ef48f64f7767a.html`), assetEnv)
    await worker.fetch(new Request(`${site}/googleish.html`), assetEnv)
    assert.deepEqual(assetPaths, ['/google712ef48f64f7767a', '/googleish.html'])

    const page = await worker.fetch(
      new Request(`${site}/blog?q=koi&category=Code`, { headers: { 'CF-Connecting-IP': '203.0.113.7' } }),
      env
    )
    assert.equal(await page.text(), 'from-api')
    assert.equal(seen[0].url, '/blog?q=koi&category=Code')
    assert.equal(seen[0].headers['x-proxy-secret'], 'shh')
    assert.equal(seen[0].headers['x-client-ip'], '203.0.113.7')

    const login = await worker.fetch(
      new Request(`${site}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: '{"username":"a"}',
      }),
      env
    )
    assert.match(login.headers.get('set-cookie'), /cms_token=x/)
    assert.equal(seen[1].method, 'POST')
    assert.equal(seen[1].body, '{"username":"a"}')

    await worker.fetch(new Request(`${site}/sitemap.xml`), env)
    assert.equal(seen[2].url, '/sitemap.xml')

    // The publishing API's bearer token reaches the API unchanged.
    await worker.fetch(
      new Request(`${site}/api/publish/posts/x`, { method: 'PUT', headers: { Authorization: 'Bearer tok' }, body: '{}' }),
      env
    )
    assert.equal(seen[3].url, '/api/publish/posts/x')
    assert.equal(seen[3].headers.authorization, 'Bearer tok')

    const unconfigured = await worker.fetch(new Request(`${site}/blog`), { ...env, API_ORIGIN: '' })
    assert.equal(unconfigured.status, 503)

    // The keep-awake cron pings the API once, without the proxy secret.
    const pending = []
    await worker.scheduled({}, env, { waitUntil: (p) => pending.push(p) })
    await Promise.all(pending)
    assert.equal(seen[4].url, '/api/ping')
    assert.equal(seen[4].headers['x-proxy-secret'], undefined)
    await worker.scheduled({}, { ...env, API_ORIGIN: '' }, { waitUntil: () => assert.fail('no ping without an API') })
  } finally {
    api.close()
  }
})
