<script setup lang="ts">
import { computed } from 'vue'
import type { Task } from '@/types'
import { formatMs } from '@/utils/time'
import { daysText, dateTaskProgress } from '@/utils/date'
import { taskColor } from '@/utils/color'
import ProgressBar from './ProgressBar.vue'

const props = defineProps<{ task: Task }>()
const api = window.desktopAPI

const timeText = computed(() =>
  props.task.type === 'date' ? daysText(props.task.remainingMs) : formatMs(props.task.remainingMs)
)

const percent = computed(() => {
  if (props.task.type === 'date' && props.task.targetDate) {
    return dateTaskProgress(props.task.createdAt, props.task.targetDate)
  }
  return props.task.durationMs > 0 ? props.task.remainingMs / props.task.durationMs : 0
})

function exit(): void {
  void api.setFullscreen(false)
  void api.closeCurrentWindow()
}
</script>

<template>
  <div class="screen">
    <button class="exit" title="退出全屏 (Esc)" @click="exit">✕ 退出全屏</button>
    <div class="title">
      <span class="t-icon">{{ task.type === 'date' ? '🗓' : '⏱' }}</span>
      <span class="t-name" :style="{ color: taskColor(task.id) }">{{ task.title }}</span>
    </div>
    <div class="time num">{{ task.status === 'finished' && task.type === 'duration' ? '00:00:00' : timeText }}</div>
    <div class="progress">
      <ProgressBar :percent="percent" />
      <span class="pct num">{{ Math.round(percent * 100) }}%</span>
    </div>
    <div v-if="task.type === 'duration'" class="ops">
      <button v-if="task.status !== 'running'" class="btn btn-primary" @click="api.startTask(task.id)">
        {{ task.status === 'paused' ? '▶ 继续' : '▶ 开始' }}
      </button>
      <button v-else class="btn btn-primary" @click="api.pauseTask(task.id)">⏸ 暂停</button>
      <button class="btn btn-ghost" @click="api.resetTask(task.id)">↻ 重置</button>
    </div>
    <div class="esc-hint">按 Esc 退出全屏</div>
  </div>
</template>

<style scoped>
.screen {
  height: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 26px;
  background: var(--bg-gradient);
  position: relative;
}
.exit {
  position: absolute;
  top: 22px;
  right: 28px;
  padding: 8px 16px;
  border-radius: var(--radius-sm);
  font-size: 13px;
  font-weight: 600;
  color: var(--text-secondary);
  border: 1px solid var(--border);
  background: var(--card);
  -webkit-app-region: no-drag;
}
.exit:hover {
  color: var(--danger);
  border-color: var(--danger);
}
.title {
  font-size: 26px;
  font-weight: 800;
  display: flex;
  align-items: center;
  gap: 10px;
}
.t-icon {
  font-size: 26px;
}
.t-name {
  font-size: 28px;
  font-weight: 800;
}
.time {
  font-size: 110px;
  font-weight: 800;
  letter-spacing: 4px;
  line-height: 1;
  background: var(--accent-gradient);
  -webkit-background-clip: text;
  background-clip: text;
  -webkit-text-fill-color: transparent;
}
.progress {
  width: min(480px, 60vw);
  display: flex;
  align-items: center;
  gap: 14px;
}
.pct {
  font-size: 18px;
  font-weight: 800;
  color: var(--accent);
  width: 52px;
}
.ops {
  display: flex;
  gap: 14px;
}
.esc-hint {
  font-size: 12px;
  color: var(--text-faint);
}
</style>
