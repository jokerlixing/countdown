<script setup lang="ts">
import { ref, watch } from 'vue'
import { useTimerStore } from '@/stores/timer'

const timer = useTimerStore()
const draft = ref(timer.title)

watch(
  () => timer.title,
  (t) => (draft.value = t)
)

function commit(): void {
  timer.setTitle(draft.value)
}
</script>

<template>
  <div class="title-editor" v-if="timer.status === 'idle' || timer.status === 'finished'">
    <input
      v-model="draft"
      placeholder="给任务起个名字，如：学习"
      maxlength="20"
      @change="commit"
      @blur="commit"
      @keyup.enter="($event.target as HTMLInputElement).blur()"
    />
  </div>
  <div v-else class="static-title">{{ timer.title }}</div>
</template>

<style scoped>
.title-editor {
  -webkit-app-region: no-drag;
}
input {
  width: 200px;
  padding: 8px 14px;
  text-align: center;
  font-size: 15px;
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
.static-title {
  font-size: 17px;
  font-weight: 600;
  color: var(--text-secondary);
}
</style>
