import fs from 'fs'
import path from 'path'
import crypto from 'crypto'
import { app, BrowserWindow } from 'electron'
import { configStore } from './store'
import { notify } from './tray'
import { log } from './logger'
import { showMainWindowToFront } from './window'
import type { Task, TaskType, TaskStatus } from '../../shared/types'

export type { Task, TaskType, TaskStatus }

const TICK_MS = 250
/** 完成后自动从所有列表消失的延时 */
const AUTO_HIDE_MS = 30_000

let tasks: Task[] = []
let ticker: NodeJS.Timeout | null = null
const hideTimers = new Map<string, NodeJS.Timeout>()

function tasksFile(): string {
  return path.join(app.getPath('userData'), 'tasks.json')
}

export function loadTasks(): void {
  try {
    tasks = JSON.parse(fs.readFileSync(tasksFile(), 'utf-8')) as Task[]
  } catch {
    tasks = []
  }
  // 启动时校正：已完成的任务不再重新出现，已过期的运行任务标记为结束
  const now = Date.now()
  tasks = tasks.filter((t) => t.status !== 'finished')
  for (const t of tasks) {
    if (t.type === 'datetime') {
      if (t.targetTime === undefined || t.targetTime === null) t.targetTime = null
    }
    if (t.status === 'running') {
      if ((t.type === 'duration' || t.type === 'datetime') && t.endTime !== null && t.endTime <= now) {
        t.status = 'finished'
        t.remainingMs = 0
        t.endTime = null
      }
    }
  }
  saveTasks()
}

function saveTasks(): void {
  try {
    fs.mkdirSync(path.dirname(tasksFile()), { recursive: true })
    fs.writeFileSync(tasksFile(), JSON.stringify(tasks, null, 2))
  } catch (err) {
    log.error('tasks.json save failed:', err)
  }
}

function broadcast(): void {
  for (const w of BrowserWindow.getAllWindows()) {
    if (!w.isDestroyed()) {
      w.webContents.send('tasks:updated', snapshot())
    }
  }
}

function taskTargetTime(t: Task): number | null {
  if (!t.targetDate) return null
  if (t.type === 'datetime') {
    if (!t.targetTime) return null
    return new Date(`${t.targetDate}T${t.targetTime}`).getTime()
  }
  if (t.type === 'date') return new Date(`${t.targetDate}T23:59:59`).getTime()
  return null
}

/** 带实时剩余时间的快照（不落盘） */
function snapshot(): Task[] {
  const now = Date.now()
  return tasks.map((t) => {
    const target = taskTargetTime(t)
    if (target !== null) {
      const rem = t.status === 'finished' ? 0 : Math.max(0, target - now)
      return { ...t, remainingMs: rem }
    }
    if (t.status === 'running' && t.endTime !== null) {
      return { ...t, remainingMs: Math.max(0, t.endTime - now) }
    }
    return { ...t }
  })
}

function tick(): void {
  const now = Date.now()
  let changed = false
  for (const t of tasks) {
    if (
      t.status === 'running' &&
      (t.type === 'duration' || t.type === 'datetime') &&
      t.endTime !== null &&
      t.endTime <= now
    ) {
      t.remainingMs = 0
      t.endTime = null
      t.status = 'finished'
      changed = true
      onTaskFinished(t)
    }
  }
  broadcast()
  if (changed) saveTasks()
}

function onTaskFinished(t: Task): void {
  const cfg = configStore.get()
  if (cfg.notificationEnabled) {
    notify('桌面倒计时', t.title === '倒计时' ? '倒计时结束！' : `${t.title}时间到！`)
  }
  // 提醒时以最高优先级把主页弹到桌面最前端
  showMainWindowToFront()
  for (const w of BrowserWindow.getAllWindows()) {
    if (!w.isDestroyed()) w.webContents.send('task:finished', t.id)
  }
  scheduleAutoHide(t.id)
}

/** 完成 30 秒后任务自动消失（若期间被重新武装则取消） */
function scheduleAutoHide(id: string): void {
  const old = hideTimers.get(id)
  if (old) clearTimeout(old)
  hideTimers.set(
    id,
    setTimeout(() => {
      hideTimers.delete(id)
      const t = tasks.find((x) => x.id === id)
      if (t && t.status === 'finished') {
        tasks = tasks.filter((x) => x.id !== id)
        saveTasks()
        broadcast()
      }
    }, AUTO_HIDE_MS)
  )
}

