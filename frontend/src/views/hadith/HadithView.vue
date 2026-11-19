<template>
  <!-- Pattern: Split Pane -->
  <div class="min-h-screen bg-[#f7faf8] pb-24">
    <header class="sticky top-0 z-20 border-b border-gray-100/90 bg-[#f7faf8]/95 backdrop-blur-md">
      <div class="max-w-6xl mx-auto px-4 sm:px-6 pt-4 sm:pt-5 pb-3 space-y-3">
        <div class="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div class="min-w-0">
            <h1 class="text-2xl sm:text-3xl font-semibold text-gray-900 tracking-tight">
              {{ t('hadith.title') }}
            </h1>
            <p class="mt-0.5 text-sm text-gray-500 text-pretty max-w-xl">
              {{ mode === 'books' ? t('hadith.booksSubtitle') : t('hadith.subtitle') }}
            </p>
          </div>

          <div
            class="inline-flex p-1 rounded-2xl bg-white border border-gray-200 self-start"
            role="tablist"
            :aria-label="t('hadith.browseAs')"
          >
            <button
              type="button"
              role="tab"
              :aria-selected="mode === 'topics'"
              class="min-h-11 min-w-[6.75rem] px-4 rounded-xl text-sm font-semibold touch-manipulation transition-colors"
              :class="mode === 'topics' ? 'bg-brand-muted text-brand shadow-sm' : 'text-gray-600 hover:text-gray-900'"
              @click="setMode('topics')"
            >
              {{ t('hadith.modeTopics') }}
            </button>
            <button
              type="button"
              role="tab"
              :aria-selected="mode === 'books'"
              class="min-h-11 min-w-[6.75rem] px-4 rounded-xl text-sm font-semibold touch-manipulation transition-colors"
              :class="mode === 'books' ? 'bg-brand-muted text-brand shadow-sm' : 'text-gray-600 hover:text-gray-900'"
              @click="setMode('books')"
            >
              {{ t('hadith.modeBooks') }}
            </button>
          </div>
        </div>

        <nav class="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs sm:text-sm text-gray-500" :aria-label="t('hadith.breadcrumb')">
          <span class="font-semibold text-gray-700">{{ mode === 'topics' ? t('hadith.modeTopics') : t('hadith.modeBooks') }}</span>
          <template v-if="crumbMid">
            <span aria-hidden="true" class="text-gray-300">/</span>
            <button
              v-if="showingDetail"
              type="button"
              class="font-medium text-brand hover:underline touch-manipulation min-h-8"
              @click="closeDetail"
            >
              {{ crumbMid }}
            </button>
            <span v-else class="font-medium text-gray-700 truncate max-w-[14rem] sm:max-w-xs">{{ crumbMid }}</span>
          </template>
          <template v-if="showingDetail">
            <span aria-hidden="true" class="text-gray-300">/</span>
            <span class="font-medium text-gray-900 truncate max-w-[12rem] sm:max-w-sm" aria-current="page">
              {{ crumbDetail }}
            </span>
          </template>
          <span v-if="listCountLabel" class="ms-auto text-gray-400 tabular-nums">{{ listCountLabel }}</span>
        </nav>

        <div v-if="mode === 'topics'" class="flex flex-wrap items-center gap-2">
          <label class="sr-only" for="hadith-lang">{{ t('hadith.language') }}</label>
          <select
            id="hadith-lang"
            v-model="language"
            class="athar-control !w-auto !min-w-[9rem] !min-h-10 text-sm"
            @change="onLanguageChange"
          >
            <option v-for="lang in preferredLanguages" :key="lang.code || lang" :value="lang.code || lang">
              {{ lang.native || lang.language || lang.code || lang }}
            </option>
          </select>
        </div>
        <p v-else class="text-xs text-gray-500">{{ t('hadith.booksLangNote') }}</p>

        <!-- Mobile collection rail -->
        <div class="lg:hidden -mx-4 sm:-mx-6">
          <div
            ref="mobileRail"
            class="flex gap-2 px-4 sm:px-6 overflow-x-auto overscroll-x-contain pb-1 scroll-smooth"
          >
            <template v-if="mode === 'topics'">
              <template v-if="catLoading">
                <div v-for="n in 5" :key="n" class="h-10 w-28 shrink-0 rounded-xl bg-gray-100 animate-pulse" />
              </template>
              <button
                v-for="cat in topCategories"
                v-else
                :key="cat.id"
                type="button"
                :data-rail-id="`cat-${cat.id}`"
                class="athar-chip shrink-0 whitespace-nowrap"
                :class="categoryId === cat.id ? 'athar-chip--on' : ''"
                :aria-current="categoryId === cat.id ? 'true' : undefined"
                @click="selectCategory(cat.id)"
              >
                {{ cat.title }}
                <span class="ms-1.5 text-xs font-normal tabular-nums opacity-70">{{ cat.hadeeths_count }}</span>
              </button>
            </template>
            <template v-else>
              <template v-if="bookLoading">
                <div v-for="n in 5" :key="n" class="h-10 w-28 shrink-0 rounded-xl bg-gray-100 animate-pulse" />
              </template>
              <button
                v-for="book in books"
                v-else
                :key="book.key"
                type="button"
                :data-rail-id="`book-${book.key}`"
                class="athar-chip shrink-0 whitespace-nowrap"
                :class="collectionKey === book.key ? 'athar-chip--on' : ''"
                :aria-current="collectionKey === book.key ? 'true' : undefined"
                @click="selectBook(book.key)"
              >
                {{ bookShortName(book) }}
                <span class="ms-1.5 text-xs font-normal tabular-nums opacity-70">{{ book.total_hadiths }}</span>
              </button>
            </template>
          </div>
        </div>
      </div>
    </header>

    <div class="max-w-6xl mx-auto px-4 sm:px-6 pt-4 sm:pt-6 grid grid-cols-1 lg:grid-cols-12 gap-5 lg:gap-8">
      <aside class="hidden lg:block lg:col-span-4 xl:col-span-3" :aria-label="mode === 'topics' ? t('hadith.categories') : t('hadith.books')">
        <div class="sticky top-[8.75rem] rounded-2xl bg-white border border-gray-100 overflow-hidden">
          <div class="px-4 py-3 border-b border-gray-50 flex items-center justify-between gap-2">
            <p class="text-xs font-semibold uppercase tracking-wide text-gray-400">
              {{ mode === 'topics' ? t('hadith.categories') : t('hadith.books') }}
            </p>
            <span v-if="sidebarCount" class="text-xs tabular-nums text-gray-400">{{ sidebarCount }}</span>
          </div>
          <div v-if="sidebarLoading" class="p-3 space-y-2">
            <div v-for="n in 8" :key="n" class="h-12 rounded-xl bg-gray-50 animate-pulse" />
          </div>
          <div v-else-if="sidebarError" class="p-4 text-sm text-red-600">{{ sidebarError }}</div>
          <ul v-else class="max-h-[min(70vh,38rem)] overflow-y-auto overscroll-contain py-1.5 px-1.5">
            <template v-if="mode === 'topics'">
              <li v-for="cat in topCategories" :key="cat.id">
                <button
                  type="button"
                  class="w-full text-start px-3 py-2.5 rounded-xl min-h-12 text-sm touch-manipulation transition-colors"
                  :class="categoryId === cat.id
                    ? 'bg-brand-muted text-brand font-semibold'
                    : 'text-gray-700 hover:bg-gray-50'"
                  :aria-current="categoryId === cat.id ? 'true' : undefined"
                  @click="selectCategory(cat.id)"
                >
                  <span class="block leading-snug">{{ cat.title }}</span>
                  <span
                    class="block text-xs tabular-nums mt-0.5"
                    :class="categoryId === cat.id ? 'text-brand/70' : 'text-gray-400'"
                  >
                    {{ cat.hadeeths_count }} {{ t('hadith.narrations') }}
                  </span>
                </button>
              </li>
            </template>
            <template v-else>
              <li v-for="book in books" :key="book.key">
                <button
                  type="button"
                  class="w-full text-start px-3 py-2.5 rounded-xl min-h-12 text-sm touch-manipulation transition-colors"
                  :class="collectionKey === book.key
                    ? 'bg-brand-muted text-brand font-semibold'
                    : 'text-gray-700 hover:bg-gray-50'"
                  :aria-current="collectionKey === book.key ? 'true' : undefined"
                  @click="selectBook(book.key)"
                >
                  <span class="block leading-snug">{{ book.name }}</span>
                  <span
                    v-if="book.arabic_name"
                    class="block text-xs mt-0.5"
                    :class="collectionKey === book.key ? 'text-brand/70' : 'text-gray-400'"
                    dir="rtl"
                    lang="ar"
                  >{{ book.arabic_name }}</span>
                  <span
                    class="block text-xs tabular-nums mt-0.5"
                    :class="collectionKey === book.key ? 'text-brand/70' : 'text-gray-400'"
                  >
                    {{ book.total_hadiths }} {{ t('hadith.narrations') }}
                  </span>
                </button>
              </li>
            </template>
          </ul>
        </div>
      </aside>

      <section ref="mainPane" class="lg:col-span-8 xl:col-span-9 min-w-0" tabindex="-1">
        <!-- Topics -->
        <template v-if="mode === 'topics'">
          <div
            v-if="!categoryId"
            class="rounded-2xl bg-white border border-dashed border-gray-200 px-6 py-16 text-center"
          >
            <p class="text-base font-semibold text-gray-800">{{ t('hadith.pickCategory') }}</p>
            <p class="mt-1 text-sm text-gray-500 max-w-sm mx-auto">{{ t('hadith.pickCategoryHint') }}</p>
          </div>

          <article v-else-if="selected" class="space-y-3">
            <div class="flex flex-wrap items-center gap-2">
              <button type="button" class="athar-btn-secondary gap-1.5" @click="closeDetail">
                <span aria-hidden="true">←</span> {{ t('hadith.back') }}
              </button>
              <div class="ms-auto flex gap-2">
                <button
                  type="button"
                  class="athar-btn-secondary"
                  :disabled="!topicPrevId"
                  @click="openOne(topicPrevId)"
                >
                  {{ t('hadith.prev') }}
                </button>
                <button
                  type="button"
                  class="athar-btn-secondary"
                  :disabled="!topicNextId"
                  @click="openOne(topicNextId)"
                >
                  {{ t('hadith.next') }}
                </button>
              </div>
            </div>

            <div class="rounded-2xl bg-white border border-gray-100 overflow-hidden">
              <header class="px-5 sm:px-8 pt-5 sm:pt-7 pb-4 border-b border-gray-50 space-y-3">
                <div class="flex flex-wrap items-center gap-2">
                  <span
                    v-if="selected.grade || selected.grade_ar"
                    class="inline-flex items-center min-h-8 px-2.5 rounded-lg bg-brand-muted text-brand text-xs font-semibold"
                  >
                    {{ selected.grade || selected.grade_ar }}
                  </span>
                  <span v-if="activeCategoryTitle" class="text-xs text-gray-400">{{ activeCategoryTitle }}</span>
                </div>
                <h2 class="text-xl sm:text-2xl font-semibold text-gray-900 tracking-tight text-pretty">
                  {{ selected.title }}
                </h2>
                <p v-if="topicNarrator" class="text-sm text-gray-600">
                  <span class="font-semibold text-gray-500">{{ t('hadith.narratorLabel') }}:</span>
                  {{ topicNarrator }}
                </p>
              </header>

              <div class="px-5 sm:px-8 py-5 sm:py-7 space-y-7">
                <section v-if="topicArabic" aria-labelledby="topic-ar-label">
                  <h3 id="topic-ar-label" class="text-xs font-semibold uppercase tracking-widest text-gray-400 mb-3">
                    {{ t('hadith.arabicLabel') }}
                  </h3>
                  <div class="rounded-2xl bg-[#f4f7f5] px-4 sm:px-5 py-4 sm:py-5">
                    <p
                      class="font-arabic text-[1.25rem] sm:text-[1.4rem] leading-[2] text-gray-900 whitespace-pre-wrap text-start"
                      dir="rtl"
                      lang="ar"
                    >{{ topicArabic }}</p>
                  </div>
                </section>

                <section v-if="topicTranslation" aria-labelledby="topic-tr-label">
                  <h3 id="topic-tr-label" class="text-xs font-semibold uppercase tracking-widest text-gray-400 mb-3">
                    {{ t('hadith.translationLabel') }}
                  </h3>
                  <p class="text-base sm:text-lg leading-relaxed text-gray-800 whitespace-pre-wrap text-pretty">
                    {{ topicTranslation }}
                  </p>
                </section>

                <section
                  v-if="selected.explanation"
                  class="pt-6 border-t border-gray-100"
                  aria-labelledby="topic-exp-label"
                >
                  <h3 id="topic-exp-label" class="text-sm font-semibold text-gray-800 mb-2">
                    {{ t('hadith.explanation') }}
                  </h3>
                  <p class="text-sm sm:text-base leading-relaxed text-gray-600 whitespace-pre-wrap text-pretty">
                    {{ selected.explanation }}
                  </p>
                </section>
              </div>
            </div>
          </article>

          <div v-else class="space-y-2.5">
            <div v-if="listLoading && !items.length" class="space-y-2">
              <div v-for="n in 6" :key="n" class="h-[4.75rem] rounded-2xl bg-white border border-gray-100 animate-pulse" />
            </div>
            <p v-else-if="listError" class="text-sm text-red-600 px-1">{{ listError }}</p>
            <ul v-else class="space-y-2" role="list">
              <li v-for="(item, idx) in items" :key="item.id">
                <button
                  type="button"
                  class="group w-full text-start rounded-2xl bg-white border border-gray-100 px-4 py-3.5
                         hover:border-brand/25 hover:bg-brand-muted/15 transition-colors touch-manipulation min-h-14"
                  @click="openOne(item.id)"
                >
                  <span class="flex gap-3 items-start">
                    <span class="shrink-0 w-8 text-xs font-semibold tabular-nums text-gray-300 pt-1 group-hover:text-brand/50">
                      {{ idx + 1 }}
                    </span>
                    <span class="min-w-0 flex-1">
                      <span class="block text-sm sm:text-base font-semibold text-gray-900 leading-snug text-pretty">
                        {{ item.title }}
                      </span>
                    </span>
                    <span class="shrink-0 text-gray-300 group-hover:text-brand mt-1 text-lg" aria-hidden="true">›</span>
                  </span>
                </button>
              </li>
              <li
                v-if="!items.length"
                class="rounded-2xl bg-white border border-dashed border-gray-200 px-6 py-12 text-center text-sm text-gray-500"
              >
                {{ t('hadith.empty') }}
              </li>
            </ul>
            <div v-if="hasMore" class="pt-3 flex justify-center">
              <button type="button" class="athar-btn-secondary" :disabled="listLoading" @click="loadMore">
                {{ listLoading ? '…' : t('hadith.more') }}
              </button>
            </div>
          </div>
        </template>

        <!-- Books -->
        <template v-else>
          <div
            v-if="!collectionKey"
            class="rounded-2xl bg-white border border-dashed border-gray-200 px-6 py-16 text-center"
          >
            <p class="text-base font-semibold text-gray-800">{{ t('hadith.pickBook') }}</p>
            <p class="mt-1 text-sm text-gray-500 max-w-sm mx-auto">{{ t('hadith.pickBookHint') }}</p>
          </div>

          <article v-else-if="bookSelected" class="space-y-3">
            <div class="flex flex-wrap items-center gap-2">
              <button type="button" class="athar-btn-secondary gap-1.5" @click="closeDetail">
                <span aria-hidden="true">←</span> {{ t('hadith.back') }}
              </button>
              <div class="ms-auto flex gap-2">
                <button
                  type="button"
                  class="athar-btn-secondary"
                  :disabled="!bookPrevNumber"
                  @click="openBookHadith(bookPrevNumber)"
                >
                  {{ t('hadith.prev') }}
                </button>
                <button
                  type="button"
                  class="athar-btn-secondary"
                  :disabled="!bookNextNumber"
                  @click="openBookHadith(bookNextNumber)"
                >
                  {{ t('hadith.next') }}
                </button>
              </div>
            </div>

            <div class="rounded-2xl bg-white border border-gray-100 overflow-hidden">
              <header class="px-5 sm:px-8 pt-5 sm:pt-7 pb-4 border-b border-gray-50 space-y-3">
                <div class="flex flex-wrap items-center gap-2">
                  <span class="inline-flex items-center min-h-8 px-2.5 rounded-lg bg-gray-100 text-gray-700 text-xs font-semibold tabular-nums">
                    #{{ bookSelected.hadithnumber }}
                  </span>
                  <span
                    v-if="bookSelected.grade"
                    class="inline-flex items-center min-h-8 px-2.5 rounded-lg bg-brand-muted text-brand text-xs font-semibold"
                  >
                    {{ bookSelected.grade }}
                  </span>
                  <span class="text-xs text-gray-400">{{ bookSelected.collection_name || activeBookName }}</span>
                </div>
                <h2 class="text-lg sm:text-xl font-semibold text-gray-900 tracking-tight">
                  {{ t('hadith.narrationN', { n: bookSelected.hadithnumber }) }}
                </h2>
                <p v-if="bookNarrator" class="text-sm text-gray-600">
                  <span class="font-semibold text-gray-500">{{ t('hadith.narratorLabel') }}:</span>
                  {{ bookNarrator }}
                </p>
              </header>

              <div class="px-5 sm:px-8 py-5 sm:py-7 space-y-7">
                <section v-if="bookSelected.arabic" aria-labelledby="book-ar-label">
                  <h3 id="book-ar-label" class="text-xs font-semibold uppercase tracking-widest text-gray-400 mb-3">
                    {{ t('hadith.arabicLabel') }}
                  </h3>
                  <div class="rounded-2xl bg-[#f4f7f5] px-4 sm:px-5 py-4 sm:py-5">
                    <p
                      class="font-arabic text-[1.25rem] sm:text-[1.4rem] leading-[2] text-gray-900 whitespace-pre-wrap text-start"
                      dir="rtl"
                      lang="ar"
                    >{{ bookSelected.arabic }}</p>
                  </div>
                </section>

                <section v-if="bookSelected.english" aria-labelledby="book-en-label">
                  <h3 id="book-en-label" class="text-xs font-semibold uppercase tracking-widest text-gray-400 mb-3">
                    {{ t('hadith.translationLabel') }}
                  </h3>
                  <p class="text-base sm:text-lg leading-relaxed text-gray-800 whitespace-pre-wrap text-pretty">
                    {{ bookSelected.english }}
                  </p>
                </section>
              </div>
            </div>
          </article>

          <div v-else class="space-y-2.5">
            <div v-if="bookListLoading && !bookItems.length" class="space-y-2">
              <div v-for="n in 6" :key="n" class="h-28 rounded-2xl bg-white border border-gray-100 animate-pulse" />
            </div>
            <p v-else-if="bookListError" class="text-sm text-red-600 px-1">{{ bookListError }}</p>
            <ul v-else class="space-y-2" role="list">
              <li v-for="item in bookItems" :key="item.id || item.hadithnumber">
                <button
                  type="button"
                  class="group w-full text-start rounded-2xl bg-white border border-gray-100 px-4 py-4
                         hover:border-brand/25 hover:bg-brand-muted/15 transition-colors touch-manipulation"
                  @click="openBookHadith(item.hadithnumber)"
                >
                  <span class="flex gap-3 items-start">
                    <span class="shrink-0 min-w-[2.5rem] text-xs font-semibold tabular-nums text-brand pt-0.5">
                      #{{ item.hadithnumber }}
                    </span>
                    <span class="min-w-0 flex-1 space-y-2">
                      <span
                        v-if="extractBookNarrator(item.english)"
                        class="block text-xs font-semibold text-gray-500"
                      >
                        {{ t('hadith.narratorLabel') }}: {{ extractBookNarrator(item.english) }}
                      </span>
                      <span
                        v-if="item.arabic"
                        class="block font-arabic text-[1.05rem] leading-[1.85] text-gray-900 line-clamp-3 text-start"
                        dir="rtl"
                        lang="ar"
                      >{{ item.arabic }}</span>
                      <span
                        v-if="item.english"
                        class="block text-sm text-gray-600 leading-snug line-clamp-2"
                      >{{ stripNarratorPrefix(item.english) }}</span>
                      <span
                        v-if="item.grade"
                        class="inline-flex text-xs font-semibold uppercase tracking-wide text-brand/80 bg-brand-muted px-2 py-0.5 rounded"
                      >{{ item.grade }}</span>
                    </span>
                    <span class="shrink-0 text-gray-300 group-hover:text-brand mt-1 text-lg" aria-hidden="true">›</span>
                  </span>
                </button>
              </li>
              <li
                v-if="!bookItems.length"
                class="rounded-2xl bg-white border border-dashed border-gray-200 px-6 py-12 text-center text-sm text-gray-500"
              >
                {{ t('hadith.empty') }}
              </li>
            </ul>
            <div v-if="bookHasMore" class="pt-3 flex justify-center">
              <button type="button" class="athar-btn-secondary" :disabled="bookListLoading" @click="loadMoreBooks">
                {{ bookListLoading ? '…' : t('hadith.more') }}
              </button>
            </div>
          </div>
        </template>
      </section>
    </div>
  </div>
