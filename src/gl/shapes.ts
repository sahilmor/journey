import * as THREE from 'three'
import { chapters, couple, finalePhoto } from '../data/story'
import { daysBetween, parse } from '../lib/dates'

// Every scene in the story is the same set of particles arranged differently.
// A shape is one arrangement: a position, colour and small "extra" record per particle.
// The first half of the particles always belongs to Aanya, the second half to Kabir, so when
// her name dissolves it becomes her galaxy, and the two halves meet at the first hello.

export type Shape = {
  pos: Float32Array // xyz
  col: Float32Array // linear rgb
  ext: Float32Array // [motion, size]  motion: 0 still, 1 wave, 2 flame, 3 drift, 4 twinkle
}

export type Layout = { narrow: boolean; halfW: number; halfH: number }

// Shapes are built once at a reference size and scaled to the screen at runtime, so resizing the
// window never has to rebuild them. These are the reference widths, in world units.
export const REF = {
  namesWide: 8.6, // one line: Aanya & Kabir
  namesNarrow: 2.6, // two lines on phones
  portraitWide: 6.2,
  portraitNarrow: 2.7,
  galaxiesWide: 8.6, // centre to centre plus both discs
  galaxiesNarrow: 2.4,
}

export const MOTION = { still: 0, wave: 1, flame: 2, drift: 3, twinkle: 4, diya: 5 } as const

const MET = parse(couple.firstMet)
export const TODAY_DAY = daysBetween(MET, new Date()) + 1

// ---------- small helpers ----------

