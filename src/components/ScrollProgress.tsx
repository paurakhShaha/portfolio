import { useEffect, useRef } from 'react'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'

export default function ScrollProgress() {
  const barRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const bar = barRef.current
    if (!bar) return

    gsap.to(bar, {
      scaleX: 1,
      ease: 'none',
      scrollTrigger: {
        trigger: document.body,
        start: 'top top',
        end: 'bottom bottom',
        scrub: 0.3,
      },
    })

    return () => {
      ScrollTrigger.getAll().forEach((st) => {
        if (st.vars.trigger === document.body) st.kill()
      })
    }
  }, [])

  return (
    <div
      className="fixed top-0 left-0 right-0 h-[2px] z-[9990] origin-left"
      style={{ background: 'rgba(23,23,20,0.08)' }}
      aria-hidden="true"
    >
      <div
        ref={barRef}
        className="h-full origin-left scale-x-0"
        style={{ background: '#171714' }}
      />
    </div>
  )
}
