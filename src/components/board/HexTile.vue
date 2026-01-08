<script setup lang="ts">
import type { Tile, Unit, City } from "@/game/types";

const props = defineProps<{
  tile: Tile;
  size: number;
  units?: Unit[];
  city?: City;
  isSelected?: boolean;
  isValidMove?: boolean;
  playerColorMap?: Record<string, string>;
}>();

const emit = defineEmits<{
  click: [];
}>();

const terrainEmoji: Record<string, string> = {
  forest: "🌲",
  desert: "🏜️",
  mountain: "⛰️",
  water: "🌊",
};

const terrainColors: Record<string, string> = {
  forest: "#228B22",
  desert: "#EDC9AF",
  mountain: "#808080",
  water: "#4169E1",
};

function getUnitColor(unit: Unit): string {
  return props.playerColorMap?.[unit.owner] || "#FFFFFF";
}

function getCityColor(city: City): string {
  return props.playerColorMap?.[city.owner] || "#FFFFFF";
}
</script>

<template>
  <div
    class="hex-tile"
    :class="{
      'is-selected': isSelected,
      'is-valid-move': isValidMove,
    }"
    :style="{
      '--hex-size': size + 'px',
      '--bg-color': terrainColors[tile.type],
    }"
    @click="emit('click')">
    <span class="terrain-icon">{{ terrainEmoji[tile.type] }}</span>

    <div v-if="city" class="city" :style="{ color: getCityColor(city) }">🏛️</div>

    <div v-if="units && units.length > 0" class="units">
      <div
        v-for="unit in units"
        :key="unit.id"
        class="unit"
        :class="{ 'unit-soldier': unit.type === 'soldier' }"
        :style="{ backgroundColor: getUnitColor(unit) }"
        :title="unit.type">
        {{ unit.type === "settler" ? "👤" : "⚔️" }}
      </div>
    </div>
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
  cursor: pointer;
  transition: filter 0.15s;
}

.hex-tile:hover {
  filter: brightness(1.2);
}

.hex-tile.is-selected {
  filter: brightness(1.4);
  box-shadow: 0 0 0 3px #fff inset;
}

.hex-tile.is-valid-move {
  filter: brightness(1.3);
}

.hex-tile.is-valid-move::after {
  content: "";
  position: absolute;
  inset: 4px;
  border: 2px dashed rgba(255, 255, 255, 0.6);
  clip-path: polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%);
  pointer-events: none;
}

.terrain-icon {
  font-size: calc(var(--hex-size) * 0.5);
  opacity: 0.7;
  position: absolute;
}

.city {
  position: absolute;
  font-size: calc(var(--hex-size) * 0.6);
  top: 15%;
}

.units {
  position: absolute;
  bottom: 20%;
  display: flex;
  gap: 2px;
}

.unit {
  width: calc(var(--hex-size) * 0.4);
  height: calc(var(--hex-size) * 0.4);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: calc(var(--hex-size) * 0.25);
  border: 1px solid rgba(0, 0, 0, 0.3);
}

.unit-soldier {
  border: 2px solid rgba(0, 0, 0, 0.8);
  box-shadow: 0 0 4px rgba(0, 0, 0, 0.5);
}
</style>
