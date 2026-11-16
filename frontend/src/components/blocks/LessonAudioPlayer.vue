<template>
  <div class="rounded-2xl border border-[#0B3D2E]/15 bg-[#0B3D2E]/[0.04] px-4 py-4 sm:px-5">
    <div class="flex items-center gap-3">
      <button
        type="button"
        class="inline-flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-[#0B3D2E] text-white shadow-sm touch-manipulation disabled:opacity-40"
        :aria-label="playing ? t('lesson.pause') : t('lesson.play')"
        :disabled="!url"
        @click="toggle"
      >
        <svg class="h-5 w-5" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
          <path v-if="playing" d="M6 5h4v14H6V5zm8 0h4v14h-4V5z" />
          <path v-else d="M8 5v14l11-7L8 5z" />
        </svg>
      </button>

      <div class="min-w-0 flex-1">
        <p v-if="speaker" class="truncate text-xs font-semibold uppercase tracking-wide text-[#0B3D2E]">
          {{ speaker }}
        </p>
        <p v-if="caption" class="truncate text-sm text-gray-800">{{ caption }}</p>
        <input
          type="range"
          min="0"
          max="1000"
          step="1"
          :value="rangeValue"
          :aria-label="t('lesson.seek')"
          :aria-valuetext="formatAudioTime(current)"
          class="mt-2 w-full accent-[#0B3D2E]"
          :disabled="!duration"
          @input="onSeek"
        />
        <div class="mt-1 flex justify-between text-xs tabular-nums text-gray-500">
          <span>{{ formatAudioTime(current) }}</span>
          <span>{{ formatAudioTime(duration) }}</span>
        </div>
      </div>

      <button
        type="button"
        class="inline-flex h-11 min-w-11 shrink-0 items-center justify-center rounded-xl border border-[#0B3D2E]/20 px-2 text-sm font-semibold tabular-nums text-[#0B3D2E] touch-manipulation"
        :aria-label="t('lesson.playbackSpeed')"
        @click="cycleSpeed"
      >
        {{ speed === 1 ? '1×' : `${speed}×` }}
      </button>
    </div>

    <p v-if="showResume" class="mt-3 text-xs text-[#0B3D2E]">
      {{ t('lesson.resumedAt', { time: formatAudioTime(resumedAt) }) }}
    </p>
    <p v-if="attribution" class="mt-2 text-xs text-gray-400">— {{ attribution }}</p>

    <audio
      ref="audioEl"
      class="hidden"
      aria-hidden="true"
      preload="metadata"
      :src="url"
      @loadedmetadata="onLoaded"
      @timeupdate="onTime"
      @play="onPlay"
      @pause="playing = false"
      @ended="onEnded"
    />
  </div>
</template>

<script setup>
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { stripSiteBrand } from '@/utils/stripSiteBrand'
import {
  formatAudioTime,
  loadPosition,
  loadSpeed,
  rememberLessonAudio,
  resumeSeconds,
  saveSpeed,
  SPEEDS,
} from '@/utils/lessonAudio'

const props = defineProps({
  url: { type: String, default: '' },
  speaker: { type: String, default: '' },
  caption: { type: String, default: '' },
  source: { type: String, default: '' },
  lessonSlug: { type: String, default: '' },
  lessonTitle: { type: String, default: '' },
})

const { t } = useI18n()
const audioEl = ref(null)
const playing = ref(false)
const current = ref(0)
const duration = ref(0)
const speed = ref(1)
const resumedAt = ref(0)
const showResume = ref(false)
let lastPersist = 0

const attribution = computed(() => stripSiteBrand(props.source))
const rangeValue = computed(() => (
  duration.value ? Math.round((current.value / duration.value) * 1000) : 0
))

function persist(position) {
  rememberLessonAudio({
    slug: props.lessonSlug,
    title: props.lessonTitle || props.caption,
    url: props.url,
    position,
  })
}

function onLoaded() {
  const el = audioEl.value
  if (!el) return
  duration.value = Number.isFinite(el.duration) ? el.duration : 0
  el.playbackRate = speed.value
  const resume = resumeSeconds(loadPosition(props.url), duration.value)
  if (!resume) return
  el.currentTime = resume
  current.value = resume
  resumedAt.value = resume
  showResume.value = true
}

function onTime() {
  const el = audioEl.value
  if (!el) return
  current.value = el.currentTime
  if (Math.abs(el.currentTime - lastPersist) < 5) return
  lastPersist = el.currentTime
  persist(el.currentTime)
}

function toggle() {
  const el = audioEl.value
  if (!el) return
  if (el.paused) el.play().catch(() => {})
  else el.pause()
}

function onPlay() {
  playing.value = true
  showResume.value = false
}

function onSeek(event) {
  const el = audioEl.value
  if (!el || !duration.value) return
  const next = (Number(event.target.value) / 1000) * duration.value
  el.currentTime = next
  current.value = next
  lastPersist = next
  persist(next)
}

function cycleSpeed() {
  const index = SPEEDS.indexOf(speed.value)
  const next = SPEEDS[(index + 1) % SPEEDS.length]
  speed.value = next
  if (audioEl.value) audioEl.value.playbackRate = next
  saveSpeed(next)
}

function onEnded() {
  playing.value = false
  current.value = 0
  resumedAt.value = 0
  showResume.value = false
  lastPersist = 0
  persist(0)
}

function flush() {
  const el = audioEl.value
  if (!el || !props.url) return
  persist(el.ended ? 0 : el.currentTime)
}

onMounted(() => {
  speed.value = loadSpeed()
  if (audioEl.value) audioEl.value.playbackRate = speed.value
  window.addEventListener('pagehide', flush)
})

onBeforeUnmount(() => {
  flush()
  if (typeof window !== 'undefined') window.removeEventListener('pagehide', flush)
})

watch(() => props.url, () => {
  playing.value = false
  current.value = 0
  duration.value = 0
  resumedAt.value = 0
  showResume.value = false
  lastPersist = 0
})
</script>
