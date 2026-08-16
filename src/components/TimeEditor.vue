<script setup lang="ts">
import { ref, watch } from 'vue'
import { useTimerStore } from '@/stores/timer'
import { clamp } from '@/utils/time'

const timer = useTimerStore()
const hours = ref(0)
const minutes = ref(25)
const seconds = ref(0)

function fromMs(ms: number): void {
  const total = Math.floor(ms / 1000)
  hours.value = Math.min(99, Math.floor(total / 3600))
  minutes.value = Math.floor((total % 3600) / 60)
  seconds.value = total % 60
}

fromMs(timer.duration)
watch(
  () => timer.duration,
  (ms) => fromMs(ms)
)

watch([hours, minutes, seconds], () => {
  hours.value = clamp(hours.value, 0, 99)
  minutes.value = clamp(minutes.value, 0, 59)
  seconds.value = clamp(seconds.value, 0, 59)
  timer.setDuration((hours.value * 3600 + minutes.value * 60 + seconds.value) * 1000)
})
</script>

<template>
  <div class="editor" v-if="timer.status === 'idle' || timer.status === 'finished'">
    <div class="field">
      <input v-model.number="hours" type="number" min="0" max="99" />
      <span>时</span>
    </div>
    <div class="field">
      <input v-model.number="minutes" type="number" min="0" max="59" />
      <span>分</span>
    </div>
    <div class="field">
      <input v-model.number="seconds" type="number" min="0" max="59" />
      <span>秒</span>
    </div>
  </div>
</template>

<style scoped>
.editor {
  display: flex;
  gap: 10px;
  justify-content: center;
  -webkit-app-region: no-drag;
}
.field {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
  font-size: 12px;
  color: var(--text-secondary);
}
input {
  width: 64px;
  height: 44px;
  text-align: center;
  font-size: 20px;
  font-weight: 600;
  border: 1px solid var(--border);
  border-radius: 10px;
  background: var(--card);
  color: var(--text);
  outline: none;
}
input:focus {
  border-color: var(--accent);
}
input::-webkit-outer-spin-button,
input::-webkit-inner-spin-button {
  -webkit-appearance: none;
}
</style>