</template>

<script setup>
import { computed, nextTick, onMounted, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRoute, useRouter } from 'vue-router'
import { useSeo, SEO_ORIGIN } from '@/composables/useSeo'
import { hadeethApi } from '@/api/hadeeth'
import { UMMAH_STRONG_COLLECTIONS, ummahHadithApi } from '@/api/ummahHadith'

const { t, locale } = useI18n({ useScope: 'global' })
const route = useRoute()
const router = useRouter()

useSeo(() => {
  const title = t('hadith.title')
  const description = t('hadith.subtitle')
  const url = `${SEO_ORIGIN}/hadith`
  return {
    title,
    description,
    url,
    jsonLd: {
      '@context': 'https://schema.org',
      '@graph': [
        {
          '@type': 'WebPage',
          name: title,
          description,
          url,
          inLanguage: ['en', 'ar', 'sw'],
          isPartOf: { '@id': `${SEO_ORIGIN}/#website` },
        },
        {
          '@type': 'BreadcrumbList',
          itemListElement: [
            { '@type': 'ListItem', position: 1, name: 'Athar Al \'Ilm', item: `${SEO_ORIGIN}/` },
            { '@type': 'ListItem', position: 2, name: title, item: url },
          ],
        },
      ],
    },
  }
})

const mode = ref('topics')
const language = ref(locale.value === 'ar' ? 'ar' : locale.value === 'sw' ? 'sw' : 'en')
const languages = ref([
  { code: 'en', native: 'English' },
  { code: 'ar', native: 'العربية' },
  { code: 'sw', native: 'Kiswahili' },
])
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

