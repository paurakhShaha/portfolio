export interface PostSummary {
  _id: string
  title: string
  slug: string
  status: 'draft' | 'published'
  category: string
  views: number
  publishedAt: string | null
  updatedAt: string
}

export interface Post extends PostSummary {
  excerpt: string
  content: string
  coverImage: { url: string; alt: string }
  tags: string[]
  seo: { metaTitle: string; metaDescription: string; canonicalUrl: string }
}

export interface Stats {
  total: number
  published: number
  drafts: number
  views: number
}

export class ApiError extends Error {
  constructor(
    message: string,
    public status: number,
    public fields?: Record<string, string>
  ) {
    super(message)
  }
}

/** JSON call to the CMS API. The session lives in an httpOnly cookie, so nothing is stored here. */
export async function api<T>(path: string, method = 'GET', body?: unknown): Promise<T> {
  const res = await fetch(`/api${path}`, {
    method,
    credentials: 'same-origin',
    headers: body === undefined ? undefined : { 'Content-Type': 'application/json' },
    body: body === undefined ? undefined : JSON.stringify(body),
  })
  if (res.status === 204) return undefined as T
  const data = await res.json().catch(() => null)
  if (!res.ok) throw new ApiError(data?.error || `Request failed (${res.status})`, res.status, data?.fields)
  return data as T
}

/** Uploads straight to Cloudinary with a signature from our API; returns the image URL. */
export async function uploadImage(file: File): Promise<string> {
  const sig = await api<Record<string, string | number>>('/admin/upload-signature', 'POST')
  const form = new FormData()
  form.append('file', file)
  for (const key of ['api_key', 'timestamp', 'signature', 'folder', 'allowed_formats']) {
    form.append(key, String(key === 'api_key' ? sig.apiKey : sig[key]))
  }
  const res = await fetch(`https://api.cloudinary.com/v1_1/${sig.cloudName}/image/upload`, { method: 'POST', body: form })
  const data = await res.json().catch(() => null)
  if (!res.ok || !data?.secure_url) throw new Error(data?.error?.message || 'Upload failed')
  return data.secure_url as string
}

export const formatDate = (iso: string | null) =>
  iso ? new Date(iso).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }) : '—'
