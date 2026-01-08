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

export interface GameRules {
  city: CityRules
}

// Default rules
export const DEFAULT_RULES: GameRules = {
  city: {
    minLandNeighbors: 3,
    minDistanceFromCity: 2,
    maxCitiesPerPlayer: 1
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
    }
  }
}

export function resetRules(): void {
  activeRules = { ...DEFAULT_RULES }
}
