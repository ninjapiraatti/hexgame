import { ref, computed, watch, nextTick } from 'vue'
import type { GameState, HexCoord, Unit, UnitType } from '@/game/types'
import { createGameState, type PlayerSetup } from '@/game/state/gameState'
import { getCurrentPlayer, endTurn, onTilePlaced, skipTilePlacement } from '@/game/systems/turnManager'
import {
  getExplorableHexes,
  placeTile,
  getValidMoves,
  moveUnit,
  canFoundCity,
  foundCity,
  getUnitExplorableHexes,
  heroRevealTile,
  getRemainingReveals
} from '@/game/systems/actions'
import { checkAndRunAI } from '@/game/systems/ai'
import { purchaseUnit, getValidSpawnLocations } from '@/game/systems/purchase'

// Create a minimal state for the setup phase
function createSetupState(): GameState {
  return {
    phase: 'setup',
    turnPhase: 'placeTile',
    currentPlayerIndex: 0,
    players: [],
    tiles: new Map(),
    units: [],
    cities: [],
    turnNumber: 0
  }
}

export function useGame() {
  const state = ref<GameState>(createSetupState())
  const selectedUnit = ref<Unit | null>(null)
  const isProcessing = ref(false)

  const currentPlayer = computed(() => {
    if (state.value.players.length === 0) return null
    return getCurrentPlayer(state.value)
  })
  const isPlayerTurn = computed(() => currentPlayer.value ? !currentPlayer.value.isAI : false)

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

  // Hero reveal functionality
  const selectedHeroRevealableHexes = computed(() => {
    if (!selectedUnit.value || selectedUnit.value.type !== 'hero') return []
    if (getRemainingReveals(selectedUnit.value) <= 0) return []
    return getUnitExplorableHexes(selectedUnit.value, state.value)
  })

  const selectedHeroRemainingReveals = computed(() => {
    if (!selectedUnit.value || selectedUnit.value.type !== 'hero') return 0
    return getRemainingReveals(selectedUnit.value)
  })

  const validSpawnLocations = computed(() => {
    if (!isPlayerTurn.value || !humanPlayer.value) return []
    return getValidSpawnLocations(humanPlayer.value.id, state.value)
  })

  const canPurchaseUnits = computed(() => {
    return isPlayerTurn.value && 
           state.value.turnPhase === 'actions' && 
           validSpawnLocations.value.length > 0
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

    // If clicking unexplored hex during action phase with a hero selected, try to reveal
    if (!existingTile && state.value.turnPhase === 'actions' && selectedUnit.value) {
      const canReveal = selectedHeroRevealableHexes.value.some(
        h => h.q === coord.q && h.r === coord.r
      )
      if (canReveal) {
        heroRevealTile(selectedUnit.value, coord, state.value)
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

  function handlePurchaseUnit(unitType: UnitType, location: HexCoord) {
    if (!isPlayerTurn.value || isProcessing.value || !humanPlayer.value) return
    purchaseUnit(humanPlayer.value.id, unitType, location, state.value)
  }

  function startGame(playerSetup: PlayerSetup[]) {
    state.value = createGameState(playerSetup)
    selectedUnit.value = null
    isProcessing.value = false
    runAIIfNeeded()
  }

  function newGame() {
    // Reset to setup phase
    state.value = createSetupState()
    selectedUnit.value = null
    isProcessing.value = false
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
    selectedHeroRevealableHexes,
    selectedHeroRemainingReveals,
    validSpawnLocations,
    canPurchaseUnits,
    handleHexClick,
    handleFoundCity,
    handleEndTurn,
    handleSkipPlacement,
    handlePurchaseUnit,
    startGame,
    newGame
  }
}
