import { useEffect, useState } from 'react'

const chapters = [
  { id: 'intro', label: '00' },
  { id: 'about', label: '01' },
  { id: 'projects', label: '02' },
  { id: 'design', label: '03' },
  { id: 'toolkit', label: '04' },
  { id: 'contact', label: '06' },
]

export default function ChapterIndicator() {
  const [active, setActive] = useState('00')

  useEffect(() => {
    const els = chapters
      .map((c) => document.getElementById(c.id))
      .filter(Boolean) as HTMLElement[]

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const found = chapters.find((c) => c.id === entry.target.id)
            if (found) setActive(found.label)
          }
        })
      },
      { rootMargin: '-45% 0px -45% 0px', threshold: 0 }
    )

    els.forEach((el) => observer.observe(el))
    return () => observer.disconnect()
  }, [])

  return (
    <div
      className="fixed right-5 top-1/2 -translate-y-1/2 z-[100] hidden md:flex flex-col items-center gap-2"
      aria-hidden="true"
    >
      <span className="font-mono text-[10px] tracking-[0.2em] text-muted mb-1">CH</span>
      <span className="font-display text-2xl tracking-tighter tabular-nums">{active}</span>
    </div>
  )
}
