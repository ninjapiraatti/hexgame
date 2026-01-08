<script setup lang="ts">
import { computed } from 'vue'
import type { Tile } from '@/game/types'
import { axialToPixel } from '@/game/utils/hex'
import HexTile from './HexTile.vue'

const props = defineProps<{
  tiles: Map<string, Tile>
  hexSize?: number
}>()

const hexSize = computed(() => props.hexSize ?? 40)

function getTilePosition(tile: Tile) {
  const { x, y } = axialToPixel(tile.coord, hexSize.value)
  return {
    transform: `translate(${x}px, ${y}px)`
  }
}
</script>

<template>
  <div class="game-board">
    <div class="board-container">
      <HexTile
        v-for="[key, tile] in tiles"
        :key="key"
        :tile="tile"
        :size="hexSize"
        :style="getTilePosition(tile)"
      />
    </div>
  </div>
</template>

<style scoped>
.game-board {
  width: 100%;
  height: 600px;
  overflow: auto;
  background: #0a0a15;
  border-radius: 8px;
  position: relative;
}

.board-container {
  position: absolute;
  top: 50%;
  left: 50%;
}
</style>
