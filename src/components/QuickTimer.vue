<script setup lang="ts">
const presets = [5, 10, 15, 25, 30, 60]

const emit = defineEmits<{ select: [minutes: number] }>()
</script>

<template>
  <div class="quick">
    <button
      v-for="m in presets"
      :key="m"
      class="chip"
      @click="emit('select', m)"
    >
      {{ m }}m
    </button>
  </div>
</template>

<style scoped>
.quick {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
  justify-content: center;
}
.chip {
  padding: 6px 14px;
  border-radius: 999px;
  font-size: 13px;
  font-weight: 600;
  color: var(--text-secondary);
  background: var(--card);
  border: 1px solid var(--border);
  transition: all 0.15s ease;
}
.chip:hover {
  color: var(--accent);
  border-color: var(--accent);
}
</style>
