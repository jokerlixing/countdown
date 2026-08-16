import { defineStore } from 'pinia'
import { ref } from 'vue'

export const useUiStore = defineStore('ui', () => {
  const showSettings = ref(false)
  const hoverFloating = ref(false)
  let hoverTimer: ReturnType<typeof setTimeout> | null = null

  function floatingEnter(): void {
    if (hoverTimer) clearTimeout(hoverTimer)
    hoverFloating.value = true
  }

  function floatingLeave(): void {
    if (hoverTimer) clearTimeout(hoverTimer)
    hoverTimer = setTimeout(() => (hoverFloating.value = false), 1200)
  }

  return { showSettings, hoverFloating, floatingEnter, floatingLeave }
})
