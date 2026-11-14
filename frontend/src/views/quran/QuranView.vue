<template>
  <div class="min-h-screen bg-white">
    <div class="max-w-6xl mx-auto px-4 sm:px-6 pt-8 pb-6 sm:pt-12 sm:pb-8">
      <p class="text-xs font-bold uppercase tracking-widest text-brand mb-4 flex items-center gap-2">
        <span class="w-4 h-px bg-brand inline-block"></span>
        {{ t('quran.eyebrow') }}
      </p>
      <div class="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
        <div>
          <h1 class="text-3xl sm:text-4xl font-black text-gray-900 tracking-tight mb-3">
            {{ t('quran.title') }}
          </h1>
          <p class="text-gray-500 text-base sm:text-lg max-w-xl">
            {{ t('quran.subtitle') }}
          </p>
        </div>

        <div class="flex flex-wrap items-center gap-2">
          <label class="text-xs font-semibold text-gray-500" for="quran-translation">
            {{ t('quran.translation') }}
          </label>
          <select
            id="quran-translation"
            v-model="translationLang"
            class="bg-white border border-gray-200 text-gray-700 text-sm rounded-xl px-3 py-2
                   focus:outline-none focus:border-brand/50 focus:ring-2 focus:ring-brand/10
                   transition-all duration-200 cursor-pointer"
          >
            <option value="en">{{ locale === 'ar' ? QURAN_EDITIONS.en.labelAr : QURAN_EDITIONS.en.label }}</option>
            <option value="sw">{{ locale === 'ar' ? QURAN_EDITIONS.sw.labelAr : QURAN_EDITIONS.sw.label }}</option>
          </select>
        </div>
      </div>
    </div>

    <div class="max-w-6xl mx-auto px-4 sm:px-6 pb-20 grid grid-cols-1 lg:grid-cols-12 gap-8">
      <!-- Surah list -->
      <aside class="lg:col-span-4 xl:col-span-3">
        <div class="sticky top-28 border border-gray-100 rounded-2xl overflow-hidden bg-gray-50/60">
          <div class="px-4 py-3 border-b border-gray-100 bg-white">
            <p class="text-sm font-semibold text-gray-800">{{ t('quran.surahs') }}</p>
          </div>
          <div v-if="infoLoading" class="p-4 space-y-2">
            <div v-for="n in 8" :key="n" class="h-10 rounded-lg bg-gray-200 animate-pulse" />
          </div>
          <div v-else-if="infoError" class="p-4 text-sm text-red-600">{{ infoError }}</div>
          <ul v-else class="max-h-[70vh] overflow-y-auto divide-y divide-gray-100">
            <li v-for="s in surahs" :key="s.chapter">
              <button
                type="button"
                class="w-full text-start px-4 py-3 flex items-center gap-3 hover:bg-white transition-colors"
                :class="selectedChapter === s.chapter ? 'bg-brand-muted text-brand' : 'text-gray-700'"
                @click="selectChapter(s.chapter)"
              >
                <span
                  class="w-8 h-8 rounded-lg text-xs font-bold flex items-center justify-center shrink-0"
                  :class="selectedChapter === s.chapter ? 'bg-brand text-white' : 'bg-white border border-gray-200 text-gray-500'"
                >
                  {{ s.chapter }}
                </span>
                <span class="min-w-0 flex-1">
                  <span class="block text-sm font-semibold truncate">{{ s.englishname || s.name }}</span>
                  <span class="block text-xs text-gray-400 truncate font-arabic" dir="rtl">{{ s.arabicname }}</span>
                </span>
                <span class="text-[10px] text-gray-400 shrink-0">{{ verseCount(s) }}</span>
              </button>
            </li>
          </ul>
        </div>
      </aside>

      <!-- Ayah view -->
      <section class="lg:col-span-8 xl:col-span-9">
        <div v-if="!selectedChapter" class="text-center py-24 text-gray-400">
          {{ t('quran.pickSurah') }}
        </div>
        <div v-else-if="ayahLoading" class="space-y-4">
          <div v-for="n in 6" :key="n" class="h-24 rounded-2xl bg-gray-100 animate-pulse" />
        </div>
        <div v-else-if="ayahError" class="bg-red-50 border border-red-200 text-red-700 px-6 py-4 rounded-xl text-sm">
          {{ ayahError }}
        </div>
        <div v-else>
          <header class="mb-6 flex flex-wrap items-baseline justify-between gap-3">
            <div>
              <h2 class="text-2xl font-black text-gray-900">
                {{ activeSurah?.englishname || activeSurah?.name }}
              </h2>
              <p class="text-lg text-gray-500 font-arabic" dir="rtl">{{ activeSurah?.arabicname }}</p>
            </div>
            <p class="text-xs font-semibold uppercase tracking-wider text-gray-400">
              {{ activeSurah?.revelation }} · {{ ayahs.length }} {{ t('quran.ayahs') }}
            </p>
          </header>

          <div class="space-y-5">
            <article
              v-for="ayah in ayahs"
              :key="ayah.verse"
              class="rounded-2xl border border-gray-100 bg-white p-5 sm:p-6 shadow-[0_8px_24px_-18px_rgba(0,0,0,0.35)]"
            >
              <div class="flex items-start justify-between gap-3 mb-4">
                <span class="inline-flex items-center justify-center min-w-8 h-8 px-2 rounded-full bg-brand-muted text-brand text-xs font-bold">
                  {{ selectedChapter }}:{{ ayah.verse }}
                </span>
              </div>
              <p class="font-arabic text-2xl sm:text-3xl leading-[2] text-gray-900 text-end mb-4" dir="rtl" lang="ar">
                {{ ayah.arabic }}
              </p>
              <p class="text-sm sm:text-base text-gray-600 leading-relaxed" :dir="translationLang === 'ar' ? 'rtl' : 'ltr'">
                {{ ayah.translation }}
              </p>
            </article>
          </div>
        </div>
      </section>
    </div>
  </div>
