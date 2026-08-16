<script setup lang="ts">
import { useUiStore } from '@/stores/ui'
import { useSettingsStore } from '@/stores/settings'
import TopMostSwitch from './TopMostSwitch.vue'
import OpacitySlider from './OpacitySlider.vue'
import ThemeSelector from './ThemeSelector.vue'

const ui = useUiStore()
const settings = useSettingsStore()

function toggleAlwaysOnTop(v: boolean): void {
  window.desktopAPI.setAlwaysOnTop(v)
  settings.patch({ alwaysOnTop: v })
}

function toggleAutoLaunch(v: boolean): void {
  window.desktopAPI.setAutoLaunch(v)
  settings.patch({ autoLaunch: v })
}
</script>

<template>
  <Transition name="fade">
    <div v-if="ui.showSettings" class="mask" @click.self="ui.showSettings = false">
      <div class="panel card">
        <div class="head">
          <span>设置</span>
          <button class="btn-icon" @click="ui.showSettings = false">✕</button>
        </div>
        <div class="body">
          <div class="section-title">常规</div>
          <TopMostSwitch label="开机自动启动" :model-value="settings.autoLaunch" @update:model-value="toggleAutoLaunch" />
          <TopMostSwitch label="关闭到托盘" :model-value="settings.closeToTray" @update:model-value="(v: boolean) => settings.patch({ closeToTray: v })" />
          <TopMostSwitch label="始终置顶" :model-value="settings.alwaysOnTop" @update:model-value="toggleAlwaysOnTop" />

          <div class="section-title">外观</div>
          <ThemeSelector />
          <OpacitySlider />

          <div class="section-title">提醒</div>
          <TopMostSwitch label="提示音" :model-value="settings.soundEnabled" @update:model-value="(v: boolean) => settings.patch({ soundEnabled: v })" />
          <TopMostSwitch label="系统通知" :model-value="settings.notificationEnabled" @update:model-value="(v: boolean) => settings.patch({ notificationEnabled: v })" />
          <div class="slider">
            <span>音量</span>
            <div class="line">
              <input
                type="range"
                min="0"
                max="1"
                step="0.05"
                :value="settings.volume"
                @input="settings.patch({ volume: Number(($event.target as HTMLInputElement).value) })"
              />
              <span class="val">{{ Math.round(settings.volume * 100) }}%</span>
            </div>
          </div>

          <div class="section-title">关于</div>
          <div class="about">
            <div class="name">桌面倒计时 · Desktop Countdown</div>
            <div class="ver">版本 0.1.0</div>
          </div>
        </div>
      </div>
    </div>
  </Transition>
</template>

<style scoped>
.mask {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.35);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 10;
}
.panel {
  width: 320px;
  max-height: 500px;
  display: flex;
  flex-direction: column;
  box-shadow: var(--shadow);
}
.head {
  -webkit-app-region: drag;
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 10px 8px 18px;
  font-weight: 700;
  font-size: 15px;
}
.head .btn-icon {
  -webkit-app-region: no-drag;
}
.body {
  padding: 0 18px 16px;
  overflow-y: auto;
}
.section-title {
  font-size: 12px;
  font-weight: 700;
  color: var(--accent);
  margin: 14px 0 2px;
  letter-spacing: 1px;
}
.about {
  padding: 8px 0;
  font-size: 13px;
  color: var(--text-secondary);
  line-height: 1.7;
}
.name {
  font-weight: 600;
  color: var(--text);
}
.slider {
  padding: 10px 0;
  font-size: 14px;
}
.line {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-top: 8px;
}
input {
  flex: 1;
}
.val {
  width: 42px;
  text-align: right;
  font-variant-numeric: tabular-nums;
  color: var(--text-secondary);
  font-size: 13px;
}
</style>
