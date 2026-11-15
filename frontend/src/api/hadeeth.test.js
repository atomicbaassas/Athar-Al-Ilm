import { describe, expect, it } from 'vitest'
import { hadeethApi } from './hadeeth.js'

describe('hadeeth api client', () => {
  it('exposes gateway list/one helpers', () => {
    expect(typeof hadeethApi.categories).toBe('function')
    expect(typeof hadeethApi.list).toBe('function')
    expect(typeof hadeethApi.one).toBe('function')
  })
})
