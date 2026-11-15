<template>
  <div class="min-h-screen bg-white">
    <div class="max-w-3xl mx-auto px-4 sm:px-6 pt-10 pb-16 sm:pt-14">
      <p class="text-xs font-bold uppercase tracking-widest text-brand mb-4 flex items-center gap-2">
        <span class="w-4 h-px bg-brand inline-block"></span>
        {{ t('contributors.eyebrow') }}
      </p>
      <h1 class="text-3xl sm:text-4xl font-black text-gray-900 tracking-tight mb-3">
        {{ t('contributors.title') }}
      </h1>
      <p class="text-gray-600 text-base sm:text-lg leading-relaxed mb-10">
        {{ t('contributors.subtitle') }}
      </p>

      <section
        class="mb-12 rounded-2xl border border-brand/20 bg-[#0B3D2E]/[0.04] p-5 sm:p-6"
        aria-labelledby="dua-heading"
      >
        <h2 id="dua-heading" class="text-sm font-bold uppercase tracking-wide text-brand mb-3">
          {{ t('contributors.duaTitle') }}
        </h2>
        <p class="font-arabic text-xl sm:text-2xl leading-relaxed text-gray-900 text-end mb-3" dir="rtl" lang="ar">
          {{ t('contributors.duaArabic') }}
        </p>
        <p class="text-sm sm:text-base text-gray-700 leading-relaxed mb-2">
          {{ t('contributors.duaTranslation') }}
        </p>
        <p class="text-xs text-gray-500">
          {{ t('contributors.duaSource') }}
        </p>
      </section>

      <ul class="space-y-6">
        <li
          v-for="item in items"
          :key="item.id"
          class="border-b border-gray-100 pb-6 last:border-0"
        >
          <h3 class="text-lg font-bold text-gray-900 mb-1">{{ item.name }}</h3>
          <p class="text-sm text-gray-600 leading-relaxed mb-2">{{ item.taken }}</p>
          <a
            v-if="item.href"
            :href="item.href"
            target="_blank"
            rel="noopener noreferrer"
            class="text-sm font-semibold text-brand hover:underline"
          >
            {{ item.linkLabel || item.href }}
          </a>
        </li>
      </ul>

      <p class="mt-10 text-sm text-gray-500 leading-relaxed">
        {{ t('contributors.mitNote') }}
      </p>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { useHead } from '@unhead/vue'

const SEO_ORIGIN = import.meta.env.VITE_SITE_ORIGIN || 'https://atharulilm.or.tz'
const { t } = useI18n({ useScope: 'global' })

useHead({
  title: () => t('contributors.title'),
  meta: [
    { name: 'description', content: () => t('contributors.subtitle') },
    { property: 'og:url', content: `${SEO_ORIGIN}/contributors` },
  ],
})

const items = computed(() => [
  {
    id: 'tadabbur',
    name: t('contributors.items.tadabbur.name'),
    taken: t('contributors.items.tadabbur.taken'),
    href: 'https://github.com/mohhomadfarman/Tadabbur',
    linkLabel: 'github.com/mohhomadfarman/Tadabbur',
  },
  {
    id: 'quranapi',
    name: t('contributors.items.quranapi.name'),
    taken: t('contributors.items.quranapi.taken'),
    href: 'https://github.com/fawazahmed0/quran-api',
    linkLabel: 'github.com/fawazahmed0/quran-api',
  },
  {
    id: 'everyayah',
    name: t('contributors.items.everyayah.name'),
    taken: t('contributors.items.everyayah.taken'),
    href: 'https://everyayah.com/',
    linkLabel: 'everyayah.com',
  },
  {
    id: 'qurancom',
    name: t('contributors.items.qurancom.name'),
    taken: t('contributors.items.qurancom.taken'),
    href: 'https://api-docs.quran.com/',
    linkLabel: 'api-docs.quran.com',
  },
  {
    id: 'quranfi',
    name: t('contributors.items.quranfi.name'),
    taken: t('contributors.items.quranfi.taken'),
    href: 'https://github.com/Quranfi-Project/quranfi-web',
    linkLabel: 'Quranfi-Project/quranfi-web',
  },
  {
    id: 'ibnuh',
    name: t('contributors.items.ibnuh.name'),
    taken: t('contributors.items.ibnuh.taken'),
    href: 'https://github.com/ibnuh/quran',
    linkLabel: 'ibnuh/quran',
  },
  {
    id: 'adhan',
    name: t('contributors.items.adhan.name'),
    taken: t('contributors.items.adhan.taken'),
    href: 'https://github.com/batoulapps/adhan-js',
    linkLabel: 'batoulapps/adhan-js',
  },
  {
    id: 'islamhouse',
    name: t('contributors.items.islamhouse.name'),
    taken: t('contributors.items.islamhouse.taken'),
    href: 'https://islamhouse.com/',
    linkLabel: 'islamhouse.com',
  },
  {
    id: 'quranenc',
    name: t('contributors.items.quranenc.name'),
    taken: t('contributors.items.quranenc.taken'),
    href: 'https://quranenc.com/',
    linkLabel: 'quranenc.com',
  },
  {
    id: 'betterdesign',
    name: t('contributors.items.betterdesign.name'),
    taken: t('contributors.items.betterdesign.taken'),
    href: 'https://www.better.design/',
    linkLabel: 'better.design',
  },
])
</script>
