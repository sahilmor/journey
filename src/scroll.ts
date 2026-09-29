import Lenis from 'lenis'
import { chapters } from './data/story'

// Where each section sits on the story's timeline, as a "station" number.
// Chapter i is station i + 1. Everything else sits between them.
const N = chapters.length
export const STATION = {
  hero: 0,
  prologue: 0.4,
  chapter: (i: number) => i + 1,
  act: (chapterIndex: number) => chapterIndex + 1 - 0.35,
  story: 0.93, // the end of their first-meeting story, just before chapter 1
  numbers: N + 0.35,
  letters: N + 0.7,
  finale: N + 1,
  credits: N + 1.6,
}

// Scroll position expressed as a station, read every frame by the WebGL layer without React.
type Listener = (station: number) => void
const state = { station: 0 }
const listeners = new Set<Listener>()
let anchors: { y: number; v: number }[] = []

export const getStation = () => state.station

export function onStation(fn: Listener) {
  listeners.add(fn)
  fn(state.station)
  return () => {
    listeners.delete(fn)
  }
}

function measure() {
  anchors = Array.from(document.querySelectorAll<HTMLElement>('[data-station]'))
    .map((el) => {
      const r = el.getBoundingClientRect()
      return { y: r.top + window.scrollY + r.height / 2, v: Number(el.dataset.station) }
    })
    .sort((a, b) => a.y - b.y)
}

function update() {
  if (anchors.length === 0) return
  const y = window.scrollY + window.innerHeight / 2
  const first = anchors[0]
  const last = anchors[anchors.length - 1]
  let s = first.v
  if (y >= last.y) s = last.v
  else if (y > first.y) {
    for (let i = 0; i < anchors.length - 1; i++) {
      const a = anchors[i]
      const b = anchors[i + 1]
      if (y < b.y) {
        s = a.v + ((y - a.y) / (b.y - a.y)) * (b.v - a.v)
        break
      }
    }
  }
  state.station = s
  listeners.forEach((fn) => fn(s))
}

// ---------- Smooth scroll ----------
// Lenis smooths the wheel and, just as importantly, moves the page inside requestAnimationFrame,
// so the WebGL images can be drawn at exactly the same scroll position as the HTML around them.

let lenis: Lenis | null = null
let glDriven = false

export function startScroll() {
  lenis = new Lenis({ lerp: 0.085, wheelMultiplier: 0.9, anchors: true, stopInertiaOnNavigate: true })
  lenis.on('scroll', update)

  // Until the WebGL layer takes over (or if it never does), drive Lenis from our own loop.
  const loop = (t: number) => {
    if (!glDriven) lenis?.raf(t)
    raf = requestAnimationFrame(loop)
  }
  let raf = requestAnimationFrame(loop)

  const remeasure = () => {
    measure()
    update()
  }
  remeasure()
  window.addEventListener('scroll', update, { passive: true })
  window.addEventListener('resize', remeasure)
  const ro = new ResizeObserver(remeasure)
  ro.observe(document.body)

  return () => {
    cancelAnimationFrame(raf)
    window.removeEventListener('scroll', update)
    window.removeEventListener('resize', remeasure)
    ro.disconnect()
    lenis?.destroy()
    lenis = null
  }
}

// Called by the WebGL render loop first thing every frame.
export function driveScrollFromGL(time: number) {
  glDriven = true
  lenis?.raf(time)
}

export const getVelocity = () => lenis?.velocity ?? 0
export const lockScroll = () => lenis?.stop()
export const unlockScroll = () => lenis?.start()
export function scrollToId(id: string, immediate = false) {
  const el = document.getElementById(id)
  if (!el) return
  if (lenis) lenis.scrollTo(el, { immediate, offset: 0 })
  else el.scrollIntoView({ behavior: immediate ? 'auto' : 'smooth' })
}