function rng(seed: number) {
  return () => {
    seed |= 0
    seed = (seed + 0x6d2b79f5) | 0
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

function gauss(r: () => number) {
  return Math.sqrt(-2 * Math.log(r() + 1e-9)) * Math.cos(2 * Math.PI * r())
}

const C = (hex: string) => new THREE.Color(hex)
const tmp = new THREE.Color()

class Builder {
  pos: Float32Array
  col: Float32Array
  ext: Float32Array
  constructor(public n: number) {
    this.pos = new Float32Array(n * 3)
    this.col = new Float32Array(n * 3)
    this.ext = new Float32Array(n * 2)
  }
  set(i: number, x: number, y: number, z: number, c: THREE.Color, brightness = 1, motion = 0, size = 1) {
    this.pos[i * 3] = x
    this.pos[i * 3 + 1] = y
    this.pos[i * 3 + 2] = z
    this.col[i * 3] = c.r * brightness
    this.col[i * 3 + 1] = c.g * brightness
    this.col[i * 3 + 2] = c.b * brightness
    this.ext[i * 2] = motion
    this.ext[i * 2 + 1] = size
  }
  // Rotate every point around the X then Y axis (radians).
  tilt(ax: number, ay = 0) {
    const cx = Math.cos(ax), sx = Math.sin(ax), cy = Math.cos(ay), sy = Math.sin(ay)
    for (let i = 0; i < this.n; i++) {
      const x = this.pos[i * 3], y = this.pos[i * 3 + 1], z = this.pos[i * 3 + 2]
      const y1 = y * cx - z * sx
      const z1 = y * sx + z * cx
      this.pos[i * 3] = x * cy + z1 * sy
      this.pos[i * 3 + 1] = y1
      this.pos[i * 3 + 2] = -x * sy + z1 * cy
    }
    return this
  }
  done(): Shape {
    return { pos: this.pos, col: this.col, ext: this.ext }
  }
}

// Value noise, enough for terrain.
function makeNoise(seed: number) {
  const r = rng(seed)
  const perm = new Uint8Array(512)
  const vals = new Float32Array(256)
  for (let i = 0; i < 256; i++) {
    perm[i] = i
    vals[i] = r()
  }
  for (let i = 255; i > 0; i--) {
    const j = Math.floor(r() * (i + 1))
    ;[perm[i], perm[j]] = [perm[j], perm[i]]
  }
  for (let i = 0; i < 256; i++) perm[i + 256] = perm[i]
  const f = (t: number) => t * t * (3 - 2 * t)
  return (x: number, y: number) => {
    const xi = Math.floor(x), yi = Math.floor(y)
    const xf = x - xi, yf = y - yi
    const a = vals[perm[(xi & 255) + perm[yi & 255]]]
    const b = vals[perm[((xi + 1) & 255) + perm[yi & 255]]]
    const c = vals[perm[(xi & 255) + perm[(yi + 1) & 255]]]
    const d = vals[perm[((xi + 1) & 255) + perm[(yi + 1) & 255]]]
    const u = f(xf), v = f(yf)
    return a + (b - a) * u + (c - a) * v + (a - b - c + d) * u * v
  }
}

// ---------- shapes ----------

const GOLD = C('#E3B873')
const GOLD_CORE = C('#FFF0D2')
const MOON = C('#A9BFD3')
const MOON_CORE = C('#EEF3F8')
const BONE = C('#EFE4D2')
const AMP = C('#D6AD63')

/** Their names, drawn in the display serif and sampled into points. */
export async function names(n: number, narrow: boolean): Promise<Shape> {
  const L = { narrow }
  await Promise.race([
    Promise.all([
      document.fonts.load('400 120px "Instrument Serif"'),
      document.fonts.load('italic 400 120px "Instrument Serif"'),
    ]),
    new Promise((r) => setTimeout(r, 2500)),
  ])
  const W = L.narrow ? 1200 : 2600
  const H = L.narrow ? 1100 : 700
  const runs = L.narrow
    ? [
        { text: couple.a, italic: false, line: 0 },
        { text: '&', italic: true, line: 1 },
        { text: couple.b, italic: false, line: 1 },
      ]
    : [
        { text: couple.a, italic: false, line: 0 },
        { text: '&', italic: true, line: 0 },
        { text: couple.b, italic: false, line: 0 },
      ]

  const probe = document.createElement('canvas').getContext('2d')!
  const fontFor = (italic: boolean, px: number) => `${italic ? 'italic ' : ''}400 ${px}px "Instrument Serif", serif`
  const gap = 0.22 // space between runs, in em
  const lineWidth = (px: number, line: number) =>
    runs
      .filter((r) => r.line === line)
      .reduce((w, r, i) => {
        probe.font = fontFor(r.italic, px)
        return w + probe.measureText(r.text).width + (i > 0 ? gap * px : 0)
      }, 0)
  const lines = L.narrow ? 2 : 1
  let px = 400
  const widest = () => Math.max(...Array.from({ length: lines }, (_, l) => lineWidth(px, l)))
  px = Math.floor((px * (W * 0.94)) / widest())
  if (L.narrow) px = Math.min(px, Math.floor(H / 2.3))

  // Draw each run on its own canvas so we know which pixels belong to whom.
  const pixelsOf: number[][] = []
  const lineY = (line: number) => (lines === 1 ? H * 0.62 : H * (0.42 + line * 0.46))
  const cursor = Array.from({ length: lines }, (_, l) => (W - lineWidth(px, l)) / 2)
  for (const run of runs) {
    const cv = document.createElement('canvas')
    cv.width = W
    cv.height = H
    const g = cv.getContext('2d', { willReadFrequently: true })!
    g.font = fontFor(run.italic, px)
    g.fillStyle = '#fff'
    g.textBaseline = 'alphabetic'
    g.fillText(run.text, cursor[run.line], lineY(run.line))
    cursor[run.line] += g.measureText(run.text).width + gap * px
    const data = g.getImageData(0, 0, W, H).data
    const list: number[] = []
    for (let y = 0; y < H; y += 2) for (let x = 0; x < W; x += 2) if (data[(y * W + x) * 4 + 3] > 120) list.push(x, y)
    pixelsOf.push(list)
  }

  const scale = (L.narrow ? REF.namesNarrow : REF.namesWide) / (W * 0.94)
  const b = new Builder(n)
  const r = rng(3)
  const half = Math.floor(n / 2)
  const [aPix, ampPix, bPix] = pixelsOf
  const bTotal = ampPix.length + bPix.length
  for (let i = 0; i < n; i++) {
    let list: number[]
    let color = BONE
    if (i < half) list = aPix
    else if (r() < ampPix.length / bTotal) {
      list = ampPix
      color = AMP
    } else list = bPix
    const k = Math.floor(r() * (list.length / 2)) * 2
    const x = (list[k] + r() * 2 - W / 2) * scale
    const y = -(list[k + 1] + r() * 2 - H / 2) * scale
    const sparkle = r() < 0.04
    b.set(i, x, y, (r() - 0.5) * 0.14, color, sparkle ? 1.25 : 0.62 + r() * 0.3, MOTION.twinkle, sparkle ? 1.7 : 0.9)
  }
  return b.done()
}

function galaxy(b: Builder, from: number, to: number, cx: number, cy: number, R: number, arm: THREE.Color, core: THREE.Color, seed: number, armOffset = 0) {
  const r = rng(seed)
  for (let i = from; i < to; i++) {
    const isCore = r() < 0.12
    const rad = isCore ? Math.abs(gauss(r)) * R * 0.12 : R * Math.pow(r(), 0.6)
    const armIndex = r() < 0.5 ? 0 : 1
    const theta = armOffset + armIndex * Math.PI + (rad / R) * 3.4 + gauss(r) * 0.28
    const spread = (1 - rad / R) * 0.12 + 0.02
    const x = Math.cos(theta) * rad + gauss(r) * spread
    const z = Math.sin(theta) * rad + gauss(r) * spread
    const y = gauss(r) * spread * 0.6
    tmp.copy(core).lerp(arm, Math.min(1, rad / (R * 0.45)))
    const bright = isCore ? 1.1 : 0.45 + (1 - rad / R) * 0.55
    // Tilt the disc towards the viewer.
    const tx = 1.05
    const y1 = y * Math.cos(tx) - z * Math.sin(tx)
    const z1 = y * Math.sin(tx) + z * Math.cos(tx)
    b.set(i, cx + x, cy + y1, z1, tmp, bright, MOTION.twinkle, isCore ? 1.2 : 0.9)
  }
}

/** Before: two separate lives, two small galaxies far apart.
 *  `near` is the same pair drawn closer, reached by the end of their first-meeting story. */
export function galaxies(n: number, narrow: boolean, near = false): Shape {
  const b = new Builder(n)
  const half = Math.floor(n / 2)
  if (narrow) {
    const d = near ? 1.0 : 1.45
    galaxy(b, 0, half, 0, d, 1.05, GOLD, GOLD_CORE, 11)
    galaxy(b, half, n, 0, -d, 1.05, MOON, MOON_CORE, 12)
  } else {
    const d = near ? 2.15 : 2.85
    galaxy(b, 0, half, -d, near ? 0.1 : 0.25, 1.45, GOLD, GOLD_CORE, 11)
    galaxy(b, half, n, d, near ? -0.05 : -0.2, 1.45, MOON, MOON_CORE, 12)
  }
  return b.done()
}

/** After the roka: two rings, one hers and one his, linked through each other. */
export function linked(n: number): Shape {
  const b = new Builder(n)
  const r = rng(131)
  const half = Math.floor(n / 2)
  const R = 1.15
  for (let i = 0; i < n; i++) {
    const mine = i < half
    const u = r() * Math.PI * 2
    const v = r() * Math.PI * 2
    const t = 0.06 * Math.sqrt(r())
    const a = (R + t * Math.cos(v)) * Math.cos(u)
    const c = (R + t * Math.cos(v)) * Math.sin(u)
    const d = t * Math.sin(v)
    // Hers stands upright, his lies flat, each passing through the other's centre.
    const [x, y, z] = mine ? [a - 0.62, c, d] : [a + 0.62, d, c]
    const facing = 0.55 + 0.45 * Math.max(0, mine ? d / 0.06 : c / R)
    b.set(i, x, y, z, mine ? GOLD : MOON, 0.45 + facing * 0.55, MOTION.twinkle, 0.85)
  }
  return b.tilt(0.55, 0.5).done()
}

/** The pre-wedding shoot: a camera aperture, six blades around a hexagonal opening. */
export function aperture(n: number): Shape {
  const b = new Builder(n)
  const r = rng(151)
  const R = 1.75
  const open = 0.72
  const blades = 6
  const silver = C('#DCD6CC')
  const gold = C('#E3B873')
  const hex = (k: number) => {
    const a = (k / blades) * Math.PI * 2 + Math.PI / 6
    return [Math.cos(a) * open, Math.sin(a) * open]
  }
  for (let i = 0; i < n; i++) {
    const part = r()
    if (part < 0.28) {
      // The lens barrel: two close rings.
      const a = r() * Math.PI * 2
      const rad = (r() < 0.6 ? R : R * 0.93) + gauss(r) * 0.01
      b.set(i, Math.cos(a) * rad, Math.sin(a) * rad, gauss(r) * 0.03, silver, 0.55 + r() * 0.3, MOTION.twinkle, 0.85)
    } else if (part < 0.5) {
      // The opening: a bright hexagon.
      const k = Math.floor(r() * blades)
      const [x1, y1] = hex(k)
      const [x2, y2] = hex(k + 1)
      const t = r()
      b.set(i, x1 + (x2 - x1) * t, y1 + (y2 - y1) * t, 0, gold, 1.0, MOTION.twinkle, 0.95)
    } else if (part < 0.78) {
      // Blade edges: each runs from a corner of the opening out to the barrel.
      const k = Math.floor(r() * blades)
      const [x1, y1] = hex(k)
      const a = Math.atan2(y1, x1) + 0.95
      const x2 = Math.cos(a) * R * 0.93
      const y2 = Math.sin(a) * R * 0.93
      const t = r()
      b.set(i, x1 + (x2 - x1) * t, y1 + (y2 - y1) * t, 0, silver, 0.6, MOTION.still, 0.8)
    } else {
      // Faint blade surfaces between the opening and the barrel.
      const a = r() * Math.PI * 2
      const rad = open + (R * 0.93 - open) * Math.sqrt(r())
      b.set(i, Math.cos(a) * rad, Math.sin(a) * rad, gauss(r) * 0.02, silver, 0.14 + r() * 0.1, MOTION.still, 0.7)
    }
  }
  return b.tilt(0.15, -0.2).done()
}

/** Karva Chauth: the full moon everyone waits for. */
export function moon(n: number): Shape {
  const b = new Builder(n)
  const r = rng(161)
  const noise = makeNoise(29)
  const R = 1.7
  const disc = Math.floor(n * 0.86)
  const bright = C('#F4EAD2')
  const mare = C('#9C8E74')
  const golden = Math.PI * (3 - Math.sqrt(5))
  for (let i = 0; i < disc; i++) {
    const rad = Math.sqrt((i + 0.5) / disc)
    const a = i * golden
    const x = Math.cos(a) * rad * R
    const y = Math.sin(a) * rad * R
    // Darker seas from noise, and the edge dimming a real moon has.
    const m = noise(x * 0.9 + 3, y * 0.9 + 7) * 0.65 + noise(x * 2.3, y * 2.3) * 0.35
    const sea = Math.min(1, Math.max(0, (m - 0.42) * 3))
    const limb = Math.sqrt(1 - rad * rad)
    tmp.copy(bright).lerp(mare, sea * 0.75)
    b.set(i, x + gauss(r) * 0.006, y + gauss(r) * 0.006, limb * 0.4, tmp, (0.4 + limb * 0.6) * (1 - sea * 0.35), MOTION.still, 0.85)
  }
  const halo = C('#E8C98A')
  for (let i = disc; i < n; i++) {
    const a = r() * Math.PI * 2
    const rad = R * (1.03 + Math.abs(gauss(r)) * 0.18)
    b.set(i, Math.cos(a) * rad, Math.sin(a) * rad, -0.1, halo, 0.12 + r() * 0.12, MOTION.twinkle, 0.8)
  }
  return b.done()
}

/** Diwali: rows of small lamps, each with its own flame. */
export function diyas(n: number): Shape {
  const b = new Builder(n)
  const r = rng(141)
  // Lamps in gentle arcs, further rows further back.
  const lamps: [number, number][] = []
  const rows = [
    { z: 1.1, count: 7, spread: 3.0 },
    { z: 0.2, count: 9, spread: 3.6 },
    { z: -0.8, count: 11, spread: 4.2 },
    { z: -1.9, count: 13, spread: 4.8 },
  ]
  for (const row of rows)
    for (let k = 0; k < row.count; k++) {
      const x = -row.spread / 2 + (row.spread * k) / (row.count - 1)
      lamps.push([x + (r() - 0.5) * 0.12, row.z - Math.pow(x / row.spread, 2) * 0.6])
    }
  const clay = C('#9A5530')
  const flameLo = C('#FF6A1A')
  const flameHi = C('#FFE8B0')
  const glowC = C('#FFB25C')
  for (let i = 0; i < n; i++) {
    const [lx, lz] = lamps[i % lamps.length]
    const part = r()
    if (part < 0.42) {
      // The clay bowl: a shallow lens, seen from slightly above.
      const a = r() * Math.PI * 2
      const rad = 0.17 * Math.sqrt(r())
      const x = Math.cos(a) * rad
      const z = Math.sin(a) * rad * 0.8
      const y = -0.06 * (1 - (rad / 0.17) ** 2) - 0.02
      b.set(i, lx + x, -0.9 + y, lz + z, clay, 0.35 + r() * 0.25, MOTION.still, 0.75)
    } else if (part < 0.9) {
      // The flame: a small teardrop that flickers.
      const h = Math.pow(r(), 1.2)
      const rad = 0.05 * Math.sin(Math.PI * Math.min(1, h * 1.15 + 0.1)) * Math.sqrt(r())
      const a = r() * Math.PI * 2
      tmp.copy(flameLo).lerp(flameHi, h)
      b.set(i, lx + Math.cos(a) * rad, -0.86 + h * 0.2, lz + Math.sin(a) * rad, tmp, 1.0, MOTION.diya, 0.95)
    } else {
      // Warm light pooled on the floor around each lamp.
      const a = r() * Math.PI * 2
      const rad = 0.18 + Math.abs(gauss(r)) * 0.25
      b.set(i, lx + Math.cos(a) * rad, -0.96, lz + Math.sin(a) * rad * 0.8, glowC, 0.12 + r() * 0.1, MOTION.twinkle, 0.7)
    }
  }
  return b.tilt(0.42).done()
}

/** The first hello: the two galaxies drawn into one, arms interleaved. */
export function merge(n: number): Shape {
  const b = new Builder(n)
  const half = Math.floor(n / 2)
  galaxy(b, 0, half, 0, 0, 2.0, GOLD, GOLD_CORE, 21, 0)
  galaxy(b, half, n, 0, 0, 2.0, MOON, MOON_CORE, 22, Math.PI / 2)
  return b.tilt(0.05, -0.2).done()
}

/** The yes: a ring, turning slowly, with a stone that catches the light. */
export function ring(n: number): Shape {
  const b = new Builder(n)
  const r = rng(31)
  const R = 1.55
  const tube = 0.085
  const cy = -0.25
  const gem = Math.floor(n * 0.14)
  const gold = C('#D8B57A')
  const goldHi = C('#FFE7BC')
  const ice = C('#DDE9F2')
  const white = C('#FFFFFF')
  for (let i = 0; i < n - gem; i++) {
    const u = r() * Math.PI * 2
    const v = r() * Math.PI * 2
    const t = tube * (0.85 + r() * 0.3)
    const x = (R + t * Math.cos(v)) * Math.cos(u)
    const y = (R + t * Math.cos(v)) * Math.sin(u) + cy
    const z = t * Math.sin(v)
    // Brighter on the side of the band that faces us, like polished metal.
    const facing = Math.max(0, Math.sin(v)) * 0.6 + Math.max(0, Math.cos(v) * Math.sin(u)) * 0.3
    tmp.copy(gold).lerp(goldHi, facing)
    b.set(i, x, y, z, tmp, 0.55 + facing * 0.6, MOTION.still, 0.85)
  }
  // Brilliant cut: a short crown on top of a deeper pavilion, point towards the band.
  const gx = 0
  const gy = cy + R + 0.36
  for (let i = n - gem; i < n; i++) {
    const a = r() * Math.PI * 2
    const crown = r() < 0.45
    let x: number, y: number, rad: number
    if (crown) {
      const h = r()
      rad = 0.34 - h * 0.14
      y = gy + h * 0.16
    } else {
      const h = r()
      rad = 0.34 * (1 - h)
      y = gy - h * 0.42
    }
    const facet = Math.floor((a / (Math.PI * 2)) * 16) / 16 * Math.PI * 2 // flat facets
    x = gx + Math.cos(facet + (a - facet) * 0.3) * rad * (r() < 0.8 ? 1 : r())
    const z = Math.sin(facet + (a - facet) * 0.3) * rad
    tmp.copy(ice).lerp(white, r())
    b.set(i, x, y, z, tmp, 0.9 + r() * 0.5, MOTION.twinkle, 1.1 + r() * 0.8)
  }
  return b.tilt(0.22).done()
}

/** Saat phere: two paths walking seven rounds around the sacred fire. */
export function pheras(n: number): Shape {
  const b = new Builder(n)
  const r = rng(41)
  const fire = Math.floor(n * 0.2)
  const base = Math.floor(n * 0.06)
  const half = Math.floor((n - fire - base) / 2)
  const R = 1.2
  const fireLo = C('#C8321E')
  const fireMid = C('#F08A32')
  const fireHi = C('#FFE2A6')
  let i = 0
  for (let s = 0; s < 2; s++) {
    for (let k = 0; k < half; k++, i++) {
      const t = r()
      const theta = t * Math.PI * 2 * 7 + s * Math.PI
      const y = -1.6 + t * 3.2
      const jitter = Math.abs(gauss(r)) * 0.03
      const x = Math.cos(theta) * (R + jitter) + gauss(r) * 0.02
      const z = Math.sin(theta) * (R + jitter) + gauss(r) * 0.02
      b.set(i, x, y, z, s === 0 ? GOLD : MOON, 0.55 + r() * 0.5, MOTION.twinkle, 0.9)
    }
  }
  for (let k = 0; k < fire; k++, i++) {
    const h = Math.pow(r(), 1.4)
    const rad = 0.34 * Math.pow(1 - h, 0.8) * Math.sqrt(r())
    const a = r() * Math.PI * 2
    tmp.copy(fireLo).lerp(fireMid, Math.min(1, h * 2)).lerp(fireHi, Math.max(0, h * 2 - 1) * 0.8)
    b.set(i, Math.cos(a) * rad, -1.55 + h * 1.0, Math.sin(a) * rad, tmp, 0.9, MOTION.flame, 1.1)
  }
  for (; i < n; i++) {
    const a = r() * Math.PI * 2
    const rad = 1.55 + gauss(r) * 0.03
    b.set(i, Math.cos(a) * rad, -1.72, Math.sin(a) * rad, GOLD, 0.3, MOTION.still, 0.8)
  }
  return b.tilt(0.2).done()
}

/** First trip: a ridge line of mountains, drawn as scan lines, with the path they took. */
export function mountains(n: number): Shape {
  const b = new Builder(n)
  const r = rng(51)
  const noise = makeNoise(7)
  const height = (x: number, z: number) => {
    let v = 0
    let amp = 1
    let f = 0.55
    let total = 0
    for (let o = 0; o < 5; o++) {
      const nv = noise(x * f + 11, z * f + 5)
      v += amp * (1 - Math.abs(nv * 2 - 1))
      total += amp
      amp *= 0.5
      f *= 2.1
    }
    const edge = 1 - Math.pow(Math.min(1, Math.abs(x) / 3.3), 4)
    return (Math.pow(v / total, 1.8) * 2.4 - 0.75) * edge - (1 - edge) * 0.75
  }
  const rows = 64
  const trail = Math.floor(n * 0.05)
  const low = C('#1D3440')
  const high = C('#EEF3F5')
  for (let i = 0; i < n - trail; i++) {
    const row = Math.floor(r() * rows)
    const z = -1.9 + (row / (rows - 1)) * 3.8
    const x = -3.2 + r() * 6.4
    const y = height(x, z)
    const t = Math.min(1, Math.max(0, (y + 0.75) / 1.9))
    tmp.copy(low).lerp(high, Math.pow(t, 1.2))
    b.set(i, x, y, z, tmp, 0.35 + t * 0.75, MOTION.still, 0.8)
  }
  const trailC = C('#F2C98A')
  for (let i = n - trail; i < n; i++) {
    const x = -2.8 + r() * 5.2
    const z = Math.sin(x * 0.9) * 0.9 + 0.3
    b.set(i, x, height(x, z) + 0.035, z, trailC, 1.1, MOTION.twinkle, 1.0)
  }
  return b.tilt(0.5).done()
}

/** The beach year: a sea drawn in scan lines, moving, with the sun going down. */
export function waves(n: number): Shape {
  const b = new Builder(n)
  const r = rng(71)
  const sun = Math.floor(n * 0.08)
  const glint = Math.floor(n * 0.06)
  const sea = n - sun - glint
  const deep = C('#1E6A74')
  const crest = C('#BFE6E4')
  const rows = 70
  for (let i = 0; i < sea; i++) {
    const row = Math.floor(r() * rows)
    const z = -2.7 + (row / (rows - 1)) * 4.1
    const x = -3.4 + r() * 6.8
    const y = Math.sin(x * 1.3 + z * 0.8) * 0.06 - 0.2
    const near = (z + 2.7) / 4.1
    // Feather the sides and the near edge so the sea has no hard border, and fade it
    // towards the horizon.
    const side = 1 - Math.pow(Math.abs(x) / 3.4, 3)
    const edge = Math.min(1, (1 - near) * 5) * (0.35 + near * 0.65)
    tmp.copy(deep).lerp(crest, r() * 0.45 + near * 0.35)
    b.set(i, x, y, z, tmp, (0.25 + near * 0.6) * side * edge, MOTION.wave, 0.8)
  }
  const sunA = C('#F08A5D')
  const sunB = C('#FFE0B5')
  let i = sea
  for (let k = 0; k < sun; k++, i++) {
    const a = r() * Math.PI * 2
    const rad = 0.62 * Math.sqrt(r())
    const y = 0.55 + Math.sin(a) * rad
    if (y < 0.05) {
      i--
      k--
      continue // the horizon hides the bottom of the sun
    }
    tmp.copy(sunB).lerp(sunA, rad / 0.62)
    b.set(i, 0.9 + Math.cos(a) * rad, y, -2.75, tmp, 1.0, MOTION.twinkle, 1.0)
  }
  for (; i < n; i++) {
    const z = -2.6 + r() * 3.9
    const x = 0.9 + gauss(r) * (0.1 + (z + 2.6) * 0.06)
    tmp.copy(sunA).lerp(sunB, r())
    b.set(i, x, -0.18, z, tmp, 0.7 + r() * 0.5, MOTION.wave, 0.9)
  }
  return b.tilt(0.32).done()
}

/** Every day since the first hello, on a spiral that goes round once a year.
 *  The first day is at the centre, today is at the outer edge, the chapters glow. */
export function days(n: number, tilted = false): Shape {
  const b = new Builder(n)
  const r = rng(81)
  const total = TODAY_DAY
  const perDay = Math.max(1, Math.floor((n * 0.5) / total))
  const lineN = Math.min(n, total * perDay)
  const r0 = 0.28
  const R = 2.45
  const milestone = new Map<number, THREE.Color>()
  chapters.forEach((ch) => milestone.set(daysBetween(MET, parse(ch.date)), C(ch.accent)))
  const day = C('#EDE2CE')
  const at = (d: number) => {
    const theta = (d / 365.25) * Math.PI * 2 + Math.PI / 2
    const rad = r0 + (R - r0) * (d / total)
    return [Math.cos(theta) * rad, Math.sin(theta) * rad]
  }
  for (let i = 0; i < lineN; i++) {
    const d = Math.floor(i / perDay) + r()
    const [x, y] = at(d)
    const age = d / total // 0 at the first hello, 1 today
    const m = milestone.get(Math.floor(d))
    if (m && i % perDay < Math.ceil(perDay * 0.7)) {
      b.set(i, x + gauss(r) * 0.03, y + gauss(r) * 0.03, 0.02, m, 1.5, MOTION.twinkle, 2.6)
    } else {
      b.set(i, x + gauss(r) * 0.012, y + gauss(r) * 0.012, gauss(r) * 0.02, day, 0.28 + age * 0.62, MOTION.twinkle, 0.85)
    }
  }
  const dust = C('#6B5F52')
  for (let i = lineN; i < n; i++) {
    const dir = new THREE.Vector3(gauss(r), gauss(r), gauss(r)).normalize()
    const rad = 3.2 + r() * 3.5
    b.set(i, dir.x * rad, dir.y * rad * 0.7, dir.z * rad - 1, dust, 0.12 + r() * 0.18, MOTION.drift, 0.7)
  }
  if (tilted) b.tilt(-1.0, 0.3)
  return b.done()
}

/** A quiet field of dust for reading the letters. */
export function dust(n: number): Shape {
  const b = new Builder(n)
  const r = rng(91)
  const c = C('#8C7D6B')
  for (let i = 0; i < n; i++) {
    b.set(i, (r() - 0.5) * 13, (r() - 0.5) * 7.5, -4 + r() * 6, c, 0.12 + r() * 0.3, MOTION.drift, 0.8)
  }
  return b.done()
}

/** The end: stars, wide and far. */
export function stars(n: number): Shape {
  const b = new Builder(n)
  const r = rng(101)
  const c = C('#CFC4B3')
  for (let i = 0; i < n; i++) {
    const dir = new THREE.Vector3(gauss(r), gauss(r), gauss(r)).normalize()
    const rad = 4.5 + r() * 5
    const bright = r() < 0.03
    b.set(i, dir.x * rad, dir.y * rad, dir.z * rad - 2, c, bright ? 0.9 : 0.15 + r() * 0.25, MOTION.twinkle, bright ? 1.6 : 0.8)
  }
  return b.done()
}

/** Their photograph, rebuilt from particles. Bright areas get particles, dark ones stay empty. */
export async function portrait(n: number, narrow: boolean, photo = finalePhoto): Promise<Shape | null> {
  if (!photo) return null
  const src = photo.src
  const img = new Image()
  img.crossOrigin = 'anonymous'
  img.src = src
  try {
    await img.decode()
  } catch {
    return null
  }
  const w = 300
  const h = Math.round((w * img.naturalHeight) / img.naturalWidth)
  const cv = document.createElement('canvas')
  cv.width = w
  cv.height = h
  const g = cv.getContext('2d', { willReadFrequently: true })!
  g.drawImage(img, 0, 0, w, h)
  let data: Uint8ClampedArray
  try {
    data = g.getImageData(0, 0, w, h).data
  } catch {
    return null
  }
  const lum = new Float32Array(w * h)
  const cdf = new Float32Array(w * h)
  let total = 0
  for (let p = 0; p < w * h; p++) {
    const l = (0.2126 * data[p * 4] + 0.7152 * data[p * 4 + 1] + 0.0722 * data[p * 4 + 2]) / 255
    lum[p] = l
    // "light" photos are drawn by their bright parts, "dark" ones (silhouettes against a
    // bright sky) by their dark parts. The frame edges fade out so there is no hard border.
    const v = photo.mode === 'dark' ? 1 - l : l
    const u = (p % w) / w - 0.5
    const q = Math.floor(p / w) / h - 0.5
    const edge = Math.min(1, Math.max(0, (0.5 - Math.max(Math.abs(u), Math.abs(q))) / 0.12))
    const s = Math.min(1, Math.max(0, (v - 0.35) / 0.55))
    total += Math.pow(s, 1.5) * edge
    cdf[p] = total
  }
  const W = narrow ? REF.portraitNarrow : REF.portraitWide
  const H = (W * h) / w
  // Duotone in the site's warm palette rather than the photo's own colours.
  const stops = [C('#2E120B'), C('#A9492B'), C('#E7A564'), C('#FFF1DA')]
  const grade = (t: number) => {
    const s = Math.min(0.999, Math.max(0, t)) * (stops.length - 1)
    const k = Math.floor(s)
    return tmp.copy(stops[k]).lerp(stops[k + 1], s - k)
  }
  const b = new Builder(n)
  const r = rng(111)
  for (let i = 0; i < n; i++) {
    const target = r() * total
    let lo = 0
    let hi = w * h - 1
    while (lo < hi) {
      const mid = (lo + hi) >> 1
      if (cdf[mid] < target) lo = mid + 1
      else hi = mid
    }
    const px = lo % w
    const py = Math.floor(lo / w)
    const l = photo.mode === 'dark' ? 1 - lum[lo] : lum[lo]
    const x = ((px + r()) / w - 0.5) * W
    const y = -((py + r()) / h - 0.5) * H
    b.set(i, x, y, (l - 0.5) * 0.35, grade(0.3 + l * 0.7), 0.7 + l * 0.4, MOTION.twinkle, 0.75 + l * 0.5)
  }
  return b.done()
}
