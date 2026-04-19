import { useEffect, useMemo, useRef } from 'react'
import gsap from 'gsap'
import { useGestureSession } from '../../context/GestureSessionContext'
import { TarotCardMesh } from './TarotCardMesh'
import { DECK_ELEVATION_Y } from './sceneLayout'

const GAP = 0.68
const STRIP_Z = 6.15
const STRIP_Y = DECK_ELEVATION_Y + 1.42

/** 选牌结束后：在牌弧上方横向排列，牌背朝前；翻牌由 RevealHoldAndFlip 驱动 spreadFlipRefs */
export function SpreadRevealStrip({
  fronts,
  backTexture,
  registerSpreadFlipRef,
}) {
  const {
    phase,
    selectedIndices,
    deckOrder,
    slotReversed,
    cardsRevealed,
    revealAnimating,
    revealProgressRef,
  } = useGestureSession()

  const groupRef = useRef(null)
  const entryDone = useRef(false)

  const n = selectedIndices.length
  const layout = useMemo(() => {
    if (n === 0) return []
    const total = (n - 1) * GAP
    const startX = -total / 2
    return selectedIndices.map((slot, i) => ({
      slot,
      stripIdx: i,
      position: [startX + i * GAP, 0, 0],
    }))
  }, [selectedIndices, n])

  useEffect(() => {
    if (phase !== 'REVEALING' || entryDone.current || !groupRef.current) return
    entryDone.current = true
    const g = groupRef.current
    gsap.fromTo(
      g.position,
      { y: STRIP_Y - 0.55 },
      { y: STRIP_Y, duration: 0.65, ease: 'power2.out' },
    )
  }, [phase])

  useEffect(() => {
    if (phase === 'PRE_START' || phase === 'WASHING' || phase === 'SELECTING') {
      entryDone.current = false
    }
  }, [phase])

  if (phase !== 'REVEALING' || n === 0) return null

  const showRing =
    !cardsRevealed && !revealAnimating

  return (
    <group ref={groupRef} position={[0, STRIP_Y, STRIP_Z]}>
      {layout.map(({ slot, stripIdx, position }) => {
        const deckId = deckOrder[slot]
        const rz = slotReversed[slot] ? Math.PI : 0
        return (
        <TarotCardMesh
          key={`spread-${slot}-${stripIdx}`}
          cardIndex={slot}
          frontTexture={fronts[deckId]}
          backTexture={backTexture}
          position={position}
          rotation={[0, 0, rz]}
          faceDown
          isHovered={false}
          isSelected={false}
          setFlipGroupRef={(el) => registerSpreadFlipRef?.(stripIdx, el)}
          showRevealRing={showRing}
          revealProgressRef={revealProgressRef}
        />
        )
      })}
    </group>
  )
}
