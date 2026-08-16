<script setup lang="ts">
import { useSettingsStore } from '@/stores/settings'

const settings = useSettingsStore()
</script>

<template>
  <div class="slider">
    <span>窗口透明度</span>
    <div class="line">
      <input
        type="range"
        min="0.6"
        max="1"
        step="0.05"
        :value="settings.opacity"
        @input="settings.patch({ opacity: Number(($event.target as HTMLInputElement).value) })"
      />
      <span class="val">{{ Math.round(settings.opacity * 100) }}%</span>
    </div>
  </div>
</template>

<style scoped>
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
