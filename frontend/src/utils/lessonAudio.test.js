import { beforeEach, describe, expect, it } from 'vitest'
import { stripSiteBrand } from './stripSiteBrand.js'
import {
  formatAudioTime,
  loadLastLesson,
  loadPosition,
  loadSpeed,
  rememberLessonAudio,
  resumeSeconds,
  saveSpeed,
  SPEEDS,
} from './lessonAudio.js'

function memoryStorage() {
  const data = new Map()
  return {
    getItem: (key) => (data.has(key) ? data.get(key) : null),
    setItem: (key, value) => data.set(key, String(value)),
    removeItem: (key) => data.delete(key),
  }
}

beforeEach(() => {
  globalThis.localStorage = memoryStorage()
})

describe('stripSiteBrand', () => {
  it('removes the host credit and keeps the lecturer', () => {
    expect(stripSiteBrand(
      'Sikiliza somo la Swala. Mhutubu: Sheikh Abu Hashim. Chanzo: www.assalafiyyah.com.',
    )).toBe('Sikiliza somo la Swala. Mhutubu: Sheikh Abu Hashim.')
    expect(stripSiteBrand(
      'Muhadhara wa Kiswahili — Sheikh Abu Hashim (www.assalafiyyah.com).',
    )).toBe('Muhadhara wa Kiswahili — Sheikh Abu Hashim.')
    expect(stripSiteBrand(
      'Mfululizo wa mihadhara ya Kiswahili kutoka Assalafiyyah: adabu za swala.',
    )).toBe('Mfululizo wa mihadhara ya Kiswahili: adabu za swala.')
    expect(stripSiteBrand('Sheikh Abu Hashim')).toBe('Sheikh Abu Hashim')
  })
})

describe('lesson audio memory', () => {
  it('restores a mid-file stop and ignores the edges', () => {
    expect(resumeSeconds(125, 600)).toBe(125)
    expect(resumeSeconds(1, 600)).toBe(0)
    expect(resumeSeconds(599, 600)).toBe(0)
    expect(formatAudioTime(125)).toBe('2:05')
  })

  it('remembers the last lesson, its position, and speed', () => {
    rememberLessonAudio({
      slug: 'abu-hashim-01-swala',
      title: 'Adabu za swala',
      url: 'https://atharulilm.or.tz/media/lessons/a.opus',
      position: 88.4,
    })
    expect(loadLastLesson()).toEqual({
      slug: 'abu-hashim-01-swala',
      title: 'Adabu za swala',
      url: 'https://atharulilm.or.tz/media/lessons/a.opus',
      position: 88,
    })
    expect(loadPosition('https://atharulilm.or.tz/media/lessons/a.opus')).toBe(88)

    rememberLessonAudio({
      slug: 'abu-hashim-01-swala',
      title: 'Adabu za swala',
      url: 'https://atharulilm.or.tz/media/lessons/a.opus',
      position: 0,
    })
    expect(loadLastLesson()).toBeNull()
    expect(loadPosition('https://atharulilm.or.tz/media/lessons/a.opus')).toBe(0)

    saveSpeed(1.25)
    expect(loadSpeed()).toBe(1.25)
    saveSpeed(9)
    expect(loadSpeed()).toBe(1.25)
    expect(SPEEDS).toContain(1)
  })
})
