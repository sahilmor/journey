import { useEffect, useRef, useState } from 'react'
import { couple, letters } from '../data/story'
import { sectionNo } from '../lib/sections'
import { lockScroll, STATION, unlockScroll } from '../scroll'
import { ArrowRight, Close } from './Icons'
import Split from './Split'

// Two letters, each opened into a quiet full-screen reading view.
export default function Letters() {
  const [open, setOpen] = useState<number | null>(null)
  const name = (k: 'a' | 'b') => couple[k]

  return (
    <section className="letters" id="letters" data-station={STATION.letters} aria-labelledby="letters-title">
      <header className="letters-head">
        <p className="mono reveal">{sectionNo.letters} · Letters</p>
        <h2 id="letters-title" className="section-title reveal-split">
          <Split text="Two letters, sealed until you open them" italicFrom={2} />
        </h2>
      </header>
      <div className="letters-grid">
        {letters.map((l, i) => {
          const to = l.from === 'a' ? 'b' : 'a'
          return (
            <article key={i} className="letter-card reveal" style={{ ['--d' as string]: `${i * 0.12}s` }}>
              <p className="mono">
                For {name(to)} · from {name(l.from)}
              </p>
              <p className="letter-teaser">{l.text.split('. ')[0]}.</p>
              <button type="button" className="btn" onClick={() => setOpen(i)}>
                Read the letter
                <ArrowRight />
              </button>
            </article>
          )
        })}
      </div>
      <LetterDialog index={open} onClose={() => setOpen(null)} />
    </section>
  )
}

function LetterDialog({ index, onClose }: { index: number | null; onClose: () => void }) {
  const ref = useRef<HTMLDialogElement>(null)
  const [shown, setShown] = useState(false)
  useEffect(() => {
    const el = ref.current
    if (!el) return
    if (index !== null && !el.open) {
      el.showModal()
      lockScroll()
      requestAnimationFrame(() => requestAnimationFrame(() => setShown(true)))
    }
    if (index === null && el.open) el.close()
  }, [index])

  const letter = index === null ? null : letters[index]
  const from = letter ? couple[letter.from] : ''
  const to = letter ? couple[letter.from === 'a' ? 'b' : 'a'] : ''

  return (
    <dialog
      ref={ref}
      className="letter-dialog"
      onClose={() => {
        setShown(false)
        unlockScroll()
        onClose()
      }}
      onClick={(e) => e.target === e.currentTarget && ref.current?.close()}
    >
      {letter && (
        <div className={`letter-sheet${shown ? ' is-in' : ''}`}>
          <p className="mono">For {to}</p>
          <p className="letter-text">
            <Split text={letter.text} />
          </p>
          <p className="letter-sign">{from}</p>
        </div>
      )}
      <button type="button" className="dialog-close mono" onClick={() => ref.current?.close()} autoFocus>
        Close
        <Close />
      </button>
    </dialog>
  )
}
