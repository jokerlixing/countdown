export type TaskType = 'duration' | 'date'
export type TaskStatus = 'idle' | 'running' | 'paused' | 'finished'

export interface Task {
  id: string
  title: string
  type: TaskType
  durationMs: number
  targetDate: string | null
  createdAt: number
  endTime: number | null
  remainingMs: number
  status: TaskStatus
}

export interface FinishRecord {
  id: string
  taskId: string
  title: string
  type: TaskType
  durationSec: number
  finishedAt: number
}

export interface WindowBounds {
  x: number
  y: number
  width: number
  height: number
}

export type ThemeMode = 'light' | 'dark' | 'system'

export interface AppConfig {
  defaultDurationSec: number
  lastDurationSec: number
  title: string
  bounds: WindowBounds | null
  alwaysOnTop: boolean
  opacity: number
  soundEnabled: boolean
  notificationEnabled: boolean
  volume: number
  theme: ThemeMode
  autoLaunch: boolean
  miniMode: boolean
  closeToTray: boolean
  uiMode: 'full' | 'float' | 'mini'
  autoPushEnabled: boolean
  autoPushRepoPath: string
}
