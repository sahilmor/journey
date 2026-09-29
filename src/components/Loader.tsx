import { useEffect, useRef, useState } from 'react'
import { couple } from '../data/story'
import { chaptersInWords } from '../lib/sections'
import { daysBetween, fmtNumber, parse } from '../lib/dates'

// Counts up through every day they have had while the particles and fonts load,
// then lifts like a curtain.
export default function Loader({ onDone }: { onDone: () => void }) {
  const total = daysBetween(parse(couple.firstMet), new Date()) + 1
  const [count, setCount] = useState(0)
  const [leaving, setLeaving] = useState(false)
  const ready = useRef({ gl: false, fonts: false, counted: false, done: false })

  useEffect(() => {
    const r = ready.current
    const tryFinish = () => {
      if (r.done || !r.counted || !r.gl || !r.fonts) return
      r.done = true
      setLeaving(true)
      window.setTimeout(onDone, 1100)
    }
    const onGl = () => {
      r.gl = true
      tryFinish()
    }
    window.addEventListener('gl:ready', onGl)
    document.fonts.ready.then(() => {
      r.fonts = true
      tryFinish()
    })
    // Never hold the page hostage: continue after a few seconds whatever happens.
    const bail = window.setTimeout(() => {
      r.gl = true
      r.fonts = true
      r.counted = true
      setCount(total)
      tryFinish()
    }, 7000)

    const start = performance.now()
    const dur = 1900
    let raf = 0
    const tick = (now: number) => {
      const t = Math.min(1, (now - start) / dur)
      setCount(Math.round(total * (1 - Math.pow(1 - t, 3))))
      if (t < 1) raf = requestAnimationFrame(tick)
      else {
        r.counted = true
        tryFinish()
      }
    }
    raf = requestAnimationFrame(tick)
    return () => {
      window.removeEventListener('gl:ready', onGl)
      window.clearTimeout(bail)
      cancelAnimationFrame(raf)
    }
  }, [onDone, total])

  return (
    <div className={`loader${leaving ? ' is-leaving' : ''}`} role="status" aria-label="Loading">
      <div className="loader-top mono">
        <span>
          {couple.a} &amp; {couple.b}
        </span>
        <span>A story in {chaptersInWords}</span>
      </div>
      <div className="loader-bottom">
        <p className="loader-count" aria-hidden>
          {fmtNumber(count)}
        </p>
        <p className="loader-label mono">days since {parse(couple.firstMet).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
      </div>
      <span className="loader-bar" style={{ transform: `scaleX(${count / total})` }} aria-hidden />
    </div>
  )
}
