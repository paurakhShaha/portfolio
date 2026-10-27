import { useEffect, useRef } from 'react'
import gsap from 'gsap'
import { designWorks } from '../data/designWorks'

/**
 * Floating design previews that drift in the background while the visitor
 * scrolls through Projects, then settle / fade as the Design section arrives.
 * Purely decorative — pointer-events none, hidden when reduced-motion or mobile.
 */
const TRAIL = [
  // start positions are % of viewport; end nudges them toward a calm cluster
  { workIndex: 0, start: { x: 8, y: 18, r: -6, s: 0.55 }, end: { x: 18, y: 28, r: -2, s: 0.7 } },
  { workIndex: 3, start: { x: 72, y: 12, r: 5, s: 0.45 }, end: { x: 68, y: 22, r: 2, s: 0.6 } },
  { workIndex: 5, start: { x: 82, y: 55, r: -4, s: 0.5 }, end: { x: 74, y: 48, r: -1, s: 0.65 } },
  { workIndex: 9, start: { x: 6, y: 62, r: 7, s: 0.42 }, end: { x: 14, y: 58, r: 3, s: 0.55 } },
  { workIndex: 11, start: { x: 48, y: 70, r: -3, s: 0.48 }, end: { x: 42, y: 62, r: 0, s: 0.58 } },
  { workIndex: 1, start: { x: 58, y: 8, r: 4, s: 0.38 }, end: { x: 52, y: 16, r: 1, s: 0.5 } },
]

export default function DesignScrollTrail() {
  const rootRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const root = rootRef.current
    if (!root) return

    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    const narrow = window.matchMedia('(max-width: 1023px)').matches
    if (reduced || narrow) {
      root.style.display = 'none'
      return
    }

    const cards = gsap.utils.toArray<HTMLElement>(root.querySelectorAll('.trail-card'))
    const projects = document.getElementById('projects')
    const design = document.getElementById('design')
    if (!projects || !design || cards.length === 0) return

    const ctx = gsap.context(() => {
      // Initial scattered state
      cards.forEach((card, i) => {
        const t = TRAIL[i]
        if (!t) return
        gsap.set(card, {
          left: `${t.start.x}%`,
          top: `${t.start.y}%`,
          rotation: t.start.r,
          scale: t.start.s,
          opacity: 0,
          xPercent: -50,
          yPercent: -50,
        })
      })

      // Fade in while entering Projects
      gsap.to(cards, {
        opacity: 0.28,
        duration: 1,
        stagger: 0.08,
        ease: 'power2.out',
        scrollTrigger: {
          trigger: projects,
          start: 'top 70%',
          end: 'top 20%',
          toggleActions: 'play none none reverse',
        },
      })

      // Drift toward design as user scrolls through projects → design
      cards.forEach((card, i) => {
        const t = TRAIL[i]
        if (!t) return
        gsap.to(card, {
          left: `${t.end.x}%`,
          top: `${t.end.y}%`,
          rotation: t.end.r,
          scale: t.end.s,
          ease: 'none',
          scrollTrigger: {
            trigger: projects,
            start: 'top top',
            endTrigger: design,
            end: 'top 45%',
            scrub: 1.4,
          },
        })
      })

      // Fade trail out as the real gallery takes over
      gsap.to(cards, {
        opacity: 0,
        scale: 0.85,
        ease: 'power1.in',
        scrollTrigger: {
          trigger: design,
          start: 'top 70%',
          end: 'top 25%',
          scrub: true,
        },
      })
    }, root)

    return () => ctx.revert()
  }, [])

  return (
    <div
      ref={rootRef}
      className="pointer-events-none fixed inset-0 z-[5] hidden lg:block overflow-hidden"
      aria-hidden="true"
    >
      {TRAIL.map((t, i) => {
        const work = designWorks[t.workIndex]
        if (!work) return null
        return (
          <div
            key={work.id}
            className="trail-card absolute w-[min(220px,18vw)] aspect-[4/5] border border-ink/10 bg-paper shadow-[0_12px_40px_rgba(23,23,20,0.08)] overflow-hidden will-change-transform"
          >
            <img
              src={work.image}
              alt=""
              className="w-full h-full object-contain p-2"
              draggable={false}
            />
            <span className="absolute bottom-1.5 left-2 font-mono text-[8px] tracking-[0.14em] text-muted">
              {String(i + 1).padStart(2, '0')}
            </span>
          </div>
        )
      })}
    </div>
  )
}
