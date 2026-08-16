import { BrowserWindow, shell, screen, app } from 'electron'
import path from 'path'
import { configStore, WindowBounds } from './store'
import { log } from './logger'

export const WINDOW_SIZES: Record<'full' | 'float' | 'mini', { width: number; height: number }> = {
  full: { width: 400, height: 600 },
  float: { width: 280, height: 180 },
  mini: { width: 200, height: 96 }
}

let mainWindow: BrowserWindow | null = null

function restoreBounds(): WindowBounds | null {
  const saved = configStore.get().bounds
  if (!saved) return null
  const visible = screen.getAllDisplays().some(
    (d) =>
      saved.x + saved.width > d.workArea.x &&
      saved.x < d.workArea.x + d.workArea.width &&
      saved.y + saved.height > d.workArea.y &&
      saved.y < d.workArea.y + d.workArea.height
  )
  if (!visible) {
    log.warn('Saved window bounds outside visible displays, resetting')
    return null
  }
  return saved
}

export function createMainWindow(): BrowserWindow {
  const cfg = configStore.get()
  const size = WINDOW_SIZES[cfg.uiMode]
  const restored = restoreBounds()

  mainWindow = new BrowserWindow({
    width: restored?.width ?? size.width,
    height: restored?.height ?? size.height,
    x: restored?.x,
    y: restored?.y,
    minWidth: 180,
    minHeight: 80,
    frame: false,
    resizable: cfg.uiMode === 'full',
    alwaysOnTop: cfg.alwaysOnTop,
    opacity: cfg.opacity,
    skipTaskbar: cfg.uiMode !== 'full',
    autoHideMenuBar: true,
    backgroundColor: '#00000000',
    webPreferences: {
      preload: path.join(__dirname, '../preload/index.js'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false
    }
  })

  if (!restored) mainWindow.center()

  mainWindow.on('resized', saveBounds)
  mainWindow.on('moved', saveBounds)

  mainWindow.on('close', (e) => {
    if (configStore.get().closeToTray) {
      e.preventDefault()
      mainWindow?.hide()
    }
  })

  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url)
    return { action: 'deny' }
  })

  if (process.env.ELECTRON_RENDERER_URL) {
    mainWindow.loadURL(process.env.ELECTRON_RENDERER_URL)
  } else {
    mainWindow.loadFile(path.join(__dirname, '../renderer/index.html'))
  }

  if (process.env.SMOKE_TEST) {
    mainWindow.webContents.once('did-finish-load', () => {
      setTimeout(async () => {
        try {
          const text = await mainWindow?.webContents.executeJavaScript(
            "document.querySelector('.display')?.innerText ?? 'NO_DISPLAY'"
          )
          console.log(`SMOKE_RESULT:${text}`)
        } catch (err) {
          console.log(`SMOKE_RESULT:ERROR:${err}`)
        }
        process.exit(0)
      }, 4000)
    })
  }

  return mainWindow
}

let boundsTimer: NodeJS.Timeout | null = null
function saveBounds(): void {
  if (!mainWindow || mainWindow.isDestroyed()) return
  if (boundsTimer) clearTimeout(boundsTimer)
  boundsTimer = setTimeout(() => {
    if (!mainWindow || mainWindow.isDestroyed()) return
    const b = mainWindow.getBounds()
    if (mainWindow.isVisible() || !configStore.get().closeToTray) {
      configStore.patch({ bounds: { x: b.x, y: b.y, width: b.width, height: b.height } })
    }
  }, 400)
}

export function getMainWindow(): BrowserWindow | null {
  return mainWindow && !mainWindow.isDestroyed() ? mainWindow : null
}

export function showMainWindow(): void {
  const win = getMainWindow()
  if (!win) return
  win.show()
  win.focus()
}

export function setUiMode(mode: 'full' | 'float' | 'mini'): void {
  const win = getMainWindow()
  if (!win) return
  configStore.patch({ uiMode: mode })
  const size = WINDOW_SIZES[mode]
  win.setResizable(mode === 'full')
  win.setSize(size.width, size.height)
  win.setSkipTaskbar(mode !== 'full')
}

export function quitApp(): void {
  configStore.flush()
  app.quit()
}
