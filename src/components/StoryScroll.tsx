import { useEffect, useRef, useState } from 'react'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { ArrowDown, ArrowRight, ExternalLink, Github } from 'lucide-react'
import { projects, type Project } from '../data/projects'
import { journey, journeyIntro, journeyOutro, type JourneyChapter } from '../data/journey'
import { setScrollGuard } from '../lib/scrollGuard'

type Chapter = JourneyChapter & { project: Project }

const chapters: Chapter[] = journey.flatMap((c) => {
  const project = projects.find((p) => p.id === c.projectId)
  return project ? [{ ...c, project }] : []
})

const N = chapters.length
/** Timeline length of one chapter (wash in → content → hold). */
const SEG = 1.7
/** Where chapter 0 starts, after the intro card has had a moment. */
const START = 0.5
/** Scroll distance per timeline second, as a fraction of viewport height. */
const SCROLL_PER_SEC = 0.55
/**
 * Fastest the story may play, in timeline seconds per real second. 1 = the
 * pacing the tweens were designed at, however fast the visitor scrolls.
 */
const MAX_SPEED = 1.1
/** How far (in viewport heights) wheel scrolling may run ahead of the story. */
const SCROLL_LEAD = 0.35

/** Horizontal position (in % of the stage) of each node on the progress rail. */
const RAIL_LEFT = 10
const RAIL_RIGHT = 10
const nodeX = (i: number) => RAIL_LEFT + ((100 - RAIL_LEFT - RAIL_RIGHT) * i) / Math.max(1, N - 1)
const RAIL_Y = 90

const pad = (i: number) => String(i).padStart(2, '0')

function SplitChars({ text, className = '' }: { text: string; className?: string }) {
  const words = text.split(' ')
  return (
    <span className={className}>
      <span className="sr-only">{text}</span>
      <span aria-hidden="true">
        {words.map((word, wi) => (
          <span key={wi}>
            <span className="inline-block overflow-hidden whitespace-nowrap align-bottom pb-[0.12em] -mb-[0.12em]">
              {word.split('').map((ch, ci) => (
                <span key={ci} className="story-char inline-block will-change-transform">
                  {ch}
                </span>
              ))}
            </span>
            {wi < words.length - 1 ? ' ' : null}
          </span>
        ))}
      </span>
    </span>
  )
}

