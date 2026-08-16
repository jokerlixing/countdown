<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { yearProgress, monthProgress, dayProgress, formatCNDate, type PeriodProgress } from '@/utils/date'
import ProgressBar from './ProgressBar.vue'

const api = window.desktopAPI

const now = ref(new Date())
let timer: ReturnType<typeof setInterval> | null = null

onMounted(() => {
  timer = setInterval(() => (now.value = new Date()), 1000)
})
onUnmounted(() => {
  if (timer) clearInterval(timer)
})

const year = computed<PeriodProgress>(() => yearProgress(now.value))
const month = computed<PeriodProgress>(() => monthProgress(now.value))
const day = computed<PeriodProgress>(() => dayProgress(now.value))

function pct(p: PeriodProgress): string {
  return `${(p.percent * 100).toFixed(2)}%`
}
function elapsedDays(p: PeriodProgress): string {
  return `${Math.floor(p.elapsedMs / 86_400_000)} 天`
}
function remainDays(p: PeriodProgress): string {
  return `${Math.ceil((p.totalMs - p.elapsedMs) / 86_400_000)} 天`
}
function remainToday(p: PeriodProgress): string {
  const s = Math.floor((p.totalMs - p.elapsedMs) / 1000)
  const h = String(Math.floor(s / 3600)).padStart(2, '0')
  const m = String(Math.floor((s % 3600) / 60)).padStart(2, '0')
  return `${h}:${m}`
}
const weekText = computed(() => `星期${'日一二三四五六'[now.value.getDay()]}`)

const cards = computed(() => [
  { key: 'year', icon: '📅', title: `${now.value.getFullYear()} 年度进度`, p: year.value, variant: 'indigo' as const, note: `已过 ${elapsedDays(year.value)} · 剩余 ${remainDays(year.value)}` },
  { key: 'month', icon: '🌙', title: `${now.value.getMonth() + 1} 月月度进度`, p: month.value, variant: 'violet' as const, note: `已过 ${Math.floor(month.value.elapsedMs / 86_400_000)} 天 · 剩余 ${remainDays(month.value)}` },
  { key: 'day', icon: '☀️', title: '今日进度', p: day.value, variant: 'emerald' as const, note: `剩余 ${remainToday(day.value)}` }
])
</script>

<template>
  <div class="progress-page">
    <div class="date-line">
      <span>{{ formatCNDate(now) }} · {{ weekText }}</span>
      <span class="float-btns">
        <button class="chip" title="悬浮显示三项进度" @click="api.openProgressWindow('float')">⌖ 悬浮</button>
        <button class="chip" title="极简窗仅今日进度" @click="api.openProgressWindow('mini')">⊖ 极简</button>
      </span>
    </div>
    <div v-for="c in cards" :key="c.key" class="pcard card">
      <div class="pcard-head">
        <span class="icon">{{ c.icon }}</span>
        <span class="title">{{ c.title }}</span>
        <span class="pct num">{{ pct(c.p) }}</span>
      </div>
      <ProgressBar :percent="c.p.percent" :variant="c.variant" />
      <div class="note">{{ c.note }}</div>
    </div>
  </div>
</template>

<style scoped>
.progress-page {
  display: flex;
  flex-direction: column;
  gap: 12px;
}
.date-line {
  display: flex;
  align-items: center;
  justify-content: space-between;
  font-size: 13px;
  font-weight: 700;
  color: var(--text-secondary);
  padding: 4px 0;
}
.float-btns {
  display: flex;
  gap: 6px;
}
.pcard {
  padding: 14px 16px;
  display: flex;
  flex-direction: column;
  gap: 10px;
}
.pcard-head {
  display: flex;
  align-items: center;
  gap: 9px;
}
.icon {
  font-size: 17px;
}
.title {
  font-size: 13.5px;
  font-weight: 700;
  flex: 1;
}
.pct {
  font-size: 15px;
  font-weight: 800;
  color: var(--accent);
}
.note {
  font-size: 12px;
  color: var(--text-faint);
}
</style>
