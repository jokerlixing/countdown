import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { Task, TaskType, FinishRecord } from '@/types'

export const useTasksStore = defineStore('tasks', () => {
  const tasks = ref<Task[]>([])
  const records = ref<FinishRecord[]>([])
  const loaded = ref(false)

  const runningCount = computed(() => tasks.value.filter((t) => t.status === 'running').length)
  const durationTasks = computed(() => tasks.value.filter((t) => t.type === 'duration'))
  const dateTasks = computed(() => tasks.value.filter((t) => t.type === 'date'))

  const api = window.desktopAPI

  async function init(): Promise<void> {
    tasks.value = await api.getTasks()
    records.value = await api.getRecords()
    loaded.value = true
    api.onTasksUpdated((list: Task[]) => (tasks.value = list))
  }

  async function createTask(input: {
    title: string
    type: TaskType
    durationMs?: number
    targetDate?: string | null
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

  async function loadRecords(): Promise<void> {
    records.value = await api.getRecords()
  }
  async function removeRecord(id: string): Promise<void> {
    await api.deleteRecord(id)
    await loadRecords()
  }

  function getTask(id: string): Task | undefined {
    return tasks.value.find((t) => t.id === id)
  }

  return {
    tasks,
    records,
    loaded,
    runningCount,
    durationTasks,
    dateTasks,
    init,
    createTask,
    start,
    pause,
    reset,
    remove,
    loadRecords,
    removeRecord,
    getTask
  }
})
