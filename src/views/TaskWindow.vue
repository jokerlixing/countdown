<script setup lang="ts">
import { computed, onMounted, watch } from 'vue'
import { useTasksStore } from '@/stores/tasks'
import TaskFloat from '@/components/TaskFloat.vue'
import TaskScreen from '@/components/TaskScreen.vue'

const props = defineProps<{ taskId: string; mode: 'float' | 'mini' | 'screen' }>()
const tasks = useTasksStore()
const api = window.desktopAPI

const task = computed(() => tasks.getTask(props.taskId))

// 任务消失（完成 30 秒自动删除或被手动删除）时自动关闭悬浮窗，避免残留无效窗口
watch(task, (t) => {
  if (!t && tasks.loaded) {
    void api.closeCurrentWindow()
  }
})

onMounted(() => {
  // Esc 退出全屏窗口；悬浮/极简用鼠标操作
  window.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && props.mode === 'screen') {
      void api.setFullscreen(false)
      void api.closeCurrentWindow()
    }
  })
})
</script>

<template>
  <div class="task-window" :class="mode">
    <div v-if="!task" class="missing">
      <span>任务已删除</span>
      <button class="missing-close" @click="api.closeCurrentWindow()">✕ 关闭</button>
    </div>
    <TaskScreen v-else-if="mode === 'screen'" :task="task" />
    <TaskFloat v-else :task="task" :mini="mode === 'mini'" />
  </div>
</template>

<style scoped>
.task-window {
  height: 100%;
  padding: 3px;
}
.task-window.screen {
  padding: 0;
}
.missing {
  height: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 10px;
  font-size: 12px;
  color: var(--text-faint);
}
.missing-close {
  padding: 5px 14px;
  border-radius: 8px;
  font-size: 12px;
  font-weight: 700;
  background: var(--accent-soft);
  color: var(--accent);
}
.missing-close:hover {
  background: var(--accent);
  color: #fff;
}
</style>
