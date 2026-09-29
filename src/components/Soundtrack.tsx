import { useEffect } from 'react'
import { song } from '../data/story'

// Background music with no controls. It tries to start as soon as the page loads. Browsers only
// allow sound after the visitor has interacted with the page, so if that first try is blocked it
// starts on the first click, tap or key press instead. It fades in, loops, and pauses while the
// tab is hidden.
export default function Soundtrack() {
  useEffect(() => {
    if (!song) return
    const audio = new Audio(song.src)
    audio.loop = true
    audio.preload = 'auto'
    audio.volume = 0
    let started = false
    let fade = 0

    const fadeTo = (target: number, ms: number) => {
      cancelAnimationFrame(fade)
      const from = audio.volume
      const t0 = performance.now()
      const step = (now: number) => {
        const t = Math.min(1, (now - t0) / ms)
        audio.volume = from + (target - from) * t
        if (t < 1) fade = requestAnimationFrame(step)
      }
      fade = requestAnimationFrame(step)
    }

    const events = ['pointerdown', 'touchend', 'keydown', 'click', 'wheel', 'touchstart'] as const
    const stopListening = () => events.forEach((e) => window.removeEventListener(e, start))

    function start() {
      if (started) return
      audio
        .play()
        .then(() => {
          started = true
          stopListening()
          fadeTo(song!.volume, 3000)
        })
        .catch(() => {
          // Blocked until the visitor interacts; the listeners below will try again.
        })
    }

    const onVisibility = () => {
      if (!started) return
      if (document.hidden) audio.pause()
      else audio.play().catch(() => {})
    }

    events.forEach((e) => window.addEventListener(e, start, { passive: true }))
    document.addEventListener('visibilitychange', onVisibility)
    start()

    return () => {
      stopListening()
      document.removeEventListener('visibilitychange', onVisibility)
      cancelAnimationFrame(fade)
      audio.pause()
      audio.src = ''
    }
  }, [])

  return null
}