const books = ref([])
const collectionKey = ref(null)
const bookItems = ref([])
const bookPage = ref(1)
const bookHasMore = ref(false)
const bookSelected = ref(null)
const bookLoading = ref(false)
const bookError = ref('')
const bookListLoading = ref(false)
const bookListError = ref('')
const booksLoaded = ref(false)
const syncingFromRoute = ref(false)
const writingQuery = ref(false)

const mainPane = ref(null)
const mobileRail = ref(null)

const topCategories = computed(() =>
  (categories.value || []).filter(c => !c.parent_id).slice(0, 40),
)

const preferredLanguages = computed(() => {
  const prefer = new Set(['ar', 'en', 'sw'])
  const list = languages.value || []
  const ranked = list.filter(l => prefer.has(String(l.code || l).toLowerCase()))
  return ranked.length ? ranked : list
})

const activeCategoryTitle = computed(() => {
  const cat = topCategories.value.find(c => String(c.id) === String(categoryId.value))
  return cat?.title || ''
})

const activeBookName = computed(() => {
  const book = books.value.find(b => b.key === collectionKey.value)
  return book?.name || ''
})

const sidebarLoading = computed(() =>
  mode.value === 'topics' ? catLoading.value : bookLoading.value,
)

const sidebarError = computed(() =>
  mode.value === 'topics' ? catError.value : bookError.value,
)

