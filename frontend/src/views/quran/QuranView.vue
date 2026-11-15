<template>
  <div class="quran-page min-h-screen bg-white overflow-x-hidden pb-[calc(5.5rem+env(safe-area-inset-bottom))] sm:pb-20">
    <div class="max-w-6xl mx-auto px-4 sm:px-6 pt-8 pb-4 sm:pt-12 sm:pb-6">
      <p class="text-xs font-bold uppercase tracking-widest text-brand mb-4 flex items-center gap-2">
        <span class="w-4 h-px bg-brand inline-block"></span>
        {{ t('quran.eyebrow') }}
      </p>

      <div class="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div class="min-w-0">
          <h1 class="text-3xl sm:text-4xl font-black text-gray-900 tracking-tight mb-2">
            {{ t('quran.title') }}
          </h1>
          <p class="text-gray-500 text-base sm:text-lg max-w-xl">
            {{ t('quran.subtitle') }}
          </p>
        </div>

        <div class="flex flex-wrap items-center gap-2 shrink-0">
          <RouterLink
            to="/quran/dua"
            class="inline-flex items-center min-h-11 px-3.5 rounded-xl border border-brand/25 bg-[#0B3D2E]/[0.04]
                   text-sm font-semibold text-brand hover:border-brand/45 transition-colors"
          >
            {{ t('quran.dua.nav') }}
          </RouterLink>
        </div>
      </div>

      <!-- Controls row -->
      <div class="mt-6 flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-end">
        <label class="flex flex-col gap-1 min-w-0 flex-1 sm:max-w-xs">
          <span class="text-xs font-semibold text-gray-500">{{ t('quran.searchSurah') }}</span>
          <input
            v-model="surahQuery"
            type="search"
            autocomplete="off"
            :placeholder="t('quran.searchPlaceholder')"
            class="w-full min-h-11 bg-white border border-gray-200 text-gray-800 text-base rounded-xl px-3
                   focus:outline-none focus:border-brand/50 focus:ring-2 focus:ring-brand/10"
          />
        </label>

        <label class="flex flex-col gap-1 min-w-0 sm:w-52">
          <span class="text-xs font-semibold text-gray-500" for="quran-reciter">{{ t('quran.reciterLabel') }}</span>
          <select
            id="quran-reciter"
            v-model="reciterId"
            class="min-h-11 bg-white border border-gray-200 text-gray-700 text-base rounded-xl px-3
                   focus:outline-none focus:border-brand/50 focus:ring-2 focus:ring-brand/10 cursor-pointer"
          >
            <option v-for="r in QURAN_RECITERS" :key="r.id" :value="r.id">
              {{ locale === 'ar' ? r.labelAr : r.label }}
            </option>
          </select>
        </label>

        <label class="flex flex-col gap-1 min-w-0 sm:w-48">
          <span class="text-xs font-semibold text-gray-500" for="quran-translation">{{ t('quran.translation') }}</span>
          <select
            id="quran-translation"
            v-model="translationLang"
            class="min-h-11 bg-white border border-gray-200 text-gray-700 text-base rounded-xl px-3
                   focus:outline-none focus:border-brand/50 focus:ring-2 focus:ring-brand/10 cursor-pointer"
          >
            <option value="en">{{ locale === 'ar' ? QURAN_EDITIONS.en.labelAr : QURAN_EDITIONS.en.label }}</option>
            <option value="sw">{{ locale === 'ar' ? QURAN_EDITIONS.sw.labelAr : QURAN_EDITIONS.sw.label }}</option>
            <option value="none">{{ t('quran.arabicOnly') }}</option>
          </select>
        </label>
      </div>
    </div>

    <div class="max-w-6xl mx-auto px-4 sm:px-6 pb-8 grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8">
      <!-- Surah list: drawer on mobile, sidebar on lg -->
      <aside class="lg:col-span-4 xl:col-span-3">
        <button
          type="button"
          class="lg:hidden w-full min-h-12 mb-3 inline-flex items-center justify-between gap-3 rounded-xl
                 border border-gray-200 bg-gray-50 px-4 text-sm font-semibold text-gray-800"
          :aria-expanded="surahDrawerOpen"
          @click="surahDrawerOpen = !surahDrawerOpen"
        >
          <span class="truncate">
            {{ activeSurah
              ? `${selectedChapter}. ${activeSurah.englishname || activeSurah.name}`
              : t('quran.surahs') }}
          </span>
          <svg class="w-4 h-4 shrink-0 transition-transform" :class="surahDrawerOpen ? 'rotate-180' : ''" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
            <path d="M6 9l6 6 6-6" stroke-linecap="round" stroke-linejoin="round" />
          </svg>
        </button>

        <div
          class="border border-gray-100 rounded-2xl overflow-hidden bg-gray-50/60
                 lg:sticky lg:top-28"
          :class="surahDrawerOpen ? 'block' : 'hidden lg:block'"
        >
          <div class="px-4 py-3 border-b border-gray-100 bg-white">
            <p class="text-sm font-semibold text-gray-800">{{ t('quran.surahs') }}</p>
          </div>
          <div v-if="infoLoading" class="p-4 space-y-2">
            <div v-for="n in 8" :key="n" class="h-10 rounded-lg bg-gray-200 animate-pulse" />
          </div>
          <div v-else-if="infoError" class="p-4 text-sm text-red-600">{{ infoError }}</div>
          <ul v-else class="max-h-[55vh] lg:max-h-[70vh] overflow-y-auto overscroll-contain divide-y divide-gray-100">
            <li v-for="s in filteredSurahs" :key="s.chapter">
              <button
                type="button"
                class="w-full text-start px-4 py-3 min-h-12 flex items-center gap-3 hover:bg-white transition-colors touch-manipulation"
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
                <span class="text-[10px] text-gray-400 shrink-0 tabular-nums">{{ verseCount(s) }}</span>
              </button>
            </li>
            <li v-if="!filteredSurahs.length" class="p-4 text-sm text-gray-400">
              {{ t('quran.noSurahMatch') }}
            </li>
          </ul>
        </div>
      </aside>

      <!-- Ayah view -->
      <section class="lg:col-span-8 xl:col-span-9 min-w-0">
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
          <header class="mb-5 flex flex-wrap items-center justify-between gap-3">
            <div class="min-w-0">
              <h2 class="text-2xl font-black text-gray-900 truncate">
                {{ activeSurah?.englishname || activeSurah?.name }}
              </h2>
              <p class="text-lg text-gray-500 font-arabic" dir="rtl">{{ activeSurah?.arabicname }}</p>
              <p class="text-xs text-gray-400 mt-1">
                {{ activeSurah?.revelation }} · {{ ayahs.length }} {{ t('quran.ayahs') }}
              </p>
            </div>
            <div class="flex flex-wrap items-center gap-2">
              <button
                type="button"
                class="inline-flex items-center justify-center min-h-11 min-w-11 rounded-xl border border-gray-200
                       text-gray-700 hover:border-brand/40 hover:text-brand transition-colors touch-manipulation
                       disabled:opacity-40"
                :aria-label="t('quran.prevSurah')"
                :disabled="selectedChapter <= 1"
                @click="goSurah(-1)"
              >
                <svg class="w-4 h-4 rtl:rotate-180" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
                  <path d="M15 18l-6-6 6-6" stroke-linecap="round" stroke-linejoin="round" />
                </svg>
              </button>
              <button
                type="button"
                class="inline-flex items-center gap-2 min-h-11 rounded-xl border border-gray-200 bg-white px-3.5
                       text-sm font-semibold text-gray-800 hover:border-brand/40 hover:text-brand transition-colors
                       touch-manipulation"
                :aria-pressed="surahPlaying"
                @click="toggleSurah"
              >
                <svg class="w-4 h-4 shrink-0" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                  <path v-if="surahPlaying" d="M6 5h4v14H6V5zm8 0h4v14h-4V5z" />
                  <path v-else d="M8 5v14l11-7L8 5z" />
                </svg>
                {{ surahPlaying ? t('quran.pause') : t('quran.playSurah') }}
              </button>
              <button
                type="button"
                class="inline-flex items-center justify-center min-h-11 min-w-11 rounded-xl border border-gray-200
                       text-gray-700 hover:border-brand/40 hover:text-brand transition-colors touch-manipulation
                       disabled:opacity-40"
                :aria-label="t('quran.nextSurah')"
                :disabled="selectedChapter >= 114"
                @click="goSurah(1)"
              >
                <svg class="w-4 h-4 rtl:rotate-180" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
                  <path d="M9 18l6-6-6-6" stroke-linecap="round" stroke-linejoin="round" />
                </svg>
              </button>
            </div>
          </header>

          <p v-if="audioError" class="mb-4 text-sm text-red-600">{{ audioError }}</p>

          <div class="space-y-4 sm:space-y-5">
            <article
              v-for="ayah in ayahs"
              :id="`ayah-${ayah.verse}`"
              :key="ayah.verse"
              class="rounded-2xl border p-4 sm:p-6 transition-colors duration-200 scroll-mt-28"
              :class="playingVerse === ayah.verse
                ? 'border-brand/50 bg-[#0B3D2E]/[0.06] ring-2 ring-brand/15 shadow-[0_0_0_1px_rgba(11,61,46,0.08)]'
                : 'border-gray-100 bg-white shadow-[0_8px_24px_-18px_rgba(0,0,0,0.35)]'"
            >
              <div class="flex items-start justify-between gap-3 mb-3">
                <span class="inline-flex items-center justify-center min-w-8 h-8 px-2 rounded-full bg-brand-muted text-brand text-xs font-bold tabular-nums">
                  {{ selectedChapter }}:{{ ayah.verse }}
                </span>
                <div class="flex items-center gap-1">
                  <button
                    type="button"
                    class="inline-flex items-center justify-center w-11 h-11 rounded-full border border-gray-200
                           text-gray-500 hover:border-brand/40 hover:text-brand transition-colors touch-manipulation
                           disabled:opacity-30"
                    :aria-label="t('quran.prevAyah')"
                    :disabled="ayah.verse <= 1"
                    @click="playVerse(ayah.verse - 1, { queue: queueMode })"
                  >
                    <svg class="w-3.5 h-3.5 rtl:rotate-180" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
                      <path d="M15 18l-6-6 6-6" stroke-linecap="round" stroke-linejoin="round" />
                    </svg>
                  </button>
                  <button
                    type="button"
                    class="inline-flex items-center justify-center w-12 h-12 rounded-full border transition-colors touch-manipulation"
                    :class="playingVerse === ayah.verse && isPlaying
                      ? 'border-brand bg-brand text-white'
                      : 'border-gray-200 text-gray-600 hover:border-brand/40 hover:text-brand'"
                    :aria-label="playingVerse === ayah.verse && isPlaying ? t('quran.pauseAyah') : t('quran.playAyah')"
                    @click="toggleAyah(ayah.verse)"
                  >
                    <svg class="w-5 h-5" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                      <path v-if="playingVerse === ayah.verse && isPlaying" d="M6 5h4v14H6V5zm8 0h4v14h-4V5z" />
                      <path v-else d="M8 5v14l11-7L8 5z" />
                    </svg>
                  </button>
                  <button
                    type="button"
                    class="inline-flex items-center justify-center w-11 h-11 rounded-full border border-gray-200
                           text-gray-500 hover:border-brand/40 hover:text-brand transition-colors touch-manipulation
                           disabled:opacity-30"
                    :aria-label="t('quran.nextAyah')"
                    :disabled="ayah.verse >= ayahs.length"
                    @click="playVerse(ayah.verse + 1, { queue: queueMode })"
                  >
                    <svg class="w-3.5 h-3.5 rtl:rotate-180" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
                      <path d="M9 18l6-6-6-6" stroke-linecap="round" stroke-linejoin="round" />
                    </svg>
                  </button>
                </div>
              </div>
              <p
                class="font-arabic text-[1.65rem] sm:text-3xl leading-[2.05] text-gray-900 text-end mb-3 break-words"
                dir="rtl"
                lang="ar"
              >
                {{ ayah.arabic }}
              </p>
              <p
                v-if="translationLang !== 'none' && ayah.translation"
                class="text-sm sm:text-base text-gray-600 leading-relaxed break-words"
                dir="ltr"
                :lang="translationLang"
              >
                {{ ayah.translation }}
              </p>
            </article>
          </div>
        </div>
      </section>
    </div>

    <!-- Sticky player bar (mobile-first) -->
    <div
      class="fixed inset-x-0 bottom-0 z-40 border-t border-brand/15 bg-white/95 backdrop-blur-md
             px-3 pt-2.5 pb-[max(0.65rem,env(safe-area-inset-bottom))] shadow-[0_-8px_28px_-16px_rgba(11,61,46,0.35)]"
      role="region"
      :aria-label="t('quran.listen')"
    >
      <div class="max-w-6xl mx-auto flex items-center gap-2 sm:gap-3 min-w-0">
        <button
          type="button"
          class="inline-flex items-center justify-center w-11 h-11 rounded-full border border-gray-200
                 text-gray-600 touch-manipulation disabled:opacity-35 shrink-0"
          :aria-label="t('quran.prevAyah')"
          :disabled="!playingVerse || playingVerse <= 1"
          @click="stepAyah(-1)"
        >
          <svg class="w-4 h-4 rtl:rotate-180" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
            <path d="M15 18l-6-6 6-6" stroke-linecap="round" stroke-linejoin="round" />
          </svg>
        </button>

        <button
          type="button"
          class="inline-flex items-center justify-center w-14 h-14 rounded-full bg-brand text-white
                 shadow-lg shadow-brand/25 touch-manipulation shrink-0 disabled:opacity-40"
          :aria-label="isPlaying ? t('quran.pause') : t('quran.playSurah')"
          :disabled="!selectedChapter || !ayahs.length"
          @click="toggleStickyPlay"
        >
          <svg class="w-6 h-6" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
            <path v-if="isPlaying" d="M6 5h4v14H6V5zm8 0h4v14h-4V5z" />
            <path v-else d="M8 5v14l11-7L8 5z" />
          </svg>
        </button>

        <button
          type="button"
          class="inline-flex items-center justify-center w-11 h-11 rounded-full border border-gray-200
                 text-gray-600 touch-manipulation disabled:opacity-35 shrink-0"
          :aria-label="t('quran.nextAyah')"
          :disabled="!playingVerse || playingVerse >= ayahs.length"
          @click="stepAyah(1)"
        >
          <svg class="w-4 h-4 rtl:rotate-180" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
            <path d="M9 18l6-6-6-6" stroke-linecap="round" stroke-linejoin="round" />
          </svg>
        </button>

        <div class="min-w-0 flex-1">
          <p class="text-sm font-semibold text-gray-900 truncate">
            {{ stickyTitle }}
          </p>
          <p class="text-xs text-gray-500 truncate">
            {{ stickySubtitle }}
          </p>
        </div>
      </div>
    </div>

    <audio
      ref="audioEl"
      preload="none"
      class="hidden"
      @play="isPlaying = true"
      @pause="isPlaying = false"
      @ended="onAudioEnded"
      @error="onAudioError"
    />
  </div>
