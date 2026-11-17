import { describe, expect, it } from 'vitest'
import {
  activeWordAt,
  ayahAudioUrl,
  chapterForJuz,
  chapterForPage,
  correctionMatchesTarget,
  experienceFromModes,
  getReciterById,
  modesEqual,
  modesForExperience,
  normalizeSegments,
  matchSpokenWords,
  practiceAdvanceAllowed,
  quranSharePath,
  resolveInitialModes,
  spanBoundsFromWordIndices,
  splitAyahWords,
  stripArabicDiacritics,
  stripHtml,
  wordIndicesFromMuaalemErrors,
  wordSyncIdForReciter,
  wordSyncReciters,
  VERIFIED_WORD_SYNC_IDS,
  QURAN_RECITERS,
  QURAN_SPEEDS,
  QURAN_EXPERIENCES,
  DEFAULT_QURAN_MODES,
} from './quran.js'

describe('quran audio helpers', () => {
  it('lists EveryAyah reciters including Sudais and word-sync map', () => {
    expect(QURAN_RECITERS.length).toBeGreaterThanOrEqual(15)
    expect(QURAN_RECITERS[0].id).toBe('Alafasy_128kbps')
    expect(getReciterById('Abdurrahmaan_As-Sudais_192kbps').wordSyncId).toBe(3)
    expect(wordSyncReciters().length).toBeGreaterThanOrEqual(8)
    expect(wordSyncIdForReciter('Husary_128kbps')).toBe(6)
    expect(VERIFIED_WORD_SYNC_IDS).toEqual([2, 3, 4, 5, 6, 7, 9, 10, 97])
    for (const r of wordSyncReciters()) {
      expect(VERIFIED_WORD_SYNC_IDS).toContain(r.wordSyncId)
    }
  })

  it('builds padded EveryAyah URLs for a chosen reciter', () => {
    const husary = getReciterById('Husary_128kbps')
    expect(ayahAudioUrl(2, 255, husary)).toBe(
      'https://everyayah.com/data/Husary_128kbps/002255.mp3',
    )
  })

  it('falls back to Alafasy for unknown ids', () => {
    expect(getReciterById('nope').id).toBe('Alafasy_128kbps')
  })
})

