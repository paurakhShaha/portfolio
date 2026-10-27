import { useCallback, useEffect, useRef, useState } from 'react'
import gsap from 'gsap'
import { X, ChevronLeft, ChevronRight } from 'lucide-react'
import { designWorks, type DesignWork } from '../data/designWorks'

function sizeClass(size?: DesignWork['size']) {
  switch (size) {
    case 'lg':
      return 'md:col-span-6 md:row-span-2'
    case 'md':
      return 'md:col-span-4'
    default:
      return 'md:col-span-3'
  }
}

function Lightbox({
  works,
  index,
  onClose,
  onPrev,
  onNext,
}: {
  works: DesignWork[]
  index: number
  onClose: () => void
  onPrev: () => void
  onNext: () => void
}) {
  const work = works[index]
  const panelRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
      if (e.key === 'ArrowLeft') onPrev()
      if (e.key === 'ArrowRight') onNext()
    }
    window.addEventListener('keydown', onKey)

    const el = panelRef.current
    if (el) {
      gsap.fromTo(
        el,
        { opacity: 0, y: 16 },
        { opacity: 1, y: 0, duration: 0.35, ease: 'power2.out' }
      )
    }

    return () => {
      document.body.style.overflow = prev
      window.removeEventListener('keydown', onKey)
    }
  }, [onClose, onPrev, onNext, index])

  if (!work) return null

  return (
    <div
      className="fixed inset-0 z-[200] flex items-center justify-center bg-ink/80 p-4 md:p-10"
      role="dialog"
      aria-modal="true"
      aria-label={work.title}
      onClick={onClose}
    >
      <div
        ref={panelRef}
        className="relative max-w-5xl w-full max-h-[90vh] flex flex-col bg-paper border border-ink/10"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-4 py-3 border-b border-ink/10">
          <div>
            <p className="font-mono text-[10px] tracking-[0.18em] text-muted">
              {String(index + 1).padStart(2, '0')} / {String(works.length).padStart(2, '0')}
            </p>
            <p className="font-display text-lg tracking-tight mt-0.5">{work.title}</p>
            {work.category && (
              <p className="font-mono text-[10px] tracking-[0.12em] uppercase text-muted mt-0.5">
                {work.category}
              </p>
            )}
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-10 h-10 flex items-center justify-center border border-ink/15 hover:border-ink transition-colors"
            aria-label="Close artwork viewer"
            data-cursor="CLOSE"
          >
            <X size={18} />
          </button>
        </div>

        <div className="relative flex-1 min-h-0 flex items-center justify-center p-4 md:p-8 bg-paper overflow-auto">
          <img
            src={work.image}
            alt={work.title}
            className="max-w-full max-h-[70vh] w-auto h-auto object-contain"
          />
        </div>

        <div className="flex items-center justify-between px-4 py-3 border-t border-ink/10">
          <button
            type="button"
            onClick={onPrev}
            className="inline-flex items-center gap-2 font-mono text-[11px] tracking-[0.14em] uppercase hover:text-cobalt transition-colors"
            aria-label="Previous artwork"
            data-cursor="PREV"
          >
            <ChevronLeft size={16} /> Prev
          </button>
          <button
            type="button"
            onClick={onNext}
            className="inline-flex items-center gap-2 font-mono text-[11px] tracking-[0.14em] uppercase hover:text-cobalt transition-colors"
            aria-label="Next artwork"
            data-cursor="NEXT"
          >
            Next <ChevronRight size={16} />
          </button>
        </div>
      </div>
    </div>
  )
}

