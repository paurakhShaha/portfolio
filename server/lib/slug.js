export const slugify = (input) =>
  String(input ?? '')
    .normalize('NFKD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .slice(0, 80)
    .replace(/^-+|-+$/g, '') || 'post'

/**
 * Save a post under `base`, or `base-2`, `base-3`… if that slug is taken.
 * Relies on the unique index, so two saves racing for one slug can't both win.
 */
export async function saveWithUniqueSlug(doc, base) {
  for (let n = 1; n <= 50; n++) {
    doc.slug = n === 1 ? base : `${base}-${n}`
    try {
      return await doc.save()
    } catch (err) {
      if (err?.code === 11000 && err.keyPattern?.slug) continue
      throw err
    }
  }
  throw Object.assign(new Error('Could not find a free slug'), { status: 409 })
}