function cancelAutoHide(id: string): void {
  const old = hideTimers.get(id)
  if (old) {
    clearTimeout(old)
    hideTimers.delete(id)
  }
}

// ---------- 对外操作 ----------
export function getSnapshot(): Task[] {
  return snapshot()
}

export function createTask(input: {
  title: string
  type: TaskType
  durationMs?: number
  targetDate?: string | null
  targetTime?: string | null
}): Task {
  const now = Date.now()
  const isDatetime = input.type === 'datetime'
  const target =
    isDatetime && input.targetDate && input.targetTime
      ? new Date(`${input.targetDate}T${input.targetTime}`).getTime()
      : null
  const t: Task = {
    id: crypto.randomUUID(),
    title: input.title.trim() || '倒计时',
    type: input.type,
    durationMs:
      input.type === 'duration'
        ? Math.max(1000, input.durationMs ?? 25 * 60 * 1000)
        : target !== null
          ? Math.max(1, target - now)
          : 0,
    targetDate: input.type === 'date' || isDatetime ? (input.targetDate ?? null) : null,
    targetTime: isDatetime ? (input.targetTime ?? null) : null,
    createdAt: now,
    endTime: isDatetime ? target : null,
    remainingMs:
      input.type === 'duration'
        ? Math.max(1000, input.durationMs ?? 25 * 60 * 1000)
        : target !== null
          ? Math.max(0, target - now)
          : 0,
    // 定点倒计时创建即自动运行，到点触发提醒
    status: isDatetime ? 'running' : 'idle'
  }
  tasks.unshift(t)
  saveTasks()
  broadcast()
  return t
}

export function startTask(id: string): void {
  const t = tasks.find((x) => x.id === id)
  if (!t || t.type === 'date' || t.type === 'datetime') return
  if (t.status === 'running') return
  if (t.status !== 'paused') t.remainingMs = t.durationMs
  if (t.remainingMs <= 0) return
  t.endTime = Date.now() + t.remainingMs
  t.status = 'running'
  saveTasks()
  broadcast()
}

export function pauseTask(id: string): void {
  const t = tasks.find((x) => x.id === id)
  if (!t || t.status !== 'running' || t.endTime === null) return
  t.remainingMs = Math.max(0, t.endTime - Date.now())
  t.endTime = null
  t.status = 'paused'
  saveTasks()
  broadcast()
}

export function resetTask(id: string): void {
  const t = tasks.find((x) => x.id === id)
  if (!t) return
  cancelAutoHide(id)
  if (t.type === 'datetime') {
    // 重新武装定点倒计时；目标已过则保持完成状态
    const target = taskTargetTime(t)
    if (target !== null && target > Date.now()) {
      t.endTime = target
      t.remainingMs = target - Date.now()
      t.status = 'running'
    } else {
      t.endTime = null
      t.remainingMs = 0
      t.status = 'finished'
    }
  } else {
    t.remainingMs = t.durationMs
    t.endTime = null
    t.status = 'idle'
  }
  saveTasks()
  broadcast()
}

export function deleteTask(id: string): void {
  cancelAutoHide(id)
  tasks = tasks.filter((t) => t.id !== id)
  saveTasks()
  broadcast()
}

/** 重命名任务（含运行中） */
export function renameTask(id: string, title: string): void {
  const t = tasks.find((x) => x.id === id)
  if (!t) return
  t.title = title.trim() || '倒计时'
  saveTasks()
  broadcast()
}

/** 按给定 id 顺序重排任务（拖拽排序） */
export function reorderTasks(ids: string[]): void {
  const map = new Map(tasks.map((t) => [t.id, t]))
  const next: Task[] = []
  for (const id of ids) {
    const t = map.get(id)
    if (t) {
      next.push(t)
      map.delete(id)
    }
  }
  for (const t of tasks) {
    if (map.has(t.id)) next.push(t)
  }
  tasks = next
  saveTasks()
  broadcast()
}

export function toggleAll(): void {
  const running = tasks.some((t) => t.status === 'running')
  if (running) {
    for (const t of tasks) if (t.status === 'running') pauseTask(t.id)
  } else {
    const next = tasks.find((t) => t.status === 'paused') ?? tasks.find((t) => t.status === 'idle')
    if (next) startTask(next.id)
  }
}

export function startTicking(): void {
  if (!ticker) ticker = setInterval(tick, TICK_MS)
}

export function stopTicking(): void {
  if (ticker) {
    clearInterval(ticker)
    ticker = null
  }
}
