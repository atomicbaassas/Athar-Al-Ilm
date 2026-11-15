import { describe, expect, it } from 'vitest'
import { CalculationMethod, Coordinates, PrayerTimes } from 'adhan'

/** Mirrors resolveSchedule next-day fajr roll (kept inline to avoid exporting internals). */
function nextAfterIsha(latitude, longitude, now) {
  const coords = new Coordinates(latitude, longitude)
  const params = CalculationMethod.Egyptian()
  const today = new PrayerTimes(coords, now, params)
  let nextId = today.nextPrayer(now)
  let nextAt = nextId && nextId !== 'none' ? today.timeForPrayer(nextId) : null
  if (nextId === 'sunrise') {
    nextId = 'dhuhr'
    nextAt = today.dhuhr
  }
  if (!nextAt || nextAt.getTime() <= now.getTime()) {
    const tomorrowDate = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1)
    const tomorrow = new PrayerTimes(coords, tomorrowDate, params)
    nextId = 'fajr'
    nextAt = tomorrow.fajr
  }
  return { nextId, nextAt }
}

describe('prayer schedule (adhan / Egyptian, muslimtify-style local calc)', () => {
  it('exposes Dar es Salaam fallback with Tanzania country in city options', async () => {
    const { FALLBACK_CITY, CITY_OPTIONS, nearestCityLabelKey } = await import('./usePrayerTimes.js')
    expect(FALLBACK_CITY.nameKey).toBe('home.prayer.cityDar')
    expect(CITY_OPTIONS.some(c => c.id === 'dar')).toBe(true)
    expect(nearestCityLabelKey(-6.7924, 39.2083)).toBe('home.prayer.cityDar')
    expect(nearestCityLabelKey(0, 0)).toBe('home.prayer.nearYou')
  })

  it('rolls to tomorrow fajr after isha in Dar es Salaam', () => {
    const evening = new Date(2026, 10, 15, 21, 0, 0)
    const { nextId, nextAt } = nextAfterIsha(-6.7924, 39.2083, evening)
    expect(nextId).toBe('fajr')
    expect(nextAt.getTime()).toBeGreaterThan(evening.getTime())
    expect(nextAt.getDate()).toBe(16)
  })

  it('returns a future next prayer before maghrib', () => {
    const afternoon = new Date(2026, 10, 15, 14, 0, 0)
    const { nextId, nextAt } = nextAfterIsha(-6.7924, 39.2083, afternoon)
    expect(['asr', 'maghrib', 'isha', 'dhuhr']).toContain(nextId)
    expect(nextAt.getTime()).toBeGreaterThan(afternoon.getTime())
  })
})
