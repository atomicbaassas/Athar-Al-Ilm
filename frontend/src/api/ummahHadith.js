/**
 * UmmahAPI kutub shelf via Athar gateway (/athar/v1/ummah/hadith).
 * C-SRC: not Dorar hukm; HadeethEnc stays the curated encyclopedia.
 */
const GATEWAY = '/athar/v1/ummah/hadith'

/** Match gateway allowlist — classical kutub + Nawawi/Qudsi 40. */
export const UMMAH_STRONG_COLLECTIONS = [
  'bukhari',
  'muslim',
  'abudawud',
  'tirmidhi',
  'ibnmajah',
  'nasai',
  'malik',
  'nawawi',
  'qudsi',
]

async function gatewayGet(path) {
  const res = await fetch(`${GATEWAY}${path.startsWith('/') ? path : `/${path}`}`)
  if (!res.ok) throw new Error(`Ummah hadith gateway ${res.status}`)
  const body = await res.json()
  const payload = body.data
  // UmmahAPI envelope: { success, data: ... } inside our gateway envelope.
  if (payload && typeof payload === 'object' && 'data' in payload && 'success' in payload) {
    return payload.data
  }
  return payload
}

export const ummahHadithApi = {
  collections: () => gatewayGet('/collections'),
  list: ({ collection, page = 1, limit = 20 } = {}) =>
    gatewayGet(
      `/${encodeURIComponent(collection)}?page=${Number(page)}&limit=${Number(limit)}`,
    ),
  one: (collection, number) =>
    gatewayGet(`/${encodeURIComponent(collection)}/${encodeURIComponent(number)}`),
}
