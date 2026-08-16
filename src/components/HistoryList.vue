<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useTasksStore } from '@/stores/tasks'
import { formatDateTime } from '@/utils/date'

const tasks = useTasksStore()
const query = ref('')
const typeFilter = ref<'all' | 'duration' | 'date'>('all')

onMounted(() => void tasks.loadRecords())

function durationText(sec: number): string {
  if (sec < 60) return `${sec} 秒`
  if (sec < 3600) return `${Math.round(sec / 60)} 分钟`
  return `${(sec / 3600).toFixed(1)} 小时`
}

function filtered(): typeof tasks.records {
  const q = query.value.trim()
  return tasks.records.filter((r) => {
    if (typeFilter.value !== 'all' && r.type !== typeFilter.value) return false
    if (q && !r.title.includes(q)) return false
    return true
  })
}
</script>

<template>
  <div class="history">
    <div class="toolbar">
      <input v-model="query" class="search" placeholder="🔍 搜索记录..." />
      <div class="filters">
        <button class="chip" :class="{ active: typeFilter === 'all' }" @click="typeFilter = 'all'">全部</button>
        <button class="chip" :class="{ active: typeFilter === 'duration' }" @click="typeFilter = 'duration'">时长</button>
        <button class="chip" :class="{ active: typeFilter === 'date' }" @click="typeFilter = 'date'">日期</button>
      </div>
    </div>

    <div v-if="filtered().length === 0" class="empty">
      <div class="empty-icon">🏆</div>
      <div>还没有完成记录</div>
      <div class="empty-hint">完成的倒计时会自动记录在这里</div>
    </div>

    <TransitionGroup v-else name="fade" tag="div" class="list">
      <div v-for="r in filtered()" :key="r.id" class="rec card">
        <div class="rec-main">
          <div class="rec-title">
            {{ r.type === 'date' ? '🗓' : '⏱' }} {{ r.title }}
          </div>
          <div class="rec-meta">
            {{ formatDateTime(r.finishedAt) }} 完成
            <template v-if="r.type === 'duration'"> · {{ durationText(r.durationSec) }}</template>
          </div>
        </div>
        <button class="btn-icon del" title="删除记录" @click="tasks.removeRecord(r.id)">🗑</button>
      </div>
    </TransitionGroup>
  </div>
</template>

<style scoped>
.history {
  display: flex;
  flex-direction: column;
  gap: 12px;
}
.toolbar {
  display: flex;
  flex-direction: column;
  gap: 9px;
}
.search {
  padding: 9px 13px;
  font-size: 13.5px;
  border: 1px solid var(--border);
  border-radius: var(--radius-sm);
  background: var(--card);
  color: var(--text);
  outline: none;
}
.search:focus {
  border-color: var(--accent);
}
.filters {
  display: flex;
  gap: 7px;
}
.empty {
  text-align: center;
  padding: 42px 0;
  color: var(--text-faint);
  font-size: 13.5px;
  display: flex;
  flex-direction: column;
  gap: 7px;
}
.empty-icon {
  font-size: 34px;
}
.empty-hint {
  font-size: 12px;
}
.list {
  display: flex;
  flex-direction: column;
  gap: 9px;
}
.rec {
  padding: 11px 13px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
}
.rec-title {
  font-size: 13.5px;
  font-weight: 700;
}
.rec-meta {
  font-size: 12px;
  color: var(--text-faint);
  margin-top: 2px;
}
.btn-icon.del:hover {
  color: var(--danger);
  background: rgba(229, 72, 77, 0.1);
}
</style>
