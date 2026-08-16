import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { Task, TaskType } from '@/types'

export const useTasksStore = defineStore('tasks', () => {
  const tasks = ref<Task[]>([])
  const loaded = ref(false)

  const runningCount = computed(() => tasks.value.filter((t) => t.status === 'running').length)

  const api = window.desktopAPI

  async function init(): Promise<void> {
    tasks.value = await api.getTasks()
    loaded.value = true
    api.onTasksUpdated((list: Task[]) => (tasks.value = list))
  }

  async function createTask(input: {
    title: string
    type: TaskType
    durationMs?: number
    targetDate?: string | null
    targetTime?: string | null
  }): Promise<void> {
    await api.createTask(input)
  }

  async function start(id: string): Promise<void> {
    await api.startTask(id)
  }
  async function pause(id: string): Promise<void> {
    await api.pauseTask(id)
  }
  async function reset(id: string): Promise<void> {
    await api.resetTask(id)
  }
  async function remove(id: string): Promise<void> {
    await api.deleteTask(id)
  }

  async function rename(id: string, title: string): Promise<void> {
    await api.renameTask(id, title)
  }

  async function reorder(ids: string[]): Promise<void> {
    await api.reorderTasks(ids)
  }

  function getTask(id: string): Task | undefined {
    return tasks.value.find((t) => t.id === id)
  }

  return {
    tasks,
    loaded,
    runningCount,
    init,
    createTask,
    start,
    pause,
    reset,
    remove,
    rename,
    reorder,
    getTask
  }
})
