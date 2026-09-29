import { useEffect, useRef, useState } from 'react'
import { couple, diwaliDates } from '../data/story'
import { daysBetween, fmtLong, fmtNumber, nextAnniversary, parse } from '../lib/dates'
import { sectionNo } from '../lib/sections'
import { STATION } from '../scroll'
import Split from './Split'

// Counts up once, when it first comes into view.
function CountUp({ to }: { to: number }) {
  const ref = useRef<HTMLSpanElement>(null)
  const [value, setValue] = useState(0)
  useEffect(() => {
    const el = ref.current
    if (!el) return
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      setValue(to)
      return
    }
    let raf = 0
    const io = new IntersectionObserver(
      ([e]) => {
        if (!e.isIntersecting) return
        io.disconnect()
        const start = performance.now()
        const tick = (now: number) => {
          const t = Math.min(1, (now - start) / 1800)
          setValue(Math.round(to * (1 - Math.pow(1 - t, 4))))
          if (t < 1) raf = requestAnimationFrame(tick)
        }
        raf = requestAnimationFrame(tick)
      },
      { threshold: 0.8 },
    )
    io.observe(el)
    return () => {
      io.disconnect()
      cancelAnimationFrame(raf)
    }
  }, [to])
  return <span ref={ref}>{fmtNumber(value)}</span>
}

export default function Numbers() {
  const today = new Date()
  const met = parse(couple.firstMet)
  const wed = parse(couple.wedding)
  const daysTogether = daysBetween(met, today)
  const daysMarried = daysBetween(wed, today)
  const engaged = parse(couple.engagement)
  const diwalis = diwaliDates.map(parse).filter((d) => d >= wed && d <= today).length
  const next = nextAnniversary(wed, today)
  // Sundays since the wedding, counting the first one after it.
  const firstSunday = new Date(wed)
  firstSunday.setDate(wed.getDate() + ((7 - wed.getDay()) % 7))
  const sundays = today < firstSunday ? 0 : Math.floor(daysBetween(firstSunday, today) / 7) + 1

  const rows = [
    { n: daysTogether, label: 'days since the roka', note: `Since ${fmtLong(met)}.` },
    { n: daysBetween(engaged, wed), label: 'days between “yes” and the wedding', note: 'Engaged in March, married in November.' },
    { n: daysMarried, label: 'days married', note: `Since ${fmtLong(wed)}.` },
    { n: sundays, label: 'Sunday mornings as a married couple', note: 'Counted from the wedding.' },
    { n: next.number - 1, label: next.number - 1 === 1 ? 'anniversary celebrated' : 'anniversaries celebrated', note: `The next one is on ${fmtLong(next.date)}.` },
    { n: diwalis, label: 'Diwalis as a married couple', note: 'Diwali 2023 came eleven days before the wedding.' },
  ]

  return (
    <section className="numbers" id="numbers" data-station={STATION.numbers} aria-labelledby="numbers-title">
      <div className="numbers-copy">
        <p className="mono reveal">{sectionNo.numbers} · In numbers</p>
        <h2 id="numbers-title" className="section-title reveal-split">
          <Split text="Their time, in things you can count" italicFrom={3} />
        </h2>
        <ul className="numbers-list">
          {rows.map((r, i) => (
            <li key={r.label} className="reveal" style={{ ['--d' as string]: `${i * 0.06}s` }}>
              <span className="numbers-n">
                <CountUp to={r.n} />
              </span>
              <span className="numbers-text">
                <span>{r.label}</span>
                <em>{r.note}</em>
              </span>
            </li>
          ))}
        </ul>
      </div>
      <p className="numbers-caption mono reveal">
        Each point in the spiral is one day, {fmtNumber(daysTogether + 1)} so far, from the roka at the centre to
        today at the edge. The brighter ones are the chapters.
      </p>
    </section>
  )
}
