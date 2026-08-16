import path from 'path'
import fs from 'fs'
import { app, ipcMain } from 'electron'
import { log } from './logger'
import type { AppConfig, WindowBounds } from '../../shared/types'

export type { AppConfig, WindowBounds }

export const defaultConfig: AppConfig = {
  defaultDurationSec: 25 * 60,
  lastDurationSec: 25 * 60,
  title: '倒计时',
  bounds: null,
  alwaysOnTop: false,
  opacity: 1,
  soundEnabled: true,
  notificationEnabled: true,
  volume: 0.8,
  theme: 'system',
  autoLaunch: false,
  miniMode: false,
  closeToTray: true,
  uiMode: 'full',
  autoPushEnabled: false,
  autoPushRepoPath: ''
}

function configFile(): string {
  return path.join(app.getPath('userData'), 'config.json')
}

function readConfig(): AppConfig {
  try {
    const raw = fs.readFileSync(configFile(), 'utf-8')
    const parsed = JSON.parse(raw) as Partial<AppConfig>
    return { ...defaultConfig, ...parsed }
  } catch (err) {
    log.warn('Config read failed, using defaults:', err)
    return { ...defaultConfig }
  }
}

class ConfigStore {
  private data: AppConfig
  private saveTimer: NodeJS.Timeout | null = null

  constructor() {
    this.data = readConfig()
  }

  get(): AppConfig {
    return this.data
  }

  patch(partial: Partial<AppConfig>): AppConfig {
    this.data = { ...this.data, ...partial }
    this.scheduleSave()
    return this.data
  }

  private scheduleSave(): void {
    if (this.saveTimer) clearTimeout(this.saveTimer)
    this.saveTimer = setTimeout(() => this.flush(), 300)
  }

  flush(): void {
    try {
      fs.mkdirSync(path.dirname(configFile()), { recursive: true })
      fs.writeFileSync(configFile(), JSON.stringify(this.data, null, 2))
    } catch (err) {
      log.error('Config save failed:', err)
    }
  }
}

export const configStore = new ConfigStore()

ipcMain.handle('config:get', () => configStore.get())
ipcMain.on('config:patch', (_e, partial: Partial<AppConfig>) => {
  configStore.patch(partial)
})
