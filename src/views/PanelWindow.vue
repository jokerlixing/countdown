<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useTasksStore } from '@/stores/tasks'
import { yearProgress, monthProgress, dayProgress, dateParts, datetimeMain, type PeriodProgress } from '@/utils/date'
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
  { key: 'year', icon: '📅', label: '年', p: year.value.percent, variant: 'indigo' as const },
  { key: 'month', icon: '🌙', label: '月', p: month.value.percent, variant: 'violet' as const },
  { key: 'today', icon: '☀️', label: '日', p: day.value.percent, variant: 'emerald' as const }
])

const list = computed(() => tasks.tasks.filter((t) => t.status !== 'finished' || t.type !== 'duration'))

function timeOf(t: { type: string; remainingMs: number }): string {
  if (t.type === 'datetime') return datetimeMain(t.remainingMs).main
  if (t.type === 'date') return `${dateParts(t.remainingMs).days}天`
  return formatMsShort(t.remainingMs)
}
</script>

<template>
  <div class="panel">
    <div class="accent-strip" />
    <div class="head">
      <span class="h-icon">🧩</span>
      <span class="h-label">整合面板</span>
      <span v-if="tasks.runningCount" class="h-badge num">{{ tasks.runningCount }}↻</span>
      <button class="close" title="关闭" @click="api.closeCurrentWindow()">✕</button>
    </div>

    <div class="progress">
      <div v-for="r in progressRows" :key="r.key" class="p-row">
        <span class="p-icon">{{ r.icon }}</span>
        <span class="p-label">{{ r.label }}</span>
        <div class="p-bar">
          <ProgressBar :percent="r.p" :variant="r.variant" thin />
        </div>
        <span class="p-pct num">{{ (r.p * 100).toFixed(1) }}%</span>
      </div>
    </div>

    <div class="tasks">
      <div v-if="list.length === 0" class="empty">🎉 全部完成</div>
      <template v-else>
        <!-- 少量任务时每行自动拉伸填满面板；多任务时紧凑排列并滚动 -->
        <div v-for="t in list" :key="t.id" class="item" :class="{ running: t.status === 'running' }">
          <span class="i-icon">{{ t.type === 'datetime' ? '⏰' : t.type === 'date' ? '🗓' : '⏱' }}</span>
          <div class="mid">
            <div class="name" :style="{ color: taskColor(t.id) }" :title="t.title">{{ t.title }}</div>
            <div v-if="t.type !== 'duration'" class="sub num">{{
              t.type === 'datetime' ? datetimeMain(t.remainingMs).sub : dateParts(t.remainingMs).hms
            }}</div>
          </div>
          <div class="time num" :class="{ danger: t.status === 'running' && t.remainingMs < 10_000 }">
            {{ t.status === 'finished' && t.type === 'duration' ? '✓' : timeOf(t) }}
          </div>
        </div>
      </template>
    </div>
  </div>
</template>

<style scoped>
.panel {
  height: 100%;
  display: flex;
  flex-direction: column;
  background: linear-gradient(180deg, var(--card) 0%, var(--card-soft) 100%);
  border: 1px solid var(--border);
  border-radius: 12px;
  box-shadow: var(--shadow-lg);
  overflow: hidden;
  position: relative;
}
.accent-strip {
  height: 2.5px;
  background: var(--accent-gradient);
  flex-shrink: 0;
  opacity: 0.9;
}
.head {
  -webkit-app-region: drag;
  display: flex;
  align-items: center;
  gap: 5px;
  padding: 4px 6px 4px 9px;
  flex-shrink: 0;
}
.h-icon {
  font-size: 12px;
}
.h-label {
  font-size: 11.5px;
  font-weight: 800;
  letter-spacing: 0.5px;
}
.h-badge {
  font-size: 9px;
  font-weight: 800;
  background: var(--accent-gradient);
  color: #fff;
  padding: 1px 6px;
  border-radius: 999px;
  animation: soft-pulse 2s ease-in-out infinite;
}
.close {
  -webkit-app-region: no-drag;
  margin-left: auto;
  width: 18px;
  height: 18px;
  border-radius: 6px;
  font-size: 9.5px;
  color: var(--text-faint);
}
.close:hover {
  background: var(--danger);
  color: #fff;
}

/* 进度：三行紧凑排布 */
.progress {
  padding: 2px 9px 6px;
  display: flex;
  flex-direction: column;
  gap: 3px;
  border-bottom: 1px solid var(--border);
  flex-shrink: 0;
}
.p-row {
  display: flex;
  align-items: center;
  gap: 5px;
}
.p-icon {
  font-size: 11px;
  width: 15px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}
.p-label {
  font-size: 10px;
  font-weight: 800;
  color: var(--text-secondary);
  width: 13px;
}
.p-bar {
  flex: 1;
}
.p-pct {
  font-size: 10px;
  font-weight: 800;
  color: var(--accent);
  width: 42px;
  text-align: right;
}

/* 任务：自动填充剩余空间 */
.tasks {
  flex: 1;
  min-height: 0;
  display: flex;
  flex-direction: column;
  padding: 4px 6px;
  gap: 3px;
  overflow-y: auto;
}
.empty {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 11px;
  font-weight: 700;
  color: var(--text-faint);
}
.item {
  flex: 1 1 auto;
  min-height: 24px;
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 2px 6px;
  border-radius: 8px;
  transition: background 0.15s ease;
}
.item.running {
  background: var(--accent-soft);
  box-shadow: inset 2px 0 0 var(--accent);
}
.i-icon {
  font-size: 12px;
}
.mid {
  flex: 1;
  min-width: 0;
}
.name {
  font-size: 11.5px;
  font-weight: 800;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.sub {
  font-size: 9px;
  color: var(--text-faint);
}
.time {
  font-size: 15px;
  font-weight: 800;
  flex-shrink: 0;
}
.danger {
  color: var(--danger);
}
@keyframes soft-pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.55; }
}
</style>
