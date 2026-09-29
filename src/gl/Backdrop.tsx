import { useFrame, useThree } from '@react-three/fiber'
import { useMemo } from 'react'
import * as THREE from 'three'
import { chapters } from '../data/story'
import { STATION } from '../scroll'
import { live } from './live'

// A very dark backdrop with one soft glow that sits behind the particle shape and takes on
// each chapter's colour. Colour lives in the light, not in flat blocks.

const BASE = '#0B0A09'
const TONES: { s: number; tone: string }[] = [
  { s: STATION.hero, tone: '#3A2716' },
  { s: STATION.prologue, tone: '#121A20' },
  ...chapters.map((c, i) => ({ s: STATION.chapter(i), tone: c.tone })),
  { s: STATION.numbers, tone: '#2A211A' },
  { s: STATION.letters, tone: '#1A1512' },
  { s: STATION.finale, tone: '#40251A' },
  { s: STATION.credits, tone: '#100E0C' },
]

const vertex = /* glsl */ `
varying vec2 vUv;
void main() {
  vUv = position.xy * 0.5 + 0.5;
  gl_Position = vec4(position.xy, 0.0, 1.0);
}
`

const fragment = /* glsl */ `
uniform vec3 uBase;
uniform vec3 uTone;
uniform float uTime;
uniform float uAspect;
uniform vec2 uGlow;
varying vec2 vUv;

float hash(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
float noise(vec2 p) {
  vec2 i = floor(p), f = fract(p);
  vec2 u = f * f * (3.0 - 2.0 * f);
  return mix(mix(hash(i), hash(i + vec2(1.0, 0.0)), u.x), mix(hash(i + vec2(0.0, 1.0)), hash(i + vec2(1.0, 1.0)), u.x), u.y);
}
float fbm(vec2 p) {
  float v = 0.0, a = 0.5;
  for (int i = 0; i < 4; i++) { v += a * noise(p); p *= 2.02; a *= 0.5; }
  return v;
}

void main() {
  vec2 p = (vUv - 0.5) * vec2(uAspect, 1.0);
  float n = fbm(p * 1.6 + vec2(uTime * 0.018, -uTime * 0.012));
  vec2 g = p - uGlow;
  float glow = exp(-dot(g, g) * 3.6) * (0.45 + 0.65 * n);
  vec2 g2 = p - vec2(-uGlow.x * 0.9, 0.62);
  float glow2 = exp(-dot(g2, g2) * 4.0) * 0.25 * n;
  // Colours here are linear, so a small addition already reads clearly on screen.
  vec3 col = uBase + uTone * (glow + glow2) * 0.42;
  col *= mix(0.55, 1.0, smoothstep(1.25, 0.2, length(p)));
  gl_FragColor = vec4(col, 1.0);
  #include <colorspace_fragment>
}
`

export default function Backdrop() {
  const { size } = useThree()
  const geometry = useMemo(() => {
    const g = new THREE.BufferGeometry()
    g.setAttribute('position', new THREE.BufferAttribute(new Float32Array([-1, -1, 0, 3, -1, 0, -1, 3, 0]), 3))
    return g
  }, [])
  const tones = useMemo(() => TONES.map((t) => ({ s: t.s, c: new THREE.Color(t.tone) })), [])
  const material = useMemo(
    () =>
      new THREE.ShaderMaterial({
        vertexShader: vertex,
        fragmentShader: fragment,
        depthTest: false,
        depthWrite: false,
        uniforms: {
          uBase: { value: new THREE.Color(BASE) },
          uTone: { value: new THREE.Color() },
          uTime: { value: 0 },
          uAspect: { value: 1 },
          uGlow: { value: new THREE.Vector2() },
        },
      }),
    [],
  )

  useFrame(({ clock }) => {
    const s = live.station
    let i = 0
    while (i < tones.length - 2 && s >= tones[i + 1].s) i++
    const a = tones[i]
    const b = tones[i + 1]
    const f = Math.min(1, Math.max(0, (s - a.s) / (b.s - a.s)))
    const u = material.uniforms
    u.uTone.value.copy(a.c).lerp(b.c, f * f * (3 - 2 * f))
    u.uTime.value = clock.elapsedTime
    const aspect = size.width / size.height
    u.uAspect.value = aspect
    // Follow the particle shape across the screen.
    u.uGlow.value.set((live.groupX / live.halfW) * aspect * 0.5, -0.02)
  })

  return <mesh geometry={geometry} material={material} renderOrder={-1} frustumCulled={false} />
}
