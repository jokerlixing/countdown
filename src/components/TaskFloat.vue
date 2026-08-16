<script setup lang="ts">
import { computed, ref } from 'vue'
import type { Task } from '@/types'
import { formatMsShort } from '@/utils/time'
import { daysText, dateTaskProgress } from '@/utils/date'
import ProgressBar from './ProgressBar.vue'

const props = defineProps<{ task: Task; mini: boolean }>()
const hover = ref(false)
let hideTimer: ReturnType<typeof setTimeout> | null = null

const timeText = computed(() =>
  props.task.type === 'date' ? daysText(props.task.remainingMs) : formatMsShort(props.task.remainingMs)
)

const percent = computed(() => {
  if (props.task.type === 'date' && props.task.targetDate) {
    return dateTaskProgress(props.task.createdAt, props.task.targetDate)
  }
  return props.task.durationMs > 0 ? props.task.remainingMs / props.task.durationMs : 0
})

const danger = computed(
  () => props.task.status === 'running' && props.task.type === 'duration' && props.task.remainingMs < 10_000
)

const api = window.desktopAPI

function toggle(): void {
  if (props.task.status === 'running') void api.pauseTask(props.task.id)
  else void api.startTask(props.task.id)
}

function enter(): void {
  if (hideTimer) clearTimeout(hideTimer)
  hover.value = true
}
function leave(): void {
  if (hideTimer) clearTimeout(hideTimer)
  hideTimer = setTimeout(() => (hover.value = false), 1000)
}
</script>

<template>
  <div class="float" :class="{ mini }" @mouseenter="enter" @mouseleave="leave">
    <div class="top">
      <span class="label">{{ task.status === 'finished' && task.type === 'duration' ? '完成!' : task.title }}</span>
      <Transition name="fade">
        <div v-if="hover" class="tools">
          <button v-if="task.type === 'duration'" class="t-btn" @click="toggle">
            {{ task.status === 'running' ? '⏸' : '▶' }}
          </button>
          <button v-if="task.type === 'duration'" class="t-btn" title="重置" @click="api.resetTask(task.id)">↻</button>
          <button class="t-btn" title="关闭" @click="api.closeCurrentWindow()">✕</button>
        </div>
      </Transition>
    </div>
    <div class="time num" :class="{ danger }">{{ timeText }}</div>
    <ProgressBar v-if="!mini" :percent="percent" thin />
  </div>
</template>

<style scoped>
.float {
  -webkit-app-region: drag;
  height: 100%;
  display: flex;
  flex-direction: column;
  justify-content: center;
  gap: 5px;
  padding: 8px 12px;
  background: var(--card);
  border: 1px solid var(--border);
  border-radius: 12px;
  box-shadow: var(--shadow-lg);
}
.top {
  display: flex;
  align-items: center;
  justify-content: space-between;
  min-height: 20px;
}
.label {
  font-size: 11.5px;
  color: var(--text-secondary);
  font-weight: 600;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.time {
  font-size: 34px;
  font-weight: 800;
  letter-spacing: 1px;
  line-height: 1;
}
.mini .time {
  font-size: 24px;
}
.danger {
  color: var(--danger);
}
.tools {
  -webkit-app-region: no-drag;
  display: flex;
  gap: 3px;
}
.t-btn {
  width: 24px;
  height: 24px;
  border-radius: 7px;
  font-size: 12px;
  background: var(--accent-soft);
  color: var(--accent);
  display: inline-flex;
  align-items: center;
  justify-content: center;
}
.t-btn:hover {
  filter: brightness(1.1);
}
</style>
