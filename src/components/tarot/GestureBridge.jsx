import { useRef } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import { Raycaster, Vector2 } from 'three'
import { useHandTracking } from '../../context/HandTrackingContext'
import { useGestureSession } from '../../context/GestureSessionContext'

const PINCH_SELECT_SEC = 1
const WASH_COOLDOWN = 0.75
const WASH_DELTA_THRESH = 0.038

export function GestureBridge({ deckGroupRef }) {
  const { trackingRef } = useHandTracking()
  const { phase, dispatch } = useGestureSession()
  const { camera } = useThree()
  const raycaster = useRef(new Raycaster()).current
  const ndc = useRef(new Vector2()).current

  const lastWristNx = useRef(null)
  const washCooldown = useRef(0)
  const lastHoverDispatched = useRef(-2)
  const pinchTargetCard = useRef(-1)
  const pinchHoldTime = useRef(0)
  const selectCooldown = useRef(0)

  useFrame((_, delta) => {
    washCooldown.current = Math.max(0, washCooldown.current - delta)
    selectCooldown.current = Math.max(0, selectCooldown.current - delta)

    const tr = trackingRef.current
    tr.pinchSelectProgress = 0

    if (phase === 'WASHING' && tr.visible) {
      const wx = tr.wristNx
      if (lastWristNx.current != null) {
        const dx = Math.abs(wx - lastWristNx.current)
        if (dx > WASH_DELTA_THRESH && washCooldown.current <= 0) {
          dispatch({ type: 'WASH_SHAKE' })
          washCooldown.current = WASH_COOLDOWN
        }
      }
      lastWristNx.current = wx
    } else {
      lastWristNx.current = null
    }

    if (phase !== 'SELECTING' || !deckGroupRef?.current || !tr.visible) {
      if (phase === 'SELECTING' && lastHoverDispatched.current !== -1) {
        lastHoverDispatched.current = -1
        dispatch({ type: 'SET_HOVER', index: -1 })
      }
      pinchTargetCard.current = -1
      pinchHoldTime.current = 0
      return
    }

    ndc.set(tr.ndcX, tr.ndcY)
    raycaster.setFromCamera(ndc, camera)
    const hits = raycaster.intersectObjects(deckGroupRef.current.children, true)
    let cardIndex = -1
    for (const h of hits) {
      const idx = h.object.userData?.cardIndex
      if (typeof idx === 'number') {
        cardIndex = idx
        break
      }
    }

    /** 仅捏合时高亮指向的牌，避免“悬停即亮”过于灵敏 */
    const hoverIndex = tr.pinch && cardIndex >= 0 ? cardIndex : -1
    if (hoverIndex !== lastHoverDispatched.current) {
      lastHoverDispatched.current = hoverIndex
      dispatch({ type: 'SET_HOVER', index: hoverIndex })
    }

    if (!tr.pinch || cardIndex < 0) {
      pinchTargetCard.current = -1
      pinchHoldTime.current = 0
      return
    }

    if (selectCooldown.current > 0) {
      pinchTargetCard.current = -1
      pinchHoldTime.current = 0
      return
    }

    if (pinchTargetCard.current !== cardIndex) {
      pinchTargetCard.current = cardIndex
      pinchHoldTime.current = 0
    }

    pinchHoldTime.current += delta
    tr.pinchSelectProgress = Math.min(1, pinchHoldTime.current / PINCH_SELECT_SEC)

    if (pinchHoldTime.current >= PINCH_SELECT_SEC) {
      dispatch({ type: 'SELECT_CARD', index: cardIndex })
      selectCooldown.current = 0.5
      pinchTargetCard.current = -1
      pinchHoldTime.current = 0
      tr.pinchSelectProgress = 0
    }
  })

  return null
}
