<template>
  <!-- Pattern: Form (auth) -->
  <div class="min-h-screen bg-gray-50 flex items-center justify-center px-4 py-12">
    <div class="w-full max-w-md">
      <div class="text-center mb-8">
        <h1 class="text-2xl font-semibold text-gray-900">{{ t('auth.login.title') }}</h1>
        <p class="text-gray-500 mt-1">{{ t('auth.login.subtitle') }}</p>
      </div>

      <div class="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 sm:p-8">
        <GoogleSignInButton />
        <form @submit.prevent="handleLogin" class="space-y-5">
          <div v-if="error" class="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
            {{ error }}
          </div>

          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">{{ t('auth.login.email') }}</label>
            <input
              v-model="form.email"
              type="email"
              required
              autocomplete="email"
              class="w-full px-4 py-2.5 text-base border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
              :class="{ 'border-red-400': fieldErrors.email }"
              :placeholder="t('auth.login.emailPlaceholder')"
              @blur="validateEmail"
              @input="clearFieldError('email')"
            />
            <p v-if="fieldErrors.email" class="text-red-600 text-xs mt-1">{{ fieldErrors.email }}</p>
          </div>

          <div>
            <div class="flex items-center justify-between mb-1">
              <label class="block text-sm font-medium text-gray-700">{{ t('auth.login.password') }}</label>
              <RouterLink to="/forgot-password" class="text-xs text-emerald-700 hover:underline font-medium inline-flex items-center min-h-11">
                {{ t('auth.forgotLink') }}
              </RouterLink>
            </div>
            <input
              v-model="form.password"
              type="password"
              required
              autocomplete="current-password"
              class="w-full px-4 py-2.5 text-base border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
              :class="{ 'border-red-400': fieldErrors.password }"
              :placeholder="t('auth.login.passwordPlaceholder')"
              @blur="validatePassword"
              @input="clearFieldError('password')"
            />
            <p v-if="fieldErrors.password" class="text-red-600 text-xs mt-1">{{ fieldErrors.password }}</p>
          </div>

          <button
            type="submit"
            :disabled="loading"
            class="w-full bg-emerald-700 hover:bg-emerald-800 disabled:opacity-60 text-white py-2.5 px-4 rounded-lg font-medium transition-colors"
          >
            {{ loading ? t('auth.login.signingIn') : t('auth.login.signIn') }}
          </button>
        </form>

        <p class="text-center text-sm text-gray-500 mt-6">
          {{ t('auth.login.noAccount') }}
          <RouterLink to="/register" class="text-emerald-700 hover:underline font-medium">
            {{ t('auth.login.createFree') }}
          </RouterLink>
        </p>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { useAuthStore } from '@/stores/auth'
import GoogleSignInButton from '@/components/auth/GoogleSignInButton.vue'

const auth = useAuthStore()
const router = useRouter()
const route = useRoute()
const { t } = useI18n()

const form = ref({ email: '', password: '' })
const loading = ref(false)
const error = ref('')
const fieldErrors = ref({ email: '', password: '' })

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

function clearFieldError(field) {
  if (fieldErrors.value[field]) fieldErrors.value[field] = ''
  if (error.value) error.value = ''
}

function validateEmail() {
  fieldErrors.value.email = EMAIL_RE.test(form.value.email.trim())
    ? ''
    : t('auth.login.error')
}

function validatePassword() {
  fieldErrors.value.password = form.value.password
    ? ''
    : t('auth.login.error')
}

async function handleLogin() {
  error.value = ''
  validateEmail()
  validatePassword()
  if (fieldErrors.value.email || fieldErrors.value.password) return
  loading.value = true
  try {
    await auth.login(form.value.email, form.value.password)
    router.push(auth.postAuthPath(route.query.redirect))

  } catch (e) {
    error.value = e.response?.data?.error || t('auth.login.error')
  } finally {
    loading.value = false
  }
}
</script>
