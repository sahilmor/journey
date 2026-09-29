import { Component, Fragment, lazy, Suspense, useCallback, useEffect, useState, type ReactNode } from 'react'
import ActTitle from './components/ActTitle'
import Chapter from './components/Chapter'
import { Header, Timecode } from './components/Chrome'
import Finale from './components/Finale'
import Gap from './components/Gap'
import Hero from './components/Hero'
import IndexMenu from './components/IndexMenu'
import Letters from './components/Letters'
import Lightbox from './components/Lightbox'
import Loader from './components/Loader'
import Numbers from './components/Numbers'
import Prologue from './components/Prologue'
import Soundtrack from './components/Soundtrack'
import Storyline from './components/Storyline'
import { acts, chapters, letters, type Chapter as ChapterData, type Media } from './data/story'
import { live } from './gl/live'
import { lockScroll, startScroll, STATION, unlockScroll } from './scroll'

// three.js is the heaviest part of the bundle, so it loads separately while the loader counts.
const Stage = lazy(() => import('./gl/Stage'))

const canWebGL = (() => {
  try {
    const c = document.createElement('canvas')
    return !!(c.getContext('webgl2') || c.getContext('webgl'))
  } catch {
    return false
  }
})()

// If WebGL fails for any reason, the page carries on with plain HTML images and titles.
class GLBoundary extends Component<{ children: ReactNode }, { failed: boolean }> {
  state = { failed: false }
  static getDerivedStateFromError() {
    return { failed: true }
  }
  componentDidCatch() {
    document.documentElement.classList.remove('gl')
    window.dispatchEvent(new Event('gl:ready'))
  }
  render() {
    return this.state.failed ? null : this.props.children
  }
}

function useReducedMotion() {
  const [reduced, setReduced] = useState(() => window.matchMedia('(prefers-reduced-motion: reduce)').matches)
  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)')
    const fn = () => setReduced(mq.matches)
    mq.addEventListener('change', fn)
    return () => mq.removeEventListener('change', fn)
  }, [])
  return reduced
}

function useReveal() {
  useEffect(() => {
    const io = new IntersectionObserver(
      (entries) =>
        entries.forEach((e) => {
          if (e.isIntersecting) {
            e.target.classList.add('is-in')
            io.unobserve(e.target)
          }
        }),
      { rootMargin: '0px 0px -10% 0px', threshold: 0.12 },
    )
    document.querySelectorAll('.reveal, .reveal-split').forEach((el) => io.observe(el))
    return () => io.disconnect()
  }, [])
}

export default function App() {
  const calm = useReducedMotion()
  const [loaded, setLoaded] = useState(false)
  const [indexOpen, setIndexOpen] = useState(false)
  const [lightbox, setLightbox] = useState<{ media: Media; chapter: ChapterData } | null>(null)

  useEffect(() => {
    history.scrollRestoration = 'manual'
    window.scrollTo(0, 0)
    const stop = startScroll()
    lockScroll()
    if (!canWebGL) window.dispatchEvent(new Event('gl:ready'))
    return stop
  }, [])
  useReveal()

  const onLoaded = useCallback(() => {
    setLoaded(true)
    document.documentElement.classList.add('is-loaded')
    unlockScroll()
    live.introAt = performance.now()
  }, [])

  return (
    <>
      {canWebGL && (
        <GLBoundary>
          <Suspense fallback={null}>
            <Stage calm={calm} />
          </Suspense>
        </GLBoundary>
      )}
      {!loaded && <Loader onDone={onLoaded} />}

      <Header onIndex={() => setIndexOpen(true)} />
      <Timecode />
      <Soundtrack />

      <main>
        <Hero />
        <Prologue />
        {chapters.map((c, i) => {
          const act = acts.findIndex((a) => a.before === c.id)
          const prev = chapters[i - 1]
          return (
            <Fragment key={c.id}>
              {prev && !prev.dateLabel && !c.dateLabel && <Gap from={prev.date} to={c.date} />}
              {act >= 0 && <ActTitle {...acts[act]} index={act} station={STATION.act(i)} />}
              {i === 0 && <Storyline />}
              <Chapter
                chapter={c}
                index={i}
                total={chapters.length}
                onOpen={(media, chapter) => setLightbox({ media, chapter })}
              />
            </Fragment>
          )
        })}
        <Numbers />
        {letters.length > 0 && <Letters />}
        <Finale />
      </main>

      <Lightbox item={lightbox} onClose={() => setLightbox(null)} />
      <IndexMenu open={indexOpen} onClose={() => setIndexOpen(false)} />
    </>
  )
}
