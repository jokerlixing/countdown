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
        :title="settings.alwaysOnTop ? '已置顶，点击取消' : '窗口置顶'"
        @click="togglePin"
      >
        <span v-if="settings.alwaysOnTop" class="pin-icon pinned">📍</span>
        <span v-else class="pin-icon">📌</span>
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
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border-radius: 8px;
  transition: background 0.18s ease, box-shadow 0.18s ease;
}
.pin-icon {
  display: inline-flex;
  font-size: 14px;
  line-height: 1;
  transition: transform 0.2s cubic-bezier(0.2, 0.8, 0.3, 1);
}
/* 置顶态：图钉换成 📍 斜插样式 + 渐变底 + 弹跳入场，形态与颜色双重变化 */
.pin-icon.pinned {
  transform: rotate(-35deg) scale(1.12);
  animation: pin-pop 0.28s cubic-bezier(0.2, 0.8, 0.3, 1);
}
.tb-btn.pin.active {
  background: var(--accent-gradient);
  box-shadow: 0 2px 10px rgba(99, 102, 241, 0.5);
}
@keyframes pin-pop {
  0% {
    transform: rotate(0deg) scale(0.7);
  }
  60% {
    transform: rotate(-42deg) scale(1.28);
  }
  100% {
    transform: rotate(-35deg) scale(1.12);
  }
}
.tb-btn.close:hover {
  background: var(--danger);
  color: #fff;
}
</style>
