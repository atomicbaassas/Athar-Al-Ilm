import { watch, nextTick, onUnmounted } from 'vue'

/**
 * Modal accessibility: Escape to close, body scroll lock, initial focus,
 * focus restore on close. Attach to the `v-if` ref that gates the dialog.
 *
 * Usage:
 *   const open = ref(false)
 *   useModalA11y(open, () => { open.value = false })
 *   <div v-if="open" role="dialog" aria-modal="true" ref="...">…
 */
export function useModalA11y(visible, close) {
  let previouslyFocused = null

  function onKeydown(e) {
    if (e.key === 'Escape') close()
  }

  watch(visible, (isOpen) => {
    if (typeof document === 'undefined') return
    if (isOpen) {
      previouslyFocused = document.activeElement
      document.body.style.overflow = 'hidden'
      window.addEventListener('keydown', onKeydown)
      nextTick(() => {
        // Focus the dialog (or first focusable inside) so keyboard users land in it.
        const el = document.querySelector('[role="dialog"][aria-modal="true"]')
        el?.focus()
      })
    } else {
      document.body.style.overflow = ''
      window.removeEventListener('keydown', onKeydown)
      previouslyFocused?.focus?.()
      previouslyFocused = null
    }
  }, { immediate: true })

  onUnmounted(() => {
    if (typeof document !== 'undefined') document.body.style.overflow = ''
    window.removeEventListener('keydown', onKeydown)
  })
}
