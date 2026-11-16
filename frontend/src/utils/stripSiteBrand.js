const SITE = /(?:https?:\/\/)?(?:www\.)?assalafiyyah\.com/gi
const CHANZO = /\s*Chanzo:\s*(?:https?:\/\/)?(?:www\.)?assalafiyyah\.com\.?/gi
const KUTOKA = /\s+kutoka\s+Assalafiyyah\b/gi

/** Drop the old lecture-host URL from learner-facing copy. Lecturer names stay. */
export function stripSiteBrand(value) {
  if (value == null) return ''
  const text = String(value)
  if (!/assalafiyyah/i.test(text)) return text
  return text
    .replace(CHANZO, '')
    .replace(KUTOKA, '')
    .replace(SITE, '')
    .replace(/\(\s*\)/g, '')
    .replace(/\s{2,}/g, ' ')
    .replace(/\s+([.,])/g, '$1')
    .trim()
}
