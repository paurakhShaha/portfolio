import { useEffect, useRef } from 'react'
import gsap from 'gsap'

/* ------------------------------------------------------------------ */
/*  Anime-style koi pond: cel-shaded koi, ink outlines, lily pads,     */
/*  drifting sakura petals, ripples and twinkling water glints.        */
/* ------------------------------------------------------------------ */

type Vec = { x: number; y: number }

const INK = '#123a40'
const WATER_DEEP = '#1d5e68'
const WATER_MID = '#2f8a8c'
const WATER_LIGHT = '#6cc4b4'

interface Patch {
  t: number // 0 = head, 1 = tail
  side: number // -1..1 across the body
  r: number // radius as a fraction of body width
  stretch: number // how far the patch runs along the body
}

interface KoiVariety {
  base: string
  /** Hard cel-shadow colour on the lower flank */
  shade: string
  /** Pattern colour and its slightly darker edge (the "kiwa") */
  patch: string
  patchEdge: string
  /** Scale outlines: dark on a white fish, light sheen on a black one */
  scale: string
  fin: string
  finRay: string
  finEdge: string
  barbel: string
  patches: Patch[]
}

const VARIETIES: KoiVariety[] = [
  // Kohaku: white body, red pattern from head to tail
  {
    base: '#fdf9f2',
    shade: 'rgba(120, 110, 100, 0.2)',
    patch: '#e2412c',
    patchEdge: '#a8261a',
    scale: 'rgba(18, 58, 64, 0.16)',
    fin: 'rgba(255, 252, 246, 0.8)',
    finRay: 'rgba(18, 58, 64, 0.3)',
    finEdge: '#ffffff',
    barbel: '#e8c9b8',
    patches: [
      { t: 0.05, side: 0, r: 0.5, stretch: 1.1 },
      { t: 0.3, side: 0.15, r: 0.78, stretch: 1.7 },
      { t: 0.52, side: -0.3, r: 0.62, stretch: 1.3 },
      { t: 0.7, side: 0.25, r: 0.48, stretch: 1.2 },
      { t: 0.84, side: -0.1, r: 0.3, stretch: 1 },
    ],
  },
  // Black koi with red markings
  {
    base: '#23292c',
    shade: 'rgba(0, 0, 0, 0.32)',
    patch: '#e2412c',
    patchEdge: '#8f1f15',
    scale: 'rgba(255, 255, 255, 0.13)',
    fin: 'rgba(32, 38, 41, 0.85)',
    finRay: 'rgba(255, 255, 255, 0.22)',
    finEdge: 'rgba(255, 255, 255, 0.85)',
    barbel: '#3a4245',
    patches: [
      { t: 0.08, side: 0.15, r: 0.45, stretch: 1 },
      { t: 0.36, side: -0.2, r: 0.72, stretch: 1.8 },
      { t: 0.6, side: 0.3, r: 0.58, stretch: 1.3 },
      { t: 0.8, side: -0.15, r: 0.34, stretch: 1.1 },
    ],
  },
]

/** Body width along the spine, head → tail. */
const PROFILE = [0.62, 0.9, 1, 0.98, 0.9, 0.76, 0.6, 0.44, 0.3, 0.2]
const SEGMENTS = PROFILE.length
/**
 * Max bend (radians) each joint may have relative to the one in front of it.
 * The head and shoulders are almost rigid; flexibility grows toward the tail,
 * so the body arcs like a fish instead of slithering like a snake.
 */
const MAX_BEND = [0, 0.03, 0.04, 0.06, 0.08, 0.11, 0.14, 0.17, 0.2, 0.22]
/** Swim undulation amplitude per joint: nothing at the head, most at the tail. */
const SWIM_AMP = [0, 0, 0, 0.01, 0.02, 0.035, 0.05, 0.07, 0.09, 0.11]

interface Koi {
  spine: Vec[]
  angle: number
  speed: number
  baseSpeed: number
  seg: number
  width: number
  variety: KoiVariety
  /** Per-patch edge wobble so each pattern has an organic, hand-inked outline */
  patchJitter: number[][]
  phase: number
  wander: number
  scared: number
}

interface Ripple {
  x: number
  y: number
  r: number
  max: number
  life: number
  width: number
}

interface Pellet {
  x: number
  y: number
  age: number
}

interface Pad {
  x: number
  y: number
  r: number
  rot: number
  notch: number
  bob: number
  flower: boolean
  vx: number
  vy: number
}

interface Petal {
  x: number
  y: number
  rot: number
  vr: number
  vx: number
  vy: number
  s: number
}

interface Glint {
  x: number
  y: number
  t: number
  speed: number
  s: number
}

const PATCH_POINTS = 18
const rand = (a: number, b: number) => a + Math.random() * (b - a)
const angleDiff = (a: number, b: number) => Math.atan2(Math.sin(b - a), Math.cos(b - a))

function makeKoi(w: number, h: number, i: number): Koi {
  const scale = Math.min(w, h) / 420
  const width = rand(32, 36) * gsap.utils.clamp(0.72, 1.25, scale)
  const seg = width * 0.62
  const x = rand(w * 0.2, w * 0.8)
  const y = rand(h * 0.2, h * 0.8)
  const angle = rand(0, Math.PI * 2)
  const spine = Array.from({ length: SEGMENTS }, (_, s) => ({
    x: x - Math.cos(angle) * seg * s,
    y: y - Math.sin(angle) * seg * s,
  }))
  const baseSpeed = rand(36, 46)
  const variety = VARIETIES[i % VARIETIES.length]
  // Smooth random wobble: a few low-frequency waves summed around the patch edge.
  const patchJitter = variety.patches.map(() => {
    const waves = [rand(0, 6), rand(0, 6), rand(0, 6)]
    return Array.from({ length: PATCH_POINTS }, (_, j) => {
      const a = (j / PATCH_POINTS) * Math.PI * 2
      return 1 + 0.16 * Math.sin(a * 2 + waves[0]) + 0.1 * Math.sin(a * 3 + waves[1]) + 0.06 * Math.sin(a * 5 + waves[2])
    })
  })
  return {
    spine,
    angle,
    speed: baseSpeed,
    baseSpeed,
    seg,
    width,
    variety,
    patchJitter,
    phase: rand(0, Math.PI * 2),
    wander: rand(0, 1000),
    scared: 0,
  }
}

