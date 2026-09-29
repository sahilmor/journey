import Split from './Split'

type Props = { part: string; title: string; titleItalic: string; span: string; station: number; index: number }

const ROMAN = ['I', 'II', 'III', 'IV', 'V', 'VI']

// A title card between parts. The particles are mid-change behind it, which is the point.
export default function ActTitle({ part, title, titleItalic, span, station, index }: Props) {
  return (
    <section className="act" data-station={station} aria-label={`${part}: ${title} ${titleItalic}`}>
      <p className="act-part mono reveal">
        <span className="act-rule" aria-hidden />
        <span>
          {ROMAN[index] ?? index + 1} · {part}
        </span>
        <span className="act-rule" aria-hidden />
      </p>
      <h2 className="act-title reveal-split">
        <Split text={`${title} ${titleItalic}`} italicFrom={title.split(' ').length} />
      </h2>
      <p className="act-span mono reveal" style={{ ['--d' as string]: '0.3s' }}>
        {span}
      </p>
    </section>
  )
}
