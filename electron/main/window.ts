import { BrowserWindow, screen, app } from 'electron'
import path from 'path'
import { configStore } from './store'

export type WindowMode = 'dashboard' | 'float' | 'mini' | 'screen'

export const WINDOW_SIZES: Record<WindowMode, { width: number; height: number }> = {
  dashboard: { width: 420, height: 660 },
  float: { width: 230, height: 118 },
  mini: { width: 168, height: 74 },
  screen: { width: 800, height: 500 }
}

const windows = new Map<string, BrowserWindow>()

function restoreBounds(): { x: number; y: number; width: number; height: number } | null {
  const saved = configStore.get().bounds
  if (!saved) return null
  const visible = screen.getAllDisplays().some(
    (d) =>
      saved.x + saved.width > d.workArea.x &&
      saved.x < d.workArea.x + d.workArea.width &&
      saved.y + saved.height > d.workArea.y &&
      saved.y < d.workArea.y + d.workArea.height
  )
  return visible ? saved : null
}

function baseOptions() {
  const cfg = configStore.get()
  return {
    frame: false,
    alwaysOnTop: cfg.alwaysOnTop,
    opacity: cfg.opacity,
    autoHideMenuBar: true,
    backgroundColor: '#00000000',
    webPreferences: {
      preload: path.join(__dirname, '../preload/index.js'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false
    }
  } as const
}

function loadRenderer(win: BrowserWindow, query: string): void {
  if (process.env.ELECTRON_RENDERER_URL) {
    win.loadURL(`${process.env.ELECTRON_RENDERER_URL}/${query}`)
  } else {
    win.loadFile(path.join(__dirname, '../renderer/index.html'), { search: query })
  }
}

export function getMainWindow(): BrowserWindow | null {
  const w = windows.get('main')
  return w && !w.isDestroyed() ? w : null
}

export function showMainWindow(): void {
  const win = getMainWindow()
  if (!win) return
  win.show()
  win.focus()
}

export function createMainWindow(): BrowserWindow {
  const existing = getMainWindow()
  if (existing) {
    showMainWindow()
    return existing
  }
  const restored = restoreBounds()
  const size = WINDOW_SIZES.dashboard
  const win = new BrowserWindow({
    ...baseOptions(),
    width: restored?.width ?? size.width,
    height: restored?.height ?? size.height,
    x: restored?.x,
    y: restored?.y,
    minWidth: 360,
    minHeight: 480,
    resizable: true
  })
  if (!restored) win.center()
  windows.set('main', win)

  win.on('resized', () => saveBounds(win))
  win.on('moved', () => saveBounds(win))
  win.on('close', (e) => {
    if (configStore.get().closeToTray) {
      e.preventDefault()
      win.hide()
    } else {
      windows.delete('main')
    }
  })
  win.webContents.setWindowOpenHandler(({ url }) => {
    void url
    return { action: 'deny' }
  })

  loadRenderer(win, '?view=dashboard')
  attachSmokeTest(win)
  return win
}

function attachSmokeTest(win: BrowserWindow): void {
  if (!process.env.SMOKE_TEST) return
  win.webContents.once('did-finish-load', () => {
    setTimeout(async () => {
      try {
        if (process.env.SMOKE_TEST === 'full') {
          const js = `(async () => {
            const t = await window.desktopAPI.createTask({ title: 'E2E测试', type: 'duration', durationMs: 3000 })
            await window.desktopAPI.startTask(t.id)
            await new Promise(r => setTimeout(r, 5000))
            const tasks = await window.desktopAPI.getTasks()
            const records = await window.desktopAPI.getRecords()
            return JSON.stringify({ status: tasks.find(x => x.id === t.id)?.status, records: records.length })
          })()`
          const result = await win.webContents.executeJavaScript(js)
          console.log(`SMOKE_E2E:${result}`)
        } else {
          const text = await win.webContents.executeJavaScript(
            "document.body.innerText.slice(0, 120).replace(/\\s+/g, ' ')"
          )
          console.log(`SMOKE_RESULT:${text}`)
        }
      } catch (err) {
        console.log(`SMOKE_RESULT:ERROR:${err}`)
      }
      process.exit(0)
    }, 4000)
  })
}

let boundsTimer: NodeJS.Timeout | null = null
function saveBounds(win: BrowserWindow): void {
  if (win.isDestroyed()) return
  if (boundsTimer) clearTimeout(boundsTimer)
  boundsTimer = setTimeout(() => {
    if (win.isDestroyed()) return
    const b = win.getBounds()
    configStore.patch({ bounds: { x: b.x, y: b.y, width: b.width, height: b.height } })
  }, 400)
}

/** 为单个任务打开独立小窗（悬浮/极简/全屏），同一任务同一模式只开一个 */
export function openTaskWindow(taskId: string, mode: 'float' | 'mini' | 'screen'): void {
  const key = `task-${taskId}-${mode}`
  const existing = windows.get(key)
  if (existing && !existing.isDestroyed()) {
    existing.show()
    existing.focus()
    return
  }
  const size = WINDOW_SIZES[mode]
  const win = new BrowserWindow({
    ...baseOptions(),
    width: size.width,
    height: size.height,
    minWidth: 140,
    minHeight: 56,
    resizable: mode === 'screen',
    alwaysOnTop: true,
    skipTaskbar: mode !== 'screen',
    parent: mode === 'screen' ? (getMainWindow() ?? undefined) : undefined
  })
  windows.set(key, win)
  win.on('closed', () => windows.delete(key))
  loadRenderer(win, `?view=task&id=${taskId}&mode=${mode}`)
  if (mode === 'screen') {
    win.once('ready-to-show', () => {
      win.setFullScreen(true)
    })
  }
}

export function closeWindowByKey(key: string): void {
  const win = windows.get(key)
  if (win && !win.isDestroyed()) win.close()
}

export function closeCurrent(win: BrowserWindow): void {
  win.close()
}

export function applyWindowSettings(): void {
  const cfg = configStore.get()
  for (const win of BrowserWindow.getAllWindows()) {
    if (win.isDestroyed()) continue
    win.setAlwaysOnTop(cfg.alwaysOnTop || win !== getMainWindow())
    win.setOpacity(cfg.opacity)
  }
}

export function setFullscreen(win: BrowserWindow, value: boolean): void {
  win.setFullScreen(value)
}

export function quitApp(): void {
  configStore.flush()
  app.quit()
}

export function broadcast(channel: string, payload: unknown): void {
  for (const w of BrowserWindow.getAllWindows()) {
    if (!w.isDestroyed()) w.webContents.send(channel, payload)
  }
}
