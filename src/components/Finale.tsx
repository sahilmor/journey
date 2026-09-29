import { couple, credits } from '../data/story'
import { daysBetween, fmtLong, fmtNumber, nextAnniversary, parse } from '../lib/dates'
import { scrollToId, STATION } from '../scroll'
import { sectionNo } from '../lib/sections'
import { ArrowUp } from './Icons'
import Split from './Split'

const ORDINAL = ['zeroth', 'first', 'second', 'third', 'fourth', 'fifth', 'sixth', 'seventh', 'eighth', 'ninth', 'tenth']

// The particles become their photograph, then scatter into stars while the credits roll.
export default function Finale() {
  const today = new Date()
  const days = daysBetween(parse(couple.firstMet), today) + 1
  const next = nextAnniversary(parse(couple.wedding), today)
  const nth = ORDINAL[next.number] ?? `${next.number}th`

  return (
    <>
      <section className="finale" id="finale" data-station={STATION.finale} aria-label="Today">
        <div className="finale-caption">
          <p className="mono reveal">{sectionNo.finale} · Today, {fmtLong(today)}</p>
          <p className="finale-line reveal-split">
            <Split text={`Every one of those ${fmtNumber(days)} days led here.`} italicFrom={4} />
          </p>
        </div>
      </section>

      <section className="credits" data-station={STATION.credits} aria-label="Credits">
        {credits.map((c, i) => (
          <div key={c.role} className="credit reveal" style={{ ['--d' as string]: `${(i % 2) * 0.08}s` }}>
            <p className="mono">{c.role}</p>
            {c.names.map((n) => (
              <p key={n} className="credit-name">
                {n.replace('{days}', fmtNumber(days))}
              </p>
            ))}
          </div>
        ))}

        <div className="countdown reveal">
          {next.daysLeft === 0 ? (
            <p className="countdown-line">
              Happy {nth} anniversary, {couple.a} and {couple.b}.
            </p>
          ) : (
            <p className="countdown-line">
              The {nth} anniversary is in <span className="countdown-n">{fmtNumber(next.daysLeft)}</span>{' '}
              {next.daysLeft === 1 ? 'day' : 'days'}.
            </p>
          )}
          <p className="mono">{fmtLong(next.date)}</p>
          <button type="button" className="btn" onClick={() => scrollToId('top')}>
            <ArrowUp />
            Replay from the first hello
          </button>
        </div>
      </section>

      <footer className="footer mono">
        <span>
          {couple.a} &amp; {couple.b}
        </span>
        <span>Since {fmtLong(parse(couple.firstMet))}</span>
      </footer>
    </>
  )
}
