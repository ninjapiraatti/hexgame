import type { GameState, PlayerId } from '../types'
import { getRules } from '../rules/gameRules'

// Calculate gold income for a player
export function calculatePlayerIncome(playerId: PlayerId, state: GameState): number {
  const rules = getRules().economy
  let income = 0

  // Income from cities
  const playerCities = state.cities.filter(c => c.owner === playerId)
  income += playerCities.length * rules.cityGoldPerTurn

  // Future: Add income from buildings, trade routes, etc.

  return income
}

// Process income for a player (called at start of their turn)
export function processPlayerIncome(playerId: PlayerId, state: GameState): number {
  const income = calculatePlayerIncome(playerId, state)
  const player = state.players.find(p => p.id === playerId)

  if (player && income > 0) {
    player.gold += income
  }

  return income
}

// Get a breakdown of income sources for display
export interface IncomeBreakdown {
  cities: number
  buildings: number
  other: number
  total: number
}

export function getIncomeBreakdown(playerId: PlayerId, state: GameState): IncomeBreakdown {
  const rules = getRules().economy
  const playerCities = state.cities.filter(c => c.owner === playerId)

  const cities = playerCities.length * rules.cityGoldPerTurn
  const buildings = 0 // Future: calculate from buildings
  const other = 0 // Future: trade, bonuses, etc.

  return {
    cities,
    buildings,
    other,
    total: cities + buildings + other
  }
}
