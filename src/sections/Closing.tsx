import { personal } from '../data/projects'
import { ArrowUpRight, Github, Linkedin, Mail } from 'lucide-react'

export default function Closing() {
  return (
    <section
      id="contact"
      className="relative min-h-[70vh] flex flex-col justify-center px-6 md:px-16 lg:px-24 py-32"
    >
      <div className="max-w-6xl mx-auto w-full">
        <p className="font-mono text-[11px] tracking-[0.22em] uppercase text-muted mb-8">
          06 — The ending
        </p>
        <h2 className="font-display font-semibold text-[clamp(2.4rem,8vw,6rem)] leading-[0.95] tracking-tighter max-w-4xl">
          THE NEXT WORLD
          <br />
          COULD BE OURS.
        </h2>
        <p className="mt-8 max-w-md font-serif text-lg text-ink/70">
          Have an interesting idea, a team I could contribute to, or a project worth building?
          Let’s talk.
        </p>

        <a
          href={`mailto:${personal.email}`}
          className="group mt-12 inline-flex items-center gap-3 font-display text-[clamp(1.4rem,4.2vw,3rem)] tracking-tight break-all border-b-2 border-ink/15 hover:border-cobalt hover:text-cobalt transition-colors pb-1"
          data-cursor="WRITE"
        >
          {personal.email}
          <ArrowUpRight
            className="shrink-0 w-[0.8em] h-[0.8em] transition-transform group-hover:translate-x-1 group-hover:-translate-y-1"
            aria-hidden="true"
          />
        </a>

        <div className="mt-10 flex flex-wrap gap-4">
          <a
            href={`mailto:${personal.email}`}
            className="inline-flex items-center gap-2 px-7 py-3.5 bg-ink text-paper font-mono text-[11px] tracking-[0.16em] uppercase hover:bg-cobalt transition-colors"
            data-cursor="WRITE"
          >
            <Mail size={15} /> Email me
          </a>
          <a
            href={personal.linkedin}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-7 py-3.5 border border-ink/25 font-mono text-[11px] tracking-[0.16em] uppercase hover:border-ink transition-colors"
            data-cursor="OPEN"
          >
            <Linkedin size={15} /> LinkedIn
          </a>
          <a
            href={personal.github}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-7 py-3.5 border border-ink/25 font-mono text-[11px] tracking-[0.16em] uppercase hover:border-ink transition-colors"
            data-cursor="OPEN"
          >
            <Github size={15} /> GitHub
          </a>
        </div>
      </div>
    </section>
  )
}
