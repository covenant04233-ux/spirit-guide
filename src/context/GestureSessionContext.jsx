import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useReducer,
  useRef,
  useState,
} from 'react'

/** @typedef {'PRE_START' | 'WASHING' | 'SELECTING' | 'REVEALING'} RitualPhase */

const DECK_SIZE = 78

function makeIdentityOrder() {
  return Array.from({ length: DECK_SIZE }, (_, i) => i)
}

/** 随机打乱牌序 + 每张独立随机正/逆位（洗牌用） */
function shuffleDeckState() {
  const deckOrder = makeIdentityOrder()
  for (let i = DECK_SIZE - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[deckOrder[i], deckOrder[j]] = [deckOrder[j], deckOrder[i]]
  }
  const slotReversed = Array.from({ length: DECK_SIZE }, () => Math.random() < 0.5)
  return { deckOrder, slotReversed }
}

const initialState = {
  /** @type {RitualPhase} */
  phase: 'PRE_START',
  spread: 3,
  hoveredIndex: -1,
  selectedIndices: [],
  /** 弧上槽位 slot → 当前是哪张牌（0–77） */
  deckOrder: makeIdentityOrder(),
  /** 弧上槽位是否逆位（揭示时保持） */
  slotReversed: Array(DECK_SIZE).fill(false),
  washWaves: 0,
  washShakeToken: 0,
  cardsRevealed: false,
  revealAnimating: false,
}

function reducer(state, action) {
  switch (action.type) {
    case 'SET_SPREAD':
      return { ...state, spread: action.spread === 1 ? 1 : 3 }
    case 'BEGIN_RITUAL':
      return {
        ...state,
        ...shuffleDeckState(),
        phase: 'WASHING',
        selectedIndices: [],
        hoveredIndex: -1,
        washWaves: 0,
        cardsRevealed: false,
        revealAnimating: false,
      }
    case 'SET_HOVER':
      if (state.phase !== 'SELECTING') return state
      if (state.hoveredIndex === action.index) return state
      return { ...state, hoveredIndex: action.index }
    case 'WASH_SHAKE': {
      if (state.phase !== 'WASHING') return state
      const waves = state.washWaves + 1
      const done = waves >= 2
      return {
        ...state,
        ...shuffleDeckState(),
        washShakeToken: state.washShakeToken + 1,
        washWaves: done ? 0 : waves,
        phase: done ? 'SELECTING' : state.phase,
        hoveredIndex: done ? -1 : state.hoveredIndex,
      }
    }
    case 'SELECT_CARD': {
      if (state.phase !== 'SELECTING') return state
      const i = action.index
      if (i < 0 || state.selectedIndices.includes(i)) return state
      if (state.selectedIndices.length >= state.spread) return state
      const selectedIndices = [...state.selectedIndices, i]
      const full = selectedIndices.length >= state.spread
      return {
        ...state,
        selectedIndices,
        phase: full ? 'REVEALING' : state.phase,
        hoveredIndex: full ? -1 : state.hoveredIndex,
        cardsRevealed: full ? false : state.cardsRevealed,
        revealAnimating: full ? false : state.revealAnimating,
      }
    }
    case 'REVEAL_ANIMATION_STARTED': {
      if (state.phase !== 'REVEALING' || state.revealAnimating || state.cardsRevealed)
        return state
      return { ...state, revealAnimating: true }
    }
    case 'REVEAL_COMPLETE':
      return {
        ...state,
        revealAnimating: false,
        cardsRevealed: true,
      }
    case 'RESET_RITUAL':
      return {
        ...initialState,
        spread: state.spread,
        deckOrder: makeIdentityOrder(),
        slotReversed: Array(DECK_SIZE).fill(false),
      }
    default:
      return state
  }
}

const GestureSessionContext = createContext(null)

export function GestureSessionProvider({ children }) {
  const [state, dispatch] = useReducer(reducer, initialState)
  const revealProgressRef = useRef(0)
  const [userQuestion, setUserQuestion] = useState('')

  const beginRitual = useCallback(() => dispatch({ type: 'BEGIN_RITUAL' }), [])
  const setSpread = useCallback(
    (spread) => dispatch({ type: 'SET_SPREAD', spread }),
    [],
  )
  const resetRitual = useCallback(() => {
    setUserQuestion('')
    dispatch({ type: 'RESET_RITUAL' })
  }, [])

  const value = useMemo(
    () => ({
      phase: state.phase,
      spread: state.spread,
      hoveredIndex: state.hoveredIndex,
      selectedIndices: state.selectedIndices,
      deckOrder: state.deckOrder,
      slotReversed: state.slotReversed,
      washShakeToken: state.washShakeToken,
      cardsRevealed: state.cardsRevealed,
      revealAnimating: state.revealAnimating,
      revealProgressRef,
      userQuestion,
      setUserQuestion,
      dispatch,
      beginRitual,
      setSpread,
      resetRitual,
    }),
    [
      state.phase,
      state.spread,
      state.hoveredIndex,
      state.selectedIndices,
      state.deckOrder,
      state.slotReversed,
      state.washShakeToken,
      state.cardsRevealed,
      state.revealAnimating,
      userQuestion,
      dispatch,
      beginRitual,
      setSpread,
      resetRitual,
    ],
  )

  return (
    <GestureSessionContext.Provider value={value}>
      {children}
    </GestureSessionContext.Provider>
  )
}

export function useGestureSession() {
  const ctx = useContext(GestureSessionContext)
  if (!ctx) {
    throw new Error('useGestureSession must be used within GestureSessionProvider')
  }
  return ctx
}
