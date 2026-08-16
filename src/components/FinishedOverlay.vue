<script setup lang="ts">
const emit = defineEmits<{ again: []; close: [] }>()
</script>

<template>
  <Transition name="fade">
    <div class="overlay">
      <div class="card box">
        <div class="emoji">⏰</div>
        <div class="text">时间到！</div>
        <div class="btns">
          <button class="btn btn-primary" @click="emit('again')">再来一次</button>
          <button class="btn btn-ghost" @click="emit('close')">关闭</button>
        </div>
      </div>
    </div>
  </Transition>
</template>

<style scoped>
.overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.4);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 20;
}
.box {
  padding: 28px 32px;
  text-align: center;
  box-shadow: var(--shadow);
}
.emoji {
  font-size: 40px;
  margin-bottom: 8px;
}
.text {
  font-size: 18px;
  font-weight: 700;
  margin-bottom: 18px;
}
.btns {
  display: flex;
  gap: 10px;
}
</style>
