<script setup lang="ts">
import { useSettingsStore } from '@/stores/settings'
import type { ThemeMode } from '@/types'

const settings = useSettingsStore()
const options: { value: ThemeMode; label: string }[] = [
  { value: 'light', label: '浅色' },
  { value: 'dark', label: '深色' },
  { value: 'system', label: '跟随系统' }
]
</script>

<template>
  <div class="selector">
    <span>主题</span>
    <div class="group">
      <button
        v-for="opt in options"
        :key="opt.value"
        class="opt"
        :class="{ active: settings.theme === opt.value }"
        @click="settings.patch({ theme: opt.value })"
      >
        {{ opt.label }}
      </button>
    </div>
  </div>
</template>

<style scoped>
.selector {
  padding: 10px 0;
  font-size: 14px;
}
.group {
  display: flex;
  gap: 6px;
  margin-top: 8px;
}
.opt {
  flex: 1;
  padding: 7px 0;
  border-radius: 8px;
  font-size: 13px;
  border: 1px solid var(--border);
  color: var(--text-secondary);
  transition: all 0.15s ease;
}
.opt.active {
  background: var(--accent);
  border-color: var(--accent);
  color: #fff;
  font-weight: 600;
}
</style>