const sidebarCount = computed(() =>
  mode.value === 'topics' ? topCategories.value.length : books.value.length,
)

const showingDetail = computed(() =>
  mode.value === 'topics' ? Boolean(selected.value) : Boolean(bookSelected.value),
)

const crumbMid = computed(() =>
  mode.value === 'topics' ? activeCategoryTitle.value : activeBookName.value,
)

const crumbDetail = computed(() => {
  if (mode.value === 'topics') return selected.value?.title || t('hadith.narration')
  if (bookSelected.value?.hadithnumber != null) {
    return t('hadith.narrationN', { n: bookSelected.value.hadithnumber })
  }
  return t('hadith.narration')
})

const listCountLabel = computed(() => {
  if (mode.value === 'topics' && categoryId.value && !selected.value && items.value.length) {
    return `${items.value.length}${hasMore.value ? '+' : ''} ${t('hadith.narrations')}`
  }
  if (mode.value === 'books' && collectionKey.value && !bookSelected.value && bookItems.value.length) {
    return `${bookItems.value.length}${bookHasMore.value ? '+' : ''} ${t('hadith.narrations')}`
  }
  return ''
})

const topicArabic = computed(() => {
  const s = selected.value
  if (!s) return ''
  return s.hadeeth_ar || (language.value === 'ar' ? s.hadeeth : '') || ''
})

