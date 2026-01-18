# HexGame - Turn-Based Strategy

## Project Overview

A turn-based hex tile strategy game inspired by Civilization, played on a dynamically expanding board. Players explore by placing tiles, build a city, manage resources, and compete for the highest score.

## Tech Stack

- **Vue 3** with Composition API. Use `<script setup lang="ts">` and place template before script.
- **TypeScript** for type safety
- **No external graphics** - use CSS shapes, Unicode symbols, and emojis for all visuals

## Game Rules

### Setup

- Game starts with a single hex tile at the center
- All players begin on this starting tile with one **Settler** unit

### Turn Structure

1. **Tile Placement** (optional): If any of the player's units are adjacent to an unexplored hex, the player may draw a random tile and place it there
2. **Unit Actions**: Move units, found cities, engage in combat

### Tiles / Terrain Types

| Terrain  | Symbol | Resource |
| -------- | ------ | -------- |
| Forest   | 🌲     | Wood     |
| Desert   | 🏜️     | Manna    |
| Mountain | ⛰️     | Metal    |
| Water    | 🌊     | Fish     |

_Tile distribution ratios TBD. More terrain types may be added._

### Units

- **Settler**: Can found a city (consumed in the process). When a city is founded, a free Hero spawns at the city location.
- **Hero**: Powerful exploration unit. Can move up to 2 hexes per turn and reveal up to 2 adjacent unexplored hexes per turn. Cost: 2500 gold.

Each player can have **one city maximum** (for now).

### Resources

- **Gold**: Universal currency
- **Biome resources**: Each terrain type produces its own resource

_Economy details TBD._

### Combat

Simple dice-based resolution:

1. Each unit in combat rolls one six-sided die
2. Compare totals (if multiple units involved)
3. Lower total loses (tie resolution TBD)

### Win Condition

**Score-based** - highest score wins. Scoring criteria TBD (territory, resources, cities, etc.)

### Game Modes

- Local hot-seat (multiple players, same device)
- vs AI

No online multiplayer.

## Architecture Guidelines

### Extensibility First

The game will grow in complexity. Design with these future additions in mind:

- Multiple tile types with different properties
- Various unit types with unique abilities
- Tokens and markers
- Possibly cards
- More complex economy and resource management

### Recommended Patterns

- **Factory pattern** for creating tiles, units, tokens
- **Component-based units** if abilities become complex
- **State machine** for game phases and turn management
- **Clear separation** between game logic and Vue rendering

### Data Structures

```typescript
// Examples - refine during implementation

interface HexCoord {
  q: number; // axial coordinates
  r: number;
}

interface Tile {
  id: string;
  type: TerrainType;
  coord: HexCoord;
}

interface Unit {
  id: string;
  type: UnitType;
  owner: PlayerId;
  position: HexCoord;
}

interface Player {
  id: PlayerId;
  name: string;
  gold: number;
  resources: Map<ResourceType, number>;
  score: number;
}
```

### File Structure (suggested)

```
src/
  components/       # Vue components
    board/          # Hex grid, tiles
    ui/             # HUD, menus, player info
  composables/      # Vue composables for shared logic
  game/             # Core game logic (framework-agnostic)
    types/          # TypeScript interfaces and types
    entities/       # Tile, Unit, Player classes/factories
    systems/        # Combat, movement, economy
    state/          # Game state management
  utils/            # Hex math, dice rolling, etc.
```

## Visual Style

- Hex tiles rendered with CSS (borders, backgrounds)
- Emojis for terrain indicators
- Simple geometric shapes for units (circles, squares)
- Text labels where needed
- Color coding for player ownership

## Development Notes

- Keep it lightweight - this is a prototype
- Prioritize playability over polish
- Document design decisions as the game evolves
