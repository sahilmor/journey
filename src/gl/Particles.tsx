import { useFrame, useThree } from '@react-three/fiber'
import { useEffect, useMemo, useRef, useState } from 'react'
import * as THREE from 'three'
import { chapters, letters } from '../data/story'
import { getStation, STATION } from '../scroll'
import { INTRO_MS, live } from './live'
import { particleFragment, particleVertex } from './particles.glsl'
import * as S from './shapes'

type ShapeName =
  | 'names'
  | 'galaxies'
  | 'galaxiesNear'
  | 'merge'
  | 'linked'
  | 'ring'
  | 'pheras'
  | 'diyas'
  | 'aperture'
  | 'moon'
  | 'waves'
  | 'days'
  | 'daysTilt'
  | 'dust'
  | 'portrait'
  | 'stars'

// Which shape tells each chapter. Chapters not listed here fall back to the linked rings.
const CHAPTER_SHAPE: Record<string, ShapeName> = {
  roka: 'merge', // the two galaxies become one
  'after-roka': 'linked', // two rings, linked
  engagement: 'ring',
  'pre-wedding': 'aperture', // a camera, for the shoot
  wedding: 'pheras', // seven rounds around the fire
  'karva-chauth': 'moon',
  diwali: 'diyas',
  udaipur: 'waves', // the lake at dusk
  now: 'days', // every day since the roka
}

// Half-width of each chapter shape in world units, used to size it to the free half of the screen.
const HALF_WIDTH: Partial<Record<ShapeName, number>> = {
  merge: 2.1,
  linked: 2.0,
  ring: 1.9,
  pheras: 1.45,
  diyas: 2.5,
  aperture: 1.85,
  moon: 1.95,
  waves: 3.45,
  days: 2.55,
  daysTilt: 2.6,
}
const LANDSCAPE = new Set<ShapeName>(['diyas', 'waves'])

// Rotation speed of each shape around its own Y and Z axes, radians per second.
const SPIN: Partial<Record<ShapeName, [number, number]>> = {
  merge: [0, 0.05],
  aperture: [0, 0.08],
  moon: [0, 0.01],
  ring: [0.32, 0],
  pheras: [0.28, 0],
  days: [0, 0.025],
  stars: [0.012, 0],
}

type Key = { s: number; shape: ShapeName; x: number; y: number; scale: number; opacity: number }

function keyframes(L: S.Layout): Key[] {
  const X = Math.min(2.9, Math.max(1.8, L.halfW * 0.5))
  const place = (shape: ShapeName, side: number): Omit<Key, 's' | 'shape' | 'opacity'> => {
    const hw = HALF_WIDTH[shape] ?? 2
    if (L.narrow) return { x: 0, y: 1.05, scale: Math.min(0.95, (L.halfW * 0.92) / hw) }
    const room = L.halfW * (LANDSCAPE.has(shape) ? 0.64 : 0.47)
    return { x: side * X, y: LANDSCAPE.has(shape) ? -0.35 : 0, scale: Math.min(1.05, room / hw) }
  }
  // Names, galaxies and the photograph are built at a reference width; fit them to this screen.
  const fit = (ref: number, share: number, max = 1.25) => Math.min(max, (L.halfW * 2 * share) / ref)
  const namesScale = L.narrow ? fit(S.REF.namesNarrow, 0.9) : fit(S.REF.namesWide, 0.86)
  const galaxiesScale = L.narrow ? fit(S.REF.galaxiesNarrow, 0.9, 1) : fit(S.REF.galaxiesWide, 0.9, 1.1)
  const portraitScale = L.narrow ? fit(S.REF.portraitNarrow, 0.95) : fit(S.REF.portraitWide, 0.62)
  const keys: Key[] = [
    { s: STATION.hero, shape: 'names', x: 0, y: L.narrow ? 0.95 : 0.3, scale: namesScale, opacity: 1 },
    { s: STATION.prologue, shape: 'galaxies', x: 0, y: L.narrow ? 0.25 : 0.1, scale: galaxiesScale, opacity: 1 },
    // While their story is read, the two galaxies glide towards each other.
    { s: STATION.story, shape: 'galaxiesNear', x: 0, y: L.narrow ? 0.25 : 0.1, scale: galaxiesScale, opacity: 0.5 },
  ]
  chapters.forEach((c, i) => {
    const shape = CHAPTER_SHAPE[c.id] ?? 'linked'
    // Even chapters put their words on the left, so the shape goes right.
    keys.push({ s: STATION.chapter(i), shape, ...place(shape, i % 2 === 0 ? 1 : -1), opacity: L.narrow ? 0.85 : 1 })
  })
  keys.push(
    { s: STATION.numbers, shape: 'daysTilt', ...place('daysTilt', 1), opacity: 1 },
    ...(letters.length > 0 ? [{ s: STATION.letters, shape: 'dust' as const, x: 0, y: 0, scale: 1, opacity: 0.7 }] : []),
    { s: STATION.finale, shape: 'portrait', x: 0, y: L.narrow ? 0.95 : 0.7, scale: portraitScale, opacity: 1 },
    { s: STATION.credits, shape: 'stars', x: 0, y: 0, scale: 1, opacity: 0.8 },
  )
  return keys
}

