import type { GameState, HexCoord } from '../types'
import { getCurrentPlayer, endTurn, onTilePlaced } from './turnManager'
import {
  getExplorableHexes,
  placeTile,
  getValidMoves,
  moveUnit,
  canFoundCity,
  foundCity
} from './actions'

// Delay between AI actions for visibility
const AI_ACTION_DELAY = 500

function delay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms))
}

// Pick a random element from an array
function pickRandom<T>(arr: T[]): T | undefined {
  if (arr.length === 0) return undefined
  return arr[Math.floor(Math.random() * arr.length)]
}

// Execute AI turn
export async function executeAITurn(state: GameState): Promise<void> {
  const player = getCurrentPlayer(state)
  if (!player.isAI) return

  await delay(AI_ACTION_DELAY)

  // Phase 1: Try to place a tile
  const explorableHexes = getExplorableHexes(player.id, state)
  if (explorableHexes.length > 0) {
    const targetHex = pickRandom(explorableHexes)
    if (targetHex) {
      placeTile(targetHex, state)
      onTilePlaced(state)
      await delay(AI_ACTION_DELAY)
    }
  }

  // Phase 2: Actions - move units and try to found cities
  const playerUnits = state.units.filter(u => u.owner === player.id)

  for (const unit of playerUnits) {
    // Try to found a city first
    if (canFoundCity(unit, state)) {
      foundCity(unit, state)
      await delay(AI_ACTION_DELAY)
      continue // Unit is consumed
    }

    // Otherwise, try to move
    const validMoves = getValidMoves(unit, state)
    if (validMoves.length > 0) {
      // Prefer moves that might enable city founding (more explored neighbors)
      const destination = pickBestMove(validMoves, state)
      if (destination) {
        moveUnit(unit, destination, state)
        await delay(AI_ACTION_DELAY)

        // Check if we can found city after moving
        if (canFoundCity(unit, state)) {
          foundCity(unit, state)
          await delay(AI_ACTION_DELAY)
        }
      }
    }
  }

  // End turn
  endTurn(state)
}

// Pick the best move - prefer tiles with more land neighbors (for city founding)
function pickBestMove(moves: HexCoord[], _state: GameState): HexCoord | undefined {
  if (moves.length === 0) return undefined

  // For now, just pick random - can be smarter later
  return pickRandom(moves)
}

// Check if it's AI's turn and auto-execute
export async function checkAndRunAI(state: GameState): Promise<boolean> {
  const player = getCurrentPlayer(state)
  if (player.isAI && state.phase === 'playing') {
    await executeAITurn(state)
    return true
  }
  return false
}
