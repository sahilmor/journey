import { chapters, letters } from '../data/story'

// Numbers shown next to the sections after the chapters: 07 · In numbers, 08 · Letters, ...
const N = chapters.length
const pad = (n: number) => String(n).padStart(2, '0')
export const sectionNo = {
  numbers: pad(N + 1),
  letters: pad(N + 2),
  finale: pad(N + (letters.length > 0 ? 3 : 2)),
}

const WORDS = ['no', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine', 'ten', 'eleven', 'twelve']
export const chaptersInWords = `${WORDS[N] ?? N} chapter${N === 1 ? '' : 's'}`
