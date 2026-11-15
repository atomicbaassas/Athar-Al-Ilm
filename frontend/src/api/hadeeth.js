/**
 * HadeethEnc client via Athar gateway (/athar/v1/hadeeth). C-SRC: no AI text.
 */
const GATEWAY = '/athar/v1/hadeeth'

async function gatewayGet(path) {
  const res = await fetch(`${GATEWAY}${path.startsWith('/') ? path : `/${path}`}`)
  if (!res.ok) throw new Error(`Hadeeth gateway ${res.status}`)
  const body = await res.json()
  return body.data
}

export const hadeethApi = {
  languages: () => gatewayGet('/languages'),
  categories: (language = 'en') =>
    gatewayGet(`/categories/list/?language=${encodeURIComponent(language)}`),
  list: ({ language = 'en', categoryId, page = 1, perPage = 20 } = {}) =>
    gatewayGet(
      `/hadeeths/list/?language=${encodeURIComponent(language)}`
      + `&category_id=${encodeURIComponent(categoryId)}`
      + `&page=${Number(page)}&per_page=${Number(perPage)}`,
    ),
  one: (id, language = 'en') =>
    gatewayGet(`/hadeeths/one/?language=${encodeURIComponent(language)}&id=${encodeURIComponent(id)}`),
}
