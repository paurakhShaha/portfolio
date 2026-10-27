import { personal } from '../data/projects'

export default function Footer() {
  return (
    <footer className="border-t border-ink/10 py-10 px-6 md:px-12">
      <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div>
          <p className="font-display text-lg tracking-tight">{personal.name}</p>
          <p className="font-mono text-[10px] tracking-[0.15em] text-muted mt-1">
            © {new Date().getFullYear()} — A WORLD IN PROGRESS
          </p>
        </div>
        <div className="flex gap-6 font-mono text-[11px] tracking-[0.12em] uppercase">
          <a
            href={personal.github}
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-cobalt transition-colors"
            data-cursor="OPEN"
          >
            GitHub
          </a>
          {personal.linkedin && (
            <a
              href={personal.linkedin}
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-cobalt transition-colors"
            >
              LinkedIn
            </a>
          )}
          <button
            onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
            className="hover:text-cobalt transition-colors"
            data-cursor="TOP"
          >
            Back to top
          </button>
        </div>
      </div>
    </footer>
  )
}
