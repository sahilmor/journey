import type { CSSProperties } from 'react'
import { couple, type Chapter as ChapterData, type Media } from '../data/story'
import { fmtLong, parse } from '../lib/dates'
import { STATION } from '../scroll'
import Gallery from './Gallery'
import Split from './Split'

type Props = {
  chapter: ChapterData
  index: number
  total: number
  onOpen: (m: Media, chapter: ChapterData) => void
}

const pad = (n: number) => String(n).padStart(2, '0')

// A chapter has two beats: the moment (words on one side, the particle shape on the other)
// and the memories (their own words and the pictures). Anything not filled in yet is left out.
export default function Chapter({ chapter, index, total, onOpen }: Props) {
  const side = index % 2 === 0 ? 'left' : 'right'
  const num = pad(index + 1)
  const voices = [
    { who: couple.a, text: chapter.voices?.a },
    { who: couple.b, text: chapter.voices?.b },
  ].filter((v): v is { who: string; text: string } => !!v.text)
  const facts = [
    { k: 'Date', v: chapter.dateLabel ?? fmtLong(parse(chapter.date)) },
    chapter.place ? { k: 'Place', v: chapter.place } : null,
    chapter.feeling ? { k: 'It felt', v: chapter.feeling, hi: chapter.feelingHi } : null,
  ].filter(Boolean) as { k: string; v: string; hi?: string }[]
  const hasMemories = voices.length > 0 || chapter.media.length > 0 || (chapter.quote && chapter.body)

  return (
    <section
      id={chapter.id}
      className={`chapter chapter-${side}`}
      style={{ '--accent': chapter.accent } as CSSProperties}
      aria-labelledby={`${chapter.id}-title`}
    >
      <div className="chapter-moment" data-station={STATION.chapter(index)}>
        <div className="chapter-copy">
          <p className="chapter-kicker mono reveal">
            <span className="chapter-num">
              {num} / {pad(total)}
            </span>
            <span className="chapter-rule" aria-hidden />
            <span>{chapter.kicker}</span>
          </p>
          <h2 id={`${chapter.id}-title`} className="chapter-title reveal-split">
            <Split text={chapter.title} />
          </h2>
          {chapter.body ? (
            <p className="chapter-body reveal" style={{ ['--d' as string]: '0.15s' }}>
              {chapter.body}
            </p>
          ) : (
            chapter.quote && <QuoteLine quote={chapter.quote} />
          )}
          <dl className="chapter-facts reveal" style={{ ['--d' as string]: '0.3s' }}>
            {facts.map((f) => (
              <div key={f.k}>
                <dt className="mono">{f.k}</dt>
                <dd>
                  {f.v}
                  {f.hi && (
                    <>
                      {' '}
                      <span className="hi" lang="hi">
                        {f.hi}
                      </span>
                    </>
                  )}
                </dd>
              </div>
            ))}
          </dl>
        </div>
      </div>

      {hasMemories && (
        <div className="chapter-memories">
          {chapter.quote && chapter.body && (
            <div className="chapter-quote">
              <QuoteLine quote={chapter.quote} />
            </div>
          )}
          {voices.length > 0 && (
            <div className={`voices voices-${voices.length}`}>
              {voices.map((v, i) => (
                <figure key={v.who} className="voice reveal" style={{ ['--d' as string]: `${i * 0.15}s` }}>
                  <blockquote>“{v.text}”</blockquote>
                  <figcaption className="mono">{v.who} remembers</figcaption>
                </figure>
              ))}
            </div>
          )}
          {chapter.media.length > 0 && (
            <Gallery media={chapter.media} number={num} mirrored={side === 'right'} onOpen={(m) => onOpen(m, chapter)} />
          )}
        </div>
      )}
    </section>
  )
}

function QuoteLine({ quote }: { quote: NonNullable<ChapterData['quote']> }) {
  return (
    <figure className="pull reveal">
      <blockquote>{quote.text}</blockquote>
      {quote.by && <figcaption className="mono">{couple[quote.by]}</figcaption>}
    </figure>
  )
}
