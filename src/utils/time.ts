export function pad2(n: number): string {
  return String(Math.floor(n)).padStart(2, '0')
}

/** 剩余毫秒 -> HH:MM:SS（向上取整到秒，0 表示时间到） */
export function formatMs(ms: number): string {
  const total = Math.max(0, Math.ceil(ms / 1000))
  const h = Math.floor(total / 3600)
  const m = Math.floor((total % 3600) / 60)
  const s = total % 60
  return `${pad2(h)}:${pad2(m)}:${pad2(s)}`
}

/** 剩余毫秒 -> MM:SS（悬浮窗用） */
export function formatMsShort(ms: number): string {
  const total = Math.max(0, Math.ceil(ms / 1000))
  const h = Math.floor(total / 3600)
  if (h > 0) return `${h}:${pad2(Math.floor((total % 3600) / 60))}:${pad2(total % 60)}`
  return `${pad2(Math.floor(total / 60))}:${pad2(total % 60)}`
}

export function clamp(n: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, n))
}
