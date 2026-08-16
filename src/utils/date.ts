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

/** 日期倒计时拆分：整天数 + 当日剩余 HH:MM:SS（用于纪念日显示具体倒计时时间） */
export function dateParts(ms: number): { days: number; hms: string } {
  const total = Math.max(0, ms)
  const days = Math.floor(total / 86_400_000)
  const rest = total - days * 86_400_000
  const h = Math.floor(rest / 3_600_000)
  const m = Math.floor((rest % 3_600_000) / 60_000)
  const s = Math.floor((rest % 60_000) / 1000)
  const pad = (n: number): string => String(n).padStart(2, '0')
  return { days, hms: `${pad(h)}:${pad(m)}:${pad(s)}` }
}

/**
 * 统一的主显示分层：<60min 主显示"X 分钟"+秒；60min~24h "X 小时"+分秒；>=24h "X 天"+时分秒。
 * 所有任务类型共用（时长倒计时不足 60 分钟时原本的小时位同样替换为分钟）。
 */
export function durationMain(ms: number): { main: string; sub: string } {
  const total = Math.max(0, ms)
  const pad = (n: number): string => String(n).padStart(2, '0')
  if (total < 3_600_000) {
    const m = Math.floor(total / 60_000)
    const s = Math.floor((total % 60_000) / 1000)
    return { main: `${m} 分钟`, sub: `${s} 秒` }
  }
  if (total < 86_400_000) {
    const h = Math.floor(total / 3_600_000)
    const m = Math.floor((total % 3_600_000) / 60_000)
    const s = Math.floor((total % 60_000) / 1000)
    return { main: `${h} 小时`, sub: `${pad(m)}:${pad(s)}` }
  }
  const p = dateParts(total)
  return { main: `${p.days} 天`, sub: p.hms }
}

/**
 * 定点倒计时主显示：不足 24 小时不显示天数/0 天，改显示剩余小时数。
 * <24h -> main "X 小时"、sub "MM:SS"；>=24h -> main "X 天"、sub "HH:MM:SS"
 */
export function datetimeMain(ms: number): { main: string; sub: string } {
  return durationMain(ms)
}

/** 日期倒计时进度：从创建日到目标日(或指定时刻)的已过比例 */
export function dateTaskProgress(
  createdAt: number,
  targetDate: string,
  now = Date.now(),
  targetTime?: string | null
): number {
  const target = new Date(targetTime ? `${targetDate}T${targetTime}` : `${targetDate}T23:59:59`).getTime()
  const total = target - createdAt
  if (total <= 0) return 1
  return clamp01((now - createdAt) / total)
}

/** 目标时刻显示文本：MM-DD 或 MM-DD HH:mm */
export function targetText(targetDate: string, targetTime?: string | null): string {
  const [, m, d] = targetDate.split('-')
  return targetTime ? `${m}-${d} ${targetTime}` : `${m}-${d}`
}

export function formatCNDate(d = new Date()): string {
  return `${d.getFullYear()} 年 ${d.getMonth() + 1} 月 ${d.getDate()} 日`
}

export function formatDateTime(ts: number): string {
  const d = new Date(ts)
  const pad = (n: number): string => String(n).padStart(2, '0')
  return `${d.getMonth() + 1}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`
}
