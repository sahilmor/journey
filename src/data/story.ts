// Everything on the page comes from this file.
// Words marked TODO are stand-ins until Rajiv and Neha send the real ones.
// Photos: drop them into src/photos/<chapter id>/ and they appear automatically (see src/photos/README.md).
import { photosFor } from './photos'

export type Media =
  | { kind: 'photo'; src: string; alt: string }
  | { kind: 'video'; src: string; poster?: string; alt: string }

export type Chapter = {
  id: string // also the name of its photo folder
  date: string // ISO, yyyy-mm-dd. Orders the story and drives the day counter.
  dateLabel?: string // shown instead of the date when the exact day is not known
  kicker: string // short name of the moment
  title: string
  body?: string
  quote?: { text: string; by?: 'a' | 'b' } // a line in their own words, shown large
  place?: string
  feeling?: string
  feelingHi?: string // the same feeling in Hindi
  voices?: { a?: string; b?: string } // what each of them remembers
  accent: string // small details in the page and the particles
  tone: string // dark glow in the WebGL background while this chapter is on screen
  media: Media[]
}

export const couple = {
  a: 'Rajiv',
  b: 'Neha',
  firstMet: '2023-02-19', // the roka
  engagement: '2023-03-26',
  wedding: '2023-11-23',
}

// Before they met: two separate lives.
const cities = {
  faridabad: [28.41, 77.32] as [number, number],
  hisar: [29.15, 75.72] as [number, number],
}

function km([lat1, lon1]: [number, number], [lat2, lon2]: [number, number]) {
  const r = Math.PI / 180
  const a =
    Math.sin(((lat2 - lat1) * r) / 2) ** 2 +
    Math.cos(lat1 * r) * Math.cos(lat2 * r) * Math.sin(((lon2 - lon1) * r) / 2) ** 2
  return 6371 * 2 * Math.asin(Math.sqrt(a))
}

const [photoA, photoB] = photosFor('before', 'Before')
export const prologue = {
  a: { city: 'Faridabad', coords: cities.faridabad, lines: ['Forester.', 'Calm and composed.'], photo: photoA },
  b: { city: 'Hisar', coords: cities.hisar, lines: ['Corporate job.', 'Bold and strong-headed.'], photo: photoB },
  // Straight-line distance between the two cities, rounded to 5 km. Non-breaking space keeps "km" attached.
  distance: `${Math.round(km(cities.faridabad, cities.hisar) / 5) * 5} km`,
  line: 'Two people who had no reason to belong together.',
}

// Their account of the first meeting, told line by line before the first chapter.
// size: 'big' for a short line on its own, 'huge' for the last one. italic for a thought.
export type Line = { text: string; size?: 'big' | 'huge'; italic?: boolean }
export const firstStory: { title: string; beats: Line[][] } = {
  title: 'The day they just knew',
  beats: [
    [{ text: 'They were two people who had no reason to belong together.', size: 'big' }],
    [
      {
        text: 'He was calm and composed, the kind of man who never needed to be the loudest person in the room. Quiet, thoughtful, and steady, he carried a certain peace within him.',
      },
    ],
    [
      { text: 'She was everything he wasn’t.', size: 'big' },
      { text: 'Bold. Strong-headed. Independent. A little fearless, a little stubborn, and completely unapologetic about who she was.' },
    ],
    [
      { text: 'And then, one ordinary day, their paths crossed.', size: 'big' },
      {
        text: 'It wasn’t a grand meeting. There were no romantic songs playing in the background, no dramatic moment, no beautiful conversation that would later become a cherished memory.',
      },
      { text: 'They met with their families around them.' },
    ],
    [
      { text: 'By then, both of them had already met several people. One after another, nothing had felt quite right.' },
      { text: 'Until that day.', size: 'big' },
    ],
    [
      { text: 'They saw each other for the first time. And strangely enough, they didn’t talk.' },
      { text: 'There was no exchange of stories, no getting-to-know-each-other conversation, no attempt to impress one another.' },
    ],
    [
      { text: 'Just a glance.', size: 'big' },
      { text: 'A simple, ordinary glance that somehow felt anything but ordinary.' },
    ],
    [
      { text: 'He looked at her.', size: 'big' },
      { text: 'She looked at him.', size: 'big' },
      { text: 'And somewhere between those few silent seconds, something shifted.' },
    ],
    [
      {
        text: 'Neither of them could explain it. They didn’t know each other’s habits, dreams, fears, or flaws. Yet, somehow, both of them felt the same inexplicable certainty.',
      },
      { text: 'This is the one.', size: 'big', italic: true },
    ],
    [
      { text: 'Perhaps it wasn’t love at first sight. Perhaps it was something quieter than that. Something deeper.' },
      { text: 'A strange little feeling that whispered, “You’ve finally found the person you were looking for.”', italic: true },
    ],
    [
      {
        text: 'Two complete opposites. Two strangers who had barely exchanged a word, yet somehow, without saying anything at all, they had already begun their story.',
      },
    ],
    [
      {
        text: 'And sometimes, the most beautiful love stories don’t begin with a conversation. They begin with a look. A feeling. And two hearts quietly knowing:',
      },
      { text: '“It’s you.”', size: 'huge', italic: true },
    ],
  ],
}

