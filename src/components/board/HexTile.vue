<script setup lang="ts">
import type { Tile } from '@/game/types'

defineProps<{
  tile: Tile
  size: number
}>()

const terrainEmoji: Record<string, string> = {
  forest: '🌲',
  desert: '🏜️',
  mountain: '⛰️',
  water: '🌊'
}

const terrainColors: Record<string, string> = {
  forest: '#228B22',
  desert: '#EDC9AF',
  mountain: '#808080',
  water: '#4169E1'
}
</script>

<template>
  <div
    class="hex-tile"
    :style="{
      '--hex-size': size + 'px',
      '--bg-color': terrainColors[tile.type]
    }"
  >
    <span class="terrain-icon">{{ terrainEmoji[tile.type] }}</span>
  </div>
</template>

<style scoped>
.hex-tile {
  width: calc(var(--hex-size) * 1.732);
  height: calc(var(--hex-size) * 2);
  background: var(--bg-color);
  clip-path: polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%);
  display: flex;
  align-items: center;
  justify-content: center;
  position: absolute;
}

.terrain-icon {
  font-size: calc(var(--hex-size) * 0.6);
}
</style>
