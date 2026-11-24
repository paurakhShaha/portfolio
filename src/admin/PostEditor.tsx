import { useEffect, useState, type ReactNode } from 'react'
import { EditorContent, useEditor, useEditorState, type Editor } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import { api, ApiError, uploadImage, type Post } from './api'
import { buttonClass, inputClass, labelClass } from './ui'

interface Props {
  id?: string
  onBack: () => void
  onAuthError: (err: unknown) => void
}

const emptyPost = {
  _id: '',
  title: '',
  slug: '',
  excerpt: '',
  content: '',
  category: '',
  tags: [] as string[],
  status: 'draft' as Post['status'],
  coverImage: { url: '', alt: '' },
  seo: { metaTitle: '', metaDescription: '', canonicalUrl: '' },
}
type Draft = typeof emptyPost

/** Loads the post (or starts a blank one), then hands it to the form. */
export default function PostEditor({ id, onBack, onAuthError }: Props) {
  const [post, setPost] = useState<Draft | null>(id ? null : emptyPost)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!id) return
    api<Post>(`/admin/posts/${id}`)
      // Fill gaps so posts written outside the CMS (missing nested fields) still open.
      .then((p) =>
        setPost({
          ...emptyPost,
          ...p,
          coverImage: { ...emptyPost.coverImage, ...p.coverImage },
          seo: { ...emptyPost.seo, ...p.seo },
        })
      )
      .catch((err) => {
        onAuthError(err)
        setError(err.message)
      })
  }, [id, onAuthError])

  if (error) {
    return (
      <div role="alert" className="space-y-4">
        <p>Couldn't load this post: {error}</p>
        <button onClick={onBack} className={`${buttonClass} border border-ink/20 hover:border-ink`}>
          ← Back
        </button>
      </div>
    )
  }
  if (!post) return <p className="font-mono text-[11px] tracking-[0.15em] uppercase text-muted">Loading post…</p>
  return <PostForm initial={post} onBack={onBack} onAuthError={onAuthError} />
}

function Field({ label, hint, children }: { label: string; hint?: ReactNode; children: ReactNode }) {
  return (
    <label className="block">
      <span className={`${labelClass} flex justify-between gap-2`}>
        {label}
        {hint && <span className="normal-case tracking-normal">{hint}</span>}
      </span>
      {children}
    </label>
  )
}

const count = (value: string, max: number) => (
  <span className={value.length > max ? 'text-signal' : ''}>
    {value.length}/{max}
  </span>
)

