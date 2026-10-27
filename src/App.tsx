import { useEffect, useRef, useState } from 'react'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import Lenis from 'lenis'
import Navigation from './components/Navigation'
import ScrollProgress from './components/ScrollProgress'
import CustomCursor from './components/CustomCursor'
import ChapterIndicator from './components/ChapterIndicator'
import Hero from './sections/Hero'
import Manifesto from './sections/Manifesto'
import ProjectWorlds from './sections/ProjectWorlds'
import VisualPlayground from './sections/VisualPlayground'
import Toolkit from './sections/Toolkit'
import Playground from './sections/Playground'
import HumanSide from './sections/HumanSide'
import Closing from './sections/Closing'
import Footer from './components/Footer'

gsap.registerPlugin(ScrollTrigger)

function App() {
  const [reducedMotion, setReducedMotion] = useState(false)
  const lenisRef = useRef<Lenis | null>(null)

  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)')
    setReducedMotion(mq.matches)
    const handler = (e: MediaQueryListEvent) => setReducedMotion(e.matches)
    mq.addEventListener('change', handler)
    return () => mq.removeEventListener('change', handler)
  }, [])

  useEffect(() => {
    if (reducedMotion) return

    const lenis = new Lenis({
      duration: 1.15,
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      smoothWheel: true,
    })
    lenisRef.current = lenis

    lenis.on('scroll', ScrollTrigger.update)

    const raf = (time: number) => {
      lenis.raf(time)
      requestAnimationFrame(raf)
    }
    requestAnimationFrame(raf)

    return () => {
      lenis.destroy()
      lenisRef.current = null
    }
  }, [reducedMotion])

  useEffect(() => {
    const t = setTimeout(() => ScrollTrigger.refresh(), 400)
    return () => clearTimeout(t)
  }, [])

  return (
    <>
      <div className="grain" aria-hidden="true" />
      <CustomCursor />
      <ScrollProgress />
      <ChapterIndicator />
      <Navigation />
      <main>
        <Hero reducedMotion={reducedMotion} />
        <Manifesto />
        <ProjectWorlds />
        <VisualPlayground />
        <Toolkit />
        <Playground />
        <HumanSide />
        <Closing />
      </main>
      <Footer />
    </>
  )
}

export default App
