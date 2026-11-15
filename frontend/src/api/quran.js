/**
 * Quran reader client — fawazahmed0/quran-api via Athar gateway (/athar/v1/quranapi).
 * Editions (first languages): Arabic mushaf + EN/SW translations only.
 *
 * Audio: quran-api has no recitation endpoint. Author points to EveryAyah
 * (https://github.com/fawazahmed0/quran-api/issues/64). HTML5 MP3 from
 * EveryAyah (CORS *). Binary audio is not proxied through the JSON gateway.
 *
 * Highlight: per-ayah queue (EveryAyah ships one MP3 per ayah). Word-level
 * timestamps would need mp3quran.net chapter audio — not wired here.
 */
const GATEWAY = '/athar/v1/quranapi'

/** EveryAyah reciter folders (verified 200 on 001001.mp3). */
export const QURAN_RECITERS = [
  {
    id: 'Alafasy_128kbps',
    label: 'Mishary Rashid Alafasy',
    labelAr: 'مشاري راشد العفاسي',
    base: 'https://everyayah.com/data/Alafasy_128kbps',
  },
  {
    id: 'Abdul_Basit_Murattal_192kbps',
    label: 'Abdul Basit (Murattal)',
    labelAr: 'عبد الباسط عبد الصمد',
    base: 'https://everyayah.com/data/Abdul_Basit_Murattal_192kbps',
  },
  {
    id: 'Husary_128kbps',
    label: 'Mahmoud Khalil Al-Husary',
    labelAr: 'محمود خليل الحصري',
    base: 'https://everyayah.com/data/Husary_128kbps',
  },
  {
    id: 'Minshawy_Murattal_128kbps',
    label: 'Mohamed Siddiq El-Minshawi',
    labelAr: 'محمد صديق المنشاوي',
    base: 'https://everyayah.com/data/Minshawy_Murattal_128kbps',
  },
  {
    id: 'MaherAlMuaiqly128kbps',
    label: 'Maher Al-Muaiqly',
    labelAr: 'ماهر المعيقلي',
    base: 'https://everyayah.com/data/MaherAlMuaiqly128kbps',
  },
  {
    id: 'Yasser_Ad-Dussary_128kbps',
    label: 'Yasser Al-Dosari',
    labelAr: 'ياسر الدوسري',
    base: 'https://everyayah.com/data/Yasser_Ad-Dussary_128kbps',
  },
  {
    id: 'Hani_Rifai_192kbps',
    label: 'Hani Ar-Rifai',
    labelAr: 'هاني الرفاعي',
    base: 'https://everyayah.com/data/Hani_Rifai_192kbps',
  },
  {
    id: 'Abu_Bakr_Ash-Shaatree_128kbps',
    label: 'Abu Bakr Ash-Shatri',
    labelAr: 'أبو بكر الشاطري',
    base: 'https://everyayah.com/data/Abu_Bakr_Ash-Shaatree_128kbps',
  },
  {
    id: 'Hudhaify_128kbps',
    label: 'Ali Al-Hudhaifi',
    labelAr: 'علي الحذيفي',
    base: 'https://everyayah.com/data/Hudhaify_128kbps',
  },
  {
    id: 'Abdullah_Basfar_192kbps',
    label: 'Abdullah Basfar',
    labelAr: 'عبد الله بصفر',
    base: 'https://everyayah.com/data/Abdullah_Basfar_192kbps',
  },
  {
    id: 'Ghamadi_40kbps',
    label: 'Saad Al-Ghamdi',
    labelAr: 'سعد الغامدي',
    base: 'https://everyayah.com/data/Ghamadi_40kbps',
  },
]

/** @deprecated use QURAN_RECITERS[0] — kept for older imports */
export const QURAN_RECITER = QURAN_RECITERS[0]

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

const STORAGE_RECITER = 'athar-quran-reciter'
const STORAGE_POSITION = 'athar-quran-position'
const STORAGE_TRANSLATION = 'athar-quran-translation'

async function gatewayGet(path) {
  const res = await fetch(`${GATEWAY}${path.startsWith('/') ? path : `/${path}`}`)
  if (!res.ok) {
    throw new Error(`Quran gateway ${res.status}`)
  }
  const body = await res.json()
  return body.data
}

/** Pad chapter/verse for EveryAyah filenames: 001001.mp3 */
export function ayahAudioUrl(chapter, verse, reciter = QURAN_RECITERS[0]) {
  const folder = typeof reciter === 'string'
    ? QURAN_RECITERS.find(r => r.id === reciter) || QURAN_RECITERS[0]
    : reciter
  const c = String(Number(chapter)).padStart(3, '0')
  const v = String(Number(verse)).padStart(3, '0')
  return `${folder.base}/${c}${v}.mp3`
}

export function getReciterById(id) {
  return QURAN_RECITERS.find(r => r.id === id) || QURAN_RECITERS[0]
}

export function loadSavedReciterId() {
  if (typeof localStorage === 'undefined') return QURAN_RECITERS[0].id
  const id = localStorage.getItem(STORAGE_RECITER)
  return QURAN_RECITERS.some(r => r.id === id) ? id : QURAN_RECITERS[0].id
}

export function saveReciterId(id) {
  if (typeof localStorage === 'undefined') return
  localStorage.setItem(STORAGE_RECITER, id)
}

export function loadSavedTranslation() {
  if (typeof localStorage === 'undefined') return 'en'
  const v = localStorage.getItem(STORAGE_TRANSLATION)
  return v === 'sw' || v === 'none' || v === 'en' ? v : 'en'
}

export function saveTranslation(lang) {
  if (typeof localStorage === 'undefined') return
  localStorage.setItem(STORAGE_TRANSLATION, lang)
}

export function loadSavedPosition() {
  if (typeof localStorage === 'undefined') return null
  try {
    const raw = localStorage.getItem(STORAGE_POSITION)
    if (!raw) return null
    const pos = JSON.parse(raw)
    const chapter = Number(pos?.chapter)
    const verse = Number(pos?.verse)
    if (!chapter || chapter < 1 || chapter > 114) return null
    return { chapter, verse: verse >= 1 ? verse : 1 }
  } catch {
    return null
  }
}

export function savePosition(chapter, verse) {
  if (typeof localStorage === 'undefined') return
  localStorage.setItem(STORAGE_POSITION, JSON.stringify({
    chapter: Number(chapter),
    verse: Number(verse) || 1,
  }))
}

export const quranApi = {
  getInfo: () => gatewayGet('/info'),
  getChapter: (editionId, chapter) =>
    gatewayGet(`/editions/${editionId}/${Number(chapter)}`),
}
