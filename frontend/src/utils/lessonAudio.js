import { stripSiteBrand } from '@/utils/stripSiteBrand'

export const SPEEDS = [0.75, 1, 1.25, 1.5, 2]

const LAST_KEY = 'athar-lesson-audio'
const SPEED_KEY = 'athar-lesson-audio-speed'
const POS_KEY = 'athar-lesson-audio-pos'
const POS_CAP = 80

function store() {
  return typeof localStorage === 'undefined' ? null : localStorage
}

export function formatAudioTime(seconds) {
  const total = Math.max(0, Math.floor(Number(seconds) || 0))
  const mins = Math.floor(total / 60)
  const secs = total % 60
  return `${mins}:${String(secs).padStart(2, '0')}`
}

/** Seek only when the saved stop is inside the file, past the opening. */
export function resumeSeconds(saved, duration) {
  const position = Number(saved)
  const length = Number(duration)
  if (!Number.isFinite(position) || position < 3) return 0
  if (!Number.isFinite(length) || length <= 0) return 0
  if (position > length - 3) return 0
  return position
}

export function loadSpeed() {
  const box = store()
  if (!box) return 1
  const rate = Number(box.getItem(SPEED_KEY))
  return SPEEDS.includes(rate) ? rate : 1
}

export function saveSpeed(rate) {
  const box = store()
  if (!box || !SPEEDS.includes(rate)) return
  box.setItem(SPEED_KEY, String(rate))
}

function loadPositions() {
  const box = store()
  if (!box) return {}
  try {
    const parsed = JSON.parse(box.getItem(POS_KEY) || '{}')
    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) return {}
    return parsed
  } catch {
    return {}
  }
}

export function loadPosition(url) {
  if (!url) return 0
  const position = Number(loadPositions()[url])
  return Number.isFinite(position) ? position : 0
}

export function loadLastLesson() {
  const box = store()
  if (!box) return null
  try {
    const raw = JSON.parse(box.getItem(LAST_KEY) || 'null')
    if (!raw || typeof raw.slug !== 'string' || !raw.slug) return null
    const position = Number(raw.position) || 0
    if (position < 3) return null
    return {
      slug: raw.slug,
      title: stripSiteBrand(raw.title || ''),
      url: typeof raw.url === 'string' ? raw.url : '',
      position,
    }
  } catch {
    return null
  }
}

export function rememberLessonAudio({ slug, title, url, position }) {
  const box = store()
  if (!box || !url) return
  const seconds = Math.max(0, Math.floor(Number(position) || 0))
  if (slug) {
    box.setItem(LAST_KEY, JSON.stringify({
      slug: String(slug),
      title: String(title || ''),
      url: String(url),
      position: seconds,
    }))
  }
  const map = loadPositions()
  if (seconds < 3) delete map[url]
  else {
    if (url in map) delete map[url]
    map[url] = seconds
  }
  const keys = Object.keys(map)
  while (keys.length > POS_CAP) delete map[keys.shift()]
  box.setItem(POS_KEY, JSON.stringify(map))
}
