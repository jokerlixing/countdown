import { app } from 'electron'
import { createMainWindow, getMainWindow, showMainWindow } from './window'
import { createTray, destroyTray } from './tray'
import { registerIpc } from './ipc'
import { configStore } from './store'
import { initLogger, log } from './logger'
import { registerGlobalShortcut, unregisterGlobalShortcuts } from './shortcut'
import { loadTasks, startTicking, stopTicking } from './tasks'

initLogger()
log.info('App starting...', app.getVersion())

// 单实例限制：重复启动时聚焦已有窗口，而不是开第二个应用
if (!app.requestSingleInstanceLock()) {
  log.info('Another instance is running, quitting this one')
  app.quit()
} else {
  app.on('second-instance', () => {
    log.info('Second instance detected, showing main window')
    showMainWindow()
  })

  registerIpc()
  loadTasks()

  app.whenReady().then(() => {
    try {
      startTicking()
      createMainWindow()
      createTray()
      registerGlobalShortcut()
    } catch (err) {
      log.error('Startup failed', err)
    }
  })

  app.on('window-all-closed', () => {
    // 托盘常驻，不退出；由托盘菜单触发 app.quit()
  })

  app.on('before-quit', () => {
    unregisterGlobalShortcuts()
    destroyTray()
    stopTicking()
    const win = getMainWindow()
    if (win && !win.isDestroyed()) {
      win.removeAllListeners('close')
    }
    try {
      configStore.flush()
    } catch {
      /* ignore */
    }
  })

  app.on('quit', () => log.info('App quit'))
}
