/**
 * Quran reader client — fawazahmed0/quran-api via Athar gateway (/athar/v1/quranapi).
 * Editions (first languages): Arabic mushaf + EN/SW translations only.
 *
 * Audio: quran-api has no recitation endpoint. Author points to EveryAyah
 * (https://github.com/fawazahmed0/quran-api/issues/64); companion YouTube
 * chapter maps live in fawazahmed0/quran-videos. We prefer HTML5 MP3 from
 * EveryAyah (CORS *). Binary audio is not proxied through the JSON gateway.
 */
const GATEWAY = '/athar/v1/quranapi'

/** EveryAyah reciter folder — Murattal, widely used with quran-videos timings. */
export const QURAN_RECITER = {
  id: 'Alafasy_128kbps',
  label: 'Mishary Rashid Alafasy',
  base: 'https://everyayah.com/data/Alafasy_128kbps',
}

export const QURAN_EDITIONS = {
  ar: {
    id: 'ara-quranuthmanihaf',
    label: 'Arabic (Uthmani Hafs)',
    labelAr: 'العربية (عثماني حفص)',
  },
  en: {
    id: 'eng-muhammadtaqiudd',
    label: 'English — Hilali & Khan',
    labelAr: 'الإنجليزية — هلالي وخان',
  },
  sw: {
    id: 'swa-alimuhsinalbarw',
    label: 'Swahili — Ali Muhsin Al-Barwani',
    labelAr: 'السواحلية — علي محسن البرواني',
  },
}

async function gatewayGet(path) {
  const res = await fetch(`${GATEWAY}${path.startsWith('/') ? path : `/${path}`}`)
  if (!res.ok) {
    throw new Error(`Quran gateway ${res.status}`)
  }
  const body = await res.json()
  return body.data
}

/** Pad chapter/verse for EveryAyah filenames: 001001.mp3 */
export function ayahAudioUrl(chapter, verse, reciter = QURAN_RECITER) {
  const c = String(Number(chapter)).padStart(3, '0')
  const v = String(Number(verse)).padStart(3, '0')
  return `${reciter.base}/${c}${v}.mp3`
}

export const quranApi = {
  getInfo: () => gatewayGet('/info'),
  getChapter: (editionId, chapter) =>
    gatewayGet(`/editions/${editionId}/${Number(chapter)}`),
}
