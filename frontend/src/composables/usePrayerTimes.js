/**
 * Local prayer-time UX (not a religious source API — C-SRC unchanged).
 *
 * Approach mirrors muslimtify / libmuslim: compute times on-device from
 * lat/lon + a named calculation method. We use the MIT `adhan` package
 * (batoulapps lineage, also cited in muslimtify method docs) instead of
 * vendoring GPL-3 muslimtify C sources.
 */
import { computed, onMounted, onUnmounted, ref, watch } from 'vue'
import { CalculationMethod, Coordinates, PrayerTimes } from 'adhan'

const isClient = typeof window !== 'undefined'
const STORAGE_KEY = 'athar-prayer-location'
const GEO_TIMEOUT_MS = 8000

/** Default: Dar es Salaam — never blocks the hero if geolocation is denied. */
export const FALLBACK_CITY = {
  id: 'dar',
  nameKey: 'home.prayer.cityDar',
  latitude: -6.7924,
  longitude: 39.2083,
  timezoneHint: 'Africa/Dar_es_Salaam',
}

export const CITY_OPTIONS = [
  FALLBACK_CITY,
  { id: 'dodoma', nameKey: 'home.prayer.cityDodoma', latitude: -6.1630, longitude: 35.7516 },
  { id: 'arusha', nameKey: 'home.prayer.cityArusha', latitude: -3.3869, longitude: 36.6830 },
  { id: 'zanzibar', nameKey: 'home.prayer.cityZanzibar', latitude: -6.1659, longitude: 39.2026 },
  { id: 'nairobi', nameKey: 'home.prayer.cityNairobi', latitude: -1.2921, longitude: 36.8219 },
]

const PRAYER_ORDER = ['fajr', 'dhuhr', 'asr', 'maghrib', 'isha']

function egyptianParams() {
  // Same family as muslimtify's `egypt` method (Egyptian General Authority).
  return CalculationMethod.Egyptian()
}

function dayKey(date) {
  return `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`
}

function loadStoredLocation() {
  if (!isClient) return null
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw)
    if (
      typeof parsed?.latitude === 'number' &&
      typeof parsed?.longitude === 'number' &&
      Number.isFinite(parsed.latitude) &&
      Number.isFinite(parsed.longitude)
    ) {
      return parsed
    }
  } catch {
    /* ignore */
  }
  return null
}

function persistLocation(payload) {
  if (!isClient) return
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(payload))
  } catch {
    /* ignore */
  }
}

function formatRemaining(ms) {
  const totalSec = Math.max(0, Math.floor(ms / 1000))
  const h = Math.floor(totalSec / 3600)
  const m = Math.floor((totalSec % 3600) / 60)
  const s = totalSec % 60
  const pad = (n) => String(n).padStart(2, '0')
  if (h > 0) return `${h}:${pad(m)}:${pad(s)}`
  return `${pad(m)}:${pad(s)}`
}

function formatClock(date, locale) {
  try {
    return new Intl.DateTimeFormat(locale === 'ar' ? 'ar' : 'en', {
      hour: 'numeric',
      minute: '2-digit',
    }).format(date)
  } catch {
    return date.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })
  }
}

/**
 * Resolve next prayer time, rolling to tomorrow's fajr after isha.
 */
function resolveSchedule(latitude, longitude, now) {
  const coords = new Coordinates(latitude, longitude)
  const params = egyptianParams()
  const today = new PrayerTimes(coords, now, params)

  const slots = PRAYER_ORDER.map((id) => ({
    id,
    at: today[id],
  }))

  // adhan's currentPrayer/nextPrayer default to wall-clock Date(); pass `now`.
  let currentId = today.currentPrayer(now)
  if (currentId === 'sunrise' || currentId === 'none') currentId = null

  let nextId = today.nextPrayer(now)
  // We only surface the five salah; skip sunrise as a "next" target.
  if (nextId === 'sunrise') nextId = 'dhuhr'
  let nextAt = nextId && nextId !== 'none' ? today.timeForPrayer(nextId) : null

  if (!nextAt || nextAt.getTime() <= now.getTime()) {
    const tomorrowDate = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1)
    const tomorrow = new PrayerTimes(coords, tomorrowDate, params)
    nextId = 'fajr'
    nextAt = tomorrow.fajr
  }

  return { slots, currentId, nextId, nextAt }
}

