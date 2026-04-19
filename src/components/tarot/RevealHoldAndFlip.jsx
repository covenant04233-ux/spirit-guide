import { useCallback, useEffect, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import gsap from 'gsap'
import { useHandTracking } from '../../context/HandTrackingContext'
import { useGestureSession } from '../../context/GestureSessionContext'

const HOLD_SEC = 1
const STAGGER = 0.2
const FLIP_DUR = 0.58

export function RevealHoldAndFlip({ spreadFlipRefs }) {
  const { trackingRef } = useHandTracking()
  const {
    phase,
    selectedIndices,
    cardsRevealed,
    revealAnimating,
    dispatch,
    revealProgressRef,
  } = useGestureSession()

  const holdTime = useRef(0)
  const flipStarted = useRef(false)

  const resetAllFlips = useCallback(() => {
    const arr = spreadFlipRefs.current
    if (!arr) return
    for (let i = 0; i < arr.length; i += 1) {
      const g = arr[i]
      if (g) {
        gsap.killTweensOf(g.rotation)
        g.rotation.y = 0
      }
    }
  }, [spreadFlipRefs])

  useEffect(() => {
    if (phase === 'PRE_START') {
      resetAllFlips()
      flipStarted.current = false
      holdTime.current = 0
    }
  }, [phase, resetAllFlips])

  useFrame((_, delta) => {
    if (!revealProgressRef) return

    if (
      phase !== 'REVEALING' ||
      cardsRevealed ||
      revealAnimating ||
      !selectedIndices?.length
    ) {
      revealProgressRef.current = 0
      holdTime.current = 0
      return
    }

    const tr = trackingRef.current
    if (tr.visible && tr.palmGathered) {
      holdTime.current += delta
      revealProgressRef.current = Math.min(1, holdTime.current / HOLD_SEC)
      if (holdTime.current >= HOLD_SEC && !flipStarted.current) {
        flipStarted.current = true
        holdTime.current = 0
        revealProgressRef.current = 0
        dispatch({ type: 'REVEAL_ANIMATION_STARTED' })

        /** Preserve selection order (e.g. past → present → future), not arc index. */
        const order = [...selectedIndices]
        let completed = 0
        const onOneDone = () => {
          completed += 1
          if (completed >= order.length) {
            dispatch({ type: 'REVEAL_COMPLETE' })
            flipStarted.current = false
          }
        }

        order.forEach((_, i) => {
          const g = spreadFlipRefs.current?.[i]
          const endT = i * STAGGER + FLIP_DUR
          if (!g) {
            gsap.delayedCall(endT, onOneDone)
            return
          }
          gsap.killTweensOf(g.rotation)
          gsap.to(g.rotation, {
            y: Math.PI,
            duration: FLIP_DUR,
            delay: i * STAGGER,
            ease: 'power2.inOut',
            onComplete: onOneDone,
          })
        })
      }
    } else {
      holdTime.current = 0
      revealProgressRef.current = 0
    }
  })

  return null
}
