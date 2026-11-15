import { describe, expect, it } from 'vitest'
import {
  activeWordAt,
  ayahAudioUrl,
  getReciterById,
  modesForExperience,
  normalizeSegments,
  splitAyahWords,
  stripHtml,
  QURAN_RECITERS,
  QURAN_SPEEDS,
  DEFAULT_QURAN_MODES,
} from './quran.js'

describe('quran audio helpers', () => {
  it('lists multiple EveryAyah reciters', () => {
    expect(QURAN_RECITERS.length).toBeGreaterThanOrEqual(5)
    expect(QURAN_RECITERS[0].id).toBe('Alafasy_128kbps')
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

  it('maps experience presets for read/learn/listen', () => {
    expect(modesForExperience('read').player).toBe(false)
    expect(modesForExperience('learn').tafsir).toBe(true)
    expect(modesForExperience('listen').wordSync).toBe(true)
    expect(QURAN_SPEEDS).toContain(1.25)
  })
})
