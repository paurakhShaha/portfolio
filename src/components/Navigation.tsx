import { useEffect, useState } from 'react'
import { Menu, X } from 'lucide-react'

const links = [
  { id: 'intro', label: 'INTRO' },
  { id: 'about', label: 'ABOUT' },
  { id: 'projects', label: 'PROJECTS' },
  { id: 'design', label: 'DESIGN' },
  { id: 'toolkit', label: 'TOOLKIT' },
  { id: 'contact', label: 'CONTACT' },
]

export default function Navigation() {
  const [open, setOpen] = useState(false)
  const [active, setActive] = useState('intro')

  useEffect(() => {
    const sections = links.map((l) => document.getElementById(l.id)).filter(Boolean) as HTMLElement[]
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) setActive(entry.target.id)
        })
      },
      { rootMargin: '-40% 0px -40% 0px', threshold: 0 }
    )
    sections.forEach((s) => observer.observe(s))
    return () => observer.disconnect()
  }, [])

  const go = (id: string) => {
    setOpen(false)
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' })
  }

  return (
    <>
      {/* Desktop rail */}
      <nav
        className="fixed left-6 top-1/2 -translate-y-1/2 z-[100] hidden lg:flex flex-col gap-5"
        aria-label="Primary"
      >
        {links.map((l) => (
          <button
            key={l.id}
            onClick={() => go(l.id)}
            className="group flex items-center gap-3 text-left"
            data-cursor="GO"
          >
            <span
              className={`w-1.5 h-1.5 rounded-full transition-all ${
                active === l.id ? 'bg-ink scale-125' : 'bg-muted group-hover:bg-ink'
              }`}
            />
            <span
              className={`font-mono text-[10px] tracking-[0.18em] transition-opacity ${
                active === l.id ? 'opacity-100' : 'opacity-40 group-hover:opacity-80'
              }`}
            >
              {l.label}
            </span>
          </button>
        ))}
      </nav>

      {/* Mobile toggle */}
      <button
        className="fixed top-5 right-5 z-[110] lg:hidden w-11 h-11 flex items-center justify-center bg-paper border border-ink/10"
        onClick={() => setOpen((o) => !o)}
        aria-label={open ? 'Close menu' : 'Open menu'}
      >
        {open ? <X size={20} /> : <Menu size={20} />}
      </button>

      {open && (
        <div className="fixed inset-0 z-[105] bg-paper flex flex-col items-center justify-center gap-8 lg:hidden">
          {links.map((l) => (
            <button
              key={l.id}
              onClick={() => go(l.id)}
              className="font-display text-3xl tracking-tight"
            >
              {l.label}
            </button>
          ))}
        </div>
      )}
    </>
  )
}
