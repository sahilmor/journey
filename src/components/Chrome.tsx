import { useEffect, useRef } from 'react'
import { chapters, couple, letters, prologue } from '../data/story'
import { chaptersInWords } from '../lib/sections'
import { daysBetween, fmtMonthYear, fmtNumber, parse } from '../lib/dates'
import { onStation, STATION } from '../scroll'

const N = chapters.length
const MET = parse(couple.firstMet)
const pad = (n: number) => String(n).padStart(2, '0')

// What the header says about where you are in the story.
function whereLabel(s: number) {
  if (s < 0.2) return `A story in ${chaptersInWords}`
  if (s < STATION.act(0) + 0.15) return 'Before'
  if (s < N + 0.22) {
    const i = Math.min(N - 1, Math.max(0, Math.round(s) - 1))
    return `Chapter ${pad(i + 1)} / ${pad(N)}  ·  ${chapters[i].kicker}`
  }
  if (s < STATION.numbers + 0.18) return 'In numbers'
  if (letters.length > 0 && s < STATION.letters + 0.15) return 'Letters'
  if (s < STATION.credits - 0.2) return 'Today'
  return 'Credits'
}

export function Header({ onIndex }: { onIndex: () => void }) {
  const where = useRef<HTMLSpanElement>(null)
  useEffect(
    () =>
      onStation((s) => {
        const label = whereLabel(s)
        if (where.current && where.current.textContent !== label) where.current.textContent = label
      }),
    [],
  )
  return (
    <header className="header">
      <a href="#top" className="monogram" aria-label="Back to the beginning">
        {couple.a[0]}
        <em>&amp;</em>
        {couple.b[0]}
      </a>
      <span ref={where} className="header-where mono" aria-live="off" />
      <button type="button" className="header-index mono" onClick={onIndex}>
        Index
        <span aria-hidden>{pad(N)}</span>
      </button>
    </header>
  )
}

// Station -> the date the story has reached. The hero and the ending are "today".
const times = [
  Date.now(),
  ...chapters.map((c) => parse(c.date).getTime()),
  Date.now(),
]
const stationTime = (s: number) => {
  if (s < 0.2 || s > N + 0.2) return Date.now()
  if (s < 1) return times[1]
  const k = Math.floor(s)
  const a = times[Math.min(times.length - 1, k)]
  const b = times[Math.min(times.length - 1, k + 1)]
  return a + (b - a) * (s - k)
}

export function Timecode() {
  const day = useRef<HTMLSpanElement>(null)
  const date = useRef<HTMLSpanElement>(null)
  const bar = useRef<HTMLSpanElement>(null)
  useEffect(
    () =>
      onStation((s) => {
        const before = s >= 0.2 && s < 0.9
        const when = new Date(stationTime(s))
        const d = daysBetween(MET, when) + 1
        const i = Math.min(N - 1, Math.max(0, Math.round(s) - 1))
        // The last known place at or before this point in the story.
        const now = s < 0.2 || s > N + 0.3
        const place = now ? chapters[N - 1].place : chapters[i].place
        if (day.current) day.current.textContent = before ? 'Day 0' : `Day ${fmtNumber(Math.max(1, d))}`
        if (date.current)
          date.current.textContent = before
            ? `${prologue.a.city} · ${prologue.b.city}`
            : [now ? 'Today' : fmtMonthYear(when), place].filter(Boolean).join(' · ')
        if (bar.current) bar.current.style.transform = `scaleX(${Math.min(1, Math.max(0, s / STATION.credits))})`
      }),
    [],
  )
  return (
    <div className="timecode mono" aria-hidden>
      <span ref={day} className="timecode-day" />
      <span className="timecode-track">
        <span ref={bar} className="timecode-bar" />
      </span>
      <span ref={date} className="timecode-date" />
    </div>
  )
}