const topicTranslation = computed(() => {
  const s = selected.value
  if (!s || language.value === 'ar') return ''
  const text = s.hadeeth || ''
  if (topicArabic.value && text === topicArabic.value) return ''
  return text
})

const topicNarrator = computed(() => {
  const s = selected.value
  if (!s) return ''
  if (language.value === 'ar') return s.attribution_ar || s.attribution || ''
  return s.attribution || s.attribution_ar || ''
})

const bookNarrator = computed(() => extractBookNarrator(bookSelected.value?.english))

const topicIndex = computed(() => {
  if (!selected.value) return -1
  return items.value.findIndex(i => String(i.id) === String(selected.value.id))
})

const topicPrevId = computed(() => {
  const i = topicIndex.value
  return i > 0 ? items.value[i - 1]?.id : null
})

const topicNextId = computed(() => {
  const i = topicIndex.value
  if (i < 0) return null
  return i < items.value.length - 1 ? items.value[i + 1]?.id : null
})

const bookIndex = computed(() => {
  if (!bookSelected.value) return -1
  return bookItems.value.findIndex(
    i => String(i.hadithnumber) === String(bookSelected.value.hadithnumber),
  )
})

const bookPrevNumber = computed(() => {
  const i = bookIndex.value
  return i > 0 ? bookItems.value[i - 1]?.hadithnumber : null
})

