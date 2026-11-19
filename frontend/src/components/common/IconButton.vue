<template>
  <button
    :type="type"
    class="icon-btn inline-flex items-center justify-center min-h-11 min-w-11 w-11 h-11 rounded-lg transition-colors touch-manipulation"
    :class="toneClass"
    :aria-label="label"
    :disabled="disabled"
    v-tooltip.top="label"
    v-bind="$attrs"
  >
    <slot />
  </button>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  label: { type: String, required: true },
  type: { type: String, default: 'button' },
  tone: { type: String, default: 'neutral' }, // neutral | brand | danger
  disabled: { type: Boolean, default: false },
})

defineOptions({ inheritAttrs: false })

const toneClass = computed(() => {
  switch (props.tone) {
    case 'brand':
      return 'text-gray-400 hover:text-brand hover:bg-brand/10'
    case 'danger':
      return 'text-gray-400 hover:text-red-500 hover:bg-red-50'
    case 'neutral':
      return 'text-gray-400 hover:text-gray-700 hover:bg-gray-100'
    default: {
      const _exhaustiveCheck = props.tone
      void _exhaustiveCheck
      return 'text-gray-400 hover:text-gray-700 hover:bg-gray-100'
    }
  }
})
</script>
