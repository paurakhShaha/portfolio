import { useState } from 'react'
import { skills, projects } from '../data/projects'

const categories = [
  { key: 'frontend', label: 'Frontend' },
  { key: 'backend', label: 'Backend' },
  { key: 'languages', label: 'Languages' },
  { key: 'databases', label: 'Databases' },
  { key: 'tools', label: 'Tools' },
  { key: 'creative', label: 'Creative coding' },
] as const

export default function Toolkit() {
  const [active, setActive] = useState<string | null>(null)

  const related = active
    ? projects.filter((p) =>
        p.technologies.some((t) => t.toLowerCase().includes(active.toLowerCase().split(' ')[0]))
      )
    : []

  return (
    <section id="toolkit" className="relative py-32 md:py-40 px-6 md:px-16 lg:px-24">
      <div className="max-w-6xl mx-auto">
        <p className="font-mono text-[10px] tracking-[0.22em] uppercase text-muted mb-4">
          03 — Toolkit
        </p>
        <h2 className="font-display text-4xl md:text-5xl tracking-tighter leading-none mb-16 max-w-xl">
          Technologies verified through real repositories.
        </h2>

        <div className="grid lg:grid-cols-12 gap-12">
          <div className="lg:col-span-8 space-y-10">
            {categories.map((cat) => (
              <div key={cat.key}>
                <p className="font-mono text-[10px] tracking-[0.16em] uppercase text-muted mb-4">
                  {cat.label}
                </p>
                <div className="flex flex-wrap gap-2">
                  {skills[cat.key].map((skill) => (
                    <button
                      key={skill}
                      onMouseEnter={() => setActive(skill)}
                      onMouseLeave={() => setActive(null)}
                      onFocus={() => setActive(skill)}
                      onBlur={() => setActive(null)}
                      className={`px-3 py-1.5 font-mono text-[12px] border transition-all ${
                        active === skill
                          ? 'border-ink bg-ink text-paper'
                          : 'border-ink/15 hover:border-ink/40'
                      }`}
                      data-cursor="SKILL"
                    >
                      {skill}
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>

          <div className="lg:col-span-4">
            <div className="sticky top-24 border border-ink/10 p-6 min-h-[200px]">
              <p className="font-mono text-[10px] tracking-[0.16em] uppercase text-muted mb-4">
                {active ? `Used in` : 'Hover a technology'}
              </p>
              {active && related.length === 0 && (
                <p className="text-sm text-ink/50">Present in the codebase, not always as a primary stack label.</p>
              )}
              <ul className="space-y-3">
                {related.map((p) => (
                  <li key={p.id}>
                    <a
                      href={`#projects`}
                      className="font-display text-lg tracking-tight hover:text-cobalt transition-colors"
                    >
                      {p.title}
                    </a>
                    <p className="font-mono text-[10px] text-muted mt-0.5">{p.category}</p>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
