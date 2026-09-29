// Per-frame values shared between the WebGL pieces, outside React so nothing re-renders.
export const live = {
  station: 0, // smoothed scroll station
  groupX: 0, // where the particle shape currently sits, in world units
  halfW: 5, // half the visible width at the particles' depth
  mediaCover: 0, // how much of the screen photos cover right now (0 to 1)
  introAt: -1, // performance.now() when the intro started, -1 before
  pointer: { x: 0, y: 0, at: -1e9, touch: false }, // cursor in normalised device coordinates
}

export const INTRO_MS = 2800
