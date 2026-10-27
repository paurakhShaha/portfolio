import { personal } from '../data/projects'
import { Github } from 'lucide-react'

export default function Closing() {
  return (
    <section
      id="contact"
      className="relative min-h-[70vh] flex flex-col justify-center px-6 md:px-16 lg:px-24 py-32"
    >
      <div className="max-w-6xl mx-auto w-full">
        <p className="font-mono text-[10px] tracking-[0.22em] uppercase text-muted mb-8">
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

        <div className="mt-12 flex flex-wrap gap-4">
          <a
            href={personal.github}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-7 py-3.5 bg-ink text-paper font-mono text-[11px] tracking-[0.16em] uppercase hover:bg-cobalt transition-colors"
            data-cursor="OPEN"
          >
            <Github size={15} /> Start a conversation
          </a>
          {personal.email && (
            <a
              href={`mailto:${personal.email}`}
              className="inline-flex items-center gap-2 px-7 py-3.5 border border-ink/25 font-mono text-[11px] tracking-[0.16em] uppercase hover:border-ink transition-colors"
              data-cursor="WRITE"
            >
              Email
            </a>
          )}
        </div>
      </div>
    </section>
  )
}