</template>

<script setup>
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { useHead } from '@unhead/vue'
import { useRoute, useRouter, RouterLink } from 'vue-router'
import {
  ayahAudioUrl,
  getReciterById,
  loadSavedPosition,
  loadSavedReciterId,
  loadSavedTranslation,
  quranApi,
  QURAN_EDITIONS,
  QURAN_RECITERS,
  savePosition,
  saveReciterId,
  saveTranslation,
} from '@/api/quran'

const SEO_ORIGIN = import.meta.env.VITE_SITE_ORIGIN || 'https://atharulilm.or.tz'
const { t, locale } = useI18n({ useScope: 'global' })
const route = useRoute()
const router = useRouter()

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
const translationLang = ref(loadSavedTranslation())
const reciterId = ref(loadSavedReciterId())
const arabicMap = ref({})
const translationMap = ref({})
const ayahLoading = ref(false)
const ayahError = ref('')
const surahQuery = ref('')
const surahDrawerOpen = ref(false)

const audioEl = ref(null)
const playingVerse = ref(null)
const isPlaying = ref(false)
const queueMode = ref(false)
const audioError = ref('')
const pendingScrollVerse = ref(null)

const activeSurah = computed(() => surahs.value.find(s => s.chapter === selectedChapter.value) || null)
const activeReciter = computed(() => getReciterById(reciterId.value))

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

