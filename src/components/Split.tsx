// Splits a line into words that rise out of their own mask when the parent is revealed.
// Screen readers get the sentence once; the animated words are hidden from them.
export default function Split({ text, delay = 0, italicFrom }: { text: string; delay?: number; italicFrom?: number }) {
  const words = text.split(' ')
  return (
    <>
      <span className="sr-only">{text}</span>
      <span aria-hidden>
        {words.map((w, i) => (
          <span key={i}>
            <span className="split-w">
              <span style={{ ['--i' as string]: i + delay }} className={italicFrom !== undefined && i >= italicFrom ? 'is-italic' : undefined}>
                {w}
              </span>
            </span>
            {i < words.length - 1 ? ' ' : ''}
          </span>
        ))}
      </span>
    </>
  )
}
