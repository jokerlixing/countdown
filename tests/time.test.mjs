import { test } from 'node:test'
import assert from 'node:assert/strict'
import { formatMs, formatMsShort, pad2, clamp } from '../src/utils/time.ts'
import {
  yearProgress,
  monthProgress,
  dayProgress,
  daysText,
  dateTaskProgress,
  clamp01
} from '../src/utils/date.ts'

test('pad2 补零', () => {
  assert.equal(pad2(0), '00')
  assert.equal(pad2(5), '05')
  assert.equal(pad2(23), '23')
})

test('formatMs 格式化 HH:MM:SS', () => {
  assert.equal(formatMs(25 * 60 * 1000), '00:25:00')
  assert.equal(formatMs(25 * 60 * 1000 + 36000), '00:25:36')
  assert.equal(formatMs(3600 * 1000), '01:00:00')
  assert.equal(formatMs(0), '00:00:00')
  assert.equal(formatMs(-500), '00:00:00')
  assert.equal(formatMs(1), '00:00:01')
})

test('formatMsShort 格式化 MM:SS / H:MM:SS', () => {
  assert.equal(formatMsShort(24 * 60 * 1000 + 36000), '24:36')
  assert.equal(formatMsShort(5 * 60 * 1000), '05:00')
  assert.equal(formatMsShort(90 * 60 * 1000), '1:30:00')
  assert.equal(formatMsShort(0), '00:00')
})

test('clamp 边界', () => {
  assert.equal(clamp(5, 0, 59), 5)
  assert.equal(clamp(-1, 0, 59), 0)
  assert.equal(clamp(100, 0, 59), 59)
})

test('基于 Date.now() 的剩余时间计算（模拟暂停/恢复）', () => {
  const duration = 10_000
  let endTime = 1000000 + duration
  const now = () => 1000000 + 2500
  const remaining = Math.max(0, endTime - now())
  assert.equal(remaining, 7500)
  endTime = 1000000 + 5000 + remaining
  assert.equal(endTime - (1000000 + 5000), 7500)
})

test('年度进度', () => {
  const p = yearProgress(new Date(2026, 0, 1, 0, 0, 0))
  assert.equal(p.percent, 0)
  const mid = yearProgress(new Date(2026, 5, 1))
  assert.ok(mid.percent > 0.4 && mid.percent < 0.55)
  const end = yearProgress(new Date(2026, 11, 31, 23, 59, 59))
  assert.ok(end.percent > 0.99 && end.percent <= 1)
})

test('月度/今日进度', () => {
  assert.equal(monthProgress(new Date(2026, 7, 1, 0, 0, 0)).percent, 0)
  const noon = dayProgress(new Date(2026, 7, 16, 12, 0, 0))
  assert.ok(Math.abs(noon.percent - 0.5) < 0.001)
})

test('日期倒计时文本与进度', () => {
  assert.equal(daysText(86_400_001), '2 天') // 向上取整
  assert.equal(daysText(86_400_000), '1 天')
  assert.equal(daysText(0), '0 天')
  const now = new Date(2026, 7, 16).getTime()
  assert.equal(dateTaskProgress(now, '2026-08-26', now), 0)
  assert.ok(dateTaskProgress(now, '2026-08-26', now + 5 * 86_400_000) > 0.15)
  assert.equal(dateTaskProgress(now, '2026-08-15', now), 1) // 目标早于创建，已到期
})

test('clamp01', () => {
  assert.equal(clamp01(1.5), 1)
  assert.equal(clamp01(-0.2), 0)
  assert.equal(clamp01(0.42), 0.42)
})
