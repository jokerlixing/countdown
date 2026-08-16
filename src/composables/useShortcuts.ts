import { onMounted, onUnmounted } from 'vue'

function isTypingTarget(e: KeyboardEvent): boolean {
  const t = e.target as HTMLElement | null
  if (!t) return false
  const tag = t.tagName
  return tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT' || t.isContentEditable
}

export function useShortcuts(handlers: {
  onSpace: () => void
  onR: () => void
  onEsc: () => void
}): void {
  const onKeydown = (e: KeyboardEvent): void => {
    if (isTypingTarget(e)) return
    if (e.code === 'Space') {
      e.preventDefault()
      handlers.onSpace()
    } else if (e.key === 'r' || e.key === 'R') {
      handlers.onR()
    } else if (e.key === 'Escape') {
      handlers.onEsc()
    }
  }

  onMounted(() => window.addEventListener('keydown', onKeydown))
  onUnmounted(() => window.removeEventListener('keydown', onKeydown))
}
