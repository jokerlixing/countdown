<script setup lang="ts">
defineProps<{ label: string; modelValue: boolean; disabled?: boolean }>()
const emit = defineEmits<{ 'update:modelValue': [value: boolean] }>()
</script>

<template>
  <label class="row" :class="{ disabled }">
    <span>{{ label }}</span>
    <button
      class="switch"
      :class="{ on: modelValue }"
      :disabled="disabled"
      @click="emit('update:modelValue', !modelValue)"
    >
      <span class="knob" />
    </button>
  </label>
</template>

<style scoped>
.row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 10px 0;
  font-size: 14px;
}
.row.disabled {
  opacity: 0.5;
}
.switch {
  width: 42px;
  height: 24px;
  border-radius: 999px;
  background: var(--border);
  position: relative;
  transition: background 0.2s ease;
}
.switch.on {
  background: var(--accent);
}
.knob {
  position: absolute;
  top: 3px;
  left: 3px;
  width: 18px;
  height: 18px;
  border-radius: 50%;
  background: #fff;
  transition: transform 0.2s ease;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.25);
}
.switch.on .knob {
  transform: translateX(18px);
}
</style>
