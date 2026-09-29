import { useEffect, useRef } from 'react'
import { chapters, letters } from '../data/story'
import { sectionNo } from '../lib/sections'
import { fmtLong, parse } from '../lib/dates'
import { lockScroll, scrollToId, unlockScroll } from '../scroll'
import { Close } from './Icons'

const pad = (n: number) => String(n).padStart(2, '0')

// A contents page: every chapter by number, title and date.
export default function IndexMenu({ open, onClose }: { open: boolean; onClose: () => void }) {
  const ref = useRef<HTMLDialogElement>(null)
  useEffect(() => {
    const el = ref.current
    if (!el) return
    if (open && !el.open) {
      el.showModal()
      lockScroll()
    }
    if (!open && el.open) el.close()
  }, [open])

  const go = (id: string) => {
    ref.current?.close()
    // Wait a frame so the scroll lock is released before scrolling.
    requestAnimationFrame(() => scrollToId(id))
  }

  const rows = [
    { id: 'before', n: '00', title: 'Before', date: 'Two lives, two cities' },
    ...chapters.map((c, i) => ({ id: c.id, n: pad(i + 1), title: c.kicker, date: c.dateLabel ?? fmtLong(parse(c.date)) })),
    { id: 'numbers', n: sectionNo.numbers, title: 'In numbers', date: 'Their time, counted' },
    ...(letters.length > 0 ? [{ id: 'letters', n: sectionNo.letters, title: 'Letters', date: 'One for each' }] : []),
    { id: 'finale', n: sectionNo.finale, title: 'Today', date: 'And the credits' },
  ]

  return (
    <dialog
      ref={ref}
      className="index-dialog"
      onClose={() => {
        unlockScroll()
        onClose()
      }}
    >
      <nav aria-label="Chapters">
        <p className="mono">Index</p>
        <ol className="index-list">
          {rows.map((r) => (
            <li key={r.id}>
              <button type="button" onClick={() => go(r.id)}>
                <span className="mono">{r.n}</span>
                <span className="index-title">{r.title}</span>
                <span className="mono">{r.date}</span>
              </button>
            </li>
          ))}
        </ol>
      </nav>
      <button type="button" className="dialog-close mono" onClick={() => ref.current?.close()} autoFocus>
        Close
        <Close />
      </button>
    </dialog>
  )
}
