<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useTasksStore } from '@/stores/tasks'
import { yearProgress, monthProgress, dayProgress, dateParts, type PeriodProgress } from '@/utils/date'
import { formatMsShort } from '@/utils/time'
import { taskColor } from '@/utils/color'
import ProgressBar from '@/components/ProgressBar.vue'

const tasks = useTasksStore()
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

const progressRows = computed(() => [
  { key: 'year', icon: '📅', label: '年度', p: year.value.percent, variant: 'indigo' as const },
  { key: 'month', icon: '🌙', label: '月度', p: month.value.percent, variant: 'violet' as const },
  { key: 'today', icon: '☀️', label: '今日', p: day.value.percent, variant: 'emerald' as const }
])

const list = computed(() => tasks.tasks.filter((t) => t.status !== 'finished' || t.type === 'date'))

function timeOf(t: { type: string; remainingMs: number }): string {
  return t.type === 'date' ? `${dateParts(t.remainingMs).days}天` : formatMsShort(t.remainingMs)
}
</script>

<template>
  <div class="panel">
    <div class="head">
      <span class="h-icon">🧩</span>
      <span class="h-label">整合面板</span>
      <span v-if="tasks.runningCount" class="h-badge num">{{ tasks.runningCount }} 进行中</span>
      <button class="close" title="关闭" @click="api.closeCurrentWindow()">✕</button>
    </div>

    <div class="section">
      <div class="sec-title">进度</div>
      <div v-for="r in progressRows" :key="r.key" class="p-row">
        <span class="p-icon">{{ r.icon }}</span>
        <span class="p-label">{{ r.label }}</span>
        <div class="p-bar">
          <ProgressBar :percent="r.p" :variant="r.variant" thin />
        </div>
        <span class="p-pct num">{{ (r.p * 100).toFixed(1) }}%</span>
      </div>
    </div>

    <div class="section grow">
      <div class="sec-title">任务<span v-if="list.length" class="sec-count num">{{ list.length }}</span></div>
      <div v-if="list.length === 0" class="empty">暂无提醒任务</div>
      <div v-else class="list">
        <div v-for="t in list" :key="t.id" class="item" :class="{ running: t.status === 'running' }">
          <span class="i-icon">{{ t.type === 'date' ? '🗓' : '⏱' }}</span>
          <div class="mid">
            <div class="name" :style="{ color: taskColor(t.id) }" :title="t.title">{{ t.title }}</div>
            <div v-if="t.type === 'date'" class="sub num">{{ dateParts(t.remainingMs).hms }}</div>
          </div>
          <div class="time num" :class="{ danger: t.status === 'running' && t.remainingMs < 10_000 }">
            {{ t.status === 'finished' && t.type === 'duration' ? '✓' : timeOf(t) }}
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.panel {
  height: 100%;
  display: flex;
  flex-direction: column;
  background: var(--card);
  border: 1px solid var(--border);
  border-radius: 12px;
  box-shadow: var(--shadow-lg);
  overflow: hidden;
}
.head {
  -webkit-app-region: drag;
  display: flex;
  align-items: center;
  gap: 7px;
  padding: 8px 12px;
  border-bottom: 1px solid var(--border);
  background: var(--card-soft);
  flex-shrink: 0;
}
.h-icon {
  font-size: 14px;
}
.h-label {
  font-size: 13px;
  font-weight: 800;
}
.h-badge {
  font-size: 10px;
  font-weight: 700;
  background: var(--accent-gradient);
  color: #fff;
  padding: 2px 8px;
  border-radius: 999px;
}
.close {
  -webkit-app-region: no-drag;
  margin-left: auto;
  width: 22px;
  height: 22px;
  border-radius: 6px;
  font-size: 11px;
  color: var(--text-faint);
}
.close:hover {
  background: var(--danger);
  color: #fff;
}
.section {
  padding: 7px 10px 6px;
  flex-shrink: 0;
}
.section.grow {
  flex: 1;
  min-height: 0;
  display: flex;
  flex-direction: column;
}
.sec-title {
  font-size: 10.5px;
  font-weight: 800;
  color: var(--text-faint);
  letter-spacing: 1.5px;
  margin-bottom: 5px;
  display: flex;
  align-items: center;
  gap: 5px;
}
.sec-count {
  background: var(--accent-soft);
  color: var(--accent);
  padding: 0 6px;
  border-radius: 999px;
  font-size: 9.5px;
}
.p-row {
  display: flex;
  align-items: center;
  gap: 7px;
  padding: 2.5px 0;
}
.p-icon {
  font-size: 13px;
}
.p-label {
  font-size: 11.5px;
  font-weight: 700;
  color: var(--text-secondary);
  width: 26px;
}
.p-bar {
  flex: 1;
}
.p-pct {
  font-size: 11px;
  font-weight: 800;
  color: var(--accent);
  width: 44px;
  text-align: right;
}
.empty {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 12px;
  color: var(--text-faint);
}
.list {
  flex: 1;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: 3px;
}
.item {
  display: flex;
  align-items: center;
  gap: 7px;
  padding: 5px 7px;
  border-radius: 8px;
  transition: background 0.15s ease;
}
.item.running {
  background: var(--accent-soft);
}
.i-icon {
  font-size: 13px;
}
.mid {
  flex: 1;
  min-width: 0;
}
.name {
  font-size: 12.5px;
  font-weight: 800;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.sub {
  font-size: 10px;
  color: var(--text-faint);
}
.time {
  font-size: 16px;
  font-weight: 800;
  flex-shrink: 0;
}
.danger {
  color: var(--danger);
}
</style>
