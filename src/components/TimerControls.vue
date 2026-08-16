<script setup lang="ts">
import { computed } from 'vue'
import { useTimerStore } from '@/stores/timer'

const timer = useTimerStore()
const emit = defineEmits<{ invalid: [] }>()

const canStart = computed(() => timer.status === 'idle' || timer.status === 'finished')
const canResume = computed(() => timer.status === 'paused')

function onStart(): void {
  if (timer.duration <= 0) {
    emit('invalid')
    return
  }
  timer.start()
}

function onResume(): void {
  timer.resume()
}

function onReset(): void {
  timer.reset()
}
</script>

<template>
  <div class="controls">
    <button v-if="canStart" class="btn btn-primary" @click="onStart">▶ 开始</button>
    <button v-else-if="canResume" class="btn btn-primary" @click="onResume">▶ 继续</button>
    <button v-else class="btn btn-primary" @click="timer.pause()">⏸ 暂停</button>
    <button class="btn btn-ghost" @click="onReset">↻ 重置</button>
  </div>
</template>

<style scoped>
.controls {
  display: flex;
  gap: 12px;
  justify-content: center;
}
</style>
