import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { authApi } from '@/api/auth'
import { postAuthHomePath, resolvePostAuthPath } from '@/auth/postAuthPath'
import { useProgressStore } from '@/stores/progress'
import { useFeaturesStore } from '@/stores/features'
import { useBadgesStore } from '@/stores/badges'

// No localStorage during SSG prerender — the store starts logged-out on the
// server and rehydrates from localStorage on the client.
const isClient = typeof window !== 'undefined'

export const useAuthStore = defineStore('auth', () => {
  const user = ref(null)
  const token = ref(isClient ? localStorage.getItem('access_token') : null)
  const refreshToken = ref(isClient ? localStorage.getItem('refresh_token') : null)

  const isLoggedIn = computed(() => !!token.value)
  const isAdmin = computed(() => user.value?.role === 'admin')
  const isAuthor = computed(() => ['author', 'scholar', 'admin'].includes(user.value?.role))

  // Per-section access, resolved server-side from the user's role. `can()` gates
  // admin nav items and route access; `hasAdminAccess` = holds at least one section.
  const sections = computed(() => user.value?.sections || [])
  const can = (section) => sections.value.includes(section)
  const hasAdminAccess = computed(() => sections.value.length > 0)
  const homePath = computed(() => postAuthHomePath(user.value))

  function persistSession(response) {
    token.value = response.access
    refreshToken.value = response.refresh
    user.value = response.user
    localStorage.setItem('access_token', response.access)
    localStorage.setItem('refresh_token', response.refresh)
    // Re-resolve feature flags for the now-authenticated user (beta cohorts).
    useFeaturesStore().loadFlags()
  }

  async function login(email, password) {
    persistSession(await authApi.login(email, password))
  }

  async function loginWithGoogle(idToken) {
    persistSession(await authApi.googleLogin(idToken))
  }

  async function register(email, username, password, fullName) {
    // No session until email is verified — response has user + detail only.
    return authApi.register(email, username, password, fullName)
  }

  async function completeEmailVerification(token) {
    persistSession(await authApi.verifyEmail(token))
  }

  async function fetchUser() {
    const data = await authApi.getProfile()
    user.value = data
  }

  async function resendVerification(email) {
    return authApi.resendVerification(email || user.value?.email)
  }

  function logout() {
    user.value = null
    token.value = null
    refreshToken.value = null
    localStorage.removeItem('access_token')
    localStorage.removeItem('refresh_token')
    useProgressStore().reset()
    useBadgesStore().reset()
    // Drop personalized flags, then reload anonymous defaults.
    const features = useFeaturesStore()
    features.reset()
    features.loadFlags()
  }

  function postAuthPath(redirect) {
    return resolvePostAuthPath(user.value, redirect)
  }

  return {
    user, token, isLoggedIn, isAdmin, isAuthor,
    sections, can, hasAdminAccess, homePath, postAuthPath,
    login, loginWithGoogle, register, completeEmailVerification, logout, fetchUser, resendVerification,
  }
})

