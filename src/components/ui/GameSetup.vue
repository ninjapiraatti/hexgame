<script setup lang="ts">
import { ref, computed } from 'vue'

interface PlayerSetup {
  id: string
  name: string
  isAI: boolean
}

const emit = defineEmits<{
  start: [players: PlayerSetup[]]
}>()

const players = ref<PlayerSetup[]>([
  { id: '1', name: 'Player 1', isAI: false }
])

const canAddPlayer = computed(() => players.value.length < 6)
const canRemovePlayer = computed(() => players.value.length > 1)
const canStart = computed(() => players.value.length >= 2)

function addPlayer(isAI: boolean) {
  if (!canAddPlayer.value) return
  const num = players.value.length + 1
  players.value.push({
    id: crypto.randomUUID(),
    name: isAI ? `AI ${players.value.filter(p => p.isAI).length + 1}` : `Player ${num}`,
    isAI
  })
}

function removePlayer(id: string) {
  if (!canRemovePlayer.value) return
  const index = players.value.findIndex(p => p.id === id)
  if (index !== -1) {
    players.value.splice(index, 1)
  }
}

function toggleAI(id: string) {
  const player = players.value.find(p => p.id === id)
  if (player) {
    player.isAI = !player.isAI
    if (player.isAI && !player.name.startsWith('AI')) {
      player.name = `AI ${players.value.filter(p => p.isAI).length}`
    }
  }
}

function startGame() {
  if (!canStart.value) return
  emit('start', players.value)
}
</script>

<template>
  <div class="setup-container">
    <div class="setup-panel">
      <h1>HexGame</h1>
      <p class="subtitle">Turn-based hex strategy</p>

      <div class="players-section">
        <h2>Players</h2>

        <ul class="player-list">
          <li v-for="player in players" :key="player.id" class="player-item">
            <input
              v-model="player.name"
              type="text"
              class="player-name-input"
              :placeholder="player.isAI ? 'AI Name' : 'Player Name'"
            />
            <button
              class="btn-toggle"
              :class="{ 'is-ai': player.isAI }"
              @click="toggleAI(player.id)"
              :title="player.isAI ? 'Switch to Human' : 'Switch to AI'"
            >
              {{ player.isAI ? '🤖' : '👤' }}
            </button>
            <button
              v-if="canRemovePlayer"
              class="btn-remove"
              @click="removePlayer(player.id)"
              title="Remove player"
            >
              ✕
            </button>
          </li>
        </ul>

        <div class="add-buttons" v-if="canAddPlayer">
          <button class="btn btn-add" @click="addPlayer(false)">
            + Add Player
          </button>
          <button class="btn btn-add" @click="addPlayer(true)">
            + Add AI
          </button>
        </div>

        <p v-if="players.length >= 6" class="limit-text">Maximum 6 players</p>
      </div>

      <button
        class="btn btn-start"
        :disabled="!canStart"
        @click="startGame"
      >
        Start Game
      </button>

      <p v-if="!canStart" class="hint">Add at least 2 players to start</p>
    </div>
  </div>
</template>

<style scoped>
.setup-container {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #1a1a2e;
  padding: 1rem;
}

.setup-panel {
  background: #252540;
  border-radius: 12px;
  padding: 2rem;
  width: 100%;
  max-width: 400px;
  text-align: center;
}

h1 {
  color: #eee;
  margin-bottom: 0.25rem;
}

.subtitle {
  color: #888;
  margin-bottom: 2rem;
}

.players-section {
  text-align: left;
  margin-bottom: 1.5rem;
}

.players-section h2 {
  font-size: 0.9rem;
  color: #888;
  text-transform: uppercase;
  letter-spacing: 1px;
  margin-bottom: 0.75rem;
}

.player-list {
  list-style: none;
  padding: 0;
  margin: 0 0 1rem 0;
}

.player-item {
  display: flex;
  gap: 0.5rem;
  margin-bottom: 0.5rem;
  align-items: center;
}

.player-name-input {
  flex: 1;
  padding: 0.5rem 0.75rem;
  border: 1px solid #444;
  border-radius: 6px;
  background: #1a1a2e;
  color: #eee;
  font-size: 0.9rem;
}

.player-name-input:focus {
  outline: none;
  border-color: #4ecdc4;
}

.btn-toggle {
  width: 36px;
  height: 36px;
  border: 1px solid #444;
  border-radius: 6px;
  background: #1a1a2e;
  cursor: pointer;
  font-size: 1rem;
  transition: all 0.15s;
}

.btn-toggle:hover {
  border-color: #666;
}

.btn-toggle.is-ai {
  background: #2a3a4a;
  border-color: #4ecdc4;
}

.btn-remove {
  width: 36px;
  height: 36px;
  border: 1px solid #444;
  border-radius: 6px;
  background: #1a1a2e;
  color: #888;
  cursor: pointer;
  font-size: 0.8rem;
  transition: all 0.15s;
}

.btn-remove:hover {
  border-color: #e74c3c;
  color: #e74c3c;
}

.add-buttons {
  display: flex;
  gap: 0.5rem;
}

.btn {
  padding: 0.5rem 1rem;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-size: 0.85rem;
  transition: all 0.15s;
}

.btn-add {
  flex: 1;
  background: #333;
  color: #aaa;
  border: 1px dashed #555;
}

.btn-add:hover {
  background: #3a3a4a;
  border-color: #666;
  color: #eee;
}

.btn-start {
  width: 100%;
  padding: 0.75rem 1.5rem;
  background: #4ecdc4;
  color: #000;
  font-size: 1rem;
  font-weight: 600;
  border-radius: 8px;
}

.btn-start:hover:not(:disabled) {
  background: #6ee7df;
}

.btn-start:disabled {
  background: #333;
  color: #666;
  cursor: not-allowed;
}

.limit-text {
  font-size: 0.75rem;
  color: #666;
  text-align: center;
  margin-top: 0.5rem;
}

.hint {
  font-size: 0.8rem;
  color: #666;
  margin-top: 0.75rem;
}
</style>
