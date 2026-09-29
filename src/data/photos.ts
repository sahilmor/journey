import type { Media } from './story'

// Every photo or video dropped into src/photos/<folder>/ shows up in that chapter automatically,
// in filename order (so 1.jpg, 2.jpg, 3.jpg, or 01-..., 02-...).
// A descriptive filename becomes the caption: "02-first-dance.jpg" is captioned "First dance".
const files = import.meta.glob('../photos/*/*.{jpg,jpeg,png,webp,avif,mp4,webm,JPG,JPEG,PNG,WEBP,AVIF,MP4,WEBM}', {
  eager: true,
  query: '?url',
  import: 'default',
}) as Record<string, string>

const VIDEO = /\.(mp4|webm)$/i
// Camera and phone filenames make poor captions.
const CAMERA = /^(img|dsc|dscn|pxl|photo|image|whatsapp|screenshot|vid|mvimg)\b|^[\d\s._-]+$/i

export function photosFor(folder: string, fallbackAlt: string): Media[] {
  return Object.keys(files)
    .filter((path) => path.split('/').at(-2) === folder)
    .sort((a, b) => a.localeCompare(b, undefined, { numeric: true }))
    .map((path, i): Media => {
      const name = path.split('/').at(-1)!.replace(/\.[^.]+$/, '')
      const words = name.replace(/^\d+[\s._-]*/, '').replace(/[_-]+/g, ' ').trim()
      const alt = words && !CAMERA.test(name) ? words[0].toUpperCase() + words.slice(1) : `${fallbackAlt}, ${i + 1}`
      return VIDEO.test(path) ? { kind: 'video', src: files[path], alt } : { kind: 'photo', src: files[path], alt }
    })
}
