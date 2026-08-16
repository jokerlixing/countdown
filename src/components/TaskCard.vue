<script setup lang="ts">
import { computed, ref } from 'vue'
import { useTasksStore } from '@/stores/tasks'
import type { Task } from '@/types'
import { pad2 } from '@/utils/time'
import { dateTaskProgress, durationMain, targetText } from '@/utils/date'
import { taskColor } from '@/utils/color'
import ProgressBar from './ProgressBar.vue'

const props = defineProps<{ task: Task }>()
const tasks = useTasksStore()

const editing = ref(false)
const draft = ref('')

function startEdit(): void {
  draft.value = props.task.title
  editing.value = true
}

function commitEdit(): void {
  if (!editing.value) return
  editing.value = false
  const next = draft.value.trim()
  if (next && next !== props.task.title) void tasks.rename(props.task.id, next)
}

const isDate = computed(() => props.task.type === 'date')
const isDatetime = computed(() => props.task.type === 'datetime')
const isTargetType = computed(() => isDate.value || isDatetime.value)
/** 定点/纪念日与 <60min 的时长倒计时统一走分层显示（分钟/小时/天） */
const dm = computed(() => durationMain(props.task.remainingMs))
/** 时长倒计时 >=60min 保持 HH:MM:SS */
const showDurationHms = computed(
  () => props.task.type === 'duration' && props.task.remainingMs >= 3_600_000
)
const typeIcon = computed(() => (isDatetime.value ? '⏰' : isDate.value ? '🗓' : '⏱'))

const percent = computed(() => {
  if (isTargetType.value && props.task.targetDate) {
    return dateTaskProgress(props.task.createdAt, props.task.targetDate, Date.now(), props.task.targetTime)
  }
  if (props.task.durationMs <= 0) return 0
  return props.task.remainingMs / props.task.durationMs
})

const statusLabel = computed(() => {
  const s = props.task.status
  if (s === 'running') return isDatetime.value ? '进行中' : isDate.value ? '进行中' : '计时中'
  if (s === 'paused') return '已暂停'
  if (s === 'finished') return '已完成'
  return '待开始'
})

const danger = computed(
  () => props.task.status === 'running' && props.task.type === 'duration' && props.task.remainingMs < 10_000
)

const hms = computed(() => {
  const total = Math.max(0, Math.ceil(props.task.remainingMs / 1000))
  return {
    h: pad2(Math.floor(total / 3600)),
    m: pad2(Math.floor((total % 3600) / 60)),
    s: pad2(total % 60)
  }
})

function toggle(): void {
  if (props.task.status === 'running') void tasks.pause(props.task.id)
  else void tasks.start(props.task.id)
}

function openWin(mode: 'float' | 'mini' | 'screen'): void {
  void window.desktopAPI.openTaskWindow(props.task.id, mode)
}
</script>

<template>
  <div class="task card" :class="{ running: task.status === 'running', done: task.status === 'finished' }">
    <div class="head">
      <div class="name-row">
        <span class="type-icon">{{ typeIcon }}</span>
        <input
          v-if="editing"
          v-model="draft"
          class="name-input"
          maxlength="20"
          autofocus
          @keyup.enter="($event.target as HTMLInputElement).blur()"
          @keyup.esc="editing = false"
          @blur="commitEdit"
        />
        <span
          v-else
          class="name"
          :style="{ color: taskColor(task.id) }"
          :title="task.title + '（双击重命名）'"
          @dblclick="startEdit"
          >{{ task.title }}</span
        >
        <button class="btn-icon rename" title="重命名" @click="startEdit">✏</button>
        <span class="tag" :class="task.status">{{ statusLabel }}</span>
      </div>
      <div class="win-btns">
        <button class="btn-icon" title="悬浮窗" @click="openWin('float')">⌖</button>
        <button class="btn-icon" title="极简窗" @click="openWin('mini')">⊖</button>
        <button class="btn-icon" title="全屏模式" @click="openWin('screen')">⛶</button>
        <button class="btn-icon del" title="删除任务" @click="tasks.remove(task.id)">🗑</button>
      </div>
    </div>

    <div class="time num" :class="{ danger }">
      <template v-if="showDurationHms">
        {{ hms.h }}<span class="colon">:</span>{{ hms.m }}<span class="colon">:</span>{{ hms.s }}
      </template>
      <template v-else>
        <span class="date-days">{{ dm.main }}</span>
        <span class="date-hms num">{{ dm.sub }}</span>
      </template>
    </div>

    <div class="progress-row">
      <ProgressBar :percent="percent" />
      <span class="pct num">{{ Math.round(percent * 100) }}%</span>
    </div>

    <div class="ops">
      <template v-if="task.type === 'duration'">
        <button v-if="task.status !== 'running'" class="btn btn-primary op" @click="toggle">
          {{ task.status === 'paused' ? '▶ 继续' : '▶ 开始' }}
        </button>
        <button v-else class="btn btn-primary op" @click="toggle">⏸ 暂停</button>
        <button class="btn btn-ghost op" @click="tasks.reset(task.id)">↻ 重置</button>
      </template>
      <template v-else-if="isDatetime">
        <button v-if="task.status === 'finished'" class="btn btn-ghost op" @click="tasks.reset(task.id)">↻ 重新武装</button>
        <span class="date-target">⏰ 目标：{{ targetText(task.targetDate!, task.targetTime) }}</span>
      </template>
      <span v-else class="date-target">目标：{{ targetText(task.targetDate!, null) }}</span>
    </div>
  </div>
