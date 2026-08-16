export type TimerStatus = 'idle' | 'running' | 'paused' | 'finished'
export type UiMode = 'full' | 'float' | 'mini'
export type ThemeMode = 'light' | 'dark' | 'system'

export interface Settings {
  defaultDurationSec: number
  lastDurationSec: number
  title: string
  alwaysOnTop: boolean
  opacity: number
  soundEnabled: boolean
  notificationEnabled: boolean
  volume: number
  theme: ThemeMode
  autoLaunch: boolean
  miniMode: boolean
  closeToTray: boolean
  uiMode: UiMode
}

export interface TimerState {
  duration: number
  remaining: number
  status: TimerStatus
  title: string
  endTime: number | null
}
