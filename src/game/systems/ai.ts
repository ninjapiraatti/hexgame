import type { GameState, HexCoord, Unit } from '../types'
import { hexDistance } from '../utils/hex'
import { getCurrentPlayer, endTurn, onTilePlaced } from './turnManager'
import {
  getExplorableHexes,
  placeTile,
  getValidMoves,
  moveUnit,
  canFoundCity,
  foundCity,
  distanceToNearestCity
} from './actions'
import { getRules } from '../rules/gameRules'

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

// Get distance from a hex to the nearest city (any player's city)
function getDistanceFromCities(coord: HexCoord, state: GameState): number {
  if (state.cities.length === 0) return Infinity
  return Math.min(...state.cities.map(c => hexDistance(coord, c.position)))
}

// Execute AI turn
export async function executeAITurn(state: GameState): Promise<void> {
  const player = getCurrentPlayer(state)
  if (!player.isAI) return

  await delay(AI_ACTION_DELAY)

  // Get player's units to determine where to explore
  const playerUnits = state.units.filter(u => u.owner === player.id)
  const hasCity = state.cities.some(c => c.owner === player.id)

  // Phase 1: Try to place a tile - prefer tiles further from cities
  const explorableHexes = getExplorableHexes(player.id, state)
  if (explorableHexes.length > 0) {
    const targetHex = pickBestTilePlacement(explorableHexes, playerUnits, state)
    if (targetHex) {
      placeTile(targetHex, state)
      onTilePlaced(state)
      await delay(AI_ACTION_DELAY)
    }
  }

  // Phase 2: Actions - move units and try to found cities
  for (const unit of playerUnits) {
    // Try to found a city if we don't have one and conditions are met
    if (!hasCity && canFoundCity(unit, state)) {
      foundCity(unit, state)
      await delay(AI_ACTION_DELAY)
      continue // Unit is consumed
    }

    // Otherwise, try to move - settlers should explore away from cities
    const validMoves = getValidMoves(unit, state)
    if (validMoves.length > 0) {
      const destination = pickBestMoveForSettler(unit, validMoves, state, hasCity)
      if (destination) {
        moveUnit(unit, destination, state)
        await delay(AI_ACTION_DELAY)

        // Check if we can found city after moving (only if we don't have one)
        if (!hasCity && canFoundCity(unit, state)) {
          foundCity(unit, state)
          await delay(AI_ACTION_DELAY)
        }
      }
    }
  }

  // End turn
  endTurn(state)
}

// Pick the best tile to place - prefer tiles that help settlers explore away from cities
function pickBestTilePlacement(
  hexes: HexCoord[],
  playerUnits: Unit[],
  state: GameState
): HexCoord | undefined {
  if (hexes.length === 0) return undefined
  if (state.cities.length === 0) return pickRandom(hexes)

  // Find hexes adjacent to our settlers
  const settlerPositions = new Set(
    playerUnits
      .filter(u => u.type === 'settler')
      .map(u => `${u.position.q},${u.position.r}`)
  )

  // Score each hex: prefer ones further from cities and adjacent to our settlers
  const scored = hexes.map(hex => {
    const distFromCities = getDistanceFromCities(hex, state)
    // Bonus if adjacent to a settler (they can move there next)
    const adjacentToSettler = hexes.some(h =>
      settlerPositions.has(`${h.q},${h.r}`)
    ) ? 1 : 0

    return {
      hex,
      score: distFromCities + adjacentToSettler * 0.5
    }
  })

  // Sort by score descending and pick from top candidates
  scored.sort((a, b) => b.score - a.score)

  // Pick randomly from the top 3 to add some variety
  const topCandidates = scored.slice(0, Math.min(3, scored.length))
  return pickRandom(topCandidates.map(s => s.hex))
}

// Pick the best move for a settler
function pickBestMoveForSettler(
  unit: Unit,
  moves: HexCoord[],
  state: GameState,
  hasCity: boolean
): HexCoord | undefined {
  if (moves.length === 0) return undefined

  const rules = getRules().city

  // If no cities exist anywhere, just pick randomly
  if (state.cities.length === 0) {
    return pickRandom(moves)
  }

  // Score each move based on distance from cities
  const scored = moves.map(move => {
    const distFromCities = distanceToNearestCity(move, state)
    const currentDist = distanceToNearestCity(unit.position, state)

    let score = distFromCities

    // Strong preference for moves that increase distance from cities
    // until we're far enough to found our own city
    if (!hasCity && distFromCities < rules.minDistanceFromCity) {
      // Not far enough yet - heavily prefer moves that go further away
      score = distFromCities * 10
    } else if (!hasCity && distFromCities >= rules.minDistanceFromCity) {
      // Far enough! This is a good spot, but keep some preference for distance
      score = distFromCities + 100 // Bonus for being valid founding distance
    }

    // Penalize moves that go back toward cities
    if (distFromCities < currentDist) {
      score -= 50
    }

    return { move, score }
  })

  // Sort by score descending
  scored.sort((a, b) => b.score - a.score)

  // Pick the best move (or randomly from top 2 for slight variety)
  const topCandidates = scored.slice(0, Math.min(2, scored.length))
  return pickRandom(topCandidates.map(s => s.move))
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
