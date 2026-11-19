<template>
  <aside
    data-h-prayer
    class="prayer-card w-full max-w-md"
    :aria-label="t('home.prayer.ariaLabel')"
  >
    <div class="prayer-card__surface">
      <div class="prayer-card__lead">
        <p class="prayer-card__eyebrow">{{ t('home.prayer.until') }}</p>
        <div class="prayer-card__title-row">
          <h2 class="prayer-card__next-name">
            {{ t(`home.prayer.${schedule.nextId || 'fajr'}`) }}
          </h2>
          <span
            v-if="schedule.currentId"
            class="prayer-card__now-badge"
          >
            {{ t('home.prayer.now') }} · {{ t(`home.prayer.${schedule.currentId}`) }}
          </span>
        </div>
        <p
          class="prayer-card__countdown"
          :aria-live="countdownMs < 60_000 ? 'polite' : 'off'"
        >
          {{ countdownLabel }}
        </p>
        <p class="prayer-card__remaining-hint">
          {{ t('home.prayer.remaining') }}
        </p>
      </div>

      <ul class="prayer-card__times" role="list">
        <li
          v-for="row in prayerRows"
          :key="row.id"
          class="prayer-card__slot"
          :class="{
            'is-current': row.isCurrent,
            'is-next': row.isNext && !row.isCurrent,
          }"
        >
          <span class="prayer-card__slot-name">{{ t(`home.prayer.${row.id}`) }}</span>
          <time
            class="prayer-card__slot-time"
            :datetime="row.at.toISOString()"
          >{{ formatClock(row.at) }}</time>
        </li>
      </ul>

      <div class="prayer-card__footer">
        <div class="prayer-card__location">
          <svg class="prayer-card__pin" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
            <path d="M12 21s7-4.5 7-11a7 7 0 1 0-14 0c0 6.5 7 11 7 11z"/>
            <circle cx="12" cy="10" r="2.25"/>
          </svg>
          <span>{{ t(locationLabelKey) }}</span>
        </div>
        <div class="prayer-card__actions">
          <button
            v-if="geoStatus !== 'granted' && locationSource !== 'geo' && locationSource !== 'stored'"
            type="button"
            class="prayer-card__action"
            @click="requestGeolocation"
          >
            {{ t('home.prayer.useLocation') }}
          </button>
          <button
            type="button"
            class="prayer-card__action"
            :aria-expanded="showCityPicker ? 'true' : 'false'"
            @click="showCityPicker = !showCityPicker"
          >
            {{ t('home.prayer.changeCity') }}
          </button>
        </div>
      </div>

      <div
        v-if="showCityPicker"
        class="prayer-card__picker"
        role="listbox"
        :aria-label="t('home.prayer.changeCity')"
      >
        <button
          v-for="city in cityOptions"
          :key="city.id"
          type="button"
          role="option"
          class="prayer-card__city"
          :class="{ 'is-active': cityId === city.id }"
          :aria-selected="cityId === city.id ? 'true' : 'false'"
          @click="selectCity(city)"
        >
          {{ t(city.nameKey) }}
        </button>
      </div>

      <p class="prayer-card__method">{{ t('home.prayer.methodNote') }}</p>
    </div>
  </aside>
</template>

<script setup>
import { useI18n } from 'vue-i18n'
import { usePrayerTimes } from '@/composables/usePrayerTimes'

const { t } = useI18n()
const {
  schedule,
  prayerRows,
  countdownLabel,
  countdownMs,
  locationSource,
  locationLabelKey,
  cityId,
  geoStatus,
  showCityPicker,
  cityOptions,
  selectCity,
  requestGeolocation,
  formatClock,
} = usePrayerTimes()
</script>

<style scoped>
.prayer-card {
  --prayer-green: #0b3d2e;
  --prayer-mint: #9fd5c0;
  --prayer-ink: rgba(255, 255, 255, 0.92);
  --prayer-muted: rgba(255, 255, 255, 0.55);
  --prayer-faint: rgba(255, 255, 255, 0.28);
  --prayer-radius: 1rem;
  --prayer-inset: 1.25rem;
}

.prayer-card__surface {
  position: relative;
  padding: var(--prayer-inset);
  border-radius: var(--prayer-radius);
  background:
    linear-gradient(165deg, rgba(20, 92, 69, 0.55) 0%, rgba(11, 61, 46, 0.92) 48%, rgba(6, 36, 28, 0.98) 100%);
  border: 1px solid rgba(159, 213, 192, 0.18);
  box-shadow: 0 18px 40px rgba(0, 0, 0, 0.35);
  overflow: hidden;
}

.prayer-card__surface::before {
  content: '';
  position: absolute;
  inset-inline-end: -20%;
  top: -30%;
  width: 55%;
  height: 70%;
  background: radial-gradient(ellipse at center, rgba(159, 213, 192, 0.14) 0%, transparent 70%);
  pointer-events: none;
}

.prayer-card__lead {
  position: relative;
  margin-block-end: 1.25rem;
}

.prayer-card__eyebrow {
  margin: 0;
  font-size: 0.8125rem;
  color: var(--prayer-mint);
  letter-spacing: 0.02em;
}

