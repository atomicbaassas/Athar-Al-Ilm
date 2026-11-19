<template>
  <!-- Pattern: Settings / Configuration -->
  <div class="px-6 py-8 max-w-3xl mx-auto">
    <div class="mb-8">
      <h1 class="text-2xl font-semibold text-gray-900">Integrations</h1>
      <p class="text-gray-400 text-sm mt-0.5">
        Superadmin-only API keys for Salafi sources and outbound mail. Keys are stored server-side and never shown again.
      </p>
    </div>

    <div v-if="error" class="bg-red-50 border border-red-200 text-red-700 px-5 py-4 rounded-xl text-sm mb-6">{{ error }}</div>
    <div v-if="saved" class="bg-emerald-50 border border-emerald-200 text-emerald-800 px-5 py-4 rounded-xl text-sm mb-6">Saved.</div>

    <div v-if="loading" class="space-y-3 animate-pulse">
      <div class="bg-gray-100 rounded-2xl h-40" />
      <div class="bg-gray-100 rounded-2xl h-40" />
    </div>

    <form v-else class="space-y-6" @submit.prevent="save">
      <section
        v-for="field in fields"
        :key="field.key"
        class="bg-white border border-gray-200 rounded-2xl shadow-sm"
      >
        <div class="px-5 py-4 border-b border-gray-100">
          <h2 class="font-semibold text-gray-800">{{ field.label }}</h2>
          <p class="text-xs text-gray-400 mt-0.5">{{ field.help }}</p>
        </div>
        <div class="px-5 py-5">
          <label class="block text-xs font-medium text-gray-500 mb-1">
            API key
            <span v-if="status[field.key]?.has_key" class="text-emerald-600 font-normal">
              · set
              <template v-if="status[field.key].key_hint"> ({{ status[field.key].key_hint }})</template>
              <template v-if="status[field.key].key_source && status[field.key].key_source !== 'admin'">
                · from {{ status[field.key].key_source }}
              </template>
            </span>
            <span v-else class="text-amber-600 font-normal">· not set</span>
          </label>
          <input
            v-model="inputs[field.key]"
            type="password"
            autocomplete="off"
            :placeholder="status[field.key]?.has_key ? 'Enter a new key to replace it' : field.placeholder"
            class="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#0B3D2E]/40"
          />
          <button
            v-if="status[field.key]?.has_key && status[field.key]?.key_source === 'admin'"
            type="button"
            class="mt-1.5 text-xs"
            :class="clearFlags[field.key] ? 'text-red-600 font-semibold' : 'text-gray-400 hover:text-red-500'"
            @click="clearFlags[field.key] = !clearFlags[field.key]"
          >
            {{ clearFlags[field.key] ? 'Key will be removed on save · undo' : 'Remove stored key' }}
          </button>
        </div>
      </section>

      <section class="bg-white border border-gray-200 rounded-2xl shadow-sm">
        <div class="px-5 py-4 border-b border-gray-100">
          <h2 class="font-semibold text-gray-800">YouTube channel</h2>
          <p class="text-xs text-gray-400 mt-0.5">Channel ID used with the YouTube Data API key above.</p>
        </div>
        <div class="px-5 py-5">
          <label class="block text-xs font-medium text-gray-500 mb-1">
            Channel ID
            <span v-if="channelSource === 'env'" class="text-emerald-600 font-normal">· from env</span>
          </label>
          <input
            v-model="youtubeChannelId"
            type="text"
            placeholder="UCxxxxxxxxxxxxxxxxxxxxxxxx"
            class="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-[#0B3D2E]/40"
          />
        </div>
      </section>

      <div class="flex justify-end">
        <button
          type="submit"
          :disabled="saving"
          class="inline-flex items-center px-5 py-2.5 rounded-xl bg-[#0B3D2E] text-white text-sm font-semibold hover:bg-[#0a3428] disabled:opacity-60"
        >
          {{ saving ? 'Saving…' : 'Save keys' }}
        </button>
      </div>
    </form>
  </div>
</template>

<script setup>
import { onMounted, reactive, ref } from 'vue'
import { adminApi } from '@/api/admin'

const fields = [
  {
    key: 'islamhouse_api_key',
    label: 'IslamHouse',
    help: 'Path key for api.islamhouse.com/v1/{KEY}. Required for library catalog via /athar/.',
    placeholder: 'Paste IslamHouse API key',
  },
  {
    key: 'dorar_api_key',
    label: 'Dorar',
    help: 'Athar Dorar token when issued. Gateway stays 501 until the adapter is wired.',
    placeholder: 'Paste Dorar API token',
  },
  {
    key: 'resend_api_key',
    label: 'Resend',
    help: 'Also updates Email Settings SMTP password for smtp.resend.com.',
    placeholder: 're_…',
  },
  {
    key: 'youtube_api_key',
    label: 'YouTube',
    help: 'YouTube Data API v3 key for the Videos admin feature.',
    placeholder: 'Paste YouTube API key',
  },
]

const loading = ref(true)
const saving = ref(false)
const error = ref('')
const saved = ref(false)
const status = reactive({})
const inputs = reactive({})
const clearFlags = reactive({})
const youtubeChannelId = ref('')
const channelSource = ref('none')

for (const f of fields) {
  inputs[f.key] = ''
  clearFlags[f.key] = false
}

function apply(data) {
  for (const f of fields) {
    status[f.key] = data[f.key] || { has_key: false, key_hint: '', key_source: 'none' }
    inputs[f.key] = ''
    clearFlags[f.key] = false
  }
  youtubeChannelId.value = data.youtube_channel_id || ''
  channelSource.value = data.youtube_channel_id_source || 'none'
}

async function load() {
  loading.value = true
  error.value = ''
  try {
    apply(await adminApi.getIntegrationSettings())
  } catch (e) {
    error.value = e?.response?.data?.detail || e.message || 'Failed to load integrations.'
  } finally {
    loading.value = false
  }
}

async function save() {
  saving.value = true
  error.value = ''
  saved.value = false
  const payload = { youtube_channel_id: youtubeChannelId.value.trim() }
  for (const f of fields) {
    if (clearFlags[f.key]) payload[`clear_${f.key}`] = true
    else if (inputs[f.key].trim()) payload[f.key] = inputs[f.key].trim()
  }
  try {
    apply(await adminApi.updateIntegrationSettings(payload))
    saved.value = true
  } catch (e) {
    error.value = e?.response?.data?.detail || e.message || 'Save failed.'
  } finally {
    saving.value = false
  }
}

onMounted(load)
</script>
