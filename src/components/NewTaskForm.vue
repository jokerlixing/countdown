<script setup lang="ts">
import { ref, computed } from 'vue'
import { useTasksStore } from '@/stores/tasks'
import type { TaskType } from '@/types'
import { clamp } from '@/utils/time'

const tasks = useTasksStore()

const mode = ref<TaskType>('duration')
const title = ref('')
const hours = ref(0)
const minutes = ref(25)
const seconds = ref(0)
const targetDate = ref('')
const error = ref('')

const presets = [5, 10, 15, 25, 30, 60]
const today = new Date().toISOString().slice(0, 10)

const totalSec = computed(
  () => clamp(hours.value, 0, 99) * 3600 + clamp(minutes.value, 0, 59) * 60 + clamp(seconds.value, 0, 59)
)

function applyPreset(m: number): void {
  hours.value = Math.floor(m / 60)
  minutes.value = m % 60
  seconds.value = 0
}

async function submit(): Promise<void> {
  error.value = ''
  if (mode.value === 'duration') {
    if (totalSec.value <= 0) {
      error.value = '请输入有效的倒计时时间。'
      return
    }
    await tasks.createTask({ title: title.value, type: 'duration', durationMs: totalSec.value * 1000 })
  } else {
    if (!targetDate.value || targetDate.value < today) {
      error.value = '请选择今天或以后的日期。'
      return
    }
    await tasks.createTask({ title: title.value, type: 'date', targetDate: targetDate.value })
  }
  title.value = ''
}

const canSubmit = computed(() => {
  if (mode.value === 'duration') return totalSec.value > 0
  return Boolean(targetDate.value)
})
</script>

<template>
  <div class="form card">
    <div class="mode-row">
      <button class="chip" :class="{ active: mode === 'duration' }" @click="mode = 'duration'">⏱ 时长倒计时</button>
      <button class="chip" :class="{ active: mode === 'date' }" @click="mode = 'date'">📅 日期 / 纪念日</button>
    </div>

    <input
      v-model="title"
      class="title-input"
      :placeholder="mode === 'duration' ? '任务名称（如：学习）' : '名称（如：生日、纪念日）'"
      maxlength="20"
      @keyup.enter="submit"
    />

    <template v-if="mode === 'duration'">
      <div class="hms">
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
      <div class="presets">
        <button v-for="m in presets" :key="m" class="chip" @click="applyPreset(m)">{{ m }}m</button>
      </div>
    </template>

    <template v-else>
      <div class="date-row">
        <input v-model="targetDate" type="date" :min="today" class="date-input" />
        <span v-if="targetDate && targetDate >= today" class="date-hint">
          距今约 {{ Math.ceil((new Date(`${targetDate}T23:59:59`).getTime() - Date.now()) / 86400000) }} 天
        </span>
      </div>
    </template>

    <div class="foot">
      <Transition name="fade">
        <span v-if="error" class="error">{{ error }}</span>
      </Transition>
      <button class="btn btn-primary add-btn" :disabled="!canSubmit" @click="submit">＋ 添加任务</button>
    </div>
  </div>
</template>

<style scoped>
.form {
  padding: 14px 16px;
  display: flex;
  flex-direction: column;
  gap: 11px;
}
.mode-row {
  display: flex;
  gap: 8px;
}
.title-input {
  padding: 9px 13px;
  font-size: 14px;
  font-weight: 600;
  border: 1px solid var(--border);
  border-radius: var(--radius-sm);
  background: var(--card-soft);
  color: var(--text);
  outline: none;
  transition: border-color 0.15s ease;
}
.title-input:focus {
  border-color: var(--accent);
}
.hms {
  display: flex;
  gap: 8px;
  justify-content: space-between;
}
.field {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 3px;
  font-size: 11.5px;
  color: var(--text-faint);
}
.field input {
  width: 100%;
  padding: 8px 0;
  text-align: center;
  font-size: 17px;
  font-weight: 700;
  border: 1px solid var(--border);
  border-radius: var(--radius-sm);
  background: var(--card-soft);
  color: var(--text);
  outline: none;
}
.field input:focus {
  border-color: var(--accent);
}
input::-webkit-outer-spin-button,
input::-webkit-inner-spin-button {
  -webkit-appearance: none;
}
.presets {
  display: flex;
  gap: 6px;
  flex-wrap: wrap;
}
.date-row {
  display: flex;
  align-items: center;
  gap: 12px;
}
.date-input {
  flex: 1;
  padding: 9px 12px;
  font-size: 14px;
  font-weight: 600;
  border: 1px solid var(--border);
  border-radius: var(--radius-sm);
  background: var(--card-soft);
  color: var(--text);
  outline: none;
}
.date-input:focus {
  border-color: var(--accent);
}
.date-hint {
  font-size: 12.5px;
  color: var(--accent);
  font-weight: 600;
  white-space: nowrap;
}
.foot {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 10px;
}
.error {
  font-size: 12px;
  color: var(--danger);
}
.add-btn {
  padding: 8px 18px;
}
</style>
