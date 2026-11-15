/**
 * Quran reader client — fawazahmed0/quran-api via Athar gateway (/athar/v1/quranapi).
 * Editions (first languages): Arabic mushaf + EN/SW translations only.
 *
 * Audio:
 * - Per-ayah: EveryAyah MP3 (CORS *). One file per ayah → ayah highlight.
 * - Word sync: Quran.com chapter audio + verified word segments via
 *   /athar/v1/qurancom (Al-Afasy murattal id 7). EveryAyah has no word timings.
 *
 * Tafsir: Al-Sa'di (resource 91) via /athar/v1/qurancom — Salafi text, not invented.
 */
const GATEWAY_QURANAPI = '/athar/v1/quranapi'
const GATEWAY_QURANCOM = '/athar/v1/qurancom'

/** Quran.com chapter-reciter id with verified word segments (Al-Afasy murattal). */
export const WORD_SYNC_RECITER_ID = 7

/** Al-Sa'di Arabic tafsir (Quran.com resource id). */
export const TAFSIR_SAADI_ID = 91

/** EveryAyah reciter folders (verified 200 on 001001.mp3). */
export const QURAN_RECITERS = [
  {
    id: 'Alafasy_128kbps',
    label: 'Mishary Rashid Alafasy',
    labelAr: 'مشاري راشد العفاسي',
    base: 'https://everyayah.com/data/Alafasy_128kbps',
    wordSyncId: WORD_SYNC_RECITER_ID,
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
const STORAGE_MODES = 'athar-quran-modes'
const STORAGE_SPEED = 'athar-quran-speed'
const STORAGE_EXPERIENCE = 'athar-quran-experience'

export const QURAN_SPEEDS = [0.75, 1, 1.25, 1.5]
export const QURAN_EXPERIENCES = ['read', 'learn', 'listen']

export const DEFAULT_QURAN_MODES = {
  tafsir: false,
  player: true,
  translation: true,
  compact: false,
  wordSync: true,
}

async function gatewayGet(base, path) {
  const res = await fetch(`${base}${path.startsWith('/') ? path : `/${path}`}`)
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

export function loadSavedModes() {
  const base = { ...DEFAULT_QURAN_MODES }
  if (typeof localStorage === 'undefined') return base
  try {
    const raw = localStorage.getItem(STORAGE_MODES)
    if (!raw) return base
    const parsed = JSON.parse(raw)
    return {
      tafsir: Boolean(parsed?.tafsir),
      player: parsed?.player !== false,
      translation: parsed?.translation !== false,
      compact: Boolean(parsed?.compact),
      wordSync: parsed?.wordSync !== false,
    }
  } catch {
    return base
  }
}

export function saveModes(modes) {
  if (typeof localStorage === 'undefined') return
  localStorage.setItem(STORAGE_MODES, JSON.stringify({
    tafsir: Boolean(modes.tafsir),
    player: modes.player !== false,
    translation: modes.translation !== false,
    compact: Boolean(modes.compact),
    wordSync: modes.wordSync !== false,
  }))
}

export function loadSavedSpeed() {
  if (typeof localStorage === 'undefined') return 1
  const n = Number(localStorage.getItem(STORAGE_SPEED))
  return QURAN_SPEEDS.includes(n) ? n : 1
}

export function saveSpeed(rate) {
  if (typeof localStorage === 'undefined') return
  localStorage.setItem(STORAGE_SPEED, String(rate))
}

export function loadSavedExperience() {
  if (typeof localStorage === 'undefined') return 'learn'
  const v = localStorage.getItem(STORAGE_EXPERIENCE)
  return QURAN_EXPERIENCES.includes(v) ? v : 'learn'
}

export function saveExperience(exp) {
  if (typeof localStorage === 'undefined') return
  localStorage.setItem(STORAGE_EXPERIENCE, exp)
}

/** Presets for reading / learning / listening experiences. */
export function modesForExperience(exp) {
  if (exp === 'read') {
    return { player: false, wordSync: false, tafsir: false, translation: true, compact: false }
  }
  if (exp === 'listen') {
    return { player: true, wordSync: true, tafsir: false, translation: false, compact: true }
  }
  return { player: true, wordSync: true, tafsir: true, translation: true, compact: false }
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

/** Split Uthmani ayah into display words (space-separated). */
export function splitAyahWords(arabic) {
  return String(arabic || '')
    .trim()
    .split(/\s+/)
    .filter(Boolean)
}

/**
 * Normalize Quran.com segments to { wordIndex (1-based), startMs, endMs }.
 * Drops incomplete rows like [1] without times (repeats / placeholders).
 */
export function normalizeSegments(segments) {
  if (!Array.isArray(segments)) return []
  const out = []
  for (const row of segments) {
    if (!Array.isArray(row) || row.length < 3) continue
    const wordIndex = Number(row[0])
    const startMs = Number(row[1])
    const endMs = Number(row[2])
    if (!wordIndex || !Number.isFinite(startMs) || !Number.isFinite(endMs)) continue
    out.push({ wordIndex, startMs, endMs })
  }
  return out
}

/**
 * Find active word index (1-based) for current chapter audio time in ms.
 * Returns null if outside known segments.
 */
export function activeWordAt(ms, verseTimings) {
  if (!verseTimings?.length || !Number.isFinite(ms)) return null
  for (const vt of verseTimings) {
    if (ms < vt.timestampFrom || ms > vt.timestampTo) continue
    const segs = vt.segments || []
    for (let i = segs.length - 1; i >= 0; i -= 1) {
      const s = segs[i]
      if (ms >= s.startMs) {
        return { verse: vt.verse, wordIndex: s.wordIndex }
      }
    }
    return { verse: vt.verse, wordIndex: segs[0]?.wordIndex || 1 }
  }
  // Between verses: pick verse by timestamp envelope
  for (const vt of verseTimings) {
    if (ms >= vt.timestampFrom && ms < vt.timestampTo) {
      return { verse: vt.verse, wordIndex: null }
    }
  }
  return null
}

export function parseVerseKey(key) {
  const [c, v] = String(key || '').split(':').map(Number)
  return { chapter: c || 0, verse: v || 0 }
}

/** Strip HTML from tafsir payloads for safe plain-text display. */
export function stripHtml(html) {
  return String(html || '')
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

export const quranApi = {
  getInfo: () => gatewayGet(GATEWAY_QURANAPI, '/info'),
  getChapter: (editionId, chapter) =>
    gatewayGet(GATEWAY_QURANAPI, `/editions/${editionId}/${Number(chapter)}`),

  /**
   * Chapter audio + word segments (Quran.com via gateway).
   * @returns {{ audioUrl, durationMs, verses: Array<{verse, timestampFrom, timestampTo, segments}> }}
   */
  async getChapterTiming(chapter, reciterId = WORD_SYNC_RECITER_ID) {
    const data = await gatewayGet(
      GATEWAY_QURANCOM,
      `/chapter_recitations/${Number(reciterId)}/${Number(chapter)}?segments=true`,
    )
    const file = data?.audio_file || data
    const timestamps = file?.timestamps || []
    return {
      audioUrl: file?.audio_url || '',
      durationMs: Number(file?.duration) || 0,
      verses: timestamps.map((row) => {
        const { verse } = parseVerseKey(row.verse_key)
        return {
          verse,
          timestampFrom: Number(row.timestamp_from) || 0,
          timestampTo: Number(row.timestamp_to) || 0,
          segments: normalizeSegments(row.segments),
        }
      }).filter(v => v.verse >= 1),
    }
  },

  async getTafsir(chapter, verse, tafsirId = TAFSIR_SAADI_ID) {
    const data = await gatewayGet(
      GATEWAY_QURANCOM,
      `/tafsirs/${Number(tafsirId)}/by_ayah/${Number(chapter)}:${Number(verse)}`,
    )
    const tafsir = data?.tafsir || data
    return {
      name: tafsir?.resource_name || tafsir?.translated_name?.name || "Al-Sa'di",
      text: stripHtml(tafsir?.text || ''),
    }
  },
}
