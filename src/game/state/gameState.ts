import { reactive } from 'vue'
import type { GameState, Player, Tile, TerrainType } from '../types'
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

// Get random terrain type
export function getRandomTerrain(): TerrainType {
  const terrains: TerrainType[] = ['forest', 'desert', 'mountain', 'water']
  return terrains[Math.floor(Math.random() * terrains.length)]
}

// Create initial game state
export function createGameState(playerNames: string[], aiCount: number = 0): GameState {
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

  return reactive({
    phase: 'setup',
    turnPhase: 'placeTile',
    currentPlayerIndex: 0,
    players,
    tiles,
    units: [],
    cities: [],
    turnNumber: 1
  }) as GameState
}
