<script setup lang="ts">
import { computed, onMounted } from 'vue'
import { useTasksStore } from '@/stores/tasks'
import TaskFloat from '@/components/TaskFloat.vue'
import TaskScreen from '@/components/TaskScreen.vue'

const props = defineProps<{ taskId: string; mode: 'float' | 'mini' | 'screen' }>()
const tasks = useTasksStore()

const task = computed(() => tasks.getTask(props.taskId))

onMounted(() => {
  // Esc 退出全屏窗口；悬浮/极简用鼠标操作
  window.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && props.mode === 'screen') {
      void window.desktopAPI.setFullscreen(false)
      void window.desktopAPI.closeCurrentWindow()
    }
  })
})
</script>

<template>
  <div class="task-window" :class="mode">
    <div v-if="!task" class="missing">任务已被删除</div>
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
  align-items: center;
  justify-content: center;
  font-size: 12px;
  color: var(--text-faint);
}
</style>