const filteredSurahs = computed(() => {
  const q = surahQuery.value.trim().toLowerCase()
  if (!q) return surahs.value
  return surahs.value.filter((s) => {
    const en = String(s.englishname || s.name || '').toLowerCase()
    const ar = String(s.arabicname || '')
    const n = String(s.chapter)
    return en.includes(q) || ar.includes(surahQuery.value.trim()) || n === q || n.startsWith(q)
  })
})

const surahPlaying = computed(() =>
  queueMode.value && isPlaying.value && playingVerse.value != null,
)

const stickyTitle = computed(() => {
  if (!activeSurah.value) return t('quran.pickSurah')
  const name = activeSurah.value.englishname || activeSurah.value.name
  if (playingVerse.value) return `${name} · ${selectedChapter.value}:${playingVerse.value}`
  return name
})

const stickySubtitle = computed(() => {
  const label = locale.value === 'ar' ? activeReciter.value.labelAr : activeReciter.value.label
  if (isPlaying.value) return `${t('quran.listen')} · ${label}`
  return label
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

function stopAudio() {
  const el = audioEl.value
  if (el) {
    el.pause()
    el.removeAttribute('src')
    el.load()
  }
  playingVerse.value = null
  isPlaying.value = false
  queueMode.value = false
}

async function scrollToVerse(verse) {
  await nextTick()
  const el = document.getElementById(`ayah-${verse}`)
  el?.scrollIntoView({ behavior: 'smooth', block: 'center' })
}

async function playVerse(verse, { queue = false } = {}) {
  const el = audioEl.value
  if (!el || !selectedChapter.value) return
  const target = Number(verse)
  if (!ayahs.value.some(a => a.verse === target)) return
  audioError.value = ''
  queueMode.value = queue
  playingVerse.value = target
  savePosition(selectedChapter.value, target)
  el.src = ayahAudioUrl(selectedChapter.value, target, activeReciter.value)
  try {
    await el.play()
    isPlaying.value = true
    scrollToVerse(target)
  } catch {
    isPlaying.value = false
    audioError.value = t('quran.audioError')
  }
}

function toggleAyah(verse) {
  if (playingVerse.value === verse && isPlaying.value) {
    audioEl.value?.pause()
    isPlaying.value = false
    queueMode.value = false
    return
  }
  playVerse(verse, { queue: false })
}

function toggleSurah() {
  if (surahPlaying.value) {
    audioEl.value?.pause()
    isPlaying.value = false
    queueMode.value = false
    return
  }
  const start = playingVerse.value || ayahs.value[0]?.verse
  if (start == null) return
  playVerse(start, { queue: true })
}

function toggleStickyPlay() {
  if (isPlaying.value) {
    audioEl.value?.pause()
    isPlaying.value = false
    return
  }
  if (playingVerse.value && audioEl.value?.src) {
    audioEl.value.play().then(() => { isPlaying.value = true }).catch(() => {
      audioError.value = t('quran.audioError')
    })
    return
  }
  toggleSurah()
}

function stepAyah(delta) {
  const current = playingVerse.value || 1
  const next = current + delta
  if (!ayahs.value.some(a => a.verse === next)) return
  playVerse(next, { queue: queueMode.value })
}

function goSurah(delta) {
  const next = Number(selectedChapter.value) + delta
  if (next < 1 || next > 114) return
  selectChapter(next)
}

function onAudioEnded() {
  if (!queueMode.value || !playingVerse.value) {
    isPlaying.value = false
    return
  }
  const verses = ayahs.value.map(a => a.verse)
  const idx = verses.indexOf(playingVerse.value)
  const next = verses[idx + 1]
  if (next == null) {
    stopAudio()
    return
  }
  playVerse(next, { queue: true })
}

function onAudioError() {
  isPlaying.value = false
  audioError.value = t('quran.audioError')
}

async function loadInfo() {
  infoLoading.value = true
  infoError.value = ''
  try {
    const data = await quranApi.getInfo()
    surahs.value = data.chapters || []

    const qSurah = Number(route.query.surah)
    const qAyah = Number(route.query.ayah)
    const saved = loadSavedPosition()

    if (qSurah >= 1 && qSurah <= 114) {
      selectedChapter.value = qSurah
      if (qAyah >= 1) pendingScrollVerse.value = qAyah
    } else if (saved) {
      selectedChapter.value = saved.chapter
      pendingScrollVerse.value = saved.verse
    } else if (surahs.value.length) {
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
  stopAudio()
  ayahLoading.value = true
  ayahError.value = ''
  try {
    const requests = [
      quranApi.getChapter(QURAN_EDITIONS.ar.id, selectedChapter.value),
    ]
    if (translationLang.value !== 'none') {
      const edition = QURAN_EDITIONS[translationLang.value] || QURAN_EDITIONS.en
      requests.push(quranApi.getChapter(edition.id, selectedChapter.value))
    }
    const [ar, tr] = await Promise.all(requests)
    arabicMap.value = chapterToMap(ar)
    translationMap.value = tr ? chapterToMap(tr) : {}

    const scrollTo = pendingScrollVerse.value
    pendingScrollVerse.value = null
    if (scrollTo) {
      await nextTick()
      scrollToVerse(scrollTo)
      savePosition(selectedChapter.value, scrollTo)
    } else {
      savePosition(selectedChapter.value, 1)
    }
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
  surahDrawerOpen.value = false
  if (route.query.surah || route.query.ayah) {
    router.replace({ name: 'quran' })
  }
}

watch(reciterId, (id) => {
  saveReciterId(id)
  if (isPlaying.value && playingVerse.value) {
    playVerse(playingVerse.value, { queue: queueMode.value })
  }
})

watch(translationLang, (lang) => {
  saveTranslation(lang)
})

watch([selectedChapter, translationLang], () => {
  loadAyahs()
})

watch(playingVerse, (verse) => {
  if (verse != null && selectedChapter.value) {
    savePosition(selectedChapter.value, verse)
  }
})

onMounted(loadInfo)
onBeforeUnmount(stopAudio)
</script>
