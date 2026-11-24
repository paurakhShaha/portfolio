// Cloudflare Worker for the site: dist/ is served as static assets, and the paths listed in
// wrangler.jsonc `assets.run_worker_first` come here first and are forwarded to the Express API,
// so the blog, sitemap and CMS API live on the portfolio's own domain.
// Config: API_ORIGIN (wrangler.jsonc vars), PROXY_SECRET (`npx wrangler secret put PROXY_SECRET`).

const PROXIED = /^\/(?:api\/|blog(?:\/|$)|sitemap\.xml$)/

export default {
  async fetch(request, env) {
    const url = new URL(request.url)

    // Answered here so a sleeping or down API can never make crawlers read "disallow everything".
    if (url.pathname === '/robots.txt') {
      return new Response(
        `User-agent: *\nAllow: /\nDisallow: /admin\nDisallow: /api\n\nSitemap: ${url.origin}/sitemap.xml\n`,
        { headers: { 'Content-Type': 'text/plain; charset=utf-8' } }
      )
    }
    // Search Console's file check wants a 200 at the exact .html path, but the asset handler
    // redirects /x.html to /x. Serve the file at /x without that redirect.
    if (/^\/google[0-9a-f]+\.html$/.test(url.pathname)) {
      return env.ASSETS.fetch(new Request(new URL(url.pathname.slice(0, -5), url), request))
    }
    if (!PROXIED.test(url.pathname)) return env.ASSETS.fetch(request)
    if (!env.API_ORIGIN) return new Response('Blog API is not configured', { status: 503 })

    const headers = new Headers(request.headers)
    headers.delete('host')
    headers.set('X-Proxy-Secret', env.PROXY_SECRET || '')
    headers.set('X-Client-IP', request.headers.get('CF-Connecting-IP') || '')
    const hasBody = request.method !== 'GET' && request.method !== 'HEAD'
    return fetch(new URL(url.pathname + url.search, env.API_ORIGIN), {
      method: request.method,
      headers,
      // Admin bodies are small JSON; buffering keeps this the same in workerd and Node tests.
      body: hasBody ? await request.arrayBuffer() : undefined,
      redirect: 'manual',
    })
  },
}
