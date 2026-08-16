<script setup lang="ts">
import { useSettingsStore } from '@/stores/settings'

defineProps<{ title: string }>()
const settings = useSettingsStore()
const isMac = window.desktopAPI.platform === 'darwin'

const minimize = (): void => window.desktopAPI.minimize()
const close = (): void => window.desktopAPI.close()

function togglePin(): void {
  void window.desktopAPI.setAlwaysOnTop(!settings.alwaysOnTop)
  settings.patch({ alwaysOnTop: !settings.alwaysOnTop })
}
</script>

<template>
  <div class="title-bar" :class="{ mac: isMac }">
    <span class="title">{{ title }}</span>
    <div v-if="!isMac" class="actions">
      <button
        class="tb-btn pin"
        :class="{ active: settings.alwaysOnTop }"
        :title="settings.alwaysOnTop ? '取消置顶' : '窗口置顶'"
        @click="togglePin"
      >
        📌
      </button>
      <button class="tb-btn" title="最小化" @click="minimize">─</button>
      <button class="tb-btn close" title="关闭到托盘" @click="close">✕</button>
    </div>
  </div>
</template>

<style scoped>
.title-bar {
  -webkit-app-region: drag;
  display: flex;
  align-items: center;
  justify-content: space-between;
  height: 38px;
  padding: 0 6px 0 16px;
  flex-shrink: 0;
}
/* macOS：为红绿灯交通灯按钮留出左侧空间 */
.title-bar.mac {
  padding-left: 78px;
}
.title {
  font-size: 13px;
  color: var(--text-secondary);
  font-weight: 600;
}
.actions {
  -webkit-app-region: no-drag;
  display: flex;
}
.tb-btn {
  width: 40px;
  height: 32px;
  font-size: 12px;
  color: var(--text-secondary);
  border-radius: 6px;
}
.tb-btn:hover {
  background: rgba(127, 137, 161, 0.2);
  color: var(--text);
}
.tb-btn.pin {
  font-size: 13px;
  opacity: 0.65;
}
.tb-btn.pin:hover {
  opacity: 1;
}
.tb-btn.pin.active {
  opacity: 1;
  color: var(--accent);
  background: var(--accent-soft);
}
.tb-btn.close:hover {
  background: var(--danger);
  color: #fff;
}
</style>
