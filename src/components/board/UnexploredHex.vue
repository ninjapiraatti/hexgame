<script setup lang="ts">
import type { HexCoord } from '@/game/types'

defineProps<{
  coord: HexCoord
  size: number
  isActive: boolean
}>()

const emit = defineEmits<{
  click: []
}>()
</script>

<template>
  <div
    class="unexplored-hex"
    :class="{ 'is-active': isActive }"
    :style="{ '--hex-size': size + 'px' }"
    @click="emit('click')"
  >
    <span class="icon">?</span>
  </div>
</template>

<style scoped>
.unexplored-hex {
  width: calc(var(--hex-size) * 1.732);
  height: calc(var(--hex-size) * 2);
  background: #1a1a2e;
  border: 2px dashed #333;
  clip-path: polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%);
  display: flex;
  align-items: center;
  justify-content: center;
  position: absolute;
  opacity: 0.5;
  transition: opacity 0.15s, border-color 0.15s;
}

.unexplored-hex.is-active {
  opacity: 1;
  border-color: #4ECDC4;
  cursor: pointer;
}

.unexplored-hex.is-active:hover {
  background: #252540;
  border-color: #6EE7DF;
}

.icon {
  font-size: calc(var(--hex-size) * 0.5);
  color: #555;
}

.is-active .icon {
  color: #4ECDC4;
}
</style>
