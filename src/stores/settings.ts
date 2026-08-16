import { defineStore } from 'pinia'
import { ref } from 'vue'
import type { Settings, UiMode } from '@/types'

export const useSettingsStore = defineStore('settings', () => {
  const loaded = ref(false)
  const defaultDurationSec = ref(25 * 60)
  const lastDurationSec = ref(25 * 60)
  const title = ref('倒计时')
  const alwaysOnTop = ref(false)
  const opacity = ref(1)
  const soundEnabled = ref(true)
  const notificationEnabled = ref(true)
  const volume = ref(0.8)
  const theme = ref<'light' | 'dark' | 'system'>('system')
  const autoLaunch = ref(false)
  const closeToTray = ref(true)
  const uiMode = ref<UiMode>('full')

  async function load(): Promise<void> {
    const cfg = await window.desktopAPI.getConfig()
    apply(cfg)
    loaded.value = true
    window.desktopAPI.onConfigChanged(apply)
  }

  function apply(cfg: Partial<Settings>): void {
    if (cfg.defaultDurationSec !== undefined) defaultDurationSec.value = cfg.defaultDurationSec
    if (cfg.lastDurationSec !== undefined) lastDurationSec.value = cfg.lastDurationSec
    if (cfg.title !== undefined) title.value = cfg.title
    if (cfg.alwaysOnTop !== undefined) alwaysOnTop.value = cfg.alwaysOnTop
    if (cfg.opacity !== undefined) opacity.value = cfg.opacity
    if (cfg.soundEnabled !== undefined) soundEnabled.value = cfg.soundEnabled
    if (cfg.notificationEnabled !== undefined) notificationEnabled.value = cfg.notificationEnabled
    if (cfg.volume !== undefined) volume.value = cfg.volume
    if (cfg.theme !== undefined) theme.value = cfg.theme
    if (cfg.autoLaunch !== undefined) autoLaunch.value = cfg.autoLaunch
    if (cfg.closeToTray !== undefined) closeToTray.value = cfg.closeToTray
    if (cfg.uiMode !== undefined) uiMode.value = cfg.uiMode
  }

  function patch(partial: Partial<Settings>): void {
    apply(partial)
    window.desktopAPI.patchConfig(partial as Record<string, unknown>)
  }

  function setUiMode(mode: UiMode): void {
    uiMode.value = mode
    window.desktopAPI.setMode(mode)
  }

  return {
    loaded,
    defaultDurationSec,
    lastDurationSec,
    title,
    alwaysOnTop,
    opacity,
    soundEnabled,
    notificationEnabled,
    volume,
    theme,
    autoLaunch,
    closeToTray,
    uiMode,
    load,
    patch,
    setUiMode
  }
})
