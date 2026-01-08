<script setup lang="ts">
import { ref, computed } from 'vue'
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
  canPlaceTile: boolean
  playerColorMap: Record<string, string>
}>()

const emit = defineEmits<{
  hexClick: [coord: HexCoord]
}>()

// Zoom state
const MIN_ZOOM = 0.5
const MAX_ZOOM = 2
const ZOOM_STEP = 0.1
const zoom = ref(1)
const baseHexSize = 40

const hexSize = computed(() => baseHexSize * zoom.value)

function handleWheel(e: WheelEvent) {
  e.preventDefault()
  const delta = e.deltaY > 0 ? -ZOOM_STEP : ZOOM_STEP
  zoom.value = Math.max(MIN_ZOOM, Math.min(MAX_ZOOM, zoom.value + delta))
}

function zoomIn() {
  zoom.value = Math.min(MAX_ZOOM, zoom.value + ZOOM_STEP)
}

function zoomOut() {
  zoom.value = Math.max(MIN_ZOOM, zoom.value - ZOOM_STEP)
}

function resetZoom() {
  zoom.value = 1
}

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
  <div class="game-board" @wheel="handleWheel">
    <div class="zoom-controls">
      <button @click="zoomIn" title="Zoom in">+</button>
      <button @click="resetZoom" title="Reset zoom">{{ Math.round(zoom * 100) }}%</button>
      <button @click="zoomOut" title="Zoom out">-</button>
    </div>

    <div class="board-container">
      <HexTile
        v-for="[key, tile] in tiles"
        :key="key"
        :tile="tile"
        :size="hexSize"
        :units="getUnitsOnTile(tile.coord)"
        :city="getCityOnTile(tile.coord)"
        :is-selected="isSelected(tile.coord)"
        :is-valid-move="isValidMove(tile.coord)"
        :player-color-map="playerColorMap"
        :style="getTilePosition(tile.coord)"
        @click="emit('hexClick', tile.coord)"
      />

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

.zoom-controls {
  position: absolute;
  top: 0.5rem;
  right: 0.5rem;
  display: flex;
  gap: 2px;
  z-index: 10;
}

.zoom-controls button {
  width: 32px;
  height: 28px;
  border: none;
  background: #333;
  color: #eee;
  cursor: pointer;
  font-size: 0.8rem;
  transition: background 0.15s;
}

.zoom-controls button:first-child {
  border-radius: 4px 0 0 4px;
}

.zoom-controls button:last-child {
  border-radius: 0 4px 4px 0;
}

.zoom-controls button:hover {
  background: #444;
}

.zoom-controls button:nth-child(2) {
  width: 50px;
  font-size: 0.7rem;
}
</style>
