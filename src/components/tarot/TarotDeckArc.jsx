import { forwardRef, useMemo } from 'react'
import { useGestureSession } from '../../context/GestureSessionContext'
import { TarotCardMesh } from './TarotCardMesh'
import { DECK_ELEVATION_Y } from './sceneLayout'

const CARD_COUNT = 78
const RADIUS = 5.2
const Y_BASE = 0.05

function arcAngle(t) {
  return Math.PI * (1 - t)
}

export const TarotDeckArc = forwardRef(function TarotDeckArc(
  { faceDown = true, backTexture },
  ref,
) {
  const { hoveredIndex, selectedIndices, phase, revealProgressRef, slotReversed } =
    useGestureSession()

  const instances = useMemo(() => {
    const list = []
    const n = CARD_COUNT
    for (let i = 0; i < n; i++) {
      const t = n === 1 ? 0.5 : i / (n - 1)
      const theta = arcAngle(t)
      const x = RADIUS * Math.cos(theta)
      const z = RADIUS * Math.sin(theta)
      const tiltX = -0.12 * Math.sin(theta)
      const rotY = theta + Math.PI / 2
      const rev = slotReversed[i] ? Math.PI : 0
      list.push({
        key: i,
        position: [x, Y_BASE + i * 0.0008, z],
        rotation: [tiltX, rotY, rev],
      })
    }
    return list
  }, [slotReversed])

  /** 揭示阶段：已选牌改在 SpreadRevealStrip 展示，弧上隐藏避免重复 */
  const hideInArc = (key) =>
    phase === 'REVEALING' && selectedIndices.includes(key)

  return (
    <group position={[0, DECK_ELEVATION_Y, 0]}>
      <group ref={ref}>
        {instances.map(({ key, position, rotation }) => (
          <TarotCardMesh
            key={key}
            cardIndex={key}
            frontTexture={backTexture}
            backTexture={backTexture}
            backsOnly
            position={position}
            rotation={rotation}
            faceDown={faceDown}
            isHovered={hoveredIndex === key}
            isSelected={selectedIndices.includes(key)}
            showRevealRing={false}
            revealProgressRef={revealProgressRef}
            visible={!hideInArc(key)}
          />
        ))}
      </group>
    </group>
  )
})
