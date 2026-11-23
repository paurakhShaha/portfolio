import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { X, ChevronLeft, ChevronRight } from 'lucide-react'
import { designWorks, type DesignWork } from '../data/designWorks'
import { designImages, OPTIMIZED_BASE, OPTIMIZED_WIDTHS } from '../data/designImages.generated'

/** Optimized WebP sources for a work, falling back to the original file. */
function sourcesFor(work: DesignWork) {
  const meta = designImages[work.image]
  if (!meta) return { src: work.image, srcSet: undefined, meta: undefined }
  const srcSet = OPTIMIZED_WIDTHS.map((w) => `${OPTIMIZED_BASE}/${meta.name}-${w}.webp ${w}w`).join(', ')
  return { src: `${OPTIMIZED_BASE}/${meta.name}-${OPTIMIZED_WIDTHS[1]}.webp`, srcSet, meta }
}

function useColumnCount() {
  const get = () =>
    typeof window === 'undefined' || window.matchMedia('(min-width: 1024px)').matches
      ? 4
      : window.matchMedia('(min-width: 640px)').matches
        ? 3
        : 2
  const [count, setCount] = useState(get)
  useEffect(() => {
    const onResize = () => setCount(get())
    window.addEventListener('resize', onResize)
    return () => window.removeEventListener('resize', onResize)
  }, [])
  return count
}

function useReducedMotion() {
  const query = '(prefers-reduced-motion: reduce)'
  const [reduced, setReduced] = useState(
    () => typeof window !== 'undefined' && window.matchMedia(query).matches
  )
  useEffect(() => {
    const mq = window.matchMedia(query)
    const onChange = (e: MediaQueryListEvent) => setReduced(e.matches)
    mq.addEventListener('change', onChange)
    return () => mq.removeEventListener('change', onChange)
  }, [])
  return reduced
}

