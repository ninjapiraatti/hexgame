import type { GameState, UnitType, PlayerId, HexCoord, Unit } from '../types'
import { createUnit } from '../state/gameState'
import { getRules } from '../rules/gameRules'
import { coordToKey, getNeighbors } from '../utils/hex'

// Check if a player can afford a unit
export function canAffordUnit(playerId: PlayerId, unitType: UnitType, state: GameState): boolean {
  const player = state.players.find(p => p.id === playerId)
  if (!player) return false

  const cost = getRules().purchase.unitCosts[unitType].gold
  return player.gold >= cost
}

// Get valid spawn locations for a player (adjacent to their cities)
export function getValidSpawnLocations(playerId: PlayerId, state: GameState): HexCoord[] {
  const playerCities = state.cities.filter(c => c.owner === playerId)
  const validLocations: HexCoord[] = []
  const seen = new Set<string>()

  for (const city of playerCities) {
    const neighbors = getNeighbors(city.position)
    for (const neighbor of neighbors) {
      const key = coordToKey(neighbor)
      
      // Skip if already checked
      if (seen.has(key)) continue
      seen.add(key)

      // Must be an explored land tile
      const tile = state.tiles.get(key)
      if (!tile || tile.type === 'water') continue

      // Must not have a city
      const hasCity = state.cities.some(c => 
        c.position.q === neighbor.q && c.position.r === neighbor.r
      )
      if (hasCity) continue

      validLocations.push(neighbor)
    }
  }

  return validLocations
}

// Purchase a unit and spawn it at a location
export function purchaseUnit(
  playerId: PlayerId,
  unitType: UnitType,
  spawnLocation: HexCoord,
  state: GameState
): Unit | null {
  // Verify player can afford it
  if (!canAffordUnit(playerId, unitType, state)) return null

  // Verify spawn location is valid
  const validLocations = getValidSpawnLocations(playerId, state)
  const isValidLocation = validLocations.some(
    loc => loc.q === spawnLocation.q && loc.r === spawnLocation.r
  )
  if (!isValidLocation) return null

  // Deduct cost
  const player = state.players.find(p => p.id === playerId)
  if (!player) return null

  const cost = getRules().purchase.unitCosts[unitType].gold
  player.gold -= cost

  // Create and spawn unit
  const unit = createUnit(unitType, playerId, spawnLocation)
  unit.hasMoved = true // Cannot move on the turn it's purchased
  state.units.push(unit)

  return unit
}

// Get the cost of a unit type
export function getUnitCost(unitType: UnitType): number {
  return getRules().purchase.unitCosts[unitType].gold
}