.prayer-card__title-row {
  display: flex;
  flex-wrap: wrap;
  align-items: baseline;
  gap: 0.5rem 0.75rem;
  margin-block-start: 0.25rem;
}

.prayer-card__next-name {
  margin: 0;
  font-size: 1.25rem;
  font-weight: 600;
  color: var(--prayer-ink);
  line-height: 1.2;
  text-wrap: balance;
}

.prayer-card__now-badge {
  font-size: 0.75rem;
  color: var(--prayer-green);
  background: rgba(159, 213, 192, 0.92);
  padding: 0.2rem 0.55rem;
  border-radius: 0.375rem;
  font-weight: 600;
}

.prayer-card__countdown {
  margin: 0.5rem 0 0;
  font-size: clamp(2.25rem, 6vw, 2.75rem);
  font-weight: 600;
  letter-spacing: -0.03em;
  line-height: 1.05;
  color: #fff;
  font-variant-numeric: tabular-nums;
  -webkit-font-smoothing: antialiased;
}

.prayer-card__remaining-hint {
  margin: 0.35rem 0 0;
  font-size: 0.8125rem;
  color: var(--prayer-muted);
}

.prayer-card__times {
  position: relative;
  list-style: none;
  margin: 0;
  padding: 0.65rem;
  display: grid;
  grid-template-columns: repeat(5, minmax(0, 1fr));
  gap: 0.35rem;
  border-radius: calc(var(--prayer-radius) - var(--prayer-inset) + 0.65rem);
  background: rgba(0, 0, 0, 0.22);
  border: 1px solid rgba(255, 255, 255, 0.06);
}

.prayer-card__slot {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.2rem;
  padding: 0.45rem 0.15rem;
  border-radius: 0.5rem;
  text-align: center;
  min-width: 0;
}

.prayer-card__slot.is-current,
.prayer-card__slot.is-next {
  background: rgba(159, 213, 192, 0.14);
}

.prayer-card__slot-name {
  font-size: 0.6875rem;
  color: var(--prayer-faint);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 100%;
}

.prayer-card__slot.is-current .prayer-card__slot-name,
.prayer-card__slot.is-next .prayer-card__slot-name {
  color: var(--prayer-mint);
  font-weight: 600;
}

.prayer-card__slot-time {
  font-size: 0.75rem;
  color: rgba(255, 255, 255, 0.78);
  font-variant-numeric: tabular-nums;
}

.prayer-card__slot.is-current .prayer-card__slot-time,
.prayer-card__slot.is-next .prayer-card__slot-time {
  color: #fff;
  font-weight: 600;
}

.prayer-card__footer {
  position: relative;
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: 0.5rem 0.75rem;
  margin-block-start: 1rem;
}

.prayer-card__location {
  display: inline-flex;
  align-items: center;
  gap: 0.4rem;
  font-size: 0.8125rem;
  color: var(--prayer-muted);
  min-width: 0;
}

.prayer-card__pin {
  width: 0.9rem;
  height: 0.9rem;
  color: var(--prayer-mint);
  flex-shrink: 0;
}

.prayer-card__actions {
  display: inline-flex;
  flex-wrap: wrap;
  gap: 0.35rem;
}

.prayer-card__action {
  appearance: none;
  border: 1px solid rgba(159, 213, 192, 0.28);
  background: rgba(255, 255, 255, 0.04);
  color: var(--prayer-mint);
  font-size: 0.75rem;
  font-weight: 600;
  /* 0.6rem vertical padding keeps the tap target ≥ 44px tall */
  padding: 0.6rem 0.85rem;
  border-radius: 0.5rem;
  cursor: pointer;
  transition: background 160ms ease, border-color 160ms ease;
}

.prayer-card__action:hover {
  background: rgba(159, 213, 192, 0.12);
  border-color: rgba(159, 213, 192, 0.45);
}

.prayer-card__action:focus-visible {
  outline: 2px solid var(--prayer-mint);
  outline-offset: 2px;
}

.prayer-card__picker {
  position: relative;
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 0.4rem;
  margin-block-start: 0.75rem;
}

.prayer-card__city {
  appearance: none;
  border: 1px solid rgba(255, 255, 255, 0.08);
  background: rgba(0, 0, 0, 0.2);
  color: rgba(255, 255, 255, 0.78);
  font-size: 0.75rem;
  font-weight: 500;
  padding: 0.5rem 0.6rem;
  border-radius: 0.5rem;
  text-align: start;
  cursor: pointer;
}

.prayer-card__city.is-active,
.prayer-card__city:hover {
  border-color: rgba(159, 213, 192, 0.35);
  background: rgba(159, 213, 192, 0.1);
  color: #fff;
}

.prayer-card__city:focus-visible {
  outline: 2px solid var(--prayer-mint);
  outline-offset: 2px;
}

.prayer-card__method {
  position: relative;
  margin: 0.75rem 0 0;
  font-size: 0.6875rem;
  color: var(--prayer-faint);
  line-height: 1.4;
}

@media (max-width: 380px) {
  .prayer-card__times {
    grid-template-columns: repeat(3, minmax(0, 1fr));
  }
}
</style>
