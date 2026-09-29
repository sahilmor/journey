import { chapters, couple } from '../data/story'
import { daysBetween, fmtLong, fmtNumber, parse } from '../lib/dates'
import { STATION } from '../scroll'
import TogetherClock from './TogetherClock'

// The names themselves are drawn by the particles. The HTML title is for screen readers,
// search engines, and any device without WebGL.
export default function Hero() {
  const met = parse(couple.firstMet)
  const days = daysBetween(met, new Date())
  return (
    <section className="hero" id="top" data-station={STATION.hero}>
      <p className="hero-kicker mono reveal">
        <span>{fmtLong(met)}</span>
        <span className="hero-kicker-rule" aria-hidden />
        <span>Today</span>
      </p>

      <h1 className="hero-title">
        {couple.a} <em>&amp;</em> {couple.b}
      </h1>

      <div className="hero-foot">
        <p className="hero-lede reveal" style={{ ['--d' as string]: '0.1s' }}>
          First saw each other at their roka in {chapters[0].place}, on {fmtLong(met)}. Married on{' '}
          {fmtLong(parse(couple.wedding))}. {fmtNumber(days)} days since that first glance, and still counting.
        </p>
        <p className="hero-scroll mono reveal" style={{ ['--d' as string]: '0.25s' }}>
          <span>Scroll</span>
          <span className="hero-scroll-line" aria-hidden />
        </p>
        <div className="hero-clock reveal" style={{ ['--d' as string]: '0.4s' }}>
          <p className="mono">Together for</p>
          <TogetherClock since={couple.firstMet} />
        </div>
      </div>
    </section>
  )
}
