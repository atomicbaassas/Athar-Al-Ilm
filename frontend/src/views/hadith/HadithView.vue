<template>
  <div class="min-h-screen bg-[#f7faf8] pb-16">
    <div class="max-w-6xl mx-auto px-4 sm:px-6 pt-6 sm:pt-10 pb-6">
      <h1 class="text-2xl sm:text-3xl font-black text-gray-900 tracking-tight">
        {{ t('hadith.title') }}
      </h1>
      <p class="mt-1 text-sm sm:text-base text-gray-500 max-w-xl text-pretty">
        {{ t('hadith.subtitle') }}
      </p>

      <div class="mt-5 flex flex-col sm:flex-row gap-2 sm:gap-3 sm:items-end max-w-sm">
        <label class="flex flex-col gap-1 flex-1 min-w-0">
          <span class="text-sm font-medium text-gray-600">{{ t('hadith.language') }}</span>
          <select v-model="language" class="athar-control cursor-pointer" @change="onLanguageChange">
            <option v-for="lang in languages" :key="lang.code || lang" :value="lang.code || lang">
              {{ lang.native || lang.language || lang.code || lang }}
            </option>
          </select>
        </label>
      </div>
    </div>

    <div class="max-w-6xl mx-auto px-4 sm:px-6 grid grid-cols-1 lg:grid-cols-12 gap-6">
      <aside class="lg:col-span-4 xl:col-span-3">
        <div class="border border-gray-100 rounded-2xl overflow-hidden bg-white">
          <div class="px-4 py-3 border-b border-gray-100">
            <p class="text-sm font-semibold text-gray-800">{{ t('hadith.categories') }}</p>
          </div>
          <div v-if="catLoading" class="p-4 space-y-2">
            <div v-for="n in 6" :key="n" class="h-10 rounded-lg bg-gray-100 animate-pulse" />
          </div>
          <div v-else-if="catError" class="p-4 text-sm text-red-600">{{ catError }}</div>
          <ul v-else class="max-h-[60vh] overflow-y-auto divide-y divide-gray-50">
            <li v-for="cat in topCategories" :key="cat.id">
              <button
                type="button"
                class="w-full text-start px-4 py-3 min-h-12 text-sm font-medium touch-manipulation"
                :class="categoryId === cat.id ? 'bg-brand-muted text-brand' : 'text-gray-700 hover:bg-gray-50'"
                @click="selectCategory(cat.id)"
              >
                <span class="block truncate">{{ cat.title }}</span>
                <span class="block text-xs text-gray-400 tabular-nums">{{ cat.hadeeths_count }}</span>
              </button>
            </li>
          </ul>
        </div>
      </aside>

      <section class="lg:col-span-8 xl:col-span-9 min-w-0">
        <div v-if="!categoryId" class="text-center py-20 text-gray-400">
          {{ t('hadith.pickCategory') }}
        </div>
        <div v-else-if="selected" class="space-y-4">
          <button type="button" class="athar-btn-secondary" @click="selected = null">
            {{ t('hadith.back') }}
          </button>
          <article class="rounded-2xl border border-gray-100 bg-white p-5 sm:p-7">
            <p class="text-xs font-semibold text-brand mb-2">{{ selected.grade }}</p>
            <h2 class="text-xl font-black text-gray-900 mb-3">{{ selected.title }}</h2>
            <p class="text-base text-gray-800 leading-relaxed whitespace-pre-wrap">{{ selected.hadeeth }}</p>
            <p v-if="selected.attribution" class="mt-4 text-sm text-gray-500">{{ selected.attribution }}</p>
            <div v-if="selected.explanation" class="mt-5 pt-4 border-t border-gray-100">
              <p class="text-sm font-semibold text-gray-700 mb-2">{{ t('hadith.explanation') }}</p>
              <p class="text-sm text-gray-600 leading-relaxed whitespace-pre-wrap">{{ selected.explanation }}</p>
            </div>
            <p class="mt-4 text-xs text-gray-400">{{ t('hadith.sourceNote') }}</p>
          </article>
        </div>
        <div v-else>
          <div v-if="listLoading" class="space-y-3">
            <div v-for="n in 5" :key="n" class="h-16 rounded-xl bg-gray-100 animate-pulse" />
          </div>
          <div v-else-if="listError" class="text-sm text-red-600">{{ listError }}</div>
          <ul v-else class="space-y-2">
            <li v-for="item in items" :key="item.id">
              <button
                type="button"
                class="w-full text-start rounded-xl border border-gray-100 bg-white px-4 py-3.5
                       hover:border-brand/30 transition-colors touch-manipulation"
                @click="openOne(item.id)"
              >
                <span class="block text-sm font-semibold text-gray-900">{{ item.title }}</span>
              </button>
            </li>
            <li v-if="!items.length" class="text-sm text-gray-400 py-8 text-center">
              {{ t('hadith.empty') }}
            </li>
          </ul>
          <div v-if="hasMore" class="mt-4 flex justify-center">
            <button type="button" class="athar-btn-secondary" :disabled="listLoading" @click="loadMore">
              {{ t('hadith.more') }}
            </button>
          </div>
        </div>
      </section>
    </div>
  </div>