/** Left/right outline points of a koi body. */
function outline(k: Koi) {
  const left: Vec[] = []
  const right: Vec[] = []
  for (let i = 0; i < SEGMENTS; i++) {
    const p = k.spine[i]
    const q = k.spine[Math.min(i + 1, SEGMENTS - 1)]
    const o = k.spine[Math.max(i - 1, 0)]
    const dx = (i === SEGMENTS - 1 ? p.x - o.x : o.x - q.x) || 0.0001
    const dy = (i === SEGMENTS - 1 ? p.y - o.y : o.y - q.y) || 0.0001
    const len = Math.hypot(dx, dy)
    const nx = -dy / len
    const ny = dx / len
    const wdt = (k.width / 2) * PROFILE[i]
    left.push({ x: p.x + nx * wdt, y: p.y + ny * wdt })
    right.push({ x: p.x - nx * wdt, y: p.y - ny * wdt })
  }
  return { left, right }
}

function bodyPath(k: Koi, ox = 0, oy = 0) {
  const { left, right } = outline(k)
  const head = k.spine[0]
  const fx = Math.cos(k.angle)
  const fy = Math.sin(k.angle)
  // Perpendicular pointing to the "left" outline side
  const lx = -fy
  const ly = fx
  const W = k.width
  const nose = { x: head.x + fx * W * 0.48 + ox, y: head.y + fy * W * 0.48 + oy }
  const path = new Path2D()
  path.moveTo(nose.x, nose.y)
  // Blunt, rounded koi snout: the curve leaves the nose sideways, not at a point.
  path.bezierCurveTo(
    nose.x + lx * W * 0.26,
    nose.y + ly * W * 0.26,
    left[0].x + ox + fx * W * 0.3,
    left[0].y + oy + fy * W * 0.3,
    left[0].x + ox,
    left[0].y + oy
  )
  for (let i = 1; i < SEGMENTS; i++) {
    const a = left[i - 1]
    const b = left[i]
    path.quadraticCurveTo(a.x + ox, a.y + oy, (a.x + b.x) / 2 + ox, (a.y + b.y) / 2 + oy)
  }
  const tail = k.spine[SEGMENTS - 1]
  path.lineTo(tail.x + ox, tail.y + oy)
  for (let i = SEGMENTS - 1; i > 0; i--) {
    const a = right[i]
    const b = right[i - 1]
    path.quadraticCurveTo(a.x + ox, a.y + oy, (a.x + b.x) / 2 + ox, (a.y + b.y) / 2 + oy)
  }
  path.bezierCurveTo(
    right[0].x + ox + fx * W * 0.3,
    right[0].y + oy + fy * W * 0.3,
    nose.x - lx * W * 0.26,
    nose.y - ly * W * 0.26,
    nose.x,
    nose.y
  )
  path.closePath()
  return path
}

/** Direction the body faces (toward the head) at position t along the spine. */
function angleAt(k: Koi, t: number) {
  const i = Math.min(Math.floor(gsap.utils.clamp(0, 1, t) * (SEGMENTS - 1)), SEGMENTS - 2)
  const a = k.spine[i]
  const b = k.spine[i + 1]
  return Math.atan2(a.y - b.y, a.x - b.x)
}

function pointAlong(k: Koi, t: number, side: number): Vec {
  t = gsap.utils.clamp(0, 1, t)
  const f = t * (SEGMENTS - 1)
  const i = Math.min(Math.floor(f), SEGMENTS - 2)
  const u = f - i
  const a = k.spine[i]
  const b = k.spine[i + 1]
  const x = a.x + (b.x - a.x) * u
  const y = a.y + (b.y - a.y) * u
  const dx = a.x - b.x || 0.0001
  const dy = a.y - b.y || 0.0001
  const len = Math.hypot(dx, dy)
  const wdt = (k.width / 2) * (PROFILE[i] + (PROFILE[i + 1] - PROFILE[i]) * u)
  return { x: x + (-dy / len) * wdt * side, y: y + (dx / len) * wdt * side }
}

