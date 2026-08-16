// 任务标题彩色配色：按 id 稳定散列取色，保证所有窗口显示一致
const PALETTE = [
  '#e11d48', // 玫红
  '#ea580c', // 橙
  '#d97706', // 琥珀
  '#16a34a', // 绿
  '#0d9488', // 青
  '#2563eb', // 蓝
  '#7c3aed', // 紫
  '#c026d3' // 品红
]

export function hashString(s: string): number {
  let h = 5381
  for (let i = 0; i < s.length; i++) {
    h = ((h << 5) + h + s.charCodeAt(i)) >>> 0
  }
  return h
}

/** 依据任务 id 返回稳定的彩色标题颜色 */
export function taskColor(id: string): string {
  return PALETTE[hashString(id) % PALETTE.length]
}
