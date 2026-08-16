import path from 'path'
import { app } from 'electron'

type Level = 'info' | 'warn' | 'error'

const isDev = !app.isPackaged

function write(level: Level, args: unknown[]): void {
  const line = `[${new Date().toISOString()}] [${level}] ${args.map(String).join(' ')}`
  if (level === 'error') console.error(line)
  else if (isDev || level === 'warn') console.log(line)
  if (!isDev) {
    try {
      const fs = require('node:fs') as typeof import('node:fs')
      fs.appendFileSync(path.join(app.getPath('userData'), 'countdown.log'), line + '\n')
    } catch {
      /* 日志失败时静默 */
    }
  }
}

export const log = {
  info: (...args: unknown[]) => write('info', args),
  warn: (...args: unknown[]) => write('warn', args),
  error: (...args: unknown[]) => write('error', args)
}

export function initLogger(): void {
  process.on('uncaughtException', (err) => log.error('Uncaught exception:', err))
  process.on('unhandledRejection', (err) => log.error('Unhandled rejection:', err))
}