/** A flowing, translucent fin with rays, drawn from a root point. */
function finShape(
  ctx: CanvasRenderingContext2D,
  v: KoiVariety,
  root: Vec,
  dir: number,
  len: number,
  spread: number,
  rays: number
) {
  const a1 = dir - spread
  const a2 = dir + spread
  const p1 = { x: root.x + Math.cos(a1) * len, y: root.y + Math.sin(a1) * len }
  const p2 = { x: root.x + Math.cos(a2) * len, y: root.y + Math.sin(a2) * len }
  const mid = { x: root.x + Math.cos(dir) * len * 1.12, y: root.y + Math.sin(dir) * len * 1.12 }
  const path = new Path2D()
  path.moveTo(root.x, root.y)
  path.quadraticCurveTo(root.x + Math.cos(a1 - 0.25) * len * 0.6, root.y + Math.sin(a1 - 0.25) * len * 0.6, p1.x, p1.y)
  path.quadraticCurveTo(mid.x, mid.y, p2.x, p2.y)
  path.quadraticCurveTo(root.x + Math.cos(a2 + 0.25) * len * 0.6, root.y + Math.sin(a2 + 0.25) * len * 0.6, root.x, root.y)
  path.closePath()

  ctx.fillStyle = v.fin
  ctx.fill(path)

  ctx.save()
  ctx.clip(path)
  ctx.strokeStyle = v.finRay
  ctx.lineWidth = 0.9
  for (let r = 0; r < rays; r++) {
    const a = a1 + ((a2 - a1) * (r + 0.5)) / rays
    ctx.beginPath()
    ctx.moveTo(root.x, root.y)
    ctx.quadraticCurveTo(
      root.x + Math.cos(a) * len * 0.5,
      root.y + Math.sin(a) * len * 0.5,
      root.x + Math.cos(a + (a - dir) * 0.15) * len * 1.1,
      root.y + Math.sin(a + (a - dir) * 0.15) * len * 1.1
    )
    ctx.stroke()
  }
  // Pale trailing edge, the bright rim anime artists give koi fins.
  ctx.strokeStyle = v.finEdge
  ctx.lineWidth = 3
  ctx.globalAlpha = 0.55
  ctx.beginPath()
  ctx.moveTo(p1.x, p1.y)
  ctx.quadraticCurveTo(mid.x, mid.y, p2.x, p2.y)
  ctx.stroke()
  ctx.restore()

  ctx.strokeStyle = INK
  ctx.lineWidth = 1.4
  ctx.stroke(path)
}

function drawFins(ctx: CanvasRenderingContext2D, k: Koi, time: number) {
  const v = k.variety
  const beat = time * (3 + k.speed / 18) + k.phase

  // Tail fin: a wide, two-lobed fan that trails the tail beat.
  const n = SEGMENTS - 1
  const t = k.spine[n]
  const p = k.spine[n - 1]
  const tailDir = Math.atan2(t.y - p.y, t.x - p.x) + Math.sin(beat - SEGMENTS * 0.7) * 0.18
  const L = k.width * 1.55
  for (const lobe of [-1, 1]) {
    finShape(ctx, v, t, tailDir + lobe * 0.34, L * (lobe > 0 ? 1 : 0.96), 0.32, 5)
  }

  // Pelvic fins: small pair halfway down the belly
  for (const side of [-1, 1]) {
    const root = pointAlong(k, 0.5, side * 0.7)
    // side +1 sits at heading +90°, so the fin swings back toward that same side.
    const a = angleAt(k, 0.5) + Math.PI - side * (0.75 + Math.sin(beat + side) * 0.08)
    finShape(ctx, v, root, a, k.width * 0.5, 0.28, 3)
  }

  // Pectoral fins: the big rounded "paddles" koi are known for
  const flap = Math.sin(time * 3.2 + k.phase) * 0.22
  for (const side of [-1, 1]) {
    const root = pointAlong(k, 0.18, side * 0.82)
    const a = angleAt(k, 0.18) + Math.PI - side * (1.05 + flap)
    finShape(ctx, v, root, a, k.width * 0.88, 0.42, 6)
  }
}

/** Organic pattern patch that bends with the body. */
function patchPath(k: Koi, patch: Patch, jitter: number[]) {
  const bodyLen = k.seg * (SEGMENTS - 1)
  const path = new Path2D()
  for (let j = 0; j <= PATCH_POINTS; j++) {
    const a = (j / PATCH_POINTS) * Math.PI * 2
    const rr = patch.r * k.width * 0.5 * jitter[j % PATCH_POINTS]
    const dt = (Math.cos(a) * rr * patch.stretch) / bodyLen
    const ds = (Math.sin(a) * rr) / (k.width * 0.5)
    const pt = pointAlong(k, patch.t + dt, patch.side + ds)
    if (j === 0) path.moveTo(pt.x, pt.y)
    else path.lineTo(pt.x, pt.y)
  }
  path.closePath()
  return path
}

