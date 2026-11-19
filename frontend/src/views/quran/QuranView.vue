<template>
  <!-- Pattern: Split Pane -->
  <div
    class="quran-page min-h-screen overflow-x-hidden"
    :class="[
      modes.player
        ? 'pb-[calc(7rem+env(safe-area-inset-bottom))] sm:pb-28'
        : 'pb-10',
      `quran-page--${experience}`,
    ]"
  >
    <div class="max-w-6xl mx-auto px-4 sm:px-6 pt-5 pb-2 sm:pt-8 sm:pb-4">
      <div class="flex items-baseline justify-between gap-3 mb-4">
        <div class="min-w-0">
          <h1 class="text-xl sm:text-2xl font-semibold text-gray-900 tracking-tight text-balance">
            {{ t('quran.title') }}
          </h1>
          <p class="mt-0.5 text-sm text-gray-500 max-w-lg text-pretty">
            {{ experienceHint }}
          </p>
        </div>
        <RouterLink
          to="/quran/dua"
          class="shrink-0 text-sm font-medium text-brand/80 hover:text-brand min-h-11 inline-flex items-center"
        >
          {{ t('quran.dua.nav') }}
        </RouterLink>
      </div>

      <div
        class="w-full p-0.5 rounded-xl bg-gray-100/80 flex gap-0.5"
        role="tablist"
        :aria-label="t('quran.experience.label')"
      >
        <button
          v-for="exp in experienceButtons"
          :key="exp.key"
          type="button"
          role="tab"
          class="flex-1 inline-flex items-center justify-center min-h-10 px-2 sm:px-3 rounded-lg text-sm font-medium
                 transition-colors duration-150 touch-manipulation"
          :class="experience === exp.key
            ? 'bg-white text-gray-900 shadow-sm'
            : 'text-gray-600 hover:text-gray-900'"
          :aria-selected="experience === exp.key ? 'true' : 'false'"
          @click="setExperience(exp.key)"
        >
          {{ exp.label }}
        </button>
      </div>
      <p v-if="experience === 'custom'" class="mt-2 text-sm text-amber-700">
        {{ t('quran.experience.customHint') }}
      </p>

      <div class="mt-4 flex items-end gap-2 min-w-0">
        <label v-if="modes.player" class="flex flex-col gap-1 min-w-0 flex-1">
          <span class="text-xs font-medium text-gray-500">{{ t('quran.reciterLabel') }}</span>
          <div class="athar-control !p-0 flex items-center overflow-hidden">
            <select
              id="quran-reciter"
              v-model="reciterId"
              class="w-full min-h-11 bg-transparent border-0 text-base text-gray-800 rounded-xl
                     px-3 focus:outline-none focus:ring-0 cursor-pointer"
            >
              <option v-for="r in visibleReciters" :key="r.id" :value="r.id">
                {{ locale === 'ar' ? r.labelAr : r.label }}
              </option>
            </select>
          </div>
        </label>

        <button
          type="button"
          class="inline-flex items-center justify-center min-h-11 min-w-11 rounded-xl text-xs font-semibold
                 tracking-wide touch-manipulation shrink-0 transition-colors"
          :class="translationLang === 'none'
            ? 'border border-gray-200 text-gray-600 hover:border-brand/30 hover:text-brand'
            : 'bg-brand text-white'"
          :aria-label="`${translationToggleLabel}: ${translationToggleTitle}`"
          :aria-pressed="translationLang !== 'none' ? 'true' : 'false'"

          @click="cycleTranslationLang"
        >
          {{ translationToggleLabel }}
        </button>

        <button
          type="button"
          class="inline-flex items-center justify-center min-h-11 min-w-11 rounded-xl border border-gray-200
                 text-gray-600 hover:border-brand/30 hover:text-brand touch-manipulation shrink-0"
          :class="optionsOpen ? 'border-brand/40 bg-brand-muted text-brand' : ''"
          :aria-expanded="optionsOpen ? 'true' : 'false'"
          :aria-label="t('quran.optionsMore')"
          @click="optionsOpen = !optionsOpen"
        >
          <svg class="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" aria-hidden="true">
            <path d="M4 7h10M14 7a2 2 0 1 0 4 0 2 2 0 0 0-4 0ZM4 17h6M10 17a2 2 0 1 0 4 0 2 2 0 0 0-4 0ZM20 17h-6M20 7h-2" stroke-linecap="round" />
          </svg>
        </button>
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
        <p v-if="modes.wordSync && modes.player" class="mt-2 text-sm text-gray-400 text-pretty">
          {{ t('quran.modes.wordSyncHint') }}
        </p>
      </div>
      <p class="sr-only" role="status" aria-live="polite">{{ liveStatus }}</p>
    </div>

    <div class="max-w-6xl mx-auto px-4 sm:px-6 pb-8 grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8">
      <aside class="relative lg:col-span-4 xl:col-span-3">
        <button
          type="button"
          class="lg:hidden w-full min-h-12 inline-flex items-center justify-between gap-3 rounded-xl
                 border border-gray-200 bg-white px-4 text-sm font-semibold text-gray-800"
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
          v-if="surahDrawerOpen"
          class="lg:hidden fixed inset-0 z-30 bg-black/20"
          aria-hidden="true"
          @click="surahDrawerOpen = false"
        />

        <div
          class="border border-gray-100 rounded-2xl overflow-hidden bg-white lg:bg-gray-50/60 lg:sticky lg:top-28"
          :class="surahDrawerOpen
            ? 'absolute z-40 inset-x-0 top-full mt-1 max-h-[min(70vh,28rem)] shadow-xl block'
            : 'hidden lg:block'"
        >
          <div class="px-3 py-2.5 border-b border-gray-100 bg-white">
            <p class="text-xs font-semibold uppercase tracking-wide text-gray-400 px-1">{{ t('quran.surahs') }}</p>
            <details class="mt-2 group">
              <summary class="cursor-pointer select-none text-xs font-medium text-gray-500 px-1 py-1 hover:text-gray-700">
                {{ t('quran.juz') }} / {{ t('quran.page') }}
              </summary>
              <div class="mt-2 grid grid-cols-2 gap-2">
                <label class="min-w-0 flex flex-col gap-1">
                  <span class="sr-only">{{ t('quran.juz') }}</span>
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
                  <span class="sr-only">{{ t('quran.page') }}</span>
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
            </details>
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
                  class="w-8 h-8 rounded-lg text-xs font-semibold flex items-center justify-center shrink-0"
                  :class="selectedChapter === s.chapter ? 'bg-brand text-white' : 'bg-white border border-gray-200 text-gray-500'"
                >
                  {{ s.chapter }}
                </span>
                <span class="min-w-0 flex-1">
                  <span class="block text-sm font-semibold truncate">{{ s.englishname || s.name }}</span>
                  <span class="block text-xs text-gray-400 truncate font-arabic" dir="rtl">{{ s.arabicname }}</span>
                </span>
                <span class="text-xs text-gray-400 shrink-0 tabular-nums">{{ verseCount(s) }}</span>
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
          <header class="mb-4 flex flex-wrap items-center justify-between gap-3">
            <div class="min-w-0">
              <h2 class="text-xl font-semibold text-gray-900 truncate">
                {{ activeSurah?.englishname || activeSurah?.name }}
                <span class="ms-2 text-base font-normal text-gray-500 font-arabic" dir="rtl">{{ activeSurah?.arabicname }}</span>
              </h2>
              <p class="text-xs text-gray-400 mt-0.5">
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
                <span class="text-xs font-semibold text-brand/70 tabular-nums">{{ selectedChapter }}:{{ ayah.verse }}</span>
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
          <div v-else :class="modes.compact || experience === 'listen' ? 'space-y-1.5' : 'space-y-3'">
            <article
              v-for="ayah in ayahs"
              :id="`ayah-${ayah.verse}`"
              :key="ayah.verse"
              class="ayah-card rounded-xl scroll-mt-28"
              :class="[
                experience === 'listen' || modes.compact ? 'px-3 py-2.5 sm:px-4' : 'px-4 py-3.5 sm:px-5 sm:py-4',
                experience === 'listen' ? 'ayah-card--listen' : '',
                experience === 'learn' ? 'ayah-card--learn border border-transparent' : 'border border-transparent',
                playingVerse === ayah.verse
                  ? 'ayah-card--active bg-brand-muted/35'
                  : 'bg-white/70 hover:bg-white',
              ]"
            >
              <div class="flex items-center justify-between gap-3 mb-2">
                <span class="text-xs font-semibold text-gray-400 tabular-nums">
                  {{ selectedChapter }}:{{ ayah.verse }}
                </span>
                <div class="flex items-center gap-0.5">
                  <button
                    type="button"
                    class="text-xs text-gray-400 hover:text-brand px-2 min-h-10 opacity-70 hover:opacity-100"
                    @click="copyShare(ayah.verse)"
                  >
                    {{ t('quran.share') }}
                  </button>
                  <button
                    v-if="modes.player"
                    type="button"
                    class="inline-flex items-center justify-center min-h-11 min-w-11 w-11 h-11 rounded-full transition-colors touch-manipulation"
                    :class="playingVerse === ayah.verse && isPlaying
                        ? 'bg-brand text-white'
                        : 'text-gray-500 hover:bg-gray-100 hover:text-brand'"
                    :aria-label="playingVerse === ayah.verse && isPlaying ? t('quran.pauseAyah') : t('quran.playAyah')"
                    @click="toggleAyah(ayah.verse)"
                  >
                    <svg class="w-4 h-4" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
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
                    :class="wordClass(ayah.verse, wi + 1)"
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
      class="quran-dock fixed inset-x-0 bottom-0 z-40 border-t border-gray-200/80 bg-white/95 backdrop-blur-md
             px-3 pt-1.5 pb-[max(0.5rem,env(safe-area-inset-bottom))] transition-colors"
      :class="experience === 'practice' ? practicePanelClass : ''"
      role="region"
      :aria-label="experience === 'practice' ? t('quran.experience.practice') : t('quran.listen')"
    >
      <p v-if="experience === 'practice'" class="sr-only">{{ t('quran.practice.advisory') }}</p>
      <div
        class="max-w-6xl mx-auto h-0.5 rounded-full bg-gray-100 overflow-hidden mb-2"
        role="progressbar"
        :aria-valuenow="Math.round(experience === 'practice' && practicePhase === 'recording' ? practiceLevel * 100 : progressPct)"
        aria-valuemin="0"
        aria-valuemax="100"
        :aria-label="experience === 'practice' && practicePhase === 'recording' ? t('quran.practice.level') : t('quran.nowPlaying')"
      >
        <div
          class="h-full transition-[width] duration-75 ease-out"
          :class="experience === 'practice' && practicePhase === 'recording' ? 'bg-red-600' : 'bg-brand duration-150'"
          :style="{ width: `${experience === 'practice' && practicePhase === 'recording'
            ? Math.max(4, Math.round(practiceLevel * 100))
            : progressPct}%` }"
        />
      </div>

      <div class="max-w-6xl mx-auto flex items-center gap-1.5 sm:gap-2 min-w-0">
        <button
          type="button"
          class="inline-flex items-center justify-center min-h-11 min-w-11 w-11 h-11 rounded-full text-gray-500
                 touch-manipulation disabled:opacity-35 shrink-0 hover:bg-gray-100"
          :aria-label="t('quran.prevAyah')"
          :disabled="!playingVerse || playingVerse <= 1 || practiceBlocksNav"
          @click="stepAyah(-1)"
        >
          <svg class="w-4 h-4 rtl:rotate-180" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
            <path d="M15 18l-6-6 6-6" stroke-linecap="round" stroke-linejoin="round" />
          </svg>
        </button>

        <button
          type="button"
          class="quran-play-btn inline-flex items-center justify-center w-12 h-12 rounded-full
                 touch-manipulation shrink-0 disabled:opacity-40"
          :class="dockPrimaryIsMic
            ? (practicePhase === 'recording'
              ? (practiceSpeaking ? 'practice-mic practice-mic--hot bg-red-600 text-white' : 'practice-mic bg-red-500 text-white')
              : 'bg-brand text-white')
            : 'bg-brand text-white'"
          :aria-label="dockPrimaryLabel"
          :disabled="!dockPrimaryEnabled"
          @click="onDockPrimary"
        >
          <svg v-if="dockPrimaryIsMic" class="w-5 h-5" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
            <path d="M12 14a3 3 0 0 0 3-3V6a3 3 0 1 0-6 0v5a3 3 0 0 0 3 3zm5-3a5 5 0 0 1-10 0H5a7 7 0 0 0 6 6.92V21h2v-3.08A7 7 0 0 0 19 11h-2z" />
          </svg>
          <svg v-else class="w-5 h-5" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
            <path v-if="isPlaying" d="M6 5h4v14H6V5zm8 0h4v14h-4V5z" />
            <path v-else d="M8 5v14l11-7L8 5z" />
          </svg>
        </button>

        <button
          type="button"
          class="inline-flex items-center justify-center min-h-11 min-w-11 w-11 h-11 rounded-full text-gray-500
                 touch-manipulation disabled:opacity-35 shrink-0 hover:bg-gray-100"
          :aria-label="t('quran.nextAyah')"
          :disabled="!playingVerse || playingVerse >= ayahs.length || !canAdvancePractice"
          @click="stepAyah(1)"
        >
          <svg class="w-4 h-4 rtl:rotate-180" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
            <path d="M9 18l6-6-6-6" stroke-linecap="round" stroke-linejoin="round" />
          </svg>
        </button>

        <div
          class="min-w-0 flex-1 ps-1"
          :role="experience === 'practice' ? 'status' : undefined"
          :aria-live="experience === 'practice' && practicePhase === 'recording' ? 'assertive' : 'polite'"
        >
          <p class="text-sm font-medium text-gray-900 truncate">
            {{ stickyTitle }}
          </p>
          <p
            class="text-xs truncate"
            :class="practiceError && experience === 'practice' ? 'text-red-700' : 'text-gray-500'"
            :title="experience === 'practice' ? t('quran.practice.advisory') : undefined"
          >
            {{ dockSubtitle }}
          </p>
        </div>

        <button
          type="button"
          class="inline-flex items-center justify-center min-h-10 min-w-10 px-2 rounded-lg
                 text-sm font-medium tabular-nums text-gray-600 touch-manipulation shrink-0
                 hover:bg-gray-100"
          :aria-label="t('quran.speedLabel')"
          @click="cycleSpeed"
        >
          {{ playbackSpeed === 1 ? '1×' : `${playbackSpeed}×` }}
        </button>

        <button
          type="button"
          class="inline-flex items-center justify-center min-h-10 min-w-10 rounded-lg text-gray-500
                 touch-manipulation shrink-0 hover:bg-gray-100"
          :class="dockToolsOpen ? 'bg-gray-100 text-gray-800' : ''"
          :aria-expanded="dockToolsOpen ? 'true' : 'false'"
          :aria-label="t('quran.optionsMore')"
          @click="dockToolsOpen = !dockToolsOpen"
        >
          <svg class="w-5 h-5" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
            <circle cx="6" cy="12" r="1.6" />
            <circle cx="12" cy="12" r="1.6" />
            <circle cx="18" cy="12" r="1.6" />
          </svg>
        </button>
      </div>

      <div
        v-if="dockToolsOpen"
        class="max-w-6xl mx-auto mt-1.5 flex flex-wrap items-center gap-2 pb-0.5"
      >
        <button
          type="button"
          class="inline-flex items-center justify-center min-h-10 px-3 rounded-lg text-xs font-semibold touch-manipulation"
          :class="abLoop.start ? 'bg-brand-muted text-brand' : 'bg-gray-100 text-gray-600'"
          :aria-label="abLabel"
          @click="setAbMarker"
        >
          {{ abLabel }}
        </button>
        <button
          type="button"
          class="inline-flex items-center justify-center min-h-10 px-3 rounded-lg bg-gray-100
                 text-xs font-semibold text-gray-600 touch-manipulation"
          :aria-label="sleepLabel"
          @click="cycleSleep"
        >
          {{ sleepLabel }}
        </button>
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
  box-shadow: none;
}

.quran-word {
  transition: color 0.12s ease, background-color 0.12s ease;
}

.practice-mic--hot {
  animation: practice-mic-pulse 0.9s ease-in-out infinite;
}

.practice-panel--live {
  outline: 1px solid rgba(220, 38, 38, 0.2);
}

@keyframes practice-mic-pulse {
  0%, 100% { transform: scale(1); }
  50% { transform: scale(1.04); }
}

@media (prefers-reduced-motion: reduce) {
  .ayah-card,
  .quran-word {
    transition: none;
  }
  .practice-mic--hot {
    animation: none;
  }
}
</style>

<script setup>
import { computed, nextTick, onBeforeUnmount, onMounted, reactive, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { useSeo, SEO_ORIGIN } from '@/composables/useSeo'
import { useRoute, useRouter, RouterLink } from 'vue-router'
import {
  activeWordAt,
  ayahAudioUrl,
  chapterForJuz,
  chapterForPage,
  correctionMatchesTarget,
  experienceFromModes,
  getReciterById,
  loadSavedExperience,
  loadSavedModes,
  loadSavedPosition,
  loadSavedReciterId,
  loadSavedSpeed,
  loadSavedTranslation,
  modesForExperience,
  matchSpokenWords,
  practiceAdvanceAllowed,
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
  spanBoundsFromWordIndices,
  splitAyahWords,
  wordIndicesFromMuaalemErrors,
  wordSyncIdForReciter,
  wordSyncReciters,
} from '@/api/quran'

const { t, locale } = useI18n({ useScope: 'global' })
const route = useRoute()
const router = useRouter()

useSeo(() => {
  const title = t('quran.title')
  const description = t('quran.subtitle')
  const url = `${SEO_ORIGIN}/quran`
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

const boot = resolveInitialModes(loadSavedExperience(), loadSavedModes())
const modes = reactive({ ...boot.modes })
const experience = ref(boot.experience)
saveModes(modes)
saveExperience(experience.value)

const playbackSpeed = ref(loadSavedSpeed())
const progressPct = ref(0)
const optionsOpen = ref(false)
const dockToolsOpen = ref(false)
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
  { key: 'practice', label: t('quran.experience.practice') },
])

const experienceHint = computed(() => {
  if (experience.value === 'read') return t('quran.experience.readHint')
  if (experience.value === 'listen') return t('quran.experience.listenHint')
  if (experience.value === 'practice') return t('quran.experience.practiceHint')
  if (experience.value === 'custom') return t('quran.experience.customHint')
  return t('quran.experience.learnHint')
})

const practicePhase = ref('idle')
const practiceError = ref('')
const practiceWrongWords = ref([])
const practiceHeardWords = ref([])
const practiceSpokenWord = ref(null)
const practiceLevel = ref(0)
const practiceSpeaking = ref(false)
const practiceCleared = reactive({})
const spanPauseAtMs = ref(null)
let mediaRecorder = null
let recordChunks = []
let practiceAudioCtx = null
let practiceAnalyser = null
let practiceLevelRaf = 0
let practiceSilenceTimer = null
let practiceHadSpeech = false
let practiceSpeechRec = null
let practiceAdvanceTimer = null
let practiceAutoRecordTimer = null

const SILENCE_MS = 1200
const SPEAK_LEVEL = 0.08

const practiceBlocksNav = computed(() => (
  experience.value === 'practice'
  && ['listening', 'recording', 'checking', 'correcting'].includes(practicePhase.value)
))

const canAdvancePractice = computed(() => {
  if (experience.value !== 'practice') return true
  const v = playingVerse.value
  if (v == null) return false
  return practiceAdvanceAllowed(practiceCleared[v] === true)
})

const canRecordPractice = computed(() => (
  experience.value === 'practice'
  && playingVerse.value != null
  && ['awaiting_repeat', 'clear', 'recording'].includes(practicePhase.value)
))

const practicePanelClass = computed(() => {
  if (practicePhase.value === 'recording') {
    return practiceSpeaking.value
      ? 'bg-red-50 practice-panel--live'
      : 'bg-red-50/70'
  }
  if (practicePhase.value === 'clear') return 'bg-emerald-50/80'
  if (practicePhase.value === 'correcting' || practiceWrongWords.value.length) {
    return 'bg-amber-50/80'
  }
  if (practicePhase.value === 'checking') return 'bg-brand-muted/50'
  return 'bg-gray-50'
})

const practiceStatusText = computed(() => {
  if (practiceError.value && (practicePhase.value === 'awaiting_repeat' || practicePhase.value === 'idle')) {
    return t('quran.practice.status.retry')
  }
  switch (practicePhase.value) {
    case 'listening':
      return t('quran.practice.status.listening')
    case 'awaiting_repeat':
      return t('quran.practice.status.awaiting')
    case 'recording':
      return practiceSpeaking.value
        ? t('quran.practice.status.speaking')
        : t('quran.practice.status.recording')
    case 'checking':
      return t('quran.practice.status.checking')
    case 'correcting':
      return t('quran.practice.status.correcting')
    case 'clear':
      return t('quran.practice.status.clear')
    default:
      return t('quran.practice.status.idle')
  }
})

function wordClass(verse, wordIndex) {
  if (experience.value === 'practice' && playingVerse.value === verse) {
    if (practiceWrongWords.value.includes(wordIndex)) {
      return 'quran-word--wrong bg-amber-200 text-amber-950'
    }
    if (practicePhase.value === 'recording' || practicePhase.value === 'checking') {
      if (practiceSpokenWord.value === wordIndex) {
        return 'quran-word--spoken bg-red-600 text-white'
      }
      if (practiceHeardWords.value.includes(wordIndex)) {
        return 'quran-word--heard bg-emerald-100 text-emerald-900'
      }
    }
    if (practicePhase.value === 'clear' && practiceHeardWords.value.includes(wordIndex)) {
      return 'quran-word--heard bg-emerald-100 text-emerald-900'
    }
  }
  const active = playingVerse.value === verse && activeWordIndex.value === wordIndex
  if (active) return 'quran-word--active bg-brand text-white'
  if (playingVerse.value === verse) return 'text-brand/90'
  return ''
}

function resetPracticeState() {
  clearPracticeTimers()
  stopPracticeSpeechRec()
  stopPracticeLevelMeter()
  practicePhase.value = 'idle'
  practiceError.value = ''
  practiceWrongWords.value = []
  practiceHeardWords.value = []
  practiceSpokenWord.value = null
  practiceLevel.value = 0
  practiceSpeaking.value = false
  spanPauseAtMs.value = null
  stopPracticeRecorder()
}

function clearPracticeTimers() {
  if (practiceSilenceTimer) {
    clearTimeout(practiceSilenceTimer)
    practiceSilenceTimer = null
  }
  if (practiceAdvanceTimer) {
    clearTimeout(practiceAdvanceTimer)
    practiceAdvanceTimer = null
  }
  if (practiceAutoRecordTimer) {
    clearTimeout(practiceAutoRecordTimer)
    practiceAutoRecordTimer = null
  }
}

function enterAwaitingRepeat() {
  if (experience.value !== 'practice') return
  practicePhase.value = 'awaiting_repeat'
  spanPauseAtMs.value = null
  practiceHeardWords.value = []
  practiceSpokenWord.value = null
  // Auto-open mic so the learner gets immediate speaking feedback.
  if (practiceAutoRecordTimer) clearTimeout(practiceAutoRecordTimer)
  practiceAutoRecordTimer = setTimeout(() => {
    if (practicePhase.value === 'awaiting_repeat') togglePracticeRecord()
  }, 350)
}

function onPracticeListenFinished() {
  if (experience.value !== 'practice') return
  if (practicePhase.value === 'listening' || practicePhase.value === 'correcting') {
    enterAwaitingRepeat()
  }
}

function replayCurrentForPractice() {
  const v = playingVerse.value || ayahs.value[0]?.verse
  if (v == null) return
  clearPracticeTimers()
  stopPracticeSpeechRec()
  stopPracticeLevelMeter()
  stopPracticeRecorder()
  if (practiceCleared[v]) delete practiceCleared[v]
  practiceWrongWords.value = []
  practiceHeardWords.value = []
  practiceSpokenWord.value = null
  practiceError.value = ''
  playVerse(v, { queue: false })
}

async function togglePracticeRecord() {
  if (practicePhase.value === 'recording') {
    stopPracticeRecorder(true)
    return
  }
  practiceError.value = ''
  practiceWrongWords.value = []
  practiceHeardWords.value = []
  practiceSpokenWord.value = null
  practiceHadSpeech = false
  try {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
    recordChunks = []
    const mime = MediaRecorder.isTypeSupported('audio/webm;codecs=opus')
      ? 'audio/webm;codecs=opus'
      : 'audio/webm'
    mediaRecorder = new MediaRecorder(stream, { mimeType: mime })
    mediaRecorder.ondataavailable = (e) => {
      if (e.data?.size) recordChunks.push(e.data)
    }
    mediaRecorder.onstop = async () => {
      stopPracticeSpeechRec()
      stopPracticeLevelMeter()
      stream.getTracks().forEach((tr) => tr.stop())
      const blob = new Blob(recordChunks, { type: mime })
      recordChunks = []
      mediaRecorder = null
      await checkPracticeRecording(blob)
    }
    // no timeslice: one complete webm/mp4 for decodeAudioData → WAV
    mediaRecorder.start()
    practicePhase.value = 'recording'
    startPracticeLevelMeter(stream)
    startPracticeSpeechRec()
  } catch {
    practiceError.value = t('quran.practice.micError')
    practicePhase.value = 'awaiting_repeat'
  }
}

function startPracticeLevelMeter(stream) {
  stopPracticeLevelMeter()
  try {
    const Ctx = window.AudioContext || window.webkitAudioContext
    if (!Ctx) return
    practiceAudioCtx = new Ctx()
    const source = practiceAudioCtx.createMediaStreamSource(stream)
    practiceAnalyser = practiceAudioCtx.createAnalyser()
    practiceAnalyser.fftSize = 512
    source.connect(practiceAnalyser)
    const data = new Uint8Array(practiceAnalyser.fftSize)
    const tick = () => {
      if (!practiceAnalyser || practicePhase.value !== 'recording') return
      practiceAnalyser.getByteTimeDomainData(data)
      let sum = 0
      for (let i = 0; i < data.length; i += 1) {
        const v = (data[i] - 128) / 128
        sum += v * v
      }
      const rms = Math.sqrt(sum / data.length)
      practiceLevel.value = Math.min(1, rms * 3.2)
      const speaking = practiceLevel.value >= SPEAK_LEVEL
      practiceSpeaking.value = speaking
      if (speaking) {
        practiceHadSpeech = true
        if (practiceSilenceTimer) {
          clearTimeout(practiceSilenceTimer)
          practiceSilenceTimer = null
        }
      } else if (practiceHadSpeech && !practiceSilenceTimer) {
        practiceSilenceTimer = setTimeout(() => {
          if (practicePhase.value === 'recording') stopPracticeRecorder(true)
        }, SILENCE_MS)
      }
      practiceLevelRaf = requestAnimationFrame(tick)
    }
    practiceLevelRaf = requestAnimationFrame(tick)
  } catch {
    /* meter optional */
  }
}

function stopPracticeLevelMeter() {
  if (practiceLevelRaf) {
    cancelAnimationFrame(practiceLevelRaf)
    practiceLevelRaf = 0
  }
  if (practiceSilenceTimer) {
    clearTimeout(practiceSilenceTimer)
    practiceSilenceTimer = null
  }
  practiceSpeaking.value = false
  practiceLevel.value = 0
  try {
    practiceAudioCtx?.close?.()
  } catch { /* ignore */ }
  practiceAudioCtx = null
  practiceAnalyser = null
}

function startPracticeSpeechRec() {
  stopPracticeSpeechRec()
  const Rec = window.SpeechRecognition || window.webkitSpeechRecognition
  if (!Rec) return
  const ayah = ayahs.value.find(a => a.verse === playingVerse.value)
  const words = ayah?.words?.length ? ayah.words : splitAyahWords(ayah?.arabic || '')
  if (!words.length) return
  try {
    practiceSpeechRec = new Rec()
    practiceSpeechRec.lang = 'ar-SA'
    practiceSpeechRec.continuous = true
    practiceSpeechRec.interimResults = true
    practiceSpeechRec.onresult = (ev) => {
      if (practicePhase.value !== 'recording') return
      let transcript = ''
      for (let i = 0; i < ev.results.length; i += 1) {
        transcript += `${ev.results[i][0]?.transcript || ''} `
      }
      const hit = matchSpokenWords(words, transcript)
      practiceHeardWords.value = hit.heard
      practiceSpokenWord.value = hit.current
      activeWordIndex.value = hit.current
      // Live cue only — muaalem still verifies after silence/stop.
      if (hit.complete && practiceHadSpeech) {
        stopPracticeRecorder(true)
      }
    }
    practiceSpeechRec.onerror = () => {
      /* browser ASR optional; silence+muaalem still run */
    }
    practiceSpeechRec.start()
  } catch {
    practiceSpeechRec = null
  }
}

function stopPracticeSpeechRec() {
  if (!practiceSpeechRec) return
  try {
    practiceSpeechRec.onresult = null
    practiceSpeechRec.onerror = null
    practiceSpeechRec.stop()
  } catch { /* ignore */ }
  practiceSpeechRec = null
}

function stopPracticeRecorder(finalize = false) {
  if (practiceSilenceTimer) {
    clearTimeout(practiceSilenceTimer)
    practiceSilenceTimer = null
  }
  if (!mediaRecorder) return
  if (finalize && mediaRecorder.state === 'recording') {
    mediaRecorder.stop()
    return
  }
  stopPracticeSpeechRec()
  stopPracticeLevelMeter()
  try {
    mediaRecorder.stream?.getTracks?.().forEach((tr) => tr.stop())
  } catch { /* ignore */ }
  mediaRecorder = null
  recordChunks = []
}

async function checkPracticeRecording(blob) {
  const verse = playingVerse.value
  const chapter = selectedChapter.value
  if (verse == null || !chapter) return
  if (!blob || blob.size < 800) {
    practicePhase.value = 'awaiting_repeat'
    practiceError.value = t('quran.practice.tooShort')
    return
  }
  practicePhase.value = 'checking'
  practiceError.value = ''
  practiceSpeaking.value = false
  try {
    const result = await quranApi.correctRecitation(blob)
    const errors = Array.isArray(result.errors) ? result.errors : []
    const matched = correctionMatchesTarget(result, chapter, verse)
    if (!matched || errors.length) {
      const words = matched
        ? wordIndicesFromMuaalemErrors(result)
        : []
      practiceWrongWords.value = words.length ? words : []
      practiceSpokenWord.value = words[0] || null
      practiceCleared[verse] = false
      practiceError.value = matched
        ? t('quran.practice.needsFix')
        : t('quran.practice.wrongAyah')
      await playWrongSpanOrAyah(verse, words)
      return
    }
    const ayah = ayahs.value.find(a => a.verse === verse)
    const n = ayah?.words?.length || splitAyahWords(ayah?.arabic || '').length
    practiceHeardWords.value = Array.from({ length: n }, (_, i) => i + 1)
    practiceSpokenWord.value = null
    practiceWrongWords.value = []
    practiceCleared[verse] = true
    practicePhase.value = 'clear'
    practiceError.value = ''
    if (practiceAdvanceTimer) clearTimeout(practiceAdvanceTimer)
    practiceAdvanceTimer = setTimeout(() => {
      if (experience.value !== 'practice' || practicePhase.value !== 'clear') return
      const verses = ayahs.value.map(a => a.verse)
      const idx = verses.indexOf(verse)
      const next = verses[idx + 1]
      if (next == null) return
      playVerse(next, { queue: false })
    }, 900)
  } catch (err) {
    practicePhase.value = 'awaiting_repeat'
    const raw = String(err?.body?.hint || err?.message || '')
    if (/empty_audio|decode|EncodingError|Unable to decode/i.test(raw)) {
      practiceError.value = t('quran.practice.decodeError')
    } else if (/muaalem\s*5\d\d/i.test(raw)) {
      practiceError.value = t('quran.practice.checkError')
    } else {
      practiceError.value = err?.body?.hint || err?.message || t('quran.practice.checkError')
    }
  }
}

async function playWrongSpanOrAyah(verse, wordIndices) {
  const timing = chapterTiming.value
  const vt = timing?.verses?.find((v) => v.verse === verse)
  const bounds = vt ? spanBoundsFromWordIndices(vt.segments, wordIndices) : null
  if (bounds && usingChapterAudio.value) {
    practicePhase.value = 'correcting'
    spanPauseAtMs.value = bounds.endMs
    const el = audioEl.value
    if (!el) {
      enterAwaitingRepeat()
      return
    }
    el.currentTime = Math.max(0, bounds.startMs / 1000)
    activeWordIndex.value = bounds.wordFrom
    try {
      applyPlaybackRate()
      await el.play()
      isPlaying.value = true
    } catch {
      practiceError.value = t('quran.audioError')
      enterAwaitingRepeat()
    }
    return
  }
  // shortcut: no word clocks — replay whole ayah until word-sync timing exists
  await playVerse(verse, { queue: false })
  practicePhase.value = 'correcting'
}

const modeButtons = computed(() => [
  { key: 'player', label: t('quran.modes.player') },
  { key: 'wordSync', label: t('quran.modes.wordSync') },
  { key: 'tafsir', label: t('quran.modes.tafsir') },
  // translation: owned by EN/SW/AR header toggle
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
const showTranslation = computed(() => translationLang.value !== 'none')
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

const filteredSurahs = computed(() => surahs.value)

const translationToggleLabel = computed(() => {
  if (translationLang.value === 'sw') return 'SW'
  if (translationLang.value === 'none') return 'AR'
  return 'EN'
})

const translationToggleTitle = computed(() => {
  if (translationLang.value === 'sw') return QURAN_EDITIONS.sw.label
  if (translationLang.value === 'none') return t('quran.arabicOnly')
  return QURAN_EDITIONS.en.label
})

/** Practice turn: center control is mic; otherwise play/pause. */
const dockPrimaryIsMic = computed(() => (
  experience.value === 'practice'
  && playingVerse.value != null
  && !isPlaying.value
  && (practicePhase.value === 'awaiting_repeat' || practicePhase.value === 'recording')
))

const dockPrimaryLabel = computed(() => {
  if (dockPrimaryIsMic.value) {
    return practicePhase.value === 'recording'
      ? t('quran.practice.stopRecord')
      : t('quran.practice.record')
  }
  if (isPlaying.value) return t('quran.pause')
  if (experience.value === 'practice') return t('quran.practice.replay')
  return t('quran.playSurah')
})

const dockPrimaryEnabled = computed(() => {
  if (!selectedChapter.value || !ayahs.value.length) return false
  if (practicePhase.value === 'checking') return false
  if (dockPrimaryIsMic.value) return canRecordPractice.value || practicePhase.value === 'recording'
  return practicePhase.value !== 'recording'
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

/** One dock line: practice status/error, else reciter/loop. */
const dockSubtitle = computed(() => {
  if (experience.value !== 'practice') return stickySubtitle.value
  if (practiceError.value) return practiceError.value
  return practiceStatusText.value
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
  if (exp !== 'practice') resetPracticeState()
  else {
    practicePhase.value = 'idle'
    practiceError.value = ''
  }
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
  spanPauseAtMs.value = null
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
  // Practice never auto-queues forward — clear gate owns advance.
  const allowQueue = experience.value === 'practice' ? false : queue
  audioError.value = ''
  queueMode.value = allowQueue
  playingVerse.value = target
  activeWordIndex.value = null
  spanPauseAtMs.value = null
  if (experience.value === 'practice') {
    clearPracticeTimers()
    stopPracticeSpeechRec()
    stopPracticeLevelMeter()
    practicePhase.value = 'listening'
    practiceError.value = ''
    practiceHeardWords.value = []
    practiceSpokenWord.value = null
    practiceSpeaking.value = false
  }
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

  if (spanPauseAtMs.value != null && ms >= spanPauseAtMs.value - 40) {
    el.pause()
    isPlaying.value = false
    spanPauseAtMs.value = null
    onPracticeListenFinished()
    return
  }

  if (!queueMode.value && playingVerse.value != null) {
    const vt = chapterTiming.value.verses.find(v => v.verse === playingVerse.value)
    if (vt && ms >= vt.timestampTo - 40) {
      if (abLoop.start && abLoop.end && playingVerse.value === abLoop.end && experience.value !== 'practice') {
        playVerse(abLoop.start, { queue: true })
        return
      }
      el.pause()
      isPlaying.value = false
      activeWordIndex.value = null
      progressPct.value = 100
      onPracticeListenFinished()
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
  // Practice: play current ayah only; no continuous queue past uncleared ayahs.
  playVerse(start, { queue: experience.value !== 'practice' })
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

/** One dock play: pause, or practice hear-again, or normal play. */
function onDockPlay() {
  if (practicePhase.value === 'recording' || practicePhase.value === 'checking') return
  if (isPlaying.value) {
    audioEl.value?.pause()
    isPlaying.value = false
    return
  }
  if (experience.value === 'practice' && playingVerse.value != null) {
    replayCurrentForPractice()
    return
  }
  toggleStickyPlay()
}

function onDockPrimary() {
  if (dockPrimaryIsMic.value) {
    togglePracticeRecord()
    return
  }
  onDockPlay()
}

function setTranslationLang(lang) {
  translationLang.value = lang
  modes.translation = lang !== 'none'
}

function cycleTranslationLang() {
  const order = ['en', 'sw', 'none']
  const idx = order.indexOf(translationLang.value)
  setTranslationLang(order[(idx < 0 ? 0 : idx + 1) % order.length])
}

function stepAyah(delta) {
  if (experience.value === 'practice' && delta > 0 && !canAdvancePractice.value) {
    practiceError.value = t('quran.practice.locked')
    return
  }
  if (experience.value === 'practice' && delta < 0 && practiceBlocksNav.value
    && !['clear', 'idle', 'awaiting_repeat'].includes(practicePhase.value)) {
    return
  }
  const current = playingVerse.value || 1
  const next = current + delta
  if (!ayahs.value.some(a => a.verse === next)) return
  if (experience.value === 'practice') {
    practicePhase.value = 'idle'
    practiceWrongWords.value = []
  }
  playVerse(next, { queue: experience.value === 'practice' ? false : queueMode.value })
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
  if (experience.value === 'practice') {
    isPlaying.value = false
    onPracticeListenFinished()
    return
  }
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
  clearPracticeTimers()
  stopPracticeSpeechRec()
  stopPracticeLevelMeter()
  stopPracticeRecorder()
  stopAudio()
  window.removeEventListener('keydown', onKeydown)
  if (sleepTimer) clearTimeout(sleepTimer)
  if (shareCopiedTimer) clearTimeout(shareCopiedTimer)
})
</script>
