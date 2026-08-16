<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useTasksStore } from '@/stores/tasks'
import { useShortcuts } from '@/composables/useShortcuts'
import { onPlayStateChange, stopFinish } from '@/services/sound'
import TitleBar from '@/components/TitleBar.vue'
import NewTaskForm from '@/components/NewTaskForm.vue'
import TaskCard from '@/components/TaskCard.vue'
import ProgressStats from '@/components/ProgressStats.vue'
import HistoryList from '@/components/HistoryList.vue'
import SettingsPanel from '@/components/SettingsPanel.vue'

const tasks = useTasksStore()

const tab = ref<'tasks' | 'progress' | 'history'>('tasks')
const showSettings = ref(false)
const ringing = ref(false)
const ringTitle = ref('')

onMounted(() => {
  // 铃声播放中显示可关闭的提醒横幅
  window.desktopAPI.onTaskFinished((taskId: string) => {
    const t = tasks.getTask(taskId)
    if (t) ringTitle.value = t.title
  })
  onPlayStateChange((playing) => (ringing.value = playing))
})

const tabs = computed(() => [
  { key: 'tasks' as const, label: '倒计时', badge: tasks.runningCount },
  { key: 'progress' as const, label: '进度', badge: 0 },
  { key: 'history' as const, label: '记录', badge: tasks.records.length }
])

const activeTasks = computed(() => tasks.tasks.filter((t) => t.status !== 'finished' || t.type === 'date'))
const finishedToday = computed(() => tasks.tasks.filter((t) => t.status === 'finished' && t.type === 'duration'))

useShortcuts({
  onSpace: () => {
    const running = tasks.tasks.find((t) => t.status === 'running')
    if (running) void tasks.pause(running.id)
    else {
      const next = tasks.tasks.find((t) => t.status === 'paused') ?? tasks.tasks.find((t) => t.status === 'idle')
      if (next) void tasks.start(next.id)
    }
  },
  onR: () => {
    const running = tasks.tasks.find((t) => t.status === 'running')
    if (running) void tasks.reset(running.id)
  },
  onEsc: () => (showSettings.value = false)
})

function floatAllTasks(): void {
  void window.desktopAPI.openTasksWindow()
}
</script>

<template>
  <div class="dashboard">
    <TitleBar title="桌面倒计时" />
    <div class="header">
      <div class="date-block">
        <div class="hello">今天也要开心呀，今天也要加油啊！</div>
        <div class="done-count" v-if="tasks.runningCount > 0 || finishedToday.length">
          {{ tasks.runningCount > 0 ? `⏱ ${tasks.runningCount} 个任务进行中` : '' }}
          {{ tasks.runningCount > 0 && finishedToday.length ? ' · ' : '' }}
          {{ finishedToday.length ? `已完成 ${finishedToday.length} 个 ⚡` : '' }}
        </div>
      </div>
      <div class="header-btns">
        <button class="btn-icon" title="全部任务悬浮窗" @click="floatAllTasks">📋</button>
        <button class="btn-icon gear" title="设置" @click="showSettings = true">⚙</button>
      </div>
    </div>

    <div class="tabbar">
      <button
        v-for="t in tabs"
        :key="t.key"
        class="tab"
        :class="{ active: tab === t.key }"
        @click="tab = t.key"
      >
        {{ t.label }}
        <span v-if="t.badge > 0" class="badge num">{{ t.badge }}</span>
      </button>
    </div>

    <div class="content">
      <template v-if="tab === 'tasks'">
        <NewTaskForm />
        <div v-if="tasks.tasks.length === 0" class="empty-card card">
          <div class="empty-icon">⏱</div>
          <div>添加你的第一个倒计时任务</div>
          <div class="empty-hint">支持时长倒计时与日期 / 纪念日倒计时</div>
        </div>
        <div v-else class="task-list">
          <TaskCard v-for="t in activeTasks" :key="t.id" :task="t" />
        </div>
      </template>
      <ProgressStats v-else-if="tab === 'progress'" />
      <HistoryList v-else />
    </div>

    <SettingsPanel v-model:show="showSettings" />

    <Transition name="fade">
      <div v-if="ringing" class="ring-banner">
        <span class="ring-icon">🔔</span>
        <span class="ring-text">「{{ ringTitle }}」时间到 · 铃声播放中</span>
        <button class="ring-stop" @click="stopFinish()">⏹ 停止铃声</button>
      </div>
    </Transition>
  </div>
</template>

<style scoped>
.dashboard {
  height: 100%;
  display: flex;
  flex-direction: column;
  background: var(--bg-gradient);
  position: relative;
}
.header {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  padding: 2px 18px 12px;
}
.hello {
  font-size: 15.5px;
  font-weight: 800;
}
.header-btns {
  display: flex;
  gap: 4px;
}
.done-count {
  font-size: 12px;
  color: var(--accent);
  font-weight: 600;
  margin-top: 3px;
}
.tabbar {
  display: flex;
  gap: 6px;
  margin: 0 18px;
  padding: 4px;
  background: var(--card-soft);
  border: 1px solid var(--border);
  border-radius: var(--radius-sm);
}
.tab {
  flex: 1;
  padding: 8px 0;
  border-radius: 8px;
  font-size: 13px;
  font-weight: 600;
  color: var(--text-secondary);
  transition: all 0.18s ease;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
}
.tab.active {
  background: var(--card);
  color: var(--accent);
  box-shadow: var(--shadow-sm);
}
.badge {
  min-width: 18px;
  height: 18px;
  padding: 0 5px;
  border-radius: 999px;
  background: var(--accent-gradient);
  color: #fff;
  font-size: 10.5px;
  font-weight: 700;
  display: inline-flex;
  align-items: center;
  justify-content: center;
}
.content {
  flex: 1;
  overflow-y: auto;
  padding: 14px 18px 16px;
  display: flex;
  flex-direction: column;
  gap: 12px;
}
.empty-card {
  padding: 36px 0;
  text-align: center;
  color: var(--text-faint);
  font-size: 13.5px;
  display: flex;
  flex-direction: column;
  gap: 7px;
  align-items: center;
}
.empty-icon {
  font-size: 32px;
}
.empty-hint {
  font-size: 12px;
}
.task-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
}
.ring-banner {
  position: absolute;
  bottom: 14px;
  left: 50%;
  transform: translateX(-50%);
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 9px 10px 9px 16px;
  border-radius: 999px;
  background: var(--card);
  border: 1px solid var(--accent);
  box-shadow: var(--shadow-lg);
  font-size: 13px;
  font-weight: 600;
  z-index: 20;
  max-width: calc(100% - 28px);
}
.ring-icon {
  animation: ring-shake 1s ease-in-out infinite;
}
@keyframes ring-shake {
  0%, 100% { transform: rotate(0); }
  20% { transform: rotate(14deg); }
  40% { transform: rotate(-12deg); }
  60% { transform: rotate(8deg); }
  80% { transform: rotate(-6deg); }
}
.ring-text {
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.ring-stop {
  flex-shrink: 0;
  padding: 6px 14px;
  border-radius: 999px;
  background: var(--danger);
  color: #fff;
  font-size: 12.5px;
  font-weight: 700;
}
.ring-stop:hover {
  filter: brightness(1.1);
}
</style>
