<template>
  <div class="min-h-screen bg-white overflow-x-hidden">
    <div class="max-w-3xl mx-auto px-4 sm:px-6 pt-8 pb-6 sm:pt-12">
      <nav class="flex flex-wrap items-center gap-2 text-xs font-semibold text-gray-400 mb-4">
        <RouterLink to="/quran" class="text-brand hover:underline">{{ t('quran.title') }}</RouterLink>
        <span aria-hidden="true">/</span>
        <span class="text-gray-600">{{ t('quran.dua.title') }}</span>
      </nav>

      <p class="text-xs font-bold uppercase tracking-widest text-brand mb-3 flex items-center gap-2">
        <span class="w-4 h-px bg-brand inline-block"></span>
        {{ t('quran.dua.eyebrow') }}
      </p>
      <h1 class="text-3xl sm:text-4xl font-black text-gray-900 tracking-tight mb-3">
        {{ t('quran.dua.title') }}
      </h1>
      <p class="text-gray-500 text-base max-w-xl mb-6">
        {{ t('quran.dua.subtitle') }}
      </p>

      <!-- Hisn Al-Muslim (IslamHouse) — primary full collection -->
      <a
        :href="hisnHref"
        class="block rounded-2xl border border-brand/20 bg-[#0B3D2E]/[0.04] p-5 sm:p-6 mb-8
               hover:border-brand/40 transition-colors focus:outline-none focus:ring-2 focus:ring-brand/30"
      >
        <p class="text-xs font-bold uppercase tracking-widest text-brand mb-2">
          {{ t('quran.dua.hisnBadge') }}
        </p>
        <h2 class="text-xl font-black text-gray-900 mb-1">{{ t('quran.dua.hisnTitle') }}</h2>
        <p class="text-sm text-gray-500 mb-3">{{ t('quran.dua.hisnAuthor') }}</p>
        <p class="text-sm text-gray-600 leading-relaxed mb-4">{{ t('quran.dua.hisnDesc') }}</p>
        <span class="inline-flex items-center gap-2 text-sm font-semibold text-brand">
          {{ t('quran.dua.openHisn') }}
          <svg class="w-4 h-4 rtl:rotate-180" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
            <path d="M5 12h14M13 5l7 7-7 7" stroke-linecap="round" stroke-linejoin="round" />
          </svg>
        </span>
      </a>

      <h2 class="text-lg font-bold text-gray-900 mb-2">{{ t('quran.dua.fromQuran') }}</h2>
      <p class="text-xs text-gray-400 mb-4">{{ t('quran.dua.fromQuranNote') }}</p>

      <div v-if="loading" class="space-y-3">
        <div v-for="n in 4" :key="n" class="h-28 rounded-2xl bg-gray-100 animate-pulse" />
      </div>
      <div v-else-if="error" class="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm">
        {{ error }}
      </div>
      <ul v-else class="space-y-4 pb-16">
        <li
          v-for="item in resolved"
          :key="item.id"
          class="rounded-2xl border border-gray-100 bg-white p-5 shadow-[0_8px_24px_-18px_rgba(0,0,0,0.35)]"
        >
          <div class="flex flex-wrap items-start justify-between gap-2 mb-3">
            <div>
              <p class="text-[10px] font-bold uppercase tracking-wider text-brand mb-1">
                {{ t(`quran.dua.cat.${item.category}`) }}
              </p>
              <h3 class="text-base font-bold text-gray-900">
                {{ locale === 'ar' ? item.titleAr : item.titleEn }}
              </h3>
            </div>
            <RouterLink
              :to="{ name: 'quran', query: { surah: item.chapter, ayah: item.verse } }"
              class="text-xs font-semibold text-brand hover:underline shrink-0 min-h-11 inline-flex items-center"
            >
              {{ t('quran.dua.openInReader') }}
            </RouterLink>
          </div>
          <div class="space-y-3" dir="rtl" lang="ar">
            <p
              v-for="(line, i) in item.lines"
              :key="i"
              class="font-arabic text-xl sm:text-2xl leading-[1.9] text-gray-900 text-start"
            >
              {{ line.arabic }}
              <span class="text-brand/70 text-sm font-sans ms-2" dir="ltr">{{ item.chapter }}:{{ line.verse }}</span>
            </p>
          </div>
          <p
            v-if="item.lines[0]?.translation"
            class="mt-4 text-sm text-gray-600 leading-relaxed"
            dir="ltr"
            lang="en"
          >
            {{ item.lines.map(l => l.translation).join(' ') }}
          </p>
        </li>
      </ul>
    </div>
  </div>
</template>

<script setup>
import { computed, onMounted, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { useHead } from '@unhead/vue'
import { RouterLink } from 'vue-router'
import { quranApi, QURAN_EDITIONS } from '@/api/quran'
import duaCatalog from '@/data/quran-duas.json'

const SEO_ORIGIN = import.meta.env.VITE_SITE_ORIGIN || 'https://atharulilm.or.tz'
const { t, locale } = useI18n({ useScope: 'global' })

useHead({
  title: () => t('quran.dua.title'),
  meta: [
    { name: 'description', content: () => t('quran.dua.subtitle') },
    { property: 'og:url', content: `${SEO_ORIGIN}/quran/dua` },
  ],
})

const loading = ref(true)
const error = ref('')
const resolved = ref([])

const hisnHref = computed(() => {
  const slug = duaCatalog._meta?.hisn?.slug || 'hisn-al-muslim'
  return `/library/${slug}`
})

function chapterToMap(payload) {
  const map = {}
  for (const row of payload?.chapter || []) {
    map[row.verse] = row.text
  }
  return map
}

onMounted(async () => {
  loading.value = true
  error.value = ''
  try {
    const chapters = [...new Set(duaCatalog.items.map(i => i.chapter))]
    const packs = await Promise.all(
      chapters.map(async (ch) => {
        const [ar, en] = await Promise.all([
          quranApi.getChapter(QURAN_EDITIONS.ar.id, ch),
          quranApi.getChapter(QURAN_EDITIONS.en.id, ch),
        ])
        return { ch, ar: chapterToMap(ar), en: chapterToMap(en) }
      }),
    )
    const byCh = Object.fromEntries(packs.map(p => [p.ch, p]))
    resolved.value = duaCatalog.items.map((item) => {
      const pack = byCh[item.chapter]
      const end = item.verseEnd || item.verse
      const lines = []
      for (let v = item.verse; v <= end; v += 1) {
        lines.push({
          verse: v,
          arabic: pack?.ar[v] || '',
          translation: pack?.en[v] || '',
        })
      }
      return { ...item, lines }
    })
  } catch {
    error.value = t('quran.loadError')
  } finally {
    loading.value = false
  }
})
</script>
