import { describe, expect, it } from 'vitest'
import { postAuthHomePath, resolvePostAuthPath } from './postAuthPath.js'

describe('postAuthHomePath', () => {
  it('sends learners to /dashboard', () => {
    expect(postAuthHomePath({ role: 'student', sections: [] })).toBe('/dashboard')
    expect(postAuthHomePath(null)).toBe('/dashboard')
  })

  it('sends staff with sections to /admin', () => {
    expect(postAuthHomePath({ role: 'admin', sections: ['curriculum'] })).toBe('/admin')
  })
})

describe('resolvePostAuthPath', () => {
  it('honors a safe redirect query', () => {
    expect(resolvePostAuthPath({ sections: ['users'] }, '/learn/fiqh')).toBe('/learn/fiqh')
  })

  it('rejects open redirects and falls back to role home', () => {
    expect(resolvePostAuthPath({ sections: ['users'] }, '//evil.example')).toBe('/admin')
    expect(resolvePostAuthPath({ sections: [] }, 'https://evil.example')).toBe('/dashboard')
  })
})
