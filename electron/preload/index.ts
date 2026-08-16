import { contextBridge, ipcRenderer } from 'electron'
import type { AppConfig } from '../main/store'

const desktopAPI = {
  getConfig: (): Promise<AppConfig> => ipcRenderer.invoke('config:get'),
  patchConfig: (partial: Partial<AppConfig>): void => ipcRenderer.send('config:patch', partial),
  onConfigChanged: (cb: (cfg: AppConfig) => void): (() => void) => {
    const listener = (_e: unknown, cfg: AppConfig): void => cb(cfg)
    ipcRenderer.on('config:changed', listener)
    return () => ipcRenderer.removeListener('config:changed', listener)
  },
  minimize: (): Promise<void> => ipcRenderer.invoke('window:minimize'),
  close: (): Promise<void> => ipcRenderer.invoke('window:close'),
  hide: (): Promise<void> => ipcRenderer.invoke('window:hide'),
  show: (): Promise<void> => ipcRenderer.invoke('window:show'),
  setAlwaysOnTop: (value: boolean): Promise<void> =>
    ipcRenderer.invoke('window:set-always-on-top', value),
  setOpacity: (value: number): Promise<void> => ipcRenderer.invoke('window:set-opacity', value),
  setMode: (mode: 'full' | 'float' | 'mini'): Promise<void> =>
    ipcRenderer.invoke('window:set-mode', mode),
  setAutoLaunch: (value: boolean): Promise<void> => ipcRenderer.invoke('app:set-auto-launch', value),
  quit: (): Promise<void> => ipcRenderer.invoke('app:quit'),
  notify: (title: string, body: string): Promise<void> => ipcRenderer.invoke('notify', title, body),
  onTrayToggleTimer: (cb: () => void): (() => void) => {
    const listener = (): void => cb()
    ipcRenderer.on('tray:toggle-timer', listener)
    return () => ipcRenderer.removeListener('tray:toggle-timer', listener)
  },
  onTrayResetTimer: (cb: () => void): (() => void) => {
    const listener = (): void => cb()
    ipcRenderer.on('tray:reset-timer', listener)
    return () => ipcRenderer.removeListener('tray:reset-timer', listener)
  }
}

contextBridge.exposeInMainWorld('desktopAPI', desktopAPI)

export type DesktopAPI = typeof desktopAPI
