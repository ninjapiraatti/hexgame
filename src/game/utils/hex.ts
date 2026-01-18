import type { HexCoord } from '../types'

// Convert axial coordinates to a string key for Map storage
export function coordToKey(coord: HexCoord): string {
  return `${coord.q},${coord.r}`
}

// Parse a string key back to coordinates
export function keyToCoord(key: string): HexCoord {
  const [q, r] = key.split(',').map(Number)
  return { q, r }
}

// Get the 6 neighboring hex coordinates
export function getNeighbors(coord: HexCoord): HexCoord[] {
  const directions: HexCoord[] = [
    { q: 1, r: 0 },
    { q: 1, r: -1 },
    { q: 0, r: -1 },
    { q: -1, r: 0 },
    { q: -1, r: 1 },
    { q: 0, r: 1 }
  ]
  return directions.map(dir => ({
    q: coord.q + dir.q,
    r: coord.r + dir.r
  }))
}

// Check if two coordinates are equal
export function coordsEqual(a: HexCoord, b: HexCoord): boolean {
  return a.q === b.q && a.r === b.r
}

// Calculate distance between two hexes
export function hexDistance(a: HexCoord, b: HexCoord): number {
  return (Math.abs(a.q - b.q) + Math.abs(a.q + a.r - b.q - b.r) + Math.abs(a.r - b.r)) / 2
}

// Convert axial to cube coordinates (for some calculations)
export function axialToCube(coord: HexCoord): { x: number; y: number; z: number } {
  return {
    x: coord.q,
    z: coord.r,
    y: -coord.q - coord.r
  }
}

// Convert axial coordinates to pixel position (pointy-top hexes)
export function axialToPixel(coord: HexCoord, size: number): { x: number; y: number } {
  const x = size * (Math.sqrt(3) * coord.q + (Math.sqrt(3) / 2) * coord.r)
  const y = size * ((3 / 2) * coord.r)
  return { x, y }
}

// Get all hexes within a given range from a center coordinate
export function getHexesInRange(center: HexCoord, range: number): HexCoord[] {
  const results: HexCoord[] = []
  for (let q = -range; q <= range; q++) {
    for (let r = Math.max(-range, -q - range); r <= Math.min(range, -q + range); r++) {
      if (q === 0 && r === 0) continue // Skip the center
      results.push({ q: center.q + q, r: center.r + r })
    }
  }
  return results
}
