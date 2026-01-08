<script setup lang="ts">
import { ref } from 'vue'
import GameBoard from './components/board/GameBoard.vue'
import { createGameState } from './game/state/gameState'

const gameState = ref(createGameState(['Player 1', 'Player 2']))
</script>

<template>
  <div class="app">
    <header>
      <h1>HexGame</h1>
      <p>Turn {{ gameState.turnNumber }} - {{ gameState.players[gameState.currentPlayerIndex].name }}</p>
    </header>
    <main>
      <GameBoard :tiles="gameState.tiles" :hex-size="50" />
    </main>
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
  padding: 1rem;
  max-width: 1200px;
  margin: 0 auto;
}

header {
  text-align: center;
  margin-bottom: 1rem;
}

header h1 {
  margin-bottom: 0.25rem;
}

header p {
  color: #aaa;
}

main {
  display: flex;
  justify-content: center;
}
</style>
