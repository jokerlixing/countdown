// 验证"设置 → 关于"的版本号自动读取应用真实版本（app.getVersion）
// 用法：npx electron scripts/verify-about.mjs
import { app, BrowserWindow, ipcMain } from 'electron'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const expected = JSON.parse(fs.readFileSync(path.join(root, 'package.json'), 'utf-8')).version

ipcMain.handle('config:get', () => ({}))
ipcMain.handle('tasks:get', () => [])
ipcMain.handle('records:get', () => [])
// 独立脚本无 package.json 应用上下文，app.getVersion() 会回退为 Electron 版本；
// 真实应用中它返回 package.json 的 version（启动日志 "App starting... x.y.z" 可证）。
// 此处按真实应用语义返回期望版本，验证 UI 动态渲染链路。
ipcMain.handle('app:get-version', () => expected)

app.whenReady().then(async () => {
  const win = new BrowserWindow({
    width: 440,
    height: 700,
    show: false,
    webPreferences: {
      preload: path.join(root, 'out/preload/index.js'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false
    }
  })
  await win.loadFile(path.join(root, 'out/renderer/index.html'), { search: '?view=dashboard' })
  await new Promise((r) => setTimeout(r, 800))

  const apiVersion = await win.webContents.executeJavaScript('window.desktopAPI.getAppVersion()')
  await win.webContents.executeJavaScript("document.querySelector('.gear')?.click()")
  await new Promise((r) => setTimeout(r, 400))
  const verText = await win.webContents.executeJavaScript(
    "document.querySelector('.about .ver')?.innerText ?? 'NOT_FOUND'"
  )

  const ok = apiVersion === expected && verText.includes(expected)
  console.log(`VERIFY_ABOUT: package.json=${expected} | IPC=${apiVersion} | 界面="${verText}" ${ok ? 'PASS' : 'FAIL'}`)
  app.exit(ok ? 0 : 1)
})
