import { createI18n } from 'vue-i18n'
import en from './en.json'
import ar from './ar.json'
import sw from './sw.json'

// During SSG prerender there is no window/document/localStorage. Guard every
// browser access so the i18n module can be imported on the server. The static
// HTML is built in the default locale (en); the client re-applies the persisted
// locale on mount.
const isClient = typeof window !== 'undefined'

export const LOCALES = ['en', 'ar', 'sw']

const savedRaw = (isClient && localStorage.getItem('athar-locale')) || 'en'
const savedLocale = LOCALES.includes(savedRaw) ? savedRaw : 'en'

export const i18n = createI18n({
  legacy: false,
  locale: savedLocale,
  fallbackLocale: 'en',
  messages: { en, ar, sw },
})

function applyDocumentDir(locale) {
  if (typeof document === 'undefined') return
  document.documentElement.lang = locale
  // RTL only for Arabic; Swahili and English stay LTR.
  document.documentElement.dir = locale === 'ar' ? 'rtl' : 'ltr'
}

export function setLocale(locale) {
  const next = LOCALES.includes(locale) ? locale : 'en'
  i18n.global.locale.value = next
  if (isClient) localStorage.setItem('athar-locale', next)
  applyDocumentDir(next)
}

/** Cycle EN → SW → AR → EN */
export function cycleLocale(current) {
  const idx = LOCALES.indexOf(current)
  const next = LOCALES[(idx + 1) % LOCALES.length]
  setLocale(next)
  return next
}

export function localeLabel(code) {
  if (code === 'ar') return 'العربية'
  if (code === 'sw') return 'Kiswahili'
  return 'English'
}

// Apply persisted locale immediately on the client (before Vue mounts).
applyDocumentDir(savedLocale)
