<script setup lang="ts">
import { computed } from 'vue'
import { useTimerStore } from '@/stores/timer'
import { useUiStore } from '@/stores/ui'
import { useSettingsStore } from '@/stores/settings'
import { formatMsShort } from '@/utils/time'

const timer = useTimerStore()
const ui = useUiStore()
const settings = useSettingsStore()

const props = defineProps<{ mini: boolean }>()

const timeText = computed(() => formatMsShort(timer.remaining))
const danger = computed(() => timer.status === 'running' && timer.remaining < 10_000)

function backToFull(): void {
  settings.setUiMode('full')
}
</script>

<template>
  <div
    class="float"
    :class="{ mini: props.mini }"
    @mouseenter="ui.floatingEnter"
    @mouseleave="ui.floatingLeave"
  >
    <div class="info">
      <div v-if="timer.status !== 'finished'" class="label">{{ timer.title }}</div>
      <div class="time" :class="{ danger }">
        {{ timer.status === 'finished' ? '时间到!' : timeText }}
      </div>
    </div>
    <Transition name="fade">
      <div v-if="ui.hoverFloating" class="tools">
        <button v-if="timer.status !== 'running'" class="t-btn" title="开始/继续" @click="timer.start()">▶</button>
        <button v-else class="t-btn" title="暂停" @click="timer.pause()">⏸</button>
        <button class="t-btn" title="重置" @click="timer.reset()">↻</button>
        <button v-if="!props.mini" class="t-btn" title="极简模式" @click="settings.setUiMode('mini')">⊖</button>
        <button v-if="props.mini" class="t-btn" title="恢复完整模式" @click="backToFull">⤢</button>
      </div>
    </Transition>
  </div>
</template>

<style scoped>
.float {
  -webkit-app-region: drag;
  height: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 10px;
  background: var(--card);
  border: 1px solid var(--border);
  border-radius: var(--radius);
  box-shadow: var(--shadow);
}
.float.mini {
  border-radius: 10px;
}
.info {
  text-align: center;
}
.label {
  font-size: 12px;
  color: var(--text-secondary);
  margin-bottom: 2px;
  font-weight: 600;
}
.time {
  font-size: 40px;
  font-weight: 700;
  font-variant-numeric: tabular-nums;
  letter-spacing: 1px;
}
.mini .time {
  font-size: 26px;
}
.danger {
  color: var(--danger);
}
.tools {
  -webkit-app-region: no-drag;
  display: flex;
  gap: 6px;
}
.t-btn {
  width: 32px;
  height: 32px;
  border-radius: 8px;
  font-size: 14px;
  background: rgba(127, 137, 161, 0.12);
  color: var(--text-secondary);
  transition: all 0.15s ease;
}
.t-btn:hover {
  color: var(--accent);
  background: rgba(127, 137, 161, 0.22);
}
</style>