function layoutFor(camera: THREE.PerspectiveCamera, width: number, height: number): S.Layout {
  const halfH = Math.tan(THREE.MathUtils.degToRad(camera.fov / 2)) * camera.position.z
  const aspect = width / height
  return { narrow: aspect < 0.9 || width < 760, halfW: halfH * aspect, halfH }
}

// Everything except the photograph. The photograph is loaded afterwards and swapped in,
// so a slow image can never hold up the page.
async function buildShapes(n: number, narrow: boolean) {
  const names = await S.names(n, narrow)
  const shapes: Record<ShapeName, S.Shape> = {
    names,
    galaxies: S.galaxies(n, narrow),
    galaxiesNear: S.galaxies(n, narrow, true),
    merge: S.merge(n),
    linked: S.linked(n),
    ring: S.ring(n),
    pheras: S.pheras(n),
    diyas: S.diyas(n),
    aperture: S.aperture(n),
    moon: S.moon(n),
    waves: S.waves(n),
    days: S.days(n),
    daysTilt: S.days(n, true),
    dust: S.dust(n),
    portrait: names,
    stars: S.stars(n),
  }
  return shapes
}

const smooth = (a: number, b: number, x: number) => {
  const t = Math.min(1, Math.max(0, (x - a) / (b - a)))
  return t * t * (3 - 2 * t)
}

