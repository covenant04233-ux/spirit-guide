import { useEffect, useRef } from 'react'
import gsap from 'gsap'
import { useGestureSession } from '../../context/GestureSessionContext'

export function DeckWashFx({ deckGroupRef }) {
  const { washShakeToken } = useGestureSession()
  const prev = useRef(0)

  useEffect(() => {
    if (washShakeToken === prev.current) return
    prev.current = washShakeToken
    const g = deckGroupRef?.current
    if (!g) return

    gsap.killTweensOf(g.position)
    gsap.killTweensOf(g.rotation)

    const slide = 0.2 + Math.random() * 0.1
    const dir = Math.random() > 0.5 ? 1 : -1
    const twist = (0.05 + Math.random() * 0.03) * (Math.random() > 0.5 ? 1 : -1)

    const tl = gsap.timeline({
      onComplete: () => {
        g.position.set(0, 0, 0)
        g.rotation.set(0, 0, 0)
      },
    })
    tl.to(
      g.position,
      {
        x: slide * dir,
        duration: 0.1,
        yoyo: true,
        repeat: 5,
        ease: 'sine.inOut',
      },
      0,
    )
    tl.to(
      g.rotation,
      {
        z: twist,
        duration: 0.09,
        yoyo: true,
        repeat: 4,
        ease: 'sine.inOut',
      },
      0,
    )
  }, [washShakeToken, deckGroupRef])

  return null
}