function drawKoi(ctx: CanvasRenderingContext2D, k: Koi, time: number) {
  const v = k.variety
  const W = k.width

  // Soft shadow on the pond floor: the koi seems to hover above the stones.
  ctx.fillStyle = 'rgba(8, 36, 42, 0.3)'
  ctx.fill(bodyPath(k, W * 0.3, W * 0.42))

  drawFins(ctx, k, time)

  const body = bodyPath(k)
  ctx.fillStyle = v.base
  ctx.fill(body)

  ctx.save()
  ctx.clip(body)

  // Pattern, with a darker inked edge like real koi markings
  ctx.lineJoin = 'round'
  k.variety.patches.forEach((patch, i) => {
    const path = patchPath(k, patch, k.patchJitter[i])
    ctx.fillStyle = v.patch
    ctx.fill(path)
    ctx.strokeStyle = v.patchEdge
    ctx.lineWidth = 1.2
    ctx.stroke(path)
  })

  // Scales: staggered rows of small arcs that open toward the tail.
  ctx.strokeStyle = v.scale
  ctx.lineWidth = 1
  const scaleR = W * 0.1
  let row = 0
  for (let t = 0.2; t < 0.9; t += 0.045, row++) {
    const facing = angleAt(k, t) + Math.PI
    for (let s = -0.9 + (row % 2) * 0.15; s <= 0.9; s += 0.3) {
      const c = pointAlong(k, t, s)
      ctx.beginPath()
      ctx.arc(c.x, c.y, scaleR, facing - 1.15, facing + 1.15)
      ctx.stroke()
    }
  }

  // Cel shading: one hard-edged shadow band on the lower flank.
  const sx = Math.cos(k.angle + Math.PI / 2) * W * 0.34
  const sy = Math.sin(k.angle + Math.PI / 2) * W * 0.34
  ctx.fillStyle = v.shade
  ctx.fill(bodyPath(k, sx, sy))

  // Gill covers: a curved line on each side just behind the eyes
  ctx.strokeStyle = 'rgba(18, 58, 64, 0.35)'
  ctx.lineWidth = 1.2
  for (const side of [-1, 1]) {
    const a = pointAlong(k, 0.09, side * 0.95)
    const m = pointAlong(k, 0.15, side * 0.55)
    const b = pointAlong(k, 0.13, side * 0.1)
    ctx.beginPath()
    ctx.moveTo(a.x, a.y)
    ctx.quadraticCurveTo(m.x, m.y, b.x, b.y)
    ctx.stroke()
  }
  ctx.restore()

  // Dorsal fin: a thin ridge along the back, rippling with the swim.
  const beat = time * (3 + k.speed / 18) + k.phase
  const ridgeL: Vec[] = []
  const ridgeR: Vec[] = []
  for (let i = 0; i <= 8; i++) {
    const t = 0.3 + (i / 8) * 0.34
    const sway = Math.sin(beat - i * 0.6) * 0.12
    const lift = Math.sin((i / 8) * Math.PI) * 0.22 + 0.04
    ridgeL.push(pointAlong(k, t, sway - lift))
    ridgeR.push(pointAlong(k, t, sway + lift * 0.35))
  }
  const ridge = new Path2D()
  ridge.moveTo(ridgeL[0].x, ridgeL[0].y)
  ridgeL.forEach((pt) => ridge.lineTo(pt.x, pt.y))
  for (let i = ridgeR.length - 1; i >= 0; i--) ridge.lineTo(ridgeR[i].x, ridgeR[i].y)
  ridge.closePath()
  ctx.fillStyle = v.fin
  ctx.fill(ridge)
  ctx.strokeStyle = v.finRay
  ctx.lineWidth = 0.8
  for (let i = 1; i < 8; i += 1) {
    ctx.beginPath()
    ctx.moveTo(ridgeR[i].x, ridgeR[i].y)
    ctx.lineTo(ridgeL[i].x, ridgeL[i].y)
    ctx.stroke()
  }
  ctx.strokeStyle = INK
  ctx.lineWidth = 1.1
  ctx.stroke(ridge)

  // Hard spec highlight along the upper back
  ctx.strokeStyle = 'rgba(255,255,255,0.9)'
  ctx.lineWidth = Math.max(1.4, W * 0.075)
  ctx.lineCap = 'round'
  ctx.beginPath()
  const h0 = pointAlong(k, 0.1, -0.42)
  ctx.moveTo(h0.x, h0.y)
  for (const t of [0.17, 0.24]) {
    const pt = pointAlong(k, t, -0.5)
    ctx.lineTo(pt.x, pt.y)
  }
  ctx.stroke()
  ctx.lineWidth = Math.max(1, W * 0.05)
  ctx.beginPath()
  const h1 = pointAlong(k, 0.68, -0.4)
  ctx.moveTo(h1.x, h1.y)
  const h2 = pointAlong(k, 0.76, -0.38)
  ctx.lineTo(h2.x, h2.y)
  ctx.stroke()

  // Ink outline
  ctx.strokeStyle = INK
  ctx.lineWidth = 1.7
  ctx.lineJoin = 'round'
  ctx.stroke(body)

  // Barbels: two pairs of little whiskers at the mouth
  const head = k.spine[0]
  const fwd = k.angle
  const mouth = { x: head.x + Math.cos(fwd) * W * 0.5, y: head.y + Math.sin(fwd) * W * 0.5 }
  ctx.strokeStyle = v.barbel
  ctx.lineWidth = 1.3
  ctx.lineCap = 'round'
  for (const side of [-1, 1]) {
    for (const [off, len] of [
      [0.12, 0.38],
      [0.22, 0.26],
    ] as const) {
      const sx0 = mouth.x + Math.cos(fwd + side * Math.PI / 2) * W * off - Math.cos(fwd) * W * 0.06
      const sy0 = mouth.y + Math.sin(fwd + side * Math.PI / 2) * W * off - Math.sin(fwd) * W * 0.06
      const wave = Math.sin(time * 2 + k.phase + off * 10) * 0.25
      const dirA = fwd + side * (1.1 + wave)
      ctx.beginPath()
      ctx.moveTo(sx0, sy0)
      ctx.quadraticCurveTo(
        sx0 + Math.cos(fwd + side * 0.5) * W * len * 0.6,
        sy0 + Math.sin(fwd + side * 0.5) * W * len * 0.6,
        sx0 + Math.cos(dirA) * W * len,
        sy0 + Math.sin(dirA) * W * len
      )
      ctx.stroke()
    }
  }

  // Nostrils
  ctx.fillStyle = 'rgba(18, 58, 64, 0.55)'
  for (const side of [-1, 1]) {
    const n = pointAlong(k, 0, side * 0.28)
    const nx = n.x + Math.cos(fwd) * W * 0.22
    const ny = n.y + Math.sin(fwd) * W * 0.22
    ctx.beginPath()
    ctx.arc(nx, ny, Math.max(0.9, W * 0.035), 0, Math.PI * 2)
    ctx.fill()
  }

  // Anime eyes: white, dark iris, bright catch-light
  for (const side of [-1, 1]) {
    const e = pointAlong(k, 0.04, side * 0.78)
    const r = Math.max(2.2, W * 0.11)
    ctx.fillStyle = '#ffffff'
    ctx.beginPath()
    ctx.arc(e.x, e.y, r, 0, Math.PI * 2)
    ctx.fill()
    ctx.strokeStyle = INK
    ctx.lineWidth = 1.2
    ctx.stroke()
    ctx.fillStyle = '#16262a'
    ctx.beginPath()
    ctx.arc(e.x + Math.cos(fwd) * r * 0.15, e.y + Math.sin(fwd) * r * 0.15, r * 0.62, 0, Math.PI * 2)
    ctx.fill()
    ctx.fillStyle = '#ffffff'
    ctx.beginPath()
    ctx.arc(e.x - r * 0.25, e.y - r * 0.3, r * 0.26, 0, Math.PI * 2)
    ctx.fill()
  }
}

