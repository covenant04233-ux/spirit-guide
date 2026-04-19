import { forwardRef, useMemo } from 'react'
import * as THREE from 'three'
import { RevealRing } from './RevealRing'

const W = 0.55
const H = 0.95
const D = 0.018

const GOLD = '#c9a85c'
const SILVER = '#d4dae6'

export const TarotCardMesh = forwardRef(function TarotCardMesh(
  {
    frontTexture,
    backTexture,
    position,
    rotation,
    faceDown = true,
    cardIndex = 0,
    isHovered = false,
    isSelected = false,
    setFlipGroupRef,
    showRevealRing = false,
    revealProgressRef,
    visible = true,
    /** 仅显示牌背（两面都用牌背图，抽牌/洗牌时看不到牌面） */
    backsOnly = false,
  },
  ref,
) {
  const materials = useMemo(() => {
    const edgeBase = {
      color: '#1a1528',
      roughness: 0.85,
      metalness: isSelected ? 0.35 : isHovered ? 0.22 : 0.05,
    }
    const edge = new THREE.MeshStandardMaterial({
      ...edgeBase,
      emissive: isSelected ? GOLD : isHovered ? SILVER : '#000000',
      emissiveIntensity: isSelected ? 0.45 : isHovered ? 0.22 : 0,
    })
    const faceMap = backsOnly ? backTexture : frontTexture
    const frontMat = new THREE.MeshStandardMaterial({
      map: faceMap,
      roughness: isHovered || isSelected ? 0.32 : 0.45,
      metalness: isSelected ? 0.35 : isHovered ? 0.22 : 0.12,
      emissive: isSelected ? GOLD : isHovered ? SILVER : '#000000',
      emissiveIntensity: isSelected ? 0.28 : isHovered ? 0.12 : 0,
    })
    const backMat = new THREE.MeshStandardMaterial({
      map: backTexture,
      roughness: 0.55,
      metalness: isSelected ? 0.4 : isHovered ? 0.28 : 0.18,
      emissive: isSelected ? GOLD : isHovered ? SILVER : '#000000',
      emissiveIntensity: isSelected ? 0.35 : isHovered ? 0.15 : 0,
    })
    const mats = [edge, edge, edge, edge, frontMat, backMat]
    if (faceDown) {
      mats[4] = backMat
      mats[5] = frontMat
    }
    return mats
  }, [frontTexture, backTexture, backsOnly, faceDown, isHovered, isSelected])

  return (
    <group position={position} rotation={rotation} visible={visible}>
      <group ref={setFlipGroupRef}>
        <mesh
          ref={ref}
          castShadow
          receiveShadow
          material={materials}
          userData={{ cardIndex }}
        >
          <boxGeometry args={[W, H, D]} />
        </mesh>
        {showRevealRing && revealProgressRef ? (
          <RevealRing progressRef={revealProgressRef} />
        ) : null}
      </group>
    </group>
  )
})
