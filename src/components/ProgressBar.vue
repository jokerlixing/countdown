<script setup lang="ts">
withDefaults(defineProps<{ percent: number; thin?: boolean; variant?: 'indigo' | 'violet' | 'emerald' }>(), {
  variant: 'indigo'
})
</script>

<template>
  <div class="bar" :class="{ thin }">
    <div class="fill" :class="variant" :style="{ width: `${Math.round(percent * 1000) / 10}%` }" />
  </div>
</template>

<style scoped>
.bar {
  width: 100%;
  height: 8px;
  border-radius: 999px;
  background: var(--track);
  overflow: hidden;
  border: 1px solid var(--border);
}
.bar.thin {
  height: 4px;
}
.fill {
  height: 100%;
  border-radius: 999px;
  transition: width 0.4s cubic-bezier(0.2, 0.8, 0.3, 1);
}
.fill.indigo {
  background: linear-gradient(90deg, #6366f1, #4f46e5);
}
.fill.violet {
  background: linear-gradient(90deg, #a78bfa, #7c3aed);
}
.fill.emerald {
  background: linear-gradient(90deg, #34d399, #059669);
}
</style>
