import type { GameState, HexCoord, Unit, City } from '../types'
import { hexDistance, coordsEqual } from '../utils/hex'
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
import { purchaseUnit, getValidSpawnLocations, canAffordUnit } from './purchase'

// Delay between AI actions for visibility
const AI_ACTION_DELAY = 200

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

// Find the nearest enemy city to a position
function findNearestEnemyCity(
  position: HexCoord,
  playerId: string,
  state: GameState
): City | null {
  const enemyCities = state.cities.filter(c => c.owner !== playerId)
  if (enemyCities.length === 0) return null

  let nearest: City | null = null
  let minDistance = Infinity

  for (const city of enemyCities) {
    const dist = hexDistance(position, city.position)
    if (dist < minDistance) {
      minDistance = dist
      nearest = city
    }
  }

  return nearest
}

// Find a grouping point for soldiers (average position of all player's soldiers)
function findSoldierGroupingPoint(playerId: string, state: GameState): HexCoord | null {
  const soldiers = state.units.filter(u => u.owner === playerId && u.type === 'soldier')
  if (soldiers.length === 0) return null

  // Calculate average position
  const avgQ = soldiers.reduce((sum, s) => sum + s.position.q, 0) / soldiers.length
  const avgR = soldiers.reduce((sum, s) => sum + s.position.r, 0) / soldiers.length

  // Find the closest soldier to the average position
  let closest = soldiers[0]
  let minDist = Infinity

  for (const soldier of soldiers) {
    const dist = Math.sqrt(
      Math.pow(soldier.position.q - avgQ, 2) + Math.pow(soldier.position.r - avgR, 2)
    )
    if (dist < minDist) {
      minDist = dist
      closest = soldier
    }
  }

  return closest.position
}

// Check if soldiers are grouped together (within distance 2 of each other)
function areSoldiersGrouped(playerId: string, state: GameState): boolean {
  const soldiers = state.units.filter(u => u.owner === playerId && u.type === 'soldier')
  const minSoldiers = getRules().ai.minSoldiersForAttack

  if (soldiers.length < minSoldiers) return false

  // Check if at least minSoldiersForAttack are within range of each other
  for (let i = 0; i < soldiers.length; i++) {
    let nearbyCount = 1 // Count the soldier itself
    for (let j = 0; j < soldiers.length; j++) {
      if (i !== j && hexDistance(soldiers[i].position, soldiers[j].position) <= 2) {
        nearbyCount++
      }
    }
    if (nearbyCount >= minSoldiers) return true
  }

  return false
}

// Move soldier toward a target position
function moveSoldierTowardTarget(
  soldier: Unit,
  target: HexCoord,
  state: GameState
): HexCoord | undefined {
  const validMoves = getValidMoves(soldier, state)
  if (validMoves.length === 0) return undefined

  // Pick the move that gets closest to the target
  let bestMove = validMoves[0]
  let bestDist = hexDistance(validMoves[0], target)

  for (const move of validMoves) {
    const dist = hexDistance(move, target)
    if (dist < bestDist) {
      bestDist = dist
      bestMove = move
    }
  }

  return bestMove
}

// AI purchases soldiers when it has money
async function tryPurchaseSoldiers(playerId: string, state: GameState): Promise<void> {
  // Keep buying soldiers while we can afford them
  while (canAffordUnit(playerId, 'soldier', state)) {
    const spawnLocations = getValidSpawnLocations(playerId, state)
    if (spawnLocations.length === 0) break

    // Pick a random spawn location
    const location = pickRandom(spawnLocations)
    if (!location) break

    const purchased = purchaseUnit(playerId, 'soldier', location, state)
    if (!purchased) break

    await delay(AI_ACTION_DELAY)
  }
}

// Execute AI turn
export async function executeAITurn(state: GameState): Promise<void> {
  const player = getCurrentPlayer(state)
  if (!player.isAI) return

  await delay(AI_ACTION_DELAY)

  // Get player's units
  const playerUnits = state.units.filter(u => u.owner === player.id)
  const settlers = playerUnits.filter(u => u.type === 'settler')
  const soldiers = playerUnits.filter(u => u.type === 'soldier')
  const hasCity = state.cities.some(c => c.owner === player.id)

  // Phase 1: Try to place a tile - prefer tiles further from cities or near soldiers
  const explorableHexes = getExplorableHexes(player.id, state)
  if (explorableHexes.length > 0) {
    const targetHex = pickBestTilePlacement(explorableHexes, playerUnits, state)
    if (targetHex) {
      placeTile(targetHex, state)
      onTilePlaced(state)
      await delay(AI_ACTION_DELAY)
    }
  }

  // Phase 2: Actions - move units
  // First handle settlers
  for (const settler of settlers) {
    // Try to found a city if we don't have one and conditions are met
    if (!hasCity && canFoundCity(settler, state)) {
      foundCity(settler, state)
      await delay(AI_ACTION_DELAY)
      continue // Unit is consumed
    }

    // Otherwise, try to move - settlers should explore away from cities
    const validMoves = getValidMoves(settler, state)
    if (validMoves.length > 0) {
      const destination = pickBestMoveForSettler(settler, validMoves, state, hasCity)
      if (destination) {
        moveUnit(settler, destination, state)
        await delay(AI_ACTION_DELAY)

        // Check if we can found city after moving (only if we don't have one)
        if (!hasCity && canFoundCity(settler, state)) {
          foundCity(settler, state)
          await delay(AI_ACTION_DELAY)
        }
      }
    }
  }

  // Then handle soldiers with new strategy
  const grouped = areSoldiersGrouped(player.id, state)
  const nearestEnemyCity = findNearestEnemyCity(
    soldiers[0]?.position || { q: 0, r: 0 },
    player.id,
    state
  )

  for (const soldier of soldiers) {
    const validMoves = getValidMoves(soldier, state)
    if (validMoves.length === 0) continue

    let destination: HexCoord | undefined

    if (grouped && nearestEnemyCity) {
      // Soldiers are grouped - move toward enemy city
      destination = moveSoldierTowardTarget(soldier, nearestEnemyCity.position, state)
    } else {
      // Not grouped yet - move toward grouping point
      const groupingPoint = findSoldierGroupingPoint(player.id, state)
      if (groupingPoint && !coordsEqual(soldier.position, groupingPoint)) {
        destination = moveSoldierTowardTarget(soldier, groupingPoint, state)
      } else {
        // Already at grouping point or only soldier - wait
        destination = undefined
      }
    }

    if (destination) {
      moveUnit(soldier, destination, state)
      await delay(AI_ACTION_DELAY)
    }
  }

  // Phase 3: Purchase units - AIs only buy soldiers for now
  await tryPurchaseSoldiers(player.id, state)

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
