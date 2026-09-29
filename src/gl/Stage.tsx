import { Canvas, useFrame, useThree } from '@react-three/fiber'
import { useEffect, useMemo } from 'react'
import * as THREE from 'three'
import { driveScrollFromGL } from '../scroll'
import Backdrop from './Backdrop'
import { live } from './live'
import Media from './Media'
import Particles from './Particles'

// One fixed canvas behind the page. Two passes each frame:
// 1. the perspective scene: backdrop glow and the particle story,
// 2. an orthographic pass that draws the photos exactly where the HTML placeholders are.

function ScrollDriver() {
  // Runs first each frame, so the page and the WebGL photos move together.
  useFrame(() => driveScrollFromGL(performance.now()), -10)
  return null
}

function CameraRig({ calm }: { calm: boolean }) {
  useFrame(({ camera }) => {
    // Parallax only follows a real mouse; phones and a still cursor keep the camera centred.
    const p = live.pointer
    const mouse = !calm && !p.touch && p.at > 0
    const tx = mouse ? p.x * 0.28 : 0
    const ty = mouse ? p.y * 0.16 : 0
    camera.position.x += (tx - camera.position.x) * 0.04
    camera.position.y += (ty - camera.position.y) * 0.04
    camera.lookAt(0, 0, 0)
  })
  return null
}

function Passes({ calm }: { calm: boolean }) {
  const { size } = useThree()
  const mediaScene = useMemo(() => new THREE.Scene(), [])
  const ortho = useMemo(() => new THREE.OrthographicCamera(-1, 1, 1, -1, -10, 10), [])
  useEffect(() => {
    ortho.left = -size.width / 2
    ortho.right = size.width / 2
    ortho.top = size.height / 2
    ortho.bottom = -size.height / 2
    ortho.updateProjectionMatrix()
  }, [size, ortho])

  useFrame(({ gl, scene, camera }) => {
    gl.autoClear = false
    gl.clear()
    gl.render(scene, camera)
    gl.clearDepth()
    gl.render(mediaScene, ortho)
  }, 1)

  return <Media scene={mediaScene} calm={calm} />
}

export default function Stage({ calm }: { calm: boolean }) {
  useEffect(() => {
    const move = (e: PointerEvent) => {
      live.pointer.x = (e.clientX / window.innerWidth) * 2 - 1
      live.pointer.y = -(e.clientY / window.innerHeight) * 2 + 1
      live.pointer.at = performance.now()
      live.pointer.touch = e.pointerType === 'touch'
    }
    window.addEventListener('pointermove', move, { passive: true })
    return () => window.removeEventListener('pointermove', move)
  }, [])

  return (
    <Canvas
      className="stage"
      flat
      dpr={[1, 1.75]}
      camera={{ fov: 35, position: [0, 0, 10], near: 0.1, far: 100 }}
      gl={{ antialias: true, alpha: false, powerPreference: 'high-performance' }}
      onCreated={({ gl }) => {
        gl.setClearColor('#0b0a09', 1)
        document.documentElement.classList.add('gl')
      }}
      aria-hidden
    >
      <ScrollDriver />
      <CameraRig calm={calm} />
      <Backdrop />
      <Particles calm={calm} />
      <Passes calm={calm} />
    </Canvas>
  )
}