// Title cards that split the story into parts. `before` is the chapter they open.
export const acts = [
  { before: 'roka', part: 'Part one', title: 'Finding', titleItalic: 'each other', span: 'February to March 2023' },
  { before: 'pre-wedding', part: 'Part two', title: 'Becoming', titleItalic: 'us', span: '2023' },
  { before: 'karva-chauth', part: 'Part three', title: 'Building', titleItalic: 'a life', span: '2024 to 2025' },
  { before: 'now', part: 'And now', title: 'Where they', titleItalic: 'are today', span: '2026' },
]

const today = new Date()
const iso = (d: Date) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`

export const chapters: Chapter[] = [
  {
    id: 'roka',
    date: couple.firstMet,
    kicker: 'The roka',
    title: 'The day they just knew',
    body:
      'With both families in the room, they saw each other for the first time. They barely spoke. One glance, and both of them felt the same quiet certainty.',
    place: 'Hisar',
    feeling: 'Certain',
    feelingHi: 'यक़ीन',
    accent: '#D6AD63',
    tone: '#4A3218',
    media: photosFor('roka', 'The roka'),
  },
  {
    id: 'after-roka',
    date: '2023-03-08', // TODO: exact date not known yet; only used to order the story
    dateLabel: 'After the roka',
    kicker: 'The first glimpse of us',
    title: 'Our first meeting after the roka',
    body:
      'This time, meeting each other felt different. We were no longer two strangers wondering where this journey would lead. We were two people who had chosen each other. There was still a little awkwardness, a lot of smiles, and an unspoken excitement about what lay ahead.',
    quote: { text: 'Our arranged beginning was slowly turning into our own love story.' },
    feeling: 'Excited',
    feelingHi: 'उत्साह',
    accent: '#D99A8C',
    tone: '#43282A',
    media: photosFor('after-roka', 'After the roka'),
  },
  {
    id: 'engagement',
    date: couple.engagement,
    kicker: 'The engagement',
    title: 'The day we said “yes”',
    body:
      'What began with a simple meeting between two very different people had now become something much more beautiful. Surrounded by flowers, family, and countless blessings, we took the next step toward forever. It wasn’t just an engagement. It was a promise to keep choosing each other, through every chapter that life brings.',
    quote: { text: 'From “Will this work?” to “This is our forever.”' },
    feeling: 'Blessed',
    feelingHi: 'धन्य',
    accent: '#E3C38A',
    tone: '#43301C',
    media: photosFor('engagement', 'The engagement'),
  },
  {
    id: 'pre-wedding',
    date: '2023-10-15', // TODO: exact date not known; only used to order the story
    dateLabel: 'Before the wedding',
    kicker: 'The pre-wedding shoot',
    title: 'Before the big day',
    body: 'A day in front of the camera, somewhere between “yes” and the wedding. Dressed up, side by side, and already looking like a pair.',
    accent: '#C9B7A0',
    tone: '#2E2A24',
    media: photosFor('pre-wedding', 'The pre-wedding shoot'),
  },
  {
    id: 'wedding',
    date: couple.wedding,
    kicker: 'The wedding',
    title: 'Seven rounds, one promise',
    // TODO: replace with their own words about the wedding day.
    body: 'With both families around them once again, the promise they made in March became a marriage.',
    accent: '#D0503A',
    tone: '#551B12',
    media: photosFor('wedding', 'The wedding'),
  },
  {
    id: 'karva-chauth',
    date: '2024-10-20', // TODO: confirm the year. 20 October 2024 was their first Karva Chauth as a married couple.
    kicker: 'Karva Chauth',
    title: 'Waiting for the moon',
    body: 'A day-long fast, a red saree, and a moon worth waiting for.',
    accent: '#D0503A',
    tone: '#4A1A14',
    media: photosFor('karva-chauth', 'Karva Chauth'),
  },
  {
    id: 'diwali',
    date: '2024-11-01', // TODO: confirm the year. Diwali 2024 was their first as a married couple.
    kicker: 'Diwali',
    title: 'Diwali, that year',
    quote: {
      text: 'Diwali was beautiful that year… not because the night was lit with a thousand lights, but because I had you beside me.',
    },
    accent: '#E8A444',
    tone: '#4D2C0E',
    media: photosFor('diwali', 'Diwali'),
  },
  {
    id: 'udaipur',
    date: '2025-01-15', // TODO: exact date not known; only used to order the story
    dateLabel: 'A trip together',
    kicker: 'Udaipur',
    title: 'The city of lakes',
    body: 'Blue water, the Aravalli hills all around, and the two of them with nowhere else to be.',
    place: 'Udaipur',
    accent: '#8FB8C4',
    tone: '#15303A',
    media: photosFor('udaipur', 'Udaipur'),
  },
  {
    id: 'now',
    date: iso(today),
    kicker: 'Right now',
    title: 'Still choosing each other',
    // TODO: where they live now, what they are doing, what they are looking forward to.
    body:
      'Valentine’s Day 2026: roses, chocolates, a heart made of petals, and the two of them. The story is not finished. This is just the page it is on today.',
    accent: '#E8DCC6',
    tone: '#26201B',
    media: photosFor('now', 'Right now'),
  },
]

// The photograph the particles become at the very end: the first photo in src/photos/finale.
// Put "silhouette" in the filename if it is dark figures against a bright sky; otherwise the
// particles gather on the bright parts of the picture, which suits most portraits.
const finale = photosFor('finale', 'Rajiv and Neha').find((m) => m.kind === 'photo')
export const finalePhoto: { src: string; mode: 'light' | 'dark' } | null = finale
  ? { src: finale.src, mode: /silhouette|dark/i.test(finale.src) ? 'dark' : 'light' }
  : null

// Used by the "in numbers" section.
export const diwaliDates = ['2023-11-12', '2024-11-01', '2025-10-20', '2026-11-08', '2027-10-29']

// Letters from one to the other. The section stays hidden until at least one is added, e.g.
// { from: 'a', text: 'Neha, ...' }   (a is Rajiv, b is Neha)
export const letters: { from: 'a' | 'b'; text: string }[] = []

const places = Array.from(new Set([prologue.b.city, prologue.a.city, ...chapters.map((c) => c.place).filter(Boolean)]))

// End credits. `{days}` is replaced with the live count.
export const credits = [
  { role: 'Starring', names: [couple.a, couple.b] },
  { role: 'With', names: ['Both families'] },
  { role: 'Filmed on location in', names: places as string[] },
  { role: 'Running time', names: ['{days} days, and counting'] },
  { role: 'Written by', names: ['The two of them, one day at a time'] },
]
