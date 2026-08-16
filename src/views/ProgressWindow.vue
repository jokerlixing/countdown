<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { yearProgress, monthProgress, dayProgress, type PeriodProgress } from '@/utils/date'
import ProgressBar from '@/components/ProgressBar.vue'

const props = defineProps<{ mini: boolean }>()

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

const rows = computed(() => [
  { key: 'y', label: '年度', p: year.value.percent, variant: 'indigo' as const },
  { key: 'm', label: '月度', p: month.value.percent, variant: 'violet' as const },
  { key: 'd', label: '今日', p: day.value.percent, variant: 'emerald' as const }
])

const api = window.desktopAPI
</script>

<template>
  <div class="pwin" :class="{ mini: props.mini }">
    <button class="close" title="关闭" @click="api.closeCurrentWindow()">✕</button>
    <template v-if="!props.mini">
      <div v-for="r in rows" :key="r.key" class="row">
        <span class="label">{{ r.label }}</span>
        <ProgressBar :percent="r.p" :variant="r.variant" thin />
        <span class="pct num">{{ (r.p * 100).toFixed(1) }}%</span>
      </div>
    </template>
    <template v-else>
      <div class="row mini-row">
        <span class="label">今日</span>
        <ProgressBar :percent="day.percent" variant="emerald" thin />
        <span class="pct num">{{ Math.round(day.percent * 100) }}%</span>
      </div>
    </template>
  </div>
</template>

<style scoped>
.pwin {
  -webkit-app-region: drag;
  height: 100%;
  display: flex;
  flex-direction: column;
  justify-content: center;
  gap: 10px;
  padding: 10px 12px;
  background: var(--card);
  border: 1px solid var(--border);
  border-radius: 12px;
  box-shadow: var(--shadow-lg);
  position: relative;
}
.row {
  display: flex;
  align-items: center;
  gap: 8px;
}
.label {
  font-size: 11.5px;
  font-weight: 700;
  color: var(--text-secondary);
  width: 30px;
  flex-shrink: 0;
}
.pct {
  font-size: 11px;
  font-weight: 700;
  color: var(--text-secondary);
  width: 48px;
  text-align: right;
  flex-shrink: 0;
}
.mini-row .label {
  width: 26px;
}
.close {
  -webkit-app-region: no-drag;
  position: absolute;
  top: 4px;
  right: 5px;
  width: 20px;
  height: 20px;
  border-radius: 6px;
  font-size: 10px;
  color: var(--text-faint);
}
.close:hover {
  background: var(--danger);
  color: #fff;
}
</style>
