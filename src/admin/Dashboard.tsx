import { useCallback, useEffect, useState } from 'react'
import { api, formatDate, type PostSummary, type Stats } from './api'
import { buttonClass } from './ui'

interface Props {
  onEdit: (id?: string) => void
  onAuthError: (err: unknown) => void
}

export default function Dashboard({ onEdit, onAuthError }: Props) {
  const [stats, setStats] = useState<Stats | null>(null)
  const [posts, setPosts] = useState<PostSummary[] | null>(null)
  const [error, setError] = useState('')
  const [busyId, setBusyId] = useState('')

  const load = useCallback(() => {
    setError('')
    Promise.all([api<Stats>('/admin/stats'), api<PostSummary[]>('/admin/posts')])
      .then(([s, p]) => {
        setStats(s)
        setPosts(p)
      })
      .catch((err) => {
        onAuthError(err)
        setError(err.message)
      })
  }, [onAuthError])
  useEffect(load, [load])

  const act = async (post: PostSummary, action: 'toggle' | 'delete') => {
    if (action === 'delete' && !confirm(`Delete “${post.title}”? This cannot be undone.`)) return
    setBusyId(post._id)
    try {
      if (action === 'delete') await api(`/admin/posts/${post._id}`, 'DELETE')
      else await api(`/admin/posts/${post._id}`, 'PUT', { status: post.status === 'published' ? 'draft' : 'published' })
      load()
    } catch (err) {
      onAuthError(err)
      alert(err instanceof Error ? err.message : 'Action failed')
    } finally {
      setBusyId('')
    }
  }

  const tiles: [string, number | undefined][] = [
    ['Total posts', stats?.total],
    ['Published', stats?.published],
    ['Drafts', stats?.drafts],
    ['Views', stats?.views],
  ]

  return (
    <>
      <div className="flex flex-wrap items-end justify-between gap-4 mb-8">
        <h1 className="font-display text-4xl md:text-5xl tracking-tighter">Dashboard</h1>
        <button onClick={() => onEdit()} className={`${buttonClass} bg-ink text-paper hover:bg-cobalt`}>
          + New post
        </button>
      </div>

      {error && (
        <div role="alert" className="mb-8 border border-signal/40 bg-signal/5 p-4 flex flex-wrap items-center justify-between gap-3">
          <p className="text-[14px]">Couldn't load posts: {error}</p>
          <button onClick={load} className={`${buttonClass} border border-ink/20 hover:border-ink`}>
            Retry
          </button>
        </div>
      )}

      <dl className="grid grid-cols-2 lg:grid-cols-4 gap-px bg-ink/10 border border-ink/10 mb-10">
        {tiles.map(([label, value]) => (
          <div key={label} className="bg-paper p-5">
            <dt className="font-mono text-[11px] tracking-[0.12em] uppercase text-muted">{label}</dt>
            <dd className="mt-2 font-display text-3xl tracking-tight tabular-nums">
              {value === undefined ? <span className="inline-block w-10 h-7 bg-ink/10 animate-pulse" /> : value.toLocaleString()}
            </dd>
          </div>
        ))}
      </dl>

      {posts === null && !error && (
        <ul aria-label="Loading posts" className="space-y-px">
          {[0, 1, 2].map((i) => (
            <li key={i} className="h-16 bg-ink/5 animate-pulse" />
          ))}
        </ul>
      )}

      {posts?.length === 0 && (
        <div className="border border-dashed border-ink/20 p-10 text-center">
          <p className="font-display text-2xl tracking-tight">No posts yet.</p>
          <button onClick={() => onEdit()} className={`${buttonClass} mt-5 bg-ink text-paper hover:bg-cobalt`}>
            Write the first one
          </button>
        </div>
      )}

      {posts && posts.length > 0 && (
        <ul className="border-t border-ink/10">
          {posts.map((post) => (
            <li key={post._id} className="border-b border-ink/10 py-4 flex flex-col md:flex-row md:items-center gap-3 md:gap-6">
              <div className="flex-1 min-w-0">
                <button onClick={() => onEdit(post._id)} className="text-left font-display text-lg tracking-tight hover:text-cobalt truncate max-w-full">
                  {post.title}
                </button>
                <p className="mt-1 font-mono text-[11px] tracking-[0.08em] text-muted">
                  <span className={post.status === 'published' ? 'text-ink' : ''}>
                    {post.status === 'published' ? '● Published' : '○ Draft'}
                  </span>
                  {post.category && ` · ${post.category}`} · {post.views} views · updated {formatDate(post.updatedAt)}
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                <button onClick={() => onEdit(post._id)} className={`${buttonClass} border border-ink/20 hover:border-ink`}>
                  Edit
                </button>
                {post.status === 'published' && (
                  <a href={`/blog/${post.slug}`} target="_blank" rel="noopener noreferrer" className={`${buttonClass} border border-ink/20 hover:border-ink`}>
                    View
                  </a>
                )}
                <button
                  onClick={() => act(post, 'toggle')}
                  disabled={busyId === post._id}
                  className={`${buttonClass} border border-ink/20 hover:border-ink`}
                >
                  {post.status === 'published' ? 'Unpublish' : 'Publish'}
                </button>
                <button
                  onClick={() => act(post, 'delete')}
                  disabled={busyId === post._id}
                  className={`${buttonClass} border border-signal/40 text-signal hover:bg-signal hover:text-paper`}
                >
                  Delete
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </>
  )
}
