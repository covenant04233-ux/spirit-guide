import { useFrame } from '@react-three/fiber'
import { useMemo, useRef } from 'react'
import * as THREE from 'three'

const INNER = 0.19
const OUTER = 0.245
const SEG = 72

/** Arc progress ring in card local space (XY), slightly in front of mesh. */
export function RevealRing({ progressRef }) {
  const fgMesh = useRef(null)
  const lastSnap = useRef(-1)

  const bgGeo = useMemo(
    () => new THREE.RingGeometry(INNER, OUTER, SEG, 1, 0, Math.PI * 2),
    [],
  )

  const initFg = useMemo(
    () => new THREE.RingGeometry(INNER, OUTER, SEG, 1, -Math.PI / 2, 0.02),
    [],
  )

  useFrame(() => {
    const p = Math.min(1, Math.max(0, progressRef.current))
    const snap = Math.round(p * 100)
    if (snap === lastSnap.current && p < 0.995) return
    lastSnap.current = snap

    const theta = p * Math.PI * 2
    const g = fgMesh.current
    if (!g) return
    g.geometry.dispose()
    g.geometry = new THREE.RingGeometry(INNER, OUTER, SEG, 1, -Math.PI / 2, theta)
  })

  return (
    <group position={[0, 0, 0.024]}>
      <mesh geometry={bgGeo} renderOrder={2}>
        <meshBasicMaterial
          color="#2a2618"
          transparent
          opacity={0.55}
          depthWrite={false}
          side={THREE.DoubleSide}
        />
      </mesh>
      <mesh ref={fgMesh} geometry={initFg} renderOrder={3}>
        <meshBasicMaterial
          color="#f5e0a8"
          transparent
          opacity={0.95}
          depthWrite={false}
          side={THREE.DoubleSide}
        />
      </mesh>
    </group>
  )
}
