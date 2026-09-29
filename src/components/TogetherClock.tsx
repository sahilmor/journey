import { useEffect, useState } from 'react'
import { elapsed, parse } from '../lib/dates'

// A running timecode of their time together, down to the second.
export default function TogetherClock({ since }: { since: string }) {
  const [now, setNow] = useState(() => new Date())
  useEffect(() => {
    const id = window.setInterval(() => setNow(new Date()), 1000)
    return () => window.clearInterval(id)
  }, [])

  const t = elapsed(parse(since), now)
  const pad = (n: number) => String(n).padStart(2, '0')
  const cells = [
    { v: pad(t.years), l: 'Years' },
    { v: pad(t.months), l: 'Months' },
    { v: pad(t.days), l: 'Days' },
    { v: pad(t.hours), l: 'Hrs' },
    { v: pad(t.minutes), l: 'Min' },
    { v: pad(t.seconds), l: 'Sec' },
  ]

  return (
    <div className="clock" role="timer" aria-label={`${t.years} years, ${t.months} months and ${t.days} days together`}>
      {cells.map((c, i) => (
        <div key={c.l} className="clock-cell">
          <span className="clock-v">{c.v}</span>
          <span className="clock-l">{c.l}</span>
          {i === 2 && <span className="clock-sep" aria-hidden />}
        </div>
      ))}
    </div>
  )
}
