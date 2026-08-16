let audio: HTMLAudioElement | null = null
let playing = false
const listeners = new Set<(playing: boolean) => void>()

function notifyState(): void {
  for (const cb of listeners) cb(playing)
}

/** 播放结束提示音（30 秒），期间可通过 stopFinish() 手动停止 */
export function playFinish(volume: number): void {
  try {
    if (!audio) {
      audio = new Audio('finish.wav')
      audio.addEventListener('ended', () => {
        playing = false
        notifyState()
      })
    }
    audio.volume = Math.min(1, Math.max(0, volume))
    audio.currentTime = 0
    playing = true
    notifyState()
    void audio.play()
  } catch {
    playing = false
    notifyState()
  }
}

/** 手动关闭提示铃声 */
export function stopFinish(): void {
  if (!audio) return
  try {
    audio.pause()
    audio.currentTime = 0
  } catch {
    /* ignore */
  }
  playing = false
  notifyState()
}

export function isFinishPlaying(): boolean {
  return playing
}

export function onPlayStateChange(cb: (playing: boolean) => void): () => void {
  listeners.add(cb)
  return () => listeners.delete(cb)
}