const bookNextNumber = computed(() => {
  const i = bookIndex.value
  if (i < 0) return null
  return i < bookItems.value.length - 1 ? bookItems.value[i + 1]?.hadithnumber : null
})

function bookShortName(book) {
  const name = String(book?.name || book?.key || '')
  return name
    .replace(/^Sahih\s+/i, '')
    .replace(/^Sunan\s+/i, '')
    .replace(/^Jami(?:\s+at-)?/i, '')
    || name
}

function extractBookNarrator(english) {
  const m = String(english || '').match(/^Narrated\s+([^:]+):/i)
  return m ? m[1].trim() : ''
}

function stripNarratorPrefix(english) {
  return String(english || '').replace(/^Narrated\s+[^:]+:\s*/i, '')
}

function focusMain() {
  nextTick(() => {
    mainPane.value?.scrollIntoView?.({ behavior: 'smooth', block: 'start' })
  })
}

function scrollActiveChip() {
  nextTick(() => {
    const id = mode.value === 'topics'
      ? (categoryId.value != null ? `cat-${categoryId.value}` : '')
      : (collectionKey.value ? `book-${collectionKey.value}` : '')
    if (!id || !mobileRail.value) return
    const el = mobileRail.value.querySelector(`[data-rail-id="${id}"]`)
    el?.scrollIntoView?.({ behavior: 'smooth', inline: 'center', block: 'nearest' })
  })
}

