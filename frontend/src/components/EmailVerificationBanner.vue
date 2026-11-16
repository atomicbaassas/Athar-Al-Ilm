<template>
  <div v-if="visible" class="bg-amber-50 border-b border-amber-200 text-amber-800 px-4 py-2.5 text-sm flex items-center justify-center gap-3 flex-wrap">
    <span>{{ t('auth.verifyBanner.message') }}</span>
    <span v-if="sent" class="font-medium">{{ t('auth.verifyBanner.sent') }}</span>
    <button v-else @click="resend" :disabled="sending" class="font-semibold underline hover:no-underline disabled:opacity-60">
      {{ t('auth.verifyBanner.resend') }}
    </button>
    <button @click="dismiss" class="-me-2 flex items-center justify-center w-8 h-8 rounded-lg text-amber-500 hover:text-amber-700 hover:bg-amber-100/60 transition-colors" aria-label="Dismiss">
      <svg class="w-4 h-4" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24" aria-hidden="true"><path stroke-linecap="round" d="M6 18L18 6M6 6l12 12"/></svg>
    </button>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { useAuthStore } from '@/stores/auth'

const auth = useAuthStore()
const { t } = useI18n()

const DISMISS_KEY = 'verify_banner_dismissed'
const dismissed = ref(typeof window !== 'undefined' && sessionStorage.getItem(DISMISS_KEY) === '1')
const sending = ref(false)
const sent = ref(false)

const visible = computed(() =>
  auth.isLoggedIn && auth.user && !auth.user.is_verified && !dismissed.value
)

function dismiss() {
  dismissed.value = true
  sessionStorage.setItem(DISMISS_KEY, '1')
}

async function resend() {
  sending.value = true
  try {
    await auth.resendVerification()
    sent.value = true
  } finally {
    sending.value = false
  }
}
</script>
