import { ipcMain, app } from 'electron'
import { getMainWindow, setUiMode, showMainWindow, quitApp } from './window'
import { configStore } from './store'
import { notify } from './tray'

export function registerIpc(): void {
  ipcMain.handle('window:minimize', () => getMainWindow()?.minimize())
  ipcMain.handle('window:close', () => getMainWindow()?.close())
  ipcMain.handle('window:hide', () => getMainWindow()?.hide())

  ipcMain.handle('window:set-always-on-top', (_e, value: boolean) => {
    getMainWindow()?.setAlwaysOnTop(value, 'screen-saver')
    configStore.patch({ alwaysOnTop: value })
  })

  ipcMain.handle('window:set-opacity', (_e, value: number) => {
    const clamped = Math.min(1, Math.max(0.3, value))
    getMainWindow()?.setOpacity(clamped)
    configStore.patch({ opacity: clamped })
  })

  ipcMain.handle('window:set-mode', (_e, mode: 'full' | 'float' | 'mini') => setUiMode(mode))

  ipcMain.handle('window:show', () => showMainWindow())

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
}
