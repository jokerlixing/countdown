<script setup lang="ts">
defineProps<{ percent: number; thin?: boolean }>()
</script>

<template>
  <div class="bar" :class="{ thin }">
    <div class="fill" :style="{ width: `${Math.round(percent * 1000) / 10}%` }" />
  </div>
</template>

<style scoped>
.bar {
  width: 100%;
  height: 8px;
  border-radius: 999px;
  background: var(--card-soft);
  overflow: hidden;
  border: 1px solid var(--border);
}
.bar.thin {
  height: 4px;
}
.fill {
  height: 100%;
  border-radius: 999px;
  background: var(--accent-gradient);
  transition: width 0.4s cubic-bezier(0.2, 0.8, 0.3, 1);
}
</style>