describe('word timing helpers', () => {
  it('splits Uthmani ayah into words', () => {
    expect(splitAyahWords('بِسْمِ ٱللَّهِ ٱلرَّحْمَـٰنِ ٱلرَّحِيمِ')).toEqual([
      'بِسْمِ',
      'ٱللَّهِ',
      'ٱلرَّحْمَـٰنِ',
      'ٱلرَّحِيمِ',
    ])
  })

  it('normalizes complete segments and drops incomplete rows', () => {
    expect(normalizeSegments([
      [1, 0, 580],
      [1],
      [2, 580, 1409],
      [2],
    ])).toEqual([
      { wordIndex: 1, startMs: 0, endMs: 580 },
      { wordIndex: 2, startMs: 580, endMs: 1409 },
    ])
  })

  it('resolves active word from chapter timestamps', () => {
    const verses = [{
      verse: 1,
      timestampFrom: 0,
      timestampTo: 6090,
      segments: normalizeSegments([[1, 0, 580], [2, 580, 1409], [3, 1409, 2502], [4, 2502, 5840]]),
    }]
    expect(activeWordAt(100, verses)).toEqual({ verse: 1, wordIndex: 1 })
    expect(activeWordAt(900, verses)).toEqual({ verse: 1, wordIndex: 2 })
    expect(activeWordAt(3000, verses)).toEqual({ verse: 1, wordIndex: 4 })
  })

  it('strips tafsir HTML without inventing text', () => {
    expect(stripHtml('<span>بِسْمِ</span> أي: أبتدئ')).toBe('بِسْمِ أي: أبتدئ')
  })

  it('exposes default reader modes including word sync', () => {
    expect(DEFAULT_QURAN_MODES.wordSync).toBe(true)
    expect(DEFAULT_QURAN_MODES.player).toBe(true)
    expect(DEFAULT_QURAN_MODES.tafsir).toBe(false)
  })

  it('maps experience presets for read/learn/listen/practice', () => {
    expect(modesForExperience('read').player).toBe(false)
    expect(modesForExperience('learn').tafsir).toBe(true)
    expect(modesForExperience('listen').wordSync).toBe(true)
    expect(modesForExperience('practice').wordSync).toBe(true)
    expect(modesForExperience('practice').tafsir).toBe(false)
    expect(QURAN_EXPERIENCES).toContain('practice')
    expect(QURAN_SPEEDS).toContain(1.25)
  })

  it('resolveInitialModes prefers experience over stale saved modes', () => {
    expect(resolveInitialModes('learn', { ...DEFAULT_QURAN_MODES, tafsir: false }).modes.tafsir).toBe(true)
    expect(resolveInitialModes('read', DEFAULT_QURAN_MODES).modes.player).toBe(false)
    expect(resolveInitialModes('listen', DEFAULT_QURAN_MODES).modes.translation).toBe(false)
    expect(resolveInitialModes('practice', DEFAULT_QURAN_MODES).modes.player).toBe(true)
  })

  it('detects custom when toggles leave a preset', () => {
    const listen = modesForExperience('listen')
    expect(experienceFromModes(listen)).toBe('listen')
    expect(experienceFromModes({ ...listen, translation: true })).toBe('custom')
    expect(modesEqual(listen, modesForExperience('listen'))).toBe(true)
    expect(experienceFromModes(modesForExperience('practice'))).toBe('practice')
  })

  it('builds share paths and juz/page chapter jumps', () => {
    expect(quranSharePath(2, 255)).toBe('/quran?surah=2&ayah=255')
    expect(chapterForJuz([{ juz: 1, start: { chapter: 1, verse: 1 } }], 1)).toBe(1)
    expect(chapterForPage([{ page: 2, start: { chapter: 2, verse: 1 } }], 2)).toBe(2)
  })

  it('maps muaalem errors to word spans and gates advance', () => {
    const result = {
      start: { sura_idx: 1, aya_idx: 1, uthmani_word_idx: 0 },
      end: { sura_idx: 1, aya_idx: 1, uthmani_word_idx: 4 },
      uthmani_text: 'بِسْمِ ٱللَّهِ ٱلرَّحْمَـٰنِ ٱلرَّحِيمِ',
      errors: [{ uthmani_pos: [0, 5], error_type: 'normal', speech_error_type: 'replace' }],
    }
    expect(correctionMatchesTarget(result, 1, 1)).toBe(true)
    expect(correctionMatchesTarget(result, 1, 2)).toBe(false)
    expect(wordIndicesFromMuaalemErrors(result)).toEqual([1])
    expect(practiceAdvanceAllowed(false)).toBe(false)
    expect(practiceAdvanceAllowed(true)).toBe(true)
    const segs = normalizeSegments([[1, 0, 580], [2, 580, 1409], [3, 1409, 2502]])
    expect(spanBoundsFromWordIndices(segs, [2, 3])).toEqual({
      startMs: 580,
      endMs: 2502,
      wordFrom: 2,
      wordTo: 3,
    })
  })

  it('matches live spoken words against ayah (diacritics stripped)', () => {
    const words = splitAyahWords('بِسْمِ ٱللَّهِ ٱلرَّحْمَـٰنِ ٱلرَّحِيمِ')
    expect(stripArabicDiacritics(words[0])).toBe('بسم')
    const mid = matchSpokenWords(words, 'بسم الله')
    expect(mid.heard).toEqual([1, 2])
    expect(mid.current).toBe(3)
    expect(mid.complete).toBe(false)
    const done = matchSpokenWords(words, 'بسم الله الرحمن الرحيم')
    expect(done.complete).toBe(true)
    expect(done.current).toBe(null)
  })
})
