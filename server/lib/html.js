import sanitizeHtml from 'sanitize-html'

/** Escape text for HTML element content and quoted attributes. */
export const esc = (value) =>
  String(value ?? '').replace(
    /[&<>"']/g,
    (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]
  )

/** JSON for a <script type="application/ld+json"> block; "<" escaped so a title can't close the tag. */
export const jsonLd = (data) => JSON.stringify(data).replace(/</g, '\\u003c')

/** Rich text from the editor, reduced to what TipTap's StarterKit produces. */
export const cleanHtml = (html) =>
  sanitizeHtml(String(html ?? ''), {
    allowedTags: ['p', 'br', 'h2', 'h3', 'h4', 'strong', 'em', 's', 'u', 'code', 'pre', 'blockquote', 'ul', 'ol', 'li', 'hr', 'a'],
    allowedAttributes: { a: ['href', 'target', 'rel'], ol: ['start'] },
    allowedSchemes: ['http', 'https', 'mailto'],
    transformTags: {
      // The article title is the page's only h1.
      h1: 'h2',
      a: (tagName, attribs) => ({
        tagName,
        attribs: attribs.target
          ? { href: attribs.href, target: '_blank', rel: 'noopener noreferrer' }
          : { href: attribs.href },
      }),
    },
  })

export const plainText = (html) =>
  sanitizeHtml(String(html ?? ''), { allowedTags: [], allowedAttributes: {} })
    .replace(/\s+/g, ' ')
    .trim()

/** Cloudinary delivery URL with format/quality/width applied; other URLs pass through. */
export const imageUrl = (url, width) =>
  /^https:\/\/res\.cloudinary\.com\/[^/]+\/image\/upload\//.test(url || '')
    ? url.replace('/image/upload/', `/image/upload/f_auto,q_auto,w_${width}/`)
    : url

export const formatDate = (date) =>
  new Date(date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'UTC' })
