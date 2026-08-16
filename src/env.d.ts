import type { DesktopAPI } from '../../electron/preload/index'

declare global {
  interface Window {
    desktopAPI: DesktopAPI
  }
}

export {}
