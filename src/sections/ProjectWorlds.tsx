import { useEffect, useRef } from 'react'
import gsap from 'gsap'
import { ExternalLink, Github } from 'lucide-react'
import { projects, type Project } from '../data/projects'

function ProjectCard({ project }: { project: Project }) {
  const cardRef = useRef<HTMLElement>(null)

  useEffect(() => {
    const el = cardRef.current
    if (!el) return

    const ctx = gsap.context(() => {
      const tl = gsap.timeline({
        scrollTrigger: {
          trigger: el,
          start: 'top 80%',
          end: 'top 25%',
          scrub: 1.1,
        },
      })

      tl.from(el.querySelectorAll('.reveal-num'), {
        y: 60,
        opacity: 0,
        duration: 1,
      })
        .from(
          el.querySelectorAll('.reveal-title'),
          { y: 40, opacity: 0, duration: 1 },
          '-=0.7'
        )
        .from(
          el.querySelectorAll('.reveal'),
          { y: 28, opacity: 0, stagger: 0.06, duration: 0.8 },
          '-=0.5'
        )

      gsap.fromTo(
        el.querySelector('.accent-wash'),
        { scaleX: 0 },
        {
          scaleX: 1,
          ease: 'none',
          scrollTrigger: {
            trigger: el,
            start: 'top 70%',
            end: 'top 40%',
            scrub: true,
          },
        }
      )
    }, el)

    return () => ctx.revert()
  }, [])

  return (
    <article
      ref={cardRef}
      className="relative py-24 md:py-36 border-t border-ink/10"
      style={{ ['--accent' as string]: project.accent }}
    >
      <div
        className="accent-wash absolute left-0 top-0 h-full w-1 origin-top scale-x-0"
        style={{ background: project.accent }}
        aria-hidden="true"
      />

      <div className="max-w-6xl mx-auto px-6 md:px-0 grid lg:grid-cols-12 gap-10 lg:gap-16">
        <div className="lg:col-span-4">
          <p className="reveal-num font-mono text-[11px] tracking-[0.2em] text-muted mb-4">
            WORLD {project.number}
          </p>
          <h3 className="reveal-title font-display text-4xl md:text-5xl tracking-tighter leading-none">
            {project.title}
          </h3>
          <p className="reveal mt-3 font-mono text-[10px] tracking-[0.14em] uppercase text-muted">
            {project.category}
          </p>

          <div className="reveal mt-8 flex flex-wrap gap-2">
            {project.technologies.map((t) => (
              <span
                key={t}
                className="px-2.5 py-1 font-mono text-[10px] tracking-wide border border-ink/15"
              >
                {t}
              </span>
            ))}
          </div>

          <div className="reveal mt-10 flex flex-wrap gap-3">
            <a
              href={project.githubUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-4 py-2.5 bg-ink text-paper font-mono text-[11px] tracking-[0.12em] uppercase hover:bg-cobalt transition-colors"
              data-cursor="OPEN"
            >
              <Github size={14} /> Source
            </a>
            {project.liveUrl && (
              <a
                href={project.liveUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-4 py-2.5 border border-ink/25 font-mono text-[11px] tracking-[0.12em] uppercase hover:border-ink transition-colors"
                data-cursor="OPEN"
              >
                <ExternalLink size={14} /> Live demo
              </a>
            )}
          </div>
        </div>

        <div className="lg:col-span-8">
          <div
            className="reveal relative aspect-[16/9] mb-10 overflow-hidden border border-ink/10"
            style={{ background: project.accentSoft }}
          >
            {project.coverImage ? (
              <img
                src={project.coverImage}
                alt={`${project.title} preview`}
                loading="lazy"
                decoding="async"
                className="absolute inset-0 w-full h-full object-contain"
                onError={(e) => {
                  // Hide broken image so the fallback number shows
                  const t = e.currentTarget
                  t.style.display = 'none'
                  const fb = t.parentElement?.querySelector('[data-fallback]')
                  if (fb) (fb as HTMLElement).style.display = 'flex'
                }}
              />
            ) : null}
            <div
              data-fallback
              className="absolute inset-0 flex items-center justify-center"
              style={{ display: project.coverImage ? 'none' : 'flex' }}
            >
              <div className="text-center px-6">
                <span
                  className="font-display text-6xl md:text-8xl tracking-tighter opacity-25"
                  style={{ color: project.accent }}
                >
                  {project.number}
                </span>
                <p className="mt-2 font-mono text-[11px] tracking-[0.15em] uppercase text-ink/40">
                  {project.title}
                </p>
              </div>
            </div>
            <span className="absolute top-3 left-3 w-3 h-3 border-t border-l border-ink/20" />
            <span className="absolute top-3 right-3 w-3 h-3 border-t border-r border-ink/20" />
            <span className="absolute bottom-3 left-3 w-3 h-3 border-b border-l border-ink/20" />
            <span className="absolute bottom-3 right-3 w-3 h-3 border-b border-r border-ink/20" />
          </div>

          <p className="reveal font-serif text-lg md:text-xl leading-relaxed text-ink/80 mb-6">
            {project.shortDescription}
          </p>
          <p className="reveal text-[15px] leading-relaxed text-ink/55 mb-8">
            {project.description}
          </p>

          <div className="reveal grid sm:grid-cols-2 gap-8">
            <div>
              <p className="font-mono text-[10px] tracking-[0.16em] uppercase text-muted mb-3">
                Problem
              </p>
              <p className="text-sm leading-relaxed text-ink/65">{project.problem}</p>
            </div>
            <div>
              <p className="font-mono text-[10px] tracking-[0.16em] uppercase text-muted mb-3">
                Approach
              </p>
              <p className="text-sm leading-relaxed text-ink/65">{project.approach}</p>
            </div>
          </div>

          <ul className="reveal mt-8 space-y-2">
            {project.features.map((f) => (
              <li key={f} className="flex items-start gap-3 text-sm text-ink/70">
                <span
                  className="mt-1.5 w-1.5 h-1.5 rounded-full shrink-0"
                  style={{ background: project.accent }}
                />
                {f}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </article>
  )
}

export default function ProjectWorlds() {
  const headerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.from(headerRef.current, {
        y: 50,
        opacity: 0,
        duration: 1,
        ease: 'power3.out',
        scrollTrigger: {
          trigger: headerRef.current,
          start: 'top 85%',
          toggleActions: 'play none none reverse',
        },
      })
    })
    return () => ctx.revert()
  }, [])

  return (
    <section id="projects" className="relative">
      <div ref={headerRef} className="px-6 md:px-16 lg:px-24 pt-24 pb-8">
        <p className="font-mono text-[10px] tracking-[0.22em] uppercase text-muted mb-4">
          02 — Project Worlds
        </p>
        <h2 className="font-display text-4xl md:text-6xl tracking-tighter leading-none max-w-2xl">
          Every project is a world.
          <br />
          <span className="text-ink/40">Every scroll opens a new one.</span>
        </h2>
      </div>

      <div className="px-6 md:px-16 lg:px-24">
        {projects.map((p) => (
          <ProjectCard key={p.id} project={p} />
        ))}
      </div>
    </section>
  )
}
