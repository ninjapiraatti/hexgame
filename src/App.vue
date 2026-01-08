<script setup lang="ts">
import GameBoard from "./components/board/GameBoard.vue";
import { useGame } from "./composables/useGame";

const {
  state,
  selectedUnit,
  isProcessing,
  currentPlayer,
  isPlayerTurn,
  explorableHexes,
  canPlaceTile,
  selectedUnitMoves,
  canSelectedUnitFoundCity,
  handleHexClick,
  handleFoundCity,
  handleEndTurn,
  handleSkipPlacement,
  newGame,
} = useGame();

const playerColors: Record<string, string> = {
  p0: "#FF6B6B",
  ai0: "#4ECDC4",
  ai1: "#FFE66D",
  ai2: "#95E1D3",
};
</script>

<template>
  <div class="app">
    <header>
      <h1>HexGame</h1>
      <div class="turn-info">
        <span>Turn {{ state.turnNumber }}</span>
        <span class="divider">|</span>
        <span class="current-player" :style="{ color: playerColors[currentPlayer.id] }">
          {{ currentPlayer.name }}
        </span>
        <span v-if="currentPlayer.isAI" class="ai-badge">AI</span>
        <span class="phase-badge">{{ state.turnPhase }}</span>
      </div>
    </header>

    <main>
      <GameBoard
        :tiles="state.tiles"
        :units="state.units"
        :cities="state.cities"
        :explorable-hexes="explorableHexes"
        :selected-unit="selectedUnit"
        :valid-moves="selectedUnitMoves"
        :can-place-tile="canPlaceTile && isPlayerTurn"
        :hex-size="50"
        @hex-click="handleHexClick" />
    </main>

    <footer>
      <div class="controls" v-if="isPlayerTurn && !isProcessing">
        <button v-if="state.turnPhase === 'placeTile'" @click="handleSkipPlacement" class="btn">
          Skip Tile Placement
        </button>

        <button v-if="canSelectedUnitFoundCity" @click="handleFoundCity" class="btn btn-primary">Found City</button>

        <button @click="handleEndTurn" class="btn">End Turn</button>
      </div>

      <div v-else-if="isProcessing" class="processing">AI is thinking...</div>

      <div class="game-actions">
        <button @click="newGame" class="btn btn-secondary">New Game</button>
      </div>
    </footer>

    <aside class="sidebar">
      <h3>Players</h3>
      <ul class="player-list">
        <li
          v-for="(player, index) in state.players"
          :key="player.id"
          :class="{ active: index === state.currentPlayerIndex }">
          <span class="player-color" :style="{ backgroundColor: playerColors[player.id] }"></span>
          <span class="player-name">{{ player.name }}</span>
          <span v-if="player.isAI" class="ai-tag">AI</span>
          <span class="player-score">{{ player.score }} pts</span>
        </li>
      </ul>

      <h3>Cities</h3>
      <ul v-if="state.cities.length > 0" class="city-list">
        <li v-for="city in state.cities" :key="city.id">
          <span class="player-color" :style="{ backgroundColor: playerColors[city.owner] }"></span>
          {{ city.name }}
        </li>
      </ul>
      <p v-else class="empty-text">No cities founded yet</p>

      <div v-if="selectedUnit" class="selected-info">
        <h3>Selected Unit</h3>
        <p>Type: {{ selectedUnit.type }}</p>
        <p>Moved: {{ selectedUnit.hasMoved ? "Yes" : "No" }}</p>
        <p v-if="canSelectedUnitFoundCity" class="can-found">Can found city here!</p>
      </div>
    </aside>
  </div>
</template>

<style>
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

body {
  font-family: system-ui, -apple-system, sans-serif;
  background: #1a1a2e;
  color: #eee;
  min-height: 100vh;
}

.app {
  display: grid;
  grid-template-columns: 1fr 150px;
  grid-template-rows: auto 1fr auto;
  grid-template-areas:
    "header header"
    "board sidebar"
    "footer sidebar";
  gap: 0.5rem;
  padding: 0.5rem;
  height: 100vh;
  overflow: hidden;
}

header {
  grid-area: header;
  text-align: center;
}

header h1 {
  margin-bottom: 0.5rem;
}

.turn-info {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  color: #aaa;
}

.divider {
  color: #444;
}

.current-player {
  font-weight: bold;
}

.ai-badge,
.phase-badge {
  font-size: 0.75rem;
  padding: 0.15rem 0.4rem;
  border-radius: 4px;
  background: #333;
}

.phase-badge {
  background: #2a2a4a;
  color: #8888cc;
}

main {
  grid-area: board;
  min-height: 0;
  min-width: 0;
}

footer {
  grid-area: footer;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.controls {
  display: flex;
  gap: 0.5rem;
}

.btn {
  padding: 0.5rem 1rem;
  border: none;
  border-radius: 4px;
  background: #333;
  color: #eee;
  cursor: pointer;
  font-size: 0.9rem;
  transition: background 0.15s;
}

.btn:hover {
  background: #444;
}

.btn-primary {
  background: #4ecdc4;
  color: #000;
}

.btn-primary:hover {
  background: #6ee7df;
}

.btn-secondary {
  background: #555;
}

.processing {
  color: #4ecdc4;
  font-style: italic;
}

.sidebar {
  grid-area: sidebar;
  background: #252540;
  border-radius: 6px;
  padding: 0.5rem;
  font-size: 0.75rem;
  overflow-y: auto;
}

.sidebar h3 {
  font-size: 0.75rem;
  color: #888;
  margin-bottom: 0.25rem;
  margin-top: 0.5rem;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.sidebar h3:first-child {
  margin-top: 0;
}

.player-list,
.city-list {
  list-style: none;
}

.player-list li,
.city-list li {
  display: flex;
  align-items: center;
  gap: 0.35rem;
  padding: 0.25rem;
  border-radius: 3px;
  font-size: 0.75rem;
}

.player-list li.active {
  background: #333355;
}

.player-color {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  flex-shrink: 0;
}

.player-name {
  flex: 1;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.ai-tag {
  font-size: 0.6rem;
  background: #444;
  padding: 0.05rem 0.2rem;
  border-radius: 2px;
}

.player-score {
  color: #888;
  font-size: 0.65rem;
}

.empty-text {
  font-size: 0.7rem;
  color: #666;
  font-style: italic;
}

.selected-info {
  margin-top: 0.5rem;
  padding-top: 0.5rem;
  border-top: 1px solid #333;
}

.selected-info p {
  font-size: 0.7rem;
  color: #aaa;
}

.can-found {
  color: #4ecdc4 !important;
  font-weight: bold;
}
</style>
