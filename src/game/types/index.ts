// Hex coordinate system (axial coordinates)
export interface HexCoord {
  q: number
  r: number
}

// Terrain types
export type TerrainType = 'forest' | 'desert' | 'mountain' | 'water'

// Resource types
export type ResourceType = 'gold' | 'wood' | 'stone' | 'fish'

// Unit types
export type UnitType = 'settler'

// Player identification
export type PlayerId = string

// Tile definition
export interface Tile {
  id: string
  type: TerrainType
  coord: HexCoord
}

// Unit definition
export interface Unit {
  id: string
  type: UnitType
  owner: PlayerId
  position: HexCoord
  hasMoved: boolean
}

// City definition
export interface City {
  id: string
  owner: PlayerId
  position: HexCoord
  name: string
}

// Player state
export interface Player {
  id: PlayerId
  name: string
  gold: number
  resources: Record<ResourceType, number>
  score: number
  isAI: boolean
}

// Game phase
export type GamePhase = 'setup' | 'playing' | 'ended'

// Turn phase
export type TurnPhase = 'placeTile' | 'actions'

// Full game state
export interface GameState {
  phase: GamePhase
  turnPhase: TurnPhase
  currentPlayerIndex: number
  players: Player[]
  tiles: Map<string, Tile>
  units: Unit[]
  cities: City[]
  turnNumber: number
}
