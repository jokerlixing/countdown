import { contextBridge, ipcRenderer } from 'electron'
import type { AppConfig, Task, TaskType, FinishRecord } from '../../shared/types'

const desktopAPI = {
  // 平台信息（macOS 标题栏适配等）
  platform: process.platform as NodeJS.Platform,

  // 配置
  getConfig: (): Promise<AppConfig> => ipcRenderer.invoke('config:get'),
  patchConfig: (partial: Partial<AppConfig>): void => ipcRenderer.send('config:patch', partial),
  onConfigChanged: (cb: (cfg: AppConfig) => void): (() => void) => {
    const listener = (_e: unknown, cfg: AppConfig): void => cb(cfg)
    ipcRenderer.on('config:changed', listener)
    return () => ipcRenderer.removeListener('config:changed', listener)
  },

  // 任务
  getTasks: (): Promise<Task[]> => ipcRenderer.invoke('tasks:get'),
  createTask: (input: {
    title: string
    type: TaskType
    durationMs?: number
    targetDate?: string | null
    targetTime?: string | null
  }): Promise<Task> => ipcRenderer.invoke('tasks:create', input),
  startTask: (id: string): Promise<void> => ipcRenderer.invoke('tasks:start', id),
  pauseTask: (id: string): Promise<void> => ipcRenderer.invoke('tasks:pause', id),
  resetTask: (id: string): Promise<void> => ipcRenderer.invoke('tasks:reset', id),
  deleteTask: (id: string): Promise<void> => ipcRenderer.invoke('tasks:delete', id),
  renameTask: (id: string, title: string): Promise<void> =>
    ipcRenderer.invoke('tasks:rename', id, title),
  reorderTasks: (ids: string[]): Promise<void> => ipcRenderer.invoke('tasks:reorder', ids),
  clearFinishedTasks: (): Promise<void> => ipcRenderer.invoke('tasks:clear-finished'),
  onTasksUpdated: (cb: (tasks: Task[]) => void): (() => void) => {
    const listener = (_e: unknown, tasks: Task[]): void => cb(tasks)
    ipcRenderer.on('tasks:updated', listener)
    return () => ipcRenderer.removeListener('tasks:updated', listener)
  },
  onTaskFinished: (cb: (taskId: string) => void): (() => void) => {
    const listener = (_e: unknown, taskId: string): void => cb(taskId)
    ipcRenderer.on('task:finished', listener)
    return () => ipcRenderer.removeListener('task:finished', listener)
  },

  // 记录
  getRecords: (): Promise<FinishRecord[]> => ipcRenderer.invoke('records:get'),
  deleteRecord: (id: string): Promise<void> => ipcRenderer.invoke('records:delete', id),

  // 窗口
  openTaskWindow: (taskId: string, mode: 'float' | 'mini' | 'screen'): Promise<void> =>
    ipcRenderer.invoke('window:open-task', taskId, mode),
  openProgressWindow: (kind: 'all' | 'year' | 'month' | 'today'): Promise<void> =>
    ipcRenderer.invoke('window:open-progress', kind),
  openTasksWindow: (): Promise<void> => ipcRenderer.invoke('window:open-tasks'),
  openPanelWindow: (): Promise<void> => ipcRenderer.invoke('window:open-panel'),
  closeCurrentWindow: (): Promise<void> => ipcRenderer.invoke('window:close-current'),
  minimize: (): Promise<void> => ipcRenderer.invoke('window:minimize'),
  close: (): Promise<void> => ipcRenderer.invoke('window:close'),
  hide: (): Promise<void> => ipcRenderer.invoke('window:hide'),
  show: (): Promise<void> => ipcRenderer.invoke('window:show'),
  setAlwaysOnTop: (value: boolean): Promise<void> =>
    ipcRenderer.invoke('window:set-always-on-top', value),
  setOpacity: (value: number): Promise<void> => ipcRenderer.invoke('window:set-opacity', value),
  setFullscreen: (value: boolean): Promise<void> =>
    ipcRenderer.invoke('window:set-fullscreen', value),

  // 应用
  setAutoLaunch: (value: boolean): Promise<void> =>
    ipcRenderer.invoke('app:set-auto-launch', value),
  quit: (): Promise<void> => ipcRenderer.invoke('app:quit'),
  getAppVersion: (): Promise<string> => ipcRenderer.invoke('app:get-version'),
  notify: (title: string, body: string): Promise<void> =>
    ipcRenderer.invoke('notify', title, body)
}

contextBridge.exposeInMainWorld('desktopAPI', desktopAPI)

export type DesktopAPI = typeof desktopAPI
