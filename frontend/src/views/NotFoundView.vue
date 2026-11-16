<template>
  <div class="max-w-xl mx-auto px-4 py-24 text-center">
    <h1 class="text-3xl font-bold text-gray-900">Page not found</h1>
    <p class="mt-3 text-gray-600 font-arabic" lang="ar" dir="rtl">الصفحة غير موجودة</p>
    <p class="mt-1 text-gray-500" lang="sw">Ukurasa haujapatikana</p>
    <RouterLink to="/" class="inline-block mt-8 text-[#0B3D2E] font-medium hover:underline">
      Athar Al 'Ilm
    </RouterLink>
  </div>
</template>

<script setup>
import { useRoute, RouterLink } from 'vue-router'
import { useSeo, SEO_ORIGIN } from '@/composables/useSeo'

const route = useRoute()

useSeo(() => ({
  title: 'Page not found',
  description: 'This address is not a page on Athar Al \'Ilm.',
  url: `${SEO_ORIGIN}${route.path}`,
  noindex: true,
}))
</script>