export default function VisualPlayground() {
  const rootRef = useRef<HTMLElement>(null)
  const [activeIndex, setActiveIndex] = useState<number | null>(null)

  const openAt = useCallback((i: number) => setActiveIndex(i), [])
  const close = useCallback(() => setActiveIndex(null), [])
  const prev = useCallback(
    () =>
      setActiveIndex((i) =>
        i === null ? null : (i - 1 + designWorks.length) % designWorks.length
      ),
    []
  )
  const next = useCallback(
    () => setActiveIndex((i) => (i === null ? null : (i + 1) % designWorks.length)),
    []
  )

  useEffect(() => {
    const root = rootRef.current
    if (!root) return

    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    if (reduced) return

    const ctx = gsap.context(() => {
      gsap.from('.vp-heading', {
        y: 48,
        opacity: 0,
        duration: 1,
        ease: 'power3.out',
        scrollTrigger: {
          trigger: root,
          start: 'top 75%',
          toggleActions: 'play none none reverse',
        },
      })

      gsap.from('.vp-item', {
        y: 36,
        opacity: 0,
        stagger: 0.07,
        duration: 0.85,
        ease: 'power3.out',
        scrollTrigger: {
          trigger: '.vp-grid',
          start: 'top 80%',
          toggleActions: 'play none none reverse',
        },
      })

      gsap.utils.toArray<HTMLElement>('.vp-parallax').forEach((el, i) => {
        gsap.to(el, {
          y: i % 2 === 0 ? -24 : 18,
          ease: 'none',
          scrollTrigger: {
            trigger: el,
            start: 'top bottom',
            end: 'bottom top',
            scrub: 1.2,
          },
        })
      })
    }, root)

    return () => ctx.revert()
  }, [])

  return (
    <section
      id="design"
      ref={rootRef}
      className="relative py-28 md:py-40 px-6 md:px-16 lg:px-24"
    >
      <div className="max-w-6xl mx-auto">
        <div className="vp-heading mb-14 md:mb-20">
          <p className="font-mono text-[10px] tracking-[0.22em] uppercase text-muted mb-4">
            Visual Archive / 001–015
          </p>
          <h2 className="font-display text-4xl md:text-6xl tracking-tighter leading-none max-w-3xl">
            The Visual Playground
          </h2>
          <p className="mt-3 font-display text-2xl md:text-3xl tracking-tight text-ink/40">
            15 pieces. One imagination.
          </p>
          <p className="mt-6 max-w-xl text-[15px] leading-relaxed text-ink/55">
            Beyond the interface and into the visual world — a collection of graphic design
            experiments, compositions, and ideas.
          </p>
        </div>

        <div className="vp-grid grid grid-cols-1 sm:grid-cols-2 md:grid-cols-12 gap-4 md:gap-5 auto-rows-auto">
          {designWorks.map((work, i) => (
            <button
              key={work.id}
              type="button"
              onClick={() => openAt(i)}
              className={`vp-item group relative text-left border border-ink/10 bg-paper overflow-hidden focus-visible:outline focus-visible:outline-2 focus-visible:outline-cobalt focus-visible:outline-offset-2 ${sizeClass(work.size)}`}
              data-cursor="VIEW"
              aria-label={`View ${work.title}`}
            >
              <div
                className={`vp-parallax relative w-full ${
                  work.size === 'lg' ? 'aspect-[4/5] md:aspect-[3/4]' : work.size === 'md' ? 'aspect-[4/3]' : 'aspect-square'
                }`}
              >
                <img
                  src={work.image}
                  alt={work.title}
                  loading="lazy"
                  decoding="async"
                  className="absolute inset-0 w-full h-full object-contain p-3 md:p-4 transition-transform duration-500 ease-out group-hover:scale-[1.03]"
                />
              </div>
              <div className="absolute inset-x-0 bottom-0 p-3 md:p-4 flex items-end justify-between gap-2 opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity duration-300 bg-gradient-to-t from-paper/95 via-paper/70 to-transparent pt-10">
                <div>
                  <p className="font-mono text-[10px] tracking-[0.16em] text-muted">
                    {String(i + 1).padStart(2, '0')}
                  </p>
                  <p className="font-display text-sm tracking-tight mt-0.5">{work.title}</p>
                </div>
                <span className="font-mono text-[9px] tracking-[0.14em] uppercase text-ink/50 hidden sm:inline">
                  View
                </span>
              </div>
            </button>
          ))}
        </div>
      </div>

      {activeIndex !== null && (
        <Lightbox
          works={designWorks}
          index={activeIndex}
          onClose={close}
          onPrev={prev}
          onNext={next}
        />
      )}
    </section>
  )
}
