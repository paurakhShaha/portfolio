import { useEffect, useRef } from 'react'
import gsap from 'gsap'

const lines = [
  { text: 'I LIKE MAKING THINGS.', weight: 'font-semibold' },
  { text: 'THEN MAKING THEM WORK.', weight: 'font-medium' },
  { text: 'THEN MAKING THEM FEEL ALIVE.', weight: 'font-semibold' },
]

export default function Manifesto() {
  const rootRef = useRef<HTMLElement>(null)

  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.utils.toArray<HTMLElement>('.manifesto-line').forEach((el, i) => {
        gsap.fromTo(
          el,
          { x: i % 2 === 0 ? -80 : 80, opacity: 0.15 },
          {
            x: 0,
            opacity: 1,
            ease: 'none',
            scrollTrigger: {
              trigger: el,
              start: 'top 85%',
              end: 'top 35%',
              scrub: 1,
            },
          }
        )
      })

      gsap.from('.manifesto-body', {
        opacity: 0,
        y: 40,
        scrollTrigger: {
          trigger: '.manifesto-body',
          start: 'top 80%',
          end: 'top 50%',
          scrub: 1,
        },
      })
    }, rootRef)

    return () => ctx.revert()
  }, [])

  return (
    <section
      id="about"
      ref={rootRef}
      className="relative py-32 md:py-48 px-6 md:px-16 lg:px-24 overflow-hidden"
    >
      <div className="max-w-6xl mx-auto">
        <p className="font-mono text-[10px] tracking-[0.22em] uppercase text-muted mb-16">
          01 — Manifesto
        </p>

        <div className="space-y-4 md:space-y-6">
          {lines.map((line, i) => (
            <h2
              key={i}
              className={`manifesto-line font-display ${line.weight} text-[clamp(1.8rem,6vw,4.5rem)] leading-[1.05] tracking-tighter`}
            >
              {line.text}
            </h2>
          ))}
        </div>

        <div className="manifesto-body mt-20 md:mt-28 max-w-2xl grid gap-6">
          <p className="font-serif text-lg md:text-xl leading-relaxed text-ink/75">
            I care about the moment when something stops being a prototype and starts feeling
            inevitable — when the interface, the system, and the idea click into place.
          </p>
          <p className="text-[15px] leading-relaxed text-ink/55">
            My work sits between product engineering and creative technology: browser extensions
            that behave like small worlds, agent pipelines that actually deliver, and full-stack
            tools that stay understandable under the hood.
          </p>
        </div>
      </div>
    </section>
  )
}