/** Image that sits on its dominant colour, then fades in once decoded. */
function GalleryImage({ work, sizes, className = '' }: { work: DesignWork; sizes: string; className?: string }) {
  const { src, srcSet, meta } = sourcesFor(work)
  const [loaded, setLoaded] = useState(false)
  const imgRef = useRef<HTMLImageElement>(null)

  useEffect(() => {
    if (imgRef.current?.complete) setLoaded(true)
  }, [src])

  return (
    <img
      ref={imgRef}
      src={src}
      srcSet={srcSet}
      sizes={sizes}
      width={meta?.width}
      height={meta?.height}
      alt={work.title}
      loading="lazy"
      decoding="async"
      onLoad={() => setLoaded(true)}
      className={`block w-full h-auto transition-opacity duration-700 ease-out ${
        loaded ? 'opacity-100' : 'opacity-0'
      } ${className}`}
    />
  )
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
      gsap.fromTo(el, { opacity: 0, y: 16 }, { opacity: 1, y: 0, duration: 0.35, ease: 'power2.out' })
    }

    return () => {
      document.body.style.overflow = prev
      window.removeEventListener('keydown', onKey)
    }
  }, [onClose, onPrev, onNext, index])

  // Warm the cache for neighbours so Prev / Next feel instant.
  useEffect(() => {
    ;[index - 1, index + 1].forEach((i) => {
      const w = works[(i + works.length) % works.length]
      const img = new Image()
      img.src = sourcesFor(w).src
    })
  }, [index, works])

  if (!work) return null
  const { meta } = sourcesFor(work)

  return (
    <div
      className="fixed inset-0 z-[200] flex items-center justify-center bg-ink/85 p-4 md:p-10"
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
            <p className="font-display text-lg tracking-tight">{work.title}</p>
            <p className="text-sm text-ink/60 mt-0.5">
              {index + 1} of {works.length}
              {work.category ? ` — ${work.category}` : ''}
            </p>
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

        <div className="relative flex-1 min-h-0 flex items-center justify-center p-4 md:p-8 overflow-auto">
          <div style={{ background: meta?.color }} className="max-h-[70vh] flex">
            <GalleryImage
              key={work.id}
              work={work}
              sizes="(min-width: 1024px) 960px, 92vw"
              className="!w-auto max-w-full max-h-[70vh] object-contain"
            />
          </div>
        </div>

        <div className="flex items-center justify-between px-4 py-3 border-t border-ink/10">
          <button
            type="button"
            onClick={onPrev}
            className="inline-flex items-center gap-2 text-sm hover:text-cobalt transition-colors"
            aria-label="Previous artwork"
            data-cursor="PREV"
          >
            <ChevronLeft size={16} /> Previous
          </button>
          <button
            type="button"
            onClick={onNext}
            className="inline-flex items-center gap-2 text-sm hover:text-cobalt transition-colors"
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

/** Spread works across columns, always adding to the shortest one. */
function toColumns(works: DesignWork[], count: number) {
  const cols: { work: DesignWork; index: number }[][] = Array.from({ length: count }, () => [])
  const heights = new Array(count).fill(0)
  works.forEach((work, index) => {
    const meta = designImages[work.image]
    const ratio = meta ? meta.height / meta.width : 1
    const target = heights.indexOf(Math.min(...heights))
    cols[target].push({ work, index })
    heights[target] += ratio
  })
  return cols
}

function Tile({
  work,
  index,
  sizes,
  onOpen,
  duplicate = false,
}: {
  work: DesignWork
  index: number
  sizes: string
  onOpen: (i: number) => void
  /** The looped copy: hidden from screen readers and the tab order. */
  duplicate?: boolean
}) {
  const meta = designImages[work.image]
  return (
    // Spacing lives in padding (not flex gap) so the doubled track is exactly 2× one set.
    <div className="pb-4 md:pb-6" aria-hidden={duplicate || undefined}>
      <button
        type="button"
        onClick={() => onOpen(index)}
        tabIndex={duplicate ? -1 : undefined}
        className="group relative block w-full text-left overflow-hidden focus-visible:outline focus-visible:outline-2 focus-visible:outline-cobalt focus-visible:outline-offset-2"
        style={{
          background: meta?.color ?? 'rgba(23,23,20,0.06)',
          aspectRatio: meta ? `${meta.width} / ${meta.height}` : undefined,
        }}
        data-cursor="VIEW"
        aria-label={`View ${work.title}`}
      >
        <GalleryImage
          work={work}
          sizes={sizes}
          className="transition-transform duration-700 ease-out group-hover:scale-[1.04]"
        />
        <div className="absolute inset-x-0 bottom-0 p-3 md:p-4 flex items-end justify-between gap-2 opacity-100 md:opacity-0 md:group-hover:opacity-100 md:group-focus-visible:opacity-100 transition-opacity duration-300 bg-gradient-to-t from-ink/80 to-transparent pt-12">
          <p className="font-display text-sm tracking-tight text-paper">{work.title}</p>
          <span className="text-xs text-paper/80 hidden sm:inline">View</span>
        </div>
      </button>
    </div>
  )
}

/** Pixels per second each column travels at rest. */
const BASE_SPEED = 38
/** Resting tilt of the 3D stage, in degrees. */
const STAGE_TILT_X = 18
const STAGE_TILT_Z = -7

export default function VisualPlayground() {
  const rootRef = useRef<HTMLElement>(null)
  const [activeIndex, setActiveIndex] = useState<number | null>(null)
  const reduced = useReducedMotion()
  const columnCount = useColumnCount()
  const columns = useMemo(() => toColumns(designWorks, columnCount), [columnCount])

  const openAt = useCallback((i: number) => setActiveIndex(i), [])
  const close = useCallback(() => setActiveIndex(null), [])
  const prev = useCallback(
    () => setActiveIndex((i) => (i === null ? null : (i - 1 + designWorks.length) % designWorks.length)),
    []
  )
  const next = useCallback(
    () => setActiveIndex((i) => (i === null ? null : (i + 1) % designWorks.length)),
    []
  )

  useEffect(() => {
    const root = rootRef.current
    if (!root || reduced) return

    const frame = root.querySelector<HTMLElement>('.vp-frame')
    if (!frame) return

    // One frame loop drives every column, so nothing competes and every change eases smoothly.
    // Even columns drift up, odd columns drift down; scrolling pushes all of them with the page.
    const loops = gsap.utils.toArray<HTMLElement>('.vp-col', root).map((col, c) => {
      const track = col.querySelector<HTMLElement>('.vp-track')!
      const dir = c % 2 === 0 ? -1 : 1
      return {
        col,
        track,
        dir,
        half: track.offsetHeight / 2,
        y: dir < 0 ? 0 : -track.offsetHeight / 4,
        slow: 0, // 0 = full speed, 1 = hovered
        slowTarget: 0,
        // Each column bends a different amount with scroll speed, like paper strips in a draft.
        bend: [1, -0.7, 0.8, -1][c % 4],
        setY: gsap.quickSetter(track, 'y', 'px') as (v: number) => void,
        setSkew: gsap.quickSetter(col, 'skewY', 'deg') as (v: number) => void,
      }
    })

    // Tile heights change with width; keep the loop length in sync.
    const ro = new ResizeObserver(() => loops.forEach((l) => (l.half = l.track.offsetHeight / 2)))
    loops.forEach((l) => ro.observe(l.track))

    // Hovering a column slows it right down (never a hard stop) so a piece can be looked at.
    const hoverCol = (target: EventTarget | null) => {
      const col = target instanceof Element ? target.closest('.vp-col') : null
      loops.forEach((l) => (l.slowTarget = l.col === col ? 1 : 0))
    }
    const onMove = (e: PointerEvent) => hoverCol(e.target)
    const onLeave = () => hoverCol(null)
    const onFocus = (e: FocusEvent) => hoverCol(e.target)
    frame.addEventListener('pointermove', onMove)
    frame.addEventListener('pointerleave', onLeave)
    frame.addEventListener('focusin', onFocus)
    frame.addEventListener('focusout', onLeave)
    window.addEventListener('blur', onLeave)

    let active = false
    let lastScroll = window.scrollY
    let scrollVel = 0

    const tick = (_time: number, deltaMs: number) => {
      if (!active) return
      const dt = Math.min(deltaMs, 64) / 1000
      if (dt <= 0) return
      const sy = window.scrollY
      const raw = (sy - lastScroll) / dt
      lastScroll = sy
      // Frame-rate independent smoothing.
      scrollVel += (raw - scrollVel) * (1 - Math.exp(-dt * 6))
      const ease = 1 - Math.exp(-dt * 5)
      const skew = gsap.utils.clamp(-6, 6, scrollVel / 450)

      loops.forEach((l) => {
        l.slow += (l.slowTarget - l.slow) * ease
        const speedFactor = 1 - 0.88 * l.slow
        const v = (BASE_SPEED * l.dir - scrollVel * 0.3) * speedFactor
        l.y = gsap.utils.wrap(-l.half, 0, l.y + v * dt)
        l.setY(l.y)
        l.setSkew(skew * l.bend * speedFactor)
      })
    }
    gsap.ticker.add(tick)

    // Only run while the section is on screen.
    const st = ScrollTrigger.create({
      trigger: root,
      start: 'top bottom',
      end: 'bottom top',
      onToggle: (self) => {
        active = self.isActive
        lastScroll = window.scrollY
        scrollVel = 0
      },
    })
    active = st.isActive

    return () => {
      gsap.ticker.remove(tick)
      st.kill()
      ro.disconnect()
      frame.removeEventListener('pointermove', onMove)
      frame.removeEventListener('pointerleave', onLeave)
      frame.removeEventListener('focusin', onFocus)
      frame.removeEventListener('focusout', onLeave)
      window.removeEventListener('blur', onLeave)
      loops.forEach((l) => gsap.set([l.track, l.col], { clearProps: 'transform' }))
    }
  }, [columnCount, reduced])

  // Opening the viewer moves the pointer off the wall; let every column pick back up.
  useEffect(() => {
    if (activeIndex === null) return
    rootRef.current?.querySelector('.vp-frame')?.dispatchEvent(new PointerEvent('pointerleave'))
  }, [activeIndex])

  const sizes = '(min-width: 1024px) 380px, 46vw'

  return (
    <section id="design" ref={rootRef} className="relative py-28 md:py-40 px-6 md:px-16 lg:px-24 overflow-hidden">
      <div className="max-w-6xl mx-auto">
        <div className="mb-14 md:mb-20">
          <p className="font-mono text-[11px] tracking-[0.22em] uppercase text-muted mb-4">
            Visual Archive / 001–015
          </p>
          <h2 className="font-display text-4xl md:text-6xl tracking-tighter leading-none max-w-3xl">
            The Visual Playground
          </h2>
          <p className="mt-3 font-display text-2xl md:text-3xl tracking-tight text-ink/55">
            15 pieces. One imagination.
          </p>
          <p className="mt-6 max-w-xl text-[15px] leading-relaxed text-ink/70">
            Beyond the interface and into the visual world — a collection of graphic design
            experiments, compositions, and ideas. Hover a column to slow it down.
          </p>
        </div>

        <div
          className={`vp-frame relative ${reduced ? '' : 'h-[85vh] min-h-[520px] max-h-[960px] overflow-hidden'}`}
          style={reduced ? undefined : { perspective: '1400px' }}
        >
        {!reduced && (
          <>
            {/* Soft fade at the edges (cheaper than a CSS mask over moving content). */}
            <div aria-hidden="true" className="pointer-events-none absolute inset-x-0 top-0 h-24 md:h-32 z-10 bg-gradient-to-b from-paper" />
            <div aria-hidden="true" className="pointer-events-none absolute inset-x-0 bottom-0 h-24 md:h-32 z-10 bg-gradient-to-t from-paper" />
          </>
        )}
        <div
          className="vp-stage flex gap-4 md:gap-6 items-start"
          style={
            reduced
              ? undefined
              : {
                  // Scaled up so the tilted edges never reveal the background.
                  transform: `rotateX(${STAGE_TILT_X}deg) rotateZ(${STAGE_TILT_Z}deg) scale(1.3)`,
                  transformOrigin: '50% 40%',
                }
          }
        >
          {columns.map((col, c) => (
            <div key={c} className="vp-col flex-1 min-w-0">
              <div className="vp-track will-change-transform">
                {col.map(({ work, index }) => (
                  <Tile key={work.id} work={work} index={index} sizes={sizes} onOpen={openAt} />
                ))}
                {!reduced &&
                  col.map(({ work, index }) => (
                    <Tile key={`${work.id}-copy`} work={work} index={index} sizes={sizes} onOpen={openAt} duplicate />
                  ))}
              </div>
            </div>
          ))}
        </div>
        </div>
      </div>

      {activeIndex !== null && (
        <Lightbox works={designWorks} index={activeIndex} onClose={close} onPrev={prev} onNext={next} />
      )}
    </section>
  )
}
