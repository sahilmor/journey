import { useEffect, useRef, useState, type CSSProperties } from 'react'
import type { Media } from '../data/story'
import { Pause, Play } from './Icons'

type Props = {
  media: Media
  caption?: string
  className?: string
  style?: CSSProperties
  onOpen?: () => void
  // Reports the picture's real size once it is known, so the layout can follow its shape.
  onMeasure?: (width: number, height: number) => void
}

// A photo or video slot. The HTML element sets the size and position; the WebGL layer draws
// the picture into it. If WebGL is off or the file cannot be used as a texture, the HTML shows.
export default function Figure({ media, caption, className = '', style, onOpen, onMeasure }: Props) {
  const img = useRef<HTMLImageElement>(null)
  useEffect(() => {
    const el = img.current
    if (el?.complete && el.naturalWidth) onMeasure?.(el.naturalWidth, el.naturalHeight)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return (
    <figure className={`figure ${className} reveal`} style={style}>
      <div className="figure-media" data-gl-media>
        {media.kind === 'photo' ? (
          <img
            ref={img}
            crossOrigin="anonymous"
            src={media.src}
            alt={media.alt}
            loading="lazy"
            decoding="async"
            onLoad={(e) => onMeasure?.(e.currentTarget.naturalWidth, e.currentTarget.naturalHeight)}
          />
        ) : (
          <Video media={media} onMeasure={onMeasure} />
        )}
        {media.kind === 'photo' && onOpen && (
          <button type="button" className="figure-open" onClick={onOpen}>
            <span className="sr-only">Open photo: {media.alt}</span>
            <span className="figure-open-label mono" aria-hidden>
              View
            </span>
          </button>
        )}
      </div>
      {caption && <figcaption className="mono">{caption}</figcaption>}
    </figure>
  )
}

function Video({ media, onMeasure }: { media: Extract<Media, { kind: 'video' }>; onMeasure?: Props['onMeasure'] }) {
  const ref = useRef<HTMLVideoElement>(null)
  const [playing, setPlaying] = useState(false)
  const [userPaused, setUserPaused] = useState(false)

  // Plays only while on screen, so the videos never all download at once.
  useEffect(() => {
    const el = ref.current
    if (!el) return
    const io = new IntersectionObserver(
      ([e]) => {
        if (e.isIntersecting && !userPaused) el.play().catch(() => {})
        else el.pause()
      },
      { rootMargin: '200px 0px', threshold: 0 },
    )
    io.observe(el)
    return () => io.disconnect()
  }, [userPaused])

  const toggle = () => {
    const el = ref.current
    if (!el) return
    if (el.paused) {
      setUserPaused(false)
      el.play().catch(() => {})
    } else {
      setUserPaused(true)
      el.pause()
    }
  }

  return (
    <>
      <video
        ref={ref}
        crossOrigin="anonymous"
        src={media.src}
        poster={media.poster}
        muted
        loop
        playsInline
        preload="metadata"
        aria-label={media.alt}
        onLoadedMetadata={(e) => onMeasure?.(e.currentTarget.videoWidth, e.currentTarget.videoHeight)}
        onPlay={() => setPlaying(true)}
        onPause={() => setPlaying(false)}
      />
      <button type="button" className="figure-play mono" onClick={toggle}>
        {playing ? <Pause /> : <Play />}
        {playing ? 'Pause' : 'Play'}
      </button>
    </>
  )
}