</template>

<style scoped>
.task {
  padding: 13px 15px 12px;
  display: flex;
  flex-direction: column;
  gap: 9px;
  transition: all 0.2s cubic-bezier(0.2, 0.8, 0.3, 1);
}
.task:hover {
  box-shadow: var(--shadow);
  transform: translateY(-1px);
}
.task.running {
  border-color: rgba(99, 102, 241, 0.45);
}
.task.done {
  opacity: 0.75;
}
.head {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
}
.name-row {
  display: flex;
  align-items: center;
  gap: 8px;
  min-width: 0;
}
.type-icon {
  font-size: 15px;
  flex-shrink: 0;
}
.name {
  font-size: 16.5px;
  font-weight: 800;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 128px;
  letter-spacing: 0.3px;
  cursor: text;
}
.btn-icon.rename {
  width: 24px;
  height: 24px;
  font-size: 11px;
  flex-shrink: 0;
}
.name-input {
  width: 128px;
  padding: 3px 8px;
  font-size: 14px;
  font-weight: 800;
  border: 1px solid var(--accent);
  border-radius: 7px;
  background: var(--card);
  color: var(--text);
  outline: none;
}
.tag {
  font-size: 10.5px;
  font-weight: 700;
  padding: 2px 8px;
  border-radius: 999px;
  background: var(--card-soft);
  color: var(--text-faint);
  flex-shrink: 0;
}
.tag.running {
  background: var(--accent-soft);
  color: var(--accent);
}
.tag.finished {
  background: rgba(48, 164, 108, 0.12);
  color: var(--success);
}
.win-btns {
  display: flex;
  gap: 2px;
}
.btn-icon.del:hover {
  color: var(--danger);
  background: rgba(229, 72, 77, 0.1);
}
.time {
  font-size: 34px;
  font-weight: 800;
  letter-spacing: 1px;
  line-height: 1.1;
}
.colon {
  color: var(--text-faint);
  margin: 0 1px;
}
.danger {
  color: var(--danger);
}
/* 纪念日：突出天数 + 实时倒计时 */
.date-days {
  font-size: 34px;
  font-weight: 800;
}
.date-days small {
  font-size: 16px;
  font-weight: 700;
  color: var(--text-secondary);
}
.date-hms {
  display: block;
  font-size: 15px;
  font-weight: 700;
  color: var(--accent);
  letter-spacing: 1px;
  margin-top: 2px;
}
.progress-row {
  display: flex;
  align-items: center;
  gap: 10px;
}
.pct {
  font-size: 12px;
  font-weight: 700;
  color: var(--text-secondary);
  width: 38px;
  text-align: right;
  flex-shrink: 0;
}
.ops {
  display: flex;
  gap: 9px;
}
.op {
  padding: 7px 16px;
  font-size: 13px;
  flex: 1;
}
.date-target {
  font-size: 12.5px;
  color: var(--text-faint);
}
</style>
