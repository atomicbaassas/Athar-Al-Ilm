import { describe, expect, it } from 'vitest'
import { UMMAH_STRONG_COLLECTIONS, ummahHadithApi } from './ummahHadith.js'

describe('ummahHadith api client', () => {
  it('exposes collections/list/one and strong-book keys', () => {
    expect(typeof ummahHadithApi.collections).toBe('function')
    expect(typeof ummahHadithApi.list).toBe('function')
    expect(typeof ummahHadithApi.one).toBe('function')
    expect(UMMAH_STRONG_COLLECTIONS).toContain('bukhari')
    expect(UMMAH_STRONG_COLLECTIONS).not.toContain('dehlawi')
  })
})
