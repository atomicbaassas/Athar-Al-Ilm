<template>
  <div v-if="ready">
    <div ref="host" class="flex justify-center" />
    <p v-if="error" class="mt-2 text-center text-sm text-red-600">{{ error }}</p>
    <div class="my-5 flex items-center gap-3 text-xs text-gray-400">
      <span class="h-px flex-1 bg-gray-200" />
      <span>{{ t('auth.google.or') }}</span>
      <span class="h-px flex-1 bg-gray-200" />
    </div>
  </div>
</template>

<script setup>
import { nextTick, onMounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { authApi } from '@/api/auth'
import { useAuthStore } from '@/stores/auth'

const GSI_SRC = 'https://accounts.google.com/gsi/client'

const auth = useAuthStore()
const router = useRouter()
const route = useRoute()
const { t, locale } = useI18n()

const host = ref(null)
const ready = ref(false)
const error = ref('')

function loadGsi() {
  if (window.google?.accounts?.id) return Promise.resolve()
  return new Promise((resolve, reject) => {
    let script = document.querySelector('script[data-gsi]')
    if (!script) {
      script = document.createElement('script')
      script.src = GSI_SRC
      script.async = true
      script.defer = true
      script.dataset.gsi = '1'
      document.head.appendChild(script)
    }
    if (window.google?.accounts?.id) {
      resolve()
      return
    }
    script.addEventListener('load', () => resolve(), { once: true })
    script.addEventListener('error', () => reject(new Error('gsi')), { once: true })
  })
}

async function onCredential(response) {
  error.value = ''
  try {
    await auth.loginWithGoogle(response.credential)
    router.push(auth.postAuthPath(route.query.redirect))
  } catch (e) {
    error.value = e.response?.data?.error || t('auth.google.error')
  }
}

onMounted(async () => {
  let clientId = ''
  try {
    const cfg = await authApi.googleConfig()
    clientId = cfg.client_id || ''
  } catch {
    return
  }
  if (!clientId) return

  ready.value = true
  await nextTick()
  try {
    await loadGsi()
  } catch {
    ready.value = false
    return
  }

  const width = Math.max(240, Math.min(400, host.value?.clientWidth || 320))
  window.google.accounts.id.initialize({
    client_id: clientId,
    callback: onCredential,
    auto_select: false,
  })
  window.google.accounts.id.renderButton(host.value, {
    type: 'standard',
    theme: 'outline',
    size: 'large',
    text: 'continue_with',
    shape: 'rectangular',
    width,
    locale: locale.value || 'en',
  })
})
</script>
