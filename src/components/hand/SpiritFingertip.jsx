import { useMemo, useRef } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import { Plane, Raycaster, Vector2, Vector3 } from 'three'
import { useHandTracking } from '../../context/HandTrackingContext'
import { SPIRIT_PLANE_Y } from '../tarot/sceneLayout'

export function SpiritFingertip() {
  const { trackingRef } = useHandTracking()
  const group = useRef(null)
  const hasLock = useRef(false)
  const { camera } = useThree()
  const raycaster = useMemo(() => new Raycaster(), [])
  const plane = useMemo(
    () => new Plane(new Vector3(0, 1, 0), -SPIRIT_PLANE_Y),
    [],
  )
  const ndc = useMemo(() => new Vector2(), [])
  const hit = useMemo(() => new Vector3(), [])

  useFrame(() => {
    const g = group.current
    if (!g) return

    const { ndcX, ndcY, visible } = trackingRef.current
    if (!visible) {
      g.visible = false
      hasLock.current = false
      return
    }

    g.visible = true
    ndc.set(ndcX, ndcY)
    raycaster.setFromCamera(ndc, camera)
    if (!raycaster.ray.intersectPlane(plane, hit)) return

    if (!hasLock.current) {
      g.position.copy(hit)
      hasLock.current = true
    } else {
      g.position.lerp(hit, 0.28)
    }
  })

  return (
    <group ref={group} visible={false}>
      <mesh>
        <sphereGeometry args={[0.065, 24, 24]} />
        <meshStandardMaterial
          color="#f3ead4"
          emissive="#c9a85c"
          emissiveIntensity={0.55}
          metalness={0.65}
          roughness={0.28}
          transparent
          opacity={0.94}
        />
      </mesh>
      <mesh scale={0.42}>
        <sphereGeometry args={[0.065, 16, 16]} />
        <meshStandardMaterial
          color="#eef1f6"
          emissive="#cfd6e6"
          emissiveIntensity={0.35}
          metalness={0.9}
          roughness={0.18}
          transparent
          opacity={0.55}
        />
      </mesh>
      <pointLight distance={2.4} intensity={0.55} color="#f5e8c8" />
      <pointLight distance={1.6} intensity={0.35} color="#e2e8f0" />
    </group>
  )
}
