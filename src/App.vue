<script setup lang="ts">
import { computed, onMounted, ref, watchEffect } from 'vue'
import { useTimerStore } from '@/stores/timer'
import { useSettingsStore } from '@/stores/settings'
import { useUiStore } from '@/stores/ui'
import { useShortcuts } from '@/composables/useShortcuts'
import { playFinish } from '@/services/sound'
import TitleBar from '@/components/TitleBar.vue'
import TimerDisplay from '@/components/TimerDisplay.vue'
import TimerControls from '@/components/TimerControls.vue'
import QuickTimer from '@/components/QuickTimer.vue'
import TimeEditor from '@/components/TimeEditor.vue'
import TitleEditor from '@/components/TitleEditor.vue'
import SettingsPanel from '@/components/SettingsPanel.vue'
import FloatingTimer from '@/components/FloatingTimer.vue'
import FinishedOverlay from '@/components/FinishedOverlay.vue'

const timer = useTimerStore()
const settings = useSettingsStore()
const ui = useUiStore()

const toast = ref('')
let toastTimer: ReturnType<typeof setTimeout> | null = null

function showToast(msg: string): void {
  toast.value = msg
  if (toastTimer) clearTimeout(toastTimer)
  toastTimer = setTimeout(() => (toast.value = ''), 2500)
}

const isFull = computed(() => settings.uiMode === 'full')

const systemDark = ref(window.matchMedia('(prefers-color-scheme: dark)').matches)
window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', (e) => {
  systemDark.value = e.matches
})

watchEffect(() => {
  const dark = settings.theme === 'dark' || (settings.theme === 'system' && systemDark.value)
  document.documentElement.classList.toggle('dark', dark)
})

onMounted(async () => {
  await settings.load()
  timer.setTitle(settings.title)
  timer.setDuration(settings.lastDurationSec * 1000)

  window.desktopAPI.onTrayToggleTimer(() => timer.toggle())
  window.desktopAPI.onTrayResetTimer(() => timer.reset())

  timer.setOnFinish(() => {
    if (settings.soundEnabled) playFinish(settings.volume)
    if (settings.notificationEnabled) {
      const t = timer.title === '倒计时' ? '倒计时结束！' : `${timer.title}时间到！`
      window.desktopAPI.notify('桌面倒计时', t)
    }
  })
})

watchEffect(() => {
  settings.patch({ lastDurationSec: Math.round(timer.duration / 1000), title: timer.title })
})

useShortcuts({
  onSpace: () => timer.toggle(),
  onR: () => timer.reset(),
  onEsc: () => {
    if (ui.showSettings) ui.showSettings = false
    else if (settings.uiMode !== 'full') settings.setUiMode('full')
  }
})

function selectPreset(minutes: number): void {
  timer.reset()
  timer.setDuration(minutes * 60 * 1000)
}
</script>

<template>
  <div class="app" :class="{ compact: !isFull }">
    <template v-if="isFull">
      <TitleBar title="桌面倒计时" />
      <div class="main card">
        <div class="settings-entry">
          <button class="btn-icon" title="设置" @click="ui.showSettings = true">⚙</button>
        </div>
        <TitleEditor />
        <TimerDisplay />
        <TimeEditor />
        <TimerControls @invalid="showToast('请输入有效的倒计时时间。')" />
        <QuickTimer @select="selectPreset" />
        <button class="float-btn" @click="settings.setUiMode('float')">⌖ 悬浮到桌面</button>
      </div>
    </template>
    <FloatingTimer v-else :mini="settings.uiMode === 'mini'" />
    <SettingsPanel />
    <FinishedOverlay
      v-if="isFull && timer.status === 'finished'"
      @again="timer.start()"
      @close="timer.reset()"
    />
    <Transition name="fade">
      <div v-if="toast" class="toast">{{ toast }}</div>
    </Transition>
  </div>
</template>

<style scoped>
.app {
  height: 100%;
  display: flex;
  flex-direction: column;
  background: var(--bg);
  border-radius: var(--radius);
  overflow: hidden;
}
.app:not(.compact) {
  border: 1px solid var(--border);
}
.app.compact {
  background: transparent;
  padding: 4px;
}
.main {
  position: relative;
  flex: 1;
  margin: 0 12px 14px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 22px;
  box-shadow: var(--shadow);
}
.settings-entry {
  position: absolute;
  top: 12px;
  right: 12px;
}
.float-btn {
  padding: 9px 24px;
  border-radius: 999px;
  font-size: 13px;
  font-weight: 600;
  color: var(--accent);
  border: 1px dashed var(--accent);
  transition: all 0.15s ease;
}
.float-btn:hover {
  background: var(--accent);
  color: #fff;
}
.toast {
  position: fixed;
  bottom: 24px;
  left: 50%;
  transform: translateX(-50%);
  padding: 9px 18px;
  border-radius: 10px;
  background: rgba(30, 32, 40, 0.9);
  color: #fff;
  font-size: 13px;
  z-index: 30;
}
</style>
