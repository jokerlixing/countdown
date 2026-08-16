<script setup lang="ts">
import { computed } from 'vue'
import { useTasksStore } from '@/stores/tasks'
import { formatMsShort } from '@/utils/time'
import { durationMain } from '@/utils/date'
import { taskColor } from '@/utils/color'

const tasks = useTasksStore()
const api = window.desktopAPI

const list = computed(() => tasks.tasks.filter((t) => t.status !== 'finished' || t.type !== 'duration'))

function timeOf(t: { type: string; remainingMs: number }): string {
  if (t.type === 'duration' && t.remainingMs >= 3_600_000) return formatMsShort(t.remainingMs)
  return durationMain(t.remainingMs).main
}
function subOf(t: { type: string; remainingMs: number }): string {
  if (t.type === 'duration' && t.remainingMs >= 3_600_000) return ''
  return durationMain(t.remainingMs).sub
}
</script>

<template>
  <div class="twin">
    <div class="accent-strip" />
    <div class="head">
      <span class="h-icon">📋</span>
      <span class="h-label">提醒任务</span>
      <span v-if="list.length" class="h-count num">{{ list.length }}</span>
      <button class="close" title="关闭" @click="api.closeCurrentWindow()">✕</button>
    </div>
    <div v-if="list.length === 0" class="empty">暂无提醒任务</div>
    <div v-else class="list">
      <div v-for="t in list" :key="t.id" class="item" :class="{ running: t.status === 'running' }">
        <span class="i-icon">{{ t.type === 'datetime' ? '⏰' : t.type === 'date' ? '🗓' : '⏱' }}</span>
        <div class="mid">
          <div class="name" :style="{ color: taskColor(t.id) }" :title="t.title">{{ t.title }}</div>
          <div v-if="subOf(t)" class="sub num">{{ subOf(t) }}</div>
        </div>
        <div class="time num" :class="{ danger: t.status === 'running' && t.remainingMs < 10_000 }">
          {{ t.status === 'finished' && t.type === 'duration' ? '✓' : timeOf(t) }}
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.twin {
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
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 2.5px;
  background: var(--accent-gradient);
  opacity: 0.9;
  z-index: 1;
}
.head {
  -webkit-app-region: drag;
  display: flex;
  align-items: center;
  gap: 7px;
  padding: 9px 12px;
  border-bottom: 1px solid var(--border);
  background: var(--card-soft);
}
.h-icon {
  font-size: 15px;
}
.h-label {
  font-size: 13px;
  font-weight: 800;
}
.h-count {
  font-size: 10.5px;
  font-weight: 700;
  background: var(--accent-gradient);
  color: #fff;
  padding: 1px 7px;
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
.empty {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 12.5px;
  color: var(--text-faint);
}
.list {
  flex: 1;
  overflow-y: auto;
  padding: 6px 10px;
  display: flex;
  flex-direction: column;
  gap: 4px;
}
.item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 6px 8px;
  border-radius: 9px;
  transition: background 0.15s ease;
}
.item.running {
  background: var(--accent-soft);
  box-shadow: inset 2px 0 0 var(--accent);
}
.i-icon {
  font-size: 14px;
}
.mid {
  flex: 1;
  min-width: 0;
}
.name {
  font-size: 13.5px;
  font-weight: 800;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.sub {
  font-size: 10.5px;
  color: var(--text-faint);
}
.time {
  font-size: 17px;
  font-weight: 800;
  flex-shrink: 0;
}
.danger {
  color: var(--danger);
}
</style>
