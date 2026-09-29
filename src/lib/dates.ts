const DAY = 86_400_000

export const parse = (iso: string) => {
  const [y, m, d] = iso.split('-').map(Number)
  return new Date(y, m - 1, d)
}

export const daysBetween = (from: Date, to: Date) =>
  Math.floor((Date.UTC(to.getFullYear(), to.getMonth(), to.getDate()) -
    Date.UTC(from.getFullYear(), from.getMonth(), from.getDate())) / DAY)

export const fmtLong = (d: Date) =>
  d.toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })

export const fmtMonth = (d: Date) => d.toLocaleDateString('en-GB', { month: 'long' })

export const fmtMonthYear = (d: Date) =>
  d.toLocaleDateString('en-GB', { month: 'short', year: 'numeric' })

export const fmtNumber = (n: number) => n.toLocaleString('en-IN')

// Next occurrence of the wedding date on or after `today`, and which anniversary it will be.
export function nextAnniversary(wedding: Date, today: Date) {
  let year = today.getFullYear()
  let next = new Date(year, wedding.getMonth(), wedding.getDate())
  if (daysBetween(today, next) < 0) {
    year += 1
    next = new Date(year, wedding.getMonth(), wedding.getDate())
  }
  return { date: next, number: year - wedding.getFullYear(), daysLeft: daysBetween(today, next) }
}

// Calendar difference, the way people say it: "3 years, 8 months, 12 days".
export function elapsed(from: Date, now: Date) {
  let years = now.getFullYear() - from.getFullYear()
  let months = now.getMonth() - from.getMonth()
  let days = now.getDate() - from.getDate()
  if (days < 0) {
    months -= 1
    days += new Date(now.getFullYear(), now.getMonth(), 0).getDate()
  }
  if (months < 0) {
    years -= 1
    months += 12
  }
  return {
    years,
    months,
    days,
    hours: now.getHours(),
    minutes: now.getMinutes(),
    seconds: now.getSeconds(),
  }
}
