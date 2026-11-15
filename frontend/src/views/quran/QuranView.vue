<template>
  <div
    class="quran-page min-h-screen overflow-x-hidden"
    :class="[
      modes.player ? 'pb-[calc(8.5rem+env(safe-area-inset-bottom))] sm:pb-32' : 'pb-10',
      `quran-page--${experience}`,
    ]"
  >
    <div class="max-w-6xl mx-auto px-4 sm:px-6 pt-6 pb-3 sm:pt-10 sm:pb-5">
      <div class="flex items-start justify-between gap-3 mb-5">
        <div class="min-w-0">
          <h1 class="text-2xl sm:text-3xl font-black text-gray-900 tracking-tight text-balance">
            {{ t('quran.title') }}
          </h1>
          <p class="mt-1 text-sm sm:text-base text-gray-500 max-w-md text-pretty">
            {{ experienceHint }}
          </p>
        </div>
        <div class="flex items-center gap-2 shrink-0">
          <RouterLink
            to="/hadith"
            class="athar-btn-secondary hidden sm:inline-flex"
          >
            {{ t('nav.hadith') }}
          </RouterLink>
          <RouterLink
            to="/quran/dua"
            class="inline-flex items-center min-h-11 px-3.5 rounded-xl border border-brand/20
                   text-sm font-semibold text-brand hover:bg-brand-muted transition-colors"
          >
            {{ t('quran.dua.nav') }}
          </RouterLink>
        </div>
      </div>

      <div
        class="w-full p-1 rounded-2xl bg-white border border-gray-200/80 flex gap-1"
        role="tablist"
        :aria-label="t('quran.experience.label')"
      >
        <button
          v-for="exp in experienceButtons"
          :key="exp.key"
          type="button"
          role="tab"
          class="flex-1 inline-flex items-center justify-center min-h-11 px-2 sm:px-3 rounded-xl text-sm font-semibold
                 transition-colors duration-150 touch-manipulation"
          :class="experience === exp.key
            ? 'bg-brand text-white'
            : 'text-gray-600 hover:bg-gray-50'"
          :aria-selected="experience === exp.key ? 'true' : 'false'"
          @click="setExperience(exp.key)"
        >
          {{ exp.label }}
        </button>
      </div>
      <p v-if="experience === 'custom'" class="mt-2 text-sm text-amber-700">
        {{ t('quran.experience.customHint') }}
      </p>

      <div class="mt-5 flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-end sm:gap-3">
        <label class="flex flex-col gap-1 min-w-0 flex-1 sm:max-w-sm">
          <span class="text-sm font-medium text-gray-600">{{ t('quran.searchSurah') }}</span>
          <input
            v-model="surahQuery"
            type="search"
            autocomplete="off"
            :placeholder="t('quran.searchPlaceholder')"
            class="athar-control"
          />
        </label>

        <div class="flex flex-row gap-2 sm:gap-3 min-w-0 items-end sm:contents">
          <label v-if="modes.translation" class="flex flex-col gap-1 min-w-0 flex-1 sm:w-52 sm:flex-none">
            <span class="text-sm font-medium text-gray-600" for="quran-translation">{{ t('quran.translation') }}</span>
            <select
              id="quran-translation"
              v-model="translationLang"
              class="athar-control cursor-pointer"
            >
              <option value="en">{{ locale === 'ar' ? QURAN_EDITIONS.en.labelAr : QURAN_EDITIONS.en.label }}</option>
              <option value="sw">{{ locale === 'ar' ? QURAN_EDITIONS.sw.labelAr : QURAN_EDITIONS.sw.label }}</option>
              <option value="none">{{ t('quran.arabicOnly') }}</option>
            </select>
          </label>

          <button
            type="button"
            class="athar-btn-secondary sm:ms-auto shrink-0"
            :aria-expanded="optionsOpen ? 'true' : 'false'"
            @click="optionsOpen = !optionsOpen"
          >
            {{ optionsOpen ? t('quran.optionsLess') : t('quran.optionsMore') }}
          </button>
        </div>
      </div>

      <div
        v-if="optionsOpen"
        class="mt-3 p-3 rounded-2xl border border-gray-100 bg-white/90"
        role="group"
        :aria-label="t('quran.modes.label')"
      >
        <div class="flex flex-wrap gap-2">
          <button
            v-for="m in modeButtons"
            :key="m.key"
            type="button"
            class="athar-chip"
            :class="modes[m.key] ? 'athar-chip--on' : ''"
            :aria-pressed="modes[m.key] ? 'true' : 'false'"
            @click="toggleMode(m.key)"
          >
            {{ m.label }}
          </button>
        </div>
        <label
          v-if="modes.player"
          class="mt-3 flex flex-col gap-1 md:hidden"
        >
          <span class="text-sm font-medium text-gray-600" for="quran-reciter-mobile">{{ t('quran.reciterLabel') }}</span>
          <select
            id="quran-reciter-mobile"
            v-model="reciterId"
            class="athar-control cursor-pointer"
          >
            <option v-for="r in visibleReciters" :key="r.id" :value="r.id">
              {{ locale === 'ar' ? r.labelAr : r.label }}
            </option>
          </select>
        </label>
        <p v-if="modes.wordSync && modes.player" class="mt-2 text-sm text-gray-400 text-pretty">
          {{ t('quran.modes.wordSyncHint') }}
        </p>
      </div>
      <p class="sr-only" role="status" aria-live="polite">{{ liveStatus }}</p>
    </div>

    <div class="max-w-6xl mx-auto px-4 sm:px-6 pb-8 grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8">
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
          class="border border-gray-100 rounded-2xl overflow-hidden bg-gray-50/60 lg:sticky lg:top-28"
          :class="surahDrawerOpen ? 'block' : 'hidden lg:block'"
        >
          <div class="px-4 py-3 border-b border-gray-100 bg-white space-y-3">
            <p class="text-sm font-semibold text-gray-800">{{ t('quran.surahs') }}</p>
            <div class="grid grid-cols-2 gap-2">
              <label class="min-w-0 flex flex-col gap-1">
                <span class="text-xs font-medium text-gray-500">{{ t('quran.juz') }}</span>
                <input
                  v-model.number="jumpJuz"
                  type="number"
                  min="1"
                  max="30"
                  inputmode="numeric"
                  :placeholder="t('quran.juz')"
                  class="athar-control text-sm min-h-10"
                  @keydown.enter.prevent="goJuz"
                />
              </label>
              <label class="min-w-0 flex flex-col gap-1">
                <span class="text-xs font-medium text-gray-500">{{ t('quran.page') }}</span>
                <input
                  v-model.number="jumpPage"
                  type="number"
                  min="1"
                  max="604"
                  inputmode="numeric"
                  :placeholder="t('quran.page')"
                  class="athar-control text-sm min-h-10"
                  @keydown.enter.prevent="goPage"
                />
              </label>
            </div>
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
            <div class="flex items-center gap-2">
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
          <p v-if="timingError" class="mb-4 text-sm text-amber-700">{{ timingError }}</p>
          <p v-if="shareCopied" class="mb-4 text-sm text-brand" role="status">{{ t('quran.shareCopied') }}</p>

          <!-- Reading: mushaf column -->
          <div v-if="experience === 'read'" class="quran-mushaf rounded-2xl border border-gray-100 bg-white px-4 sm:px-8 py-6 sm:py-10 space-y-8">
            <article
              v-for="ayah in ayahs"
              :id="`ayah-${ayah.verse}`"
              :key="ayah.verse"
              class="scroll-mt-28"
            >
              <div class="flex items-center justify-between gap-2 mb-2">
                <span class="text-xs font-bold text-brand/70 tabular-nums">{{ selectedChapter }}:{{ ayah.verse }}</span>
                <button type="button" class="text-xs font-semibold text-gray-400 hover:text-brand" @click="copyShare(ayah.verse)">
                  {{ t('quran.share') }}
                </button>
              </div>
              <p class="font-arabic text-[1.85rem] sm:text-4xl leading-[2.15] text-gray-900 text-end break-words" dir="rtl" lang="ar">
                {{ ayah.arabic }}
              </p>
              <p
                v-if="showTranslation && ayah.translation"
                class="mt-3 text-sm text-gray-500 leading-relaxed border-s-2 border-gray-100 ps-3"
                dir="ltr"
                :lang="translationLang"
              >
                {{ ayah.translation }}
              </p>
            </article>
          </div>

          <!-- Learn / Listen / Custom cards -->
          <div v-else :class="modes.compact || experience === 'listen' ? 'space-y-2' : 'space-y-4 sm:space-y-5'">
            <article
              v-for="ayah in ayahs"
              :id="`ayah-${ayah.verse}`"
              :key="ayah.verse"
              class="ayah-card rounded-2xl border scroll-mt-28"
              :class="[
                experience === 'listen' || modes.compact ? 'p-3 sm:p-4' : 'p-4 sm:p-6',
                experience === 'listen' ? 'ayah-card--listen' : '',
                experience === 'learn' ? 'ayah-card--learn' : '',
                playingVerse === ayah.verse
                  ? 'ayah-card--active border-brand/40 bg-brand-muted/40'
                  : 'border-gray-100 bg-white',
              ]"
            >
              <div class="flex items-center justify-between gap-3 mb-3">
                <span class="inline-flex items-center justify-center min-w-8 h-8 px-2 rounded-full bg-brand-muted text-brand text-xs font-bold tabular-nums">
                  {{ selectedChapter }}:{{ ayah.verse }}
                </span>
                <div class="flex items-center gap-1.5">
                  <button
                    type="button"
                    class="text-xs font-semibold text-gray-400 hover:text-brand px-2 min-h-11"
                    @click="copyShare(ayah.verse)"
                  >
                    {{ t('quran.share') }}
                  </button>
                  <button
                    v-if="modes.player"
                    type="button"
                    class="inline-flex items-center justify-center rounded-full border transition-colors touch-manipulation"
                    :class="[
                      experience === 'listen' ? 'w-12 h-12' : 'w-11 h-11',
                      playingVerse === ayah.verse && isPlaying
                        ? 'border-brand bg-brand text-white'
                        : 'border-gray-200 text-gray-600 hover:border-brand/40 hover:text-brand',
                    ]"
                    :aria-label="playingVerse === ayah.verse && isPlaying ? t('quran.pauseAyah') : t('quran.playAyah')"
                    @click="toggleAyah(ayah.verse)"
                  >
                    <svg class="w-5 h-5" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                      <path v-if="playingVerse === ayah.verse && isPlaying" d="M6 5h4v14H6V5zm8 0h4v14h-4V5z" />
                      <path v-else d="M8 5v14l11-7L8 5z" />
                    </svg>
                  </button>
                </div>
              </div>

              <p
                class="font-arabic leading-[2.05] text-gray-900 text-end mb-3 break-words"
                :class="experience === 'listen' || modes.compact ? 'text-xl sm:text-2xl' : 'text-[1.65rem] sm:text-3xl'"
                dir="rtl"
                lang="ar"
              >
                <template v-if="modes.wordSync && modes.player && ayah.words.length">
                  <span
                    v-for="(word, wi) in ayah.words"
                    :key="`${ayah.verse}-${wi}`"
                    class="quran-word inline rounded-sm px-0.5"
                    :class="playingVerse === ayah.verse && activeWordIndex === wi + 1
                      ? 'quran-word--active bg-brand text-white'
                      : playingVerse === ayah.verse
                        ? 'text-brand/90'
                        : ''"
                  >{{ word }}{{ wi < ayah.words.length - 1 ? ' ' : '' }}</span>
                </template>
                <template v-else>{{ ayah.arabic }}</template>
              </p>

              <p
                v-if="showTranslation && ayah.translation"
                class="text-sm sm:text-base text-gray-600 leading-relaxed break-words"
                :class="experience === 'learn' ? 'font-medium' : ''"
                dir="ltr"
                :lang="translationLang"
              >
                {{ ayah.translation }}
              </p>

              <div
                v-if="modes.tafsir"
                class="mt-3 pt-3 border-t border-gray-100"
              >
                <p class="text-sm font-medium text-brand mb-1">
                  {{ t('quran.tafsir.label') }} · {{ tafsirName }}
                </p>
                <p v-if="tafsirLoadingVerse === ayah.verse" class="text-sm text-gray-400">
                  {{ t('quran.tafsir.loading') }}
                </p>
                <p v-else-if="tafsirMap[ayah.verse]" class="text-sm text-gray-700 leading-relaxed font-arabic" dir="rtl" lang="ar">
                  {{ tafsirMap[ayah.verse] }}
                </p>
                <button
                  v-else
                  type="button"
                  class="text-sm font-semibold text-brand hover:underline"
                  @click="loadTafsir(ayah.verse)"
                >
                  {{ t('quran.tafsir.show') }}
                </button>
              </div>
            </article>
          </div>
        </div>
      </section>
    </div>

    <div
      v-if="modes.player"
      class="quran-dock fixed inset-x-0 bottom-0 z-40 border-t border-brand/10 bg-white/95 backdrop-blur-md
             px-3 pt-2 pb-[max(0.75rem,env(safe-area-inset-bottom))]"
      role="region"
      :aria-label="t('quran.listen')"
    >
      <div
        class="max-w-6xl mx-auto h-1 rounded-full bg-brand/10 overflow-hidden mb-2.5"
        role="progressbar"
        :aria-valuenow="Math.round(progressPct)"
        aria-valuemin="0"
        aria-valuemax="100"
        :aria-label="t('quran.nowPlaying')"
      >
        <div
          class="h-full bg-brand transition-[width] duration-150 ease-out"
          :style="{ width: `${progressPct}%` }"
        />
      </div>
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
          class="quran-play-btn inline-flex items-center justify-center w-14 h-14 rounded-full bg-brand text-white
                 shadow-md shadow-brand/20 touch-manipulation shrink-0 disabled:opacity-40"
          :class="{ 'quran-play-btn--pulse': isPlaying }"
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
          <p class="text-sm text-gray-500 truncate">
            {{ stickySubtitle }}
          </p>
        </div>

        <button
          type="button"
          class="inline-flex items-center justify-center min-h-11 px-2 rounded-xl border text-xs font-semibold shrink-0 touch-manipulation"
          :class="abLoop.start ? 'border-brand bg-brand-muted text-brand' : 'border-gray-200 text-gray-600'"
          :aria-label="abLabel"
          @click="setAbMarker"
        >
          {{ abLabel }}
        </button>

        <button
          type="button"
          class="inline-flex items-center justify-center min-h-11 min-w-11 px-2 rounded-xl border border-gray-200
                 text-sm font-semibold tabular-nums text-gray-700 touch-manipulation shrink-0
                 hover:border-brand/30"
          :aria-label="t('quran.speedLabel')"
          @click="cycleSpeed"
        >
          {{ playbackSpeed === 1 ? '1×' : `${playbackSpeed}×` }}
        </button>

        <button
          type="button"
          class="inline-flex items-center justify-center min-h-11 px-2 rounded-xl border border-gray-200
                 text-xs font-semibold text-gray-700 shrink-0 touch-manipulation"
          :aria-label="sleepLabel"
          @click="cycleSleep"
        >
          {{ sleepLabel }}
        </button>

        <label class="hidden md:flex shrink-0 max-w-[11rem]">
          <span class="sr-only">{{ t('quran.reciterLabel') }}</span>
          <select
            v-model="reciterId"
            class="athar-control text-sm cursor-pointer min-h-11"
          >
            <option v-for="r in visibleReciters" :key="r.id" :value="r.id">
              {{ locale === 'ar' ? r.labelAr : r.label }}
            </option>
          </select>
        </label>
      </div>
    </div>

    <audio
      ref="audioEl"
      preload="none"
      class="hidden"
      @play="onAudioPlay"
      @pause="isPlaying = false"
      @ended="onAudioEnded"
      @error="onAudioError"
      @timeupdate="onTimeUpdate"
    />
  </div>
