import { ref, computed, watch, nextTick } from 'vue'
import type { GameState, HexCoord, Unit } from '@/game/types'
import { createGameState } from '@/game/state/gameState'
import { getCurrentPlayer, endTurn, onTilePlaced, skipTilePlacement } from '@/game/systems/turnManager'
import {
  getExplorableHexes,
  placeTile,
  getValidMoves,
  moveUnit,
  canFoundCity,
  foundCity
} from '@/game/systems/actions'
import { checkAndRunAI } from '@/game/systems/ai'

export function useGame() {
  const state = ref<GameState>(createGameState())
  const selectedUnit = ref<Unit | null>(null)
  const isProcessing = ref(false)

  const currentPlayer = computed(() => getCurrentPlayer(state.value))
  const isPlayerTurn = computed(() => !currentPlayer.value.isAI)

  // Only show explorable hexes for human player during their turn
  const humanPlayer = computed(() => state.value.players.find(p => !p.isAI))
  const explorableHexes = computed(() => {
    if (!isPlayerTurn.value || !humanPlayer.value) return []
    return getExplorableHexes(humanPlayer.value.id, state.value)
  })

  const canPlaceTile = computed(() =>
    isPlayerTurn.value &&
    state.value.turnPhase === 'placeTile' &&
    explorableHexes.value.length > 0
  )

  const selectedUnitMoves = computed(() => {
    if (!selectedUnit.value) return []
    return getValidMoves(selectedUnit.value, state.value)
  })

  const canSelectedUnitFoundCity = computed(() => {
    if (!selectedUnit.value) return false
    return canFoundCity(selectedUnit.value, state.value)
  })

  // Watch for AI turns
  watch(
    () => state.value.currentPlayerIndex,
    () => {
      if (!isProcessing.value) {
        runAIIfNeeded()
      }
    },
    { immediate: true }
  )

  async function runAIIfNeeded() {
    // Keep running while current player is AI
    while (getCurrentPlayer(state.value).isAI && state.value.phase === 'playing') {
      isProcessing.value = true
      await nextTick() // Let Vue update the UI
      const wasAI = await checkAndRunAI(state.value)
      if (!wasAI) break
      await nextTick() // Let Vue update after AI turn
    }
    isProcessing.value = false
  }

  function handleHexClick(coord: HexCoord) {
    if (!isPlayerTurn.value || isProcessing.value) return

    const key = `${coord.q},${coord.r}`
    const existingTile = state.value.tiles.get(key)

    // If clicking unexplored hex during tile placement phase
    if (!existingTile && canPlaceTile.value) {
      const isExplorable = explorableHexes.value.some(
        h => h.q === coord.q && h.r === coord.r
      )
      if (isExplorable) {
        placeTile(coord, state.value)
        onTilePlaced(state.value)
        return
      }
    }

    // If clicking a tile with our unit, select it
    if (existingTile && state.value.turnPhase === 'actions' && humanPlayer.value) {
      const unitOnTile = state.value.units.find(
        u => u.owner === humanPlayer.value!.id &&
          u.position.q === coord.q &&
          u.position.r === coord.r
      )
      if (unitOnTile) {
        selectedUnit.value = unitOnTile
        return
      }

      // If we have a selected unit, try to move there
      if (selectedUnit.value) {
        const canMove = selectedUnitMoves.value.some(
          m => m.q === coord.q && m.r === coord.r
        )
        if (canMove) {
          moveUnit(selectedUnit.value, coord, state.value)
          selectedUnit.value = null
        }
      }
    }
  }

  function handleFoundCity() {
    if (!selectedUnit.value || !canSelectedUnitFoundCity.value) return
    foundCity(selectedUnit.value, state.value)
    selectedUnit.value = null
  }

  function handleEndTurn() {
    if (!isPlayerTurn.value || isProcessing.value) return
    selectedUnit.value = null
    endTurn(state.value)
    runAIIfNeeded()
  }

  function handleSkipPlacement() {
    if (!isPlayerTurn.value || isProcessing.value) return
    skipTilePlacement(state.value)
  }

  function newGame() {
    state.value = createGameState()
    selectedUnit.value = null
    isProcessing.value = false
    runAIIfNeeded()
  }

  return {
    state,
    selectedUnit,
    isProcessing,
    currentPlayer,
    isPlayerTurn,
    explorableHexes,
    canPlaceTile,
    selectedUnitMoves,
    canSelectedUnitFoundCity,
    handleHexClick,
    handleFoundCity,
    handleEndTurn,
    handleSkipPlacement,
    newGame
  }
}