export function usePrayerTimes() {
  const now = ref(isClient ? new Date() : new Date(0))
  const latitude = ref(FALLBACK_CITY.latitude)
  const longitude = ref(FALLBACK_CITY.longitude)
  const cityId = ref(FALLBACK_CITY.id)
  const locationSource = ref('fallback') // 'geo' | 'city' | 'fallback' | 'stored'
  const locationLabelKey = ref(FALLBACK_CITY.nameKey)
  const geoStatus = ref('idle') // idle | prompting | granted | denied | unavailable
  const showCityPicker = ref(false)

  let tickTimer = null
  let dayWatchKey = dayKey(now.value)

  const schedule = computed(() =>
    resolveSchedule(latitude.value, longitude.value, now.value),
  )

  const countdownMs = computed(() => {
    const target = schedule.value.nextAt
    if (!target) return 0
    return Math.max(0, target.getTime() - now.value.getTime())
  })

  const countdownLabel = computed(() => formatRemaining(countdownMs.value))

  const prayerRows = computed(() =>
    schedule.value.slots.map((slot) => ({
      id: slot.id,
      at: slot.at,
      isCurrent: schedule.value.currentId === slot.id,
      isNext: schedule.value.nextId === slot.id,
    })),
  )

  function applyCoords({ lat, lon, source, labelKey, id }) {
    latitude.value = lat
    longitude.value = lon
    locationSource.value = source
    if (labelKey) locationLabelKey.value = labelKey
    if (id) cityId.value = id
    persistLocation({
      latitude: lat,
      longitude: lon,
      source,
      labelKey: locationLabelKey.value,
      cityId: cityId.value,
    })
  }

  function selectCity(city) {
    applyCoords({
      lat: city.latitude,
      lon: city.longitude,
      source: 'city',
      labelKey: city.nameKey,
      id: city.id,
    })
    showCityPicker.value = false
    geoStatus.value = 'denied'
  }

  function requestGeolocation() {
    if (!isClient || !navigator.geolocation) {
      geoStatus.value = 'unavailable'
      showCityPicker.value = true
      return
    }
    geoStatus.value = 'prompting'
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        applyCoords({
          lat: pos.coords.latitude,
          lon: pos.coords.longitude,
          source: 'geo',
          labelKey: 'home.prayer.nearYou',
          id: 'geo',
        })
        geoStatus.value = 'granted'
        showCityPicker.value = false
      },
      () => {
        geoStatus.value = 'denied'
        showCityPicker.value = true
      },
      { enableHighAccuracy: false, timeout: GEO_TIMEOUT_MS, maximumAge: 30 * 60 * 1000 },
    )
  }

  function bootstrapLocation() {
    const stored = loadStoredLocation()
    if (stored) {
      applyCoords({
        lat: stored.latitude,
        lon: stored.longitude,
        source: stored.source === 'geo' ? 'stored' : (stored.source || 'stored'),
        labelKey: stored.labelKey || FALLBACK_CITY.nameKey,
        id: stored.cityId || 'stored',
      })
      if (stored.source === 'geo' || stored.source === 'stored') {
        geoStatus.value = 'granted'
        // Refresh quietly; keep showing stored coords if prompt fails.
        if (isClient && navigator.geolocation) {
          navigator.geolocation.getCurrentPosition(
            (pos) => {
              applyCoords({
                lat: pos.coords.latitude,
                lon: pos.coords.longitude,
                source: 'geo',
                labelKey: 'home.prayer.nearYou',
                id: 'geo',
              })
            },
            () => { /* keep stored */ },
            { enableHighAccuracy: false, timeout: GEO_TIMEOUT_MS, maximumAge: 30 * 60 * 1000 },
          )
        }
        return
      }
      return
    }
    // Immediate fallback so the card never waits on permission.
    applyCoords({
      lat: FALLBACK_CITY.latitude,
      lon: FALLBACK_CITY.longitude,
      source: 'fallback',
      labelKey: FALLBACK_CITY.nameKey,
      id: FALLBACK_CITY.id,
    })
    requestGeolocation()
  }

  onMounted(() => {
    now.value = new Date()
    dayWatchKey = dayKey(now.value)
    bootstrapLocation()
    tickTimer = window.setInterval(() => {
      const next = new Date()
      now.value = next
      const key = dayKey(next)
      if (key !== dayWatchKey) dayWatchKey = key
    }, 1000)
  })

  onUnmounted(() => {
    if (tickTimer) window.clearInterval(tickTimer)
  })

  // Recompute when coords change (schedule is already computed).
  watch([latitude, longitude], () => {
    now.value = new Date()
  })

  return {
    now,
    schedule,
    prayerRows,
    countdownLabel,
    countdownMs,
    locationSource,
    locationLabelKey,
    cityId,
    geoStatus,
    showCityPicker,
    cityOptions: CITY_OPTIONS,
    selectCity,
    requestGeolocation,
    formatClock,
    prayerIds: PRAYER_ORDER,
  }
}
