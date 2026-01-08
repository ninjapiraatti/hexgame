import type { GameState, Unit, City, HexCoord, Tile } from '../types'
import { coordToKey, getNeighbors, coordsEqual, hexDistance } from '../utils/hex'
import { createTile, getRandomTerrain } from '../state/gameState'
import { getRules } from '../rules/gameRules'

// Check if a terrain type is land (not water)
export function isLand(type: Tile['type']): boolean {
  return type !== 'water'
}

// Count land neighbors around a hex
export function countLandNeighbors(coord: HexCoord, tiles: Map<string, Tile>): number {
  const neighbors = getNeighbors(coord)
  let count = 0
  for (const neighbor of neighbors) {
    const tile = tiles.get(coordToKey(neighbor))
    if (tile && isLand(tile.type)) {
      count++
    }
  }
  return count
}

// Check if a hex already has a city
export function hasCityAt(coord: HexCoord, state: GameState): boolean {
  return state.cities.some(c => c.position.q === coord.q && c.position.r === coord.r)
}

// Get distance to nearest city (returns Infinity if no cities exist)
export function distanceToNearestCity(coord: HexCoord, state: GameState): number {
  if (state.cities.length === 0) return Infinity
  return Math.min(...state.cities.map(c => hexDistance(coord, c.position)))
}

// Check if a settler can found a city at their current position
export function canFoundCity(unit: Unit, state: GameState): boolean {
  const rules = getRules().city

  if (unit.type !== 'settler') return false

  // Check if player has reached max cities
  if (rules.maxCitiesPerPlayer > 0) {
    const playerCityCount = state.cities.filter(c => c.owner === unit.owner).length
    if (playerCityCount >= rules.maxCitiesPerPlayer) return false
  }

  // Check if standing on land
  const tile = state.tiles.get(coordToKey(unit.position))
  if (!tile || !isLand(tile.type)) return false

  // Check if there's already a city here
  if (hasCityAt(unit.position, state)) return false

  // Check minimum distance from other cities
  if (rules.minDistanceFromCity > 0) {
    const nearest = distanceToNearestCity(unit.position, state)
    if (nearest < rules.minDistanceFromCity) return false
  }

  // Check if there are enough land neighbors
  const landNeighbors = countLandNeighbors(unit.position, state.tiles)
  return landNeighbors >= rules.minLandNeighbors
}

// Found a city with a settler (consumes the settler)
export function foundCity(unit: Unit, state: GameState): City | null {
  if (!canFoundCity(unit, state)) return null

  const player = state.players.find(p => p.id === unit.owner)
  const cityName = player ? `${player.name}'s City` : 'City'

  const city: City = {
    id: crypto.randomUUID(),
    owner: unit.owner,
    position: { ...unit.position },
    name: cityName
  }

  // Add city and remove settler
  state.cities.push(city)
  const unitIndex = state.units.findIndex(u => u.id === unit.id)
  if (unitIndex !== -1) {
    state.units.splice(unitIndex, 1)
  }

  return city
}

// Get unexplored hexes adjacent to player's units
export function getExplorableHexes(playerId: string, state: GameState): HexCoord[] {
  const playerUnits = state.units.filter(u => u.owner === playerId)
  const explorable: HexCoord[] = []
  const seen = new Set<string>()

  for (const unit of playerUnits) {
    for (const neighbor of getNeighbors(unit.position)) {
      const key = coordToKey(neighbor)
      if (!state.tiles.has(key) && !seen.has(key)) {
        seen.add(key)
        explorable.push(neighbor)
      }
    }
  }

  return explorable
}

// Place a new tile at a position
export function placeTile(coord: HexCoord, state: GameState): Tile | null {
  const key = coordToKey(coord)
  if (state.tiles.has(key)) return null

  const tile = createTile(coord.q, coord.r, getRandomTerrain())
  state.tiles.set(key, tile)
  return tile
}

// Get valid movement destinations for a unit
export function getValidMoves(unit: Unit, state: GameState): HexCoord[] {
  if (unit.hasMoved) return []

  const neighbors = getNeighbors(unit.position)
  return neighbors.filter(coord => {
    const tile = state.tiles.get(coordToKey(coord))
    // Can only move to explored land tiles
    return tile && isLand(tile.type)
  })
}

// Move a unit to a new position
export function moveUnit(unit: Unit, destination: HexCoord, state: GameState): boolean {
  const validMoves = getValidMoves(unit, state)
  const isValid = validMoves.some(m => coordsEqual(m, destination))

  if (!isValid) return false

  unit.position = { ...destination }
  unit.hasMoved = true
  return true
}

// Reset all units' movement at start of turn
export function resetUnitMovement(playerId: string, state: GameState): void {
  for (const unit of state.units) {
    if (unit.owner === playerId) {
      unit.hasMoved = false
    }
  }
}
