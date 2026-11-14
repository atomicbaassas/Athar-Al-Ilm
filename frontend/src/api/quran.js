/**
 * Quran reader client — fawazahmed0/quran-api via Athar gateway (/athar/v1/quranapi).
 * Editions (first languages): Arabic mushaf + EN/SW translations only.
 */
const GATEWAY = '/athar/v1/quranapi'

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

export const quranApi = {
  getInfo: () => gatewayGet('/info'),
  getChapter: (editionId, chapter) =>
    gatewayGet(`/editions/${editionId}/${Number(chapter)}`),
}
