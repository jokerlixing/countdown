<script setup lang="ts">
import { ref } from 'vue'
import { useSettingsStore } from '@/stores/settings'
import SwitchRow from './SwitchRow.vue'
import OpacitySlider from './OpacitySlider.vue'
import ThemeSelector from './ThemeSelector.vue'

const show = defineModel<boolean>('show', { required: true })
const settings = useSettingsStore()

// 关于页版本号自动取自应用本身（package.json），发版后无需手工更新
const appVersion = ref('…')
void window.desktopAPI.getAppVersion().then((v: string) => (appVersion.value = v))

function toggleAlwaysOnTop(v: boolean): void {
  void window.desktopAPI.setAlwaysOnTop(v)
  settings.patch({ alwaysOnTop: v })
}

function toggleAutoLaunch(v: boolean): void {
  void window.desktopAPI.setAutoLaunch(v)
  settings.patch({ autoLaunch: v })
}
</script>

<template>
  <Transition name="fade">
    <div v-if="show" class="mask" @click.self="show = false">
      <div class="panel card">
        <div class="head">
          <span>设置</span>
          <button class="btn-icon" @click="show = false">✕</button>
        </div>
        <div class="body">
          <div class="section-title">常规</div>
          <SwitchRow label="开机自动启动" :model-value="settings.autoLaunch" @update:model-value="toggleAutoLaunch" />
          <SwitchRow label="关闭到托盘" :model-value="settings.closeToTray" @update:model-value="(v: boolean) => settings.patch({ closeToTray: v })" />
          <SwitchRow label="始终置顶" :model-value="settings.alwaysOnTop" @update:model-value="toggleAlwaysOnTop" />

          <div class="section-title">外观</div>
          <ThemeSelector />
          <OpacitySlider />

          <div class="section-title">提醒</div>
          <SwitchRow label="提示音" :model-value="settings.soundEnabled" @update:model-value="(v: boolean) => settings.patch({ soundEnabled: v })" />
          <SwitchRow label="系统通知" :model-value="settings.notificationEnabled" @update:model-value="(v: boolean) => settings.patch({ notificationEnabled: v })" />
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
              <span class="val num">{{ Math.round(settings.volume * 100) }}%</span>
            </div>
          </div>

          <div class="section-title">关于</div>
          <div class="about">
            <div class="name">桌面倒计时 · Desktop Countdown</div>
            <div class="ver">版本 {{ appVersion }} · Electron + Vue 3</div>
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
  background: rgba(10, 12, 20, 0.4);
  backdrop-filter: blur(2px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 10;
}
.panel {
  width: 330px;
  max-height: 520px;
  display: flex;
  flex-direction: column;
  box-shadow: var(--shadow-lg);
}
.head {
  -webkit-app-region: drag;
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 13px 10px 8px 18px;
  font-weight: 800;
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
  font-size: 11.5px;
  font-weight: 700;
  color: var(--accent);
  margin: 15px 0 2px;
  letter-spacing: 1px;
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
input[type='range'] {
  flex: 1;
}
.val {
  width: 42px;
  text-align: right;
  color: var(--text-secondary);
  font-size: 13px;
}
.about {
  padding: 8px 0;
  font-size: 13px;
  color: var(--text-secondary);
  line-height: 1.7;
}
.name {
  font-weight: 700;
  color: var(--text);
}
</style>
