import { ipcMain, app, BrowserWindow } from 'electron'
import {
  getMainWindow,
  showMainWindow,
  openTaskWindow,
  openProgressWindow,
  openTasksWindow,
  openPanelWindow,
  closeCurrent,
  applyWindowSettings,
  setFullscreen,
  quitApp
} from './window'
import { configStore } from './store'
import { notify } from './tray'
import {
  getSnapshot,
  createTask,
  startTask,
  pauseTask,
  resetTask,
  deleteTask,
  renameTask,
  reorderTasks,
  toggleAll,
  getRecords,
  deleteRecord,
  type TaskType
} from './tasks'

export function registerIpc(): void {
  // ---- 任务 ----
  ipcMain.handle('tasks:get', () => getSnapshot())
  ipcMain.handle(
    'tasks:create',
    (
      _e,
      input: {
        title: string
        type: TaskType
        durationMs?: number
        targetDate?: string | null
        targetTime?: string | null
      }
    ) => createTask(input)
  )
  ipcMain.handle('tasks:start', (_e, id: string) => startTask(id))
  ipcMain.handle('tasks:pause', (_e, id: string) => pauseTask(id))
  ipcMain.handle('tasks:reset', (_e, id: string) => resetTask(id))
  ipcMain.handle('tasks:delete', (_e, id: string) => deleteTask(id))
  ipcMain.handle('tasks:rename', (_e, id: string, title: string) => renameTask(id, title))
  ipcMain.handle('tasks:reorder', (_e, ids: string[]) => reorderTasks(ids))
  ipcMain.handle('tasks:toggle-all', () => toggleAll())

  // ---- 记录 ----
  ipcMain.handle('records:get', () => getRecords())
  ipcMain.handle('records:delete', (_e, id: string) => deleteRecord(id))

  // ---- 窗口 ----
  ipcMain.handle('window:open-task', (_e, taskId: string, mode: 'float' | 'mini' | 'screen') =>
    openTaskWindow(taskId, mode)
  )
  ipcMain.handle('window:open-progress', (_e, kind: 'all' | 'year' | 'month' | 'today') =>
    openProgressWindow(kind)
  )
  ipcMain.handle('window:open-tasks', () => openTasksWindow())
  ipcMain.handle('window:open-panel', () => openPanelWindow())
  ipcMain.handle('window:close-current', (e) => closeCurrent(e.sender as unknown as BrowserWindow))
  ipcMain.handle('window:minimize', () => getMainWindow()?.minimize())
  ipcMain.handle('window:close', () => getMainWindow()?.close())
  ipcMain.handle('window:hide', () => getMainWindow()?.hide())
  ipcMain.handle('window:show', () => showMainWindow())
  ipcMain.handle('window:set-fullscreen', (e, value: boolean) =>
    setFullscreen(BrowserWindow.fromWebContents(e.sender)!, value)
  )

  ipcMain.handle('window:set-always-on-top', (_e, value: boolean) => {
    getMainWindow()?.setAlwaysOnTop(value, 'screen-saver')
    configStore.patch({ alwaysOnTop: value })
  })

  ipcMain.handle('window:set-opacity', (_e, value: number) => {
    const clamped = Math.min(1, Math.max(0.3, value))
    configStore.patch({ opacity: clamped })
    applyWindowSettings()
  })

  ipcMain.on('config:patch', (_e, partial: Record<string, unknown>) => {
    configStore.patch(partial)
    applyWindowSettings()
  })

  // ---- 应用 ----
  ipcMain.handle('app:set-auto-launch', (_e, value: boolean) => {
    app.setLoginItemSettings({
      openAtLogin: value,
      path: process.execPath,
      args: value ? ['--hidden'] : []
    })
    configStore.patch({ autoLaunch: value })
  })

  ipcMain.handle('app:quit', () => quitApp())
  ipcMain.handle('notify', (_e, title: string, body: string) => notify(title, body))
  ipcMain.handle('dev:is-packaged', () => app.isPackaged)
}
