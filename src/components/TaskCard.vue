<script setup lang="ts">
import { computed } from 'vue'
import { useTasksStore } from '@/stores/tasks'
import type { Task } from '@/types'
import { formatMs, pad2 } from '@/utils/time'
import { daysText, dateTaskProgress } from '@/utils/date'
import ProgressBar from './ProgressBar.vue'

const props = defineProps<{ task: Task }>()
const tasks = useTasksStore()

const isDate = computed(() => props.task.type === 'date')

const timeText = computed(() => {
  if (isDate.value) return daysText(props.task.remainingMs)
  if (props.task.status === 'finished') return '00:00:00'
  return formatMs(props.task.remainingMs)
})

const percent = computed(() => {
  if (isDate.value && props.task.targetDate) {
    return dateTaskProgress(props.task.createdAt, props.task.targetDate)
  }
  if (props.task.durationMs <= 0) return 0
  return props.task.remainingMs / props.task.durationMs
})

const statusLabel = computed(() => {
  const s = props.task.status
  if (s === 'running') return isDate.value ? '进行中' : '计时中'
  if (s === 'paused') return '已暂停'
  if (s === 'finished') return '已完成'
  return '待开始'
})

const danger = computed(
  () => props.task.status === 'running' && !isDate.value && props.task.remainingMs < 10_000
)

const hms = computed(() => {
  const total = Math.max(0, Math.ceil(props.task.remainingMs / 1000))
  return {
    h: pad2(Math.floor(total / 3600)),
    m: pad2(Math.floor((total % 3600) / 60)),
    s: pad2(total % 60)
  }
})

function toggle(): void {
  if (props.task.status === 'running') void tasks.pause(props.task.id)
  else void tasks.start(props.task.id)
}

function openWin(mode: 'float' | 'mini' | 'screen'): void {
  void window.desktopAPI.openTaskWindow(props.task.id, mode)
}
</script>

<template>
  <div class="task card" :class="{ running: task.status === 'running', done: task.status === 'finished' }">
    <div class="head">
      <div class="name-row">
        <span class="name" :title="task.title">{{ task.title }}</span>
        <span class="tag" :class="task.status">{{ statusLabel }}</span>
      </div>
      <div class="win-btns">
        <button class="btn-icon" title="悬浮窗" @click="openWin('float')">⌖</button>
        <button class="btn-icon" title="极简窗" @click="openWin('mini')">⊖</button>
        <button class="btn-icon" title="全屏模式" @click="openWin('screen')">⛶</button>
        <button class="btn-icon del" title="删除任务" @click="tasks.remove(task.id)">🗑</button>
      </div>
    </div>

    <div class="time num" :class="{ danger }">
      <template v-if="isDate">🗓 {{ timeText }}</template>
      <template v-else>{{ hms.h }}<span class="colon">:</span>{{ hms.m }}<span class="colon">:</span>{{ hms.s }}</template>
    </div>

    <div class="progress-row">
      <ProgressBar :percent="percent" />
      <span class="pct num">{{ Math.round(percent * 100) }}%</span>
    </div>

    <div class="ops">
      <template v-if="!isDate">
        <button v-if="task.status !== 'running'" class="btn btn-primary op" @click="toggle">
          {{ task.status === 'paused' ? '▶ 继续' : '▶ 开始' }}
        </button>
        <button v-else class="btn btn-primary op" @click="toggle">⏸ 暂停</button>
        <button class="btn btn-ghost op" @click="tasks.reset(task.id)">↻ 重置</button>
      </template>
      <span v-else class="date-target">目标：{{ task.targetDate }}</span>
    </div>
  </div>
</template>

<style scoped>
.task {
  padding: 13px 15px 12px;
  display: flex;
  flex-direction: column;
  gap: 9px;
  transition: all 0.2s cubic-bezier(0.2, 0.8, 0.3, 1);
}
.task:hover {
  box-shadow: var(--shadow);
  transform: translateY(-1px);
}
.task.running {
  border-color: rgba(99, 102, 241, 0.45);
}
.task.done {
  opacity: 0.75;
}
.head {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
}
.name-row {
  display: flex;
  align-items: center;
  gap: 8px;
  min-width: 0;
}
.name {
  font-size: 14px;
  font-weight: 700;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 170px;
}
.tag {
  font-size: 10.5px;
  font-weight: 700;
  padding: 2px 8px;
  border-radius: 999px;
  background: var(--card-soft);
  color: var(--text-faint);
  flex-shrink: 0;
}
.tag.running {
  background: var(--accent-soft);
  color: var(--accent);
}
.tag.finished {
  background: rgba(48, 164, 108, 0.12);
  color: var(--success);
}
.win-btns {
  display: flex;
  gap: 2px;
}
.btn-icon.del:hover {
  color: var(--danger);
  background: rgba(229, 72, 77, 0.1);
}
.time {
  font-size: 34px;
  font-weight: 800;
  letter-spacing: 1px;
  line-height: 1.1;
}
.colon {
  color: var(--text-faint);
  margin: 0 1px;
}
.danger {
  color: var(--danger);
}
.progress-row {
  display: flex;
  align-items: center;
  gap: 10px;
}
.pct {
  font-size: 12px;
  font-weight: 700;
  color: var(--text-secondary);
  width: 38px;
  text-align: right;
  flex-shrink: 0;
}
.ops {
  display: flex;
  gap: 9px;
}
.op {
  padding: 7px 16px;
  font-size: 13px;
  flex: 1;
}
.date-target {
  font-size: 12.5px;
  color: var(--text-faint);
}
</style>
