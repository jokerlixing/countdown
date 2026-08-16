export interface PeriodProgress {
  percent: number // 0~1
  elapsedMs: number
  totalMs: number
}

export function clamp01(n: number): number {
  return Math.min(1, Math.max(0, n))
}

export function yearProgress(now = new Date()): PeriodProgress {
  const start = new Date(now.getFullYear(), 0, 1).getTime()
  const end = new Date(now.getFullYear() + 1, 0, 1).getTime()
  const elapsedMs = now.getTime() - start
  const totalMs = end - start
  return { percent: clamp01(elapsedMs / totalMs), elapsedMs, totalMs }
}

export function monthProgress(now = new Date()): PeriodProgress {
  const start = new Date(now.getFullYear(), now.getMonth(), 1).getTime()
  const end = new Date(now.getFullYear(), now.getMonth() + 1, 1).getTime()
  const elapsedMs = now.getTime() - start
  const totalMs = end - start
  return { percent: clamp01(elapsedMs / totalMs), elapsedMs, totalMs }
}

export function dayProgress(now = new Date()): PeriodProgress {
  const start = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime()
  const elapsedMs = now.getTime() - start
  const totalMs = 86_400_000
  return { percent: clamp01(elapsedMs / totalMs), elapsedMs, totalMs }
}

/** 毫秒 -> "X 天"（纪念日/日期倒计时用，向上取整） */
export function daysText(ms: number): string {
  const days = Math.ceil(ms / 86_400_000)
  return `${days} 天`
}

/** 日期倒计时进度：从创建日到目标日的已过比例 */
export function dateTaskProgress(createdAt: number, targetDate: string, now = Date.now()): number {
  const target = new Date(`${targetDate}T23:59:59`).getTime()
  const total = target - createdAt
  if (total <= 0) return 1
  return clamp01((now - createdAt) / total)
}

export function formatCNDate(d = new Date()): string {
  return `${d.getFullYear()} 年 ${d.getMonth() + 1} 月 ${d.getDate()} 日`
}

export function formatDateTime(ts: number): string {
  const d = new Date(ts)
  const pad = (n: number): string => String(n).padStart(2, '0')
  return `${d.getMonth() + 1}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`
}
