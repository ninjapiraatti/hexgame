<script setup lang="ts">
import { computed } from 'vue'
import type { Tile, Unit, City, HexCoord } from '@/game/types'
import { axialToPixel } from '@/game/utils/hex'
import HexTile from './HexTile.vue'
import UnexploredHex from './UnexploredHex.vue'

const props = defineProps<{
  tiles: Map<string, Tile>
  units: Unit[]
  cities: City[]
  explorableHexes: HexCoord[]
  selectedUnit: Unit | null
  validMoves: HexCoord[]
  hexSize?: number
  canPlaceTile: boolean
}>()

const emit = defineEmits<{
  hexClick: [coord: HexCoord]
}>()

const hexSize = computed(() => props.hexSize ?? 40)

function getTilePosition(coord: HexCoord) {
  const { x, y } = axialToPixel(coord, hexSize.value)
  return {
    transform: `translate(${x}px, ${y}px)`
  }
}

function getUnitsOnTile(coord: HexCoord): Unit[] {
  return props.units.filter(
    u => u.position.q === coord.q && u.position.r === coord.r
  )
}

function getCityOnTile(coord: HexCoord): City | undefined {
  return props.cities.find(
    c => c.position.q === coord.q && c.position.r === coord.r
  )
}

function isSelected(coord: HexCoord): boolean {
  if (!props.selectedUnit) return false
  return (
    props.selectedUnit.position.q === coord.q &&
    props.selectedUnit.position.r === coord.r
  )
}

function isValidMove(coord: HexCoord): boolean {
  return props.validMoves.some(m => m.q === coord.q && m.r === coord.r)
}
</script>

<template>
  <div class="game-board">
    <div class="board-container">
      <!-- Existing tiles -->
      <HexTile
        v-for="[key, tile] in tiles"
        :key="key"
        :tile="tile"
        :size="hexSize"
        :units="getUnitsOnTile(tile.coord)"
        :city="getCityOnTile(tile.coord)"
        :is-selected="isSelected(tile.coord)"
        :is-valid-move="isValidMove(tile.coord)"
        :style="getTilePosition(tile.coord)"
        @click="emit('hexClick', tile.coord)"
      />

      <!-- Unexplored hexes that can be clicked to place tiles -->
      <UnexploredHex
        v-for="coord in explorableHexes"
        :key="`unexplored-${coord.q}-${coord.r}`"
        :coord="coord"
        :size="hexSize"
        :is-active="canPlaceTile"
        :style="getTilePosition(coord)"
        @click="emit('hexClick', coord)"
      />
    </div>
  </div>
</template>

<style scoped>
.game-board {
  width: 100%;
  height: 100%;
  min-height: 400px;
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
