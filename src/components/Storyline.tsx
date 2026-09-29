import { firstStory } from '../data/story'
import { STATION } from '../scroll'

// Their own account of the first meeting, read one beat at a time.
// Behind it, the two galaxies drift towards each other and meet as "It's you" arrives.
export default function Storyline() {
  return (
    <section className="storyline" aria-label={firstStory.title}>
      <p className="storyline-title mono reveal">{firstStory.title}</p>
      {firstStory.beats.map((beat, i) => (
        <div
          key={i}
          className="storyline-beat"
          data-station={i === firstStory.beats.length - 1 ? STATION.story : undefined}
        >
          {beat.map((line, j) => (
            <p
              key={j}
              className={`storyline-line reveal${line.size ? ` is-${line.size}` : ''}${line.italic ? ' is-italic' : ''}`}
              style={{ ['--d' as string]: `${j * 0.18}s` }}
            >
              {line.text}
            </p>
          ))}
        </div>
      ))}
    </section>
  )
}