function PostForm({ initial, onBack, onAuthError }: { initial: Draft; onBack: () => void; onAuthError: (err: unknown) => void }) {
  const [post, setPost] = useState(initial)
  const [tags, setTags] = useState(initial.tags.join(', '))
  const [saving, setSaving] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [message, setMessage] = useState<{ kind: 'ok' | 'error'; text: string; fields?: Record<string, string> } | null>(null)

  const editor = useEditor({
    extensions: [StarterKit.configure({ heading: { levels: [2, 3] }, link: { openOnClick: false } })],
    content: initial.content,
    editorProps: { attributes: { class: 'prose-blog', 'aria-label': 'Article content' } },
  })

  const set = <K extends keyof Draft>(key: K, value: Draft[K]) => setPost((p) => ({ ...p, [key]: value }))

  const save = async (status: Draft['status']) => {
    setSaving(true)
    setMessage(null)
    const body = { ...post, status, tags, content: editor?.getHTML() ?? '' }
    try {
      const saved = post._id
        ? await api<Post>(`/admin/posts/${post._id}`, 'PUT', body)
        : await api<Post>('/admin/posts', 'POST', body)
      setPost((p) => ({ ...p, _id: saved._id, slug: saved.slug, status: saved.status }))
      setMessage({ kind: 'ok', text: status === 'published' ? 'Published.' : 'Saved as draft.' })
    } catch (err) {
      onAuthError(err)
      setMessage({
        kind: 'error',
        text: err instanceof Error ? err.message : 'Save failed',
        fields: err instanceof ApiError ? err.fields : undefined,
      })
    } finally {
      setSaving(false)
    }
  }

  const onFile = async (file?: File) => {
    if (!file) return
    if (!file.type.startsWith('image/') || file.size > 5 * 1024 * 1024) {
      setMessage({ kind: 'error', text: 'Choose an image under 5 MB.' })
      return
    }
    setUploading(true)
    setMessage(null)
    try {
      const url = await uploadImage(file)
      set('coverImage', { ...post.coverImage, url })
    } catch (err) {
      onAuthError(err)
      setMessage({ kind: 'error', text: err instanceof Error ? err.message : 'Upload failed' })
    } finally {
      setUploading(false)
    }
  }

  const published = post.status === 'published'

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-4 mb-8">
        <button onClick={onBack} className="font-mono text-[11px] tracking-[0.15em] uppercase text-muted hover:text-ink">
          ← Dashboard
        </button>
        <div className="flex flex-wrap gap-2">
          {published && post.slug && (
            <a href={`/blog/${post.slug}`} target="_blank" rel="noopener noreferrer" className={`${buttonClass} border border-ink/20 hover:border-ink`}>
              View
            </a>
          )}
          <button onClick={() => save('draft')} disabled={saving} className={`${buttonClass} border border-ink/20 hover:border-ink`}>
            {published ? 'Unpublish' : 'Save draft'}
          </button>
          <button onClick={() => save('published')} disabled={saving} className={`${buttonClass} bg-ink text-paper hover:bg-cobalt`}>
            {saving ? 'Saving…' : published ? 'Update' : 'Publish'}
          </button>
        </div>
      </div>

      {message && (
        <div
          role={message.kind === 'error' ? 'alert' : 'status'}
          className={`mb-6 p-4 border text-[14px] ${message.kind === 'error' ? 'border-signal/40 bg-signal/5' : 'border-ink/15 bg-acid/20'}`}
        >
          <p>{message.text}</p>
          {message.fields && (
            <ul className="mt-2 list-disc pl-5">
              {Object.entries(message.fields).map(([field, text]) => (
                <li key={field}>{text}</li>
              ))}
            </ul>
          )}
        </div>
      )}

      <div className="grid lg:grid-cols-[1fr_320px] gap-10">
        <div className="space-y-6 min-w-0">
          <input
            className="w-full bg-transparent font-display text-4xl md:text-5xl tracking-tighter placeholder:text-ink/25 focus:outline-none"
            placeholder="Post title"
            aria-label="Title"
            value={post.title}
            maxLength={160}
            onChange={(e) => set('title', e.target.value)}
          />
          <Field label="Excerpt" hint={count(post.excerpt, 300)}>
            <textarea className={`${inputClass} h-24 resize-y`} value={post.excerpt} onChange={(e) => set('excerpt', e.target.value)} />
          </Field>
          <div className="border border-ink/20">
            {editor && <Toolbar editor={editor} />}
            <EditorContent editor={editor} className="px-5 py-4" />
          </div>
        </div>

        <aside className="space-y-6">
          <Field label="URL slug" hint="blank = from title">
            <input className={inputClass} value={post.slug} placeholder="my-post-title" onChange={(e) => set('slug', e.target.value)} />
          </Field>
          <Field label="Category">
            <input className={inputClass} value={post.category} maxLength={40} onChange={(e) => set('category', e.target.value)} />
          </Field>
          <Field label="Tags" hint="comma separated">
            <input className={inputClass} value={tags} onChange={(e) => setTags(e.target.value)} />
          </Field>

          <fieldset className="space-y-3">
            <legend className={labelClass}>Featured image</legend>
            {post.coverImage.url && (
              <img src={post.coverImage.url} alt={post.coverImage.alt} className="w-full aspect-[16/10] object-cover border border-ink/10" />
            )}
            <div className="flex flex-wrap gap-2">
              <label className={`${buttonClass} border border-ink/20 hover:border-ink cursor-pointer`}>
                {uploading ? 'Uploading…' : post.coverImage.url ? 'Replace' : 'Upload image'}
                <input
                  type="file"
                  accept="image/*"
                  className="sr-only"
                  disabled={uploading}
                  onChange={(e) => {
                    onFile(e.target.files?.[0])
                    e.target.value = ''
                  }}
                />
              </label>
              {post.coverImage.url && (
                <button onClick={() => set('coverImage', { url: '', alt: '' })} className={`${buttonClass} border border-ink/20 hover:border-ink`}>
                  Remove
                </button>
              )}
            </div>
            {post.coverImage.url && (
              <Field label="Alt text (required)">
                <input
                  className={inputClass}
                  value={post.coverImage.alt}
                  maxLength={200}
                  onChange={(e) => set('coverImage', { ...post.coverImage, alt: e.target.value })}
                />
              </Field>
            )}
          </fieldset>

          <fieldset className="space-y-4 pt-6 border-t border-ink/10">
            <legend className="font-display text-lg tracking-tight mb-2">SEO</legend>
            <Field label="Meta title" hint={count(post.seo.metaTitle, 70)}>
              <input
                className={inputClass}
                value={post.seo.metaTitle}
                placeholder={post.title}
                onChange={(e) => set('seo', { ...post.seo, metaTitle: e.target.value })}
              />
            </Field>
            <Field label="Meta description" hint={count(post.seo.metaDescription, 160)}>
              <textarea
                className={`${inputClass} h-24 resize-y`}
                value={post.seo.metaDescription}
                placeholder={post.excerpt}
                onChange={(e) => set('seo', { ...post.seo, metaDescription: e.target.value })}
              />
            </Field>
            <Field label="Canonical URL" hint="optional">
              <input
                className={inputClass}
                type="url"
                value={post.seo.canonicalUrl}
                placeholder="https://…"
                onChange={(e) => set('seo', { ...post.seo, canonicalUrl: e.target.value })}
              />
            </Field>
          </fieldset>
        </aside>
      </div>
    </div>
  )
}