</template>

<script setup>
import { computed, onMounted, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { useHead } from '@unhead/vue'
import { quranApi, QURAN_EDITIONS } from '@/api/quran'

const SEO_ORIGIN = import.meta.env.VITE_SITE_ORIGIN || 'https://atharulilm.or.tz'
const { t, locale } = useI18n({ useScope: 'global' })

useHead({
  title: () => t('quran.title'),
  meta: [
    { name: 'description', content: () => t('quran.subtitle') },
    { property: 'og:url', content: `${SEO_ORIGIN}/quran` },
  ],
})

const surahs = ref([])
const infoLoading = ref(true)
const infoError = ref('')
const selectedChapter = ref(null)
const translationLang = ref('en')
const arabicMap = ref({})
const translationMap = ref({})
const ayahLoading = ref(false)
const ayahError = ref('')

const activeSurah = computed(() => surahs.value.find(s => s.chapter === selectedChapter.value) || null)

const ayahs = computed(() => {
  const verses = Object.keys(arabicMap.value)
    .map(Number)
    .sort((a, b) => a - b)
  return verses.map(verse => ({
    verse,
    arabic: arabicMap.value[verse] || '',
    translation: translationMap.value[verse] || '',
  }))
})

function verseCount(s) {
  if (Array.isArray(s.verses)) return s.verses.length
  return s.verses || ''
}

function chapterToMap(payload) {
  const list = payload?.chapter || []
  const map = {}
  for (const row of list) {
    map[row.verse] = row.text
  }
  return map
}

async function loadInfo() {
  infoLoading.value = true
  infoError.value = ''
  try {
    const data = await quranApi.getInfo()
    surahs.value = data.chapters || []
    if (!selectedChapter.value && surahs.value.length) {
      selectedChapter.value = surahs.value[0].chapter
    }
  } catch {
    infoError.value = t('quran.loadError')
  } finally {
    infoLoading.value = false
  }
}

async function loadAyahs() {
  if (!selectedChapter.value) return
  ayahLoading.value = true
  ayahError.value = ''
  try {
    const edition = QURAN_EDITIONS[translationLang.value] || QURAN_EDITIONS.en
    const [ar, tr] = await Promise.all([
      quranApi.getChapter(QURAN_EDITIONS.ar.id, selectedChapter.value),
      quranApi.getChapter(edition.id, selectedChapter.value),
    ])
    arabicMap.value = chapterToMap(ar)
    translationMap.value = chapterToMap(tr)
  } catch {
    ayahError.value = t('quran.loadError')
    arabicMap.value = {}
    translationMap.value = {}
  } finally {
    ayahLoading.value = false
  }
}

function selectChapter(n) {
  selectedChapter.value = n
}

watch([selectedChapter, translationLang], () => {
  loadAyahs()
})

onMounted(loadInfo)
</script>
