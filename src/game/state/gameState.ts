import { reactive } from 'vue'
import type { GameState, Player, Tile, Unit, TerrainType, HexCoord } from '../types'
import { coordToKey } from '../utils/hex'

// Create initial player
function createPlayer(id: string, name: string, isAI: boolean = false): Player {
  return {
    id,
    name,
    gold: 0,
    resources: { gold: 0, wood: 0, stone: 0, fish: 0 },
    score: 0,
    isAI
  }
}

// Create a tile
export function createTile(q: number, r: number, type: TerrainType): Tile {
  return {
    id: crypto.randomUUID(),
    type,
    coord: { q, r }
  }
}

// Create a unit
export function createUnit(type: Unit['type'], owner: string, position: HexCoord): Unit {
  return {
    id: crypto.randomUUID(),
    type,
    owner,
    position: { ...position },
    hasMoved: false
  }
}

// Get random terrain type (land-weighted, water less common)
export function getRandomTerrain(): TerrainType {
  const roll = Math.random()
  if (roll < 0.3) return 'forest'
  if (roll < 0.55) return 'desert'
  if (roll < 0.8) return 'mountain'
  return 'water'
}

// Create initial game state - defaults to 1 human + 3 AI
export function createGameState(
  playerNames: string[] = ['Player'],
  aiCount: number = 3
): GameState {
  const players: Player[] = [
    ...playerNames.map((name, i) => createPlayer(`p${i}`, name, false)),
    ...Array.from({ length: aiCount }, (_, i) =>
      createPlayer(`ai${i}`, `AI ${i + 1}`, true)
    )
  ]

  // Start with a single forest tile at origin
  const startTile = createTile(0, 0, 'forest')
  const tiles = new Map<string, Tile>()
  tiles.set(coordToKey(startTile.coord), startTile)

  // Create a settler for each player at the starting tile
  const units: Unit[] = players.map(player =>
    createUnit('settler', player.id, { q: 0, r: 0 })
  )

  return reactive({
    phase: 'playing',
    turnPhase: 'placeTile',
    currentPlayerIndex: 0,
    players,
    tiles,
    units,
    cities: [],
    turnNumber: 1
  }) as GameState
}
