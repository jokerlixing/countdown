<script setup lang="ts">
import { computed, ref } from 'vue'
import type { Task } from '@/types'
import { formatMsShort } from '@/utils/time'
import { dateTaskProgress, dateParts } from '@/utils/date'
import { taskColor } from '@/utils/color'
import ProgressBar from './ProgressBar.vue'

const props = defineProps<{ task: Task; mini: boolean }>()
const hover = ref(false)
let hideTimer: ReturnType<typeof setTimeout> | null = null

const parts = computed(() => dateParts(props.task.remainingMs))

const timeText = computed(() =>
  props.task.type === 'date' ? `${parts.value.days} 天` : formatMsShort(props.task.remainingMs)
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
    <div class="accent-strip" />
    <div class="top">
      <span class="label">
        <span class="t-icon">{{ task.type === 'date' ? '🗓' : '⏱' }}</span>
        <span class="t-name" :style="{ color: taskColor(task.id) }">{{
          task.status === 'finished' && task.type === 'duration' ? '完成!' : task.title
        }}</span>
      </span>
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
    <div v-if="task.type === 'date'" class="date-hms num">{{ parts.hms }}</div>
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
.top {
  display: flex;
  align-items: center;
  justify-content: space-between;
  min-height: 20px;
  max-width: 100%;
}
.label {
  font-size: 12px;
  font-weight: 800;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  display: inline-flex;
  align-items: center;
  gap: 4px;
  min-width: 0;
}
.t-icon {
  font-size: 13px;
}
.t-name {
  font-size: 13.5px;
  overflow: hidden;
  text-overflow: ellipsis;
}
.time {
  font-size: 36px;
  font-weight: 800;
  letter-spacing: 1px;
  line-height: 1;
}
.mini .time {
  font-size: 25px;
}
.date-hms {
  font-size: 12.5px;
  font-weight: 700;
  color: var(--accent);
  letter-spacing: 1px;
  margin-top: -3px;
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
