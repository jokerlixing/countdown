<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { yearProgress, monthProgress, dayProgress, type PeriodProgress } from '@/utils/date'
import ProgressBar from '@/components/ProgressBar.vue'

const props = defineProps<{ kind: 'all' | 'year' | 'month' | 'today' }>()

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

const meta: Record<'year' | 'month' | 'today', { icon: string; label: string; variant: 'indigo' | 'violet' | 'emerald' }> = {
  year: { icon: '📅', label: '年度进度', variant: 'indigo' },
  month: { icon: '🌙', label: '月度进度', variant: 'violet' },
  today: { icon: '☀️', label: '今日进度', variant: 'emerald' }
}

const pctOf = computed(() => ({
  year: year.value.percent,
  month: month.value.percent,
  today: day.value.percent
}))

const rows = computed(() => [
  { key: 'year', ...meta.year, p: year.value.percent },
  { key: 'month', ...meta.month, p: month.value.percent },
  { key: 'today', ...meta.today, p: day.value.percent }
])

function remainText(p: PeriodProgress): string {
  const s = Math.floor((p.totalMs - p.elapsedMs) / 1000)
  const d = Math.floor(s / 86400)
  const h = Math.floor((s % 86400) / 3600)
  if (d > 0) return `剩余 ${d} 天`
  const m = Math.floor((s % 3600) / 60)
  return `剩余 ${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`
}

const api = window.desktopAPI
</script>

<template>
  <div class="pwin" :class="{ single: props.kind !== 'all' }">
    <div class="accent-strip" />
    <button class="close" title="关闭" @click="api.closeCurrentWindow()">✕</button>

    <template v-if="props.kind === 'all'">
      <div v-for="r in rows" :key="r.key" class="row">
        <span class="icon">{{ r.icon }}</span>
        <div class="col">
          <div class="rowline">
            <span class="label">{{ r.label }}</span>
            <span class="pct num">{{ (r.p * 100).toFixed(2) }}%</span>
          </div>
          <ProgressBar :percent="r.p" :variant="r.variant" thin />
        </div>
      </div>
    </template>

    <template v-else>
      <div class="s-head">
        <span class="s-icon">{{ meta[props.kind].icon }}</span>
        <span class="s-label">{{ meta[props.kind].label }}</span>
      </div>
      <div class="s-pct num">{{ (pctOf[props.kind] * 100).toFixed(2) }}%</div>
      <ProgressBar :percent="pctOf[props.kind]" :variant="meta[props.kind].variant" />
      <div class="s-note">
        {{ remainText(props.kind === 'year' ? year : props.kind === 'month' ? month : day) }}
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
  gap: 9px;
  padding: 10px 14px;
  background: linear-gradient(180deg, var(--card) 0%, var(--card-soft) 100%);
  border: 1px solid var(--border);
  border-radius: 12px;
  box-shadow: var(--shadow-lg);
  position: relative;
  overflow: hidden;
}
.accent-strip {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 2.5px;
  background: var(--accent-gradient);
  opacity: 0.9;
}
.row {
  display: flex;
  align-items: center;
  gap: 9px;
}
.icon {
  font-size: 17px;
}
.col {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 4px;
}
.rowline {
  display: flex;
  justify-content: space-between;
  align-items: baseline;
}
.label {
  font-size: 12px;
  font-weight: 700;
  color: var(--text-secondary);
}
.pct {
  font-size: 12.5px;
  font-weight: 800;
  color: var(--accent);
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
/* 单项悬浮：突出大号百分比 */
.single .s-head {
  display: flex;
  align-items: center;
  gap: 8px;
}
.s-icon {
  font-size: 24px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 40px;
  height: 40px;
  border-radius: 12px;
  background: var(--accent-soft);
}
.s-label {
  font-size: 13.5px;
  font-weight: 700;
  color: var(--text-secondary);
}
.s-pct {
  font-size: 38px;
  font-weight: 800;
  line-height: 1.05;
  background: var(--accent-gradient);
  -webkit-background-clip: text;
  background-clip: text;
  -webkit-text-fill-color: transparent;
}
.s-note {
  font-size: 11.5px;
  color: var(--text-faint);
}
</style>
