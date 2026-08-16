import { Tray, Menu, nativeImage, app, Notification } from 'electron'
import path from 'path'
import { getMainWindow, showMainWindow, quitApp } from './window'
import { configStore } from './store'
import { toggleAll, resetTask, getSnapshot } from './tasks'
import { log } from './logger'

let tray: Tray | null = null

function iconPath(): string {
  return app.isPackaged
    ? path.join(process.resourcesPath, 'resources', 'icons', 'icon.png')
    : path.join(app.getAppPath(), 'resources', 'icons', 'icon.png')
}

export function createTray(): void {
  try {
    const image = nativeImage.createFromPath(iconPath())
    tray = new Tray(image.isEmpty() ? nativeImage.createEmpty() : image.resize({ width: 16, height: 16 }))
    rebuildMenu()
    tray.setToolTip('桌面倒计时')
    // 单击托盘即可显示主窗口，右键弹出菜单
    tray.on('click', () => showMainWindow())
    tray.on('double-click', () => showMainWindow())
  } catch (err) {
    log.error('Tray creation failed:', err)
  }
}

export function rebuildMenu(): void {
  if (!tray) return
  const cfg = configStore.get()
  const menu = Menu.buildFromTemplate([
    { label: '打开主窗口', click: () => showMainWindow() },
    { type: 'separator' },
    { label: '开始 / 暂停', click: () => toggleAll() },
    { label: '重置当前任务', click: () => {
      const running = getSnapshot().find((t) => t.status === 'running')
      if (running) resetTask(running.id)
    } },
    {
      label: '始终置顶',
      type: 'checkbox',
      checked: cfg.alwaysOnTop,
      click: (item) => {
        getMainWindow()?.setAlwaysOnTop(item.checked)
        configStore.patch({ alwaysOnTop: item.checked })
        getMainWindow()?.webContents.send('config:changed', configStore.get())
      }
    },
    { type: 'separator' },
    { label: '退出', click: () => quitApp() }
  ])
  tray.setContextMenu(menu)
}

export function destroyTray(): void {
  if (tray) {
    tray.destroy()
    tray = null
  }
}

export function notify(title: string, body: string): void {
  try {
    if (!Notification.isSupported()) {
      log.warn('Notification not supported')
      return
    }
    const n = new Notification({ title, body })
    n.on('click', () => showMainWindow())
    n.show()
  } catch (err) {
    log.error('Notification failed:', err)
  }
}