</template>

<script setup>
import { computed, onMounted, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { useHead } from '@unhead/vue'
import { hadeethApi } from '@/api/hadeeth'

const SEO_ORIGIN = import.meta.env.VITE_SITE_ORIGIN || 'https://atharulilm.or.tz'
const { t, locale } = useI18n({ useScope: 'global' })

useHead({
  title: () => t('hadith.title'),
  meta: [
    { name: 'description', content: () => t('hadith.subtitle') },
    { property: 'og:url', content: `${SEO_ORIGIN}/hadith` },
  ],
})

const language = ref(locale.value === 'ar' ? 'ar' : locale.value === 'sw' ? 'sw' : 'en')
const languages = ref([{ code: 'en', native: 'English' }, { code: 'ar', native: 'العربية' }, { code: 'sw', native: 'Kiswahili' }])
const categories = ref([])
const categoryId = ref(null)
const items = ref([])
const page = ref(1)
const hasMore = ref(false)
const selected = ref(null)
const catLoading = ref(true)
const catError = ref('')
const listLoading = ref(false)
const listError = ref('')

const topCategories = computed(() =>
  (categories.value || []).filter(c => !c.parent_id).slice(0, 40),
)

async function loadLanguages() {
  try {
    const data = await hadeethApi.languages()
    const list = Array.isArray(data) ? data : (data?.data || [])
    if (list.length) languages.value = list
  } catch {
    /* keep defaults */
  }
}

async function loadCategories() {
  catLoading.value = true
  catError.value = ''
  try {
    const data = await hadeethApi.categories(language.value)
    categories.value = Array.isArray(data) ? data : (data?.data || [])
  } catch {
    catError.value = t('hadith.loadError')
    categories.value = []
  } finally {
    catLoading.value = false
  }
}

async function loadList({ append = false } = {}) {
  if (!categoryId.value) return
  listLoading.value = true
  listError.value = ''
  try {
    const data = await hadeethApi.list({
      language: language.value,
      categoryId: categoryId.value,
      page: page.value,
      perPage: 20,
    })
    const rows = data?.data || data?.hadeeths || (Array.isArray(data) ? data : [])
    items.value = append ? [...items.value, ...rows] : rows
    const meta = data?.meta || data?.pagination
    hasMore.value = Boolean(meta?.next_page || (rows.length >= 20))
  } catch {
    listError.value = t('hadith.loadError')
    if (!append) items.value = []
  } finally {
    listLoading.value = false
  }
}

function selectCategory(id) {
  categoryId.value = id
  selected.value = null
  page.value = 1
  loadList()
}

async function openOne(id) {
  listLoading.value = true
  try {
    selected.value = await hadeethApi.one(id, language.value)
  } catch {
    listError.value = t('hadith.loadError')
  } finally {
    listLoading.value = false
  }
}

function loadMore() {
  page.value += 1
  loadList({ append: true })
}

function onLanguageChange() {
  selected.value = null
  categoryId.value = null
  items.value = []
  loadCategories()
}

onMounted(async () => {
  await loadLanguages()
  await loadCategories()
})
</script>
