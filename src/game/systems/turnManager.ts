import type { GameState, Player } from '../types'
import { resetUnitMovement } from './actions'

// Get the current player
export function getCurrentPlayer(state: GameState): Player {
  return state.players[state.currentPlayerIndex]
}

// Check if current player is AI
export function isCurrentPlayerAI(state: GameState): boolean {
  return getCurrentPlayer(state).isAI
}

// Advance to next player's turn
export function endTurn(state: GameState): void {
  // Move to next player
  state.currentPlayerIndex = (state.currentPlayerIndex + 1) % state.players.length

  // If we've looped back to first player, increment turn number
  if (state.currentPlayerIndex === 0) {
    state.turnNumber++
  }

  // Reset turn phase and unit movement for new player
  state.turnPhase = 'placeTile'
  resetUnitMovement(getCurrentPlayer(state).id, state)
}

// Skip tile placement phase and go to actions
export function skipTilePlacement(state: GameState): void {
  if (state.turnPhase === 'placeTile') {
    state.turnPhase = 'actions'
  }
}

// Called after placing a tile
export function onTilePlaced(state: GameState): void {
  state.turnPhase = 'actions'
}