function drawPad(ctx: CanvasRenderingContext2D, p: Pad, time: number) {
  const bob = Math.sin(time * 0.8 + p.bob) * 0.04
  ctx.save()
  ctx.translate(p.x, p.y)
  ctx.rotate(p.rot + bob)

  // Shadow on the water
  ctx.fillStyle = 'rgba(10, 40, 46, 0.25)'
  ctx.beginPath()
  ctx.ellipse(6, 8, p.r, p.r * 0.96, 0, 0, Math.PI * 2)
  ctx.fill()

  const pad = new Path2D()
  pad.moveTo(0, 0)
  pad.arc(0, 0, p.r, p.notch / 2, Math.PI * 2 - p.notch / 2)
  pad.closePath()
  ctx.fillStyle = '#5fb06a'
  ctx.fill(pad)
  ctx.save()
  ctx.clip(pad)
  // Cel shade: darker crescent on one side
  ctx.fillStyle = '#438a50'
  ctx.beginPath()
  ctx.arc(p.r * 0.35, p.r * 0.35, p.r, 0, Math.PI * 2)
  ctx.arc(-p.r * 0.05, -p.r * 0.05, p.r * 0.98, 0, Math.PI * 2, true)
  ctx.fill()
  ctx.restore()

  // Veins
  ctx.strokeStyle = 'rgba(30, 80, 40, 0.45)'
  ctx.lineWidth = 1
  for (let i = 1; i < 7; i++) {
    const a = p.notch / 2 + ((Math.PI * 2 - p.notch) * i) / 7
    ctx.beginPath()
    ctx.moveTo(0, 0)
    ctx.lineTo(Math.cos(a) * p.r * 0.85, Math.sin(a) * p.r * 0.85)
    ctx.stroke()
  }
  // Rim highlight
  ctx.strokeStyle = 'rgba(220, 255, 200, 0.7)'
  ctx.lineWidth = 2
  ctx.beginPath()
  ctx.arc(0, 0, p.r * 0.86, Math.PI * 1.05, Math.PI * 1.45)
  ctx.stroke()

  ctx.strokeStyle = INK
  ctx.lineWidth = 1.6
  ctx.stroke(pad)

  if (p.flower) {
    // Lotus: two rings of petals, cel-shaded pink
    const fr = p.r * 0.5
    ctx.translate(-p.r * 0.15, p.r * 0.1)
    for (const [ring, count, len, color] of [
      [0, 8, fr, '#f6a9c0'],
      [0.4, 6, fr * 0.7, '#ffd3df'],
    ] as const) {
      for (let i = 0; i < count; i++) {
        const a = ring + (i / count) * Math.PI * 2
        ctx.save()
        ctx.rotate(a)
        ctx.beginPath()
        ctx.ellipse(len * 0.55, 0, len * 0.55, len * 0.24, 0, 0, Math.PI * 2)
        ctx.fillStyle = color
        ctx.fill()
        ctx.strokeStyle = INK
        ctx.lineWidth = 1.2
        ctx.stroke()
        ctx.restore()
      }
    }
    ctx.fillStyle = '#ffd45e'
    ctx.beginPath()
    ctx.arc(0, 0, fr * 0.2, 0, Math.PI * 2)
    ctx.fill()
    ctx.strokeStyle = INK
    ctx.lineWidth = 1.2
    ctx.stroke()
  }
  ctx.restore()
}

function drawPetal(ctx: CanvasRenderingContext2D, p: Petal) {
  ctx.save()
  ctx.translate(p.x, p.y)
  ctx.rotate(p.rot)
  ctx.fillStyle = 'rgba(10, 40, 46, 0.2)'
  ctx.beginPath()
  ctx.ellipse(3, 4, p.s, p.s * 0.6, 0, 0, Math.PI * 2)
  ctx.fill()
  // Sakura petal with the little notch at the tip
  ctx.beginPath()
  ctx.moveTo(-p.s, 0)
  ctx.quadraticCurveTo(-p.s * 0.2, -p.s * 0.75, p.s, -p.s * 0.2)
  ctx.lineTo(p.s * 0.7, 0)
  ctx.lineTo(p.s, p.s * 0.2)
  ctx.quadraticCurveTo(-p.s * 0.2, p.s * 0.75, -p.s, 0)
  ctx.fillStyle = '#ffc4d4'
  ctx.fill()
  ctx.strokeStyle = '#b4566f'
  ctx.lineWidth = 1
  ctx.stroke()
  ctx.restore()
}

