// 年/月/日进度 UI 运行验证：加载真实渲染产物（out/renderer），
// 读取三行进度的实际显示值，与独立重算结果比对，并二次采样确认实时推进。
// 用法：npx electron scripts/verify-progress.mjs
import { app, BrowserWindow, ipcMain } from 'electron'
import path from 'path'
import { fileURLToPath } from 'node:url'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')

// 渲染层 onMounted 需要的最小 IPC 桩，避免初始化报错影响视图渲染
ipcMain.handle('config:get', () => ({}))
ipcMain.handle('tasks:get', () => [])
ipcMain.handle('records:get', () => [])

function expected() {
  const now = new Date()
  const pct = (a, b) => (now.getTime() - a) / (b - a)
  const ys = new Date(now.getFullYear(), 0, 1).getTime()
  const ye = new Date(now.getFullYear() + 1, 0, 1).getTime()
  const ms = new Date(now.getFullYear(), now.getMonth(), 1).getTime()
  const me = new Date(now.getFullYear(), now.getMonth() + 1, 1).getTime()
  const ds = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime()
  return {
    year: pct(ys, ye) * 100,
    month: pct(ms, me) * 100,
    today: pct(ds, ds + 86_400_000) * 100
  }
}

app.whenReady().then(async () => {
  const win = new BrowserWindow({
    width: 300,
    height: 220,
    show: false,
    webPreferences: {
      preload: path.join(root, 'out/preload/index.js'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false
    }
  })
  await win.loadFile(path.join(root, 'out/renderer/index.html'), {
    search: '?view=progress&kind=all'
  })
  await new Promise((r) => setTimeout(r, 800))

  const sample = async () =>
    win.webContents.executeJavaScript(
      `(() => {
        const rows = [...document.querySelectorAll('.row')]
        return rows.map(r => ({
          label: r.querySelector('.label')?.innerText ?? '',
          pct: parseFloat(r.querySelector('.pct')?.innerText ?? '-1'),
          fill: parseFloat(r.querySelector('.fill')?.style.width ?? '-1')
        }))
      })()`
    )

  const s1 = await sample()
  const exp1 = expected()
  const results = []
  const keyOf = (label) =>
    label.startsWith('年度') ? 'year' : label.startsWith('月度') ? 'month' : label.startsWith('今日') ? 'today' : undefined
  for (const row of s1) {
    const key = keyOf(row.label)
    const diff = key ? Math.abs(row.pct - exp1[key]) : 999
    results.push(
      `${row.label}=${row.pct.toFixed(2)}%(期望${key ? exp1[key].toFixed(2) : '?'}%, 偏差${diff.toFixed(3)}%) ${diff < 0.5 ? 'PASS' : 'FAIL'}`
    )
  }

  // 实时推进验证：监听"今日"百分比文本（0.01% 精度）变化，30 秒内必变（每秒约 +0.0012%）
  const changed = await win.webContents.executeJavaScript(
    `(() => new Promise((resolve) => {
      const today = [...document.querySelectorAll('.row')].find(r => (r.querySelector('.label')?.innerText ?? '').startsWith('今日'))
      const pct = today?.querySelector('.pct')
      const before = pct?.innerText ?? ''
      const mo = new MutationObserver(() => {
        if (pct.innerText !== before) { mo.disconnect(); resolve(true) }
      })
      if (pct) mo.observe(pct, { childList: true, characterData: true, subtree: true })
      setTimeout(() => { mo.disconnect(); resolve(false) }, 30_000)
    }))()`
  )
  const todayPct = s1.find((r) => r.label.startsWith('今日'))?.pct ?? 0
  const ticking = changed
  results.push(`实时推进: 今日 ${todayPct.toFixed(2)}% 30秒内刷新 ${ticking ? 'PASS' : 'FAIL'}`)

  console.log('VERIFY_PROGRESS:' + results.join(' | '))
  const allPass = s1.length === 3 && ticking && !results.some((r) => r.endsWith('FAIL'))
  console.log(`VERIFY_RESULT:${allPass ? 'ALL_PASS' : 'HAS_FAIL'} rows=${s1.length}`)
  app.exit(allPass ? 0 : 1)
})
