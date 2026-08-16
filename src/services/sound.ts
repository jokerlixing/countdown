let audio: HTMLAudioElement | null = null

export function playFinish(volume: number): void {
  try {
    if (!audio) {
      audio = new Audio('finish.wav')
    }
    audio.volume = Math.min(1, Math.max(0, volume))
    audio.currentTime = 0
    void audio.play()
  } catch {
    /* 音频播放失败时静默 */
  }
}