</template>

<style scoped>
.quran-page {
  background: #f7faf8;
  -webkit-font-smoothing: antialiased;
}

.quran-page--read {
  background: linear-gradient(180deg, #f3f7f4 0%, #eef4f0 100%);
}

.quran-page--listen .quran-dock {
  box-shadow: 0 -12px 40px -24px rgba(11, 61, 46, 0.35);
}

.ayah-card {
  transition: border-color 0.25s ease, background-color 0.25s ease, box-shadow 0.25s ease, transform 0.25s ease;
}

.ayah-card--learn {
  border-inline-start-width: 3px;
  border-inline-start-color: rgba(11, 61, 46, 0.25);
}

.ayah-card--listen {
  background: #fbfcfb;
}

.ayah-card--active {
  box-shadow: 0 12px 32px -18px rgba(11, 61, 46, 0.45);
}

.quran-word {
  transition: color 0.12s ease, background-color 0.12s ease, box-shadow 0.12s ease;
}

.quran-word--active {
  box-shadow: 0 0 0 2px rgba(11, 61, 46, 0.2);
}

.quran-play-btn--pulse {
  animation: quran-pulse 2.2s ease-in-out infinite;
}

@keyframes quran-pulse {
  0%, 100% { box-shadow: 0 10px 24px -8px rgba(11, 61, 46, 0.45); }
  50% { box-shadow: 0 10px 28px -4px rgba(11, 61, 46, 0.65); }
}

@media (prefers-reduced-motion: reduce) {
  .ayah-card,
  .quran-word {
    transition: none;
  }
  .quran-play-btn--pulse {
    animation: none;
  }
}
</style>

<script setup>
import { computed, nextTick, onBeforeUnmount, onMounted, reactive, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { useHead } from '@unhead/vue'
import { useRoute, useRouter, RouterLink } from 'vue-router'
import {
  activeWordAt,
  ayahAudioUrl,
  chapterForJuz,
  chapterForPage,
  experienceFromModes,
  getReciterById,
  loadSavedExperience,
  loadSavedModes,
  loadSavedPosition,
  loadSavedReciterId,
  loadSavedSpeed,
  loadSavedTranslation,
  modesForExperience,
  quranApi,
  quranSharePath,
  QURAN_EDITIONS,
  QURAN_RECITERS,
  QURAN_SLEEP_MINUTES,
  QURAN_SPEEDS,
  resolveInitialModes,
  saveExperience,
  saveModes,
  savePosition,
  saveReciterId,
  saveSpeed,
  saveTranslation,
  splitAyahWords,
  wordSyncIdForReciter,
  wordSyncReciters,
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

const boot = resolveInitialModes(loadSavedExperience(), loadSavedModes())
const modes = reactive({ ...boot.modes })
const experience = ref(boot.experience)
saveModes(modes)
saveExperience(experience.value)

const playbackSpeed = ref(loadSavedSpeed())
const progressPct = ref(0)
const optionsOpen = ref(false)
const jumpJuz = ref(null)
const jumpPage = ref(null)
const juzRefs = ref([])
const pageRefs = ref([])
const abLoop = reactive({ start: null, end: null })
const sleepMinutes = ref(0)
let sleepTimer = null
const shareCopied = ref(false)
let shareCopiedTimer = null

const experienceButtons = computed(() => [
  { key: 'read', label: t('quran.experience.read') },
  { key: 'learn', label: t('quran.experience.learn') },
  { key: 'listen', label: t('quran.experience.listen') },
])

const experienceHint = computed(() => {
  if (experience.value === 'read') return t('quran.experience.readHint')
  if (experience.value === 'listen') return t('quran.experience.listenHint')
  if (experience.value === 'custom') return t('quran.experience.customHint')
  return t('quran.experience.learnHint')
})

const modeButtons = computed(() => [
  { key: 'player', label: t('quran.modes.player') },
  { key: 'wordSync', label: t('quran.modes.wordSync') },
  { key: 'tafsir', label: t('quran.modes.tafsir') },
  { key: 'translation', label: t('quran.modes.translation') },
  { key: 'compact', label: t('quran.modes.compact') },
])

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
const activeWordIndex = ref(null)
const isPlaying = ref(false)
const queueMode = ref(false)
const audioError = ref('')
const timingError = ref('')
const pendingScrollVerse = ref(null)
const chapterTiming = ref(null)
const usingChapterAudio = ref(false)
const tafsirMap = ref({})
const tafsirLoadingVerse = ref(null)
const tafsirName = ref("Al-Sa'di")

const liveStatus = computed(() => {
  if (!isPlaying.value || !playingVerse.value) return ''
  return `${t('quran.nowPlaying')}: ${selectedChapter.value}:${playingVerse.value}`
})

const activeSurah = computed(() => surahs.value.find(s => s.chapter === selectedChapter.value) || null)
const activeReciter = computed(() => getReciterById(reciterId.value))
const showTranslation = computed(() => modes.translation && translationLang.value !== 'none')
const visibleReciters = computed(() =>
  modes.wordSync ? wordSyncReciters() : QURAN_RECITERS,
)

const ayahs = computed(() => {
  const verses = Object.keys(arabicMap.value)
    .map(Number)
    .sort((a, b) => a - b)
  return verses.map(verse => {
    const arabic = arabicMap.value[verse] || ''
    return {
      verse,
      arabic,
      words: splitAyahWords(arabic),
      translation: translationMap.value[verse] || '',
    }
  })
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
  if (playingVerse.value) {
    const wordBit = activeWordIndex.value ? ` · w${activeWordIndex.value}` : ''
    return `${name} · ${selectedChapter.value}:${playingVerse.value}${wordBit}`
  }
  return name
})

const stickySubtitle = computed(() => {
  const label = locale.value === 'ar' ? activeReciter.value.labelAr : activeReciter.value.label
  if (abLoop.start && abLoop.end) {
    return `${t('quran.abLoop')}: ${abLoop.start}–${abLoop.end}`
  }
  if (isPlaying.value) return `${t('quran.listen')} · ${label}`
  return label
})

const abLabel = computed(() => {
  if (abLoop.start && abLoop.end) return `A–B ${abLoop.start}–${abLoop.end}`
  if (abLoop.start) return `A ${abLoop.start}`
  return 'A–B'
})

const sleepLabel = computed(() => {
  if (!sleepMinutes.value) return t('quran.sleepOff')
  return t('quran.sleepN', { n: sleepMinutes.value })
})

function applyModePatch(patch) {
  Object.assign(modes, patch)
  saveModes(modes)
}

function setExperience(exp) {
  experience.value = exp
  saveExperience(exp)
  applyModePatch(modesForExperience(exp))
  syncReciterForWordSync()
  if (!modes.player) stopAudio()
  if (modes.tafsir && playingVerse.value) loadTafsir(playingVerse.value)
}

function syncReciterForWordSync() {
  if (!modes.wordSync) return
  if (!activeReciter.value.wordSyncId) {
    reciterId.value = wordSyncReciters()[0]?.id || QURAN_RECITERS[0].id
    saveReciterId(reciterId.value)
  }
}

function setSpeed(rate) {
  if (!QURAN_SPEEDS.includes(rate)) return
  playbackSpeed.value = rate
  saveSpeed(rate)
  applyPlaybackRate()
}

function cycleSpeed() {
  const idx = QURAN_SPEEDS.indexOf(playbackSpeed.value)
  const next = QURAN_SPEEDS[(idx + 1) % QURAN_SPEEDS.length]
  setSpeed(next)
}

function applyPlaybackRate() {
  const el = audioEl.value
  if (!el) return
  el.playbackRate = playbackSpeed.value
  if ('preservesPitch' in el) el.preservesPitch = true
}

function onAudioPlay() {
  isPlaying.value = true
  applyPlaybackRate()
  updateMediaSession()
}

function toggleMode(key) {
  modes[key] = !modes[key]
  saveModes(modes)
  experience.value = experienceFromModes(modes)
  if (experience.value !== 'custom') saveExperience(experience.value)
  syncReciterForWordSync()
  if (key === 'player' && !modes.player) stopAudio()
  if (key === 'wordSync' && isPlaying.value && playingVerse.value) {
    chapterTiming.value = null
    playVerse(playingVerse.value, { queue: queueMode.value })
  }
  if (key === 'tafsir' && modes.tafsir && playingVerse.value) {
    loadTafsir(playingVerse.value)
  }
}

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
  activeWordIndex.value = null
  isPlaying.value = false
  queueMode.value = false
  usingChapterAudio.value = false
  progressPct.value = 0
}

async function scrollToVerse(verse) {
  await nextTick()
  const el = document.getElementById(`ayah-${verse}`)
  el?.scrollIntoView({ behavior: 'smooth', block: 'center' })
}

async function ensureChapterTiming() {
  if (!selectedChapter.value) return null
  const syncId = wordSyncIdForReciter(reciterId.value)
  if (
    chapterTiming.value?.chapter === selectedChapter.value
    && chapterTiming.value.reciterId === syncId
    && chapterTiming.value.audioUrl
  ) {
    return chapterTiming.value
  }
  timingError.value = ''
  try {
    const timing = await quranApi.getChapterTiming(selectedChapter.value, syncId)
    if (!timing.audioUrl || !timing.verses.length) {
      timingError.value = t('quran.modes.wordSyncUnavailable')
      return null
    }
    chapterTiming.value = { chapter: selectedChapter.value, reciterId: syncId, ...timing }
    return chapterTiming.value
  } catch {
    timingError.value = t('quran.modes.wordSyncUnavailable')
    return null
  }
}

async function playVerse(verse, { queue = false } = {}) {
  const el = audioEl.value
  if (!el || !selectedChapter.value || !modes.player) return
  const target = Number(verse)
  if (!ayahs.value.some(a => a.verse === target)) return
  audioError.value = ''
  queueMode.value = queue
  playingVerse.value = target
  activeWordIndex.value = null
  savePosition(selectedChapter.value, target)
  syncShareQuery(target)

  if (modes.wordSync) {
    const timing = await ensureChapterTiming()
    if (timing?.audioUrl) {
      const vt = timing.verses.find(v => v.verse === target)
      usingChapterAudio.value = true
      const needLoad = !el.src || !el.src.includes(timing.audioUrl.split('/').pop())
      if (needLoad) {
        el.src = timing.audioUrl
        await new Promise((resolve) => {
          const onMeta = () => {
            el.removeEventListener('loadedmetadata', onMeta)
            resolve()
          }
          el.addEventListener('loadedmetadata', onMeta)
          el.load()
        })
      }
      if (vt) el.currentTime = Math.max(0, vt.timestampFrom / 1000)
      try {
        applyPlaybackRate()
        await el.play()
        isPlaying.value = true
        scrollToVerse(target)
        if (modes.tafsir) loadTafsir(target)
        updateMediaSession()
      } catch {
        isPlaying.value = false
        audioError.value = t('quran.audioError')
      }
      return
    }
    usingChapterAudio.value = false
  }

  usingChapterAudio.value = false
  el.src = ayahAudioUrl(selectedChapter.value, target, activeReciter.value)
  try {
    applyPlaybackRate()
    await el.play()
    isPlaying.value = true
    scrollToVerse(target)
    if (modes.tafsir) loadTafsir(target)
    updateMediaSession()
  } catch {
    isPlaying.value = false
    audioError.value = t('quran.audioError')
  }
}

function onTimeUpdate() {
  const el = audioEl.value
  if (!el) return

  if (usingChapterAudio.value && chapterTiming.value && playingVerse.value != null) {
    const vt = chapterTiming.value.verses.find(v => v.verse === playingVerse.value)
    if (vt) {
      const span = Math.max(1, vt.timestampTo - vt.timestampFrom)
      const ms = el.currentTime * 1000
      progressPct.value = Math.min(100, Math.max(0, ((ms - vt.timestampFrom) / span) * 100))
    }
  } else if (el.duration && Number.isFinite(el.duration)) {
    progressPct.value = Math.min(100, Math.max(0, (el.currentTime / el.duration) * 100))
  }

  if (!usingChapterAudio.value || !chapterTiming.value) return
  const ms = el.currentTime * 1000

  if (!queueMode.value && playingVerse.value != null) {
    const vt = chapterTiming.value.verses.find(v => v.verse === playingVerse.value)
    if (vt && ms >= vt.timestampTo - 40) {
      if (abLoop.start && abLoop.end && playingVerse.value === abLoop.end) {
        playVerse(abLoop.start, { queue: true })
        return
      }
      el.pause()
      isPlaying.value = false
      activeWordIndex.value = null
      progressPct.value = 100
      return
    }
  }

  const hit = activeWordAt(ms, chapterTiming.value.verses)
  if (!hit) return
  if (hit.verse && hit.verse !== playingVerse.value) {
    if (abLoop.start && abLoop.end && hit.verse > abLoop.end) {
      playVerse(abLoop.start, { queue: true })
      return
    }
    playingVerse.value = hit.verse
    savePosition(selectedChapter.value, hit.verse)
    scrollToVerse(hit.verse)
    if (modes.tafsir) loadTafsir(hit.verse)
  }
  activeWordIndex.value = hit.wordIndex
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

function goJuz() {
  const n = Number(jumpJuz.value)
  if (!n || n < 1 || n > 30) return
  const chapter = chapterForJuz(juzRefs.value, n)
  if (chapter) selectChapter(chapter)
}

function goPage() {
  const n = Number(jumpPage.value)
  if (!n || n < 1 || n > 604) return
  const chapter = chapterForPage(pageRefs.value, n)
  if (chapter) selectChapter(chapter)
}

function setAbMarker() {
  const v = playingVerse.value || 1
  if (!abLoop.start) {
    abLoop.start = v
    abLoop.end = null
    return
  }
  if (!abLoop.end) {
    abLoop.end = Math.max(abLoop.start, v)
    queueMode.value = true
    return
  }
  abLoop.start = null
  abLoop.end = null
}

function cycleSleep() {
  const idx = QURAN_SLEEP_MINUTES.indexOf(sleepMinutes.value)
  sleepMinutes.value = QURAN_SLEEP_MINUTES[(idx + 1) % QURAN_SLEEP_MINUTES.length]
  if (sleepTimer) {
    clearTimeout(sleepTimer)
    sleepTimer = null
  }
  if (sleepMinutes.value > 0) {
    sleepTimer = setTimeout(() => {
      stopAudio()
      sleepMinutes.value = 0
    }, sleepMinutes.value * 60 * 1000)
  }
}

async function copyShare(verse) {
  const path = quranSharePath(selectedChapter.value, verse)
  const url = `${SEO_ORIGIN}${path}`
  try {
    await navigator.clipboard.writeText(url)
    shareCopied.value = true
    if (shareCopiedTimer) clearTimeout(shareCopiedTimer)
    shareCopiedTimer = setTimeout(() => { shareCopied.value = false }, 2000)
  } catch {
    /* ignore */
  }
  syncShareQuery(verse)
}

function syncShareQuery(verse) {
  if (!selectedChapter.value) return
  router.replace({
    name: 'quran',
    query: {
      surah: String(selectedChapter.value),
      ...(verse ? { ayah: String(verse) } : {}),
    },
  })
}

function updateMediaSession() {
  if (typeof navigator === 'undefined' || !('mediaSession' in navigator)) return
  const name = activeSurah.value?.englishname || activeSurah.value?.name || 'Quran'
  navigator.mediaSession.metadata = new MediaMetadata({
    title: playingVerse.value ? `${name} ${selectedChapter.value}:${playingVerse.value}` : name,
    artist: activeReciter.value.label,
    album: "Athar Al 'Ilm",
  })
  navigator.mediaSession.setActionHandler('play', () => toggleStickyPlay())
  navigator.mediaSession.setActionHandler('pause', () => {
    audioEl.value?.pause()
    isPlaying.value = false
  })
  navigator.mediaSession.setActionHandler('previoustrack', () => stepAyah(-1))
  navigator.mediaSession.setActionHandler('nexttrack', () => stepAyah(1))
}

function onAudioEnded() {
  if (abLoop.start && abLoop.end) {
    playVerse(abLoop.start, { queue: true })
    return
  }
  if (usingChapterAudio.value) {
    stopAudio()
    return
  }
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

async function loadTafsir(verse) {
  if (!selectedChapter.value || !modes.tafsir) return
  if (tafsirMap.value[verse]) return
  tafsirLoadingVerse.value = verse
  try {
    const result = await quranApi.getTafsir(selectedChapter.value, verse)
    tafsirName.value = result.name || tafsirName.value
    tafsirMap.value = { ...tafsirMap.value, [verse]: result.text }
  } catch {
    tafsirMap.value = { ...tafsirMap.value, [verse]: t('quran.tafsir.error') }
  } finally {
    tafsirLoadingVerse.value = null
  }
}

async function loadInfo() {
  infoLoading.value = true
  infoError.value = ''
  try {
    const data = await quranApi.getInfo()
    surahs.value = data.chapters || []
    juzRefs.value = data.juzs?.references || []
    pageRefs.value = data.pages?.references || []

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
  chapterTiming.value = null
  tafsirMap.value = {}
  ayahLoading.value = true
  ayahError.value = ''
  try {
    const requests = [
      quranApi.getChapter(QURAN_EDITIONS.ar.id, selectedChapter.value),
    ]
    if (showTranslation.value) {
      const edition = QURAN_EDITIONS[translationLang.value] || QURAN_EDITIONS.en
      requests.push(quranApi.getChapter(edition.id, selectedChapter.value))
    }
    const [ar, tr] = await Promise.all(requests)
    arabicMap.value = chapterToMap(ar)
    translationMap.value = tr ? chapterToMap(tr) : {}

    if (modes.wordSync && modes.player) {
      ensureChapterTiming()
    }

    const scrollTo = pendingScrollVerse.value
    pendingScrollVerse.value = null
    if (scrollTo) {
      await nextTick()
      scrollToVerse(scrollTo)
      savePosition(selectedChapter.value, scrollTo)
      if (modes.tafsir) loadTafsir(scrollTo)
    } else {
      savePosition(selectedChapter.value, 1)
      if (modes.tafsir) loadTafsir(1)
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
  jumpJuz.value = null
  jumpPage.value = null
  syncShareQuery(1)
}

function onKeydown(e) {
  const tag = (e.target?.tagName || '').toLowerCase()
  if (tag === 'input' || tag === 'textarea' || tag === 'select' || e.target?.isContentEditable) return
  if (e.code === 'Space' && modes.player) {
    e.preventDefault()
    toggleStickyPlay()
    return
  }
  if (e.code === 'ArrowLeft') {
    e.preventDefault()
    stepAyah(-1)
    return
  }
  if (e.code === 'ArrowRight') {
    e.preventDefault()
    stepAyah(1)
  }
}

watch(reciterId, (id) => {
  saveReciterId(id)
  chapterTiming.value = null
  if (isPlaying.value && playingVerse.value) {
    playVerse(playingVerse.value, { queue: queueMode.value })
  }
})

watch(translationLang, (lang) => {
  saveTranslation(lang)
})

watch([selectedChapter, translationLang, () => modes.translation], () => {
  loadAyahs()
})

watch(playingVerse, (verse) => {
  if (verse != null && selectedChapter.value) {
    savePosition(selectedChapter.value, verse)
  }
})

onMounted(() => {
  syncReciterForWordSync()
  loadInfo()
  window.addEventListener('keydown', onKeydown)
})

onBeforeUnmount(() => {
  stopAudio()
  window.removeEventListener('keydown', onKeydown)
  if (sleepTimer) clearTimeout(sleepTimer)
  if (shareCopiedTimer) clearTimeout(shareCopiedTimer)
})
</script>
