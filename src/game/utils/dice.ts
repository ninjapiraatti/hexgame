// Roll a single six-sided die
export function rollD6(): number {
  return Math.floor(Math.random() * 6) + 1
}

// Roll multiple dice and return array of results
export function rollDice(count: number): number[] {
  return Array.from({ length: count }, () => rollD6())
}

// Roll multiple dice and return the sum
export function rollDiceSum(count: number): number {
  return rollDice(count).reduce((sum, val) => sum + val, 0)
}
