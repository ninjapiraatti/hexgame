// Game rules configuration
// All configurable game rules live here for easy tweaking

import type { UnitType } from '../types'

export interface CityRules {
  // Minimum number of land tiles adjacent to founding location
  minLandNeighbors: number
  // Minimum distance (in hexes) from any other city
  minDistanceFromCity: number
  // Maximum cities per player (0 = unlimited)
  maxCitiesPerPlayer: number
}

export interface EconomyRules {
  // Base gold produced by each city per turn
  cityGoldPerTurn: number
  // Starting gold for new players
  startingGold: number
}

export interface UnitCost {
  gold: number
}

export interface PurchaseRules {
  // Cost of each unit type
  unitCosts: Record<UnitType, UnitCost>
}

export interface CombatRules {
  // Turns a unit must stay adjacent to city to capture it
  siegeTurnsToCapture: number
}

export interface HeroRules {
  // Maximum hexes a hero can move per turn
  movementRange: number
  // Maximum tiles a hero can reveal per turn
  maxRevealsPerTurn: number
}

export interface AIRules {
  // Minimum number of heroes before moving toward enemy cities
  minHeroesForAttack: number
}

export interface GameRules {
  city: CityRules
  economy: EconomyRules
  purchase: PurchaseRules
  combat: CombatRules
  hero: HeroRules
  ai: AIRules
}

// Default rules
export const DEFAULT_RULES: GameRules = {
  city: {
    minLandNeighbors: 3,
    minDistanceFromCity: 3,
    maxCitiesPerPlayer: 1
  },
  economy: {
    cityGoldPerTurn: 100,
    startingGold: 0
  },
  purchase: {
    unitCosts: {
      settler: { gold: 500 },
      hero: { gold: 2500 }
    }
  },
  combat: {
    siegeTurnsToCapture: 5
  },
  hero: {
    movementRange: 2,
    maxRevealsPerTurn: 2
  },
  ai: {
    minHeroesForAttack: 2
  }
}

// Active rules (can be modified for different game modes)
let activeRules: GameRules = { ...DEFAULT_RULES }

export function getRules(): GameRules {
  return activeRules
}

export function setRules(rules: Partial<GameRules>): void {
  activeRules = {
    ...activeRules,
    ...rules,
    city: {
      ...activeRules.city,
      ...rules.city
    },
    economy: {
      ...activeRules.economy,
      ...rules.economy
    },
    hero: {
      ...activeRules.hero,
      ...rules.hero
    },
    ai: {
      ...activeRules.ai,
      ...rules.ai
    }
  }
}

export function resetRules(): void {
  activeRules = { ...DEFAULT_RULES }
}
