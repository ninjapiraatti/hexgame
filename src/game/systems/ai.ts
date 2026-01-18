import type { GameState, HexCoord, Unit } from '../types'
import { hexDistance, getNeighbors } from '../utils/hex'
import { getCurrentPlayer, endTurn, onTilePlaced } from './turnManager'
import {
  getExplorableHexes,
  placeTile,
  getValidMoves,
  moveUnit,
  canFoundCity,
  foundCity,
  distanceToNearestCity,
  getUnitExplorableHexes,
  heroRevealTile,
  getRemainingReveals
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

// AI purchases heroes when it has money
async function tryPurchaseHeroes(playerId: string, state: GameState): Promise<void> {
  // Keep buying heroes while we can afford them
  while (canAffordUnit(playerId, 'hero', state)) {
    const spawnLocations = getValidSpawnLocations(playerId, state)
    if (spawnLocations.length === 0) break

    // Pick a random spawn location
    const location = pickRandom(spawnLocations)
    if (!location) break

    const purchased = purchaseUnit(playerId, 'hero', location, state)
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
  const heroes = playerUnits.filter(u => u.type === 'hero')
  const hasCity = state.cities.some(c => c.owner === player.id)

  // Phase 1: Try to place a tile - prefer tiles further from cities or near heroes
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

  // Then handle heroes - they explore and reveal tiles
  for (const hero of heroes) {
    // First, move toward unexplored areas
    const validMoves = getValidMoves(hero, state)
    if (validMoves.length > 0) {
      const destination = pickBestMoveForHero(hero, validMoves, state)
      if (destination) {
        moveUnit(hero, destination, state)
        await delay(AI_ACTION_DELAY)
      }
    }

    // Then use reveal abilities after moving (to reveal new areas)
    while (getRemainingReveals(hero) > 0) {
      const explorableFromHero = getUnitExplorableHexes(hero, state)
      if (explorableFromHero.length === 0) break

      const targetHex = pickRandom(explorableFromHero)
      if (targetHex) {
        heroRevealTile(hero, targetHex, state)
        await delay(AI_ACTION_DELAY)
      } else {
        break
      }
    }
  }

  // Phase 3: Purchase units - AIs only buy heroes for now
  await tryPurchaseHeroes(player.id, state)

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

// Count unexplored hexes adjacent to a position
function countAdjacentUnexplored(coord: HexCoord, state: GameState): number {
  const neighbors = getNeighbors(coord)
  let count = 0
  for (const neighbor of neighbors) {
    const key = `${neighbor.q},${neighbor.r}`
    if (!state.tiles.has(key)) {
      count++
    }
  }
  return count
}

// Pick the best exploration move for a hero
function pickBestMoveForHero(
  hero: Unit,
  moves: HexCoord[],
  state: GameState
): HexCoord | undefined {
  if (moves.length === 0) return undefined

  // Score each move based on exploration potential
  const scored = moves.map(move => {
    // Primary: how many unexplored hexes are adjacent (more = better for reveals)
    const unexploredNeighbors = countAdjacentUnexplored(move, state)

    // Secondary: prefer moves further from the center (spread out exploration)
    const distFromCenter = hexDistance(move, { q: 0, r: 0 })

    // Tertiary: avoid moves that go back toward own city
    const playerCities = state.cities.filter(c => c.owner === hero.owner)
    let distFromOwnCity = Infinity
    for (const city of playerCities) {
      const dist = hexDistance(move, city.position)
      if (dist < distFromOwnCity) distFromOwnCity = dist
    }

    // Calculate score: prioritize unexplored neighbors, then distance from center
    let score = unexploredNeighbors * 10 + distFromCenter * 0.5

    // Bonus for being at the exploration frontier
    if (unexploredNeighbors > 0) {
      score += 20
    }

    // Small penalty for staying too close to own city (encourage exploration)
    if (distFromOwnCity < 3) {
      score -= 5
    }

    return { move, score }
  })

  // Sort by score descending
  scored.sort((a, b) => b.score - a.score)

  // Pick from top 3 candidates for variety
  const topCandidates = scored.slice(0, Math.min(3, scored.length))
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
