import fs from 'fs'
import path from 'path'
import crypto from 'crypto'
import { app, BrowserWindow } from 'electron'
import { configStore } from './store'
import { notify } from './tray'
import { log } from './logger'
import { scheduleAutoPush } from './autopush'
import { showMainWindow } from './window'
import type { Task, TaskType, TaskStatus, FinishRecord } from '../../shared/types'

export type { Task, TaskType, TaskStatus, FinishRecord }

const TICK_MS = 250

let tasks: Task[] = []
let records: FinishRecord[] = []
let ticker: NodeJS.Timeout | null = null

function tasksFile(): string {
  return path.join(app.getPath('userData'), 'tasks.json')
}
function recordsFile(): string {
  return path.join(app.getPath('userData'), 'records.json')
}

export function loadTasks(): void {
  try {
    tasks = JSON.parse(fs.readFileSync(tasksFile(), 'utf-8')) as Task[]
  } catch {
    tasks = []
  }
  try {
    records = JSON.parse(fs.readFileSync(recordsFile(), 'utf-8')) as FinishRecord[]
  } catch {
    records = []
  }
  // 启动时校正：已过期的运行中任务标记为结束（不补记录）
  const now = Date.now()
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

function saveRecords(): void {
  try {
    fs.mkdirSync(path.dirname(recordsFile()), { recursive: true })
    fs.writeFileSync(recordsFile(), JSON.stringify(records, null, 2))
  } catch (err) {
    log.error('records.json save failed:', err)
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
      const rem =
        t.status === 'finished' ? 0 : Math.max(0, target - now)
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
  const rec: FinishRecord = {
    id: crypto.randomUUID(),
    taskId: t.id,
    title: t.title,
    type: t.type,
    durationSec: Math.round(t.durationMs / 1000),
    finishedAt: Date.now()
  }
  records.unshift(rec)
  if (records.length > 500) records = records.slice(0, 500)
  saveRecords()

  const cfg = configStore.get()
  if (cfg.notificationEnabled) {
    notify('桌面倒计时', t.title === '倒计时' ? '倒计时结束！' : `${t.title}时间到！`)
  }
  // 提醒时间到时自动弹出主窗口，确保用户看到提醒
  showMainWindow()
  for (const w of BrowserWindow.getAllWindows()) {
    if (!w.isDestroyed()) w.webContents.send('task:finished', t.id)
  }
  scheduleAutoPush()
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
  tasks = tasks.filter((t) => t.id !== id)
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

export function getRecords(): FinishRecord[] {
  return records
}

export function deleteRecord(id: string): void {
  records = records.filter((r) => r.id !== id)
  saveRecords()
  scheduleAutoPush()
}

export function getRecordsJson(): string {
  return JSON.stringify(records, null, 2)
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
