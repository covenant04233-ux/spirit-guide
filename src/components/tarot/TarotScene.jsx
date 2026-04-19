import { Suspense, useCallback, useEffect, useMemo, useRef } from 'react'
import * as THREE from 'three'
import { Canvas } from '@react-three/fiber'
import { Sparkles, Stars, useTexture } from '@react-three/drei'
import { SpiritFingertip } from '../hand/SpiritFingertip'
import { DeckWashFx } from './DeckWashFx'
import { GestureBridge } from './GestureBridge'
import { RevealHoldAndFlip } from './RevealHoldAndFlip'
import { SpreadRevealStrip } from './SpreadRevealStrip'
import { TarotDeckArc } from './TarotDeckArc'
import { RIDER_WAITE_IMAGE_URLS } from '../../data/riderWaiteDeck'

function SceneContent({ deckRef, registerSpreadFlipRef }) {
  const backTex = useTexture('/card-back.png')
  const rawFronts = useTexture(RIDER_WAITE_IMAGE_URLS)
  const fronts = useMemo(() => {
    const list = Array.isArray(rawFronts) ? rawFronts : [rawFronts]
    list.forEach((t) => {
      t.colorSpace = THREE.SRGBColorSpace
      t.anisotropy = 8
    })
    return list
  }, [rawFronts])

  useEffect(() => {
    backTex.colorSpace = THREE.SRGBColorSpace
    backTex.anisotropy = 8
  }, [backTex])

  return (
    <>
      <color attach="background" args={['#050505']} />
      <fog attach="fog" args={['#050505', 8, 28]} />

      <ambientLight intensity={0.25} color="#b8c4ff" />
      <directionalLight
        position={[4, 10, 6]}
        intensity={0.85}
        color="#e8e6ff"
        castShadow
        shadow-mapSize-width={1024}
        shadow-mapSize-height={1024}
      />
      <pointLight position={[-3, 4, 2]} intensity={0.4} color="#7c6cff" />
      <pointLight position={[2, 2, -4]} intensity={0.25} color="#a8f0ff" />

      <Stars
        radius={80}
        depth={50}
        count={5000}
        factor={3}
        saturation={0.12}
        fade
        speed={0.25}
      />
      <Sparkles
        count={120}
        scale={14}
        size={2.2}
        speed={0.35}
        opacity={0.35}
        color="#c4c8ff"
      />

      <TarotDeckArc ref={deckRef} backTexture={backTex} faceDown />
      <SpreadRevealStrip
        fronts={fronts}
        backTexture={backTex}
        registerSpreadFlipRef={registerSpreadFlipRef}
      />
      <DeckWashFx deckGroupRef={deckRef} />
      <GestureBridge deckGroupRef={deckRef} />

      <SpiritFingertip />

      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.02, 0]} receiveShadow>
        <circleGeometry args={[9, 64]} />
        <meshStandardMaterial
          color="#08060c"
          roughness={0.95}
          metalness={0.05}
          transparent
          opacity={0.92}
        />
      </mesh>
    </>
  )
}

export function TarotScene() {
  const deckRef = useRef(null)
  const spreadFlipRefs = useRef([])

  const registerSpreadFlipRef = useCallback((slot, el) => {
    spreadFlipRefs.current[slot] = el
  }, [])

  return (
    <Canvas
      shadows
      dpr={[1, 2]}
      camera={{ position: [0, 2.55, 10.4], fov: 40, near: 0.1, far: 120 }}
      gl={{ antialias: true, alpha: false }}
    >
      <Suspense fallback={null}>
        <SceneContent deckRef={deckRef} registerSpreadFlipRef={registerSpreadFlipRef} />
        <RevealHoldAndFlip spreadFlipRefs={spreadFlipRefs} />
      </Suspense>
    </Canvas>
  )
}
