import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { TimerStatus } from '@/types'

const TICK_MS = 250

export const useTimerStore = defineStore('timer', () => {
  const duration = ref(25 * 60 * 1000)
  const remaining = ref(25 * 60 * 1000)
  const status = ref<TimerStatus>('idle')
  const title = ref('倒计时')
  const endTime = ref<number | null>(null)

  let ticker: ReturnType<typeof setInterval> | null = null
  let finishCallback: (() => void) | null = null

  function setOnFinish(cb: (() => void) | null): void {
    finishCallback = cb
  }

  const display = computed(() => ({
    h: Math.floor(Math.max(0, remaining.value) / 3600000),
    m: Math.floor((Math.max(0, remaining.value) % 3600000) / 60000),
    s: Math.floor((Math.max(0, remaining.value) % 60000) / 1000)
  }))
  const progress = computed(() =>
    duration.value > 0 ? Math.max(0, remaining.value) / duration.value : 0
  )

  function tick(): void {
    if (status.value !== 'running' || endTime.value === null) return
    remaining.value = endTime.value - Date.now()
    if (remaining.value <= 0) {
      remaining.value = 0
      finish()
    }
  }

  function startTicker(): void {
    stopTicker()
    ticker = setInterval(tick, TICK_MS)
    tick()
  }

  function stopTicker(): void {
    if (ticker) {
      clearInterval(ticker)
      ticker = null
    }
  }

  function setDuration(ms: number): void {
    if (status.value === 'running') return
    duration.value = ms
    remaining.value = ms
    if (status.value === 'paused') status.value = 'idle'
  }

  function start(): void {
    if (status.value === 'running') return
    if (status.value !== 'paused' || remaining.value <= 0) {
      remaining.value = duration.value
    }
    if (remaining.value <= 0) return
    endTime.value = Date.now() + remaining.value
    status.value = 'running'
    startTicker()
  }

  function pause(): void {
    if (status.value !== 'running') return
    remaining.value = Math.max(0, (endTime.value ?? Date.now()) - Date.now())
    status.value = 'paused'
    stopTicker()
  }

  function resume(): void {
    if (status.value !== 'paused') return
    start()
  }

  function toggle(): void {
    if (status.value === 'running') pause()
    else start()
  }

  function reset(): void {
    stopTicker()
    status.value = 'idle'
    remaining.value = duration.value
    endTime.value = null
  }

  function finish(): void {
    stopTicker()
    status.value = 'finished'
    endTime.value = null
    remaining.value = 0
    finishCallback?.()
  }

  function setTitle(t: string): void {
    title.value = t.trim() || '倒计时'
  }

  return {
    duration,
    remaining,
    status,
    title,
    endTime,
    display,
    progress,
    setDuration,
    start,
    pause,
    resume,
    toggle,
    reset,
    finish,
    setTitle,
    setOnFinish
  }
})
