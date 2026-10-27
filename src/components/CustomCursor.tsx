import { useEffect, useRef } from 'react'

export default function CustomCursor() {
  const dotRef = useRef<HTMLDivElement>(null)
  const labelRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (window.matchMedia('(hover: none)').matches) return

    const dot = dotRef.current
    const label = labelRef.current
    if (!dot || !label) return

    let x = 0
    let y = 0
    let targetX = 0
    let targetY = 0
    let raf = 0

    const onMove = (e: MouseEvent) => {
      targetX = e.clientX
      targetY = e.clientY
    }

    const loop = () => {
      x += (targetX - x) * 0.28
      y += (targetY - y) * 0.28
      dot.style.transform = `translate(${x - 4}px, ${y - 4}px)`
      label.style.transform = `translate(${x + 14}px, ${y + 14}px)`
      raf = requestAnimationFrame(loop)
    }
    raf = requestAnimationFrame(loop)

    const onOver = (e: MouseEvent) => {
      const el = (e.target as HTMLElement).closest('[data-cursor]')
      if (el) {
        const text = el.getAttribute('data-cursor') || ''
        label.textContent = text
        label.style.opacity = text ? '1' : '0'
        dot.style.width = '16px'
        dot.style.height = '16px'
        if (text === 'EXPLORE') {
          dot.style.background = '#246BFD'
        } else if (text === 'WRITE') {
          dot.style.background = '#FF7043'
        }
      }
    }

    const onOut = () => {
      label.style.opacity = '0'
      label.textContent = ''
      dot.style.width = '8px'
      dot.style.height = '8px'
      dot.style.background = '#171714'
    }

    window.addEventListener('mousemove', onMove)
    document.addEventListener('mouseover', onOver)
    document.addEventListener('mouseout', onOut)

    return () => {
      cancelAnimationFrame(raf)
      window.removeEventListener('mousemove', onMove)
      document.removeEventListener('mouseover', onOver)
      document.removeEventListener('mouseout', onOut)
    }
  }, [])

  return (
    <>
      <div ref={dotRef} className="cursor-dot" aria-hidden="true" />
      <div ref={labelRef} className="cursor-label" aria-hidden="true" />
    </>
  )
}