function drawSparkle(ctx: CanvasRenderingContext2D, x: number, y: number, s: number, a: number) {
  ctx.save()
  ctx.globalAlpha = a
  ctx.fillStyle = '#ffffff'
  ctx.beginPath()
  ctx.moveTo(x, y - s)
  ctx.quadraticCurveTo(x, y, x + s, y)
  ctx.quadraticCurveTo(x, y, x, y + s)
  ctx.quadraticCurveTo(x, y, x - s, y)
  ctx.quadraticCurveTo(x, y, x, y - s)
  ctx.fill()
  ctx.restore()
}

/** Static pond floor, drawn once per resize into an offscreen canvas. */
function paintFloor(w: number, h: number, dpr: number) {
  const c = document.createElement('canvas')
  c.width = w * dpr
  c.height = h * dpr
  const g = c.getContext('2d')!
  g.setTransform(dpr, 0, 0, dpr, 0, 0)

  const grad = g.createRadialGradient(w * 0.45, h * 0.4, 0, w * 0.5, h * 0.5, Math.max(w, h) * 0.75)
  grad.addColorStop(0, WATER_LIGHT)
  grad.addColorStop(0.45, WATER_MID)
  grad.addColorStop(1, WATER_DEEP)
  g.fillStyle = grad
  g.fillRect(0, 0, w, h)

  // Pebbles seen through the water: flat, two-tone, softly outlined.
  const count = Math.round((w * h) / 9000)
  for (let i = 0; i < count; i++) {
    const x = Math.random() * w
    const y = Math.random() * h
    const r = rand(5, 16)
    g.fillStyle = `rgba(20, 70, 76, ${rand(0.18, 0.32)})`
    g.beginPath()
    g.ellipse(x, y, r, r * rand(0.55, 0.85), rand(0, Math.PI), 0, Math.PI * 2)
    g.fill()
    g.fillStyle = 'rgba(160, 225, 210, 0.12)'
    g.beginPath()
    g.ellipse(x - r * 0.25, y - r * 0.25, r * 0.45, r * 0.3, 0, 0, Math.PI * 2)
    g.fill()
  }
  return c
}