function syncQuery() {
  if (syncingFromRoute.value || writingQuery.value) return
  const q = {}
  if (mode.value === 'books') q.mode = 'books'
  if (mode.value === 'topics' && language.value && language.value !== 'en') q.lang = language.value
  if (mode.value === 'topics' && categoryId.value) q.cat = String(categoryId.value)
  if (mode.value === 'topics' && selected.value?.id) q.id = String(selected.value.id)
  if (mode.value === 'books' && collectionKey.value) q.book = collectionKey.value
  if (mode.value === 'books' && bookSelected.value?.hadithnumber != null) {
    q.n = String(bookSelected.value.hadithnumber)
  }
  const cur = route.query
  const same =
    String(cur.mode || '') === String(q.mode || '')
    && String(cur.lang || '') === String(q.lang || '')
    && String(cur.cat || '') === String(q.cat || '')
    && String(cur.id || '') === String(q.id || '')
    && String(cur.book || '') === String(q.book || '')
    && String(cur.n || '') === String(q.n || '')
  if (same) return
  writingQuery.value = true
  router.replace({ query: q }).finally(() => {
    writingQuery.value = false
  })
}

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
  scrollActiveChip()
  syncQuery()
}

async function openOne(id) {
  if (!id) return
  listLoading.value = true
  try {
    selected.value = await hadeethApi.one(id, language.value)
    focusMain()
    syncQuery()
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
  syncQuery()
}

async function loadBooks() {
  bookLoading.value = true
  bookError.value = ''
  try {
    const data = await ummahHadithApi.collections()
    const rows = data?.collections || (Array.isArray(data) ? data : [])
    const allow = new Set(UMMAH_STRONG_COLLECTIONS)
    books.value = rows.filter(c => allow.has(c.key))
    booksLoaded.value = true
  } catch {
    bookError.value = t('hadith.loadError')
    books.value = []
  } finally {
    bookLoading.value = false
  }
}

async function loadBookList({ append = false } = {}) {
  if (!collectionKey.value) return
  bookListLoading.value = true
  bookListError.value = ''
  try {
    const data = await ummahHadithApi.list({
      collection: collectionKey.value,
      page: bookPage.value,
      limit: 20,
    })
    const rows = data?.hadiths || []
    bookItems.value = append ? [...bookItems.value, ...rows] : rows
    const totalPages = Number(data?.total_pages || 0)
    bookHasMore.value = bookPage.value < totalPages || (!totalPages && rows.length >= 20)
  } catch {
    bookListError.value = t('hadith.loadError')
    if (!append) bookItems.value = []
  } finally {
    bookListLoading.value = false
  }
}

function selectBook(key) {
  collectionKey.value = key
  bookSelected.value = null
  bookPage.value = 1
  loadBookList()
  scrollActiveChip()
  syncQuery()
}

async function openBookHadith(number) {
  if (number == null) return
  bookListLoading.value = true
  try {
    bookSelected.value = await ummahHadithApi.one(collectionKey.value, number)
    focusMain()
    syncQuery()
  } catch {
    bookListError.value = t('hadith.loadError')
  } finally {
    bookListLoading.value = false
  }
}

function loadMoreBooks() {
  bookPage.value += 1
  loadBookList({ append: true })
}

function closeDetail() {
  if (mode.value === 'topics') selected.value = null
  else bookSelected.value = null
  syncQuery()
}

async function setMode(next) {
  if (mode.value === next) return
  mode.value = next
  selected.value = null
  bookSelected.value = null
  if (next === 'books' && !booksLoaded.value) await loadBooks()
  scrollActiveChip()
  syncQuery()
}

async function applyRouteQuery() {
  syncingFromRoute.value = true
  try {
    const q = route.query
    const nextMode = q.mode === 'books' ? 'books' : 'topics'
    mode.value = nextMode

    if (nextMode === 'topics') {
      if (q.lang && ['ar', 'en', 'sw'].includes(String(q.lang))) {
        language.value = String(q.lang)
      }
      await loadCategories()
      if (q.cat) {
        categoryId.value = String(q.cat)
        page.value = 1
        await loadList()
        if (q.id) await openOne(String(q.id))
      }
    } else {
      if (!booksLoaded.value) await loadBooks()
      if (q.book && UMMAH_STRONG_COLLECTIONS.includes(String(q.book))) {
        collectionKey.value = String(q.book)
        bookPage.value = 1
        await loadBookList()
        if (q.n) await openBookHadith(String(q.n))
      }
    }
    scrollActiveChip()
  } finally {
    syncingFromRoute.value = false
  }
}

watch(
  () => route.query,
  async (q, prev) => {
    if (syncingFromRoute.value || writingQuery.value) return
    const keys = ['mode', 'lang', 'cat', 'id', 'book', 'n']
    const changed = keys.some(k => String(q[k] || '') !== String(prev?.[k] || ''))
    if (!changed) return
    await applyRouteQuery()
  },
)

onMounted(async () => {
  await loadLanguages()
  if (Object.keys(route.query || {}).length) {
    await applyRouteQuery()
  } else {
    await loadCategories()
  }
})
</script>
