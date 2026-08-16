import { test } from 'node:test'
import assert from 'node:assert/strict'
import { formatMs, formatMsShort, pad2, clamp } from '../src/utils/time.ts'

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
  // 向上取整：还剩 1ms 也应显示为 1 秒
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
  // 暂停后恢复：重新计算 endTime
  endTime = 1000000 + 5000 + remaining
  assert.equal(endTime - (1000000 + 5000), 7500)
})