export default function Playground() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const rootRef = useRef<HTMLElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    let w = 0
    let h = 0
    let dpr = 1
    let floor: HTMLCanvasElement | null = null
    let raf = 0
    let running = false
    let last = performance.now()
    let time = 0

    let koi: Koi[] = []
    let pads: Pad[] = []
    let petals: Petal[] = []
    let glints: Glint[] = []
    const ripples: Ripple[] = []
    const pellets: Pellet[] = []
    const pointer = { x: 0, y: 0, active: false, speed: 0, lastRipple: 0 }

    const populate = () => {
      // Two koi: a kohaku and a black koi with red markings.
      koi = VARIETIES.map((_, i) => makeKoi(w, h, i))
      const padCount = w < 500 ? 3 : 5
      pads = Array.from({ length: padCount }, (_, i) => ({
        x: ((i + 0.5) / padCount) * w + rand(-40, 40),
        y: i % 2 === 0 ? rand(h * 0.12, h * 0.3) : rand(h * 0.68, h * 0.88),
        r: rand(28, 46) * Math.max(Math.min(w, h) / 440, 0.7),
        rot: rand(0, Math.PI * 2),
        notch: rand(0.35, 0.55),
        bob: rand(0, 10),
        flower: i === 1 || i === 3,
        vx: 0,
        vy: 0,
      }))
      petals = Array.from({ length: 14 }, () => ({
        x: rand(0, w),
        y: rand(0, h),
        rot: rand(0, Math.PI * 2),
        vr: rand(-0.4, 0.4),
        vx: rand(6, 14),
        vy: rand(-3, 5),
        s: rand(4, 7),
      }))
      glints = Array.from({ length: 10 }, () => ({
        x: rand(0, w),
        y: rand(0, h),
        t: rand(0, 1),
        speed: rand(0.25, 0.5),
        s: rand(3, 6),
      }))
    }

    const resize = () => {
      const rect = canvas.getBoundingClientRect()
      // Re-stock the pond on first paint or when its size changes a lot (e.g. rotating a phone).
      const first = w === 0 || Math.abs(rect.width - w) / w > 0.25 || Math.abs(rect.height - h) / h > 0.25
      w = rect.width
      h = rect.height
      dpr = Math.min(window.devicePixelRatio || 1, 2)
      canvas.width = w * dpr
      canvas.height = h * dpr
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
      floor = paintFloor(w, h, dpr)
      if (first) populate()
      if (!running) render()
    }

    const addRipple = (x: number, y: number, max: number, width = 2) => {
      ripples.push({ x, y, r: 2, max, life: 1, width })
      if (ripples.length > 24) ripples.shift()
    }

    const updateKoi = (k: Koi, dt: number) => {
      const head = k.spine[0]
      k.wander += dt
      let desired = k.angle + Math.sin(k.wander * 0.45 + k.phase) * 0.5
      let targetSpeed = k.baseSpeed

      // Food beats everything.
      let food: Pellet | null = null
      let best = 260
      for (const p of pellets) {
        const d = Math.hypot(p.x - head.x, p.y - head.y)
        if (d < best) {
          best = d
          food = p
        }
      }

      if (k.scared > 0) {
        k.scared -= dt
        desired = Math.atan2(head.y - pointer.y, head.x - pointer.x)
        targetSpeed = k.baseSpeed * 3.2
      } else if (food) {
        desired = Math.atan2(food.y - head.y, food.x - head.x)
        targetSpeed = k.baseSpeed * 1.8
        if (best < k.width * 0.7) {
          pellets.splice(pellets.indexOf(food), 1)
          addRipple(food.x, food.y, 26, 1.6)
        }
      } else if (pointer.active) {
        // Curious: drift toward a still pointer.
        const d = Math.hypot(pointer.x - head.x, pointer.y - head.y)
        if (d < 240 && d > 30) {
          desired = Math.atan2(pointer.y - head.y, pointer.x - head.x)
          targetSpeed = k.baseSpeed * 1.25
        }
      } else {
        // The pair: if they drift apart, the koi eases back toward its partner.
        const partner = koi.find((o) => o !== k)
        if (partner) {
          const ph = partner.spine[0]
          const d = Math.hypot(ph.x - head.x, ph.y - head.y)
          if (d > k.width * 6) {
            const toward = Math.atan2(ph.y - head.y, ph.x - head.x)
            desired = k.angle + angleDiff(k.angle, toward) * 0.6
            targetSpeed = k.baseSpeed * 1.15
          } else if (d < k.width * 2.2) {
            // ...but not so close they overlap.
            desired = k.angle + angleDiff(k.angle, Math.atan2(head.y - ph.y, head.x - ph.x)) * 0.3
          }
        }
      }

      // Soft walls: turn back toward the middle near the edges.
      // Look ahead so the wide turn starts before the wall, not at it.
      const margin = Math.min(110, Math.min(w, h) * 0.22)
      const ahead = { x: head.x + Math.cos(k.angle) * margin, y: head.y + Math.sin(k.angle) * margin }
      if (ahead.x < margin * 0.5 || ahead.x > w - margin * 0.5 || ahead.y < margin * 0.5 || ahead.y > h - margin * 0.5) {
        desired = Math.atan2(h / 2 - head.y, w / 2 - head.x)
      }

      // Koi turn in wide, smooth arcs; the turn rate also scales with speed (no pivoting in place).
      const turnRate = (k.scared > 0 ? 1.7 : 0.65) * gsap.utils.clamp(0.6, 1.4, k.speed / 45)
      k.angle += gsap.utils.clamp(-turnRate * dt, turnRate * dt, angleDiff(k.angle, desired))
      k.speed += (targetSpeed - k.speed) * (1 - Math.exp(-dt * 2))

      // The head travels straight along its heading; the swimming motion lives in the tail.
      head.x += Math.cos(k.angle) * k.speed * dt
      head.y += Math.sin(k.angle) * k.speed * dt

      // Spine: each segment trails the one ahead, but its bend is capped per joint
      // and a travelling wave adds the tail beat. Faster koi beat faster.
      const beat = time * (3 + k.speed / 18) + k.phase
      let parentAngle = k.angle
      for (let i = 1; i < SEGMENTS; i++) {
        const prev = k.spine[i - 1]
        const cur = k.spine[i]
        const follow = Math.atan2(prev.y - cur.y, prev.x - cur.x)
        const bend = gsap.utils.clamp(-MAX_BEND[i], MAX_BEND[i], angleDiff(parentAngle, follow))
        const a = parentAngle + bend + Math.sin(beat - i * 0.7) * SWIM_AMP[i]
        cur.x = prev.x - Math.cos(a) * k.seg
        cur.y = prev.y - Math.sin(a) * k.seg
        parentAngle = a
      }
    }

    const step = (dt: number) => {
      time += dt
      for (const k of koi) updateKoi(k, dt)

      for (const p of pads) {
        // Pads nudge away from the pointer and drift back.
        if (pointer.active) {
          const dx = p.x - pointer.x
          const dy = p.y - pointer.y
          const d = Math.hypot(dx, dy)
          if (d < p.r + 30) {
            p.vx += (dx / (d || 1)) * 40 * dt
            p.vy += (dy / (d || 1)) * 40 * dt
          }
        }
        p.x += p.vx * dt
        p.y += p.vy * dt
        p.vx *= 1 - dt * 1.5
        p.vy *= 1 - dt * 1.5
        p.rot += p.vx * 0.002
        p.x = gsap.utils.clamp(p.r, w - p.r, p.x)
        p.y = gsap.utils.clamp(p.r, h - p.r, p.y)
      }

      for (const p of petals) {
        p.x += p.vx * dt
        p.y += p.vy * dt + Math.sin(time + p.rot) * 2 * dt
        p.rot += p.vr * dt
        if (p.x > w + 10) {
          p.x = -10
          p.y = rand(0, h)
        }
        if (p.y > h + 10) p.y = -10
        if (p.y < -10) p.y = h + 10
      }

      for (const g of glints) {
        g.t += g.speed * dt
        if (g.t > 1) {
          g.t = 0
          g.x = rand(0, w)
          g.y = rand(0, h)
        }
      }

      for (let i = ripples.length - 1; i >= 0; i--) {
        const r = ripples[i]
        r.r += (r.max - r.r) * (1 - Math.exp(-dt * 2.2))
        r.life -= dt * 0.8
        if (r.life <= 0) ripples.splice(i, 1)
      }

      for (let i = pellets.length - 1; i >= 0; i--) {
        pellets[i].age += dt
        if (pellets[i].age > 14) pellets.splice(i, 1)
      }
    }

    const render = () => {
      if (!floor) return
      ctx.clearRect(0, 0, w, h)
      ctx.drawImage(floor, 0, 0, w, h)

      // Caustic light bands drifting across the floor.
      ctx.strokeStyle = 'rgba(210, 255, 240, 0.09)'
      ctx.lineWidth = 10
      for (let i = 0; i < 5; i++) {
        ctx.beginPath()
        const y0 = ((i + 0.5) / 5) * h
        for (let x = -20; x <= w + 20; x += 20) {
          const y = y0 + Math.sin(x * 0.012 + time * 0.6 + i * 1.7) * 18 + Math.sin(x * 0.03 - time * 0.4) * 6
          if (x === -20) ctx.moveTo(x, y)
          else ctx.lineTo(x, y)
        }
        ctx.stroke()
      }

      for (const k of koi) drawKoi(ctx, k, time)

      // Water tint over the koi: they sit just beneath the surface.
      ctx.fillStyle = 'rgba(40, 140, 150, 0.12)'
      ctx.fillRect(0, 0, w, h)

      // Food pellets floating on the surface
      for (const p of pellets) {
        const bob = Math.sin(time * 3 + p.x) * 1
        ctx.fillStyle = '#c9863c'
        ctx.strokeStyle = INK
        ctx.lineWidth = 1
        ctx.beginPath()
        ctx.arc(p.x, p.y + bob, 3, 0, Math.PI * 2)
        ctx.fill()
        ctx.stroke()
      }

      for (const r of ripples) {
        ctx.strokeStyle = `rgba(255,255,255,${0.75 * r.life})`
        ctx.lineWidth = r.width
        ctx.beginPath()
        ctx.ellipse(r.x, r.y, r.r, r.r * 0.92, 0, 0, Math.PI * 2)
        ctx.stroke()
        if (r.max > 40) {
          ctx.lineWidth = r.width * 0.6
          ctx.beginPath()
          ctx.ellipse(r.x, r.y, r.r * 0.6, r.r * 0.55, 0, 0, Math.PI * 2)
          ctx.stroke()
        }
      }

      for (const p of pads) drawPad(ctx, p, time)
      for (const p of petals) drawPetal(ctx, p)
      for (const g of glints) {
        const a = Math.sin(g.t * Math.PI)
        drawSparkle(ctx, g.x, g.y, g.s * a, a * 0.9)
      }
    }

    const loop = (now: number) => {
      const dt = Math.min((now - last) / 1000, 1 / 20)
      last = now
      step(dt)
      render()
      raf = requestAnimationFrame(loop)
    }

    const start = () => {
      if (running || reduced) return
      running = true
      last = performance.now()
      raf = requestAnimationFrame(loop)
    }
    const stop = () => {
      running = false
      cancelAnimationFrame(raf)
    }

    const toLocal = (e: PointerEvent) => {
      const rect = canvas.getBoundingClientRect()
      return { x: e.clientX - rect.left, y: e.clientY - rect.top }
    }

    const onMove = (e: PointerEvent) => {
      const p = toLocal(e)
      const dist = Math.hypot(p.x - pointer.x, p.y - pointer.y)
      const now = performance.now()
      pointer.speed = pointer.active ? dist : 0
      pointer.x = p.x
      pointer.y = p.y
      pointer.active = true
      // A trail of small ripples as the pointer skims the surface.
      if (dist > 6 && now - pointer.lastRipple > 110) {
        pointer.lastRipple = now
        addRipple(p.x, p.y, 22, 1.4)
      }
      // A sharp flick startles nearby koi.
      if (pointer.speed > 70) {
        for (const k of koi) {
          if (Math.hypot(k.spine[0].x - p.x, k.spine[0].y - p.y) < 120) k.scared = 0.8
        }
      }
    }
    const onLeave = () => {
      pointer.active = false
    }
    const onDown = (e: PointerEvent) => {
      const p = toLocal(e)
      addRipple(p.x, p.y, 70, 2.4)
      for (let i = 0; i < 4; i++) {
        pellets.push({ x: p.x + rand(-14, 14), y: p.y + rand(-14, 14), age: 0 })
      }
      if (pellets.length > 40) pellets.splice(0, pellets.length - 40)
      if (reduced) render()
    }

    resize()
    const ro = new ResizeObserver(resize)
    ro.observe(canvas)
    canvas.addEventListener('pointermove', onMove)
    canvas.addEventListener('pointerleave', onLeave)
    canvas.addEventListener('pointerdown', onDown)

    // Only animate while the pond is on screen.
    const io = new IntersectionObserver(([entry]) => (entry.isIntersecting ? start() : stop()))
    io.observe(canvas)

    const gctx = gsap.context(() => {
      gsap.from(rootRef.current, {
        opacity: 0,
        y: 40,
        duration: 1,
        scrollTrigger: { trigger: rootRef.current, start: 'top 80%' },
      })
    }, rootRef)

    return () => {
      gctx.revert()
      stop()
      io.disconnect()
      ro.disconnect()
      canvas.removeEventListener('pointermove', onMove)
      canvas.removeEventListener('pointerleave', onLeave)
      canvas.removeEventListener('pointerdown', onDown)
    }
  }, [])

  return (
    <section ref={rootRef} className="relative py-24 md:py-32 px-6 md:px-16 lg:px-24">
      <div className="max-w-6xl mx-auto">
        <p className="font-mono text-[11px] tracking-[0.22em] uppercase text-muted mb-4">
          04 — Experimental Playground
        </p>
        <h2 className="font-display text-3xl md:text-4xl tracking-tighter mb-8 max-w-lg">
          A small koi pond that notices you.
        </h2>
        <div className="relative overflow-hidden rounded-[28px] border-[3px] border-ink h-[420px] md:h-[540px] shadow-[8px_8px_0_0_#171714]">
          <canvas
            ref={canvasRef}
            className="w-full h-full block touch-none"
            data-cursor="FEED"
            aria-label="Interactive koi pond. Move the pointer to attract the koi and click to drop food."
            role="img"
          />
          <p className="pointer-events-none absolute bottom-4 left-4 rounded-full bg-paper/90 border border-ink/20 px-3 py-1.5 text-xs text-ink/80">
            Hold still to call the koi. Click to drop food.
          </p>
        </div>
      </div>
    </section>
  )
}
