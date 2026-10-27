import { useEffect, useRef } from 'react'
import gsap from 'gsap'

export default function Playground() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const rootRef = useRef<HTMLElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    let w = 0
    let h = 0
    let raf = 0
    const points: { x: number; y: number; vx: number; vy: number; r: number }[] = []
    const mouse = { x: -999, y: -999 }

    const resize = () => {
      const rect = canvas.getBoundingClientRect()
      w = rect.width
      h = rect.height
      canvas.width = w * devicePixelRatio
      canvas.height = h * devicePixelRatio
      ctx.setTransform(devicePixelRatio, 0, 0, devicePixelRatio, 0, 0)
    }

    for (let i = 0; i < 48; i++) {
      points.push({
        x: Math.random(),
        y: Math.random(),
        vx: (Math.random() - 0.5) * 0.0004,
        vy: (Math.random() - 0.5) * 0.0004,
        r: 1.5 + Math.random() * 2.5,
      })
    }

    const draw = () => {
      ctx.clearRect(0, 0, w, h)
      ctx.fillStyle = '#171714'
      ctx.strokeStyle = 'rgba(23,23,20,0.12)'
      ctx.lineWidth = 1

      for (const p of points) {
        p.x += p.vx
        p.y += p.vy
        if (p.x < 0 || p.x > 1) p.vx *= -1
        if (p.y < 0 || p.y > 1) p.vy *= -1

        const px = p.x * w
        const py = p.y * h
        const dx = mouse.x - px
        const dy = mouse.y - py
        const dist = Math.sqrt(dx * dx + dy * dy)
        if (dist < 120) {
          p.x -= (dx / dist) * 0.002
          p.y -= (dy / dist) * 0.002
        }

        ctx.beginPath()
        ctx.arc(px, py, p.r, 0, Math.PI * 2)
        ctx.fill()
      }

      for (let i = 0; i < points.length; i++) {
        for (let j = i + 1; j < points.length; j++) {
          const a = points[i]
          const b = points[j]
          const dx = (a.x - b.x) * w
          const dy = (a.y - b.y) * h
          const d = Math.sqrt(dx * dx + dy * dy)
          if (d < 90) {
            ctx.globalAlpha = 1 - d / 90
            ctx.beginPath()
            ctx.moveTo(a.x * w, a.y * h)
            ctx.lineTo(b.x * w, b.y * h)
            ctx.stroke()
            ctx.globalAlpha = 1
          }
        }
      }

      raf = requestAnimationFrame(draw)
    }

    const onMove = (e: MouseEvent) => {
      const rect = canvas.getBoundingClientRect()
      mouse.x = e.clientX - rect.left
      mouse.y = e.clientY - rect.top
    }

    resize()
    window.addEventListener('resize', resize)
    canvas.addEventListener('mousemove', onMove)
    raf = requestAnimationFrame(draw)

    gsap.from(rootRef.current, {
      opacity: 0,
      y: 40,
      duration: 1,
      scrollTrigger: {
        trigger: rootRef.current,
        start: 'top 80%',
      },
    })

    return () => {
      cancelAnimationFrame(raf)
      window.removeEventListener('resize', resize)
      canvas.removeEventListener('mousemove', onMove)
    }
  }, [])

  return (
    <section ref={rootRef} className="relative py-24 md:py-32 px-6 md:px-16 lg:px-24">
      <div className="max-w-6xl mx-auto">
        <p className="font-mono text-[10px] tracking-[0.22em] uppercase text-muted mb-4">
          04 — Experimental Playground
        </p>
        <h2 className="font-display text-3xl md:text-4xl tracking-tighter mb-8 max-w-lg">
          A small constellation that reacts to you.
        </h2>
        <div className="border border-ink/10 bg-paper relative overflow-hidden" style={{ height: 320 }}>
          <canvas ref={canvasRef} className="w-full h-full block" />
          <p className="absolute bottom-4 left-4 font-mono text-[10px] tracking-[0.14em] text-muted">
            MOVE THE POINTER
          </p>
        </div>
      </div>
    </section>
  )
}
