import { chapters, couple, prologue } from '../data/story'
import { fmtLong, parse } from '../lib/dates'
import { STATION } from '../scroll'
import Figure from './Figure'
import Split from './Split'

// Before the story: the particles become two small galaxies, far apart. The words frame them.
export default function Prologue() {
  const people = [
    { name: couple.a, ...prologue.a, side: 'a' },
    { name: couple.b, ...prologue.b, side: 'b' },
  ]
  return (
    <section className="prologue" id="before" data-station={STATION.prologue} aria-labelledby="before-title">
      <header className="prologue-head">
        <p className="mono reveal">00 · Before {fmtLong(parse(chapters[0].date))}</p>
        <h2 id="before-title" className="prologue-title reveal-split">
          <Split text={`Two lives, ${prologue.distance} apart`} italicFrom={2} />
        </h2>
      </header>

      <div className="prologue-people">
        {people.map((p) => (
          <article key={p.name} className={`person person-${p.side} reveal`}>
            {p.photo && <Figure media={p.photo} className="person-photo" />}
            <p className="mono">{p.city}</p>
            <h3>{p.name}</h3>
            <p className="person-lines">{p.lines.join(' ')}</p>
          </article>
        ))}
      </div>

      <p className="prologue-line reveal">{prologue.line}</p>
    </section>
  )
}
