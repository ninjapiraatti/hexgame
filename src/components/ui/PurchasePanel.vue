<script setup lang="ts">
import { computed, ref } from "vue";
import type { UnitType, HexCoord } from "@/game/types";
import { getUnitCost } from "@/game/systems/purchase";

const props = defineProps<{
  playerGold: number;
  validSpawnLocations: HexCoord[];
  canPurchase: boolean;
}>();

const emit = defineEmits<{
  purchase: [unitType: UnitType, location: HexCoord];
}>();

const settlerCost = getUnitCost("settler");
const heroCost = getUnitCost("hero");

const canAffordSettler = computed(() => props.playerGold >= settlerCost);
const canAffordHero = computed(() => props.playerGold >= heroCost);

const selectedUnitType = ref<UnitType | null>(null);
const selectedLocation = ref<HexCoord | null>(null);

const isPurchasing = computed(() => selectedUnitType.value !== null);

function startPurchase(unitType: UnitType) {
  const cost = getUnitCost(unitType);
  if (props.playerGold < cost) return;
  if (props.validSpawnLocations.length === 0) return;

  selectedUnitType.value = unitType;
  selectedLocation.value = null;
}

function selectLocation(location: HexCoord) {
  if (!selectedUnitType.value) return;
  selectedLocation.value = location;
}

function confirmPurchase() {
  if (!selectedUnitType.value || !selectedLocation.value) return;
  emit("purchase", selectedUnitType.value, selectedLocation.value);
  cancelPurchase();
}

function cancelPurchase() {
  selectedUnitType.value = null;
  selectedLocation.value = null;
}

function getLocationKey(coord: HexCoord): string {
  return `${coord.q},${coord.r}`;
}

function isLocationSelected(coord: HexCoord): boolean {
  if (!selectedLocation.value) return false;
  return selectedLocation.value.q === coord.q && selectedLocation.value.r === coord.r;
}
</script>

<template>
  <div class="purchase-panel" v-if="canPurchase">
    <h3>Purchase Units</h3>

    <div v-if="!isPurchasing" class="unit-options">
      <button
        class="unit-btn"
        :class="{ disabled: !canAffordSettler || validSpawnLocations.length === 0 }"
        :disabled="!canAffordSettler || validSpawnLocations.length === 0"
        @click="startPurchase('settler')">
        <div class="unit-name">Settler</div>
        <div class="unit-cost" :class="{ unaffordable: !canAffordSettler }">{{ settlerCost }} gold</div>
      </button>

      <button
        class="unit-btn"
        :class="{ disabled: !canAffordHero || validSpawnLocations.length === 0 }"
        :disabled="!canAffordHero || validSpawnLocations.length === 0"
        @click="startPurchase('hero')">
        <div class="unit-name">Hero</div>
        <div class="unit-cost" :class="{ unaffordable: !canAffordHero }">{{ heroCost }} gold</div>
      </button>
    </div>

    <div v-else class="purchase-flow">
      <div class="purchase-header">
        <span
          >Purchasing: <strong>{{ selectedUnitType }}</strong></span
        >
        <button class="cancel-btn" @click="cancelPurchase">✕</button>
      </div>

      <div class="location-select">
        <p class="instruction">Select spawn location ({{ validSpawnLocations.length }} available):</p>
        <div class="location-list">
          <button
            v-for="location in validSpawnLocations"
            :key="getLocationKey(location)"
            class="location-btn"
            :class="{ selected: isLocationSelected(location) }"
            @click="selectLocation(location)">
            ({{ location.q }}, {{ location.r }})
          </button>
        </div>
      </div>

      <button v-if="selectedLocation && selectedUnitType" class="confirm-btn" @click="confirmPurchase">
        Confirm Purchase ({{ getUnitCost(selectedUnitType) }} gold)
      </button>
    </div>

    <p v-if="validSpawnLocations.length === 0" class="warning">No valid spawn locations. Build a city first!</p>
  </div>
</template>

<style scoped>
.purchase-panel {
  background: #2a2a4a;
  border-radius: 6px;
  padding: 0.75rem;
  margin-top: 0.5rem;
}

.purchase-panel h3 {
  font-size: 0.85rem;
  color: #888;
  margin-bottom: 0.5rem;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.unit-options {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.unit-btn {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 0.5rem;
  border: 2px solid #444;
  border-radius: 4px;
  background: #333;
  color: #eee;
  cursor: pointer;
  transition: all 0.15s;
}

.unit-btn:hover:not(.disabled) {
  background: #444;
  border-color: #4ecdc4;
  transform: translateY(-2px);
}

.unit-btn.disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.unit-name {
  font-size: 0.85rem;
  font-weight: bold;
  margin-bottom: 0.25rem;
}

.unit-cost {
  font-size: 0.75rem;
  color: #f0c040;
}

.unit-cost.unaffordable {
  color: #999;
}

.purchase-flow {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.purchase-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.5rem;
  background: #333;
  border-radius: 4px;
  font-size: 0.8rem;
}

.purchase-header strong {
  color: #4ecdc4;
  text-transform: capitalize;
}

.cancel-btn {
  background: #555;
  border: none;
  color: #eee;
  width: 24px;
  height: 24px;
  border-radius: 50%;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.9rem;
  transition: background 0.15s;
}

.cancel-btn:hover {
  background: #666;
}

.location-select {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.instruction {
  font-size: 0.75rem;
  color: #aaa;
  margin: 0;
}

.location-list {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
  max-height: 150px;
  overflow-y: auto;
}

.location-btn {
  padding: 0.4rem;
  border: 1px solid #444;
  border-radius: 3px;
  background: #333;
  color: #eee;
  cursor: pointer;
  font-size: 0.75rem;
  font-family: monospace;
  transition: all 0.15s;
}

.location-btn:hover {
  background: #444;
  border-color: #4ecdc4;
}

.location-btn.selected {
  background: #4ecdc4;
  color: #000;
  border-color: #4ecdc4;
  font-weight: bold;
}

.confirm-btn {
  padding: 0.6rem;
  border: none;
  border-radius: 4px;
  background: #4ecdc4;
  color: #000;
  font-weight: bold;
  font-size: 0.85rem;
  cursor: pointer;
  transition: background 0.15s;
}

.confirm-btn:hover {
  background: #6ee7df;
}

.warning {
  font-size: 0.75rem;
  color: #ff6b6b;
  font-style: italic;
  margin: 0.5rem 0 0 0;
}
</style>
