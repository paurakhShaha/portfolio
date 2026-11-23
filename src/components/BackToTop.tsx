import { useEffect, useRef, useState } from 'react'
import { ArrowUp } from 'lucide-react'

const R = 21
const CIRC = 2 * Math.PI * R

/** Fixed bottom-right button that appears after the first screen; its ring shows page progress. */
export default function BackToTop({ onTop }: { onTop: () => void }) {
  const ringRef = useRef<SVGCircleElement>(null)
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    let frame = 0
    const update = () => {
      frame = 0
      const max = document.documentElement.scrollHeight - window.innerHeight
      const p = max > 0 ? Math.min(1, window.scrollY / max) : 0
      if (ringRef.current) ringRef.current.style.strokeDashoffset = String(CIRC * (1 - p))
      setVisible(window.scrollY > window.innerHeight * 0.8)
    }
    const onScroll = () => {
      if (!frame) frame = requestAnimationFrame(update)
    }
    update()
    window.addEventListener('scroll', onScroll, { passive: true })
    window.addEventListener('resize', onScroll)
    return () => {
      cancelAnimationFrame(frame)
      window.removeEventListener('scroll', onScroll)
      window.removeEventListener('resize', onScroll)
    }
  }, [])

  return (
    <button
      type="button"
      onClick={onTop}
      aria-label="Back to top"
      tabIndex={visible ? 0 : -1}
      aria-hidden={!visible}
      data-cursor="TOP"
      className={`story-adapt group fixed bottom-5 right-5 md:bottom-8 md:right-8 z-[100] w-12 h-12 rounded-full bg-paper text-ink border border-ink/10 shadow-[0_8px_24px_-10px_rgba(23,23,20,0.35)] flex items-center justify-center transition-[opacity,transform,background-color,color] duration-300 hover:bg-ink hover:text-paper ${
        visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-3 pointer-events-none'
      }`}
    >
      <svg className="absolute inset-0 -rotate-90" viewBox="0 0 48 48" aria-hidden="true">
        <circle cx="24" cy="24" r={R} fill="none" stroke="currentColor" strokeOpacity="0.12" strokeWidth="1.5" />
        <circle
          ref={ringRef}
          cx="24"
          cy="24"
          r={R}
          fill="none"
          stroke="#246BFD"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeDasharray={CIRC}
          strokeDashoffset={CIRC}
        />
      </svg>
      <ArrowUp size={17} className="relative transition-transform duration-300 group-hover:-translate-y-0.5" />
    </button>
  )
}
