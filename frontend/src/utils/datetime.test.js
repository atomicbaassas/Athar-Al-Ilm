import { describe, expect, it } from 'vitest'
import {
  formatChartDay,
  formatDate,
  formatDateTime,
  formatEventLocal,
  formatTime,
} from './datetime.js'

describe('datetime (device locale)', () => {
  const iso = '2026-11-19T15:30:00.000Z'

  it('returns em dash for empty / invalid', () => {
    expect(formatDate(null)).toBe('—')
    expect(formatDateTime('not-a-date')).toBe('—')
    expect(formatTime('')).toBe('—')
    expect(formatEventLocal(undefined)).toBe('')
  })

  it('formats without throwing for a real instant', () => {
    expect(formatDate(iso)).toMatch(/\d/)
    expect(formatDateTime(iso)).toMatch(/\d/)
    expect(formatTime(iso)).toMatch(/\d/)
    expect(formatChartDay(iso)).toMatch(/\d/)
    expect(formatEventLocal(iso)).toMatch(/\d/)
  })

  it('accepts Date instances', () => {
    expect(formatDate(new Date(iso))).toMatch(/\d/)
  })
})
