import { useFrame, useThree } from '@react-three/fiber'
import { useEffect, useMemo, useRef } from 'react'
import * as THREE from 'three'
import { getVelocity } from '../scroll'
import { live } from './live'
import { mediaFragment, mediaVertex } from './media.glsl'

// Photos and videos stay in the HTML (for layout, alt text, the lightbox and as a fallback), but
// are drawn in WebGL at exactly the same rectangle so they can be revealed, graded and bent.

type Item = {
  el: HTMLElement
  media: HTMLImageElement | HTMLVideoElement
  mesh: THREE.Mesh
  mat: THREE.ShaderMaterial
  tex: THREE.Texture | null
  hover: number
  hoverTarget: number
  revealStart: number
  cleanup: () => void
}

export default function Media({ scene, calm }: { scene: THREE.Scene; calm: boolean }) {
  const { size, gl } = useThree()
  const items = useRef<Item[]>([])
  const geometry = useMemo(() => new THREE.PlaneGeometry(1, 1, 24, 24), [])
  const velocity = useRef(0)

  useEffect(() => {
    const anisotropy = Math.min(8, gl.capabilities.getMaxAnisotropy())
    const els = Array.from(document.querySelectorAll<HTMLElement>('[data-gl-media]'))
    items.current = els.flatMap((el) => {
      const media = el.querySelector<HTMLImageElement | HTMLVideoElement>('img, video')
      if (!media) return []
      const mat = new THREE.ShaderMaterial({
        vertexShader: mediaVertex,
        fragmentShader: mediaFragment,
        transparent: true,
        depthTest: false,
        depthWrite: false,
        uniforms: {
          uTex: { value: null },
          uImage: { value: new THREE.Vector2(1, 1) },
          uPlane: { value: new THREE.Vector2(1, 1) },
          uReveal: { value: 0 },
          uHover: { value: 0 },
          uMouse: { value: new THREE.Vector2(0.5, 0.5) },
          uVelocity: { value: 0 },
          uParallax: { value: 0 },
          uTime: { value: 0 },
          uRadius: { value: 0 },
        },
      })
      const mesh = new THREE.Mesh(geometry, mat)
      mesh.visible = false
      mesh.frustumCulled = false
      scene.add(mesh)

      const item: Item = { el, media, mesh, mat, tex: null, hover: 0, hoverTarget: 0, revealStart: -1, cleanup: () => {} }

      const ready = () => {
        if (item.tex) return
        let tex: THREE.Texture
        if (media instanceof HTMLVideoElement) {
          tex = new THREE.VideoTexture(media)
          mat.uniforms.uImage.value.set(media.videoWidth || 16, media.videoHeight || 9)
        } else {
          tex = new THREE.Texture(media)
          tex.anisotropy = anisotropy
          tex.minFilter = THREE.LinearMipmapLinearFilter
          tex.generateMipmaps = true
          mat.uniforms.uImage.value.set(media.naturalWidth, media.naturalHeight)
        }
        tex.colorSpace = THREE.SRGBColorSpace
        tex.needsUpdate = true
        mat.uniforms.uTex.value = tex
        item.tex = tex
      }
      const fail = () => el.classList.add('gl-fallback')

      const isVideo = media instanceof HTMLVideoElement
      if (isVideo ? media.readyState >= 2 : (media as HTMLImageElement).complete && (media as HTMLImageElement).naturalWidth > 0) ready()
      const readyEvent = isVideo ? 'loadeddata' : 'load'
      media.addEventListener(readyEvent, ready)
      media.addEventListener('error', fail)

      const enter = () => (item.hoverTarget = 1)
      const leave = () => (item.hoverTarget = 0)
      const move = (e: PointerEvent) => {
        const r = el.getBoundingClientRect()
        mat.uniforms.uMouse.value.set((e.clientX - r.left) / r.width, 1 - (e.clientY - r.top) / r.height)
      }
      el.addEventListener('pointerenter', enter)
      el.addEventListener('pointerleave', leave)
      el.addEventListener('pointermove', move)

      item.cleanup = () => {
        media.removeEventListener(readyEvent, ready)
        media.removeEventListener('error', fail)
        el.removeEventListener('pointerenter', enter)
        el.removeEventListener('pointerleave', leave)
        el.removeEventListener('pointermove', move)
        scene.remove(mesh)
        mat.dispose()
        item.tex?.dispose()
      }
      return [item]
    })
    return () => {
      items.current.forEach((it) => it.cleanup())
      items.current = []
    }
  }, [scene, geometry, gl])

  useEffect(() => () => geometry.dispose(), [geometry])

  useFrame(({ clock }) => {
    const vw = size.width
    const vh = size.height
    const now = performance.now()
    const v = calm ? 0 : Math.max(-1, Math.min(1, getVelocity() / 35))
    velocity.current += (v - velocity.current) * 0.12
    let cover = 0

    for (const it of items.current) {
      const r = it.el.getBoundingClientRect()
      const inView = r.bottom > -120 && r.top < vh + 120 && r.width > 0
      it.mesh.visible = inView && it.tex !== null && !it.el.classList.contains('gl-fallback')
      if (!it.mesh.visible) continue

      it.mesh.position.set(r.left + r.width / 2 - vw / 2, vh / 2 - (r.top + r.height / 2), 0)
      it.mesh.scale.set(r.width, r.height, 1)

      if (it.revealStart < 0 && r.top < vh * 0.88 && r.bottom > vh * 0.12) it.revealStart = now
      const reveal = it.revealStart < 0 ? 0 : calm ? 1 : Math.min(1, (now - it.revealStart) / 1600)
      it.hover += (it.hoverTarget - it.hover) * 0.08

      const u = it.mat.uniforms
      // Read the corner radius from CSS only when the size changes (phones use a smaller one).
      if (u.uPlane.value.x !== r.width || u.uPlane.value.y !== r.height) {
        const radius = parseFloat(getComputedStyle(it.el).borderTopLeftRadius) || 0
        u.uRadius.value = Math.min(radius, r.width / 2, r.height / 2)
      }
      u.uPlane.value.set(r.width, r.height)
      u.uReveal.value = reveal
      u.uHover.value = calm ? 0 : it.hover
      u.uVelocity.value = velocity.current
      u.uParallax.value = calm ? 0 : (r.top + r.height / 2 - vh / 2) / vh
      u.uTime.value = clock.elapsedTime

      const visH = Math.max(0, Math.min(vh, r.bottom) - Math.max(0, r.top))
      const visW = Math.max(0, Math.min(vw, r.right) - Math.max(0, r.left))
      cover += (visH * visW * reveal) / (vw * vh)
    }
    live.mediaCover = Math.min(1, cover * 1.6)
  })

  return null
}
