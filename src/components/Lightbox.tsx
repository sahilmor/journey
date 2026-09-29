import { useEffect, useRef } from 'react'
import type { Chapter, Media } from '../data/story'
import { fmtLong, parse } from '../lib/dates'
import { lockScroll, unlockScroll } from '../scroll'
import { Close } from './Icons'

type Props = {
  item: { media: Media; chapter: Chapter } | null
  onClose: () => void
}

export default function Lightbox({ item, onClose }: Props) {
  const ref = useRef<HTMLDialogElement>(null)

  useEffect(() => {
    const el = ref.current
    if (!el) return
    if (item && !el.open) {
      el.showModal()
      lockScroll()
    }
    if (!item && el.open) el.close()
  }, [item])

  return (
    <dialog
      ref={ref}
      className="lightbox"
      onClose={() => {
        unlockScroll()
        onClose()
      }}
      onClick={(e) => e.target === e.currentTarget && ref.current?.close()}
    >
      {item && (
        <figure className="lightbox-figure">
          {item.media.kind === 'photo' ? (
            <img src={item.media.src.replace('w=1400', 'w=2200')} alt={item.media.alt} />
          ) : (
            <video src={item.media.src} controls autoPlay playsInline />
          )}
          <figcaption className="mono">
            <span>{item.media.alt}</span>
            <span>
              {item.chapter.place} · {fmtLong(parse(item.chapter.date))}
            </span>
          </figcaption>
        </figure>
      )}
      <button type="button" className="dialog-close mono" onClick={() => ref.current?.close()} autoFocus>
        Close
        <Close />
      </button>
    </dialog>
  )
}
