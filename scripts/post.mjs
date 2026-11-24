// Send a Markdown file to the blog's publishing API (server/publish.js).
//
//   npm run post -- <file.md>              create the post as a draft (refuses if the slug already exists)
//   npm run post -- <file.md> --update     create or overwrite the post at that slug (a live post stays live)
//   npm run post -- <file.md> --publish    ...and publish it
//   npm run post -- <file.md> --draft      ...and unpublish it
//   npm run post -- --list                 list posts
//   add --to <url> to pick the server (default: BLOG_API_URL, else http://localhost:8787)
//
// Reads BLOG_API_TOKEN (and BLOG_API_URL) from .env. The file may start with front matter:
//
//   ---
//   title: My post            (or a leading "# My post" line)
//   slug: my-post             (default: the file name; the same slug updates the same post)
//   excerpt: One-line summary
//   category: Code
//   tags: react, gsap
//   cover: https://res.cloudinary.com/...   coverAlt: What the image shows
//   metaTitle: ...   metaDescription: ...   canonicalUrl: https://...
//   ---
import { readFile } from 'node:fs/promises'
import { basename, extname } from 'node:path'

const args = process.argv.slice(2)
const flag = (name) => {
  const i = args.indexOf(name)
  return i === -1 ? false : (args.splice(i, 1), true)
}
const option = (name) => {
  const i = args.indexOf(name)
  return i === -1 ? undefined : args.splice(i, 2)[1]
}

const list = flag('--list')
const update = flag('--update')
const publish = flag('--publish')
const draft = flag('--draft')
const base = (option('--to') || process.env.BLOG_API_URL || 'http://localhost:8787').replace(/\/+$/, '')
const file = args[0]
const token = process.env.BLOG_API_TOKEN

function fail(message) {
  console.error(message)
  process.exit(1)
}

if (!token) fail('BLOG_API_TOKEN is not set (put it in .env)')
if (!list && !file) fail('Usage: npm run post -- <file.md> [--publish | --draft] [--to <url>]   or   npm run post -- --list')
if (publish && draft) fail('Pick one of --publish and --draft')

async function api(method, path, body, { allow404 = false } = {}) {
  let res
  try {
    res = await fetch(`${base}/api/publish${path}`, {
      method,
      headers: { Authorization: `Bearer ${token}`, ...(body && { 'Content-Type': 'application/json' }) },
      body: body && JSON.stringify(body),
    })
  } catch (err) {
    fail(`Could not reach ${base}: ${err.cause?.code || err.message}`)
  }
  const data = await res.json().catch(() => ({}))
  if (allow404 && res.status === 404) return null
  if (!res.ok) {
    const fields = data.fields ? '\n' + Object.entries(data.fields).map(([k, v]) => `  ${k}: ${v}`).join('\n') : ''
    fail(`${res.status} ${data.error || res.statusText}${fields}`)
  }
  return data
}

/** Splits simple `key: value` front matter from the Markdown body. */
function parse(text) {
  const meta = {}
  let body = text.replace(/^﻿/, '')
  const m = body.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n?/)
  if (m) {
    for (const line of m[1].split(/\r?\n/)) {
      const kv = line.match(/^\s*([A-Za-z]+)\s*:\s*(.*?)\s*$/)
      if (kv) meta[kv[1]] = kv[2].replace(/^(["'])(.*)\1$/, '$2')
    }
    body = body.slice(m[0].length)
  }
  // A leading "# Title" becomes the title (the page renders the title as its own heading).
  const h1 = body.match(/^\s*#\s+(.+?)\s*#*\s*(?:\r?\n|$)/)
  if (h1) {
    meta.title ??= h1[1]
    if (meta.title === h1[1]) body = body.slice(h1[0].length)
  }
  return { meta, body: body.trim() }
}

if (list) {
  const posts = await api('GET', '/posts')
  if (!posts.length) console.log('No posts yet.')
  for (const p of posts) console.log(`${p.status.padEnd(9)} ${p.slug.padEnd(40)} ${p.title}`)
  process.exit(0)
}

const { meta, body } = parse(await readFile(file, 'utf8'))
const slug = meta.slug || basename(file, extname(file))
const payload = { markdown: body }
for (const key of ['title', 'excerpt', 'category', 'tags']) if (meta[key] !== undefined) payload[key] = meta[key]
if (meta.cover !== undefined) payload.coverImage = { url: meta.cover, alt: meta.coverAlt ?? '' }
if (['metaTitle', 'metaDescription', 'canonicalUrl'].some((k) => meta[k] !== undefined)) {
  payload.seo = { metaTitle: meta.metaTitle ?? '', metaDescription: meta.metaDescription ?? '', canonicalUrl: meta.canonicalUrl ?? '' }
}
if (publish) payload.status = 'published'
if (draft) payload.status = 'draft'

// Upserting by slug could silently overwrite an unrelated post that happens to share the slug.
const existing = await api('GET', `/posts/${encodeURIComponent(slug)}`, undefined, { allow404: true })
if (existing && !update) {
  fail(`A post already uses the slug "${existing.slug}": "${existing.title}" (${existing.status}).
` +
    'Pass --update to overwrite it, or set a different slug: in the front matter.')
}

const post = await api('PUT', `/posts/${encodeURIComponent(slug)}`, payload)
console.log(`${post.created ? 'Created' : 'Updated'} "${post.title}" (${post.status})`)
console.log(post.status === 'published' ? post.url : `${post.url}  (draft: not public until --publish)`)
for (const w of post.warnings ?? []) console.log(`Warning: ${w}`)
