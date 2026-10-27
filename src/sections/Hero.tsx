import { useEffect, useRef } from 'react'
import gsap from 'gsap'
import { personal } from '../data/projects'

interface Props {
  reducedMotion: boolean
}

export default function Hero({ reducedMotion }: Props) {
  const rootRef = useRef<HTMLElement>(null)
  const lineRef = useRef<SVGPathElement>(null)
  const nameRef = useRef<HTMLHeadingElement>(null)

  useEffect(() => {
    if (reducedMotion) return
    const ctx = gsap.context(() => {
      const tl = gsap.timeline({ defaults: { ease: 'power3.out' } })

      tl.from('.hero-label', { opacity: 0, y: 12, duration: 0.7 })
        .from('.hero-issue', { opacity: 0, duration: 0.5 }, '-=0.3')
        .from(
          nameRef.current?.querySelectorAll('.char') || [],
          {
            y: 80,
            opacity: 0,
            rotateX: -40,
            stagger: 0.04,
            duration: 0.9,
            ease: 'power4.out',
          },
          '-=0.2'
        )
        .from('.hero-tag', { opacity: 0, y: 20, duration: 0.7 }, '-=0.4')
        .from('.hero-support', { opacity: 0, y: 16, duration: 0.6 }, '-=0.3')
        .from('.hero-cta', { opacity: 0, y: 12, stagger: 0.1, duration: 0.5 }, '-=0.2')

      if (lineRef.current) {
        const length = lineRef.current.getTotalLength()
        gsap.set(lineRef.current, {
          strokeDasharray: length,
          strokeDashoffset: length,
        })
        gsap.to(lineRef.current, {
          strokeDashoffset: 0,
          duration: 1.4,
          ease: 'power2.inOut',
          delay: 0.3,
        })
      }
    }, rootRef)

    return () => ctx.revert()
  }, [reducedMotion])

  const nameChars = personal.name.split('').map((c, i) => (
    <span key={i} className="char inline-block" style={{ transformOrigin: '50% 100%' }}>
      {c === ' ' ? '\u00A0' : c}
    </span>
  ))

  return (
    <section
      id="intro"
      ref={rootRef}
      className="relative min-h-screen flex flex-col justify-center px-6 md:px-16 lg:px-24 pt-24 pb-20 overflow-hidden"
    >
      {/* Editorial labels */}
      <div className="absolute top-8 left-6 md:left-16 lg:left-24 flex items-center gap-4">
        <span className="hero-label font-mono text-[10px] tracking-[0.22em] uppercase text-muted">
          An independent digital practice
        </span>
        <span className="hero-issue font-mono text-[10px] tracking-[0.18em] text-muted">
          ISSUE 01 / 2026
        </span>
      </div>

      {/* Hand-drawn line */}
      <svg
        className="absolute top-[18%] left-6 md:left-16 w-[min(420px,70vw)] h-8 pointer-events-none"
        viewBox="0 0 420 20"
        fill="none"
        aria-hidden="true"
      >
        <path
          ref={lineRef}
          d="M2 12 C 60 2, 120 18, 180 8 S 300 16, 418 6"
          stroke="#171714"
          strokeWidth="1.2"
          strokeLinecap="round"
        />
      </svg>

      <div className="relative z-10 max-w-6xl">
        <h1
          ref={nameRef}
          className="font-display font-semibold text-[clamp(3.2rem,12vw,9.5rem)] leading-[0.88] tracking-tighter text-ink"
        >
          {nameChars}
        </h1>

        <p className="hero-tag mt-8 md:mt-10 font-serif text-xl md:text-2xl italic text-ink/80 max-w-md">
          {personal.tagline}
        </p>

        <p className="hero-support mt-5 max-w-lg text-[15px] leading-relaxed text-ink/60">
          {personal.intro}
        </p>

        <div className="hero-cta mt-10 flex flex-wrap gap-4">
          <a
            href="#projects"
            className="inline-flex items-center gap-2 px-6 py-3 bg-ink text-paper font-mono text-[11px] tracking-[0.16em] uppercase hover:bg-cobalt transition-colors"
            data-cursor="EXPLORE"
          >
            Explore my worlds
          </a>
          <a
            href="#contact"
            className="inline-flex items-center gap-2 px-6 py-3 border border-ink/25 font-mono text-[11px] tracking-[0.16em] uppercase hover:border-ink transition-colors"
            data-cursor="WRITE"
          >
            Let’s work together
          </a>
        </div>
      </div>

      {/* Decorative issue mark */}
      <div className="absolute bottom-10 right-6 md:right-16 font-mono text-[10px] tracking-[0.2em] text-muted vertical-text hidden md:block">
        SCROLL TO ENTER
      </div>
    </section>
  )
}
