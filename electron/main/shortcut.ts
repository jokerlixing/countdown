import { globalShortcut } from 'electron'
import { getMainWindow, showMainWindow } from './window'
import { log } from './logger'

export function registerGlobalShortcut(): void {
  try {
    globalShortcut.register('Ctrl+Alt+T', () => {
      const win = getMainWindow()
      if (!win) return
      if (win.isVisible() && win.isFocused()) win.hide()
      else showMainWindow()
    })
  } catch (err) {
    log.warn('Global shortcut registration failed:', err)
  }
}

export function unregisterGlobalShortcuts(): void {
  globalShortcut.unregisterAll()
}
