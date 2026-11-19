<template>
  <section
    class="empty-state text-center py-16 sm:py-20 px-4 border-2 border-dashed border-gray-200 rounded-2xl bg-white"
    :aria-labelledby="titleId"
  >
    <h2 :id="titleId" class="text-base font-semibold text-gray-800 mb-1.5">
      {{ title }}
    </h2>
    <p class="text-sm text-gray-500 max-w-md mx-auto mb-5">
      {{ description }}
    </p>
    <div class="flex flex-wrap items-center justify-center gap-3">
      <slot name="action" />
      <button
        v-if="clearLabel"
        type="button"
        class="inline-flex items-center justify-center min-h-11 px-4 rounded-xl border border-gray-200 text-sm font-semibold text-gray-700 hover:border-brand/30 hover:text-brand transition-colors"
        @click="$emit('clear')"
      >
        {{ clearLabel }}
      </button>
    </div>
  </section>
</template>

<script setup>
let emptySeq = 0
const titleId = `empty-title-${++emptySeq}`

defineProps({
  title: { type: String, required: true },
  description: { type: String, required: true },
  clearLabel: { type: String, default: '' },
})

defineEmits(['clear'])
</script>