function StoryMedia({ chapter, index }: { chapter: Chapter; index: number }) {
  const { project, stageAccent } = chapter
  const [failed, setFailed] = useState(!project.coverImage)
  const host = project.githubUrl.replace(/^https?:\/\//, '')

  return (
    <div className="story-media relative w-full overflow-hidden border border-paper/15 bg-[#1d1d19] shadow-[0_40px_120px_-40px_rgba(0,0,0,0.8)]">
      {/* Browser chrome */}
      <div className="relative z-10 flex items-center gap-3 px-4 h-9 border-b border-paper/10 bg-[#141412]">
        <span className="flex gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-paper/20" />
          <span className="w-2.5 h-2.5 rounded-full bg-paper/20" />
          <span className="w-2.5 h-2.5 rounded-full" style={{ background: stageAccent }} />
        </span>
        <span className="flex-1 truncate font-mono text-[10px] tracking-[0.12em] text-paper/45">
          {host}
        </span>
        <span className="font-mono text-[10px] tracking-[0.18em] text-paper/35">{pad(index + 1)}</span>
      </div>

      <div className="relative aspect-[16/10] max-h-[44svh] w-full">
        {!failed && project.coverImage ? (
          <>
            {/* Blurred backdrop so portrait and landscape shots both fill the frame */}
            <img
              src={project.coverImage}
              alt=""
              aria-hidden="true"
              className="absolute inset-0 w-full h-full object-cover scale-125 blur-2xl opacity-40"
            />
            <img
              src={project.coverImage}
              alt={`${project.title} preview`}
              decoding="async"
              onError={() => setFailed(true)}
              className="story-shot absolute inset-0 w-full h-full object-contain p-4 drop-shadow-[0_20px_40px_rgba(0,0,0,0.5)]"
            />
          </>
        ) : (
          <div className="absolute inset-0 flex flex-col justify-between p-5 xl:p-8 overflow-hidden">
            <div
              aria-hidden="true"
              className="absolute inset-0 opacity-[0.07]"
              style={{
                backgroundImage:
                  'linear-gradient(rgba(247,244,233,1) 1px, transparent 1px), linear-gradient(90deg, rgba(247,244,233,1) 1px, transparent 1px)',
                backgroundSize: '28px 28px',
              }}
            />
            <span
              aria-hidden="true"
              className="pointer-events-none absolute -right-3 -bottom-10 font-display font-bold text-[clamp(7rem,16vw,15rem)] leading-none tracking-tighter text-transparent"
              style={{ WebkitTextStroke: `1.5px ${stageAccent}`, opacity: 0.45 }}
            >
              {project.number}
            </span>
            <div className="relative flex items-center justify-between font-mono text-[10px] tracking-[0.18em] uppercase text-paper/50">
              <span>{project.category}</span>
              <span>spec / {project.number}</span>
            </div>
            <div className="relative max-w-sm">
              <p className="font-display text-2xl xl:text-4xl tracking-tighter mb-3">{project.title}</p>
              <ul className="space-y-1.5">
                {project.features.slice(0, 3).map((f) => (
                  <li key={f} className="flex items-start gap-2.5 text-[12px] xl:text-[13px] text-paper/70">
                    <span className="mt-[0.5em] w-1.5 h-1.5 shrink-0" style={{ background: stageAccent }} />
                    {f}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

function Scene({ chapter, index }: { chapter: Chapter; index: number }) {
  const { project, stageAccent } = chapter
  return (
    <article
      className="story-scene absolute inset-0 flex items-center pt-24 pb-[17svh]"
      style={{ paddingLeft: `${RAIL_LEFT}%`, paddingRight: `${RAIL_RIGHT}%` }}
      aria-label={`Chapter ${index + 1}: ${project.title}`}
    >
      <div className="grid grid-cols-12 gap-10 xl:gap-16 w-full items-center">
        <div className="col-span-5">
          <p className="story-reveal font-mono text-[11px] tracking-[0.22em] uppercase text-paper/50 mb-[2.5svh]">
            <span style={{ color: stageAccent }}>Chapter {pad(index + 1)}</span>
            <span className="mx-2 text-paper/25">/</span>
            {project.category}
          </p>
          <h3 className="font-display font-medium text-[clamp(2.4rem,min(4.6vw,8.5svh),5rem)] leading-[0.95] tracking-tighter">
            <SplitChars text={chapter.headline} />
          </h3>

          <p
            className="story-reveal mt-[3svh] font-display text-2xl tracking-tight whitespace-nowrap"
            style={{ color: stageAccent }}
          >
            {project.title}
          </p>
          <p className="story-reveal mt-3 max-w-md text-[14px] xl:text-[15px] leading-relaxed text-paper/70">
            {chapter.narrative}
          </p>

          <div className="story-reveal mt-[2.5svh] flex flex-wrap gap-1.5 max-w-md">
            {project.technologies.slice(0, 4).map((t) => (
              <span
                key={t}
                className="px-2 py-0.5 font-mono text-[10px] tracking-wide border border-paper/15 text-paper/70"
              >
                {t}
              </span>
            ))}
          </div>

          <div className="story-reveal mt-[3svh] flex flex-wrap gap-3">
            <a
              href={project.githubUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-4 py-2.5 font-mono text-[11px] tracking-[0.12em] uppercase text-ink transition-transform hover:-translate-y-0.5"
              style={{ background: stageAccent }}
              data-cursor="OPEN"
            >
              <Github size={14} /> Source
            </a>
            {project.liveUrl && (
              <a
                href={project.liveUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-4 py-2.5 border border-paper/25 font-mono text-[11px] tracking-[0.12em] uppercase hover:border-paper transition-colors"
                data-cursor="OPEN"
              >
                <ExternalLink size={14} /> Live demo
              </a>
            )}
          </div>
        </div>

        <div className="col-span-7 [perspective:1400px]">
          <div className="story-media-wrap relative">
            <div
              aria-hidden="true"
              className="absolute -inset-10 rounded-full blur-3xl opacity-25"
              style={{ background: `radial-gradient(closest-side, ${stageAccent}, transparent)` }}
            />
            <StoryMedia chapter={chapter} index={index} />
          </div>

          <div className="story-reveal relative mt-3 border border-paper/10 bg-[#11110f] px-4 py-2.5 font-mono text-[11px] xl:text-[12px] leading-[1.8] text-paper/70">
            {chapter.log.map((line, li) => (
              <div key={li} className="flex gap-2">
                <span style={{ color: stageAccent }} className="shrink-0">
                  $
                </span>
                <span className="story-log-line block whitespace-nowrap overflow-hidden">{line}</span>
              </div>
            ))}
            <span
              aria-hidden="true"
              className="story-caret absolute right-4 bottom-3 w-2 h-3.5"
              style={{ background: stageAccent }}
            />
          </div>
        </div>
      </div>
    </article>
  )
}

export default function StoryScroll() {
  const pinRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const stage = pinRef.current
    if (!stage) return

    let tick: ((time: number, deltaMs: number) => void) | null = null
    const ctx = gsap.context(() => {
      const q = gsap.utils.selector(stage)
      const scenes = q('.story-scene')
      const washes = q('.story-wash')
      const keywords = q('.story-keyword')
      const nodes = q('.story-node')
      const nodeLabels = q('.story-node-label')
      const intro = q('.story-intro')[0]
      const outro = q('.story-outro')[0]

      gsap.set(scenes, { autoAlpha: 0 })
      gsap.set(keywords, { autoAlpha: 0 })
      gsap.set(washes, { clipPath: (i: number) => `circle(0% at ${nodeX(i)}% ${RAIL_Y}%)` })
      gsap.set(outro, { autoAlpha: 0, clipPath: `circle(0% at 50% ${RAIL_Y}%)` })
      gsap.set(stage, { '--story-accent': chapters[0]?.stageAccent ?? '#F7F4E9' })

      const tl = gsap.timeline({ paused: true, defaults: { ease: 'none' } })

      // Intro card drifts back as the first wash approaches.
      tl.to(intro, { scale: 0.92, autoAlpha: 0.25, filter: 'blur(6px)', duration: START + 0.45 }, 0)

      chapters.forEach((c, i) => {
        const t = START + i * SEG
        const swap = t + 0.45
        const scene = scenes[i]
        const wash = washes[i]
        const s = gsap.utils.selector(scene)

        // 1. Accent wash floods the stage from this chapter's rail node.
        tl.to(wash, { clipPath: `circle(150% at ${nodeX(i)}% ${RAIL_Y}%)`, duration: 0.45, ease: 'power2.in' }, t)
        tl.fromTo(
          wash.querySelectorAll('.story-wash-line'),
          { yPercent: 100 },
          { yPercent: 0, stagger: 0.05, duration: 0.3, ease: 'power3.out' },
          t + 0.15
        )

        // 2. Swap scenes while fully covered.
        tl.set(i === 0 ? intro : scenes[i - 1], { autoAlpha: 0 }, swap)
        tl.set(scene, { autoAlpha: 1 }, swap)
        tl.to(stage, { '--story-accent': c.stageAccent, duration: 0.01 }, swap)
        if (i > 0) tl.set(keywords[i - 1], { autoAlpha: 0 }, swap)
        tl.set(keywords[i], { autoAlpha: 1 }, swap)
        tl.fromTo(keywords[i], { xPercent: 8 }, { xPercent: -22, duration: SEG }, swap)
        tl.to(q('.story-count-col'), { yPercent: -(i * 100) / N, duration: 0.25, ease: 'power2.inOut' }, swap)
        tl.to(nodes[i], { scale: 1, backgroundColor: c.stageAccent, borderColor: c.stageAccent, duration: 0.2 }, swap)
        tl.to(nodeLabels[i], { color: c.stageAccent, opacity: 1, duration: 0.2 }, swap)
        if (i > 0) {
          tl.to(nodes[i - 1], { scale: 0.55, duration: 0.2 }, swap)
          tl.to(nodeLabels[i - 1], { opacity: 0.45, duration: 0.2 }, swap)
        }

        // 3. Wash collapses toward the opposite corner, revealing the chapter.
        tl.to(
          wash,
          { clipPath: `circle(0% at ${100 - nodeX(i)}% 8%)`, duration: 0.5, ease: 'power2.out' },
          swap + 0.1
        )

        // 4. Chapter content assembles.
        tl.fromTo(
          s('.story-char'),
          { yPercent: 120, rotate: 8 },
          { yPercent: 0, rotate: 0, stagger: 0.012, duration: 0.4, ease: 'power3.out' },
          swap + 0.15
        )
        tl.fromTo(
          s('.story-reveal'),
          { y: 28, autoAlpha: 0 },
          { y: 0, autoAlpha: 1, stagger: 0.05, duration: 0.35, ease: 'power2.out' },
          swap + 0.25
        )
        tl.fromTo(
          s('.story-media'),
          { clipPath: 'inset(42% 42% 42% 42%)', rotateX: 22, rotateY: -10, scale: 0.86 },
          {
            clipPath: 'inset(0% 0% 0% 0%)',
            rotateX: 0,
            rotateY: 0,
            scale: 1,
            duration: 0.6,
            ease: 'power3.out',
          },
          swap + 0.12
        )
        // Slow parallax drift during the hold.
        tl.fromTo(s('.story-media-wrap'), { y: 24 }, { y: -24, duration: SEG - 0.3 }, swap + 0.2)
        s('.story-log-line').forEach((line, li) => {
          const len = Math.max(4, line.textContent?.length ?? 10)
          tl.fromTo(
            line,
            { clipPath: 'inset(0% 100% 0% 0%)' },
            { clipPath: 'inset(0% 0% 0% 0%)', duration: 0.22, ease: `steps(${len})` },
            swap + 0.5 + li * 0.2
          )
        })
      })

      // Progress rail fills across the whole journey.
      tl.fromTo(
        q('.story-rail-fill'),
        { scaleX: 0 },
        { scaleX: 1, duration: (N - 1) * SEG },
        START + 0.45
      )

      // Outro: paper floods in so the pin hands off seamlessly to the next (paper) section.
      const outroAt = START + N * SEG
      tl.addLabel('outro', outroAt)
      tl.to(outro, { autoAlpha: 1, duration: 0.01 }, outroAt)
      tl.to(outro, { clipPath: `circle(150% at 50% ${RAIL_Y}%)`, duration: 0.6, ease: 'power2.inOut' }, outroAt)
      tl.fromTo(
        q('.story-outro .story-char'),
        { yPercent: 120 },
        { yPercent: 0, stagger: 0.015, duration: 0.4, ease: 'power3.out' },
        outroAt + 0.35
      )
      tl.fromTo(
        q('.story-outro .story-reveal'),
        { y: 24, autoAlpha: 0 },
        { y: 0, autoAlpha: 1, stagger: 0.06, duration: 0.3, ease: 'power2.out' },
        outroAt + 0.5
      )
      tl.to({}, { duration: 0.5 }, outroAt + 0.8)

      const darkUntil = outroAt + 0.45
      const setDark = (on: boolean) => document.documentElement.classList.toggle('story-dark', on)

      // Scroll only sets where the story should be (`target`). The playhead walks
      // there at a capped speed, so a fast flick can't fast-forward the animation.
      let target = 0
      const st = ScrollTrigger.create({
        trigger: stage,
        start: 'top top',
        end: () => `+=${tl.duration() * window.innerHeight * SCROLL_PER_SEC}`,
        pin: true,
        // Measure the pin first so triggers created earlier (e.g. the body-wide
        // ScrollProgress bar) include its spacer in their positions.
        refreshPriority: 1,
        anticipatePin: 1,
        invalidateOnRefresh: true,
        onUpdate: (self) => {
          target = self.progress * tl.duration()
        },
      })
      target = st.progress * tl.duration()
      tl.time(target)

      tick = (_time: number, deltaMs: number) => {
        const dt = Math.min(deltaMs / 1000, 0.1)
        const now = tl.time()
        const diff = target - now

        if (diff !== 0) {
          const rect = stage.getBoundingClientRect()
          const offscreen = rect.bottom <= 0 || rect.top >= window.innerHeight
          if (offscreen || Math.abs(diff) < 0.0005) {
            // Nobody is watching (or we're there); land exactly on target.
            tl.time(target)
          } else {
            // Ease into the stop when close, never faster than MAX_SPEED when far.
            const speed = Math.min(MAX_SPEED, Math.abs(diff) * 5 + 0.05)
            tl.time(now + Math.sign(diff) * Math.min(Math.abs(diff), speed * dt))
          }
        }

        setDark(st.isActive && tl.time() < darkUntil)
      }
      gsap.ticker.add(tick)

      // Don't let a flick outrun the story: wheel scrolling may only lead the
      // playhead by SCROLL_LEAD viewports, then waits for it to catch up.
      setScrollGuard((dy, from) => {
        const dur = tl.duration()
        const now = tl.time()
        const posAt = (t: number) => st.start + (t / dur) * (st.end - st.start)
        const lead = window.innerHeight * SCROLL_LEAD
        if (dy > 0) {
          if (now >= dur - 0.001 || from >= st.end) return dy
          const max = posAt(now) + lead
          return from + dy <= max ? dy : Math.max(0, max - from)
        }
        if (now <= 0.001 || from <= st.start) return dy
        const min = posAt(now) - lead
        return from + dy >= min ? dy : Math.min(0, min - from)
      })

      // Blinking terminal carets (independent of scroll).
      gsap.to(q('.story-caret'), { opacity: 0, repeat: -1, yoyo: true, duration: 0.5, ease: 'steps(1)' })
    }, stage)

    ScrollTrigger.refresh()

    return () => {
      if (tick) gsap.ticker.remove(tick)
      setScrollGuard(null)
      ctx.revert()
      document.documentElement.classList.remove('story-dark')
    }
  }, [])

  const goContact = () => document.getElementById('contact')?.scrollIntoView({ behavior: 'smooth' })

  return (
    // The outer div stays React-owned; GSAP wraps the inner stage in its pin spacer.
    <div className="relative">
      <div
        ref={pinRef}
        className="story-stage relative h-[100svh] w-full overflow-hidden bg-ink text-paper"
      >
        {/* Blueprint grid */}
        <div
          aria-hidden="true"
          className="absolute inset-0 opacity-[0.045]"
          style={{
            backgroundImage:
              'linear-gradient(rgba(247,244,233,1) 1px, transparent 1px), linear-gradient(90deg, rgba(247,244,233,1) 1px, transparent 1px)',
            backgroundSize: '64px 64px',
          }}
        />
        {/* Accent glow that follows the active chapter */}
        <div
          aria-hidden="true"
          className="absolute -right-[20%] top-[10%] w-[70vw] h-[70vw] rounded-full blur-[120px] opacity-[0.12] transition-none"
          style={{ background: 'radial-gradient(closest-side, var(--story-accent), transparent)' }}
        />

        {/* Giant drifting keywords */}
        <div aria-hidden="true" className="absolute inset-0 flex items-center pointer-events-none">
          {chapters.map((c) => (
            <span
              key={c.projectId}
              className="story-keyword absolute left-0 whitespace-nowrap font-display font-bold leading-none tracking-tighter text-[19vw] text-transparent"
              style={{ WebkitTextStroke: '1px rgba(247,244,233,0.09)' }}
            >
              {c.keyword}
            </span>
          ))}
        </div>

        {/* Intro card */}
        <div
          className="story-intro absolute inset-0 flex flex-col justify-center pb-24"
          style={{ paddingLeft: `${RAIL_LEFT}%`, paddingRight: `${RAIL_RIGHT}%` }}
        >
          <p className="font-mono text-[11px] tracking-[0.24em] uppercase text-paper/50 mb-8">
            {journeyIntro.kicker} · {pad(N)} entries
          </p>
          <h3 className="font-display font-medium text-[clamp(3rem,7vw,7.5rem)] leading-[0.92] tracking-tighter whitespace-pre-line">
            {journeyIntro.title}
          </h3>
          <p className="mt-8 max-w-lg font-serif text-xl leading-relaxed text-paper/60">{journeyIntro.body}</p>
          <p className="mt-12 inline-flex items-center gap-3 font-mono text-[11px] tracking-[0.2em] uppercase text-paper/45">
            <ArrowDown size={14} className="animate-bounce" /> Scroll to read the log
          </p>
        </div>

        {chapters.map((c, i) => (
          <Scene key={c.projectId} chapter={c} index={i} />
        ))}

        {/* HUD */}
        <div
          className="absolute top-0 inset-x-0 z-30 flex items-center justify-between pt-8 pointer-events-none"
          style={{ paddingLeft: `${RAIL_LEFT}%`, paddingRight: `${RAIL_RIGHT}%` }}
          aria-hidden="true"
        >
          <span className="font-mono text-[11px] tracking-[0.24em] uppercase text-paper/50">
            02 — Project Worlds
          </span>
          <span className="flex items-center gap-2 font-mono text-[11px] tracking-[0.2em] text-paper/50">
            CH
            <span className="relative inline-block h-[1.9em] overflow-hidden font-display text-2xl leading-[1.9em] tracking-tighter text-paper">
              <span className="story-count-col block">
                {chapters.map((_, i) => (
                  <span key={i} className="block tabular-nums" style={{ color: chapters[i].stageAccent }}>
                    {pad(i + 1)}
                  </span>
                ))}
              </span>
            </span>
            / {pad(N)}
          </span>
        </div>

        {/* Progress rail */}
        <div className="absolute inset-0 z-30 pointer-events-none" aria-hidden="true">
          <div
            className="absolute h-px bg-paper/15"
            style={{ left: `${RAIL_LEFT}%`, right: `${RAIL_RIGHT}%`, top: `${RAIL_Y}%` }}
          >
            <div
              className="story-rail-fill absolute inset-0 origin-left"
              style={{ background: 'var(--story-accent)' }}
            />
          </div>
          {chapters.map((c, i) => (
            <div
              key={c.projectId}
              className="absolute -translate-x-1/2 flex flex-col items-center"
              style={{ left: `${nodeX(i)}%`, top: `calc(${RAIL_Y}% - 6px)` }}
            >
              <span className="story-node block w-3 h-3 rounded-full border border-paper/40 bg-ink scale-[0.55]" />
              <span className="story-node-label mt-3 font-mono text-[10px] tracking-[0.18em] uppercase text-paper/45 whitespace-nowrap">
                {pad(i + 1)} {c.project.title}
              </span>
            </div>
          ))}
        </div>

        {/* Chapter washes: full-stage accent floods used as transitions */}
        {chapters.map((c, i) => (
          <div
            key={c.projectId}
            aria-hidden="true"
            className="story-wash absolute inset-0 z-40 flex flex-col items-center justify-center pointer-events-none text-ink"
            style={{ background: c.stageAccent }}
          >
            <span className="overflow-hidden">
              <span className="story-wash-line block font-mono text-[12px] tracking-[0.3em] uppercase">
                Chapter {pad(i + 1)} — {c.project.title}
              </span>
            </span>
            <span className="overflow-hidden">
              <span className="story-wash-line block font-display font-bold text-[clamp(6rem,18vw,18rem)] leading-[0.9] tracking-tighter">
                {c.keyword.length > 7 ? pad(i + 1) : c.keyword}
              </span>
            </span>
          </div>
        ))}

        {/* Outro: paper flood, hands off to the next section */}
        <div className="story-outro absolute inset-0 z-50 flex flex-col items-center justify-center text-center bg-paper text-ink px-6">
          <p className="story-reveal font-mono text-[11px] tracking-[0.24em] uppercase text-muted mb-6">
            {journeyOutro.kicker} · loading<span className="story-caret inline-block w-1.5 h-3 ml-1 bg-ink align-middle" />
          </p>
          <h3 className="font-display font-medium text-[clamp(3rem,7vw,7rem)] leading-[0.95] tracking-tighter">
            <SplitChars text={journeyOutro.title} />
          </h3>
          <p className="story-reveal mt-6 max-w-md font-serif text-xl text-ink/65">{journeyOutro.body}</p>
          <button
            type="button"
            onClick={goContact}
            className="story-reveal mt-10 inline-flex items-center gap-2 px-5 py-3 bg-ink text-paper font-mono text-[11px] tracking-[0.14em] uppercase hover:bg-cobalt transition-colors"
            data-cursor="GO"
          >
            {journeyOutro.cta} <ArrowRight size={14} />
          </button>
        </div>
      </div>
    </div>
  )
}
