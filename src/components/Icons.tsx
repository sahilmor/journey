// Thin line icons, drawn at 1.25px so they sit quietly next to small mono type.
type P = { size?: number }

const base = (size: number) => ({
  width: size,
  height: size,
  viewBox: '0 0 24 24',
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 1.25,
  strokeLinecap: 'square' as const,
  'aria-hidden': true,
})

export const ArrowRight = ({ size = 14 }: P) => (
  <svg {...base(size)}>
    <path d="M3 12h17M14 6l6 6-6 6" />
  </svg>
)

export const ArrowUp = ({ size = 14 }: P) => (
  <svg {...base(size)}>
    <path d="M12 21V4M6 10l6-6 6 6" />
  </svg>
)

export const Close = ({ size = 14 }: P) => (
  <svg {...base(size)}>
    <path d="M5 5l14 14M19 5L5 19" />
  </svg>
)

export const Play = ({ size = 10 }: P) => (
  <svg {...base(size)} fill="currentColor" stroke="none">
    <path d="M6 4v16l14-8z" />
  </svg>
)

export const Pause = ({ size = 10 }: P) => (
  <svg {...base(size)} fill="currentColor" stroke="none">
    <path d="M6 4h4v16H6zM14 4h4v16h-4z" />
  </svg>
)
