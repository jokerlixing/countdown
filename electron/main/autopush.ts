import { spawn } from 'child_process'
import fs from 'fs'
import path from 'path'
import { configStore } from './store'
import { getRecordsJson } from './tasks'
import { log } from './logger'

let timer: NodeJS.Timeout | null = null
let running = false

/** 任务完成/记录变更后调用：防抖 30 秒后把记录推送到 git 仓库 */
export function scheduleAutoPush(): void {
  const cfg = configStore.get()
  if (!cfg.autoPushEnabled) return
  if (timer) clearTimeout(timer)
  timer = setTimeout(() => void runAutoPush(), 30_000)
}

function git(cwd: string, args: string[]): Promise<{ code: number; out: string }> {
  return new Promise((resolve) => {
    const p = spawn('git', args, { cwd, windowsHide: true })
    let out = ''
    p.stdout.on('data', (d) => (out += d))
    p.stderr.on('data', (d) => (out += d))
    p.on('error', (err) => resolve({ code: -1, out: String(err) }))
    p.on('close', (code) => resolve({ code: code ?? -1, out }))
  })
}

async function runAutoPush(): Promise<void> {
  if (running) return
  running = true
  try {
    const cfg = configStore.get()
    const repo = cfg.autoPushRepoPath
    if (!cfg.autoPushEnabled || !repo || !fs.existsSync(path.join(repo, '.git'))) {
      log.warn('Auto-push skipped: repo not configured or not a git repository')
      return
    }
    const recordsDir = path.join(repo, 'records')
    fs.mkdirSync(recordsDir, { recursive: true })
    fs.writeFileSync(path.join(recordsDir, 'records.json'), getRecordsJson())

    const steps: string[][] = [
      ['add', 'records/records.json'],
      ['commit', '-m', `chore(records): 更新倒计时完成记录 ${new Date().toISOString()}`],
      ['push']
    ]
    for (const args of steps) {
      const r = await git(repo, args)
      if (r.code !== 0) {
        log.warn(`Auto-push step failed: git ${args[0]}`, r.out.slice(0, 300))
        return
      }
    }
    log.info('Auto-push completed')
  } finally {
    running = false
  }
}