export default function Particles({ calm }: { calm: boolean }) {
  const { camera, size, gl } = useThree()
  const cam = camera as THREE.PerspectiveCamera
  const layout = layoutFor(cam, size.width, size.height)
  const n = layout.narrow ? 16000 : 34000

  // Shapes are rebuilt only when switching between the phone and desktop versions.
  const narrow = layout.narrow
  const [shapes, setShapes] = useState<Record<ShapeName, S.Shape> | null>(null)
  useEffect(() => {
    let cancelled = false
    const id = window.setTimeout(() => {
      buildShapes(n, narrow)
        .then((s) => {
          if (cancelled) return
          setShapes(s)
          requestAnimationFrame(() => window.dispatchEvent(new Event('gl:ready')))
          return S.portrait(n, narrow)
        })
        .then((photo) => {
          if (!cancelled && photo) setShapes((prev) => (prev ? { ...prev, portrait: photo } : prev))
        })
        .catch((err) => {
          console.error(err)
          window.dispatchEvent(new Event('gl:ready'))
        })
    }, 0)
    return () => {
      cancelled = true
      window.clearTimeout(id)
    }
  }, [n, narrow])

  // Placement depends on the screen size, but is cheap, so it follows every resize.
  const sizeKey = `${narrow}-${Math.round(layout.halfW * 20)}`
  const keys = useMemo(() => keyframes(layout), [sizeKey]) // eslint-disable-line react-hooks/exhaustive-deps

  const geometry = useMemo(() => {
    const g = new THREE.BufferGeometry()
    const r = new Float32Array(n * 4)
    for (let i = 0; i < r.length; i++) r[i] = Math.random()
    g.setAttribute('position', new THREE.BufferAttribute(new Float32Array(n * 3), 3))
    g.setAttribute('aTo', new THREE.BufferAttribute(new Float32Array(n * 3), 3))
    g.setAttribute('aColorFrom', new THREE.BufferAttribute(new Float32Array(n * 3), 3))
    g.setAttribute('aColorTo', new THREE.BufferAttribute(new Float32Array(n * 3), 3))
    g.setAttribute('aExtFrom', new THREE.BufferAttribute(new Float32Array(n * 2), 2))
    g.setAttribute('aExtTo', new THREE.BufferAttribute(new Float32Array(n * 2), 2))
    g.setAttribute('aRand', new THREE.BufferAttribute(r, 4))
    return g
  }, [n])
  useEffect(() => () => geometry.dispose(), [geometry])

  const material = useMemo(
    () =>
      new THREE.ShaderMaterial({
        vertexShader: particleVertex,
        fragmentShader: particleFragment,
        transparent: true,
        depthWrite: false,
        depthTest: false,
        blending: THREE.AdditiveBlending,
        uniforms: {
          uTime: { value: 0 },
          uMorph: { value: 0 },
          uIntro: { value: 0 },
          uSpinFrom: { value: new THREE.Vector2() },
          uSpinTo: { value: new THREE.Vector2() },
          uMouse: { value: new THREE.Vector3(99, 99, 0) },
          uMouseStrength: { value: 0 },
          uSize: { value: 30 },
          uPixelRatio: { value: 1 },
          uScale: { value: 1 },
          uCalm: { value: 0 },
          uSwarm: { value: 1 },
          uOpacity: { value: 1 },
        },
      }),
    [],
  )
  useEffect(() => () => material.dispose(), [material])

  const group = useRef<THREE.Points>(null)
  const st = useRef({ s: getStation(), seg: -1, strength: 0 })
  // New shapes or a new particle count: upload the current pair again on the next frame.
  useEffect(() => {
    st.current.seg = -1
  }, [shapes, geometry])
  const ray = useMemo(() => new THREE.Raycaster(), [])
  const hit = useMemo(() => new THREE.Vector3(), [])
  const ndc = useMemo(() => new THREE.Vector2(), [])

  useFrame(({ clock }, dt) => {
    const pts = group.current
    if (!pts || !shapes || shapes.names.pos.length !== pts.geometry.attributes.position.array.length) return
    const u = material.uniforms
    const time = clock.elapsedTime

    // Scroll, smoothed a little more than the page so the shapes feel weighty.
    const s = st.current
    s.s += (getStation() - s.s) * (calm ? 1 : 1 - Math.exp(-dt * 2.4))
    live.station = s.s

    let i = 0
    while (i < keys.length - 2 && s.s >= keys[i + 1].s) i++
    const k0 = keys[i]
    const k1 = keys[i + 1]
    const frac = Math.min(1, Math.max(0, (s.s - k0.s) / (k1.s - k0.s)))
    const m = calm ? (frac > 0.5 ? 1 : 0) : smooth(0.28, 0.82, frac)

    if (i !== s.seg) {
      const a = shapes[k0.shape]
      const b = shapes[k1.shape]
      const attr = pts.geometry.attributes
      ;(attr.position.array as Float32Array).set(a.pos)
      ;(attr.aTo.array as Float32Array).set(b.pos)
      ;(attr.aColorFrom.array as Float32Array).set(a.col)
      ;(attr.aColorTo.array as Float32Array).set(b.col)
      ;(attr.aExtFrom.array as Float32Array).set(a.ext)
      ;(attr.aExtTo.array as Float32Array).set(b.ext)
      for (const key of ['position', 'aTo', 'aColorFrom', 'aColorTo', 'aExtFrom', 'aExtTo']) attr[key].needsUpdate = true
      s.seg = i
    }

    const x = THREE.MathUtils.lerp(k0.x, k1.x, m)
    const y = THREE.MathUtils.lerp(k0.y, k1.y, m)
    const scale = THREE.MathUtils.lerp(k0.scale, k1.scale, m)
    pts.position.set(x, y, 0)
    pts.scale.setScalar(scale)
    live.groupX = x
    live.halfW = layout.halfW

    const spin0 = SPIN[k0.shape] ?? [0, 0]
    const spin1 = SPIN[k1.shape] ?? [0, 0]
    const spinT = calm ? 0 : time
    u.uSpinFrom.value.set(spin0[0] * spinT, spin0[1] * spinT)
    u.uSpinTo.value.set(spin1[0] * spinT, spin1[1] * spinT)

    // Cursor: find where it meets the particles' plane, in their local space.
    const p = live.pointer
    const active = !p.touch && performance.now() - p.at < 2500 ? 1 : 0
    s.strength += (active - s.strength) * Math.min(1, dt * 3)
    ndc.set(p.x, p.y)
    ray.setFromCamera(ndc, cam)
    const t = -ray.ray.origin.z / ray.ray.direction.z
    hit.copy(ray.ray.direction).multiplyScalar(t).add(ray.ray.origin)
    u.uMouse.value.set((hit.x - x) / scale, (hit.y - y) / scale, 0)
    u.uMouseStrength.value = calm ? 0 : s.strength

    u.uTime.value = time
    u.uMorph.value = m
    u.uIntro.value = live.introAt < 0 ? 0 : calm ? 1 : Math.min(1, (performance.now() - live.introAt) / INTRO_MS)
    u.uScale.value = scale
    u.uPixelRatio.value = gl.getPixelRatio()
    u.uSize.value = layout.narrow ? 26 : 30
    u.uCalm.value = calm ? 1 : 0
    // Moving between two versions of the galaxies is a glide, not a swarm.
    u.uSwarm.value = k0.shape.startsWith('galaxies') && k1.shape.startsWith('galaxies') ? 0.05 : 1
    u.uOpacity.value = THREE.MathUtils.lerp(k0.opacity, k1.opacity, m) * (1 - 0.62 * live.mediaCover)
  })

  if (!shapes) return null
  return <points ref={group} geometry={geometry} material={material} frustumCulled={false} />
}
