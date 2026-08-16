// 打包脚本：在杀毒软件实时扫描窗口内，electron-builder 对新写 exe 的
// 大文件重写与 rcedit 资源修改会被短暂阻塞（UNKNOWN: unknown error /
// Unable to commit changes）。此脚本通过增大重试次数与间隔来稳定打包，
// 不修改任何 node_modules 文件。
import { createRequire } from 'node:module'
import { promises as fsp } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const projectDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const req = createRequire(import.meta.url)

// 1) builder-util-runtime.retry：重试次数 >= 12、间隔 >= 4s
const runtime = req('builder-util-runtime')
const origRetry = runtime.retry
Object.defineProperty(runtime, 'retry', {
  value: function patchedRetry(task, retryCount, interval, backoff, attempt, shouldRetry) {
    return origRetry(task, Math.max(retryCount, 12), Math.max(interval ?? 1000, 4000), backoff, attempt, shouldRetry)
  },
  writable: true,
  configurable: true
})

// 2) fs.promises.writeFile：exe 写入失败时退避重试
const origWriteFile = fsp.writeFile.bind(fsp)
fsp.writeFile = async function patchedWriteFile(p, data, opts) {
  const target = String(p)
  if (!target.toLowerCase().endsWith('.exe')) {
    return origWriteFile(p, data, opts)
  }
  let lastErr
  for (let i = 0; i <= 12; i++) {
    try {
      return await origWriteFile(p, data, opts)
    } catch (err) {
      lastErr = err
      console.log(`[dist-win] exe 写入被占用，${4}s 后重试 (${i + 1}/12): ${path.basename(target)}`)
      await new Promise((r) => setTimeout(r, 4000))
    }
  }
  throw lastErr
}

const { build } = req('electron-builder')
const target = process.argv.includes('--dir') ? { win: ['dir'] } : { win: ['nsis'] }

build({ ...target, projectDir })
  .then((result) => {
    console.log('[dist-win] 打包完成:', result.map(String).join(', '))
    process.exit(0)
  })
  .catch((err) => {
    console.error('[dist-win] 打包失败:', err)
    process.exit(1)
  })
