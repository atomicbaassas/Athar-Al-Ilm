<template>
  <RouterLink
    to="/"
    class="brand-lockup inline-flex items-center gap-2.5 shrink-0 group min-w-0"
    :aria-label="t('brand.lockup')"
  >
    <img
      src="/logo-mark.svg?v=quiet-mihrab"
      :alt="t('brand.lockup')"
      class="h-9 w-9 shrink-0 transition-transform duration-200 group-hover:scale-105"
      :class="invertMark ? 'brightness-0 invert' : ''"
    />
    <span
      class="brand-lockup__wordmark truncate tracking-tight leading-none"
      :class="[
        locale === 'ar' ? 'font-arabic text-[1.05rem] sm:text-lg font-bold' : 'text-sm sm:text-base font-semibold',
        wordmarkClass,
      ]"
      :lang="locale === 'ar' ? 'ar' : locale === 'sw' ? 'sw' : 'en'"
    >
      {{ t('brand.lockup') }}
    </span>
  </RouterLink>
</template>

<script setup>
import { useI18n } from 'vue-i18n'

defineProps({
  /** Invert the dark mark on dark hero backgrounds. */
  invertMark: { type: Boolean, default: false },
  /** Extra classes for the wordmark (color context). */
  wordmarkClass: { type: String, default: 'text-gray-900' },
})

const { t, locale } = useI18n({ useScope: 'global' })
</script>
