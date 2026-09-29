# Aanya & Kabir, since 2023

A single-page film of two people, from the first hello in January 2023 to today.
All names, dates, places, words and photos are placeholders for the design stage.

## The idea

One set of about 34,000 particles (16,000 on phones) tells the whole story by changing shape as
you scroll. The first half of the particles is always her, the second half is always him:

| Section | The particles become |
| --- | --- |
| Opening | Their names, in the display serif. The cursor parts them like dust. |
| Before | Two separate galaxies, gold and silver, far apart |
| 01 The first hello | The two galaxies drawn into one spiral |
| 02 The yes | A ring with a stone, turning |
| 03 Saat phere | Two paths walking seven rounds around a rising flame |
| 04 First trip | A ridge of mountains as scan lines, with the trail they took |
| 05 Year one | A globe turned to India, their cities joined in the order they happened |
| 06 The beach year | A moving sea at sunset |
| 07 Right now | Every day since the first hello on a spiral, one loop per year |
| In numbers | The same spiral, tilted |
| Letters | Quiet dust |
| Today | Their photograph, rebuilt from particles |
| Credits | Stars |

Photos and videos are drawn in WebGL at exactly the place the page lays them out, so they can be
revealed from the bottom up, graded to look like one film, bent slightly by fast scrolling, and
pulled by a small lens under the cursor. Without WebGL the page falls back to plain HTML images
and titles.

## Stack

- **Vite + React + TypeScript**: a static site, no server needed.
- **three.js via @react-three/fiber** with custom GLSL shaders (`src/gl/`).
- **Lenis** smooth scrolling, driven from the WebGL frame loop so photos and page never drift apart.
- Fonts: Instrument Serif (display), Geist and Geist Mono (text and labels), Tiro Devanagari Hindi.

## Run locally

```bash
npm install
npm run dev
```

## Changing the story

Everything lives in `src/data/story.ts`:

- `couple`: names, first meeting date and wedding date. The clock, the day counter, the numbers
  and the anniversary countdown are all calculated from these.
- `prologue`, `acts`, `chapters`, `letters`, `credits`: the words.
- Each chapter has `coords` (used by the globe), an `accent` for small details and a `tone`, the
  dark colour the background glows with while that chapter is on screen.
- `finalePhoto`: the photograph the particles become at the end. Use `mode: 'light'` for a normal
  portrait (particles gather on bright areas) or `mode: 'dark'` for a silhouette against a bright
  sky (particles gather on dark areas).

Which particle shape tells which chapter is set in `CHAPTER_SHAPE` in `src/gl/Particles.tsx`.

### Using your own photos and videos

1. Put files in `public/media/` (for example `public/media/wedding-1.jpg`).
2. In `story.ts`, set `src: '/media/wedding-1.jpg'`.
3. Videos: `{ kind: 'video', src: '/media/clip.mp4', alt: '...' }`. Keep clips short, 720p H.264,
   under about 10 MB. They only load and play near the screen.

Photos look best at around 1600 to 2000 px on the long edge, saved as JPG or WebP. Photos from
other websites must allow cross-origin use to be drawn in WebGL; files in `public/media` always do.

## Deploy

1. Push this folder to a GitHub repository.
2. In Vercel, "Add New Project" and import the repository. Vercel detects Vite; the defaults
   (`npm run build`, output `dist`) are correct.
