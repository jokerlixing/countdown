<script setup lang="ts">
import { onMounted, watchEffect } from 'vue'
import { useTasksStore } from '@/stores/tasks'
import { useSettingsStore } from '@/stores/settings'
import { playFinish } from '@/services/sound'
import Dashboard from '@/views/Dashboard.vue'
import TaskWindow from '@/views/TaskWindow.vue'
import ProgressWindow from '@/views/ProgressWindow.vue'
import TasksWindow from '@/views/TasksWindow.vue'
import PanelWindow from '@/views/PanelWindow.vue'

const params = new URLSearchParams(window.location.search)
const view = params.get('view') ?? 'dashboard'
const taskId = params.get('id') ?? ''
const modeParam = (params.get('mode') ?? 'float') as 'float' | 'mini' | 'screen'
const kindParam = (params.get('kind') ?? 'all') as 'all' | 'year' | 'month' | 'today'
const isTaskWindow = view === 'task' && taskId !== ''
const isProgressWindow = view === 'progress'
const isTasksWindow = view === 'tasks'
const isPanelWindow = view === 'panel'

const tasks = useTasksStore()
const settings = useSettingsStore()

const systemDark = window.matchMedia('(prefers-color-scheme: dark)')
watchEffect(() => {
  const dark = settings.theme === 'dark' || (settings.theme === 'system' && systemDark.matches)
  document.documentElement.classList.toggle('dark', dark)
})

onMounted(async () => {
  await Promise.all([settings.load(), tasks.init()])

  // 提示音只在主窗口播放，避免多窗口重复响铃
  if (!isTaskWindow && !isProgressWindow && !isTasksWindow && !isPanelWindow) {
    window.desktopAPI.onTaskFinished(() => {
      if (settings.soundEnabled) playFinish(settings.volume)
    })
  }
})
</script>

<template>
  <PanelWindow v-if="isPanelWindow" />
  <ProgressWindow v-else-if="isProgressWindow" :kind="kindParam" />
  <TasksWindow v-else-if="isTasksWindow" />
  <Dashboard v-else-if="!isTaskWindow" />
  <TaskWindow v-else :task-id="taskId" :mode="modeParam" />
</template>

<style scoped>
/* 布局由子视图自管 */
</style>
