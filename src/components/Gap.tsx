import { daysBetween, fmtNumber, parse } from '../lib/dates'

// The time between two chapters: "+ 242 days", with an optional line about what filled them.
export default function Gap({ from, to, what }: { from: string; to: string; what?: string }) {
  const days = daysBetween(parse(from), parse(to))
  return (
    <div className="gap reveal" role="note">
      <span className="gap-line" aria-hidden />
      <p className="gap-days mono">+ {fmtNumber(days)} days</p>
      {what && <p className="gap-what">{what}</p>}
      <span className="gap-line" aria-hidden />
    </div>
  )
}
