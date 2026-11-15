import { describe, expect, it } from 'vitest'
import {
  ayahAudioUrl,
  getReciterById,
  QURAN_RECITERS,
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