function Toolbar({ editor }: { editor: Editor }) {
  const active = useEditorState({
    editor,
    selector: ({ editor: e }) => ({
      bold: e.isActive('bold'),
      italic: e.isActive('italic'),
      strike: e.isActive('strike'),
      h2: e.isActive('heading', { level: 2 }),
      h3: e.isActive('heading', { level: 3 }),
      bullet: e.isActive('bulletList'),
      ordered: e.isActive('orderedList'),
      quote: e.isActive('blockquote'),
      code: e.isActive('codeBlock'),
      link: e.isActive('link'),
    }),
  })

  const setLink = () => {
    const previous = editor.getAttributes('link').href as string | undefined
    const url = prompt('Link URL (leave empty to remove)', previous ?? 'https://')
    if (url === null) return
    if (url === '' || url === 'https://') editor.chain().focus().extendMarkRange('link').unsetLink().run()
    else editor.chain().focus().extendMarkRange('link').setLink({ href: url }).run()
  }

  const buttons: [string, string, boolean, () => void][] = [
    ['B', 'Bold', active.bold, () => editor.chain().focus().toggleBold().run()],
    ['I', 'Italic', active.italic, () => editor.chain().focus().toggleItalic().run()],
    ['S', 'Strikethrough', active.strike, () => editor.chain().focus().toggleStrike().run()],
    ['H2', 'Heading', active.h2, () => editor.chain().focus().toggleHeading({ level: 2 }).run()],
    ['H3', 'Subheading', active.h3, () => editor.chain().focus().toggleHeading({ level: 3 }).run()],
    ['• List', 'Bullet list', active.bullet, () => editor.chain().focus().toggleBulletList().run()],
    ['1. List', 'Numbered list', active.ordered, () => editor.chain().focus().toggleOrderedList().run()],
    ['Quote', 'Quote', active.quote, () => editor.chain().focus().toggleBlockquote().run()],
    ['Code', 'Code block', active.code, () => editor.chain().focus().toggleCodeBlock().run()],
    ['Link', 'Link', active.link, setLink],
    ['—', 'Divider', false, () => editor.chain().focus().setHorizontalRule().run()],
    ['Undo', 'Undo', false, () => editor.chain().focus().undo().run()],
    ['Redo', 'Redo', false, () => editor.chain().focus().redo().run()],
  ]

  return (
    <div role="toolbar" aria-label="Formatting" className="sticky top-0 z-10 flex flex-wrap gap-1 border-b border-ink/15 bg-paper p-2">
      {buttons.map(([text, title, on, run]) => (
        <button
          key={title}
          type="button"
          title={title}
          aria-label={title}
          aria-pressed={on}
          onClick={run}
          className={`px-2.5 py-1.5 font-mono text-[11px] transition-colors ${on ? 'bg-ink text-paper' : 'hover:bg-ink/10'}`}
        >
          {text}
        </button>
      ))}
    </div>
  )
}
