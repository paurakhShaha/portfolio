import { personal } from '../data/projects'

export default function HumanSide() {
  return (
    <section className="relative py-32 md:py-40 px-6 md:px-16 lg:px-24">
      <div className="max-w-6xl mx-auto grid lg:grid-cols-12 gap-12">
        <div className="lg:col-span-5">
          <p className="font-mono text-[10px] tracking-[0.22em] uppercase text-muted mb-4">
            05 — The human side
          </p>
          <h2 className="font-display text-4xl md:text-5xl tracking-tighter leading-none">
            Still building.
            <br />
            <span className="text-ink/35">Still curious.</span>
          </h2>
        </div>
        <div className="lg:col-span-7 space-y-10">
          <div>
            <p className="font-mono text-[10px] tracking-[0.16em] uppercase text-muted mb-3">
              Currently interested in
            </p>
            <ul className="space-y-2">
              {personal.interests.map((item) => (
                <li key={item} className="font-serif text-lg text-ink/75">
                  {item}
                </li>
              ))}
            </ul>
          </div>
          <div>
            <p className="font-mono text-[10px] tracking-[0.16em] uppercase text-muted mb-3">
              Looking for
            </p>
            <ul className="space-y-2">
              {personal.seeking.map((item) => (
                <li key={item} className="text-[15px] text-ink/60 leading-relaxed">
                  {item}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </section>
  )
}
