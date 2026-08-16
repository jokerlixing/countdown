<script setup lang="ts">
import { ref, computed } from 'vue'
import { useTasksStore } from '@/stores/tasks'
import type { TaskType } from '@/types'
import { clamp } from '@/utils/time'
import { dateParts } from '@/utils/date'

const tasks = useTasksStore()

const mode = ref<TaskType>('duration')
const title = ref('')
const hours = ref(0)
const minutes = ref(25)
const seconds = ref(0)
const targetDate = ref('')
const targetTime = ref('09:00')
const error = ref('')

const presets = [5, 10, 15, 25, 30, 60]
const today = new Date().toISOString().slice(0, 10)

const modes: { value: TaskType; label: string }[] = [
  { value: 'duration', label: '⏱ 时长倒计时' },
  { value: 'datetime', label: '⏰ 定点倒计时' },
  { value: 'date', label: '📅 日期 / 纪念日' }
]

const totalSec = computed(
  () => clamp(hours.value, 0, 99) * 3600 + clamp(minutes.value, 0, 59) * 60 + clamp(seconds.value, 0, 59)
)

function applyPreset(m: number): void {
  hours.value = Math.floor(m / 60)
  minutes.value = m % 60
  seconds.value = 0
}

const datetimeTarget = computed(() =>
  targetDate.value && targetTime.value ? new Date(`${targetDate.value}T${targetTime.value}`).getTime() : null
)

const datetimePreview = computed(() => {
  if (datetimeTarget.value === null) return ''
  const p = dateParts(datetimeTarget.value - Date.now())
  return `距今 ${p.days} 天 ${p.hms}`
})

async function submit(): Promise<void> {
  error.value = ''
  if (mode.value === 'duration') {
    if (totalSec.value <= 0) {
      error.value = '请输入有效的倒计时时间。'
      return
    }
    await tasks.createTask({ title: title.value, type: 'duration', durationMs: totalSec.value * 1000 })
  } else if (mode.value === 'datetime') {
    if (!targetDate.value) {
      error.value = '请选择目标日期。'
      return
    }
    if (datetimeTarget.value === null || datetimeTarget.value <= Date.now() + 30_000) {
      error.value = '目标时间必须至少在 30 秒之后。'
      return
    }
    await tasks.createTask({
      title: title.value,
      type: 'datetime',
      targetDate: targetDate.value,
      targetTime: targetTime.value
    })
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
  if (mode.value === 'datetime') return Boolean(targetDate.value && targetTime.value)
  return Boolean(targetDate.value)
})
</script>

<template>
  <div class="form card">
    <div class="mode-row">
      <button
        v-for="m in modes"
        :key="m.value"
        class="chip"
        :class="{ active: mode === m.value }"
        @click="mode = m.value"
      >
        {{ m.label }}
      </button>
    </div>

    <input
      v-model="title"
      class="title-input"
      :placeholder="mode === 'datetime' ? '任务名称（如：项目上线）' : mode === 'duration' ? '任务名称（如：学习）' : '名称（如：生日、纪念日）'"
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

    <template v-else-if="mode === 'datetime'">
      <div class="dt-row">
        <input v-model="targetDate" type="date" :min="today" class="dt-input" />
        <input v-model="targetTime" type="time" class="dt-input time" />
      </div>
      <div v-if="datetimePreview && datetimeTarget !== null && datetimeTarget > Date.now()" class="dt-hint num">
        ⏰ {{ datetimePreview }}
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
  gap: 6px;
  flex-wrap: wrap;
}
.mode-row .chip {
  flex: 1;
  white-space: nowrap;
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
.dt-row {
  display: flex;
  gap: 10px;
}
.dt-input {
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
.dt-input.time {
  max-width: 110px;
}
.dt-input:focus {
  border-color: var(--accent);
}
.dt-hint {
  font-size: 12.5px;
  color: var(--accent);
  font-weight: 700;
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
