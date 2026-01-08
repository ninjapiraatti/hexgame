// Game rules configuration
// All configurable game rules live here for easy tweaking

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

export interface GameRules {
  city: CityRules
  economy: EconomyRules
}

// Default rules
export const DEFAULT_RULES: GameRules = {
  city: {
    minLandNeighbors: 3,
    minDistanceFromCity: 6,
    maxCitiesPerPlayer: 1
  },
  economy: {
    cityGoldPerTurn: 100,
    startingGold: 0
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
    }
  }
}

export function resetRules(): void {
  activeRules = { ...DEFAULT_RULES }
}
