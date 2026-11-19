/**
 * Date/time display helpers — always follow the device locale + timezone.
 * Pass `undefined` to Intl so the browser uses OS/browser defaults
 * (12h vs 24h, DMY vs MDY, local zone). Do not hardcode en-GB / en-US.
 */

function toDate(value) {
  if (value instanceof Date) return value
  if (value == null || value === '') return null
  const d = new Date(value)
  return Number.isNaN(d.getTime()) ? null : d
}

function withDefaults(defaults, options = {}) {
  const merged = { ...defaults, ...options }
  return Object.fromEntries(
    Object.entries(merged).filter(([, v]) => v !== undefined),
  )
}

/** Date only — e.g. "19 Nov 2026" or device-equivalent. */
export function formatDate(value, options = {}) {
  const d = toDate(value)
  if (!d) return '—'
  return d.toLocaleDateString(
    undefined,
    withDefaults(
      { year: 'numeric', month: 'short', day: 'numeric' },
      options,
    ),
  )
}

/** Date + time — device hour cycle. */
export function formatDateTime(value, options = {}) {
  const d = toDate(value)
  if (!d) return '—'
  return d.toLocaleString(
    undefined,
    withDefaults(
      {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: 'numeric',
        minute: '2-digit',
      },
      options,
    ),
  )
}

/** Time only — device hour cycle. */
export function formatTime(value, options = {}) {
  const d = toDate(value)
  if (!d) return '—'
  return d.toLocaleTimeString(
    undefined,
    withDefaults({ hour: 'numeric', minute: '2-digit' }, options),
  )
}

/** Compact chart / sparkline day label. */
export function formatChartDay(value) {
  const d = toDate(value)
  if (!d) return ''
  return d.toLocaleDateString(undefined, { day: 'numeric', month: 'short' })
}

/**
 * Absolute instant in the viewer's local zone + locale
 * (weekday + long date + time + short zone name).
 */
export function formatEventLocal(value) {
  const d = toDate(value)
  if (!d) return ''
  return d.toLocaleString(undefined, {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    timeZoneName: 'short',
  })
}
