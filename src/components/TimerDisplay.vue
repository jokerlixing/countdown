<script setup lang="ts">
import { computed } from 'vue'
import { useTimerStore } from '@/stores/timer'
import { pad2 } from '@/utils/time'

const timer = useTimerStore()

const danger = computed(() => timer.status === 'running' && timer.remaining < 10_000)
</script>

<template>
  <div class="display" :class="{ danger, finished: timer.status === 'finished' }">
    <span class="digit">{{ pad2(timer.display.h) }}</span><span class="sep">:</span
    ><span class="digit">{{ pad2(timer.display.m) }}</span><span class="sep">:</span
    ><span class="digit">{{ pad2(timer.display.s) }}</span>
  </div>
</template>

<style scoped>
.display {
  font-size: 56px;
  font-weight: 700;
  letter-spacing: 2px;
  font-variant-numeric: tabular-nums;
  transition: color 0.2s ease;
}
.sep {
  color: var(--text-secondary);
  animation: blink 2s infinite;
  margin: 0 2px;
}
.danger {
  color: var(--danger);
}
.finished {
  color: var(--accent);
}
@keyframes blink {
  0%,
  100% {
    opacity: 1;
  }
  50% {
    opacity: 0.35;
  }
}
</style>
