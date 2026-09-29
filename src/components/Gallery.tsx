import { useState, type CSSProperties } from 'react'
import type { Media } from '../data/story'
import Figure from './Figure'

type Props = {
  media: Media[]
  number: string // chapter number, for captions like 03.2
  mirrored: boolean // right-hand chapters lean the other way
  onOpen: (m: Media) => void
}

type Kind = 'wide' | 'square' | 'tall'
const kindOf = (ar: number): Kind => (ar > 1.2 ? 'wide' : ar < 0.85 ? 'tall' : 'square')

// Photos keep their own shape (nobody's head gets cropped). Two per row, alternating sides,
// with the second of each pair dropped a little lower; a photo alone in its row is centred.
// Small, low-resolution photos are shown small so they stay sharp.
export default function Gallery({ media, number, mirrored, onOpen }: Props) {
  const [sizes, setSizes] = useState<Record<number, [number, number]>>({})
  const count = media.length

  return (
    <div className={`gallery${count === 1 ? ' gallery-one' : ''}`}>
      {media.map((m, i) => {
        const [w, h] = sizes[i] ?? [4, 5]
        const ar = Math.min(1.9, Math.max(0.6, w / h))
        const kind = kindOf(ar)
        const small = sizes[i] !== undefined && w < 700
        const span = small ? 4 : count === 1 ? { wide: 8, square: 6, tall: 5 }[kind] : { wide: 7, square: 5, tall: 4 }[kind]
        const row = Math.floor(i / 2)
        const alone = count === 1 || (i === count - 1 && count % 2 === 1)
        const inset = row % 2 === 1 ? 1 : 0
        const onLeft = (i % 2 === 0) !== mirrored
        const start = alone ? Math.floor((12 - span) / 2) + 1 : onLeft ? 1 + inset : 13 - span - inset
        const style = {
          gridColumn: `${start} / span ${span}`,
          gridRow: row + 1,
          '--ar': ar,
        } as CSSProperties
        return (
          <Figure
            key={m.src}
            media={m}
            className={`figure-${kind}${i % 2 === 1 && !alone ? ' is-offset' : ''}${i % 2 === 1 ? ' is-second' : ''}`}
            style={style}
            caption={`${number}.${i + 1}  ${m.alt}`}
            onOpen={() => onOpen(m)}
            onMeasure={(mw, mh) => setSizes((s) => (s[i] ? s : { ...s, [i]: [mw, mh] }))}
          />
        )
      })}
    </div>
  )
}
