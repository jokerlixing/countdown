<script setup lang="ts">
defineProps<{ title: string }>()
const minimize = (): void => window.desktopAPI.minimize()
const close = (): void => window.desktopAPI.close()
</script>

<template>
  <div class="title-bar">
    <span class="title">{{ title }}</span>
    <div class="actions">
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
.tb-btn.close:hover {
  background: var(--danger);
  color: #fff;
}
</style>
